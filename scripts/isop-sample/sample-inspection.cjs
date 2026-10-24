/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script */
// Tilbúin isop-skoðun (Bandaríkin) til sýnis og prófa — ENGIN raunveruleg eign, viðskiptavinur eða fyrirtæki.
// „123 Example Street, Anytown, IL 60000“ (utan Texas): 1960s ranch á loftræstu skriðrými, gasofn, miðlæg loftkæling
// (ekki skoðuð, kalt úti), gasvatnshitari, 100 A tafla, enginn arinn. „Example Home Inspections LLC“ og „Jordan Sample“
// eru skáldað. ai_report_data er handskrifað eftir samningnum (plan/rondva/ISOP-SNID-HONNUN.md §3.6) — engin AI-keyrsla
// (layout-sýni). Myndir eru merktir staðgenglar (SVG), aldrei raunmyndir. Allur texti er merktur sem sýni.
const { placeholderSvg } = require('../report-fixture.cjs');

const INSPECTION_ID = 'isop-sample-0001';

const obs = (id, category, title, description, suggestion, severity, photoLabels = []) => ({ id, category, title, description, suggestion, severity, photoLabels });

// Rými í röð skoðunar (sort_order). Slug úr samningnum (isop-*).
const ROOMS = [
  { id: 'room-roof', slug: 'isop-roof', name: 'Roof',
    ratings: { roof_covering: 'danger', flashings: 'ok', penetrations_skylights: 'ok', gutters_downspouts: 'warn', chimney_exterior: 'na' },
    notes: 'Architectural asphalt shingles, about 15 years old according to the seller.',
    photos: ['Roof, south slope'],
    obs: [
      obs('obs-roof-1', 'Roof covering', 'Cracked and missing shingles on the south slope',
        'Several shingles are cracked or missing along the south slope near the ridge. The underlayment below them is exposed and weathered.',
        'Have a licensed roofing contractor replace the damaged shingles and check the underlayment and decking beneath them.', 'alvarleg', ['Missing shingles near the ridge']),
      obs('obs-roof-2', 'Gutters', 'Gutters partly clogged with debris',
        'Leaves and shingle granules have built up in the gutters on the north and west sides, and one downspout does not drain freely.',
        'Clean the gutters and downspouts as part of routine maintenance.', 'athugasemd'),
    ] },
  { id: 'room-ext', slug: 'isop-exterior', name: 'Exterior',
    ratings: { wall_covering: 'ok', trim_eaves_soffit_fascia: 'warn', exterior_doors: 'ok', windows_exterior: 'ok', walkways_driveway: 'ok', grading_drainage: 'danger' },
    notes: 'Brick veneer walls with painted wood trim.',
    photos: ['Front of house'],
    obs: [
      obs('obs-ext-1', 'Trim', 'Peeling paint on wood trim and fascia',
        'Paint is peeling on the fascia boards and on the trim around the garage door. The wood underneath is dry and firm where it was probed.',
        'Scrape, prime and repaint the trim to keep moisture out of the wood.', 'athugasemd'),
      obs('obs-ext-2', 'Grading', 'Ground slopes toward the foundation at the northeast corner',
        'The soil at the northeast corner slopes toward the house. Staining on the lower bricks suggests water collects there after rain.',
        'Re-grade the soil so that it slopes away from the foundation, and extend the downspout discharge away from the wall.', 'alvarleg', ['Northeast corner grading']),
    ] },
  { id: 'room-deck', slug: 'isop-deck', name: 'Rear deck',
    ratings: { decks_balconies_porches: 'danger', steps_stairs_railings: 'danger' },
    notes: 'Pressure-treated wood deck, about 12 by 14 feet, with a stair to the yard.',
    obs: [
      obs('obs-deck-1', 'Railings', 'Guard rail on the rear deck moves under light pressure',
        'Two guard rail posts are loose at their connection to the deck frame, and the rail moves when pushed by hand. The deck surface is about 4 feet above grade.',
        'Do not lean on the rail or let children use the deck until a qualified deck contractor has repaired it.', 'alvarleg', ['Loose rail post']),
    ] },
  { id: 'room-crawl', slug: 'isop-crawlspace', name: 'Crawlspace',
    ratings: { foundation: 'warn', crawlspace: 'mjog_alvarleg', floor_structure: 'ok', moisture_intrusion: 'mjog_alvarleg' },
    notes: 'Vented crawlspace with concrete block walls and a dirt floor covered in part by plastic sheeting.',
    photos: ['Crawlspace from the access hatch'],
    obs: [
      obs('obs-crawl-1', 'Moisture', 'Standing water and wet insulation in the crawlspace',
        'Standing water about 1 inch deep was seen near the north wall. The fiberglass insulation between the floor joists is wet and sagging in that area.',
        'Have a licensed drainage or waterproofing contractor find the source of the water and correct it before the crawlspace is cleaned up and the insulation is replaced.', 'mjog_alvarleg', ['Standing water, north wall', 'Wet insulation between joists']),
      obs('obs-crawl-2', 'Foundation', 'Hairline cracks in the foundation wall',
        'Hairline vertical cracks were seen in the east block wall. No displacement was noted.',
        'Monitor the cracks and have them looked at again if they widen.', 'athugasemd'),
    ] },
  { id: 'room-heat', slug: 'isop-heating', name: 'Heating',
    ratings: { heating_equipment: 'danger', distribution: 'ok', venting_flue: 'ok', thermostat: 'ok' },
    notes: '',
    obs: [
      obs('obs-heat-1', 'Heating equipment', 'Rust and soot staining in the furnace burner compartment',
        'There is rust on the burner compartment floor and soot staining around two of the burners. The furnace ran and produced heat during the inspection.',
        'Have a licensed HVAC contractor service the furnace and evaluate the cause of the staining.', 'alvarleg', ['Burner compartment']),
      obs('obs-heat-2', 'Heating equipment', 'Furnace air filter is dirty',
        'The air filter is heavily loaded with dust.',
        'Replace the filter now and then every one to three months.', 'athugasemd'),
    ] },
  { id: 'room-cool', slug: 'isop-cooling', name: 'Cooling', ratings: {}, notes: '', obs: [] },
  { id: 'room-plumb', slug: 'isop-plumbing', name: 'Plumbing',
    ratings: { main_shutoff: 'ok', supply_piping: 'ok', drain_waste_vent: 'ok', fixtures_general: 'danger' },
    notes: 'Copper supply piping, plastic drain piping.',
    obs: [
      obs('obs-plumb-1', 'Fixtures', 'Slow drip at the kitchen sink drain trap',
        'The slip nut on the kitchen sink trap drips when the sink drains. The cabinet floor below it is stained and slightly swollen.',
        'Have a licensed plumber tighten or replace the trap connection, and replace the damaged cabinet base if it does not dry out.', 'alvarleg', ['Under-sink trap']),
    ] },
  { id: 'room-wh', slug: 'isop-water-heater', name: 'Water heater',
    ratings: { water_heater: 'ok', tpr_valve: 'danger', fuel_shutoff: 'ok' },
    notes: '40-gallon natural gas water heater in the garage.',
    obs: [
      obs('obs-wh-1', 'Water heater', 'Relief valve discharge pipe is too short',
        'The temperature and pressure relief valve discharge pipe ends about 2 feet above the floor and is not turned down toward it.',
        'Have a licensed plumber extend the discharge pipe so that it ends within a few inches of the floor.', 'alvarleg', ['Relief valve discharge pipe']),
    ] },
  { id: 'room-elec', slug: 'isop-electrical', name: 'Electrical',
    ratings: { service_entrance: 'ok', main_panel: 'mjog_alvarleg', branch_wiring: 'ok', gfci_afci: 'danger', outlets_switches: 'warn', smoke_co_alarms: 'ok' },
    notes: 'Main panel in the garage, 100 amp main breaker.',
    photos: ['Main panel'],
    obs: [
      obs('obs-elec-1', 'Panel', 'Signs of overheating at a breaker in the main panel',
        'Discoloration and heat marks were seen on one breaker and its wire in the main panel. The panel cover was removed for the inspection.',
        'Have a licensed electrician evaluate the panel and repair or replace the affected parts before further use of that circuit.', 'mjog_alvarleg', ['Heat marks at breaker']),
      obs('obs-elec-2', 'Protection', 'Kitchen and bathroom receptacles lack GFCI protection',
        'The receptacles at the kitchen counter and in the bathroom did not trip when tested with a GFCI tester and no GFCI breaker was found in the panel.',
        'Have a licensed electrician add GFCI protection to the kitchen and bathroom circuits.', 'alvarleg'),
    ] },
  { id: 'room-fire', slug: 'isop-fireplace', name: 'Fireplace', ratings: {}, notes: '', obs: [] },
  { id: 'room-attic', slug: 'isop-attic', name: 'Attic',
    ratings: { attic_access: 'ok', insulation: 'warn', ventilation: 'ok' },
    notes: '',
    obs: [
      obs('obs-attic-1', 'Insulation', 'Attic insulation is thin and uneven',
        'The attic floor insulation is thin over the hallway and has been pushed aside near the hatch.',
        'Add insulation and level it as part of routine upgrades.', 'athugasemd'),
    ] },
  { id: 'room-kitchen', slug: 'isop-kitchen', name: 'Kitchen',
    ratings: { walls: 'ok', floors: 'ok', cabinets_counters: 'warn', windows: 'ok' },
    notes: '',
    obs: [
      obs('obs-kit-1', 'Cabinets', 'Loose cabinet door hinge and sticking drawer',
        'One upper cabinet door has a loose hinge and the top drawer next to the stove sticks.',
        'Tighten the hinge screws and adjust or lubricate the drawer slides.', 'athugasemd'),
    ] },
  { id: 'room-bath', slug: 'isop-bathroom', name: 'Bathroom',
    ratings: { walls: 'ok', floors: 'ok', fixtures: 'warn' },
    notes: '',
    obs: [
      obs('obs-bath-1', 'Fixtures', 'Worn caulk around the bathtub',
        'The caulk at the tub and wall junction is cracked and discolored.',
        'Remove the old caulk and apply new tub-and-tile sealant.', 'athugasemd'),
    ] },
  { id: 'room-bed', slug: 'isop-bedroom', name: 'Primary bedroom', ratings: { walls: 'ok', ceilings: 'ok', floors: 'ok', doors: 'ok', windows: 'ok' }, notes: '', obs: [] },
  { id: 'room-garage', slug: 'isop-garage', name: 'Garage', ratings: { walls: 'ok', floors: 'ok', doors: 'ok', garage_door_opener: 'ok' }, notes: 'Attached two-car garage.', obs: [] },
];

const SYSTEMS = {
  v: 1,
  items: {
    roof: { status: 'inspected', limitations: 'The north slope was viewed from the ground with binoculars; the south slope was viewed from a ladder at the eave.',
      describe: { covering_type: 'Asphalt shingles (architectural)', inspection_method: 'Ladder at eave' } },
    exterior: { status: 'inspected', describe: { wall_covering_type: 'Brick veneer with painted wood trim' } },
    structure: { status: 'inspected', limitations: 'The part of the crawlspace under the kitchen has less than 18 inches of clearance and was viewed from a distance.',
      describe: { foundation_type: 'Concrete block walls, vented crawlspace', floor_structure_type: 'Wood joists', crawlspace_access: 'Entered' } },
    heating: { status: 'inspected', describe: { heating_type: 'Forced-air furnace', energy_source: 'Natural gas', location: 'Hall closet' } },
    cooling: { status: 'not_inspected', reason: 'The outdoor temperature was below 60 °F at the time of the inspection, so the air conditioner was not operated.' },
    plumbing: { status: 'inspected', describe: { main_shutoff_location: 'Utility room wall', supply_material: 'Copper', drain_material: 'Plastic (PVC and ABS)', water_heater_type: 'Tank, 40 gallons', water_heater_energy: 'Natural gas', fuel_shutoff_location: 'Garage, at the water heater' } },
    electrical: { status: 'inspected', describe: { service_type: 'Overhead', service_rating: '100 A', panel_location: 'Garage', wiring_type: 'Copper, non-metallic sheathed cable' } },
    fireplace: { status: 'not_present' },
    attic: { status: 'inspected', limitations: 'Viewed from the hatch, because there are no walking boards.',
      describe: { access_method: 'Hallway hatch', insulation_type: 'Blown fiberglass', insulation_depth: 'About 6 in. where measured', ventilation_type: 'Gable vents' } },
    interior: { status: 'inspected' },
  },
  room_map: {},
};

const CONDITIONS = {
  state: 'IL',
  occupancy: 'occupied',
  furnished: 'partly',
  size_sqft: '1850',
  limitations:
    'The house was occupied and partly furnished. Furniture, floor coverings and stored items limited the view of some walls and floors.\n' +
    'Hidden plumbing and electrical components inside walls were not inspected.',
  agreement_ref: 'Pre-inspection agreement signed 10/12/2026 (sample)',
};

const TAGS = { 'obs-deck-1': ['safety_hazard'], 'obs-crawl-1': ['further_evaluation'], 'obs-heat-1': ['further_evaluation'], 'obs-elec-1': ['further_evaluation'] };

const AI_SUMMARY = {
  introduction:
    'This report records a visual inspection of 123 Example Street, Anytown, IL, carried out on 10/13/2026 at the request of the client. The house was occupied and partly furnished. Every name, address and finding in this sample is invented to show the report layout.',
  property_description:
    'A single-story ranch house built about 1964, with brick veneer walls, an asphalt shingle roof and a vented crawlspace. Heating is a gas forced-air furnace and the water heater is gas. There is a 100 amp electrical service and an attached two-car garage.',
  conclusion:
    'The most urgent items are one safety hazard and two major defects. The guard rail on the rear deck is loose. Standing water and wet insulation were found in the crawlspace, and one breaker in the main panel showed heat marks. A qualified deck contractor, a drainage or waterproofing contractor and a licensed electrician should look at these. Six more items need repair or replacement, among them the roof shingles, the grading at the northeast corner and the furnace burner compartment. Seven items are routine maintenance. The air conditioner was not operated because of the cold weather.',
};

const ISOP = {
  deficiencies_summary:
    'One safety hazard, two major defects and six repair items were recorded. The safety hazard is the loose guard rail on the rear deck. The major defects are the standing water in the crawlspace and the heat marks at a breaker in the main panel.',
  maintenance_summary:
    'Seven maintenance items were recorded, such as cleaning the gutters, repainting the trim, replacing the furnace filter and adding attic insulation.',
  systems: SYSTEMS,
  conditions: CONDITIONS,
  tags: TAGS,
  disclosure: { inspector: 'Jordan Sample', company: 'Example Home Inspections LLC', model: 'none (hand-written layout sample, no AI)', generated_at: '2026-10-14T01:30:00Z' },
};

function buildIsopSampleRecord() {
  const inspection = {
    address: '123 Example Street', postal_code: '60000', municipality: 'Anytown', fastanumer: '',
    customer_name: 'A. Sample Buyer', inspection_date: '2026-10-13', weather: 'Dry, 52 °F', attendees: ['A. Sample Buyer', 'Buyer’s agent'],
    property_data: { tegund: 'Single-family ranch, brick veneer on a vented crawlspace', staerd_m2: 172, byggingarar: 1964, inspectorName: 'Jordan Sample', systems: SYSTEMS, isop: CONDITIONS },
    lookup_failed: true,
  };
  const reportRooms = ROOMS.map((r, i) => ({
    id: r.id, name: r.name, slug: r.slug, sort_order: i, ratings: r.ratings, notes: r.notes,
    observations: r.obs.map((o, j) => ({ id: o.id, number: `${i + 2}.${j + 1}`, category: o.category, title: o.title, description: o.description, suggestion: o.suggestion, severity: o.severity })),
  }));
  const ai_report_data = { report_locale: 'en', rating_scheme: 'isop_terms', report_standard: 'isop', english_variant: 'en-US', inspection, ai_summary: AI_SUMMARY, rooms: reportRooms, isop: ISOP };
  const photo = (id, label, { room = null, obsId = null, cover = false, sort = 0 } = {}) =>
    ({ id, storage_path: `isop-sample/${id}.svg`, photo_type: 'normal', caption: label, is_cover: cover, sort_order: sort, room_id: room, observation_id: obsId, label });
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
    ai_cost_usd: 0, ai_model: null, report_generated_at: '2026-10-14T02:00:00Z',
    inspectors: {
      full_name: 'Jordan Sample', company_name: 'Example Home Inspections LLC', company_logo_url: null,
      company_terms_url: 'https://example.com/terms',
      company_terms_text: 'These are sample terms. A real company replaces this text with its own terms and conditions of engagement, including any statements its state or province requires.',
      qualifications: 'IL Home Inspector License 450.000000 (sample)',
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

module.exports = { buildIsopSampleRecord, samplePhotos, INSPECTION_ID };
