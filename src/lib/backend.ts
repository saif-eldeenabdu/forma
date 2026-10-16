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

/* ---------- Firebase backend (dynamic import keeps the SDK out of the local bundle) ---------- */

export interface FirebaseEnv {
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  projectId?: string;
  appId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

const clean = (v?: string): string | undefined => {
  if (!v) return undefined;
  const s = v.trim().replace(/^["']|["'],?$/g, '').replace(/,$/, '').trim();
  return s || undefined;
};

export function readFirebaseEnv(): FirebaseEnv {
  const e = import.meta.env;
  return {
    apiKey: clean(e.VITE_FIREBASE_API_KEY),
    authDomain: clean(e.VITE_FIREBASE_AUTH_DOMAIN),
    databaseURL: clean(e.VITE_FIREBASE_DATABASE_URL),
    projectId: clean(e.VITE_FIREBASE_PROJECT_ID),
    appId: clean(e.VITE_FIREBASE_APP_ID),
    storageBucket: clean(e.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: clean(e.VITE_FIREBASE_MESSAGING_SENDER_ID),
  };
}

export function isFirebaseConfigured(env: FirebaseEnv = readFirebaseEnv()): boolean {
  return Boolean(env.apiKey && env.databaseURL && env.projectId && !env.apiKey.startsWith('your-'));
}

export async function createFirebaseBackend(env: FirebaseEnv): Promise<Backend> {
  const [{ initializeApp }, db] = await Promise.all([import('firebase/app'), import('firebase/database')]);
  const app = initializeApp(env as Record<string, string>);
  const database = db.getDatabase(app);
  const root = db.ref(database);

  return {
    mode: 'FIREBASE',
    subscribe(cb) {
      return db.onValue(root, (snap) => cb(snap.val()));
    },
    async update(updates) {
      await db.update(root, updates);
    },
    async seedIfEmpty(seed) {
      const snap = await db.get(db.ref(database, 'committeeState'));
      if (!snap.exists()) await db.set(root, seed);
    },
    onOffset(cb) {
      return db.onValue(db.ref(database, '.info/serverTimeOffset'), (s) => cb(Number(s.val()) || 0));
    },
  };
}

export async function createBackend(): Promise<{ backend: Backend; fallbackReason?: string }> {
  const env = readFirebaseEnv();
  if (isFirebaseConfigured(env)) {
    try {
      return { backend: await createFirebaseBackend(env) };
    } catch (err) {
      console.error('[BRICS-NET] Firebase init failed, using local sync:', err);
      return { backend: createLocalBackend(), fallbackReason: 'FIREBASE INIT FAILED' };
    }
  }
  return { backend: createLocalBackend(), fallbackReason: 'NO FIREBASE ENV' };
}
