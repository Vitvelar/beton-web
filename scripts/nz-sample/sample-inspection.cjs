/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script */
// Tilbúin NZS 4306-skoðun til sýnis og prófa — ENGIN raunveruleg eign, viðskiptavinur eða
// fyrirtæki. „12 Example Road, Mount Eden, Auckland 1024“: 1970s weatherboard-hús á
// timburstaurum. „Example Inspections Ltd“ er skáldað. ai_report_data er handskrifað eftir
// samningnum (plan/rondva/NZ-SKYRSLUSNID-HONNUN.md) — engin AI-keyrsla (layout-sýni).
// Myndir eru merktir staðgenglar (SVG), aldrei raunmyndir.
const { placeholderSvg } = require('../report-fixture.cjs');

const INSPECTION_ID = 'nz-sample-0001';

const obs = (id, category, title, description, suggestion, severity, photoLabels = []) => ({ id, category, title, description, suggestion, severity, photoLabels });

// Rými í röð skoðunar (sort_order). Slug úr samningnum (nz-*).
const ROOMS = [
  { id: 'room-site', slug: 'nz-site', name: 'Site', ratings: { site_drainage: 'danger', retaining: 'warn', paths_driveway: 'ok', fences: 'ok' }, notes: '',
    photos: ['Section from the street'],
    obs: [
      obs('obs-site-1', 'Drainage', 'Surface water ponding against the rear wall',
        'The paved area at the rear falls towards the house. Silt marks show that water ponds against the bottom of the weatherboards after rain.',
        'Re-grade the paving away from the house or install a channel drain connected to the stormwater system.', 'alvarleg', ['Rear paving and silt line']),
      obs('obs-site-2', 'Retaining', 'Timber retaining wall leaning outward',
        'The timber retaining wall along the eastern boundary leans outward in places and two sleepers are softening at ground level.',
        'Monitor the wall and replace the decayed sleepers. Seek advice from a chartered engineer if movement continues.', 'athugasemd'),
    ] },
  { id: 'room-ext', slug: 'nz-exterior', name: 'Exterior', ratings: { weatherboards: 'danger', ground_clearance: 'warn', joinery: 'warn', flashings: 'ok', sealants: 'warn', paint: 'warn' }, notes: 'Bevel-back timber weatherboards, painted. Aluminium joinery to the living room, original timber joinery elsewhere.',
    photos: ['North elevation', 'South elevation'],
    obs: [
      obs('obs-ext-1', 'Cladding', 'Decayed weatherboards on the south elevation',
        'Paint has failed on the lower weatherboards of the south elevation. A probe test found soft timber in the two lowest boards below the bathroom window.',
        'Replace the decayed boards, check the framing behind them, then prime and repaint.', 'alvarleg', ['Soft lower boards, south elevation']),
      obs('obs-ext-2', 'Joinery', 'Deteriorated putty and paint on timber window joinery',
        'Glazing putty is cracked and missing on several timber windows and the sill paint is flaking.',
        'Re-putty and repaint the timber joinery as part of routine maintenance.', 'athugasemd'),
    ] },
  { id: 'room-roof', slug: 'nz-roof', name: 'Roof', ratings: { roof_covering: 'danger', roof_flashings: 'danger', spouting: 'warn', downpipes: 'ok' }, notes: 'Corrugated long-run iron, painted. Viewed from a ladder at the eaves.',
    photos: ['Roof from the eaves'],
    obs: [
      obs('obs-roof-1', 'Roof covering', 'Corrosion around the flue penetration',
        'There is rust at the sheet laps around the old flue and the sealant around the flue flashing is cracked.',
        'Have a roofer replace the corroded sheet section and re-flash the penetration.', 'alvarleg', ['Corrosion at flue']),
      obs('obs-roof-2', 'Spouting', 'Spouting blocked with leaking joints',
        'The spouting on the west side holds leaves and water, and two joints drip.',
        'Clear the spouting and reseal the leaking joints.', 'athugasemd'),
    ] },
  { id: 'room-roofspace', slug: 'nz-roof-space', name: 'Roof space', ratings: { roof_framing: 'ok', ceiling_insulation: 'warn', sarking: 'na', roof_space_wiring: 'ok' }, notes: '',
    obs: [
      obs('obs-rs-1', 'Insulation', 'Ceiling insulation thin and displaced',
        'The ceiling insulation is thin and has been pushed aside near the hatch and over the hallway.',
        'Top up and relay the ceiling insulation.', 'athugasemd'),
      obs('obs-rs-2', 'Moisture', 'Old water staining on framing at the flue',
        'Framing at the base of the old flue shows water staining. A reading of 40 on the relative scale was taken there and the timber was dry at the time of inspection.',
        'Recheck after the flue flashing has been repaired.', 'athugasemd'),
    ] },
  { id: 'room-subfloor', slug: 'nz-subfloor', name: 'Subfloor', ratings: { piles: 'mjog_alvarleg', bearers_joists: 'danger', subfloor_ventilation: 'warn', ground_cover: 'warn', subfloor_insulation: 'warn' }, notes: 'Timber piles on concrete pads. Access through the hatch in the laundry.',
    photos: ['Subfloor from the hatch'],
    obs: [
      obs('obs-sub-1', 'Structure', 'Leaning piles and dropped bearer under the bathroom',
        'Three timber piles under the bathroom lean noticeably and two are not fixed to the bearer above. The bearer has dropped by about 15 mm at this point.',
        'Engage a licensed building practitioner to re-pile and re-fix the bearer. A structural engineer should be consulted if more movement is found.', 'mjog_alvarleg', ['Leaning piles under bathroom']),
      obs('obs-sub-2', 'Moisture', 'No ground cover and damp soil below the bathroom',
        'There is no polythene ground cover. The soil below the bathroom area looked damp and there was a musty smell.',
        'Lay a polythene ground vapour barrier and check the subfloor ventilation once the leak investigation is complete.', 'athugasemd'),
    ] },
  { id: 'room-kitchen', slug: 'nz-kitchen', name: 'Kitchen', ratings: { linings: 'ok', ceilings: 'ok', floors: 'ok', fixtures: 'danger', extraction: 'ok' }, notes: '',
    obs: [
      obs('obs-kit-1', 'Plumbing', 'Slow leak from the sink waste',
        'The waste trap under the sink drips slowly and the cabinet base has swollen. Meter reading 19% WME in the cabinet base.',
        'Have a plumber repair the waste and replace the swollen cabinet base.', 'alvarleg', ['Under-sink cabinet']),
    ] },
  { id: 'room-bath', slug: 'nz-bathroom', name: 'Bathroom', ratings: { linings: 'mjog_alvarleg', floors: 'warn', wet_area_linings: 'mjog_alvarleg', fixtures: 'warn', extraction: 'warn' }, notes: 'Tiled shower over an acrylic tray, original 1970s layout.',
    photos: ['Shower and vanity'],
    obs: [
      obs('obs-bath-1', 'Moisture', 'Elevated moisture at the base of the shower wall',
        'Non-invasive testing found elevated moisture: 24% WME at the base of the shower wall beside the mixer. Tile grout is cracked and the silicone at the tray junction has failed.',
        'Engage a specialist for invasive moisture testing, then repair the shower waterproofing and any damaged framing.', 'mjog_alvarleg', ['Shower wall base', 'Failed silicone at tray']),
    ] },
  { id: 'room-living', slug: 'nz-living', name: 'Living', ratings: { linings: 'ok', ceilings: 'ok', floors: 'ok', doors: 'ok', windows: 'ok' }, notes: '', obs: [] },
  { id: 'room-bed2', slug: 'nz-bedroom-2', name: 'Bedroom 2', ratings: { linings: 'danger', ceilings: 'ok', floors: 'ok', windows: 'danger' }, notes: '',
    obs: [
      obs('obs-bed2-1', 'Moisture', 'Moisture below the bedroom window',
        'The lining below the window shows bubbling paint. Reading 95 on the relative scale at the bottom of the window jamb — wet.',
        'Have the window flashing and the framing below the window investigated, then repair as needed.', 'alvarleg', ['Bedroom 2 window jamb']),
    ] },
  { id: 'room-services', slug: 'nz-services', name: 'Services', ratings: { switchboard: 'ok', smoke_alarms: 'warn', hot_water_cylinder: 'danger', plumbing_visible: 'ok', heating: 'ok' }, notes: 'Low-pressure electric hot water cylinder in the hallway cupboard. Heat pump in the living room.',
    obs: [
      obs('obs-svc-1', 'Plumbing', 'Hot water cylinder not seismically restrained',
        'The hot water cylinder has no seismic restraint straps.',
        'Have a plumber fit seismic restraints to the cylinder.', 'alvarleg'),
    ] },
];

const NZS4306_CONDITIONS = {
  occupancy: 'occupied',
  furnished: 'furnished',
  weather: 'Fine, 14 °C. Dry for the previous two days.',
  areas: { site: 'yes', subfloor: 'limited', exterior: 'yes', roof_exterior: 'limited', roof_space: 'limited', interior: 'yes', services: 'yes', accessory: 'na' },
  limitations:
    'Subfloor: entered through the laundry hatch. The north-east corner under the bathroom has less than 300 mm clearance and was viewed by torch only.\n' +
    'Roof: viewed from a ladder at the eaves on the north and west sides; the south slope was viewed from the ground.\n' +
    'Roof space: viewed from the hatch only, as walking boards were not available.\n' +
    'Interior: the house was furnished and occupied. Furniture, floor coverings and stored items limited the inspection of some wall linings and floors.',
  meter: 'Trotec T660, relative scale 0–200; % WME readings in wood mode.',
};

const AI_SUMMARY = {
  introduction:
    'This report records a visual inspection of 12 Example Road, Mount Eden, Auckland, carried out on 5/10/2026 at the request of the client. The house was occupied and furnished at the time of inspection.',
  property_description:
    'A single-storey detached house built in about 1974, clad in bevel-back timber weatherboards with a corrugated long-run iron roof. The house sits on timber piles with a suspended timber floor. Joinery is a mix of original timber and later aluminium windows.',
  conclusion:
    'The house is generally in a condition consistent with its age, but two significant defects were found: moisture at the base of the shower wall and leaning piles below the bathroom. These should be investigated and repaired before or soon after purchase. Several other defects relate to weathertightness and drainage around the south and rear walls, and there is a normal level of maintenance to plan for.',
};

const NZS4306 = {
  significant_defects_summary:
    'Two significant defects were recorded. Elevated moisture at the base of the shower wall indicates that the shower waterproofing has failed, and the piles below the bathroom have moved so that the bearer has dropped. Both need prompt investigation by suitable specialists.',
  maintenance_summary:
    'Normal gradual deterioration was noted for a house of this age. Plan for repainting and re-puttying timber joinery, clearing and resealing the spouting, topping up ceiling insulation, laying a subfloor ground cover and maintaining the eastern retaining wall.',
  moisture_readings: [
    { source_id: 'obs-bath-1', location: 'Base of shower wall beside the mixer, bathroom', reading: '24', unit: '% WME', assessment: 'elevated' },
    { source_id: 'obs-kit-1', location: 'Cabinet base under the kitchen sink', reading: '19', unit: '% WME', assessment: '' },
    { source_id: 'obs-bed2-1', location: 'Bottom of the window jamb, bedroom 2', reading: '95', unit: 'relative', assessment: 'wet' },
    { source_id: 'obs-rs-2', location: 'Framing at the base of the old flue, roof space', reading: '40', unit: 'relative', assessment: 'dry' },
  ],
  conditions: NZS4306_CONDITIONS,
  disclosure: { inspector: 'Jordan Sample', company: 'Example Inspections Ltd', model: 'none (hand-written layout sample, no AI)', generated_at: '2026-10-05T20:30:00Z' },
};

function buildNzSampleRecord() {
  const inspection = {
    address: '12 Example Road, Mount Eden', postal_code: '1024', municipality: 'Auckland', fastanumer: '',
    customer_name: 'A. Sample Buyer', inspection_date: '2026-10-05', weather: 'Fine', attendees: ['A. Sample Buyer', 'Listing agent'],
    property_data: { tegund: 'Detached house, timber weatherboard on timber piles', staerd_m2: 118, byggingarar: 1974, inspectorName: 'Jordan Sample', nzs4306: NZS4306_CONDITIONS },
    lookup_failed: true,
  };
  const reportRooms = ROOMS.map((r, i) => ({
    name: r.name, slug: r.slug, sort_order: i, ratings: r.ratings, notes: r.notes,
    observations: r.obs.map((o, j) => ({ id: o.id, number: `${i + 2}.${j + 1}`, category: o.category, title: o.title, description: o.description, suggestion: o.suggestion, severity: o.severity })),
  }));
  const ai_report_data = { report_locale: 'en', rating_scheme: 'nz_terms', report_standard: 'nzs_4306', inspection, ai_summary: AI_SUMMARY, rooms: reportRooms, nzs4306: NZS4306 };
  const photo = (id, label, { room = null, obsId = null, cover = false, sort = 0 } = {}) =>
    ({ id, storage_path: `nz-sample/${id}.svg`, photo_type: 'normal', caption: label, is_cover: cover, sort_order: sort, room_id: room, observation_id: obsId, label });
  const dbRooms = ROOMS.map((r, i) => ({
    id: r.id, name: r.name, slug: r.slug, sort_order: i, ratings: r.ratings, notes: r.notes,
    photos: (i === 0 ? [photo('cover', 'Front of house (street view)', { room: r.id, cover: true })] : [])
      .concat((r.photos ?? []).map((label, k) => photo(`${r.id}-p${k + 1}`, label, { room: r.id, sort: k + 1 }))),
    observations: r.obs.map((o, j) => ({
      id: o.id, observation_number: `${i + 2}.${j + 1}`, category: o.category, title: o.title, description: o.description, suggestion: o.suggestion, severity: o.severity, sort_order: j,
      photos: o.photoLabels.map((label, k) => photo(`${o.id}-p${k + 1}`, label, { obsId: o.id, sort: k })),
    })),
  }));
  return {
    id: INSPECTION_ID, local_id: `local-${INSPECTION_ID}`, ...inspection, ai_report_data, ai_summary: AI_SUMMARY.conclusion.split('.')[0],
    ai_cost_usd: 0, ai_model: null, report_generated_at: '2026-10-05T21:00:00Z',
    inspectors: {
      full_name: 'Jordan Sample', company_name: 'Example Inspections Ltd', company_logo_url: null,
      company_terms_url: 'https://example.com/terms',
      company_terms_text: 'Sample terms only. A real company replaces this text with its own terms and conditions of engagement.',
      qualifications: 'NZIBI member, LBP 000000 (sample)',
    },
    rooms: dbRooms,
  };
}

/** Staðgengilsmyndir fyrir allar myndir sýnisins: slóð → { type, body }. */
function samplePhotos(record) {
  const out = {};
  const palette = ['#7d8f69', '#8a7f72', '#6b7f8e', '#9a8a6a', '#7a6f8e'];
  let n = 0;
  for (const room of record.rooms) {
    for (const p of [...room.photos, ...room.observations.flatMap(o => o.photos)]) {
      out[p.storage_path] = { type: 'image/svg+xml', body: placeholderSvg(p.label, { fill: palette[n++ % palette.length], width: p.is_cover ? 1200 : 800, height: p.is_cover ? 700 : 600 }) };
    }
  }
  return out;
}

module.exports = { buildNzSampleRecord, samplePhotos, INSPECTION_ID };
