export type Mode = 'NORMAL' | 'BARTER_CRISIS' | 'SWIFT_BLACKOUT' | 'BOND_DUMP';
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
export type AlertKind = 'BARTER' | 'BOND_DUMP' | 'SANCTION' | 'CUSTOM';

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
  pressure: Record<string, string>;
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
export type TradeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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

export interface Directive {
  id: string;
  from: string;
  subject: string;
  body: string;
  createdAt: number;
}

export interface RootState {
  committeeState: CommitteeState;
  currencies: Record<string, Currency>;
  motions: Motion[];
  newsTicker: string[];
  trades: Trade[];
  directives: Directive[];
}

/** Multi-path update map: `a/b/c` -> value (null deletes). Mirrors Firebase `update()`. */
export type Updates = Record<string, unknown>;
