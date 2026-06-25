// Shared report → PDF rendering. Used by the background report-worker tick
// endpoint (/api/report/worker/tick). Next-agnostic on purpose (no next/*
// imports) so it can be reused outside a request if needed.
//
// Launches Chromium (distro via PUPPETEER_EXECUTABLE_PATH on Docker/beton.is,
// else @sparticuz on serverless), navigates to the report HTML, waits for
// photos to settle, then prints A4 with the same margins + page-number footer
// the on-demand route used. Throws ReportNotRenderedError if the report markup
// never appeared (auth wall / unpublished) so the caller fails the job loudly
// instead of storing a blank PDF.

const NAVIGATION_TIMEOUT_MS = 30_000;
const IMAGE_SETTLE_TIMEOUT_MS = 18_000;

export class ReportNotRenderedError extends Error {
  constructor(message = "Skýrslusíðan hlóðst ekki (.report-article fannst ekki).") {
    super(message);
    this.name = "ReportNotRenderedError";
  }
}

type PuppeteerCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax" | "Strict" | "None";
};

export interface RenderReportPdfOptions {
  extraHeaders?: Record<string, string>;
  cookies?: PuppeteerCookie[];
  navigationTimeoutMs?: number;
  imageSettleTimeoutMs?: number;
}

export async function renderReportPdf(
  reportUrl: string,
  opts: RenderReportPdfOptions = {}
): Promise<Uint8Array> {
  const distroChromium = process.env.PUPPETEER_EXECUTABLE_PATH;
  const puppeteer = (await import("puppeteer-core")).default;

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    let executablePath: string | undefined;
    let launchArgs: string[];
    if (distroChromium) {
      executablePath = distroChromium;
      launchArgs = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
    } else {
      const chromium = (await import("@sparticuz/chromium")).default;
      executablePath = await chromium.executablePath();
      launchArgs = chromium.args;
    }
    if (!executablePath) {
      throw new Error("Chromium fannst ekki (settu PUPPETEER_EXECUTABLE_PATH eða @sparticuz).");
    }

    browser = await puppeteer.launch({
      args: launchArgs,
      defaultViewport: { width: 1000, height: 1414, deviceScaleFactor: 1 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    if (opts.extraHeaders) await page.setExtraHTTPHeaders(opts.extraHeaders);
    if (opts.cookies && opts.cookies.length > 0) await page.setCookie(...opts.cookies);

    await page.goto(reportUrl, {
      waitUntil: "domcontentloaded",
      timeout: opts.navigationTimeoutMs ?? NAVIGATION_TIMEOUT_MS,
    });

    // Gefa myndum sanngjarna stund til að hlaðast — en ekki endalaust (stórar
    // skýrslur ~100 myndir).
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
    }, opts.imageSettleTimeoutMs ?? IMAGE_SETTLE_TIMEOUT_MS);

    const hasReport = await page.evaluate(() => !!document.querySelector(".report-article"));
    if (!hasReport) throw new ReportNotRenderedError();

    // NAUÐSYNLEGT: öll síðuskipti/spássíu-stílun lifir undir @media print.
    await page.emulateMediaType("print");

    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      margin: { top: "18mm", bottom: "16mm", left: "25.4mm", right: "25.4mm" },
      headerTemplate: "<div></div>",
      footerTemplate:
        '<div style="width:100%;text-align:center;font-size:8px;color:#8a8278;font-family:Helvetica,Arial,sans-serif;">' +
        'Bls. <span class="pageNumber"></span> / <span class="totalPages"></span>' +
        "</div>",
    });

    return new Uint8Array(pdfBytes);
  } finally {
    if (browser) await browser.close();
  }
}
