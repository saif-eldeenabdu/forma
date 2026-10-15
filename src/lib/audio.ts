/** Tiny WebAudio chime generator — no asset files. Silently no-ops until the browser allows audio. */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, vol: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  gain.gain.setValueAtTime(0.0001, c.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.05);
}

export type ChimeKind = 'sonar' | 'alert' | 'motion' | 'expire';

export function chime(kind: ChimeKind): void {
  if (localStorage.getItem('brics-net:mute') === '1') return;
  const c = getCtx();
  if (!c) return;
  switch (kind) {
    case 'sonar':
      tone(c, 880, 0, 1.4, 'sine', 0.12);
      tone(c, 880, 0.55, 1.2, 'sine', 0.06);
      break;
    case 'alert':
      tone(c, 440, 0, 0.18, 'square', 0.05);
      tone(c, 330, 0.22, 0.18, 'square', 0.05);
      tone(c, 440, 0.44, 0.18, 'square', 0.05);
      tone(c, 330, 0.66, 0.3, 'square', 0.05);
      break;
    case 'motion':
      tone(c, 660, 0, 0.12, 'triangle', 0.08);
      tone(c, 990, 0.14, 0.2, 'triangle', 0.08);
      break;
    case 'expire':
      tone(c, 520, 0, 0.25, 'triangle', 0.08);
      tone(c, 520, 0.35, 0.25, 'triangle', 0.08);
      break;
  }
}

export function setMuted(m: boolean): void {
  localStorage.setItem('brics-net:mute', m ? '1' : '0');
}
export function isMuted(): boolean {
  return localStorage.getItem('brics-net:mute') === '1';
}
