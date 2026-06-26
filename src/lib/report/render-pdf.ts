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

// Generous: networkidle2 must wait for all report images to load (up to ~100).
const NAVIGATION_TIMEOUT_MS = 60_000;

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
    // Skýrslan er að fullu server-rendruð, óvirk prentsíða. Slökkvum á JS svo
    // React hydrati ALDREI — þá getur óbanvæn client-villa (t.d. síða sem skilar
    // 500) ekki skipt skýrslunni út fyrir error-boundary, og PDF verður
    // fyrirsjáanlegt. page.$ / emulateMediaType / pdf keyra öll yfir CDP án
    // síðu-JS. networkidle2 bíður eftir að myndir hlaðist (í stað JS-settla).
    await page.setJavaScriptEnabled(false);
    if (opts.extraHeaders) await page.setExtraHTTPHeaders(opts.extraHeaders);
    if (opts.cookies && opts.cookies.length > 0) await page.setCookie(...opts.cookies);

    const response = await page.goto(reportUrl, {
      waitUntil: "networkidle2",
      timeout: opts.navigationTimeoutMs ?? NAVIGATION_TIMEOUT_MS,
    });

    const hasReport = (await page.$(".report-article")) !== null;
    if (!hasReport) {
      // Diagnostic: what did puppeteer actually load?
      const status = response?.status();
      const finalUrl = page.url();
      const title = await page.title().catch(() => "");
      const body = (await page.content().catch(() => "")).replace(/\s+/g, " ").slice(0, 240);
      throw new ReportNotRenderedError(
        `.report-article fannst ekki [status=${status} url=${finalUrl} title="${title}" body=${body}]`
      );
    }

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
