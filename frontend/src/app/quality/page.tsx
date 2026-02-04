"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { getQuality } from "@/lib/api";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  FileWarning,
  MessageSquare,
  Keyboard,
  Type,
} from "lucide-react";

export default function QualityPage() {
  const { data: quality, isLoading } = useQuery({
    queryKey: ["quality"],
    queryFn: getQuality,
  });

  // Calculate totals
  const totalResponses = quality
    ? (quality.excellent || 0) + (quality.good || 0) + (quality.acceptable || 0) + (quality.poor || 0)
    : 0;

  const excellentCount = quality?.excellent || 0;
  const goodCount = quality?.good || 0;
  const acceptableCount = quality?.acceptable || 0;
  const poorCount = quality?.poor || 0;
  const flaggedBreakdown = quality?.flagged_breakdown || {};

  // Quality distribution for chart
  const qualityData = [
    { label: "Excellent", value: excellentCount, color: "#4ade80", percent: totalResponses ? (excellentCount / totalResponses * 100).toFixed(1) : 0 },
    { label: "Good", value: goodCount, color: "#5c9eff", percent: totalResponses ? (goodCount / totalResponses * 100).toFixed(1) : 0 },
    { label: "Acceptable", value: acceptableCount, color: "#fbbf24", percent: totalResponses ? (acceptableCount / totalResponses * 100).toFixed(1) : 0 },
    { label: "Poor", value: poorCount, color: "#f87171", percent: totalResponses ? (poorCount / totalResponses * 100).toFixed(1) : 0 },
  ];

  // Flag icons mapping
  const flagIcons: Record<string, typeof AlertTriangle> = {
    too_short: MessageSquare,
    keyboard_spam: Keyboard,
    all_caps: Type,
    minimal: FileWarning,
    empty: XCircle,
  };

  const flagLabels: Record<string, string> = {
    too_short: "Too Short",
    keyboard_spam: "Keyboard Spam",
    all_caps: "All Caps",
    minimal: "Minimal Response",
    empty: "Empty",
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Header
        title="Data Quality Analysis"
        subtitle="Quality assessment and flagged responses"
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              value={excellentCount + goodCount}
              label="High Quality"
              icon={CheckCircle}
              color="success"
            />
            <MetricCard
              value={acceptableCount}
              label="Acceptable"
              icon={Shield}
              color="warning"
            />
            <MetricCard
              value={poorCount}
              label="Poor Quality"
              icon={XCircle}
              color="danger"
            />
            <MetricCard
              value={Object.values(flaggedBreakdown).reduce((a, b) => a + (b as number), 0)}
              label="Total Flags"
              icon={AlertTriangle}
              color="warning"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Quality Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-white mb-4">
            Quality Score Distribution
          </h3>
          
          {isLoading ? (
            <div className="h-48 skeleton rounded-lg" />
          ) : (
            <div className="space-y-3">
              {qualityData.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-white/70">{item.label}</span>
                    <span className="text-sm font-medium text-white">
                      {item.value} ({item.percent}%)
                    </span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Number(item.percent)}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Flagged Issues */}
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-white mb-4">
            Issues Detected
          </h3>
          
          {isLoading ? (
            <div className="h-48 skeleton rounded-lg" />
          ) : Object.keys(flaggedBreakdown).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(flaggedBreakdown)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([flag, count], index) => {
                  const Icon = flagIcons[flag] || AlertTriangle;
                  return (
                    <motion.div
                      key={flag}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-400/10 rounded-lg">
                          <Icon className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-white/80 text-sm">
                          {flagLabels[flag] || flag}
                        </span>
                      </div>
                      <span className="text-white font-semibold">{count as number}</span>
                    </motion.div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400/50 mb-3" />
              <p className="text-white/50">No quality issues detected!</p>
              <p className="text-white/30 text-sm mt-1">All responses passed quality checks.</p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Quality Criteria */}
      <GlassCard className="p-6">
        <h3 className="text-base font-semibold text-white mb-4">
          Quality Criteria
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-emerald-400/5 border border-emerald-400/10 rounded-lg">
            <h4 className="text-emerald-400 font-medium text-sm mb-2">Excellent (90+)</h4>
            <p className="text-white/50 text-xs">
              Detailed, thoughtful responses with no quality issues detected.
            </p>
          </div>
          <div className="p-4 bg-blue-400/5 border border-blue-400/10 rounded-lg">
            <h4 className="text-blue-400 font-medium text-sm mb-2">Good (70-89)</h4>
            <p className="text-white/50 text-xs">
              Reasonable responses with minor issues (e.g., slightly short).
            </p>
          </div>
          <div className="p-4 bg-amber-400/5 border border-amber-400/10 rounded-lg">
            <h4 className="text-amber-400 font-medium text-sm mb-2">Acceptable (40-69)</h4>
            <p className="text-white/50 text-xs">
              Basic responses that may have quality concerns but are still usable.
            </p>
          </div>
          <div className="p-4 bg-red-400/5 border border-red-400/10 rounded-lg">
            <h4 className="text-red-400 font-medium text-sm mb-2">Poor (&lt;40)</h4>
            <p className="text-white/50 text-xs">
              Responses with significant issues: spam, gibberish, or extremely short.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
