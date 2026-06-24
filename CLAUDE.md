# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> ⚠️ **Secrets live outside this repo.** Server IP/SSH key, n8n login, Gemini API key, dashboard token, and Telegram chat ID are in the assistant's private memory (and as live values inside the running n8n instance) — **never commit them.** Committed workflow JSON uses placeholders: `GEMINI_API_KEY`, `DASHBOARD_TOKEN`, `TELEGRAM_CHAT_ID`, and empty credential ids.

## Commands

```bash
# Dashboard (from dashboard/)
npm run dev          # dev server with proxy to live n8n
npm run build        # TypeScript check + Vite production build

# Tests
node tests/test_phase1.mjs   # Phase 1 logic test harness (40 tests, no bot needed)

# npm cache workaround (root-owned ~/.npm on this machine)
npm install --cache /tmp/npm-cache
```

Vercel auto-deploys on every push to `main` (root dir = `dashboard/`).

## Architecture

**Data flow:** Telegram → n8n (Docker, Oracle Cloud) → Gemini API → Google Sheets → n8n webhooks → React dashboard (Vercel)

### n8n Workflows (`n8n/workflows/`)

| File | Trigger | Purpose |
|---|---|---|
| W1_capture_and_confirm | Telegram message | Classify intent → expense pipeline (Gemini extract + confidence) **or** LangChain agent |
| W2_evening_summary | Daily 9 PM IST | Aggregate day → DailySummary tab → Telegram |
| W3_weekly_insights | Sunday 8 PM IST | Current week vs prior-3-week baseline → WeeklyInsights → Telegram |
| W4_monthly_coach | 1st of month | Full month report → MonthlyReports → Telegram |
| W6_dashboard_api | Webhook (GET/POST) | Token-gated: `/data` (all transactions), `/add` (quick-add), `/insight` (on-demand Gemini insight) |
| W7_agent_api | Webhook (GET/POST) | Token-gated: `/query` (aggregate with filters), `/memory` (read/append MemoryNote) |

W1 intent routing: heuristic Code node (question words / `?` → agent; digit present → expense). Agent uses three `toolHttpRequest` tools that call W7 over HTTP.

### Dashboard (`dashboard/src/`)

Single-page React app (Vite + TypeScript + Tailwind + Recharts + Framer Motion). Two modes:
- **Demo**: bundled `demoData.ts` (seeded RNG, no network calls)
- **Live**: token stored in `localStorage`; `api.ts` calls `/api/pfos/*` which Vercel rewrites to the n8n webhook

Data flow in live mode: `fetchData()` → W6 `/data` → all Transactions rows → `App.tsx` holds raw `ApiData` → `aggregate.ts` does **all filtering and aggregation client-side** (no second server round-trip for range/category changes).

Key aggregation files:
- `src/lib/aggregate.ts` — `filterByRange`, `computeKpis`, `categoryBreakdown`, `spendSeries`, `topMerchants`
- `src/lib/format.ts` — `parseDate` (wraps `new Date(s)`), `inr`, `inrCompact`
- `src/types.ts` — `Txn`, `ApiData`, `RangeKey`, `CATEGORIES`

### Google Sheets (single spreadsheet, 7 tabs)

`Transactions_headers` (gid 1585632130) is the fact table — every other workflow reads from it. The `Build Data` Code node in W6 maps sheet columns to `Txn` shape: `timestamp → date`, `merchant_vendor → merchant`.

## Design rules

- **Deterministic math, AI narration** — Code nodes compute all figures; Gemini only writes prose. Never let the model do arithmetic.
- **Agent is read + append-only** — no tool that edits or deletes transactions.
- **Config in data** — categories/rules live in Sheets tabs, not in workflow code.
- After editing any workflow in n8n, export it back to `n8n/workflows/` with secrets scrubbed and commit.

## n8n REST API patterns

Base URL: `https://80.225.221.129.sslip.io`. Login: `POST /rest/login` (`emailOrLdapLoginId` field) — rate-limited (back off on 429).

- **Update workflow**: `PATCH /rest/workflows/{id}` (not PUT). Omit `tags` field. Activation requires `{versionId}` in the body.
- **Manual run**: `POST /rest/workflows/{id}/run` with `{"workflowData": wf, "triggerToStartFrom": {"name": "<trigger node name>"}}` — omitting `triggerToStartFrom` causes 500.
- **Executions list**: `data.results` (n8n 2.x changed from `data.data`).
- **Delete**: must `POST .../archive` first, then `DELETE`.
- **Google Sheets append**: use `mappingMode: autoMapInputData`; name upstream Code node output fields to match sheet column headers exactly (n8n 2.x rejects `defineBelow` without `columns.schema`).
- **respondToWebhook**: use `respondWith: firstIncomingItem` — object expressions (`={{ $json }}`) return empty.

## Known gotchas

- **Code node stalls**: n8n task runner stalls under memory pressure on the 1 GB VM (`Offer expired` in logs) → `docker restart n8n`.
- **Agent model quota**: must use `gemini-3.1-flash-lite` — `gemini-2.5-flash` free quota is near zero; the agent makes several calls per question → instant 429.
- **toolHttpRequest token**: put `?token=VALUE` directly in the tool URL. Token passed as a keypair param gets dropped → 401.
- **toolHttpRequest params with special chars**: pass model-filled params as keypair query params (n8n URL-encodes them). Inline URL `{placeholders}` break on `&` and spaces (e.g. "Food & Dining").
- **Chained Sheets reads**: a Google Sheets read node runs once per incoming item — keep one read per chain to avoid fan-out.
- **Dashboard build**: do NOT use `manualChunks` to split React/vendor (causes blank screen due to init-order). Avoid `backdrop-filter` / `backdrop-blur` (re-blurs on every scroll frame = jank).
- **W1 node references**: after the intent classifier was added before the expense pipeline, Code nodes that previously read `$input` must now read from `$('Telegram Trigger')` directly.
