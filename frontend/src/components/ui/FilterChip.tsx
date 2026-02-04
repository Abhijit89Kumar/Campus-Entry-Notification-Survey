"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  count?: number;
}

export function FilterChip({
  label,
  active = false,
  onClick,
  onRemove,
  count,
}: FilterChipProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2",
        "text-sm font-medium rounded-full",
        "border transition-all duration-200",
        active
          ? "bg-sky-500/20 border-sky-400/50 text-sky-300"
          : "bg-white/[0.06] border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80"
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "px-2 py-0.5 text-xs rounded-full",
            active ? "bg-sky-400/30" : "bg-white/10"
          )}
        >
          {count}
        </span>
      )}
      {onRemove && active && (
        <X
          className="w-3.5 h-3.5 cursor-pointer hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </motion.button>
  );
}
