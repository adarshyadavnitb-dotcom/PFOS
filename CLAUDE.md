# CLAUDE.md — working notes for PFOS

Guidance for AI assistants working in this repo. **PFOS v4 is complete (all 6 phases).**

> ⚠️ **Secrets live outside this repo.** Server IP/SSH key, n8n login, Gemini API key, dashboard token, and Telegram chat ID are in the assistant's private memory (and as live values inside the running n8n instance) — **never commit them.** Committed workflow JSON and dashboard config use placeholders: `GEMINI_API_KEY`, `DASHBOARD_TOKEN`, `TELEGRAM_CHAT_ID`, and empty credential ids.

## What this is
A personal finance system: **Telegram → n8n → Gemini → Google Sheets**, plus a **React/Vercel dashboard**. Text an expense to log it (AI-categorized); get daily/weekly/monthly summaries; ask the bot questions (tool-calling agent). See `docs/PFOS_v4_Architecture.md` and the per-phase guides in `docs/`.

## Runtime
- **n8n**: Docker on an Oracle Cloud Always-Free VM, behind **Caddy** (HTTPS via Let's Encrypt + sslip.io). `TZ=Asia/Kolkata`. Volume `n8n_data`. n8n **v2.26.x**.
- **Dashboard**: Vercel (root dir `dashboard/`); `vercel.json` rewrites `/api/pfos/*` → the n8n webhook API (same-origin, no CORS). Auto-redeploys on push.
- **DB**: one Google Sheet, 7 tabs (Transactions, Categories, CategoryRules, DailySummary, WeeklyInsights, MonthlyReports, MemoryNote).

## Workflows (live in n8n; JSON mirrored in `n8n/workflows/`)
- **W1** Capture & Confirm — Telegram trigger → intent classifier → expense logging (Gemini extract + confidence) **or** AI agent branch.
- **W2** Evening Summary (daily 9 PM IST) · **W3** Weekly Insights (Sun 8 PM) · **W4** Monthly Coach (1st of month).
- **W6** Dashboard API · **W7** Agent API (token-gated webhooks over Sheets). *(W5 = a planned error-handler sub-workflow, not built.)*

## Conventions / design rules
- **Deterministic math, AI narration.** All figures are computed in Code nodes; Gemini only writes prose. Never let the model do arithmetic on the data.
- **Agent safety**: read + append-only memory (`MemoryNote`) only — no transaction-edit tool.
- **Config in data**: categories/rules live in Sheets, not code.
- After editing any workflow, **export it back to `n8n/workflows/` with secrets scrubbed** and commit. Keep repo JSON in sync with live.
- Commit/push only when asked. Scrub secrets before every commit (GitHub push protection will block real keys).

## Managing n8n over its REST API (how this project is operated)
Login `POST /rest/login` (field `emailOrLdapLoginId`); it's **rate-limited** (429 → back off). Then:
- Update workflow = **PATCH** `/rest/workflows/{id}` (not PUT). Omit `tags` (object form rejected). Activate needs `{versionId}` in body.
- Manual run = `POST /rest/workflows/{id}/run` with `{"workflowData": wf, "triggerToStartFrom": {"name": "<trigger node>"}}`.
- Executions list returns **`data.results`** (n8n 2.x); execution detail `data` is **flatted**-encoded (memoize when decoding, don't cut shared refs).
- Delete a workflow → must **archive first** (`POST .../archive`) then `DELETE`.
- Google Sheets append: use `mappingMode: autoMapInputData` (this version rejects `defineBelow` without a `columns.schema`); name upstream fields to match headers exactly.
- `respondToWebhook`: use `respondWith: firstIncomingItem` (object expressions return empty).

## Known gotchas (cost real debugging — don't repeat)
- **Code nodes** run in a task runner that **stalls under memory pressure** on the 1 GB VM (`Offer expired` in logs) → `docker restart n8n` clears it.
- **Agent chat model must be `gemini-3.1-flash-lite`** — `gemini-2.5-flash` free quota ≈0 → 429 (the agent makes several calls per question). Free tier ≈15 RPM / 500 RPD.
- LangChain `toolHttpRequest`: put `?token=` **in the URL**; pass model-filled params as **keypair query params** (auto URL-encoded) — inline URL `{placeholders}` break on `&`/spaces.
- Chained Google Sheets **read** nodes run **once per incoming item** — keep one read per chain (or fan in with Merge).
- Don't `manualChunks`-split React/vendor in the dashboard build (blank screen); avoid `backdrop-filter` (scroll jank).

## Local tooling notes
- `npm` cache has root-owned files → use `npm install --cache /tmp/...`.
- Dashboard: `cd dashboard && npm run build` to type-check + build.
- Phase 1 logic tests: `node tests/test_phase1.mjs`.
