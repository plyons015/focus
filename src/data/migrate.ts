import type { Firestore } from 'firebase/firestore';
import type { Project, Snapshot, Task, TimeBlock } from '../domain/types';
import { createFirestoreStore } from './firestoreStore';
import { createLocalStore } from './store';

function mergeRows<T extends { id: string }>(cloud: T[], local: T[], stamp: (item: T) => T, time: (item: T) => string): T[] {
  const map = new Map(cloud.map((item) => [item.id, item]));
  for (const item of local) {
    const stamped = stamp(item);
    const existing = map.get(stamped.id);
    if (!existing || time(stamped) > time(existing)) map.set(stamped.id, stamped);
  }
  return [...map.values()];
}

function sameRows<T extends { id: string }>(a: T[], b: T[], time: (item: T) => string): boolean {
  if (a.length !== b.length) return false;
  const cloud = new Map(b.map((item) => [item.id, time(item)]));
  return a.every((item) => cloud.get(item.id) === time(item));
}

/** Bring this device's tasks up when you sign in, without wiping the other device. */
export async function migrateLocalIntoCloud(uid: string, db: Firestore): Promise<void> {
  const localSnap = await createLocalStore().load();
  if (localSnap.tasks.length === 0 && localSnap.projects.length === 0 && localSnap.timeBlocks.length === 0) return;
  const cloudStore = createFirestoreStore(db, uid);
  const cloud = await cloudStore.load();
  const merged: Snapshot = {
    ...cloud,
    tasks: mergeRows<Task>(cloud.tasks, localSnap.tasks, (item) => ({ ...item, ownerId: uid }), (item) => item.updatedAt),
    projects: mergeRows<Project>(cloud.projects, localSnap.projects, (item) => ({ ...item, ownerId: uid }), (item) => item.updatedAt),
    timeBlocks: mergeRows<TimeBlock>(cloud.timeBlocks, localSnap.timeBlocks, (item) => ({ ...item, ownerId: uid }), (item) => item.createdAt),
    lastRolloverDate: cloud.lastRolloverDate ?? localSnap.lastRolloverDate,
  };
  if (
    sameRows(merged.tasks, cloud.tasks, (item) => item.updatedAt) &&
    sameRows(merged.projects, cloud.projects, (item) => item.updatedAt) &&
    sameRows(merged.timeBlocks, cloud.timeBlocks, (item) => item.createdAt)
  ) {
    return;
  }
  await cloudStore.replace(merged);
}
