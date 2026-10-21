export type Mode = 'NORMAL' | 'BARTER_CRISIS' | 'SWIFT_BLACKOUT' | 'BOND_DUMP' | 'ASSET_FREEZE';
export type TimerType = 'GSL' | 'MOD' | 'UNMOD';

export interface TimerState {
  type: TimerType;
  totalSeconds: number;
  remainingSeconds: number;
  modTotalSeconds: number;
  modRemainingSeconds: number;
  isRunning: boolean;
  currentSpeaker: string;
  yieldTo: string;
  yieldedFrom?: string;
  lastUpdated: number;
}

export interface GslRequest {
  id: string;
  country: string;
  at: number;
}

export type Severity = 'WARNING' | 'CRITICAL' | 'ABSURD';
export type AlertKind = 'BARTER' | 'BOND_DUMP' | 'SANCTION' | 'FREEZE' | 'CUSTOM';

export interface CrisisAlert {
  id: string;
  kind: AlertKind;
  severity: Severity;
  title: string;
  body: string;
  at: number;
}

export interface Sanction {
  at: number;
  until: number;
}

export type SuezCurrency = 'USD' | 'BRICS_PAY';

export interface AssetFreeze {
  country: string;
  amountB: number;
  at: number;
  /** Delegations that have co-sponsored BRICS Clear (normalised from an id-keyed map). */
  signers: string[];
}

export interface CommitteeState {
  currentMode: Mode;
  activeCrisisBanner: string;
  usdDominanceIndex: number;
  bricsUnitConfidence: number;
  goldBackingRatio: number;
  bricsPayAdoption: number;
  timer: TimerState;
  gslQueue: string[];
  gslRequests: GslRequest[];
  projectedMotionId: string;
  crisisAlert: CrisisAlert | null;
  sanctions: Record<string, Sanction>;
  sanctionedCountries: string[];
  pressure: Record<string, string>;
  suezTollCurrency: SuezCurrency;
  assetFreeze: AssetFreeze | null;
}

export interface Currency {
  name: string;
  rateToUSD: number;
  change24h: number;
  history: number[];
}

export type MotionType =
  | 'Moderated Caucus'
  | 'Unmoderated Caucus'
  | 'Set Speaking Time'
  | 'Introduce Working Paper'
  | 'Table Debate';

export type MotionStatus = 'PENDING' | 'PROJECTED' | 'PASSED' | 'FAILED';

export interface Motion {
  id: string;
  delegation: string;
  type: MotionType;
  totalSeconds: number;
  speakerSeconds: number;
  topic: string;
  status: MotionStatus;
  createdAt: number;
}

export type TradeKind = 'SWAP' | 'BARTER';
export type TradeStatus = 'PENDING_COUNTERPARTY' | 'AWAITING_CHAIR' | 'APPROVED' | 'REJECTED' | 'PENDING';

export interface Trade {
  id: string;
  kind: TradeKind;
  from: string;
  to: string;
  offer: string;
  request: string;
  note: string;
  status: TradeStatus;
  createdAt: number;
  resolvedAt?: number;
}

export type GrainCommodity = 'WHEAT' | 'SOY' | 'RICE';
export type GrainSettlement = 'BRICS_PAY' | 'USD';

export interface GrainStock {
  wheat: number;
  soy: number;
  rice: number;
}

export interface GrainContract {
  id: string;
  importer: string;
  exporter: string;
  commodity: GrainCommodity;
  quantityMT: number;
  settlement: GrainSettlement;
  /** Clearing surcharge %: 0 for BRICS Pay / local currency, 8 for USD. */
  feePct: number;
  status: TradeStatus;
  createdAt: number;
  resolvedAt?: number;
}

export interface Directive {
  id: string;
  from: string;
  subject: string;
  body: string;
  createdAt: number;
  /** Actionable directives (e.g. Egypt's Suez decree) carry an action the Chair can approve. */
  action?: { type: 'SUEZ_TOLL'; currency: SuezCurrency };
  status?: 'PENDING' | 'APPROVED' | 'DISMISSED';
}

export type TickerSymbol = 'GOLD' | 'UST' | 'URALS' | 'AGRI' | 'TECH';

export interface ExchangeTicker {
  symbol: TickerSymbol;
  name: string;
  currentPrice: number;
  change24h: number;
  history: number[];
  unit: string;
  color: string;
}

export interface DelegationPortfolio {
  cash: number;
  holdings: Record<TickerSymbol, number>;
  shortAvgPrice?: Record<TickerSymbol, number>;
}

export type MarketStatus = 'OPEN' | 'CLOSED';

export interface ExchangeState {
  marketStatus: MarketStatus;
  tickers: Record<TickerSymbol, ExchangeTicker>;
  portfolios: Record<string, DelegationPortfolio>;
}

export interface RootState {
  committeeState: CommitteeState;
  currencies: Record<string, Currency>;
  motions: Motion[];
  newsTicker: string[];
  trades: Trade[];
  directives: Directive[];
  grainStockpiles: Record<string, GrainStock>;
  grainContracts: GrainContract[];
  delegationPins: Record<string, string>;
  exchangeState: ExchangeState;
}

/** Multi-path update map: `a/b/c` -> value (null deletes). Mirrors Firebase `update()`. */
export type Updates = Record<string, unknown>;
