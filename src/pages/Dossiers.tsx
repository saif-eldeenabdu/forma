import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { COUNTRIES, type Country } from '../data/countries';
import { useStore } from '../lib/store';
import { PageHeader } from '../components/ui';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-hairline bg-charcoal p-3">
      <p className="label">{label}</p>
      <p className="tabular mt-1 text-sm text-ivory">{value}</p>
    </div>
  );
}

function Modal({ c, onClose }: { c: Country; onClose: () => void }) {
  const { state } = useStore();
  const sanctioned = !!state.committeeState.sanctions[c.name];
  const isFull = c.tier === 'FULL BRICS MEMBER';

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[55] flex items-start justify-center overflow-y-auto bg-obsidian/90 p-3 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.article
        layoutId={`dossier-${c.name}`}
        onClick={(e) => e.stopPropagation()}
        className="panel w-full max-w-3xl bg-basalt"
        role="dialog"
        aria-label={`${c.name} dossier`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-hairline p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  isFull
                    ? 'border-gold/70 bg-gold/15 text-gold'
                    : 'border-emerald/70 bg-emerald/15 text-emerald'
                }`}
              >
                {c.tier}
              </span>
              <span className="label !text-sage">{c.code} // {c.currencyCode} — {c.currencyName}</span>
            </div>
            <h2 className="mt-2 text-4xl font-medium leading-none">{c.name}</h2>
            {sanctioned && <span className="stamp mt-3">Sanctioned // SWIFT cutoff</span>}
          </div>
          <button onClick={onClose} className="text-sage hover:text-ivory" aria-label="Close dossier">
            <X size={18} />
          </button>
        </header>
        <div className="space-y-5 p-5">
          {/* CHEAT SHEET & RESEARCH STRATEGY */}
          <section className="border-l-2 border-emerald bg-emerald/5 p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-emerald animate-pulse" />
              <p className="label !text-emerald">Cheat Sheet // Research &amp; Negotiation Strategy</p>
            </div>
            <p className="mt-2 font-mono text-xs leading-relaxed text-ivory/95 border border-emerald/30 bg-charcoal/70 p-3">
              {c.strategy}
            </p>
          </section>

          <section>
            <p className="label">Profile &amp; Strategic Role</p>
            <p className="mt-1 text-ivory/90">{c.role}</p>
          </section>

          <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Stat label="GDP" value={c.gdp} />
            <Stat label="Gold reserves" value={c.gold} />
            <Stat label="USD dependency" value={c.usdDependency} />
          </section>

          <section>
            <p className="label">Top exports</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {c.exports.map((e) => (
                <span key={e} className="border border-hairline bg-charcoal px-2 py-1 text-xs text-ivory">
                  {e}
                </span>
              ))}
            </div>
          </section>

          <section>
            <p className="label">Profile &amp; Stance on BRICS Currency</p>
            <p className="mt-1 leading-relaxed text-ivory/90">{c.stance}</p>
          </section>

          <section className="border-l-2 border-gold bg-gold/5 p-4">
            <p className="label !text-gold">Research prompts for the delegate</p>
            <ul className="mt-2 space-y-2">
              {c.prompts.map((p, i) => (
                <li key={i} className="flex gap-3 font-serif text-lg italic leading-snug text-ivory">
                  <span className="tabular text-sm not-italic text-gold">Q{i + 1}</span>
                  {p}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </motion.article>
    </motion.div>
  );
}

export default function Dossiers() {
  const { state, me } = useStore();
  const [open, setOpen] = useState<Country | null>(null);
  const [tierFilter, setTierFilter] = useState<'ALL' | 'MEMBERS' | 'PARTNERS'>('ALL');

  const filtered = COUNTRIES.filter((c) => {
    if (tierFilter === 'ALL') return true;
    if (tierFilter === 'MEMBERS') return c.tier === 'FULL BRICS MEMBER';
    return c.tier === 'BRICS PARTNER';
  });

  return (
    <div>
      <PageHeader kicker="Delegations // 2026 Framework" title="Country Dossiers &amp; Cheat Sheets">
        <div className="flex flex-col items-end gap-2">
          <p className="label max-w-md text-right">
            22 Official Delegations (11 Full Members + 11 Partners). Select any card to open the strategy cheat sheet.
          </p>
          <div className="flex items-center border border-hairline bg-charcoal p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setTierFilter('ALL')}
              className={`px-3 py-1 uppercase tracking-wider transition-colors ${
                tierFilter === 'ALL' ? 'bg-ivory text-obsidian font-bold' : 'text-sage hover:text-ivory'
              }`}
            >
              All (22)
            </button>
            <button
              onClick={() => setTierFilter('MEMBERS')}
              className={`px-3 py-1 uppercase tracking-wider transition-colors ${
                tierFilter === 'MEMBERS' ? 'bg-gold text-obsidian font-bold' : 'text-sage hover:text-ivory'
              }`}
            >
              Full Members (11)
            </button>
            <button
              onClick={() => setTierFilter('PARTNERS')}
              className={`px-3 py-1 uppercase tracking-wider transition-colors ${
                tierFilter === 'PARTNERS' ? 'bg-emerald text-obsidian font-bold' : 'text-sage hover:text-ivory'
              }`}
            >
              Partners (11)
            </button>
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((c) => {
          const sanctioned = !!state.committeeState.sanctions[c.name];
          const isFull = c.tier === 'FULL BRICS MEMBER';
          return (
            <motion.button
              layoutId={`dossier-${c.name}`}
              key={c.name}
              onClick={() => setOpen(c)}
              className={`panel group relative p-4 text-left transition-colors hover:border-gold ${sanctioned ? '!border-crimson' : ''}`}
            >
              <span className="xh -left-[4px] -top-[7px]">+</span>
              <span className="xh -bottom-[7px] -right-[4px]">+</span>
              <div className="flex items-center justify-between">
                <span className="tabular text-[11px] text-sage">{c.code}</span>
                <span
                  className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider font-semibold ${
                    isFull
                      ? 'border-gold/70 bg-gold/15 text-gold'
                      : 'border-emerald/70 bg-emerald/15 text-emerald'
                  }`}
                >
                  {isFull ? 'Full Member' : 'Partner'}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-medium leading-tight">{c.name}</h2>
              {me === c.name && <p className="label mt-1 !text-emerald">Your delegation</p>}
              <p className="mt-2 line-clamp-2 text-xs text-sage">{c.role}</p>

              <div className="mt-3 border-t border-hairline/80 pt-2">
                <p className="label !text-[9px] text-emerald mb-1">Cheat sheet focus</p>
                <p className="line-clamp-2 font-mono text-[11px] text-ivory/80">{c.strategy}</p>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-hairline pt-3">
                <div>
                  <dt className="label">GDP</dt>
                  <dd className="tabular text-xs">{c.gdp}</dd>
                </div>
                <div>
                  <dt className="label">Currency</dt>
                  <dd className="tabular text-xs text-gold">{c.currencyCode}</dd>
                </div>
              </dl>
              {sanctioned && <span className="stamp mt-3">Sanctioned // SWIFT cutoff</span>}
              <p className="label mt-3 text-sage group-hover:!text-gold">Open dossier &amp; strategy →</p>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-sage">Simulation framework — figures approximate and curated for committee use.</p>
      <AnimatePresence>{open && <Modal c={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}
