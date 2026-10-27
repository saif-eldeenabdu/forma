import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hand, HelpCircle, Mic, Users } from 'lucide-react';
import { COUNTRY_NAMES, useNow, useStore } from '../lib/store';
import { deriveTimer, fmtClock } from '../lib/timer';
import { chime } from '../lib/audio';
import { byName } from '../data/countries';
import { Panel } from './ui';

const TYPE_LABEL = { GSL: 'General Speakers List', MOD: 'Moderated Caucus', UNMOD: 'Unmoderated Caucus' } as const;

export function TimerPanel() {
  const { state, me, isChair, actions } = useStore();
  const t = state.committeeState.timer;
  const tick = useNow(100);
  const d = deriveTimer(t, tick);
  const [yieldTarget, setYieldTarget] = useState('');

  useEffect(() => {
    if (d.expired && t.isRunning) chime('expire');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.expired && t.isRunning]);

  const big = t.type === 'UNMOD' ? d.caucus : d.speaker;
  const bigTotal = t.type === 'UNMOD' ? t.modTotalSeconds : t.totalSeconds;
  const frac = bigTotal > 0 ? big / bigTotal : 0;
  const clr = big <= 0 ? 'text-crimson' : big <= 10 || frac <= 0.1 ? 'text-crimson' : frac <= 0.25 ? 'text-gold' : 'text-ivory';
  const country = byName(t.currentSpeaker);
  const canYield = (isChair || (me && me === t.currentSpeaker)) && t.type === 'GSL';

  return (
    <Panel
      title="Speech Timer"
      tone={d.expired && t.isRunning ? 'crimson' : undefined}
      right={
        <span className="flex items-center gap-2 label">
          <span className={`inline-block h-[7px] w-[7px] rounded-full ${d.running ? 'bg-emerald' : 'bg-sage/50'}`} />
          {d.running ? 'Running' : d.expired ? 'Expired' : 'Paused'}
        </span>
      }
    >
      <p className="label !text-gold">{TYPE_LABEL[t.type]}</p>

      {t.type !== 'UNMOD' ? (
        <div className="mt-2 flex items-center gap-2">
          <Mic size={14} className="text-sage" />
          <span className="label">Has the floor</span>
          <span className="font-serif text-2xl leading-none text-ivory">{t.currentSpeaker}</span>
          {country && <span className="tabular text-[11px] text-sage">[{country.code}]</span>}
        </div>
      ) : (
        <p className="mt-2 text-sm text-sage">Delegates leave their seats: form blocs, trade on BRICS-NET, write Working Papers.</p>
      )}

      <div className={`tabular mt-3 text-center text-[clamp(3.5rem,9vw,7.5rem)] font-medium leading-none ${clr} ${d.expired && t.isRunning ? 'blink' : ''}`}>
        {fmtClock(big)}
      </div>
      <div className="mt-3 h-1 w-full bg-charcoal">
        <div className={`h-full ${big <= 0 ? 'bg-crimson' : frac <= 0.25 ? 'bg-gold' : 'bg-emerald'}`} style={{ width: `${Math.max(0, Math.min(1, frac)) * 100}%` }} />
      </div>

      {t.type === 'MOD' && (
        <div className="mt-3 flex items-center justify-between border border-hairline bg-charcoal px-3 py-2">
          <span className="label">Caucus time remaining</span>
          <span className={`tabular text-2xl ${d.caucus <= 30 ? 'text-crimson' : 'text-ivory'}`}>{fmtClock(d.caucus)}</span>
          <span className="tabular text-[11px] text-sage">/ {fmtClock(t.modTotalSeconds)}</span>
        </div>
      )}

      {t.type !== 'UNMOD' && (
        <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2">
          <span className="label">Yield status</span>
          <span className="tabular text-xs text-ivory">
            {t.yieldTo === 'None' ? '—' : t.yieldedFrom ? `Yielded from ${t.yieldedFrom} → ${t.yieldTo}` : `Yield → ${t.yieldTo}`}
          </span>
        </div>
      )}

      {t.type === 'MOD' && <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-sage">No yields permitted during a Moderated Caucus.</p>}

      {canYield && (
        <div className="mt-3 space-y-2 border-t border-hairline pt-3">
          <p className="label">Yield remaining time</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn" onClick={() => actions.yieldTime('CHAIR')}>
              <Hand size={12} /> To the Chair
            </button>
            <button className="btn" onClick={() => actions.yieldTime('QUESTIONS')}>
              <HelpCircle size={12} /> Questions
            </button>
          </div>
          <div className="flex gap-2">
            <select className="field !py-1.5 text-xs" value={yieldTarget} onChange={(e) => setYieldTarget(e.target.value)} aria-label="Yield to delegate">
              <option value="">Delegate…</option>
              {COUNTRY_NAMES.filter((c) => c !== t.currentSpeaker).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <button
              className="btn shrink-0"
              disabled={!yieldTarget}
              onClick={() => {
                actions.yieldTime('DELEGATE', yieldTarget);
                setYieldTarget('');
              }}
            >
              <Users size={12} /> Yield
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

export function GslPanel() {
  const { state, me } = useStore();
  const cs = state.committeeState;
  const queue = cs.gslQueue;
  const myIndex = queue.findIndex((item) => (typeof item === 'string' ? item : item.country) === me);
  const myItem = myIndex >= 0 ? queue[myIndex] : null;

  return (
    <Panel
      title="General Speakers List // Auction Queue"
      right={<span className="tabular text-[11px] text-sage">{queue.length} queued</span>}
      bodyClass="p-0"
    >
      <ol className="divide-y divide-hairline">
        {queue.length === 0 && <li className="px-3 py-4 text-sm text-sage">Queue is empty. Place bids on the Floor tab.</li>}
        {queue.map((item, i) => {
          const c = typeof item === 'string' ? item : item.country;
          const bid = typeof item === 'string' ? 0 : item.bid;
          const code = byName(c)?.code;
          const mine = c === me;
          return (
            <li key={`${c}-${i}`} className={`flex items-center gap-3 px-3 py-2.5 ${i === 0 ? 'bg-gold/10' : ''} ${mine ? 'border-l-2 border-gold bg-charcoal/40' : 'border-l-2 border-transparent'}`}>
              <span className="tabular w-6 text-[11px] text-sage">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-serif text-lg leading-none truncate ${i === 0 ? 'text-gold font-bold' : 'text-ivory'}`}>{c}</span>
                  {code && <span className="tabular text-[10px] text-sage">[{code}]</span>}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="tabular font-mono text-xs font-semibold text-gold">
                    ${bid.toLocaleString()} BID
                  </span>
                  {i === 0 && <span className="border border-gold/60 bg-gold/15 px-1 py-0.2 font-mono text-[9px] uppercase text-gold">On Floor</span>}
                </div>
              </div>
              {mine && <span className="label !text-emerald shrink-0">You</span>}
            </li>
          );
        })}
      </ol>
      <div className="border-t border-hairline p-3">
        {me && myIndex >= 0 && (
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-emerald">
            {me}: position {myIndex + 1} of {queue.length} (Bid: ${((typeof myItem === 'string' ? 0 : myItem?.bid) || 0).toLocaleString()})
          </p>
        )}
        <Link to="/floor" className="btn btn-gold w-full flex items-center justify-center gap-2 text-center">
          <span>GSL Auction Desk → Place / Raise Bid</span>
        </Link>
        {!me && <p className="mt-2 text-xs text-sage">Authenticate delegation PIN to enter speaking auction.</p>}
      </div>
    </Panel>
  );
}
