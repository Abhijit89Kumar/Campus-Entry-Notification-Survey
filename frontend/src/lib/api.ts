import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: {
    indexes: null, // This sends arrays as key=val1&key=val2 instead of key[]=val1&key[]=val2
  },
});

// Types
export interface OverviewMetrics {
  total_responses: number;
  valid_responses: number;
  flagged_responses: number;
  duplicate_count: number;
  q1_support_count: number;
  q1_oppose_count: number;
  q1_support_percent: number;
  q2_support_count: number;
  q2_oppose_count: number;
  q2_support_percent: number;
  response_by_course: Record<string, number>;
  response_by_year: Record<string, number>;
  last_updated: string;
}

export interface DemographicBreakdown {
  category: string;
  total: number;
  q1_yes: number;
  q1_no: number;
  q1_yes_percent: number;
  q2_yes: number;
  q2_no: number;
  q2_yes_percent: number;
}

export interface CrossTabulation {
  yes_yes: number;
  yes_no: number;
  no_yes: number;
  no_no: number;
  yes_yes_percent: number;
  yes_no_percent: number;
  no_yes_percent: number;
  no_no_percent: number;
  correlation_coefficient: number;
  chi_square: number;
  p_value: number;
}

export interface ConcernCount {
  concern_id: string;
  concern_name: string;
  count: number;
  percentage: number;
  color: string;
  sample_quotes: string[];
}

export interface QualityDistribution {
  excellent: number;
  good: number;
  acceptable: number;
  poor: number;
  flagged_breakdown: Record<string, number>;
}

export interface QualityResult {
  score: number;
  flags: string[];
  is_valid: boolean;
  needs_review: boolean;
}

export interface ConcernAnalysis {
  primary_concern: string | null;
  secondary_concerns: string[];
  confidence: number;
  matched_keywords: string[];
}

export interface SurveyResponse {
  id: number;
  timestamp: string;
  name: string;
  roll_no: string;
  course: string;
  year: string;
  q1_parent_notification: string;
  q2_monitoring: string | null;
  comments: string;
  quality: QualityResult | null;
  concerns: ConcernAnalysis | null;
}

export interface SurveyResponseList {
  total: number;
  valid_count: number;
  flagged_count: number;
  responses: SurveyResponse[];
}

export interface ArgumentCluster {
  claim: string;
  reason: string;
  frequency: number;
  representative_quotes: string[];
  stance: string;
}

export interface TemporalData {
  hourly_distribution: Record<string, number>;
  daily_distribution: Record<string, number>;
  cumulative_data: Array<{
    date: string;
    daily_count: number;
    cumulative_count: number;
  }>;
  peak_hour: {
    hour: number;
    count: number;
    label: string;
  } | null;
  peak_day: {
    date: string;
    count: number;
  } | null;
}

export interface WordCloudWord {
  word: string;
  count: number;
  size: number;
}

export interface WordCloudData {
  words: WordCloudWord[];
  total_words?: number;
  unique_words?: number;
  category?: string;
}

export interface SentimentData {
  overall: {
    average_polarity: number;
    median_polarity: number;
    positive_count: number;
    negative_count: number;
    neutral_count: number;
    positive_percent: number;
    negative_percent: number;
    distribution: Record<string, number>;
  };
  by_vote: {
    support: Record<string, unknown>;
    oppose: Record<string, unknown>;
  };
}

export interface SuggestionsData {
  total_with_suggestions: number;
  suggestion_rate: number;
  top_suggestions: string[];
  category_breakdown: Record<string, number>;
  top_categories: string[];
}

export interface CacheStatus {
  exists: boolean;
  computed_at?: string;
  computation_time_seconds?: number;
  total_responses?: number;
  has_temporal?: boolean;
  has_word_cloud?: boolean;
  has_sentiment?: boolean;
  has_suggestions?: boolean;
  message?: string;
}

// API Functions
export async function getOverview(): Promise<OverviewMetrics> {
  const response = await api.get("/api/analytics/overview");
  return response.data;
}

export async function getDemographics(
  groupBy: "course" | "year" = "course"
): Promise<DemographicBreakdown[]> {
  const response = await api.get("/api/analytics/demographics", {
    params: { group_by: groupBy },
  });
  return response.data;
}

export async function getCrossTabulation(): Promise<CrossTabulation> {
  const response = await api.get("/api/analytics/cross-tabulation");
  return response.data;
}

export async function getConcerns(
  minQualityScore: number = 40
): Promise<ConcernCount[]> {
  const response = await api.get("/api/analytics/concerns", {
    params: { min_quality_score: minQualityScore },
  });
  return response.data;
}

export async function getQualityDistribution(): Promise<QualityDistribution> {
  const response = await api.get("/api/analytics/quality");
  return response.data;
}

// Alias for convenience
export const getQuality = getQualityDistribution;

export async function getArguments(
  question: "q1" | "q2" = "q1",
  minQualityScore: number = 40
): Promise<{ for: ArgumentCluster[]; against: ArgumentCluster[] }> {
  const response = await api.get("/api/analytics/arguments", {
    params: { question, min_quality_score: minQualityScore },
  });
  return response.data;
}

export async function getTemporalAnalysis(): Promise<TemporalData> {
  const response = await api.get("/api/analytics/temporal");
  return response.data;
}

export async function getResponses(params: {
  courses?: string[];
  years?: string[];
  q1_vote?: string;
  q2_vote?: string;
  concerns?: string[];
  min_quality_score?: number;
  include_flagged?: boolean;
  search_query?: string;
  page?: number;
  page_size?: number;
}): Promise<SurveyResponseList> {
  const response = await api.get("/api/data/responses", { params });
  return response.data;
}

export async function refreshData(): Promise<{
  success: boolean;
  total_responses: number;
  message: string;
}> {
  const response = await api.post("/api/data/refresh");
  return response.data;
}

export async function getMetadata(): Promise<{
  total_responses: number;
  courses: string[];
  years: string[];
  q1_options: string[];
  q2_options: string[];
  concern_categories: string[];
}> {
  const response = await api.get("/api/data/metadata");
  return response.data;
}

// NEW: Enhanced Analytics Endpoints
export async function getTemporal(): Promise<TemporalData> {
  const response = await api.get("/api/analytics/temporal");
  return response.data;
}

export async function getWordCloud(
  category: "all" | "support" | "oppose" = "all"
): Promise<WordCloudData> {
  const response = await api.get("/api/analytics/word-cloud", {
    params: { category },
  });
  return response.data;
}

export async function getSentiment(): Promise<SentimentData> {
  const response = await api.get("/api/analytics/sentiment");
  return response.data;
}

export async function getResponseSentiment(responseId: number): Promise<{
  id: number;
  polarity: number;
  label: string;
}> {
  const response = await api.get(`/api/analytics/sentiment/${responseId}`);
  return response.data;
}

export async function getSuggestions(): Promise<SuggestionsData> {
  const response = await api.get("/api/analytics/suggestions");
  return response.data;
}

export async function getResponseSuggestions(responseId: number): Promise<{
  id: number;
  has_suggestion: boolean;
  suggestions: string[];
  categories: string[];
}> {
  const response = await api.get(`/api/analytics/suggestions/${responseId}`);
  return response.data;
}

export async function getCacheStatus(): Promise<CacheStatus> {
  const response = await api.get("/api/analytics/cache-status");
  return response.data;
}

export async function refreshAnalytics(): Promise<{
  success: boolean;
  total_responses?: number;
  computation_time?: number;
  features?: Record<string, boolean>;
  message?: string;
}> {
  const response = await api.post("/api/analytics/refresh");
  return response.data;
}

// ========== DECISION SUPPORT TYPES ==========

export interface KeyFinding {
  text: string;
  category: string;
  importance: number;
  confidence: string;
  data_reference: string;
  supporting_stat?: string;
}

export interface KeyFindingsResponse {
  findings: KeyFinding[];
  total_findings: number;
  executive_summary: string;
  categories: Record<string, number>;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  justification: string;
  action_items: string[];
  category: string;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  total: number;
  by_priority: {
    high: number;
    medium: number;
    low: number;
  };
  summary: string;
}

export interface PercentageWithCI {
  percentage: number;
  margin_of_error: number;
  ci_lower: number;
  ci_upper: number;
  sample_size: number;
  confidence_level: number;
}

export interface SignificanceBadge {
  level: string;
  label: string;
  symbol: string;
  color: string;
}

export interface ComparisonStatTest {
  z_statistic: number;
  p_value: number;
  significant: boolean;
  highly_significant?: boolean;
  difference: number;
  effect_size: string;
  cohens_h?: number;
}

export interface GroupMetrics {
  total: number;
  q1_support: {
    count: number;
    oppose_count: number;
    total_voted: number;
    percentage: number;
  };
  q2_support: {
    count: number;
    oppose_count: number;
    total_voted: number;
    percentage: number;
  };
  q1_with_ci: PercentageWithCI;
  q2_with_ci: PercentageWithCI;
}

export interface ComparisonInsight {
  text: string;
  metric: string;
  difference?: string;
  significant?: boolean;
  confidence: string;
  type?: string;
}

export interface ComparisonResponse {
  group_a: {
    selector: string;
    field: string;
    value: string;
    metrics: GroupMetrics;
  };
  group_b: {
    selector: string;
    field: string;
    value: string;
    metrics: GroupMetrics;
  };
  comparison: {
    q1: {
      difference_pp: number;
      statistical_test: ComparisonStatTest;
      significance_badge: SignificanceBadge;
    };
    q2: {
      difference_pp: number;
      statistical_test: ComparisonStatTest;
      significance_badge: SignificanceBadge;
    };
  };
  insights: ComparisonInsight[];
  sample_sizes: {
    group_a: number;
    group_b: number;
    combined: number;
  };
}

export interface DecisionSummary {
  metrics: {
    total_responses: number;
    valid_responses: number;
    q1_support: PercentageWithCI;
    q2_support: PercentageWithCI;
    sample_adequacy: {
      sample_size: number;
      adequacy: string;
      note: string;
      worst_case_moe_percent: number;
      can_detect_difference: number;
    };
  };
  findings: KeyFindingsResponse;
  recommendations: RecommendationsResponse;
  concerns_summary: ConcernCount[];
  suggestions_summary: string[];
  computed_at: string;
}

// ========== DECISION SUPPORT API FUNCTIONS ==========

export async function getKeyFindings(): Promise<KeyFindingsResponse> {
  const response = await api.get("/api/analytics/key-findings");
  return response.data;
}

export async function getRecommendations(): Promise<RecommendationsResponse> {
  const response = await api.get("/api/analytics/recommendations");
  return response.data;
}

export async function compareGroups(
  groupA: string,
  groupB: string
): Promise<ComparisonResponse> {
  const response = await api.get("/api/analytics/compare", {
    params: { group_a: groupA, group_b: groupB },
  });
  return response.data;
}

export async function getAvailableGroups(): Promise<{
  course: string[];
  year: string[];
}> {
  const response = await api.get("/api/analytics/compare/groups");
  return response.data;
}

export async function getDecisionSummary(): Promise<DecisionSummary> {
  const response = await api.get("/api/analytics/decision-summary");
  return response.data;
}
