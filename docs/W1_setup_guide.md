# W1: Capture & Confirm — Setup Guide

This is your first workflow. When you send a message like `450 Swiggy` on Telegram, it extracts the amount and merchant, finds the category, saves it to Google Sheets, and replies with a confirmation.

## What the workflow looks like

```
Telegram Trigger
      │
      ▼
 Parse Message  ←── Code node: regex extracts amount + merchant
      │
      ▼
  Parse OK?  ────── IF node: did we find a number?
    │       │
   YES      NO
    │        │
    ▼        ▼
Read          Send Error Reply
CategoryRules    "Couldn't understand that message"
    │
    ▼
Match Category  ←── Code node: keyword lookup against rules
    │
    ▼
Write to
Transactions  ←── Google Sheets: append row
    │
    ▼
Send Confirmation
"✅ ₹450 logged under Food & Dining (Want)"
```

---

## Prerequisites (Do These First)

### 1. Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Give it a name (e.g., "PFOS Finance Bot")
4. Give it a username (e.g., `pfos_finance_bot`)
5. **Save the bot token** — it looks like `7123456789:AAF...` — you'll need this in n8n

### 2. Start n8n

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

Then open **http://localhost:5678** in your browser.

> The `-v n8n_data:/home/node/.n8n` part saves your workflows so they survive container restarts. Don't skip it.

### 3. Create the Google Sheet

1. Go to **Google Sheets** and create a new spreadsheet
2. Name it **"PFOS v4"**
3. Create **4 tabs** (rename the default "Sheet1" and add new ones):
   - `Transactions`
   - `Categories`
   - `CategoryRules`
   - `DailySummary`

4. **Copy the headers** from the CSV template files in `sheets/templates/`:

   **Transactions tab** — paste this as Row 1:
   ```
   transaction_id | timestamp | raw_message | amount | merchant_vendor | category | subcategory | need_or_want | payment_mode | confidence_score | user_corrected | month_key | source
   ```

   **Categories tab** — paste the data from `sheets/templates/Categories.csv`

   **CategoryRules tab** — paste the data from `sheets/templates/CategoryRules.csv`

   **DailySummary tab** — paste this as Row 1:
   ```
   date | total_spend | top_category | transaction_count | need_pct
   ```

> **Tip:** Open the CSV files in a text editor, copy the content, then paste into Google Sheets using **Edit → Paste special → Paste values only** so it splits into columns properly. Or import each CSV via **File → Import**.

### 4. Set Up Google Sheets API Access

1. Go to **Google Cloud Console** (console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Google Sheets API**
4. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add `http://localhost:5678/rest/oauth2-credential/callback` as an **Authorized redirect URI**
7. Save the **Client ID** and **Client Secret**

---

## Importing the Workflow

### Option A: Import the JSON file (recommended)

1. Open n8n at **http://localhost:5678**
2. Click the **three dots menu (⋮)** in the top-right → **Import from file**
3. Select `n8n/workflows/W1_capture_and_confirm.json`
4. The workflow appears with all 7 nodes already connected

### Option B: Build it manually

Follow the node-by-node guide below and create each node yourself. This takes longer but you'll understand every piece.

---

## After Importing: Connect Your Credentials

The imported workflow has placeholder credentials. You need to connect your real ones.

### Connect Telegram

1. Double-click any Telegram node (e.g., "Send Confirmation")
2. Under **Credential to connect with**, click **Create New**
3. Paste your **Bot Token** from BotFather
4. Click **Save**
5. This credential auto-applies to all Telegram nodes in the workflow

### Connect Google Sheets

1. Double-click the **"Read CategoryRules"** node
2. Under **Credential to connect with**, click **Create New**
3. Choose **OAuth2**
4. Enter your **Client ID** and **Client Secret** from Google Cloud Console
5. Click **Sign in with Google** and authorize access
6. **Select your spreadsheet** ("PFOS v4") from the dropdown
7. **Select the sheet tab** ("CategoryRules") from the dropdown
8. Click **Save**
9. Do the same for the **"Write to Transactions"** node — same credential, but select the **"Transactions"** tab

---

## Node-by-Node Explanation

### Node 1: Telegram Trigger

**What it does:** Listens for any message you send to your bot.

**How it works:** When you activate this workflow, n8n registers a webhook with Telegram. Every time you send a message to your bot, Telegram sends that message to n8n.

**What comes out:** A JSON object containing the full message details. The part we care about is `message.text` — that's your raw input like `"450 swiggy"`.

**Settings:**
- Updates: `message` (we only care about text messages, not edits or other events)

---

### Node 2: Parse Message (Code node)

**What it does:** Takes your raw text and extracts the amount and merchant name.

**How it works — step by step:**

1. **Grabs the message text** from the Telegram trigger output
2. **Finds the number** using a regex pattern: `(\d+\.?\d*)` — this matches whole numbers (`450`) and decimals (`450.50`)
3. **Everything else becomes the merchant** — it removes the number, removes filler words like "spent", "on", "for", "at", and capitalizes each word
4. **Generates a transaction ID** like `TXN-20260622-143025` (date + time, so each one is unique)
5. **Generates a month key** like `2026-06` (used later for monthly grouping)

**Example inputs and outputs:**

| You type | Amount | Merchant |
|---|---|---|
| `450 swiggy` | 450 | Swiggy |
| `swiggy 450` | 450 | Swiggy |
| `spent 1200 on uber` | 1200 | Uber |
| `300 chai and samosa` | 300 | Chai And Samosa |
| `hello there` | (fails) | → goes to error path |

**If parsing fails** (no number found), it outputs `parseSuccess: false` and the next node routes it to the error reply.

---

### Node 3: Parse OK? (IF node)

**What it does:** A simple yes/no check — did we successfully find an amount?

**How it works:** Checks if `parseSuccess` equals `true`.

- **YES (true) path** → continues to category lookup
- **NO (false) path** → sends an error reply on Telegram

**Why this matters:** Without this check, messages like "hello" or "what's up" would crash the workflow instead of replying with a helpful error.

---

### Node 4: Read CategoryRules (Google Sheets node)

**What it does:** Reads all rows from your `CategoryRules` tab.

**How it works:** Fetches every row from the sheet. Each row has a `keyword`, `category`, and `need_or_want`. This data is passed to the next node for matching.

**Example data it reads:**

| keyword | category | need_or_want |
|---|---|---|
| swiggy | Food & Dining | Want |
| uber | Transport | Need |
| rent | Rent & Housing | Need |

**Settings:**
- Operation: Read (default)
- Document: Your "PFOS v4" spreadsheet
- Sheet: CategoryRules tab

---

### Node 5: Match Category (Code node)

**What it does:** Compares the extracted merchant against the keyword rules to find the right category.

**How it works — step by step:**

1. Gets the merchant name from the Parse Message node (e.g., `"Swiggy"`)
2. Gets all the rules from the Read CategoryRules node
3. Loops through each rule and checks: does the merchant contain this keyword?
   - `"swiggy".includes("swiggy")` → YES → category = "Food & Dining", need_or_want = "Want"
4. If no keyword matches → defaults to `"Uncategorized"` and `"Want"`
5. Outputs a complete row object with all 13 columns matching the Transactions tab

**Important:** The matching is case-insensitive (`"Swiggy"` matches `"swiggy"`).

**What comes out:** A single object shaped exactly like one row of the Transactions tab:
```json
{
  "transaction_id": "TXN-20260622-143025",
  "timestamp": "2026-06-22T14:30:25.000Z",
  "raw_message": "450 swiggy",
  "amount": 450,
  "merchant_vendor": "Swiggy",
  "category": "Food & Dining",
  "need_or_want": "Want",
  "payment_mode": "Unspecified",
  "user_corrected": false,
  "month_key": "2026-06",
  "source": "telegram_text"
}
```

---

### Node 6: Write to Transactions (Google Sheets node)

**What it does:** Appends one new row to the `Transactions` tab.

**How it works:** Takes the output from Match Category and writes it as a new row. The column names in the JSON match the column headers in your sheet, so n8n maps them automatically.

**Settings:**
- Operation: Append
- Document: Your "PFOS v4" spreadsheet
- Sheet: Transactions tab
- Mapping: Auto-map from input data (n8n matches JSON keys to column headers)

**After this runs:** You'll see a new row appear in your Google Sheet.

---

### Node 7: Send Confirmation (Telegram node)

**What it does:** Sends you a reply on Telegram confirming the expense was logged.

**How it works:** Pulls the amount, category, need/want, and merchant from the Match Category node and formats a message.

**Example output:**
```
✅ ₹450 logged under Food & Dining (Want)

🏪 Swiggy
```

**Settings:**
- Chat ID: Automatically uses the chat ID from the original Telegram message (so it replies in the same conversation)
- Parse mode: HTML (allows formatting)

---

### Node 8: Send Error Reply (Telegram node)

**What it does:** If parsing failed (no number found), sends a helpful error message.

**Example output:**
```
❌ Couldn't understand that message.

Try a format like:
• 450 Swiggy
• Uber 200
• Spent 300 on groceries
```

---

## Known Limitations (Phase 1)

These are intentional simplifications of the rule-based approach. Phase 2 (Gemini AI) removes most of them.

### Keyword matching is substring-based and exact

Category matching checks whether the merchant text *contains* a keyword from the `CategoryRules` tab. It does **not** handle spelling variations.

- ✅ `grocery store` → matches keyword `grocery`
- ❌ `groceries` → does **NOT** match keyword `grocery` (the spelling diverges at the end, so `grocery` is not a substring of `groceries`) → falls back to **Uncategorized**

**Workaround:** add the variant forms you actually use as their own rows in the `CategoryRules` tab (e.g. add a `groceries` keyword alongside `grocery`). Each unmatched merchant you see is a one-line addition to the sheet — no workflow edit needed.

### Other Phase 1 limitations

- **One number per message** — the parser takes the *first* number as the amount. "2 coffees 300" would read amount = 2, not 300.
- **No currency/date awareness** — everything is logged as ₹ at the current timestamp.
- **First-match wins** — if a merchant contains two keywords, whichever appears first in the `CategoryRules` tab wins.

---

## Testing the Workflow

### Automated logic test (no Telegram needed)

A test harness at `tests/test_phase1.mjs` extracts the real Code-node logic from the workflow JSON and runs it against sample inputs — useful for checking the parsing/categorization/summary logic without a live bot or VPN:

```bash
node tests/test_phase1.mjs
```

It asserts amount/merchant/category extraction, the Uncategorized fallback, error-path handling, and the W2 daily-summary math (including correct exclusion of other days' rows). The `groceries` → Uncategorized case above is encoded as expected behavior, so the suite documents the limitation rather than flagging it.

### Manual test in n8n

### Step 1: Test each node individually

1. Click on the **Telegram Trigger** node
2. Click **Listen for Test Event**
3. Go to Telegram and send your bot: `450 swiggy`
4. n8n should show the received message data
5. Click **Execute Workflow** to run the rest of the nodes
6. Check each node's output by clicking on it

### Step 2: Test with varied messages

Send these messages one by one and check the Transactions sheet after each:

| Message | Expected Amount | Expected Merchant | Expected Category |
|---|---|---|---|
| `450 swiggy` | 450 | Swiggy | Food & Dining |
| `uber 200` | 200 | Uber | Transport |
| `1200 rent` | 1200 | Rent | Rent & Housing |
| `spent 300 on groceries` | 300 | Groceries | Groceries |
| `150 chai` | 150 | Chai | Food & Dining |
| `hello` | (should fail) | — | — |

### Step 3: Activate the workflow

Once everything works in test mode:

1. Toggle the **Active** switch in the top-right corner
2. The workflow now runs automatically whenever you message the bot
3. You don't need to keep the n8n browser tab open — it runs in the background (as long as Docker is running)

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Bot doesn't respond | Workflow not active, or webhook not registered | Toggle Active off and on again |
| "Couldn't understand" for valid messages | Regex didn't find a number | Check the message format — number must be present |
| Wrong category | Keyword not in CategoryRules tab | Add the keyword to the CategoryRules tab in Google Sheets |
| "Uncategorized" for everything | Google Sheets credential not connected, or wrong tab selected | Re-check the Read CategoryRules node settings |
| Google Sheets error | OAuth expired or wrong permissions | Re-authorize in the credential settings |
| Duplicate transactions | You clicked "Execute Workflow" multiple times during testing | Delete duplicate rows from the sheet manually |

---

## What's Next

After testing W1 with 15-20 real expenses over 3-5 days:

- **W2 (Evening Summary)** — Automated daily summary at 9 PM
- Then, once both work reliably → **Phase 2** (add Gemini AI for smarter categorization)
