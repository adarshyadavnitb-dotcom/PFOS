export interface Txn {
  date: string;
  amount: number;
  merchant: string;
  category: string;
  need_or_want: string;
  month_key: string;
}

export interface ApiData {
  monthly_income: number;
  transactions: Txn[];
  latest_weekly_insight?: string;
  generated_at: string;
}

export type RangeKey = "today" | "week" | "month" | "all";

export interface NewExpense {
  amount: number;
  merchant: string;
  category: string;
  need_or_want: "Need" | "Want";
}

export const CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Groceries",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Education",
  "Personal Care",
  "Other",
] as const;
