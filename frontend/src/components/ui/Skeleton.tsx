"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg",
        "bg-gradient-to-r from-white/5 via-white/10 to-white/5",
        "bg-[length:200%_100%]",
        className
      )}
      style={{
        animation: "skeleton-loading 1.5s infinite",
      }}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="p-6 bg-white/[0.08] backdrop-blur-xl border border-white/[0.18] rounded-2xl">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-6 bg-white/[0.08] backdrop-blur-xl border border-white/[0.18] rounded-2xl">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
