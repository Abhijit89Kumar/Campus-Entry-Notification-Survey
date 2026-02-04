"""
Suggestion Extractor - Extracts actionable suggestions from comments.
Uses pattern matching to identify constructive feedback.
"""

import re
from typing import List, Dict, Any, Optional
from collections import Counter


# Suggestion patterns - phrases that indicate a suggestion
SUGGESTION_PATTERNS = [
    # Direct suggestions
    r'\bshould\b',
    r'\bcould\b',
    r'\bwould be better\b',
    r'\bwould be good\b',
    r'\bsuggest\b',
    r'\brecommend\b',
    r'\bpropose\b',
    r'\badvise\b',
    # Conditional improvements
    r'\bbetter if\b',
    r'\binstead of\b',
    r'\brather than\b',
    r'\bwhy not\b',
    r'\bwhat if\b',
    r'\bhow about\b',
    # Requests
    r'\bplease\b.*\b(implement|add|consider|allow|provide)\b',
    r'\bneed to\b',
    r'\bmust\b',
    r'\brequire\b',
    # Alternatives
    r'\balternative\b',
    r'\bopt for\b',
    r'\bchoose\b.*\binstead\b',
]

# Suggestion categories
SUGGESTION_CATEGORIES = {
    "process": ["process", "procedure", "system", "method", "way", "approach", "mechanism"],
    "policy": ["policy", "rule", "regulation", "guideline", "norm", "standard"],
    "timing": ["time", "timing", "hour", "day", "night", "midnight", "morning", "evening", "schedule"],
    "communication": ["inform", "notify", "communicate", "message", "sms", "email", "alert"],
    "implementation": ["implement", "execute", "deploy", "install", "setup", "digital", "app", "card"],
    "flexibility": ["flexible", "exception", "emergency", "optional", "choice", "freedom"],
}


class SuggestionExtractor:
    """Extract actionable suggestions from survey comments."""
    
    def __init__(self):
        self.patterns = [re.compile(p, re.IGNORECASE) for p in SUGGESTION_PATTERNS]
    
    def extract(self, comment: str) -> Dict[str, Any]:
        """
        Extract suggestions from a single comment.
        
        Returns:
            Dict with:
            - has_suggestion: bool
            - suggestions: list of extracted suggestion texts
            - categories: list of suggestion categories
            - confidence: float 0-1
        """
        if not comment or not isinstance(comment, str):
            return {
                "has_suggestion": False,
                "suggestions": [],
                "categories": [],
                "confidence": 0.0
            }
        
        comment = comment.strip()
        suggestions = []
        matched_patterns = []
        
        # Find sentences containing suggestion patterns
        sentences = re.split(r'[.!?\n]', comment)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 10:
                continue
            
            for pattern in self.patterns:
                if pattern.search(sentence):
                    matched_patterns.append(pattern.pattern)
                    # Extract the suggestion text
                    if sentence not in suggestions:
                        suggestions.append(sentence[:250])  # Limit length
                    break
        
        # Determine categories
        categories = self._categorize(comment)
        
        # Calculate confidence based on number of matches
        confidence = min(1.0, len(matched_patterns) * 0.3) if matched_patterns else 0.0
        
        return {
            "has_suggestion": len(suggestions) > 0,
            "suggestions": suggestions[:3],  # Max 3 suggestions per comment
            "categories": categories,
            "confidence": round(confidence, 2)
        }
    
    def _categorize(self, text: str) -> List[str]:
        """Categorize the suggestion based on keywords."""
        text_lower = text.lower()
        categories = []
        
        for category, keywords in SUGGESTION_CATEGORIES.items():
            if any(kw in text_lower for kw in keywords):
                categories.append(category)
        
        return categories if categories else ["general"]
    
    def extract_all(self, comments: List[str]) -> Dict[str, Any]:
        """
        Extract and aggregate suggestions from multiple comments.
        
        Returns aggregated statistics and top suggestions.
        """
        all_suggestions = []
        category_counts = Counter()
        suggestion_count = 0
        
        for comment in comments:
            result = self.extract(comment)
            if result["has_suggestion"]:
                suggestion_count += 1
                all_suggestions.extend(result["suggestions"])
                for cat in result["categories"]:
                    category_counts[cat] += 1
        
        # Get top suggestions (unique, by length as proxy for detail)
        unique_suggestions = list(set(all_suggestions))
        unique_suggestions.sort(key=len, reverse=True)
        
        return {
            "total_with_suggestions": suggestion_count,
            "suggestion_rate": round(suggestion_count / len(comments) * 100, 1) if comments else 0,
            "top_suggestions": unique_suggestions[:20],
            "category_breakdown": dict(category_counts.most_common()),
            "top_categories": [cat for cat, _ in category_counts.most_common(5)]
        }


# Singleton instance
suggestion_extractor = SuggestionExtractor()
