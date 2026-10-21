import type { RootState } from './types';
import { COUNTRY_NAMES, DEFAULT_DELEGATION_PINS } from '../data/countries';
import { defaultStock } from '../data/grain';
import { DEFAULT_TICKERS, defaultPortfolio } from '../data/exchange';

/** Exact initial RTDB structure from the master spec (plus Chair-engine nodes). */
export function createSeed(now = Date.now()): RootState {
  return {
    committeeState: {
      currentMode: 'NORMAL',
      activeCrisisBanner: '',
      usdDominanceIndex: 58.4,
      bricsUnitConfidence: 64.0,
      goldBackingRatio: 40,
      bricsPayAdoption: 45,
      timer: {
        type: 'GSL',
        totalSeconds: 90,
        remainingSeconds: 90,
        modTotalSeconds: 600,
        modRemainingSeconds: 600,
        isRunning: false,
        currentSpeaker: 'Brazil',
        yieldTo: 'None',
        lastUpdated: now,
      },
      gslQueue: ['Brazil', 'Russian Federation', 'India', 'China', 'South Africa'],
      gslRequests: [],
      projectedMotionId: '',
      crisisAlert: null,
      sanctions: {},
      sanctionedCountries: [],
      pressure: {},
      suezTollCurrency: 'USD',
      assetFreeze: null,
    },
    currencies: {
      BRL: { name: 'Brazilian Real', rateToUSD: 5.15, change24h: 0.4, history: [5.25, 5.22, 5.19, 5.15] },
      RUB: { name: 'Russian Ruble', rateToUSD: 92.5, change24h: -1.2, history: [90.0, 91.2, 93.0, 92.5] },
      INR: { name: 'Indian Rupee', rateToUSD: 83.8, change24h: 0.1, history: [84.1, 84.0, 83.9, 83.8] },
      CNY: { name: 'Chinese Yuan', rateToUSD: 7.12, change24h: 0.8, history: [7.25, 7.2, 7.15, 7.12] },
      ZAR: { name: 'South African Rand', rateToUSD: 18.1, change24h: -0.3, history: [18.0, 18.2, 18.15, 18.1] },
      EGP: { name: 'Egyptian Pound', rateToUSD: 48.5, change24h: -0.5, history: [48.0, 48.2, 48.4, 48.5] },
      ETB: { name: 'Ethiopian Birr', rateToUSD: 115.0, change24h: -0.9, history: [112.0, 113.5, 114.2, 115.0] },
      DZD: { name: 'Algerian Dinar', rateToUSD: 134.5, change24h: 0.2, history: [134.8, 134.7, 134.6, 134.5] },
      SAR: { name: 'Saudi Riyal', rateToUSD: 3.75, change24h: 0.0, history: [3.75, 3.75, 3.75, 3.75] },
      AED: { name: 'UAE Dirham', rateToUSD: 3.67, change24h: 0.0, history: [3.67, 3.67, 3.67, 3.67] },
      IDR: { name: 'Indonesian Rupiah (x1000)', rateToUSD: 15.6, change24h: 0.3, history: [15.8, 15.7, 15.65, 15.6] },
      UZS: { name: 'Uzbekistani Som (x1000)', rateToUSD: 12.8, change24h: -0.1, history: [12.7, 12.75, 12.78, 12.8] },
      BYN: { name: 'Belarusian Ruble', rateToUSD: 3.28, change24h: 0.1, history: [3.26, 3.27, 3.27, 3.28] },
      BOB: { name: 'Boliviano', rateToUSD: 6.91, change24h: 0.0, history: [6.91, 6.91, 6.91, 6.91] },
      CUP: { name: 'Cuban Peso', rateToUSD: 24.0, change24h: 0.0, history: [24.0, 24.0, 24.0, 24.0] },
      KZT: { name: 'Kazakhstani Tenge', rateToUSD: 495.0, change24h: 0.3, history: [492, 493, 494, 495] },
      MYR: { name: 'Malaysian Ringgit', rateToUSD: 4.42, change24h: 0.5, history: [4.46, 4.45, 4.43, 4.42] },
      NGN: { name: 'Nigerian Naira (x100)', rateToUSD: 16.5, change24h: -1.2, history: [16.1, 16.2, 16.4, 16.5] },
      THB: { name: 'Thai Baht', rateToUSD: 34.5, change24h: 0.4, history: [34.8, 34.7, 34.6, 34.5] },
      VND: { name: 'Vietnamese Dong (x1000)', rateToUSD: 25.4, change24h: -0.2, history: [25.3, 25.35, 25.38, 25.4] },
      UGX: { name: 'Ugandan Shilling (x1000)', rateToUSD: 3.68, change24h: -0.4, history: [3.65, 3.66, 3.67, 3.68] },
      TRY: { name: 'Turkish Lira', rateToUSD: 34.2, change24h: -0.8, history: [33.8, 33.9, 34.1, 34.2] },
    },
    motions: [],
    newsTicker: [
      'NEW DELHI 2026 SUMMIT: Reserve Bank of India places BRICS CBDC Bridge at top of committee agenda.',
      'MARKET UPDATE: New Development Bank (NDB) expands local-currency bond issuances to reduce USD exposure.',
      'BRICS PAY: Decentralized Cross-Border Messaging System (DCMS) hits 20,000 messages/second in pilot testing.',
    ],
    trades: [],
    directives: [],
    grainStockpiles: Object.fromEntries(COUNTRY_NAMES.map((c) => [c, defaultStock(c)])),
    grainContracts: [],
    delegationPins: { ...DEFAULT_DELEGATION_PINS },
    exchangeState: {
      marketStatus: 'OPEN',
      tickers: { ...DEFAULT_TICKERS },
      portfolios: Object.fromEntries(COUNTRY_NAMES.map((c) => [c, defaultPortfolio()])),
    },
  };
}
