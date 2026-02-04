"""
Analytics router - serves pre-computed analytics from cache.
Enhanced with temporal, sentiment, suggestions, and word cloud endpoints.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import json
from pathlib import Path
import logging

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
logger = logging.getLogger(__name__)

# Cache file location
CACHE_FILE = Path(__file__).parent.parent.parent / "cache" / "analytics_cache.json"


def load_cache():
    """Load analytics from cache file."""
    try:
        if not CACHE_FILE.exists():
            logger.warning(f"Cache file not found: {CACHE_FILE}")
            return None
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load cache: {e}")
        return None


@router.get("/overview")
async def get_overview():
    """Get overview metrics."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available. Run precompute first.")
    
    return cache.get("overview", {})


@router.get("/demographics")
async def get_demographics(group_by: str = Query("course", enum=["course", "year"])):
    """Get demographic breakdown."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    demographics = cache.get("demographics", {})
    return demographics.get(f"by_{group_by}", [])


@router.get("/concerns")
async def get_concerns(min_quality_score: int = Query(40, ge=0, le=100)):
    """Get top concerns."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    return cache.get("concerns", [])


@router.get("/quality")
async def get_quality():
    """Get quality metrics."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    return cache.get("quality", {})


@router.get("/arguments")
async def get_arguments(question: str = Query("q1", enum=["q1", "q2"])):
    """Get arguments for/against."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    arguments = cache.get("arguments", {})
    return arguments.get(question, {"for": [], "against": []})


@router.get("/cross-tabulation")
async def get_cross_tabulation():
    """Get Q1 vs Q2 cross-tabulation."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    return cache.get("cross_tabulation", {})


# ========== NEW ENDPOINTS ==========

@router.get("/temporal")
async def get_temporal():
    """Get temporal/time-based analytics."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    temporal = cache.get("temporal", {})
    if not temporal:
        return {
            "hourly_distribution": {},
            "daily_distribution": {},
            "cumulative_data": [],
            "peak_hour": None,
            "peak_day": None
        }
    
    return temporal


@router.get("/word-cloud")
async def get_word_cloud(category: str = Query("all", enum=["all", "support", "oppose"])):
    """Get word frequency data for word cloud visualization."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    word_cloud = cache.get("word_cloud", {})
    
    if category == "all":
        return {
            "words": word_cloud.get("all", []),
            "total_words": word_cloud.get("total_words", 0),
            "unique_words": word_cloud.get("unique_words", 0)
        }
    
    return {
        "words": word_cloud.get(category, []),
        "category": category
    }


@router.get("/sentiment")
async def get_sentiment():
    """Get sentiment analysis data."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    sentiment = cache.get("sentiment", {})
    
    return {
        "overall": sentiment.get("overall", {}),
        "by_vote": sentiment.get("by_vote", {})
    }


@router.get("/sentiment/{response_id}")
async def get_response_sentiment(response_id: int):
    """Get sentiment for a specific response."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    sentiments = cache.get("sentiment", {}).get("response_sentiments", [])
    
    for sent in sentiments:
        if sent.get("id") == response_id:
            return sent
    
    raise HTTPException(status_code=404, detail="Response not found")


@router.get("/suggestions")
async def get_suggestions():
    """Get aggregated suggestions data."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    suggestions = cache.get("suggestions", {})
    return suggestions.get("aggregated", {
        "total_with_suggestions": 0,
        "suggestion_rate": 0,
        "top_suggestions": [],
        "category_breakdown": {},
        "top_categories": []
    })


@router.get("/suggestions/{response_id}")
async def get_response_suggestions(response_id: int):
    """Get suggestions for a specific response."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    suggestions = cache.get("suggestions", {}).get("response_suggestions", [])
    
    for sugg in suggestions:
        if sugg.get("id") == response_id:
            return sugg
    
    raise HTTPException(status_code=404, detail="Response not found")


# ========== DECISION SUPPORT ENDPOINTS ==========

@router.get("/key-findings")
async def get_key_findings():
    """Get auto-generated key findings ranked by importance."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    from backend.services.findings_generator import generate_key_findings
    
    try:
        return generate_key_findings(cache)
    except Exception as e:
        logger.error(f"Failed to generate findings: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate key findings")


@router.get("/recommendations")
async def get_recommendations():
    """Get data-driven policy recommendations."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    from backend.services.recommendations import generate_recommendations
    
    try:
        return generate_recommendations(cache)
    except Exception as e:
        logger.error(f"Failed to generate recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")


@router.get("/compare")
async def compare_groups(
    group_a: str = Query(..., description="First group selector (e.g., 'course:PhD')"),
    group_b: str = Query(..., description="Second group selector (e.g., 'course:BTech')")
):
    """
    Compare two demographic groups side-by-side with statistical tests.
    
    Selector format: 'field:value' where field is 'course' or 'year'.
    Examples: 'course:PhD', 'year:1st Year'
    """
    from backend.services.sheets import sheets_service
    from backend.services.comparison import compare_groups as do_compare
    
    try:
        df = sheets_service.fetch_raw_data()
        if df.empty:
            raise HTTPException(status_code=503, detail="No data available")
        
        return do_compare(df, group_a, group_b)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Comparison failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to compare groups")


@router.get("/compare/groups")
async def get_available_groups():
    """Get list of available groups that can be compared."""
    from backend.services.sheets import sheets_service
    from backend.services.comparison import get_available_groups as get_groups
    
    try:
        df = sheets_service.fetch_raw_data()
        if df.empty:
            return {"course": [], "year": []}
        
        return get_groups(df)
    except Exception as e:
        logger.error(f"Failed to get groups: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available groups")


@router.get("/decision-summary")
async def get_decision_summary():
    """Get complete decision summary with findings, metrics, and recommendations."""
    cache = load_cache()
    if not cache:
        raise HTTPException(status_code=503, detail="Analytics cache not available.")
    
    from backend.services.findings_generator import generate_key_findings
    from backend.services.recommendations import generate_recommendations
    from backend.services.confidence import calculate_percentage_with_ci, calculate_sample_adequacy
    
    try:
        overview = cache.get("overview", {})
        total = overview.get("total_responses", 0)
        
        # Get Q1 and Q2 with confidence intervals
        q1_count = overview.get("q1_support_count", 0)
        q1_total = q1_count + overview.get("q1_oppose_count", 0)
        q2_count = overview.get("q2_support_count", 0)
        q2_total = q2_count + overview.get("q2_oppose_count", 0)
        
        q1_stats = calculate_percentage_with_ci(q1_count, q1_total)
        q2_stats = calculate_percentage_with_ci(q2_count, q2_total)
        
        # Get findings and recommendations
        findings = generate_key_findings(cache)
        recommendations = generate_recommendations(cache)
        
        # Sample adequacy
        adequacy = calculate_sample_adequacy(total)
        
        # Top concerns summary
        concerns = cache.get("concerns", [])[:3]
        
        # Top suggestions
        suggestions = cache.get("suggestions", {}).get("aggregated", {})
        top_suggestions = suggestions.get("top_suggestions", [])[:3]
        
        return {
            "metrics": {
                "total_responses": total,
                "valid_responses": overview.get("valid_responses", 0),
                "q1_support": q1_stats,
                "q2_support": q2_stats,
                "sample_adequacy": adequacy
            },
            "findings": findings,
            "recommendations": recommendations,
            "concerns_summary": concerns,
            "suggestions_summary": top_suggestions,
            "computed_at": cache.get("computed_at")
        }
    except Exception as e:
        logger.error(f"Failed to generate decision summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate decision summary")


# ========== CACHE MANAGEMENT ==========

@router.get("/cache-status")
async def get_cache_status():
    """Check cache status."""
    cache = load_cache()
    if not cache:
        return {
            "exists": False,
            "message": "Cache not found. Run precompute to generate."
        }
    
    return {
        "exists": True,
        "computed_at": cache.get("computed_at"),
        "computation_time_seconds": cache.get("computation_time_seconds"),
        "total_responses": cache.get("total_responses"),
        "has_temporal": "temporal" in cache and bool(cache["temporal"].get("cumulative_data")),
        "has_word_cloud": "word_cloud" in cache and bool(cache["word_cloud"].get("all")),
        "has_sentiment": "sentiment" in cache and bool(cache["sentiment"].get("overall")),
        "has_suggestions": "suggestions" in cache and bool(cache["suggestions"].get("aggregated"))
    }


@router.post("/refresh")
async def refresh_analytics():
    """Refresh the analytics cache."""
    from backend.services.precompute import refresh_cache
    
    try:
        result = refresh_cache()
        if result:
            return {
                "success": True,
                "total_responses": result.get("total_responses"),
                "computation_time": result.get("computation_time_seconds"),
                "features": {
                    "temporal": bool(result.get("temporal", {}).get("cumulative_data")),
                    "word_cloud": bool(result.get("word_cloud", {}).get("all")),
                    "sentiment": bool(result.get("sentiment", {}).get("overall")),
                    "suggestions": bool(result.get("suggestions", {}).get("aggregated"))
                }
            }
        return {"success": False, "message": "Failed to compute analytics"}
    except Exception as e:
        logger.error(f"Refresh failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
