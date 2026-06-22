// Phase 1 test harness.
// Extracts the REAL Code-node JS from the workflow JSON files and runs it
// against sample inputs, so we test what's actually deployed.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── Load workflows ──
const w1 = JSON.parse(readFileSync(join(root, 'n8n/workflows/W1_capture_and_confirm.json'), 'utf8'));
const w2 = JSON.parse(readFileSync(join(root, 'n8n/workflows/W2_evening_summary.json'), 'utf8'));

const getCode = (wf, nodeName) =>
  wf.nodes.find(n => n.name === nodeName).parameters.jsCode;

// ── Load CategoryRules from the CSV template ──
const csv = readFileSync(join(root, 'sheets/templates/CategoryRules.csv'), 'utf8').trim().split('\n');
const headers = csv[0].split(',');
const rules = csv.slice(1).map(line => {
  const cols = line.split(',');
  return Object.fromEntries(headers.map((h, i) => [h, cols[i]]));
});

// ── Minimal n8n-style runner for a Code node ──
// Provides $input, $ (node accessor), and runs the node body, returning the JSON output.
function runCodeNode(jsCode, { inputItems = [], nodeOutputs = {} } = {}) {
  const wrap = items => ({
    first: () => items[0],
    all: () => items,
  });
  const $input = {
    first: () => inputItems[0],
    all: () => inputItems,
  };
  const $ = (nodeName) => wrap(nodeOutputs[nodeName] || []);
  const fn = new Function('$input', '$', jsCode);
  return fn($input, $);
}

let pass = 0, fail = 0;
const check = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}  ${detail}`); }
};

// ═══════════════════════════════════════════════════════════
console.log('\n━━━ W1: Parse Message + Match Category ━━━\n');

const parseCode = getCode(w1, 'Parse Message');
const matchCode = getCode(w1, 'Match Category');

const cases = [
  { msg: '450 swiggy',            amount: 450,  merchant: 'Swiggy',          category: 'Food & Dining', nw: 'Want' },
  { msg: 'swiggy 450',            amount: 450,  merchant: 'Swiggy',          category: 'Food & Dining', nw: 'Want' },
  { msg: 'uber 200',              amount: 200,  merchant: 'Uber',            category: 'Transport',     nw: 'Need' },
  { msg: '1200 rent',             amount: 1200, merchant: 'Rent',            category: 'Rent & Housing',nw: 'Need' },
  // Documented limitation: keyword "grocery" is not a substring of "groceries",
  // so plural form falls back to Uncategorized. See docs/W1_setup_guide.md.
  { msg: 'spent 300 on groceries',amount: 300,  merchant: 'Groceries',      category: 'Uncategorized', nw: 'Want' },
  { msg: '150 chai',              amount: 150,  merchant: 'Chai',            category: 'Food & Dining', nw: 'Want' },
  { msg: '99.50 netflix',         amount: 99.5, merchant: 'Netflix',         category: 'Subscriptions', nw: 'Want' },
  { msg: '500 random unknown shop',amount: 500, merchant: 'Random Unknown Shop', category: 'Uncategorized', nw: 'Want' },
];

for (const c of cases) {
  const telegramItem = { json: { message: { text: c.msg, chat: { id: 111 } } } };
  const parsed = runCodeNode(parseCode, { inputItems: [telegramItem] });
  const p = parsed[0].json;

  console.log(`"${c.msg}"`);
  check(`amount = ${c.amount}`, p.amount === c.amount, `got ${p.amount}`);
  check(`merchant = ${c.merchant}`, p.merchant === c.merchant, `got "${p.merchant}"`);

  // Now run Match Category with the rules + parsed output wired in
  const matched = runCodeNode(matchCode, {
    nodeOutputs: {
      'Parse Message': parsed,
      'Read CategoryRules': rules.map(r => ({ json: r })),
    },
  });
  const m = matched[0].json;
  check(`category = ${c.category}`, m.category === c.category, `got "${m.category}"`);
  check(`need/want = ${c.nw}`, m.need_or_want === c.nw, `got "${m.need_or_want}"`);
  console.log('');
}

// Bad input → parseSuccess false
console.log('"hello there" (should fail to parse)');
const bad = runCodeNode(parseCode, { inputItems: [{ json: { message: { text: 'hello there', chat: { id: 111 } } } }] });
check('parseSuccess = false', bad[0].json.parseSuccess === false, `got ${bad[0].json.parseSuccess}`);
console.log('');

// ═══════════════════════════════════════════════════════════
console.log('━━━ W2: Calculate Summary ━━━\n');

const summaryCode = getCode(w2, 'Calculate Summary');

// Build fake "today" rows + one old row that must be excluded
const now = new Date();
const iso = now.toISOString();
const oldIso = new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString();

const txRows = [
  { json: { timestamp: iso,    amount: '450', category: 'Food & Dining', need_or_want: 'Want' } },
  { json: { timestamp: iso,    amount: '300', category: 'Transport',     need_or_want: 'Need' } },
  { json: { timestamp: iso,    amount: '200', category: 'Food & Dining', need_or_want: 'Want' } },
  { json: { timestamp: oldIso, amount: '999', category: 'Shopping',      need_or_want: 'Want' } }, // old, excluded
  { json: { timestamp: '',     amount: '50',  category: 'X',             need_or_want: 'Want' } }, // bad ts, excluded
];

const summary = runCodeNode(summaryCode, { inputItems: txRows });
const s = summary[0].json;
console.log('Today rows: 3 valid (450+300+200), 1 old, 1 bad-timestamp\n');
check('total_spend = 950', s.total_spend === 950, `got ${s.total_spend}`);
check('transaction_count = 3', s.transaction_count === 3, `got ${s.transaction_count}`);
check('top_category = Food & Dining (650)', s.top_category === 'Food & Dining', `got "${s.top_category}"`);
check('need_pct = 32 (300/950)', s.need_pct === 32, `got ${s.need_pct}`);
check('hasData = true', s.hasData === true);
console.log('\n  Sample message preview:\n' + s.summaryText.split('\n').map(l => '    ' + l).join('\n'));

// Empty day
console.log('\nEmpty day (no rows):');
const empty = runCodeNode(summaryCode, { inputItems: [] });
check('hasData = false', empty[0].json.hasData === false);
check('total_spend = 0', empty[0].json.total_spend === 0);

// ═══════════════════════════════════════════════════════════
console.log(`\n━━━ RESULT: ${pass} passed, ${fail} failed ━━━\n`);
process.exit(fail === 0 ? 0 : 1);
