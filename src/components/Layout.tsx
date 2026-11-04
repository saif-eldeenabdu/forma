import { useEffect, useState, type FormEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BookOpen,
  Gavel,
  Globe2,
  Landmark,
  Lock,
  Menu,
  MessageSquare,
  Repeat,
  ScrollText,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useNow, useStore } from '../lib/store';
import { FULL_MEMBERS, PARTNERS } from '../data/countries';
import { isMuted, setMuted } from '../lib/audio';
import { CrisisOverlay, MotionFlash, ActiveMotionBanner } from './Overlays';

interface NavItem {
  to: string;
  aliases?: string[];
  label: string;
  icon: typeof Activity;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'TERMINAL', icon: Activity, end: true },
  { to: '/floor', label: 'FLOOR', icon: Gavel },
  { to: '/exchange', label: 'EXCHANGE', icon: TrendingUp },
  { to: '/trade', label: 'TRADE & BARTER', icon: Repeat },
  { to: '/comms', label: 'COMMS', icon: MessageSquare },
  { to: '/dossiers', label: 'DOSSIERS', icon: Landmark },
  { to: '/dais', label: 'THE DAIS', icon: ScrollText },
  { to: '/gossip', aliases: ['/gossip-box'], label: 'GOSSIP BOX', icon: Sparkles },
  { to: '/guide', aliases: ['/briefing'], label: 'GUIDE', icon: BookOpen },
];

function resolveActiveLabel(pathname: string): string {
  if (pathname === '/admin' || pathname === '/chair') return 'CHAIR CONTROL';
  for (const item of NAV) {
    if (item.end ? pathname === item.to : pathname.startsWith(item.to)) {
      return item.label;
    }
    if (item.aliases?.some((a) => pathname.startsWith(a))) {
      return item.label;
    }
  }
  return 'TERMINAL';
}

function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.end) return pathname === item.to;
  if (pathname.startsWith(item.to)) return true;
  return !!item.aliases?.some((a) => pathname.startsWith(a));
}

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
    <span className="hidden xl:inline tabular text-[11px] text-sage">
      UTC {p(d.getUTCHours())}:{p(d.getUTCMinutes())}:{p(d.getUTCSeconds())}
    </span>
  );
}

export default function Layout() {
  const { state, me, reserves, bankrupt, releaseDelegation, isChair, lock, toast: stateToast } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [muted, setMutedState] = useState(isMuted());

  const cs = state.committeeState;
  const incomingTrades = me ? state.trades.filter((t) => t.to === me && t.status === 'PENDING_COUNTERPARTY').length : 0;
  const unreadComms = me
    ? (state.backchannelMessages || []).filter((m) => m.from !== me && (m.to === me || m.to === 'GLOBAL')).length
    : 0;
  const totalUnread = incomingTrades + unreadComms;
  const activeTabLabel = resolveActiveLabel(location.pathname);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const ledger = state.trades
    .filter((t) => t.kind === 'BARTER' && t.status === 'APPROVED')
    .map((t, i) => `LEDGER #${String(i + 1).padStart(3, '0')} — ${t.from} ⇄ ${t.to}: ${t.offer} FOR ${t.request}`);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-hairline bg-obsidian/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-2 px-3 py-2 md:px-5">
          {/* Left: Brand Title & Compact Hamburger Menu Button */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              className="relative inline-flex items-center gap-1.5 border border-gold/60 bg-[#111614] px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-obsidian"
            >
              <Menu size={13} strokeWidth={2} />
              <span>[ ☰ MENU ]</span>
              {totalUnread > 0 && (
                <span className="ml-0.5 rounded-full bg-crimson px-1.5 py-0.2 font-mono text-[9px] font-bold text-ivory animate-pulse">
                  {totalUnread}
                </span>
              )}
            </button>

            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 text-left" aria-label="Home">
              <span className="hidden sm:grid h-8 w-8 place-items-center border border-gold text-gold">
                <Globe2 size={16} strokeWidth={1.5} />
              </span>
              <span>
                <span className="block font-serif text-lg sm:text-xl leading-none tracking-wide text-ivory">BRICS-NET</span>
                <span className="label mt-0.5 hidden sm:block !text-[9px]">Sovereign Terminal // 2026</span>
              </span>
            </button>
          </div>

          {/* Right: Compact Active Tab Badge, Live RESERVES, Locked DELEGATION PIN Button, and CHAIR ACCESS */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap justify-end">
            {/* Active Tab Badge */}
            <span className="hidden md:inline-flex items-center gap-1.5 border border-hairline bg-[#111614] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {activeTabLabel}
            </span>

            {/* Live RESERVES */}
            {me && (
              <span
                className={`inline-flex items-center border px-2 sm:px-2.5 py-1 tabular font-mono text-[10px] font-bold uppercase tracking-wider ${
                  bankrupt
                    ? 'border-crimson bg-crimson/20 text-crimson animate-pulse'
                    : 'border-emerald/40 bg-emerald/10 text-emerald'
                }`}
              >
                {bankrupt ? 'BANKRUPT ($0)' : `RESERVES: $${Math.round(reserves).toLocaleString()}`}
              </span>
            )}

            {/* Locked DELEGATION PIN Button / Identity */}
            {me ? (
              <div className="inline-flex items-center gap-1.5 border border-gold/40 bg-[#111614] px-2.5 py-1 font-mono text-[10px] sm:text-[11px]">
                <Lock size={11} className="text-gold shrink-0" />
                <span className="font-bold uppercase tracking-wider text-ivory truncate max-w-[90px] sm:max-w-[130px]">{me}</span>
                <button
                  type="button"
                  onClick={releaseDelegation}
                  className="ml-1 text-[10px] text-sage underline hover:text-crimson"
                  title="Clear authentication session and return to Viewer mode"
                >
                  Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setClaimOpen(true)}
                className="btn btn-gold !py-1 !px-2.5 !text-[10px] sm:!text-[11px]"
              >
                <Lock size={11} /> Delegation
              </button>
            )}

            {/* CHAIR ACCESS */}
            <button
              type="button"
              onClick={() => (isChair ? navigate('/admin') : setPinOpen(true))}
              className={`btn !py-1 !px-2.5 !text-[10px] sm:!text-[11px] ${
                isChair ? '!border-crimson/70 !text-crimson hover:!bg-crimson/10' : ''
              }`}
            >
              <Lock size={11} />
              <span className="hidden sm:inline">Chair Access</span>
              <span className="sm:hidden">Chair</span>
            </button>

            <Clock />
          </div>
        </div>

        {me && bankrupt && (
          <div className="border-y-2 border-crimson bg-crimson/30 px-4 py-2 text-center font-mono text-xs font-black uppercase tracking-[0.2em] text-ivory shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse">
            ▲ SOVEREIGN DEFAULT (BANKRUPT): YOUR TREASURY IS EMPTY ($0). YOU CANNOT BID FOR SPEECHES, SUBMIT MOTIONS, OR TRADE UNTIL BAILED OUT ▲
          </div>
        )}
        {cs.currentMode !== 'NORMAL' && cs.activeCrisisBanner && (
          <div className="flash-border border-y-2 bg-crimson/15 px-4 py-1.5 text-center font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-crimson">
            ▲ {cs.activeCrisisBanner} ▲
          </div>
        )}
        <Ticker items={state.newsTicker} label="Wire" />
        {cs.currentMode === 'BARTER_CRISIS' && <Ticker items={ledger.length ? ledger : ['PHYSICAL BARTER LEDGER OPEN — NO TRADES RECORDED YET']} label="Barter Ledger" tone="crimson" speed={10} />}
      </header>

      {/* Smooth Slide-Out Hamburger Navigation Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[70] flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-[#0A0D0C]/80 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Drawer Panel */}
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
              className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-[#26302B] bg-[#111614] shadow-[8px_0_32px_rgba(0,0,0,0.75)]"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#26302B] bg-[#0A0D0C] px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center border border-gold text-gold">
                    <Globe2 size={14} strokeWidth={1.5} />
                  </span>
                  <div>
                    <span className="block font-serif text-base leading-none tracking-wide text-ivory">BRICS-NET</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-gold">Navigation Directory</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="border border-[#26302B] bg-[#111614] p-1.5 text-sage transition-colors hover:border-gold hover:text-gold"
                  aria-label="Close navigation menu"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Vertical Navigation Tabs */}
              <nav className="flex-1 overflow-y-auto py-2" aria-label="Primary Navigation">
                <ul className="space-y-0.5 px-2">
                  {NAV.map((item) => {
                    const Icon = item.icon;
                    const active = isNavItemActive(item, location.pathname);
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={() => setDrawerOpen(false)}
                          className={`group relative flex items-center justify-between border px-3 py-2.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
                            active
                              ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 font-bold text-[#D4AF37]'
                              : 'border-transparent text-ivory/80 hover:border-[#26302B] hover:bg-[#161C19] hover:text-ivory'
                          }`}
                        >
                          {active && <span className="absolute inset-y-0 left-0 w-1 bg-[#D4AF37]" />}
                          <span className="flex items-center gap-3">
                            <Icon size={15} className={active ? 'text-[#D4AF37]' : 'text-sage group-hover:text-[#D4AF37]'} />
                            <span>{item.label}</span>
                          </span>
                          {item.to === '/trade' && incomingTrades > 0 && (
                            <span className="rounded-full bg-crimson px-2 py-0.5 font-mono text-[10px] font-bold text-ivory animate-pulse">
                              {incomingTrades}
                            </span>
                          )}
                          {item.to === '/comms' && unreadComms > 0 && (
                            <span className="rounded-full bg-crimson px-2 py-0.5 font-mono text-[10px] font-bold text-ivory animate-pulse">
                              {unreadComms}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}

                  {isChair && (
                    <li className="pt-2 mt-2 border-t border-[#26302B]">
                      <NavLink
                        to="/admin"
                        onClick={() => setDrawerOpen(false)}
                        className={({ isActive }) =>
                          `relative flex items-center justify-between border px-3 py-2.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
                            isActive
                              ? 'border-crimson/60 bg-crimson/15 font-bold text-crimson'
                              : 'border-transparent text-crimson/80 hover:border-crimson/40 hover:bg-crimson/10 hover:text-crimson'
                          }`
                        }
                      >
                        <span className="flex items-center gap-3">
                          <ShieldAlert size={15} />
                          <span>CHAIR CONTROL</span>
                        </span>
                      </NavLink>
                    </li>
                  )}
                </ul>
              </nav>

              {/* Drawer Footer Status */}
              <div className="border-t border-[#26302B] bg-[#0A0D0C] px-4 py-3 space-y-2">
                {me ? (
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="uppercase tracking-wider text-sage truncate">{me}</span>
                    <span className={`tabular font-bold ${bankrupt ? 'text-crimson' : 'text-emerald'}`}>
                      {bankrupt ? 'BANKRUPT ($0)' : `$${Math.round(reserves).toLocaleString()}`}
                    </span>
                  </div>
                ) : (
                  <div className="font-mono text-[10px] uppercase tracking-wider text-sage">
                    Viewer Mode // Unclaimed
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

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

      <AnimatePresence>
        {pinOpen && <PinModal onClose={() => setPinOpen(false)} />}
        {claimOpen && <DelegationAuthModal onClose={() => setClaimOpen(false)} />}
      </AnimatePresence>
      <CrisisOverlay />
      <MotionFlash />
    </div>
  );
}
