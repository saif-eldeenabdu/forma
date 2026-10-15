import { useState, type FormEvent } from 'react';
import { ArrowLeftRight, Ban, Check, Hourglass, Lock, Send, X } from 'lucide-react';
import { COUNTRY_NAMES, useStore } from '../lib/store';
import { Field, PageHeader, Panel } from '../components/ui';
import type { Trade, TradeKind } from '../lib/types';

const BARTER_PRESETS: { unit: string; qty: number }[] = [
  { unit: 'Barrels of Urals Crude Oil', qty: 300000 },
  { unit: 'Metric Tons of Mato Grosso Soybeans', qty: 50000 },
  { unit: 'Live Cattle', qty: 400 },
  { unit: 'Heritage Grapevines', qty: 1200 },
  { unit: 'Tons of Refined Gold Bullion', qty: 10 },
  { unit: 'Lithium Battery Cells', qty: 50000 },
];
const CUSTOM = '__custom__';

const SWAP_UNITS: { unit: string; qty: number }[] = [
  ...['BRL', 'RUB', 'INR', 'CNY', 'ZAR', 'EGP', 'ETB', 'IRR', 'SAR', 'AED', 'IDR'].map((c) => ({ unit: c, qty: 1000000 })),
  { unit: 'Metric Tons of Crude Oil', qty: 100000 },
  { unit: 'Troy Oz of Gold', qty: 50000 },
  { unit: 'Metric Tons of Wheat', qty: 200000 },
  { unit: 'MWh of Electricity', qty: 500000 },
];

function Side({
  label,
  units,
  unit,
  setUnit,
  qty,
  setQty,
  custom,
  setCustom,
  allowCustom,
}: {
  label: string;
  units: { unit: string; qty: number }[];
  unit: string;
  setUnit: (u: string) => void;
  qty: number;
  setQty: (n: number) => void;
  custom: string;
  setCustom: (s: string) => void;
  allowCustom: boolean;
}) {
  return (
    <fieldset className="space-y-2 border border-hairline bg-charcoal/50 p-3">
      <legend className="label px-1 !text-gold">{label}</legend>
      <div className="grid grid-cols-[110px_1fr] gap-2">
        {unit !== CUSTOM && (
          <input type="number" min={1} className="field tabular" value={qty} onChange={(e) => setQty(Number(e.target.value))} aria-label={`${label} quantity`} />
        )}
        <select
          className={`field ${unit === CUSTOM ? 'col-span-2' : ''}`}
          value={unit}
          onChange={(e) => {
            const u = e.target.value;
            setUnit(u);
            const p = units.find((x) => x.unit === u);
            if (p) setQty(p.qty);
          }}
          aria-label={`${label} unit`}
        >
          {units.map((u) => (
            <option key={u.unit} value={u.unit}>
              {u.unit}
            </option>
          ))}
          {allowCustom && <option value={CUSTOM}>Custom commodity…</option>}
        </select>
      </div>
      {unit === CUSTOM && <input className="field" placeholder='e.g. "2,000 Tons of Arabica Coffee"' value={custom} onChange={(e) => setCustom(e.target.value)} />}
    </fieldset>
  );
}

function TradeForm({ kind }: { kind: TradeKind }) {
  const { me, actions } = useStore();
  const units = kind === 'BARTER' ? BARTER_PRESETS : SWAP_UNITS;
  const [from, setFrom] = useState(me);
  const [to, setTo] = useState('');
  const [offerUnit, setOfferUnit] = useState(units[0].unit);
  const [offerQty, setOfferQty] = useState(units[0].qty);
  const [offerCustom, setOfferCustom] = useState('');
  const [reqUnit, setReqUnit] = useState(units[1].unit);
  const [reqQty, setReqQty] = useState(units[1].qty);
  const [reqCustom, setReqCustom] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const sender = from || me;

  const fmt = (unit: string, qty: number, custom: string) => (unit === CUSTOM ? custom.trim() : `${qty.toLocaleString('en-US')} ${unit}`);
  const offer = fmt(offerUnit, offerQty, offerCustom);
  const request = fmt(reqUnit, reqQty, reqCustom);
  const valid = !!sender && !!to && sender !== to && offer.length > 0 && request.length > 0 && (offerUnit === CUSTOM || offerQty > 0) && (reqUnit === CUSTOM || reqQty > 0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    actions.submitTrade({ kind, from: sender, to, offer, request, note: note.trim() });
    setNote('');
    setSent(true);
    setTimeout(() => setSent(false), 3500);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Proposing delegation">
          <select className="field" value={sender} onChange={(e) => setFrom(e.target.value)}>
            <option value="">— select —</option>
            {COUNTRY_NAMES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Counterparty">
          <select className="field" value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">— select —</option>
            {COUNTRY_NAMES.filter((c) => c !== sender).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>
      <Side label="You offer" units={units} unit={offerUnit} setUnit={setOfferUnit} qty={offerQty} setQty={setOfferQty} custom={offerCustom} setCustom={setOfferCustom} allowCustom={kind === 'BARTER'} />
      <div className="flex justify-center text-gold">
        <ArrowLeftRight size={16} />
      </div>
      <Side label="You request" units={units} unit={reqUnit} setUnit={setReqUnit} qty={reqQty} setQty={setReqQty} custom={reqCustom} setCustom={setReqCustom} allowCustom={kind === 'BARTER'} />
      <Field label="Terms / note (optional)">
        <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Delivery terms, port of exchange, etc." />
      </Field>
      <button className="btn btn-gold w-full" disabled={!valid} type="submit">
        <Send size={13} /> Submit {kind === 'BARTER' ? 'Barter' : 'Swap'} Proposal to Chair
      </button>
      {sent && (
        <p role="status" className="flex items-center gap-2 border border-emerald/50 bg-emerald/10 px-3 py-2 font-mono text-[11px] uppercase text-emerald">
          <Check size={13} /> Proposal lodged — awaiting Chair approval
        </p>
      )}
    </form>
  );
}

function TradeRow({ t }: { t: Trade }) {
  const tone = t.status === 'APPROVED' ? 'border-emerald text-emerald' : t.status === 'REJECTED' ? 'border-crimson text-crimson' : 'border-gold text-gold';
  return (
    <li className="px-3 py-3">
      <div className="flex items-center gap-2">
        <span className="font-serif text-lg leading-tight">
          {t.from} <span className="text-gold">⇄</span> {t.to}
        </span>
        <span className={`ml-auto border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${tone}`}>{t.status}</span>
      </div>
      <p className="tabular mt-1 text-xs text-ivory/90">
        <span className="text-sage">GIVES</span> {t.offer} <span className="text-sage">FOR</span> {t.request}
      </p>
      {t.note && <p className="mt-1 text-xs text-sage">{t.note}</p>}
    </li>
  );
}

export default function Trade() {
  const { state } = useStore();
  const mode = state.committeeState.currentMode;
  const barter = mode === 'BARTER_CRISIS';
  const locked = mode === 'SWIFT_BLACKOUT';
  const kind: TradeKind = barter ? 'BARTER' : 'SWAP';
  const trades = state.trades.filter((t) => t.kind === kind).slice().reverse();
  const approved = trades.filter((t) => t.status === 'APPROVED');
  const open = trades.filter((t) => t.status === 'PENDING');

  return (
    <div>
      <PageHeader kicker={barter ? 'Emergency // Physical Barter Ledger' : 'Bilateral Settlement Desk'} title={barter ? 'Barter Mode — Cows for Grapevines' : 'Trade & Barter Floor'}>
        <span className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${barter ? 'flash-border border-2 text-crimson' : 'border-emerald text-emerald'}`}>
          {barter ? 'Fiat frozen // commodity barter only' : locked ? 'Transfers suspended' : 'Money transfers open'}
        </span>
      </PageHeader>

      {barter && (
        <div className="mb-3 border border-crimson bg-crimson/10 p-3 text-sm text-ivory">
          <p className="label !text-crimson">Barter protocol in effect</p>
          <p className="mt-1">
            Global banking is offline. Money transfers are locked. Propose physical commodity trades; once the Chair approves, they print to the public ledger ticker for everyone.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        <div className="xl:col-span-2">
          {locked ? (
            <Panel title="Money Transfers" tone="crimson">
              <div className="grid place-items-center gap-3 py-10 text-center">
                <Lock size={28} className="text-crimson" />
                <p className="font-serif text-2xl text-crimson">SWIFT BLACKOUT</p>
                <p className="max-w-xs text-sm text-sage">Bilateral currency swaps are locked until the Chair restores messaging.</p>
              </div>
            </Panel>
          ) : (
            <Panel title={barter ? 'Propose Commodity Barter' : 'Propose Bilateral Swap'}>
              <TradeForm kind={kind} key={kind} />
            </Panel>
          )}
        </div>

        <div className="space-y-3 xl:col-span-3">
          <Panel
            title={barter ? 'Public Barter Ledger // Approved' : 'Public Settlement Ledger // Approved'}
            right={<span className="tabular text-[11px] text-sage">{approved.length} entries</span>}
            bodyClass="p-0"
          >
            <ul className="divide-y divide-hairline">
              {approved.length === 0 && <li className="px-3 py-4 text-sm text-sage">No approved trades yet.</li>}
              {approved.map((t) => (
                <TradeRow key={t.id} t={t} />
              ))}
            </ul>
          </Panel>
          <Panel
            title={<span className="flex items-center gap-2"><Hourglass size={12} /> Awaiting Chair</span>}
            right={<span className="tabular text-[11px] text-sage">{open.length}</span>}
            bodyClass="p-0"
          >
            <ul className="divide-y divide-hairline">
              {open.length === 0 && (
                <li className="flex items-center gap-2 px-3 py-4 text-sm text-sage">
                  <Ban size={13} /> Nothing pending.
                </li>
              )}
              {open.map((t) => (
                <TradeRow key={t.id} t={t} />
              ))}
            </ul>
          </Panel>
          {trades.some((t) => t.status === 'REJECTED') && (
            <p className="flex items-center gap-2 text-xs text-sage">
              <X size={12} className="text-crimson" /> {trades.filter((t) => t.status === 'REJECTED').length} rejected proposal(s) hidden.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
