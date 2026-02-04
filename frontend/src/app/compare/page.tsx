"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { compareGroups, getAvailableGroups, ComparisonResponse } from "@/lib/api";

export default function ComparePage() {
  const [groupType, setGroupType] = useState<"course" | "year">("course");
  const [groupA, setGroupA] = useState<string>("");
  const [groupB, setGroupB] = useState<string>("");
  const [shouldCompare, setShouldCompare] = useState(false);

  // Fetch available groups
  const { data: availableGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ["available-groups"],
    queryFn: getAvailableGroups,
  });

  // Set initial selections when groups load
  useEffect(() => {
    if (availableGroups) {
      const options = groupType === "course" ? availableGroups.course : availableGroups.year;
      if (options.length >= 2) {
        setGroupA(options[0]);
        setGroupB(options[1]);
      }
    }
  }, [availableGroups, groupType]);

  // Fetch comparison data
  const {
    data: comparison,
    isLoading: comparisonLoading,
    error: comparisonError,
  } = useQuery({
    queryKey: ["comparison", groupType, groupA, groupB],
    queryFn: () => compareGroups(`${groupType}:${groupA}`, `${groupType}:${groupB}`),
    enabled: shouldCompare && !!groupA && !!groupB && groupA !== groupB,
  });

  const handleCompare = () => {
    if (groupA && groupB && groupA !== groupB) {
      setShouldCompare(true);
    }
  };

  const swapGroups = () => {
    const temp = groupA;
    setGroupA(groupB);
    setGroupB(temp);
  };

  const options = groupType === "course" 
    ? availableGroups?.course || [] 
    : availableGroups?.year || [];

  const getSignificanceColor = (significant: boolean, pValue: number) => {
    if (pValue < 0.01) return "text-emerald-400";
    if (significant) return "text-blue-400";
    return "text-white/40";
  };

  const getSignificanceIcon = (significant: boolean, pValue: number) => {
    if (pValue < 0.01) return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (significant) return <CheckCircle className="w-4 h-4 text-blue-400" />;
    return <Minus className="w-4 h-4 text-white/40" />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Header
        title="Comparison Tool"
        subtitle="Compare survey responses between student groups"
      />

      {/* Group Selection */}
      <GlassCard className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select Groups to Compare</h3>
        
        {/* Group Type Toggle */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              setGroupType("course");
              setShouldCompare(false);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              groupType === "course"
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
            }`}
          >
            By Course
          </button>
          <button
            onClick={() => {
              setGroupType("year");
              setShouldCompare(false);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              groupType === "year"
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
            }`}
          >
            By Year
          </button>
        </div>

        {/* Group Selectors */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm text-white/50 mb-2">Group A</label>
            <select
              value={groupA}
              onChange={(e) => {
                setGroupA(e.target.value);
                setShouldCompare(false);
              }}
              className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-500/50"
            >
              <option value="">Select {groupType}</option>
              {options.map((opt) => (
                <option key={opt} value={opt} disabled={opt === groupB}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={swapGroups}
            className="mt-6 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Swap groups"
          >
            <ArrowLeftRight className="w-5 h-5 text-white/60" />
          </button>

          <div className="flex-1">
            <label className="block text-sm text-white/50 mb-2">Group B</label>
            <select
              value={groupB}
              onChange={(e) => {
                setGroupB(e.target.value);
                setShouldCompare(false);
              }}
              className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-lg text-white focus:outline-none focus:border-sky-500/50"
            >
              <option value="">Select {groupType}</option>
              {options.map((opt) => (
                <option key={opt} value={opt} disabled={opt === groupA}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={handleCompare}
          disabled={!groupA || !groupB || groupA === groupB}
          className="w-full"
        >
          Compare Groups
        </Button>
      </GlassCard>

      {/* Comparison Results */}
      {comparisonLoading ? (
        <div className="text-center py-12 text-white/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          Calculating comparison...
        </div>
      ) : comparisonError ? (
        <EmptyState
          variant="error"
          title="Comparison Failed"
          description="Could not compare these groups. Please try different selections."
        />
      ) : comparison ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Side-by-Side Metrics */}
          <div className="grid grid-cols-2 gap-6">
            {/* Group A */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{comparison.group_a.value}</h4>
                  <p className="text-sm text-white/50">{comparison.group_a.metrics.total} responses</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/[0.03]">
                  <p className="text-sm text-white/50 mb-1">Q1: Parent Notification Support</p>
                  <p className="text-2xl font-bold text-white">
                    {comparison.group_a.metrics.q1_support.percentage}%
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    ±{comparison.group_a.metrics.q1_with_ci.margin_of_error}% (95% CI)
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/[0.03]">
                  <p className="text-sm text-white/50 mb-1">Q2: 24/7 Monitoring Support</p>
                  <p className="text-2xl font-bold text-white">
                    {comparison.group_a.metrics.q2_support.percentage}%
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    ±{comparison.group_a.metrics.q2_with_ci.margin_of_error}% (95% CI)
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Group B */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{comparison.group_b.value}</h4>
                  <p className="text-sm text-white/50">{comparison.group_b.metrics.total} responses</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/[0.03]">
                  <p className="text-sm text-white/50 mb-1">Q1: Parent Notification Support</p>
                  <p className="text-2xl font-bold text-white">
                    {comparison.group_b.metrics.q1_support.percentage}%
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    ±{comparison.group_b.metrics.q1_with_ci.margin_of_error}% (95% CI)
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/[0.03]">
                  <p className="text-sm text-white/50 mb-1">Q2: 24/7 Monitoring Support</p>
                  <p className="text-2xl font-bold text-white">
                    {comparison.group_b.metrics.q2_support.percentage}%
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    ±{comparison.group_b.metrics.q2_with_ci.margin_of_error}% (95% CI)
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Statistical Comparison */}
          <GlassCard className="p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Statistical Analysis</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Q1 Comparison */}
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-white">Q1 Difference</h5>
                  {getSignificanceIcon(
                    comparison.comparison.q1.statistical_test.significant,
                    comparison.comparison.q1.statistical_test.p_value
                  )}
                </div>
                
                <div className="flex items-baseline gap-2 mb-3">
                  <span className={`text-3xl font-bold ${
                    comparison.comparison.q1.difference_pp > 0 ? "text-emerald-400" : 
                    comparison.comparison.q1.difference_pp < 0 ? "text-red-400" : "text-white"
                  }`}>
                    {comparison.comparison.q1.difference_pp > 0 ? "+" : ""}
                    {comparison.comparison.q1.difference_pp}pp
                  </span>
                  <span className="text-sm text-white/50">
                    ({comparison.group_a.value} vs {comparison.group_b.value})
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">p-value</span>
                    <span className={getSignificanceColor(
                      comparison.comparison.q1.statistical_test.significant,
                      comparison.comparison.q1.statistical_test.p_value
                    )}>
                      {comparison.comparison.q1.statistical_test.p_value < 0.001 
                        ? "< 0.001" 
                        : comparison.comparison.q1.statistical_test.p_value.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Effect Size</span>
                    <span className="text-white/80 capitalize">
                      {comparison.comparison.q1.statistical_test.effect_size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Significance</span>
                    <span className={`font-medium ${
                      comparison.comparison.q1.significance_badge.color === "green" ? "text-emerald-400" :
                      comparison.comparison.q1.significance_badge.color === "blue" ? "text-blue-400" :
                      comparison.comparison.q1.significance_badge.color === "yellow" ? "text-amber-400" :
                      "text-white/50"
                    }`}>
                      {comparison.comparison.q1.significance_badge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Q2 Comparison */}
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-white">Q2 Difference</h5>
                  {getSignificanceIcon(
                    comparison.comparison.q2.statistical_test.significant,
                    comparison.comparison.q2.statistical_test.p_value
                  )}
                </div>
                
                <div className="flex items-baseline gap-2 mb-3">
                  <span className={`text-3xl font-bold ${
                    comparison.comparison.q2.difference_pp > 0 ? "text-emerald-400" : 
                    comparison.comparison.q2.difference_pp < 0 ? "text-red-400" : "text-white"
                  }`}>
                    {comparison.comparison.q2.difference_pp > 0 ? "+" : ""}
                    {comparison.comparison.q2.difference_pp}pp
                  </span>
                  <span className="text-sm text-white/50">
                    ({comparison.group_a.value} vs {comparison.group_b.value})
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">p-value</span>
                    <span className={getSignificanceColor(
                      comparison.comparison.q2.statistical_test.significant,
                      comparison.comparison.q2.statistical_test.p_value
                    )}>
                      {comparison.comparison.q2.statistical_test.p_value < 0.001 
                        ? "< 0.001" 
                        : comparison.comparison.q2.statistical_test.p_value.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Effect Size</span>
                    <span className="text-white/80 capitalize">
                      {comparison.comparison.q2.statistical_test.effect_size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Significance</span>
                    <span className={`font-medium ${
                      comparison.comparison.q2.significance_badge.color === "green" ? "text-emerald-400" :
                      comparison.comparison.q2.significance_badge.color === "blue" ? "text-blue-400" :
                      comparison.comparison.q2.significance_badge.color === "yellow" ? "text-amber-400" :
                      "text-white/50"
                    }`}>
                      {comparison.comparison.q2.significance_badge.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Insights */}
          <GlassCard className="p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Key Insights</h4>
            
            <div className="space-y-3">
              {comparison.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-3 p-4 rounded-lg ${
                    insight.type === "warning" 
                      ? "bg-amber-500/10 border border-amber-500/20" 
                      : insight.significant 
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-white/[0.03] border border-white/[0.05]"
                  }`}
                >
                  {insight.type === "warning" ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  ) : insight.significant ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-white/90">{insight.text}</p>
                    {insight.difference && (
                      <p className="text-sm text-white/50 mt-1">
                        Difference: {insight.difference}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      ) : (
        <EmptyState
          variant="no-data"
          title="Select Groups to Compare"
          description="Choose two different groups above and click Compare to see the analysis."
        />
      )}
    </div>
  );
}
