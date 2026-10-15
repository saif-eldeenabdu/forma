import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { BRIEFING, ROP } from '../data/briefing';
import { PageHeader, Panel } from '../components/ui';

function Guide() {
  const [tab, setTab] = useState(BRIEFING[0].id);
  const mod = BRIEFING.find((b) => b.id === tab)!;
  return (
    <div>
      <div role="tablist" className="mb-3 flex flex-wrap gap-px border border-hairline bg-hairline">
        {BRIEFING.map((b) => (
          <button
            key={b.id}
            role="tab"
            aria-selected={tab === b.id}
            onClick={() => setTab(b.id)}
            className={`relative flex-1 bg-charcoal px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.14em] ${tab === b.id ? 'text-gold' : 'text-sage hover:text-ivory'}`}
          >
            {b.tab}
            {tab === b.id && <motion.span layoutId="brief-tab" className="absolute inset-x-0 bottom-0 h-px bg-gold" />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={mod.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <Panel bodyClass="p-5 md:p-8">
            <h2 className="max-w-3xl text-3xl font-medium leading-tight md:text-4xl">{mod.title}</h2>
            <div className="mt-6 grid gap-px border border-hairline bg-hairline lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
              {mod.blocks.map((b, i) => (
                <div key={i} className="bg-basalt p-5">
                  {b.label && <p className="label !text-gold">{b.label}</p>}
                  {b.heading && <h3 className="mt-2 text-xl font-medium leading-snug">{b.heading}</h3>}
                  <p className="mt-3 leading-relaxed text-ivory/85">{b.body}</p>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Rop() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const cats = useMemo(() => ['All', ...Array.from(new Set(ROP.map((r) => r.category)))], []);
  const list = ROP.filter((r) => {
    const hay = `${r.term} ${r.summary} ${r.detail.join(' ')} ${r.category}`.toLowerCase();
    return (cat === 'All' || r.category === cat) && hay.includes(q.trim().toLowerCase());
  });
  return (
    <Panel title="Rules of Procedure // Delegate Cheat Sheet" bodyClass="p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-hairline p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage" />
          <input className="field !pl-8" placeholder="Search: yield, mod, point of order…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search rules" />
        </div>
        <div className="flex flex-wrap gap-1">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`btn !px-2 !py-1.5 ${cat === c ? '!border-gold !text-gold' : ''}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-hairline">
        {list.length === 0 && <li className="p-4 text-sm text-sage">No matching rules.</li>}
        {list.map((r) => (
          <li key={r.id} className="grid gap-2 p-4 md:grid-cols-[240px_1fr]">
            <div>
              <p className="label !text-gold">{r.category}</p>
              <h3 className="mt-1 text-xl font-medium leading-tight">{r.term}</h3>
            </div>
            <div>
              <p className="text-ivory">{r.summary}</p>
              <ul className="mt-2 space-y-1">
                {r.detail.map((d, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ivory/75">
                    <span className="text-gold">—</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default function Briefing() {
  const [view, setView] = useState<'guide' | 'rop'>('guide');
  return (
    <div>
      <PageHeader kicker="FORMA // Briefing" title="Explain Like I'm 5, Debate Like a Central Banker">
        <div className="flex gap-px border border-hairline bg-hairline">
          {(
            [
              ['guide', 'Topic Guide'],
              ['rop', 'Rules of Procedure'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] ${view === k ? 'bg-gold text-obsidian' : 'bg-charcoal text-sage hover:text-ivory'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </PageHeader>
      {view === 'guide' ? <Guide /> : <Rop />}
    </div>
  );
}
