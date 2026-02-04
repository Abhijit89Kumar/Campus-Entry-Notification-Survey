"""
Pre-computation service for analytics.
Enhanced version with temporal analysis, sentiment, suggestions, and word cloud data.
"""

import json
import logging
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
from collections import Counter

logger = logging.getLogger(__name__)

# Cache file path
CACHE_DIR = Path(__file__).parent.parent.parent / "cache"
ANALYTICS_CACHE_FILE = CACHE_DIR / "analytics_cache.json"

# Stopwords for word cloud
STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "is", "it",
    "be", "are", "was", "were", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "must", "shall", "can", "need",
    "this", "that", "these", "those", "i", "you", "he", "she", "we", "they", "me", "him",
    "her", "us", "them", "my", "your", "his", "its", "our", "their", "what", "which", "who",
    "whom", "when", "where", "why", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
    "than", "too", "very", "just", "also", "now", "here", "there", "then", "if", "as",
    "with", "from", "about", "into", "through", "during", "before", "after", "above",
    "below", "between", "under", "again", "further", "once", "any", "am", "by", "up",
    "down", "out", "off", "over", "because", "until", "while", "don", "doesn", "didn",
    "won", "wouldn", "couldn", "shouldn", "ain", "aren", "hadn", "hasn", "haven", "isn",
    "mightn", "mustn", "needn", "shan", "wasn", "weren", "ve", "ll", "re", "m", "s", "t", "d"
}

# Concern keywords and metadata
CONCERN_KEYWORDS = {
    "privacy": ["privacy", "surveillance", "track", "monitor", "watch", "data", "spy", "private"],
    "autonomy": ["adult", "independent", "freedom", "choice", "autonomy", "mature", "18", "child", "grown"],
    "trust": ["trust", "distrust", "believe", "faith", "doubt"],
    "safety": ["safety", "safe", "secure", "security", "protection", "emergency", "risk"],
    "parental": ["parent", "family", "guardian", "mother", "father", "inform", "notify"],
    "necessity": ["unnecessary", "need", "why", "pointless", "waste", "useless", "necessary"],
}

CONCERN_COLORS = {
    "privacy": "#ef4444",
    "autonomy": "#f97316",
    "trust": "#eab308",
    "safety": "#22c55e",
    "parental": "#3b82f6",
    "necessity": "#8b5cf6",
}

CONCERN_NAMES = {
    "privacy": "Privacy Concerns",
    "autonomy": "Autonomy & Independence",
    "trust": "Trust Issues",
    "safety": "Safety & Security",
    "parental": "Parental Involvement",
    "necessity": "Questioning Necessity",
}


def ensure_cache_dir():
    """Ensure the cache directory exists."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)


def simple_quality_check(comment: str) -> Dict[str, Any]:
    """Quality check for comments."""
    if not comment or not isinstance(comment, str):
        return {"score": 0, "flags": ["empty"], "is_valid": False}
    
    comment = comment.strip()
    flags = []
    score = 100
    
    # Too short
    if len(comment) < 5:
        flags.append("too_short")
        score -= 50
    
    # Check for gibberish patterns
    if re.match(r'^[a-z]{1,3}$', comment.lower()):
        flags.append("too_short")
        score -= 30
    
    # Keyboard spam
    spam_patterns = ["asdf", "qwerty", "1234", "zxcv"]
    for pattern in spam_patterns:
        if pattern in comment.lower():
            flags.append("keyboard_spam")
            score -= 40
            break
    
    # All caps
    if len(comment) > 10 and comment.isupper():
        flags.append("all_caps")
        score -= 20
    
    # Minimal responses
    if comment.lower() in [".", "-", "...", "na", "n/a", "nil", "none", "ok", "yes", "no", "nothing"]:
        flags.append("minimal")
        score -= 40
    
    score = max(0, score)
    return {
        "score": score,
        "flags": flags,
        "is_valid": score >= 40
    }


def detect_concern(comment: str) -> str:
    """Keyword-based concern detection."""
    if not comment:
        return None
    
    comment_lower = comment.lower()
    concern_scores = {}
    
    for concern, keywords in CONCERN_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in comment_lower)
        if count > 0:
            concern_scores[concern] = count
    
    if concern_scores:
        return max(concern_scores, key=concern_scores.get)
    return None


def extract_words(text: str) -> List[str]:
    """Extract meaningful words from text for word cloud."""
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    return [w for w in words if w not in STOPWORDS]


def compute_temporal_analysis(df) -> Dict[str, Any]:
    """Compute temporal/time-based analytics."""
    temporal = {
        "hourly_distribution": {str(h): 0 for h in range(24)},
        "daily_distribution": {},
        "cumulative_data": [],
        "peak_hour": None,
        "peak_day": None,
        "response_rate_by_hour": {}
    }
    
    if 'timestamp' not in df.columns:
        return temporal
    
    timestamps = []
    for ts in df['timestamp']:
        try:
            if isinstance(ts, str):
                # Try multiple formats
                for fmt in ['%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S', '%d/%m/%Y %H:%M:%S']:
                    try:
                        dt = datetime.strptime(ts, fmt)
                        timestamps.append(dt)
                        break
                    except:
                        continue
            elif hasattr(ts, 'hour'):
                timestamps.append(ts)
        except:
            continue
    
    if not timestamps:
        return temporal
    
    # Hourly distribution
    hourly = Counter(dt.hour for dt in timestamps)
    for hour, count in hourly.items():
        temporal["hourly_distribution"][str(hour)] = count
    
    # Find peak hour
    if hourly:
        peak_hour = max(hourly, key=hourly.get)
        temporal["peak_hour"] = {
            "hour": peak_hour,
            "count": hourly[peak_hour],
            "label": f"{peak_hour}:00 - {peak_hour+1}:00"
        }
    
    # Daily distribution
    daily = Counter(dt.strftime('%Y-%m-%d') for dt in timestamps)
    temporal["daily_distribution"] = dict(sorted(daily.items()))
    
    # Find peak day
    if daily:
        peak_day = max(daily, key=daily.get)
        temporal["peak_day"] = {
            "date": peak_day,
            "count": daily[peak_day]
        }
    
    # Cumulative data for timeline chart
    sorted_dates = sorted(daily.keys())
    cumulative = 0
    for date in sorted_dates:
        cumulative += daily[date]
        temporal["cumulative_data"].append({
            "date": date,
            "daily_count": daily[date],
            "cumulative_count": cumulative
        })
    
    return temporal


def compute_word_cloud_data(df, min_freq: int = 3) -> Dict[str, Any]:
    """Compute word frequencies for word cloud visualization."""
    all_words = []
    support_words = []
    oppose_words = []
    
    if 'comments' not in df.columns:
        return {"all": [], "support": [], "oppose": []}
    
    for _, row in df.iterrows():
        comment = str(row.get('comments', ''))
        if not comment or len(comment) < 5:
            continue
        
        words = extract_words(comment)
        all_words.extend(words)
        
        # Separate by Q1 vote
        q1 = str(row.get('q1_parent_notification', ''))
        if q1 == 'Yes':
            support_words.extend(words)
        elif q1 == 'No':
            oppose_words.extend(words)
    
    # Count and filter by minimum frequency
    def build_word_list(word_list: List[str]) -> List[Dict]:
        counts = Counter(word_list)
        return [
            {"word": word, "count": count, "size": min(100, count * 2)}
            for word, count in counts.most_common(100)
            if count >= min_freq
        ]
    
    return {
        "all": build_word_list(all_words),
        "support": build_word_list(support_words),
        "oppose": build_word_list(oppose_words),
        "total_words": len(all_words),
        "unique_words": len(set(all_words))
    }


def compute_sentiment_data(df) -> Dict[str, Any]:
    """Compute sentiment analysis data."""
    from backend.services.nlp.sentiment_analyzer import sentiment_analyzer
    
    if 'comments' not in df.columns:
        return {}
    
    comments = [str(row['comments']) for _, row in df.iterrows() if row.get('comments')]
    
    # Overall sentiment
    overall = sentiment_analyzer.analyze_batch(comments)
    
    # Sentiment by vote
    support_comments = [
        str(row['comments']) for _, row in df.iterrows()
        if row.get('q1_parent_notification') == 'Yes' and row.get('comments')
    ]
    oppose_comments = [
        str(row['comments']) for _, row in df.iterrows()
        if row.get('q1_parent_notification') == 'No' and row.get('comments')
    ]
    
    by_vote = {
        "support": sentiment_analyzer.analyze_batch(support_comments) if support_comments else {},
        "oppose": sentiment_analyzer.analyze_batch(oppose_comments) if oppose_comments else {}
    }
    
    # Per-response sentiment for explorer
    response_sentiments = []
    for idx, row in df.iterrows():
        comment = str(row.get('comments', ''))
        if comment and len(comment) > 5:
            sent = sentiment_analyzer.analyze(comment)
            response_sentiments.append({
                "id": idx + 1,
                "polarity": sent["polarity"],
                "label": sent["label"]
            })
        else:
            response_sentiments.append({
                "id": idx + 1,
                "polarity": 0,
                "label": "neutral"
            })
    
    return {
        "overall": overall,
        "by_vote": by_vote,
        "response_sentiments": response_sentiments
    }


def compute_suggestions_data(df) -> Dict[str, Any]:
    """Extract and aggregate suggestions from comments."""
    from backend.services.nlp.suggestion_extractor import suggestion_extractor
    
    if 'comments' not in df.columns:
        return {}
    
    comments = [str(row['comments']) for _, row in df.iterrows() if row.get('comments')]
    
    # Extract all suggestions
    aggregated = suggestion_extractor.extract_all(comments)
    
    # Per-response suggestions for explorer
    response_suggestions = []
    for idx, row in df.iterrows():
        comment = str(row.get('comments', ''))
        if comment and len(comment) > 10:
            result = suggestion_extractor.extract(comment)
            response_suggestions.append({
                "id": idx + 1,
                "has_suggestion": result["has_suggestion"],
                "suggestions": result["suggestions"][:2],  # Max 2 per response
                "categories": result["categories"]
            })
        else:
            response_suggestions.append({
                "id": idx + 1,
                "has_suggestion": False,
                "suggestions": [],
                "categories": []
            })
    
    return {
        "aggregated": aggregated,
        "response_suggestions": response_suggestions
    }


def compute_all_analytics() -> Dict[str, Any]:
    """Compute all analytics with enhanced features."""
    from backend.services.sheets import sheets_service
    
    logger.info("Starting enhanced analytics computation...")
    start_time = datetime.now()
    
    # Fetch data
    sheets_service.invalidate_cache()
    df = sheets_service.fetch_raw_data(force_refresh=True)
    
    if df.empty:
        logger.error("No data available")
        return {}
    
    logger.info(f"Processing {len(df)} responses...")
    
    # Initialize counters
    valid_count = 0
    flagged_count = 0
    quality_dist = {"excellent": 0, "good": 0, "acceptable": 0, "poor": 0}
    flag_counts = Counter()
    concern_counts = Counter()
    concern_quotes = {c: [] for c in CONCERN_KEYWORDS.keys()}
    
    # Process responses
    response_details = []
    
    for idx, row in df.iterrows():
        comment = ""
        if 'comments' in df.columns:
            comment = str(row['comments']) if row['comments'] else ""
        
        # Quality check
        quality = simple_quality_check(comment)
        
        if quality["is_valid"]:
            valid_count += 1
        if quality["flags"]:
            flagged_count += 1
            for flag in quality["flags"]:
                flag_counts[flag] += 1
        
        # Quality distribution
        score = quality["score"]
        if score >= 90:
            quality_dist["excellent"] += 1
        elif score >= 70:
            quality_dist["good"] += 1
        elif score >= 40:
            quality_dist["acceptable"] += 1
        else:
            quality_dist["poor"] += 1
        
        # Concern detection
        primary_concern = None
        if quality["is_valid"] and comment:
            primary_concern = detect_concern(comment)
            if primary_concern:
                concern_counts[primary_concern] += 1
                if len(concern_quotes[primary_concern]) < 5 and len(comment) > 20:
                    concern_quotes[primary_concern].append(comment[:200])
        
        response_details.append({
            "id": idx + 1,
            "quality_score": quality["score"],
            "quality_flags": quality["flags"],
            "is_valid": quality["is_valid"],
            "primary_concern": primary_concern
        })
    
    # Vote counts
    q1_yes = q1_no = q2_yes = q2_no = 0
    
    if 'q1_parent_notification' in df.columns:
        q1_yes = len(df[df['q1_parent_notification'] == 'Yes'])
        q1_no = len(df[df['q1_parent_notification'] == 'No'])
    
    if 'q2_monitoring' in df.columns:
        q2_yes = len(df[df['q2_monitoring'] == 'Yes'])
        q2_no = len(df[df['q2_monitoring'] == 'No'])
    
    total_q1 = q1_yes + q1_no
    total_q2 = q2_yes + q2_no
    
    # Build concerns list
    total_concerns = sum(concern_counts.values())
    concerns_list = []
    for concern_id in CONCERN_KEYWORDS.keys():
        count = concern_counts.get(concern_id, 0)
        concerns_list.append({
            "concern_id": concern_id,
            "concern_name": CONCERN_NAMES[concern_id],
            "count": count,
            "percentage": round(count / total_concerns * 100, 1) if total_concerns > 0 else 0,
            "color": CONCERN_COLORS[concern_id],
            "sample_quotes": concern_quotes[concern_id]
        })
    concerns_list.sort(key=lambda x: x["count"], reverse=True)
    
    # Demographics
    demographics = {"by_course": [], "by_year": []}
    
    for group_by in ['course', 'year']:
        if group_by in df.columns:
            groups = df.groupby(group_by)
            breakdowns = []
            
            for category, group_df in groups:
                g_q1_yes = len(group_df[group_df['q1_parent_notification'] == 'Yes']) if 'q1_parent_notification' in df.columns else 0
                g_q1_no = len(group_df[group_df['q1_parent_notification'] == 'No']) if 'q1_parent_notification' in df.columns else 0
                g_q2_yes = len(group_df[group_df['q2_monitoring'] == 'Yes']) if 'q2_monitoring' in df.columns else 0
                g_q2_no = len(group_df[group_df['q2_monitoring'] == 'No']) if 'q2_monitoring' in df.columns else 0
                
                g_total_q1 = g_q1_yes + g_q1_no
                g_total_q2 = g_q2_yes + g_q2_no
                
                breakdowns.append({
                    "category": str(category),
                    "total": len(group_df),
                    "q1_yes": g_q1_yes,
                    "q1_no": g_q1_no,
                    "q1_yes_percent": round(g_q1_yes / g_total_q1 * 100, 1) if g_total_q1 > 0 else 0,
                    "q2_yes": g_q2_yes,
                    "q2_no": g_q2_no,
                    "q2_yes_percent": round(g_q2_yes / g_total_q2 * 100, 1) if g_total_q2 > 0 else 0
                })
            
            breakdowns.sort(key=lambda x: x['total'], reverse=True)
            demographics[f"by_{group_by}"] = breakdowns
    
    # Cross-tabulation
    cross_tab = {}
    if 'q1_parent_notification' in df.columns and 'q2_monitoring' in df.columns:
        df_valid = df[
            (df['q1_parent_notification'].isin(['Yes', 'No'])) &
            (df['q2_monitoring'].isin(['Yes', 'No']))
        ]
        
        total = len(df_valid)
        if total > 0:
            yes_yes = len(df_valid[(df_valid['q1_parent_notification'] == 'Yes') & (df_valid['q2_monitoring'] == 'Yes')])
            yes_no = len(df_valid[(df_valid['q1_parent_notification'] == 'Yes') & (df_valid['q2_monitoring'] == 'No')])
            no_yes = len(df_valid[(df_valid['q1_parent_notification'] == 'No') & (df_valid['q2_monitoring'] == 'Yes')])
            no_no = len(df_valid[(df_valid['q1_parent_notification'] == 'No') & (df_valid['q2_monitoring'] == 'No')])
            
            try:
                import numpy as np
                from scipy import stats
                observed = np.array([[yes_yes, yes_no], [no_yes, no_no]])
                chi2, p_value, _, _ = stats.chi2_contingency(observed)
                phi = np.sqrt(chi2 / total)
            except:
                chi2, p_value, phi = 0, 1, 0
            
            cross_tab = {
                "yes_yes": yes_yes,
                "yes_no": yes_no,
                "no_yes": no_yes,
                "no_no": no_no,
                "yes_yes_percent": round(yes_yes / total * 100, 1),
                "yes_no_percent": round(yes_no / total * 100, 1),
                "no_yes_percent": round(no_yes / total * 100, 1),
                "no_no_percent": round(no_no / total * 100, 1),
                "correlation_coefficient": round(phi, 3),
                "chi_square": round(chi2, 2),
                "p_value": round(p_value, 4),
                "total_valid": total
            }
    
    # Build arguments
    arguments = {"q1": {"for": [], "against": []}, "q2": {"for": [], "against": []}}
    
    for question in ['q1', 'q2']:
        vote_col = 'q1_parent_notification' if question == 'q1' else 'q2_monitoring'
        if vote_col in df.columns and 'comments' in df.columns:
            for_concerns = Counter()
            against_concerns = Counter()
            for_quotes = {c: [] for c in CONCERN_KEYWORDS.keys()}
            against_quotes = {c: [] for c in CONCERN_KEYWORDS.keys()}
            
            for idx, row in df.iterrows():
                vote = str(row[vote_col]) if row[vote_col] else ""
                comment = str(row['comments']) if row['comments'] else ""
                
                if not comment or len(comment) < 10:
                    continue
                
                concern = detect_concern(comment)
                if concern:
                    if vote == 'Yes':
                        for_concerns[concern] += 1
                        if len(for_quotes[concern]) < 3:
                            for_quotes[concern].append(comment[:150])
                    elif vote == 'No':
                        against_concerns[concern] += 1
                        if len(against_quotes[concern]) < 3:
                            against_quotes[concern].append(comment[:150])
            
            for concern, count in against_concerns.most_common(5):
                arguments[question]["against"].append({
                    "claim": f"Opposition due to {CONCERN_NAMES.get(concern, concern)}",
                    "reason": CONCERN_NAMES.get(concern, concern),
                    "frequency": count,
                    "representative_quotes": against_quotes.get(concern, []),
                    "stance": "against"
                })
            
            for concern, count in for_concerns.most_common(5):
                arguments[question]["for"].append({
                    "claim": f"Support based on {CONCERN_NAMES.get(concern, concern)}",
                    "reason": CONCERN_NAMES.get(concern, concern),
                    "frequency": count,
                    "representative_quotes": for_quotes.get(concern, []),
                    "stance": "for"
                })
    
    # NEW: Compute enhanced analytics
    logger.info("Computing temporal analysis...")
    temporal = compute_temporal_analysis(df)
    
    logger.info("Computing word cloud data...")
    word_cloud = compute_word_cloud_data(df)
    
    logger.info("Computing sentiment analysis...")
    sentiment = compute_sentiment_data(df)
    
    logger.info("Extracting suggestions...")
    suggestions = compute_suggestions_data(df)
    
    elapsed = (datetime.now() - start_time).total_seconds()
    
    result = {
        "computed_at": datetime.now().isoformat(),
        "computation_time_seconds": round(elapsed, 2),
        "total_responses": len(df),
        "overview": {
            "total_responses": len(df),
            "valid_responses": valid_count,
            "flagged_responses": flagged_count,
            "duplicate_count": 0,
            "q1_support_count": q1_yes,
            "q1_oppose_count": q1_no,
            "q1_support_percent": round(q1_yes / total_q1 * 100, 1) if total_q1 > 0 else 0,
            "q2_support_count": q2_yes,
            "q2_oppose_count": q2_no,
            "q2_support_percent": round(q2_yes / total_q2 * 100, 1) if total_q2 > 0 else 0,
            "response_by_course": df['course'].value_counts().to_dict() if 'course' in df.columns else {},
            "response_by_year": df['year'].value_counts().to_dict() if 'year' in df.columns else {},
        },
        "quality": {
            **quality_dist,
            "flagged_breakdown": dict(flag_counts)
        },
        "concerns": concerns_list,
        "arguments": arguments,
        "demographics": demographics,
        "cross_tabulation": cross_tab,
        "response_details": response_details,
        # NEW: Enhanced analytics
        "temporal": temporal,
        "word_cloud": word_cloud,
        "sentiment": sentiment,
        "suggestions": suggestions
    }
    
    logger.info(f"Analytics completed in {elapsed:.2f} seconds")
    return result


def save_to_cache(data: Dict[str, Any]) -> bool:
    """Save to cache file."""
    try:
        ensure_cache_dir()
        with open(ANALYTICS_CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
        logger.info(f"Saved to: {ANALYTICS_CACHE_FILE}")
        return True
    except Exception as e:
        logger.error(f"Failed to save: {e}")
        return False


def load_from_cache() -> Dict[str, Any]:
    """Load from cache file."""
    try:
        if not ANALYTICS_CACHE_FILE.exists():
            return {}
        with open(ANALYTICS_CACHE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load: {e}")
        return {}


def is_cache_fresh(max_age_minutes: int = 60) -> bool:
    """Check if cache is fresh."""
    try:
        data = load_from_cache()
        if not data:
            return False
        computed_at = datetime.fromisoformat(data['computed_at'])
        age = (datetime.now() - computed_at).total_seconds() / 60
        return age < max_age_minutes
    except:
        return False


def refresh_cache() -> Dict[str, Any]:
    """Compute and save."""
    data = compute_all_analytics()
    if data:
        save_to_cache(data)
    return data


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(message)s')
    print("Computing enhanced analytics...")
    result = refresh_cache()
    if result:
        print(f"\nDone in {result.get('computation_time_seconds', 0)} seconds")
        print(f"Total: {result.get('total_responses', 0)} responses")
        print(f"Valid: {result.get('overview', {}).get('valid_responses', 0)}")
        print(f"Temporal data points: {len(result.get('temporal', {}).get('cumulative_data', []))}")
        print(f"Word cloud words: {len(result.get('word_cloud', {}).get('all', []))}")
        print(f"Suggestions found: {result.get('suggestions', {}).get('aggregated', {}).get('total_with_suggestions', 0)}")
    else:
        print("Failed!")
