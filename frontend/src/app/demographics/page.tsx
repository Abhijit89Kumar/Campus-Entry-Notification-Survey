"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { FilterChip } from "@/components/ui/FilterChip";
import { BarChartComponent } from "@/components/charts/BarChart";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { getDemographics, getCrossTabulation } from "@/lib/api";
import { motion } from "framer-motion";
import { Info, CheckCircle, AlertCircle } from "lucide-react";

export default function DemographicsPage() {
  const [groupBy, setGroupBy] = useState<"course" | "year">("course");

  const { data: demographics, isLoading: demographicsLoading } = useQuery({
    queryKey: ["demographics", groupBy],
    queryFn: () => getDemographics(groupBy),
  });

  const { data: crossTab, isLoading: crossTabLoading } = useQuery({
    queryKey: ["crossTabulation"],
    queryFn: getCrossTabulation,
  });

  const chartData = demographics
    ? demographics.map((d) => ({
        name: d.category.replace("Undergraduate ", "").replace("Postgraduate ", "").replace("Research Scholar ", "RS"),
        q1_support: d.q1_yes_percent,
        q2_support: d.q2_yes_percent,
        total: d.total,
      }))
    : [];

  // Generate plain English conclusions
  const getStatConclusion = () => {
    if (!crossTab) return null;
    
    const { correlation_coefficient, chi_square, p_value, no_no, yes_yes, total_valid } = crossTab;
    
    const conclusions = [];
    
    // Correlation interpretation
    if (correlation_coefficient > 0.7) {
      conclusions.push({
        type: "strong",
        text: "There is a STRONG positive correlation between Q1 and Q2 responses.",
        detail: "Students who oppose one policy very likely oppose the other as well."
      });
    } else if (correlation_coefficient > 0.4) {
      conclusions.push({
        type: "moderate",
        text: "There is a MODERATE positive correlation between Q1 and Q2 responses.",
        detail: "Students tend to have similar opinions on both policies."
      });
    } else if (correlation_coefficient > 0.2) {
      conclusions.push({
        type: "weak",
        text: "There is a WEAK positive correlation between Q1 and Q2 responses.",
        detail: "There is some relationship, but opinions on the two questions vary."
      });
    } else {
      conclusions.push({
        type: "none",
        text: "There is NO significant correlation between Q1 and Q2 responses.",
        detail: "Students' opinions on the two policies are largely independent."
      });
    }
    
    // Statistical significance
    if (p_value < 0.001) {
      conclusions.push({
        type: "significant",
        text: "This relationship is HIGHLY statistically significant (p < 0.001).",
        detail: "We can be very confident this pattern is real and not due to chance."
      });
    } else if (p_value < 0.05) {
      conclusions.push({
        type: "significant",
        text: "This relationship is statistically significant (p < 0.05).",
        detail: "The observed pattern is unlikely to be due to random chance."
      });
    } else {
      conclusions.push({
        type: "not_significant",
        text: "This relationship is NOT statistically significant.",
        detail: "The observed pattern could be due to random chance."
      });
    }
    
    // Practical insight
    const noNoPercent = crossTab.no_no_percent || 0;
    const yesYesPercent = crossTab.yes_yes_percent || 0;
    
    if (noNoPercent > 50) {
      conclusions.push({
        type: "insight",
        text: `${noNoPercent}% of students oppose BOTH policies.`,
        detail: "The majority of respondents are against both the parent notification and monitoring systems."
      });
    }
    
    return conclusions;
  };

  const conclusions = getStatConclusion();

  return (
    <div className="max-w-7xl mx-auto">
      <Header
        title="Demographic Analysis"
        subtitle="Breakdown of responses by student demographics"
      />

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <FilterChip
          label="By Course"
          active={groupBy === "course"}
          onClick={() => setGroupBy("course")}
        />
        <FilterChip
          label="By Year"
          active={groupBy === "year"}
          onClick={() => setGroupBy("year")}
        />
      </div>

      {/* Main Chart */}
      <div className="mb-6">
        {demographicsLoading ? (
          <ChartSkeleton />
        ) : (
          <BarChartComponent
            title={`Support by ${groupBy === "course" ? "Course Type" : "Year of Study"}`}
            data={chartData}
            xAxisKey="name"
            dataKeys={[
              { key: "q1_support", name: "Q1: Parent Notification", color: "#4ade80" },
              { key: "q2_support", name: "Q2: 24/7 Monitoring", color: "#5c9eff" },
            ]}
          />
        )}
      </div>

      {/* Cross Tabulation & Conclusions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* 2x2 Matrix */}
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-white mb-4">
            Q1 vs Q2 Response Matrix
          </h3>
          
          {crossTabLoading ? (
            <div className="h-48 skeleton rounded-lg" />
          ) : crossTab ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div />
                <div className="text-white/50 font-medium py-2 text-xs">Q2: Yes</div>
                <div className="text-white/50 font-medium py-2 text-xs">Q2: No</div>
                
                <div className="text-white/50 font-medium py-3 text-xs">Q1: Yes</div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3"
                >
                  <div className="text-xl font-semibold text-emerald-400">
                    {crossTab.yes_yes}
                  </div>
                  <div className="text-xs text-emerald-400/60">
                    {crossTab.yes_yes_percent}%
                  </div>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3"
                >
                  <div className="text-xl font-semibold text-amber-400">
                    {crossTab.yes_no}
                  </div>
                  <div className="text-xs text-amber-400/60">
                    {crossTab.yes_no_percent}%
                  </div>
                </motion.div>
                
                <div className="text-white/50 font-medium py-3 text-xs">Q1: No</div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3"
                >
                  <div className="text-xl font-semibold text-amber-400">
                    {crossTab.no_yes}
                  </div>
                  <div className="text-xs text-amber-400/60">
                    {crossTab.no_yes_percent}%
                  </div>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                >
                  <div className="text-xl font-semibold text-red-400">
                    {crossTab.no_no}
                  </div>
                  <div className="text-xs text-red-400/60">
                    {crossTab.no_no_percent}%
                  </div>
                </motion.div>
              </div>
              
              {/* Stats - Compact */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">
                    {crossTab.correlation_coefficient}
                  </div>
                  <div className="text-xs text-white/40">Correlation (φ)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">
                    {crossTab.chi_square}
                  </div>
                  <div className="text-xs text-white/40">Chi-Square</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${crossTab.p_value < 0.05 ? 'text-emerald-400' : 'text-white'}`}>
                    {crossTab.p_value < 0.001 ? '<0.001' : crossTab.p_value}
                  </div>
                  <div className="text-xs text-white/40">P-Value</div>
                </div>
              </div>
            </div>
          ) : null}
        </GlassCard>

        {/* Plain English Conclusions */}
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            What This Means
          </h3>
          
          {crossTabLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 skeleton rounded-lg" />
              ))}
            </div>
          ) : conclusions ? (
            <div className="space-y-3">
              {conclusions.map((conclusion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg border ${
                    conclusion.type === 'significant' || conclusion.type === 'strong'
                      ? 'bg-emerald-400/5 border-emerald-400/20'
                      : conclusion.type === 'not_significant' || conclusion.type === 'weak' || conclusion.type === 'none'
                      ? 'bg-amber-400/5 border-amber-400/20'
                      : 'bg-blue-400/5 border-blue-400/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {conclusion.type === 'significant' || conclusion.type === 'strong' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    ) : conclusion.type === 'not_significant' ? (
                      <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-white/90 text-sm font-medium">{conclusion.text}</p>
                      <p className="text-white/50 text-xs mt-1">{conclusion.detail}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-white/50 text-sm">No data available for analysis.</p>
          )}
        </GlassCard>
      </div>

      {/* Detailed Table */}
      <GlassCard className="p-6">
        <h3 className="text-base font-semibold text-white mb-4">
          Detailed Breakdown
        </h3>
        
        {demographicsLoading ? (
          <div className="h-48 skeleton rounded-lg" />
        ) : demographics ? (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>{groupBy === "course" ? "Course" : "Year"}</th>
                  <th>Total</th>
                  <th>Q1 Yes</th>
                  <th>Q1 No</th>
                  <th>Q1 Support %</th>
                  <th>Q2 Yes</th>
                  <th>Q2 No</th>
                  <th>Q2 Support %</th>
                </tr>
              </thead>
              <tbody>
                {demographics.map((row, i) => (
                  <motion.tr
                    key={row.category}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="font-medium text-white">{row.category}</td>
                    <td>{row.total}</td>
                    <td className="text-emerald-400">{row.q1_yes}</td>
                    <td className="text-red-400">{row.q1_no}</td>
                    <td>
                      <span className={row.q1_yes_percent > 50 ? 'text-emerald-400' : 'text-red-400'}>
                        {row.q1_yes_percent}%
                      </span>
                    </td>
                    <td className="text-emerald-400">{row.q2_yes}</td>
                    <td className="text-red-400">{row.q2_no}</td>
                    <td>
                      <span className={row.q2_yes_percent > 50 ? 'text-emerald-400' : 'text-red-400'}>
                        {row.q2_yes_percent}%
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
