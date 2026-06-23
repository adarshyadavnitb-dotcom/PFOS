import { motion } from "framer-motion";
import { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  children,
  className = "",
  delay = 0,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass glass-hover p-5 ${className}`}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </motion.div>
  );
}
