# PFOS v4 — Personal Finance Operating System

A personal expense tracking system that lets you log expenses via Telegram and automatically categorizes and stores them in Google Sheets. Built as a phased project that starts simple (no AI) and progressively adds intelligence.

## How It Works (The Simple Version)

```
You send "450 Swiggy" on Telegram
        |
        v
n8n receives it, extracts the amount and merchant
        |
        v
Looks up the category ("Food & Dining") from a keyword list
        |
        v
Writes a row to Google Sheets
        |
        v
Sends you back: "₹450 logged under Food & Dining (Want)"
```

Every evening at 9 PM, a separate job runs that summarizes your day's spending and sends it to you on Telegram.

## Tech Stack

| Tool | Role | Why |
|---|---|---|
| **Telegram** | Input & output | You already use it daily — zero friction |
| **n8n** | Workflow automation | Runs in Docker, visual editor, free & self-hosted |
| **Google Sheets** | Database | Simple, visible, easy to debug and share |
| **Gemini API** | AI (Phase 2+) | Categorization, insights, coaching — added later |

## Project Structure

```
PFOS/
├── docs/                    # Architecture docs and notes
├── n8n/
│   ├── workflows/           # Exported n8n workflow JSON files
│   └── credentials/         # Credential setup notes (no real secrets!)
├── sheets/
│   └── templates/           # CSV templates for Google Sheets tabs
├── telegram/                # Bot setup notes and config
├── scripts/                 # Helper scripts
├── tests/
│   └── sample-messages/     # Test messages for validating workflows
├── logs/                    # Debug output (gitignored)
├── setup.sh                 # Run this to create all folders
├── .gitignore
└── README.md
```

## Phases Overview

| Phase | What It Does | AI? | Difficulty |
|---|---|---|---|
| **Phase 1: Foundation** | Log expenses via Telegram, daily summary | No | Beginner |
| **Phase 2: AI Categorization** | Gemini extracts & categorizes expenses | Yes | Intermediate |
| **Phase 3: Financial Insights** | Weekly pattern analysis & anomaly detection | Yes | Intermediate |
| **Phase 4: AI Financial Coach** | Monthly reports with actionable advice | Yes | Advanced |
| **Phase 5: Agentic Assistant** | Ask questions, get answers from your data | Yes | Advanced |

## Phase 1 — What You're Building First

Phase 1 has **two workflows** and **no AI**. The goal is to prove the basic loop works.

### Workflow W1: Capture & Confirm
- **Trigger:** You send a Telegram message
- **Action:** Extract amount + merchant, look up category, write to Sheets, reply with confirmation

### Workflow W2: Evening Summary
- **Trigger:** Scheduled at 9 PM daily
- **Action:** Read today's transactions, calculate totals, write summary, send Telegram message

### Google Sheets Tabs (Phase 1)

| Tab | What Goes Here |
|---|---|
| `Transactions` | Every expense — one row per message you send |
| `Categories` | List of valid categories (Food & Dining, Transport, etc.) |
| `CategoryRules` | Keyword-to-category mappings (swiggy → Food & Dining) |
| `DailySummary` | One row per day with totals |

### Prerequisites

Before building, you need:

1. **Docker** installed and running on your machine
2. **n8n** running in Docker (`docker run -it --rm -p 5678:5678 n8nio/n8n`)
3. **Telegram bot** created via [@BotFather](https://t.me/BotFather) — save the token
4. **Google Cloud project** with Sheets API enabled and OAuth credentials
5. **Google Sheet** created with the four tabs listed above

## Getting Started

```bash
# 1. Clone and set up the folder structure
git clone <your-repo-url>
cd PFOS
chmod +x setup.sh
./setup.sh

# 2. Start n8n
docker run -it --rm -p 5678:5678 n8nio/n8n

# 3. Open n8n in your browser
open http://localhost:5678
```

Then follow the Phase 1 implementation steps in `docs/PFOS_v4_Architecture.md`.

## Key Design Decisions

- **Separate workflows** — capture and summary are independent, so a bug in one can't break the other
- **Schema-first** — Google Sheets tabs are designed like database tables, not random spreadsheets
- **Config in Sheets, not code** — categories and keyword rules live in Sheets tabs, so changes don't require editing workflows
- **No AI in Phase 1** — prove the plumbing works before adding complexity
