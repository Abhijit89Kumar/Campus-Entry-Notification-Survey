"""
Pydantic models for survey response data.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CourseType(str, Enum):
    UG = "Undergraduate (UG)"
    PG = "Postgraduate (PG)"
    PHD = "PhD"
    RS = "Research Scholar (RS)"


class YearType(str, Enum):
    FIRST = "1st Year"
    SECOND = "2nd Year"
    THIRD = "3rd Year"
    FOURTH = "4th Year"
    FIFTH = "5th Year"


class VoteType(str, Enum):
    YES = "Yes"
    NO = "No"


class QualityFlag(str, Enum):
    TOO_SHORT = "too_short"
    GIBBERISH = "gibberish"
    KEYBOARD_SPAM = "keyboard_spam"
    CHAR_REPETITION = "char_repetition"
    PROFANITY = "profanity"
    ALL_CAPS = "all_caps"
    LOW_DICTIONARY_RATIO = "low_dictionary_ratio"
    VOTE_MISMATCH = "vote_mismatch"
    DUPLICATE = "duplicate"


class QualityResult(BaseModel):
    """Quality analysis result for a single response."""
    score: int = Field(ge=0, le=100, description="Quality score 0-100")
    flags: List[QualityFlag] = Field(default_factory=list)
    is_valid: bool = Field(description="Whether response should be included in analysis")
    needs_review: bool = Field(description="Whether response needs manual review")


class ConcernAnalysis(BaseModel):
    """Concern classification for a comment."""
    primary_concern: Optional[str] = None
    secondary_concerns: List[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1, default=0.0)
    matched_keywords: List[str] = Field(default_factory=list)


class SurveyResponse(BaseModel):
    """A single survey response."""
    id: int = Field(description="Row index in the sheet")
    timestamp: datetime
    name: str
    roll_no: str
    course: str
    year: str
    q1_parent_notification: str
    q2_monitoring: Optional[str] = None
    comments: str
    
    # Analysis fields (populated by NLP pipeline)
    quality: Optional[QualityResult] = None
    concerns: Optional[ConcernAnalysis] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SurveyResponseList(BaseModel):
    """List of survey responses with metadata."""
    total: int
    valid_count: int
    flagged_count: int
    responses: List[SurveyResponse]


class FilterParams(BaseModel):
    """Filter parameters for querying responses."""
    courses: Optional[List[str]] = None
    years: Optional[List[str]] = None
    q1_vote: Optional[str] = None
    q2_vote: Optional[str] = None
    concerns: Optional[List[str]] = None
    min_quality_score: int = Field(default=40, ge=0, le=100)
    include_flagged: bool = False
    search_query: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=200)
