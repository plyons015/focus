# Connect Zoho

Zoho Mail share and the Zoho calendar are two different connections.

## Mail, already on the phone

In Zoho Mail, share the message as plain text and choose **ZigZag Planner**. The first line becomes the title. The rest is the note. It lands in the inbox. Settings does not have a mail row.

## Calendar, one time outside ZigZag

ZigZag reads and writes the calendar through a personal Zoho Self Client. The refresh token stays in the Deep Roots function environment. It is not pasted into ZigZag.

1. Open [Zoho API Console](https://api-console.zoho.com).
2. Create a **Self Client**.
3. Scopes: `ZohoCalendar.calendar.READ,ZohoCalendar.event.ALL`.
4. Generate a code, then exchange that code for a refresh token.
5. Store these on the Deep Roots functions:
   - `ZIGZAG_ZOHO_CLIENT_ID`
   - `ZIGZAG_ZOHO_CLIENT_SECRET`
   - `ZIGZAG_ZOHO_REFRESH_TOKEN`
6. Optional: `ZIGZAG_ZOHO_ACCOUNTS_URL` if your account is not on the US host, `ZIGZAG_ZOHO_API_BASE` for the calendar host, and `ZIGZAG_ZOHO_CALENDAR_IDS` as a comma-separated list of calendars to read.

Create and update send the event in the `eventdata` query parameter, in GMT. Delete sends the `etag` header.

## In ZigZag

1. Open **Settings**.
2. Under **Zoho**, paste the calendar id you want new blocks written to.
3. Tap **Save**.

**Connected** means that id is saved. This calendar becomes the home calendar. If Google was home, it no longer is. Both can still be read when their ids are listed in the function environment.

The id is the calendar uid Zoho shows for that calendar in the calendar settings.

Events show up after the next sync. The line under Settings says that. If Zoho does not answer, Settings can say **Zoho didn't answer. Your tasks are still here.** Today does not add a banner.

**Put on calendar** on a task with a due date, and a recovery block, write to this home calendar after the next sync. The recovery block still exists on Today before that.
