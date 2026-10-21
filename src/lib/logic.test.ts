import { describe, expect, it } from 'vitest';
import { deriveTimer, fmtClock } from './timer';
import { sortMotions } from './motions';
import { applyUpdates, toDbForm } from './backend';
import { normalize, toArray } from './normalize';
import { applyValueChange } from './markets';
import { createSeed } from './seed';
import { calculatePortfolioValue, DEFAULT_TICKERS } from '../data/exchange';
import type { Motion, TimerState } from './types';

const base: TimerState = {
  type: 'GSL',
  totalSeconds: 90,
  remainingSeconds: 90,
  modTotalSeconds: 600,
  modRemainingSeconds: 600,
  isRunning: false,
  currentSpeaker: 'Brazil',
  yieldTo: 'None',
  lastUpdated: 1_000_000,
};

describe('deriveTimer', () => {
  it('does not move while paused', () => {
    expect(deriveTimer(base, 1_050_000).speaker).toBe(90);
  });
  it('counts down while running', () => {
    const d = deriveTimer({ ...base, isRunning: true }, 1_030_000);
    expect(d.speaker).toBe(60);
    expect(d.running).toBe(true);
  });
  it('clamps at zero and flags expiry', () => {
    const d = deriveTimer({ ...base, isRunning: true }, 1_200_000);
    expect(d.speaker).toBe(0);
    expect(d.expired).toBe(true);
    expect(d.running).toBe(false);
  });
  it('MOD tracks both clocks; UNMOD uses the caucus clock', () => {
    const mod = deriveTimer({ ...base, type: 'MOD', isRunning: true, remainingSeconds: 45 }, 1_010_000);
    expect(mod.speaker).toBe(35);
    expect(mod.caucus).toBe(590);
    const un = deriveTimer({ ...base, type: 'UNMOD', isRunning: true }, 1_060_000);
    expect(un.primary).toBe(540);
  });
  it('is stable for any client given the same snapshot and clock', () => {
    const t = { ...base, isRunning: true };
    expect(deriveTimer(t, 1_020_000)).toEqual(deriveTimer(t, 1_020_000));
  });
  it('formats mm:ss rounding up', () => {
    expect(fmtClock(89.2)).toBe('01:30');
    expect(fmtClock(0)).toBe('00:00');
  });
});

describe('sortMotions', () => {
  const m = (id: string, type: Motion['type'], total: number, createdAt: number): Motion => ({
    id,
    type,
    totalSeconds: total,
    speakerSeconds: 30,
    createdAt,
    delegation: 'India',
    topic: 't',
    status: 'PENDING',
  });
  it('orders most to least disruptive, then longer, then older', () => {
    const sorted = sortMotions([
      m('a', 'Set Speaking Time', 0, 1),
      m('b', 'Moderated Caucus', 300, 2),
      m('c', 'Unmoderated Caucus', 600, 3),
      m('d', 'Moderated Caucus', 600, 4),
      m('e', 'Table Debate', 0, 5),
      m('f', 'Introduce Working Paper', 0, 6),
    ]).map((x) => x.id);
    expect(sorted).toEqual(['e', 'c', 'd', 'b', 'f', 'a']);
  });
});

describe('backend helpers', () => {
  it('applyUpdates writes nested paths and deletes on null', () => {
    const root = toDbForm(createSeed()) as Record<string, unknown>;
    applyUpdates(root, { 'committeeState/gslRequests/x1': { id: 'x1', country: 'India', at: 1 } });
    expect((root.committeeState as any).gslRequests.x1.country).toBe('India');
    applyUpdates(root, { 'committeeState/gslRequests/x1': null });
    expect((root.committeeState as any).gslRequests.x1).toBeUndefined();
  });
  it('normalize turns id-keyed maps into sorted arrays and keeps empty GSL empty', () => {
    const raw = toDbForm(createSeed()) as any;
    raw.motions = { b: { id: 'b', createdAt: 2 }, a: { id: 'a', createdAt: 1 } };
    delete raw.committeeState.gslQueue; // Firebase drops empty arrays
    const s = normalize(raw);
    expect(s.motions.map((x) => x.id)).toEqual(['a', 'b']);
    expect(s.committeeState.gslQueue).toEqual([]);
    expect(Object.keys(s.currencies)).toHaveLength(22);
  });
  it('normalizes sanctionedCountries as string array even if missing or null in raw DB', () => {
    const raw = toDbForm(createSeed()) as any;
    delete raw.committeeState.sanctionedCountries;
    const s1 = normalize(raw);
    expect(s1.committeeState.sanctionedCountries).toEqual([]);

    raw.committeeState.sanctionedCountries = ['Russia', 'Algeria'];
    const s2 = normalize(raw);
    expect(s2.committeeState.sanctionedCountries).toEqual(['Russia', 'Algeria']);
  });
  it('toArray handles null / object / array', () => {
    expect(toArray(null)).toEqual([]);
    expect(toArray({ 0: 'a', 1: 'b' })).toEqual(['a', 'b']);
    expect(toArray(['a', undefined, 'b'])).toEqual(['a', 'b']);
  });
});

describe('crisis and sanctions state updates', () => {
  it('applies barter crisis updates correctly to DB form', () => {
    const root = toDbForm(createSeed()) as any;
    applyUpdates(root, {
      'committeeState/currentMode': 'BARTER_CRISIS',
      'committeeState/activeCrisisBanner': 'GLOBAL BANKING OFFLINE // FIAT FROZEN',
    });
    expect(root.committeeState.currentMode).toBe('BARTER_CRISIS');
    expect(root.committeeState.activeCrisisBanner).toContain('GLOBAL BANKING OFFLINE');
  });

  it('handles sanction additions and removals correctly', () => {
    const root = toDbForm(createSeed()) as any;
    applyUpdates(root, {
      'committeeState/sanctions/Algeria': { at: 100, until: 700 },
      'committeeState/sanctionedCountries': ['Algeria'],
    });
    expect(root.committeeState.sanctions.Algeria.until).toBe(700);
    expect(root.committeeState.sanctionedCountries).toEqual(['Algeria']);

    // Lift sanctions
    applyUpdates(root, {
      'committeeState/sanctions/Algeria': null,
      'committeeState/sanctionedCountries': [],
    });
    expect(root.committeeState.sanctions.Algeria).toBeUndefined();
    expect(root.committeeState.sanctionedCountries).toEqual([]);
  });

  it('handles resetMode resetting all crisis fields', () => {
    const root = toDbForm(createSeed()) as any;
    applyUpdates(root, {
      'committeeState/currentMode': 'BARTER_CRISIS',
      'committeeState/activeCrisisBanner': 'CRISIS',
      'committeeState/sanctionedCountries': ['Russia'],
      'committeeState/crisisAlert': { id: 'alert-1', kind: 'BARTER' },
    });
    applyUpdates(root, {
      'committeeState/currentMode': 'NORMAL',
      'committeeState/activeCrisisBanner': '',
      'committeeState/crisisAlert': null,
      'committeeState/sanctions': null,
      'committeeState/sanctionedCountries': [],
    });
    expect(root.committeeState.currentMode).toBe('NORMAL');
    expect(root.committeeState.activeCrisisBanner).toBe('');
    expect(root.committeeState.crisisAlert).toBeUndefined();
    expect(root.committeeState.sanctions).toBeUndefined();
    expect(root.committeeState.sanctionedCountries).toEqual([]);
  });
});

describe('applyValueChange', () => {
  it('a 12% sanction drop makes the currency lose 12% of its value', () => {
    const c = applyValueChange({ name: 'x', rateToUSD: 88, change24h: 0, history: [88] }, -12);
    expect(c.rateToUSD).toBe(100);
    expect(c.change24h).toBe(-12);
    expect(c.history).toEqual([88, 100]);
  });
  it('appreciation lowers the local-per-USD rate', () => {
    const c = applyValueChange({ name: 'x', rateToUSD: 105, change24h: 0, history: [105] }, 5);
    expect(c.rateToUSD).toBe(100);
  });
});

describe('delegation PINs & trade lifecycle', () => {
  it('seeds and normalizes delegation PINs for all 22 countries', () => {
    const s = normalize(null);
    expect(s.delegationPins['Brazil']).toBe('1042');
    expect(s.delegationPins['Russian Federation']).toBe('2084');
    expect(s.delegationPins['India']).toBe('3019');
    expect(s.delegationPins['China']).toBe('4055');
    expect(s.delegationPins['South Africa']).toBe('5071');
    expect(s.delegationPins['Egypt']).toBe('9036');
    expect(s.delegationPins['Ethiopia']).toBe('1152');
    expect(s.delegationPins['Indonesia']).toBe('2267');
    expect(s.delegationPins['Algeria']).toBe('8014');
    expect(s.delegationPins['Saudi Arabia']).toBe('6023');
    expect(s.delegationPins['United Arab Emirates']).toBe('7088');
    expect(s.delegationPins['Uzbekistan']).toBe('3312');
    expect(s.delegationPins['Belarus']).toBe('5541');
    expect(s.delegationPins['Bolivia']).toBe('7729');
    expect(s.delegationPins['Cuba']).toBe('6618');
    expect(s.delegationPins['Kazakhstan']).toBe('4483');
    expect(s.delegationPins['Malaysia']).toBe('9921');
    expect(s.delegationPins['Nigeria']).toBe('8834');
    expect(s.delegationPins['Thailand']).toBe('2249');
    expect(s.delegationPins['Vietnam']).toBe('1193');
    expect(s.delegationPins['Uganda']).toBe('5582');
    expect(s.delegationPins['Türkiye']).toBe('6670');
  });

  it('allows overriding delegation PINs via raw state updates', () => {
    const raw = toDbForm(createSeed()) as any;
    raw.delegationPins = { Brazil: '9999' };
    const s = normalize(raw);
    expect(s.delegationPins['Brazil']).toBe('9999');
    expect(s.delegationPins['India']).toBe('3019');
  });

  it('normalizes multi-stage trade statuses', () => {
    const raw = toDbForm(createSeed()) as any;
    raw.trades = {
      t1: { id: 't1', from: 'Brazil', to: 'India', status: 'PENDING_COUNTERPARTY', createdAt: 1 },
      t2: { id: 't2', from: 'China', to: 'Russia', status: 'AWAITING_CHAIR', createdAt: 2 },
      t3: { id: 't3', from: 'Egypt', to: 'Algeria', status: 'APPROVED', createdAt: 3 },
    };
    const s = normalize(raw);
    expect(s.trades[0].status).toBe('PENDING_COUNTERPARTY');
    expect(s.trades[1].status).toBe('AWAITING_CHAIR');
    expect(s.trades[2].status).toBe('APPROVED');
  });
});

describe('NDB Sovereign Exchange', () => {
  it('initializes exchangeState with 5 tickers, OPEN status, and 22 portfolios', () => {
    const s = normalize(null);
    expect(s.exchangeState.marketStatus).toBe('OPEN');
    expect(Object.keys(s.exchangeState.tickers)).toEqual(['GOLD', 'UST', 'URALS', 'AGRI', 'TECH']);
    expect(s.exchangeState.tickers.GOLD.currentPrice).toBe(2400);
    expect(s.exchangeState.tickers.UST.currentPrice).toBe(100);
    expect(s.exchangeState.tickers.URALS.currentPrice).toBe(75);
    expect(s.exchangeState.tickers.AGRI.currentPrice).toBe(450);
    expect(s.exchangeState.tickers.TECH.currentPrice).toBe(120);

    expect(s.exchangeState.portfolios['Brazil'].cash).toBe(10_000_000);
    expect(s.exchangeState.portfolios['China'].cash).toBe(10_000_000);
    expect(s.exchangeState.portfolios['Russian Federation'].holdings.GOLD).toBe(0);
  });

  it('normalizes market status correctly when closed', () => {
    const raw = toDbForm(createSeed()) as any;
    raw.exchangeState = { marketStatus: 'CLOSED' };
    const s = normalize(raw);
    expect(s.exchangeState.marketStatus).toBe('CLOSED');
  });

  it('calculates portfolio valuation accurately for long, short, and cash positions', () => {
    const tickers = { ...DEFAULT_TICKERS };

    // Pure cash
    const pf1 = { cash: 10_000_000, holdings: { GOLD: 0, UST: 0, URALS: 0, AGRI: 0, TECH: 0 } };
    expect(calculatePortfolioValue(pf1, tickers)).toBe(10_000_000);

    // Long 100 GOLD @ 2400 ($240,000) with 9,760,000 cash -> Total 10,000,000
    const pf2 = { cash: 9_760_000, holdings: { GOLD: 100, UST: 0, URALS: 0, AGRI: 0, TECH: 0 } };
    expect(calculatePortfolioValue(pf2, tickers)).toBe(10_000_000);

    // If GOLD price rises to 3,000
    const rallyTickers = { ...tickers, GOLD: { ...tickers.GOLD, currentPrice: 3000 } };
    expect(calculatePortfolioValue(pf2, rallyTickers)).toBe(10_060_000);

    // Short 100 GOLD @ 2400 (deducted 240,000 margin, 9,760,000 cash remaining).
    // If GOLD price crashes to 2,000, short position value is: 100 * (2*2400 - 2000) = 280,000.
    // Total net worth = 9,760,000 + 280,000 = 10,040,000 ($40,000 profit).
    const pfShort = {
      cash: 9_760_000,
      holdings: { GOLD: -100, UST: 0, URALS: 0, AGRI: 0, TECH: 0 },
      shortAvgPrice: { GOLD: 2400, UST: 0, URALS: 0, AGRI: 0, TECH: 0 },
    };
    const crashTickers = { ...tickers, GOLD: { ...tickers.GOLD, currentPrice: 2000 } };
    expect(calculatePortfolioValue(pfShort, crashTickers)).toBe(10_040_000);
  });
});



