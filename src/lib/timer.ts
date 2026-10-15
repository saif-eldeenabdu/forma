import type { TimerState } from './types';

export interface DerivedTimer {
  /** Per-speaker clock (GSL/MOD). */
  speaker: number;
  /** Caucus clock (MOD total / UNMOD single clock). */
  caucus: number;
  /** The number the big display should show for this timer type. */
  primary: number;
  expired: boolean;
  running: boolean;
}

/**
 * Derive live remaining time from the last written snapshot and a (server-corrected) clock.
 * Only start/stop/set events are written to the DB; every client derives the same value.
 */
export function deriveTimer(t: TimerState, now: number): DerivedTimer {
  const elapsed = t.isRunning ? Math.max(0, (now - t.lastUpdated) / 1000) : 0;
  const speaker = Math.max(0, t.remainingSeconds - elapsed);
  const caucus = Math.max(0, t.modRemainingSeconds - elapsed);
  const primary = t.type === 'GSL' ? speaker : caucus;
  const expired = t.type === 'MOD' ? caucus <= 0 || speaker <= 0 : primary <= 0;
  return { speaker, caucus, primary, expired, running: t.isRunning && !expired };
}

export function fmtClock(totalSeconds: number): string {
  const s = Math.ceil(Math.max(0, totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
