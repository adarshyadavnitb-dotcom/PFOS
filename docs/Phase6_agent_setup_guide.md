# Phase 6: Agentic Assistant — Setup Guide

Phase 6 turns the Telegram bot from a logger into an **assistant that answers questions and remembers things**. The same bot now handles two kinds of messages:

- **Expense** ("250 zomato") → the deterministic Phase 2 logging pipeline
- **Question** ("how much did I spend on Food in 2024?", "remember my rent is ₹18,750") → a tool-calling AI agent

## Architecture

```
Telegram message
   │
   ▼
W1: Classify Intent (heuristic Code)  →  Route (IF)
   │ expense                                   │ question
   ▼                                           ▼
[Phase 2 logging pipeline]            AI Agent (LangChain)
 Build Body → Gemini → Parse           ├─ Gemini Chat Model (gemini-3.1-flash-lite)
 → Confidence → Write → Confirm        ├─ tool: query_transactions ─┐
                                       ├─ tool: recall_memory ───────┤── HTTP →  W7 Agent API
                                       └─ tool: save_memory ─────────┘            │
                                              │                                   ▼
                                              ▼                          Google Sheets
                                       Send Agent Reply (Telegram)     (Transactions, MemoryNote)
```

**Two workflows:**
- **W1 — Capture & Confirm** now contains the intent classifier + the AI Agent branch (alongside the existing logging branch).
- **W7 — Agent API** exposes the token-gated HTTP endpoints the agent's tools call.

## Why this shape
- A Telegram bot has **one** webhook, so the agent must live in W1 and route internally — not a second workflow/bot.
- **Logging stays deterministic** (Phase 2 pipeline untouched); only questions go to the LLM agent.
- Tools call **W7 over HTTP**, so the Google credential stays server-side and tool logic is plain, debuggable n8n.
- **All numbers come from `/query`** (deterministic aggregation) — the agent is instructed never to do math itself, so it can't hallucinate figures.

---

## W7 Agent API endpoints (token-gated)

| Method | Path | Purpose |
|---|---|---|
| GET | `/webhook/pfos-api/query` | Aggregate spending: `category, start_date, end_date, group_by` (category/month/merchant) → totals, counts, averages, breakdowns |
| GET | `/webhook/pfos-api/memory` | Recall notes (optional `q` keyword filter) |
| POST | `/webhook/pfos-api/memory` | Save a note `{note, tags}` to the MemoryNote tab |

## The agent's tools (LangChain `toolHttpRequest`)
- **query_transactions** → GET `/query`
- **recall_memory** → GET `/memory`
- **save_memory** → POST `/memory`

**Critical wiring lessons (these cost real debugging):**
1. **Token in the URL**, not as a model-filled keypair param — otherwise auth fails (the agent's call drops it). URL = `.../query?token=<TOKEN>`.
2. **Model-filled params as keypair query params**, *not* URL `{placeholders}` — n8n URL-encodes keypair values, so `category=Food & Dining` (with `&` and spaces) is sent correctly. Inline URL placeholders break on those characters.
3. **Chat model = `gemini-3.1-flash-lite`** — the agent makes several Gemini calls per question (the tool loop), and `gemini-2.5-flash` has near-zero free quota → instant 429. Flash-lite has the usable free quota (≈15 RPM / 500 RPD).
4. Respond nodes use **`respondWith: firstIncomingItem`** (object expressions return empty).

---

## Setup from scratch (fresh n8n)

### 1. Gemini credential
Create a **Google Gemini (PaLM) API** credential (type `googlePalmApi`): host `https://generativelanguage.googleapis.com`, API key = your AI Studio key.

### 2. MemoryNote tab
Add a tab named `MemoryNote` with headers: `timestamp`, `note`, `tags`.

### 3. Import W7 (`n8n/workflows/W7_agent_api.json`)
- Replace `DASHBOARD_TOKEN` in the three **Auth** IF nodes with your shared token.
- Connect the Google Sheets credential on the read/append nodes; confirm Transactions + MemoryNote tabs.
- Publish. Test: `curl ".../webhook/pfos-api/query?token=<TOKEN>&group_by=category"`.

### 4. Import W1 (`n8n/workflows/W1_capture_and_confirm.json`)
- **Call Gemini** node: put your real key back (`key=GEMINI_API_KEY` → real).
- **Gemini Chat Model**: select the Gemini credential; model `models/gemini-3.1-flash-lite`.
- The three tool nodes: replace `DASHBOARD_TOKEN` in their URLs with your token.
- Reconnect Telegram + Google Sheets credentials on the logging nodes.
- Publish (this registers the Telegram webhook).

---

## How intent routing works
`Classify Intent` is a fast, free heuristic (no extra LLM call): if the message contains question words (how/what/which/total/remember/recall/top/…) or `?` → **question**; else if it contains a digit → **expense**; otherwise → question. This keeps expense logging instant and only spends LLM calls on real questions. (Swap in an LLM classifier later if edge cases matter.)

## Example questions it handles
- "How much did I spend on Food & Dining in 2024?"
- "What are my top 3 categories overall?"
- "How much on Transport last month vs this month?"
- "Remember I'm trying to cut down on cigarettes" → saves
- "What do you remember about me?" → recalls

---

## Operational notes & troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Bot replies to nothing; logs show `Task rejected by Runner — Offer expired` | n8n 2.x Code-node task runner stalled (memory pressure on 1 GB) | `docker restart n8n`; consider more swap / fewer concurrent runs |
| Agent path errors `receiving too many requests` | Gemini 429 (model quota / RPM) | Use `gemini-3.1-flash-lite`; space out questions |
| Expense path errors `Cannot read ... 'text'` | A Code node read `$input` after the classifier instead of the trigger | Read `$('Telegram Trigger').first().json.message.text` |
| Agent tool returns "authentication error" | Token sent as keypair param, dropped | Put `?token=…` in the tool URL |
| Tool returns 0 / wrong totals | Category with `&`/spaces injected unescaped via URL placeholder | Use keypair query params (auto-encoded) |
| Executions REST returns empty | n8n 2.x shape changed | Read `data.results`, not `data.data` |

> **Guardrail:** the agent has read access plus append-only memory notes. It has **no tool that edits or deletes transactions** — by design, it can never silently corrupt your ledger.
