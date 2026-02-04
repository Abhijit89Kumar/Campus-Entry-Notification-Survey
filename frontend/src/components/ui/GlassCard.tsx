"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export function GlassCard({
  children,
  className,
  hover = true,
  delay = 0,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={
        hover
          ? {
              y: -2,
              transition: { duration: 0.15 },
            }
          : undefined
      }
      className={cn(
        "bg-white/[0.03] border border-white/[0.08] rounded-xl",
        hover && "hover:bg-white/[0.05] transition-colors duration-200",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function GlassCardSubtle({
  children,
  className,
  ...props
}: Omit<GlassCardProps, "hover">) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "bg-white/[0.02] border border-white/[0.06] rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
