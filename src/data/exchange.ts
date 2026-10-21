import type { DelegationPortfolio, ExchangeTicker, TickerSymbol } from '../lib/types';

export const STARTING_CASH = 10_000_000; // $10,000,000

export const DEFAULT_TICKERS: Record<TickerSymbol, ExchangeTicker> = {
  GOLD: {
    symbol: 'GOLD',
    name: 'Physical Gold Bullion',
    currentPrice: 2400,
    change24h: 1.2,
    history: [2340, 2355, 2370, 2365, 2385, 2400],
    unit: 'troy oz',
    color: '#D4AF37', // Gold
  },
  UST: {
    symbol: 'UST',
    name: 'US 10Y Treasury Bond',
    currentPrice: 100,
    change24h: -0.8,
    history: [102.5, 102.0, 101.4, 100.9, 100.5, 100],
    unit: 'bonds',
    color: '#3B82F6', // Blue
  },
  URALS: {
    symbol: 'URALS',
    name: 'Urals Heavy Crude Oil',
    currentPrice: 75,
    change24h: 2.1,
    history: [71.5, 72.2, 73.0, 74.1, 73.5, 75],
    unit: 'bbl',
    color: '#EF4444', // Red
  },
  AGRI: {
    symbol: 'AGRI',
    name: 'Grain & Agri Futures Index',
    currentPrice: 450,
    change24h: -1.5,
    history: [465, 460, 458, 454, 448, 450],
    unit: 'contracts',
    color: '#10B981', // Emerald
  },
  TECH: {
    symbol: 'TECH',
    name: 'Strategic Battery Metals',
    currentPrice: 120,
    change24h: 3.4,
    history: [112, 114, 115.5, 117, 118.2, 120],
    unit: 'kg',
    color: '#A855F7', // Purple
  },
};

export const TICKER_SYMBOLS: TickerSymbol[] = ['GOLD', 'UST', 'URALS', 'AGRI', 'TECH'];

export function defaultPortfolio(): DelegationPortfolio {
  return {
    cash: STARTING_CASH,
    holdings: {
      GOLD: 0,
      UST: 0,
      URALS: 0,
      AGRI: 0,
      TECH: 0,
    },
    shortAvgPrice: {
      GOLD: 0,
      UST: 0,
      URALS: 0,
      AGRI: 0,
      TECH: 0,
    },
  };
}

export function calculatePortfolioValue(
  portfolio: DelegationPortfolio,
  tickers: Record<TickerSymbol, ExchangeTicker>,
): number {
  if (!portfolio) return STARTING_CASH;
  let val = portfolio.cash ?? STARTING_CASH;
  const holdings: Partial<Record<TickerSymbol, number>> = portfolio.holdings || {};
  const shortPrices: Partial<Record<TickerSymbol, number>> = portfolio.shortAvgPrice || {};

  for (const sym of TICKER_SYMBOLS) {
    const qty = holdings[sym] ?? 0;
    const ticker = tickers[sym] ?? DEFAULT_TICKERS[sym];
    const currentPrice = ticker?.currentPrice ?? 1;

    if (qty > 0) {
      val += qty * currentPrice;
    } else if (qty < 0) {
      const absQty = Math.abs(qty);
      const sPrice = shortPrices[sym];
      const shortPrice = typeof sPrice === 'number' && sPrice > 0 ? sPrice : currentPrice;
      const positionVal = Math.max(0, absQty * (2 * shortPrice - currentPrice));
      val += positionVal;
    }
  }
  return Math.round(val * 100) / 100;
}
