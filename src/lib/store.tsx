import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createBackend, getSharedFirebaseBackend, toDbForm, type Backend, type SyncMode } from './backend';
import { createSeed } from './seed';
import { normalize } from './normalize';
import { deriveTimer } from './timer';
import { applyValueChange, clamp, PEGGED } from './markets';
import { uid } from './motions';
import { byName, COUNTRY_NAMES, DEFAULT_DELEGATION_PINS } from '../data/countries';
import { BRICS_PAY_ADOPTION_BOOST, USD_SURCHARGE_PCT, defaultStock, fmtMT, grainType } from '../data/grain';
import { DEFAULT_TICKERS, defaultPortfolio, STARTING_CASH } from '../data/exchange';
import type {
  BackchannelMessage,
  CrisisAlert,
  DelegationPortfolio,
  GossipItem,
  GrainCommodity,
  GrainSettlement,
  MarketStatus,
  Mode,
  Motion,
  MotionType,
  RootState,
  Severity,
  SuezCurrency,
  TickerSymbol,
  TimerType,
  Trade,
  TradeKind,
  Updates,
} from './types';

export const CHAIR_PIN = '0907';
export const BRICS_CLEAR_QUORUM = 6;

export type YieldKind = 'CHAIR' | 'DELEGATE' | 'QUESTIONS';

export interface Actions {
  // timer
  startTimer(): void;
  pauseTimer(): void;
  resetTimer(): void;
  setTimerType(type: TimerType): void;
  setTimerConfig(cfg: { speaker?: number; caucus?: number }): void;
  nextSpeaker(): void;
  setSpeaker(name: string): void;
  yieldTime(kind: YieldKind, target?: string): void;
  // gsl
  addToQueue(name: string): void;
  removeFromQueue(index: number): void;
  moveInQueue(index: number, dir: -1 | 1): void;
  requestGsl(country: string): void;
  approveGslRequest(id: string): void;
  dismissGslRequest(id: string): void;
  // motions
  submitMotion(m: { delegation: string; type: MotionType; totalSeconds: number; speakerSeconds: number; topic: string }): void;
  projectMotion(id: string): void;
  passMotion(id: string): void;
  failMotion(id: string): void;
  // markets
  shiftCurrency(code: string, valuePct: number): void;
  rally(): void;
  setMacro(patch: Partial<Pick<RootState['committeeState'], 'usdDominanceIndex' | 'bricsUnitConfidence' | 'goldBackingRatio' | 'bricsPayAdoption'>>): void;
  // news
  addNews(text: string): void;
  removeNews(index: number): void;
  // trades & directives
  submitTrade(t: { kind: TradeKind; from: string; to: string; offer: string; request: string; note: string }): void;
  acceptTradeCounterparty(id: string): void;
  declineTradeCounterparty(id: string): void;
  resolveTrade(id: string, approved: boolean): void;
  submitDirective(d: { from: string; subject: string; body: string }): void;
  // chaos engine
  triggerBarter(): void;
  triggerSwiftBlackout(): void;
  triggerBondDump(): void;
  imposeSanctions(country: string): void;
  liftSanctions(country?: string): void;
  customCrisis(c: { title: string; body: string; severity: Severity }): void;
  resetMode(): void;
  resetAll(): void;
  // delegation PINs
  setDelegationPin(country: string, pin: string): void;
  // asset freeze / BRICS Clear
  executeAssetFreeze(country: string, amountB: number): void;
  cosignBricsClear(country: string): void;
  ratifyBricsClear(): void;
  // suez
  setSuezToll(currency: SuezCurrency): void;
  submitSuezDirective(currency: SuezCurrency): void;
  resolveDirective(id: string, approve: boolean): void;
  // grain
  submitGrain(g: { importer: string; exporter: string; commodity: GrainCommodity; quantityMT: number; settlement: GrainSettlement }): void;
  resolveGrain(id: string, approved: boolean): void;
  // exchange
  executeExchangeOrder(order: { ticker: TickerSymbol; action: 'BUY' | 'SELL' | 'SHORT'; quantity: number; country: string }): void;
  setMarketStatus(status: MarketStatus): void;
  shiftTickerPrice(symbol: TickerSymbol, pctChange: number): void;
  // GSL auction
  placeGslBid(bid: number, country: string): void;
  // bailouts & reserves
  wireBailout(from: string, to: string, amount: number): void;
  injectBailout(country: string, amount: number): void;
  forceBankrupt(country: string): void;
  // dais protocols
  daisLiquidityFacility(target: string): void;
  daisFiatPenalty(target: string): void;
  daisMarginCall(): void;
  daisSettlementShock(): void;
  // backchannel & cyber attack
  sendBackchannelMessage(msg: { from: string; to: string; text: string }): void;
  leakBackchannelMessage(id: string): void;
  setCyberAttack(active: boolean): void;
  // gossip box
  submitGossip(message: string): void;
  toggleGossipRead(id: string, read?: boolean): void;
  deleteGossip(id: string): void;
  // toast
  showToast(msg: string): void;
}

interface Ctx {
  state: RootState;
  ready: boolean;
  syncMode: SyncMode;
  syncNote: string;
  now: () => number;
  me: string;
  reserves: number;
  bankrupt: boolean;
  setMe: (name: string) => void;
  claimDelegation: (country: string, pin: string) => boolean;
  releaseDelegation: () => void;
  isChair: boolean;
  unlock: (pin: string) => boolean;
  lock: () => void;
  actions: Actions;
  toast: string | null;
}

const StoreCtx = createContext<Ctx | null>(null);

const AUTH_DELEGATION_KEY = 'brics-net:auth-delegation';
const ME_KEY = 'brics-net:me';
const CHAIR_KEY = 'brics-net:chair';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RootState>(() => normalize(null));
  const [ready, setReady] = useState(false);
  const [backend, setBackend] = useState<Backend>(() => getSharedFirebaseBackend());
  const [syncNote, setSyncNote] = useState('');
  const [me, setMeState] = useState<string>(() => localStorage.getItem(AUTH_DELEGATION_KEY) || '');
  const [isChair, setIsChair] = useState<boolean>(
    () => sessionStorage.getItem(CHAIR_KEY) === '1' || localStorage.getItem(CHAIR_KEY) === '1',
  );
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3800);
  }, []);

  const stateRef = useRef(state);
  stateRef.current = state;
  const offsetRef = useRef(0);
  const now = useCallback(() => Date.now() + offsetRef.current, []);

  // boot backend
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let unsubOffset: (() => void) | undefined;
    let cancelled = false;

    // Immediately subscribe to current local backend so state is active on frame 0
    unsub = backend.subscribe((raw) => {
      setState(normalize(raw));
      setReady(true);
    });

    (async () => {
      const { backend: b, fallbackReason } = await createBackend();
      if (cancelled) return;
      setSyncNote(fallbackReason ?? '');
      unsubOffset = b.onOffset((o) => {
        offsetRef.current = o;
      });
      if (b !== backend) {
        unsub?.();
        unsub = b.subscribe((raw) => {
          setState(normalize(raw));
          setReady(true);
        });
        setBackend(b);
      }
    })();
    return () => {
      cancelled = true;
      unsub?.();
      unsubOffset?.();
    };
  }, []);

  const actions = useMemo<Actions>(() => {
    const write = (u: Updates) => {
      void backend.update(u).catch((e) => console.error('[BRICS-NET] write failed', e));
    };
    const S = () => stateRef.current;
    const timerPatch = (patch: Record<string, unknown>): Updates => {
      const u: Updates = { 'committeeState/timer/lastUpdated': now() };
      for (const [k, v] of Object.entries(patch)) u[`committeeState/timer/${k}`] = v;
      return u;
    };
    /** Freeze the derived remaining values into the snapshot (used by pause/reset/yield). */
    const frozen = () => {
      const t = S().committeeState.timer;
      const d = deriveTimer(t, now());
      return { remainingSeconds: Math.round(d.speaker * 1000) / 1000, modRemainingSeconds: Math.round(d.caucus * 1000) / 1000 };
    };
    const news = (text: string): Updates => {
      const list = [...S().newsTicker, text].slice(-12);
      return { newsTicker: list };
    };
    const alertOf = (a: Omit<CrisisAlert, 'id' | 'at'>): CrisisAlert => ({ ...a, id: uid(), at: now() });

    const applyAll = (valuePctFor: (code: string) => number, base: Updates = {}): Updates => {
      const u = { ...base };
      for (const [code, cur] of Object.entries(S().currencies)) {
        const v = valuePctFor(code);
        u[`currencies/${code}`] = applyValueChange(cur, v);
      }
      return u;
    };
    // deterministic-ish per-code spread so a rally looks organic
    const spread = (code: string, lo: number, hi: number) => {
      let h = 0;
      for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 997;
      return lo + ((h % 100) / 100) * (hi - lo);
    };
    /** Updates for switching the Suez toll currency (inverse applied when reverting). Null if unchanged. */
    const suezUpdates = (to: SuezCurrency): Updates | null => {
      const cs = S().committeeState;
      if (cs.suezTollCurrency === to) return null;
      const sign = to === 'BRICS_PAY' ? 1 : -1;
      const egp = S().currencies['EGP'];
      const u: Updates = {
        'committeeState/suezTollCurrency': to,
        'committeeState/usdDominanceIndex': clamp(Math.round((cs.usdDominanceIndex - 3.5 * sign) * 10) / 10, 0, 100),
        'committeeState/bricsPayAdoption': clamp(Math.round((cs.bricsPayAdoption + 8 * sign) * 10) / 10, 0, 100),
        ...news(
          to === 'BRICS_PAY'
            ? 'CAIRO ISSUES DECREE 144: All maritime transit through the Suez Canal must now settle dues in BRICS Pay or Egyptian Pounds. Global shipping clearinghouses begin urgent currency conversions.'
            : 'CAIRO: Suez Canal toll billing reverts to USD. Shipping clearinghouses unwind BRICS Pay conversions.',
        ),
      };
      if (egp) u['currencies/EGP'] = applyValueChange(egp, 2.8 * sign);
      return u;
    };

    const a: Actions = {
      startTimer() {
        const f = frozen();
        write(timerPatch({ ...f, isRunning: true }));
        showToast('TIMER STARTED');
      },
      pauseTimer() {
        write(timerPatch({ ...frozen(), isRunning: false }));
        showToast('TIMER PAUSED');
      },
      resetTimer() {
        const t = S().committeeState.timer;
        write(
          timerPatch({
            remainingSeconds: t.totalSeconds,
            modRemainingSeconds: t.modTotalSeconds,
            isRunning: false,
            yieldTo: 'None',
            yieldedFrom: null,
          }),
        );
        showToast('TIMER RESET');
      },
      setTimerType(type) {
        const t = S().committeeState.timer;
        write(
          timerPatch({
            type,
            remainingSeconds: t.totalSeconds,
            modRemainingSeconds: t.modTotalSeconds,
            isRunning: false,
            yieldTo: 'None',
            yieldedFrom: null,
          }),
        );
        showToast(`TIMER MODE: ${type === 'GSL' ? 'GSL' : type === 'MOD' ? 'MODERATED CAUCUS' : 'UNMODERATED CAUCUS'}`);
      },
      setTimerConfig({ speaker, caucus }) {
        const p: Record<string, unknown> = { isRunning: false };
        if (speaker != null) {
          p.totalSeconds = speaker;
          p.remainingSeconds = speaker;
        }
        if (caucus != null) {
          p.modTotalSeconds = caucus;
          p.modRemainingSeconds = caucus;
        }
        write(timerPatch(p));
        showToast('TIMER CONFIG UPDATED');
      },
      nextSpeaker() {
        const cs = S().committeeState;
        if (!cs.gslQueue || cs.gslQueue.length === 0) {
          showToast('GSL QUEUE EMPTY');
          return;
        }
        const speakerItem = cs.gslQueue[0];
        const nextCountry = speakerItem.country;
        const bidAmount = speakerItem.bid || 0;
        const queue = cs.gslQueue.slice(1);

        const curPf = S().exchangeState?.portfolios?.[nextCountry];
        const currentCash = curPf?.cash ?? STARTING_CASH;
        const newCash = Math.max(0, Math.round(currentCash - bidAmount));

        const u: Updates = {
          ...timerPatch({
            currentSpeaker: nextCountry,
            remainingSeconds: cs.timer.totalSeconds,
            isRunning: false,
            yieldTo: 'None',
            yieldedFrom: null,
          }),
          'committeeState/gslQueue': queue,
          [`exchangeState/portfolios/${nextCountry}/cash`]: newCash,
        };
        write(u);
        showToast(`SPEAKER ADVANCED: ${nextCountry} (Deducted $${bidAmount.toLocaleString()} bid)`);
      },
      setSpeaker(name) {
        write(timerPatch({ currentSpeaker: name, yieldTo: 'None', yieldedFrom: null }));
        showToast(`SPEAKER SET: ${name}`);
      },
      yieldTime(kind, target) {
        const t = S().committeeState.timer;
        if (t.type === 'MOD') return; // no yields during a Mod
        if (kind === 'CHAIR') {
          write(timerPatch({ remainingSeconds: 0, isRunning: false, yieldTo: 'Chair', yieldedFrom: null }));
        } else if (kind === 'QUESTIONS') {
          write(timerPatch({ ...frozen(), yieldTo: 'Questions/Comments' }));
        } else if (target) {
          write(
            timerPatch({
              ...frozen(),
              currentSpeaker: target,
              yieldTo: target,
              yieldedFrom: t.currentSpeaker,
            }),
          );
        }
      },

      placeGslBid(bid, country) {
        if (!country) {
          showToast('AUTHENTICATION REQUIRED: Claim country before bidding');
          return;
        }
        const b = Math.floor(bid);
        if (b < 100_000) {
          showToast('MINIMUM BID: $100,000 required for GSL auction');
          return;
        }
        const S_state = S();
        const currentReserves = S_state.exchangeState?.portfolios?.[country]?.cash ?? STARTING_CASH;
        if (currentReserves <= 0) {
          showToast('SOVEREIGN DEFAULT (GGs): Treasury empty. Bidding locked.');
          return;
        }

        const q = [...(S_state.committeeState.gslQueue || [])];
        const existingIndex = q.findIndex((x) => x.country === country);

        let finalBid = b;
        if (existingIndex >= 0) {
          finalBid = q[existingIndex].bid + b;
          if (finalBid > currentReserves) {
            showToast(`EXCEEDS RESERVES: Total bid ($${finalBid.toLocaleString()}) exceeds liquid reserves ($${Math.round(currentReserves).toLocaleString()})`);
            return;
          }
          q[existingIndex] = {
            country,
            bid: finalBid,
            timestamp: now(),
          };
        } else {
          if (b > currentReserves) {
            showToast(`EXCEEDS RESERVES: Bid ($${b.toLocaleString()}) exceeds liquid reserves ($${Math.round(currentReserves).toLocaleString()})`);
            return;
          }
          q.push({
            country,
            bid: b,
            timestamp: now(),
          });
        }

        q.sort((a, bItem) => bItem.bid - a.bid || a.timestamp - bItem.timestamp);

        write({ 'committeeState/gslQueue': q });
        showToast(`GSL BID PLACED: ${country} — $${finalBid.toLocaleString()}`);
      },
      addToQueue(name) {
        const q = [...(S().committeeState.gslQueue || [])];
        if (!q.some((x) => x.country === name)) {
          q.push({ country: name, bid: 0, timestamp: now() });
          q.sort((a, b) => b.bid - a.bid || a.timestamp - b.timestamp);
          write({ 'committeeState/gslQueue': q });
          showToast(`GSL: Added ${name}`);
        }
      },
      removeFromQueue(index) {
        const q = S().committeeState.gslQueue.filter((_, i) => i !== index);
        write({ 'committeeState/gslQueue': q });
        showToast('GSL: Removed from queue');
      },
      moveInQueue(index, dir) {
        const q = [...S().committeeState.gslQueue];
        const j = index + dir;
        if (j < 0 || j >= q.length) return;
        [q[index], q[j]] = [q[j], q[index]];
        write({ 'committeeState/gslQueue': q });
      },
      requestGsl(country) {
        const cs = S().committeeState;
        if (cs.gslQueue.some((x) => x.country === country) || cs.gslRequests.some((r) => r.country === country)) return;
        const id = uid();
        write({ [`committeeState/gslRequests/${id}`]: { id, country, at: now() } });
      },
      approveGslRequest(id) {
        const cs = S().committeeState;
        const r = cs.gslRequests.find((x) => x.id === id);
        if (!r) return;
        const q = [...cs.gslQueue];
        if (!q.some((x) => x.country === r.country)) {
          q.push({ country: r.country, bid: 0, timestamp: now() });
          q.sort((a, b) => b.bid - a.bid || a.timestamp - b.timestamp);
        }
        write({
          [`committeeState/gslRequests/${id}`]: null,
          'committeeState/gslQueue': q,
        });
        showToast(`GSL REQUEST APPROVED: ${r.country}`);
      },
      dismissGslRequest(id) {
        write({ [`committeeState/gslRequests/${id}`]: null });
        showToast('GSL REQUEST DISMISSED');
      },

      submitMotion(m) {
        const id = uid();
        const motion: Motion = { id, ...m, status: 'PENDING', createdAt: now() };
        write({ [`motions/${id}`]: motion });
      },
      projectMotion(id) {
        write({ 'committeeState/projectedMotionId': id, [`motions/${id}/status`]: 'PROJECTED' });
        showToast('MOTION PROJECTED TO FLOOR');
      },
      passMotion(id) {
        const m = S().motions.find((x) => x.id === id);
        if (!m) return;
        const u: Updates = { [`motions/${id}/status`]: 'PASSED' };
        if (S().committeeState.projectedMotionId === id) u['committeeState/projectedMotionId'] = '';
        if (m.type === 'Moderated Caucus') {
          Object.assign(
            u,
            timerPatch({
              type: 'MOD',
              modTotalSeconds: m.totalSeconds,
              modRemainingSeconds: m.totalSeconds,
              totalSeconds: m.speakerSeconds,
              remainingSeconds: m.speakerSeconds,
              isRunning: false,
              yieldTo: 'None',
              yieldedFrom: null,
            }),
          );
        } else if (m.type === 'Unmoderated Caucus') {
          Object.assign(
            u,
            timerPatch({
              type: 'UNMOD',
              modTotalSeconds: m.totalSeconds,
              modRemainingSeconds: m.totalSeconds,
              isRunning: false,
              yieldTo: 'None',
              yieldedFrom: null,
            }),
          );
        } else if (m.type === 'Set Speaking Time') {
          Object.assign(
            u,
            timerPatch({ totalSeconds: m.speakerSeconds, remainingSeconds: m.speakerSeconds, isRunning: false }),
          );
        }
        write(u);
        showToast(`MOTION PASSED: ${m.type} (${m.delegation})`);
      },
      failMotion(id) {
        const m = S().motions.find((x) => x.id === id);
        const u: Updates = { [`motions/${id}/status`]: 'FAILED' };
        if (S().committeeState.projectedMotionId === id) u['committeeState/projectedMotionId'] = '';
        write(u);
        showToast(`MOTION DISMISSED: ${m ? m.type : 'Motion'}`);
      },

      shiftCurrency(code, valuePct) {
        const cur = S().currencies[code];
        if (!cur) return;
        write({ [`currencies/${code}`]: applyValueChange(cur, valuePct) });
        showToast(`CURRENCY SHIFT: ${code} ${valuePct > 0 ? '+' : ''}${valuePct.toFixed(1)}%`);
      },
      rally() {
        const cs = S().committeeState;
        write({
          ...applyAll((code) => (PEGGED.includes(code) ? 0 : Math.round(spread(code, 1.2, 3.2) * 10) / 10)),
          'committeeState/usdDominanceIndex': clamp(Math.round((cs.usdDominanceIndex - 1.2) * 10) / 10, 0, 100),
          'committeeState/bricsUnitConfidence': clamp(Math.round((cs.bricsUnitConfidence + 2) * 10) / 10, 0, 100),
          'committeeState/bricsPayAdoption': clamp(cs.bricsPayAdoption + 2, 0, 100),
          ...news('MARKETS: De-dollarization rally lifts BRICS currencies across the board.'),
        });
        showToast('MARKET RALLY: De-dollarization surge executed');
      },
      setMacro(patch) {
        const u: Updates = {};
        for (const [k, v] of Object.entries(patch)) u[`committeeState/${k}`] = v;
        write(u);
        showToast('MACRO INDICATORS UPDATED');
      },

      addNews(text) {
        const t = text.trim();
        if (!t) return;
        write(news(t));
        showToast(`WIRE PUBLISHED: ${t}`);
      },
      removeNews(index) {
        write({ newsTicker: S().newsTicker.filter((_, i) => i !== index) });
        showToast('WIRE HEADLINE REMOVED');
      },

      submitTrade(t) {
        const id = uid();
        const trade: Trade = { id, ...t, status: 'PENDING_COUNTERPARTY', createdAt: now() };
        write({ [`trades/${id}`]: trade });
        showToast(`TRADE PROPOSAL SENT TO ${t.to.toUpperCase()}`);
      },
      acceptTradeCounterparty(id) {
        const tr = S().trades.find((x) => x.id === id);
        write({ [`trades/${id}/status`]: 'AWAITING_CHAIR' });
        showToast(`TRADE ACCEPTED: Sent to Chair (${tr ? tr.from : ''} ⇄ ${tr ? tr.to : ''})`);
      },
      declineTradeCounterparty(id) {
        const tr = S().trades.find((x) => x.id === id);
        write({
          [`trades/${id}/status`]: 'REJECTED',
          [`trades/${id}/resolvedAt`]: now(),
        });
        showToast(`TRADE DECLINED (${tr ? tr.from : ''} ⇄ ${tr ? tr.to : ''})`);
      },
      resolveTrade(id, approved) {
        const tr = S().trades.find((x) => x.id === id);
        if (!tr) return;
        const cs = S().committeeState;
        const u: Updates = {
          [`trades/${id}/status`]: approved ? 'APPROVED' : 'REJECTED',
          [`trades/${id}/resolvedAt`]: now(),
        };
        if (approved && tr.kind === 'SWAP') {
          u['committeeState/usdDominanceIndex'] = clamp(Math.round((cs.usdDominanceIndex - 0.1) * 10) / 10, 0, 100);
          u['committeeState/bricsPayAdoption'] = clamp(Math.round((cs.bricsPayAdoption + 0.4) * 10) / 10, 0, 100);
        }
        write(u);
        showToast(approved ? `TRADE APPROVED: ${tr.from} ⇄ ${tr.to}` : `TRADE REJECTED: ${tr.from} ⇄ ${tr.to}`);
      },
      submitDirective(d) {
        const id = uid();
        write({ [`directives/${id}`]: { id, ...d, createdAt: now() } });
        showToast(`DIRECTIVE LODGED: ${d.subject}`);
      },

      triggerBarter() {
        write({
          'committeeState/currentMode': 'BARTER_CRISIS' as Mode,
          'committeeState/activeCrisisBanner':
            'GLOBAL BANKING OFFLINE // FIAT FROZEN // SOVEREIGN COMMODITY BARTER PROTOCOL IN EFFECT',
          'committeeState/crisisAlert': alertOf({
            kind: 'BARTER',
            severity: 'CRITICAL',
            title: 'CRITICAL FAILURE: GLOBAL DIGITAL BANKING & SWIFT OFFLINE.',
            body: 'FIAT CURRENCIES FROZEN. REVERTING TO SOVEREIGN COMMODITY BARTER PROTOCOL.',
          }),
          ...news('CRITICAL: Global digital banking & SWIFT offline. Sovereign Commodity Barter Protocol active.'),
        });
        showToast('CRISIS TRIGGERED: Barter Protocol Activated');
      },
      triggerSwiftBlackout() {
        write({
          'committeeState/currentMode': 'SWIFT_BLACKOUT' as Mode,
          'committeeState/activeCrisisBanner': 'SWIFT BLACKOUT // CROSS-BORDER MONEY TRANSFERS SUSPENDED',
          'committeeState/crisisAlert': alertOf({
            kind: 'CUSTOM',
            severity: 'CRITICAL',
            title: 'SWIFT BLACKOUT',
            body: 'Cross-border money transfers are suspended. Resource swaps remain open only through the Chair.',
          }),
          ...news('ALERT: SWIFT messaging blackout. Money transfers suspended pending Chair review.'),
        });
        showToast('CRISIS TRIGGERED: SWIFT Blackout Activated');
      },
      triggerBondDump() {
        const cs = S().committeeState;
        const u = applyAll((code) => {
          if (code === 'SAR') return -2.5;
          if (code === 'AED') return -2.2;
          return Math.round(spread(code, 0.6, 1.8) * 10) / 10;
        });
        write({
          ...u,
          'committeeState/currentMode': 'BOND_DUMP' as Mode,
          'committeeState/activeCrisisBanner': 'US TREASURY BOND DUMP // $150B SOLD // MARKET VOLATILITY ELEVATED',
          'committeeState/usdDominanceIndex': clamp(Math.round((cs.usdDominanceIndex - 3.5) * 10) / 10, 0, 100),
          'committeeState/bricsUnitConfidence': clamp(Math.round((cs.bricsUnitConfidence + 3) * 10) / 10, 0, 100),
          'committeeState/pressure': { SAR: 'PEG PRESSURE (-2.5%)', AED: 'PEG PRESSURE (-2.2%)' },
          'committeeState/crisisAlert': alertOf({
            kind: 'BOND_DUMP',
            severity: 'CRITICAL',
            title: 'BREAKING: UNNAMED BRICS MEMBER DUMPS $150 BILLION IN US TREASURY BONDS OVERNIGHT',
            body: 'Global market volatility spikes. The USD index falls 3.5%. Oil-pegged currencies (SAR, AED) face emergency pressure.',
          }),
          ...news('BREAKING: $150B US Treasury dump traced to an unnamed BRICS member. USD slides; SAR/AED under pressure.'),
        });
        showToast('CRISIS TRIGGERED: $150B Treasury Bond Dump Executed');
      },
      imposeSanctions(country) {
        const c = byName(country);
        if (!c) return;
        const cur = S().currencies[c.currencyCode];
        const t = now();
        const currentSanctioned = S().committeeState.sanctionedCountries ?? [];
        const nextSanctioned = Array.from(new Set([...currentSanctioned, country]));
        const curCash = S().exchangeState?.portfolios?.[country]?.cash ?? STARTING_CASH;
        const slashedCash = Math.max(0, Math.round(curCash * 0.7));
        const u: Updates = {
          [`committeeState/sanctions/${country}`]: { at: t, until: t + 10 * 60 * 1000 },
          'committeeState/sanctionedCountries': nextSanctioned,
          [`exchangeState/portfolios/${country}/cash`]: slashedCash,
          'committeeState/crisisAlert': alertOf({
            kind: 'SANCTION',
            severity: 'CRITICAL',
            title: `SECONDARY SANCTIONS IMPOSED ON ${country.toUpperCase()}`,
            body: `SWIFT CUTOFF in effect. ${c.currencyCode} falls 12%. Liquid reserves slashed by 30% ($${slashedCash.toLocaleString()} remaining).`,
          }),
          ...news(`SANCTIONS: Secondary sanctions on ${country}. SWIFT cutoff. ${c.currencyCode} -12%. Reserves slashed by 30%.`),
        };
        if (cur) u[`currencies/${c.currencyCode}`] = applyValueChange(cur, -12);
        write(u);
        showToast(`SANCTIONS IMPOSED: 30% reserves slashed for ${country}`);
      },
      liftSanctions(country) {
        if (country) {
          const currentSanctioned = S().committeeState.sanctionedCountries ?? [];
          write({
            [`committeeState/sanctions/${country}`]: null,
            'committeeState/sanctionedCountries': currentSanctioned.filter((x) => x !== country),
          });
          showToast(`SANCTIONS LIFTED: Sanctions removed on ${country}`);
        } else {
          write({
            'committeeState/sanctions': null,
            'committeeState/sanctionedCountries': [],
          });
          showToast('SANCTIONS LIFTED: All restrictions cleared');
        }
      },
      customCrisis({ title, body, severity }) {
        const t = title.trim();
        if (!t) return;
        write({
          'committeeState/crisisAlert': alertOf({
            kind: 'CUSTOM',
            severity,
            title: t,
            body: body.trim() || 'Urgent committee directive issued by the Chair.',
          }),
          ...news(`BREAKING [${severity}]: ${t}`),
        });
        showToast(`CRISIS BROADCAST BLASTED: ${t}`);
      },
      executeAssetFreeze(country, amountB) {
        const c = byName(country);
        if (!c) return;
        const cur = S().currencies[c.currencyCode];
        const curCash = S().exchangeState?.portfolios?.[country]?.cash ?? STARTING_CASH;
        const slashedCash = Math.max(0, Math.round(curCash * 0.5));
        const u: Updates = {
          'committeeState/currentMode': 'ASSET_FREEZE' as Mode,
          'committeeState/activeCrisisBanner': `ASSETS FROZEN // ${country.toUpperCase()} // BRICS CLEAR RATIFICATION REQUIRED`,
          'committeeState/assetFreeze': { country, amountB, at: now(), signers: [] },
          [`exchangeState/portfolios/${country}/cash`]: slashedCash,
          'committeeState/crisisAlert': alertOf({
            kind: 'FREEZE',
            severity: 'CRITICAL',
            title: `ALERT: WESTERN DEPOSITORIES (EUROCLEAR/DTCC) HAVE FROZEN SOVEREIGN ASSETS OF ${country.toUpperCase()}.`,
            body: `$${amountB} BILLION IN FOREIGN RESERVES UNILATERALLY BLOCKED. Liquid reserves slashed 50% ($${slashedCash.toLocaleString()} remaining).`,
          }),
          ...news(`ALERT: Euroclear/DTCC freeze sovereign assets of ${country}. $${amountB}B blocked. Reserves slashed 50%.`),
        };
        if (cur) u[`currencies/${c.currencyCode}`] = applyValueChange(cur, -8.5);
        write(u);
        showToast(`ASSET FREEZE: 50% liquid reserves slashed for ${country}`);
      },
      cosignBricsClear(country) {
        const cs = S().committeeState;
        if (!cs.assetFreeze || cs.currentMode !== 'ASSET_FREEZE') return;
        if (cs.assetFreeze.signers.includes(country)) return;
        const count = cs.assetFreeze.signers.length + 1;
        if (count >= BRICS_CLEAR_QUORUM) {
          a.ratifyBricsClear();
        } else {
          write({ [`committeeState/assetFreeze/signers/${country}`]: true });
          showToast(`BRICS CLEAR: Co-signed by ${country} (${count}/${BRICS_CLEAR_QUORUM})`);
        }
      },
      ratifyBricsClear() {
        const cs = S().committeeState;
        if (!cs.assetFreeze) return;
        write({
          'committeeState/assetFreeze': null,
          'committeeState/currentMode': 'NORMAL' as Mode,
          'committeeState/activeCrisisBanner': '',
          'committeeState/pressure': null,
          'committeeState/crisisAlert': null,
          'committeeState/usdDominanceIndex': clamp(Math.round((cs.usdDominanceIndex - 2.5) * 10) / 10, 0, 100),
          'committeeState/bricsUnitConfidence': clamp(Math.round((cs.bricsUnitConfidence + 5) * 10) / 10, 0, 100),
          ...news('BREAKING: BRICS Clear sovereign depository formally deployed. Member foreign reserves insulated from G7 sanctions.'),
        });
        showToast('RATIFIED: BRICS Clear Multilateral Depository active');
      },
      setSuezToll(currency) {
        const u = suezUpdates(currency);
        if (u) {
          write(u);
          showToast(`SUEZ CANAL: Transit dues switched to ${currency === 'BRICS_PAY' ? 'BRICS Pay / EGP' : 'USD'}`);
        }
      },
      submitSuezDirective(currency) {
        const id = uid();
        write({
          [`directives/${id}`]: {
            id,
            from: 'Egypt',
            subject: 'PRESIDENTIAL DECREE: SUEZ CANAL TOLL OVERHAUL',
            body:
              currency === 'BRICS_PAY'
                ? 'Egypt requests all Suez Canal transit dues be settled in BRICS Pay or Egyptian Pounds.'
                : 'Egypt requests Suez Canal transit dues revert to USD billing.',
            createdAt: now(),
            action: { type: 'SUEZ_TOLL', currency },
            status: 'PENDING',
          },
        });
        showToast('SUEZ DIRECTIVE: Submitted to Chair');
      },
      resolveDirective(id, approve) {
        const d = S().directives.find((x) => x.id === id);
        if (!d) return;
        let u: Updates = { [`directives/${id}/status`]: approve ? 'APPROVED' : 'DISMISSED' };
        if (approve && d.action?.type === 'SUEZ_TOLL') {
          const s = suezUpdates(d.action.currency);
          if (s) u = { ...u, ...s };
        }
        write(u);
        showToast(approve ? `DIRECTIVE APPROVED: ${d.subject}` : `DIRECTIVE DISMISSED: ${d.subject}`);
      },
      submitGrain(g) {
        const id = uid();
        write({
          [`grainContracts/${id}`]: {
            id,
            ...g,
            feePct: g.settlement === 'USD' ? USD_SURCHARGE_PCT : 0,
            status: 'PENDING',
            createdAt: now(),
          },
        });
        showToast(`GRAIN REQUEST: ${g.importer} ⇄ ${g.exporter}`);
      },
      resolveGrain(id, approved) {
        const g = S().grainContracts.find((x) => x.id === id);
        if (!g || g.status !== 'PENDING') return;
        const u: Updates = {
          [`grainContracts/${id}/status`]: approved ? 'APPROVED' : 'REJECTED',
          [`grainContracts/${id}/resolvedAt`]: now(),
        };
        if (approved) {
          const key = grainType(g.commodity).key;
          const stock = S().grainStockpiles;
          const ex = { ...(stock[g.exporter] ?? defaultStock(g.exporter)) };
          const im = { ...(stock[g.importer] ?? defaultStock(g.importer)) };
          if (ex[key] < g.quantityMT) return;
          ex[key] -= g.quantityMT;
          im[key] += g.quantityMT;
          u[`grainStockpiles/${g.exporter}`] = ex;
          u[`grainStockpiles/${g.importer}`] = im;
          if (g.settlement === 'BRICS_PAY') {
            const cs = S().committeeState;
            u['committeeState/bricsPayAdoption'] = clamp(
              Math.round((cs.bricsPayAdoption + BRICS_PAY_ADOPTION_BOOST) * 10) / 10,
              0,
              100,
            );
          }
        }
        write(u);
        showToast(approved ? `GRAIN CLEARED: ${fmtMT(g.quantityMT)} ${g.commodity}` : 'GRAIN REQUEST REJECTED');
      },
      resetMode() {
        write({
          'committeeState/currentMode': 'NORMAL' as Mode,
          'committeeState/activeCrisisBanner': '',
          'committeeState/pressure': null,
          'committeeState/crisisAlert': null,
          'committeeState/assetFreeze': null,
          'committeeState/sanctions': null,
          'committeeState/sanctionedCountries': [],
        });
        showToast('OPERATIONS RESTORED: Committee returned to NORMAL mode');
      },
      resetAll() {
        const seed = toDbForm(createSeed(now()));
        write({
          committeeState: seed.committeeState,
          currencies: seed.currencies,
          newsTicker: seed.newsTicker,
          motions: null,
          trades: null,
          directives: null,
          grainStockpiles: seed.grainStockpiles,
          grainContracts: null,
          delegationPins: seed.delegationPins,
          exchangeState: seed.exchangeState,
          backchannelMessages: null,
        });
        showToast('DATA RESET: All state restored to initial seed');
      },
      setDelegationPin(country, pin) {
        const p = pin.trim();
        if (!p) return;
        write({ [`delegationPins/${country}`]: p });
        showToast(`PIN UPDATED FOR ${country.toUpperCase()}`);
      },
      executeExchangeOrder(order) {
        const { ticker, action, quantity, country } = order;
        if (!country) {
          showToast('AUTHENTICATION REQUIRED: Claim a delegation before trading');
          return;
        }
        const S_state = S();
        if (S_state.exchangeState.marketStatus !== 'OPEN') {
          showToast('MARKET CLOSED: Sovereign Exchange is currently closed');
          return;
        }
        const qty = Math.floor(quantity);
        if (qty <= 0) {
          showToast('INVALID ORDER: Quantity must be at least 1');
          return;
        }

        const pf = S_state.exchangeState.portfolios[country] ?? defaultPortfolio();
        const currentQty = pf.holdings[ticker] ?? 0;
        const tickerData = S_state.exchangeState.tickers[ticker] ?? DEFAULT_TICKERS[ticker];
        const price = tickerData.currentPrice;

        let newCash = pf.cash;
        let newQty = currentQty;
        const shortPrices: Record<TickerSymbol, number> = {
          GOLD: 0,
          UST: 0,
          URALS: 0,
          AGRI: 0,
          TECH: 0,
          ...(pf.shortAvgPrice || {}),
        };

        if (action === 'BUY') {
          if (currentQty < 0) {
            // Covering existing short position
            const shortQty = Math.abs(currentQty);
            const sp = shortPrices[ticker] ?? 0;
            const shortAvg = sp > 0 ? sp : price;
            const coverQty = Math.min(qty, shortQty);
            const excessBuyQty = qty - coverQty;

            // Margin released was coverQty * shortAvg. Cost to buy back is coverQty * price.
            // Net cash change = coverQty * (shortAvg - price) - excessBuyQty * price.
            const cashDiff = coverQty * (shortAvg - price) - excessBuyQty * price;
            if (newCash + cashDiff < 0) {
              showToast(`INSUFFICIENT FUNDS: Need $${Math.abs(Math.round(cashDiff)).toLocaleString()}`);
              return;
            }
            newCash += cashDiff;
            newQty = currentQty + qty;
            if (newQty >= 0) {
              shortPrices[ticker] = 0;
            }
          } else {
            // Standard long buy
            const cost = qty * price;
            if (newCash < cost) {
              showToast(`INSUFFICIENT FUNDS: Need $${Math.round(cost).toLocaleString()}`);
              return;
            }
            newCash -= cost;
            newQty = currentQty + qty;
          }
        } else if (action === 'SELL') {
          if (currentQty <= 0) {
            showToast('NO LONG HOLDINGS: Use SHORT to open a short position');
            return;
          }
          if (qty > currentQty) {
            showToast(`EXCEEDS HOLDINGS: You only hold ${currentQty} ${ticker}`);
            return;
          }
          const proceeds = qty * price;
          newCash += proceeds;
          newQty = currentQty - qty;
        } else if (action === 'SHORT') {
          // Open or increase short position: deduct margin = qty * price
          const margin = qty * price;
          if (newCash < margin) {
            showToast(`INSUFFICIENT MARGIN: Need $${Math.round(margin).toLocaleString()} cash margin`);
            return;
          }
          newCash -= margin;
          const currentShortQty = Math.abs(Math.min(0, currentQty));
          const sp = shortPrices[ticker] ?? 0;
          const oldShortAvg = sp > 0 ? sp : price;
          const newShortAvg = (currentShortQty * oldShortAvg + qty * price) / (currentShortQty + qty);
          shortPrices[ticker] = Math.round(newShortAvg * 100) / 100;
          newQty = currentQty - qty;
        }

        const updatedHoldings: Record<TickerSymbol, number> = {
          GOLD: pf.holdings?.GOLD ?? 0,
          UST: pf.holdings?.UST ?? 0,
          URALS: pf.holdings?.URALS ?? 0,
          AGRI: pf.holdings?.AGRI ?? 0,
          TECH: pf.holdings?.TECH ?? 0,
        };
        updatedHoldings[ticker] = newQty;

        const updatedPortfolio: DelegationPortfolio = {
          ...pf,
          cash: Math.round(newCash * 100) / 100,
          holdings: updatedHoldings,
          shortAvgPrice: shortPrices,
        };

        write({
          [`exchangeState/portfolios/${country}`]: updatedPortfolio,
        });

        showToast(`ORDER EXECUTED: ${action} ${qty} ${ticker} @ $${price.toLocaleString()}`);
      },
      setMarketStatus(status) {
        write({ 'exchangeState/marketStatus': status });
        showToast(`SOVEREIGN EXCHANGE: Market is now ${status}`);
      },
      shiftTickerPrice(symbol, pctChange) {
        const S_state = S();
        const t = S_state.exchangeState.tickers[symbol] ?? DEFAULT_TICKERS[symbol];
        const newPrice = Math.max(1, Math.round(t.currentPrice * (1 + pctChange / 100) * 100) / 100);
        const baseline = t.history[0] || t.currentPrice;
        const newChange24h = Math.round(((newPrice - baseline) / baseline) * 1000) / 10;
        const newHistory = [...(t.history || []), newPrice].slice(-14);

        const u: Updates = {
          [`exchangeState/tickers/${symbol}/currentPrice`]: newPrice,
          [`exchangeState/tickers/${symbol}/change24h`]: newChange24h,
          [`exchangeState/tickers/${symbol}/history`]: newHistory,
        };
        write(u);
        showToast(`MARKET SHIFT: ${symbol} ${pctChange >= 0 ? '+' : ''}${pctChange}% ($${newPrice})`);
      },
      wireBailout(from, to, amount) {
        if (!from || !to || from === to) return;
        const amt = Math.floor(amount);
        if (amt <= 0) return;
        const S_state = S();
        const fromPf = S_state.exchangeState?.portfolios?.[from] ?? defaultPortfolio();
        const toPf = S_state.exchangeState?.portfolios?.[to] ?? defaultPortfolio();

        if (fromPf.cash <= 0) {
          showToast('SOVEREIGN DEFAULT (GGs): Treasury empty. Cannot wire bailout.');
          return;
        }
        if (fromPf.cash < amt) {
          showToast(`INSUFFICIENT RESERVES: Only $${Math.round(fromPf.cash).toLocaleString()} available`);
          return;
        }

        const newFromCash = Math.round(fromPf.cash - amt);
        const newToCash = Math.round(toPf.cash + amt);

        write({
          [`exchangeState/portfolios/${from}/cash`]: newFromCash,
          [`exchangeState/portfolios/${to}/cash`]: newToCash,
          ...news(`EMERGENCY BAILOUT: ${from} wired $${amt.toLocaleString()} to ${to} to stabilize sovereign reserves.`),
        });
        showToast(`BAILOUT WIRED: Transferred $${amt.toLocaleString()} to ${to}`);
      },
      injectBailout(country, amount) {
        const amt = Math.floor(amount);
        if (!country || amt <= 0) return;
        const pf = S().exchangeState?.portfolios?.[country] ?? defaultPortfolio();
        const newCash = Math.round(pf.cash + amt);
        write({
          [`exchangeState/portfolios/${country}/cash`]: newCash,
          ...news(`CENTRAL BANK INJECTION: Chair injected $${amt.toLocaleString()} emergency bailout into ${country}.`),
        });
        showToast(`BAILOUT INJECTED: +$${amt.toLocaleString()} to ${country}`);
      },
      forceBankrupt(country) {
        if (!country) return;
        write({
          [`exchangeState/portfolios/${country}/cash`]: 0,
          ...news(`CRITICAL: Chair declared Sovereign Default on ${country}. Liquid reserves wiped to $0 (GGs).`),
        });
        showToast(`SOVEREIGN DEFAULT FORCED: ${country} reserves set to $0`);
      },
      daisLiquidityFacility(target) {
        if (!target) return;
        const st = S();
        const pf = st.exchangeState?.portfolios?.[target] ?? defaultPortfolio();
        const t = st.exchangeState.tickers.GOLD ?? DEFAULT_TICKERS.GOLD;
        const newPrice = Math.max(1, Math.round(t.currentPrice * 1.12 * 100) / 100);
        const baseline = t.history[0] || t.currentPrice;
        write({
          [`exchangeState/portfolios/${target}/cash`]: Math.round(pf.cash + 2_500_000),
          'exchangeState/tickers/GOLD/currentPrice': newPrice,
          'exchangeState/tickers/GOLD/change24h': Math.round(((newPrice - baseline) / baseline) * 1000) / 10,
          'exchangeState/tickers/GOLD/history': [...(t.history || []), newPrice].slice(-14),
          'committeeState/activeChairPowerUp': { chair: 'judy', id: 'liquidity', target, at: now() },
          ...news(`NDB ACTION: ${target} awarded a $2,500,000 Gold-Backed Liquidity Facility. GOLD index surges.`),
        });
        showToast(`LIQUIDITY FACILITY EXECUTED: ${target}`);
      },
      daisFiatPenalty(target) {
        if (!target) return;
        const pf = S().exchangeState?.portfolios?.[target] ?? defaultPortfolio();
        write({
          [`exchangeState/portfolios/${target}/cash`]: Math.round(pf.cash - 1_000_000),
          'committeeState/activeChairPowerUp': { chair: 'judy', id: 'penalty', target, at: now() },
          ...news(`REGULATORY ACTION: ${target} fined -$1,000,000 for systemic US Dollar reliance.`),
        });
        showToast(`FIAT PENALTY EXECUTED: ${target}`);
      },
      daisMarginCall() {
        const pfs = S().exchangeState.portfolios;
        const names = Object.keys(pfs);
        if (!names.length) return;
        const richest = names.reduce((a, b) => (pfs[b].cash > pfs[a].cash ? b : a));
        const seized = Math.floor(pfs[richest].cash * 0.2);
        const defaulted = names.filter((n) => n !== richest && pfs[n].cash <= 0);
        const u: Updates = {
          [`exchangeState/portfolios/${richest}/cash`]: Math.round(pfs[richest].cash - seized),
          'committeeState/activeChairPowerUp': { chair: 'saif', id: 'margin', target: richest, at: now() },
          ...news(`MARKET REBALANCING: 20% of ${richest}'s reserves seized by BRICS Clear to stabilize defaulting nations.`),
        };
        if (defaulted.length) {
          const share = Math.floor(seized / defaulted.length);
          for (const n of defaulted) u[`exchangeState/portfolios/${n}/cash`] = share;
        }
        write(u);
        showToast(`MARGIN CALL EXECUTED: ${richest}`);
      },
      daisSettlementShock() {
        const st = S();
        const t = st.exchangeState.tickers.UST ?? DEFAULT_TICKERS.UST;
        const newPrice = Math.max(1, Math.round(t.currentPrice * 0.85 * 100) / 100);
        const baseline = t.history[0] || t.currentPrice;
        write({
          'exchangeState/tickers/UST/currentPrice': newPrice,
          'exchangeState/tickers/UST/change24h': Math.round(((newPrice - baseline) / baseline) * 1000) / 10,
          'exchangeState/tickers/UST/history': [...(t.history || []), newPrice].slice(-14),
          'committeeState/bricsPayAdoption': clamp(Math.round((st.committeeState.bricsPayAdoption + 10) * 10) / 10, 0, 100),
          'committeeState/activeChairPowerUp': { chair: 'saif', id: 'shock', target: 'UST', at: now() },
          ...news('GLOBAL SHOCK: Cross-border settlement override deployed. US Treasuries plummet as BRICS Pay adoption spikes.'),
        });
        showToast('SETTLEMENT SHOCK EXECUTED');
      },
      sendBackchannelMessage(msg) {
        const { from, to, text } = msg;
        const t = text.trim();
        if (!from || !to || !t) return;
        const id = uid();
        const newMsg: BackchannelMessage = {
          id,
          from,
          to,
          text: t,
          createdAt: now(),
        };
        write({
          [`backchannelMessages/${id}`]: newMsg,
        });
      },
      leakBackchannelMessage(id) {
        const m = S().backchannelMessages.find((x) => x.id === id);
        if (!m) return;
        write({
          [`backchannelMessages/${id}/leaked`]: true,
          ...news(`🕵️ LEAKED DIPLOMATIC CABLE [${m.from} → ${m.to}]: '${m.text}'`),
        });
        showToast(`MESSAGE LEAKED TO PRESS WIRE // [${m.from} → ${m.to}]`);
      },
      setCyberAttack(active) {
        const u: Updates = {
          'committeeState/cyberAttackActive': active,
        };
        if (active) {
          Object.assign(u, news('🚨 CRITICAL CYBER BREACH: ALL SOVEREIGN BACK-CHANNELS EXPOSED TO PUBLIC WIRE.'));
        }
        write(u);
        showToast(active ? 'CYBER ATTACK ACTIVATED: Back-channels exposed!' : 'CYBER ATTACK CLEARED: Channels secured');
      },
      submitGossip(message) {
        const text = message.trim();
        if (!text) return;
        const id = uid();
        const item: GossipItem = {
          id,
          message: text,
          timestamp: now(),
          readByChair: false,
        };
        write({
          [`gossipBox/${id}`]: item,
        });
      },
      toggleGossipRead(id, read) {
        const current = S().gossipBox?.find((g) => g.id === id);
        const nextVal = typeof read === 'boolean' ? read : !current?.readByChair;
        write({
          [`gossipBox/${id}/readByChair`]: nextVal,
        });
      },
      deleteGossip(id) {
        write({
          [`gossipBox/${id}`]: null,
        });
        showToast('GOSSIP REMOVED');
      },
      showToast(msg) {
        showToast(msg);
      },
    };
    return a;
  }, [backend, now, showToast]);

  const claimDelegation = useCallback(
    (country: string, pin: string): boolean => {
      const S = stateRef.current;
      const expected = S.delegationPins?.[country] || DEFAULT_DELEGATION_PINS[country];
      if (expected && pin.trim() === expected.trim()) {
        localStorage.setItem(AUTH_DELEGATION_KEY, country);
        localStorage.setItem(ME_KEY, country);
        setMeState(country);
        showToast(`AUTHENTICATED: ${country.toUpperCase()}`);
        return true;
      }
      return false;
    },
    [showToast],
  );

  const releaseDelegation = useCallback(() => {
    localStorage.removeItem(AUTH_DELEGATION_KEY);
    localStorage.removeItem(ME_KEY);
    setMeState('');
    showToast('LOGGED OUT: Returned to Viewer Mode');
  }, [showToast]);

  const setMe = useCallback((name: string) => {
    if (name) {
      localStorage.setItem(AUTH_DELEGATION_KEY, name);
      localStorage.setItem(ME_KEY, name);
    } else {
      localStorage.removeItem(AUTH_DELEGATION_KEY);
      localStorage.removeItem(ME_KEY);
    }
    setMeState(name);
  }, []);

  const unlock = useCallback((pin: string) => {
    if (pin.trim() === CHAIR_PIN) {
      sessionStorage.setItem(CHAIR_KEY, '1');
      localStorage.setItem(CHAIR_KEY, '1');
      setIsChair(true);
      return true;
    }
    return false;
  }, []);
  const lock = useCallback(() => {
    sessionStorage.removeItem(CHAIR_KEY);
    localStorage.removeItem(CHAIR_KEY);
    setIsChair(false);
  }, []);

  const reserves = useMemo(() => getReserves(state, me), [state, me]);
  const bankrupt = useMemo(() => isBankrupt(state, me), [state, me]);

  const value: Ctx = {
    state,
    ready,
    syncMode: backend?.mode ?? 'LOCAL',
    syncNote,
    now,
    me,
    reserves,
    bankrupt,
    setMe,
    claimDelegation,
    releaseDelegation,
    isChair,
    unlock,
    lock,
    actions,
    toast,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}

/** Server-corrected "now" that re-renders at `intervalMs`. */
export function useNow(intervalMs = 100): number {
  const { now } = useStore();
  const [t, setT] = useState(() => now());
  useEffect(() => {
    const id = setInterval(() => setT(now()), intervalMs);
    return () => clearInterval(id);
  }, [now, intervalMs]);
  return t;
}

export function getReserves(state: RootState, country: string): number {
  if (!country) return STARTING_CASH;
  const pf = state.exchangeState?.portfolios?.[country];
  return typeof pf?.cash === 'number' ? pf.cash : STARTING_CASH;
}

export function isBankrupt(state: RootState, country: string): boolean {
  if (!country) return false;
  return getReserves(state, country) <= 0;
}

export function useFiatFrozen(): boolean {
  const { state } = useStore();
  const m = state.committeeState.currentMode;
  return m === 'BARTER_CRISIS' || m === 'SWIFT_BLACKOUT';
}

export { COUNTRY_NAMES };
