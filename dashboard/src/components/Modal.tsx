import { motion } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode } from "react";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", duration: 0.35 }}
        onClick={(e) => e.stopPropagation()}
        className="glass w-full max-w-md p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
