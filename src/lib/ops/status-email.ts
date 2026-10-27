import { BRANDS } from "@/lib/brand";
import { format, stadaCopy } from "@/lib/i18n/stada";
import {
  APP_STORE_CONNECT_ANALYTICS_URL,
  BOUNCE_MIN_SAMPLE,
  computeAlerts,
  countryName,
  enrichmentPct,
  estimatedAiCostUsd,
  funnelFor,
  hookComparison,
  pct,
  totalCountry,
  type GrowthSnapshot,
} from "@/lib/ops/growth";
import { alertMessage, fmtDelta, fmtInt, fmtPct, fmtShortDate, fmtStamp, fmtUsd } from "@/lib/ops/growth-text";

// Daglegi stöðupósturinn: SAMA snapshot og stöðusíðan (growth.ts), sem tölvupóstvænt HTML —
// töflur, innlínu-stílar, súlur úr litum frumum, engar myndir né JS. Alltaf á íslensku (til Hjalta).
// Litir eru harðkóðaðir hér (póstur getur ekki lesið CSS-tákn); þeir eru Rondva-gildin úr DESIGN.md §1.
// Gmail dökkt: allir fletir og texti hafa skýra liti (Gmail snýr þeim sjálft); Apple Mail fær
// @media (prefers-color-scheme: dark) hnekkingar í <style> með flokkunum em-*.

const INK = "#101418";
const MUTED = "#5a6672";
const LINE = "#e2e6eb";
const BLUE = "#1b4fd8";
const GREY_BAR = "#838c96";
const PAGE_BG = "#fafbfc";
const CARD = "#ffffff";
const FONT = "Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const TONE = {
  danger: { bg: "#f7e9e9", fg: "#a32020", label: "ALVARLEGT" },
  warn: { bg: "#f6efe3", fg: "#7a5512", label: "ATHUGA" },
  success: { bg: "#ecfdf5", fg: "#047857", label: "ALLT Í LAGI" },
} as const;

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const STATUS_PAGE_URL = `${BRANDS.rondva.appUrl}/dashboard/stada`;

const t = stadaCopy("is");
const L = "is" as const;

function card(title: string, body: string, subtitle?: string): string {
  return `
<tr><td style="padding:0 0 14px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-card" style="background:${CARD};border:1px solid ${LINE};border-radius:12px;">
    <tr><td style="padding:18px 20px 20px 20px;font-family:${FONT};color:${INK};" class="em-ink">
      <div style="font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};" class="em-muted">${esc(title)}</div>
      ${subtitle ? `<div style="margin-top:3px;font-size:13px;line-height:18px;color:${MUTED};" class="em-muted">${esc(subtitle)}</div>` : ""}
      <div style="margin-top:12px;">${body}</div>
    </td></tr>
  </table>
</td></tr>`;
}

function kpiCell(side: "l" | "r", label: string, value: string, subline: string, delta?: { text: string; dir: "up" | "down" | "flat" }): string {
  return `
<td width="50%" valign="top" style="padding:${side === "l" ? "0 7px 14px 0" : "0 0 14px 7px"};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-card" style="background:${CARD};border:1px solid ${LINE};border-radius:12px;">
    <tr><td style="padding:14px 16px;font-family:${FONT};" class="em-ink">
      <div style="font-size:12px;line-height:16px;font-weight:600;color:${MUTED};" class="em-muted">${esc(label)}</div>
      <div style="margin-top:2px;font-size:28px;line-height:34px;font-weight:700;color:${INK};" class="em-ink">${esc(value)}</div>
      <div style="margin-top:2px;font-size:12px;line-height:16px;color:${MUTED};" class="em-muted">${esc(subline)}</div>
      ${delta ? `<div style="margin-top:2px;font-size:12px;line-height:16px;font-weight:600;color:${delta.dir === "up" ? "#047857" : MUTED};">${esc(delta.text)}</div>` : ""}
    </td></tr>
  </table>
</td>`;
}

/** Lárétt súla úr tveimur frumum: fyllt hlutfall + afgangur (breidd í %). */
function hbar(fraction: number, color: string, height = 8): string {
  const w = Math.max(0, Math.min(100, fraction * 100));
  const fill = w > 0 ? Math.max(w, 2) : 0;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-track" style="background:${LINE};border-radius:${height}px;"><tr>
    ${fill > 0 ? `<td width="${fill.toFixed(1)}%" height="${height}" bgcolor="${color}" class="em-bar" style="background:${color};border-radius:${height}px;font-size:0;line-height:0;height:${height}px;">&nbsp;</td>` : ""}
    <td height="${height}" style="font-size:0;line-height:0;height:${height}px;">&nbsp;</td></tr></table>`;
}

/** Lóðréttar súlur (hver dálkur ein fruma). segments: neðsta fyrst. */
function vbars(cols: { segments: { value: number; color: string }[] }[], maxPx = 72): string {
  const totals = cols.map((c) => c.segments.reduce((a, s) => a + s.value, 0));
  const max = Math.max(1, ...totals);
  const cells = cols
    .map((c) => {
      const parts = c.segments
        .filter((s) => s.value > 0)
        .reverse() // efsti hluti fyrst í HTML
        .map((s) => {
          const h = Math.max(2, Math.round((s.value / max) * maxPx));
          return `<div style="height:${h}px;background:${s.color};font-size:0;line-height:0;">&nbsp;</div>`;
        })
        .join("");
      return `<td valign="bottom" style="padding:0 1px;height:${maxPx}px;">${parts}</td>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid ${LINE};table-layout:fixed;"><tr>${cells}</tr></table>`;
}

function axis(left: string, mid: string | null, right: string, max: number): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;"><tr>
    <td align="left" style="font-family:${FONT};font-size:11px;color:${MUTED};" class="em-muted">${esc(left)}</td>
    ${mid ? `<td align="center" style="font-family:${FONT};font-size:11px;color:${MUTED};" class="em-muted">${esc(mid)}</td>` : ""}
    <td align="right" style="font-family:${FONT};font-size:11px;color:${MUTED};" class="em-muted">${esc(right)}</td></tr></table>
    <div style="margin-top:2px;font-family:${FONT};font-size:11px;color:${MUTED};" class="em-muted">hámark ${fmtInt(max, L)}</div>`;
}

export interface StatusEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderStatusEmail(s: GrowthSnapshot): StatusEmail {
  const k = s.kpi;
  const alerts = computeAlerts(s);
  const dateLabel = fmtShortDate(s.generated_at.slice(0, 10), L);
  const delta = (cur: number, prev: number, money = false) => {
    const d = fmtDelta(cur, prev, L, money);
    return { dir: d.dir, text: format(t.kpi.vsPrev, { delta: d.text }) };
  };

  // Viðvaranir
  const alertsHtml =
    alerts.length === 0
      ? `<span class="em-alert-ok" style="display:inline-block;padding:4px 10px;border-radius:999px;background:${TONE.success.bg};color:${TONE.success.fg};font-size:12px;font-weight:700;">&#9679; ${TONE.success.label}</span> <span style="font-size:13px;color:${MUTED};" class="em-muted">${esc(t.alerts.allClear)}</span>`
      : alerts
          .map((a) => {
            const tone = TONE[a.severity];
            return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:6px;"><tr>
              <td class="em-alert-${a.severity}" style="padding:9px 12px;border-radius:8px;background:${tone.bg};color:${tone.fg};font-size:13px;line-height:18px;"><strong>${tone.label}</strong> &nbsp;${esc(alertMessage(t.alerts, a, L))}</td></tr></table>`;
          })
          .join("");

  // KPI
  const kpiRows = `
<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>${kpiCell("l", t.kpi.revenue, fmtUsd(k.revenue_usd_7d, L), format(t.kpi.revenueSub, { total: fmtUsd(k.revenue_usd_total, L) }), delta(k.revenue_usd_7d, k.revenue_usd_prev_7d, true))}
      ${kpiCell("r", t.kpi.paying, fmtInt(k.paying_companies, L), format(t.kpi.payingSub, { subs: fmtInt(k.active_subscriptions, L), packs: fmtInt(k.pack_purchases, L) }))}</tr>
  <tr>${kpiCell("l", t.kpi.trials, fmtInt(k.active_trials, L), format(t.kpi.trialsSub, { started: fmtInt(k.trials_started_7d, L) }))}
      ${kpiCell("r", t.kpi.signups, fmtInt(k.signups_7d, L), format(t.kpi.signupsSub, { total: fmtInt(k.customers, L) }), delta(k.signups_7d, k.signups_prev_7d))}</tr>
  <tr>${kpiCell("l", t.kpi.reports, fmtInt(k.ai_reports_7d, L), format(t.kpi.reportsSub, { total: fmtInt(k.ai_reports_total, L) }), delta(k.ai_reports_7d, k.ai_reports_prev_7d))}
      ${kpiCell("r", "Póstar sendir 7 d.", fmtInt(s.outreach.sent_7d, L), `${fmtInt(s.outreach.sent_24h, L)} síðasta sólarhring`)}</tr>
</table></td></tr>
<tr><td style="padding:0 0 14px 0;font-family:${FONT};font-size:11px;line-height:15px;color:${MUTED};" class="em-muted">${esc(t.kpi.revenueNote)}</td></tr>`;

  // Frásögn
  const narrativeHtml = s.narrative
    ? card(
        t.narrative.title,
        s.narrative.text
          .split(/\n{2,}/)
          .filter((p) => p.trim())
          .map((p) => `<p style="margin:0 0 8px 0;font-size:14px;line-height:21px;color:${INK};white-space:pre-line;" class="em-ink">${esc(p.trim())}</p>`)
          .join(""),
        format(t.narrative.from, { time: fmtStamp(s.narrative.created_at) })
      )
    : "";

  // Trekt: samtals sem súlur, lönd sem tafla
  const total = totalCountry(s.countries);
  const stageLabel = { leads: t.funnel.leads, emailed: t.funnel.emailed, replied: t.funnel.replied, signed_up: t.funnel.signedUp, trial: t.funnel.trial, paid: t.funnel.paid };
  const stages = funnelFor(total);
  const base = Math.max(total.leads_total, 1);
  const totalBars = stages
    .map((st, i) => {
      const prev = i === 0 ? null : stages[i - 1].count;
      const conv = prev && prev > 0 && st.key !== "signed_up" ? fmtPct(pct(st.count, prev), L, 0) : "";
      return `<tr>
        <td width="26%" style="padding:3px 0;font-family:${FONT};font-size:13px;color:${MUTED};" class="em-muted">${esc(stageLabel[st.key])}</td>
        <td style="padding:3px 8px;">${hbar(st.count / base, BLUE)}</td>
        <td width="22%" align="right" style="padding:3px 0;font-family:${FONT};font-size:13px;color:${INK};white-space:nowrap;" class="em-ink"><strong>${fmtInt(st.count, L)}</strong> <span style="color:${MUTED};font-size:11px;" class="em-muted">${conv}</span></td></tr>`;
    })
    .join("");
  const th = (txt: string, align = "right") => `<th align="${align}" style="padding:6px 4px;font-family:${FONT};font-size:11px;font-weight:600;color:${MUTED};border-bottom:1px solid ${LINE};white-space:nowrap;" class="em-muted">${esc(txt)}</th>`;
  const td = (txt: string, strong = false, align = "right") => `<td align="${align}" style="padding:6px 4px;font-family:${FONT};font-size:13px;color:${INK};border-bottom:1px solid ${LINE};${strong ? "font-weight:700;" : ""}" class="em-ink">${txt}</td>`;
  const countryRows = s.countries
    .map((c) => {
      const f = funnelFor(c);
      return `<tr>${td(esc(countryName(c.cc, L)), false, "left")}${f.map((x) => td(x.count === 0 ? `<span style="color:${MUTED};" class="em-muted">0</span>` : fmtInt(x.count, L), x.count > 0 && (x.key === "signed_up" || x.key === "trial" || x.key === "paid"))).join("")}</tr>`;
    })
    .join("");
  const funnelHtml = card(
    t.funnel.title,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${totalBars}</table>
     <div style="height:12px;line-height:12px;font-size:0;">&nbsp;</div>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
       <tr>${th("Land", "left")}${th(t.funnel.leads)}${th("Sendir")}${th("Svör")}${th("Skráðir")}${th("Prufa")}${th("Greitt")}</tr>
       ${countryRows}
     </table>`,
    t.funnel.hint
  );

  // Sendingar á dag
  const sendCols = s.sends_daily.map((d) => ({ segments: [{ value: d.total, color: BLUE }] }));
  const sends30 = s.sends_daily.reduce((a, d) => a + d.total, 0);
  const sendMax = Math.max(0, ...s.sends_daily.map((d) => d.total));
  const hook = hookComparison(s.outreach);
  const replyRate = pct(s.outreach.replied, s.outreach.contacted);
  const bounceRate = pct(s.outreach.bounced, s.outreach.contacted);
  const small = s.outreach.contacted < BOUNCE_MIN_SAMPLE ? ` ${format(t.sends.sampleSmall, { min: BOUNCE_MIN_SAMPLE })}` : "";
  const sendsHtml = card(
    t.sends.title,
    `${vbars(sendCols)}
     ${s.sends_daily.length ? axis(fmtShortDate(s.sends_daily[0].date, L), fmtShortDate(s.sends_daily[Math.floor(s.sends_daily.length / 2)].date, L), fmtShortDate(s.sends_daily[s.sends_daily.length - 1].date, L), sendMax) : ""}
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;"><tr>
       <td width="50%" valign="top" style="font-family:${FONT};font-size:12px;color:${MUTED};" class="em-muted">${esc(t.sends.replyRate)}<br><span style="font-size:20px;font-weight:700;color:${INK};" class="em-ink">${fmtPct(replyRate, L)}</span> <span style="font-size:11px;">${fmtInt(s.outreach.replied, L)}/${fmtInt(s.outreach.contacted, L)}</span></td>
       <td width="50%" valign="top" style="font-family:${FONT};font-size:12px;color:${MUTED};" class="em-muted">${esc(t.sends.bounceRate)}<br><span style="font-size:20px;font-weight:700;color:${INK};" class="em-ink">${fmtPct(bounceRate, L)}</span> <span style="font-size:11px;">${esc(t.sends.bounceLimit)}${esc(small)}</span></td>
     </tr></table>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;border-top:1px solid ${LINE};"><tr>
       <td colspan="2" style="padding-top:10px;font-family:${FONT};font-size:12px;color:${MUTED};" class="em-muted">${esc(t.sends.hookTitle)}</td></tr><tr>
       <td width="50%" valign="top" style="font-family:${FONT};font-size:12px;color:${MUTED};" class="em-muted">${esc(t.sends.withHook)}<br><span style="font-size:18px;font-weight:700;color:${INK};" class="em-ink">${fmtPct(hook.withHook.rate, L)}</span> <span style="font-size:11px;">${fmtInt(hook.withHook.replied, L)}/${fmtInt(hook.withHook.contacted, L)}</span></td>
       <td width="50%" valign="top" style="font-family:${FONT};font-size:12px;color:${MUTED};" class="em-muted">${esc(t.sends.withoutHook)}<br><span style="font-size:18px;font-weight:700;color:${INK};" class="em-ink">${fmtPct(hook.withoutHook.rate, L)}</span> <span style="font-size:11px;">${fmtInt(hook.withoutHook.replied, L)}/${fmtInt(hook.withoutHook.contacted, L)}</span></td>
     </tr></table>`,
    format(t.sends.sub, { total: fmtInt(sends30, L), week: fmtInt(s.outreach.sent_7d, L) })
  );

  // Skýrslur á viku
  const weekCols = s.reports_weekly.map((w) => ({
    segments: [
      { value: w.customer, color: BLUE },
      { value: w.internal, color: GREY_BAR },
    ],
  }));
  const weekMax = Math.max(0, ...s.reports_weekly.map((w) => w.customer + w.internal));
  const reportsHtml = card(
    t.reports.title,
    `${vbars(weekCols, 64)}
     ${s.reports_weekly.length ? axis(fmtShortDate(s.reports_weekly[0].week, L), null, fmtShortDate(s.reports_weekly[s.reports_weekly.length - 1].week, L), weekMax) : ""}
     <div style="margin-top:8px;font-family:${FONT};font-size:12px;color:${MUTED};" class="em-muted">
       <span style="color:${BLUE};">&#9632;</span> ${esc(t.reports.customer)} &nbsp; <span style="color:${GREY_BAR};">&#9632;</span> ${esc(t.reports.internal)}</div>
     <div style="margin-top:8px;font-family:${FONT};font-size:13px;color:${INK};" class="em-ink">${esc(format(t.reports.costEstimate, { cost: fmtUsd(estimatedAiCostUsd(s.internal.ai_cost_raw_usd_30d_customer), L), internal: fmtUsd(estimatedAiCostUsd(s.internal.ai_cost_raw_usd_30d_internal), L) }))}</div>
     <div style="margin-top:2px;font-family:${FONT};font-size:11px;color:${MUTED};" class="em-muted">${esc(t.reports.costNote)}</div>`,
    t.reports.sub
  );

  // Birgðir
  const maxInv = Math.max(14, ...s.countries.map((c) => c.inventory_days ?? 0));
  const enrich = enrichmentPct(s);
  const invRows = s.countries
    .map((c) => {
      const d = c.inventory_days;
      const off = c.policy_mode === "off";
      const low = d !== null && !off && d < 5;
      const color = off ? GREY_BAR : low ? "#c08a2e" : BLUE;
      const status = c.kill_switch ? t.inventory.killSwitch : c.policy_mode ? t.inventory.mode[c.policy_mode] : "–";
      return `<tr>
        <td width="26%" style="padding:4px 0;font-family:${FONT};font-size:13px;color:${INK};" class="em-ink">${esc(countryName(c.cc, L))}</td>
        <td style="padding:4px 8px;">${hbar(d === null ? 0 : d / maxInv, color, 10)}</td>
        <td width="30%" align="right" style="padding:4px 0;font-family:${FONT};font-size:13px;color:${INK};white-space:nowrap;" class="em-ink"><strong>${d === null ? "–" : esc(format(t.inventory.days, { value: new Intl.NumberFormat(L, { maximumFractionDigits: 1 }).format(d) }))}</strong> <span style="font-size:11px;color:${MUTED};" class="em-muted">${low ? "&#9888; " : ""}${esc(status)}</span></td></tr>`;
    })
    .join("");
  const inventoryHtml = card(
    t.inventory.title,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${invRows}</table>
     <div style="margin-top:8px;font-family:${FONT};font-size:12px;color:${MUTED};" class="em-muted">${esc(enrich !== null ? format(t.inventory.enriched, { pct: new Intl.NumberFormat(L, { maximumFractionDigits: 0 }).format(enrich) }) : "–")}</div>`,
    t.inventory.sub
  );

  // Innra + niðurhal
  const internalHtml = `
<tr><td style="padding:0 0 14px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};" class="em-muted">
  <strong>${esc(t.internal.title)}.</strong> ${esc(format(t.internal.body, { companies: fmtInt(s.internal.companies, L), week: fmtInt(s.internal.ai_reports_7d, L), total: fmtInt(s.internal.ai_reports_total, L) }))}<br>
  ${esc(t.downloads.title)}: <a href="${APP_STORE_CONNECT_ANALYTICS_URL}" style="color:${BLUE};">App Store Connect</a>.
</td></tr>`;

  const button = `
<tr><td align="center" style="padding:6px 0 18px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td align="center" bgcolor="${BLUE}" style="border-radius:999px;background:${BLUE};">
      <a href="${STATUS_PAGE_URL}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">Opna stöðusíðu &rarr;</a>
    </td></tr></table>
</td></tr>`;

  const subject = [
    `Rondva staða ${dateLabel}`,
    alerts.length ? `${alerts.length} ${alerts.length === 1 ? "viðvörun" : "viðvaranir"}` : null,
    `${fmtUsd(k.revenue_usd_7d, L)} tekjur 7 d.`,
    `${fmtInt(s.outreach.sent_24h, L)} póstar sendir`,
  ]
    .filter(Boolean)
    .join(" · ");

  const html = `<!doctype html>
<html lang="is">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(subject)}</title>
<style>
  @media (prefers-color-scheme: dark) {
    .em-bg { background:#0e1216 !important; }
    .em-card { background:#171d23 !important; border-color:#2a333c !important; }
    .em-ink, .em-ink * { color:#f2f4f7 !important; }
    .em-muted, .em-muted * { color:#a9b2bc !important; }
    .em-track { background:#2a333c !important; }
    .em-bar { background:#8fb0ff !important; }
    .em-alert-danger { background:#3a1b1b !important; }
    .em-alert-danger, .em-alert-danger * { color:#f6b8b8 !important; }
    .em-alert-warn { background:#3a2c12 !important; }
    .em-alert-warn, .em-alert-warn * { color:#f0d29a !important; }
    .em-alert-ok { background:#10301f !important; }
    .em-alert-ok, .em-alert-ok * { color:#8fe0b8 !important; }
  }
</style>
</head>
<body class="em-bg" style="margin:0;padding:0;background:${PAGE_BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE_BG}" class="em-bg" style="background:${PAGE_BG};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
    <tr><td style="padding:0 0 16px 0;font-family:${FONT};" class="em-ink">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BLUE};">Rondva &middot; dagleg staða</div>
      <div style="margin-top:4px;font-size:24px;line-height:30px;font-weight:700;color:${INK};" class="em-ink">${esc(dateLabel)}</div>
      <div style="margin-top:2px;font-size:12px;color:${MUTED};" class="em-muted">${esc(format(t.updated, { time: fmtStamp(s.generated_at) }))}</div>
    </td></tr>
    ${card(t.alerts.title, alertsHtml)}
    ${kpiRows}
    ${narrativeHtml}
    ${funnelHtml}
    ${sendsHtml}
    ${reportsHtml}
    ${inventoryHtml}
    ${button}
    ${internalHtml}
    <tr><td style="padding:8px 0 0 0;border-top:1px solid ${LINE};font-family:${FONT};font-size:11px;line-height:16px;color:${MUTED};" class="em-muted">Sömu tölur og á stöðusíðunni. Tekjur eru brúttó (fyrir Apple-þóknun) á föstu gengi. Sjálfvirkur póstur frá Rondva.</td></tr>
  </table>
</td></tr></table>
</body></html>`;

  // Textaútgáfa (fyrir lesara án HTML og sem varaleið).
  const lines = [
    `Rondva — dagleg staða ${dateLabel}`,
    "",
    ...(alerts.length ? alerts.map((a) => `[${TONE[a.severity].label}] ${alertMessage(t.alerts, a, L)}`) : [t.alerts.allClear]),
    "",
    `${t.kpi.revenue}: ${fmtUsd(k.revenue_usd_7d, L)} (7 d.), ${fmtUsd(k.revenue_usd_total, L)} alls`,
    `${t.kpi.paying}: ${fmtInt(k.paying_companies, L)} · ${t.kpi.trials}: ${fmtInt(k.active_trials, L)}`,
    `${t.kpi.signups}: ${fmtInt(k.signups_7d, L)} · ${t.kpi.reports}: ${fmtInt(k.ai_reports_7d, L)}`,
    `Póstar sendir síðasta sólarhring: ${fmtInt(s.outreach.sent_24h, L)} (7 d.: ${fmtInt(s.outreach.sent_7d, L)})`,
    `${t.sends.replyRate}: ${fmtPct(replyRate, L)} · ${t.sends.bounceRate}: ${fmtPct(bounceRate, L)}`,
    "",
    ...(s.narrative ? [s.narrative.text, ""] : []),
    `Stöðusíða: ${STATUS_PAGE_URL}`,
  ];

  return { subject, html, text: lines.join("\n") };
}
