# PFOS — Personal Finance Operating System

> Text an expense to your Telegram bot and it parses, categorizes (with AI), and stores it in seconds. It pushes a daily summary, weekly insights, and a monthly AI coaching report — *and* you can just **ask it questions** ("how much did I spend on food this year?"). A live web dashboard visualizes everything.

![Status](https://img.shields.io/badge/v4-Complete%20(6%2F6%20phases)-brightgreen)
![Stack](https://img.shields.io/badge/stack-Telegram%20%2B%20n8n%20%2B%20Gemini%20%2B%20Sheets%20%2B%20React-blue)
![Dashboard](https://img.shields.io/badge/dashboard-live-success)
![Tests](https://img.shields.io/badge/Phase%201%20logic%20tests-40%2F40-success)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

**🔗 Live dashboard (demo data):** https://pfos-three.vercel.app/

---

## Why I built this

I wanted a frictionless way to track spending — no app to open, no form to fill, just a text message. But I also built it deliberately as a **case study in reliable AI automation**: schema-first data design, composable workflows, cost-aware AI, deterministic math with AI only for narration, and an audit trail on every machine-generated value.

The build is **phased on purpose** — prove the plumbing works with simple rules before adding any AI, then layer intelligence (categorization → insights → coaching → a dashboard → a conversational agent) on a foundation that's already trustworthy.

```
You text:  "450 swiggy"                 You ask:  "how much on food in 2024?"
              │                                       │
              ▼                                       ▼
   ✅ ₹450 logged · Food & Dining        🤖 "₹14,337 across 103 orders,
      (Want) · 95% confidence                avg ₹139 — your biggest months
              │                                were Sep & Oct."
   ┌──────────┴───────────┐
   │  9 PM   📊 Daily       │   Sundays  📈 Weekly insights + anomalies
   │  1st    🎯 Monthly     │            coaching report
   └──────────────────────┘
```

---

## Architecture

A clean 4-layer separation — each layer can be explained, demoed, and swapped independently.

```
┌──────────────────────────────────────────────────────────────┐
│ CAPTURE / INTERFACE   Telegram bot  ·  React dashboard (Vercel)│
└───────────────────────────────┬──────────────────────────────┘
                                │ webhook / JSON API
┌───────────────────────────────▼──────────────────────────────┐
│ ORCHESTRATION   n8n (Docker, Oracle Cloud) — 6 workflows       │
│ webhook + scheduled triggers, intent routing, AI agent, errors │
└──────────┬───────────────────────────────────┬───────────────┘
           │                                   │
┌──────────▼────────┐                ┌─────────▼────────────┐
│ INTELLIGENCE      │                │ PERSISTENCE          │
│ Gemini API        │◄──────────────►│ Google Sheets (DB)   │
│ extract · narrate │                │ 7 tabs               │
│ · tool-calling    │                │                      │
└───────────────────┘                └──────────────────────┘
```

> **The mental model:** n8n is the *nervous system*, Gemini is the *brain*, Sheets is the *memory*, Telegram + the dashboard are the *face*.

| Tool | Role | Why this choice |
|---|---|---|
| **Telegram** | Capture & conversation | Already used daily — zero adoption friction |
| **n8n** | Orchestration | Self-hosted, visual, free, easy to demo |
| **Gemini API** | Intelligence | Categorization, insights, coaching, agent reasoning |
| **Google Sheets** | Database | Transparent, debuggable, shareable |
| **React + Vercel** | Dashboard | Beautiful, interactive, shareable portfolio piece |

---

## The six phases (all complete ✅)

| Phase | Capability | AI | Status |
|---|---|---|---|
| **1 — Foundation** | Telegram capture + daily summary, rule-based categorization | — | ✅ |
| **2 — AI Categorization** | Gemini extraction + confidence scoring + clarification fallback | ✓ | ✅ |
| **3 — Financial Insights** | Weekly pattern analysis + anomaly detection (vs 3-week baseline) | ✓ | ✅ |
| **4 — AI Financial Coach** | Monthly report: savings rate, MoM trends, top spending leaks | ✓ | ✅ |
| **5 — Live Dashboard** | React/Vercel dashboard: KPIs, charts, filters, quick-add, AI insights | ✓ | ✅ |
| **6 — Agentic Assistant** | Ask questions; tool-calling agent reasons over your data + memory | ✓ | ✅ |

**Design principle across phases 3–6:** all numbers are computed **deterministically in code**; the LLM only *narrates* them. The agent can read data and keep memory notes but has **no tool that edits transactions** — it can never silently corrupt your ledger.

---

## Workflows

Composable, single-purpose n8n workflows — a bug in one can't break the others, and each is independently testable.

| Workflow | Trigger | What it does |
|---|---|---|
| **W1 — Capture & Confirm** | Telegram message | Classify intent → log expense (Gemini extract + confidence) **or** route to the AI agent |
| **W2 — Evening Summary** | Daily 9 PM IST | Aggregate the day → `DailySummary` → Telegram push |
| **W3 — Weekly Insights** | Sunday 8 PM IST | Current week vs prior-3-week baseline + anomaly flags → `WeeklyInsights` → push |
| **W4 — Monthly Coach** | 1st of month | Savings rate, MoM change, top leaks + Gemini coaching → `MonthlyReports` → push |
| **W6 — Dashboard API** | Webhook | Token-gated JSON API for the dashboard (data, quick-add, on-demand insight) |
| **W7 — Agent API** | Webhook | Token-gated agent tools: `/query` spending, `/memory` recall + save |

---

## The dashboard (Phase 5)

A dark, glassmorphism single-page app (Vite + React + Tailwind + Recharts) hosted on Vercel.

- **KPI cards** · spend-over-time · category donut · needs-vs-wants · top merchants
- **Range switches** (Today / Week / Month / All) and category filter chips
- **Quick-add expense** and **Generate insight** actions
- **Two modes, one app:** a public **demo** (bundled sample data — safe to share) and **live** mode (your real data, unlocked with an access token kept in your browser).

Calls the n8n API through a Vercel rewrite, so the browser is same-origin (no CORS) and the Google credential stays server-side.

---

## Data model

Designed like a real database from day one (physically implemented as Google Sheets tabs):

| Tab | Role |
|---|---|
| `Transactions` | Fact table — one row per logged expense |
| `Categories` | Controlled vocabulary (Food & Dining, Transport, …) |
| `CategoryRules` | Keyword → category mappings (Phase-1 fallback / AI few-shot seed) |
| `DailySummary` | Daily rollup (W2) |
| `WeeklyInsights` | Weekly narrative + anomaly flags (W3) |
| `MonthlyReports` | Monthly coaching report + metrics (W4) |
| `MemoryNote` | Agent's long-term memory — facts, goals, preferences (W7) |

Core principle: **every AI-generated field sits next to a `user_corrected` / audit field**, so corrections become data — the system is built to get more reliable over time.

---

## Repository layout

```
PFOS/
├── docs/                          # Architecture + per-phase setup guides
│   ├── PFOS_v4_Architecture.md
│   ├── W1_setup_guide.md … W4_setup_guide.md
│   ├── Phase5_dashboard_setup_guide.md
│   └── Phase6_agent_setup_guide.md
├── n8n/workflows/                 # Importable workflow JSON (W1–W4, W6, W7)
├── dashboard/                     # React + Vite + Tailwind dashboard (Phase 5)
├── sheets/templates/              # CSV templates for each Sheets tab
├── tests/test_phase1.mjs          # Logic test harness (no bot needed)
└── README.md
```

> Workflow JSON and dashboard configs ship with **secrets stripped** (placeholders like `GEMINI_API_KEY`, `DASHBOARD_TOKEN`, `TELEGRAM_CHAT_ID`). Add your own when importing.

---

## Getting started

**Prerequisites:** Docker, a Telegram bot ([@BotFather](https://t.me/BotFather)), a Google Cloud project with the Sheets API, and a [Gemini API key](https://aistudio.google.com) (Phase 2+).

```bash
git clone https://github.com/adarshyadavnitb-dotcom/PFOS.git
cd PFOS

# Start n8n (IST timezone)
docker run -d --name n8n -p 5678:5678 \
  -e GENERIC_TIMEZONE=Asia/Kolkata -e TZ=Asia/Kolkata \
  -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n

open http://localhost:5678   # import workflows from n8n/workflows/
```

Then follow the per-phase guides in [`docs/`](docs/) — each covers the tabs, credentials, and tests for that workflow. The dashboard has its own quickstart in [`dashboard/`](dashboard/) and [docs/Phase5_dashboard_setup_guide.md](docs/Phase5_dashboard_setup_guide.md).

In production this runs 24/7 on an Oracle Cloud Always-Free instance (n8n in Docker behind Caddy with HTTPS); the dashboard is on Vercel.

---

## Engineering decisions worth calling out

- **Composable, not monolithic** — six single-purpose workflows; failures are isolated and each is independently testable.
- **Schema-first** — entities and relationships designed before any tab existed, so new phases didn't force rebuilds.
- **Config in data, not code** — categories and rules live in Sheets; behavior changes are spreadsheet edits.
- **Deterministic math, AI narration** — every figure is computed in code; the LLM only explains it, so the system never hallucinates your numbers.
- **Auditable + safe AI** — AI outputs sit beside human-correction fields, and the agent has read + append-only-memory access (no transaction-edit tool).
- **Cost-aware** — pre-aggregate before calling the model, strict-JSON extraction, confidence thresholds, and a small fast model for the agent loop.
- **Tested logic** — the harness runs the *actual* deployed Code-node JavaScript and even encodes a known limitation as expected behavior, so the suite stays honest.

---

## License

MIT — see [LICENSE](LICENSE).
