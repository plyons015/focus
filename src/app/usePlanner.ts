import { useCallback, useEffect, useRef, useState } from 'react';
import { homeTarget } from '../domain/calendar';
import { applyStuckMove, stuckChoices, type StuckChoice, type StuckKind } from '../domain/stuck';
import { applyNotices } from '../sync/notices';
import { pullZohoEvents, replaceProviderEvents } from '../sync/zoho';
import { deadlineRows, deadlineSummary, splitByDay } from '../domain/deadlines';
import { defaultNotices, type NoticePrefs } from '../domain/notices';
import { applyOpenWork, withTombstones, type OpenWorkUpdate } from '../domain/openWork';
import { createRecoveryBlock } from '../domain/recovery';
import {
  createTask,
  inboxTasks,
  markDone,
  moveTo,
  nextTasks,
  nowTask,
  openSlot,
  park,
  placeTask,
  removeTask,
  requestCalendar,
  resolveSwap,
  rollover,
  sendRestToSomeday,
  setContext,
  setDue,
  setProject,
  setWhy,
  swapNowWithNext,
  tasksIn,
  type Slot,
} from '../domain/tasks';
import { dateKey } from '../domain/time';
import {
  createId,
  emptySnapshot,
  type ContextTag,
  type Project,
  type ProviderLink,
  type Snapshot,
  type Task,
} from '../domain/types';
import type { DataStore } from '../data/store';
import { listenForShares } from '../sync/share';

export type ViewName = 'today' | 'week' | 'someday' | 'projects' | 'project' | 'settings' | 'deadlines' | 'help';

export interface SwapAsk {
  incomingId: string;
  nextIds: string[];
}

function demoSnapshot(ownerId: string): Snapshot {
  const now = new Date().toISOString();
  const base = emptySnapshot();
  const make = (title: string, status: Task['status'], sort = 0): Task => ({
    ...createTask({ ownerId, title, nowIso: now, status }),
    sort,
  });
  base.tasks = [
    make('Write the Sunday note', 'today-now'),
    make('Call the family', 'today-next', 1),
    make('Review the founder list', 'today-next', 2),
    make('Reply to the shared email', 'inbox'),
  ];
  base.lastRolloverDate = dateKey(new Date());
  return base;
}

function demoSearch(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export function usePlanner(store: DataStore | null, ownerId = 'local') {
  const initialDemo = demoSearch();
  const demoOn = initialDemo.get('demo') === '1' || initialDemo.get('demo') === 'swap';
  const [boot] = useState(() => {
    const seeded = demoOn ? demoSnapshot(ownerId) : null;
    let opening: SwapAsk | null = null;
    if (seeded && initialDemo.get('demo') === 'swap') {
      const incoming = seeded.tasks.find((item) => item.status === 'inbox');
      const upcoming = nextTasks(seeded.tasks);
      if (incoming && upcoming.length >= 2) {
        opening = { incomingId: incoming.id, nextIds: upcoming.map((item) => item.id) };
      }
    }
    return { seeded, opening };
  });
  const [snap, setSnap] = useState<Snapshot>(boot.seeded ?? emptySnapshot());
  const [ready, setReady] = useState(demoOn);
  const [view, setView] = useState<ViewName>('today');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [swap, setSwap] = useState<SwapAsk | null>(boot.opening);
  const [recoveryFor, setRecoveryFor] = useState(false);
  const [undo, setUndo] = useState<Snapshot | null>(null);
  const [blockAsk, setBlockAsk] = useState<string | null>(null);
  const [stuck, setStuck] = useState<null | 'choose' | StuckKind>(null);
  const snapRef = useRef(snap);
  snapRef.current = snap;
  const undoTimer = useRef<number | null>(null);
  const zohoSynced = useRef(false);

  const persist = useCallback(
    (next: Snapshot) => {
      snapRef.current = next;
      setSnap(next);
      if (store) void store.replace(next);
    },
    [store],
  );

  const commit = useCallback(
    (recipe: (current: Snapshot) => Snapshot, remember = false) => {
      const current = snapRef.current;
      if (remember) {
        setUndo(current);
        if (undoTimer.current) window.clearTimeout(undoTimer.current);
        undoTimer.current = window.setTimeout(() => setUndo(null), 5000);
      }
      persist(recipe(current));
    },
    [persist],
  );

  const runZohoSync = useCallback(
    async (override?: Partial<ProviderLink>) => {
      const link = { ...snapRef.current.integrations.zoho, ...override };
      const result = await pullZohoEvents(link, ownerId);
      const nowIso = new Date().toISOString();
      commit((current) => ({
        ...current,
        events: result.error ? current.events : replaceProviderEvents(current.events, 'zoho', result.events),
        integrations: {
          ...current.integrations,
          google: { ...current.integrations.google, home: false },
          zoho: {
            ...current.integrations.zoho,
            ...override,
            lastError: result.error,
            lastSyncedAt: result.error ? current.integrations.zoho.lastSyncedAt ?? null : nowIso,
          },
        },
      }));
    },
    [commit, ownerId],
  );

  useEffect(() => {
    if (!ready || zohoSynced.current) return;
    const link = snapRef.current.integrations.zoho;
    if (!link?.clientId || !link.clientSecret || !link.refreshToken || !link.writeCalendarId) return;
    zohoSynced.current = true;
    void runZohoSync();
  }, [ready, runZohoSync]);

  useEffect(() => {
    if (!store) return;
    let cancel = false;
    void store.load().then((loaded) => {
      if (cancel) return;
      const params = new URLSearchParams(window.location.search);
      const wantsDemo = params.get('demo') === '1' || params.get('demo') === 'swap';
      let initial = loaded;
      if (wantsDemo && loaded.tasks.length === 0) {
        initial = snapRef.current.tasks.length > 0 ? snapRef.current : demoSnapshot(ownerId);
      }
      const now = new Date();
      const rolled = rollover(initial.tasks, dateKey(now), initial.lastRolloverDate, now.toISOString());
      const filled = { ...initial, notices: { ...defaultNotices(), ...initial.notices } };
      const next = rolled.changed ? { ...filled, tasks: rolled.tasks, lastRolloverDate: rolled.lastKey } : filled;
      persist(next);
      setReady(true);
      if (params.get('demo') === 'swap') {
        const incoming = next.tasks.find((item) => item.status === 'inbox');
        const upcoming = nextTasks(next.tasks);
        if (incoming && upcoming.length >= 2) setSwap({ incomingId: incoming.id, nextIds: upcoming.map((item) => item.id) });
      }
    });
    const off = store.subscribe((next) => {
      if (cancel) return;
      setSnap(next);
      snapRef.current = next;
    });
    return () => {
      cancel = true;
      off();
    };
  }, [store, persist]);

  useEffect(() => {
    let stop = () => {};
    void listenForShares((title, note) => {
      const nowIso = new Date().toISOString();
      commit((current) => ({
        ...current,
        tasks: [...current.tasks, createTask({ ownerId, title, note, nowIso, source: 'email' })],
      }));
      setView('today');
    }).then((dispose) => {
      stop = dispose;
    });
    return () => stop();
  }, [commit]);

  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);
  const allRows = deadlineRows({ tasks: snap.tasks, blocks: snap.timeBlocks, events: snap.events, now: clock });
  const parts = splitByDay(allRows, clock);
  const rows = parts.today;
  const weekRows = parts.later;
  const summary = deadlineSummary(clock, rows);
  const notices = { ...defaultNotices(), ...snap.notices };
  const noticeKey = `${allRows.map((row) => `${row.id}@${row.at}@${row.title}`).join('|')}|${Object.values(notices).join(',')}`;

  useEffect(() => {
    if (!ready) return;
    void applyNotices(allRows, notices).catch(() => undefined);
  }, [ready, noticeKey]);
  const home = homeTarget(snap.integrations);

  const capture = (title: string, note = '', source: Task['source'] = 'manual') => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const nowIso = new Date().toISOString();
    commit((current) => ({
      ...current,
      tasks: [...current.tasks, createTask({ ownerId, title: trimmed, note, nowIso, source })],
    }));
  };

  const add = (title: string, slot: Slot) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const nowIso = new Date().toISOString();
    const task = createTask({ ownerId, title: trimmed, nowIso });
    commit((current) => ({
      ...current,
      tasks: placeTask([...current.tasks, task], task.id, slot, nowIso),
    }), true);
  };

  const afterLeave = () => setRecoveryFor(true);

  const chooseToday = (taskId: string) => {
    commit((current) => ({ ...current, tasks: placeTask(current.tasks, taskId, 'today', new Date().toISOString()) }));
  };

  return {
    ready,
    snap,
    view,
    projectId,
    swap,
    recoveryFor,
    canUndo: undo != null,
    blockAsk,
    rows,
    weekRows,
    summary,
    home,
    now: nowTask(snap.tasks),
    next: nextTasks(snap.tasks),
    inbox: inboxTasks(snap.tasks),
    week: tasksIn(snap.tasks, 'week'),
    someday: tasksIn(snap.tasks, 'someday'),
    openToday: () => setView('today'),
    openWeek: () => setView('week'),
    openSomeday: () => setView('someday'),
    openProjects: () => setView('projects'),
    openProject: (id: string) => {
      setProjectId(id);
      setView('project');
    },
    openSettings: () => setView('settings'),
    openHelp: () => setView('help'),
    openDeadlines: () => setView('deadlines'),
    stuck,
    stuckChoices: stuck === 'crashed' || stuck === 'frozen'
      ? stuckChoices(stuck, {
          hasNow: nowTask(snap.tasks) != null,
          hasNext: nextTasks(snap.tasks).length > 0,
          hasInbox: inboxTasks(snap.tasks).length > 0,
        })
      : [],
    syncZoho: (override?: Partial<ProviderLink>) => runZohoSync(override),
    saveNotices: (next: NoticePrefs) => {
      commit((current) => ({ ...current, notices: next }));
    },
    openStuck: () => setStuck('choose'),
    closeStuck: () => setStuck(null),
    pickStuck: (kind: StuckKind) => setStuck(kind),
    applyStuck: (choice: StuckChoice) => {
      const nowIso = new Date().toISOString();
      const result = applyStuckMove(snapRef.current.tasks, choice, nowIso);
      setStuck(null);
      if (result.openTriage) setView('today');
      commit(() => ({ ...snapRef.current, tasks: result.tasks }));
      if (result.recover) setRecoveryFor(true);
    },
    capture,
    add,
    captureEmail: (rawTitle: string, note: string) => capture(rawTitle, note, 'email'),
    chooseToday,
    chooseWeek: (taskId: string) => {
      commit((current) => ({ ...current, tasks: moveTo(current.tasks, taskId, 'week', new Date().toISOString()) }), true);
    },
    chooseSomeday: (taskId: string) => {
      const found = snapRef.current.tasks.find((item) => item.id === taskId);
      if (found && found.calendarLinks.length > 0) {
        setBlockAsk(taskId);
        return;
      }
      commit((current) => ({ ...current, tasks: moveTo(current.tasks, taskId, 'someday', new Date().toISOString()) }), true);
    },
    confirmBlock: (remove: boolean) => {
      if (!blockAsk) return;
      const id = blockAsk;
      setBlockAsk(null);
      const nowIso = new Date().toISOString();
      commit((current) => ({
        ...current,
        tasks: (remove ? requestCalendar(current.tasks, id, 'delete', nowIso) : current.tasks).map((item) =>
          item.id === id ? { ...item, status: 'someday' as const, updatedAt: nowIso, calendarRequest: remove ? 'delete' as const : item.calendarRequest } : item,
        ),
      }), true);
    },
    chooseDelete: (taskId: string) => {
      commit((current) => {
        const removed = removeTask(current.tasks, taskId);
        return withTombstones({ ...current, tasks: removed.tasks }, removed.removed);
      }, true);
    },
    sendRest: (keepId: string) => {
      commit((current) => ({ ...current, tasks: sendRestToSomeday(current.tasks, keepId, new Date().toISOString()) }), true);
    },
    resolveSwap: (choice: { type: 'displace'; id: string } | { type: 'to-week' }) => {
      if (!swap) return;
      const incomingId = swap.incomingId;
      setSwap(null);
      commit((current) => ({ ...current, tasks: resolveSwap(current.tasks, incomingId, choice, new Date().toISOString()) }));
    },
    dismissSwap: () => setSwap(null),
    done: (taskId: string) => {
      const result = markDone(snapRef.current.tasks, taskId, new Date().toISOString());
      if (!result.completed) return;
      commit((current) => ({ ...current, tasks: markDone(current.tasks, taskId, new Date().toISOString()).tasks }));
      afterLeave();
    },
    park: (taskId: string) => {
      commit((current) => ({ ...current, tasks: park(current.tasks, taskId, new Date().toISOString()) }));
      afterLeave();
    },
    swapNow: () => {
      commit((current) => ({ ...current, tasks: swapNowWithNext(current.tasks, new Date().toISOString()) }));
    },
    makeNow: (taskId: string) => {
      commit((current) => ({ ...current, tasks: placeTask(current.tasks, taskId, 'now', new Date().toISOString()) }));
    },
    saveWhy: (taskId: string, why: string) => {
      commit((current) => ({ ...current, tasks: setWhy(current.tasks, taskId, why, new Date().toISOString()) }));
    },
    saveContext: (taskId: string, context: ContextTag) => {
      commit((current) => ({ ...current, tasks: setContext(current.tasks, taskId, context, new Date().toISOString()) }));
    },
    saveDue: (taskId: string, dueDate: string | null) => {
      commit((current) => ({ ...current, tasks: setDue(current.tasks, taskId, dueDate, new Date().toISOString()) }));
    },
    saveProject: (taskId: string, id: string | null) => {
      commit((current) => ({ ...current, tasks: setProject(current.tasks, taskId, id, new Date().toISOString()) }));
    },
    putOnCalendar: (taskId: string) => {
      if (!home) return;
      commit((current) => ({ ...current, tasks: requestCalendar(current.tasks, taskId, 'upsert', new Date().toISOString()) }));
    },
    addEvent: (eventId: string) => {
      const event = snapRef.current.events.find((item) => item.id === eventId);
      if (!event) return;
      const nowIso = new Date().toISOString();
      commit((current) => {
        const task = createTask({
          ownerId,
          title: event.title,
          nowIso,
          source: 'calendar',
          dueDate: event.start,
          externalRefs: [{ system: 'calendar', kind: 'event', id: event.id, eventId: event.eventId }],
        });
        return {
          ...current,
          tasks: placeTask([...current.tasks, task], task.id, openSlot(current.tasks), nowIso),
        };
      });
    },
    acceptRecovery: (minutes: 15 | 30 | 60) => {
      setRecoveryFor(false);
      const block = createRecoveryBlock(ownerId, new Date(), minutes);
      const linked = home ? { ...block, calendarRequest: 'upsert' as const } : block;
      commit((current) => ({ ...current, timeBlocks: [...current.timeBlocks, linked] }));
    },
    dismissRecovery: () => setRecoveryFor(false),
    undo: () => {
      if (!undo) return;
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
      persist(undo);
      setUndo(null);
    },
    saveProjectRecord: (input: { id?: string; name: string; context: ContextTag; note: string }) => {
      const nowIso = new Date().toISOString();
      commit((current) => {
        if (input.id) {
          return {
            ...current,
            projects: current.projects.map((project) =>
              project.id === input.id ? { ...project, name: input.name, context: input.context, note: input.note, updatedAt: nowIso } : project,
            ),
          };
        }
        const project: Project = {
          id: createId(),
          ownerId,
          name: input.name.trim(),
          context: input.context,
          note: input.note,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        return { ...current, projects: [...current.projects, project] };
      });
    },
    saveIntegrations: (next: Snapshot['integrations']) => {
      commit((current) => ({ ...current, integrations: next }));
    },
    importOpenWork: (update: OpenWorkUpdate) => {
      commit((current) => applyOpenWork(current, update, new Date().toISOString(), ownerId));
      setView('today');
    },
    keepConflict: (taskId: string, eventStart: string, etag: string) => {
      const nowIso = new Date().toISOString();
      commit((current) => ({
        ...current,
        tasks: current.tasks.map((item) =>
          item.id === taskId
            ? {
                ...item,
                updatedAt: nowIso,
                calendarRequest: 'upsert' as const,
                calendarLinks: item.calendarLinks.map((link) => ({ ...link, updatedAt: nowIso, etag })),
              }
            : item,
        ),
      }));
      void eventStart;
    },
    useConflict: (taskId: string, eventStart: string, etag: string) => {
      const nowIso = new Date().toISOString();
      commit((current) => ({
        ...current,
        tasks: current.tasks.map((item) =>
          item.id === taskId
            ? {
                ...item,
                dueDate: eventStart,
                updatedAt: nowIso,
                calendarRequest: null,
                calendarLinks: item.calendarLinks.map((link) => ({ ...link, updatedAt: nowIso, etag })),
              }
            : item,
        ),
      }));
    },
  };
}

export type Planner = ReturnType<typeof usePlanner>;
