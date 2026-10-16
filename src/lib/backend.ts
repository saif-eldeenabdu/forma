import type { RootState, Updates } from './types';
import { createSeed } from './seed';

export type SyncMode = 'FIREBASE' | 'LOCAL';

export interface Backend {
  mode: SyncMode;
  /** Subscribe to the raw (DB-form) root. Returns unsubscribe. */
  subscribe(cb: (raw: unknown) => void): () => void;
  /** Multi-path update. `null` values delete. */
  update(updates: Updates): Promise<void>;
  /** Write the seed only when the DB is empty. */
  seedIfEmpty(seed: unknown): Promise<void>;
  /** Subscribe to server-clock offset (ms). */
  onOffset(cb: (offsetMs: number) => void): () => void;
}

/* ---------- DB-form helpers (maps keyed by id instead of arrays) ---------- */

/** Convert the typed seed to DB form (collections that many clients append to become id-keyed maps). */
export function toDbForm(seed: RootState): Record<string, unknown> {
  return {
    ...seed,
    committeeState: { ...seed.committeeState, gslRequests: {} },
    motions: {},
    trades: {},
    directives: {},
    grainContracts: {},
  };
}

export function applyUpdates(root: Record<string, unknown>, updates: Updates): Record<string, unknown> {
  for (const [path, value] of Object.entries(updates)) {
    const keys = path.split('/').filter(Boolean);
    if (keys.length === 0) continue;
    let node = root as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      const next = node[k];
      if (typeof next !== 'object' || next === null || Array.isArray(next)) node[k] = {};
      node = node[k] as Record<string, unknown>;
    }
    const last = keys[keys.length - 1];
    if (value === null || value === undefined) delete node[last];
    else node[last] = JSON.parse(JSON.stringify(value));
  }
  return root;
}

/* ---------- Local backend: localStorage + BroadcastChannel ---------- */

const LS_KEY = 'brics-net:state:v1';
const CHANNEL = 'brics-net:sync';

export function createLocalBackend(): Backend {
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  const listeners = new Set<(raw: unknown) => void>();

  const read = (): Record<string, unknown> | null => {
    try {
      const s = localStorage.getItem(LS_KEY);
      return s ? (JSON.parse(s) as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };
  const write = (root: Record<string, unknown>) => {
    localStorage.setItem(LS_KEY, JSON.stringify(root));
  };
  const emit = () => {
    const root = read();
    listeners.forEach((l) => l(root));
  };

  channel?.addEventListener('message', emit);
  window.addEventListener('storage', (e) => {
    if (e.key === LS_KEY) emit();
  });

  return {
    mode: 'LOCAL',
    subscribe(cb) {
      listeners.add(cb);
      cb(read());
      return () => listeners.delete(cb);
    },
    async update(updates) {
      const root = read() ?? toDbForm(createSeed());
      applyUpdates(root, updates);
      write(root);
      emit();
      channel?.postMessage('u');
    },
    async seedIfEmpty(seed) {
      if (!read()) {
        write(seed as Record<string, unknown>);
        emit();
        channel?.postMessage('u');
      }
    },
    onOffset(cb) {
      cb(0);
      return () => undefined;
    },
  };
}

/* ---------- Firebase backend (direct RTDB synchronization) ---------- */
import { db, ref, onValue, set, update as fbUpdate, get, firebaseConfig } from '../firebase';

export { firebaseConfig };

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId);
}

export function createFirebaseBackend(): Backend {
  const root = ref(db);
  const local = createLocalBackend();

  return {
    mode: 'FIREBASE',
    subscribe(cb) {
      // Optimistic initial local snapshot while Firebase syncs
      const unsubLocal = local.subscribe(cb);
      // Real-time synchronization directly from Firebase RTDB
      const unsubFirebase = onValue(
        root,
        (snap) => {
          const val = snap.val();
          if (val) {
            cb(val);
            try {
              localStorage.setItem('brics-net:state:v1', JSON.stringify(val));
            } catch {
              // ignore
            }
          }
        },
        (err) => {
          console.warn('[BRICS-NET] Firebase onValue listener error:', err);
        },
      );
      return () => {
        unsubLocal();
        unsubFirebase();
      };
    },
    async update(updates) {
      // Local optimistic update for 0ms lag
      await local.update(updates);
      // Direct remote write to Firebase Realtime Database
      try {
        await fbUpdate(root, updates);
      } catch (err) {
        console.error('[BRICS-NET] Firebase RTDB update error:', err);
      }
    },
    async seedIfEmpty(seed) {
      try {
        const snap = await get(ref(db, 'committeeState'));
        if (!snap.exists()) {
          await set(root, seed);
        }
      } catch (err) {
        console.warn('[BRICS-NET] Firebase seed check error:', err);
        await local.seedIfEmpty(seed);
      }
    },
    onOffset(cb) {
      return onValue(ref(db, '.info/serverTimeOffset'), (s) => cb(Number(s.val()) || 0));
    },
  };
}

export async function createBackend(): Promise<{ backend: Backend; fallbackReason?: string }> {
  try {
    const fbBackend = createFirebaseBackend();
    await fbBackend.seedIfEmpty(toDbForm(createSeed()));
    return { backend: fbBackend };
  } catch (err) {
    console.warn('[BRICS-NET] Firebase initialization error, using local:', err);
    const local = createLocalBackend();
    await local.seedIfEmpty(toDbForm(createSeed()));
    return { backend: local };
  }
}

