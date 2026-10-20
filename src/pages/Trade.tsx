import { useState, type FormEvent } from 'react';
import { ArrowLeftRight, Ban, Check, Hourglass, Lock, Send, X } from 'lucide-react';
import { COUNTRY_NAMES, useStore } from '../lib/store';
import { COUNTRIES, FULL_MEMBERS, PARTNERS } from '../data/countries';
import { Field, PageHeader, Panel } from '../components/ui';
import type { GrainCommodity, GrainSettlement, Trade, TradeKind } from '../lib/types';
import { GRAIN_TYPES, USD_SURCHARGE_PCT, fmtMT, grainLedgerLine, grainType } from '../data/grain';

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
  ...COUNTRIES.map((c) => ({ unit: c.currencyCode, qty: 1000000 })),
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
  const [to, setTo] = useState('');
  const [offerUnit, setOfferUnit] = useState(units[0].unit);
  const [offerQty, setOfferQty] = useState(units[0].qty);
  const [offerCustom, setOfferCustom] = useState('');
  const [reqUnit, setReqUnit] = useState(units[1].unit);
  const [reqQty, setReqQty] = useState(units[1].qty);
  const [reqCustom, setReqCustom] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  const fmt = (unit: string, qty: number, custom: string) => (unit === CUSTOM ? custom.trim() : `${qty.toLocaleString('en-US')} ${unit}`);
  const offer = fmt(offerUnit, offerQty, offerCustom);
  const request = fmt(reqUnit, reqQty, reqCustom);
  const valid = !!me && !!to && me !== to && offer.length > 0 && request.length > 0 && (offerUnit === CUSTOM || offerQty > 0) && (reqUnit === CUSTOM || reqQty > 0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid || !me) return;
    actions.submitTrade({ kind, from: me, to, offer, request, note: note.trim() });
    setNote('');
    setSent(true);
    setTimeout(() => setSent(false), 3500);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {me ? (
          <Field label="Proposing delegation">
            <div className="field flex items-center justify-between bg-charcoal/60 text-ivory">
              <span className="flex items-center gap-2">
                <Lock size={12} className="text-gold" />
                <span className="font-mono text-sm">{me}</span>
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-gold">Authenticated</span>
            </div>
          </Field>
        ) : (
          <div className="col-span-2 border border-gold/40 bg-gold/10 p-3 font-mono text-xs text-gold">
            Authenticate as a delegation to submit proposals.
          </div>
        )}
        <Field label="Counterparty">
          <select className="field" value={to} onChange={(e) => setTo(e.target.value)} required disabled={!me}>
            <option value="">— select —</option>
            <optgroup label="FULL BRICS MEMBERS (11)">
              {FULL_MEMBERS.filter((c) => c.name !== me).map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </optgroup>
            <optgroup label="BRICS PARTNERS (11)">
              {PARTNERS.filter((c) => c.name !== me).map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </optgroup>
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
        <Send size={13} /> Submit {kind === 'BARTER' ? 'Barter' : 'Swap'} Proposal
      </button>
      {sent && (
        <p role="status" className="flex items-center gap-2 border border-emerald/50 bg-emerald/10 px-3 py-2 font-mono text-[11px] uppercase text-emerald">
          <Check size={13} /> Proposal lodged — awaiting {to ? `${to}'s acceptance` : 'counterparty acceptance'}
        </p>
      )}
    </form>
  );
}

function TradeRow({ t }: { t: Trade }) {
  const tone =
    t.status === 'APPROVED'
      ? 'border-emerald text-emerald'
      : t.status === 'REJECTED'
      ? 'border-crimson text-crimson'
      : t.status === 'AWAITING_CHAIR'
      ? 'border-gold text-gold'
      : 'border-sage text-sage';
  const label =
    t.status === 'PENDING_COUNTERPARTY'
      ? 'PENDING COUNTERPARTY'
      : t.status === 'AWAITING_CHAIR'
      ? 'AWAITING CHAIR'
      : t.status;
  return (
    <li className="px-3 py-3">
      <div className="flex items-center gap-2">
        <span className="font-serif text-lg leading-tight">
          {t.from} <span className="text-gold">⇄</span> {t.to}
        </span>
        <span className={`ml-auto border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${tone}`}>{label}</span>
      </div>
      <p className="tabular mt-1 text-xs text-ivory/90">
        <span className="text-sage">GIVES</span> {t.offer} <span className="text-sage">FOR</span> {t.request}
      </p>
      {t.note && <p className="mt-1 text-xs text-sage">{t.note}</p>}
    </li>
  );
}

function GrainExchange({ locked }: { locked: boolean }) {
  const { state, me, actions } = useStore();
  const [commodity, setCommodity] = useState<GrainCommodity>('WHEAT');
  const [exporterSel, setExporterSel] = useState('');
  const [qty, setQty] = useState(250000);
  const [settlement, setSettlement] = useState<GrainSettlement>('BRICS_PAY');
  const [sent, setSent] = useState(false);

  const g = grainType(commodity);
  const holders = COUNTRY_NAMES.filter((c) => (state.grainStockpiles[c]?.[g.key] ?? 0) > 0 && c !== me);
  const exporter = holders.includes(exporterSel) ? exporterSel : (holders.includes(g.defaultExporter) ? g.defaultExporter : (holders[0] ?? ''));
  const buyer = me;
  const stock = state.grainStockpiles[exporter]?.[g.key] ?? 0;
  const valid = !locked && !!buyer && !!exporter && buyer !== exporter && qty > 0 && qty <= stock;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid || !buyer) return;
    actions.submitGrain({ importer: buyer, exporter, commodity, quantityMT: qty, settlement });
    setSent(true);
    setTimeout(() => setSent(false), 3500);
  };

  const holdings = COUNTRY_NAMES.filter((c) => GRAIN_TYPES.some((t) => (state.grainStockpiles[c]?.[t.key] ?? 0) > 0));

  return (
    <Panel title="BRICS Grain Exchange // Commodity Futures & Spot Desk" tone={locked ? 'crimson' : undefined}>
      {locked ? (
        <div className="grid place-items-center gap-3 py-8 text-center">
          <Lock size={24} className="text-crimson" />
          <p className="max-w-xs text-sm text-sage">Grain clearing is suspended while banking is offline. Use the barter desk instead.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {me ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Importer">
                <div className="field flex items-center justify-between bg-charcoal/60 text-ivory">
                  <span className="flex items-center gap-2">
                    <Lock size={12} className="text-gold" />
                    <span className="font-mono text-sm">{me}</span>
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-gold">Authenticated</span>
                </div>
              </Field>
              <Field label="Exporter">
                <select className="field" value={exporter} onChange={(e) => setExporterSel(e.target.value)}>
                  {holders.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
          ) : (
            <div className="border border-gold/40 bg-gold/10 p-3 font-mono text-xs text-gold">
              Authenticate as a delegation to request grain contracts.
            </div>
          )}
          <Field label="Commodity">
            <select className="field" value={commodity} onChange={(e) => setCommodity(e.target.value as GrainCommodity)}>
              {GRAIN_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Quantity (MT) — ${exporter || 'exporter'} holds ${fmtMT(stock)}`}>
            <input type="number" min={1} max={stock} className="field tabular" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <fieldset className="space-y-2">
            <legend className="label mb-1">Settlement currency</legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {(['BRICS_PAY', 'USD'] as GrainSettlement[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  role="radio"
                  aria-checked={settlement === s}
                  onClick={() => setSettlement(s)}
                  className={`border px-2 py-2 font-mono text-[11px] uppercase tracking-wider ${settlement === s ? (s === 'USD' ? 'border-crimson bg-crimson/10 text-crimson' : 'border-emerald bg-emerald/10 text-emerald') : 'border-hairline text-sage'}`}
                >
                  {s === 'USD' ? 'USD' : 'BRICS Pay / Local'}
                </button>
              ))}
            </div>
            {settlement === 'USD' ? (
              <p className="tabular text-[11px] text-crimson">High Western Clearing Surcharge (+{USD_SURCHARGE_PCT}%) Applies.</p>
            ) : (
              <p className="tabular text-[11px] text-emerald">0% clearing fee. Chair approval lifts BRICS Pay adoption.</p>
            )}
          </fieldset>
          <button className="btn btn-gold w-full" type="submit" disabled={!valid}>
            <Send size={13} /> Submit Agri-Commodity Swap Request
          </button>
          {qty > stock && <p className="tabular text-[11px] text-crimson">Quantity exceeds exporter stockpile.</p>}
          {sent && (
            <p role="status" className="flex items-center gap-2 border border-emerald/50 bg-emerald/10 px-3 py-2 font-mono text-[11px] uppercase text-emerald">
              <Check size={13} /> Request lodged — awaiting Chair approval
            </p>
          )}
        </form>
      )}
      <div className="mt-4 border-t border-hairline pt-3">
        <p className="label mb-2">Stockpile register</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-sage">
              <th className="label py-1 text-left font-normal">Holder</th>
              {GRAIN_TYPES.map((t) => (
                <th key={t.id} className="label py-1 text-right font-normal">{t.short}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map((c) => (
              <tr key={c} className="border-t border-hairline/60">
                <td className="py-1">{c}</td>
                {GRAIN_TYPES.map((t) => (
                  <td key={t.id} className="tabular py-1 text-right text-ivory">{(state.grainStockpiles[c]?.[t.key] ?? 0).toLocaleString('en-US')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export default function Trade() {
  const { state, me, actions } = useStore();
  const mode = state.committeeState.currentMode;
  const barter = mode === 'BARTER_CRISIS';
  const locked = mode === 'SWIFT_BLACKOUT';
  const kind: TradeKind = barter ? 'BARTER' : 'SWAP';
  const trades = state.trades.filter((t) => t.kind === kind).slice().reverse();
  const approved = trades.filter((t) => t.status === 'APPROVED');
  const awaitingChair = trades.filter((t) => t.status === 'AWAITING_CHAIR' || t.status === 'PENDING');
  const incomingTrades = me ? state.trades.filter((t) => t.to === me && t.status === 'PENDING_COUNTERPARTY') : [];
  const outgoingTrades = me ? state.trades.filter((t) => t.from === me && (t.status === 'PENDING_COUNTERPARTY' || t.status === 'AWAITING_CHAIR')) : [];
  const grainDone = state.grainContracts.filter((g) => g.status === 'APPROVED').slice().reverse();
  const grainOpen = state.grainContracts.filter((g) => g.status === 'PENDING').slice().reverse();

  return (
    <div className="space-y-3">
      <PageHeader kicker={barter ? 'Emergency // Physical Barter Ledger' : 'Bilateral Settlement Desk'} title={barter ? 'Barter Mode — Cows for Grapevines' : 'Trade & Barter Floor'}>
        <span className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${barter ? 'flash-border border-2 text-crimson' : 'border-emerald text-emerald'}`}>
          {barter ? 'Fiat frozen // commodity barter only' : locked ? 'Transfers suspended' : 'Money transfers open'}
        </span>
      </PageHeader>

      {barter && (
        <div className="border border-crimson bg-crimson/10 p-3 text-sm text-ivory">
          <p className="label !text-crimson">Barter protocol in effect</p>
          <p className="mt-1">
            Global banking is offline. Money transfers are locked. Propose physical commodity trades; once both delegations accept and the Chair approves, they print to the public ledger ticker for everyone.
          </p>
        </div>
      )}

      {/* Counterparty Action Area */}
      {me && incomingTrades.length > 0 && (
        <Panel title="INCOMING TRADE REQUESTS (ACTION REQUIRED)" tone="crimson" right={<span className="tabular text-[11px] text-crimson font-bold">{incomingTrades.length} pending</span>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {incomingTrades.map((t) => (
              <div key={t.id} className="border border-crimson/60 bg-charcoal/90 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg text-ivory">
                    From: <span className="text-gold font-bold">{t.from}</span>
                  </span>
                  <span className="border border-crimson px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-crimson animate-pulse">
                    Action Required
                  </span>
                </div>
                <div className="my-2 space-y-1 font-mono text-xs">
                  <p className="text-ivory"><span className="text-sage">THEY OFFER:</span> <span className="text-emerald font-bold">{t.offer}</span></p>
                  <p className="text-ivory"><span className="text-sage">THEY REQUEST FROM YOU:</span> <span className="text-gold font-bold">{t.request}</span></p>
                  {t.note && <p className="text-sage text-[11px] italic">Note: "{t.note}"</p>}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="btn btn-emerald flex-1 !py-1.5 text-xs"
                    onClick={() => actions.acceptTradeCounterparty(t.id)}
                  >
                    <Check size={13} /> Accept &amp; Send to Chair
                  </button>
                  <button
                    className="btn btn-crimson !py-1.5 text-xs"
                    onClick={() => actions.declineTradeCounterparty(t.id)}
                  >
                    <X size={13} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Outgoing proposals tracking */}
      {me && outgoingTrades.length > 0 && (
        <Panel title="Your Outgoing Trade Proposals" right={<span className="tabular text-[11px] text-sage">{outgoingTrades.length} active</span>} bodyClass="p-0">
          <ul className="divide-y divide-hairline">
            {outgoingTrades.map((t) => (
              <li key={t.id} className="p-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-serif text-base text-ivory">
                    Proposal to <span className="text-gold font-bold">{t.to}</span>
                  </p>
                  <p className="tabular mt-0.5 text-xs text-ivory/80">
                    <span className="text-sage">OFFERING:</span> {t.offer} · <span className="text-sage">REQUESTING:</span> {t.request}
                  </p>
                </div>
                <div>
                  {t.status === 'PENDING_COUNTERPARTY' ? (
                    <span className="border border-gold bg-gold/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-gold">
                      Waiting on {t.to} to accept…
                    </span>
                  ) : (
                    <span className="border border-emerald bg-emerald/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald">
                      Accepted by {t.to} — Awaiting Chair approval
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
        <div>
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

        <GrainExchange locked={locked || barter} />

        <div className="space-y-3 xl:col-span-2 2xl:col-span-1">
          <Panel
            title={barter ? 'Public Barter Ledger // Approved' : 'Public Settlement Ledger // Approved'}
            right={<span className="tabular text-[11px] text-sage">{approved.length + (barter ? 0 : grainDone.length)} entries</span>}
            bodyClass="p-0"
          >
            <ul className="divide-y divide-hairline">
              {approved.length === 0 && (barter || grainDone.length === 0) && <li className="px-3 py-4 text-sm text-sage">No approved trades yet.</li>}
              {!barter &&
                grainDone.map((g) => (
                  <li key={g.id} className="tabular px-3 py-3 text-xs text-emerald">
                    {grainLedgerLine(g)}
                  </li>
                ))}
              {approved.map((t) => (
                <TradeRow key={t.id} t={t} />
              ))}
            </ul>
          </Panel>
          <Panel
            title={<span className="flex items-center gap-2"><Hourglass size={12} /> Awaiting Chair</span>}
            right={<span className="tabular text-[11px] text-sage">{awaitingChair.length + grainOpen.length}</span>}
            bodyClass="p-0"
          >
            <ul className="divide-y divide-hairline">
              {awaitingChair.length === 0 && grainOpen.length === 0 && (
                <li className="flex items-center gap-2 px-3 py-4 text-sm text-sage">
                  <Ban size={13} /> Nothing pending.
                </li>
              )}
              {grainOpen.map((g) => (
                <li key={g.id} className="tabular px-3 py-3 text-xs text-gold">
                  GRAIN REQUEST: {g.importer} ⇄ {g.exporter} · {fmtMT(g.quantityMT)} {grainType(g.commodity).short} · {g.settlement === 'USD' ? `USD (+${g.feePct}%)` : 'BRICS Pay'}
                </li>
              ))}
              {awaitingChair.map((t) => (
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
