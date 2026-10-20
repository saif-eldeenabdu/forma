import { useState, type FormEvent } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, BookOpen, Globe2, Landmark, Lock, Repeat, ScrollText, Volume2, VolumeX, X, Gavel } from 'lucide-react';
import { useNow, useStore } from '../lib/store';
import { FULL_MEMBERS, PARTNERS } from '../data/countries';
import { isMuted, setMuted } from '../lib/audio';
import { CrisisOverlay, MotionFlash, ActiveMotionBanner } from './Overlays';

const NAV = [
  { to: '/', label: 'Terminal', icon: Activity, end: true },
  { to: '/floor', label: 'Floor', icon: Gavel },
  { to: '/trade', label: 'Trade', icon: Repeat },
  { to: '/dossiers', label: 'Dossiers', icon: Landmark },
  { to: '/briefing', label: 'Briefing', icon: BookOpen },
];

function Ticker({ items, label, tone = 'gold', speed = 14 }: { items: string[]; label: string; tone?: 'gold' | 'crimson'; speed?: number }) {
  const text = items.length ? items : ['NO ITEMS'];
  const duration = Math.max(30, text.join('').length / speed);
  const color = tone === 'gold' ? 'bg-gold text-obsidian' : 'bg-crimson text-ivory';
  const row = (k: string) => (
    <div key={k} className="flex shrink-0 items-center" aria-hidden={k === 'b'}>
      {text.map((t, i) => (
        <span key={i} className="flex items-center whitespace-nowrap px-6 font-mono text-[11px] uppercase tracking-wider text-ivory/90">
          <span className="mr-6 text-gold">◆</span>
          {t}
        </span>
      ))}
    </div>
  );
  return (
    <div className="ticker-wrap flex items-stretch border-b border-hairline bg-charcoal">
      <span className={`z-10 flex shrink-0 items-center px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${color}`}>{label}</span>
      <div className="relative min-w-0 flex-1 overflow-hidden py-1.5">
        <div className="ticker-track" style={{ ['--ticker-duration' as string]: `${duration}s` }}>
          {row('a')}
          {row('b')}
        </div>
      </div>
    </div>
  );
}

function PinModal({ onClose }: { onClose: () => void }) {
  const { unlock } = useStore();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (unlock(pin)) {
      setPin('');
      onClose();
      navigate('/admin');
    } else {
      setErr(true);
      setPin('');
    }
  };
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-obsidian/90 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        className="panel w-full max-w-sm p-5"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="label !text-gold">Restricted // Chair Only</p>
            <h2 className="mt-1 text-2xl">Chair Access</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sage hover:text-ivory" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <label className="label mb-1 block">Enter PIN</label>
        <input
          autoFocus
          inputMode="numeric"
          type="password"
          placeholder="••••"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setErr(false);
          }}
          className={`field tabular text-center text-xl tracking-[0.6em] ${err ? '!border-crimson' : ''}`}
          maxLength={8}
          aria-label="Chair PIN"
        />
        {err && <p className="mt-2 font-mono text-[11px] uppercase text-crimson">Access denied // invalid PIN</p>}
        <button className="btn btn-gold mt-4 w-full" type="submit">
          <Lock size={13} /> Authenticate
        </button>
      </motion.form>
    </motion.div>
  );
}

function DelegationAuthModal({ onClose }: { onClose: () => void }) {
  const { claimDelegation } = useStore();
  const [country, setCountry] = useState('Brazil');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!country) return;
    if (claimDelegation(country, pin)) {
      setPin('');
      onClose();
    } else {
      setErr(true);
      setPin('');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-obsidian/90 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        className="panel w-full max-w-sm p-5"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="label !text-gold">Sovereign Identity Lock</p>
            <h2 className="mt-1 text-2xl">Claim Delegation</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sage hover:text-ivory" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <label className="label mb-1 block">Select Country</label>
        <select
          className="field mb-3"
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setErr(false);
          }}
          required
        >
          <optgroup label="FULL BRICS MEMBERS (11)">
            {FULL_MEMBERS.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </optgroup>
          <optgroup label="BRICS PARTNERS (11)">
            {PARTNERS.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </optgroup>
        </select>

        <label className="label mb-1 block">4-Digit Delegation PIN</label>
        <input
          autoFocus
          inputMode="numeric"
          type="password"
          placeholder="••••"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setErr(false);
          }}
          className={`field tabular text-center text-xl tracking-[0.6em] ${err ? '!border-crimson' : ''}`}
          maxLength={8}
          aria-label="Delegation PIN"
        />
        {err && <p className="mt-2 font-mono text-[11px] uppercase text-crimson">Authentication failed // invalid PIN for {country}</p>}
        <button className="btn btn-gold mt-4 w-full" type="submit" disabled={!pin.trim()}>
          <Lock size={13} /> Authenticate Delegation
        </button>
      </motion.form>
    </motion.div>
  );
}

function Clock() {
  const t = useNow(1000);
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    <span className="tabular text-[11px] text-sage">
      UTC {p(d.getUTCHours())}:{p(d.getUTCMinutes())}:{p(d.getUTCSeconds())}
    </span>
  );
}

export default function Layout() {
  const { state, me, releaseDelegation, isChair, lock, toast: stateToast } = useStore();
  const navigate = useNavigate();
  const [pinOpen, setPinOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const cs = state.committeeState;
  const incomingTrades = me ? state.trades.filter((t) => t.to === me && t.status === 'PENDING_COUNTERPARTY').length : 0;
  const ledger = state.trades
    .filter((t) => t.kind === 'BARTER' && t.status === 'APPROVED')
    .map((t, i) => `LEDGER #${String(i + 1).padStart(3, '0')} — ${t.from} ⇄ ${t.to}: ${t.offer} FOR ${t.request}`);

  return (
    <div className="flex min-h-screen flex-col pb-14 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-hairline bg-obsidian/95">
        <div className="mx-auto flex max-w-[1920px] items-center gap-4 px-3 py-2 md:px-5">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 text-left" aria-label="Home">
            <span className="grid h-9 w-9 place-items-center border border-gold text-gold">
              <Globe2 size={18} strokeWidth={1.5} />
            </span>
            <span>
              <span className="block font-serif text-xl leading-none tracking-wide text-ivory">BRICS-NET</span>
              <span className="label mt-1 block !text-[9px]">Sovereign Terminal // 2026</span>
            </span>
          </button>

          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `relative flex items-center px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] ${isActive ? 'text-gold' : 'text-sage hover:text-ivory'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{n.label}</span>
                    {n.to === '/trade' && incomingTrades > 0 && (
                      <span className="ml-1.5 rounded-full bg-crimson px-1.5 py-0.2 font-mono text-[9px] font-bold text-ivory animate-pulse">
                        {incomingTrades}
                      </span>
                    )}
                    {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-2 -bottom-[9px] h-px bg-gold" />}
                  </>
                )}
              </NavLink>
            ))}
            {isChair && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `relative px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] ${isActive ? 'text-crimson' : 'text-crimson/70 hover:text-crimson'}`
                }
              >
                Chair
              </NavLink>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden items-center gap-2 lg:flex">
              {me ? (
                <div className="flex items-center gap-2 border border-gold/40 bg-charcoal px-3 py-1 font-mono text-[11px]">
                  <Lock size={12} className="text-gold" />
                  <span className="font-bold uppercase tracking-wider text-ivory">{me}</span>
                  <button
                    onClick={releaseDelegation}
                    className="ml-2 text-[10px] text-sage underline hover:text-crimson"
                    title="Clear authentication session and return to Viewer mode"
                  >
                    Log Out / Switch
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setClaimOpen(true)}
                  className="btn btn-gold !py-1 !text-[11px]"
                >
                  <Lock size={12} /> Claim Delegation
                </button>
              )}
            </div>
            <Clock />
          </div>
        </div>
        {cs.currentMode !== 'NORMAL' && cs.activeCrisisBanner && (
          <div className="flash-border border-y-2 bg-crimson/15 px-4 py-1.5 text-center font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-crimson">
            ▲ {cs.activeCrisisBanner} ▲
          </div>
        )}
        <Ticker items={state.newsTicker} label="Wire" />
        {cs.currentMode === 'BARTER_CRISIS' && <Ticker items={ledger.length ? ledger : ['PHYSICAL BARTER LEDGER OPEN — NO TRADES RECORDED YET']} label="Barter Ledger" tone="crimson" speed={10} />}
      </header>

      <AnimatePresence>
        {stateToast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 right-4 z-[100] flex items-center gap-3 border border-gold bg-basalt px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.6)] backdrop-blur"
            role="status"
            aria-live="polite"
          >
            <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ivory">{stateToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ActiveMotionBanner />

      <main className="mx-auto w-full max-w-[1920px] flex-1 px-3 py-4 md:px-5">
        <Outlet />
      </main>

      <footer className="border-t border-hairline bg-charcoal">
        <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3 px-3 py-3 md:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <ScrollText size={13} className="text-sage" />
            <span className="label">BRICS Currency &amp; De-Dollarization Committee // 2026 Framework // Simulation — figures approximate</span>
          </div>
          <div className="flex items-center gap-2">
            {me ? (
              <div className="flex items-center gap-1.5 border border-gold/40 bg-charcoal px-2 py-1 font-mono text-[10px] lg:hidden">
                <Lock size={11} className="text-gold" />
                <span className="truncate max-w-[120px] font-bold text-ivory">{me}</span>
                <button onClick={releaseDelegation} className="ml-1 text-[9px] text-crimson underline">
                  Log Out
                </button>
              </div>
            ) : (
              <button onClick={() => setClaimOpen(true)} className="btn !py-1 !text-[10px] lg:hidden">
                <Lock size={11} /> Claim
              </button>
            )}
            <button
              className="btn !px-2"
              onClick={() => {
                setMuted(!muted);
                setMutedState(!muted);
              }}
              aria-label={muted ? 'Unmute alerts' : 'Mute alerts'}
            >
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            {isChair && (
              <button className="btn" onClick={lock}>
                Lock Chair
              </button>
            )}
            <button className="btn opacity-60 hover:opacity-100" onClick={() => (isChair ? navigate('/admin') : setPinOpen(true))}>
              <Lock size={12} /> Chair Access
            </button>
          </div>
        </div>
      </footer>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-hairline bg-obsidian md:hidden" aria-label="Mobile">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 font-mono text-[9px] uppercase tracking-wider ${isActive ? 'text-gold' : 'text-sage'}`
            }
          >
            <div className="relative">
              <n.icon size={16} strokeWidth={1.5} />
              {n.to === '/trade' && incomingTrades > 0 && (
                <span className="absolute -top-1 -right-2 rounded-full bg-crimson px-1 text-[8px] font-bold text-ivory animate-pulse">
                  {incomingTrades}
                </span>
              )}
            </div>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <AnimatePresence>
        {pinOpen && <PinModal onClose={() => setPinOpen(false)} />}
        {claimOpen && <DelegationAuthModal onClose={() => setClaimOpen(false)} />}
      </AnimatePresence>
      <CrisisOverlay />
      <MotionFlash />
    </div>
  );
}
