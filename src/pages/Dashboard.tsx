import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useFiatFrozen, useNow, useStore } from '../lib/store';
import { COUNTRIES, byCurrency } from '../data/countries';
import { fmtClock } from '../lib/timer';
import { AnimatedNumber, Panel, Sparkline } from '../components/ui';
import { GslPanel, TimerPanel } from '../components/Timer';
import FreezeBanner from '../components/FreezeBanner';

const BASELINE_USD = 58.4;
const LINE_COLORS = [
  '#D4AF37', '#10B981', '#E11D48', '#F3F4F6', '#C08457', '#7FB069', '#8E9B94', '#E8C872', '#4F8F7A', '#D97B66', '#B8B8A8',
  '#38BDF8', '#A78BFA', '#F472B6', '#FBBF24', '#34D399', '#818CF8', '#FB7185', '#2DD4BF', '#F97316', '#A3E635', '#60A5FA',
];

function MacroBar() {
  const { state } = useStore();
  const cs = state.committeeState;
  const delta = cs.usdDominanceIndex - BASELINE_USD;
  const msgs = Math.round(cs.bricsPayAdoption * 444.4);
  const sanctioned = new Set([...Object.keys(cs.sanctions || {}), ...(cs.sanctionedCountries || [])]).size;
  const modeColor = cs.currentMode === 'NORMAL' ? 'text-emerald' : 'text-crimson';

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      <Panel title="Global USD Reserve Share">
        <div className="flex items-end justify-between">
          <AnimatedNumber value={cs.usdDominanceIndex} suffix="%" className="text-5xl text-ivory" />
          <span className={`tabular text-sm ${delta < 0 ? 'text-emerald' : delta > 0 ? 'text-crimson' : 'text-sage'}`}>
            {delta === 0 ? '— 0.0' : `${delta < 0 ? '▼' : '▲'} ${Math.abs(delta).toFixed(1)}`} pp vs baseline
          </span>
        </div>
        <div className="mt-3 h-1.5 bg-charcoal">
          <div className="h-full bg-gold transition-[width] duration-700" style={{ width: `${cs.usdDominanceIndex}%` }} />
        </div>
        <p className="mt-2 text-xs text-sage">Dollar share of global central-bank reserves. Falls as BRICS agreements pass.</p>
      </Panel>

      <Panel title='"BRICS Unit" Viability Index'>
        <div className="flex items-end justify-between">
          <AnimatedNumber value={cs.bricsUnitConfidence} suffix="%" className="text-5xl text-ivory" />
          <span className="label !text-gold">{cs.goldBackingRatio}% Gold / {100 - cs.goldBackingRatio}% Basket</span>
        </div>
        <div className="mt-3 flex h-1.5 bg-charcoal">
          <div className="h-full bg-gold transition-[width] duration-700" style={{ width: `${cs.goldBackingRatio}%` }} />
          <div className="h-full bg-emerald transition-[width] duration-700" style={{ width: `${100 - cs.goldBackingRatio}%` }} />
        </div>
        <p className="mt-2 text-xs text-sage">Hypothetical settlement unit: physical gold + basket of member currencies.</p>
      </Panel>

      <Panel title="BRICS Pay / DCMS Network Load">
        <div className="flex items-end justify-between">
          <AnimatedNumber value={cs.bricsPayAdoption} decimals={1} suffix="%" className="text-5xl text-ivory" />
          <span className="tabular text-sm text-emerald">{msgs.toLocaleString('en-US')} msg/s</span>
        </div>
        <div className="mt-3 h-1.5 bg-charcoal">
          <div className="h-full bg-emerald transition-[width] duration-700" style={{ width: `${cs.bricsPayAdoption}%` }} />
        </div>
        <p className="mt-2 text-xs text-sage">Share of intra-BRICS trade bypassing Western SWIFT.</p>
      </Panel>

      <Panel title="Suez Canal Maritime Toll System">
        <div className="flex items-center gap-2">
          <span className={`led ${cs.suezTollCurrency === 'BRICS_PAY' ? 'led-gold' : 'led-amber'}`} />
          <span className={`tabular text-xs font-bold uppercase ${cs.suezTollCurrency === 'BRICS_PAY' ? 'text-gold' : 'text-ivory'}`}>
            {cs.suezTollCurrency === 'BRICS_PAY' ? 'Billed in: BRICS Pay / Local only' : 'Billed in: USD [Default]'}
          </span>
        </div>
        <p className="mt-3 font-serif text-xl leading-tight text-ivory">
          {cs.suezTollCurrency === 'BRICS_PAY' ? 'De-dollarized maritime corridor' : 'Dollar-denominated transit'}
        </p>
        <p className="mt-2 text-xs text-sage">Egypt controls the toll currency for all Canal transit dues.</p>
      </Panel>

      <Panel title="Committee Status">
        <p className={`font-serif text-4xl leading-none ${modeColor}`}>{cs.currentMode.replace('_', ' ')}</p>
        <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
          <dt className="label">Sanctioned</dt>
          <dd className={`tabular text-right ${sanctioned ? 'text-crimson' : 'text-ivory'}`}>{sanctioned}</dd>
          <dt className="label">Motions pending</dt>
          <dd className="tabular text-right text-ivory">{state.motions.filter((m) => m.status === 'PENDING').length}</dd>
          <dt className="label">GSL queue</dt>
          <dd className="tabular text-right text-ivory">{cs.gslQueue.length}</dd>
        </dl>
      </Panel>
    </div>
  );
}

function ExchangeMatrix({ selected, toggle }: { selected: string[]; toggle: (c: string) => void }) {
  const { state } = useStore();
  const frozen = useFiatFrozen();
  const cs = state.committeeState;
  const [tierFilter, setTierFilter] = useState<'MEMBERS' | 'ALL' | 'PARTNERS'>('MEMBERS');

  const filteredEntries = Object.entries(state.currencies).filter(([code]) => {
    if (tierFilter === 'ALL') return true;
    const country = byCurrency(code);
    if (!country) return tierFilter === 'MEMBERS';
    if (tierFilter === 'MEMBERS') return country.tier === 'FULL BRICS MEMBER';
    return country.tier === 'BRICS PARTNER';
  });

  return (
    <Panel
      title="Currency War Matrix // 1 USD ="
      right={
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-hairline bg-charcoal p-0.5 text-[10px] font-mono">
            <button
              onClick={() => setTierFilter('MEMBERS')}
              className={`px-2 py-0.5 uppercase tracking-wider transition-colors ${tierFilter === 'MEMBERS' ? 'bg-gold text-obsidian font-bold' : 'text-sage hover:text-ivory'}`}
            >
              Full (11)
            </button>
            <button
              onClick={() => setTierFilter('PARTNERS')}
              className={`px-2 py-0.5 uppercase tracking-wider transition-colors ${tierFilter === 'PARTNERS' ? 'bg-emerald text-obsidian font-bold' : 'text-sage hover:text-ivory'}`}
            >
              Partners (11)
            </button>
            <button
              onClick={() => setTierFilter('ALL')}
              className={`px-2 py-0.5 uppercase tracking-wider transition-colors ${tierFilter === 'ALL' ? 'bg-ivory text-obsidian font-bold' : 'text-sage hover:text-ivory'}`}
            >
              All (22)
            </button>
          </div>
          <span className="label">{frozen ? 'Feed suspended' : 'Live'}</span>
        </div>
      }
      bodyClass="p-0 overflow-x-auto"
    >
      <table className="w-full min-w-[520px] text-left">
        <thead>
          <tr className="border-b border-hairline">
            {['Chart', 'Currency', 'Rate', '24h', 'Trend'].map((h, i) => (
              <th key={h} className={`label px-3 py-2 font-normal ${i >= 2 ? 'text-right' : ''} ${i === 0 ? 'w-14' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredEntries.map(([code, cur]) => {
            const country = byCurrency(code);
            const sanction = country ? (cs.sanctions[country.name] || cs.sanctionedCountries?.includes(country.name)) : undefined;
            const pressure = cs.pressure[code];
            const up = cur.change24h >= 0;
            const color = up ? '#10B981' : '#E11D48';
            const idx = Object.keys(state.currencies).indexOf(code);
            const on = selected.includes(code);
            return (
              <tr key={code} className="border-b border-hairline/60 last:border-0 hover:bg-charcoal/60">
                <td className="px-3 py-2">
                  <button
                    onClick={() => toggle(code)}
                    aria-pressed={on}
                    aria-label={`Toggle ${code} on chart`}
                    className="h-3.5 w-3.5 border"
                    style={{ borderColor: LINE_COLORS[idx % LINE_COLORS.length], background: on ? LINE_COLORS[idx % LINE_COLORS.length] : 'transparent' }}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tabular text-sm font-bold text-ivory">{code}</span>
                    <span className="text-xs text-sage">{cur.name}</span>
                    {country && (
                      <span
                        className={`border px-1 py-0.2 font-mono text-[9px] uppercase ${
                          country.tier === 'FULL BRICS MEMBER'
                            ? 'border-gold/60 text-gold bg-gold/10'
                            : 'border-emerald/60 text-emerald bg-emerald/10'
                        }`}
                      >
                        {country.tier === 'FULL BRICS MEMBER' ? 'Full' : 'Partner'}
                      </span>
                    )}
                    {sanction && <span className="stamp">Sanctioned // SWIFT cutoff</span>}
                    {country && cs.assetFreeze?.country === country.name && <span className="stamp">Assets frozen // Clearing suspended</span>}
                    {pressure && !frozen && <span className="tabular border border-gold px-1 text-[9px] uppercase text-gold">{pressure}</span>}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  {frozen ? <span className="tabular glitch text-sm font-bold">ERR_FIAT_NULL</span> : <AnimatedNumber value={cur.rateToUSD} decimals={cur.rateToUSD >= 10 ? 2 : 3} className="text-sm text-ivory" />}
                </td>
                <td className={`tabular px-3 py-2 text-right text-sm ${frozen || cur.change24h === 0 ? 'text-sage' : up ? 'text-emerald' : 'text-crimson'}`}>
                  {frozen ? '— —' : cur.change24h === 0 ? '— 0.00%' : `${up ? '▲' : '▼'} ${Math.abs(cur.change24h).toFixed(2)}%`}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end">{frozen ? <span className="tabular text-xs text-crimson">NO DATA</span> : <Sparkline data={cur.history} color={color} />}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-hairline px-3 py-2 text-[11px] text-sage">
        Rate = local units per 1 USD. Green = local currency appreciating. DZD = 134.50. IDR, UZS, VND, UGX shown as ×1000; NGN as ×100.
      </p>
    </Panel>
  );
}

function CompareChart({ selected }: { selected: string[] }) {
  const { state } = useStore();
  const frozen = useFiatFrozen();
  const codes = Object.keys(state.currencies);

  const data = useMemo(() => {
    const maxLen = Math.max(...codes.map((c) => state.currencies[c].history.length));
    const rows: Record<string, number | string>[] = [];
    for (let i = 0; i < maxLen; i++) {
      const row: Record<string, number | string> = { t: i === maxLen - 1 ? 'NOW' : `T-${maxLen - 1 - i}` };
      for (const c of codes) {
        const h = state.currencies[c].history;
        const j = i - (maxLen - h.length);
        if (j >= 0) row[c] = Math.round((h[0] / h[j]) * 10000) / 100; // value index: higher = stronger vs USD
      }
      rows.push(row);
    }
    return rows;
  }, [state.currencies, codes]);

  return (
    <Panel title="Comparative Value Index // vs USD (start = 100)" right={<span className="label">Higher = stronger</span>}>
      {frozen ? (
        <div className="grid h-64 place-items-center">
          <p className="tabular glitch text-xl font-bold">CHART FEED OFFLINE // ERR_FIAT_NULL</p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#26302B" strokeDasharray="2 4" />
              <XAxis dataKey="t" stroke="#8E9B94" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} />
              <YAxis stroke="#8E9B94" domain={['auto', 'auto']} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{ background: '#111614', border: '1px solid #26302B', borderRadius: 2, fontFamily: 'JetBrains Mono', fontSize: 11 }}
                labelStyle={{ color: '#8E9B94' }}
              />
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10 }} />
              {selected.length === 0 && <Area dataKey="__none" stroke="none" fill="none" />}
              {codes
                .filter((c) => selected.includes(c))
                .map((c) => (
                  <Line key={c} type="monotone" dataKey={c} stroke={LINE_COLORS[codes.indexOf(c) % LINE_COLORS.length]} strokeWidth={1.75} dot={false} isAnimationActive animationDuration={600} connectNulls />
                ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      {selected.length === 0 && !frozen && <p className="text-xs text-sage">Toggle currencies in the matrix to plot them.</p>}
    </Panel>
  );
}

function Roster() {
  const { state } = useStore();
  const tick = useNow(500);
  const cs = state.committeeState;
  const [filter, setFilter] = useState<'ALL' | 'MEMBERS' | 'PARTNERS'>('ALL');

  const filtered = COUNTRIES.filter((c) => {
    if (filter === 'ALL') return true;
    if (filter === 'MEMBERS') return c.tier === 'FULL BRICS MEMBER';
    return c.tier === 'BRICS PARTNER';
  });

  return (
    <Panel
      title={`Delegation Roster // ${filter === 'ALL' ? '22 Delegations' : filter === 'MEMBERS' ? '11 Full Members' : '11 Partners'}`}
      right={
        <div className="flex items-center border border-hairline bg-charcoal p-0.5 text-[10px] font-mono">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2 py-0.5 uppercase tracking-wider transition-colors ${filter === 'ALL' ? 'bg-ivory text-obsidian font-bold' : 'text-sage hover:text-ivory'}`}
          >
            All (22)
          </button>
          <button
            onClick={() => setFilter('MEMBERS')}
            className={`px-2 py-0.5 uppercase tracking-wider transition-colors ${filter === 'MEMBERS' ? 'bg-gold text-obsidian font-bold' : 'text-sage hover:text-ivory'}`}
          >
            Full (11)
          </button>
          <button
            onClick={() => setFilter('PARTNERS')}
            className={`px-2 py-0.5 uppercase tracking-wider transition-colors ${filter === 'PARTNERS' ? 'bg-emerald text-obsidian font-bold' : 'text-sage hover:text-ivory'}`}
          >
            Partners (11)
          </button>
        </div>
      }
      bodyClass="p-0"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 [&>*]:border-b [&>*]:border-r [&>*]:border-hairline">
        {filtered.map((c) => {
          const s = cs.sanctions[c.name];
          const isSanctioned = !!s || !!cs.sanctionedCountries?.includes(c.name);
          const speaking = cs.timer.currentSpeaker === c.name && cs.timer.type !== 'UNMOD';
          const left = s ? Math.max(0, s.until - tick) / 1000 : 0;
          const isFull = c.tier === 'FULL BRICS MEMBER';
          return (
            <Link
              key={c.name}
              to="/dossiers"
              className={`relative block p-3 transition-colors hover:bg-charcoal ${isSanctioned ? 'bg-crimson/15 border border-crimson/40' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="tabular text-[11px] text-sage">{c.code}</span>
                <span
                  className={`border px-1 py-0.2 font-mono text-[9px] uppercase tracking-wider ${
                    isFull ? 'border-gold/60 text-gold bg-gold/10' : 'border-emerald/60 text-emerald bg-emerald/10'
                  }`}
                >
                  {isFull ? 'Full Member' : 'Partner'}
                </span>
              </div>
              <p className="mt-1 font-serif text-lg leading-tight">{c.short}</p>
              <div className="mt-2 min-h-[22px]">
                {isSanctioned ? (
                  <>
                    <span className="stamp">Sanctioned // SWIFT cutoff</span>
                    {s && <p className="tabular mt-1 text-[10px] text-crimson">{left > 0 ? `BAIL-OUT WINDOW ${fmtClock(left)}` : 'BAIL-OUT WINDOW CLOSED'}</p>}
                  </>
                ) : cs.assetFreeze?.country === c.name ? (
                  <span className="stamp">Assets frozen // Clearing suspended</span>
                ) : speaking ? (
                  <span className="label !text-gold">● On the floor</span>
                ) : (
                  <span className="label">Active</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

export default function Dashboard() {
  const { state } = useStore();
  const cs = state.committeeState;
  const isBarterCrisis = cs.currentMode === 'BARTER_CRISIS';
  const [selected, setSelected] = useState<string[]>(['BRL', 'CNY', 'INR', 'RUB']);
  const toggle = (code: string) => setSelected((s) => (s.includes(code) ? s.filter((x) => x !== code) : [...s, code]));

  return (
    <div className={`space-y-3 transition-all duration-500 ${isBarterCrisis ? 'p-3 md:p-5 border-2 border-crimson flash-border bg-crimson/[0.08] shadow-[0_0_80px_rgba(225,29,72,0.35)]' : ''}`}>
      {isBarterCrisis && (
        <div className="flash-border border-2 border-crimson bg-crimson/20 p-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="h-3 w-3 rounded-full bg-crimson animate-ping" />
            <span className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-widest text-crimson">
              CRITICAL EMERGENCY // SOVEREIGN COMMODITY BARTER PROTOCOL ACTIVE
            </span>
            <span className="h-3 w-3 rounded-full bg-crimson animate-ping" />
          </div>
          <p className="mt-1 font-mono text-xs text-gold uppercase tracking-wider">
            GLOBAL BANKING OFFLINE // FIAT TRANSFERS FROZEN // DELEGATES MUST USE PHYSICAL BARTER DESK
          </p>
        </div>
      )}
      <FreezeBanner />
      <MacroBar />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="space-y-3 xl:col-span-7 2xl:col-span-8">
          <ExchangeMatrix selected={selected} toggle={toggle} />
          <CompareChart selected={selected} />
        </div>
        <div className="space-y-3 xl:col-span-5 2xl:col-span-4">
          <TimerPanel />
          <GslPanel />
        </div>
      </div>
      <Roster />
    </div>
  );
}
