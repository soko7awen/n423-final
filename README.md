# LOREBoards — N423 Final

Game completion tracker built from my approved proposal: a colorful, responsive leaderboard where players log their finished games, high scores, and personal notes. The app mirrors the prototype’s layout, typography, and color gradients while adding full Firebase‑backed CRUD, IGDB search, and profile management.

## Live Deployments
- Web 4 / production: `<ADD_WEB4_OR_FIREBASE_LINK_HERE>`
- Backup (Vercel or Expo Web): `<ADD_VERCEL_LINK_HERE>`

## What It Does
- Lets authenticated users log a completion with title, platform(s), year, developer, completion type (progress or high‑score), and player notes.
- Built‑in IGDB search (via a lightweight proxy) auto-fills game metadata and cover art; manual entry is available for unreleased/obscure titles.
- Shows the latest submissions on the home feed with animated cards, platform badges, and player avatars.
- Search page filters by free text, user, game id, and sort options (newest/oldest/title/platform).
- Profile dropdown (desktop) supports avatar uploads stored in Firestore, plus username/email-based auth.
- Fully responsive: desktop layout uses a sticky top nav; mobile uses Expo Router headers and stacked forms.

## CRUD Coverage
- Create: `/submit` form writes to Firestore (`games` and `submissions`) with IGDB-assisted metadata and optional manual covers.
- Read: home feed streams the newest submissions; `/search` queries and client-filters up to 120 entries.
- Update: “Edit” button on your own GameCard opens `/submit?edit=<submissionId>` with prefilled values.
- Delete: “Delete” button (owner-only) removes a submission after confirmation.

## Tech & Architecture
- Expo Router + React Native Web UI with linear-gradient hero, animated cards, and custom fonts (Lexend Zetta, Noto Sans).
- Firebase Auth + Firestore for users (`profiles`), games (`games`), and player submissions (`submissions`).
- IGDB proxy (`api/local-igdb-server.js`) fetches games/platforms, normalizes covers/releases, and avoids CORS issues. `scripts/dev.js` runs the proxy and Expo Web together.
- Image handling via `expo-image-picker` and `expo-image-manipulator` (compresses uploads to data URLs so Cloud Storage isn’t required).
- Device-aware layout (`app/device-context`) toggles desktop/mobile experiences and header rendering.

### Data Model (Firestore)
- `profiles`: `{ displayName, username, email, photoData }` (photo stored as base64 to keep everything in Firestore).
- `games`: canonical game records (often `igdb_<id>`): `{ title, titleLower, year, developer, platform, platforms[], releases[], imageUrl, igdbId, source, manual, createdAt, updatedAt }`.
- `submissions`: player entries linking a game to a user: `{ gameId, userId, title, year, developer, platform, imageUrl, igdbId, completionType, completionValue, playerNotes, source, manual, createdAt, updatedAt }`.

## Local Setup
1) Install dependencies  
```bash
npm install
```
2) Create `.env.local` in the project root (Expo surfaces these as `EXPO_PUBLIC_*`):  
```env
API_PORT=3000
EXPO_PUBLIC_API_BASE_URL=http://localhost
EXPO_PUBLIC_FIREBASE_API_KEY=<your_firebase_key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<your_auth_domain>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<your_project_id>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<your_storage_bucket>
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
EXPO_PUBLIC_FIREBASE_APP_ID=<your_app_id>
IGDB_CLIENT_ID=<your_igdb_client_id>
IGDB_CLIENT_SECRET=<your_igdb_client_secret>
```
3) Run the app (starts IGDB proxy + Expo Web):  
```bash
npm run dev
```
   - Proxy runs on `http://localhost:3000/api/igdb/{games,platforms}`. Expo Web opens at the usual Metro URL.  
   - If you prefer a pure Expo flow: `npm run web` (UI only) or `npm start -- --android/--ios`.

## Deployment Notes
- Web build matches the prototype styling and runs as a static Expo Web app. Ensure env vars above are configured on Web 4/Vercel/Firebase Hosting.
- The IGDB proxy must be available at `/api/igdb/*`. On Web 4/Vercel you can deploy `api/local-igdb-server.js` (or equivalent serverless functions) and point `EXPO_PUBLIC_API_BASE_URL` to that host.
- Firebase project should include Firestore and Email/Password auth enabled; Firestore rules must allow the reads/writes implied by the CRUD flows.

## How to Use (Instructor Ready)
- Sign up or log in, then open `/submit`.
- Search for a game (IGDB) or toggle “Manual Game Entry”; lock metadata, pick/resize a cover, choose completion type/value, add notes, and submit.
- Browse the animated home feed or filter on `/search`; edit/delete only your own cards.
- Add the final Web 4/Firebase link above before turning in. README now contains the full description requested in the rubric.
