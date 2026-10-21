import type { CommitteeState, Currency, DelegationPortfolio, ExchangeState, ExchangeTicker, GrainStock, RootState, TickerSymbol } from './types';
import { createSeed } from './seed';
import { DEFAULT_DELEGATION_PINS } from '../data/countries';
import { defaultPortfolio, TICKER_SYMBOLS } from '../data/exchange';

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
  const rawFreeze = (cs as Record<string, any>).assetFreeze as Record<string, any> | null | undefined;

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
    sanctionedCountries: Array.isArray(cs.sanctionedCountries)
      ? cs.sanctionedCountries
      : typeof cs.sanctions === 'object' && cs.sanctions
      ? Object.keys(cs.sanctions)
      : [],
    pressure: cs.pressure ?? {},
    suezTollCurrency: cs.suezTollCurrency === 'BRICS_PAY' ? 'BRICS_PAY' : 'USD',
    assetFreeze: rawFreeze
      ? {
          country: rawFreeze.country,
          amountB: Number(rawFreeze.amountB) || 0,
          at: rawFreeze.at ?? 0,
          signers: Array.isArray(rawFreeze.signers) ? rawFreeze.signers : Object.keys(rawFreeze.signers ?? {}),
        }
      : null,
  };

  const currencies: Record<string, Currency> = {};
  const rawCur = (r.currencies ?? {}) as Record<string, any>;
  for (const [code, base] of Object.entries(seed.currencies)) {
    const c = rawCur[code] ?? base;
    currencies[code] = { ...base, ...c, history: toArray<number>(c.history).length ? toArray<number>(c.history) : base.history };
  }

  const grainStockpiles: Record<string, GrainStock> = {};
  const rawStock = (r.grainStockpiles ?? {}) as Record<string, any>;
  for (const [country, base] of Object.entries(seed.grainStockpiles)) {
    grainStockpiles[country] = { ...base, ...(rawStock[country] ?? {}) };
  }

  const rawPins = (r.delegationPins ?? {}) as Record<string, string>;
  const delegationPins: Record<string, string> = {
    ...DEFAULT_DELEGATION_PINS,
    ...rawPins,
  };

  const rawExchange = (r.exchangeState ?? {}) as Record<string, any>;
  const marketStatus = rawExchange.marketStatus === 'CLOSED' ? 'CLOSED' : 'OPEN';

  const rawTickers = (rawExchange.tickers ?? {}) as Record<string, any>;
  const tickers: Record<TickerSymbol, ExchangeTicker> = {} as Record<TickerSymbol, ExchangeTicker>;
  for (const sym of TICKER_SYMBOLS) {
    const base = seed.exchangeState.tickers[sym];
    const rt = rawTickers[sym] ?? base;
    const hist = toArray<number>(rt.history);
    tickers[sym] = {
      ...base,
      ...rt,
      history: hist.length ? hist : base.history,
    };
  }

  const rawPortfolios = (rawExchange.portfolios ?? {}) as Record<string, any>;
  const portfolios: Record<string, DelegationPortfolio> = {};
  for (const [country, base] of Object.entries(seed.exchangeState.portfolios)) {
    const rp = rawPortfolios[country] ?? {};
    portfolios[country] = {
      cash: typeof rp.cash === 'number' ? rp.cash : base.cash,
      holdings: { ...base.holdings, ...(rp.holdings ?? {}) },
      shortAvgPrice: { ...(base.shortAvgPrice ?? {}), ...(rp.shortAvgPrice ?? {}) },
    };
  }
  for (const [country, rp] of Object.entries(rawPortfolios)) {
    if (!portfolios[country] && rp) {
      const base = defaultPortfolio();
      portfolios[country] = {
        cash: typeof rp.cash === 'number' ? rp.cash : base.cash,
        holdings: { ...base.holdings, ...(rp.holdings ?? {}) },
        shortAvgPrice: { ...(base.shortAvgPrice ?? {}), ...(rp.shortAvgPrice ?? {}) },
      };
    }
  }

  const exchangeState: ExchangeState = {
    marketStatus,
    tickers,
    portfolios,
  };

  return {
    committeeState,
    currencies,
    motions: toArray<any>(r.motions).sort(byTime('createdAt')),
    newsTicker: toArray<string>(r.newsTicker),
    trades: toArray<any>(r.trades).sort(byTime('createdAt')),
    directives: toArray<any>(r.directives).sort(byTime('createdAt')),
    grainStockpiles,
    grainContracts: toArray<any>(r.grainContracts).sort(byTime('createdAt')),
    delegationPins,
    exchangeState,
  };
}
