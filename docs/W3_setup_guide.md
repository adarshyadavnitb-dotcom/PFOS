# W3: Weekly Insights — Setup Guide

Every Sunday at 8 PM, this workflow reads the last 28 days of expenses, compares **this week** against your **prior 3-week average**, detects spending anomalies, then uses Gemini AI to narrate the numbers into a friendly insight. It writes a row to the `WeeklyInsights` tab and sends you a Telegram message.

This is the first **Phase 3** workflow — it moves PFOS from per-transaction logging (Phase 1–2) to **pattern recognition** across time.

## Design principle: the math is done in code, not by AI

The single most important idea in this workflow:

> **n8n/code computes every number. Gemini only writes the words around those numbers.**

Anomaly detection, totals, averages, and percentages are all calculated deterministically in a Code node. Gemini receives the finished statistics and is told *"do not recalculate anything."* This prevents the #1 failure mode of AI finance tools — **hallucinated numbers**. It also means the anomaly flag is consistent and explainable, not "AI vibes."

## What the workflow looks like

```
Every Sunday 8 PM (Schedule Trigger)
      │
      ▼
Read Transactions  ←── Google Sheets: read all rows
      │
      ▼
Aggregate Week  ←── Code node: split into current week vs prior 3 weeks,
      │               compute totals, category breakdown, anomaly flags
      ▼
Has Data?  ←── IF node: did we spend anything this week?
   │     │
   │ no  └─────────────► Send No-Data Message ("No expenses this week 🌱")
   │ yes
   ▼
Build Gemini Body  ←── Code node: wrap the computed stats in a prompt
      │
      ▼
Call Gemini  ←── HTTP Request: gemini-3.1-flash-lite narrates the stats
      │
      ▼
Assemble Row  ←── Code node: combine Gemini's narrative + computed anomaly fields
      │
      ▼
Write to WeeklyInsights  ←── Google Sheets: append insight row
      │
      ▼
Send Insight  ←── Telegram: send the weekly insight to you
```

## What the Telegram message looks like

```
Weekly Spending Insight: June 15 – June 21 📈

Your total spend was ₹8,450, higher than your 3-week average of ₹6,200.

• Food & Dining: ₹3,200 — up 78% vs your ₹1,800 average
• Shopping: ₹1,200 — doubled vs ₹600, driven by an Amazon purchase
• 58% needs / 42% wants

Tip: Food and shopping drove the jump this week. Try a two-day
no-spend goal next week to reset. You've got this! 💪
```

If nothing was logged this week, you get:
```
📈 Weekly Insight — 2026-06-15 to 2026-06-21

No expenses logged this week. 🌱
```

---

## How anomaly detection works

In the **Aggregate Week** node, for each spending category we compare this week's total against that category's average over the prior 3 weeks. A category is flagged as an anomaly when **both** of these are true:

1. This week ≥ **1.5×** the prior 3-week weekly average, **and**
2. The increase is at least **₹300** (so tiny categories don't trigger noise)

A brand-new category with **₹500+** spend this week is also flagged ("new this week").

The result is stored in two columns:
- `anomaly_flag` — `true` / `false`
- `anomaly_detail` — e.g. `"Food & Dining up 78% vs 3-week avg (₹3200 vs ₹1800)"`

**Note:** Until you have ~3 weeks of history, there's no baseline to compare against, so everything reads as "new this week." Real over-average detection kicks in automatically once the history builds up.

---

## Setup Steps

> The live workflow is already deployed on the cloud server. These steps document a setup-from-scratch (e.g. re-import on a fresh instance).

### 1. Create the WeeklyInsights tab

In your PFOS spreadsheet, add a tab named exactly `WeeklyInsights` with these headers in row 1:

```
week_start    insight_text    anomaly_flag    anomaly_detail
```

### 2. Import the workflow

1. Open n8n at **https://80.225.221.129.sslip.io**
2. Click **⋮** → **Import from File**
3. Select `n8n/workflows/W3_weekly_insights.json`

### 3. Add your Gemini API key

The committed workflow has the key replaced with the placeholder `GEMINI_API_KEY` for safety. You must put the real key back:

1. Get a key from **[aistudio.google.com](https://aistudio.google.com)** → **Get API key**
2. Double-click the **Call Gemini** node
3. In the **URL** field, replace `key=GEMINI_API_KEY` with your real key, e.g. `key=AIza...`
4. Save

> Free tier is fine. We use **`gemini-3.1-flash-lite`** (cheap, fast, generous limits). One call per week is negligible.

### 4. Connect Google Sheets credentials

**Read Transactions node:** select your Google Sheets credential → spreadsheet → **Transactions** tab.

**Write to WeeklyInsights node:** same credential → spreadsheet → **WeeklyInsights** tab.

### 5. Set the Telegram Chat ID

Double-click **Send Insight** (and **Send No-Data Message**), select your Telegram credential, and set the **Chat ID** to your personal chat ID (the same number used in W2). The committed file uses the placeholder `TELEGRAM_CHAT_ID`.

### 6. Test it

You can't wait until Sunday, so trigger it manually:

1. Click the **Every Sunday 8 PM** node → **Execute Workflow** (runs immediately, ignoring the schedule)
2. Click through each node to inspect its output
3. Verify a new row appeared in the **WeeklyInsights** tab
4. Verify you got the Telegram message

Make sure you have a few expenses logged this week first, or you'll just get the "no expenses" message.

### 7. Publish it

Click **Publish** (top-right). It will now run automatically every Sunday at 8 PM.

> **Timezone:** the server runs with `TZ=Asia/Kolkata`, so hour `20` in the schedule = **8 PM IST** directly. No UTC offset math needed.

---

## Node-by-Node Explanation

### Node 1: Every Sunday 8 PM (Schedule Trigger)
Fires weekly on Sunday (`triggerAtDay: [0]`) at hour 20 (8 PM IST). Runs on its own — no external trigger.

### Node 2: Read Transactions (Google Sheets)
Reads every row from the Transactions tab. We filter by date in code (the Sheets node can't filter by date range directly). Fine for hundreds of rows.

### Node 3: Aggregate Week (Code node) — the brain
1. Splits rows into **current week** (last 7 days) and **prior 3 weeks** (days 8–28), using IST dates.
2. If nothing this week → returns a "no data" flag with a ready-made message.
3. Computes: week total, prior 3-week weekly average, per-category breakdown (with each category's prior average), need/want %, biggest single transaction.
4. Runs **anomaly detection** (see section above) and produces `anomaly_flag` + `anomaly_detail`.
5. Outputs all stats plus a `statsJson` string for the prompt.

### Node 4: Has Data? (IF node)
Routes to the AI path if there was spending, otherwise to the simple "no expenses" Telegram message — so an empty week never calls Gemini or writes a junk row.

### Node 5: Build Gemini Body (Code node)
Wraps the computed `statsJson` in the coaching prompt and produces the exact JSON body for the API. (We build the body in code because inline expressions inside the HTTP node's body field fail workflow validation in this n8n version.)

### Node 6: Call Gemini (HTTP Request)
POSTs to `gemini-3.1-flash-lite`. The prompt explicitly forbids recalculating or inventing numbers and bans markdown formatting (Telegram won't render `**bold**` in plain mode).

### Node 7: Assemble Row (Code node)
Takes Gemini's narrative text and combines it with the **code-computed** `week_start`, `anomaly_flag`, and `anomaly_detail` into one row matching the sheet columns. (The anomaly fields come from code, never from Gemini.)

### Node 8: Write to WeeklyInsights (Google Sheets)
Appends the row. Uses **auto-map** mode — the Assemble Row node's output field names match the sheet headers exactly.

### Node 9: Send Insight (Telegram)
Sends the narrative to your chat. Like W2, it initiates the message, so it needs a hardcoded Chat ID.

### Node 10: Send No-Data Message (Telegram)
The empty-week fallback message.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Always says "new this week" | Less than 3 weeks of history | Expected — real comparison starts once history builds up |
| Gemini node fails with 429 | Free-tier quota hit for that model | Switch the model name in the Call Gemini URL to another available flash model |
| `columns.schema is required` on write | Sheets node in defineBelow mode | Use **auto-map** mode (already set in the committed file) |
| Insight shows raw `**asterisks**` | Telegram not rendering markdown | The prompt already bans markdown; if it slips in, no harm — it's just plain text |
| Wrong day/time | Server timezone not IST | Confirm container has `TZ=Asia/Kolkata` |
| Duplicate insight rows | Clicked Execute multiple times while testing | Delete duplicate rows manually |
