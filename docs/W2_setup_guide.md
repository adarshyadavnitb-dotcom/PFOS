# W2: Evening Summary — Setup Guide

Every day at 9 PM, this workflow reads all of today's expenses, calculates totals, writes a summary row to the DailySummary tab, and sends you a Telegram message.

## What the workflow looks like

```
Every Day at 9 PM
      │
      ▼
Read Transactions  ←── Google Sheets: read all rows
      │
      ▼
Calculate Summary  ←── Code node: filter today, sum amounts, find top category
      │
      ▼
Write to DailySummary  ←── Google Sheets: append summary row
      │
      ▼
Send Summary to Telegram
"📊 Daily Summary — 2026-06-22
 💰 Total: ₹1250
 📝 Transactions: 4
 🏆 Top category: Food & Dining"
```

## What the Telegram message looks like

```
📊 Daily Summary — 2026-06-22

💰 Total: ₹1250
📝 Transactions: 4
🏆 Top category: Food & Dining

📋 Breakdown:
  • Food & Dining: ₹750
  • Transport: ₹300
  • Groceries: ₹200

⚖️ Needs: 40% | Wants: 60%
```

If no expenses were logged, you get:
```
📊 Daily Summary — 2026-06-22

No expenses logged today. Nice! 🎉
```

---

## Setup Steps

### 1. Import the workflow

1. Open n8n at **http://localhost:5678**
2. Click **⋮** (three dots menu) → **Import from file**
3. Select `n8n/workflows/W2_evening_summary.json`

### 2. Connect Google Sheets credentials

**Read Transactions node:**
1. Double-click it
2. Select your existing Google Sheets credential (same one you used in W1)
3. Select your **"PFOS v4"** spreadsheet
4. Select the **"Transactions"** tab
5. Save

**Write to DailySummary node:**
1. Double-click it
2. Select the same Google Sheets credential
3. Select your **"PFOS v4"** spreadsheet
4. Select the **"DailySummary"** tab
5. Save

### 3. Connect Telegram credential

**Send Summary to Telegram node:**
1. Double-click it
2. Select your existing Telegram credential (same one from W1)
3. **Important: Set the Chat ID** — this is your personal chat ID with the bot

**How to find your Chat ID:**
- Send any message to your bot
- Check the W1 workflow's Telegram Trigger output — the `message.chat.id` field is your Chat ID
- It's a number like `123456789`
- Paste that number into the Chat ID field

### 4. Test it

1. Make sure you have at least 1-2 expenses logged today via W1
2. Click on the **"Every Day at 9 PM"** node
3. Click **Execute Workflow** (this runs it immediately, ignoring the schedule)
4. Check each node's output — click on them one by one
5. Verify the DailySummary tab in Google Sheets has a new row
6. Verify you got a Telegram message

### 5. Publish it

Click **Publish** (top-right). The workflow will now run automatically at 9 PM every day.

---

## Node-by-Node Explanation

### Node 1: Every Day at 9 PM (Schedule Trigger)

**What it does:** Fires automatically at 9 PM every day.

**How it works:** n8n checks the schedule and starts the workflow at the set time. No external trigger needed — it just runs on its own.

**Note:** The time is based on your n8n server's timezone. Since n8n runs in Docker, it might default to UTC. 9 PM UTC = 2:30 AM IST. If you want 9 PM IST, set the hour to **15** (9 PM IST = 3:30 PM UTC... actually, set it to 15 for 8:30 PM IST or 16 for 9:30 PM IST). Or set the timezone in Docker:

```bash
docker run -d --name n8n -p 5678:5678 \
  -e GENERIC_TIMEZONE=Asia/Kolkata \
  -e TZ=Asia/Kolkata \
  -e WEBHOOK_URL=<your-tunnel-url>/ \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

### Node 2: Read Transactions (Google Sheets)

**What it does:** Reads every row from the Transactions tab.

**Why all rows, not just today?** The Google Sheets node doesn't support date filtering directly. We read all rows and filter in the next node using code. For a few hundred rows this is fast and free. If you ever hit thousands of rows, we can optimize later.

### Node 3: Calculate Summary (Code node)

**What it does:** The main logic — filters to today's rows and computes all the stats.

**Step by step:**

1. **Gets today's date in IST** — converts to Indian Standard Time so the cutoff matches your day, not UTC
2. **Filters rows** — only keeps transactions where the timestamp matches today
3. **Calculates total spend** — sums all amounts
4. **Finds top category** — counts spend per category, picks the highest
5. **Calculates need vs want %** — what percentage of spend was "Need" vs "Want"
6. **Builds the category breakdown** — one line per category with amount
7. **Formats the Telegram message** — puts it all together with emojis

**If no transactions today:** Returns a "No expenses logged" message instead of crashing.

### Node 4: Write to DailySummary (Google Sheets)

**What it does:** Appends one row to the DailySummary tab with today's stats.

**Columns written:**
| Column | Example |
|---|---|
| `date` | 2026-06-22 |
| `total_spend` | 1250 |
| `top_category` | Food & Dining |
| `transaction_count` | 4 |
| `need_pct` | 40 |

### Node 5: Send Summary to Telegram

**What it does:** Sends the formatted summary message to your Telegram chat.

**Note:** Unlike W1 (which replies to your message), W2 initiates a message — it sends TO you. That's why it needs a hardcoded Chat ID instead of pulling it from a trigger.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Summary shows ₹0 / no transactions | Timezone mismatch — n8n thinks "today" is a different date than your IST day | Add `GENERIC_TIMEZONE=Asia/Kolkata` to your Docker run command |
| "Chat not found" error | Wrong Chat ID or bot hasn't been messaged yet | Send any message to the bot first, then copy the Chat ID from W1's trigger output |
| Runs at wrong time | Docker timezone is UTC | Add the timezone env vars shown above |
| Duplicate summary rows | You clicked Execute multiple times during testing | Delete duplicate rows manually |
