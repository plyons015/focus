export interface HelpBlock {
  type: 'p' | 'h' | 'li';
  text?: string;
  items?: string[];
}

export interface HelpArticle {
  id: string;
  title: string;
  blocks: HelpBlock[];
}

export const articles: HelpArticle[] = [
  {
    id: 'get-started',
    title: 'Get Started',
    blocks: [
      { type: 'p', text: 'ZigZag is one sentence: capture, triage, do the one Now.' },
      { type: 'h', text: 'The first time you open it' },
      {
        type: 'li',
        items: [
          'You land on Today. The line at the top is the time.',
          'Type one thing in Add something and press Enter. It goes to the inbox. You do not file it yet.',
          'Tap Inbox when you want to sort. One card. Today, This week, Someday, or Delete.',
          'Today holds one Now card and at most two Next cards. That is the whole work surface.',
        ],
      },
      { type: 'h', text: 'During the day' },
      {
        type: 'p',
        text: 'Stay on Today. Done finishes the Now card. Park sends it to This week. Swap trades it with the first Next card. Why this? can stay blank. The app does not write it for you, and a clock tick does not take Now away.',
      },
      { type: 'h', text: 'How this fits you' },
      {
        type: 'p',
        text: 'These are your self-scores, not a diagnosis. Attention is 23 out of 24, the loudest signal. Sensory is 8 out of 12. Social communication is 9 out of 15. Emotions and energy are 10 out of 15. Strengths are 12 out of 12.',
      },
      {
        type: 'p',
        text: 'Attention is time blindness, interest, admin drain, and hyperfocus then a crash. The top line names the time and the next real thing. It is not a countdown. Capture first and sort later, so filing is not part of catching the thought. One Now is the work. Leave Why blank when you have no sentence yet.',
      },
      {
        type: 'p',
        text: 'Sensory load here is crowding and the need to recover, not smell, texture, or a special light setting. Today is one column. The calendar opens into a short list, not a grid. Light and dark follow the phone.',
      },
      {
        type: 'p',
        text: 'You prefer a direct line over small talk. Buttons name the action. Notes stay short. There is no mood question.',
      },
      {
        type: 'p',
        text: 'Emotion runs hot, and a correction can land hard. Park and Delete can be undone for a few seconds. The app does not score the day or tell you that you fell short. I\'m stuck offers a next move. It is not a verdict.',
      },
      {
        type: 'p',
        text: 'Strengths landed full marks: care for what gets overlooked, systems, sincerity, and persistence when it matters. Someday is a real list. Why is your sentence. Now stays until you tap Done, Park, Swap, or I\'m stuck.',
      },
      { type: 'h', text: 'When the day stops' },
      {
        type: 'p',
        text: 'Tap I\'m stuck on Today. Choose I crashed or I\'m frozen. Then pick one move. Close leaves everything where it is.',
      },
    ],
  },
  {
    id: 'when-it-stops',
    title: 'When you crash or freeze',
    blocks: [
      {
        type: 'p',
        text: 'A crash is the drop after a long focus. Frozen is sitting in front of Now and not moving. Both use the same button: I\'m stuck.',
      },
      { type: 'h', text: 'I crashed' },
      {
        type: 'li',
        items: [
          'Keep this and block recovery. Now stays, so you can return to the same card. Then pick 15, 30, or 60 minutes.',
          'Park this and block recovery. Now goes to This week, and you still get the recovery block.',
          'Park this. Now goes to This week. No recovery block unless you ask again.',
        ],
      },
      {
        type: 'p',
        text: 'If Now is already empty, the only crash move is Block recovery.',
      },
      { type: 'h', text: 'I\'m frozen' },
      {
        type: 'li',
        items: [
          'Swap with Next. The first Next card becomes Now. The old Now becomes Next.',
          'Park this and start the first Next. The old Now goes to This week.',
          'Send Now to This week. Now is left empty on purpose. Next does not jump up by itself.',
          'Start the first Next, when Now is already empty.',
          'Sort the inbox, when cards are waiting there.',
          'Block recovery, when nothing is sitting in Now.',
        ],
      },
      {
        type: 'p',
        text: 'Ignoring the recovery line creates nothing. The block starts at the next half hour.',
      },
    ],
  },
  {
    id: 'connect-deep-roots',
    title: 'Connect Deep Roots',
    blocks: [
      { type: 'p', text: 'Deep Roots cards land in the inbox. ZigZag stores a title, a date, and a link. Journal writing stays in Deep Roots. Today works before this is connected.' },
      { type: 'h', text: 'In Settings' },
      {
        type: 'li',
        items: [
          'Open Settings, then Connect Deep Roots.',
          'Paste your Deep Roots user id. That is the User UID on the journal account, in Firebase Authentication for the Deep Roots project. It is not the ZigZag user id.',
          'Paste the Deep Roots address: the journal site, with https://, and no page path after the host.',
          'Tap Save. Connected means an id is saved.',
        ],
      },
      { type: 'h', text: 'So cards arrive on their own' },
      {
        type: 'p',
        text: 'The sync runs in the Deep Roots functions. They need your Deep Roots user id, your ZigZag user id, the journal address, and a service account that can write the ZigZag Planner project. Leave those empty and the worker does nothing.',
      },
      {
        type: 'p',
        text: 'Until that worker is running, paste a snapshot into Import a Deep Roots snapshot and tap Save. The JSON needs an items list. Those cards go to triage.',
      },
      { type: 'h', text: 'What shows up' },
      {
        type: 'p',
        text: 'The current unfinished day of each active journal plan opens in Deep Roots and has no Done button. Today\'s prayer, reading, study, and cohort check-offs, and unfinished action steps, can be marked done here once the worker is sending. The future rhythm and earlier days stay out.',
      },
    ],
  },
  {
    id: 'connect-zoho',
    title: 'Connect Zoho',
    blocks: [
      { type: 'p', text: 'Mail share and the calendar are two connections. In Zoho Mail, share the message as plain text and choose ZigZag Planner. The first line is the title. Settings has no mail row.' },
      { type: 'h', text: 'Calendar, one time' },
      {
        type: 'li',
        items: [
          'Open the Zoho API Console and create a Self Client.',
          'Scopes: ZohoCalendar.calendar.READ and ZohoCalendar.event.ALL.',
          'Generate a code, exchange it for a refresh token, and store the client id, client secret, and refresh token on the Deep Roots functions.',
          'The token is not pasted into ZigZag.',
        ],
      },
      { type: 'h', text: 'In Settings' },
      {
        type: 'p',
        text: 'Under Zoho, paste the calendar id you want new blocks written to, then Save. Connected means the id is saved. That calendar becomes home. If Google was home, it no longer is. Events show up after the next sync. If Zoho does not answer, your tasks are still here.',
      },
    ],
  },
  {
    id: 'connect-google-calendar',
    title: 'Connect Google Calendar',
    blocks: [
      { type: 'p', text: 'This is the calendar. Sign in with Google is the login, and it is a different note.' },
      { type: 'h', text: 'One time' },
      {
        type: 'li',
        items: [
          'Create an OAuth client in a Google Cloud project you control. The ZigZag Planner project can hold it.',
          'Scopes: calendar.calendarlist.readonly and calendar.events.',
          'Keep the refresh token and store the client id, client secret, and refresh token on the Deep Roots functions.',
          'Optional calendar ids: primary is the main calendar.',
        ],
      },
      {
        type: 'p',
        text: 'If the consent screen stays in Testing, Google expires that refresh token after 7 days. Settings can say Google didn\'t answer. Your tasks are still here. Mint a new token, or publish the consent screen for your account only.',
      },
      { type: 'h', text: 'In Settings' },
      {
        type: 'p',
        text: 'Under Google, paste the calendar id and tap Save. Connected means the id is saved. This calendar becomes home, and Zoho is no longer home. Put on calendar and recovery blocks write here after the next sync.',
      },
    ],
  },
  {
    id: 'sign-in-with-google',
    title: 'Sign in with Google',
    blocks: [
      { type: 'p', text: 'Sign in with Google is on the sign-in screen, before Today. It is not a row inside Settings. After you are in, Settings shows Sign out.' },
      { type: 'p', text: 'Use the same account on the phone and on the computer. That is what syncs the tasks.' },
      { type: 'h', text: 'On the computer' },
      {
        type: 'li',
        items: [
          'Open the ZigZag website.',
          'Tap Sign in with Google and pick the account you want on both devices.',
          'Create account with email and password is the other way in. Use that same email on the phone.',
        ],
      },
      { type: 'h', text: 'On the phone' },
      {
        type: 'p',
        text: 'The Google window often does not open in the installed app. The button then says Google didn\'t open. Use email and password on the phone. Create that email account on the computer first if it does not exist yet.',
      },
      { type: 'h', text: 'What is already in place' },
      {
        type: 'p',
        text: 'The ZigZag Planner project has email sign-in and Google sign-in turned on. The phone app id is app.zigzag.planner, and the debug certificate from this computer is registered. The sign-in screen opens on localhost, and on the zigzag-planner-plyons015 web and firebaseapp hosts.',
      },
      {
        type: 'p',
        text: 'If the computer button does not open Google, the consent screen must allow your account. While that screen is in Testing, add your account as a test user, or publish the screen for your account only. Use this device only stays off the sync.',
      },
    ],
  },
  {
    id: 'today',
    title: 'Today',
    blocks: [
      { type: 'p', text: 'Today is the screen you live on. Top to bottom: the time line, one Now, up to two Next, and Add something.' },
      { type: 'p', text: 'Done, Park, and Swap do not ask for a reason. Make this Now on a Next card moves it up and puts the old Now in its place.' },
      { type: 'p', text: 'If a third item tries to join Next, ZigZag asks which one moves to This week. You can also send the new one to This week.' },
      { type: 'p', text: 'The next day, anything still in Now or Next moves to This week. There is no count.' },
    ],
  },
  {
    id: 'capture',
    title: 'Capture',
    blocks: [
      { type: 'p', text: 'Add something, then Enter. The field clears. The item waits in the inbox.' },
      { type: 'p', text: 'On the phone, share plain text from Zoho Mail to ZigZag Planner. The first line is the title. The rest is the note.' },
      { type: 'p', text: 'On a computer, c or Ctrl+K focuses the field when you are not already typing.' },
    ],
  },
  {
    id: 'triage',
    title: 'Triage',
    blocks: [
      { type: 'p', text: 'Open the inbox from Today. One card at a time. The line says how many are left.' },
      { type: 'p', text: 'Today fills Now first, then Next. This week and Someday hold the card. Delete can be undone for a few seconds. Skip puts the card at the back.' },
      { type: 'p', text: 'On the first open of a day, triage shows itself if the inbox has anything. Back to Today dismisses it until tomorrow.' },
    ],
  },
  {
    id: 'lists',
    title: 'This week, Someday, and projects',
    blocks: [
      { type: 'p', text: 'This week is where Park lands, and where unfinished Now and Next cards go overnight.' },
      { type: 'p', text: 'Someday is a real list. Bring a card back with Today or Make this Now when you want it.' },
      { type: 'p', text: 'A project is a name, a context, an optional note, and the tasks you attach from Details. There is no chart.' },
    ],
  },
  {
    id: 'time',
    title: 'Time and recovery',
    blocks: [
      { type: 'p', text: 'The top line is the clock, in Pacific time, plus the next dated thing in the coming week. Tap it for the list. Rows say Task, Recovery, Zoho, or Google.' },
      { type: 'p', text: 'A meeting is not a task until you tap Add to inbox. A due date is set in Details. It is not labeled late.' },
      { type: 'p', text: 'After Done or Park, Block recovery? can be ignored. 15, 30, or 60 minutes, starting at the next half hour.' },
    ],
  },
  {
    id: 'deeproots',
    title: 'Deep Roots',
    blocks: [
      { type: 'p', text: 'ZigZag can show work that still needs you in Deep Roots Journal. It copies titles, dates, and a link. It does not copy journal writing.' },
      { type: 'p', text: 'New cards land in the inbox. A journal day has Open in Deep Roots and no Done button. Prayer, reading, study, cohort, and action steps can be marked done here once the connection is sending.' },
      { type: 'p', text: 'Connect it in Settings when you want. Today does not ask you to finish that.' },
    ],
  },
  {
    id: 'calendars',
    title: 'Calendars',
    blocks: [
      { type: 'p', text: 'Zoho and Google show the next seven days. ZigZag writes only the events it created: Put on calendar, and a recovery block after a home calendar is saved.' },
      { type: 'p', text: 'If both the task and the event moved, Today says Calendar time differs. Keep task time, or Use calendar time. Neither is pre-selected.' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings and this phone',
    blocks: [
      { type: 'p', text: 'Settings holds Deep Roots, Zoho, and Google. Not connected means that row is off. Today still works.' },
      { type: 'p', text: 'With no sign-in, tasks stay on this device. Share from Zoho Mail lands in the inbox.' },
    ],
  },
];

export function articleText(list: HelpArticle[] = articles): string[] {
  return list.flatMap((article) => [
    article.title,
    ...article.blocks.flatMap((block) => (block.type === 'li' ? block.items ?? [] : [block.text ?? ''])),
  ]);
}
