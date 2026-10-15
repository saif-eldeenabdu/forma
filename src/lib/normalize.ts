import type { CommitteeState, Currency, RootState } from './types';
import { createSeed } from './seed';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Firebase returns arrays as objects (or null when empty). Normalise to a real array. */
export function toArray<T>(x: unknown): T[] {
  if (x == null) return [];
  if (Array.isArray(x)) return x.filter((v) => v != null) as T[];
  if (typeof x === 'object') return Object.values(x as Record<string, T>).filter((v) => v != null);
  return [];
}

function byTime<T extends Record<string, any>>(key: string) {
  return (a: T, b: T) => (a[key] ?? 0) - (b[key] ?? 0);
}

/** Convert raw DB root into the typed, fully-populated RootState. */
export function normalize(raw: unknown): RootState {
  const seed = createSeed();
  const r = (raw ?? {}) as Record<string, any>;
  const cs = (r.committeeState ?? {}) as Partial<CommitteeState>;

  const committeeState: CommitteeState = {
    ...seed.committeeState,
    ...cs,
    timer: { ...seed.committeeState.timer, ...(cs.timer ?? {}) },
    gslQueue: toArray<string>(cs.gslQueue),
    gslRequests: toArray<any>(cs.gslRequests).sort(byTime('at')),
    projectedMotionId: cs.projectedMotionId ?? '',
    activeCrisisBanner: cs.activeCrisisBanner ?? '',
    crisisAlert: cs.crisisAlert ?? null,
    sanctions: cs.sanctions ?? {},
    pressure: cs.pressure ?? {},
  };

  const currencies: Record<string, Currency> = {};
  const rawCur = (r.currencies ?? {}) as Record<string, any>;
  for (const [code, base] of Object.entries(seed.currencies)) {
    const c = rawCur[code] ?? base;
    currencies[code] = { ...base, ...c, history: toArray<number>(c.history).length ? toArray<number>(c.history) : base.history };
  }

  return {
    committeeState,
    currencies,
    motions: toArray<any>(r.motions).sort(byTime('createdAt')),
    newsTicker: toArray<string>(r.newsTicker),
    trades: toArray<any>(r.trades).sort(byTime('createdAt')),
    directives: toArray<any>(r.directives).sort(byTime('createdAt')),
  };
}
