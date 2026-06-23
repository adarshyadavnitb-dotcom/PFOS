# W4: Monthly AI Coach — Setup Guide

On the 1st of every month at 10 AM, this workflow reports on **the month that just ended**: total spend, savings rate, month-over-month change, your top spending "leaks," and 2–3 specific coaching recommendations. It writes a row to the `MonthlyReports` tab and sends you a long-form Telegram report.

This is the **Phase 4** workflow — the system's "financial coach." It builds on the same discipline as W3: **all math is computed in code; Gemini only writes the narrative.**

## What it reports on

W4 runs on the **1st**, but reports the **previous** calendar month. So a run on **July 1** reports **June**. This is deliberate — the month is complete, so the numbers are final.

## Design principle: deterministic finance, AI narration

Savings rate, month-over-month change, category leaks, and need/want splits are all calculated in the **Aggregate Month** code node. Gemini receives the finished numbers with an explicit instruction: *do not recalculate or invent anything.* This keeps the financial figures trustworthy and auditable — the AI can't hallucinate your savings rate.

## What the workflow looks like

```
1st of Month 10 AM (Schedule Trigger)
      │
      ▼
Read Transactions  ←── Google Sheets: read all rows
      │
      ▼
Aggregate Month  ←── Code: pick previous month, compute spend, savings rate,
      │               MoM change, category leaks, need/want
      ▼
Has Data?  ←── IF: did the target month have any transactions?
   │     │
   │ no  └──────────► Send No-Data Message
   │ yes
   ▼
Build Gemini Body → Call Gemini (with auto-retry) → Assemble Row
      │
      ▼
Write to MonthlyReports  ←── Google Sheets: append report row
      │
      ▼
Send Report  ←── Telegram: send the coaching report
```

## What the Telegram report looks like

```
June 2026 Monthly Report: Total Spend ₹62232, Savings Rate 56%

Money Flow
Income: ₹140700
Spent: ₹62232
Saved: ₹78468 (56%)

Top Spending Areas
• Food & Dining: ₹24500 (39%)
• Groceries: ₹18000 (29%)
• Transport: ₹12000 (19%)

Needs vs Wants: 62% Needs / 38% Wants

Coaching Recommendations
First, Food & Dining at ₹24500 was your largest area — try a weekly
eating-out cap next month...
(2–3 specific, numbers-grounded tips)
```

If the target month had no transactions, you get a short "nothing to report" message instead.

---

## The income figure (savings rate)

Savings rate = **(income − spend) / income**. PFOS uses a **fixed monthly income** stored directly in the workflow.

To change it: open the **Aggregate Month** node and edit this line near the top of the code:

```js
const INCOME = 140700;
```

(If your income later becomes variable, this is the spot to swap in a lookup from a `Config` tab.)

---

## Setup Steps

> The live workflow is already deployed on the cloud server. These steps document a setup-from-scratch (e.g. re-import on a fresh instance).

### 1. Create the MonthlyReports tab

Add a tab named exactly `MonthlyReports` with these headers in row 1:

```
month_key  total_income  total_spend  savings_rate  mom_change_pct  top_3_leaks  recommendations  report_sent
```

### 2. Import the workflow

n8n → **⋮** → **Import from File** → `n8n/workflows/W4_monthly_coach.json`

### 3. Add your Gemini API key

Open the **Call Gemini** node, in the **URL** replace `key=GEMINI_API_KEY` with your real key.

### 4. Set your income

Open **Aggregate Month**, set `const INCOME = ...` to your monthly income.

### 5. Connect credentials

- **Read Transactions** → Google Sheets credential → **Transactions** tab
- **Write to MonthlyReports** → Google Sheets credential → **MonthlyReports** tab
- **Send Report** and **Send No-Data Message** → Telegram credential → set your **Chat ID** (replace `TELEGRAM_CHAT_ID`)

### 6. Test it

You can't wait until the 1st, and the previous month may be empty. To test the full path against a month that has data, temporarily edit **Aggregate Month**:

```js
const TEST_TARGET = "2026-06";   // force it to report June
```

Then click **1st of Month 10 AM** → **Execute Workflow**, verify the row + Telegram message, and **change `TEST_TARGET` back to `""`** before publishing.

### 7. Publish it

Click **Publish**. It now runs automatically on the 1st of every month at 10 AM IST (server timezone is `Asia/Kolkata`).

---

## Node-by-Node Explanation

### Node 1: 1st of Month 10 AM (Schedule Trigger)
Fires on day-of-month 1 at hour 10. Monthly interval.

### Node 2: Read Transactions (Google Sheets)
Reads all rows; the target month is selected in code.

### Node 3: Aggregate Month (Code) — the brain
1. Determines the **target month** = previous calendar month (or `TEST_TARGET` if set).
2. Filters transactions to the target month (via `month_key`, falling back to `timestamp`).
3. Computes: total spend, fixed income, **savings rate**, **month-over-month change** (vs the month before the target), category breakdown with %, **top 3 leaks**, need/want split.
4. If the month had no transactions → returns a "no data" flag + ready message.

### Node 4: Has Data? (IF)
Routes empty months to the short fallback so Gemini isn't called and no junk row is written.

### Node 5: Build Gemini Body (Code)
Wraps the computed stats in the coaching prompt and builds the API request body. (Built in code because inline expressions in the HTTP body field fail validation in this n8n version.)

### Node 6: Call Gemini (HTTP Request, **auto-retry**)
POSTs to `gemini-3.1-flash-lite`. **Retry-on-fail is enabled (3 tries, 3s apart)** because the Gemini API occasionally returns transient 503s — a single retry turns a failed monthly report into a successful one.

### Node 7: Assemble Row (Code)
Combines Gemini's narrative with the **code-computed** fields into a row matching the sheet columns. `report_sent` is set to `true`.

### Node 8: Write to MonthlyReports (Google Sheets)
Appends the row (auto-map mode — output field names match the headers).

### Node 9: Send Report (Telegram)
Sends the coaching narrative to your chat.

### Node 10: Send No-Data Message (Telegram)
The empty-month fallback.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| "No expenses were logged" | Previous month genuinely empty, or you're testing mid-month | Use `TEST_TARGET` to point at a month with data |
| Gemini node fails with 503 | Transient API outage | Auto-retry handles it; if it still fails, the run errors and you can re-trigger |
| Savings rate looks wrong | `INCOME` constant outdated | Update `const INCOME` in Aggregate Month |
| `mom_change_pct` shows N/A | No data in the month before the target | Expected until you have two consecutive months of data |
| Huge "Uncategorized" leak | Untagged transactions in the sheet | Improve categorization upstream (W1) or tag historical rows |
| Duplicate report rows | Executed multiple times while testing | Delete duplicate rows manually |
