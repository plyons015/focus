export const copy = {
  appName: 'ZigZag Planner',
  appFullName: 'ZigZag Neurodivergent Planner',
  emptyNow: 'Nothing in Now.',
  inboxClear: 'Inbox clear. Today is set.',
  whyLabel: 'Why this?',
  blockRecovery: 'Block recovery?',
  recoveryTitle: 'Recovery',
  swapPrompt: 'Next already has two. Which one moves to This week?',
  sendNewToWeek: 'Send the new one to This week',
  calendarDiffers: 'Calendar time differs.',
  keepTaskTime: 'Keep task time',
  useCalendarTime: 'Use calendar time',
  zohoSilent: "Zoho didn't answer. Your tasks are still here.",
  googleSilent: "Google didn't answer. Your tasks are still here.",
  fromDeepRoots: 'From Deep Roots',
  openInDeepRoots: 'Open in Deep Roots',
  done: 'Done',
  park: 'Park',
  swap: 'Swap',
  makeNow: 'Make this Now',
  capturePlaceholder: 'Add something',
  today: 'Today',
  thisWeek: 'This week',
  someday: 'Someday',
  projects: 'Projects',
  settings: 'Settings',
  inboxLeft: (n: number) => `${n} left`,
  inboxLink: (n: number) => `Inbox (${n})`,
  sendRest: 'Send the rest to Someday',
  skip: 'Skip',
  delete: 'Delete',
  undo: 'Undo',
  connected: 'Connected',
  notConnected: 'Not connected',
  addToInbox: 'Add to inbox',
  putOnCalendar: 'Put on calendar',
  comingUp: 'Coming up',
  close: 'Close',
  chaplain: 'Chaplain',
  founder: 'Founder',
  personal: 'Personal',
  newProject: 'New project',
  projectName: 'Project name',
  note: 'Note',
  save: 'Save',
  back: 'Back',
  signIn: 'Sign in',
  signInMismatch: "That email and password didn't match.",
  googleClosed: "Google didn't open.",
  useThisDevice: 'Use this device only',
  email: 'Email',
  password: 'Password',
  createAccount: 'Create account',
  signInGoogle: 'Sign in with Google',
  connectDeepRoots: 'Connect Deep Roots',
  mcdillUid: 'Deep Roots user id',
  deepRootsHost: 'Deep Roots address',
  importSnapshot: 'Import a Deep Roots snapshot',
  homeCalendar: 'Home calendar',
  zoho: 'Zoho',
  google: 'Google',
  min15: '15 min',
  min30: '30 min',
  min60: '60 min',
  noProjects: 'No projects yet.',
  weekEmpty: 'Nothing this week.',
  somedayEmpty: 'Someday is empty.',
  due: 'Due date',
  clearDate: 'Clear date',
  captured: 'Captured.',
  removeBlock: 'Remove the block',
  keepBlock: 'Keep the block',
  details: 'Details',
  signOut: 'Sign out',
  deviceNote: 'Tasks stay on this device until you sign in.',
  settingsNote: 'Connections can wait. Today already works.',
  checkoffNote: 'Check-offs saved on this device send when Deep Roots is connected.',
  calendarNote: 'Events show up after the next sync.',
  projectTasks: 'Tasks',
  noTasks: 'No tasks in this project.',
  context: 'Context',
  dismissTriage: 'Back to Today',
  length: 'Length',
} as const;

const FORBIDDEN = [
  /\boverdue\b/i,
  /\bmissed\b/i,
  /\bstreaks?\b/i,
  /\bfailed\b/i,
  /\bforgot\b/i,
  /\bbehind\b/i,
  /don'?t forget/i,
  /you should/i,
  /great job/i,
  /keep it up/i,
  /\boops\b/i,
  /\bsorry\b/i,
];

export function allCopyStrings(): string[] {
  const out: string[] = [];
  for (const value of Object.values(copy)) {
    if (typeof value === 'string') out.push(value);
    else out.push(value(0), value(1), value(4), value(15));
  }
  return out;
}

export function calmCopyViolations(strings: string[]): string[] {
  const hits: string[] = [];
  for (const text of strings) {
    for (const rule of FORBIDDEN) {
      if (rule.test(text)) hits.push(text);
    }
  }
  return hits;
}
