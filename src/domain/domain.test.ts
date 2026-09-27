import { describe, expect, it } from 'vitest';
import { applyConflictChoice, canWriteEvent, homeTarget, linkStatus, zohoEventData, zohoStamp } from './calendar';
import { allCopyStrings, calmCopyViolations } from './copy';
import { deadlineRows, deadlineSummary, todayNotices } from './deadlines';
import { parseEmail, parseShare } from './email';
import { applyOpenWork } from './openWork';
import { createRecoveryBlock } from './recovery';
import {
  createTask,
  fileToToday,
  inboxTasks,
  makeNow,
  markDone,
  nextTasks,
  nowTask,
  park,
  resolveSwap,
  rollover,
  setWhy,
  skipInbox,
  swapNowWithNext,
  tick,
} from './tasks';
import { articleText } from '../help/articles';
import { applyStuckMove, stuckChoices } from './stuck';
import { dateKey, nextHalfHour } from './time';
import { emptySnapshot, type CachedEvent, type Task } from './types';

const NOW = '2026-09-27T22:10:00.000Z';
const OWNER = 'local';

function task(partial: Partial<Task> & { title: string }): Task {
  return {
    ...createTask({ ownerId: OWNER, title: partial.title, nowIso: partial.createdAt ?? NOW }),
    ...partial,
  };
}

describe('today limits', () => {
  it('puts the first Today item in Now and leaves Why empty', () => {
    const item = task({ title: 'Write the note' });
    const filed = fileToToday([item], item.id, NOW);
    expect(filed.type).toBe('filed');
    if (filed.type !== 'filed') return;
    expect(filed.becameNow).toBe(true);
    expect(nowTask(filed.tasks)?.why).toBe('');
    expect(nowTask(filed.tasks)?.title).toBe('Write the note');
  });

  it('promotes a Next item and moves the old Now into Next', () => {
    const current = task({ title: 'Now', status: 'today-now' });
    const upcoming = task({ title: 'Next', status: 'today-next', sort: 1 });
    const result = makeNow([current, upcoming], upcoming.id, NOW);
    expect(result.type).toBe('ok');
    if (result.type !== 'ok') return;
    expect(nowTask(result.tasks)?.title).toBe('Next');
    expect(nextTasks(result.tasks).map((item) => item.title)).toEqual(['Now']);
  });

  it('asks before a third Next and can send the new item to This week', () => {
    const current = task({ title: 'Now', status: 'today-now' });
    const a = task({ title: 'A', status: 'today-next', sort: 1 });
    const b = task({ title: 'B', status: 'today-next', sort: 2 });
    const incoming = task({ title: 'C', status: 'inbox' });
    const filed = fileToToday([current, a, b, incoming], incoming.id, NOW);
    expect(filed.type).toBe('swap');
    if (filed.type !== 'swap') return;
    expect(filed.nextIds).toEqual([a.id, b.id]);
    const kept = resolveSwap(filed.tasks, incoming.id, { type: 'to-week' }, NOW);
    expect(kept.find((item) => item.id === incoming.id)?.status).toBe('week');
    expect(nextTasks(kept)).toHaveLength(2);
    const displaced = resolveSwap(filed.tasks, incoming.id, { type: 'displace', id: a.id }, NOW);
    expect(displaced.find((item) => item.id === a.id)?.status).toBe('week');
    expect(nextTasks(displaced).map((item) => item.title)).toContain('C');
  });

  it('swaps the first Next up without adding a second Now', () => {
    const current = task({ title: 'Now', status: 'today-now' });
    const first = task({ title: 'First', status: 'today-next', sort: 1 });
    const second = task({ title: 'Second', status: 'today-next', sort: 2 });
    const swapped = swapNowWithNext([current, first, second], NOW);
    expect(nowTask(swapped)?.title).toBe('First');
    expect(nextTasks(swapped).map((item) => item.title)).toEqual(['Now', 'Second']);
  });

  it('does not auto-promote Next when Now is done or parked', () => {
    const current = task({ title: 'Now', status: 'today-now' });
    const upcoming = task({ title: 'Next', status: 'today-next', sort: 1 });
    const done = markDone([current, upcoming], current.id, NOW);
    expect(done.completed).toBe(true);
    expect(nowTask(done.tasks)).toBeNull();
    expect(nextTasks(done.tasks).map((item) => item.title)).toEqual(['Next']);
    const parked = park([current, upcoming], current.id, NOW);
    expect(nowTask(parked)).toBeNull();
    expect(parked.find((item) => item.id === current.id)?.status).toBe('week');
  });

  it('refuses Done on a journal day', () => {
    const journal = task({ title: 'Day 3', status: 'today-now', canComplete: false });
    const result = markDone([journal], journal.id, NOW);
    expect(result.completed).toBe(false);
    expect(result.tasks[0]?.status).toBe('today-now');
  });

  it('records a Deep Roots check-off when Done is allowed', () => {
    const step = task({
      title: 'Call her',
      status: 'today-now',
      source: 'deeproots',
      externalRefs: [{ system: 'deeproots', kind: 'action-step', id: 'action-step:p:s', planId: 'p', stepId: 's' }],
    });
    const result = markDone([step], step.id, NOW);
    expect(result.tasks[0]?.completionRequest).toEqual({ kind: 'action-step', planId: 'p', stepId: 's' });
  });
});

describe('rollover and time', () => {
  it('moves only Now and Next at the end of the day', () => {
    const items = [
      task({ title: 'Now', status: 'today-now' }),
      task({ title: 'Next', status: 'today-next' }),
      task({ title: 'Week', status: 'week' }),
      task({ title: 'Inbox', status: 'inbox' }),
    ];
    const sameDay = rollover(items, '2026-09-27', '2026-09-27', NOW);
    expect(sameDay.changed).toBe(false);
    expect(nowTask(sameDay.tasks)?.title).toBe('Now');
    const first = rollover(items, '2026-09-27', null, NOW);
    expect(nowTask(first.tasks)?.title).toBe('Now');
    const nextDay = rollover(items, '2026-09-28', '2026-09-27', NOW);
    expect(nextDay.tasks.find((item) => item.title === 'Now')?.status).toBe('week');
    expect(nextDay.tasks.find((item) => item.title === 'Next')?.status).toBe('week');
    expect(nextDay.tasks.find((item) => item.title === 'Inbox')?.status).toBe('inbox');
  });

  it('does not change tasks when the clock ticks', () => {
    const items = [task({ title: 'Now', status: 'today-now' })];
    expect(tick(items)).toBe(items);
  });

  it('offers a recovery block on the next half hour', () => {
    const now = new Date('2026-09-27T22:10:00.000Z');
    const block = createRecoveryBlock(OWNER, now, 30);
    expect(dateKey(new Date(block.start))).toBe('2026-09-27');
    expect(new Date(block.end).getTime() - new Date(block.start).getTime()).toBe(30 * 60 * 1000);
    expect(nextHalfHour(now).toISOString()).toBe(block.start);
    expect(createRecoveryBlock(OWNER, now, 15).minutes).toBe(15);
  });
});

describe('triage helpers', () => {
  it('skips an inbox card to the back', () => {
    const first = task({ title: 'First', createdAt: '2026-09-27T01:00:00.000Z' });
    const second = task({ title: 'Second', createdAt: '2026-09-27T02:00:00.000Z' });
    const skipped = skipInbox([first, second], first.id, NOW);
    expect(inboxTasks(skipped).map((item) => item.title)).toEqual(['Second', 'First']);
  });
});

describe('email', () => {
  it('uses the first line as the title', () => {
    const parsed = parseEmail('Sunday visit\nShe asked for a call.\nBring the book.');
    expect(parsed).toEqual({ title: 'Sunday visit', note: 'She asked for a call.\nBring the book.' });
    expect(parseShare({ title: 'Subject', texts: ['Hello there'] })).toEqual({ title: 'Subject', note: 'Hello there' });
  });
});

describe('copy and deadlines', () => {
  it('keeps the voice free of shame and cheerleading', () => {
    expect(calmCopyViolations(allCopyStrings())).toEqual([]);
    expect(calmCopyViolations(articleText())).toEqual([]);
    expect(articleText()[0]).toBe('Get Started');
  });

  it('orders the next 7 days and does not say overdue', () => {
    const now = new Date('2026-09-27T22:10:00.000Z');
    const rows = deadlineRows({
      now,
      tasks: [
        task({ title: 'Later', dueDate: '2026-09-29T18:00:00.000Z', status: 'week' }),
        task({ title: 'Soon', dueDate: '2026-09-28T16:00:00.000Z', status: 'week' }),
        task({ title: 'Old', dueDate: '2026-09-20T16:00:00.000Z', status: 'week' }),
        task({ title: 'Finished', dueDate: '2026-09-28T12:00:00.000Z', status: 'done' }),
      ],
      blocks: [
        {
          id: 'b',
          ownerId: OWNER,
          title: 'Recovery',
          start: '2026-09-27T23:00:00.000Z',
          end: '2026-09-27T23:30:00.000Z',
          minutes: 30,
          createdAt: NOW,
          calendarLinks: [],
          calendarRequest: null,
        },
      ],
      events: [
        {
          id: 'g1',
          ownerId: OWNER,
          provider: 'google',
          calendarId: 'primary',
          eventId: 'g-event',
          title: 'Staff meeting',
          start: '2026-09-28T17:00:00.000Z',
          end: '2026-09-28T18:00:00.000Z',
          etag: '1',
          ownedByZigzag: false,
          updatedAt: NOW,
        },
      ],
    });
    expect(rows.map((row) => row.title)).toEqual(['Recovery', 'Soon', 'Staff meeting', 'Later']);
    expect(rows.map((row) => row.label)).toEqual(['Recovery', 'Task', 'Google', 'Task']);
    const summary = deadlineSummary(now, rows);
    expect(summary.toLowerCase()).not.toContain('overdue');
    expect(summary).toContain('·');
    expect(todayNotices()).toEqual([]);
  });
});

describe('deep roots merge', () => {
  it('upserts once, respects tombstones, and does not promote Next', () => {
    const base = emptySnapshot();
    const item = {
      id: 'journal-day:plan:1:2',
      refs: [{ system: 'deeproots' as const, kind: 'journal-day' as const, id: 'journal-day:plan:1:2', planId: 'plan' }],
      title: 'Psalms: Day 3',
      note: '',
      dueDate: null,
      openUrl: 'https://roots.example/journal/plan?day=3',
      canComplete: false,
      updatedAt: '2026-09-27T00:00:00.000Z',
    };
    const once = applyOpenWork(base, { items: [item] }, NOW, OWNER);
    const twice = applyOpenWork(once, { items: [{ ...item, title: 'Psalms: Day 3 again' }] }, NOW, OWNER);
    expect(twice.tasks).toHaveLength(1);
    expect(twice.tasks[0]?.status).toBe('inbox');
    expect(twice.tasks[0]?.title).toBe('Psalms: Day 3 again');
    expect(twice.tasks[0]?.canComplete).toBe(false);

    const current = task({ title: 'Now', status: 'today-now' });
    const upcoming = task({ title: 'Next', status: 'today-next', sort: 1 });
    const open = applyOpenWork({ ...base, tasks: [current, upcoming] }, { items: [item] }, NOW, OWNER);
    const closed = applyOpenWork(open, { items: [], closedIds: [item.id] }, NOW, OWNER);
    expect(closed.tasks.find((entry) => entry.title.startsWith('Psalms'))?.status).toBe('done');
    expect(nowTask(closed.tasks)?.title).toBe('Now');
    expect(nextTasks(closed.tasks)).toHaveLength(1);

    const removed = applyOpenWork(
      { ...base, tombstones: [{ externalId: item.id, sourceUpdatedAt: item.updatedAt }] },
      { items: [item] },
      NOW,
      OWNER,
    );
    expect(removed.tasks).toHaveLength(0);
    const revived = applyOpenWork(
      { ...base, tombstones: [{ externalId: item.id, sourceUpdatedAt: '2026-09-01T00:00:00.000Z' }] },
      { items: [{ ...item, updatedAt: '2026-09-27T00:00:00.000Z' }] },
      NOW,
      OWNER,
    );
    expect(revived.tasks).toHaveLength(1);
    expect(revived.tombstones).toHaveLength(0);
  });
});

describe('calendar links', () => {
  it('writes only ZigZag-owned events and waits when both sides moved', () => {
    const link = { provider: 'zoho' as const, calendarId: 'cal', eventId: 'e1', etag: '1', updatedAt: '2026-09-27T12:00:00.000Z' };
    const event: CachedEvent = {
      id: 'zoho_e1',
      ownerId: OWNER,
      provider: 'zoho',
      calendarId: 'cal',
      eventId: 'e1',
      title: 'Block',
      start: '2026-09-28T18:00:00.000Z',
      end: '2026-09-28T19:00:00.000Z',
      etag: '2',
      ownedByZigzag: true,
      updatedAt: '2026-09-27T20:00:00.000Z',
    };
    expect(canWriteEvent(event)).toBe(true);
    expect(canWriteEvent({ ...event, ownedByZigzag: false })).toBe(false);
    expect(
      linkStatus({
        taskUpdatedAt: '2026-09-27T21:00:00.000Z',
        taskDue: '2026-09-28T19:00:00.000Z',
        link,
        event,
      }).type,
    ).toBe('conflict');
    const kept = applyConflictChoice(
      task({ title: 'Block', dueDate: '2026-09-28T19:00:00.000Z', calendarLinks: [link] }),
      'keep',
      event.start,
      NOW,
      event.etag,
    );
    expect(kept.dueDate).toBe('2026-09-28T19:00:00.000Z');
    expect(kept.calendarRequest).toBe('upsert');
    const used = applyConflictChoice(
      task({ title: 'Block', dueDate: '2026-09-28T19:00:00.000Z', calendarLinks: [link] }),
      'use',
      event.start,
      NOW,
      event.etag,
    );
    expect(used.dueDate).toBe(event.start);
    expect(used.calendarRequest).toBeNull();
    expect(linkStatus({ taskUpdatedAt: link.updatedAt, taskDue: event.start, link, event: null }).type).toBe('unlink');
    expect(homeTarget({ zoho: { status: 'off', home: true, writeCalendarId: 'cal' }, google: { status: 'off', home: false, writeCalendarId: '' } })).toBeNull();
  });

  it('stamps Zoho times in GMT inside the query payload', () => {
    const start = new Date('2026-09-28T17:00:00.000Z');
    const end = new Date('2026-09-28T17:30:00.000Z');
    expect(zohoStamp(start)).toBe('20260928T170000Z');
    const payload = JSON.parse(zohoEventData({ title: 'Recovery', start, end, busy: true })) as { title: string; transparency: number };
    expect(payload.title).toBe('Recovery');
    expect(payload.transparency).toBe(0);
  });
});

describe('stuck', () => {
  it('offers a recovery path after a crash and does not move Now until asked', () => {
    const current = task({ title: 'Now', status: 'today-now' });
    const upcoming = task({ title: 'Next', status: 'today-next', sort: 1 });
    expect(stuckChoices('crashed', { hasNow: true, hasNext: true, hasInbox: false })).toEqual([
      'keep-and-recover',
      'park-and-recover',
      'park',
    ]);
    const kept = applyStuckMove([current, upcoming], 'keep-and-recover', NOW);
    expect(kept.recover).toBe(true);
    expect(nowTask(kept.tasks)?.title).toBe('Now');
    const promoted = applyStuckMove([current, upcoming], 'park-and-promote', NOW);
    expect(nowTask(promoted.tasks)?.title).toBe('Next');
    expect(promoted.tasks.find((item) => item.title === 'Now')?.status).toBe('week');
    expect(nextTasks(promoted.tasks)).toHaveLength(0);
  });

  it('offers a way through a freeze without adding a second Now', () => {
    expect(stuckChoices('frozen', { hasNow: true, hasNext: true, hasInbox: true })).toEqual([
      'swap',
      'park-and-promote',
      'clear-now',
      'open-triage',
    ]);
    expect(stuckChoices('frozen', { hasNow: false, hasNext: false, hasInbox: false })).toEqual(['recover-only']);
    const current = task({ title: 'Now', status: 'today-now' });
    const cleared = applyStuckMove([current], 'clear-now', NOW);
    expect(nowTask(cleared.tasks)).toBeNull();
    expect(cleared.tasks[0]?.status).toBe('week');
  });
});

describe('why', () => {
  it('can stay blank', () => {
    const item = task({ title: 'Now', status: 'today-now', why: '' });
    expect(setWhy([item], item.id, '', NOW)[0]?.why).toBe('');
  });
});
