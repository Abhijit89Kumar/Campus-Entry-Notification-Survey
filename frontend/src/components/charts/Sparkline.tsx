"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  showDots?: boolean;
  showArea?: boolean;
  strokeWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "#3b82f6",
  fillColor,
  showDots = false,
  showArea = true,
  strokeWidth = 1.5,
  className = "",
}: SparklineProps) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return "";

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create smooth bezier curve path
    let linePath = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      linePath += ` Q ${cpx} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      linePath += ` T ${curr.x} ${curr.y}`;
    }

    // Simple line path as fallback
    const simplePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    return simplePath;
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (!data || data.length < 2 || !showArea) return "";

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    let areaPath = `M ${points[0].x} ${height - padding}`;
    areaPath += ` L ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      areaPath += ` L ${points[i].x} ${points[i].y}`;
    }
    
    areaPath += ` L ${points[points.length - 1].x} ${height - padding}`;
    areaPath += " Z";

    return areaPath;
  }, [data, width, height, showArea]);

  const dots = useMemo(() => {
    if (!data || data.length < 2 || !showDots) return [];

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    return data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * chartWidth,
      y: padding + chartHeight - ((value - min) / range) * chartHeight,
      value,
    }));
  }, [data, width, height, showDots]);

  const trend = useMemo(() => {
    if (!data || data.length < 2) return "neutral";
    const first = data[0];
    const last = data[data.length - 1];
    if (last > first * 1.05) return "up";
    if (last < first * 0.95) return "down";
    return "neutral";
  }, [data]);

  const trendColor = trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : color;

  if (!data || data.length < 2) {
    return (
      <div
        className={`flex items-center justify-center text-white/30 text-xs ${className}`}
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor || trendColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={fillColor || trendColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {showArea && areaPath && (
        <motion.path
          d={areaPath}
          fill={`url(#sparkline-gradient-${color})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Line */}
      <motion.path
        d={path}
        fill="none"
        stroke={trendColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Dots */}
      {showDots &&
        dots.map((dot, index) => (
          <motion.circle
            key={index}
            cx={dot.x}
            cy={dot.y}
            r={2}
            fill={trendColor}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
          />
        ))}

      {/* End dot (always shown) */}
      {dots.length > 0 && (
        <motion.circle
          cx={dots[dots.length - 1].x}
          cy={dots[dots.length - 1].y}
          r={3}
          fill={trendColor}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        />
      )}
    </svg>
  );
}

export default Sparkline;
