import { PLAN_TZ, type CachedEvent, type Task, type TimeBlock } from './types';
import { dateKey, formatClock, formatWhen } from './time';

export interface DeadlineRow {
  id: string;
  at: string;
  title: string;
  label: 'Task' | 'Zoho' | 'Google' | 'Recovery';
  addable: boolean;
  eventId?: string;
}

function inWindow(at: string, now: Date, horizonDays: number, timeZone: string): boolean {
  const when = new Date(at);
  if (Number.isNaN(when.getTime())) return false;
  const start = dateKey(now, timeZone);
  const endDate = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);
  const end = dateKey(endDate, timeZone);
  const key = dateKey(when, timeZone);
  return key >= start && key <= end;
}

export function deadlineRows(input: {
  tasks: Task[];
  blocks: TimeBlock[];
  events: CachedEvent[];
  now: Date;
  horizonDays?: number;
  timeZone?: string;
}): DeadlineRow[] {
  const horizon = input.horizonDays ?? 7;
  const timeZone = input.timeZone ?? PLAN_TZ;
  const linked = new Set(input.tasks.flatMap((task) => task.calendarLinks.map((link) => link.eventId)));
  const rows: DeadlineRow[] = [];

  for (const task of input.tasks) {
    if (task.status === 'done' || !task.dueDate) continue;
    if (!inWindow(task.dueDate, input.now, horizon, timeZone)) continue;
    rows.push({ id: `task:${task.id}`, at: task.dueDate, title: task.title, label: 'Task', addable: false });
  }
  for (const block of input.blocks) {
    if (!inWindow(block.start, input.now, horizon, timeZone)) continue;
    rows.push({ id: `block:${block.id}`, at: block.start, title: block.title, label: 'Recovery', addable: false });
  }
  for (const event of input.events) {
    if (linked.has(event.eventId)) continue;
    if (!inWindow(event.start, input.now, horizon, timeZone)) continue;
    rows.push({
      id: `event:${event.id}`,
      at: event.start,
      title: event.title,
      label: event.provider === 'zoho' ? 'Zoho' : 'Google',
      addable: true,
      eventId: event.id,
    });
  }
  return rows.sort((a, b) => a.at.localeCompare(b.at) || a.title.localeCompare(b.title));
}

export function splitByDay(rows: DeadlineRow[], now: Date, timeZone = PLAN_TZ): { today: DeadlineRow[]; later: DeadlineRow[] } {
  const key = dateKey(now, timeZone);
  const today: DeadlineRow[] = [];
  const later: DeadlineRow[] = [];
  for (const row of rows) {
    if (dateKey(new Date(row.at), timeZone) === key) today.push(row);
    else later.push(row);
  }
  return { today, later };
}

export function deadlineSummary(now: Date, rows: DeadlineRow[], timeZone = PLAN_TZ): string {
  const clock = formatClock(now, timeZone);
  const next = rows[0];
  if (!next) return clock;
  return `${clock} · Next: ${formatWhen(new Date(next.at), now, timeZone)} · ${next.title}`;
}

export function todayNotices(): string[] {
  return [];
}
