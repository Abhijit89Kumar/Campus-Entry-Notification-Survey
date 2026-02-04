"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

interface ConcernData {
  concern_id: string;
  concern_name: string;
  count: number;
  percentage: number;
  color: string;
}

interface ConcernBarProps {
  title: string;
  data: ConcernData[];
  delay?: number;
  onConcernClick?: (concernId: string) => void;
}

export function ConcernBar({
  title,
  data,
  delay = 0,
  onConcernClick,
}: ConcernBarProps) {
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <GlassCard className="p-6" delay={delay}>
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>

      <div className="space-y-4">
        {data.map((item, index) => (
          <motion.div
            key={item.concern_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + index * 0.1 }}
            className={cn(
              "group cursor-pointer",
              onConcernClick && "hover:scale-[1.02] transition-transform"
            )}
            onClick={() => onConcernClick?.(item.concern_id)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                {item.concern_name}
              </span>
              <span className="text-sm text-white/60">
                {item.count.toLocaleString()} ({item.percentage}%)
              </span>
            </div>
            
            <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / maxCount) * 100}%` }}
                transition={{
                  duration: 0.8,
                  delay: delay + index * 0.1 + 0.2,
                  ease: "easeOut",
                }}
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
