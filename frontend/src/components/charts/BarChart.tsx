"use client";

import { motion } from "framer-motion";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";

interface BarChartProps {
  title: string;
  data: any[];
  dataKeys: {
    key: string;
    name: string;
    color: string;
  }[];
  xAxisKey: string;
  delay?: number;
  showLegend?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function BarChartComponent({
  title,
  data,
  dataKeys,
  xAxisKey,
  delay = 0,
  showLegend = true,
}: BarChartProps) {
  return (
    <GlassCard className="p-6" delay={delay}>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                }}
                formatter={(value) => (
                  <span className="text-white/70 text-sm">{value}</span>
                )}
              />
            )}
            {dataKeys.map((dk, index) => (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.name}
                fill={dk.color}
                radius={[4, 4, 0, 0]}
                animationBegin={delay * 1000 + index * 200}
                animationDuration={800}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
