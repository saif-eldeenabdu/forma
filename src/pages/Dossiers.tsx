import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
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
            <p className="label !text-gold">Delegation dossier // {c.code} // {c.currencyCode} — {c.currencyName}</p>
            <h2 className="mt-1 text-4xl font-medium leading-none">{c.name}</h2>
            {sanctioned && <span className="stamp mt-3">Sanctioned // SWIFT cutoff</span>}
          </div>
          <button onClick={onClose} className="text-sage hover:text-ivory" aria-label="Close dossier">
            <X size={18} />
          </button>
        </header>
        <div className="space-y-5 p-5">
          <section>
            <p className="label">Role</p>
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
            <p className="label">Stance on BRICS currency</p>
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
  return (
    <div>
      <PageHeader kicker="Delegations // 2026 Framework" title="Country Dossiers">
        <p className="label max-w-sm text-right">11 full members. Select a card for stats, stance and research prompts.</p>
      </PageHeader>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {COUNTRIES.map((c) => {
          const sanctioned = !!state.committeeState.sanctions[c.name];
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
                <span className="tabular border border-gold/50 px-1.5 text-[11px] text-gold">{c.currencyCode}</span>
              </div>
              <h2 className="mt-3 text-2xl font-medium leading-tight">{c.name}</h2>
              {me === c.name && <p className="label mt-1 !text-emerald">Your delegation</p>}
              <p className="mt-2 line-clamp-2 text-xs text-sage">{c.role}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-hairline pt-3">
                <div>
                  <dt className="label">GDP</dt>
                  <dd className="tabular text-xs">{c.gdp}</dd>
                </div>
                <div>
                  <dt className="label">Gold</dt>
                  <dd className="tabular text-xs">{c.gold.split(' (')[0]}</dd>
                </div>
              </dl>
              {sanctioned && <span className="stamp mt-3">Sanctioned // SWIFT cutoff</span>}
              <p className="label mt-3 text-sage group-hover:!text-gold">Open dossier →</p>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-sage">Simulation framework — figures approximate and curated for committee use.</p>
      <AnimatePresence>{open && <Modal c={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}
