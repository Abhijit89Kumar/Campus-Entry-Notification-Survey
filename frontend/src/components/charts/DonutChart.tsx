"use client";

import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";

interface DonutChartProps {
  title: string;
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  centerLabel?: string;
  centerValue?: string | number;
  delay?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3">
        <p className="text-white font-medium">{payload[0].name}</p>
        <p className="text-white/70 text-sm">
          {payload[0].value.toLocaleString()} ({((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export function DonutChart({
  title,
  data,
  centerLabel,
  centerValue,
  delay = 0,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map((item) => ({ ...item, total }));

  return (
    <GlassCard className="p-6" delay={delay}>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              animationBegin={delay * 1000}
              animationDuration={1000}
            >
              {dataWithTotal.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        {centerValue && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.5, duration: 0.3 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-white">{centerValue}</div>
              {centerLabel && (
                <div className="text-sm text-white/60">{centerLabel}</div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        {data.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.3 + index * 0.1 }}
            className="flex items-center gap-2"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-white/70">
              {item.name}: {item.value.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
