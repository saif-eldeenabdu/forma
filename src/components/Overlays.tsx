import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertOctagon, Gavel, Radio } from 'lucide-react';
import { useStore } from '../lib/store';
import { chime } from '../lib/audio';
import { fmtSecondsLabel } from './ui';
import type { Motion } from '../lib/types';

const ALERT_KEY = 'brics-net:dismissed-alert';
const MOTION_KEY = 'brics-net:dismissed-motion';

export function CrisisOverlay() {
  const { state, now } = useStore();
  const alert = state.committeeState.crisisAlert;
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(ALERT_KEY) ?? '');
  const visible = !!alert && alert.id !== dismissed && now() - alert.at < 120_000;

  useEffect(() => {
    if (!alert) return;
    if (alert.id === (sessionStorage.getItem(ALERT_KEY) ?? '') || now() - alert.at >= 120_000) return;
    chime(alert.kind === 'CUSTOM' ? 'sonar' : 'alert');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alert?.id]);

  const close = () => {
    if (!alert) return;
    sessionStorage.setItem(ALERT_KEY, alert.id);
    setDismissed(alert.id);
  };

  const isBarter = alert?.kind === 'BARTER';
  const tone =
    alert?.severity === 'WARNING' ? 'gold' : alert?.severity === 'ABSURD' ? 'emerald' : 'crimson';
  const toneText = { gold: 'text-gold', emerald: 'text-emerald', crimson: 'text-crimson' }[tone];
  const toneBorder = { gold: 'border-gold', emerald: 'border-emerald', crimson: 'border-crimson' }[tone];

  return (
    <AnimatePresence>
      {visible && alert && (
        <motion.div
          key={alert.id}
          role="alertdialog"
          aria-label={alert.title}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-obsidian/95 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.96, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className={`w-full ${isBarter ? 'max-w-4xl border-4 flash-border' : `max-w-2xl border-2 ${toneBorder}`} bg-basalt p-6 md:p-10`}
          >
            <div className="mb-4 flex items-center gap-3">
              {isBarter ? <AlertOctagon className="text-gold" size={28} /> : <Radio className={toneText} size={22} />}
              <span className={`label ${isBarter ? '!text-gold' : toneText} blink`}>
                {isBarter ? 'Emergency Broadcast // Priority Zero' : `Breaking // ${alert.severity}`}
              </span>
            </div>
            <h2 className={`font-serif ${isBarter ? 'text-3xl md:text-5xl text-crimson' : `text-2xl md:text-4xl ${toneText}`} font-medium leading-tight`}>
              {alert.title}
            </h2>
            <p className={`mt-4 ${isBarter ? 'text-xl md:text-3xl text-gold font-serif' : 'text-base md:text-xl text-ivory/90'}`}>{alert.body}</p>
            <div className="mt-8 flex items-center justify-between">
              <span className="tabular text-[11px] text-sage">REF {alert.id.toUpperCase()}</span>
              <button className={`btn ${isBarter ? 'btn-gold' : ''}`} onClick={close}>
                Acknowledge
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useProjected(): Motion | undefined {
  const { state } = useStore();
  const id = state.committeeState.projectedMotionId;
  return id ? state.motions.find((m) => m.id === id) : undefined;
}

export function motionLine(m: Motion): string {
  const parts: string[] = [m.type];
  if (m.type === 'Moderated Caucus') parts.push(`${fmtSecondsLabel(m.totalSeconds)} total / ${fmtSecondsLabel(m.speakerSeconds)} per speaker`);
  else if (m.type === 'Unmoderated Caucus') parts.push(fmtSecondsLabel(m.totalSeconds));
  else if (m.type === 'Set Speaking Time') parts.push(`${fmtSecondsLabel(m.speakerSeconds)} per speaker`);
  return parts.join(' — ');
}

export function MotionFlash() {
  const m = useProjected();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(MOTION_KEY) ?? '');
  const { state } = useStore();
  const alertOpen = !!state.committeeState.crisisAlert && state.committeeState.crisisAlert.id !== sessionStorage.getItem(ALERT_KEY);

  useEffect(() => {
    if (m && m.id !== (sessionStorage.getItem(MOTION_KEY) ?? '')) chime('motion');
  }, [m?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const show = !!m && m.id !== dismissed && !alertOpen;
  return (
    <AnimatePresence>
      {show && m && (
        <motion.div
          key={m.id}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-obsidian/90 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="w-full max-w-3xl border-2 border-gold bg-basalt p-6 md:p-10"
          >
            <p className="label !text-gold">On the floor // For voting</p>
            <h2 className="mt-3 font-serif text-3xl md:text-5xl">{motionLine(m)}</h2>
            <p className="mt-4 text-lg text-ivory/90 md:text-2xl">{m.topic || 'No topic stated.'}</p>
            <div className="mt-8 flex items-center justify-between">
              <span className="tabular text-sm text-sage">Moved by <span className="text-ivory">{m.delegation}</span></span>
              <button
                className="btn btn-gold"
                onClick={() => {
                  sessionStorage.setItem(MOTION_KEY, m.id);
                  setDismissed(m.id);
                }}
              >
                Noted
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ActiveMotionBanner() {
  const m = useProjected();
  return (
    <AnimatePresence initial={false}>
      {m && (
        <motion.div
          key={m.id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-b border-gold bg-gold/10"
        >
          <div className="mx-auto flex max-w-[1920px] flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 md:px-5">
            <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
              <Gavel size={13} /> Motion on the floor
            </span>
            <span className="font-serif text-lg text-ivory">{motionLine(m)}</span>
            <span className="text-sm text-ivory/80">— {m.topic}</span>
            <span className="ml-auto tabular text-[11px] text-sage">Moved by {m.delegation}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
