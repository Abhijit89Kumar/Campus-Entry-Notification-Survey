"""
Sentiment Analyzer - Analyzes sentiment polarity of comments.
Uses a simple lexicon-based approach without heavy dependencies.
"""

import re
from typing import Dict, Any, List, Tuple
from collections import Counter


# Positive words commonly found in survey responses
POSITIVE_WORDS = {
    # Strong positive
    "excellent", "amazing", "wonderful", "fantastic", "great", "perfect",
    "love", "best", "awesome", "brilliant", "outstanding",
    # Moderate positive
    "good", "nice", "helpful", "useful", "beneficial", "appreciate",
    "support", "agree", "favor", "yes", "positive", "happy", "safe",
    "secure", "protect", "important", "necessary", "needed", "welcome",
    # Mild positive
    "okay", "fine", "acceptable", "reasonable", "understandable"
}

# Negative words commonly found in survey responses
NEGATIVE_WORDS = {
    # Strong negative
    "terrible", "horrible", "awful", "worst", "hate", "despise",
    "ridiculous", "absurd", "stupid", "idiotic", "pathetic",
    # Moderate negative
    "bad", "poor", "wrong", "against", "oppose", "disagree", "no",
    "unnecessary", "useless", "pointless", "waste", "invasion",
    "surveillance", "prison", "jail", "restrict", "control", "spy",
    "violate", "intrude", "distrust", "unfair", "unjust",
    # Mild negative
    "concern", "worry", "doubt", "skeptical", "unsure", "uncomfortable"
}

# Intensifiers that modify sentiment
INTENSIFIERS = {
    "very": 1.5,
    "extremely": 2.0,
    "really": 1.3,
    "absolutely": 1.8,
    "completely": 1.7,
    "totally": 1.5,
    "highly": 1.4,
    "strongly": 1.6,
    "somewhat": 0.7,
    "slightly": 0.5,
    "a bit": 0.6,
    "kind of": 0.6,
    "sort of": 0.6
}

# Negation words that flip sentiment
NEGATION_WORDS = {"not", "no", "never", "neither", "nobody", "nothing", 
                   "nowhere", "none", "don't", "doesn't", "didn't", 
                   "won't", "wouldn't", "shouldn't", "couldn't", "can't"}


class SentimentAnalyzer:
    """Analyze sentiment of survey comments."""
    
    def __init__(self):
        self.positive_words = POSITIVE_WORDS
        self.negative_words = NEGATIVE_WORDS
        self.intensifiers = INTENSIFIERS
        self.negation_words = NEGATION_WORDS
    
    def analyze(self, comment: str) -> Dict[str, Any]:
        """
        Analyze sentiment of a single comment.
        
        Returns:
            Dict with:
            - polarity: float from -1 (negative) to +1 (positive)
            - label: "positive", "negative", or "neutral"
            - confidence: float 0-1
            - positive_words: list of positive words found
            - negative_words: list of negative words found
        """
        if not comment or not isinstance(comment, str):
            return {
                "polarity": 0.0,
                "label": "neutral",
                "confidence": 0.0,
                "positive_words": [],
                "negative_words": []
            }
        
        # Tokenize and clean
        words = re.findall(r'\b\w+\b', comment.lower())
        
        pos_score = 0.0
        neg_score = 0.0
        pos_words_found = []
        neg_words_found = []
        
        # Check for negation in context
        negation_active = False
        
        for i, word in enumerate(words):
            # Check for negation
            if word in self.negation_words:
                negation_active = True
                continue
            
            # Check for intensifier
            intensity = 1.0
            if i > 0 and words[i-1] in self.intensifiers:
                intensity = self.intensifiers[words[i-1]]
            
            # Score positive words
            if word in self.positive_words:
                if negation_active:
                    neg_score += intensity
                    neg_words_found.append(f"not {word}")
                else:
                    pos_score += intensity
                    pos_words_found.append(word)
                negation_active = False
            
            # Score negative words
            elif word in self.negative_words:
                if negation_active:
                    pos_score += intensity * 0.5  # Negated negative is weaker positive
                    pos_words_found.append(f"not {word}")
                else:
                    neg_score += intensity
                    neg_words_found.append(word)
                negation_active = False
            
            # Reset negation after a few words
            elif i > 0:
                negation_active = False
        
        # Calculate polarity (-1 to +1)
        total_score = pos_score + neg_score
        if total_score > 0:
            polarity = (pos_score - neg_score) / total_score
        else:
            polarity = 0.0
        
        # Normalize to -1 to +1 range
        polarity = max(-1.0, min(1.0, polarity))
        
        # Determine label
        if polarity > 0.1:
            label = "positive"
        elif polarity < -0.1:
            label = "negative"
        else:
            label = "neutral"
        
        # Confidence based on number of sentiment words found
        confidence = min(1.0, (len(pos_words_found) + len(neg_words_found)) * 0.2)
        
        return {
            "polarity": round(polarity, 3),
            "label": label,
            "confidence": round(confidence, 2),
            "positive_words": list(set(pos_words_found))[:5],
            "negative_words": list(set(neg_words_found))[:5]
        }
    
    def analyze_batch(self, comments: List[str]) -> Dict[str, Any]:
        """
        Analyze sentiment for a batch of comments.
        
        Returns aggregate statistics.
        """
        results = [self.analyze(c) for c in comments]
        
        polarities = [r["polarity"] for r in results]
        labels = [r["label"] for r in results]
        
        label_counts = Counter(labels)
        
        avg_polarity = sum(polarities) / len(polarities) if polarities else 0
        
        return {
            "average_polarity": round(avg_polarity, 3),
            "median_polarity": round(sorted(polarities)[len(polarities)//2], 3) if polarities else 0,
            "positive_count": label_counts.get("positive", 0),
            "negative_count": label_counts.get("negative", 0),
            "neutral_count": label_counts.get("neutral", 0),
            "positive_percent": round(label_counts.get("positive", 0) / len(results) * 100, 1) if results else 0,
            "negative_percent": round(label_counts.get("negative", 0) / len(results) * 100, 1) if results else 0,
            "distribution": {
                "very_negative": len([p for p in polarities if p < -0.5]),
                "negative": len([p for p in polarities if -0.5 <= p < -0.1]),
                "neutral": len([p for p in polarities if -0.1 <= p <= 0.1]),
                "positive": len([p for p in polarities if 0.1 < p <= 0.5]),
                "very_positive": len([p for p in polarities if p > 0.5])
            }
        }
    
    def analyze_by_group(self, comments_by_group: Dict[str, List[str]]) -> Dict[str, Dict]:
        """Analyze sentiment for each group separately."""
        return {
            group: self.analyze_batch(comments)
            for group, comments in comments_by_group.items()
        }


# Singleton instance
sentiment_analyzer = SentimentAnalyzer()
