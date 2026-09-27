# Sign in with Google

This is the login. The calendar connection is separate: [Connect Google Calendar](connect-google-calendar.md).

**Sign in with Google** is on the sign-in screen, before Today. It is not a row inside Settings. After you are in, Settings shows **Sign out**.

Use the same account on the phone and on the computer. That is what syncs the tasks.

## On the computer

1. Open https://zigzag-planner-plyons015.web.app.
2. Tap **Sign in with Google**.
3. Pick the Google account you want on both devices.

**Create account** with email and password is the other way in. If you use that, sign in on the phone with the same email and password.

## On the phone

The Google window often does not open inside the installed app. The button then says **Google didn't open.**

Use email and password on the phone. Create that email account on the computer first if it does not exist yet, then enter it on the phone and tap **Sign in**.

## What is already in place

The ZigZag Planner Firebase project has email and password sign-in, and Google sign-in, turned on. The Android app id is `app.zigzag.planner`. The debug certificate for this computer is registered, so a debug install can use Firebase sign-in.

The sites that can open the sign-in screen are:

- `localhost`, for `npm run dev` on this computer
- `zigzag-planner-plyons015.web.app`
- `zigzag-planner-plyons015.firebaseapp.com`

## If the computer button does not open Google

The consent screen must allow your Google account. While that screen is in Testing, add your account as a test user, or publish the screen for your account only.

**Use this device only** stays off the sync. Sign in when you want the phone and the website to share tasks.
