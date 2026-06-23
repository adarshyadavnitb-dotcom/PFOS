import { useState } from "react";
import { Loader2 } from "lucide-react";
import { CATEGORIES, NewExpense } from "../types";
import { catColor } from "../lib/colors";
import { Modal } from "./Modal";

export function QuickAddModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (e: NewExpense) => void;
  submitting: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [nw, setNw] = useState<"Need" | "Want">("Want");

  const valid = parseFloat(amount) > 0 && merchant.trim().length > 0;

  return (
    <Modal title="Quick add expense" subtitle="Logs straight into your Transactions sheet" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount (₹)</label>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              placeholder="450"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Merchant</label>
            <input
              className="input"
              placeholder="Swiggy"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`pill inline-flex items-center gap-1.5 ${category === c ? "pill-active" : "pill-idle"}`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: catColor(c) }} />
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Type</label>
          <div className="inline-flex gap-1 rounded-full border border-black/[0.06] bg-white/50 p-1 dark:border-white/10 dark:bg-white/[0.04]">
            {(["Need", "Want"] as const).map((t) => (
              <button key={t} onClick={() => setNw(t)} className={`pill ${nw === t ? "pill-active" : "pill-idle"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!valid || submitting}
          onClick={() => onSubmit({ amount: parseFloat(amount), merchant: merchant.trim(), category, need_or_want: nw })}
          className="btn-primary w-full justify-center"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {submitting ? "Adding…" : "Add expense"}
        </button>
      </div>
    </Modal>
  );
}
