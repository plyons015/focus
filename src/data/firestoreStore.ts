import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { emptyIntegrations, emptySnapshot, type Integrations, type Snapshot } from '../domain/types';
import type { DataStore } from './store';

type Row = { id: string };

const COLLECTIONS = ['tasks', 'projects', 'timeBlocks', 'events', 'tombstones'] as const;

export function createFirestoreStore(db: Firestore, uid: string): DataStore {
  const listeners = new Set<(snapshot: Snapshot) => void>();
  let current = emptySnapshot();
  let ready: Promise<void> | null = null;
  const unsubs: Array<() => void> = [];

  function emit(next: Snapshot) {
    current = next;
    listeners.forEach((listener) => listener(current));
  }

  function start() {
    if (ready) return ready;
    const opened = new Set<string>();
    ready = new Promise((resolve) => {
      const arrived = (key: string) => {
        if (opened.has(key)) return;
        opened.add(key);
        if (opened.size === COLLECTIONS.length + 1) resolve();
      };
      for (const name of COLLECTIONS) {
        unsubs.push(
          onSnapshot(collection(db, 'users', uid, name), (snap) => {
            const rows = snap.docs.map((item) => item.data() as Snapshot[typeof name][number]);
            emit({ ...current, [name]: rows });
            arrived(name);
          }),
        );
      }
      unsubs.push(
        onSnapshot(doc(db, 'users', uid, 'meta', 'root'), (snap) => {
          const data = snap.data() as { integrations?: Integrations; lastRolloverDate?: string | null } | undefined;
          emit({
            ...current,
            integrations: data?.integrations ?? emptyIntegrations(),
            lastRolloverDate: data?.lastRolloverDate ?? null,
          });
          arrived('meta');
        }),
      );
    });
    return ready;
  }

  return {
    async load() {
      await start();
      return current;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async replace(snapshot) {
      current = snapshot;
      for (const name of COLLECTIONS) {
        await writeRows(db, uid, name, snapshot[name] as Row[]);
      }
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid, 'meta', 'root'), {
        ownerId: uid,
        integrations: snapshot.integrations,
        lastRolloverDate: snapshot.lastRolloverDate,
      });
      await batch.commit();
    },
  };
}

async function writeRows(db: Firestore, uid: string, name: string, rows: Row[]) {
  const col = collection(db, 'users', uid, name);
  const existing = await getDocs(col);
  const keep = new Set(rows.map((row) => row.id));
  let batch = writeBatch(db);
  let count = 0;
  const commit = async () => {
    if (count === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    count = 0;
  };
  for (const item of existing.docs) {
    if (!keep.has(item.id)) {
      batch.delete(item.ref);
      count += 1;
      if (count >= 400) await commit();
    }
  }
  for (const row of rows) {
    batch.set(doc(col, row.id), { ...row, ownerId: uid });
    count += 1;
    if (count >= 400) await commit();
  }
  await commit();
}
