# Connect Zoho

Zoho connects straight to ZigZag. Deep Roots is not part of this.

Mail share and the calendar are two different things.

## Mail

In Zoho Mail, share the message as plain text and choose **ZigZag Planner**. The first line becomes the title. The rest is the note. It shows on Today as a waiting card.

## Calendar

1. Open [Zoho API Console](https://api-console.zoho.com) and create a **Self Client**.
2. Scopes: `ZohoCalendar.calendar.READ,ZohoCalendar.event.ALL`.
3. Generate a code, then exchange it for a refresh token.
4. In ZigZag, open **Settings**, then **Zoho**.
5. Paste the client id, client secret, refresh token, and the calendar id.
6. Tap **Sync now**.

**Connected** means the token and the calendar id are both saved. A calendar id alone does not pull events.

An event dated today shows on **Today**, in the time line at the top. A later date in the next seven days shows on **This week**. Tap the row. It says **Zoho**. **Add to today** turns the event into a task. If Today already has its Now and two Next, the button says **Add to this week**.

Sync from the phone. A computer browser often cannot reach Zoho. After the phone syncs, the website follows.

If your Zoho account is not on the US host, change **Zoho accounts address** before Sync now. Example: `https://accounts.zoho.eu`.

If Zoho does not answer, Settings says so, and your tasks stay.
