"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  TrendingDown,
  Users,
  Lightbulb,
  Download,
  ArrowRight,
  Shield,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCardSkeleton } from "@/components/ui/Skeleton";
import { getDecisionSummary } from "@/lib/api";
import { useState } from "react";

export default function DecisionSummaryPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: summary,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["decision-summary"],
    queryFn: getDecisionSummary,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const priorityColors = {
    high: "border-red-400/30 bg-red-400/10",
    medium: "border-amber-400/30 bg-amber-400/10",
    low: "border-blue-400/30 bg-blue-400/10",
  };

  const priorityTextColors = {
    high: "text-red-400",
    medium: "text-amber-400",
    low: "text-blue-400",
  };

  const confidenceColors = {
    high: "bg-emerald-500/20 text-emerald-400",
    medium: "bg-amber-500/20 text-amber-400",
    low: "bg-red-500/20 text-red-400",
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <Header title="Decision Summary" subtitle="Executive overview for administrators" />
        <EmptyState
          variant="error"
          title="Failed to Load Summary"
          description="Could not generate the decision summary. Please try again."
          action={{ label: "Retry", onClick: handleRefresh }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Header
        title="Decision Summary"
        subtitle="Executive overview for policy decision-making"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      ) : summary ? (
        <>
          {/* Executive Summary Card */}
          <GlassCard className="p-6 mb-6" delay={0}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white mb-2">Executive Summary</h2>
                <p className="text-white/80 leading-relaxed">
                  {summary.findings.executive_summary}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Key Metrics with Confidence Intervals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    summary.metrics.sample_adequacy.adequacy === "strong" ? "bg-emerald-500/20 text-emerald-400" :
                    summary.metrics.sample_adequacy.adequacy === "adequate" ? "bg-blue-500/20 text-blue-400" :
                    "bg-amber-500/20 text-amber-400"
                  }`}>
                    {summary.metrics.sample_adequacy.adequacy}
                  </span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {summary.metrics.total_responses.toLocaleString()}
                </p>
                <p className="text-sm text-white/50">Total Responses</p>
                <p className="text-xs text-white/40 mt-2">
                  ±{summary.metrics.sample_adequacy.worst_case_moe_percent}% margin
                </p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <span className="text-xs text-white/40">Q1</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {(100 - summary.metrics.q1_support.percentage).toFixed(1)}%
                </p>
                <p className="text-sm text-white/50">Oppose Notification</p>
                <p className="text-xs text-white/40 mt-2">
                  95% CI: {(100 - summary.metrics.q1_support.ci_upper).toFixed(1)}% - {(100 - summary.metrics.q1_support.ci_lower).toFixed(1)}%
                </p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <span className="text-xs text-white/40">Q2</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {(100 - summary.metrics.q2_support.percentage).toFixed(1)}%
                </p>
                <p className="text-sm text-white/50">Oppose Monitoring</p>
                <p className="text-xs text-white/40 mt-2">
                  95% CI: {(100 - summary.metrics.q2_support.ci_upper).toFixed(1)}% - {(100 - summary.metrics.q2_support.ci_lower).toFixed(1)}%
                </p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {summary.metrics.valid_responses.toLocaleString()}
                </p>
                <p className="text-sm text-white/50">Valid Responses</p>
                <p className="text-xs text-white/40 mt-2">
                  {((summary.metrics.valid_responses / summary.metrics.total_responses) * 100).toFixed(1)}% quality rate
                </p>
              </GlassCard>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Key Findings */}
            <GlassCard className="p-6 lg:col-span-2" delay={0.3}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Key Findings</h3>
                <span className="text-sm text-white/40">
                  {summary.findings.total_findings} findings
                </span>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {summary.findings.findings.slice(0, 7).map((finding, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.05 }}
                    className="flex gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {finding.category === "opposition" ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : finding.category === "quality" ? (
                        <Shield className="w-4 h-4 text-emerald-400" />
                      ) : finding.category === "concern" ? (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/90">{finding.text}</p>
                      {finding.supporting_stat && (
                        <p className="text-xs text-white/50 mt-1">{finding.supporting_stat}</p>
                      )}
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full h-fit ${confidenceColors[finding.confidence as keyof typeof confidenceColors] || confidenceColors.medium}`}>
                      {finding.confidence}
                    </span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* What Students Want */}
            <GlassCard className="p-6" delay={0.35}>
              <h3 className="text-lg font-semibold text-white mb-4">What Students Want</h3>

              {/* Top Concerns */}
              <div className="mb-6">
                <p className="text-xs text-white/40 uppercase tracking-wide mb-3">Top Concerns</p>
                <div className="space-y-2">
                  {summary.concerns_summary.map((concern, index) => (
                    <div
                      key={concern.concern_id}
                      className="flex items-center gap-2"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: concern.color }}
                      />
                      <span className="text-sm text-white/80 flex-1">{concern.concern_name}</span>
                      <span className="text-xs text-white/40">{concern.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Suggestions */}
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wide mb-3">Top Suggestions</p>
                <div className="space-y-2">
                  {summary.suggestions_summary.slice(0, 3).map((suggestion, index) => (
                    <div key={index} className="flex gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-white/70 line-clamp-2">{suggestion.slice(0, 100)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Recommendations */}
          <GlassCard className="p-6 mb-6" delay={0.4}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Policy Recommendations</h3>
              <div className="flex gap-2">
                {summary.recommendations.by_priority.high > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                    {summary.recommendations.by_priority.high} high priority
                  </span>
                )}
                {summary.recommendations.by_priority.medium > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                    {summary.recommendations.by_priority.medium} medium
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-white/60 mb-4">{summary.recommendations.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.recommendations.recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + index * 0.05 }}
                  className={`p-4 rounded-lg border ${priorityColors[rec.priority]}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white">{rec.title}</h4>
                    <span className={`text-xs font-medium uppercase ${priorityTextColors[rec.priority]}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 mb-3">{rec.description}</p>
                  <p className="text-xs text-white/50 mb-3">
                    <strong>Based on:</strong> {rec.justification}
                  </p>
                  <div className="space-y-1">
                    {rec.action_items.slice(0, 2).map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                        <CheckCircle className="w-3 h-3 mt-0.5 text-white/40" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="p-6" delay={0.5}>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/export">
                <Button className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
              </Link>
              <Link href="/compare">
                <Button variant="ghost" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Compare Groups
                </Button>
              </Link>
              <Link href="/insights">
                <Button variant="ghost" className="gap-2">
                  View Full Analysis
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </>
      ) : null}
    </div>
  );
}
