"""
Demographic Comparison Service - Compare two student groups side-by-side.
Provides statistical significance testing and insights.
"""

from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
from services.confidence import (
    calculate_percentage_with_ci,
    two_proportion_z_test,
    get_significance_badge
)


def parse_group_selector(selector: str) -> Tuple[str, str]:
    """
    Parse a group selector like 'course:PhD' into (field, value).
    
    Formats:
        - 'course:PhD' -> ('course', 'PhD')
        - 'year:4th Year' -> ('year', '4th Year')
    """
    if ':' not in selector:
        raise ValueError(f"Invalid selector format: {selector}. Use 'field:value'")
    
    parts = selector.split(':', 1)
    field = parts[0].strip().lower()
    value = parts[1].strip()
    
    if field not in ['course', 'year']:
        raise ValueError(f"Invalid field: {field}. Use 'course' or 'year'")
    
    return field, value


def get_group_data(df: pd.DataFrame, field: str, value: str) -> pd.DataFrame:
    """Filter DataFrame to get a specific group."""
    if field not in df.columns:
        raise ValueError(f"Field '{field}' not found in data")
    
    return df[df[field] == value]


def calculate_group_metrics(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculate key metrics for a group."""
    total = len(df)
    
    if total == 0:
        return {
            "total": 0,
            "q1_support": {"count": 0, "percentage": 0},
            "q2_support": {"count": 0, "percentage": 0},
            "q1_with_ci": calculate_percentage_with_ci(0, 0),
            "q2_with_ci": calculate_percentage_with_ci(0, 0)
        }
    
    # Q1 metrics
    q1_yes = len(df[df['q1_parent_notification'] == 'Yes']) if 'q1_parent_notification' in df.columns else 0
    q1_no = len(df[df['q1_parent_notification'] == 'No']) if 'q1_parent_notification' in df.columns else 0
    q1_total = q1_yes + q1_no
    
    # Q2 metrics
    q2_yes = len(df[df['q2_monitoring'] == 'Yes']) if 'q2_monitoring' in df.columns else 0
    q2_no = len(df[df['q2_monitoring'] == 'No']) if 'q2_monitoring' in df.columns else 0
    q2_total = q2_yes + q2_no
    
    return {
        "total": total,
        "q1_support": {
            "count": q1_yes,
            "oppose_count": q1_no,
            "total_voted": q1_total,
            "percentage": round(q1_yes / q1_total * 100, 1) if q1_total > 0 else 0
        },
        "q2_support": {
            "count": q2_yes,
            "oppose_count": q2_no,
            "total_voted": q2_total,
            "percentage": round(q2_yes / q2_total * 100, 1) if q2_total > 0 else 0
        },
        "q1_with_ci": calculate_percentage_with_ci(q1_yes, q1_total),
        "q2_with_ci": calculate_percentage_with_ci(q2_yes, q2_total)
    }


def compare_groups(
    df: pd.DataFrame,
    group_a_selector: str,
    group_b_selector: str
) -> Dict[str, Any]:
    """
    Compare two demographic groups side-by-side.
    
    Args:
        df: Full survey DataFrame
        group_a_selector: Selector like 'course:PhD'
        group_b_selector: Selector like 'course:BTech'
    
    Returns:
        Comprehensive comparison with statistics and insights.
    """
    # Parse selectors
    field_a, value_a = parse_group_selector(group_a_selector)
    field_b, value_b = parse_group_selector(group_b_selector)
    
    # Get group data
    df_a = get_group_data(df, field_a, value_a)
    df_b = get_group_data(df, field_b, value_b)
    
    # Calculate metrics for each group
    metrics_a = calculate_group_metrics(df_a)
    metrics_b = calculate_group_metrics(df_b)
    
    # Statistical tests for Q1
    q1_test = two_proportion_z_test(
        metrics_a["q1_support"]["count"],
        metrics_a["q1_support"]["total_voted"],
        metrics_b["q1_support"]["count"],
        metrics_b["q1_support"]["total_voted"]
    )
    
    # Statistical tests for Q2
    q2_test = two_proportion_z_test(
        metrics_a["q2_support"]["count"],
        metrics_a["q2_support"]["total_voted"],
        metrics_b["q2_support"]["count"],
        metrics_b["q2_support"]["total_voted"]
    )
    
    # Generate insights
    insights = _generate_comparison_insights(
        value_a, value_b,
        metrics_a, metrics_b,
        q1_test, q2_test
    )
    
    return {
        "group_a": {
            "selector": group_a_selector,
            "field": field_a,
            "value": value_a,
            "metrics": metrics_a
        },
        "group_b": {
            "selector": group_b_selector,
            "field": field_b,
            "value": value_b,
            "metrics": metrics_b
        },
        "comparison": {
            "q1": {
                "difference_pp": q1_test["difference"],
                "statistical_test": q1_test,
                "significance_badge": get_significance_badge(q1_test["p_value"])
            },
            "q2": {
                "difference_pp": q2_test["difference"],
                "statistical_test": q2_test,
                "significance_badge": get_significance_badge(q2_test["p_value"])
            }
        },
        "insights": insights,
        "sample_sizes": {
            "group_a": metrics_a["total"],
            "group_b": metrics_b["total"],
            "combined": metrics_a["total"] + metrics_b["total"]
        }
    }


def _generate_comparison_insights(
    name_a: str,
    name_b: str,
    metrics_a: Dict,
    metrics_b: Dict,
    q1_test: Dict,
    q2_test: Dict
) -> List[Dict[str, Any]]:
    """Generate plain-English insights from comparison."""
    insights = []
    
    # Q1 difference insight
    q1_diff = q1_test["difference"]
    q1_sig = q1_test["significant"]
    
    if abs(q1_diff) >= 1:
        higher_group = name_a if q1_diff > 0 else name_b
        lower_group = name_b if q1_diff > 0 else name_a
        
        if q1_sig:
            text = f"{higher_group} students are significantly more supportive of parent notification than {lower_group} students"
            confidence = "high"
        else:
            text = f"{higher_group} students appear more supportive, but the difference is not statistically significant"
            confidence = "low"
        
        insights.append({
            "text": text,
            "metric": "Q1 Support",
            "difference": f"{abs(q1_diff):.1f}pp",
            "significant": q1_sig,
            "confidence": confidence
        })
    else:
        insights.append({
            "text": f"Both groups have similar views on parent notification",
            "metric": "Q1 Support",
            "difference": f"{abs(q1_diff):.1f}pp",
            "significant": False,
            "confidence": "high"
        })
    
    # Q2 difference insight
    q2_diff = q2_test["difference"]
    q2_sig = q2_test["significant"]
    
    if abs(q2_diff) >= 1:
        higher_group = name_a if q2_diff > 0 else name_b
        lower_group = name_b if q2_diff > 0 else name_a
        
        if q2_sig:
            text = f"{higher_group} students are significantly more supportive of 24/7 monitoring than {lower_group} students"
            confidence = "high"
        else:
            text = f"{higher_group} students appear more supportive of monitoring, but difference is not statistically significant"
            confidence = "low"
        
        insights.append({
            "text": text,
            "metric": "Q2 Support",
            "difference": f"{abs(q2_diff):.1f}pp",
            "significant": q2_sig,
            "confidence": confidence
        })
    
    # Sample size warning if needed
    min_size = min(metrics_a["total"], metrics_b["total"])
    if min_size < 30:
        insights.append({
            "text": f"Caution: Small sample size ({min_size}) may limit reliability of comparison",
            "metric": "Sample Size",
            "type": "warning",
            "confidence": "n/a"
        })
    
    # Overall pattern insight
    if q1_sig and q2_sig and (q1_diff > 0) == (q2_diff > 0):
        more_supportive = name_a if q1_diff > 0 else name_b
        insights.append({
            "text": f"{more_supportive} students are consistently more supportive of both policies",
            "metric": "Overall Pattern",
            "type": "summary",
            "confidence": "high"
        })
    
    return insights


def get_available_groups(df: pd.DataFrame) -> Dict[str, List[str]]:
    """Get all available groups that can be compared."""
    groups = {
        "course": [],
        "year": []
    }
    
    if 'course' in df.columns:
        groups["course"] = sorted(df['course'].dropna().unique().tolist())
    
    if 'year' in df.columns:
        groups["year"] = sorted(df['year'].dropna().unique().tolist())
    
    return groups
