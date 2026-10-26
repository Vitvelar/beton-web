/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script, like the other verify-*.cjs */
// Einkunnir án athugasemdar í tölum skýrslunnar (src/lib/report/rating-findings.ts + report/page.tsx + IsopReport.tsx).
//
// Tilefni: skoðun a4862d97 (2026-10-26). Gátlisti utanhúss: Cracks = Very serious, Paint/Render = Serious (aðeins einkunn,
// „Skip“ á flýtiblaðinu); kassarnir sögðu „3 Minor, 0 Serious, 0 Very serious“ en niðurstaðan nefndi „a Very serious
// finding relating to cracks“. Hér er sama uppsetning (tilbúin gögn, engin raunveruleg eign) og athugað að:
//   (a) eining: vörpun, þekjun (titill „<heiti> — …“ eða flokkur), röð, auðkenni, óstimpluð = sami hlutur;
//   (b) óstimpluð ensk skýrsla = nákvæmlega eins og áður (3/0/0), stimpluð = 6/2/1, einkunnir birtar í rýminu,
//       „Observations“ = 3 raunverulegar athugasemdir, verkefnalistinn byrjar á Cracks;
//   (c) stimpill á íslenskri skýrslu (Beton) er hunsaður — markup bæti-eins og án hans;
//   (d) NZS 4306: einkunn „Significant defect“ án athugasemdar fer í töflu verulegra galla og talninguna;
//   (e) isop: einkunn „Major defect“ án athugasemdar fer í gallatöfluna og talninguna; skýringartextinn segir það;
//   (f) RATING_FINDINGS_BASE=<tré origin/main> → óstimpluð/íslensk-stimpluð skýrsla bæti-eins og grunntréð gefur.
//   node scripts/verify-rating-findings.cjs
//   RATING_FINDINGS_BASE=/path/to/origin-main-checkout node scripts/verify-rating-findings.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, renderReportMarkup } = require('./report-fixture.cjs');
const { buildNzSampleRecord } = require('./nz-sample/sample-inspection.cjs');
const { buildIsopSampleRecord } = require('./isop-sample/sample-inspection.cjs');

const rf = load('src/lib/report/rating-findings.ts');
let checks = 0;
const pass = (name) => { checks++; console.log(`PASS ${name}`); };
const clone = (v) => JSON.parse(JSON.stringify(v));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
const textOf = (markup) => decode(markup.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n')).split('\n').map((l) => l.trim()).filter(Boolean);
const statBoxes = (markup) => Object.fromEntries(
  [...markup.matchAll(/<div class="text-2xl font-bold"[^>]*>(\d+)<\/div><div class="text-xs text-fog">([^<]+)<\/div>/g)].map((m) => [decode(m[2]), Number(m[1])]),
);
const stamp = (record, value = rf.FINDINGS_BASIS) => { const r = clone(record); r.ai_report_data.findings_basis = value; return r; };

// ── Tilbúin skoðun eins og a4862d97 (sjálfgefið snið, en-US, standard; rými með íslenskum slug-um) ──────────────
function ownerCaseRecord({ locale = 'en' } = {}) {
  const rooms = [
    { id: 'r-ext', name: 'Exterior', slug: 'utanhuss', ratings: { lod: 'warn', gluggar: 'warn', malning: 'danger', mulning: 'danger', sokkull: 'ok', sprungur: 'mjog_alvarleg', klaedning: 'warn', utihurdir: 'ok' },
      obs: [{ id: 'o-win', title: 'Windows — Minor', severity: 'athugasemd', description: 'The window frames show wear.', suggestion: 'Service the windows.' }] },
    { id: 'r-hall', name: 'Hallway', slug: 'forstofa', ratings: {}, obs: [] },
    { id: 'r-liv', name: 'Living room', slug: 'stofa', ratings: { loft: 'ok', hurdir: 'warn', veggir: 'ok', golfefni: 'ok' },
      obs: [{ id: 'o-liv', title: 'Doors — Minor', severity: 'athugasemd', description: 'The interior doors are noisy.', suggestion: 'Adjust the doors.' }] },
    { id: 'r-bed', name: 'Bedroom 1', slug: 'svefnherbergi-1', ratings: { loft: 'warn', hurdir: 'warn', veggir: 'ok', golfefni: 'ok' },
      obs: [{ id: 'o-bed', title: 'Doors — Minor', severity: 'athugasemd', description: 'The door leaf is warped.', suggestion: 'Adjust or replace the door leaf.' }] },
  ];
  const inspection = {
    address: '1 Fixture Street — TEST', postal_code: '00000', municipality: 'Testville', fastanumer: '', customer_name: 'Pat Fixture',
    inspection_date: '2026-10-26', weather: 'Clear', attendees: [], property_data: { tegund: 'Apartment' }, lookup_failed: false,
  };
  const ai_summary = {
    introduction: 'Synthetic fixture data — not a real property.',
    property_description: 'The property is an apartment.',
    conclusion: 'The inspection recorded a Very serious finding relating to cracks in the exterior, together with Serious ratings for the exterior paint and render.',
  };
  const ai = {
    report_locale: locale, rating_scheme: 'standard', ...(locale === 'en' ? { english_variant: 'en-US' } : {}), inspection, ai_summary,
    rooms: rooms.map((r, i) => ({ name: r.name, slug: r.slug, sort_order: i, ratings: r.ratings, notes: '',
      observations: r.obs.map((o) => ({ id: o.id, number: null, category: '', title: o.title, description: o.description, suggestion: o.suggestion, severity: o.severity })) })),
  };
  return {
    id: 'fx-owner-case', local_id: 'local-fx-owner-case', ...inspection, ai_report_data: ai, ai_summary: 'x', ai_cost_usd: 0, ai_model: 'fixture',
    report_generated_at: '2026-10-26T21:24:04Z',
    inspectors: { full_name: 'Test Inspector', company_name: 'Example Inspections LLC', company_logo_url: null, company_terms_url: null, company_terms_text: null },
    rooms: rooms.map((r, i) => ({ id: r.id, name: r.name, slug: r.slug, sort_order: i, ratings: r.ratings, notes: '', photos: [],
      observations: r.obs.map((o, j) => ({ id: o.id, observation_number: null, category: null, title: o.title, description: o.description, suggestion: o.suggestion, severity: o.severity, sort_order: j, photos: [] })) })),
  };
}

const EN_OPTS = { dashboardLocale: 'en', brand: 'rondva' };

async function main() {
  // (a) Eining
  {
    const label = (key) => ({ sprungur: 'Cracks', gluggar: 'Windows', malning: 'Paint', lod: 'Grounds / drainage', hurdir: 'Doors', loft: 'Ceiling', retaining: 'Retaining walls' }[key] ?? key);
    const room = { slug: 'utanhuss', ratings: { lod: 'warn', gluggar: 'warn', malning: 'danger', sprungur: 'mjog_alvarleg', sokkull: 'ok', x: 'na', y: '' },
      observations: [{ id: 'o1', title: 'Windows — Minor' }] };
    const found = rf.ratingFindingsOf(room, label);
    assert.deepEqual(clone(found.map((f) => [f.key, f.severity, f.title, f.id])), [
      ['lod', 'athugasemd', 'Grounds / drainage', 'rating:utanhuss:lod'],
      ['malning', 'alvarleg', 'Paint', 'rating:utanhuss:malning'],
      ['sprungur', 'mjog_alvarleg', 'Cracks', 'rating:utanhuss:sprungur'],
    ]);
    // Þekjun: titill byrjar á heitinu (heil orð, hvaða alvarleiki sem er), íslenskur titill/lykill, flokkur; ekki hálft orð.
    const covered = (title, category = null, key = 'hurdir', lbl = 'Doors') =>
      rf.ratingFindingsOf({ slug: 's', ratings: { [key]: 'danger' }, observations: [{ id: 'o', title, category }] }, () => lbl).length === 0;
    assert.ok(covered('Doors — Serious'));
    assert.ok(covered('Doors — Minor'), 'severity changed on the observation still covers the rating');
    assert.ok(covered('Doors sticking in frame'));
    assert.ok(covered('Hurðir — Alvarleg athugasemd'), 'Icelandic auto-title folds to the key');
    assert.ok(covered('Something else', 'Hurðir'), 'observation category = rating key');
    assert.ok(!covered('Door handle loose'), 'prefix matching is unstemmed: door is not doors');
    assert.ok(!covered('Doorbell broken'), 'different word is not the element');
    assert.ok(!covered('Loftræsting — Minor', null, 'loft', 'Ceiling'), 'Loft is not a prefix word of Loftræsting');
    assert.ok(covered('Retaining walls — Defect', null, 'retaining', 'Retaining walls'));
    assert.ok(covered('Retaining — Defect', null, 'retaining', 'Retaining walls'), 'key words also count');
    // Pörun: athugasemd með breyttum titli, sama alvarleika og sem NEFNIR þáttinn er skrif einkunnarinnar (1:1, í röð).
    const nzLab = (k) => ({ piles: 'Piles', bearers_joists: 'Bearers and joists', ground_cover: 'Ground cover' }[k]);
    const sub = rf.ratingFindingsOf({ slug: 'nz-subfloor', ratings: { piles: 'mjog_alvarleg', bearers_joists: 'danger', ground_cover: 'warn' },
      observations: [{ id: 'a', title: 'Leaning piles and dropped bearer', severity: 'mjog_alvarleg' }, { id: 'b', title: 'No ground cover below the bathroom', severity: 'athugasemd' }] }, nzLab);
    assert.deepEqual(clone(sub.map((f) => f.key)), ['bearers_joists'], 'piles and ground cover paired (same severity, element named), bearers left over');
    // Ein athugasemd þekur eina einkunn: „Peeling paint on cladding“ (nefnir bæði) þekur fyrri einkunnina.
    const oneForOne = rf.ratingFindingsOf({ slug: 'nz-exterior', ratings: { cladding: 'warn', paint: 'warn' },
      observations: [{ id: 'p', title: 'Peeling paint on cladding', severity: 'athugasemd' }] }, (k) => ({ cladding: 'Cladding', paint: 'Paint' }[k]));
    assert.deepEqual(clone(oneForOne.map((f) => f.key)), ['paint'], 'one observation covers one rating');
    // Athugasemd sem nefnir ekki þáttinn þekur hann aldrei (MEDIUM, judge #63): engin falin alvarleg einkunn.
    const deck = rf.ratingFindingsOf({ slug: 'utanhuss', ratings: { sprungur: 'mjog_alvarleg' },
      observations: [{ id: 'd', title: 'Rotten deck boards', severity: 'mjog_alvarleg' }] }, () => 'Cracks');
    assert.deepEqual(clone(deck.map((f) => f.key)), ['sprungur'], '"Rotten deck boards" does not hide Cracks = Very serious');
    const moisture = rf.ratingFindingsOf({ slug: 'nz-bathroom', ratings: { linings: 'mjog_alvarleg', wet_area_linings: 'mjog_alvarleg' },
      observations: [{ id: 'm', title: 'Elevated moisture at the base of the shower wall', severity: 'mjog_alvarleg' }] }, (k) => ({ linings: 'Wall linings', wet_area_linings: 'Wet area linings' }[k]));
    assert.deepEqual(clone(moisture.map((f) => f.key)), ['linings', 'wet_area_linings'], 'an observation naming neither element covers neither (shown, not hidden)');
    // isop (HIGH, judge #63): appið geymir „Gutters and downspouts — …“, vefurinn birtir „Gutters & downspouts“.
    const isopLab = load('src/lib/report/isop.ts').isopRatingKeyLabel;
    const gutters = (severity) => rf.ratingFindingsOf({ slug: 'isop-roof', ratings: { penetrations_skylights: 'danger', gutters_downspouts: 'danger' },
      observations: [{ id: 'g', title: 'Gutters and downspouts — Repair or replace', severity }] }, isopLab);
    assert.deepEqual(clone(gutters('alvarleg').map((f) => f.key)), ['penetrations_skylights'], 'Penetrations skipped, Gutters observed → Penetrations is the rating-only finding');
    assert.deepEqual(clone(gutters('mjog_alvarleg').map((f) => f.key)), ['penetrations_skylights'], 'after a severity change the Gutters observation still covers Gutters');
    assert.deepEqual(clone(gutters('athugasemd').map((f) => f.key)), ['penetrations_skylights']);
    // Öll app-heiti (isop og íslensk) þekja sinn lykil í titli flýtiblaðsins.
    const appLabels = load('src/lib/report/app-rating-labels.ts');
    for (const [key, appLabel] of Object.entries(appLabels.APP_ISOP_RATING_LABELS)) {
      assert.equal(rf.ratingFindingsOf({ slug: 'isop-x', ratings: { [key]: 'danger' }, observations: [{ id: 'o', title: `${appLabel} — Repair or replace`, severity: 'alvarleg' }] }, isopLab).length, 0, `isop ${key}: ${appLabel}`);
      assert.equal(rf.ratingFindingsOf({ slug: 'isop-x', ratings: { [key]: 'danger' }, observations: [{ id: 'o', title: `${isopLab(key)} — Repair or replace`, severity: 'alvarleg' }] }, isopLab).length, 0, `isop web label ${key}`);
    }
    let isLabels = 0;
    for (const [key, list] of Object.entries(appLabels.APP_IS_RATING_LABELS)) {
      for (const isLabel of list) {
        assert.equal(rf.ratingFindingsOf({ slug: 'eldhus', ratings: { [key]: 'warn' }, observations: [{ id: 'o', title: `${isLabel} — Athugasemd`, severity: 'mjog_alvarleg' }] }, (k) => k).length, 0, `Icelandic ${key}: ${isLabel}`);
        isLabels++;
      }
    }
    assert.ok(covered('Baðkar / sturta — Alvarleg athugasemd', null, 'badker_sturta', 'Bath / shower'), 'Icelandic title in an English report (5e001382)');
    // HIGH (judge #63, 5895ea2): forskeyti á ÓSTOFNUÐUM orðum; titill annars þáttar felur aldrei einkunn.
    const en = (k) => ({ golfefni: 'Flooring', nidurfall: 'Floor drain', veggir: 'Walls', malning: 'Paint', mulning: 'Render', sprungur: 'Cracks' }[k] ?? k);
    for (const slug of ['badherbergi-1', 'badherbergi-2', 'thvottahus']) {
      const r = rf.ratingFindingsOf({ slug, ratings: { golfefni: 'mjog_alvarleg', nidurfall: 'danger' }, observations: [{ id: 'f', title: 'Floor drain — Serious', severity: 'alvarleg' }] }, en);
      assert.deepEqual(clone(r.map((f) => f.key)), ['golfefni'], `${slug}: "Floor drain — Serious" covers Floor drain, never Flooring = Very serious`);
      const r2 = rf.ratingFindingsOf({ slug, ratings: { golfefni: 'mjog_alvarleg' }, observations: [{ id: 'f', title: 'Floor drain — Serious', severity: 'alvarleg' }] }, en);
      assert.deepEqual(clone(r2.map((f) => f.key)), ['golfefni'], `${slug}: unrated Floor drain still does not hide Flooring`);
    }
    assert.deepEqual(clone(rf.ratingFindingsOf({ slug: 'stofa', ratings: { veggir: 'danger' }, observations: [{ id: 'w', title: 'Wall socket loose', severity: 'athugasemd' }] }, en).map((f) => f.key)), ['veggir'], '"Wall socket loose" does not hide Walls = Serious');
    assert.deepEqual(clone(rf.ratingFindingsOf({ slug: 'utanhuss', ratings: { malning: 'mjog_alvarleg' }, observations: [{ id: 'p', title: 'Painted render cracked', severity: 'alvarleg' }] }, en).map((f) => f.key)), ['malning'], '"Painted render cracked" does not hide Paint = Very serious');
    // Lengsta heitið vinnur: „Roof flashings — Defect“ á Roof flashings, ekki Flashings.
    const nzL = (k) => ({ roof_flashings: 'Roof flashings', flashings: 'Flashings', roof_covering: 'Roof covering' }[k]);
    assert.deepEqual(clone(rf.ratingFindingsOf({ slug: 'x', ratings: { flashings: 'danger', roof_flashings: 'danger' }, observations: [{ id: 'r', title: 'Roof flashings — Defect', severity: 'alvarleg' }] }, nzL).map((f) => f.key)), ['flashings'], 'longest name owns the observation');
    assert.deepEqual(clone(rf.ratingFindingsOf({ slug: 'x', ratings: { flashings: 'danger', roof_flashings: 'danger' }, observations: [{ id: 'r', title: 'Flashings — Defect', severity: 'alvarleg' }] }, nzL).map((f) => f.key)), ['roof_flashings']);
    assert.ok(covered('Gutters & downspouts sagging', null, 'gutters_downspouts', 'Gutters and downspouts'), '& folds to and');
    assert.ok(covered('Bath and shower — Minor', null, 'badker_sturta', 'Bath / shower'), '/ folds to and');
    const titled = rf.ratingFindingsOf({ slug: 'x', ratings: { hurdir: 'warn', loft: 'warn' },
      observations: [{ id: 'd', title: 'Doors — Serious', severity: 'alvarleg' }] }, (k) => ({ hurdir: 'Doors', loft: 'Ceiling' }[k]));
    assert.deepEqual(clone(titled.map((f) => f.key)), ['loft'], 'an observation matched by title is not paired again');
    // Óstimpluð / íslensk = sami hlutur; stimpluð ensk bætir aftast í rýmið.
    const report = { report_locale: 'en', rooms: [{ ...room, observations: [{ id: 'o1', title: 'Windows — Minor', severity: 'athugasemd' }] }] };
    assert.equal(rf.withRatingFindings(report, label), report);
    assert.equal(rf.withRatingFindings({ ...report, report_locale: 'is', findings_basis: rf.FINDINGS_BASIS }, label).rooms, report.rooms);
    assert.equal(rf.withRatingFindings({ ...report, findings_basis: 'something_else' }, label).rooms, report.rooms);
    const out = rf.withRatingFindings({ ...report, findings_basis: rf.FINDINGS_BASIS }, label);
    assert.deepEqual(clone(out.rooms[0].observations.map((o) => o.id)), ['o1', 'rating:utanhuss:lod', 'rating:utanhuss:malning', 'rating:utanhuss:sprungur']);
    assert.deepEqual(clone(out.rooms[0].observations[3]), { id: 'rating:utanhuss:sprungur', number: null, category: '', title: 'Cracks', description: rf.RATING_FINDING_NOTE, suggestion: '', severity: 'mjog_alvarleg' });
    assert.equal(report.rooms[0].observations.length, 1, 'input not mutated');
    assert.ok(rf.isRatingFindingId('rating:a:b') && !rf.isRatingFindingId('3f2a-uuid'));
    pass(`(a) unit: warn/danger/very serious → Minor/Serious/Very serious; covered by title prefix (app isop labels, ${isLabels} Icelandic app labels, &,/,and folded) or category, else paired 1:1 only with a same-severity observation that names the element; unstamped = same object`);
  }

  // (a2) Öll sniðmát appsins: flýtititill hvers þáttar (öll tungumál/heiti appsins) þekur AÐEINS sinn þátt í sínu rými.
  {
    const appLabels = load('src/lib/report/app-rating-labels.ts');
    const nzEl = load('src/lib/report/nz-elements.ts');
    const isopLab = load('src/lib/report/isop.ts').isopRatingKeyLabel;
    const i18n = load('src/lib/report/i18n.ts');
    const rooms = JSON.parse(require('node:fs').readFileSync(path.join(__dirname, 'app-room-elements.json'), 'utf8'));
    const display = (slug) => (k) => slug.startsWith('isop-') ? isopLab(k) : slug.startsWith('nz-') ? nzEl.NZ_RATING_LABELS[k] ?? i18n.ratingCategoryLabel(i18n.REPORT_COPY.en, k) : i18n.ratingCategoryLabel(i18n.REPORT_COPY.en, k);
    let titles = 0;
    for (const [slug, list] of Object.entries(rooms)) {
      const keys = [...new Set(list)];
      for (const key of keys) {
        const forms = new Set([appLabels.APP_EN_RATING_LABELS[key], ...(appLabels.APP_IS_RATING_LABELS[key] ?? []),
          slug.startsWith('nz-') ? nzEl.NZ_RATING_LABELS[key] ?? key.replace(/_/g, ' ') : undefined,
          slug.startsWith('isop-') ? appLabels.APP_ISOP_RATING_LABELS[key] ?? key.replace(/_/g, ' ') : undefined].filter(Boolean));
        for (const form of forms) {
          for (const sev of ['Serious', 'Alvarleg athugasemd', 'Repair or replace', 'Defect']) {
            const ratings = Object.fromEntries(keys.map((k) => [k, 'mjog_alvarleg']));
            const found = rf.ratingFindingsOf({ slug, ratings, observations: [{ id: 'q', title: `${form} — ${sev}`, severity: 'alvarleg' }] }, display(slug.replace('*', 'custom')));
            assert.deepEqual(clone(found.map((f) => f.key)).sort(), keys.filter((k) => k !== key).sort(), `${slug}: "${form} — ${sev}" must cover ${key} and nothing else`);
            titles++;
          }
        }
      }
    }
    pass(`(a2) all ${Object.keys(rooms).length} app room templates: each element's quick-add title (${titles} title/severity forms) covers exactly its own element`);
  }

  // (b) Tilfelli eigandans: óstimpluð = eins og áður, stimpluð = tölur og texti saman
  {
    const plain = await renderReportMarkup(ownerCaseRecord(), { pdf: true, ...EN_OPTS });
    assert.deepEqual(statBoxes(plain), { Minor: 3, Serious: 0, 'Very serious': 0 }, 'unstamped: observations only, as before');
    const html = await renderReportMarkup(stamp(ownerCaseRecord()), { pdf: true, ...EN_OPTS });
    assert.deepEqual(statBoxes(html), { Minor: 6, Serious: 2, 'Very serious': 1 }, 'stamped: observations + rating-only findings');
    const lines = textOf(html.slice(html.indexOf('<article')));
    const obsRow = lines.indexOf('Observations');
    assert.ok(obsRow > 0 && lines[obsRow + 1] === '3', 'Observations row counts the three real observations');
    for (const title of ['Cracks', 'Paint', 'Render', 'Grounds / drainage', 'Cladding', 'Ceiling']) {
      assert.ok(lines.includes(title), `rating-only finding shown: ${title}`);
    }
    assert.equal(lines.filter((l) => l === rf.RATING_FINDING_NOTE).length, 6, 'the rating note appears once per rating-only card in its room');
    assert.equal(lines.filter((l) => l === 'Windows — Minor').length, plain.split('Windows — Minor').length - 1, 'Windows not duplicated');
    const action = lines.lastIndexOf('Action list');
    assert.ok(action > 0, 'action list');
    const firstItem = lines.slice(action).findIndex((l) => l === '1.');
    assert.equal(lines[action + firstItem + 1], 'Cracks', 'action list starts with the Very serious crack');
    pass('(b) owner case: unstamped 3/0/0 unchanged; stamped 6/2/1, six rating-only findings in their rooms, Observations = 3, action list led by Cracks');
  }

  // (c) Stimpill á íslenskri skýrslu (Beton) breytir engu
  {
    const isRecord = ownerCaseRecord({ locale: 'is' });
    for (const pdf of [true, false]) {
      const plain = await renderReportMarkup(isRecord, { pdf, dashboardLocale: 'is', brand: 'beton' });
      assert.equal(await renderReportMarkup(stamp(isRecord), { pdf, dashboardLocale: 'is', brand: 'beton' }), plain);
    }
    pass('(c) Icelandic report with findings_basis renders byte-identical to the same report without it (pdf + web)');
  }

  // (d) NZS 4306
  {
    const base = buildNzSampleRecord();
    const plainHtml = await renderReportMarkup(base, { pdf: true, ...EN_OPTS });
    assert.equal(await renderReportMarkup(stamp(base, 'observations'), { pdf: true, ...EN_OPTS }), plainHtml, 'unknown findings_basis value = as before');
    const rec = clone(base);
    const nzLabel = (key) => load('src/lib/report/nz-elements.ts').NZ_RATING_LABELS[key] ?? key;
    // Fyrsta einkunn 'ok' sem engin athugasemd fjallar um → Significant defect (aðeins einkunn).
    let target = null;
    for (const room of rec.ai_report_data.rooms) {
      for (const [key, value] of Object.entries(room.ratings)) {
        if (value !== 'ok' || target) continue;
        const probe = { ...room, ratings: { [key]: 'mjog_alvarleg' } };
        if (rf.ratingFindingsOf(probe, nzLabel).length === 1) target = { room, key };
      }
    }
    assert.ok(target, 'NZ sample has an unrated-by-observation element');
    target.room.ratings[target.key] = 'mjog_alvarleg';
    // Sýnið sjálft hefur líka einkunnir án athugasemdar; borið saman við stimplað sýni án breytingarinnar.
    const stampedBase = await renderReportMarkup(stamp(base), { pdf: true, ...EN_OPTS });
    const html = await renderReportMarkup(stamp(rec), { pdf: true, ...EN_OPTS });
    const before = statBoxes(stampedBase); const after = statBoxes(html);
    const plainBoxes = statBoxes(plainHtml);
    assert.ok(before.Defect >= plainBoxes.Defect && before['Significant defect'] >= plainBoxes['Significant defect']);
    assert.equal(after['Significant defect'], before['Significant defect'] + 1);
    assert.equal(after.Defect, before.Defect); assert.equal(after.Maintenance, before.Maintenance);
    const lines = textOf(html.slice(html.indexOf('<article')));
    const sig = lines.indexOf('Significant defects');
    const nextHead = lines.indexOf('Defects', sig + 1);
    assert.ok(lines.slice(sig, nextHead).includes(nzLabel(target.key)), 'rating-only significant defect listed in the significant defects table');
    assert.ok(!lines.slice(sig, nextHead).includes('No significant defects were recorded.'));
    const row = lines.slice(sig, nextHead).indexOf(nzLabel(target.key));
    assert.equal(lines.slice(sig, nextHead)[row + 1], rf.RATING_FINDING_SIGNIFICANT_ACTION, 'rating-only significant defect: fixed recommended action');
    assert.ok(!plainHtml.includes(rf.RATING_FINDING_SIGNIFICANT_ACTION), 'unstamped: never the fixed text');
    pass(`(d) NZS 4306: rating-only "Significant defect" (${nzLabel(target.key)}) counted and listed under Significant defects; unstamped unchanged`);
  }

  // (e) isop
  {
    const base = buildIsopSampleRecord();
    const plainHtml = await renderReportMarkup(base, { pdf: true, ...EN_OPTS });
    assert.ok(plainHtml.includes('calculated from the inspector&#x27;s observations. It is not a'), 'unstamped isop copy unchanged');
    const rec = clone(base);
    const isopLabel = load('src/lib/report/isop.ts').isopRatingKeyLabel;
    let target = null;
    for (const room of rec.ai_report_data.rooms) {
      for (const [key, value] of Object.entries(room.ratings ?? {})) {
        if (value !== 'ok' || target) continue;
        if (rf.ratingFindingsOf({ ...room, ratings: { [key]: 'mjog_alvarleg' } }, isopLabel).length === 1) target = { room, key };
      }
    }
    assert.ok(target, 'isop sample has an element without an observation');
    target.room.ratings[target.key] = 'mjog_alvarleg';
    const before = statBoxes(await renderReportMarkup(stamp(base), { pdf: true, ...EN_OPTS }));
    const html = await renderReportMarkup(stamp(rec), { pdf: true, ...EN_OPTS });
    const after = statBoxes(html);
    assert.equal(after['Major defect'], before['Major defect'] + 1, JSON.stringify({ before, after }));
    for (const k of ['Repair or replace', 'Maintenance']) assert.equal(after[k], before[k], k);
    const lines = textOf(html.slice(html.indexOf('<article')));
    const table = lines.indexOf('Deficiencies');
    const maint = lines.indexOf('Maintenance items', table);
    assert.ok(lines.slice(table, maint).includes(isopLabel(target.key)), 'rating-only major defect in the deficiency table');
    assert.ok(html.includes('calculated from the inspector&#x27;s observations and checklist ratings. It is not a separate judgment.'));
    assert.ok(html.includes('calculated from the inspector&#x27;s observations and checklist ratings in each system.'));
    assert.ok(html.includes('overview are calculated from the inspector&#x27;s observations and checklist ratings, not written by AI.'), 'Use of AI wording');
    assert.ok(plainHtml.includes('overview are calculated from the inspector&#x27;s observations, not written by AI.'), 'unstamped Use of AI wording unchanged');
    for (const re of [/\bonly\b/i, /no defects/i, /guarantee/i, /\baccurate/i]) assert.ok(!re.test(rf.RATING_FINDING_NOTE), `note avoids ${re}`);
    pass(`(e) isop: rating-only "Major defect" (${isopLabel(target.key)}) counted and in the deficiency table; explanatory copy says observations and checklist ratings`);
  }

  // (g) APP_REPO=<beton-app> → app-rating-labels.ts og app-room-elements.json eru nákvæm afrit appsins.
  if (process.env.APP_REPO) {
    const sync = require('./app-rating-labels-sync.cjs');
    const fs = require('node:fs');
    const data = sync.extractAppLabels(path.resolve(process.env.APP_REPO));
    assert.equal(fs.readFileSync(sync.TS_FILE, 'utf8'), sync.renderTs(data), 'app-rating-labels.ts stale — APP_REPO=… node scripts/app-rating-labels-sync.cjs --write');
    assert.equal(fs.readFileSync(sync.ROOMS_FILE, 'utf8'), sync.renderRooms(data), 'app-room-elements.json stale — APP_REPO=… node scripts/app-rating-labels-sync.cjs --write');
    pass(`(g) app-rating-labels.ts + app-room-elements.json match ${process.env.APP_REPO} (isop, English, Icelandic labels; room templates)`);
  } else {
    console.warn('\n' + '!'.repeat(78) + '\n!! WARNING: (g) SKIPPED — app label parity NOT checked. Set APP_REPO=<beton-app checkout>.\n!! src/lib/report/app-rating-labels.ts must equal the app labels (beton-app verify-report-label-fingerprint.cjs).\n' + '!'.repeat(78) + '\n');
  }

  // (f) Bæti-eins og grunntré (origin/main) fyrir óstimplaðar skýrslur og íslenska skýrslu með stimpli
  const baseDir = process.env.RATING_FINDINGS_BASE;
  if (baseDir) {
    const baseFixture = require(path.join(path.resolve(baseDir), 'scripts/report-fixture.cjs'));
    const nzEdited = clone(buildNzSampleRecord());
    nzEdited.ai_report_data.rooms[0].ratings[Object.keys(nzEdited.ai_report_data.rooms[0].ratings)[0]] = 'mjog_alvarleg';
    const cases = {
      'owner-case-en (unstamped)': [ownerCaseRecord(), EN_OPTS],
      'owner-case-is + stamp': [stamp(ownerCaseRecord({ locale: 'is' })), { dashboardLocale: 'is', brand: 'beton' }],
      'nzs-sample (unstamped)': [buildNzSampleRecord(), EN_OPTS],
      'nzs-sample rating-only (unstamped)': [nzEdited, EN_OPTS],
      'isop-us (unstamped)': [buildIsopSampleRecord('en-US'), EN_OPTS],
      'isop-ca (unstamped)': [buildIsopSampleRecord('en-CA'), EN_OPTS],
    };
    let n = 0;
    for (const [name, [record, opts]] of Object.entries(cases)) {
      for (const pdf of [true, false]) {
        const mine = await renderReportMarkup(clone(record), { pdf, ...opts });
        const theirs = await baseFixture.renderReportMarkup(clone(record), { pdf, ...opts });
        assert.equal(mine, theirs, `${name} pdf=${pdf} differs from base tree`);
        n++;
      }
    }
    pass(`(f) ${n} renders byte-identical to the base tree (${path.resolve(baseDir)}): ${Object.keys(cases).join(', ')}`);
  } else {
    console.log('SKIP (f) cross-tree identity (set RATING_FINDINGS_BASE=<origin/main checkout>)');
  }

  console.log(`\nverify-rating-findings: ${checks} checks passed`);
}

module.exports = { ownerCaseRecord, stamp };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
