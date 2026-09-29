import {
  createId,
  type CompletionRequest,
  type ContextTag,
  type ExternalRef,
  type Task,
  type TaskSource,
  type Tombstone,
} from './types';

export interface NewTaskInput {
  ownerId: string;
  title: string;
  nowIso: string;
  note?: string;
  source?: TaskSource;
  context?: ContextTag;
  why?: string;
  dueDate?: string | null;
  projectId?: string | null;
  openUrl?: string | null;
  canComplete?: boolean;
  externalRefs?: ExternalRef[];
  sourceUpdatedAt?: string | null;
  status?: Task['status'];
}

export function createTask(input: NewTaskInput): Task {
  return {
    id: createId(),
    ownerId: input.ownerId,
    title: input.title.trim(),
    why: input.why ?? '',
    context: input.context ?? 'personal',
    status: input.status ?? 'inbox',
    dueDate: input.dueDate ?? null,
    projectId: input.projectId ?? null,
    source: input.source ?? 'manual',
    note: input.note ?? '',
    createdAt: input.nowIso,
    updatedAt: input.nowIso,
    sourceUpdatedAt: input.sourceUpdatedAt ?? null,
    externalRefs: input.externalRefs ?? [],
    calendarLinks: [],
    openUrl: input.openUrl ?? null,
    sort: 0,
    canComplete: input.canComplete ?? true,
    completionRequest: null,
    calendarRequest: null,
  };
}

function touch(task: Task, nowIso: string, patch: Partial<Task>): Task {
  return { ...task, ...patch, updatedAt: nowIso };
}

function replace(tasks: Task[], id: string, nowIso: string, patch: Partial<Task>): Task[] {
  return tasks.map((task) => (task.id === id ? touch(task, nowIso, patch) : task));
}

export function nowTask(tasks: Task[]): Task | null {
  return tasks.find((task) => task.status === 'today-now') ?? null;
}

export function nextTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => task.status === 'today-next')
    .sort((a, b) => a.sort - b.sort || a.createdAt.localeCompare(b.createdAt));
}

export function inboxTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => task.status === 'inbox')
    .sort((a, b) => a.sort - b.sort || a.createdAt.localeCompare(b.createdAt));
}

export function tasksIn(tasks: Task[], status: Task['status']): Task[] {
  return tasks
    .filter((task) => task.status === status)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export type FileResult =
  | { type: 'filed'; tasks: Task[]; becameNow: boolean }
  | { type: 'swap'; tasks: Task[]; nextIds: string[] };

export type Slot = 'now' | 'today' | 'week';

/** The open spot: Now if it is empty, Today if Next has room, otherwise This week. */
export function openSlot(tasks: Task[]): Slot {
  if (!nowTask(tasks)) return 'now';
  if (nextTasks(tasks).length < 2) return 'today';
  return 'week';
}

/**
 * Puts a task in a slot without a follow-up question.
 * Now stays one item. Next stays at most two. Anything past that goes to This week.
 */
export function placeTask(tasks: Task[], taskId: string, slot: Slot, nowIso: string): Task[] {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return tasks;
  if (slot === 'week') {
    if (task.status === 'week') return tasks;
    return replace(tasks, taskId, nowIso, { status: 'week' });
  }
  if (slot === 'today') {
    if (task.status === 'today-now' || task.status === 'today-next') return tasks;
    if (!nowTask(tasks)) return replace(tasks, taskId, nowIso, { status: 'today-now', sort: 0 });
    const upcoming = nextTasks(tasks);
    if (upcoming.length >= 2) return replace(tasks, taskId, nowIso, { status: 'week' });
    const sort = (upcoming[upcoming.length - 1]?.sort ?? 0) + 1;
    return replace(tasks, taskId, nowIso, { status: 'today-next', sort });
  }
  if (task.status === 'today-now') return tasks;
  const current = nowTask(tasks);
  let next = tasks;
  const upcoming = nextTasks(tasks).filter((item) => item.id !== taskId);
  if (current && upcoming.length >= 2) {
    const last = upcoming[upcoming.length - 1];
    if (last) next = replace(next, last.id, nowIso, { status: 'week' });
  }
  const bench = nextTasks(next).filter((item) => item.id !== taskId);
  const freedSort = task.status === 'today-next' ? task.sort : (bench[bench.length - 1]?.sort ?? 0) + 1;
  return next.map((item) => {
    if (item.id === taskId) return touch(item, nowIso, { status: 'today-now', sort: 0 });
    if (current && item.id === current.id) return touch(item, nowIso, { status: 'today-next', sort: freedSort });
    return item;
  });
}

export function fileToToday(tasks: Task[], taskId: string, nowIso: string): FileResult {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return { type: 'filed', tasks, becameNow: false };
  if (task.status === 'today-now') return { type: 'filed', tasks, becameNow: true };
  if (task.status === 'today-next') return { type: 'filed', tasks, becameNow: false };
  const current = nowTask(tasks);
  if (!current) {
    return {
      type: 'filed',
      tasks: replace(tasks, taskId, nowIso, { status: 'today-now', sort: 0 }),
      becameNow: true,
    };
  }
  const upcoming = nextTasks(tasks);
  if (upcoming.length >= 2) {
    return { type: 'swap', tasks, nextIds: upcoming.map((item) => item.id) };
  }
  const sort = (upcoming[upcoming.length - 1]?.sort ?? 0) + 1;
  return {
    type: 'filed',
    tasks: replace(tasks, taskId, nowIso, { status: 'today-next', sort }),
    becameNow: false,
  };
}

export function resolveSwap(
  tasks: Task[],
  incomingId: string,
  choice: { type: 'displace'; id: string } | { type: 'to-week' },
  nowIso: string,
): Task[] {
  if (choice.type === 'to-week') {
    return replace(tasks, incomingId, nowIso, { status: 'week' });
  }
  const displaced = tasks.find((task) => task.id === choice.id);
  const sort = displaced?.sort ?? nextTasks(tasks).length + 1;
  return tasks.map((task) => {
    if (task.id === choice.id) return touch(task, nowIso, { status: 'week' });
    if (task.id === incomingId) return touch(task, nowIso, { status: 'today-next', sort });
    return task;
  });
}

export type MakeNowResult = { type: 'ok'; tasks: Task[] } | { type: 'swap'; tasks: Task[]; nextIds: string[] };

export function makeNow(tasks: Task[], taskId: string, nowIso: string): MakeNowResult {
  const target = tasks.find((task) => task.id === taskId);
  if (!target) return { type: 'ok', tasks };
  if (target.status === 'today-now') return { type: 'ok', tasks };
  const current = nowTask(tasks);
  const upcoming = nextTasks(tasks).filter((task) => task.id !== taskId);
  if (current && upcoming.length >= 2) {
    return { type: 'swap', tasks, nextIds: upcoming.map((task) => task.id) };
  }
  const freedSort = target.status === 'today-next' ? target.sort : (nextTasks(tasks).at(-1)?.sort ?? 0) + 1;
  return {
    type: 'ok',
    tasks: tasks.map((task) => {
      if (task.id === taskId) return touch(task, nowIso, { status: 'today-now', sort: 0 });
      if (current && task.id === current.id) return touch(task, nowIso, { status: 'today-next', sort: freedSort });
      return task;
    }),
  };
}

export function swapNowWithNext(tasks: Task[], nowIso: string): Task[] {
  const current = nowTask(tasks);
  const first = nextTasks(tasks)[0];
  if (!current || !first) return tasks;
  return tasks.map((task) => {
    if (task.id === first.id) return touch(task, nowIso, { status: 'today-now', sort: 0 });
    if (task.id === current.id) return touch(task, nowIso, { status: 'today-next', sort: first.sort });
    return task;
  });
}

export function park(tasks: Task[], taskId: string, nowIso: string): Task[] {
  return replace(tasks, taskId, nowIso, { status: 'week' });
}

export function markDone(tasks: Task[], taskId: string, nowIso: string): { tasks: Task[]; completed: boolean } {
  const task = tasks.find((item) => item.id === taskId);
  if (!task || !task.canComplete) return { tasks, completed: false };
  const completionRequest = requestFor(task);
  return {
    completed: true,
    tasks: replace(tasks, taskId, nowIso, { status: 'done', completionRequest }),
  };
}

function requestFor(task: Task): CompletionRequest | null {
  const step = task.externalRefs.find((ref) => ref.kind === 'action-step');
  if (step?.planId && step.stepId) return { kind: 'action-step', planId: step.planId, stepId: step.stepId };
  const rhythm = task.externalRefs.find((ref) => ref.kind === 'rhythm' && ref.eventId);
  if (rhythm?.eventId) return { kind: 'rhythm', eventId: rhythm.eventId };
  return null;
}

export function moveTo(tasks: Task[], taskId: string, status: 'week' | 'someday' | 'inbox', nowIso: string): Task[] {
  return replace(tasks, taskId, nowIso, { status });
}

export function skipInbox(tasks: Task[], taskId: string, nowIso: string): Task[] {
  const max = inboxTasks(tasks).reduce((highest, task) => Math.max(highest, task.sort), 0);
  return replace(tasks, taskId, nowIso, { sort: max + 1 });
}

export function sendRestToSomeday(tasks: Task[], keepId: string, nowIso: string): Task[] {
  return tasks.map((task) =>
    task.status === 'inbox' && task.id !== keepId ? touch(task, nowIso, { status: 'someday' }) : task,
  );
}

export function setWhy(tasks: Task[], taskId: string, why: string, nowIso: string): Task[] {
  return replace(tasks, taskId, nowIso, { why });
}

export function setContext(tasks: Task[], taskId: string, context: ContextTag, nowIso: string): Task[] {
  return replace(tasks, taskId, nowIso, { context });
}

export function setDue(tasks: Task[], taskId: string, dueDate: string | null, nowIso: string): Task[] {
  return replace(tasks, taskId, nowIso, { dueDate });
}

export function setProject(tasks: Task[], taskId: string, projectId: string | null, nowIso: string): Task[] {
  return replace(tasks, taskId, nowIso, { projectId });
}

export function removeTask(tasks: Task[], taskId: string): { tasks: Task[]; removed: Task | null } {
  const removed = tasks.find((task) => task.id === taskId) ?? null;
  return { removed, tasks: tasks.filter((task) => task.id !== taskId) };
}

export function tombstonesFrom(task: Task): Tombstone[] {
  if (task.externalRefs.length === 0) return [];
  return task.externalRefs.map((ref) => ({
    externalId: ref.id,
    sourceUpdatedAt: task.sourceUpdatedAt ?? task.updatedAt,
  }));
}

export function rollover(
  tasks: Task[],
  todayKey: string,
  lastKey: string | null,
  nowIso: string,
): { tasks: Task[]; lastKey: string; changed: boolean } {
  if (!lastKey) return { tasks, lastKey: todayKey, changed: true };
  if (lastKey >= todayKey) return { tasks, lastKey, changed: false };
  const next = tasks.map((task) =>
    task.status === 'today-now' || task.status === 'today-next' ? touch(task, nowIso, { status: 'week' }) : task,
  );
  return { tasks: next, lastKey: todayKey, changed: true };
}

/** A clock tick never moves a task. */
export function tick(tasks: Task[]): Task[] {
  return tasks;
}

export function requestCalendar(tasks: Task[], taskId: string, action: 'upsert' | 'delete', nowIso: string): Task[] {
  return replace(tasks, taskId, nowIso, { calendarRequest: action });
}
