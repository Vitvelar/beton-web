import type { ReactNode } from "react";
import type { DashboardLocale } from "@/lib/i18n/dashboard";
import { format, stadaCopy, type StadaCopy } from "@/lib/i18n/stada";
import {
  APP_STORE_CONNECT_ANALYTICS_URL,
  BOUNCE_ALERT_PCT,
  BOUNCE_MIN_SAMPLE,
  computeAlerts,
  countryName,
  enrichmentPct,
  estimatedAiCostUsd,
  funnelFor,
  hookComparison,
  pct,
  totalCountry,
  type GrowthCountry,
  type GrowthSnapshot,
} from "@/lib/ops/growth";
import { alertMessage, fmtDelta, fmtInt, fmtPct, fmtShortDate, fmtStamp, fmtUsd } from "@/lib/ops/growth-text";
import { badge, badgeDot, btn } from "@/lib/ui";

// Stöðusíðan: allt er rendrað á þjóninum (CSS-súlur, engin chart-lib, engin JS í vafra).
// Gögnin koma tilbúin úr ops_growth_snapshot(); hér er aðeins framsetning.

const card = "rounded-xl border border-concrete bg-surface p-6 shadow-sm";
const cardTitle = "text-base font-semibold text-ink";
const sub = "mt-1 text-sm text-fog";

// ───────────────────────── Súlurit (CSS) ─────────────────────────

interface Segment {
  value: number;
  className: string;
}
interface Bar {
  label: string;
  title: string;
  segments: Segment[];
}

function BarChart({
  bars,
  ariaLabel,
  heightClass = "h-36",
  line,
  edgeLabels,
  noData,
}: {
  bars: Bar[];
  ariaLabel: string;
  heightClass?: string;
  /** Lárétt viðmiðunarlína (t.d. dagsþak). */
  line?: { value: number; label: string } | null;
  edgeLabels: (string | null)[];
  noData: string;
}) {
  const totals = bars.map((b) => b.segments.reduce((a, s) => a + s.value, 0));
  const dataMax = Math.max(0, ...totals);
  const lineValue = line && line.value > 0 ? line.value : 0;
  const max = Math.max(dataMax, lineValue, 1);
  const empty = dataMax === 0;

  return (
    <div>
      <div className="relative" role="img" aria-label={ariaLabel}>
        <div className={`flex items-end gap-0.5 border-b border-concrete ${heightClass}`}>
          {bars.map((b, i) => (
            <div key={b.label} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={b.title}>
              {b.segments.map((s, j) =>
                s.value > 0 ? (
                  <div
                    key={j}
                    className={`${s.className} ${j === 0 && b.segments.slice(1).every((x) => x.value === 0) ? "rounded-t-sm" : ""}`}
                    style={{ height: `${(s.value / max) * 100}%`, minHeight: 2 }}
                  />
                ) : null
              )}
              <span className="sr-only">{`${b.label}: ${totals[i]}`}</span>
            </div>
          ))}
        </div>
        {lineValue > 0 ? (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line-strong"
            style={{ bottom: `${(lineValue / max) * 100}%` }}
          >
            <span className="absolute right-0 -top-5 rounded bg-surface px-1 text-xs text-fog">{line?.label}</span>
          </div>
        ) : null}
        {empty ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-fog">{noData}</p>
        ) : null}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-fog" aria-hidden="true">
        {edgeLabels.map((l, i) => (
          <span key={i}>{l ?? ""}</span>
        ))}
      </div>
      <p className="mt-1 text-xs text-fog" aria-hidden="true">
        max {fmtInt(dataMax, "is")}
      </p>
    </div>
  );
}

// ───────────────────────── KPI ─────────────────────────

function Kpi({
  label,
  value,
  subline,
  delta,
  note,
}: {
  label: string;
  value: string;
  subline: ReactNode;
  delta?: { text: string; dir: "up" | "down" | "flat" } | null;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-concrete bg-surface p-5 shadow-sm">
      <p className="text-sm font-medium text-fog">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-sm text-fog">{subline}</p>
      {delta ? (
        <p className={`mt-1 text-xs font-medium ${delta.dir === "up" ? "text-success" : "text-fog"}`}>{delta.text}</p>
      ) : null}
      {note ? <p className="mt-2 text-xs text-fog">{note}</p> : null}
    </div>
  );
}

// ───────────────────────── Trekt ─────────────────────────

const STAGE_LABEL = (t: StadaCopy["funnel"], key: ReturnType<typeof funnelFor>[number]["key"]) =>
  ({ leads: t.leads, emailed: t.emailed, replied: t.replied, signed_up: t.signedUp, trial: t.trial, paid: t.paid })[key];

function FunnelCard({ country, name, locale, t, muted }: { country: GrowthCountry; name: string; locale: DashboardLocale; t: StadaCopy["funnel"]; muted?: boolean }) {
  const stages = funnelFor(country);
  const base = Math.max(country.leads_total, 1);
  return (
    <section aria-label={name} className={`rounded-xl border border-concrete p-5 ${muted ? "bg-paper-alt" : "bg-surface shadow-sm"}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{name}</h3>
        {country.cc !== "ALL" ? (
          <span className="text-xs text-fog">{format(t.new, { count: fmtInt(country.leads_new, locale) })}</span>
        ) : null}
      </div>
      <ul className="mt-3 space-y-2">
        {stages.map((st, i) => {
          const prev = i === 0 ? null : stages[i - 1].count;
          // Skráðir koma ekki endilega úr tölvupósti, svo ekkert hlutfall af „Svöruðu"; prufa er af skráðum, greitt af prufu.
          const conv = prev !== null && st.key !== "signed_up" ? pct(st.count, prev) : null;
          return (
            <li key={st.key} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2 text-sm">
              <span className="truncate text-fog">{STAGE_LABEL(t, st.key)}</span>
              <span className="h-2 overflow-hidden rounded-full bg-paper-alt" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-navy"
                  style={{ width: st.count > 0 ? `${Math.max((st.count / base) * 100, 2)}%` : "0%" }}
                />
              </span>
              <span className="min-w-[5.5rem] text-right tabular-nums text-ink">
                {fmtInt(st.count, locale)}
                {conv !== null && prev !== null && prev > 0 ? (
                  <span className="ml-1.5 text-xs text-fog">{fmtPct(conv, locale, 0)}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ───────────────────────── Síðan ─────────────────────────

export function StadaView({ snapshot: s, locale }: { snapshot: GrowthSnapshot; locale: DashboardLocale }) {
  const t = stadaCopy(locale);
  const alerts = computeAlerts(s);
  const k = s.kpi;
  const lang = locale === "is" ? "is" : "en";

  const replyRate = pct(s.outreach.replied, s.outreach.contacted);
  const bounceRate = pct(s.outreach.bounced, s.outreach.contacted);
  const sampleSmall = s.outreach.contacted < BOUNCE_MIN_SAMPLE;
  const enrich = enrichmentPct(s);
  const hook = hookComparison(s.outreach);

  const sendBars: Bar[] = s.sends_daily.map((d) => {
    const parts = Object.entries(d.by_country).sort((a, b) => b[1] - a[1]).map(([cc, n]) => `${cc} ${n}`);
    return {
      label: d.date,
      title: `${fmtShortDate(d.date, locale)}: ${d.total}${parts.length ? ` (${parts.join(", ")})` : ""}`,
      segments: [{ value: d.total, className: "bg-navy" }],
    };
  });
  const weekBars: Bar[] = s.reports_weekly.map((w) => ({
    label: w.week,
    title: `${fmtShortDate(w.week, locale)}: ${w.customer} / ${w.internal}`,
    segments: [
      { value: w.customer, className: "bg-navy" },
      { value: w.internal, className: "bg-line-strong" },
    ],
  }));
  const dayLabels = s.sends_daily.length
    ? [s.sends_daily[0], s.sends_daily[Math.floor(s.sends_daily.length / 2)], s.sends_daily[s.sends_daily.length - 1]].map((d) =>
        fmtShortDate(d.date, locale)
      )
    : [];
  const weekLabels = s.reports_weekly.map((w) => fmtShortDate(w.week, locale));

  const sends30 = s.sends_daily.reduce((a, d) => a + d.total, 0);
  const costCustomer = estimatedAiCostUsd(s.internal.ai_cost_raw_usd_30d_customer);
  const costInternal = estimatedAiCostUsd(s.internal.ai_cost_raw_usd_30d_internal);
  const dl = (cur: number, prev: number, money = false) => {
    const d = fmtDelta(cur, prev, locale, money);
    return { dir: d.dir, text: format(t.kpi.vsPrev, { delta: d.text }) };
  };

  const maxInventory = Math.max(14, ...s.countries.map((c) => c.inventory_days ?? 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-fog">{t.subline}</p>
        <p className="mt-1 text-xs text-fog">{format(t.updated, { time: fmtStamp(s.generated_at) })}</p>
      </div>

      {/* Viðvaranir */}
      <section aria-labelledby="stada-alerts" className={card}>
        <h2 id="stada-alerts" className={cardTitle}>
          {t.alerts.title}
        </h2>
        {alerts.length === 0 ? (
          <p className="mt-3">
            <span className={badge("success")}>
              <span className={badgeDot("success")} aria-hidden="true" />
              {t.alerts.allClear}
            </span>
          </p>
        ) : (
          <ul className="mt-3 space-y-2" role="list">
            {alerts.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink">
                <span className={`${badge(a.severity)} min-w-24 shrink-0`}>
                  <span className={badgeDot(a.severity)} aria-hidden="true" />
                  {a.severity === "danger" ? (locale === "is" ? "Alvarlegt" : "Critical") : locale === "is" ? "Athuga" : "Check"}
                </span>
                <span className="pt-0.5">{alertMessage(t.alerts, a, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* KPI-röð */}
      <section aria-label="KPI" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          label={t.kpi.revenue}
          value={fmtUsd(k.revenue_usd_7d, locale)}
          subline={format(t.kpi.revenueSub, { total: fmtUsd(k.revenue_usd_total, locale) })}
          delta={dl(k.revenue_usd_7d, k.revenue_usd_prev_7d, true)}
          note={t.kpi.revenueNote}
        />
        <Kpi
          label={t.kpi.paying}
          value={fmtInt(k.paying_companies, locale)}
          subline={format(t.kpi.payingSub, { subs: fmtInt(k.active_subscriptions, locale), packs: fmtInt(k.pack_purchases, locale) })}
        />
        <Kpi
          label={t.kpi.trials}
          value={fmtInt(k.active_trials, locale)}
          subline={format(t.kpi.trialsSub, { started: fmtInt(k.trials_started_7d, locale) })}
        />
        <Kpi
          label={t.kpi.signups}
          value={fmtInt(k.signups_7d, locale)}
          subline={format(t.kpi.signupsSub, { total: fmtInt(k.customers, locale) })}
          delta={dl(k.signups_7d, k.signups_prev_7d)}
        />
        <Kpi
          label={t.kpi.reports}
          value={fmtInt(k.ai_reports_7d, locale)}
          subline={format(t.kpi.reportsSub, { total: fmtInt(k.ai_reports_total, locale) })}
          delta={dl(k.ai_reports_7d, k.ai_reports_prev_7d)}
        />
      </section>

      {/* Frásögn vaxtar-agentsins */}
      {s.narrative ? (
        <section aria-labelledby="stada-narrative" className={card}>
          <h2 id="stada-narrative" className={cardTitle}>
            {t.narrative.title}
          </h2>
          <p className="mt-1 text-xs text-fog">{format(t.narrative.from, { time: fmtStamp(s.narrative.created_at) })}</p>
          <div className="mt-3 space-y-2 text-sm text-ink">
            {s.narrative.text
              .split(/\n{2,}/)
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p.trim()}
                </p>
              ))}
          </div>
        </section>
      ) : null}

      {/* Trekt */}
      <section aria-labelledby="stada-funnel">
        <h2 id="stada-funnel" className={cardTitle}>
          {t.funnel.title}
        </h2>
        <p className="mb-3 mt-1 text-sm text-fog">{t.funnel.hint}</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <FunnelCard country={totalCountry(s.countries)} name={t.funnel.total} locale={locale} t={t.funnel} muted />
          {s.countries.map((c) => (
            <FunnelCard key={c.cc} country={c} name={countryName(c.cc, lang)} locale={locale} t={t.funnel} />
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-concrete bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ink">{t.sends.hookTitle}</h3>
          <dl className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {[
              { label: t.sends.withHook, g: hook.withHook },
              { label: t.sends.withoutHook, g: hook.withoutHook },
            ].map(({ label, g }) => (
              <div key={label}>
                <dt className="text-fog">{label}</dt>
                <dd className="text-lg font-semibold tabular-nums text-ink">
                  {fmtPct(g.rate, locale)}{" "}
                  <span className="text-xs font-normal text-fog">
                    {fmtInt(g.replied, locale)}/{fmtInt(g.contacted, locale)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-fog">
            {hook.withHook.contacted === 0 ? t.sends.hookNone : null}{" "}
            {format(t.sends.hookSent7, { count: fmtInt(s.outreach.sent_with_hook_7d, locale) })}
          </p>
        </div>
      </section>

      {/* Súlurit */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-labelledby="stada-sends" className={card}>
          <h2 id="stada-sends" className={cardTitle}>
            {t.sends.title}
          </h2>
          <p className={sub}>{format(t.sends.sub, { total: fmtInt(sends30, locale), week: fmtInt(s.outreach.sent_7d, locale) })}</p>
          <div className="mt-8">
            <BarChart
              bars={sendBars}
              ariaLabel={`${t.sends.title}. ${format(t.sends.sub, { total: sends30, week: s.outreach.sent_7d })}`}
              line={s.outreach.global_daily_cap ? { value: s.outreach.global_daily_cap, label: format(t.sends.cap, { cap: s.outreach.global_daily_cap }) } : null}
              edgeLabels={dayLabels}
              noData={t.chart.noData}
            />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-concrete pt-4 text-sm">
            <div>
              <dt className="text-fog">{t.sends.replyRate}</dt>
              <dd className="text-lg font-semibold tabular-nums text-ink">
                {fmtPct(replyRate, locale)}{" "}
                <span className="text-xs font-normal text-fog">
                  {fmtInt(s.outreach.replied, locale)}/{fmtInt(s.outreach.contacted, locale)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-fog">{t.sends.bounceRate}</dt>
              <dd className="flex flex-wrap items-center gap-x-2 text-lg font-semibold tabular-nums text-ink">
                {fmtPct(bounceRate, locale)}
                <span className="text-xs font-normal text-fog">
                  {t.sends.bounceLimit}
                  {sampleSmall ? ` ${format(t.sends.sampleSmall, { min: BOUNCE_MIN_SAMPLE })}` : ""}
                </span>
                {bounceRate !== null && !sampleSmall && bounceRate >= BOUNCE_ALERT_PCT ? (
                  <span className={badge("danger")}>
                    <span className={badgeDot("danger")} aria-hidden="true" />
                    {locale === "is" ? "Yfir mörkum" : "Over limit"}
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="stada-reports" className={card}>
          <h2 id="stada-reports" className={cardTitle}>
            {t.reports.title}
          </h2>
          <p className={sub}>{t.reports.sub}</p>
          <div className="mt-8">
            <BarChart
              bars={weekBars}
              ariaLabel={`${t.reports.title}. ${t.reports.sub}`}
              edgeLabels={weekLabels}
              noData={t.chart.noData}
            />
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-fog" role="list">
            <li className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-navy" aria-hidden="true" />
              {t.reports.customer}
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-line-strong" aria-hidden="true" />
              {t.reports.internal}
            </li>
          </ul>
          <p className="mt-3 border-t border-concrete pt-3 text-sm text-ink">
            {format(t.reports.costEstimate, { cost: fmtUsd(costCustomer, locale), internal: fmtUsd(costInternal, locale) })}
          </p>
          <p className="mt-1 text-xs text-fog">{t.reports.costNote}</p>
        </section>
      </div>

      {/* Birgðir */}
      <section aria-labelledby="stada-inventory" className={card}>
        <h2 id="stada-inventory" className={cardTitle}>
          {t.inventory.title}
        </h2>
        <p className={sub}>{t.inventory.sub}</p>
        <ul className="mt-4 space-y-3" role="list">
          {s.countries.map((c) => {
            const days = c.inventory_days;
            const low = days !== null && c.policy_mode !== "off" && days < 5;
            const tone = c.policy_mode === "off" ? "neutral" : low ? (days! < 2 ? "danger" : "warn") : "success";
            return (
              <li key={c.cc} className="grid grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[9rem_1fr_22rem]">
                <span className="text-sm font-medium text-ink">{countryName(c.cc, lang)}</span>
                <span className="flex items-center gap-3">
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper-alt" aria-hidden="true">
                    <span
                      className={`block h-full rounded-full ${c.policy_mode === "off" ? "bg-line-strong" : low ? "bg-sev-warn" : "bg-navy"}`}
                      style={{ width: `${days === null ? 0 : Math.min((days / maxInventory) * 100, 100)}%` }}
                    />
                  </span>
                  <span className="w-12 text-right text-sm font-semibold tabular-nums text-ink">
                    {days === null ? "–" : format(t.inventory.days, { value: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(days) })}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fog">
                  <span className={badge(tone)}>
                    <span className={badgeDot(tone)} aria-hidden="true" />
                    {c.kill_switch ? t.inventory.killSwitch : c.policy_mode ? t.inventory.mode[c.policy_mode] : "–"}
                  </span>
                  {c.daily_new_cap ? format(t.inventory.capNew, { cap: c.daily_new_cap }) : null}
                  {" · "}
                  {format(t.inventory.sent24, { count: c.sent_24h })}
                  {` · ${fmtInt(c.enriched_new, locale)}/${fmtInt(c.leads_new, locale)}`}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 border-t border-concrete pt-3 text-sm text-fog">
          {enrich !== null ? format(t.inventory.enriched, { pct: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(enrich) }) : "–"}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Innri notkun — grá */}
        <section aria-labelledby="stada-internal" className="rounded-xl border border-concrete bg-paper-alt p-6">
          <h2 id="stada-internal" className="text-base font-semibold text-fog">
            {t.internal.title}
          </h2>
          <p className="mt-2 text-sm text-fog">
            {format(t.internal.body, {
              companies: fmtInt(s.internal.companies, locale),
              week: fmtInt(s.internal.ai_reports_7d, locale),
              total: fmtInt(s.internal.ai_reports_total, locale),
            })}
          </p>
        </section>

        <section aria-labelledby="stada-downloads" className={card}>
          <h2 id="stada-downloads" className={cardTitle}>
            {t.downloads.title}
          </h2>
          <p className={sub}>{t.downloads.body}</p>
          <p className="mt-4">
            <a href={APP_STORE_CONNECT_ANALYTICS_URL} target="_blank" rel="noopener noreferrer" className={btn("secondary", "md")}>
              {t.downloads.link} ↗
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
