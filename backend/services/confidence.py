"""
Confidence Interval Calculations for Statistical Credibility.
Provides margin of error and confidence intervals for survey data.
"""

import math
from typing import Dict, Any, Tuple, Optional


# Z-scores for common confidence levels
Z_SCORES = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
}


def calculate_margin_of_error(
    proportion: float,
    sample_size: int,
    confidence_level: float = 0.95
) -> float:
    """
    Calculate margin of error for a proportion.
    
    Args:
        proportion: The observed proportion (0-1)
        sample_size: Number of observations
        confidence_level: Confidence level (default 0.95 for 95% CI)
    
    Returns:
        Margin of error as a proportion (0-1)
    """
    if sample_size <= 0:
        return 0.0
    
    z = Z_SCORES.get(confidence_level, 1.96)
    
    # Standard error for proportion
    se = math.sqrt((proportion * (1 - proportion)) / sample_size)
    
    # Margin of error
    moe = z * se
    
    return round(moe, 4)


def calculate_confidence_interval(
    proportion: float,
    sample_size: int,
    confidence_level: float = 0.95
) -> Tuple[float, float]:
    """
    Calculate confidence interval for a proportion.
    
    Returns:
        Tuple of (lower_bound, upper_bound) as proportions (0-1)
    """
    moe = calculate_margin_of_error(proportion, sample_size, confidence_level)
    
    lower = max(0, proportion - moe)
    upper = min(1, proportion + moe)
    
    return (round(lower, 4), round(upper, 4))


def calculate_percentage_with_ci(
    count: int,
    total: int,
    confidence_level: float = 0.95
) -> Dict[str, Any]:
    """
    Calculate percentage with margin of error and confidence interval.
    
    Returns dictionary with:
        - percentage: The point estimate
        - margin_of_error: MOE as percentage points
        - ci_lower: Lower bound of CI
        - ci_upper: Upper bound of CI
        - sample_size: The total sample size
        - confidence_level: The confidence level used
    """
    if total <= 0:
        return {
            "percentage": 0,
            "margin_of_error": 0,
            "ci_lower": 0,
            "ci_upper": 0,
            "sample_size": 0,
            "confidence_level": confidence_level
        }
    
    proportion = count / total
    moe = calculate_margin_of_error(proportion, total, confidence_level)
    ci_lower, ci_upper = calculate_confidence_interval(proportion, total, confidence_level)
    
    return {
        "percentage": round(proportion * 100, 1),
        "margin_of_error": round(moe * 100, 1),
        "ci_lower": round(ci_lower * 100, 1),
        "ci_upper": round(ci_upper * 100, 1),
        "sample_size": total,
        "confidence_level": confidence_level
    }


def format_percentage_with_ci(stats: Dict[str, Any]) -> str:
    """
    Format percentage with confidence interval for display.
    
    Example: "13.2% ± 1.6% (95% CI: 11.6% - 14.8%)"
    """
    pct = stats["percentage"]
    moe = stats["margin_of_error"]
    ci_lower = stats["ci_lower"]
    ci_upper = stats["ci_upper"]
    conf = int(stats["confidence_level"] * 100)
    
    return f"{pct}% ± {moe}% ({conf}% CI: {ci_lower}% - {ci_upper}%)"


def two_proportion_z_test(
    count_a: int,
    total_a: int,
    count_b: int,
    total_b: int
) -> Dict[str, Any]:
    """
    Perform two-proportion z-test to compare two groups.
    
    Returns:
        - z_statistic: The z-score
        - p_value: Two-tailed p-value
        - significant: Whether difference is significant at p < 0.05
        - difference: Difference in percentage points
        - effect_size: Cohen's h effect size interpretation
    """
    if total_a <= 0 or total_b <= 0:
        return {
            "z_statistic": 0,
            "p_value": 1.0,
            "significant": False,
            "difference": 0,
            "effect_size": "none"
        }
    
    p1 = count_a / total_a
    p2 = count_b / total_b
    
    # Pooled proportion
    p_pooled = (count_a + count_b) / (total_a + total_b)
    
    # Standard error
    se = math.sqrt(p_pooled * (1 - p_pooled) * (1/total_a + 1/total_b))
    
    if se == 0:
        return {
            "z_statistic": 0,
            "p_value": 1.0,
            "significant": False,
            "difference": round((p1 - p2) * 100, 1),
            "effect_size": "none"
        }
    
    # Z-statistic
    z = (p1 - p2) / se
    
    # Two-tailed p-value (approximation using standard normal)
    p_value = 2 * (1 - _standard_normal_cdf(abs(z)))
    
    # Effect size (Cohen's h)
    h = 2 * (math.asin(math.sqrt(p1)) - math.asin(math.sqrt(p2)))
    
    if abs(h) < 0.2:
        effect = "small"
    elif abs(h) < 0.5:
        effect = "medium"
    else:
        effect = "large"
    
    return {
        "z_statistic": round(z, 3),
        "p_value": round(p_value, 4),
        "significant": p_value < 0.05,
        "highly_significant": p_value < 0.01,
        "difference": round((p1 - p2) * 100, 1),
        "effect_size": effect,
        "cohens_h": round(h, 3)
    }


def _standard_normal_cdf(x: float) -> float:
    """Approximation of standard normal CDF."""
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def calculate_sample_adequacy(sample_size: int, population_size: Optional[int] = None) -> Dict[str, Any]:
    """
    Assess whether sample size is adequate for reliable conclusions.
    
    Returns assessment of sample adequacy with recommendations.
    """
    # Minimum recommended samples for different confidence levels
    if sample_size < 30:
        adequacy = "insufficient"
        note = "Sample size below 30 may not provide reliable estimates"
    elif sample_size < 100:
        adequacy = "marginal"
        note = "Results should be interpreted with caution"
    elif sample_size < 400:
        adequacy = "adequate"
        note = "Sample provides reasonable precision for main findings"
    else:
        adequacy = "strong"
        note = "Large sample provides high precision for detailed analysis"
    
    # Calculate achievable margin of error at 50% (worst case)
    worst_case_moe = calculate_margin_of_error(0.5, sample_size)
    
    return {
        "sample_size": sample_size,
        "adequacy": adequacy,
        "note": note,
        "worst_case_moe_percent": round(worst_case_moe * 100, 1),
        "can_detect_difference": round(worst_case_moe * 200, 1)  # Minimum detectable difference
    }


def get_significance_badge(p_value: float) -> Dict[str, str]:
    """
    Get a badge description for statistical significance.
    """
    if p_value < 0.001:
        return {
            "level": "highly_significant",
            "label": "Highly Significant",
            "symbol": "***",
            "color": "green"
        }
    elif p_value < 0.01:
        return {
            "level": "very_significant",
            "label": "Very Significant", 
            "symbol": "**",
            "color": "green"
        }
    elif p_value < 0.05:
        return {
            "level": "significant",
            "label": "Significant",
            "symbol": "*",
            "color": "blue"
        }
    elif p_value < 0.1:
        return {
            "level": "marginally_significant",
            "label": "Marginally Significant",
            "symbol": "†",
            "color": "yellow"
        }
    else:
        return {
            "level": "not_significant",
            "label": "Not Significant",
            "symbol": "ns",
            "color": "gray"
        }
