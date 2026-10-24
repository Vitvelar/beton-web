// „Kerfi + status“ — hrein föll sem kasta aldrei (isop og, síðar, AU).
// Samningur: plan/rondva/ISOP-SNID-HONNUN.md §2.2, §2.4, §3.1–3.3, §6.4.
// BÆTI FYRIR BÆTI eins og beton-web src/lib/report/systems/core.ts. Engin ósjálfstæði utan ./types.
//
// Reglur:
//  - Deficiency er REIKNAÐ úr athugasemdum skoðunarmanns (alvarleg, mjog_alvarleg eða merkið safety_hazard), aldrei valið
//    og aldrei af gervigreind. Maintenance (athugasemd) gerir kerfið ekki að Deficiency.
//  - Föllin breyta aldrei inntaki; þau skila nýjum hlutum.

import {
  SYSTEM_STATUSES,
  SYSTEM_STATUS_LABELS,
  SYSTEM_OBSERVATION_TAGS,
  type DeficiencyCategory,
  type DeficiencyRow,
  type DeficiencySummary,
  type MaintenanceRow,
  type SystemCatalog,
  type SystemCounts,
  type SystemDef,
  type SystemEntry,
  type SystemIssue,
  type SystemObservation,
  type SystemObservationTag,
  type SystemOverviewRow,
  type SystemRoom,
  type SystemStatus,
  type SystemsData,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function has(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

// ───────────────────────── gögn skoðunarmanns (property_data.systems)

function emptySystemsData(): SystemsData {
  return { v: 1, items: {}, room_map: {} };
}

function statusFrom(value: unknown): SystemStatus | undefined {
  return typeof value === 'string' && (SYSTEM_STATUSES as readonly string[]).includes(value) ? (value as SystemStatus) : undefined;
}

/**
 * property_data → property_data.systems sem nýtt, hreinsað SystemsData (afrit). Óþekkt status-gildi og gildi sem eru ekki
 * strengir falla niður; texti er aldrei styttur eða lagaður (prentast orðrétt). Tekur við hlut eða JSON-streng.
 */
export function systemsDataFrom(propertyData: unknown): SystemsData {
  try {
    let root: unknown = propertyData;
    if (typeof root === 'string') {
      try {
        root = JSON.parse(root);
      } catch {
        return emptySystemsData();
      }
    }
    const raw = isRecord(root) ? root.systems : undefined;
    if (!isRecord(raw)) return emptySystemsData();
    const out = emptySystemsData();
    if (isRecord(raw.items)) {
      for (const [key, value] of Object.entries(raw.items)) {
        if (!isRecord(value)) continue;
        const entry: SystemEntry = {};
        const status = statusFrom(value.status);
        if (status) entry.status = status;
        if (typeof value.reason === 'string') entry.reason = value.reason;
        if (typeof value.limitations === 'string') entry.limitations = value.limitations;
        if (isRecord(value.describe)) {
          const describe: Record<string, string> = {};
          for (const [k, v] of Object.entries(value.describe)) if (typeof v === 'string') describe[k] = v;
          entry.describe = describe;
        }
        out.items[key] = entry;
      }
    }
    if (isRecord(raw.room_map)) {
      for (const [roomId, systemKey] of Object.entries(raw.room_map)) {
        if (typeof systemKey === 'string') out.room_map[roomId] = systemKey;
      }
    }
    return out;
  } catch {
    return emptySystemsData();
  }
}

/** Skráð status kerfis; null = ósvarað (eða óþekkt gildi). */
export function statusOf(data: SystemsData | null | undefined, key: string): SystemStatus | null {
  try {
    const entry = data && isRecord(data.items) && has(data.items, key) ? data.items[key] : undefined;
    return (entry && statusFrom(entry.status)) || null;
  } catch {
    return null;
  }
}

/** Ný SystemsData þar sem færsla kerfis er sett (entry = null eyðir henni). Breytir aldrei inntaki. */
export function setSystemEntry(data: SystemsData | null | undefined, key: string, entry: SystemEntry | null): SystemsData {
  const base = systemsDataFrom({ systems: data ?? undefined });
  if (typeof key !== 'string') return base;
  const items = { ...base.items };
  if (entry === null) delete items[key];
  else if (isRecord(entry)) {
    // fer í gegnum sama hreinsi og systemsDataFrom (óþekkt gildi falla niður)
    const clean = systemsDataFrom({ systems: { items: { [key]: entry } } }).items[key];
    if (clean) items[key] = clean;
  }
  return { v: 1, items, room_map: base.room_map };
}

/** Ný SystemsData með sérsniðið rými varpað á kerfi (systemKey = null fjarlægir vörpunina). */
export function setRoomSystem(data: SystemsData | null | undefined, roomId: string, systemKey: string | null): SystemsData {
  const base = systemsDataFrom({ systems: data ?? undefined });
  if (typeof roomId !== 'string') return base;
  const room_map = { ...base.room_map };
  if (systemKey === null) delete room_map[roomId];
  else if (typeof systemKey === 'string') room_map[roomId] = systemKey;
  return { v: 1, items: base.items, room_map };
}

// ───────────────────────── vörpun rýma og athugasemda á kerfi

function catalogDef(catalog: SystemCatalog, key: string): SystemDef | undefined {
  return catalog.systems.find((system) => system.key === key);
}

/** Kerfin í kaflaröð (afrit; röðuð eftir `order`). */
export function sortedSystems(catalog: SystemCatalog): SystemDef[] {
  return [...catalog.systems].sort((a, b) => a.order - b.order);
}

/**
 * Grunn-slug rýmis í skránni: nákvæmt slug, eða slug með númeri („isop-bedroom-2“ → „isop-bedroom“); annars null
 * (sérsniðin rými og rými úr öðru sniði).
 */
export function catalogBaseSlug(slug: string | null | undefined, catalog: SystemCatalog): string | null {
  try {
    if (typeof slug !== 'string' || !slug.startsWith(catalog.slugPrefix)) return null;
    const known = (base: string) => catalog.systems.some((system) => system.roomBases.includes(base));
    if (known(slug)) return slug;
    const numbered = /^(.+?)-\d+$/.exec(slug);
    return numbered && known(numbered[1]) ? numbered[1] : null;
  } catch {
    return null;
  }
}

/** Er ≥1 rými frá sniðinu í listanum? (Edge notar þetta til að falla aftur í sjálfgefna leið, hönnun §4.1.) */
export function hasCatalogRooms(slugs: Iterable<string | null | undefined>, catalog: SystemCatalog): boolean {
  try {
    for (const slug of slugs) if (catalogBaseSlug(slug, catalog)) return true;
  } catch {
    // fellur niður í false
  }
  return false;
}

/**
 * Kerfi rýmis (hönnun §3.3): 1) grunn-slug í skránni → kerfið; 2) sérsniðið rými → room_map[id] ef gilt kerfi
 * (og ekki varakerfið sjálft er leyft); 3) annars varakerfið („additional“). Rými úr öðru sniði → varakerfið.
 */
export function systemOfRoom(
  room: { id?: string | null; slug?: string | null },
  catalog: SystemCatalog,
  roomMap?: Readonly<Record<string, string>> | null,
): string {
  try {
    const base = catalogBaseSlug(room?.slug, catalog);
    if (base) {
      const system = catalog.systems.find((s) => s.roomBases.includes(base));
      if (system) return system.key;
    }
    const id = room?.id;
    if (typeof id === 'string' && roomMap && isRecord(roomMap) && has(roomMap, id)) {
      const mapped = roomMap[id];
      if (typeof mapped === 'string' && catalogDef(catalog, mapped)) return mapped;
    }
  } catch {
    // fellur niður í varakerfið
  }
  return catalog.fallbackKey;
}

/** Rými flokkuð eftir kerfi, í kaflaröð; öll kerfi eru með (tóm ef ekkert rými). Röð rýma innan kerfis helst. */
export function groupRoomsBySystem<R extends SystemRoom>(
  rooms: readonly R[],
  catalog: SystemCatalog,
  roomMap?: Readonly<Record<string, string>> | null,
): Array<{ system: SystemDef; rooms: R[] }> {
  const groups = sortedSystems(catalog).map((system) => ({ system, rooms: [] as R[] }));
  for (const room of Array.isArray(rooms) ? rooms : []) {
    if (!room || typeof room !== 'object') continue;
    const key = systemOfRoom(room, catalog, roomMap);
    const group = groups.find((g) => g.system.key === key);
    if (group) group.rooms.push(room);
  }
  return groups;
}

// ───────────────────────── athugasemdir → flokkar og Deficiency

function tagsOf(observation: SystemObservation | null | undefined, extra?: readonly string[] | null): Set<SystemObservationTag> {
  const found = new Set<SystemObservationTag>();
  const consider = (list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const tag of list) {
      if ((SYSTEM_OBSERVATION_TAGS as readonly unknown[]).includes(tag)) found.add(tag as SystemObservationTag);
    }
  };
  consider(observation?.tags);
  consider(extra);
  return found;
}

/**
 * Flokkur athugasemdar í gallatöflu: safety (merkið safety_hazard, óháð alvarleika) → major (mjog_alvarleg) →
 * repair (alvarleg); athugasemd án merkis → null (Maintenance). Óþekktur alvarleiki → null (aldrei falin: fer í Maintenance).
 */
export function deficiencyCategoryOf(
  observation: SystemObservation | null | undefined,
  extraTags?: readonly string[] | null,
): DeficiencyCategory | null {
  const tags = tagsOf(observation, extraTags);
  if (tags.has('safety_hazard')) return 'safety';
  if (observation?.severity === 'mjog_alvarleg') return 'major';
  if (observation?.severity === 'alvarleg') return 'repair';
  return null;
}

function emptyCounts(): SystemCounts {
  return { observations: 0, deficiencies: 0, safety: 0, major: 0, repair: 0, maintenance: 0, furtherEvaluation: 0, observationIds: [] };
}

export interface SystemsOptions {
  /** Sérsniðin rými → kerfi (property_data.systems.room_map). */
  roomMap?: Readonly<Record<string, string>> | null;
  /** Merki úr ai_report_data.isop.tags ({ obsId: [tag…] }); sameinast merkjum á athugasemdinni. */
  tagsByObservation?: Readonly<Record<string, readonly string[]>> | null;
}

function extraTagsFor(options: SystemsOptions | undefined, observationId: string): readonly string[] | null {
  const map = options?.tagsByObservation;
  return map && isRecord(map) && has(map, observationId) && Array.isArray(map[observationId]) ? map[observationId] : null;
}

/**
 * Deficiency-talningar á kerfi (hönnun §2.2): Record yfir ÖLL kerfi skrárinnar (núll ef ekkert). Hver athugasemd
 * telst einu sinni; safety_hazard-athugasemd telst sem safety (ekki maintenance). Deficiency = safety + major + repair.
 */
export function deficienciesBySystem(
  rooms: readonly SystemRoom[],
  catalog: SystemCatalog,
  options?: SystemsOptions,
): Record<string, SystemCounts> {
  const out: Record<string, SystemCounts> = {};
  for (const system of catalog.systems) out[system.key] = emptyCounts();
  try {
    for (const room of Array.isArray(rooms) ? rooms : []) {
      const key = systemOfRoom(room ?? {}, catalog, options?.roomMap);
      const counts = out[key] ?? (out[key] = emptyCounts());
      for (const observation of Array.isArray(room?.observations) ? room.observations : []) {
        if (!observation) continue;
        const extra = extraTagsFor(options, observation.id);
        const category = deficiencyCategoryOf(observation, extra);
        counts.observations++;
        counts.observationIds.push(observation.id);
        if (category) {
          counts[category]++;
          counts.deficiencies++;
        } else {
          counts.maintenance++;
        }
        if (tagsOf(observation, extra).has('further_evaluation')) counts.furtherEvaluation++;
      }
    }
  } catch {
    // skilar því sem komið var
  }
  return out;
}

/** Kerfið er með Deficiency ef ≥1 athugasemd er safety/major/repair. */
export function hasDeficiency(counts: SystemCounts | null | undefined): boolean {
  return !!counts && counts.deficiencies > 0;
}

/** Texti statuslínu: „Inspected · 2 deficiencies“, „Inspected · Maintenance noted“, „Not inspected“, „Not set“. */
export function systemStatusText(status: SystemStatus | null, counts?: SystemCounts | null): string {
  if (!status) return 'Not set';
  const label = SYSTEM_STATUS_LABELS[status];
  if (status === 'not_inspected' || status === 'not_present') return label;
  if (counts && counts.deficiencies > 0) return `${label} · ${counts.deficiencies} ${counts.deficiencies === 1 ? 'deficiency' : 'deficiencies'}`;
  if (counts && counts.maintenance > 0) return `${label} · Maintenance noted`;
  return label;
}

/** „Systems at a glance“: ein röð á kerfi í kaflaröð (varakerfið líka; kallandi ákveður hvort það birtist). */
export function systemOverview(
  data: SystemsData | null | undefined,
  rooms: readonly SystemRoom[],
  catalog: SystemCatalog,
  options?: SystemsOptions,
): SystemOverviewRow[] {
  const normalized = systemsDataFrom({ systems: data ?? undefined });
  const merged: SystemsOptions = { ...options, roomMap: options?.roomMap ?? normalized.room_map };
  const counts = deficienciesBySystem(rooms, catalog, merged);
  const groups = groupRoomsBySystem(rooms, catalog, merged.roomMap);
  return groups.map(({ system, rooms: systemRooms }) => {
    const entry = has(normalized.items, system.key) ? normalized.items[system.key] : undefined;
    const status = system.allowedStatuses.length === 0 ? null : statusOf(normalized, system.key);
    const systemCounts = counts[system.key] ?? emptyCounts();
    return {
      key: system.key,
      label: system.label,
      order: system.order,
      status,
      reason: entry?.reason ?? '',
      limitations: entry?.limitations ?? '',
      hasDeficiency: hasDeficiency(systemCounts),
      counts: systemCounts,
      roomIds: systemRooms.map((room) => room?.id).filter((id): id is string => typeof id === 'string'),
      statusText: systemStatusText(status, systemCounts),
    };
  });
}

// ───────────────────────── Summary of deficiencies (hönnun §2.4)

function numberOf(observation: SystemObservation, fallback: number): string {
  const given = observation.number ?? observation.observation_number;
  if (typeof given === 'number' && Number.isFinite(given)) return String(given);
  if (typeof given === 'string' && given.trim() !== '') return given.trim();
  return String(fallback);
}

function numericOrder(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

const CATEGORY_RANK: Readonly<Record<DeficiencyCategory, number>> = { safety: 0, major: 1, repair: 2 };

/**
 * Gallataflan (aðeins úr gögnum, engin gervigreind). Raðir: allar athugasemdir með alvarleg/mjog_alvarleg eða safety_hazard.
 * Röðun: Safety hazard → Major defect → Repair or replace; innan flokks eftir kerfaröð (1…n, svo Additional) og
 * athugasemdanúmeri (tölulega, svo í innsendri röð). `maintenance` = restin (athugasemd) í sömu röðun.
 * Athugasemdanúmer: `number`/`observation_number` ef til, annars 1-byggð röð í innsendri rýma-/athugasemdaröð.
 */
export function buildDeficiencySummary(
  rooms: readonly SystemRoom[],
  catalog: SystemCatalog,
  options?: SystemsOptions,
): DeficiencySummary {
  const rows: Array<DeficiencyRow & { seq: number }> = [];
  const maintenance: Array<MaintenanceRow & { seq: number }> = [];
  try {
    const orderOf = new Map(catalog.systems.map((system) => [system.key, system] as const));
    let seq = 0;
    for (const room of Array.isArray(rooms) ? rooms : []) {
      const key = systemOfRoom(room ?? {}, catalog, options?.roomMap);
      const system = orderOf.get(key) ?? orderOf.get(catalog.fallbackKey);
      const base = {
        systemKey: system?.key ?? key,
        systemLabel: system?.label ?? key,
        systemOrder: system?.order ?? Number.MAX_SAFE_INTEGER,
        roomId: typeof room?.id === 'string' ? room.id : null,
        roomName: str(room?.name),
      };
      for (const observation of Array.isArray(room?.observations) ? room.observations : []) {
        if (!observation) continue;
        seq++;
        const extra = extraTagsFor(options, observation.id);
        const category = deficiencyCategoryOf(observation, extra);
        const furtherEvaluation = tagsOf(observation, extra).has('further_evaluation');
        const number = numberOf(observation, seq);
        const title = str(observation.title);
        if (category) {
          rows.push({
            rank: 0,
            seq,
            observationId: observation.id,
            number,
            category,
            ...base,
            title,
            observationCategory: str(observation.category),
            recommendation: str(observation.polished_suggestion) || str(observation.suggestion),
            furtherEvaluation,
          });
        } else {
          maintenance.push({ seq, observationId: observation.id, number, ...base, title, furtherEvaluation });
        }
      }
    }
    rows.sort(
      (a, b) =>
        CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category] ||
        a.systemOrder - b.systemOrder ||
        numericOrder(a.number) - numericOrder(b.number) ||
        a.seq - b.seq,
    );
    maintenance.sort((a, b) => a.systemOrder - b.systemOrder || numericOrder(a.number) - numericOrder(b.number) || a.seq - b.seq);
    rows.forEach((row, index) => {
      row.rank = index + 1;
    });
  } catch {
    // skilar því sem komið var
  }
  const count = (category: DeficiencyCategory) => rows.filter((row) => row.category === category).length;
  const strip = <T extends { seq: number }>(item: T): Omit<T, 'seq'> => {
    const { seq: _seq, ...rest } = item;
    return rest;
  };
  return {
    rows: rows.map(strip) as DeficiencyRow[],
    maintenance: maintenance.map(strip) as MaintenanceRow[],
    counts: {
      safety: count('safety'),
      major: count('major'),
      repair: count('repair'),
      deficiencies: rows.length,
      maintenance: maintenance.length,
    },
  };
}

// ───────────────────────── ósvarað, ástæður, ósamræmi (hönnun §2.2, §6.1)

function plural(count: number): string {
  return count === 1 ? '1 observation' : `${count} observations`;
}

/**
 * Hvað vantar eða stangast á: ósvarað kerfi (aðeins kerfi með statusRequired), status utan allowedStatuses,
 * ástæða vantar við not_inspected, og kerfi merkt not_present/not_inspected sem á athugasemdir („Roof is marked Not present
 * but has 2 observations“). Skilar [] þegar allt er í lagi. Kerfi með rými í skýrslunni sem nær ekki til statusa breytist ekki.
 */
export function missingSystemFields(
  data: SystemsData | null | undefined,
  catalog: SystemCatalog,
  rooms: readonly SystemRoom[],
  options?: SystemsOptions,
): SystemIssue[] {
  const issues: SystemIssue[] = [];
  try {
    const normalized = systemsDataFrom({ systems: data ?? undefined });
    const counts = deficienciesBySystem(rooms, catalog, { ...options, roomMap: options?.roomMap ?? normalized.room_map });
    for (const system of sortedSystems(catalog)) {
      const entry = has(normalized.items, system.key) ? normalized.items[system.key] : undefined;
      const rawStatus = entry?.status;
      const issue = (code: SystemIssue['code'], message: string, observations?: number) =>
        issues.push({ systemKey: system.key, systemLabel: system.label, code, message, ...(observations === undefined ? {} : { observations }) });
      if (!rawStatus) {
        if (system.statusRequired) issue('status_missing', `${system.label}: choose a status`);
        continue;
      }
      if (!system.allowedStatuses.includes(rawStatus)) {
        issue('status_invalid', `${system.label}: "${SYSTEM_STATUS_LABELS[rawStatus]}" is not available for this report format`);
        continue;
      }
      if (rawStatus === 'not_inspected' && !str(entry?.reason).trim()) {
        issue('reason_missing', `${system.label}: say why it was not inspected`);
      }
      const observations = counts[system.key]?.observations ?? 0;
      if (observations > 0 && rawStatus === 'not_present') {
        issue('inconsistent_not_present', `${system.label} is marked ${SYSTEM_STATUS_LABELS.not_present} but has ${plural(observations)}`, observations);
      } else if (observations > 0 && rawStatus === 'not_inspected') {
        issue('inconsistent_not_inspected', `${system.label} is marked ${SYSTEM_STATUS_LABELS.not_inspected} but has ${plural(observations)}`, observations);
      }
    }
  } catch {
    // skilar því sem komið var
  }
  return issues;
}

/** Kerfi (statusRequired) með rými í listanum. */
export function systemsWithRooms(slugs: Iterable<string | null | undefined>, catalog: SystemCatalog): string[] {
  const found = new Set<string>();
  try {
    for (const slug of slugs) {
      const base = catalogBaseSlug(slug, catalog);
      if (!base) continue;
      const system = catalog.systems.find((s) => s.roomBases.includes(base));
      if (system && system.statusRequired) found.add(system.key);
    }
  } catch {
    // skilar því sem komið var
  }
  return sortedSystems(catalog)
    .map((system) => system.key)
    .filter((key) => found.has(key));
}

/**
 * Eftir „Set up the house“: kerfi sem fengu rými merkt `inspected` — AÐEINS þau sem ekkert svar höfðu
 * (snertir aldrei gefin svör; sama regla og NZ markAreasWithRoomsYes). Skilar { systems, marked } til að skrifa í
 * property_data.systems, eða null ef ekkert breytist.
 */
export function markSystemsWithRooms(
  propertyData: unknown,
  slugs: Iterable<string | null | undefined>,
  catalog: SystemCatalog,
): { systems: SystemsData; marked: string[] } | null {
  try {
    const data = systemsDataFrom(propertyData);
    const items = { ...data.items };
    const marked: string[] = [];
    for (const key of systemsWithRooms(slugs, catalog)) {
      if (!statusOf(data, key)) {
        items[key] = { ...(items[key] ?? {}), status: 'inspected' };
        marked.push(key);
      }
    }
    return marked.length > 0 ? { systems: { v: 1, items, room_map: data.room_map }, marked } : null;
  } catch {
    return null;
  }
}

// ───────────────────────── Texas-viðvörun (hönnun §6.4)

const ZIP_RE = /^(\d{5})(?:-\d{4})?$/;
const ADDRESS_TX_RE = /,\s*(?:TX|Texas)(?:\s+\d{5}(?:-\d{4})?)?\s*$/i;
const ADDRESS_TEXAS_RE = /(?:^|\s)Texas(?:\s+\d{5}(?:-\d{4})?)?\s*$/i;

/** ZIP í Texas: 733xx (m.a. 73301), 750xx–799xx og 885xx (El Paso). Aðeins 5 stafa/ZIP+4. */
export function isTexasZip(postalCode: string | null | undefined): boolean {
  try {
    const match = ZIP_RE.exec(str(postalCode).trim());
    if (!match) return false;
    const zip3 = Number.parseInt(match[1].slice(0, 3), 10);
    return zip3 === 733 || (zip3 >= 750 && zip3 <= 799) || zip3 === 885;
  } catch {
    return false;
  }
}

/**
 * Á að sýna Texas-viðvörun? Satt ef fylki er TX, ZIP er í Texas-bili, eða heimilisfang endar á „, TX“ / „Texas“
 * (með eða án ZIP). Aðeins viðvörun, aldrei læsing. [Á: bilin eru almennt þekkt ZIP-bil]
 */
export function texasNotice(input: { state?: string | null; postalCode?: string | null; address?: string | null }): boolean {
  try {
    if (str(input?.state).trim().toUpperCase() === 'TX') return true;
    if (isTexasZip(input?.postalCode)) return true;
    const address = str(input?.address).trim();
    return ADDRESS_TX_RE.test(address) || ADDRESS_TEXAS_RE.test(address);
  } catch {
    return false;
  }
}
