"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface TimelineDataPoint {
  date: string;
  daily_count: number;
  cumulative_count: number;
}

interface TimelineChartProps {
  data: TimelineDataPoint[];
  showCumulative?: boolean;
  showDaily?: boolean;
  height?: number;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e2128]/95 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-white/60 text-xs mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function TimelineChart({
  data,
  showCumulative = true,
  showDaily = true,
  height = 300,
  className = "",
}: TimelineChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((d) => ({
      ...d,
      dateLabel: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data]);

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const dailyCounts = data.map((d) => d.daily_count);
    const maxDaily = Math.max(...dailyCounts);
    const avgDaily = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
    const peakDay = data.find((d) => d.daily_count === maxDaily);
    
    return {
      maxDaily,
      avgDaily: Math.round(avgDaily),
      peakDay: peakDay?.date,
      total: data[data.length - 1]?.cumulative_count || 0,
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-white/40 ${className}`}
        style={{ height }}
      >
        <p className="text-sm">No timeline data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          
          <XAxis
            dataKey="dateLabel"
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          
          <YAxis
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            width={40}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Average line */}
          {stats && (
            <ReferenceLine
              y={stats.avgDaily}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="5 5"
              label={{
                value: `Avg: ${stats.avgDaily}`,
                fill: "rgba(255,255,255,0.4)",
                fontSize: 10,
                position: "right",
              }}
            />
          )}
          
          {showCumulative && (
            <Area
              type="monotone"
              dataKey="cumulative_count"
              name="Cumulative"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#cumulativeGradient)"
              animationDuration={1000}
            />
          )}
          
          {showDaily && (
            <Area
              type="monotone"
              dataKey="daily_count"
              name="Daily"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#dailyGradient)"
              animationDuration={1000}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Stats bar */}
      {stats && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <div className="text-center">
            <p className="text-xs text-white/40">Total</p>
            <p className="text-lg font-semibold text-white">{stats.total.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/40">Daily Avg</p>
            <p className="text-lg font-semibold text-white">{stats.avgDaily}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/40">Peak Day</p>
            <p className="text-lg font-semibold text-white">{stats.maxDaily}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/40">Days</p>
            <p className="text-lg font-semibold text-white">{data.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Hourly heatmap component
export function HourlyHeatmap({
  distribution,
  className = "",
}: {
  distribution: Record<string, number>;
  className?: string;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1">
        {hours.map((hour) => {
          const count = distribution[hour.toString()] || 0;
          const intensity = count / maxCount;
          const label = hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`;
          
          return (
            <div
              key={hour}
              className="flex flex-col items-center"
              title={`${label}: ${count} responses`}
            >
              <div
                className="w-6 h-6 rounded-sm border border-white/10 transition-all duration-200 hover:scale-110"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.8})`,
                }}
              />
              <span className="text-[10px] text-white/40 mt-1">
                {hour % 6 === 0 ? label : ""}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="text-xs text-white/40">Less</span>
        <div className="flex gap-0.5">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
            <div
              key={opacity}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
            />
          ))}
        </div>
        <span className="text-xs text-white/40">More</span>
      </div>
    </div>
  );
}

export default TimelineChart;
