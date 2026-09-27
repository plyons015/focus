import { PLAN_TZ } from './types';

export function zonedParts(date: Date, timeZone = PLAN_TZ) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== 'literal') bag[part.type] = part.value;
  }
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
  };
}

export function dateKey(date: Date, timeZone = PLAN_TZ): string {
  const p = zonedParts(date, timeZone);
  const month = String(p.month).padStart(2, '0');
  const day = String(p.day).padStart(2, '0');
  return `${p.year}-${month}-${day}`;
}

function zoneOffsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - date.getTime();
}

export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone = PLAN_TZ,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const first = new Date(guess.getTime() - zoneOffsetMs(guess, timeZone));
  return new Date(guess.getTime() - zoneOffsetMs(first, timeZone));
}

export function formatClock(date: Date, timeZone = PLAN_TZ): string {
  const text = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
  return text.replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ').toLowerCase();
}

export function formatDay(date: Date, timeZone = PLAN_TZ): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatWhen(at: Date, now: Date, timeZone = PLAN_TZ): string {
  const time = formatClock(at, timeZone);
  if (dateKey(at, timeZone) === dateKey(now, timeZone)) return `Today ${time}`;
  return `${formatDay(at, timeZone)} ${time}`;
}

/** Next :00 or :30 on the plan clock. An exact half hour moves forward. */
export function nextHalfHour(now: Date, timeZone = PLAN_TZ): Date {
  const p = zonedParts(now, timeZone);
  const base = zonedTimeToUtc(p.year, p.month, p.day, p.hour, p.minute, timeZone);
  const add = p.minute < 30 ? 30 - p.minute : 60 - p.minute;
  return new Date(base.getTime() + add * 60 * 1000);
}
