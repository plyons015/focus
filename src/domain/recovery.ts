import { createId, type TimeBlock } from './types';
import { nextHalfHour } from './time';

export function createRecoveryBlock(ownerId: string, now: Date, minutes: 15 | 30 | 60, title = 'Recovery'): TimeBlock {
  const start = nextHalfHour(now);
  const end = new Date(start.getTime() + minutes * 60 * 1000);
  const nowIso = now.toISOString();
  return {
    id: createId(),
    ownerId,
    title: title.trim() || 'Recovery',
    start: start.toISOString(),
    end: end.toISOString(),
    minutes,
    createdAt: nowIso,
    calendarLinks: [],
    calendarRequest: null,
  };
}
