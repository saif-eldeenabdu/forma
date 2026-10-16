import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Check, Gavel, Landmark, Lock, Megaphone, Pause, Play, RotateCcw, SkipForward, Skull, Trash2, TrendingUp, X } from 'lucide-react';
import { COUNTRIES, COUNTRY_NAMES } from '../data/countries';
import { BRICS_CLEAR_QUORUM, useNow, useStore } from '../lib/store';
import { fmtMT, grainType } from '../data/grain';
import { deriveTimer } from '../lib/timer';
import { sortMotions } from '../lib/motions';
import { fmtRate } from '../lib/markets';
import type { Severity, TimerType } from '../lib/types';
import { Field, PageHeader, Panel, fmtSecondsLabel } from '../components/ui';
import { TimerPanel } from '../components/Timer';
import { motionLine } from '../components/Overlays';

type Tab = 'timer' | 'motions' | 'markets' | 'news' | 'trades' | 'crisis';
const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'timer', label: 'Timers & GSL', icon: <Play size={13} /> },
  { id: 'motions', label: 'Motions', icon: <Gavel size={13} /> },
  { id: 'markets', label: 'Markets & Currencies', icon: <TrendingUp size={13} /> },
  { id: 'news', label: 'News & Intel', icon: <Megaphone size={13} /> },
  { id: 'trades', label: 'Trades & Directives', icon: <Landmark size={13} /> },
  { id: 'crisis', label: 'Big Bullshit Area', icon: <Skull size={13} /> },
];

/* ------------------------------ PIN gate ------------------------------ */
function PinGate({ onSuccess }: { onSuccess?: () => void }) {
  const { unlock } = useStore();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (unlock(pin)) {
      setPin('');
      onSuccess?.();
    } else {
      setErr(true);
      setPin('');
    }
  };
  return (
    <div className="mx-auto mt-10 max-w-sm">
      <Panel title="Chair Control Center // Restricted">
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-sage">Enter the Chair PIN to unlock committee controls.</p>
          <input
            autoFocus
            type="password"
            placeholder="••••"
            inputMode="numeric"
            value={pin}
            maxLength={8}
            onChange={(e) => {
              setPin(e.target.value);
              setErr(false);
            }}
            className={`field tabular text-center text-xl tracking-[0.6em] ${err ? '!border-crimson' : ''}`}
            aria-label="Chair PIN"
          />
          {err && <p className="font-mono text-[11px] uppercase text-crimson">Access denied // invalid PIN</p>}
          <button className="btn btn-gold w-full" type="submit">
            <Lock size={13} /> Authenticate
          </button>
        </form>
      </Panel>
    </div>
  );
}

/* ------------------------------ Timers & GSL ------------------------------ */
function TimerTab() {
  const { state, actions } = useStore();
  const cs = state.committeeState;
  const t = cs.timer;
  const tick = useNow(200);
  const d = deriveTimer(t, tick);
  const [speakerSec, setSpeakerSec] = useState(t.totalSeconds);
  const [caucusMin, setCaucusMin] = useState(Math.round(t.modTotalSeconds / 60));
  const [addCountry, setAddCountry] = useState('');

  useEffect(() => {
    setSpeakerSec(t.totalSeconds);
    setCaucusMin(Math.round(t.modTotalSeconds / 60));
  }, [t.totalSeconds, t.modTotalSeconds]);

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <div className="space-y-3">
        <TimerPanel />
        <Panel title="Timer Controls">
          <div className="grid grid-cols-3 gap-px border border-hairline bg-hairline">
            {(['GSL', 'MOD', 'UNMOD'] as TimerType[]).map((k) => (
              <button key={k} onClick={() => actions.setTimerType(k)} className={`py-2 font-mono text-[11px] uppercase tracking-[0.14em] ${t.type === k ? 'bg-gold text-obsidian' : 'bg-charcoal text-sage hover:text-ivory'}`}>
                {k === 'GSL' ? 'GSL' : k === 'MOD' ? 'Mod Caucus' : 'Unmod Caucus'}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            <button className="btn btn-emerald" onClick={actions.startTimer} disabled={d.expired}><Play size={13} /> Start</button>
            <button className="btn" onClick={actions.pauseTimer}><Pause size={13} /> Pause</button>
            <button className="btn" onClick={actions.resetTimer}><RotateCcw size={13} /> Reset</button>
            <button className="btn" onClick={actions.nextSpeaker} title="Remove the head of the GSL and give the floor to the next speaker"><SkipForward size={13} /> Next</button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Speaker time (sec)">
              <div className="flex gap-2">
                <input type="number" min={5} className="field tabular" value={speakerSec} onChange={(e) => setSpeakerSec(Number(e.target.value))} />
                <button className="btn" onClick={() => speakerSec > 0 && actions.setTimerConfig({ speaker: speakerSec })}>Set</button>
              </div>
            </Field>
            <Field label="Caucus total (min)">
              <div className="flex gap-2">
                <input type="number" min={1} className="field tabular" value={caucusMin} onChange={(e) => setCaucusMin(Number(e.target.value))} />
                <button className="btn" onClick={() => caucusMin > 0 && actions.setTimerConfig({ caucus: caucusMin * 60 })}>Set</button>
              </div>
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Current speaker (override)">
              <select className="field" value={t.currentSpeaker} onChange={(e) => actions.setSpeaker(e.target.value)}>
                <option value="None">None</option>
                {COUNTRY_NAMES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        </Panel>
      </div>

      <div className="space-y-3">
        <Panel title="GSL Requests" right={<span className="tabular text-[11px] text-sage">{cs.gslRequests.length} pending</span>} bodyClass="p-0">
          <ul className="divide-y divide-hairline">
            {cs.gslRequests.length === 0 && <li className="px-3 py-4 text-sm text-sage">No requests.</li>}
            {cs.gslRequests.map((r) => (
              <li key={r.id} className="flex items-center gap-2 px-3 py-2">
                <span className="font-serif text-lg">{r.country}</span>
                <button className="btn btn-emerald ml-auto !py-1" onClick={() => actions.approveGslRequest(r.id)}><Check size={12} /> Approve</button>
                <button className="btn btn-crimson !py-1" onClick={() => actions.dismissGslRequest(r.id)}><X size={12} /></button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="GSL Queue" bodyClass="p-0">
          <ol className="divide-y divide-hairline">
            {cs.gslQueue.map((c, i) => (
              <li key={`${c}-${i}`} className={`flex items-center gap-2 px-3 py-1.5 ${i === 0 ? 'bg-gold/10' : ''}`}>
                <span className="tabular w-6 text-[11px] text-sage">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-serif text-lg">{c}</span>
                <span className="ml-auto flex gap-1">
                  <button className="btn !p-1.5" onClick={() => actions.moveInQueue(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={12} /></button>
                  <button className="btn !p-1.5" onClick={() => actions.moveInQueue(i, 1)} disabled={i === cs.gslQueue.length - 1} aria-label="Move down"><ArrowDown size={12} /></button>
                  <button className="btn btn-crimson !p-1.5" onClick={() => actions.removeFromQueue(i)} aria-label="Remove"><Trash2 size={12} /></button>
                </span>
              </li>
            ))}
            {cs.gslQueue.length === 0 && <li className="px-3 py-4 text-sm text-sage">Queue is empty.</li>}
          </ol>
          <div className="flex gap-2 border-t border-hairline p-3">
            <select className="field" value={addCountry} onChange={(e) => setAddCountry(e.target.value)} aria-label="Add country to queue">
              <option value="">Add delegation to queue…</option>
              {COUNTRY_NAMES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn shrink-0" disabled={!addCountry} onClick={() => { actions.addToQueue(addCountry); setAddCountry(''); }}>Add</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------ Motions ------------------------------ */
function MotionsTab() {
  const { state, actions } = useStore();
  const open = sortMotions(state.motions.filter((m) => m.status === 'PENDING' || m.status === 'PROJECTED'));
  const done = state.motions.filter((m) => m.status === 'PASSED' || m.status === 'FAILED').slice().reverse();
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <Panel title="Motion Queue // Auto-sorted Most → Least Disruptive" bodyClass="p-0">
          <ul className="divide-y divide-hairline">
            {open.length === 0 && <li className="px-3 py-6 text-sm text-sage">No motions pending. Delegates submit from the Floor portal.</li>}
            {open.map((m, i) => (
              <li key={m.id} className={`p-3 ${m.status === 'PROJECTED' ? 'bg-gold/10' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tabular w-5 text-[11px] text-sage">{i + 1}</span>
                  <span className="font-serif text-xl leading-tight">{motionLine(m)}</span>
                  {m.status === 'PROJECTED' && <span className="border border-gold px-1.5 font-mono text-[9px] uppercase text-gold">On the floor</span>}
                </div>
                <p className="ml-7 text-sm text-ivory/85">{m.topic}</p>
                <p className="ml-7 tabular text-[11px] text-sage">Moved by {m.delegation}</p>
                <div className="ml-7 mt-2 flex flex-wrap gap-2">
                  <button className="btn" onClick={() => actions.projectMotion(m.id)} disabled={m.status === 'PROJECTED'}><Megaphone size={12} /> Project to Floor</button>
                  <button className="btn btn-emerald" onClick={() => actions.passMotion(m.id)}><Check size={12} /> Pass Motion</button>
                  <button className="btn btn-crimson" onClick={() => actions.failMotion(m.id)}><X size={12} /> Fail / Dismiss</button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Decided" bodyClass="p-0">
        <ul className="divide-y divide-hairline">
          {done.length === 0 && <li className="px-3 py-4 text-sm text-sage">Nothing decided yet.</li>}
          {done.map((m) => (
            <li key={m.id} className="px-3 py-2 text-xs">
              <span className={`mr-2 border px-1 font-mono text-[9px] uppercase ${m.status === 'PASSED' ? 'border-emerald text-emerald' : 'border-crimson text-crimson'}`}>{m.status}</span>
              {m.type}{m.totalSeconds ? ` · ${fmtSecondsLabel(m.totalSeconds)}` : ''} — <span className="text-sage">{m.delegation}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* ------------------------------ Markets ------------------------------ */
function MacroSlider({ label, value, min = 0, max = 100, step = 0.1, suffix = '%', onCommit }: { label: string; value: number; min?: number; max?: number; step?: number; suffix?: string; onCommit: (v: number) => void }) {
  const [v, setV] = useState(value);
  const [drag, setDrag] = useState(false);
  useEffect(() => {
    if (!drag) setV(value);
  }, [value, drag]);
  const commit = () => {
    setDrag(false);
    onCommit(v);
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="tabular text-sm text-gold">{v.toFixed(step < 1 ? 1 : 0)}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={v} className="mt-1 w-full accent-[#D4AF37]" aria-label={label}
        onPointerDown={() => setDrag(true)} onChange={(e) => { setDrag(true); setV(Number(e.target.value)); }} onPointerUp={commit} onKeyUp={commit} onBlur={() => drag && commit()} />
    </div>
  );
}

function CurrencyRow({ code }: { code: string }) {
  const { state, actions } = useStore();
  const cur = state.currencies[code];
  const [pct, setPct] = useState(0);
  return (
    <li className="grid grid-cols-[64px_1fr] items-center gap-3 px-3 py-2 sm:grid-cols-[64px_110px_1fr_auto]">
      <span className="tabular font-bold">{code}</span>
      <span className="tabular text-sm text-ivory">{fmtRate(cur.rateToUSD)}</span>
      <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
        <input type="range" min={-15} max={15} step={0.5} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full accent-[#D4AF37]" aria-label={`${code} shift`} />
        <span className={`tabular w-14 text-right text-sm ${pct > 0 ? 'text-emerald' : pct < 0 ? 'text-crimson' : 'text-sage'}`}>{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</span>
      </div>
      <button className="btn col-span-2 sm:col-span-1" disabled={pct === 0} onClick={() => { actions.shiftCurrency(code, pct); setPct(0); }}>Apply</button>
    </li>
  );
}

function MarketsTab() {
  const { state, actions } = useStore();
  const cs = state.committeeState;
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
      <div className="xl:col-span-3">
        <Panel title="Currency Sliders // + strengthens / − weakens vs USD" right={<button className="btn btn-emerald !py-1" onClick={actions.rally}><TrendingUp size={12} /> De-dollarization Rally</button>} bodyClass="p-0">
          <ul className="divide-y divide-hairline">
            {Object.keys(state.currencies).map((c) => <CurrencyRow key={c} code={c} />)}
          </ul>
        </Panel>
      </div>
      <div className="xl:col-span-2">
        <Panel title="Macro Indicators">
          <div className="space-y-5">
            <MacroSlider label="Global USD Reserve Share" value={cs.usdDominanceIndex} onCommit={(v) => actions.setMacro({ usdDominanceIndex: v })} />
            <MacroSlider label='"BRICS Unit" Viability' value={cs.bricsUnitConfidence} onCommit={(v) => actions.setMacro({ bricsUnitConfidence: v })} />
            <MacroSlider label="Gold Backing Ratio" value={cs.goldBackingRatio} step={1} onCommit={(v) => actions.setMacro({ goldBackingRatio: v })} />
            <MacroSlider label="BRICS Pay Adoption" value={cs.bricsPayAdoption} onCommit={(v) => actions.setMacro({ bricsPayAdoption: v })} />
          </div>
        </Panel>
        <div className="mt-3">
          <Panel title="Suez Canal Toll Currency" tone={cs.suezTollCurrency === 'BRICS_PAY' ? 'gold' : undefined}>
            <div className="grid grid-cols-2 gap-px border border-hairline bg-hairline" role="radiogroup" aria-label="Suez Canal Toll Currency">
              {(['USD', 'BRICS_PAY'] as const).map((c) => (
                <button key={c} role="radio" aria-checked={cs.suezTollCurrency === c} onClick={() => actions.setSuezToll(c)} className={`py-2 font-mono text-[11px] uppercase tracking-wider ${cs.suezTollCurrency === c ? 'bg-gold text-obsidian' : 'bg-charcoal text-sage hover:text-ivory'}`}>
                  {c === 'USD' ? 'USD' : 'BRICS Pay / Local'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-sage">Switching to BRICS Pay: USD share −3.5, adoption +8.0, EGP +2.8%. Switching back reverses the effects.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ News ------------------------------ */
function NewsTab() {
  const { state, actions } = useStore();
  const [text, setText] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    actions.addNews(text);
    setText('');
  };
  return (
    <Panel title="Live News Ticker" bodyClass="p-0">
      <form onSubmit={submit} className="flex gap-2 border-b border-hairline p-3">
        <input className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="HEADLINE: type a wire item for every screen…" aria-label="News headline" />
        <button className="btn btn-gold shrink-0" type="submit" disabled={!text.trim()}>Publish</button>
      </form>
      <ul className="divide-y divide-hairline">
        {state.newsTicker.map((n, i) => (
          <li key={i} className="flex items-start gap-3 px-3 py-2">
            <span className="tabular w-6 pt-0.5 text-[11px] text-sage">{String(i + 1).padStart(2, '0')}</span>
            <span className="flex-1 text-sm">{n}</span>
            <button className="btn btn-crimson !p-1.5" onClick={() => actions.removeNews(i)} aria-label="Remove item"><Trash2 size={12} /></button>
          </li>
        ))}
        {state.newsTicker.length === 0 && <li className="px-3 py-4 text-sm text-sage">Ticker empty.</li>}
      </ul>
    </Panel>
  );
}

/* ------------------------------ Trades & Directives ------------------------------ */
function TradesTab() {
  const { state, actions } = useStore();
  const pending = state.trades.filter((t) => t.status === 'PENDING');
  const directives = state.directives.slice().reverse();
  const grain = state.grainContracts.filter((g) => g.status === 'PENDING');
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <Panel title="Trade Proposals Awaiting Approval" right={<span className="tabular text-[11px] text-sage">{pending.length}</span>} bodyClass="p-0">
        <ul className="divide-y divide-hairline">
          {pending.length === 0 && <li className="px-3 py-6 text-sm text-sage">No pending trades.</li>}
          {pending.map((t) => (
            <li key={t.id} className="p-3">
              <p className="flex items-center gap-2">
                <span className={`border px-1 font-mono text-[9px] uppercase ${t.kind === 'BARTER' ? 'border-crimson text-crimson' : 'border-gold text-gold'}`}>{t.kind}</span>
                <span className="font-serif text-lg">{t.from} <span className="text-gold">⇄</span> {t.to}</span>
              </p>
              <p className="tabular mt-1 text-xs"><span className="text-sage">GIVES</span> {t.offer} <span className="text-sage">FOR</span> {t.request}</p>
              {t.note && <p className="mt-1 text-xs text-sage">{t.note}</p>}
              <div className="mt-2 flex gap-2">
                <button className="btn btn-emerald" onClick={() => actions.resolveTrade(t.id, true)}><Check size={12} /> Approve &amp; Print to Ledger</button>
                <button className="btn btn-crimson" onClick={() => actions.resolveTrade(t.id, false)}><X size={12} /> Reject</button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Covert Financial Directives // Chair Eyes Only" right={<span className="tabular text-[11px] text-sage">{directives.length}</span>} bodyClass="p-0">
        <ul className="divide-y divide-hairline">
          {directives.length === 0 && <li className="px-3 py-6 text-sm text-sage">No directives received.</li>}
          {directives.map((d) => (
            <li key={d.id} className="p-3">
              <p className="flex items-baseline gap-2">
                <span className="font-serif text-lg">{d.subject}</span>
                <span className="tabular text-[11px] text-gold">{d.from}</span>
                {d.status && d.status !== 'PENDING' && (
                  <span className={`ml-auto border px-1 font-mono text-[9px] uppercase ${d.status === 'APPROVED' ? 'border-emerald text-emerald' : 'border-sage text-sage'}`}>{d.status}</span>
                )}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ivory/85">{d.body}</p>
              {d.status === 'PENDING' && (
                <div className="mt-2 flex gap-2">
                  <button className="btn btn-emerald" onClick={() => actions.resolveDirective(d.id, true)}><Check size={12} /> Approve</button>
                  <button className="btn btn-crimson" onClick={() => actions.resolveDirective(d.id, false)}><X size={12} /> Dismiss</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Grain Exchange Requests Awaiting Approval" right={<span className="tabular text-[11px] text-sage">{grain.length}</span>} bodyClass="p-0">
        <ul className="divide-y divide-hairline">
          {grain.length === 0 && <li className="px-3 py-6 text-sm text-sage">No pending grain requests.</li>}
          {grain.map((g) => {
            const t = grainType(g.commodity);
            const stock = state.grainStockpiles[g.exporter]?.[t.key] ?? 0;
            const short = stock < g.quantityMT;
            return (
              <li key={g.id} className="p-3">
                <p className="font-serif text-lg">{g.importer} <span className="text-gold">⇄</span> {g.exporter}</p>
                <p className="tabular mt-1 text-xs">
                  {fmtMT(g.quantityMT)} {t.short} · <span className={g.settlement === 'USD' ? 'text-crimson' : 'text-emerald'}>{g.settlement === 'USD' ? `USD (+${g.feePct}% surcharge)` : 'BRICS Pay / Local (0% fee)'}</span>
                </p>
                <p className={`tabular text-[11px] ${short ? 'text-crimson' : 'text-sage'}`}>Exporter stock: {fmtMT(stock)}{short ? ' — insufficient' : ''}</p>
                <div className="mt-2 flex gap-2">
                  <button className="btn btn-emerald" disabled={short} onClick={() => actions.resolveGrain(g.id, true)}><Check size={12} /> Approve &amp; Clear</button>
                  <button className="btn btn-crimson" onClick={() => actions.resolveGrain(g.id, false)}><X size={12} /> Reject</button>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

    </div>
  );
}

/* ------------------------------ Black Swan ------------------------------ */
function SwanCard({ title, desc, children, tone = 'crimson' }: { title: string; desc: string; children: ReactNode; tone?: 'crimson' | 'gold' }) {
  return (
    <Panel title={title} tone={tone}>
      <p className="mb-3 text-sm text-ivory/75">{desc}</p>
      {children}
    </Panel>
  );
}

function SwanTab() {
  const { state, actions } = useStore();
  const cs = state.committeeState;
  const [country, setCountry] = useState('Iran');
  const [freezeCountry, setFreezeCountry] = useState('Brazil');
  const [freezeAmt, setFreezeAmt] = useState(150);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sev, setSev] = useState<Severity>('CRITICAL');
  const [confirmReset, setConfirmReset] = useState(false);
  const sanctioned = Array.from(
    new Set([...Object.keys(cs.sanctions || {}), ...(cs.sanctionedCountries || [])]),
  );

  return (
    <div className="space-y-3">
      <div className={`flex flex-wrap items-center justify-between gap-3 border px-4 py-3 ${cs.currentMode === 'NORMAL' && !cs.crisisAlert && sanctioned.length === 0 ? 'border-emerald/50 bg-emerald/5' : 'flash-border border-2 bg-crimson/10'}`}>
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} className={cs.currentMode === 'NORMAL' && !cs.crisisAlert && sanctioned.length === 0 ? 'text-emerald' : 'text-crimson'} />
          <span className="label">Committee mode</span>
          <span className={`font-serif text-2xl ${cs.currentMode === 'NORMAL' && !cs.crisisAlert && sanctioned.length === 0 ? 'text-emerald' : 'text-crimson'}`}>{cs.currentMode.replace('_', ' ')}</span>
        </div>
        <button className="btn btn-emerald" onClick={actions.resetMode} disabled={cs.currentMode === 'NORMAL' && !cs.crisisAlert && sanctioned.length === 0}><RotateCcw size={13} /> Restore Normal Operations</button>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-4">
        <SwanCard title="Mode 1 // The Barter Protocol" desc='Cows for Grapevines. Full-screen alert; fiat rates glitch to ERR_FIAT_NULL; the Trade Floor locks money and opens the Physical Barter Ledger.'>
          <button className="btn btn-crimson w-full !py-3" onClick={actions.triggerBarter}><Skull size={14} /> Trigger Barter Protocol</button>
          <button className="btn mt-2 w-full" onClick={actions.triggerSwiftBlackout}>SWIFT Blackout only (transfers locked)</button>
        </SwanCard>

        <SwanCard title="Mode 2 // Rogue State Treasury Dump" desc="An unnamed member dumps $150B in US Treasuries. USD slides sharply, volatility spikes, SAR/AED face peg pressure.">
          <button className="btn btn-crimson w-full !py-3" onClick={actions.triggerBondDump}><AlertTriangle size={14} /> Dump $150B in Treasuries</button>
        </SwanCard>

        <SwanCard title="Mode 3 // Secondary Sanctions Roulette" desc="Stamps SANCTIONED // SWIFT CUTOFF on the country, drops its currency 12%, and opens a 10-minute BRICS Pay bail-out window.">
          <div className="flex gap-2">
            <select className="field" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country to sanction">
              {COUNTRIES.map((c) => <option key={c.name}>{c.name}</option>)}
            </select>
            <button className="btn btn-crimson shrink-0" onClick={() => actions.imposeSanctions(country)}>Impose Secondary Sanctions</button>
          </div>
          {sanctioned.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {sanctioned.map((c) => (
                <button key={c} className="btn !py-1" onClick={() => actions.liftSanctions(c)}>Lift {c} <X size={11} /></button>
              ))}
              <button className="btn btn-emerald !py-1" onClick={() => actions.liftSanctions()}>Lift all sanctions</button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-sage">No active sanctions.</p>
          )}
        </SwanCard>

        <SwanCard title="MODE 4 // WESTERN ASSET FREEZE (EUROCLEAR CUTOFF)" desc="Euroclear/DTCC unilaterally block a member's foreign reserves. Currency drops 8.5%, a crimson alert hits every screen, and delegates must ratify BRICS Clear.">
          <div className="space-y-3">
            <select className="field" value={freezeCountry} onChange={(e) => setFreezeCountry(e.target.value)} aria-label="Country to freeze">
              {COUNTRIES.map((c) => <option key={c.name}>{c.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-px border border-hairline bg-hairline">
              {[50, 150, 300].map((n) => (
                <button key={n} onClick={() => setFreezeAmt(n)} aria-pressed={freezeAmt === n} className={`tabular py-2 text-xs ${freezeAmt === n ? 'bg-crimson text-ivory' : 'bg-charcoal text-sage hover:text-ivory'}`}>${n}B</button>
              ))}
            </div>
            <button className="btn btn-crimson w-full !py-3" onClick={() => actions.executeAssetFreeze(freezeCountry, freezeAmt)} disabled={cs.currentMode === 'ASSET_FREEZE'}>
              <Skull size={14} /> Execute Asset Freeze
            </button>
            {cs.assetFreeze && (
              <div className="border border-hairline bg-charcoal/50 p-2">
                <p className="tabular text-[11px] text-sage">
                  Frozen: <span className="text-crimson">{cs.assetFreeze.country}</span> · BRICS Clear signatories{' '}
                  <span className="text-ivory">{cs.assetFreeze.signers.length}/{BRICS_CLEAR_QUORUM}</span>
                </p>
                <button className="btn btn-emerald mt-2 w-full" onClick={actions.ratifyBricsClear}>Ratify BRICS Clear instantly</button>
              </div>
            )}
          </div>
        </SwanCard>
      </div>

      <SwanCard title="Custom Breaking Crisis Injection" desc="Type any crisis, pick a severity, and blast it as a modal with a sonar chime to every connected screen." tone="gold">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_160px_auto]">
          <Field label="Headline"><input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Suez Canal blocked by container ship" /></Field>
          <Field label="Body"><input className="field" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details for the committee…" /></Field>
          <Field label="Severity">
            <select className="field" value={sev} onChange={(e) => setSev(e.target.value as Severity)}>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
              <option value="ABSURD">Absurd</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button className="btn btn-gold w-full !py-2.5" disabled={!title.trim()} onClick={() => { actions.customCrisis({ title: title.trim(), body: body.trim(), severity: sev }); setTitle(''); setBody(''); }}>
              <Megaphone size={13} /> Blast
            </button>
          </div>
        </div>
      </SwanCard>

      <Panel title="Danger Zone">
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex-1 text-sm text-sage">Reset all committee data (markets, GSL, motions, trades, directives, news) to the initial seed.</p>
          {confirmReset ? (
            <>
              <button className="btn btn-crimson" onClick={() => { actions.resetAll(); setConfirmReset(false); }}>Confirm reset</button>
              <button className="btn" onClick={() => setConfirmReset(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-crimson" onClick={() => setConfirmReset(true)}><Trash2 size={13} /> Reset all data</button>
          )}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------ Page ------------------------------ */
export default function Admin() {
  const { isChair, state, toast } = useStore();
  const [tab, setTab] = useState<Tab>('timer');
  const [localUnlocked, setLocalUnlocked] = useState(false);
  if (!isChair && !localUnlocked) return <PinGate onSuccess={() => setLocalUnlocked(true)} />;
  const pendingMotions = state.motions.filter((m) => m.status === 'PENDING').length;
  const pendingTrades =
    state.trades.filter((t) => t.status === 'PENDING').length +
    state.grainContracts.filter((g) => g.status === 'PENDING').length +
    state.directives.filter((d) => d.status === 'PENDING').length;
  const badge = (id: Tab) => (id === 'motions' ? pendingMotions : id === 'trades' ? pendingTrades : id === 'timer' ? state.committeeState.gslRequests.length : 0);

  return (
    <div>
      <PageHeader kicker="Chair // God Mode" title="Chair Control Center">
        <span className="label">Mode: {state.committeeState.currentMode.replace('_', ' ')}</span>
      </PageHeader>
      {toast && (
        <div className="mb-3 flex items-center gap-2 border border-gold/40 bg-gold/10 px-3 py-2 font-mono text-xs text-gold">
          <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
          <span>LATEST ACTION // {toast}</span>
        </div>
      )}
      <div role="tablist" className="mb-3 flex gap-px overflow-x-auto border border-hairline bg-hairline">
        {TABS.map((x) => {
          const n = badge(x.id);
          return (
            <button key={x.id} role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)}
              className={`flex shrink-0 items-center gap-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] ${tab === x.id ? (x.id === 'crisis' ? 'bg-crimson text-ivory' : 'bg-gold text-obsidian') : x.id === 'crisis' ? 'bg-charcoal text-crimson' : 'bg-charcoal text-sage hover:text-ivory'}`}>
              {x.icon}
              {x.label}
              {n > 0 && <span className="tabular grid h-4 min-w-4 place-items-center bg-crimson px-1 text-[9px] text-ivory">{n}</span>}
            </button>
          );
        })}
      </div>
      {tab === 'timer' && <TimerTab />}
      {tab === 'motions' && <MotionsTab />}
      {tab === 'markets' && <MarketsTab />}
      {tab === 'news' && <NewsTab />}
      {tab === 'trades' && <TradesTab />}
      {tab === 'crisis' && <SwanTab />}
    </div>
  );
}

export {
  TimerTab as TimersGsl,
  MotionsTab as Motions,
  MarketsTab as Markets,
  NewsTab as NewsTicker,
  TradesTab as TradesDirectives,
  SwanTab as BigBullshitArea,
  SwanTab as BlackSwan,
};
