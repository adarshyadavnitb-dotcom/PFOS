# PFOS — Personal Finance Operating System

> Log an expense by texting your own Telegram bot. It parses, categorizes, and stores it in Google Sheets, replies in seconds, and sends you an automatic daily summary every evening.

![Status](https://img.shields.io/badge/Phase%201-Live-brightgreen)
![Stack](https://img.shields.io/badge/stack-Telegram%20%2B%20n8n%20%2B%20Sheets-blue)
![Tests](https://img.shields.io/badge/Phase%201%20logic%20tests-40%2F40-success)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Why I built this

I wanted a frictionless way to track spending — no app to open, no form to fill, just a text message. But I also designed it deliberately as a **case study in building reliable automation**: schema-first data design, composable workflows, cost-aware AI, and an audit trail on every machine-generated value.

The build is **phased on purpose** — prove the plumbing works with simple rules before adding any AI, then layer intelligence on a foundation that's already trustworthy.

```
You text:  "450 swiggy"
              │
              ▼
   ✅ ₹450 logged under Food & Dining (Want)
              │
   ┌──────────┴───────────┐
   │  ...and every 9 PM:   │
   │  📊 Daily Summary     │
   │  💰 Total: ₹1,250     │
   │  🏆 Top: Food & Dining│
   └──────────────────────┘
```

---

## Architecture

A clean 4-layer separation — each layer can be explained, demoed, and swapped independently.

```
┌─────────────────────────────────────────────┐
│ CAPTURE        Telegram bot (text)           │
└───────────────────────┬─────────────────────┘
                        │ webhook
┌───────────────────────▼─────────────────────┐
│ ORCHESTRATION  n8n (Docker)                  │
│ webhook + scheduled triggers, routing, errors│
└──────────┬─────────────────────┬─────────────┘
           │                     │
┌──────────▼────────┐  ┌─────────▼────────────┐
│ INTELLIGENCE      │  │ PERSISTENCE          │
│ Gemini (Phase 2+) │◄►│ Google Sheets (DB)   │
└───────────────────┘  └──────────────────────┘
```

> **The mental model:** n8n is the *nervous system*, Gemini is the *brain*, Sheets is the *memory*, Telegram is the *mouth and ears*.

| Tool | Role | Why this choice |
|---|---|---|
| **Telegram** | Input & output | Already used daily — zero adoption friction |
| **n8n** | Orchestration | Self-hosted, visual, free, easy to demo |
| **Google Sheets** | Database | Transparent, debuggable, shareable |
| **Gemini API** | Intelligence (Phase 2+) | Categorization, insights, coaching |

---

## What works today (Phase 1 — Live ✅)

Two independent, self-hosted workflows, **no AI** — the foundation:

| Workflow | Trigger | What it does |
|---|---|---|
| **W1 — Capture & Confirm** | Telegram message | Extract amount + merchant → keyword-match category → append to Sheets → reply with confirmation |
| **W2 — Evening Summary** | Daily at 9 PM IST | Aggregate the day's spend → write `DailySummary` → push a formatted Telegram summary |

**Tested:** core parsing, categorization, and summary math are covered by a logic harness that runs the *real* Code-node JavaScript pulled straight from the workflow JSON — **40/40 checks passing**, no live bot required:

```bash
node tests/test_phase1.mjs
```

---

## Roadmap

| Phase | Capability | AI | Status |
|---|---|---|---|
| **1 — Foundation** | Telegram capture + daily summary, rule-based | — | ✅ Live |
| **2 — AI Categorization** | Gemini extraction + confidence scoring + clarification fallback | ✓ | ⏳ Next |
| **3 — Financial Insights** | Weekly pattern analysis + anomaly detection | ✓ | Planned |
| **4 — AI Financial Coach** | Monthly report: savings rate, MoM trends, spending leaks | ✓ | Planned |
| **5 — Agentic Assistant** | Ask questions; agent reasons over tools + memory (RAG) | ✓ | Planned |

---

## Data model

Designed like a real database from day one (physically implemented as Google Sheets tabs):

| Tab | Role |
|---|---|
| `Transactions` | Fact table — one row per logged expense |
| `Categories` | Controlled vocabulary (Food & Dining, Transport, …) |
| `CategoryRules` | Keyword → category mappings (also seeds Phase 2 AI few-shot) |
| `DailySummary` | Aggregated daily rollup from W2 |

A core design principle: **every AI-generated field sits next to a `user_corrected` / audit field**, so corrections are captured as data, not lost — the system is built to get more reliable over time.

---

## Repository layout

```
PFOS/
├── docs/                       # Architecture + per-workflow setup guides
│   ├── PFOS_v4_Architecture.md
│   ├── W1_setup_guide.md
│   └── W2_setup_guide.md
├── n8n/workflows/              # Importable workflow JSON (W1, W2)
├── sheets/templates/           # CSV templates for each Sheets tab
├── tests/test_phase1.mjs       # Logic test harness (no bot needed)
├── setup.sh                    # Scaffolds the folder structure
└── README.md
```

---

## Getting started

**Prerequisites:** Docker, a Telegram bot ([@BotFather](https://t.me/BotFather)), and a Google Cloud project with the Sheets API enabled.

```bash
# 1. Clone
git clone https://github.com/adarshyadavnitb-dotcom/PFOS.git
cd PFOS

# 2. Start n8n (with IST timezone)
docker run -d --name n8n -p 5678:5678 \
  -e GENERIC_TIMEZONE=Asia/Kolkata -e TZ=Asia/Kolkata \
  -v n8n_data:/home/node/.n8n n8nio/n8n

# 3. Open n8n and import the workflows from n8n/workflows/
open http://localhost:5678
```

Full step-by-step setup (Telegram bot, Sheets tabs, credentials, testing) is in
[docs/W1_setup_guide.md](docs/W1_setup_guide.md) and [docs/W2_setup_guide.md](docs/W2_setup_guide.md).

> **Note:** for local self-hosting, Telegram reaches your machine via a tunnel (e.g. `cloudflared`). The tunnel URL must be live and set as n8n's `WEBHOOK_URL`.

---

## Engineering decisions worth calling out

- **Composable, not monolithic** — capture and summary are separate workflows; a bug in one can't break the other, and each is independently testable.
- **Schema-first** — entities and relationships designed before any tab was created, so new features don't force a rebuild.
- **Config in data, not code** — categories and keyword rules live in Sheets, so changing behavior is a spreadsheet edit, not a workflow edit.
- **Prove it without AI first** — Phase 1 is deliberately rule-based to validate the pipeline before adding model complexity (and cost).
- **Tested logic** — the test harness executes the actual deployed Code-node logic, and even encodes a known limitation (substring keyword matching) as expected behavior so the suite stays honest.

---

## License

MIT — see [LICENSE](LICENSE).
