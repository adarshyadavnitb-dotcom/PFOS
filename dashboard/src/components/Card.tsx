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
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 28 } }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`glass glass-hover p-5 ${className}`}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}
