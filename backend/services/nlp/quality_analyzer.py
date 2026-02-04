"""
Data Quality Analyzer - Detects troll responses, spam, and low-quality submissions.
"""

import re
import string
from typing import List, Dict, Tuple, Set
from collections import Counter
import logging

from config import (
    QUALITY_THRESHOLDS,
    PROFANITY_WORDS,
    KEYBOARD_PATTERNS
)
from models.response import QualityResult, QualityFlag

logger = logging.getLogger(__name__)


class QualityAnalyzer:
    """
    Analyzes response quality and detects problematic submissions.
    """
    
    def __init__(self):
        # Build profanity detection patterns (including leetspeak)
        self.profanity_patterns = self._build_profanity_patterns()
        
        # Common English words for dictionary check
        self.common_words = self._load_common_words()
        
        # Keyboard spam patterns
        self.keyboard_patterns = [p.lower() for p in KEYBOARD_PATTERNS]
    
    def _build_profanity_patterns(self) -> List[re.Pattern]:
        """Build regex patterns for profanity detection including leetspeak."""
        patterns = []
        
        # Leetspeak substitutions
        leetspeak = {
            'a': '[a@4]',
            'e': '[e3]',
            'i': '[i1!]',
            'o': '[o0]',
            's': '[s$5]',
            't': '[t7]',
            'l': '[l1]',
        }
        
        for word in PROFANITY_WORDS:
            # Create pattern with leetspeak variants
            pattern_str = ''
            for char in word.lower():
                if char in leetspeak:
                    pattern_str += leetspeak[char]
                else:
                    pattern_str += re.escape(char)
            
            # Allow repeated characters (e.g., "fuuuck")
            pattern_str = ''.join(f'{c}+' if c.isalpha() else c for c in pattern_str)
            
            patterns.append(re.compile(pattern_str, re.IGNORECASE))
        
        return patterns
    
    def _load_common_words(self) -> Set[str]:
        """Load a basic set of common English words."""
        # Basic common words - in production, use a proper word list
        common = {
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
            'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
            'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
            'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
            'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
            'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
            'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
            'is', 'are', 'was', 'were', 'been', 'being', 'am', 'has', 'had', 'having',
            'does', 'did', 'doing', 'should', 'must', 'need', 'may', 'might', 'shall',
            # Domain-specific words
            'privacy', 'parents', 'student', 'students', 'campus', 'entry', 'exit',
            'notification', 'system', 'support', 'policy', 'monitoring', 'adult',
            'adults', 'college', 'university', 'safety', 'security', 'trust',
            'necessary', 'unnecessary', 'important', 'concern', 'concerns',
            'yes', 'no', 'agree', 'disagree', 'think', 'believe', 'feel',
            'reason', 'because', 'why', 'how', 'what', 'where', 'when',
        }
        return common
    
    def analyze(self, text: str, vote_q1: str = None, vote_q2: str = None) -> QualityResult:
        """
        Analyze the quality of a response.
        
        Args:
            text: The comment text to analyze
            vote_q1: Vote for Q1 (Yes/No) for consistency check
            vote_q2: Vote for Q2 (Yes/No) for consistency check
            
        Returns:
            QualityResult with score and flags
        """
        if not text or not isinstance(text, str):
            return QualityResult(
                score=0,
                flags=[QualityFlag.TOO_SHORT],
                is_valid=False,
                needs_review=False
            )
        
        text = text.strip()
        flags = []
        deductions = []
        
        # Check 1: Too short
        word_count = len(text.split())
        if word_count < QUALITY_THRESHOLDS['min_word_count']:
            flags.append(QualityFlag.TOO_SHORT)
            deductions.append(40)
        
        # Check 2: Gibberish (entropy + dictionary ratio)
        if self._is_gibberish(text):
            flags.append(QualityFlag.GIBBERISH)
            deductions.append(50)
        
        # Check 3: Keyboard spam
        if self._has_keyboard_pattern(text):
            flags.append(QualityFlag.KEYBOARD_SPAM)
            deductions.append(60)
        
        # Check 4: Repeated characters
        if self._has_excessive_repetition(text):
            flags.append(QualityFlag.CHAR_REPETITION)
            deductions.append(20)
        
        # Check 5: Profanity
        if self._contains_profanity(text):
            flags.append(QualityFlag.PROFANITY)
            deductions.append(30)
        
        # Check 6: All caps rage
        if self._is_all_caps_rage(text):
            flags.append(QualityFlag.ALL_CAPS)
            deductions.append(15)
        
        # Check 7: Low dictionary ratio
        dict_ratio = self._dictionary_word_ratio(text)
        if dict_ratio < 0.4 and word_count >= 3:
            flags.append(QualityFlag.LOW_DICTIONARY_RATIO)
            deductions.append(35)
        
        # Check 8: Vote-comment mismatch (if votes provided)
        if vote_q1 and self._has_vote_mismatch(text, vote_q1):
            flags.append(QualityFlag.VOTE_MISMATCH)
            deductions.append(10)  # Small deduction, might be intentional
        
        # Calculate final score
        score = max(0, 100 - sum(deductions))
        
        # Determine validity
        is_valid = score >= QUALITY_THRESHOLDS['min_valid_score']
        needs_review = QUALITY_THRESHOLDS['min_valid_score'] <= score < QUALITY_THRESHOLDS['review_threshold']
        
        return QualityResult(
            score=score,
            flags=flags,
            is_valid=is_valid,
            needs_review=needs_review
        )
    
    def _is_gibberish(self, text: str) -> bool:
        """Check if text is gibberish using character patterns."""
        text_lower = text.lower()
        
        # Remove punctuation for analysis
        text_clean = ''.join(c for c in text_lower if c.isalnum() or c.isspace())
        
        if len(text_clean) < 3:
            return True
        
        # Check for repeated patterns (e.g., "abcabcabc")
        if len(text_clean) >= 6:
            for pattern_len in range(2, 4):
                pattern = text_clean[:pattern_len]
                repeated = (pattern * (len(text_clean) // pattern_len + 1))[:len(text_clean)]
                if text_clean == repeated:
                    return True
        
        # Check consonant-to-vowel ratio (real text has reasonable ratio)
        vowels = sum(1 for c in text_clean if c in 'aeiou')
        consonants = sum(1 for c in text_clean if c.isalpha() and c not in 'aeiou')
        
        if consonants > 0 and vowels / consonants < 0.1:
            return True
        
        return False
    
    def _has_keyboard_pattern(self, text: str) -> bool:
        """Check for keyboard spam patterns."""
        text_lower = text.lower().replace(' ', '')
        
        for pattern in self.keyboard_patterns:
            if pattern in text_lower:
                return True
        
        return False
    
    def _has_excessive_repetition(self, text: str) -> bool:
        """Check for excessive character repetition."""
        # Pattern: same character 4+ times in a row
        pattern = re.compile(r'(.)\1{3,}')
        matches = pattern.findall(text)
        
        return len(matches) > 0
    
    def _contains_profanity(self, text: str) -> bool:
        """Check for profanity including leetspeak variants."""
        for pattern in self.profanity_patterns:
            if pattern.search(text):
                return True
        return False
    
    def _is_all_caps_rage(self, text: str) -> bool:
        """Check if text is mostly uppercase (angry typing)."""
        if len(text) < 10:
            return False
        
        letters = [c for c in text if c.isalpha()]
        if not letters:
            return False
        
        uppercase_ratio = sum(1 for c in letters if c.isupper()) / len(letters)
        return uppercase_ratio > 0.8
    
    def _dictionary_word_ratio(self, text: str) -> float:
        """Calculate ratio of words that are in the dictionary."""
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        
        if not words:
            return 0.0
        
        dict_words = sum(1 for w in words if w in self.common_words)
        return dict_words / len(words)
    
    def _has_vote_mismatch(self, text: str, vote: str) -> bool:
        """Check if comment sentiment contradicts the vote."""
        text_lower = text.lower()
        
        # Strong negative indicators
        negative_phrases = [
            'terrible', 'stupid', 'idiotic', 'worst', 'hate', 'awful',
            'ridiculous', 'absurd', 'waste', 'useless', 'pointless',
            'against this', 'oppose', 'disagree', 'should not', "shouldn't",
            'never', 'no way', 'absolutely not'
        ]
        
        # Strong positive indicators
        positive_phrases = [
            'great', 'excellent', 'support', 'agree', 'good idea',
            'necessary', 'important', 'helpful', 'beneficial',
            'should implement', 'must have', 'need this'
        ]
        
        has_negative = any(phrase in text_lower for phrase in negative_phrases)
        has_positive = any(phrase in text_lower for phrase in positive_phrases)
        
        if vote == 'Yes' and has_negative and not has_positive:
            return True
        if vote == 'No' and has_positive and not has_negative:
            return True
        
        return False
    
    def find_duplicates(self, comments: List[str], threshold: float = 0.9) -> List[Dict]:
        """
        Find duplicate or near-duplicate comments.
        
        Args:
            comments: List of comment texts
            threshold: Similarity threshold for considering duplicates
            
        Returns:
            List of duplicate groups
        """
        from difflib import SequenceMatcher
        
        duplicates = []
        processed = set()
        
        for i, comment1 in enumerate(comments):
            if i in processed or not comment1:
                continue
            
            group = [i]
            comment1_clean = comment1.lower().strip()
            
            for j, comment2 in enumerate(comments[i+1:], i+1):
                if j in processed or not comment2:
                    continue
                
                comment2_clean = comment2.lower().strip()
                
                # Exact match
                if comment1_clean == comment2_clean:
                    group.append(j)
                    processed.add(j)
                    continue
                
                # Fuzzy match
                similarity = SequenceMatcher(None, comment1_clean, comment2_clean).ratio()
                if similarity >= threshold:
                    group.append(j)
                    processed.add(j)
            
            if len(group) > 1:
                duplicates.append({
                    'indices': group,
                    'sample_text': comment1[:100],
                    'count': len(group)
                })
                processed.add(i)
        
        return duplicates


# Singleton instance
quality_analyzer = QualityAnalyzer()
