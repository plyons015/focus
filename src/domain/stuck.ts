import { makeNow, nextTasks, nowTask, park, swapNowWithNext } from './tasks';
import type { Task } from './types';

export type StuckKind = 'crashed' | 'frozen';

export type StuckChoice =
  | 'keep-and-recover'
  | 'park-and-recover'
  | 'park'
  | 'swap'
  | 'park-and-promote'
  | 'clear-now'
  | 'start-next'
  | 'recover-only'
  | 'open-triage';

export function stuckChoices(
  kind: StuckKind,
  input: { hasNow: boolean; hasNext: boolean; hasInbox: boolean },
): StuckChoice[] {
  if (kind === 'crashed') {
    return input.hasNow ? ['keep-and-recover', 'park-and-recover', 'park'] : ['recover-only'];
  }
  const choices: StuckChoice[] = [];
  if (input.hasNow && input.hasNext) choices.push('swap', 'park-and-promote', 'clear-now');
  else if (input.hasNow) choices.push('clear-now');
  else if (input.hasNext) choices.push('start-next');
  if (input.hasInbox) choices.push('open-triage');
  if (!input.hasNow) choices.push('recover-only');
  return choices;
}

export function applyStuckMove(
  tasks: Task[],
  choice: StuckChoice,
  nowIso: string,
): { tasks: Task[]; recover: boolean; openTriage: boolean } {
  const current = nowTask(tasks);
  const first = nextTasks(tasks)[0];
  if (choice === 'open-triage') return { tasks, recover: false, openTriage: true };
  if (choice === 'keep-and-recover' || choice === 'recover-only') return { tasks, recover: true, openTriage: false };
  if (choice === 'swap') return { tasks: swapNowWithNext(tasks, nowIso), recover: false, openTriage: false };
  if (choice === 'start-next' && first) {
    const moved = makeNow(tasks, first.id, nowIso);
    return { tasks: moved.type === 'ok' ? moved.tasks : tasks, recover: false, openTriage: false };
  }
  if ((choice === 'park' || choice === 'park-and-recover' || choice === 'clear-now') && current) {
    return { tasks: park(tasks, current.id, nowIso), recover: choice === 'park-and-recover', openTriage: false };
  }
  if (choice === 'park-and-promote' && current && first) {
    const parked = park(tasks, current.id, nowIso);
    const moved = makeNow(parked, first.id, nowIso);
    return { tasks: moved.type === 'ok' ? moved.tasks : parked, recover: false, openTriage: false };
  }
  return { tasks, recover: false, openTriage: false };
}
