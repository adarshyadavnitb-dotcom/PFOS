import { ApiData, Txn } from "./types";

// Deterministic pseudo-random so the demo looks the same on every load.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MERCHANTS: Record<string, { names: string[]; nw: "Need" | "Want"; min: number; max: number }> = {
  "Food & Dining": { names: ["Swiggy", "Zomato", "Starbucks", "Domino's", "Chaayos", "Local Cafe"], nw: "Want", min: 120, max: 900 },
  Transport: { names: ["Uber", "Ola", "Rapido", "Metro Card", "IndianOil"], nw: "Need", min: 40, max: 1400 },
  Groceries: { names: ["DMart", "BigBasket", "Blinkit", "Reliance Fresh", "Zepto"], nw: "Need", min: 200, max: 2200 },
  Shopping: { names: ["Amazon", "Myntra", "Flipkart", "Nykaa", "Decathlon"], nw: "Want", min: 400, max: 4500 },
  Entertainment: { names: ["Netflix", "Spotify", "BookMyShow", "PVR", "Prime Video"], nw: "Want", min: 149, max: 1200 },
  Health: { names: ["Apollo Pharmacy", "Cult.fit", "1mg", "PharmEasy"], nw: "Need", min: 200, max: 2500 },
  Utilities: { names: ["Airtel", "Jio", "BESCOM", "ACT Fibernet"], nw: "Need", min: 300, max: 2400 },
  "Personal Care": { names: ["Urban Company", "Salon Studio", "The Man Company"], nw: "Want", min: 200, max: 1500 },
};

function genTransactions(): Txn[] {
  const rand = mulberry32(20260623);
  const cats = Object.keys(MERCHANTS);
  const txns: Txn[] = [];
  const now = Date.now();
  const DAYS = 80;

  for (let day = DAYS; day >= 0; day--) {
    // 0–4 transactions per day, weighted toward 1–2
    const count = Math.floor(rand() * rand() * 5);
    for (let i = 0; i < count; i++) {
      const cat = cats[Math.floor(rand() * cats.length)];
      const m = MERCHANTS[cat];
      const merchant = m.names[Math.floor(rand() * m.names.length)];
      const amount = Math.round(m.min + rand() * (m.max - m.min));
      const ts = new Date(now - day * 86400000 + Math.floor(rand() * 14 + 8) * 3600000);
      const mk = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, "0")}`;
      txns.push({
        date: ts.toISOString(),
        amount,
        merchant,
        category: cat,
        need_or_want: m.nw,
        month_key: mk,
      });
    }
  }
  return txns;
}

export const DEMO_DATA: ApiData = {
  monthly_income: 145000,
  budgets: [
    { category: "Food & Dining", monthly_limit: 14500 },
    { category: "Transport", monthly_limit: 7250 },
    { category: "Groceries", monthly_limit: 13050 },
    { category: "Shopping", monthly_limit: 10150 },
    { category: "Entertainment", monthly_limit: 4350 },
    { category: "Health", monthly_limit: 5800 },
    { category: "Utilities", monthly_limit: 7250 },
    { category: "Education", monthly_limit: 4350 },
    { category: "Personal Care", monthly_limit: 2900 },
    { category: "Other", monthly_limit: 4350 },
  ],
  transactions: genTransactions(),
  latest_weekly_insight:
    "Weekly Money Insight 📈\n\nYour spending this week was ₹8,940, a touch above your ₹7,800 average.\n\n• Food & Dining led at ₹3,100 — a few extra weekend orders.\n• Groceries stayed steady at ₹2,400.\n\nTip: Try a two-day no-delivery streak next week to nudge dining back toward your average. You've got this!",
  generated_at: new Date().toISOString(),
};
