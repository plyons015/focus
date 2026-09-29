export const PLAN_TZ = 'America/Los_Angeles';

export type ContextTag = 'chaplain' | 'founder' | 'personal';
export type TaskStatus = 'inbox' | 'today-now' | 'today-next' | 'week' | 'someday' | 'done';
export type TaskSource = 'manual' | 'email' | 'deeproots' | 'calendar';
export type CalendarProvider = 'zoho' | 'google';

export interface ExternalRef {
  system: 'deeproots' | 'calendar';
  kind: 'journal-day' | 'rhythm' | 'action-step' | 'event';
  id: string;
  planId?: string;
  stepId?: string;
  eventId?: string;
}

export interface CalendarLink {
  provider: CalendarProvider;
  calendarId: string;
  eventId: string;
  etag: string;
  /** When the task time and the event time last matched. */
  updatedAt: string;
}

export interface CompletionRequest {
  kind: 'rhythm' | 'action-step';
  eventId?: string;
  planId?: string;
  stepId?: string;
}

export interface Task {
  id: string;
  ownerId: string;
  title: string;
  why: string;
  context: ContextTag;
  status: TaskStatus;
  dueDate: string | null;
  projectId: string | null;
  source: TaskSource;
  note: string;
  createdAt: string;
  updatedAt: string;
  sourceUpdatedAt: string | null;
  externalRefs: ExternalRef[];
  calendarLinks: CalendarLink[];
  openUrl: string | null;
  sort: number;
  canComplete: boolean;
  completionRequest: CompletionRequest | null;
  /** Set when a home calendar should receive this task. The worker clears it. */
  calendarRequest: 'upsert' | 'delete' | null;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  context: ContextTag;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeBlock {
  id: string;
  ownerId: string;
  title: string;
  start: string;
  end: string;
  minutes: 15 | 30 | 60;
  createdAt: string;
  calendarLinks: CalendarLink[];
  calendarRequest: 'upsert' | 'delete' | null;
}

export interface CachedEvent {
  id: string;
  ownerId: string;
  provider: CalendarProvider;
  calendarId: string;
  eventId: string;
  title: string;
  start: string;
  end: string;
  etag: string;
  ownedByZigzag: boolean;
  updatedAt: string;
}

export interface Tombstone {
  externalId: string;
  sourceUpdatedAt: string;
}

export interface ProviderLink {
  status: 'connected' | 'off';
  calendarIds: string[];
  home: boolean;
  writeCalendarId: string;
  lastError: string | null;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accountsUrl: string;
  lastSyncedAt: string | null;
}

export interface Integrations {
  deeproots: {
    status: 'connected' | 'off';
    mcdillUid: string;
    host: string;
    lastError: string | null;
  };
  zoho: ProviderLink;
  google: ProviderLink;
}

export interface Snapshot {
  tasks: Task[];
  projects: Project[];
  timeBlocks: TimeBlock[];
  events: CachedEvent[];
  tombstones: Tombstone[];
  integrations: Integrations;
  lastRolloverDate: string | null;
  notices: import('./notices').NoticePrefs;
}

export function emptyIntegrations(): Integrations {
  const provider = (): ProviderLink => ({
    status: 'off',
    calendarIds: [],
    home: false,
    writeCalendarId: '',
    lastError: null,
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    accountsUrl: 'https://accounts.zoho.com',
    lastSyncedAt: null,
  });
  return {
    deeproots: { status: 'off', mcdillUid: '', host: '', lastError: null },
    zoho: provider(),
    google: provider(),
  };
}

export function emptySnapshot(): Snapshot {
  return {
    tasks: [],
    projects: [],
    timeBlocks: [],
    events: [],
    tombstones: [],
    integrations: emptyIntegrations(),
    lastRolloverDate: null,
    notices: { atTime: true, before15: true, before60: true, morningOf: true, eveningBefore: true },
  };
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}
