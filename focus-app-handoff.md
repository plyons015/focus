# Focus App v1 — complete build handoff

This file has three parts. Part 1 (build brief) defines tech requirements and the definition of done. Part 2 is the team's product spec (Spec Lead v0.6). Part 3 is stack research notes. If parts conflict, Part 1 wins on tech/done, Part 2 wins on product behavior.

---
# PART 1 — Build brief
# Patrick's Focus App — v1 build brief (merged with team brief v0.3)

## Who it's for
Patrick Lyons: community chaplain + founder of a small SaaS (Chaplain's Assistant). Single user at launch (keep data per-user so a second login could be added later; no sharing UI). His self-reflection (not a diagnosis) shows very high executive-function friction: time blindness, interest-driven focus, admin drain, hyperfocus then crash, emotional intensity and rejection sensitivity. Plain language, calm UI, no clutter, low-shame copy. He uses an **Android** phone and **Zoho** Mail/Calendar (not Google). Sales stays in HubSpot; this app has no CRM features.

## Shape: one Inbox -> 2-minute Triage -> Today
1. **Capture** — one text field, always visible on Today, plus big capture button / keyboard shortcut (`c` or Cmd/Ctrl+K). No required tags, dates, or projects. Enter saves and clears.
2. **Triage** — short one-at-a-time pass over the inbox. Each item goes to **Today**, **This week**, or **Someday** (or delete). Optional: context tag (Chaplain / Founder / Personal), due date, project, one-line "Why".
3. **Today screen** (the only screen used during the day), top to bottom:
   - **Deadline strip**: next few dated items (e.g. 7 days), always visible, calm styling (no red, no overdue counts).
   - **Now card**: exactly one task, large, with its **Why** line (suggested, not required) and context tag. Buttons: **Done / Park / Swap**.
   - **Next**: at most two items.
   - Always-visible capture field.
   - When a third Next would be added, the app asks gently which Next to swap out (or lets him send the new one to This week). Never an error or scolding.
   - End of day: unfinished Today items quietly roll back to This week. No overdue counts, streaks, badges, or scores anywhere.
4. **Lists**: This week, Someday — out of sight unless opened.
5. **Light projects** (mainly founder work): name, context, optional note; project page lists its tasks. No Gantt, no deep subtasks, no dashboards.

## Email-to-task (v1)
Android share target: from the Zoho Mail app, Share -> this app drops the shared text into Capture, with the subject/first line as the title and the rest as a note, source = "email". Use `@capgo/capacitor-share-target` (maintained, supports Capacitor 8). Avoid `send-intent` (no Capacitor 8 release) and paid Capawesome plugins. Fall back to minimal native intent-filter code only if that plugin fails. Web fallback: pasting an email into capture should also work (first line becomes title).

## Later (NOT v1 — design data so they fit, but don't build)
Home-screen widget / quick-settings tile, gentle prompt after long focus (keep / park / switch), recovery blocks on Zoho Calendar, full Zoho Mail sync, second user login, reporting.

## Data model
- Task: title, why, context (chaplain|founder|personal), status (inbox|today-now|today-next|week|someday|done), dueDate, projectId, source (manual|email), note, timestamps.
- Project: name, context, note, timestamps.
- TimeBlock: reserved for later (recovery blocks / calendar), schema only.

## Tech
- React + TypeScript + Vite web app, installable PWA (manifest + service worker, offline).
- **Capacitor Android project** from the same code (`npx cap add android`) so it installs on his phone; app launches straight into the Today screen with capture focused. README must explain `npm run build`, `npx cap sync android`, `npx cap open android`, and running on a phone from Android Studio (he has it installed).
- Firebase Auth + Cloud Firestore for sync (data under users/{uid}/...), with security rules so only the owner can read/write. Sign-in must work inside the Android app (Capacitor-compatible Firebase auth; email link or Google account sign-in are both fine — Google here is only for login, not calendar/mail). Document any Firebase console setup steps (SHA-1 for Android, etc.).
- Must also run with **no Firebase config**: local-only mode (IndexedDB/localStorage) so it works immediately. Config via env vars (VITE_FIREBASE_*), `.env.example`, never commit secrets.
- `firebase.json` + `firestore.rules` for Firebase Hosting deploy. v1 must work on the free Spark plan (no Cloud Functions in v1).
- Accessible: contrast, focus states, reduced motion. Big readable type, lots of whitespace.
- Tests for core rules: Now max 1, Next max 2 with swap flow, triage transitions, end-of-day rollover, deadline strip ordering, share/paste email parsing.

## Done when
- Web app runs locally in local-only mode with no config; with Firebase config it signs in and syncs.
- Capture, triage, Today (Now 1 + Next up to 2 with swap flow, Done/Park/Swap), deadline strip, This week/Someday, projects, context tags, end-of-day rollover, and email share/paste capture all work.
- Android project builds (debug APK) with the share target wired in.
- Tests pass; README explains run, Android, and deploy in plain language.
- Screenshots of Today, Capture, Triage, and the swap prompt at desktop and mobile widths saved as artifacts.

## Triage screen detail (from Focus Design)
- One inbox item at a time as a card: title, source (e.g. "from Zoho Mail share"), capture time.
- Four large buttons: Today, This week, Someday, Delete. Optional small row: context chip (preselected if guessable) and "add due date".
- One tap files it and shows the next card; no confirm dialogs. 5-second Undo toast after each tap. Skip button moves the card to the back.
- Picking Today: if Now is empty it becomes Now and suggests the Why line (not required); if Now is full it goes to Next; if Next already has two, ask which to swap out.
- Header shows remaining count as plain text ("4 left"), no progress bar.
- Empty inbox: calm line "Inbox clear. Today is set." plus a button to Today. No confetti or streaks.
- If more than ~15 items, offer "Send the rest to Someday".
- Entry points: small "Inbox (N)" link on Today when N > 0; opens automatically on the first app open of the day if N > 0 (dismissible).
- Copy is plain and low-shame; never "overdue" or "you missed".

---
# PART 2 — Product spec (Spec Lead v0.6)
# Task & Time System: Planning Brief v0.6
*Planning doc for the build. Custom Firebase web app plus a Capacitor Android app. Decided Sep 27, 2026.*

## Problem
Patrick carries chaplain work and founder work (Chaplain's Assistant / MyMinistry.Help) at the same time, and there's no single calm place that tells him what to do next. Most of his tasks currently live in his email inbox. Time blindness, admin drain, and hyperfocus followed by a crash make scattered tasks worse.

## Users
Patrick for v1. Whether his brother gets his own login is an open question.

## Platforms
- A web app hosted on Firebase.
- An Android app built with Capacitor from the same code. It opens straight to capture, and it comes with steps for running it in Android Studio, which Patrick already has installed.

## System shape (from Systems Planner)
Everything goes into one inbox. A two-minute triage sorts it into Today, This week, or Someday. Today is the only screen used during the day. Active founder work can get light project folders. Calendar blocks support the system; they are not the system.

## Today screen (from Focus Design)
Top to bottom:
1. **Deadline strip**: one line, e.g. "3 due this week, next: Tue Sep 29". Tapping it opens the upcoming list. Deadlines live here, not as red text inside tasks.
2. **Now card**: exactly one task, shown large, with a title and a one-line "Why" in Patrick's own words. The Why is optional at capture and prompted when a task becomes Now.
3. **Now actions**: Done, Park (back to the list, with no overdue marker), and Swap (the first Next item moves up). None of them ask for a reason.
4. **Next**: at most two items. Tapping one offers "Make this Now".
5. **Capture field**: always visible. One line, enter to save, goes to the inbox. Nothing is required.

Rules:
- Now holds exactly 1 item and Next holds at most 2.
- Unfinished items roll back to the list at the end of the day. There's no "missed" state.
- Today never shows overdue counts, streaks, progress bars, percentages, red badges, or scores.
- The copy is plain and low-shame: "Park" not "Postpone", "Later" not "Overdue".

## Inbox triage screen (from Focus Design)
- Shows one inbox item at a time as a card.
- Four buttons: Today, This week, Someday, Delete.
- An undo appears after each tap.
- A plain count ("4 left") instead of a progress bar.
- When the inbox is too long, it offers "send the rest to Someday" so triage stays around two minutes.
- (Focus Design sent the full section to Chief of Staff for the build plan.)

## Must-haves (v1)
- The Today screen as described above.
- The inbox and the two-minute triage screen (above).
- Light projects for founder work.
- A context tag: chaplain, founder, or personal.
- Email-to-task via Android share: in Zoho Mail, tap Share and pick the app, and the email lands in capture with its subject as the title. Uses `@capgo/capacitor-share-target` (free, supports Capacitor 8, recently updated). Avoid `send-intent` (no Capacitor 8 release) and the Capawesome version (paid license). *In v1 by default.*

## Later (not v1)
- A home-screen widget or quick-settings tile that opens straight to capture. Both need native Kotlin; no Capacitor plugin builds them.
- A gentle prompt after long focus: keep going, park it, or switch.
- Named recovery blocks pushed to **Zoho Calendar**.
- Full Zoho Mail sync.
- A login for his brother, unless Patrick wants it in v1.
- Reporting.

## Daily / weekly loops (draft)
- Daily: capture anytime, do a two-minute triage, and work from Today. Unfinished items roll back at the end of the day.
- Weekly: empty the inbox, pick the week's few priorities, and look over upcoming deadlines.

## Data model sketch
- Task: title, why, context, status (inbox / now / next / week / someday / done), due date (optional), project (optional), source (typed / shared email), created and updated times.
- Project: name, status. Founder work only for now.
- Time block (later): title, type (work / recovery), start and end, Zoho Calendar event id.

## Integrations
- **Zoho Mail**: v1 uses the Android share sheet only. Full mail sync comes later.
- **Zoho Calendar**: recovery blocks come later, via a Cloud Function (see notes below).
- **HubSpot**: kept completely separate. Sales stays in HubSpot, and personal, chaplain, and ops tasks never go there. This is pending Patrick's confirmation.
- Google Calendar: not used.

## Hosting and cost (from Stack Scout)
- v1 runs on Firebase's free Spark plan (Hosting, Auth, Firestore). Nothing in v1 needs Cloud Functions.
- The Later items (Zoho Calendar, email-in by forwarding, push) need Cloud Functions, which means the pay-as-you-go Blaze plan. Expected cost is about $0/month for one user. Set a budget alert and a spend cap when upgrading.

## Later-integration notes (from Stack Scout)
- Zoho Calendar: one API call from a Cloud Function creates an event. One-time "Self Client" setup in Zoho's developer console gives a refresh token, stored as a Firebase secret; no app review. Event details go in the URL, not the request body, and times are in GMT.
- Email-in by forwarding: Zoho Mail can send matching emails to a Cloud Function, but it looks like a paid-plan feature. Depends on whether Patrick has paid Zoho Mail.

## Fallback if the build stalls
Todoist Pro at $60/year. It doesn't connect to Zoho Calendar.

## Success metrics
Over the first two weeks: Patrick sticks to the short Today view without the list growing, drops fewer balls, and spends less time wondering where to look. Patrick sets the final bar.

## Defaults (Chief of Staff, Sep 27, 2026; Patrick can change any of these)
1. Email-to-task through the Android share button is in v1.
2. The app is just for Patrick at launch.
3. Sales stays in HubSpot, and none of these tasks go there.
4. When a third Next item comes in, the app asks which one to swap out.
5. The Why line is suggested, not required.

## Still open
- Use Todoist as a stopgap during the build, or keep current habits? (Stack Scout)
- Is Patrick on a paid Zoho Mail plan? Decides whether forwarding email into the app can work later. (Stack Scout, no rush)

---
# PART 3 — Stack notes (Stack Scout)
# Stack Scout: Custom Firebase task app (plus a buy-side fallback)

Prepared Sun Sep 27, 2026 (PT) for Patrick Lyons, community chaplain and founder of Chaplain's Assistant / MyMinistry.Help.
**Decision already made:** build a custom Firebase web app, wrap it for **Android with Capacitor**, and use **Zoho Calendar** as the calendar. HubSpot Free stays the CRM.
**Sourcing rule:** every price, limit, and API fact below comes from an official page or registry, fetched today. Anything I couldn't confirm is marked **unverified**. Source list is in section 5.

---

## 0. TL;DR

- **Build it.** Every piece has a documented path. Share-to-app capture is a manifest change plus a free plugin. Push is an official Capacitor plugin. Zoho Calendar has a plain REST "create event" call. Zoho Mail can POST incoming mail to a URL.
- **You need Blaze (pay-as-you-go), not Spark.** Cloud Functions won't deploy on Spark, and all server-side work needs them: Zoho calls, email-in, push. At single-user scale you should stay inside Blaze's no-cost quotas. Right after upgrading, set a **spend cap** on Cloud Run functions (spend caps are available now, but they aren't instant hard caps).
- **The native Android parts are the real work.** That means the Quick Settings tile and the home-screen widget. Both need Kotlin/Java in Android Studio. I found no maintained Capacitor plugin for QS tiles. For widgets, plugins only move data between the app and the widget. You still write the widget UI natively.
- **Zoho OAuth is simpler than Google's for a one-person app.** Use a Zoho "Self Client": no consent screen, no app review, and the refresh token doesn't expire. Keep it in Secret Manager and call Zoho from a Cloud Function.
- **Fallback if the build stalls:** Todoist Pro at $5/mo billed yearly ($60/yr) or $7/mo. Caveat: Todoist's calendar integration covers only Google and Outlook, **not Zoho**.

---

## 1. Custom build stack notes (main section)

### 1.1 Android capture with Capacitor

**A. Receiving Android share intents ("Share → My Tasks")**

| Option | Package | Status (npm registry, today) | License / cost | Notes |
|---|---|---|---|---|
| **Recommended** | `@capgo/capacitor-share-target` | v8.0.54, published Sep 22, 2026 (PT); peer `@capacitor/core >=8` | MPL-2.0, free | Add `SEND` / `SEND_MULTIPLE` intent-filters to MainActivity, then listen for `shareReceived` (gives `title`, `texts[]`, `files[]`). The README says only the latest major version (v8 for Capacitor 8) is maintained. |
| Paid alternative | `@capawesome-team/capacitor-share-target` | v8.x "Active support" | **Capawesome Insiders only** (paid license, private npm registry) | Same idea. Well documented, and it also covers PWA and iOS. |
| Legacy | `send-intent` | v7.0.0, published Feb 27, 2025 (PT); peer `@capacitor/core >=7` | MIT | **No Capacitor 8 release yet.** It needs a separate `SendIntentActivity`, and you have to call `finish()` yourself to avoid duplicate app instances. Avoid it for a new Capacitor 8 app. |

Setup (from the Capgo/Capawesome docs): put intent-filters inside the `<activity>` for MainActivity, set `android:exported="true"`, and use `launchMode="singleTask"` (recommended) so a share doesn't spawn a second copy of the app. Android puts shared URLs in the `text` field, not `url`, so parse URLs out of the text.

Capture flow: share → app opens on a one-line "Captured ✓" sheet → write to Firestore (the offline cache queues the write if you have no signal) → close. No tags required.

**B. Home-screen widget and Quick Settings tile**

| Surface | Needs native code? | Plugin help | What it involves |
|---|---|---|---|
| **Home-screen widget** (e.g. "Now / Next" list plus a "+ Capture" button) | **Yes.** Kotlin/Java `AppWidgetProvider` (or Glance), an `AppWidgetProviderInfo` XML file, and a RemoteViews layout declared in the manifest. Android Studio can scaffold it: *New → Widget → App Widget*. | `capacitor-widget-bridge` (MIT, v8.1.0, Mar 2026) writes JS data into SharedPreferences and triggers `AppWidgetManager` updates. It also has `requestWidget()`, which prompts the user to pin the widget. `@capgo/capacitor-widget-kit` (MPL-2.0, v8.1.10, Sep 2026) is mainly for iOS WidgetKit, and its README also claims Android widget support (**Android side unverified**). | The plugin moves the data. **You still build the widget UI natively.** Suggested design: the app writes the current Now + Next (up to 3 items) to SharedPreferences on every change, and the widget reads them. The "+" button opens a small capture activity. |
| **Quick Settings tile** ("Capture" in the pull-down shade) | **Yes.** A Kotlin `TileService` declared in the manifest with `BIND_QUICK_SETTINGS_TILE` and a 24dp white vector icon. | **None found.** An npm search for Capacitor QS-tile plugins turned up nothing relevant. | `onClick()` → `showDialog()` with a text field, or `startActivityAndCollapse()` into a tiny capture activity → POST to your capture Cloud Function (or write through the Firebase Android SDK). From Android 13 you can call `requestAddTileService()` to prompt a one-tap "add tile". Google's guidance says tiles shouldn't just launch an app, and a capture dialog fits that. The docs say to use `unlockAndRun()` if an action shouldn't run on the lock screen. |

Plain-language effort: expect a focused weekend or two for the tile plus a simple widget, **qualitative estimate only**. It's small Kotlin, but it's the one part of the build that isn't web code.

**C. Push notifications via FCM**

| Option | Package | Status | Notes |
|---|---|---|---|
| **Official** | `@capacitor/push-notifications` | v8.1.2, Jul 2026; MIT | Uses the FCM SDK on Android. You only add `google-services.json`, with no manifest edits. On **Android 13+ you must call `requestPermissions()`**. Add a white-on-transparent notification icon and create a channel with `createChannel()`. **Gotcha:** data-only messages won't fire `pushNotificationReceived` if the app was killed. For that you need a native `FirebaseMessagingService`. Send normal "notification" messages for reminders. |
| Alternative | `@capacitor-firebase/messaging` | v8.5.2, Sep 2026; Apache-2.0 (open source, not the paid Insiders line) | Useful if you also want the Firebase JS SDK on web. |

Sending: a Cloud Function calls the Firebase Admin SDK (FCM itself is listed as "No-cost" on the pricing page). Use it for gentle nudges like "Your Now item is waiting" or "Recovery block in 10 min". No streaks and no guilt copy.

Unverified gotcha: Google sign-in popups in the Firebase JS SDK often fail inside a Capacitor WebView. The usual fix is a native auth plugin such as `@capacitor-firebase/authentication`. I didn't verify this today, so check it before you commit to an auth flow.

### 1.2 Zoho Calendar API for named recovery blocks

**Can it create events?** Yes. `POST https://calendar.zoho.com/api/v1/calendars/<calendar_uid>/events` with an `eventdata` JSON object. Required: `dateandtime.start` / `end` in `yyyyMMdd'T'HHmmss'Z'` (GMT), plus `title`. Useful optional fields:
- `transparency` (0 = show as busy)
- `reminders` (`popup` / `email` / `notification`)
- `color`
- `isprivate`
- `rrule` for recurring blocks, e.g. `FREQ=WEEKLY;BYDAY=TU,TH`

**Watch out:** the docs pass `eventdata` as a **query parameter** (URL-encoded JSON), not a body. Convert PT times to GMT before sending.

**Scopes, least-privilege set:**
- `ZohoCalendar.event.CREATE` to create blocks. Add `ZohoCalendar.event.UPDATE` / `.DELETE` if the app will move or remove them, or use `ZohoCalendar.event.ALL`. (`.DELETE` is confirmed on the delete-event page. The name `.UPDATE` follows the same pattern but is **unverified**.)
- `ZohoCalendar.calendar.READ` to list calendars and find the `calendar_uid` once.
- Tip: create a dedicated "Recovery" calendar in Zoho so the app only ever writes there. The calendar stays the calendar, not the whole system.

**OAuth setup in the Zoho API Console** (accounts.zoho.com/developerconsole):
1. Pick a client type. For a one-person tool, choose **Self Client**: "for personal scripts… accessing your own Zoho Calendar account. No user-facing consent screen."
2. In *Generate Code*, enter the scopes (comma-separated) and an expiry (3 minutes by default). You get an authorization code.
3. Exchange it once: `POST {accounts-server-url}/oauth/v2/token` with `grant_type=authorization_code`. That returns an `access_token` (valid 1 hour), a `refresh_token` ("won't expire"), and an `api_domain`.
4. Store the refresh token and client secret in **Secret Manager** through Firebase Functions secrets. Never put them in the app.
5. Each call: refresh the access token → call the Calendar API with `Authorization: Bearer <token>`. (The Mail API uses the `Zoho-oauthtoken` prefix instead.)
6. **Data centers:** use your account's DC host (`accounts.zoho.com` vs `.eu`, `.in`, etc.) and the `api_domain` Zoho returns. A mismatch gives confusing auth errors.

Later option: if you ever turn this into a multi-user feature for MyMinistry.Help, switch to a **Server-based Application** client (authorization-code flow with a redirect URI). Zoho's docs don't mention a Google-style app-verification review. Whether Zoho has any review for public apps is **unverified**.

**From a Firebase Cloud Function, is it straightforward?** Yes. It's plain HTTPS with `fetch`, and no Zoho SDK is required. Pattern: an `onCall` function `createRecoveryBlock({title, startPT, minutes})` → read the secret → refresh the token (cache it for about 55 minutes in memory or Firestore) → POST the event → save the Zoho event `uid` and `etag` on your task doc so you can delete it later (delete needs the etag). This needs Blaze, because on Spark you can't deploy functions at all.

Compared with the Google Calendar API: Zoho's Self Client avoids Google's sensitive-scope verification. It also avoids Google's "Testing mode" limit, where external apps in Testing status get refresh tokens that expire after 7 days. That's a real win for a solo tool.

### 1.3 Firebase costs at single-user scale (official pricing page, today)

| | **Spark (no-cost)** | **Blaze (pay-as-you-go)** |
|---|---|---|
| Payment method | Not needed | Billing account required (eligible new accounts may get $300 credit) |
| Firestore (Standard) | 1 GiB stored; 50K reads/day; 20K writes/day; 20K deletes/day; 10 GiB/month egress | Same no-cost amounts, then Google Cloud pricing |
| Cloud Functions | **Not available** ("to deploy in production, your project must be on the Blaze pricing plan") | No-cost up to 2M invocations/month, 400K GB-seconds, 200K CPU-seconds, 5 GB outbound; then $0.40 per million invocations, etc. |
| Hosting | 10 GB storage; 360 MB/day transfer | Same no-cost amounts, then $0.026/GB stored and $0.15/GB transferred |
| Auth | 50K MAUs (Identity Platform) | No-cost up to 50K MAUs |
| FCM | No-cost | No-cost |
| Cloud Storage (new `*.firebasestorage.app` buckets) | Not applicable | No-cost 5 GB-months, 100 GB/month download; no-cost quota only in us-central1, us-west1, us-east1 |
| Artifact Registry (function containers) | n/a | No-cost up to 500 MB. The docs warn function deploys "incur small-scale charges for the storage space used for the function's container." |

**What that means for one person:** capturing a few dozen tasks a day and opening the app many times uses a tiny fraction of the 50K reads / 20K writes daily quota. Expect **$0 or close to it** on Blaze. The likely non-zero items are container storage and any Secret Manager or Cloud Scheduler usage. Their free allowances were **not verified today**, so check the Cloud pricing pages.

**Guardrails:**
- When you upgrade, Firebase prompts you to set a budget alert. Alerts **only send email**. They don't stop anything.
- Also create a **spend-cap budget** on Cloud Run functions, which covers Cloud Functions for Firebase gen 1 and 2. At 100% it pauses the service until you lift the cap. The docs warn it is **not a hard cap**: enforcement can lag by minutes, and the overage is billed.
- Pick a Storage bucket in us-central1/us-west1/us-east1 if you attach files.

### 1.4 Quick capture that doesn't need the app open

| Path | How | Native code? | Verified status |
|---|---|---|---|
| **Android share sheet** | Share text or a link from any app → Capgo share-target → one-tap save | Manifest only | ✔ (plugin docs) |
| **Quick Settings tile** | Pull down the shade → tap "Capture" → dialog → POST to the capture function | Kotlin `TileService` | ✔ (Android docs); no plugin found |
| **Home-screen widget** | "+" button → tiny capture activity; the widget also shows Now/Next | Kotlin `AppWidgetProvider` | ✔ (Android docs, bridge plugin) |
| **Email-in via Zoho Mail outgoing webhook** | Set up a capture address or alias (e.g. `tasks@…`) → Zoho Mail *Settings → Integrations → Developer Space → Outgoing Webhooks* → entity **Mail**, condition "To contains tasks@…" → Webhook URL = your HTTPS Cloud Function. The payload includes `subject`, `summary`, `fromAddress`, `html`, `messageId`, and `receivedTime`. | None | ✔ (Zoho Mail docs). **Plan availability:** the Zoho pricing page lists "eWidget & Developer Space" among paid-plan features. Whether your current plan includes it is **unverified**. |
| Email-in via Zoho Mail filter → forward | Filter "Forward to" another address that feeds a webhook | None | Filter forwarding exists. The docs say forwarding **isn't available for new Free-plan users**. The webhook path is cleaner anyway. |
| Zoho Mail filter → custom Deluge function | Filter action runs Deluge → `zoho.mail.getMessage` → `invokeurl` to your function | Deluge script | ✔ that filters can run custom functions (Zoho docs). Plan requirements **unverified**. |
| **Siri Shortcut** | Not relevant: you're on Android | n/a | Dropped |
| Third-party Android HTTP-shortcut apps (e.g. "HTTP Shortcuts") posting to the function | Home-screen icon → text prompt → POST | None | **Unverified** today. It's a no-code stopgap before the tile/widget exist. |

**Zoho webhook security details (from Zoho's docs):**
- The very first POST, sent when you save the webhook, must return **200** or the config won't save.
- Header `x-hook-secret` appears **only on that first request**, so store it.
- Every later request carries `x-hook-signature` (base64 HMAC-SHA256 of the raw body). Verify it in the function.
- Zoho auto-disables the webhook if your URL stays unresponsive for an extended period.
- Tick "Limited Data List" if you only want subject/from/to/time sent, not the email body.

For the capture endpoint, one HTTPS Cloud Function `capture` handles all of these:
- the Zoho webhook (HMAC check)
- tile/widget/shortcut posts (a per-device secret header or a Firebase ID token)

It writes `{text, source, createdAt, status:"inbox"}` to Firestore with **zero required tags**. Triage happens later in the app.

### 1.5 The app itself (unchanged system shape)
- **Capture → triage → Today.** Today is a query: `status == "now"` (limit 1) plus `status == "next"` (limit 2). The skinny view is the default, not enforced.
- **Deadlines visible outside the task:** keep a `deadline` field and show it on list rows and in the widget.
- **No streaks, karma, or shame UI.** Show a "done today" list, not scores.
- **HubSpot stays separate.** No CRM fields in the task model. If a sales follow-up shows up in capture, triage sends it to HubSpot.
- **Effort (qualitative):**
  - Web app MVP (capture, triage, Today, deadlines): a few focused weekends.
  - Capacitor wrap, share target, and FCM: a weekend.
  - Zoho functions and email-in: a weekend.
  - Tile and widget: another weekend or two.
  - Risks: ongoing maintenance, and the build competing with Chaplain's Assistant for attention. Keep scope ruthless.

---

## 2. Buy-side fallback: Todoist vs TickTick only

| | **Todoist** | **TickTick** |
|---|---|---|
| Free-tier limits | 5 personal projects; 3 filter views; 5 MB uploads; 1-week activity history; Ramble voice capture limited to 10 sessions/month; Google/Outlook calendar integration included; **no Deadlines** (Pro only) | 9 lists; 99 tasks per list; 19 checklist items per task; 2 reminders per task; 1 attachment/day; 5 habits; **custom filters are Premium** |
| Paid tier needed | **Pro: $7/mo or $60/yr ($5/mo billed yearly).** US App Store shows $6.99 / $59.99. | **Premium: US$49.99/yr** (official upgrade page and US App Store); **$4.99/mo** (US App Store). Several third-party sites still quote an older $35.99/yr. |
| Skinny Today (about 3 items) | Filter `@now \| @next` (works on Free, which allows 3 filters), set as **Home view** (Settings → General) | Premium filter: tag = now OR next, pinned in the sidebar |
| Calendar link | Google or Outlook only. **Zoho isn't supported**, since the help page names only Google and Outlook. | Google two-way integration plus subscribed calendars. **Zoho support unverified** (possibly via an iCal subscription). |
| Streaks / shame UI | Karma and goals: **can be turned off**, and goal celebrations can be turned off too | Habit streak counter can't be hidden (per a third-party search summary, **unverified**). The Habit and Pomodoro tabs can be removed from the tab bar. |
| Export for a later import into the custom app | **CSV:** per-project CSV export plus automatic daily **backups (ZIP of CSVs)**. Backups skip completed tasks. **JSON:** through the official REST/Sync API. | **CSV:** web *Settings → Account → Backup & Import → generate backup*. **JSON:** only through unofficial API wrappers (the official Open API scope is **unverified**). |
| Privacy | AWS hosting; encrypted at rest; SOC 2 Type II. AI runs through AWS Bedrock / Vertex AI with no-training commitments. | AWS **US**; encrypted at rest; 72-hour breach notification commitment |
| Score (EF fit / capture / calendar-for-Zoho / low admin / cost / privacy / HubSpot-separate), 1–5 | 4 / 5 / 2 / 4 / 4 / 4 / 5 | 3 / 4 / 2 / 3 / 5 / 3 / 5 |

**Fallback pick: Todoist.** It has the cleanest skinny-Today setup (filter plus Home view), Karma can be switched off, and Ramble handles voice capture. CSV and API JSON exports also make a later import into the custom app easy. TickTick is cheaper, but it pushes habit streaks, and custom filters need Premium. Neither syncs natively with **Zoho Calendar**, which is one more reason the custom build fits.

---

## 3. Recommendation

**Build the custom app:** Firebase (Firestore, Auth, Hosting, and Cloud Functions on Blaze with a spend cap), Capacitor 8 for Android, and a Zoho Calendar Self Client.

- **Why build instead of buying Todoist:** Zoho Calendar is your calendar, and neither buy option links to it. The Now(1) + Next(≤2) view and the "no shame" rules are easy to hard-code in your own app, and Todoist can only approximate them with filters. Your Firebase skills and Android Studio are already in place. The running cost at one user should be close to $0, versus $60/yr.
- **Why Todoist remains the fallback:** if the build stalls for more than two to three weeks, capture has to live somewhere. Todoist is ready in an hour, and its CSV/JSON export means nothing is lost when you switch back.
- **Build order that keeps you productive:**
  1. PWA/web capture + Today
  2. Capacitor wrap + share target
  3. Zoho Mail webhook email-in
  4. Zoho Calendar recovery blocks
  5. FCM nudges
  6. QS tile and widget last (the only native-Kotlin work)

---

## 4. Surprises / gotchas
1. **Cloud Functions need Blaze.** Spark can't deploy functions at all, so every server-side feature needs Blaze.
2. **Firebase now offers spend caps** for Cloud Functions, App Hosting, AI Logic, and Extensions. They're still not hard caps: enforcement lags and overage is billed.
3. **Capawesome's share-target plugin is paid (Insiders).** The free, maintained Capacitor 8 option is Capgo's. The long-standing `send-intent` has no Capacitor 8 release.
4. **No Capacitor plugin for Quick Settings tiles.** Widgets have plugins only for passing data; the widget UI is still native.
5. **Zoho Calendar's create-event takes `eventdata` as a URL query parameter** with GMT timestamps.
6. **Zoho Self Client refresh tokens don't expire.** Google's Testing-mode tokens expire after 7 days.
7. **Zoho Mail outgoing webhooks send the email body** (HTML + summary) and sign requests with HMAC. The secret arrives only on the first call.
8. **TickTick raised its price.** The official page shows US$49.99/yr and the App Store shows $4.99/mo; many blogs still say $35.99.
9. **Todoist Deadlines need Pro,** and **Todoist doesn't integrate with Zoho Calendar.**
10. **Zoho Mail forwarding isn't available to new Free-plan users,** and Developer Space appears only in paid-plan feature lists. Check your plan before relying on email-in.

---

## 5. Sources (fetched Sep 27, 2026)
**Capacitor / Android**
- https://github.com/Cap-go/capacitor-share-target , https://capgo.app/docs/plugins/share-target/getting-started/ , npm registry `@capgo/capacitor-share-target`
- https://capawesome.io/docs/sdks/capacitor/share-target/ (Insiders-only note)
- https://www.npmjs.com/package/send-intent (plus npm registry metadata)
- https://capacitorjs.com/docs/apis/push-notifications ; npm registry `@capacitor/push-notifications`, `@capacitor-firebase/messaging`, `@capacitor/core`
- https://developer.android.com/develop/ui/views/appwidgets ; https://developer.android.com/develop/ui/views/quicksettings-tiles
- https://www.npmjs.com/package/capacitor-widget-bridge ; npm registry `@capgo/capacitor-widget-kit`

**Zoho**
- https://www.zoho.com/calendar/help/api/post-create-event.html
- https://www.zoho.com/calendar/help/api/oauth2-user-guide.html
- https://www.zoho.com/calendar/help/api/get-calendar-list.html ; https://www.zoho.com/calendar/help/api/delete-event.html
- https://www.zoho.com/developer/oauth/self-client/authorization-code-flow.html ; https://www.zoho.com/developer/oauth/multi-dc-support.html
- https://www.zoho.com/mail/help/dev-platform/webhook.html ; https://www.zoho.com/mail/help/developer-space.html
- https://www.zoho.com/mail/help/custom-functions.html ; https://www.zoho.com/mail/help/email-forwarding.html ; https://www.zoho.com/mail/zohomail-pricing.html

**Firebase**
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- https://firebase.google.com/docs/functions/get-started (Blaze required)
- https://firebase.google.com/docs/projects/billing/avoid-surprise-bills ; https://firebase.google.cn/docs/projects/billing/spend-caps ; https://firebase.google.cn/docs/functions/quotas

**Google OAuth (for comparison only)**
- https://developers.google.com/workspace/calendar/api/auth ; https://support.google.com/cloud/answer/13464323 ; https://developers.google.com/identity/protocols/oauth2/policies
- Testing-mode 7-day refresh-token expiry: Google help answer 10311615, cited in https://stackoverflow.com/questions/66474383

**Todoist / TickTick**
- https://www.todoist.com/pricing ; https://www.todoist.com/help/articles/todoist-plans-pricing-and-billing-faq-Vq2z0HWL6 (Pro $7/mo or $60/yr)
- https://apps.apple.com/us/app/todoist-to-do-list-planner/id572688855 ($6.99 / $59.99)
- https://www.todoist.com/help/articles/use-the-calendar-integration-rCqwLCt3G (Google/Outlook only)
- https://www.todoist.com/help/articles/introduction-to-deadlines-in-todoist-uMqbSLM6U ; https://www.todoist.com/help/articles/introduction-to-karma-OgWkWy ; https://www.todoist.com/help/articles/change-your-home-view-OKOgnH4r
- https://www.todoist.com/help/todoist/todoist-and-ai/dictate-to-add-tasks-with-ramble-P1Raq7vVF ; https://www.todoist.com/help/articles/download-or-restore-backups-in-todoist-ywaJeQbN
- https://www.todoist.com/security ; https://www.todoist.com/help/articles/introduction-to-todoist-assist-KgPP22q5O
- https://ticktick.com/about/upgrade (US$49.99/yr, free-tier limits) ; https://apps.apple.com/us/app/ticktick-to-do-list-calendar/id626144601 ($4.99/mo, $49.99/yr)
- https://help.ticktick.com/articles/7055782240994721792 (filters) ; https://help.ticktick.com/articles/7055781593733922816 (Google Calendar) ; https://help.ticktick.com/articles/7055781405648748544 (backup/CSV) ; https://ticktick.com/security?language=en_US
