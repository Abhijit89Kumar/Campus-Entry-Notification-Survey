"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  FileCheck,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  TrendingDown,
  Shield,
  Eye,
  Clock,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MetricCard } from "@/components/ui/MetricCard";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChartComponent } from "@/components/charts/BarChart";
import { ConcernBar } from "@/components/charts/ConcernBar";
import { TimelineChart } from "@/components/charts/TimelineChart";
import { WordCloudCompact } from "@/components/charts/WordCloud";
import {
  getOverview,
  getDemographics,
  getConcerns,
  getTemporal,
  getWordCloud,
  getSentiment,
  getSuggestions,
  refreshAnalytics,
} from "@/lib/api";
import { useState } from "react";

export default function HomePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["overview"],
    queryFn: getOverview,
    retry: 1,
  });

  const {
    data: demographics,
    isLoading: demographicsLoading,
    refetch: refetchDemographics,
  } = useQuery({
    queryKey: ["demographics", "course"],
    queryFn: () => getDemographics("course"),
    retry: 1,
  });

  const {
    data: concerns,
    isLoading: concernsLoading,
    refetch: refetchConcerns,
  } = useQuery({
    queryKey: ["concerns"],
    queryFn: () => getConcerns(40),
    retry: 1,
  });

  const {
    data: temporal,
    isLoading: temporalLoading,
    refetch: refetchTemporal,
  } = useQuery({
    queryKey: ["temporal"],
    queryFn: getTemporal,
    retry: 1,
  });

  const {
    data: wordCloud,
    isLoading: wordCloudLoading,
  } = useQuery({
    queryKey: ["wordCloud", "all"],
    queryFn: () => getWordCloud("all"),
    retry: 1,
  });

  const {
    data: sentiment,
  } = useQuery({
    queryKey: ["sentiment"],
    queryFn: getSentiment,
    retry: 1,
  });

  const {
    data: suggestions,
  } = useQuery({
    queryKey: ["suggestions"],
    queryFn: getSuggestions,
    retry: 1,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // First refresh the backend cache
      const result = await refreshAnalytics();
      
      if (result.success) {
        // Then refetch all data
        await Promise.all([
          refetchOverview(),
          refetchDemographics(),
          refetchConcerns(),
          refetchTemporal(),
        ]);
        toast.success("Data refreshed successfully", `Processed ${result.total_responses} responses`);
      } else {
        toast.error("Failed to refresh", result.message || "Please try again");
      }
    } catch (error) {
      toast.error("Refresh failed", "Could not connect to the server");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Safe access to values with defaults
  const totalResponses = overview?.total_responses ?? 0;
  const validResponses = overview?.valid_responses ?? 0;
  const flaggedResponses = overview?.flagged_responses ?? 0;
  const q1SupportPercent = overview?.q1_support_percent ?? 0;
  const q2SupportPercent = overview?.q2_support_percent ?? 0;
  const q1SupportCount = overview?.q1_support_count ?? 0;
  const q1OpposeCount = overview?.q1_oppose_count ?? 0;
  const q2SupportCount = overview?.q2_support_count ?? 0;
  const q2OpposeCount = overview?.q2_oppose_count ?? 0;

  // Prepare chart data
  const q1ChartData = [
    { name: "Support", value: q1SupportCount, color: "#4ade80" },
    { name: "Oppose", value: q1OpposeCount, color: "#f87171" },
  ];

  const q2ChartData = [
    { name: "Support", value: q2SupportCount, color: "#4ade80" },
    { name: "Oppose", value: q2OpposeCount, color: "#f87171" },
  ];

  const demographicsChartData = demographics
    ? demographics.map((d) => ({
        name: d.category.replace("Undergraduate ", "").replace("Postgraduate ", "").replace("Research Scholar ", "RS"),
        q1_support: d.q1_yes_percent,
        q2_support: d.q2_yes_percent,
      }))
    : [];

  // Generate insights
  const insights = [];
  
  if (overview) {
    const q1OpposePercent = 100 - q1SupportPercent;
    const q2OpposePercent = 100 - q2SupportPercent;
    
    // Main opposition insight
    insights.push({
      type: "danger",
      icon: TrendingDown,
      text: `${q1OpposePercent.toFixed(1)}% of students oppose the parent notification system`,
      detail: `Out of ${totalResponses} responses, ${q1OpposeCount} students voted against Q1.`
    });
    
    insights.push({
      type: "danger", 
      icon: Eye,
      text: `${q2OpposePercent.toFixed(1)}% of students oppose 24/7 monitoring`,
      detail: `Only ${q2SupportCount} students support the monitoring policy.`
    });
    
    // Sentiment insight
    if (sentiment?.overall) {
      const avgPolarity = sentiment.overall.average_polarity;
      const sentimentLabel = avgPolarity > 0.1 ? "positive" : avgPolarity < -0.1 ? "negative" : "neutral";
      insights.push({
        type: sentimentLabel === "negative" ? "warning" : "primary",
        icon: MessageSquare,
        text: `Overall sentiment is ${sentimentLabel} (${(avgPolarity * 100).toFixed(0)}% polarity)`,
        detail: `${sentiment.overall.negative_count} negative, ${sentiment.overall.positive_count} positive, ${sentiment.overall.neutral_count} neutral comments.`
      });
    }
    
    // Quality insight
    if (flaggedResponses > 0) {
      const flaggedPercent = ((flaggedResponses / totalResponses) * 100).toFixed(1);
      insights.push({
        type: "warning",
        icon: AlertTriangle,
        text: `${flaggedResponses} responses (${flaggedPercent}%) flagged for quality issues`,
        detail: "These include very short responses, spam, or potentially invalid entries."
      });
    }
    
    // Suggestions insight
    if (suggestions?.total_with_suggestions) {
      insights.push({
        type: "primary",
        icon: Lightbulb,
        text: `${suggestions.total_with_suggestions} responses contain actionable suggestions`,
        detail: `${suggestions.suggestion_rate.toFixed(1)}% of responses include constructive feedback.`
      });
    }
    
    // Valid responses
    insights.push({
      type: "success",
      icon: Shield,
      text: `${validResponses} responses (${((validResponses/totalResponses)*100).toFixed(1)}%) are high quality`,
      detail: "These responses passed quality checks and are included in the analysis."
    });
  }
  
  // Top concern insight
  if (concerns && concerns.length > 0 && concerns[0].count > 0) {
    insights.push({
      type: "primary",
      icon: concerns[0].concern_id === "privacy" ? Eye : Shield,
      text: `Top concern: ${concerns[0].concern_name} (${concerns[0].count} mentions)`,
      detail: `${concerns[0].percentage}% of analyzed comments mention this concern.`
    });
  }

  const insightColors = {
    danger: "border-red-400/20 bg-red-400/5",
    warning: "border-amber-400/20 bg-amber-400/5",
    success: "border-emerald-400/20 bg-emerald-400/5",
    primary: "border-blue-400/20 bg-blue-400/5",
  };
  
  const insightTextColors = {
    danger: "text-red-400",
    warning: "text-amber-400",
    success: "text-emerald-400",
    primary: "text-blue-400",
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Header
        title="Executive Summary"
        subtitle={`Analysis of ${totalResponses.toLocaleString()} student survey responses`}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {overviewError && (
        <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-lg">
          <p className="text-red-400 text-sm">
            Failed to load analytics. Please ensure the backend is running and try refreshing.
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {overviewLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              value={totalResponses}
              label="Total Responses"
              icon={Users}
              delay={0}
            />
            <MetricCard
              value={validResponses}
              label="Valid Responses"
              icon={FileCheck}
              color="success"
              delay={0.05}
            />
            <MetricCard
              value={q1SupportPercent}
              suffix="%"
              label="Q1 Support Rate"
              icon={ThumbsUp}
              color={q1SupportPercent > 50 ? "success" : "danger"}
              delay={0.1}
              decimals={1}
            />
            <MetricCard
              value={q2SupportPercent}
              suffix="%"
              label="Q2 Support Rate"
              icon={ThumbsDown}
              color={q2SupportPercent > 50 ? "success" : "danger"}
              delay={0.15}
              decimals={1}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {overviewLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <DonutChart
              title="Q1: Parent Notification System"
              data={q1ChartData}
              centerValue={`${q1SupportPercent.toFixed(1)}%`}
              centerLabel="Support"
              delay={0.1}
            />
            <DonutChart
              title="Q2: 24/7 Entry/Exit Monitoring"
              data={q2ChartData}
              centerValue={`${q2SupportPercent.toFixed(1)}%`}
              centerLabel="Support"
              delay={0.15}
            />
          </>
        )}
      </div>

      {/* Timeline & Hot Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-6 lg:col-span-2" delay={0.2}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Response Timeline</h3>
            {temporal?.peak_day && (
              <span className="text-xs text-white/50">
                Peak: {temporal.peak_day.count} responses on {new Date(temporal.peak_day.date).toLocaleDateString()}
              </span>
            )}
          </div>
          {temporalLoading ? (
            <div className="h-[200px] skeleton rounded-lg" />
          ) : temporal?.cumulative_data && temporal.cumulative_data.length > 0 ? (
            <TimelineChart
              data={temporal.cumulative_data}
              height={200}
              showDaily={true}
              showCumulative={false}
            />
          ) : (
            <EmptyState
              variant="no-data"
              title="No Timeline Data"
              description="Timestamp data is not available for these responses."
            />
          )}
        </GlassCard>

        <GlassCard className="p-6" delay={0.25}>
          <h3 className="text-lg font-semibold text-white mb-4">Hot Topics</h3>
          {wordCloudLoading ? (
            <div className="h-[180px] skeleton rounded-lg" />
          ) : wordCloud?.words && wordCloud.words.length > 0 ? (
            <div>
              <WordCloudCompact words={wordCloud.words} maxWords={20} />
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-white/40">
                <span>{wordCloud.unique_words?.toLocaleString()} unique words</span>
                <span>{wordCloud.total_words?.toLocaleString()} total</span>
              </div>
            </div>
          ) : (
            <EmptyState
              variant="no-data"
              title="No Word Data"
              description="Not enough comments to analyze."
            />
          )}
        </GlassCard>
      </div>

      {/* Demographics & Concerns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {demographicsLoading ? (
          <ChartSkeleton />
        ) : demographicsChartData.length > 0 ? (
          <BarChartComponent
            title="Support by Course Type"
            data={demographicsChartData}
            xAxisKey="name"
            dataKeys={[
              { key: "q1_support", name: "Q1 Support %", color: "#4ade80" },
              { key: "q2_support", name: "Q2 Support %", color: "#5c9eff" },
            ]}
            delay={0.2}
          />
        ) : (
          <GlassCard className="p-6">
            <EmptyState variant="no-data" title="No demographic data available" />
          </GlassCard>
        )}

        {concernsLoading ? (
          <ChartSkeleton />
        ) : concerns && concerns.length > 0 ? (
          <ConcernBar
            title="Top Concerns Mentioned"
            data={concerns}
            delay={0.25}
          />
        ) : (
          <GlassCard className="p-6">
            <EmptyState variant="no-data" title="No concern data available" />
          </GlassCard>
        )}
      </div>

      {/* Key Insights */}
      <GlassCard className="p-6" delay={0.3}>
        <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
        
        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className={`p-4 rounded-lg border ${insightColors[insight.type as keyof typeof insightColors]}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${insightTextColors[insight.type as keyof typeof insightTextColors]}`} />
                    <div>
                      <p className="text-white/90 font-medium text-sm">{insight.text}</p>
                      <p className="text-white/50 text-xs mt-1">{insight.detail}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : overviewLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 skeleton rounded-lg" />
            ))}
          </div>
        ) : (
          <EmptyState
            variant="no-data"
            title="No Insights Available"
            description="Please refresh the data to generate insights."
            action={{ label: "Refresh Data", onClick: handleRefresh }}
          />
        )}
      </GlassCard>
    </div>
  );
}
