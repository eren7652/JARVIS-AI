# JARVIS AI Assistant

A JARVIS-inspired AI assistant with real accounts (MongoDB-backed), voice
input/output, image attachments, and a sci-fi HUD frontend. Started as a way
to learn full-stack dev + AI APIs, turned into an actual usable thing.

## Stack

- Node.js + Express backend
- MongoDB (via Mongoose) for accounts + chat history
- React (Vite) frontend
- Google Gemini API for AI responses (text + image understanding)
- JWT for sessions, bcrypt for password hashing, Google OAuth for
  "Sign in with Google", phone + OTP as a third login option
- Web Speech API for voice in/out (browser built-in)

## Setup

```bash
npm install
npm run build
cp .env.example .env
```

### 1. Gemini API key (free)
https://aistudio.google.com/apikey — sign in, create a key, paste into
`.env` as `GEMINI_API_KEY`.

### 2. MongoDB (free)
1. Go to https://www.mongodb.com/cloud/atlas/register and make an account
2. Create a free (M0) cluster
3. Under "Database Access," add a database user (use the "Autogenerate
   Secure Password" + "Copy" buttons so special characters get encoded
   correctly — don't type the password by hand)
4. Under "Network Access," add `0.0.0.0/0` (allow from anywhere)
5. Click "Connect" on your cluster -> "Drivers" -> copy the connection
   string
6. Add a database name right after `.net/`, e.g. `.../jarvis?...`
7. Paste the whole thing into `.env` as `MONGODB_URI`

### 3. JWT secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Paste the output into `.env` as `JWT_SECRET`.

### 4. Google sign-in (optional)
1. https://console.cloud.google.com/apis/credentials
2. Configure the OAuth consent screen (External, fill in app name + email)
3. Create Credentials -> OAuth client ID -> Web application
4. Add `http://localhost:3000` under Authorized JavaScript origins
5. Copy the Client ID into **two** places:
   - `.env` (root): `GOOGLE_CLIENT_ID=...`
   - `client/.env` (copy from `client/.env.example`): `VITE_GOOGLE_CLIENT_ID=...`

Rebuild after adding it: `npm run build`. Skip this and email/phone login
still work fine — the Google button just won't render.

### Run it
```bash
npm start
```
Open `http://localhost:3000`.

## Easier way to run it (Windows)

Double-click **`start-jarvis.bat`** instead of using the terminal — it
installs/builds if needed, starts the server, and opens the browser
automatically. Close the minimized "JARVIS Server" window when done.
(Mac/Linux: `start-jarvis.sh`)

## How accounts work

- **Email**: password hashed with bcrypt before it touches the database.
  Real validation — a proper email format and a password with at least
  8 characters, a letter, and a number are required (both client and
  server side); common weak passwords are rejected outright. Login only
  ever succeeds for an email+password pair that actually matches what's
  in the database.
- **Google**: the ID token is verified server-side (`google-auth-library`)
  before creating/logging in the account — not just trusted from the browser.
- **Phone + OTP**: enter a phone number, get a 6-digit code. Since there's
  no paid SMS provider wired in, the code is shown on-screen in "demo
  mode" instead of actually being texted — the whole flow (request code,
  verify code, create/find account) is real and working, it just isn't
  hooked up to a real SMS carrier yet. To go live with actual texting,
  wire in a provider like Twilio inside `routes/auth.js` (`smsConfigured`
  flag) and stop returning `devCode`.
- Sessions are JWTs, valid 30 days, stored in the browser's localStorage.
- Each user's conversations live in MongoDB, tied to their account.

## Features

- Type, talk, or attach an image — mic uses the browser's speech
  recognition, images get resized client-side and sent to Gemini's vision
  model
- Replies get read out loud
- Real accounts (email+password, Google, or phone/OTP), chat history tied
  to your account and persisted server-side
- Multiple conversations, sidebar to switch between + search across all
  of them (matches conversation titles and message text)
- Settings panel (click your profile at the bottom of the sidebar):
  profile (name, email/phone, profile picture), appearance (dark/light
  theme + language), security (change password / view sign-in method),
  about (version info)
- Dark/light theme toggle
- Language switcher (English, Hindi, Spanish, French, German, Japanese)
- Opening the app always starts a new chat; old ones stay in the sidebar

## Project layout

```
server.js              entry point, connects Mongo, mounts routes
models/
  User.js
  Conversation.js
routes/
  auth.js               signup / login / google / phone-otp / me / password
  chat.js                talks to Gemini (text + image)
  conversations.js       CRUD for chat history
middleware/
  auth.js                JWT check
client/src/
  App.jsx                main state/logic
  api.js                  fetch wrapper that attaches the auth token
  components/             Orb, TopBar, Sidebar, ChatPanel, LandingLogin,
                          Settings, BackgroundEmblem, ...
  i18n/                   translation strings
```

## If you want to change something

Frontend lives in `client/src`. After editing, rebuild:
```bash
npm run build
```
then restart the server (or refresh if it's already running).

JARVIS's personality/system prompt is in `routes/chat.js`.

## Deploying it live

Needs a real Node host since it's not a static site (Render, Railway,
Fly.io all have free tiers):

1. Push the repo to GitHub
2. On Render: New -> Web Service -> connect the repo
3. Build command: `npm run setup`
4. Start command: `npm start`
5. Add environment variables in Render's dashboard: `GEMINI_API_KEY`,
   `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`
6. Add the live Render URL to the Google OAuth client's Authorized
   JavaScript origins
7. Rebuild `client/.env` locally with the same `VITE_GOOGLE_CLIENT_ID`
   before pushing (it gets baked into the build at build time)

## Notes to self

- Gemini keeps deprecating model versions fast — if you get a 404, check
  https://ai.google.dev/gemini-api/docs/models and swap the model name in
  `routes/chat.js`
- Free Render web services spin down after inactivity, ~30s to wake back up
- Images are resized/compressed client-side before sending (max ~900px,
  JPEG quality 0.72) to keep requests and MongoDB storage small
- OTP codes are stored in memory on the server, not the database — they
  reset if the server restarts, which is fine since they only last 5 minutes
  anyway
