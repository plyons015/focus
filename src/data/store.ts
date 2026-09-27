import { openDB, type DBSchema } from 'idb';
import { emptySnapshot, type Snapshot } from '../domain/types';

export interface DataStore {
  load(): Promise<Snapshot>;
  subscribe(listener: (snapshot: Snapshot) => void): () => void;
  replace(snapshot: Snapshot): Promise<void>;
}

interface ZigDB extends DBSchema {
  snapshot: { key: string; value: Snapshot };
}

export function createLocalStore(): DataStore {
  const listeners = new Set<(snapshot: Snapshot) => void>();
  const dbPromise = openDB<ZigDB>('zigzag-planner', 1, {
    upgrade(db) {
      db.createObjectStore('snapshot');
    },
  });
  return {
    async load() {
      const db = await dbPromise;
      return (await db.get('snapshot', 'root')) ?? emptySnapshot();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async replace(snapshot) {
      const db = await dbPromise;
      await db.put('snapshot', snapshot, 'root');
      listeners.forEach((listener) => listener(snapshot));
    },
  };
}
