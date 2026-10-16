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
import { createBackend, createFirebaseBackend, toDbForm, type Backend, type SyncMode } from './backend';
import { createSeed } from './seed';
import { normalize } from './normalize';
import { deriveTimer } from './timer';
import { applyValueChange, clamp, PEGGED } from './markets';
import { uid } from './motions';
import { byName, COUNTRY_NAMES } from '../data/countries';
import { BRICS_PAY_ADOPTION_BOOST, USD_SURCHARGE_PCT, defaultStock, fmtMT, grainType } from '../data/grain';
import type {
  CrisisAlert,
  GrainCommodity,
  GrainSettlement,
  Mode,
  Motion,
  MotionType,
  RootState,
  Severity,
  SuezCurrency,
  TimerType,
  Trade,
  TradeKind,
  Updates,
} from './types';

export const CHAIR_PIN = '2026';
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
  setMe: (name: string) => void;
  isChair: boolean;
  unlock: (pin: string) => boolean;
  lock: () => void;
  actions: Actions;
  toast: string | null;
}

const StoreCtx = createContext<Ctx | null>(null);

const ME_KEY = 'brics-net:me';
const CHAIR_KEY = 'brics-net:chair';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RootState>(() => normalize(null));
  const [ready, setReady] = useState(false);
  const [backend, setBackend] = useState<Backend>(() => createFirebaseBackend());
  const [syncNote, setSyncNote] = useState('');
  const [me, setMeState] = useState<string>(() => localStorage.getItem(ME_KEY) ?? '');
  const [isChair, setIsChair] = useState<boolean>(() => sessionStorage.getItem(CHAIR_KEY) === '1');
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
        showToast(`SPEAKER ADVANCED: ${next}`);
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

      addToQueue(name) {
        const q = S().committeeState.gslQueue;
        write({ 'committeeState/gslQueue': [...q, name] });
        showToast(`GSL: Added ${name}`);
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
        const u: Updates = {
          [`committeeState/sanctions/${country}`]: { at: t, until: t + 10 * 60 * 1000 },
          'committeeState/sanctionedCountries': nextSanctioned,
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
        showToast(`SANCTIONS IMPOSED: Secondary sanctions on ${country}`);
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
        const u: Updates = {
          'committeeState/currentMode': 'ASSET_FREEZE' as Mode,
          'committeeState/activeCrisisBanner': `ASSETS FROZEN // ${country.toUpperCase()} // BRICS CLEAR RATIFICATION REQUIRED`,
          'committeeState/assetFreeze': { country, amountB, at: now(), signers: [] },
          'committeeState/crisisAlert': alertOf({
            kind: 'FREEZE',
            severity: 'CRITICAL',
            title: `ALERT: WESTERN DEPOSITORIES (EUROCLEAR/DTCC) HAVE FROZEN SOVEREIGN ASSETS OF ${country.toUpperCase()}.`,
            body: `$${amountB} BILLION IN FOREIGN RESERVES UNILATERALLY BLOCKED.`,
          }),
          ...news(`ALERT: Euroclear/DTCC freeze sovereign assets of ${country}. $${amountB}B in reserves blocked. ${c.currencyCode} -8.5%.`),
        };
        if (cur) u[`currencies/${c.currencyCode}`] = applyValueChange(cur, -8.5);
        write(u);
        showToast(`ASSET FREEZE: Western depositories frozen for ${country} ($${amountB}B)`);
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
        });
        showToast('DATA RESET: All state restored to initial seed');
      },
      showToast(msg) {
        showToast(msg);
      },
    };
    return a;
  }, [backend, now, showToast]);

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

export function useFiatFrozen(): boolean {
  const { state } = useStore();
  const m = state.committeeState.currentMode;
  return m === 'BARTER_CRISIS' || m === 'SWIFT_BLACKOUT';
}

export { COUNTRY_NAMES };
