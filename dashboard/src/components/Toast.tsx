import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface ToastState {
  msg: string;
  kind: "success" | "error";
}

export function Toast({ toast }: { toast: ToastState | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2"
        >
          <div className="glass flex items-center gap-2.5 px-4 py-3 text-sm font-medium">
            {toast.kind === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-500" />
            ) : (
              <AlertCircle size={18} className="text-rose-500" />
            )}
            <span className="text-slate-700 dark:text-slate-200">{toast.msg}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
