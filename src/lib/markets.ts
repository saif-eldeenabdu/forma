import type { Currency } from './types';

export const PEGGED = ['SAR', 'AED'];
export const HISTORY_CAP = 24;

export function roundRate(rate: number): number {
  if (rate >= 100) return Math.round(rate * 100) / 100;
  if (rate >= 10) return Math.round(rate * 100) / 100;
  return Math.round(rate * 1000) / 1000;
}

/**
 * Apply a change in the *value* of the local currency against USD.
 * +5 => currency appreciates 5% (fewer local units per USD); -12 => currency loses 12% of its value.
 */
export function applyValueChange(c: Currency, valuePct: number): Currency {
  const next = roundRate(c.rateToUSD / (1 + valuePct / 100));
  return {
    ...c,
    rateToUSD: next,
    change24h: Math.round(valuePct * 100) / 100,
    history: [...c.history, next].slice(-HISTORY_CAP),
  };
}

export const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

export function fmtRate(rate: number): string {
  if (rate >= 100) return rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (rate >= 10) return rate.toFixed(2);
  return rate.toFixed(3);
}
