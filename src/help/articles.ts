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
      { type: 'p', text: 'ZigZag is one sentence: add it where it goes, then do the one Now.' },
      { type: 'h', text: 'The first time you open it' },
      {
        type: 'li',
        items: [
          'You land on Today. The line at the top is the time.',
          'Type one thing in Add something. Enter puts it in the open spot: Now if Now is empty, Today if Next has room, or This week when those are filled.',
          'Or tap Now, Today, or This week under the field. That is the whole step. There is no second screen.',
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
        text: 'Attention is time blindness, interest, admin drain, and hyperfocus then a crash. The top line names the time and the next real thing. It is not a countdown. Type the thing and tap where it goes, on the same screen. One Now is the work. Leave Why blank when you have no sentence yet.',
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
          'Place what is waiting, when a card is sitting under Add something.',
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
      { type: 'p', text: 'Deep Roots cards show on Today, under Add something. ZigZag stores a title, a date, and a link. Journal writing stays in Deep Roots. Today works before this is connected.' },
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
        text: 'Until that worker is running, paste a snapshot into Import a Deep Roots snapshot and tap Save. The JSON needs an items list. Those cards show on Today, waiting to be placed.',
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
      { type: 'p', text: 'Zoho connects to ZigZag directly. Deep Roots is not part of this.' },
      { type: 'p', text: 'Mail share is separate. In Zoho Mail, share the message as plain text and choose ZigZag Planner. The first line is the title.' },
      { type: 'h', text: 'Calendar' },
      {
        type: 'li',
        items: [
          'Open the Zoho API Console and create a Self Client.',
          'Scopes: ZohoCalendar.calendar.READ and ZohoCalendar.event.ALL.',
          'Generate a code and exchange it for a refresh token.',
          'In ZigZag Settings, under Zoho, paste the client id, client secret, refresh token, and the calendar id.',
          'Tap Sync now.',
        ],
      },
      {
        type: 'p',
        text: 'Connected means the token and the calendar id are both saved. An event dated today shows on Today, in the time line. A later date in the next seven days shows on This week. Add to today turns that event into a task. If Today already has its Now and two Next, the button says Add to this week.',
      },
      {
        type: 'p',
        text: 'Sync from the phone. A computer browser often cannot reach Zoho. After the phone syncs, the website follows. If Zoho does not answer, your tasks are still here.',
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
      { type: 'p', text: 'Today is the screen you live on. Top to bottom: the time line, Add something, one Now, and up to two Next.' },
      { type: 'p', text: 'Done, Park, and Swap do not ask for a reason. Make this Now on a Next card moves it up and puts the old Now in its place. If Next already has two, the later one moves to This week.' },
      { type: 'p', text: 'Enter on Add something uses the open spot. Now, Today, and This week under the field place it in one tap. A shared note or a Deep Roots card sits there as one waiting card, with the same places.' },
      { type: 'p', text: 'The next day, anything still in Now or Next moves to This week. There is no count.' },
    ],
  },
  {
    id: 'capture',
    title: 'Capture',
    blocks: [
      { type: 'p', text: 'Type in Add something. Enter puts it in the open spot, and the field clears. Now, Today, and This week under the field do that in one tap.' },
      { type: 'p', text: 'On the phone, share plain text from Zoho Mail to ZigZag Planner. The first line is the title. The rest is the note. It shows on Today as a waiting card.' },
      { type: 'p', text: 'On a computer, c or Ctrl+K focuses the field when you are not already typing.' },
    ],
  },
  {
    id: 'triage',
    title: 'Where it goes',
    blocks: [
      { type: 'p', text: 'You place an item while you add it. There is no inbox screen and no second pass.' },
      { type: 'p', text: 'Now is the one card. Today means Next, unless Now is empty, in which case it becomes Now. This week is the bench. When Now and both Next spots are filled, Enter and Today send the new item to This week.' },
      { type: 'p', text: 'A waiting card is something that arrived on its own: a shared email, or Deep Roots. The same buttons place it. Someday and Delete are on that card. Delete can be undone for a few seconds.' },
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
      { type: 'p', text: 'The top line is the clock, in Pacific time, plus what is dated today. Later dates are on This week. Tap the line for today. Rows say Task, Recovery, Zoho, or Google.' },
      { type: 'p', text: 'A meeting is not a task until you tap Add to today. If Today is already filled, that button says Add to this week. A due date is set in Details. It is not labeled late.' },
      { type: 'p', text: 'After Done or Park, Block recovery? can be ignored. 15, 30, or 60 minutes, starting at the next half hour.' },
    ],
  },
  {
    id: 'deeproots',
    title: 'Deep Roots',
    blocks: [
      { type: 'p', text: 'ZigZag can show work that still needs you in Deep Roots Journal. It copies titles, dates, and a link. It does not copy journal writing.' },
      { type: 'p', text: 'New cards show on Today as a waiting card. A journal day has Open in Deep Roots and no Done button. Prayer, reading, study, cohort, and action steps can be marked done here once the connection is sending.' },
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
      { type: 'p', text: 'With no sign-in, tasks stay on this device. Share from Zoho Mail shows on Today as a waiting card.' },
    ],
  },
];

export function articleText(list: HelpArticle[] = articles): string[] {
  return list.flatMap((article) => [
    article.title,
    ...article.blocks.flatMap((block) => (block.type === 'li' ? block.items ?? [] : [block.text ?? ''])),
  ]);
}
