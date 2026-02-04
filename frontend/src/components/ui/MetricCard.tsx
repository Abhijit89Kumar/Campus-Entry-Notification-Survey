"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  icon?: LucideIcon;
  color?: "default" | "success" | "danger" | "warning";
  delay?: number;
  decimals?: number;
}

const colorClasses = {
  default: "text-white",
  success: "text-emerald-400",
  danger: "text-red-400",
  warning: "text-amber-400",
};

const iconBgClasses = {
  default: "bg-white/[0.06]",
  success: "bg-emerald-400/10",
  danger: "bg-red-400/10",
  warning: "bg-amber-400/10",
};

export function MetricCard({
  value,
  label,
  suffix = "",
  prefix = "",
  icon: Icon,
  color = "default",
  delay = 0,
  decimals = 0,
}: MetricCardProps) {
  // Handle NaN or undefined values
  const displayValue = isNaN(value) || value === undefined ? 0 : value;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:bg-white/[0.05] transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className={cn("text-3xl font-semibold", colorClasses[color])}>
            {prefix}
            <CountUp
              end={displayValue}
              duration={1.5}
              delay={delay}
              decimals={decimals}
              separator=","
            />
            {suffix}
          </span>
          <p className="mt-1 text-xs font-medium text-white/50 uppercase tracking-wider">
            {label}
          </p>
        </div>
        
        {Icon && (
          <div className={cn("p-2.5 rounded-lg", iconBgClasses[color])}>
            <Icon className={cn("w-5 h-5", colorClasses[color], color === "default" && "text-white/50")} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
