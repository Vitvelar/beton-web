// NZS 4306:2005 — rými (slug), kaflar skýrslunnar og matslyklar með enskum (NZ) heitum.
// Samningur: plan/rondva/NZ-SKYRSLUSNID-HONNUN.md („Rými/einingar“). Þessi skrá á að vera
// BÆTI FYRIR BÆTI eins og beton-app lib/report/nz-elements.ts (jafngildispróf í
// beton-web scripts/verify-report-format.cjs). Hrein föll, engin innflutningur.

/** Kaflar skýrslunnar, í röð samningsins. */
export const NZ_SECTION_KEYS = [
  "site",
  "exterior",
  "roof",
  "roof_space",
  "subfloor",
  "interior",
  "services",
  "accessory",
] as const;
export type NzSectionKey = (typeof NZ_SECTION_KEYS)[number];

export const NZ_SECTION_LABELS: Readonly<Record<NzSectionKey, string>> = {
  site: "Site",
  exterior: "Exterior",
  roof: "Roof",
  roof_space: "Roof space",
  subfloor: "Subfloor",
  interior: "Interior",
  services: "Services",
  accessory: "Accessory units, ancillary spaces and buildings",
};

/** Rými: slug → heiti, kafli og matslyklar (rooms.ratings). */
export const NZ_ROOMS: Readonly<Record<string, { label: string; section: NzSectionKey; ratings: readonly string[] }>> = {
  "nz-site": { label: "Site", section: "site", ratings: ["site_drainage", "retaining", "paths_driveway", "fences"] },
  "nz-exterior": {
    label: "Exterior",
    section: "exterior",
    ratings: ["weatherboards", "cladding", "ground_clearance", "joinery", "flashings", "sealants", "paint"],
  },
  "nz-roof": { label: "Roof", section: "roof", ratings: ["roof_covering", "roof_flashings", "spouting", "downpipes"] },
  "nz-roof-space": {
    label: "Roof space",
    section: "roof_space",
    ratings: ["roof_framing", "ceiling_insulation", "sarking", "roof_space_wiring"],
  },
  "nz-subfloor": {
    label: "Subfloor",
    section: "subfloor",
    ratings: ["piles", "bearers_joists", "subfloor_ventilation", "ground_cover", "subfloor_insulation"],
  },
  "nz-services": {
    label: "Services",
    section: "services",
    ratings: ["switchboard", "smoke_alarms", "hot_water_cylinder", "plumbing_visible", "heating"],
  },
  "nz-accessory": { label: "Accessory buildings", section: "accessory", ratings: [] },
  "nz-kitchen": {
    label: "Kitchen",
    section: "interior",
    ratings: ["linings", "ceilings", "floors", "doors", "windows", "fixtures", "extraction"],
  },
  "nz-bathroom": {
    label: "Bathroom",
    section: "interior",
    ratings: ["linings", "ceilings", "floors", "doors", "windows", "wet_area_linings", "fixtures", "extraction"],
  },
  "nz-ensuite": {
    label: "Ensuite",
    section: "interior",
    ratings: ["linings", "ceilings", "floors", "doors", "windows", "wet_area_linings", "fixtures", "extraction"],
  },
  "nz-laundry": {
    label: "Laundry",
    section: "interior",
    ratings: ["linings", "ceilings", "floors", "doors", "windows", "wet_area_linings", "fixtures", "extraction"],
  },
  "nz-living": { label: "Living", section: "interior", ratings: ["linings", "ceilings", "floors", "doors", "windows"] },
  "nz-dining": { label: "Dining", section: "interior", ratings: ["linings", "ceilings", "floors", "doors", "windows"] },
  "nz-bedroom": { label: "Bedroom", section: "interior", ratings: ["linings", "ceilings", "floors", "doors", "windows"] },
  "nz-hallway": { label: "Hallway", section: "interior", ratings: ["linings", "ceilings", "floors", "doors"] },
  "nz-toilet": {
    label: "Toilet",
    section: "interior",
    ratings: ["linings", "ceilings", "floors", "doors", "wet_area_linings", "fixtures", "extraction"],
  },
  "nz-garage": { label: "Garage", section: "interior", ratings: ["linings", "ceilings", "floors", "doors", "windows"] },
  "nz-deck": { label: "Deck", section: "interior", ratings: ["floors"] },
};

/** Heiti matslykla (rooms.ratings) í NZ-skýrslum. */
export const NZ_RATING_LABELS: Readonly<Record<string, string>> = {
  site_drainage: "Site drainage",
  retaining: "Retaining walls",
  paths_driveway: "Paths and driveway",
  fences: "Fences",
  weatherboards: "Weatherboards",
  cladding: "Cladding",
  ground_clearance: "Ground clearance",
  joinery: "Joinery",
  flashings: "Flashings",
  sealants: "Sealants",
  paint: "Paint",
  roof_covering: "Roof covering",
  roof_flashings: "Roof flashings",
  spouting: "Spouting",
  downpipes: "Downpipes",
  roof_framing: "Roof framing",
  ceiling_insulation: "Ceiling insulation",
  sarking: "Sarking",
  roof_space_wiring: "Wiring (visible)",
  piles: "Piles",
  bearers_joists: "Bearers and joists",
  subfloor_ventilation: "Subfloor ventilation",
  ground_cover: "Ground cover",
  subfloor_insulation: "Subfloor insulation",
  switchboard: "Switchboard",
  smoke_alarms: "Smoke alarms",
  hot_water_cylinder: "Hot water cylinder",
  plumbing_visible: "Plumbing (visible)",
  heating: "Heating",
  linings: "Wall linings",
  ceilings: "Ceilings",
  floors: "Floors",
  doors: "Doors",
  windows: "Windows",
  wet_area_linings: "Wet area linings",
  fixtures: "Fixtures",
  extraction: "Extraction",
};

/** Grunn-slug rýmis: nákvæmt slug, eða slug með númeri (t.d. „nz-bedroom-2“ → „nz-bedroom“). */
export function nzBaseSlug(slug: string): string | null {
  if (Object.prototype.hasOwnProperty.call(NZ_ROOMS, slug)) return slug;
  const numbered = /^(nz-[a-z-]+?)-\d+$/.exec(slug);
  return numbered && Object.prototype.hasOwnProperty.call(NZ_ROOMS, numbered[1]) ? numbered[1] : null;
}

/** Kafli rýmis; sérsniðin og óþekkt rými teljast innri rými (samningur: „+ sérsniðin“). */
export function nzSectionOf(slug: string): NzSectionKey {
  const base = nzBaseSlug(slug);
  return base ? NZ_ROOMS[base].section : "interior";
}

/** Heiti matslykils; óþekktur lykill með bilum í stað undirstrika. */
export function nzRatingLabel(key: string): string {
  return Object.prototype.hasOwnProperty.call(NZ_RATING_LABELS, key) ? NZ_RATING_LABELS[key] : key.replace(/_/g, " ");
}
