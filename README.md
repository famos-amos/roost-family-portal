# Family Portal

A shared family dashboard built for a wall-mounted 10.1" Android tablet: a
smart 2-way synced calendar (Google + Apple/iCloud), chores board, meal
planner, family boards (to-do / wishlist / shopping list) and a customizable
home dashboard with a daily Challenge card and Verse of the Day.

Built with [Expo](https://expo.dev) / React Native, TypeScript, React
Navigation, Zustand, and [Supabase](https://supabase.com) as the shared
backend (Postgres + realtime sync — see "Setting up Supabase" below).

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

**Before anything shows up as "saved", set up Supabase** — see the next
section. Until then the app runs on temporary in-memory sample data (a
console warning says so on launch), which is fine for kicking the tires but
nothing you change will still be there next time you open it.

Family data (members, chores, meals, board items, calendar events) lives in
your own Supabase project's Postgres database and syncs in real time across
every device that has the app open. Device-only preferences (theme, which
calendar people are filtered out, per-widget detail level) stay local via
AsyncStorage, same as before.

## Setting up Supabase

Supabase is the free-tier-friendly backend this app saves everything to —
a hosted Postgres database plus realtime sync, reachable straight from the
app with no server code of your own to run. Setup is entirely in Supabase's
dashboard and takes about 5 minutes.

1. **Create a project.** Go to [supabase.com](https://supabase.com) → sign
   up (GitHub login is easiest) → **New Project**. Pick any name/region/
   database password (you won't need the password day-to-day) and wait
   ~1-2 minutes for it to finish provisioning.
2. **Run the schema.** In the project's left sidebar go to **SQL Editor →
   New query**, then open this repo's `supabase/schema.sql`, copy its
   entire contents, paste into the editor, and click **Run**. This creates
   all six tables the app needs (family members, chores, meals, board
   columns/items, calendar events), turns on Row Level Security with
   policies that allow the app's key to read/write them, turns on realtime
   sync for each table, and inserts the same starter family/chores/meals
   the app used to ship with locally — so it isn't empty on first load.
   Safe to re-run; it won't duplicate rows.
3. **Grab your API keys.** Go to **Settings → API** (gear icon, bottom of
   the left sidebar). You need two values off that page:
   - **Project URL** (looks like `https://abcdefghijk.supabase.co`)
   - **anon / public** key, under Project API keys (a long string starting
     `eyJ...`) — **not** the `service_role` key; that one must never ship
     inside an app.
4. **Add them to the app.** Copy `.env.example` to a new file named `.env`
   in the project root, and paste your two values in:

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

   Restart `npx expo start` if it was already running. Locally, that's it —
   the app now reads and writes Supabase instead of temporary sample data.
5. **For the deployed GitHub Pages site**, the same two values need to be
   available to GitHub Actions at build time (a local `.env` file never
   gets pushed to GitHub — see `.gitignore` — so this is a separate step):
   - In the GitHub repo, go to **Settings → Secrets and variables →
     Actions → New repository secret**.
   - Add one named `EXPO_PUBLIC_SUPABASE_URL` with your Project URL.
   - Add another named `EXPO_PUBLIC_SUPABASE_ANON_KEY` with your anon key.
   - Push to `main` (or re-run the "Deploy web build to GitHub Pages"
     workflow from the Actions tab) — the next deploy picks them up
     automatically; see `.github/workflows/deploy-pages.yml`.

**A note on security**, since there's no login screen in this app: every
table is set up so the anon key can freely read and write it (see the
policies in `supabase/schema.sql`). That's the right tradeoff for a private
single-family app whose GitHub Pages URL you don't publish or share — but
because the anon key ships inside the web bundle, anyone who does find that
URL and opens their browser's dev tools could read your family's data too.
Don't link to the site publicly, and if that's ever a concern, Supabase
Auth (real per-person login) is the natural next step — ask for help
wiring that up if you want it.

**If Supabase becomes unreachable** (a typo in the URL, a paused free-tier
project, a network hiccup), the app doesn't hang — every request times out
after a few seconds and it falls back to showing whatever it last knew
(seed data on a first run), so a wall-mounted tablet is never stuck on a
loading spinner. Changes made while disconnected won't be saved, though —
they're not queued for retry.

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

Once connected, FamilyPortal pulls the next 60 days of events from the primary
Google Calendar into the app's calendar, and events you add on the Calendar
screen are pushed back to Google.

## Apple / iCloud Calendar setup (2-way sync)

Apple has no public "Calendar API" for third-party apps — the standard
integration path is **CalDAV** directly against iCloud's servers
(`src/lib/appleCalendar.ts`), authenticated with an **app-specific
password** rather than the real Apple ID password:

1. Go to [appleid.apple.com](https://appleid.apple.com) → Sign-In and
   Security → App-Specific Passwords → generate one.
2. In FamilyPortal's Settings → Connected Calendars, enter the Apple ID email and
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

FamilyPortal is a React Native / Expo app, but Expo can export the same codebase as
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
  data/          Seed/demo data (recipes; the Supabase fallback data) + daily content
  lib/           date helpers, id generation, Google + Apple calendar clients, Supabase client
  navigation/    React Navigation route types + the root stack navigator
  screens/       One folder/file per screen (Home, Calendar, Chores, ...)
  store/         Zustand stores (one per domain) — family/chores/meals/boards/calendar
                 sync to Supabase (see useAppStore.ts); theme/notifications/dashboard
                 layout stay in AsyncStorage as device-local preferences
  theme/         Colors, typography, ThemeProvider (light/dark), font loading
supabase/
  schema.sql     Run once in your Supabase project's SQL Editor — see "Setting up Supabase"
```

## Known limitations / simplifications (v1)

- **Chores "Claim" button** assigns the chore to the first family member in
  the list rather than opening a person picker — a placeholder to revisit.
- **Apple/iCloud sync is unverified** against a real account (see above).
- The Home dashboard's To-Do widget reuses the "Family To-Do" board column
  rather than a separate personal task list.
- Push notifications (the toggles in Settings → Notifications) are stored
  as preferences but don't yet trigger real device notifications — wiring
  those up to `expo-notifications` is a good next step.
- **No per-person login.** Every device with the app open shares one
  Supabase-backed household — see the security note under "Setting up
  Supabase" above.
- **Offline edits aren't queued.** If Supabase is unreachable, the app
  still shows (and lets you tap around) whatever it last knew, but changes
  made in that state aren't saved or retried once the connection's back.

## Scripts

```bash
npm run start       # expo start
npm run android      # expo start --android (opens on a connected device/emulator)
npx tsc --noEmit     # typecheck
```
