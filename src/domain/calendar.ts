import type { CachedEvent, CalendarLink, Task } from './types';

export type LinkState =
  | { type: 'ok' }
  | { type: 'push' }
  | { type: 'pull'; start: string }
  | { type: 'conflict'; eventStart: string }
  | { type: 'unlink' };

export function canWriteEvent(event: Pick<CachedEvent, 'ownedByZigzag'>): boolean {
  return event.ownedByZigzag;
}

/**
 * ZigZag-owned links only. Pass `event: null` after a successful pull that
 * no longer contains the event. Read-only meetings never reach this function.
 */
export function linkStatus(input: {
  taskUpdatedAt: string;
  taskDue: string | null;
  link: CalendarLink;
  event: { start: string; etag: string; updatedAt: string } | null;
}): LinkState {
  const { link, event } = input;
  if (!event) return { type: 'unlink' };
  const taskMoved = input.taskUpdatedAt > link.updatedAt && input.taskDue !== event.start;
  const eventMoved = event.etag !== link.etag && event.updatedAt > link.updatedAt;
  if (taskMoved && eventMoved) return { type: 'conflict', eventStart: event.start };
  if (taskMoved) return { type: 'push' };
  if (eventMoved) return { type: 'pull', start: event.start };
  return { type: 'ok' };
}

export function applyConflictChoice(task: Task, choice: 'keep' | 'use', eventStart: string, nowIso: string, etag: string): Task {
  if (choice === 'keep') {
    return {
      ...task,
      updatedAt: nowIso,
      calendarRequest: 'upsert',
      calendarLinks: task.calendarLinks.map((link) => ({ ...link, updatedAt: nowIso, etag })),
    };
  }
  return {
    ...task,
    dueDate: eventStart,
    updatedAt: nowIso,
    calendarRequest: null,
    calendarLinks: task.calendarLinks.map((link) => ({ ...link, updatedAt: nowIso, etag })),
  };
}

export function homeTarget(integrations: {
  zoho: { status: string; home: boolean; writeCalendarId: string };
  google: { status: string; home: boolean; writeCalendarId: string };
}): { provider: 'zoho' | 'google'; calendarId: string } | null {
  if (integrations.zoho.status === 'connected' && integrations.zoho.home && integrations.zoho.writeCalendarId) {
    return { provider: 'zoho', calendarId: integrations.zoho.writeCalendarId };
  }
  if (integrations.google.status === 'connected' && integrations.google.home && integrations.google.writeCalendarId) {
    return { provider: 'google', calendarId: integrations.google.writeCalendarId };
  }
  return null;
}

export function zohoStamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

export function zohoEventData(input: { title: string; start: Date; end: Date; etag?: string; busy?: boolean }): string {
  const body: Record<string, unknown> = {
    title: input.title,
    dateandtime: { start: zohoStamp(input.start), end: zohoStamp(input.end) },
  };
  if (input.busy) body.transparency = 0;
  if (input.etag) body.etag = input.etag;
  return JSON.stringify(body);
}
