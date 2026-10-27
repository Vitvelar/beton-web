-- EKKI KEYRT Í FRAMLEIÐSLU — þarf já frá Hjalta; samræmingaraðili keyrir stakt eftir nafni
-- ops_growth_snapshot (Management API), aldrei db push. Á heima í beton-app/supabase/migrations
-- þegar hún hefur verið keyrð (vefurinn les aðeins fallið í gegnum service_role).
--
-- Stöðusíðan /dashboard/stada og daglegi stöðupósturinn (/api/ops/status-email) lesa SAMA jsonb úr
-- public.ops_growth_snapshot(), svo tölurnar séu eins á báðum stöðum. Engin gögn breytast nema:
--   * companies.is_test boolean not null default false (nýr dálkur; ATH: samræmingaraðili hefur þegar keyrt
--     þennan hluta sem companies_is_test — hér er hann idempotent: add column if not exists + update ... not is_test) — sett true fyrir prufureikningana
--     „Test NZ Ltd" (eigin prufa eiganda) og „Test" (US, App Review). Allir viðskiptavinamælikvarðar
--     sleppa is_test og partner/internal fyrirtækjum; notkun þeirra birtist sér ("innra").
--   * public.ops_growth_snapshot() — stable, security invoker, aðeins service_role má kalla.
-- Auðgun (ops_leads.hook / enriched_at) er komin í gagnagrunninn; fallið les hana beint.
-- Beton/Bragi: engin núverandi tafla, fall eða stefna breytist; nýi dálkurinn er með sjálfgefið false.
--
-- Afturköllun:
--   drop function public.ops_growth_snapshot();
--   alter table public.companies drop column is_test;

alter table public.companies add column if not exists is_test boolean not null default false;

update public.companies
   set is_test = true
 where entitlement = 'customer'
   and name in ('Test NZ Ltd', 'Test')
   and not is_test;

create or replace function public.ops_growth_snapshot()
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $fn$
begin
  return (
  with
  -- Fastir gengisstuðlar (USD = 1). Áætlun, ekki bókhald.
  fx(cur, rate) as (values
    ('USD', 1.0), ('EUR', 1.08), ('GBP', 1.27), ('AUD', 0.65), ('NZD', 0.58), ('CAD', 0.72), ('ISK', 0.0072)),
  co as (
    select c.id, c.name, upper(c.country_code) as cc, c.status, c.created_at,
           (c.entitlement = 'customer' and not c.is_test) as is_real
      from public.companies c
  ),
  -- Apple: aðeins Production, ekki afturkallað; sleppum þekktum innri/prufufyrirtækjum.
  tx as (
    select t.id, t.company_id, t.original_transaction_id, t.product_id, t.product_type,
           t.purchase_date, t.expires_date, upper(t.currency) as currency, co.cc,
           (coalesce(t.price_milliunits, 0) / 1000.0) * coalesce(fx.rate, 0) as usd,
           (fx.rate is null and t.price_milliunits is not null) as fx_missing
      from public.apple_transactions t
      left join co on co.id = t.company_id
      left join fx on fx.cur = upper(t.currency)
     where t.environment = 'Production'
       and t.revocation_date is null
       and (t.company_id is null or co.is_real)
  ),
  subs as (
    select distinct on (original_transaction_id) *
      from tx
     where product_type ilike '%subscription%'
     order by original_transaction_id, purchase_date desc
  ),
  subs_active as (select * from subs where expires_date > now()),
  -- Prufur: fyrsta krafa á fyrirtæki; virk prufa = óafturkölluð prufuinneign í gildi.
  trial_first as (
    select tc.company_id, min(tc.claimed_at) as first_at
      from public.trial_claims tc join co on co.id = tc.company_id and co.is_real
     group by tc.company_id
  ),
  trial_active as (
    select distinct g.company_id
      from public.report_credit_grants g join co on co.id = g.company_id and co.is_real
     where g.source = 'trial' and g.revoked_at is null and g.starts_at <= now()
       and (g.expires_at is null or g.expires_at > now())
  ),
  ai as (
    select r.company_id, r.reserved_at, coalesce(r.ai_cost_usd, 0) as cost, coalesce(co.is_real, false) as is_real
      from public.report_ai_runs r left join co on co.id = r.company_id
     where r.state = 'succeeded'
  ),
  weeks as (
    select (date_trunc('week', now() at time zone 'utc') - (i * interval '1 week')) as wk
      from generate_series(0, 7) i
  ),
  days as (
    select d::date as d
      from generate_series((now() at time zone 'utc')::date - 29, (now() at time zone 'utc')::date, interval '1 day') d
  ),
  sends as (
    select e.created_at, upper(substr(e.agent, 10)) as cc,
           coalesce(e.payload ->> 'hook', 'false') = 'true' as with_hook
      from public.ops_events e
     where left(e.agent, 9) = 'outreach_' and e.event_type = 'sent'
       and e.created_at >= (now() at time zone 'utc')::date - 29
  ),
  sends_by_day_cc as (
    select (created_at at time zone 'utc')::date as d, cc, count(*) as n from sends group by 1, 2
  ),
  lead_c as (
    select upper(country) as cc,
           count(*) as total,
           count(*) filter (where status = 'new') as n_new,
           count(*) filter (where last_sent_at is not null
                              or status in ('emailed-1', 'emailed-2', 'emailed-3', 'replied', 'bounced')) as contacted,
           count(*) filter (where status = 'replied') as replied,
           count(*) filter (where status = 'bounced') as bounced,
           count(*) filter (where status = 'hold') as on_hold,
           count(*) filter (where status in ('excluded', 'unsubscribed')) as excluded,
           -- Auðgun (ops_leads.enriched_at / hook): hlutfall nýrra leida sem er búið að auðga.
           count(*) filter (where status = 'new' and enriched_at is not null) as enriched_new,
           -- Svarhlutfall með/án sérsniðinnar upphafslínu (hook): miðað við leida sem hafa fengið póst.
           -- ATH: hook á leidanum, ekki á sendingunni; leidi sem fékk hook eftir sendingu telst með.
           count(*) filter (where hook is not null and (last_sent_at is not null
                              or status in ('emailed-1', 'emailed-2', 'emailed-3', 'replied', 'bounced'))) as hook_contacted,
           count(*) filter (where hook is not null and status = 'replied') as hook_replied
      from public.ops_leads group by 1
  ),
  pol as (
    select upper(substr(agent, 10)) as cc, mode, kill_switch, daily_new_cap, daily_cap
      from public.ops_policy where left(agent, 9) = 'outreach_'
  ),
  countries as (
    select cc from lead_c union select cc from pol
  ),
  per_country as (
    select cs.cc,
           coalesce(l.total, 0) as total, coalesce(l.n_new, 0) as n_new, coalesce(l.contacted, 0) as contacted,
           coalesce(l.replied, 0) as replied, coalesce(l.bounced, 0) as bounced,
           coalesce(l.on_hold, 0) as on_hold, coalesce(l.excluded, 0) as excluded,
           coalesce(l.enriched_new, 0) as enriched_new,
           coalesce(l.hook_contacted, 0) as hook_contacted, coalesce(l.hook_replied, 0) as hook_replied,
           (select count(*) from co where co.is_real and co.cc = cs.cc) as signed_up,
           (select count(*) from trial_first tf join co on co.id = tf.company_id where co.cc = cs.cc) as trial,
           (select count(distinct tx.company_id) from tx where tx.cc = cs.cc and tx.company_id is not null) as paid,
           (select count(*) from sends s where s.cc = cs.cc and s.created_at >= now() - interval '24 hours') as sent_24h,
           (select count(*) from sends s where s.cc = cs.cc and s.created_at >= now() - interval '7 days') as sent_7d,
           p.mode as policy_mode, p.kill_switch, p.daily_new_cap, p.daily_cap
      from countries cs
      left join lead_c l on l.cc = cs.cc
      left join pol p on p.cc = cs.cc
  ),
  narr as (
    select e.created_at, nullif(btrim(e.payload ->> 'narrative'), '') as narrative
      from public.ops_events e
     -- Nýjasta growth-daily röð síðustu 24 klst.; vanti narrative (eða röðina) er kaflinn felldur niður.
     where e.template = 'growth-daily' and e.created_at >= now() - interval '24 hours'
     order by e.id desc limit 1
  )
  select jsonb_build_object(
    'generated_at', now(),
    'fx', (select jsonb_object_agg(cur, rate) from fx),
    'kpi', jsonb_build_object(
      'revenue_usd_total',   coalesce((select round(sum(usd), 2) from tx), 0),
      'revenue_usd_7d',      coalesce((select round(sum(usd), 2) from tx where purchase_date >= now() - interval '7 days'), 0),
      'revenue_usd_prev_7d', coalesce((select round(sum(usd), 2) from tx where purchase_date >= now() - interval '14 days'
                                        and purchase_date < now() - interval '7 days'), 0),
      'fx_missing',          (select count(*) from tx where fx_missing),
      'paying_companies',    (select count(distinct company_id) from subs_active where company_id is not null),
      'active_subscriptions',(select count(*) from subs_active),
      'subscriptions_by_product', coalesce((select jsonb_object_agg(product_id, n)
                                   from (select product_id, count(*) as n from subs_active group by 1) s), '{}'::jsonb),
      'pack_purchases',      (select count(*) from tx where product_type ilike '%consumable%'),
      'pack_purchases_7d',   (select count(*) from tx where product_type ilike '%consumable%' and purchase_date >= now() - interval '7 days'),
      'customers',           (select count(*) from co where is_real),
      'signups_7d',          (select count(*) from co where is_real and created_at >= now() - interval '7 days'),
      'signups_prev_7d',     (select count(*) from co where is_real and created_at >= now() - interval '14 days'
                                and created_at < now() - interval '7 days'),
      'trials_started_total',(select count(*) from trial_first),
      'trials_started_7d',   (select count(*) from trial_first where first_at >= now() - interval '7 days'),
      'active_trials',       (select count(*) from trial_active),
      'ai_reports_7d',       (select count(*) from ai where is_real and reserved_at >= now() - interval '7 days'),
      'ai_reports_prev_7d',  (select count(*) from ai where is_real and reserved_at >= now() - interval '14 days'
                                and reserved_at < now() - interval '7 days'),
      'ai_reports_total',    (select count(*) from ai where is_real)
    ),
    'internal', jsonb_build_object(
      'companies',          (select count(*) from co where not is_real),
      'ai_reports_7d',      (select count(*) from ai where not is_real and reserved_at >= now() - interval '7 days'),
      'ai_reports_total',   (select count(*) from ai where not is_real),
      -- ai_cost_usd er ofmetið ~3x (kóðinn gerir ráð fyrir $15/$75 á milljón tókn); vefurinn deilir með 3.
      'ai_cost_raw_usd_30d_customer', coalesce((select round(sum(cost), 4) from ai where is_real and reserved_at >= now() - interval '30 days'), 0),
      'ai_cost_raw_usd_30d_internal', coalesce((select round(sum(cost), 4) from ai where not is_real and reserved_at >= now() - interval '30 days'), 0)
    ),
    'reports_weekly', (
      select jsonb_agg(jsonb_build_object(
               'week', (w.wk)::date,
               'customer', (select count(*) from ai where is_real and (reserved_at at time zone 'utc') >= w.wk
                              and (reserved_at at time zone 'utc') < w.wk + interval '1 week'),
               'internal', (select count(*) from ai where not is_real and (reserved_at at time zone 'utc') >= w.wk
                              and (reserved_at at time zone 'utc') < w.wk + interval '1 week')
             ) order by w.wk)
        from weeks w),
    'sends_daily', (
      select jsonb_agg(jsonb_build_object(
               'date', dd.d,
               'total', coalesce((select sum(n) from sends_by_day_cc s where s.d = dd.d), 0),
               'by_country', coalesce((select jsonb_object_agg(s.cc, s.n) from sends_by_day_cc s where s.d = dd.d), '{}'::jsonb)
             ) order by dd.d)
        from days dd),
    'outreach', jsonb_build_object(
      'contacted',   (select coalesce(sum(contacted), 0) from lead_c),
      'replied',     (select coalesce(sum(replied), 0) from lead_c),
      'bounced',     (select coalesce(sum(bounced), 0) from lead_c),
      'new_leads',   (select coalesce(sum(n_new), 0) from lead_c),
      'replies_7d',  (select count(*) from public.ops_leads where status = 'replied' and reply_at >= now() - interval '7 days'),
      'sent_7d',     (select count(*) from sends where created_at >= now() - interval '7 days'),
      'sent_24h',    (select count(*) from sends where created_at >= now() - interval '24 hours'),
      'sent_with_hook_7d', (select count(*) from sends where with_hook and created_at >= now() - interval '7 days'),
      'hook_contacted', (select coalesce(sum(hook_contacted), 0) from lead_c),
      'hook_replied',   (select coalesce(sum(hook_replied), 0) from lead_c),
      'global_kill_switch', (select kill_switch from public.ops_policy where agent = 'global'),
      'global_mode',        (select mode from public.ops_policy where agent = 'global'),
      'global_daily_cap',   (select daily_cap from public.ops_policy where agent = 'global'),
      'suppressed',  (select count(*) from public.ops_suppression)
    ),
    'countries', (
      select jsonb_agg(jsonb_build_object(
               'cc', pc.cc, 'leads_total', pc.total, 'leads_new', pc.n_new, 'contacted', pc.contacted,
               'replied', pc.replied, 'bounced', pc.bounced, 'on_hold', pc.on_hold, 'excluded', pc.excluded,
               'signed_up', pc.signed_up, 'trial', pc.trial, 'paid', pc.paid,
               'sent_24h', pc.sent_24h, 'sent_7d', pc.sent_7d,
               'policy_mode', pc.policy_mode, 'kill_switch', pc.kill_switch,
               'daily_new_cap', pc.daily_new_cap, 'daily_cap', pc.daily_cap,
               'inventory_days', case when coalesce(pc.daily_new_cap, 0) > 0
                                      then round(pc.n_new::numeric / pc.daily_new_cap, 1) end,
               'enriched_new', pc.enriched_new, 'hook_contacted', pc.hook_contacted, 'hook_replied', pc.hook_replied
             ) order by pc.contacted desc, pc.n_new desc, pc.cc)
        from per_country pc),
    'narrative', (select case when narrative is not null
                              then jsonb_build_object('text', narrative, 'created_at', created_at) end
                    from narr)
  ));
end
$fn$;

revoke all on function public.ops_growth_snapshot() from public, anon, authenticated;
grant execute on function public.ops_growth_snapshot() to service_role;
