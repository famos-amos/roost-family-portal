# Roost — Family Portal

A shared family dashboard built for a wall-mounted 10.1" Android tablet: a
smart 2-way synced calendar (Google + Apple/iCloud), chores board, meal
planner, family boards (to-do / wishlist / shopping list) and a customizable
home dashboard with a daily Challenge card and Verse of the Day.

Built with [Expo](https://expo.dev) / React Native, TypeScript, React
Navigation, and Zustand (persisted to on-device storage).

## Requirements

- Node.js 20+
- npm
- The [Expo Go](https://expo.dev/go) app on your Android tablet (fastest way
  to try it), or Android Studio if you want to build a standalone APK.

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on your tablet, or press `a` to launch an
Android emulator. The app is locked to landscape orientation, matching the
wall-mounted layout it was designed for.

All family data (members, chores, meals, board items, calendar events,
settings, dashboard layout) is stored locally on-device via AsyncStorage —
nothing is sent to a backend server except the calendar sync calls described
below, which talk directly to Google's / Apple's own servers.

## Google Calendar setup (2-way sync)

Google Calendar sync uses a real OAuth 2.0 / PKCE flow — no backend server
needed — but it requires an OAuth Client ID that only the app owner can
create in Google Cloud Console:

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and
   create a new project (or reuse one).
2. Enable the **Google Calendar API** for that project (APIs & Services →
   Library → search "Google Calendar API" → Enable).
3. Go to APIs & Services → OAuth consent screen and configure it (External
   user type is fine for a family app; add the family's Google accounts as
   test users if the app stays in "Testing" publishing status).
4. Go to APIs & Services → Credentials → Create Credentials → OAuth client
   ID. Create **three** client IDs, one per platform you'll actually use:
   - **Android**: needs your app's package name (`com.roost.familyportal`)
     and a SHA-1 signing certificate fingerprint (`expo credentials:manager`
     or `eas credentials` can print this for an Expo-managed build).
   - **iOS**: needs the bundle identifier (`com.roost.familyportal`).
   - **Web application**: used automatically when running inside Expo Go
     during development. Add
     `https://auth.expo.io/@your-expo-username/roost-family-portal` to its
     Authorized redirect URIs.
5. Paste the resulting client IDs into `app.json` under `expo.extra`:

   ```json
   "extra": {
     "googleOAuthClientIdAndroid": "....apps.googleusercontent.com",
     "googleOAuthClientIdIos": "....apps.googleusercontent.com",
     "googleOAuthClientIdWeb": "....apps.googleusercontent.com"
   }
   ```

Until real values replace the `REPLACE_WITH_...` placeholders, the Settings
screen shows "Setup required" instead of a Connect button (`isGoogleConfigured()`
in `src/lib/googleCalendar.ts` gates this).

Once connected, Roost pulls the next 60 days of events from the primary
Google Calendar into the app's calendar, and events you add on the Calendar
screen are pushed back to Google.

## Apple / iCloud Calendar setup (2-way sync)

Apple has no public "Calendar API" for third-party apps — the standard
integration path is **CalDAV** directly against iCloud's servers
(`src/lib/appleCalendar.ts`), authenticated with an **app-specific
password** rather than the real Apple ID password:

1. Go to [appleid.apple.com](https://appleid.apple.com) → Sign-In and
   Security → App-Specific Passwords → generate one.
2. In Roost's Settings → Connected Calendars, enter the Apple ID email and
   that app-specific password.

The password is stored in the device keychain / EncryptedSharedPreferences
via `expo-secure-store` — never in plain AsyncStorage, and never sent
anywhere but Apple's own CalDAV servers.

> **Note:** the CalDAV client was implemented directly from Apple's and
> RFC 4791's documented protocol, but hasn't yet been exercised against a
> real iCloud account (the sandbox this was built in has no network path to
> `icloud.com`). Treat it as a solid first draft — test it against a real
> Apple ID on a real device before relying on it, and expect to debug the
> XML parsing in `parseIcsEventsFromMultistatus` against however iCloud
> actually formats its multistatus responses.

## Deploying to the web (GitHub Pages)

Roost is a React Native / Expo app, but Expo can export the same codebase as
a static website (React Native Web) — no separate web build to maintain.
This repo is already set up to auto-deploy that web build to GitHub Pages
on every push to `main`, via `.github/workflows/deploy-pages.yml`.

**One-time setup, in the GitHub repo's settings:**

1. Go to **Settings → Pages**.
2. Under "Build and deployment" → **Source**, choose **GitHub Actions**
   (not "Deploy from a branch").
3. Push to `main` (or go to the **Actions** tab and run the "Deploy web
   build to GitHub Pages" workflow manually). The first run takes a couple
   of minutes; after that, the site is live at:

   ```
   https://<your-github-username>.github.io/roost-family-portal/
   ```

Every subsequent push to `main` re-runs the workflow and updates that same
URL automatically — nobody visiting the site ever needs to run `npm
install` or anything else; that command only matters for people who want
to edit the code or run it locally.

**If you rename the repo**, update the base path to match — it's set in
two places:

- `app.json` → `expo.experiments.baseUrl` (e.g. `/new-repo-name`)
- the deployed URL itself will change to `https://<username>.github.io/new-repo-name/`

**Two things that behave differently on the web build**, both by
necessity rather than oversight:

- **Apple/iCloud Calendar sync is native-only.** iCloud's CalDAV servers
  don't allow cross-origin requests from a browser (no CORS headers), so
  there's no way to reach them from a web page — only from a native app.
  The Settings screen detects this and hides the Apple connect form on
  web with an explanation instead.
- **Google Calendar sync's redirect URI is different for web.** If you
  want Google sync to work on the deployed site (not just in Expo Go),
  add your GitHub Pages URL itself
  (`https://<username>.github.io/roost-family-portal`) as an **Authorized
  redirect URI** on the **Web application** OAuth client you created in
  Google Cloud Console (see "Google Calendar setup" above) — Google
  redirects back to that exact URL after sign-in.
- Landscape-lock (`app.json` → `orientation: "landscape"`) is a native
  setting and has no effect in a browser — on the web build the tablet's
  own browser chrome and orientation apply, so keep the tablet propped in
  landscape as intended.

## Project structure

```
src/
  components/    Shared UI (icons, TopBar, Avatar, buttons, cards, ...)
  data/          Seed/demo data
  lib/           date helpers, id generation, Google + Apple calendar clients
  navigation/    React Navigation route types + the root stack navigator
  screens/       One folder/file per screen (Home, Calendar, Chores, ...)
  store/         Zustand stores (one per domain), persisted to AsyncStorage
  theme/         Colors, typography, ThemeProvider (light/dark), font loading
```

## Known limitations / simplifications (v1)

- **Chores "Claim" button** assigns the chore to the first family member in
  the list rather than opening a person picker — a placeholder to revisit.
- **Apple/iCloud sync is unverified** against a real account (see above).
- **Recipes** and **Suggestions** quick-links on the Meal Plans screen are
  stubs (`Alert.alert(...)`) — no recipe library exists yet.
- The Home dashboard's To-Do widget reuses the "Family To-Do" board column
  rather than a separate personal task list.
- Push notifications (the toggles in Settings → Notifications) are stored
  as preferences but don't yet trigger real device notifications — wiring
  those up to `expo-notifications` is a good next step.

## Scripts

```bash
npm run start       # expo start
npm run android      # expo start --android (opens on a connected device/emulator)
npx tsc --noEmit     # typecheck
```
