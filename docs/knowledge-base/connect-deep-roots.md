# Connect Deep Roots

Deep Roots cards land in the inbox. ZigZag stores a title, a date, and a link. Journal writing stays in Deep Roots.

Today works before this is connected.

## In ZigZag

1. Open **Settings**.
2. Under **Connect Deep Roots**, paste your Deep Roots user id.
3. Paste the Deep Roots address. Use the site you open for the journal, with `https://`, and no page path after the host.
4. Tap **Save**.

The row says **Connected** when an id is saved. **Not connected** means the id box is empty.

That save stores the link on your ZigZag account. Cards do not start arriving from that tap alone.

## Where to copy the user id

The Deep Roots user id is the User UID on the journal account.

1. Open the Firebase console for the Deep Roots project.
2. Open **Authentication**, then **Users**.
3. Find your account and copy the **User UID**.

The ZigZag user id is a different id. Paste the journal one into **Deep Roots user id**.

## So cards arrive on their own

The sync runs in the Deep Roots Cloud Functions project. Set these on those functions, then deploy them:

- `ZIGZAG_MCDILL_UID` — the Deep Roots user id from the step above
- `ZIGZAG_UID` — the ZigZag user id from Firebase Authentication on the ZigZag Planner project, after you have signed in once
- `ZIGZAG_DEEP_ROOTS_HOST` — the same address you saved in Settings, with no path on the end
- `ZIGZAG_SERVICE_ACCOUNT` — a service account JSON key that can write the ZigZag Planner Firebase project

Leave them empty and the worker does nothing. Today stays as it is.

## Until that worker is running

Settings has **Import a Deep Roots snapshot**. Paste JSON with an `items` list and tap **Save**. Those cards go to triage.

A snapshot looks like this:

```json
{ "items": [], "closedIds": [] }
```

## What you will see

- The current day of each active journal plan, when that day is not finished. Open it in Deep Roots. There is no Done button on that card.
- Today's unfinished prayer, reading, study, and cohort check-offs. Done can check those off once the worker is sending.
- Unfinished action steps. Done checks that step.

ZigZag does not import the future rhythm, and it does not import a pile of earlier days.
