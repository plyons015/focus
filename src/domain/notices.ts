import type { DeadlineRow } from './deadlines';
import { PLAN_TZ } from './types';
import { dateKey, formatClock, zonedParts, zonedTimeToUtc } from './time';

export interface NoticePrefs {
  atTime: boolean;
  before15: boolean;
  before60: boolean;
  morningOf: boolean;
  eveningBefore: boolean;
}

export function defaultNotices(): NoticePrefs {
  return { atTime: true, before15: true, before60: true, morningOf: true, eveningBefore: true };
}

export interface PlannedNotice {
  id: number;
  at: Date;
  title: string;
  body: string;
}

function noticeId(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return (hash % 2147483646) + 1;
}

function clockOn(day: Date, hour: number, minute: number, timeZone: string): Date {
  const parts = zonedParts(day, timeZone);
  return zonedTimeToUtc(parts.year, parts.month, parts.day, hour, minute, timeZone);
}

function dayBefore(day: Date, timeZone: string): Date {
  const noon = clockOn(day, 12, 0, timeZone);
  return new Date(noon.getTime() - 24 * 60 * 60 * 1000);
}

export function planNotices(rows: DeadlineRow[], now: Date, prefs: NoticePrefs, timeZone = PLAN_TZ): PlannedNotice[] {
  const planned: PlannedNotice[] = [];
  const seen = new Set<number>();
  const push = (key: string, at: Date, title: string, body: string) => {
    if (at.getTime() <= now.getTime()) return;
    let id = noticeId(key);
    while (seen.has(id)) id = (id % 2147483646) + 1;
    seen.add(id);
    planned.push({ id, at, title, body });
  };
  for (const row of rows) {
    const at = new Date(row.at);
    if (Number.isNaN(at.getTime())) continue;
    const when = formatClock(at, timeZone);
    const sameDay = dateKey(at, timeZone) === dateKey(now, timeZone);
    if (prefs.atTime) push(`${row.id}:at`, at, row.title, `${row.title} starts now.`);
    if (prefs.before15) push(`${row.id}:15`, new Date(at.getTime() - 15 * 60 * 1000), row.title, `${row.title} starts in 15 minutes.`);
    if (prefs.before60) push(`${row.id}:60`, new Date(at.getTime() - 60 * 60 * 1000), row.title, `${row.title} starts in 1 hour.`);
    if (prefs.morningOf) {
      const morning = clockOn(at, 8, 0, timeZone);
      if (morning.getTime() < at.getTime()) push(`${row.id}:morning`, morning, row.title, `Today: ${row.title} at ${when}.`);
    }
    if (prefs.eveningBefore && !sameDay) {
      const evening = clockOn(dayBefore(at, timeZone), 18, 0, timeZone);
      push(`${row.id}:evening`, evening, row.title, `Tomorrow: ${row.title} at ${when}.`);
    }
  }
  return planned.sort((a, b) => a.at.getTime() - b.at.getTime());
}
