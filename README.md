# 阿瓦隆 · Avalon Web App

React + Vite + Tailwind + Firebase Firestore. Mobile-first player phones + iPad referee dashboard.

## Setup

```bash
npm install
cp .env.example .env     # fill in Firebase config
npm run dev
```

### Firebase

1. Create a Firebase project.
2. Enable **Authentication → Anonymous**.
3. Enable **Firestore** in production mode, then paste `firestore.rules` into the Rules tab.
4. Copy the web app config into `.env` (the four `VITE_FIREBASE_*` values).

### Assets you provide

- `public/images/roles/{merlin,percival,loyal,mordred,morgana,assassin,oberon,minion}.png` — role portraits.
- `public/audio/{all_close,evil_open,evil_close,merlin_open,merlin_close,percival_open,percival_close,all_open}.mp3` — optional narration files. Missing files automatically fall back to the browser's `speechSynthesis` (zh-CN).

## Flow

- **/** — create room, join room, or join as iPad referee.
- **/room/:id** — player device. Drives through phases: lobby → roleReveal → night → nominate → vote → mission → (lady) → (assassin) → end.
- **/room/:id/referee** — spectator dashboard. Does NOT appear in the player list, does NOT receive a secret, does NOT vote. Pure read-only view of phase, players, quest board, votes, rejections, event log.

## Deploy

Netlify auto-detects via `netlify.toml`. Add the four `VITE_FIREBASE_*` env vars in Netlify → Site settings → Environment.
