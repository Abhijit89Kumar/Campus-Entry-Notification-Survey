"""
Pydantic models for analytics data.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime


class OverviewMetrics(BaseModel):
    """Executive summary metrics."""
    total_responses: int
    valid_responses: int
    flagged_responses: int
    duplicate_count: int
    
    q1_support_count: int
    q1_oppose_count: int
    q1_support_percent: float
    
    q2_support_count: int
    q2_oppose_count: int
    q2_support_percent: float
    
    response_by_course: Dict[str, int]
    response_by_year: Dict[str, int]
    
    last_updated: datetime


class DemographicBreakdown(BaseModel):
    """Breakdown of votes by demographic."""
    category: str  # e.g., "Undergraduate (UG)"
    total: int
    q1_yes: int
    q1_no: int
    q1_yes_percent: float
    q2_yes: int
    q2_no: int
    q2_yes_percent: float


class CrossTabulation(BaseModel):
    """2x2 cross-tabulation of Q1 vs Q2."""
    yes_yes: int  # Yes to both
    yes_no: int   # Yes to Q1, No to Q2
    no_yes: int   # No to Q1, Yes to Q2
    no_no: int    # No to both
    
    # Percentages
    yes_yes_percent: float
    yes_no_percent: float
    no_yes_percent: float
    no_no_percent: float
    
    # Correlation metrics
    correlation_coefficient: float
    chi_square: float
    p_value: float


class ConcernCount(BaseModel):
    """Count of responses mentioning a concern."""
    concern_id: str
    concern_name: str
    count: int
    percentage: float
    color: str
    sample_quotes: List[str] = Field(default_factory=list)


class ArgumentCluster(BaseModel):
    """A cluster of similar arguments."""
    claim: str
    reason: str
    frequency: int
    representative_quotes: List[str]
    stance: str  # "for" or "against"


class ComparativeInsight(BaseModel):
    """Comparative analysis between demographics."""
    group_a: str
    group_b: str
    group_a_distinctive_terms: List[str]
    group_b_distinctive_terms: List[str]
    concern_comparison: Dict[str, Dict[str, int]]


class Suggestion(BaseModel):
    """A suggestion extracted from comments."""
    text: str
    frequency: int
    source_demographics: List[str]


class QualityDistribution(BaseModel):
    """Distribution of quality scores."""
    excellent: int  # 90-100
    good: int       # 70-89
    acceptable: int # 40-69
    poor: int       # 0-39
    
    flagged_breakdown: Dict[str, int]  # Count by flag type


class ThemeCluster(BaseModel):
    """A discovered theme cluster."""
    cluster_id: int
    size: int
    label: str
    keywords: List[str]
    centroid_comment: str
    demographic_distribution: Dict[str, int]


class TemporalData(BaseModel):
    """Time-series data for temporal analysis."""
    timestamps: List[datetime]
    cumulative_count: List[int]
    hourly_distribution: Dict[int, int]  # Hour -> count
    sentiment_over_time: List[Dict[str, Any]]


class FullAnalytics(BaseModel):
    """Complete analytics package."""
    overview: OverviewMetrics
    demographics: List[DemographicBreakdown]
    cross_tabulation: CrossTabulation
    concerns: List[ConcernCount]
    arguments_for: List[ArgumentCluster]
    arguments_against: List[ArgumentCluster]
    quality: QualityDistribution
    themes: List[ThemeCluster]
    suggestions: List[Suggestion]
    temporal: TemporalData
