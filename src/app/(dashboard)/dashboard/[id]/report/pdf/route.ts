import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/allowed-users";
import {
  createBearerClient,
  getBearerAuthorization,
} from "@/lib/supabase/bearer";

// PDF-gerð keyrir á server (puppeteer-core + @sparticuz/chromium) til að fá
// áreiðanlegar spássíur, raunverulegar blaðsíðunúmer og fyrirsjáanlega myndun —
// óháð prentglugga Chrome hjá notanda.
//
// SPÁSSÍU-SKEMA (mikilvægt — sjá líka athugasemd í report/page.tsx):
//   page.pdf() leggur til ALLAR fjórar spássíurnar (top/bottom/left/right).
//   Til að tvöfalda ekki 25,4mm hliðarspássíuna fjarlægir report-síðan láréttu
//   (og minnkar lóðréttu) section-padding-ið ÞEGAR hún er birt í gegnum þessa
//   leið — það er gefið til kynna með ?pdf=1 á URL-inu sem við siglum á.
//   window.print() (varaleiðin) heldur áfram að nota innbyggðu padding-spássíurnar.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NAVIGATION_TIMEOUT_MS = 30_000;
const IMAGE_SETTLE_TIMEOUT_MS = 18_000;

// Hreinsar streng í öruggt skráarnafn (ASCII, undirstrik í stað bila/tákna).
function safeFilenamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Hýslar sem mega vera grunnur fyrir self-navigation (puppeteer). Aðeins þessir
// koma til greina út frá forwarded-host svo spoofaður x-forwarded-host geti ekki
// beint okkur á annað origin (SSRF-vörn). Annars föllum við á origin beiðninnar.
const ALLOWED_PDF_HOSTS = ["admin.beton.is", "beton.is"];

// Finnur grunn-URL deploymentsins svo puppeteer siglir á SAMA deployment og
// beiðnin kom frá (cookie-lén verður að passa). Treystum forwarded-host aðeins
// ef hann er á leyfilista (eða *.vercel.app); annars notum origin beiðninnar.
function getBaseUrl(request: NextRequest): string {
  const reqOrigin = new URL(request.url).origin;
  const fwdHost = request.headers.get("x-forwarded-host");
  if (fwdHost && (ALLOWED_PDF_HOSTS.includes(fwdHost) || fwdHost.endsWith(".vercel.app"))) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${fwdHost}`;
  }
  return reqOrigin;
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  // 1) Staðfesta að beiðandinn sé innskráður og á leyfðum lista ÁÐUR en við
  //    ræsum dýra chromium-ferlið.
  //
  //    Admin notar Supabase cookies + allowlist eins og áður. Mobile appið
  //    sendir hins vegar Supabase access token í Authorization header; þá látum
  //    RLS staðfesta eignarhald skoðunarinnar og krefjumst ekki admin allowlist.
  const bearerAuthorization = getBearerAuthorization(
    request.headers.get("authorization")
  );
  const supabase = bearerAuthorization
    ? createBearerClient(bearerAuthorization)
    : await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Óheimill aðgangur" }, { status: 401 });
  }

  if (!bearerAuthorization && !isAllowedEmail(user.email)) {
    return NextResponse.json({ error: "Óheimill aðgangur" }, { status: 401 });
  }

  // 2) Sækja lágmarksupplýsingar fyrir skráarnafn (og staðfesta tilvist).
  let inspectionQuery = supabase
    .from("inspections")
    .select("id, address, inspection_date, ai_report_data")
    .limit(1);

  inspectionQuery = bearerAuthorization
    ? inspectionQuery.or(`id.eq.${id},local_id.eq.${id}`)
    : inspectionQuery.eq("id", id);

  const { data: inspection } = await inspectionQuery.maybeSingle();

  if (!inspection?.ai_report_data) {
    return NextResponse.json({ error: "Skýrsla fannst ekki" }, { status: 404 });
  }

  const baseUrl = getBaseUrl(request);
  // ?pdf=1 segir report-síðunni að sleppa láréttu/minnka lóðréttu padding-i,
  // því puppeteer leggur til spássíurnar (sjá margin hér að neðan).
  const reportUrl = `${baseUrl}/dashboard/${inspection.id}/report?pdf=1`;

  // 3) Ræsa chromium. Tvær leiðir:
  //    - PUPPETEER_EXECUTABLE_PATH sett (Docker/Dokploy: /usr/bin/chromium úr apt;
  //      eða þróun: staðbær Chrome) → notum það BEINT. Forðumst @sparticuz
  //      extraction (tar-fs) sem rekst EKKI inn í pnpm standalone output.
  //    - Annars (Vercel/serverless) → @sparticuz/chromium binaríið.
  const distroChromium = process.env.PUPPETEER_EXECUTABLE_PATH;

  // Dýnamískur import svo pakkarnir lendi aldrei í client/edge-bundle.
  const puppeteer = (await import("puppeteer-core")).default;

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    let executablePath: string | undefined;
    let launchArgs: string[];
    if (distroChromium) {
      executablePath = distroChromium;
      launchArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ];
    } else {
      const chromium = (await import("@sparticuz/chromium")).default;
      executablePath = await chromium.executablePath();
      launchArgs = chromium.args;
    }

    if (!executablePath) {
      return NextResponse.json(
        {
          error:
            "Chromium fannst ekki. Settu PUPPETEER_EXECUTABLE_PATH (Docker/þróun) eða notaðu @sparticuz/chromium (Vercel).",
        },
        { status: 500 }
      );
    }

    browser = await puppeteer.launch({
      args: launchArgs,
      defaultViewport: { width: 1000, height: 1414, deviceScaleFactor: 1 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    if (bearerAuthorization) {
      await page.setExtraHTTPHeaders({ Authorization: bearerAuthorization });
    }

    // 4) Afrita AUTH cookies beiðninnar yfir á puppeteer-síðuna svo hún komist
    //    inn á auth-læstu skýrsluna (Supabase RLS les sb-*-auth-token; einnig
    //    beton-auth site-cookie). Afritum ÖLL cookies á réttu léni til öryggis,
    //    því Supabase getur klofið token í .0/.1 og nöfn fara eftir project-ref.
    const { hostname } = new URL(baseUrl);
    const cookiesToSet = request.cookies.getAll().map((c) => ({
      name: c.name,
      value: c.value,
      domain: hostname,
      path: "/",
      httpOnly: false,
      secure: baseUrl.startsWith("https"),
      sameSite: "Lax" as const,
    }));
    if (cookiesToSet.length > 0) {
      await page.setCookie(...cookiesToSet);
    }

    // 5) Sigla á skýrsluna og bíða eftir að netið róist (myndir hlaðast).
    await page.goto(reportUrl, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    // Tryggja að myndir fái sanngjarna stund til að hlaðast áður en við
    // prentum. Með stórar skýrslur (t.d. 100 myndir) má þetta ekki bíða
    // endalaust, annars hittum við Vercel function timeout áður en PDF skilar sér.
    await page.evaluate(async (timeoutMs) => {
      const imgs = Array.from(document.images);
      await Promise.all(
        imgs.map((img) => {
          if (img.complete && img.naturalHeight > 0) return Promise.resolve();
          return Promise.race([
            new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            }),
            new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
          ]);
        })
      );
    }, IMAGE_SETTLE_TIMEOUT_MS);

    // 5b) Verja gegn ÞÖGLU auðu PDF: ef auth-veggur (t.d. Vercel Deployment
    //     Protection) eða villa skilaði ekki skýrslunni þá vantar .report-article.
    //     Betra að skila skýrri villu en blönku/rusl-PDF.
    const hasReport = await page.evaluate(
      () => !!document.querySelector(".report-article")
    );
    if (!hasReport) {
      return NextResponse.json(
        {
          error:
            "Skýrslusíðan hlóðst ekki rétt (hugsanlega auth-veggur eða óbirt skýrsla). PDF ekki búið til.",
        },
        { status: 502 }
      );
    }

    // 6) NAUÐSYNLEGT: emulera 'print' media. Öll skýrslu-stílun (síðuskipti,
    //    spássíu-padding, falin nav, ?pdf=1 reglurnar) lifir undir @media print.
    //    Án þessa myndi page.pdf() teikna skjá-útgáfuna (nav sýnileg, engin
    //    síðuskipti). Verður að kalla á undan page.pdf().
    await page.emulateMediaType("print");

    // 7) Búa til PDF. page.pdf leggur til spássíur OG blaðsíðunúmer; í ?pdf=1
    //    sleppir report-síðan @page margin:0 svo þessar spássíur haldist.
    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      margin: {
        top: "18mm",
        bottom: "16mm",
        left: "25.4mm",
        right: "25.4mm",
      },
      headerTemplate: "<div></div>",
      footerTemplate:
        '<div style="width:100%;text-align:center;font-size:8px;color:#8a8278;font-family:Helvetica,Arial,sans-serif;">' +
        'Bls. <span class="pageNumber"></span> / <span class="totalPages"></span>' +
        "</div>",
    });

    const safeAddress = safeFilenamePart(inspection.address ?? "skyrsla");
    const fileName = `Astandsskodun_${safeAddress}_${inspection.inspection_date}.pdf`;

    // Buffer -> Uint8Array fyrir Response body.
    const body = new Uint8Array(pdfBytes);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(
          fileName
        )}`,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Villa kom upp við gerð PDF." },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
