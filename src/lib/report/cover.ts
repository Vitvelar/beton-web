// Forsíðumynd skýrslu. Merkt forsíða (is_cover) vinnur alltaf. Annars, EFTIR Rondva-skýrslum:
// fyrsta rýmismynd (rými eftir sort_order, svo mynd eftir sort_order), annars fyrsta
// athugasemdamynd. Beton (isBeton) heldur gömlu leiðinni — fyrsta mynd í innlestrarröð — svo
// skýrslur Beton verði óbreyttar bæta fyrir bæti. Hrein eining (engin háð); sama regla og í appinu.
export interface CoverPhoto {
  id: string;
  is_cover: boolean;
  sort_order: number;
  room_id: string | null;
  observation_id: string | null;
}

export function pickCoverPhoto<P extends CoverPhoto>(
  photos: P[],
  rooms: Array<{ id: string; sort_order: number }>,
  isBeton: boolean,
): P | null {
  const marked = photos.find((p) => p.is_cover);
  if (marked) return marked;
  if (isBeton) return photos[0] ?? null;
  const rank = new Map(
    [...rooms].sort((a, b) => a.sort_order - b.sort_order).map((r, i) => [r.id, i] as const),
  );
  const roomRank = (p: P) => (p.room_id != null ? rank.get(p.room_id) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER);
  const order = (a: P, b: P) => roomRank(a) - roomRank(b) || a.sort_order - b.sort_order;
  const room = photos.filter((p) => p.room_id && !p.observation_id).sort(order)[0];
  if (room) return room;
  const obs = photos.filter((p) => p.observation_id).sort(order)[0];
  return obs ?? photos[0] ?? null;
}
