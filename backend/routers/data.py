"""
Data API endpoints - fetching and filtering survey responses.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging

from services.sheets import sheets_service
from services.nlp.quality_analyzer import quality_analyzer
from services.nlp.concern_classifier import concern_classifier
from models.response import SurveyResponse, SurveyResponseList, FilterParams

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/data", tags=["Data"])


@router.get("/responses", response_model=SurveyResponseList)
async def get_responses(
    courses: Optional[List[str]] = Query(None),
    years: Optional[List[str]] = Query(None),
    q1_vote: Optional[str] = Query(None),
    q2_vote: Optional[str] = Query(None),
    concerns: Optional[List[str]] = Query(None),
    min_quality_score: int = Query(40, ge=0, le=100),
    include_flagged: bool = Query(False),
    search_query: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200)
):
    """
    Get survey responses with optional filtering.
    """
    try:
        # Fetch raw data
        df = sheets_service.fetch_raw_data()
        
        if df.empty:
            return SurveyResponseList(
                total=0,
                valid_count=0,
                flagged_count=0,
                responses=[]
            )
        
        # Analyze quality and concerns for each response
        responses = []
        valid_count = 0
        flagged_count = 0
        
        for _, row in df.iterrows():
            comment = str(row.get('comments', ''))
            q1 = str(row.get('q1_parent_notification', ''))
            q2 = str(row.get('q2_monitoring', ''))
            
            # Quality analysis
            quality = quality_analyzer.analyze(comment, q1, q2)
            
            # Concern classification
            concerns_analysis = concern_classifier.classify(comment) if quality.is_valid else None
            
            # Track counts
            if quality.is_valid:
                valid_count += 1
            if quality.flags:
                flagged_count += 1
            
            response = SurveyResponse(
                id=int(row.get('id', 0)),
                timestamp=row.get('timestamp'),
                name=str(row.get('name', '')),
                roll_no=str(row.get('roll_no', '')),
                course=str(row.get('course', '')),
                year=str(row.get('year', '')),
                q1_parent_notification=q1,
                q2_monitoring=q2 if q2 else None,
                comments=comment,
                quality=quality,
                concerns=concerns_analysis
            )
            responses.append(response)
        
        # Apply filters
        filtered = responses
        
        # Filter by quality
        if not include_flagged:
            filtered = [r for r in filtered if r.quality and r.quality.score >= min_quality_score]
        
        # Filter by course
        if courses:
            filtered = [r for r in filtered if r.course in courses]
        
        # Filter by year
        if years:
            filtered = [r for r in filtered if r.year in years]
        
        # Filter by Q1 vote
        if q1_vote:
            filtered = [r for r in filtered if r.q1_parent_notification == q1_vote]
        
        # Filter by Q2 vote
        if q2_vote:
            filtered = [r for r in filtered if r.q2_monitoring == q2_vote]
        
        # Filter by concerns
        if concerns:
            filtered = [
                r for r in filtered 
                if r.concerns and r.concerns.primary_concern in concerns
            ]
        
        # Search filter
        if search_query:
            query_lower = search_query.lower()
            filtered = [
                r for r in filtered
                if query_lower in r.comments.lower() 
                or query_lower in r.name.lower()
                or query_lower in r.roll_no.lower()
            ]
        
        # Pagination
        total = len(filtered)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated = filtered[start_idx:end_idx]
        
        return SurveyResponseList(
            total=total,
            valid_count=valid_count,
            flagged_count=flagged_count,
            responses=paginated
        )
        
    except Exception as e:
        logger.error(f"Error fetching responses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/response/{response_id}", response_model=SurveyResponse)
async def get_response(response_id: int):
    """Get a single response by ID."""
    try:
        df = sheets_service.fetch_raw_data()
        
        row = df[df['id'] == response_id]
        if row.empty:
            raise HTTPException(status_code=404, detail="Response not found")
        
        row = row.iloc[0]
        comment = str(row.get('comments', ''))
        q1 = str(row.get('q1_parent_notification', ''))
        q2 = str(row.get('q2_monitoring', ''))
        
        quality = quality_analyzer.analyze(comment, q1, q2)
        concerns_analysis = concern_classifier.classify(comment) if quality.is_valid else None
        
        return SurveyResponse(
            id=int(row.get('id', 0)),
            timestamp=row.get('timestamp'),
            name=str(row.get('name', '')),
            roll_no=str(row.get('roll_no', '')),
            course=str(row.get('course', '')),
            year=str(row.get('year', '')),
            q1_parent_notification=q1,
            q2_monitoring=q2 if q2 else None,
            comments=comment,
            quality=quality,
            concerns=concerns_analysis
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching response {response_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metadata")
async def get_metadata():
    """Get metadata about the dataset (unique values for filters)."""
    try:
        df = sheets_service.fetch_raw_data()
        
        return {
            "total_responses": len(df),
            "courses": sheets_service.get_unique_courses(),
            "years": sheets_service.get_unique_years(),
            "q1_options": ["Yes", "No"],
            "q2_options": ["Yes", "No"],
            "concern_categories": list(concern_classifier.categories.keys())
        }
        
    except Exception as e:
        logger.error(f"Error fetching metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh")
async def refresh_data():
    """Force refresh data from Google Sheets."""
    try:
        sheets_service.invalidate_cache()
        df = sheets_service.fetch_raw_data(force_refresh=True)
        
        return {
            "success": True,
            "total_responses": len(df),
            "message": "Data refreshed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error refreshing data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
