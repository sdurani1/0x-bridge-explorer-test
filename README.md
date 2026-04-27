# 0x Cross-Chain Lookup

Trace any 0x cross-chain bridge transaction step by step.

## Run locally

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Deploy to Vercel

**Option A — CLI (30 seconds):**
```bash
npm install -g vercel
vercel
```

**Option B — GitHub:**
1. Push to a GitHub repo
2. vercel.com → New Project → import repo → Deploy

Vercel auto-detects Vite. No config needed.

## How the lookup works

1. User pastes a tx hash and selects the origin chain
2. App fetches the tx from the public chain RPC
3. Extracts the `quoteId` automatically from the 0x calldata
4. Calls the 0x Cross-Chain Status API
5. Renders the full step-by-step journey

## Updating the API endpoint

When you move off the test API, update this line in `src/App.jsx`:

```js
const res = await fetch(`https://0x-cross-chain-status-one.vercel.app/api/status?${params}`);
```
