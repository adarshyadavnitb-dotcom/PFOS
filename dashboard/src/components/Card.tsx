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
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`glass glass-hover p-5 ${className}`}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold leading-snug text-slate-800 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </motion.div>
  );
}
