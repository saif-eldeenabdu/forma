import type { Motion, MotionType } from './types';

/** Most disruptive → least disruptive (MUN procedure). */
export const MOTION_ORDER: MotionType[] = [
  'Table Debate',
  'Unmoderated Caucus',
  'Moderated Caucus',
  'Introduce Working Paper',
  'Set Speaking Time',
];

export function disruptiveness(type: MotionType): number {
  const i = MOTION_ORDER.indexOf(type);
  return i === -1 ? MOTION_ORDER.length : i;
}

/** Sort by disruptiveness, then longest duration first, then oldest first. */
export function sortMotions(motions: Motion[]): Motion[] {
  return [...motions].sort(
    (a, b) =>
      disruptiveness(a.type) - disruptiveness(b.type) ||
      b.totalSeconds - a.totalSeconds ||
      a.createdAt - b.createdAt,
  );
}

export const uid = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
