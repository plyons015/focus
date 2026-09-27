import { createTask, type NewTaskInput } from './tasks';
import type { ExternalRef, Snapshot, Task, Tombstone } from './types';

export interface OpenWorkItem {
  id: string;
  refs: ExternalRef[];
  title: string;
  note: string;
  dueDate: string | null;
  openUrl: string | null;
  canComplete: boolean;
  updatedAt: string;
}

export interface OpenWorkUpdate {
  items: OpenWorkItem[];
  /** Full reconcile: Deep Roots ids missing from `items` are finished. */
  replaceOpenSet?: boolean;
  closedIds?: string[];
}

function refsOf(task: Task): string[] {
  return task.externalRefs.map((ref) => ref.id);
}

function matches(task: Task, id: string): boolean {
  return refsOf(task).includes(id);
}

function findTask(tasks: Task[], item: OpenWorkItem): Task | undefined {
  const ids = new Set([item.id, ...item.refs.map((ref) => ref.id)]);
  return tasks.find((task) => task.externalRefs.some((ref) => ids.has(ref.id)) || ids.has(task.id));
}

export function applyOpenWork(snapshot: Snapshot, update: OpenWorkUpdate, nowIso: string, ownerId: string): Snapshot {
  let tasks = snapshot.tasks.slice();
  let tombstones = snapshot.tombstones.slice();
  const closed = new Set(update.closedIds ?? []);

  if (update.replaceOpenSet) {
    const openIds = new Set(update.items.flatMap((item) => [item.id, ...item.refs.map((ref) => ref.id)]));
    tasks = tasks.map((task) => {
      if (task.source !== 'deeproots' || task.status === 'done') return task;
      const ids = refsOf(task);
      if (ids.length === 0) return task;
      if (ids.some((id) => openIds.has(id))) return task;
      return { ...task, status: 'done', updatedAt: nowIso };
    });
  }

  for (const id of closed) {
    tasks = tasks.map((task) => (matches(task, id) && task.status !== 'done' ? { ...task, status: 'done', updatedAt: nowIso } : task));
  }

  for (const item of update.items) {
    const existing = findTask(tasks, item);
    const ids = new Set([item.id, ...item.refs.map((ref) => ref.id)]);
    const related = tombstones.filter((stone) => ids.has(stone.externalId));
    const tombAt = related.reduce((latest, stone) => (stone.sourceUpdatedAt > latest ? stone.sourceUpdatedAt : latest), '');
    if (!existing && related.length > 0 && item.updatedAt <= tombAt) continue;
    if (!existing && related.length > 0 && item.updatedAt > tombAt) {
      tombstones = tombstones.filter((stone) => !ids.has(stone.externalId));
    }
    if (existing) {
      tasks = tasks.map((task) => {
        if (task.id !== existing.id) return task;
        return {
          ...task,
          title: item.title,
          note: item.note,
          dueDate: item.dueDate,
          openUrl: item.openUrl,
          canComplete: item.canComplete,
          externalRefs: item.refs,
          sourceUpdatedAt: item.updatedAt,
          updatedAt: nowIso,
        };
      });
      continue;
    }
    const input: NewTaskInput = {
      ownerId,
      title: item.title,
      nowIso,
      note: item.note,
      source: 'deeproots',
      dueDate: item.dueDate,
      openUrl: item.openUrl,
      canComplete: item.canComplete,
      externalRefs: item.refs,
      sourceUpdatedAt: item.updatedAt,
    };
    tasks = [...tasks, createTask(input)];
  }

  return { ...snapshot, tasks, tombstones };
}

export function withTombstones(snapshot: Snapshot, removed: Task | null): Snapshot {
  if (!removed) return snapshot;
  const extra: Tombstone[] = removed.externalRefs.map((ref) => ({
    externalId: ref.id,
    sourceUpdatedAt: removed.sourceUpdatedAt ?? removed.updatedAt,
  }));
  if (extra.length === 0) return snapshot;
  const tombstones = [...snapshot.tombstones.filter((stone) => !extra.some((item) => item.externalId === stone.externalId)), ...extra];
  return { ...snapshot, tombstones };
}
