export type ReportProgressState = 'pending' | 'ready' | 'error';
export interface ReportProgressResult { state: ReportProgressState; detail?: string }

/** A network request itself is bounded, not just the gaps between requests. */
export async function readWithTimeout<T>(read: () => Promise<T>, timeoutMs = 15_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      read(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Tenging tók of langan tíma.')), timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

export async function waitForReport(
  read: () => Promise<ReportProgressResult>,
  options: { cancelled: () => boolean; sleep?: (ms: number) => Promise<void>; now?: () => number; timeoutMs?: number; requestTimeoutMs?: number },
): Promise<ReportProgressResult | { state: 'timeout' | 'cancelled'; detail?: string }> {
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  const deadline = now() + (options.timeoutMs ?? 10 * 60_000);
  let failures = 0;
  while (!options.cancelled() && now() < deadline) {
    try {
      const result = await readWithTimeout(read, options.requestTimeoutMs);
      if (options.cancelled()) return { state: 'cancelled' };
      failures = 0;
      if (result.state !== 'pending') return result;
    } catch {
      if (options.cancelled()) return { state: 'cancelled' };
      if (++failures >= 3) return { state: 'error', detail: 'Ekki næst samband til að athuga stöðuna. Skýrslugerðin getur samt haldið áfram. Athugaðu stöðuna aftur.' };
    }
    await sleep(4000);
  }
  return { state: options.cancelled() ? 'cancelled' : 'timeout' };
}
