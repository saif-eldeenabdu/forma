import { useState, type FormEvent } from 'react';
import { Check, EyeOff, Send, UserPlus } from 'lucide-react';
import { COUNTRY_NAMES, useStore } from '../lib/store';
import { MOTION_ORDER, sortMotions } from '../lib/motions';
import type { MotionType, SuezCurrency } from '../lib/types';
import { Field, PageHeader, Panel, fmtSecondsLabel } from '../components/ui';
import { motionLine } from '../components/Overlays';
import FreezeBanner from '../components/FreezeBanner';

function useFlash() {
  const [msg, setMsg] = useState('');
  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3500);
  };
  return { msg, flash };
}

function Confirm({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p role="status" className="mt-3 flex items-center gap-2 border border-emerald/50 bg-emerald/10 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-emerald">
      <Check size={13} /> {msg}
    </p>
  );
}

function MotionForm() {
  const { me, actions } = useStore();
  const { msg, flash } = useFlash();
  const [delegation, setDelegation] = useState(me);
  const [type, setType] = useState<MotionType>('Moderated Caucus');
  const [mins, setMins] = useState(10);
  const [speaker, setSpeaker] = useState(45);
  const [topic, setTopic] = useState('');

  const effectiveDelegation = delegation || me;
  const needsTotal = type === 'Moderated Caucus' || type === 'Unmoderated Caucus';
  const needsSpeaker = type === 'Moderated Caucus' || type === 'Set Speaking Time';
  const valid = !!effectiveDelegation && (!needsTotal || mins > 0) && (!needsSpeaker || speaker > 0) && topic.trim().length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    actions.submitMotion({
      delegation: effectiveDelegation,
      type,
      totalSeconds: needsTotal ? mins * 60 : 0,
      speakerSeconds: needsSpeaker ? speaker : 0,
      topic: topic.trim(),
    });
    setTopic('');
    flash('Motion submitted to the Chair');
  };

  return (
    <Panel title="Submit a Motion">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Delegation">
          <select className="field" value={effectiveDelegation} onChange={(e) => setDelegation(e.target.value)} required>
            <option value="">— select delegation —</option>
            {COUNTRY_NAMES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Motion type">
          <select className="field" value={type} onChange={(e) => setType(e.target.value as MotionType)}>
            {MOTION_ORDER.slice()
              .reverse()
              .map((t) => (
                <option key={t}>{t}</option>
              ))}
          </select>
        </Field>
        {(needsTotal || needsSpeaker) && (
          <div className="grid grid-cols-2 gap-3">
            {needsTotal && (
              <Field label="Total duration (min)">
                <input type="number" min={1} max={60} className="field tabular" value={mins} onChange={(e) => setMins(Number(e.target.value))} />
              </Field>
            )}
            {needsSpeaker && (
              <Field label="Speaker time (sec)">
                <input type="number" min={10} max={300} step={5} className="field tabular" value={speaker} onChange={(e) => setSpeaker(Number(e.target.value))} />
              </Field>
            )}
          </div>
        )}
        <Field label="Topic / purpose">
          <textarea className="field min-h-[84px] resize-y" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Gold-Backed Settlement Mechanisms" required />
        </Field>
        <button className="btn btn-gold w-full" type="submit" disabled={!valid}>
          <Send size={13} /> Submit Motion
        </button>
        <Confirm msg={msg} />
      </form>
    </Panel>
  );
}

function MotionLedger() {
  const { state } = useStore();
  const pending = sortMotions(state.motions.filter((m) => m.status === 'PENDING' || m.status === 'PROJECTED'));
  const done = state.motions.filter((m) => m.status === 'PASSED' || m.status === 'FAILED').slice(-6).reverse();
  const badge = (s: string) =>
    s === 'PASSED' ? 'border-emerald text-emerald' : s === 'FAILED' ? 'border-crimson text-crimson' : s === 'PROJECTED' ? 'border-gold text-gold' : 'border-sage text-sage';
  return (
    <Panel title="Motions Queue // Most → Least Disruptive" bodyClass="p-0">
      <ul className="divide-y divide-hairline">
        {pending.length === 0 && <li className="px-3 py-4 text-sm text-sage">No motions on the table.</li>}
        {pending.map((m, i) => (
          <li key={m.id} className="px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="tabular w-5 text-[11px] text-sage">{i + 1}</span>
              <span className="font-serif text-lg leading-tight">{motionLine(m)}</span>
              <span className={`ml-auto border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${badge(m.status)}`}>{m.status}</span>
            </div>
            <p className="ml-7 text-sm text-ivory/80">{m.topic}</p>
            <p className="ml-7 tabular text-[11px] text-sage">Moved by {m.delegation}</p>
          </li>
        ))}
      </ul>
      {done.length > 0 && (
        <div className="border-t border-hairline">
          <p className="label px-3 pt-2">Recently decided</p>
          <ul className="divide-y divide-hairline/60">
            {done.map((m) => (
              <li key={m.id} className="flex items-center gap-2 px-3 py-1.5 text-xs text-sage">
                <span className={`border px-1 font-mono text-[9px] uppercase ${badge(m.status)}`}>{m.status}</span>
                <span className="truncate">{m.type}{m.totalSeconds ? ` · ${fmtSecondsLabel(m.totalSeconds)}` : ''} — {m.delegation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function GslRequest() {
  const { state, me, actions } = useStore();
  const { msg, flash } = useFlash();
  const [who, setWho] = useState(me);
  const country = who || me;
  const cs = state.committeeState;
  const queued = cs.gslQueue.includes(country);
  const pending = cs.gslRequests.some((r) => r.country === country);
  return (
    <Panel title="Request to be Added to the GSL">
      <div className="space-y-3">
        <Field label="Delegation">
          <select className="field" value={country} onChange={(e) => setWho(e.target.value)}>
            <option value="">— select delegation —</option>
            {COUNTRY_NAMES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <button
          className="btn w-full"
          disabled={!country || queued || pending}
          onClick={() => {
            actions.requestGsl(country);
            flash('Request sent to the Chair');
          }}
        >
          <UserPlus size={13} /> {queued ? 'Already on the list' : pending ? 'Request pending' : 'One-click request'}
        </button>
        <Confirm msg={msg} />
      </div>
    </Panel>
  );
}

function DirectiveForm() {
  const { me, actions } = useStore();
  const { msg, flash } = useFlash();
  const [from, setFrom] = useState(me);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const sender = from || me;
  const valid = !!sender && subject.trim() && body.trim();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    actions.submitDirective({ from: sender, subject: subject.trim(), body: body.trim() });
    setSubject('');
    setBody('');
    flash('Directive delivered to the Chair');
  };
  return (
    <Panel title={<span className="flex items-center gap-2"><EyeOff size={12} /> Covert Financial Directive</span>}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-sage">Private channel to the Chair. Describe the covert financial move your delegation is attempting.</p>
        <Field label="From">
          <select className="field" value={sender} onChange={(e) => setFrom(e.target.value)}>
            <option value="">— select delegation —</option>
            {COUNTRY_NAMES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Subject">
          <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Quiet gold purchase via Dubai vaults" />
        </Field>
        <Field label="Directive">
          <textarea className="field min-h-[84px] resize-y" value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <button className="btn btn-gold w-full" type="submit" disabled={!valid}>
          <Send size={13} /> Send to Chair
        </button>
        <Confirm msg={msg} />
      </form>
    </Panel>
  );
}

function SuezDecree() {
  const { state, me, actions } = useStore();
  const { msg, flash } = useFlash();
  const current = state.committeeState.suezTollCurrency;
  const [choice, setChoice] = useState<SuezCurrency>(current === 'USD' ? 'BRICS_PAY' : 'USD');
  const pending = state.directives.some((d) => d.action?.type === 'SUEZ_TOLL' && d.status === 'PENDING');
  if (me !== 'Egypt') return null;
  const noChange = choice === current;
  return (
    <Panel title="Presidential Decree: Suez Canal Toll Overhaul" tone="gold">
      <div className="space-y-3">
        <p className="text-xs text-sage">
          Exclusive to the Arab Republic of Egypt. Current billing currency:{' '}
          <span className="tabular text-ivory">{current === 'USD' ? 'USD' : 'BRICS PAY / LOCAL'}</span>
        </p>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Suez toll currency">
          {(['USD', 'BRICS_PAY'] as SuezCurrency[]).map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={choice === c}
              onClick={() => setChoice(c)}
              className={`border px-2 py-2 font-mono text-[11px] uppercase tracking-wider ${choice === c ? 'border-gold bg-gold/10 text-gold' : 'border-hairline text-sage'}`}
            >
              {c === 'USD' ? 'Bill in USD' : 'BRICS Pay / EGP'}
            </button>
          ))}
        </div>
        <button
          className="btn btn-gold w-full"
          disabled={noChange || pending}
          onClick={() => {
            actions.submitSuezDirective(choice);
            flash('Sovereign toll directive sent to the Chair');
          }}
        >
          <Send size={13} /> {pending ? 'Directive awaiting Chair' : 'Submit sovereign toll directive to Chair'}
        </button>
        <Confirm msg={msg} />
      </div>
    </Panel>
  );
}

export default function Floor() {
  return (
    <div className="space-y-3">
      <FreezeBanner />
      <div>
        <PageHeader kicker="Floor Portal // Procedure" title="Motions & Floor" />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <MotionForm />
          <MotionLedger />
          <div className="space-y-3">
            <SuezDecree />
            <GslRequest />
            <DirectiveForm />
          </div>
        </div>
      </div>
    </div>
  );
}
