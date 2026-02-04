"""
Concern Classifier - Categorizes comments into predefined concern types.
"""

import re
from typing import List, Dict, Tuple, Optional
from collections import Counter
import logging

from config import CONCERN_CATEGORIES
from models.response import ConcernAnalysis

logger = logging.getLogger(__name__)


class ConcernClassifier:
    """
    Classifies comments into predefined concern categories using
    rule-based keyword matching with confidence scoring.
    """
    
    def __init__(self):
        self.categories = CONCERN_CATEGORIES
        self._build_patterns()
    
    def _build_patterns(self):
        """Build regex patterns for each category."""
        self.patterns = {}
        
        for category_id, category_data in self.categories.items():
            keywords = category_data['keywords']
            # Create pattern that matches whole words
            pattern_str = r'\b(' + '|'.join(re.escape(kw) for kw in keywords) + r')\b'
            self.patterns[category_id] = re.compile(pattern_str, re.IGNORECASE)
    
    def classify(self, text: str) -> ConcernAnalysis:
        """
        Classify a comment into concern categories.
        
        Args:
            text: The comment text to classify
            
        Returns:
            ConcernAnalysis with primary/secondary concerns and confidence
        """
        if not text or not isinstance(text, str):
            return ConcernAnalysis()
        
        text = text.strip()
        if len(text) < 3:
            return ConcernAnalysis()
        
        # Count keyword matches per category
        category_scores = {}
        matched_keywords = {}
        
        for category_id, pattern in self.patterns.items():
            matches = pattern.findall(text)
            if matches:
                # Score based on number of unique keywords matched
                unique_matches = list(set(m.lower() for m in matches))
                category_scores[category_id] = len(unique_matches)
                matched_keywords[category_id] = unique_matches
        
        if not category_scores:
            return ConcernAnalysis()
        
        # Sort categories by score
        sorted_categories = sorted(
            category_scores.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        # Primary concern is the one with most matches
        primary = sorted_categories[0][0]
        primary_score = sorted_categories[0][1]
        
        # Secondary concerns are others with significant matches
        secondary = [
            cat_id for cat_id, score in sorted_categories[1:]
            if score >= 1  # At least one keyword match
        ][:3]  # Max 3 secondary concerns
        
        # Calculate confidence based on keyword density
        word_count = len(text.split())
        total_matches = sum(category_scores.values())
        confidence = min(1.0, total_matches / max(word_count * 0.3, 1))
        
        # Collect all matched keywords
        all_keywords = []
        for cat_id in [primary] + secondary:
            if cat_id in matched_keywords:
                all_keywords.extend(matched_keywords[cat_id])
        
        return ConcernAnalysis(
            primary_concern=primary,
            secondary_concerns=secondary,
            confidence=round(confidence, 2),
            matched_keywords=list(set(all_keywords))
        )
    
    def classify_batch(self, texts: List[str]) -> List[ConcernAnalysis]:
        """Classify multiple comments."""
        return [self.classify(text) for text in texts]
    
    def get_concern_distribution(self, analyses: List[ConcernAnalysis]) -> Dict[str, int]:
        """
        Get distribution of primary concerns.
        
        Args:
            analyses: List of ConcernAnalysis objects
            
        Returns:
            Dict mapping concern_id to count
        """
        primary_concerns = [
            a.primary_concern for a in analyses 
            if a.primary_concern is not None
        ]
        return dict(Counter(primary_concerns))
    
    def get_concern_stats(self, analyses: List[ConcernAnalysis]) -> List[Dict]:
        """
        Get detailed statistics for each concern category.
        
        Args:
            analyses: List of ConcernAnalysis objects
            
        Returns:
            List of dicts with concern stats
        """
        distribution = self.get_concern_distribution(analyses)
        total = len([a for a in analyses if a.primary_concern])
        
        stats = []
        for category_id, category_data in self.categories.items():
            count = distribution.get(category_id, 0)
            percentage = (count / total * 100) if total > 0 else 0
            
            stats.append({
                'concern_id': category_id,
                'concern_name': category_data['display_name'],
                'count': count,
                'percentage': round(percentage, 1),
                'color': category_data['color']
            })
        
        # Sort by count descending
        stats.sort(key=lambda x: x['count'], reverse=True)
        return stats
    
    def get_sample_quotes(
        self, 
        texts: List[str], 
        analyses: List[ConcernAnalysis],
        concern_id: str,
        max_quotes: int = 5
    ) -> List[str]:
        """
        Get sample quotes for a specific concern category.
        
        Args:
            texts: List of comment texts
            analyses: Corresponding list of ConcernAnalysis objects
            concern_id: The concern category to get quotes for
            max_quotes: Maximum number of quotes to return
            
        Returns:
            List of representative quotes
        """
        quotes = []
        
        for text, analysis in zip(texts, analyses):
            if analysis.primary_concern == concern_id:
                # Prefer longer, more detailed quotes
                if len(text) > 20:
                    quotes.append((text, len(text)))
        
        # Sort by length (longer = more detailed) and take top N
        quotes.sort(key=lambda x: x[1], reverse=True)
        return [q[0] for q in quotes[:max_quotes]]
    
    def extract_arguments(
        self,
        texts: List[str],
        votes: List[str]
    ) -> Dict[str, List[Dict]]:
        """
        Extract arguments for and against the policy.
        
        Args:
            texts: List of comment texts
            votes: List of votes (Yes/No)
            
        Returns:
            Dict with 'for' and 'against' argument lists
        """
        arguments_for = []
        arguments_against = []
        
        # Group comments by stance
        for_comments = [t for t, v in zip(texts, votes) if v == 'Yes' and t]
        against_comments = [t for t, v in zip(texts, votes) if v == 'No' and t]
        
        # Analyze each group
        for_analyses = self.classify_batch(for_comments)
        against_analyses = self.classify_batch(against_comments)
        
        # Group by primary concern and count
        for_by_concern = {}
        for text, analysis in zip(for_comments, for_analyses):
            concern = analysis.primary_concern or 'other'
            if concern not in for_by_concern:
                for_by_concern[concern] = []
            for_by_concern[concern].append(text)
        
        against_by_concern = {}
        for text, analysis in zip(against_comments, against_analyses):
            concern = analysis.primary_concern or 'other'
            if concern not in against_by_concern:
                against_by_concern[concern] = []
            against_by_concern[concern].append(text)
        
        # Build argument clusters
        for concern_id, comments in sorted(
            for_by_concern.items(), 
            key=lambda x: len(x[1]), 
            reverse=True
        ):
            concern_name = self.categories.get(concern_id, {}).get(
                'display_name', 'Other'
            )
            arguments_for.append({
                'claim': f"Support based on {concern_name.lower()}",
                'reason': concern_name,
                'frequency': len(comments),
                'representative_quotes': comments[:3],
                'stance': 'for'
            })
        
        for concern_id, comments in sorted(
            against_by_concern.items(), 
            key=lambda x: len(x[1]), 
            reverse=True
        ):
            concern_name = self.categories.get(concern_id, {}).get(
                'display_name', 'Other'
            )
            arguments_against.append({
                'claim': f"Opposition due to {concern_name.lower()}",
                'reason': concern_name,
                'frequency': len(comments),
                'representative_quotes': comments[:3],
                'stance': 'against'
            })
        
        return {
            'for': arguments_for,
            'against': arguments_against
        }


# Singleton instance
concern_classifier = ConcernClassifier()
