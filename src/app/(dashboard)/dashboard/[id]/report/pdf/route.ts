import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/allowed-users";

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
  //    ræsum dýra chromium-ferlið. createClient() les sömu cookies og síðan.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedEmail(user.email)) {
    return NextResponse.json({ error: "Óheimill aðgangur" }, { status: 401 });
  }

  // 2) Sækja lágmarksupplýsingar fyrir skráarnafn (og staðfesta tilvist).
  const { data: inspection } = await supabase
    .from("inspections")
    .select("address, inspection_date, ai_report_data")
    .eq("id", id)
    .maybeSingle();

  if (!inspection?.ai_report_data) {
    return NextResponse.json({ error: "Skýrsla fannst ekki" }, { status: 404 });
  }

  const baseUrl = getBaseUrl(request);
  // ?pdf=1 segir report-síðunni að sleppa láréttu/minnka lóðréttu padding-i,
  // því puppeteer leggur til spássíurnar (sjá margin hér að neðan).
  const reportUrl = `${baseUrl}/dashboard/${id}/report?pdf=1`;

  // 3) Ræsa chromium. Á serverless (Vercel)/Docker notum við @sparticuz/chromium.
  //    Í þróun (staðbær Chrome til) má nota PUPPETEER_EXECUTABLE_PATH.
  const isLocal = process.env.NODE_ENV !== "production" && !process.env.VERCEL;

  // Dýnamískur import svo pakkarnir lendi aldrei í client/edge-bundle.
  const puppeteer = (await import("puppeteer-core")).default;
  const chromium = (await import("@sparticuz/chromium")).default;

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    const executablePath = isLocal
      ? process.env.PUPPETEER_EXECUTABLE_PATH || undefined
      : await chromium.executablePath();

    if (!executablePath) {
      return NextResponse.json(
        {
          error:
            "Chromium fannst ekki. Settu PUPPETEER_EXECUTABLE_PATH í þróun eða notaðu @sparticuz/chromium í framleiðslu.",
        },
        { status: 500 }
      );
    }

    browser = await puppeteer.launch({
      args: isLocal
        ? ["--no-sandbox", "--disable-setuid-sandbox"]
        : chromium.args,
      defaultViewport: { width: 1240, height: 1754, deviceScaleFactor: 2 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

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
      waitUntil: "networkidle0",
      timeout: 45_000,
    });

    // Tryggja að allar <img> séu raunverulega komnar (decode) áður en við
    // prentum — networkidle0 dugar yfirleitt en þetta er belti-og-axlabönd.
    await page.evaluate(async () => {
      const imgs = Array.from(document.images);
      await Promise.all(
        imgs.map((img) =>
          img.complete && img.naturalHeight > 0
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener("load", () => resolve(), { once: true });
                img.addEventListener("error", () => resolve(), { once: true });
              })
        )
      );
    });

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

    // 7) Búa til PDF. page.pdf leggur til spássíur OG blaðsíðunúmer; @page CSS
    //    á report-síðunni er margin:0 svo þær tvöfaldast ekki.
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
