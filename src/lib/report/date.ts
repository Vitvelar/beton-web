/** Calendar dates stay on the recorded day, independently of server/device timezone. */
export function formatReportDate(value: string | null | undefined): string {
  const text = (value ?? '').trim();
  if (!text) return '—';
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/.exec(text);
  const local = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(text);
  if (!iso && !local) return text;
  const [year, month, day] = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : [Number(local![3]), Number(local![2]), Number(local![1])];
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) return text;
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${String(year).padStart(4, '0')}`;
}
