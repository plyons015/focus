# Connect Google Calendar

This is the calendar. Sign-in with Google is a different article: [Sign in with Google](sign-in-with-google.md).

ZigZag reads the next seven days and writes only events it created. Meetings stay read-only.

## One time outside ZigZag

Use an OAuth client in a Google Cloud project you control. The ZigZag Planner Firebase project can hold that client.

1. Create an OAuth client.
2. Scopes: `https://www.googleapis.com/auth/calendar.calendarlist.readonly` and `https://www.googleapis.com/auth/calendar.events`.
3. Sign in as your own Google account and keep the refresh token.
4. Store these on the Deep Roots functions:
   - `ZIGZAG_GOOGLE_CLIENT_ID`
   - `ZIGZAG_GOOGLE_CLIENT_SECRET`
   - `ZIGZAG_GOOGLE_REFRESH_TOKEN`
5. Optional: `ZIGZAG_GOOGLE_CALENDAR_IDS`, comma-separated. Use `primary` for the main calendar.

If the consent screen stays in Testing, Google expires that refresh token after 7 days. Settings can then say **Google didn't answer. Your tasks are still here.** Mint a new refresh token, or publish the consent screen for your account only. That is not a paid Google subscription.

## In ZigZag

1. Open **Settings**.
2. Under **Google**, paste the calendar id. `primary` is the main calendar.
3. Tap **Save**.

**Connected** means the id is saved. This calendar becomes the home calendar, and Zoho is no longer home. Listing both ids in the function environment still lets ZigZag read both.

Events show up after the next sync. **Put on calendar** and recovery blocks write to the home calendar after that sync.

If you changed a task time and the event also moved, Today says **Calendar time differs.** Choose **Keep task time** or **Use calendar time**.
