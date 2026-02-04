"""
Key Findings Generator - Auto-generates ranked insights in plain English.
Analyzes cached analytics data to surface the most important findings.
"""

from typing import Dict, Any, List
from backend.services.confidence import (
    calculate_percentage_with_ci,
    two_proportion_z_test,
    calculate_sample_adequacy
)


class FindingsGenerator:
    """Generate ranked key findings from analytics data."""
    
    def __init__(self, analytics_data: Dict[str, Any]):
        self.data = analytics_data
        self.findings: List[Dict[str, Any]] = []
    
    def generate_all_findings(self) -> List[Dict[str, Any]]:
        """Generate all findings and return them ranked by importance."""
        self.findings = []
        
        # Generate different types of findings
        self._generate_opposition_findings()
        self._generate_concern_findings()
        self._generate_demographic_findings()
        self._generate_quality_findings()
        self._generate_sentiment_findings()
        self._generate_suggestion_findings()
        self._generate_consensus_findings()
        
        # Sort by importance score
        self.findings.sort(key=lambda x: x["importance"], reverse=True)
        
        # Return top 10 findings
        return self.findings[:10]
    
    def _add_finding(
        self,
        text: str,
        category: str,
        importance: int,
        confidence: str,
        data_reference: str,
        supporting_stat: str = None
    ):
        """Add a finding to the list."""
        self.findings.append({
            "text": text,
            "category": category,
            "importance": importance,
            "confidence": confidence,
            "data_reference": data_reference,
            "supporting_stat": supporting_stat
        })
    
    def _generate_opposition_findings(self):
        """Generate findings about overall opposition levels."""
        overview = self.data.get("overview", {})
        total = overview.get("total_responses", 0)
        
        if total == 0:
            return
        
        # Q1 Opposition
        q1_support = overview.get("q1_support_percent", 0)
        q1_oppose = 100 - q1_support
        q1_oppose_count = overview.get("q1_oppose_count", 0)
        
        # Q2 Opposition
        q2_support = overview.get("q2_support_percent", 0)
        q2_oppose = 100 - q2_support
        q2_oppose_count = overview.get("q2_oppose_count", 0)
        
        # Generate Q1 finding
        if q1_oppose >= 80:
            text = f"Overwhelming majority ({q1_oppose:.1f}%) oppose the parent notification policy"
            importance = 100
            confidence = "high"
        elif q1_oppose >= 60:
            text = f"Clear majority ({q1_oppose:.1f}%) oppose the parent notification policy"
            importance = 95
            confidence = "high"
        elif q1_oppose >= 50:
            text = f"Majority ({q1_oppose:.1f}%) oppose the parent notification policy"
            importance = 90
            confidence = "high"
        else:
            text = f"Minority ({q1_oppose:.1f}%) oppose the parent notification policy"
            importance = 70
            confidence = "high"
        
        self._add_finding(
            text=text,
            category="opposition",
            importance=importance,
            confidence=confidence,
            data_reference="Q1 vote results",
            supporting_stat=f"{q1_oppose_count} of {total} students"
        )
        
        # Generate Q2 finding (usually similar but important to note)
        if abs(q1_oppose - q2_oppose) < 5:
            text = f"Opposition to 24/7 monitoring ({q2_oppose:.1f}%) is consistent with notification opposition"
            importance = 75
        else:
            diff = q2_oppose - q1_oppose
            direction = "higher" if diff > 0 else "lower"
            text = f"Opposition to 24/7 monitoring is {abs(diff):.1f}pp {direction} than notification opposition"
            importance = 80
        
        self._add_finding(
            text=text,
            category="opposition",
            importance=importance,
            confidence="high",
            data_reference="Q1 vs Q2 comparison",
            supporting_stat=f"Q1: {q1_oppose:.1f}% vs Q2: {q2_oppose:.1f}%"
        )
    
    def _generate_concern_findings(self):
        """Generate findings about top concerns."""
        concerns = self.data.get("concerns", [])
        
        if not concerns:
            return
        
        # Top concern
        top_concern = concerns[0]
        if top_concern["count"] > 0:
            text = f"{top_concern['concern_name']} is the dominant concern, mentioned by {top_concern['count']} students ({top_concern['percentage']:.1f}%)"
            
            self._add_finding(
                text=text,
                category="concern",
                importance=85,
                confidence="high" if top_concern["count"] >= 50 else "medium",
                data_reference="Concern analysis",
                supporting_stat=f"{top_concern['count']} mentions"
            )
        
        # Check if concerns are concentrated or distributed
        if len(concerns) >= 3:
            top3_pct = sum(c["percentage"] for c in concerns[:3])
            if top3_pct >= 70:
                text = f"Three concerns dominate feedback: {concerns[0]['concern_name']}, {concerns[1]['concern_name']}, and {concerns[2]['concern_name']}"
                importance = 70
            else:
                text = "Student concerns are distributed across multiple categories"
                importance = 60
            
            self._add_finding(
                text=text,
                category="concern",
                importance=importance,
                confidence="medium",
                data_reference="Concern distribution",
                supporting_stat=f"Top 3 = {top3_pct:.1f}% of mentions"
            )
    
    def _generate_demographic_findings(self):
        """Generate findings about demographic patterns."""
        demographics = self.data.get("demographics", {})
        
        # Analyze by course
        by_course = demographics.get("by_course", [])
        if len(by_course) >= 2:
            self._analyze_demographic_differences(by_course, "course")
        
        # Analyze by year
        by_year = demographics.get("by_year", [])
        if len(by_year) >= 2:
            self._analyze_demographic_differences(by_year, "year")
    
    def _analyze_demographic_differences(self, groups: List[Dict], group_type: str):
        """Analyze differences between demographic groups."""
        if len(groups) < 2:
            return
        
        # Find max and min support for Q1
        max_group = max(groups, key=lambda x: x.get("q1_yes_percent", 0))
        min_group = min(groups, key=lambda x: x.get("q1_yes_percent", 0))
        
        max_support = max_group.get("q1_yes_percent", 0)
        min_support = min_group.get("q1_yes_percent", 0)
        difference = max_support - min_support
        
        if difference >= 15:
            # Significant difference
            text = f"{max_group['category']} students are {difference:.1f}pp more supportive than {min_group['category']} students"
            importance = 80
            confidence = "high" if max_group["total"] >= 50 and min_group["total"] >= 50 else "medium"
        elif difference >= 5:
            text = f"Moderate variation in support across {group_type}s (range: {difference:.1f}pp)"
            importance = 65
            confidence = "medium"
        else:
            text = f"Support levels are consistent across all {group_type}s (within {difference:.1f}pp)"
            importance = 60
            confidence = "high"
        
        self._add_finding(
            text=text,
            category="demographic",
            importance=importance,
            confidence=confidence,
            data_reference=f"{group_type.title()} breakdown",
            supporting_stat=f"{max_group['category']}: {max_support:.1f}% vs {min_group['category']}: {min_support:.1f}%"
        )
    
    def _generate_quality_findings(self):
        """Generate findings about data quality."""
        overview = self.data.get("overview", {})
        quality = self.data.get("quality", {})
        
        total = overview.get("total_responses", 0)
        valid = overview.get("valid_responses", 0)
        flagged = overview.get("flagged_responses", 0)
        
        if total == 0:
            return
        
        valid_pct = (valid / total) * 100
        
        if valid_pct >= 90:
            text = f"High data quality: {valid_pct:.1f}% of responses passed quality checks"
            importance = 50
            confidence = "high"
        elif valid_pct >= 75:
            text = f"Good data quality: {valid_pct:.1f}% of responses are valid"
            importance = 45
            confidence = "high"
        else:
            text = f"Data quality concern: only {valid_pct:.1f}% of responses passed quality checks"
            importance = 70
            confidence = "high"
        
        self._add_finding(
            text=text,
            category="quality",
            importance=importance,
            confidence=confidence,
            data_reference="Quality analysis",
            supporting_stat=f"{valid} valid, {flagged} flagged"
        )
        
        # Sample adequacy
        adequacy = calculate_sample_adequacy(total)
        if adequacy["adequacy"] in ["strong", "adequate"]:
            text = f"Sample size ({total:,} responses) provides statistically reliable results"
            self._add_finding(
                text=text,
                category="quality",
                importance=55,
                confidence="high",
                data_reference="Statistical adequacy",
                supporting_stat=f"Margin of error: ±{adequacy['worst_case_moe_percent']}%"
            )
    
    def _generate_sentiment_findings(self):
        """Generate findings about overall sentiment."""
        sentiment = self.data.get("sentiment", {})
        overall = sentiment.get("overall", {})
        
        if not overall:
            return
        
        avg_polarity = overall.get("average_polarity", 0)
        negative_pct = overall.get("negative_percent", 0)
        positive_pct = overall.get("positive_percent", 0)
        
        if avg_polarity < -0.2:
            text = f"Comments are predominantly negative in tone ({negative_pct:.1f}% negative vs {positive_pct:.1f}% positive)"
            importance = 75
        elif avg_polarity > 0.2:
            text = f"Comments are predominantly positive in tone"
            importance = 65
        else:
            text = f"Comment sentiment is mixed ({negative_pct:.1f}% negative, {positive_pct:.1f}% positive)"
            importance = 55
        
        self._add_finding(
            text=text,
            category="sentiment",
            importance=importance,
            confidence="medium",
            data_reference="Sentiment analysis",
            supporting_stat=f"Average polarity: {avg_polarity:.2f}"
        )
    
    def _generate_suggestion_findings(self):
        """Generate findings about student suggestions."""
        suggestions = self.data.get("suggestions", {})
        aggregated = suggestions.get("aggregated", {})
        
        total_with_suggestions = aggregated.get("total_with_suggestions", 0)
        suggestion_rate = aggregated.get("suggestion_rate", 0)
        top_categories = aggregated.get("top_categories", [])
        
        if total_with_suggestions > 0:
            text = f"{total_with_suggestions} students ({suggestion_rate:.1f}%) provided constructive suggestions"
            
            self._add_finding(
                text=text,
                category="suggestions",
                importance=70,
                confidence="high",
                data_reference="Suggestion analysis",
                supporting_stat=f"Top category: {top_categories[0] if top_categories else 'N/A'}"
            )
            
            if top_categories:
                text = f"Most suggestions relate to: {', '.join(top_categories[:3])}"
                self._add_finding(
                    text=text,
                    category="suggestions",
                    importance=65,
                    confidence="medium",
                    data_reference="Suggestion categories"
                )
    
    def _generate_consensus_findings(self):
        """Generate findings about consensus or division."""
        cross_tab = self.data.get("cross_tabulation", {})
        
        if not cross_tab:
            return
        
        correlation = cross_tab.get("correlation_coefficient", 0)
        yes_yes_pct = cross_tab.get("yes_yes_percent", 0)
        no_no_pct = cross_tab.get("no_no_percent", 0)
        
        consistency = yes_yes_pct + no_no_pct
        
        if consistency >= 80:
            text = f"Strong consistency: {consistency:.1f}% of students voted the same way on both questions"
            importance = 72
        elif consistency >= 60:
            text = f"Moderate consistency: {consistency:.1f}% voted consistently on both questions"
            importance = 60
        else:
            text = f"Students distinguish between the two policies (only {consistency:.1f}% voted consistently)"
            importance = 68
        
        self._add_finding(
            text=text,
            category="consensus",
            importance=importance,
            confidence="high",
            data_reference="Cross-tabulation",
            supporting_stat=f"Correlation: {correlation:.2f}"
        )


def generate_key_findings(analytics_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function to generate key findings from analytics data.
    
    Returns structured response with findings list and metadata.
    """
    generator = FindingsGenerator(analytics_data)
    findings = generator.generate_all_findings()
    
    # Add executive summary (top 3 findings concatenated)
    executive_summary = ". ".join(f["text"] for f in findings[:3]) + "."
    
    return {
        "findings": findings,
        "total_findings": len(findings),
        "executive_summary": executive_summary,
        "categories": {
            "opposition": len([f for f in findings if f["category"] == "opposition"]),
            "concern": len([f for f in findings if f["category"] == "concern"]),
            "demographic": len([f for f in findings if f["category"] == "demographic"]),
            "quality": len([f for f in findings if f["category"] == "quality"]),
            "sentiment": len([f for f in findings if f["category"] == "sentiment"]),
            "suggestions": len([f for f in findings if f["category"] == "suggestions"]),
            "consensus": len([f for f in findings if f["category"] == "consensus"]),
        }
    }
