// isop-kerfaskrá: tíu kerfi í þekktri norður-amerískri röð + „Additional items“.
// Samningur: plan/rondva/ISOP-SNID-HONNUN.md §2.1 (röð, rými, matslyklar, describe-reitir) og §2.2–2.3 (status, hugtök).
// Aðeins kaflaheiti og röð kerfa; enginn texti úr InterNACHI/ASHI/CSA-stöðlum er afritaður. [YFIRLESTUR: allt hér að neðan]
// BÆTI FYRIR BÆTI eins og beton-web src/lib/report/systems/catalog-isop.ts.

import { SYSTEM_STATUS_LABELS } from './types';
import type { SystemCatalog, SystemDef, SystemDescribeField, SystemStatus } from './types';

const ISOP_STATUSES: readonly SystemStatus[] = ['inspected', 'not_inspected', 'not_present'];

function field(key: string, label: string, suggestions: readonly string[] = []): SystemDescribeField {
  return { key, label, suggestions };
}

export const ISOP_SYSTEM_KEYS = [
  'roof',
  'exterior',
  'structure',
  'heating',
  'cooling',
  'plumbing',
  'electrical',
  'fireplace',
  'attic',
  'interior',
  'additional',
] as const;
export type IsopSystemKey = (typeof ISOP_SYSTEM_KEYS)[number];

export const ISOP_SLUG_PREFIX = 'isop-';
export const ISOP_FALLBACK_KEY = 'additional';

const SYSTEMS: readonly SystemDef[] = [
  {
    key: 'roof',
    label: 'Roof',
    order: 1,
    roomBases: ['isop-roof'],
    ratingKeys: ['roof_covering', 'flashings', 'penetrations_skylights', 'gutters_downspouts', 'chimney_exterior'],
    describe: [
      field('covering_type', 'Roof covering type'),
      field('inspection_method', 'Inspection method', ['Ground', 'Ladder at eave', 'Walked', 'Drone', 'Binoculars']),
    ],
    allowedStatuses: ISOP_STATUSES,
    statusRequired: true,
  },
  {
    key: 'exterior',
    label: 'Exterior',
    order: 2,
    roomBases: ['isop-exterior', 'isop-deck', 'isop-porch'],
    ratingKeys: [
      'wall_covering',
      'trim_eaves_soffit_fascia',
      'exterior_doors',
      'windows_exterior',
      'walkways_driveway',
      'steps_stairs_railings',
      'decks_balconies_porches',
      'grading_drainage',
      'retaining_walls',
    ],
    describe: [field('wall_covering_type', 'Wall covering type')],
    allowedStatuses: ISOP_STATUSES,
    statusRequired: true,
  },
  {
    key: 'structure',
    label: 'Basement, Foundation, Crawlspace & Structure',
    order: 3,
    roomBases: ['isop-structure', 'isop-basement', 'isop-crawlspace'],
    ratingKeys: [
      'foundation',
      'basement_walls_floor',
      'crawlspace',
      'floor_structure',
      'wall_structure',
      'roof_structure',
      'moisture_intrusion',
    ],
    describe: [
      field('foundation_type', 'Foundation type'),
      field('floor_structure_type', 'Floor structure type'),
      field('crawlspace_access', 'Crawlspace access', ['Entered', 'Viewed from hatch', 'No access']),
    ],
    allowedStatuses: ISOP_STATUSES,
    statusRequired: true,
  },
  {
    key: 'heating',
    label: 'Heating',
    order: 4,
    roomBases: ['isop-heating'],
    ratingKeys: ['heating_equipment', 'energy_source', 'distribution', 'venting_flue', 'thermostat'],
    describe: [field('heating_type', 'Heating type'), field('energy_source', 'Energy source'), field('location', 'Location')],
    allowedStatuses: ISOP_STATUSES,
    statusRequired: true,
  },
  {
    key: 'cooling',
    label: 'Cooling',
    order: 5,
    roomBases: ['isop-cooling'],
    ratingKeys: ['cooling_equipment', 'condensate', 'distribution', 'thermostat'],
    describe: [field('cooling_type', 'Cooling type'), field('energy_source', 'Energy source')],
    allowedStatuses: ISOP_STATUSES,
    statusRequired: true,
  },
  {
    key: 'plumbing',
    label: 'Plumbing',
    order: 6,
    roomBases: ['isop-plumbing', 'isop-water-heater'],
    ratingKeys: [
      'main_shutoff',
      'supply_piping',
      'drain_waste_vent',
      'water_heater',
      'tpr_valve',
      'fuel_shutoff',
      'sump_pump',
      'fixtures_general',
    ],
    describe: [
      field('main_shutoff_location', 'Main shutoff location'),
      field('supply_material', 'Supply piping material'),
      field('drain_material', 'Drain piping material'),
      field('water_heater_type', 'Water heater type'),
      field('water_heater_energy', 'Water heater energy source'),
      field('fuel_shutoff_location', 'Fuel shutoff location'),
    ],
    allowedStatuses: ISOP_STATUSES,
    statusRequired: true,
  },
  {
    key: 'electrical',
    label: 'Electrical',
    order: 7,
    roomBases: ['isop-electrical'],
    ratingKeys: [
      'service_entrance',
      'main_panel',
      'subpanels',
      'branch_wiring',
      'grounding_bonding',
      'gfci_afci',
      'outlets_switches',
      'smoke_co_alarms',
    ],
    describe: [
      field('service_type', 'Service type', ['Overhead', 'Underground']),
      // Texti skoðunarmanns (t.d. amper); aldrei reiknað eða sjálfgefið.
      field('service_rating', 'Service rating'),
      field('panel_location', 'Panel location'),
      field('wiring_type', 'Wiring type'),
    ],
    allowedStatuses: ISOP_STATUSES,
    statusRequired: true,
  },
  {
    key: 'fireplace',
    label: 'Fireplace',
    order: 8,
    roomBases: ['isop-fireplace'],
    ratingKeys: ['firebox', 'damper', 'chimney_flue', 'hearth', 'gas_log_insert'],
    describe: [field('fireplace_type', 'Fireplace type', ['Masonry', 'Factory-built', 'Insert', 'Stove'])],
    allowedStatuses: ISOP_STATUSES,
    statusRequired: true,
  },
  {
    key: 'attic',
    label: 'Attic, Insulation & Ventilation',
    order: 9,
    roomBases: ['isop-attic'],
    ratingKeys: ['attic_access', 'insulation', 'ventilation', 'vapor_retarder', 'exhaust_fans'],
    describe: [
      field('access_method', 'Access method'),
      field('insulation_type', 'Insulation type'),
      field('insulation_depth', 'Insulation depth'),
      field('ventilation_type', 'Ventilation type'),
    ],
    allowedStatuses: ISOP_STATUSES,
    statusRequired: true,
  },
  {
    key: 'interior',
    label: 'Doors, Windows & Interior',
    order: 10,
    roomBases: [
      'isop-living',
      'isop-family',
      'isop-dining',
      'isop-kitchen',
      'isop-bedroom',
      'isop-bathroom',
      'isop-half-bath',
      'isop-laundry',
      'isop-hallway',
      'isop-stairs',
      'isop-garage',
    ],
    ratingKeys: [
      'walls',
      'ceilings',
      'floors',
      'doors',
      'windows',
      'stairs_railings',
      'cabinets_counters',
      'fixtures',
      'garage_door_opener',
    ],
    describe: [],
    allowedStatuses: ISOP_STATUSES,
    statusRequired: true,
  },
  {
    // Sérsniðin rými sem passa engu kerfi (og tæki, sundlaug o.fl.). Enginn status, ekki skylda.
    key: ISOP_FALLBACK_KEY,
    label: 'Additional items',
    order: 11,
    roomBases: [],
    ratingKeys: [],
    describe: [],
    allowedStatuses: [],
    statusRequired: false,
  },
];

export const ISOP_CATALOG: SystemCatalog = {
  id: 'isop',
  slugPrefix: ISOP_SLUG_PREFIX,
  systems: SYSTEMS,
  fallbackKey: ISOP_FALLBACK_KEY,
};

/**
 * Hugtök í birtingu `isop_terms` (aðeins birting; geymd gildi breytast aldrei). Okkar eigin orð. [YFIRLESTUR]
 * Gallataflan raðast safety → major → repair; maintenance er sér listi.
 */
export const ISOP_TERMS = {
  status: SYSTEM_STATUS_LABELS,
  deficiency: 'Deficiency',
  category: {
    safety: 'Safety hazard',
    major: 'Major defect',
    repair: 'Repair or replace',
    maintenance: 'Maintenance',
  },
  furtherEvaluation: 'Further evaluation recommended',
} as const;
