# ZigZag Planner

ZigZag Neurodivergent Planner. The folder is `focus`. The app on your phone is ZigZag Planner.

Daily use is in [docs/knowledge-base/index.md](docs/knowledge-base/index.md). This file is for running and connecting the project.

One list in, a short triage, then Today: one Now, at most two Next, and a place to capture the next thing. Deep Roots Journal sends only the work that still needs you. Zoho Calendar and Google Calendar show the next few days and can hold a block you create here.

Nothing in this app is Todoist, TickTick, or a paid plugin.

## Use it on this computer

```bash
npm install
npm test
npm run dev
```

Open http://localhost:5173. With no `.env` file, tasks stay in this browser. That is a complete planner.

`npm run build` then `npm run preview` serves the installable copy.

## What Today does

- The clock and the next real thing sit on one line. Open it for the next 7 days. There is no month grid.
- Now holds one task. Next holds two. A third asks which one moves to This week.
- Done, Park, and Swap do not ask why. After Done or Park, "Block recovery?" can be ignored.
- Why this? can stay blank. The app does not write it for you.
- Unfinished Today items move to This week the next day. The app does not count them.
- Capture is the text field. Enter saves it to the inbox. `c` or Ctrl/Cmd+K focuses it.
- From Zoho Mail, share text to ZigZag. The first line becomes the title.

## Optional sign-in

Copy `.env.example` to `.env` and fill in a Firebase web app on the free Spark plan.

1. Create a Firebase project. Leave billing on Spark.
2. Add a Web app. Copy the config into `.env`.
3. Enable Authentication: Email/Password and Google.
4. Create a Firestore database.
5. Deploy rules: `npx firebase deploy --only firestore:rules` from this folder, after `npx firebase login` and `npx firebase use YOUR_PROJECT`.
6. For the Android app, add an Android app with package name `app.zigzag.planner`. Copy the SHA-1 from Android Studio (Gradle, signing report) into Firebase. Download nothing into git. Google sign-in inside the installed app often needs email/password instead; the web sign-in popup does not always work in the Android web view.

Hosting: `npm run build` then `npx firebase deploy --only hosting`.

Today does not ask you to finish this. Settings shows Connected or Not connected.

## Android

You need Android Studio, which is already installed.

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

`npx cap add android` only the first time. In Android Studio, run the debug app on a phone or emulator.

In `android/app/src/main/AndroidManifest.xml`, the main activity needs `android:launchMode="singleTask"` and `android:exported="true"`. Inside that activity, add:

```xml
<intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="text/*" />
</intent-filter>
```

Share from Zoho Mail, pick ZigZag Planner, and the text lands in the inbox.

## Deep Roots

Settings, Connect Deep Roots: paste your Deep Roots user id and the site address (for example `https://your-journal-host`). That only stores the link. It does not copy journal writing. Journal text stays in Deep Roots.

A journal day opens in Deep Roots. It has no Done button here. Prayer, reading, study, cohort, and action steps can be marked done here, and the mcdill sync sends that back.

The sync worker lives in the existing mcdill Cloud Functions project. It does not add a new subscription. In `mcdill/functions`, set environment variables (Cloud Run or a gitignored `functions/.env`) before you rely on sync:

- `ZIGZAG_MCDILL_UID` — your Deep Roots user id
- `ZIGZAG_UID` — your ZigZag Firebase user id
- `ZIGZAG_DEEP_ROOTS_HOST` — the journal site, no trailing path
- `ZIGZAG_SERVICE_ACCOUNT` — JSON for a service account that can write the ZigZag Firebase project
- Zoho: `ZIGZAG_ZOHO_CLIENT_ID`, `ZIGZAG_ZOHO_CLIENT_SECRET`, `ZIGZAG_ZOHO_REFRESH_TOKEN`, optional `ZIGZAG_ZOHO_ACCOUNTS_URL`, `ZIGZAG_ZOHO_API_BASE`, `ZIGZAG_ZOHO_CALENDAR_IDS`
- Google: `ZIGZAG_GOOGLE_CLIENT_ID`, `ZIGZAG_GOOGLE_CLIENT_SECRET`, `ZIGZAG_GOOGLE_REFRESH_TOKEN`, optional `ZIGZAG_GOOGLE_CALENDAR_IDS`

Leave them empty and the scheduled functions return without calling out. Deploying mcdill functions does not require new secrets to exist.

`VITE_ZIGZAG_SYNC_URL` in this app can point at the `zigzagSyncNow` HTTPS function. ZigZag sends a Firebase sign-in token. The function checks it and syncs.

Until that is connected, Settings can import a JSON snapshot:

```json
{ "items": [], "closedIds": [] }
```

Items use the shape produced by `selectOpenWork` in `mcdill/src/lib/zigzag/openWork.ts`. A full snapshot is also written to `users/{your-id}/zigzag_open_work` inside Deep Roots when the worker runs.

What comes across:

- The current day of each active journal plan, if that day is not finished
- Today's unfinished prayer, reading, study, cohort, and journal events
- Unfinished Deep Dive action steps

Not the future rhythm, and not a pile of earlier days.

## Calendars

Zoho uses a Self Client at https://api-console.zoho.com (personal script, no review). Scopes: `ZohoCalendar.calendar.READ,ZohoCalendar.event.ALL`. Generate a code, exchange it once for a refresh token, and store that token in the function environment. Create and update send `eventdata` as a URL query parameter, in GMT. Delete sends the `etag` header.

Google uses an OAuth client in a Cloud project you already control. Scopes: `https://www.googleapis.com/auth/calendar.calendarlist.readonly` and `https://www.googleapis.com/auth/calendar.events`. If the consent screen stays in Testing, Google expires the refresh token after 7 days. Settings will say Google didn't answer. Reconnect by minting a new refresh token, or publish the consent screen for your account only.

In ZigZag settings, paste the calendar id you want new blocks written to and save. That calendar becomes home. The other one is cleared as home. Events from both still show when their ids are listed in the function environment.

Put on calendar sends a task that has a due date. Block recovery is a local block immediately, and a busy event on the home calendar after the next sync.

If both you and the calendar changed the time, Today says "Calendar time differs." Pick Keep task time or Use calendar time.

Meetings ZigZag did not create are not edited.

## A second person later

Every record is stored under that person's user id. A second login is another Firebase user with their own Deep Roots, Zoho, and Google connection. There is no invite screen in this build. Shared organization data is not built. The data store is the seam for that later.

## Tests

```bash
npm test
```

Deep Roots open-work rules:

```bash
cd ../mcdill
npm run test:zigzag
```
