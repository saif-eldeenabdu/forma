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
import { createBackend, toDbForm, type Backend, type SyncMode } from './backend';
import { createSeed } from './seed';
import { normalize } from './normalize';
import { deriveTimer } from './timer';
import { applyValueChange, clamp, PEGGED } from './markets';
import { uid } from './motions';
import { byName, COUNTRY_NAMES } from '../data/countries';
import type {
  CrisisAlert,
  Mode,
  Motion,
  MotionType,
  RootState,
  Severity,
  TimerType,
  Trade,
  TradeKind,
  Updates,
} from './types';

export const CHAIR_PIN = '2026';

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
}

interface Ctx {
  state: RootState;
  ready: boolean;
  syncMode: SyncMode;
  syncNote: string;
  now: () => number;
  me: string;
  setMe: (name: string) => void;
  isChair: boolean;
  unlock: (pin: string) => boolean;
  lock: () => void;
  actions: Actions;
}

const StoreCtx = createContext<Ctx | null>(null);

const ME_KEY = 'brics-net:me';
const CHAIR_KEY = 'brics-net:chair';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RootState>(() => normalize(null));
  const [ready, setReady] = useState(false);
  const [backend, setBackend] = useState<Backend | null>(null);
  const [syncNote, setSyncNote] = useState('');
  const [me, setMeState] = useState<string>(() => localStorage.getItem(ME_KEY) ?? '');
  const [isChair, setIsChair] = useState<boolean>(() => sessionStorage.getItem(CHAIR_KEY) === '1');

  const stateRef = useRef(state);
  stateRef.current = state;
  const offsetRef = useRef(0);
  const now = useCallback(() => Date.now() + offsetRef.current, []);

  // boot backend
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let unsubOffset: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const { backend: b, fallbackReason } = await createBackend();
      if (cancelled) return;
      setSyncNote(fallbackReason ?? '');
      unsubOffset = b.onOffset((o) => {
        offsetRef.current = o;
      });
      await b.seedIfEmpty(toDbForm(createSeed()));
      if (cancelled) return;
      unsub = b.subscribe((raw) => {
        setState(normalize(raw));
        setReady(true);
      });
      setBackend(b);
    })();
    return () => {
      cancelled = true;
      unsub?.();
      unsubOffset?.();
    };
  }, []);

  const actions = useMemo<Actions | null>(() => {
    if (!backend) return null;
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

    const a: Actions = {
      startTimer() {
        const f = frozen();
        write(timerPatch({ ...f, isRunning: true }));
      },
      pauseTimer() {
        write(timerPatch({ ...frozen(), isRunning: false }));
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
      },
      nextSpeaker() {
        const cs = S().committeeState;
        const queue = cs.gslQueue.slice(1);
        const next = queue[0] ?? 'None';
        write({
          ...timerPatch({
            currentSpeaker: next,
            remainingSeconds: cs.timer.totalSeconds,
            isRunning: false,
            yieldTo: 'None',
            yieldedFrom: null,
          }),
          'committeeState/gslQueue': queue,
        });
      },
      setSpeaker(name) {
        write(timerPatch({ currentSpeaker: name, yieldTo: 'None', yieldedFrom: null }));
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

      addToQueue(name) {
        const q = S().committeeState.gslQueue;
        write({ 'committeeState/gslQueue': [...q, name] });
      },
      removeFromQueue(index) {
        const q = S().committeeState.gslQueue.filter((_, i) => i !== index);
        write({ 'committeeState/gslQueue': q });
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
        if (cs.gslQueue.includes(country) || cs.gslRequests.some((r) => r.country === country)) return;
        const id = uid();
        write({ [`committeeState/gslRequests/${id}`]: { id, country, at: now() } });
      },
      approveGslRequest(id) {
        const cs = S().committeeState;
        const r = cs.gslRequests.find((x) => x.id === id);
        if (!r) return;
        write({
          [`committeeState/gslRequests/${id}`]: null,
          'committeeState/gslQueue': cs.gslQueue.includes(r.country) ? cs.gslQueue : [...cs.gslQueue, r.country],
        });
      },
      dismissGslRequest(id) {
        write({ [`committeeState/gslRequests/${id}`]: null });
      },

      submitMotion(m) {
        const id = uid();
        const motion: Motion = { id, ...m, status: 'PENDING', createdAt: now() };
        write({ [`motions/${id}`]: motion });
      },
      projectMotion(id) {
        write({ 'committeeState/projectedMotionId': id, [`motions/${id}/status`]: 'PROJECTED' });
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
      },
      failMotion(id) {
        const u: Updates = { [`motions/${id}/status`]: 'FAILED' };
        if (S().committeeState.projectedMotionId === id) u['committeeState/projectedMotionId'] = '';
        write(u);
      },

      shiftCurrency(code, valuePct) {
        const cur = S().currencies[code];
        if (!cur) return;
        write({ [`currencies/${code}`]: applyValueChange(cur, valuePct) });
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
      },
      setMacro(patch) {
        const u: Updates = {};
        for (const [k, v] of Object.entries(patch)) u[`committeeState/${k}`] = v;
        write(u);
      },

      addNews(text) {
        const t = text.trim();
        if (!t) return;
        write(news(t));
      },
      removeNews(index) {
        write({ newsTicker: S().newsTicker.filter((_, i) => i !== index) });
      },

      submitTrade(t) {
        const id = uid();
        const trade: Trade = { id, ...t, status: 'PENDING', createdAt: now() };
        write({ [`trades/${id}`]: trade });
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
      },
      submitDirective(d) {
        const id = uid();
        write({ [`directives/${id}`]: { id, ...d, createdAt: now() } });
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
          ...news('CRITICAL: Global digital banking & SWIFT offline. Fiat frozen. Sovereign Commodity Barter Protocol active.'),
        });
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
      },
      triggerBondDump() {
        const cs = S().committeeState;
        const u = applyAll((code) => {
          if (code === 'SAR') return -1.2;
          if (code === 'AED') return -1.0;
          return Math.round(spread(code, 0.6, 1.8) * 10) / 10;
        });
        write({
          ...u,
          'committeeState/currentMode': 'BOND_DUMP' as Mode,
          'committeeState/activeCrisisBanner': 'US TREASURY BOND DUMP // $150B SOLD // MARKET VOLATILITY ELEVATED',
          'committeeState/usdDominanceIndex': clamp(Math.round((cs.usdDominanceIndex - 4.2) * 10) / 10, 0, 100),
          'committeeState/bricsUnitConfidence': clamp(Math.round((cs.bricsUnitConfidence + 3) * 10) / 10, 0, 100),
          'committeeState/pressure': { SAR: 'PEG PRESSURE', AED: 'PEG PRESSURE' },
          'committeeState/crisisAlert': alertOf({
            kind: 'BOND_DUMP',
            severity: 'CRITICAL',
            title: 'BREAKING: UNNAMED BRICS MEMBER DUMPS $150 BILLION IN US TREASURY BONDS OVERNIGHT',
            body: 'Global market volatility spikes. The USD index falls sharply. Oil-pegged currencies (SAR, AED) face emergency pressure.',
          }),
          ...news('BREAKING: $150B US Treasury dump traced to an unnamed BRICS member. USD slides; SAR/AED under pressure.'),
        });
      },
      imposeSanctions(country) {
        const c = byName(country);
        if (!c) return;
        const cur = S().currencies[c.currencyCode];
        const t = now();
        const u: Updates = {
          [`committeeState/sanctions/${country}`]: { at: t, until: t + 10 * 60 * 1000 },
          'committeeState/crisisAlert': alertOf({
            kind: 'SANCTION',
            severity: 'CRITICAL',
            title: `SECONDARY SANCTIONS IMPOSED ON ${country.toUpperCase()}`,
            body: `SWIFT CUTOFF in effect. ${c.currencyCode} falls 12%. The committee has 10 minutes to arrange a bail-out via BRICS Pay.`,
          }),
          ...news(`SANCTIONS: Secondary sanctions imposed on ${country}. SWIFT cutoff. ${c.currencyCode} -12%.`),
        };
        if (cur) u[`currencies/${c.currencyCode}`] = applyValueChange(cur, -12);
        write(u);
      },
      liftSanctions(country) {
        if (country) write({ [`committeeState/sanctions/${country}`]: null });
        else write({ 'committeeState/sanctions': null });
      },
      customCrisis({ title, body, severity }) {
        write({
          'committeeState/crisisAlert': alertOf({ kind: 'CUSTOM', severity, title, body }),
          ...news(`${severity}: ${title}`),
        });
      },
      resetMode() {
        write({
          'committeeState/currentMode': 'NORMAL' as Mode,
          'committeeState/activeCrisisBanner': '',
          'committeeState/pressure': null,
          'committeeState/crisisAlert': null,
        });
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
        });
      },
    };
    return a;
  }, [backend, now]);

  const setMe = useCallback((name: string) => {
    localStorage.setItem(ME_KEY, name);
    setMeState(name);
  }, []);
  const unlock = useCallback((pin: string) => {
    if (pin === CHAIR_PIN) {
      sessionStorage.setItem(CHAIR_KEY, '1');
      setIsChair(true);
      return true;
    }
    return false;
  }, []);
  const lock = useCallback(() => {
    sessionStorage.removeItem(CHAIR_KEY);
    setIsChair(false);
  }, []);

  const noop = useMemo(() => new Proxy({}, { get: () => () => undefined }) as Actions, []);

  const value: Ctx = {
    state,
    ready,
    syncMode: backend?.mode ?? 'LOCAL',
    syncNote,
    now,
    me,
    setMe,
    isChair,
    unlock,
    lock,
    actions: actions ?? noop,
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

export function useFiatFrozen(): boolean {
  const { state } = useStore();
  const m = state.committeeState.currentMode;
  return m === 'BARTER_CRISIS' || m === 'SWIFT_BLACKOUT';
}

export { COUNTRY_NAMES };
