# JARVIS AI Assistant

A JARVIS-inspired AI assistant with real accounts (MongoDB-backed), voice
input/output, image attachments, and a sci-fi HUD frontend. Started as a way
to learn full-stack dev + AI APIs, turned into an actual usable thing.

# LIVE DEMO- https://jarvis-ai-one-flax.vercel.app/

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

## How accounts work

- **Email**: password hashed with bcrypt before it touches the database.
  Real validation — a proper email format and a password with at least
  8 characters, a letter, and a number are required (both client and
  server side); common weak passwords are rejected outright. Login only
  ever succeeds for an email+password pair that actually matches what's
  in the database.
- **Google**: the ID token is verified server-side (`google-auth-library`)
  before creating/logging in the account — not just trusted from the browser.
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

