"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { FilterChip } from "@/components/ui/FilterChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConcernBar } from "@/components/charts/ConcernBar";
import { WordCloud } from "@/components/charts/WordCloud";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { getConcerns, getArguments, getSuggestions, getWordCloud, getSentiment } from "@/lib/api";
import { ChevronDown, ChevronUp, Quote, Lightbulb, TrendingUp, TrendingDown, Minus } from "lucide-react";

type ViewMode = "arguments" | "concerns" | "suggestions" | "wordcloud";

export default function InsightsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("arguments");
  const [question, setQuestion] = useState<"q1" | "q2">("q1");
  const [expandedArgument, setExpandedArgument] = useState<string | null>(null);
  const [wordCloudCategory, setWordCloudCategory] = useState<"all" | "support" | "oppose">("all");

  const { data: concerns, isLoading: concernsLoading } = useQuery({
    queryKey: ["concerns"],
    queryFn: () => getConcerns(40),
  });

  const { data: arguments_, isLoading: argumentsLoading } = useQuery({
    queryKey: ["arguments", question],
    queryFn: () => getArguments(question, 40),
  });

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["suggestions"],
    queryFn: getSuggestions,
  });

  const { data: wordCloud, isLoading: wordCloudLoading } = useQuery({
    queryKey: ["wordCloud", wordCloudCategory],
    queryFn: () => getWordCloud(wordCloudCategory),
  });

  const { data: sentiment, isLoading: sentimentLoading } = useQuery({
    queryKey: ["sentiment"],
    queryFn: getSentiment,
  });

  const toggleArgument = (id: string) => {
    setExpandedArgument(expandedArgument === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Header
        title="Comment Insights"
        subtitle="NLP-powered analysis of student comments and concerns"
      />

      {/* View Mode Toggle */}
      <div className="flex flex-wrap gap-3 mb-8">
        <FilterChip
          label="Arguments"
          active={viewMode === "arguments"}
          onClick={() => setViewMode("arguments")}
        />
        <FilterChip
          label="Concerns"
          active={viewMode === "concerns"}
          onClick={() => setViewMode("concerns")}
        />
        <FilterChip
          label="Suggestions"
          active={viewMode === "suggestions"}
          onClick={() => setViewMode("suggestions")}
        />
        <FilterChip
          label="Word Cloud"
          active={viewMode === "wordcloud"}
          onClick={() => setViewMode("wordcloud")}
        />
      </div>

      {/* Arguments View */}
      {viewMode === "arguments" && (
        <>
          {/* Question Toggle */}
          <div className="flex gap-3 mb-6">
            <FilterChip
              label="Q1: Parent Notification"
              active={question === "q1"}
              onClick={() => setQuestion("q1")}
            />
            <FilterChip
              label="Q2: 24/7 Monitoring"
              active={question === "q2"}
              onClick={() => setQuestion("q2")}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Arguments Against */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-6 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                Arguments Against ({arguments_?.against?.length || 0})
              </h3>
              
              {argumentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 skeleton rounded-xl" />
                  ))}
                </div>
              ) : arguments_?.against?.length ? (
                <div className="space-y-3">
                  {arguments_.against.map((arg, index) => (
                    <motion.div
                      key={`against-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/[0.04] rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleArgument(`against-${index}`)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="text-left">
                          <p className="font-medium text-white">{arg.claim}</p>
                          <p className="text-sm text-white/50 mt-1">
                            {arg.frequency} mentions
                          </p>
                        </div>
                        {expandedArgument === `against-${index}` ? (
                          <ChevronUp className="w-5 h-5 text-white/40" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white/40" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedArgument === `against-${index}` && arg.representative_quotes?.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/10"
                          >
                            <div className="p-4 space-y-3">
                              <p className="text-xs text-white/40 uppercase tracking-wide">
                                Sample Quotes
                              </p>
                              {arg.representative_quotes.map((quote, qi) => (
                                <div
                                  key={qi}
                                  className="flex gap-3 text-sm text-white/70"
                                >
                                  <Quote className="w-4 h-4 text-red-400/50 flex-shrink-0 mt-0.5" />
                                  <p className="italic">&quot;{quote}&quot;</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState variant="no-data" title="No arguments against found" />
              )}
            </GlassCard>

            {/* Arguments For */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-6 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                Arguments For ({arguments_?.for?.length || 0})
              </h3>
              
              {argumentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 skeleton rounded-xl" />
                  ))}
                </div>
              ) : arguments_?.for?.length ? (
                <div className="space-y-3">
                  {arguments_.for.map((arg, index) => (
                    <motion.div
                      key={`for-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/[0.04] rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleArgument(`for-${index}`)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="text-left">
                          <p className="font-medium text-white">{arg.claim}</p>
                          <p className="text-sm text-white/50 mt-1">
                            {arg.frequency} mentions
                          </p>
                        </div>
                        {expandedArgument === `for-${index}` ? (
                          <ChevronUp className="w-5 h-5 text-white/40" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white/40" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedArgument === `for-${index}` && arg.representative_quotes?.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/10"
                          >
                            <div className="p-4 space-y-3">
                              <p className="text-xs text-white/40 uppercase tracking-wide">
                                Sample Quotes
                              </p>
                              {arg.representative_quotes.map((quote, qi) => (
                                <div
                                  key={qi}
                                  className="flex gap-3 text-sm text-white/70"
                                >
                                  <Quote className="w-4 h-4 text-emerald-400/50 flex-shrink-0 mt-0.5" />
                                  <p className="italic">&quot;{quote}&quot;</p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState variant="no-data" title="No arguments for found" />
              )}
            </GlassCard>
          </div>
        </>
      )}

      {/* Concerns View */}
      {viewMode === "concerns" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {concernsLoading ? (
            <ChartSkeleton />
          ) : concerns && concerns.length > 0 ? (
            <ConcernBar
              title="Concern Distribution"
              data={concerns}
            />
          ) : (
            <GlassCard className="p-6">
              <EmptyState variant="no-data" title="No concern data available" />
            </GlassCard>
          )}

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Sample Quotes by Concern
            </h3>
            
            {concernsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 skeleton rounded-xl" />
                ))}
              </div>
            ) : concerns && concerns.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {concerns.map((concern, index) => (
                  <motion.div
                    key={concern.concern_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-white/[0.04] rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: concern.color }}
                      />
                      <span className="font-medium text-white">
                        {concern.concern_name}
                      </span>
                      <span className="text-sm text-white/40">
                        ({concern.count})
                      </span>
                    </div>
                    
                    {concern.sample_quotes && concern.sample_quotes.length > 0 ? (
                      <div className="space-y-2">
                        {concern.sample_quotes.slice(0, 2).map((quote, qi) => (
                          <p
                            key={qi}
                            className="text-sm text-white/60 italic pl-5 border-l-2"
                            style={{ borderColor: concern.color }}
                          >
                            &quot;{quote.length > 150 ? quote.slice(0, 150) + '...' : quote}&quot;
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/40 italic">
                        No sample quotes available
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState variant="no-data" title="No concern quotes available" />
            )}
          </GlassCard>
        </div>
      )}

      {/* Suggestions View */}
      {viewMode === "suggestions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Stats */}
          <GlassCard className="p-6 lg:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {suggestionsLoading ? (
                <>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 skeleton rounded-lg" />
                  ))}
                </>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-2xl font-bold text-blue-400">
                      {suggestions?.total_with_suggestions || 0}
                    </p>
                    <p className="text-sm text-white/60">Responses with Suggestions</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-2xl font-bold text-purple-400">
                      {suggestions?.suggestion_rate?.toFixed(1) || 0}%
                    </p>
                    <p className="text-sm text-white/60">Suggestion Rate</p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-2xl font-bold text-emerald-400">
                      {suggestions?.top_suggestions?.length || 0}
                    </p>
                    <p className="text-sm text-white/60">Unique Suggestions</p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-2xl font-bold text-amber-400">
                      {suggestions?.top_categories?.length || 0}
                    </p>
                    <p className="text-sm text-white/60">Categories</p>
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          {/* Category Breakdown */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Suggestion Categories</h3>
            {suggestionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 skeleton rounded-lg" />
                ))}
              </div>
            ) : suggestions?.category_breakdown && Object.keys(suggestions.category_breakdown).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(suggestions.category_breakdown)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .map(([category, count], index) => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.04]"
                    >
                      <span className="text-white/80 capitalize">{category}</span>
                      <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm">
                        {count as number}
                      </span>
                    </motion.div>
                  ))}
              </div>
            ) : (
              <EmptyState variant="no-data" title="No category data" />
            )}
          </GlassCard>

          {/* Top Suggestions */}
          <GlassCard className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Top Suggestions</h3>
            {suggestionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 skeleton rounded-lg" />
                ))}
              </div>
            ) : suggestions?.top_suggestions && suggestions.top_suggestions.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {suggestions.top_suggestions.slice(0, 15).map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex gap-3 p-4 rounded-lg bg-white/[0.04] border border-white/[0.05]"
                  >
                    <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80">&quot;{suggestion}&quot;</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState variant="no-data" title="No suggestions found" description="Students haven't provided specific suggestions." />
            )}
          </GlassCard>
        </div>
      )}

      {/* Word Cloud View */}
      {viewMode === "wordcloud" && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex gap-3">
            <FilterChip
              label="All Comments"
              active={wordCloudCategory === "all"}
              onClick={() => setWordCloudCategory("all")}
            />
            <FilterChip
              label="Supporters"
              active={wordCloudCategory === "support"}
              onClick={() => setWordCloudCategory("support")}
            />
            <FilterChip
              label="Opposers"
              active={wordCloudCategory === "oppose"}
              onClick={() => setWordCloudCategory("oppose")}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Word Cloud */}
            <GlassCard className="p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">
                Word Frequency - {wordCloudCategory === "all" ? "All Comments" : wordCloudCategory === "support" ? "Supporters" : "Opposers"}
              </h3>
              {wordCloudLoading ? (
                <div className="h-[300px] skeleton rounded-lg" />
              ) : wordCloud?.words && wordCloud.words.length > 0 ? (
                <WordCloud words={wordCloud.words} maxWords={80} className="min-h-[300px]" />
              ) : (
                <EmptyState variant="no-data" title="No word data available" />
              )}
            </GlassCard>

            {/* Sentiment Summary */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Sentiment Analysis</h3>
              {sentimentLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 skeleton rounded-lg" />
                  ))}
                </div>
              ) : sentiment?.overall ? (
                <div className="space-y-4">
                  {/* Overall Polarity */}
                  <div className="p-4 rounded-lg bg-white/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-sm">Overall Polarity</span>
                      {sentiment.overall.average_polarity > 0.1 ? (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      ) : sentiment.overall.average_polarity < -0.1 ? (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      ) : (
                        <Minus className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {(sentiment.overall.average_polarity * 100).toFixed(0)}%
                    </p>
                  </div>

                  {/* Sentiment Distribution */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-emerald-400">Positive</span>
                      <span className="text-sm text-white/60">{sentiment.overall.positive_count}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${sentiment.overall.positive_percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Neutral</span>
                      <span className="text-sm text-white/60">{sentiment.overall.neutral_count}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/40 rounded-full"
                        style={{ width: `${100 - sentiment.overall.positive_percent - sentiment.overall.negative_percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-400">Negative</span>
                      <span className="text-sm text-white/60">{sentiment.overall.negative_count}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${sentiment.overall.negative_percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Word Stats */}
                  {wordCloud && (
                    <div className="pt-4 mt-4 border-t border-white/10">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Total words</span>
                        <span className="text-white/60">{wordCloud.total_words?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-white/40">Unique words</span>
                        <span className="text-white/60">{wordCloud.unique_words?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState variant="no-data" title="No sentiment data" />
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
