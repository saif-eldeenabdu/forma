import type { GrainCommodity, GrainContract, GrainStock } from '../lib/types';
import { byName } from './countries';

export const USD_SURCHARGE_PCT = 8;
export const BRICS_PAY_ADOPTION_BOOST = 0.5;

export interface GrainType {
  id: GrainCommodity;
  /** Full desk label. */
  label: string;
  /** Short name used in ledger lines. */
  short: string;
  key: keyof GrainStock;
  defaultExporter: string;
  defaultStockMT: number;
}

export const GRAIN_TYPES: GrainType[] = [
  { id: 'WHEAT', label: 'Russian Milling Wheat (MT)', short: 'Wheat', key: 'wheat', defaultExporter: 'Russian Federation', defaultStockMT: 5_000_000 },
  { id: 'SOY', label: 'Brazilian Non-GMO Soybeans (MT)', short: 'Soybeans', key: 'soy', defaultExporter: 'Brazil', defaultStockMT: 4_200_000 },
  { id: 'RICE', label: 'Indian Basmati & Non-Basmati Rice (MT)', short: 'Rice', key: 'rice', defaultExporter: 'India', defaultStockMT: 3_100_000 },
];

export const grainType = (id: GrainCommodity): GrainType => GRAIN_TYPES.find((g) => g.id === id)!;

/** Default stockpile for a delegation: exporters hold their crop, everyone else is an importer (0 MT). */
export function defaultStock(country: string): GrainStock {
  const s: GrainStock = { wheat: 0, soy: 0, rice: 0 };
  for (const g of GRAIN_TYPES) if (g.defaultExporter === country) s[g.key] = g.defaultStockMT;
  return s;
}

export const fmtMT = (n: number): string => `${Math.round(n).toLocaleString('en-US')} MT`;

/** Public settlement ledger line for an approved grain contract. */
export function grainLedgerLine(c: GrainContract): string {
  const g = grainType(c.commodity);
  const qty = Math.round(c.quantityMT).toLocaleString('en-US');
  const via =
    c.settlement === 'BRICS_PAY'
      ? `BRICS Pay (${byName(c.importer)?.currencyCode ?? '???'}/${byName(c.exporter)?.currencyCode ?? '???'})`
      : `USD (+${c.feePct}% Western clearing surcharge)`;
  return `GRAIN CLEARING: ${c.importer} purchased ${qty} MT ${g.short} from ${c.exporter} via ${via}.`;
}
