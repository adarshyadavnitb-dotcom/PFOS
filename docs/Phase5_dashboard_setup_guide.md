# Phase 5: Live Dashboard — Setup Guide

A beautiful, interactive web dashboard for PFOS. It visualizes your expense data with KPIs, charts, range/category filters, a quick-add form, and on-demand AI insights — in a dark glassmorphism design with a light theme toggle.

It has **two modes in one app**:
- **Demo mode (default):** ships with a bundled sample dataset. Safe to share publicly (résumé/LinkedIn) — no real data, no secrets.
- **Live mode:** "Connect my data" takes a secret access token and pulls your real numbers from the n8n API. The token lives only in your browser.

## Pieces

| Piece | What it is | Where |
|---|---|---|
| **Frontend** | React + Vite + Tailwind + Recharts + Framer Motion | `dashboard/` |
| **Backend API** | n8n workflow **W6 — Dashboard API** (token-gated webhooks) | `n8n/workflows/W6_dashboard_api.json` |
| **Hosting** | Vercel (static) + rewrites that proxy `/api/pfos/*` → n8n | `dashboard/vercel.json` |

## How data flows (no CORS)

```
Browser → (same-origin) /api/pfos/data
        → Vercel rewrite (prod) / Vite proxy (dev)
        → https://<server>/webhook/pfos-api/data?token=…
        → n8n W6 reads Google Sheets → JSON
```

Because the browser only ever calls its own origin (`/api/pfos/*`), there is **no CORS** to configure. The proxy forwards server-side.

---

## W6 Dashboard API — endpoints

All are token-gated (`?token=…`); a wrong token returns `401`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/webhook/pfos-api/data` | Returns `{ monthly_income, transactions[], generated_at }` |
| POST | `/webhook/pfos-api/add` | Quick-add an expense → appends to Transactions |
| POST | `/webhook/pfos-api/insight` | Generates a fresh weekly insight, sends it to Telegram, returns the text |

**Design notes**
- The API stays "dumb": it returns trimmed transactions and the client does all range/category filtering for instant switches.
- The income figure for savings rate is the constant in the **Build Data** node (kept in sync with W4).
- The Gemini call in the insight endpoint has **retry-on-fail** to survive transient 503s.
- ⚠️ Gotcha learned: chained Google Sheets *read* nodes run once **per incoming item**. Keep a single read per chain (or fan-in with a Merge), or the second read executes hundreds of times.

---

## Run it locally

```bash
cd dashboard
npm install
npm run dev      # http://localhost:5173
```

The Vite dev server proxies `/api/pfos/*` to the n8n server (see `vite.config.ts`), so live mode works locally too — just paste your token via "Connect my data".

To type-check + production build:
```bash
npm run build    # outputs dist/
```

---

## Deploy to Vercel

**Option A — Vercel dashboard (recommended):**
1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → **Add New → Project** → import the `PFOS` repo.
3. Set **Root Directory** to `dashboard`.
4. Framework preset auto-detects **Vite** (build `npm run build`, output `dist`). Leave defaults.
5. **Deploy.** `dashboard/vercel.json` wires the `/api/pfos/*` → n8n rewrite automatically.

**Option B — Vercel CLI:**
```bash
cd dashboard
npx vercel            # first run links/creates the project
npx vercel --prod     # production deploy
```

The public URL defaults to **demo mode**. To see your real data, click **Connect my data** and paste your access token.

---

## The access token

The dashboard token is the shared secret checked by every W6 endpoint. It is **not** stored in the repo — the committed workflow uses the placeholder `DASHBOARD_TOKEN`.

- The live server has a real token configured in the W6 **Auth** IF nodes.
- Enter it once in the dashboard's "Connect my data" dialog; it's saved in `localStorage` (key `pfos_token`).
- To rotate it: change the `rightValue` in the three **Auth** IF nodes of W6, re-activate, and re-enter it in the dashboard.

---

## Setting up W6 from scratch (fresh n8n)

1. Import `n8n/workflows/W6_dashboard_api.json`.
2. In the **Call Gemini Insight** node URL, replace `GEMINI_API_KEY` with your real key.
3. In the three **Auth** IF nodes, replace `DASHBOARD_TOKEN` with your chosen secret.
4. In **Send Insight TG**, replace `TELEGRAM_CHAT_ID` with your chat ID; connect the Telegram + Google Sheets credentials.
5. Confirm the Google Sheets read/append nodes point at your spreadsheet + `Transactions` tab.
6. **Publish.** Test: `curl "https://<server>/webhook/pfos-api/data?token=<secret>"`.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Dashboard shows demo data after entering token | Token rejected (401) | Re-check the token matches the W6 Auth nodes |
| Empty/`200` with no body from `/data` | Multiple chained Sheets reads running per-item | Keep one read per chain (already fixed in W6) |
| Insight button errors | Transient Gemini 503 | Retry; the node already retries 3× |
| Charts empty | No transactions in the selected range | Switch range to "All" |
| Quick-add does nothing in demo | By design — demo adds are local only | Connect live data to persist to the sheet |
