"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, Calendar, TrendingUp, Activity, Sun, Moon } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TimelineChart, HourlyHeatmap } from "@/components/charts/TimelineChart";
import { getTemporal, getSentiment } from "@/lib/api";
import { useState, useMemo } from "react";

export default function TemporalPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: temporal,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["temporal"],
    queryFn: getTemporal,
  });

  const {
    data: sentiment,
  } = useQuery({
    queryKey: ["sentiment"],
    queryFn: getSentiment,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!temporal?.cumulative_data?.length) {
      return {
        totalDays: 0,
        peakDaily: 0,
        avgDaily: 0,
        totalResponses: 0,
      };
    }

    const dailyCounts = temporal.cumulative_data.map(d => d.daily_count);
    const totalDays = temporal.cumulative_data.length;
    const peakDaily = Math.max(...dailyCounts);
    const avgDaily = Math.round(dailyCounts.reduce((a, b) => a + b, 0) / totalDays);
    const totalResponses = temporal.cumulative_data[temporal.cumulative_data.length - 1]?.cumulative_count || 0;

    return { totalDays, peakDaily, avgDaily, totalResponses };
  }, [temporal]);

  // Analyze peak hours
  const peakHoursAnalysis = useMemo(() => {
    if (!temporal?.hourly_distribution) return null;

    const hours = Object.entries(temporal.hourly_distribution)
      .map(([hour, count]) => ({ hour: parseInt(hour), count: count as number }))
      .sort((a, b) => b.count - a.count);

    const peakHours = hours.slice(0, 3);
    const quietHours = hours.filter(h => h.count === 0).length;
    
    // Determine if more active during day or night
    const dayActivity = Object.entries(temporal.hourly_distribution)
      .filter(([hour]) => parseInt(hour) >= 6 && parseInt(hour) < 18)
      .reduce((sum, [, count]) => sum + (count as number), 0);
    
    const nightActivity = Object.entries(temporal.hourly_distribution)
      .filter(([hour]) => parseInt(hour) < 6 || parseInt(hour) >= 18)
      .reduce((sum, [, count]) => sum + (count as number), 0);

    return {
      peakHours,
      quietHours,
      isDayPerson: dayActivity > nightActivity,
      dayActivity,
      nightActivity,
    };
  }, [temporal]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <Header title="Temporal Analysis" subtitle="Response timing patterns" />
        <EmptyState
          variant="error"
          title="Failed to Load Data"
          description="Could not load temporal analysis data."
          action={{ label: "Try Again", onClick: handleRefresh }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Header
        title="Temporal Analysis"
        subtitle="Understanding when students submitted their responses"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              value={metrics.totalDays}
              label="Survey Duration"
              suffix=" days"
              icon={Calendar}
              delay={0}
            />
            <MetricCard
              value={metrics.peakDaily}
              label="Peak Daily Responses"
              icon={TrendingUp}
              color="success"
              delay={0.05}
            />
            <MetricCard
              value={metrics.avgDaily}
              label="Average Per Day"
              icon={Activity}
              delay={0.1}
            />
            <MetricCard
              value={temporal?.peak_hour?.hour ?? 0}
              suffix=":00"
              label="Peak Hour"
              icon={Clock}
              color="default"
              delay={0.15}
            />
          </>
        )}
      </div>

      {/* Response Timeline */}
      <GlassCard className="p-6 mb-6" delay={0.2}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Response Timeline</h3>
          {temporal?.peak_day && (
            <span className="text-sm text-white/50">
              Peak: {new Date(temporal.peak_day.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
        
        {isLoading ? (
          <div className="h-[300px] skeleton rounded-lg" />
        ) : temporal?.cumulative_data && temporal.cumulative_data.length > 0 ? (
          <TimelineChart
            data={temporal.cumulative_data}
            height={300}
            showDaily={true}
            showCumulative={true}
          />
        ) : (
          <EmptyState
            variant="no-data"
            title="No Timeline Data"
            description="Timestamp information is not available for these responses."
          />
        )}
      </GlassCard>

      {/* Hourly Distribution & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <GlassCard className="p-6" delay={0.25}>
          <h3 className="text-lg font-semibold text-white mb-4">Hourly Activity</h3>
          
          {isLoading ? (
            <div className="h-[200px] skeleton rounded-lg" />
          ) : temporal?.hourly_distribution ? (
            <HourlyHeatmap distribution={temporal.hourly_distribution} />
          ) : (
            <EmptyState variant="no-data" title="No hourly data available" />
          )}
        </GlassCard>

        <GlassCard className="p-6" delay={0.3}>
          <h3 className="text-lg font-semibold text-white mb-4">Time Patterns</h3>
          
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-12 skeleton rounded-lg" />
              <div className="h-12 skeleton rounded-lg" />
              <div className="h-12 skeleton rounded-lg" />
            </div>
          ) : peakHoursAnalysis ? (
            <div className="space-y-4">
              {/* Peak Hours */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Peak Response Hours</span>
                </div>
                <div className="flex gap-2">
                  {peakHoursAnalysis.peakHours.map((h, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm"
                    >
                      {h.hour}:00 ({h.count})
                    </span>
                  ))}
                </div>
              </div>

              {/* Day vs Night */}
              <div className={`p-4 rounded-lg ${peakHoursAnalysis.isDayPerson ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-indigo-500/10 border border-indigo-500/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {peakHoursAnalysis.isDayPerson ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  )}
                  <span className="text-sm font-medium text-white">
                    {peakHoursAnalysis.isDayPerson ? 'Daytime Dominant' : 'Nighttime Dominant'}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-white/60">
                  <span>Day (6am-6pm): {peakHoursAnalysis.dayActivity} responses</span>
                  <span>Night: {peakHoursAnalysis.nightActivity} responses</span>
                </div>
              </div>

              {/* Quiet Hours */}
              {peakHoursAnalysis.quietHours > 0 && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-white/60">
                    <span className="text-white font-medium">{peakHoursAnalysis.quietHours} hours</span> had zero responses
                  </p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState variant="no-data" title="No pattern data available" />
          )}
        </GlassCard>
      </div>

      {/* Additional Insights */}
      <GlassCard className="p-6" delay={0.35}>
        <h3 className="text-lg font-semibold text-white mb-4">Key Observations</h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 skeleton rounded-lg" />
            ))}
          </div>
        ) : temporal?.cumulative_data && temporal.cumulative_data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
            >
              <p className="text-2xl font-bold text-emerald-400">{metrics.totalResponses.toLocaleString()}</p>
              <p className="text-sm text-white/60">Total responses collected</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20"
            >
              <p className="text-2xl font-bold text-blue-400">
                {temporal.peak_hour ? `${temporal.peak_hour.hour}:00 - ${temporal.peak_hour.hour + 1}:00` : 'N/A'}
              </p>
              <p className="text-sm text-white/60">Most active hour ({temporal.peak_hour?.count || 0} responses)</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20"
            >
              <p className="text-2xl font-bold text-purple-400">
                {temporal.peak_day ? new Date(temporal.peak_day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : 'N/A'}
              </p>
              <p className="text-sm text-white/60">Busiest day ({temporal.peak_day?.count || 0} responses)</p>
            </motion.div>
          </div>
        ) : (
          <EmptyState
            variant="no-data"
            title="No observations available"
            description="Temporal data is required to generate observations."
          />
        )}
      </GlassCard>
    </div>
  );
}
