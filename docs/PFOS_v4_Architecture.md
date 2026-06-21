# PFOS v4 — Personal Finance Operating System
## Architecture Document v1.0

**Author:** Adarsh | **Purpose:** Personal productivity system + Automation consulting portfolio piece
**Stack:** Telegram → n8n (Docker) → Gemini API → Google Sheets

---

## 1. System Architecture (High-Level)

PFOS v4 is built on a **4-layer architecture**. This separation is what makes it both maintainable for you and legible to a future client as a case study — each layer can be explained, demoed, and swapped independently.

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: CAPTURE                                                 │
│ Telegram Bot (text now → voice/WhatsApp later)                   │
└───────────────────────────┬───────────────────────────────────────┘
                            │ webhook
┌───────────────────────────▼───────────────────────────────────────┐
│ LAYER 2: ORCHESTRATION (n8n)                                      │
│ - Webhook triggers (real-time capture)                            │
│ - Scheduled triggers (evening/weekly/monthly)                     │
│ - Routing, validation, error handling                             │
└──────────┬───────────────────────────────┬────────────────────────┘
           │                               │
┌──────────▼──────────┐         ┌──────────▼──────────────┐
│ LAYER 3: INTELLIGENCE│         │ LAYER 4: PERSISTENCE     │
│ Gemini API            │◄──────►│ Google Sheets (DB)        │
│ - Parsing              │        │ - Transactions tab        │
│ - Categorization        │       │ - Categories config tab    │
│ - Insight generation     │      │ - Monthly summary tab       │
│ - Coaching narratives      │    │ - Goals / Net worth (future)  │
└─────────────────────────┘         └──────────────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │ Telegram (output)  │
                  │ Confirmations,      │
                  │ summaries, reports   │
                  └────────────────────┘
```

**Design principle:** n8n is the *nervous system*, Gemini is the *brain*, Sheets is the *memory*, Telegram is the *mouth and ears*. You will reuse this exact framing with consulting clients — it's an easy mental model for non-technical stakeholders.

---

## 2. Database Design (Conceptual)

Even though the physical implementation is Google Sheets, design it like a real database from day one. This is what separates a "spreadsheet with formulas" from a "system" — and it's the difference a consulting client will pay for.

### Core entities

| Entity | Description | Grows in Phase |
|---|---|---|
| **Transaction** | Single expense event | 1 |
| **Category** | Controlled vocabulary (Food, Transport, etc.) | 1 |
| **CategoryRule** | Maps keywords → category (seed for AI) | 2 |
| **DailySummary** | Aggregated rollup, evening job | 1 |
| **WeeklyInsight** | Pattern/anomaly record | 3 |
| **MonthlyReport** | Coach output, stored for trend comparison | 4 |
| **Goal** | Target savings/spend per category | Future |
| **NetWorthSnapshot** | Asset/liability point-in-time | Future |
| **MemoryNote** | RAG corpus — coach's long-term observations about you | Future |

### Relationships
- Transaction → Category (many-to-one)
- Transaction → MonthlyReport (aggregated, not stored as FK — computed)
- MonthlyReport → MonthlyReport (self-referencing, for month-over-month comparison)
- Goal → Category (one-to-one or one-to-many)

**Why this matters now:** Designing entities before building tabs prevents the #1 beginner mistake — flat, ungrowable sheets that need a rebuild every time you add a feature.

---

## 3. Google Sheet Schema

One spreadsheet, multiple tabs, acting as relational-ish tables.

### Tab: `Transactions` (the fact table — everything else derives from this)

| Column | Type | Notes |
|---|---|---|
| `transaction_id` | Text | UUID or timestamp-based, generated in n8n |
| `timestamp` | DateTime | When message was sent |
| `raw_message` | Text | Original Telegram text, e.g. "450 Swiggy" — always keep raw input for debugging/retraining |
| `amount` | Number | Extracted by Gemini |
| `merchant_vendor` | Text | Extracted entity, e.g. "Swiggy" |
| `category` | Text | From controlled vocabulary |
| `subcategory` | Text | Optional, Phase 2+ |
| `need_or_want` | Text | "Need" / "Want" |
| `payment_mode` | Text | Optional, default "Unspecified" |
| `confidence_score` | Number | Gemini's self-reported confidence (0–1), Phase 2 |
| `user_corrected` | Boolean | Did you manually fix the category? Critical training signal |
| `month_key` | Text | "2026-06" — precomputed for fast pivoting |
| `source` | Text | "telegram_text" / "telegram_voice" / "whatsapp" (future-proofing) |

### Tab: `Categories` (config, not data)

| Column | Type | Notes |
|---|---|---|
| `category_name` | Text | e.g. "Food & Dining" |
| `default_need_want` | Text | Default classification |
| `monthly_budget` | Number | Optional, used in Phase 4 coaching |
| `active` | Boolean | Allows retiring categories without deleting history |

### Tab: `CategoryRules` (Phase 2 — keyword seed list, also acts as Gemini few-shot examples)

| Column | Type | Notes |
|---|---|---|
| `keyword` | Text | "swiggy", "zomato", "uber" |
| `category` | Text | Mapped category |
| `need_or_want` | Text | Default mapping |

### Tab: `DailySummary` (Phase 1 evening job output)

| Column | Type | Notes |
|---|---|---|
| `date` | Date | |
| `total_spend` | Number | |
| `top_category` | Text | |
| `transaction_count` | Number | |
| `need_pct` | Number | % spend that was "Need" |

### Tab: `WeeklyInsights` (Phase 3)

| Column | Type | Notes |
|---|---|---|
| `week_start` | Date | |
| `insight_text` | Text | Gemini-generated narrative |
| `anomaly_flag` | Boolean | Unusual spending detected |
| `anomaly_detail` | Text | What and why |

### Tab: `MonthlyReports` (Phase 4)

| Column | Type | Notes |
|---|---|---|
| `month_key` | Text | "2026-06" |
| `total_income` | Number | Manually entered or pulled from a future Income tab |
| `total_spend` | Number | |
| `savings_rate` | Number | Computed |
| `mom_change_pct` | Number | vs previous month |
| `top_3_leaks` | Text | Gemini-identified |
| `recommendations` | Text | Gemini-generated, stored verbatim for audit trail |
| `report_sent` | Boolean | |

**Schema principle:** Every AI-generated field sits next to a `user_corrected` or audit field. This is what makes the system trustworthy and trainable over time — and it's a strong talking point for consulting ("the system gets smarter because corrections are captured as data, not lost").

---

## 4. n8n Workflow Architecture

Build PFOS as **5 separate workflows**, not one giant workflow. This is the single biggest maintainability decision you'll make.

| Workflow | Trigger | Responsibility |
|---|---|---|
| **W1: Capture & Confirm** | Telegram Webhook | Parse message → categorize → write row → reply |
| **W2: Evening Summary** | Schedule (e.g. 9 PM daily) | Aggregate today's `Transactions` → write `DailySummary` → Telegram push |
| **W3: Weekly Insights** | Schedule (e.g. Sunday 8 PM) | Read 7 days of data → Gemini pattern analysis → write `WeeklyInsights` → Telegram push |
| **W4: Monthly Coach** | Schedule (1st of month) | Read full month + prior month → Gemini coaching synthesis → write `MonthlyReports` → Telegram push (long-form) |
| **W5: Error/Fallback Handler** | Sub-workflow, called by W1–W4 | Catches malformed input, API failures; logs to an `Errors` tab; sends you a Telegram alert instead of failing silently |

### Why split workflows
- Each one is independently testable (you can manually trigger W4 without waiting a month).
- A bug in the monthly coach workflow can't break real-time expense capture.
- This is exactly how you'd explain a production system to a client — small, composable, observable units, not one monolith.

### W1 internal structure (the one you'll build first)
```
Telegram Trigger
   → Validate message (is it parseable? does it contain a number?)
   → Gemini node: extract {amount, merchant, category, need_or_want}
   → IF confidence low / parse failed → Error Handler sub-workflow → ask user to clarify
   → Google Sheets: Append row to Transactions
   → Telegram: Send confirmation ("✅ ₹450 logged under Food & Dining (Want)")
```

---

## 5. Gemini Integration Strategy

### Two distinct call patterns — don't conflate them
1. **Extraction calls** (W1) — fast, cheap, structured output. Low temperature, strict JSON schema, single transaction at a time.
2. **Synthesis calls** (W2–W4) — slower, narrative output. Higher temperature, larger context (multiple rows), used for human-readable insight generation.

### Prompt design principles
- **Always request strict JSON** for extraction calls (amount, category, need_or_want, confidence). This avoids brittle text-parsing in n8n.
- **Few-shot from your own data**: seed the extraction prompt with 5–10 examples pulled from your `CategoryRules` tab. Since you already have 2,000+ historical records, mine your most common merchants/categories to build this seed list — it will dramatically improve accuracy from day one versus a cold-start prompt.
- **Confidence scoring**: ask Gemini to self-report confidence. Anything below a threshold (e.g. 0.7) routes to a clarification message rather than a silent guess. This single feature is what makes the system feel "smart" rather than "wrong half the time."
- **Separate prompts per job type**: categorization prompt ≠ weekly insight prompt ≠ monthly coach prompt. Don't reuse one mega-prompt; each should be small, single-purpose, and versioned (keep prompt text in a `Prompts` config tab or in n8n notes, not hardcoded only in your head).
- **Token/cost control**: for W3/W4, don't send all 2,000+ historical rows every time. Send only the relevant window (current week/month) plus pre-aggregated summary stats (sums, counts) computed in n8n — let Gemini reason over numbers you've already crunched, not raw row dumps. Cheaper and more accurate.

### Gemini's role evolution by phase
- Phase 1: none (rule-based categorization only — prove the pipe works first)
- Phase 2: extraction + categorization
- Phase 3: pattern/anomaly narrative generation
- Phase 4: financial coaching synthesis, month-over-month reasoning
- Phase 5: agentic — multi-step reasoning, tool-calling, RAG retrieval over `MemoryNote` tab

---

## 6. Telegram Bot Architecture

### Message types to support (build in this order)
1. **Free-text expense** — "450 Swiggy" (Phase 1–2)
2. **Commands** — `/today`, `/week`, `/month`, `/undo` (Phase 2–3). `/undo` is small but important: lets you delete/correct the last entry without touching Sheets manually.
3. **Voice notes** — transcribed via Gemini's audio input, then routed into the same extraction pipeline as text (Future roadmap)
4. **Inline confirmation buttons** — Phase 2+, e.g. Telegram inline keyboard asking "Need or Want?" when confidence is low, instead of a clarifying text round-trip

### Bot UX principles
- Every capture gets a **confirmation reply within 2–3 seconds** — this is the single biggest driver of whether you (or a future client's team) actually keep using the system. Silence kills adoption.
- Error messages should be **human, not technical**: "Couldn't find an amount in that message — try '450 Swiggy'" not "Error: regex match failed."
- Scheduled pushes (evening/weekly/monthly) should go to the **same chat**, formatted distinctly (e.g. emoji prefixes: 📊 daily, 📈 weekly, 🎯 monthly) so they're scannable in chat history.

---

## 7. Milestone-Based Implementation Roadmap

---

### Phase 1: Foundation (Beginner)

**Objective:** Prove the core loop — Telegram in, Sheets out, confirmation back — using simple rule-based logic, no AI yet.

**Architecture diagram:**
```
Telegram Trigger → Code/Set node (regex: extract number + text)
   → Lookup category via CategoryRules tab (keyword match)
   → Google Sheets Append (Transactions)
   → Telegram Send Message (confirmation)

[Separate workflow]
Schedule Trigger (9 PM) → Google Sheets Read (today's rows)
   → Aggregate (sum, count, top category)
   → Google Sheets Append (DailySummary)
   → Telegram Send Message
```

**Required n8n nodes:** Telegram Trigger, Set/Edit Fields, IF, Google Sheets (Append + Read), Telegram (Send Message), Schedule Trigger, Code (for simple aggregation if needed)

**Required APIs:** Telegram Bot API, Google Sheets API (OAuth)

**Implementation steps:**
1. Create Telegram bot via BotFather, get token
2. Connect n8n's Telegram credential
3. Build `Categories` and `CategoryRules` tabs, seed with your top 15–20 merchants from historical data
4. Build W1 with simple regex extraction (amount = first number, merchant = remaining text)
5. Build W2 (evening summary) on a schedule trigger
6. Test for 3–5 days with real expenses before touching AI

**Estimated difficulty:** ⭐⭐ (Beginner-friendly, 1–2 weekends)

**Common mistakes:**
- Skipping the `Categories`/`CategoryRules` config tabs and hardcoding categories inside n8n nodes — makes every future change a workflow edit instead of a spreadsheet edit
- Not handling the case where the message doesn't parse cleanly (no fallback = silent failures)
- Building one giant workflow instead of two separate ones (capture vs. summary)

**Testing approach:** Send 15–20 varied real messages ("450 swiggy", "swiggy 450", "1200 for uber rides this week") and check Sheet rows for correctness before moving to Phase 2.

---

### Phase 2: AI Categorization

**Objective:** Replace regex/keyword matching with Gemini-powered extraction and categorization, with confidence scoring and a clarification fallback.

**Architecture diagram:**
```
Telegram Trigger → HTTP Request (Gemini API): 
   prompt = raw_message + few-shot examples from CategoryRules
   → expects JSON: {amount, merchant, category, need_or_want, confidence}
   → IF confidence < 0.7 → Telegram (ask clarifying question) → wait for reply → re-process
   → ELSE → Google Sheets Append → Telegram confirmation
```

**Required n8n nodes:** HTTP Request (Gemini), JSON parsing (Set/Code node), IF, Telegram (with inline keyboard for clarification), Google Sheets

**Required APIs:** Gemini API (generateContent), Telegram Bot API, Google Sheets API

**Implementation steps:**
1. Write and test your extraction prompt in Google AI Studio first (don't debug prompts inside n8n)
2. Build the HTTP Request node calling Gemini with strict JSON output instructions
3. Add a Code/Set node to safely parse the JSON response (handle malformed output gracefully)
4. Add confidence threshold branching
5. Add `confidence_score` and `user_corrected` columns to `Transactions`
6. Backfill-test against a sample of your 2,000 historical records to benchmark accuracy before going live

**Estimated difficulty:** ⭐⭐⭐ (Intermediate — this is where most beginners stall; budget 2–3 weekends)

**Common mistakes:**
- Not asking Gemini for strict JSON, then writing fragile string-parsing logic in n8n
- No confidence threshold — system silently miscategorizes and you stop trusting it
- Forgetting to log `user_corrected` when you manually fix something — losing your best training signal
- Sending too much context (full history) on every single-transaction call, inflating cost and latency

**Testing approach:** Run your historical 2,000-record sample (or a 100-row subset) through the extraction prompt offline, compare against your known-correct categories, and compute accuracy % before connecting it to the live bot.

---

### Phase 3: Financial Insights

**Objective:** Move from per-transaction logic to pattern recognition — weekly narrative insights and anomaly detection.

**Architecture diagram:**
```
Schedule Trigger (weekly) → Google Sheets Read (last 7 days, Transactions)
   → Code node: pre-aggregate (totals by category, day-over-day deltas, outlier transactions)
   → HTTP Request (Gemini): synthesis prompt with aggregated stats, NOT raw rows
   → Parse narrative + anomaly_flag
   → Google Sheets Append (WeeklyInsights)
   → Telegram Send Message (formatted insight)
```

**Required n8n nodes:** Schedule Trigger, Google Sheets (Read with filters/date range), Code (aggregation), HTTP Request (Gemini), Telegram

**Required APIs:** Gemini API, Google Sheets API, Telegram Bot API

**Implementation steps:**
1. Build the aggregation logic in n8n's Code node (sums, % changes, top movers) — this is plain JavaScript, not AI
2. Design the synthesis prompt to reason over those pre-computed numbers, not raw transaction lists
3. Define what "unusual" means quantitatively first (e.g. category spend >50% above 4-week average) so Gemini's anomaly flag has a numeric anchor, not pure vibes
4. Add the `WeeklyInsights` tab and wire up the Telegram push
5. Run for 3–4 weeks and compare Gemini's flagged anomalies against what you'd flag manually

**Estimated difficulty:** ⭐⭐⭐ (Intermediate — mostly about good aggregation logic, not AI complexity)

**Common mistakes:**
- Letting Gemini do arithmetic instead of doing the math in n8n/Code and having Gemini just narrate it — leads to hallucinated numbers
- No quantitative anomaly threshold, so "unusual" output is inconsistent week to week
- Insight messages too long for Telegram — keep pushes scannable, link to the Sheet for full detail

**Testing approach:** Manually compute what you'd expect the weekly summary to say, then compare against the generated output for 2–3 cycles before trusting it unsupervised.

---

### Phase 4: AI Financial Coach

**Objective:** Monthly synthesis — savings rate, month-over-month comparison, spending leak identification, and actionable recommendations, written as a personalized report.

**Architecture diagram:**
```
Schedule Trigger (1st of month) → Google Sheets Read (current month Transactions + MonthlyReports history)
   → Code node: compute savings_rate, mom_change_pct, top_3_leaks (rule-based ranking)
   → HTTP Request (Gemini): coaching prompt with computed metrics + last 2–3 months' MonthlyReports for trend context
   → Parse recommendations + narrative
   → Google Sheets Append (MonthlyReports)
   → Telegram Send Message (long-form report, possibly split into 2–3 messages)
```

**Required n8n nodes:** Schedule Trigger, Google Sheets (Read across multiple tabs), Code (financial calculations), HTTP Request (Gemini), Telegram, Merge (combining current + historical data)

**Required APIs:** Gemini API, Google Sheets API, Telegram Bot API

**Implementation steps:**
1. Define `savings_rate` and `spending leak` calculations explicitly in Code nodes — these are deterministic finance formulas, not AI guesses
2. Pull prior 2–3 `MonthlyReports` rows to give Gemini comparison context (this is where the self-referencing schema design from Section 2 pays off)
3. Design a coaching prompt that asks for: a numeric summary restatement, 3 specific leaks with evidence, 2–3 concrete actionable suggestions — structured, not vague
4. Store the full report text in `MonthlyReports.recommendations` for audit trail and future RAG use
5. Format as a clean Telegram report; consider also rendering it in the existing Google Sheets dashboard for visual review

**Estimated difficulty:** ⭐⭐⭐⭐ (Advanced — requires correct financial logic + good prompt structuring; budget 3–4 weekends)

**Common mistakes:**
- Letting Gemini calculate savings rate instead of computing it deterministically and having Gemini only narrate/interpret it
- No historical context passed in, so "improvement" claims aren't actually grounded in your real trend
- Recommendations too generic ("spend less on food") instead of specific and numeric ("Swiggy orders cost you ₹X this month, up 30% vs last month — driven by 6 weekend orders")

**Testing approach:** Run it against your historical 2,000-record dataset for 2–3 retrospective "months" to sanity-check the coaching tone and accuracy before relying on it for a live month.

---

### Phase 5: Agentic Finance Assistant

**Objective:** Move from scheduled, one-way reports to an interactive agent — you can ask it questions ("How much did I spend on food this quarter vs my goal?"), it reasons over tools (Sheets queries, calculations) and your accumulated memory.

**Architecture diagram:**
```
Telegram Trigger (any message, not just expense capture)
   → IF intent = "expense log" → route to W1 (Phase 1–2 pipeline)
   → IF intent = "question/query" → Agent workflow:
       Gemini (with tool-calling) 
         → Tool: Google Sheets Read (transactions/goals/net worth)
         → Tool: Code (calculations)
         → Tool: RAG lookup (MemoryNote tab — past coaching observations, your stated goals/preferences)
       → Synthesize answer
   → Telegram Send Message
```

**Required n8n nodes:** Telegram Trigger, Switch/IF (intent routing), Gemini node with function-calling/tool definitions, Google Sheets, Code, Vector store or simple Sheets-based retrieval (RAG-lite), Telegram

**Required APIs:** Gemini API (function calling), Google Sheets API, Telegram Bot API, optionally a vector DB (or RAG-lite via Sheets + embedding similarity in Code node)

**Implementation steps:**
1. Build intent classification first (is this a log entry or a question?) — keep it simple, even a lightweight Gemini classification call works
2. Define a small set of "tools" the agent can call: read transactions by date range, read goals, compute aggregates
3. Start RAG-lite: store key facts/observations from each monthly coaching report into a `MemoryNote` tab; retrieve by simple keyword/recency first before investing in real embeddings
4. Test agent on narrow, well-defined questions before opening it up to free-form queries
5. Add guardrails: agent should never silently modify `Transactions` — corrections go through a confirmed `/undo` or explicit edit command

**Estimated difficulty:** ⭐⭐⭐⭐⭐ (Advanced — this is genuinely agentic system design; treat it as a standalone project phase, likely 4+ weekends)

**Common mistakes:**
- Building full vector-RAG infrastructure before validating that simple retrieval (recent rows + keyword match) isn't already good enough
- Giving the agent write access without confirmation steps — risks silent data corruption in your only database
- Over-scoping tools (too many capabilities at once) instead of shipping 2–3 reliable tools first

**Testing approach:** Maintain a fixed set of 10–15 test questions spanning categories, time ranges, and goals; re-run them after every change to catch regressions — this becomes your informal eval suite, and is itself a good artifact to show consulting clients as "how I validate AI agent reliability."

---

## Summary: What This Roadmap Demonstrates (for your consulting positioning)

This phased build is itself a case study in:
- **Layered system design** (capture / orchestration / intelligence / persistence)
- **Schema-first thinking** before automation (most beginners skip this)
- **Cost-aware AI integration** (pre-aggregate before sending to LLM, strict JSON, confidence thresholds)
- **Progressive complexity** — proving the simple version works before adding intelligence, then agency
- **Auditable AI** — every AI output has a corresponding human-correction field, critical for trust with any real client

When you write this up as a LinkedIn case study later, the strongest narrative isn't "I built an AI bot" — it's "I designed a system that gets more reliable over time because every correction becomes training data." That's the consulting pitch.
