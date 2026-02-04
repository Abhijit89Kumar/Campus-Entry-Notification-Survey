"""
Recommendations Engine - Generates actionable policy recommendations based on data patterns.
Translates analytics findings into practical suggestions for administrators.
"""

from typing import Dict, Any, List


class RecommendationsEngine:
    """Generate data-driven policy recommendations."""
    
    def __init__(self, analytics_data: Dict[str, Any]):
        self.data = analytics_data
        self.recommendations: List[Dict[str, Any]] = []
    
    def generate_all_recommendations(self) -> List[Dict[str, Any]]:
        """Generate all recommendations based on data patterns."""
        self.recommendations = []
        
        # Analyze patterns and generate recommendations
        self._analyze_opposition_level()
        self._analyze_top_concerns()
        self._analyze_demographic_gaps()
        self._analyze_suggestions()
        self._analyze_data_quality()
        self._analyze_consensus()
        
        # Sort by priority
        priority_order = {"high": 0, "medium": 1, "low": 2}
        self.recommendations.sort(key=lambda x: priority_order.get(x["priority"], 99))
        
        # Return top 5 recommendations
        return self.recommendations[:5]
    
    def _add_recommendation(
        self,
        title: str,
        description: str,
        priority: str,
        justification: str,
        action_items: List[str],
        category: str
    ):
        """Add a recommendation to the list."""
        self.recommendations.append({
            "title": title,
            "description": description,
            "priority": priority,
            "justification": justification,
            "action_items": action_items,
            "category": category
        })
    
    def _analyze_opposition_level(self):
        """Generate recommendations based on opposition levels."""
        overview = self.data.get("overview", {})
        q1_support = overview.get("q1_support_percent", 0)
        q1_oppose = 100 - q1_support
        
        if q1_oppose >= 80:
            self._add_recommendation(
                title="Reconsider Policy Approach",
                description="With overwhelming opposition, consider fundamental policy alternatives or significant modifications before implementation.",
                priority="high",
                justification=f"{q1_oppose:.1f}% of students oppose the current policy proposal",
                action_items=[
                    "Convene stakeholder discussions to explore alternative approaches",
                    "Identify core objectives and explore different mechanisms to achieve them",
                    "Consider pilot programs with voluntary participation before mandates"
                ],
                category="policy"
            )
        elif q1_oppose >= 60:
            self._add_recommendation(
                title="Address Concerns Before Implementation",
                description="Majority opposition suggests the policy needs refinement and better communication before proceeding.",
                priority="high",
                justification=f"{q1_oppose:.1f}% opposition indicates significant resistance",
                action_items=[
                    "Conduct town halls to discuss policy rationale and address concerns",
                    "Develop clear communication about how privacy will be protected",
                    "Consider phased implementation with feedback mechanisms"
                ],
                category="policy"
            )
        elif q1_oppose >= 40:
            self._add_recommendation(
                title="Proactive Communication Strategy",
                description="Significant minority opposition warrants proactive engagement to build understanding.",
                priority="medium",
                justification=f"{q1_oppose:.1f}% oppose, indicating notable concerns remain",
                action_items=[
                    "Develop FAQ documents addressing common concerns",
                    "Establish clear feedback channels for ongoing concerns",
                    "Monitor sentiment after implementation"
                ],
                category="communication"
            )
    
    def _analyze_top_concerns(self):
        """Generate recommendations based on top concerns."""
        concerns = self.data.get("concerns", [])
        
        if not concerns:
            return
        
        top_concern = concerns[0] if concerns else None
        
        if top_concern and top_concern["count"] > 0:
            concern_id = top_concern["concern_id"]
            concern_name = top_concern["concern_name"]
            
            # Map concerns to specific recommendations
            concern_recommendations = {
                "privacy": {
                    "title": "Address Privacy Concerns Explicitly",
                    "description": "Privacy is the top student concern. Policy communication must directly address data handling and privacy protections.",
                    "action_items": [
                        "Publish clear data retention and access policies",
                        "Specify who can access entry/exit data and under what circumstances",
                        "Consider data minimization - collect only what's necessary",
                        "Provide students with access to their own data logs"
                    ]
                },
                "autonomy": {
                    "title": "Respect Student Autonomy",
                    "description": "Students value their independence as adults. Consider how to balance safety with autonomy.",
                    "action_items": [
                        "Acknowledge students as adults in policy framing",
                        "Consider opt-out provisions for certain situations",
                        "Frame policy around mutual safety rather than surveillance"
                    ]
                },
                "trust": {
                    "title": "Build Trust Through Transparency",
                    "description": "Trust concerns indicate students feel the policy reflects distrust of them. Work to rebuild mutual trust.",
                    "action_items": [
                        "Involve student representatives in policy refinement",
                        "Be transparent about the reasons driving this policy",
                        "Create accountability mechanisms for policy administrators"
                    ]
                },
                "safety": {
                    "title": "Clarify Safety Benefits",
                    "description": "Some students cite safety concerns. Leverage this by clearly articulating safety benefits.",
                    "action_items": [
                        "Provide data on how this policy improves safety",
                        "Share examples of how similar policies have helped",
                        "Ensure emergency procedures are clearly communicated"
                    ]
                },
                "parental": {
                    "title": "Refine Parental Notification Scope",
                    "description": "Concerns about parental involvement suggest students want clearer boundaries.",
                    "action_items": [
                        "Define specific scenarios that trigger notifications",
                        "Consider notification only for genuine emergencies",
                        "Allow students to set their own emergency contacts"
                    ]
                },
                "necessity": {
                    "title": "Justify Policy Necessity",
                    "description": "Students question whether this policy is necessary. Provide clear justification.",
                    "action_items": [
                        "Present data or incidents that motivated this policy",
                        "Explain what alternatives were considered and why rejected",
                        "Commit to reviewing necessity periodically"
                    ]
                }
            }
            
            if concern_id in concern_recommendations:
                rec = concern_recommendations[concern_id]
                self._add_recommendation(
                    title=rec["title"],
                    description=rec["description"],
                    priority="high",
                    justification=f"{concern_name} mentioned by {top_concern['count']} students ({top_concern['percentage']:.1f}%)",
                    action_items=rec["action_items"],
                    category="concern"
                )
    
    def _analyze_demographic_gaps(self):
        """Generate recommendations if significant demographic differences exist."""
        demographics = self.data.get("demographics", {})
        by_course = demographics.get("by_course", [])
        
        if len(by_course) < 2:
            return
        
        # Find largest gap
        max_group = max(by_course, key=lambda x: x.get("q1_yes_percent", 0))
        min_group = min(by_course, key=lambda x: x.get("q1_yes_percent", 0))
        
        gap = max_group.get("q1_yes_percent", 0) - min_group.get("q1_yes_percent", 0)
        
        if gap >= 15:
            self._add_recommendation(
                title="Tailored Communication by Group",
                description=f"Significant opinion gap between student groups suggests different concerns may be at play.",
                priority="medium",
                justification=f"{gap:.1f}pp difference between {max_group['category']} and {min_group['category']}",
                action_items=[
                    f"Investigate specific concerns of {min_group['category']} students",
                    "Consider focus groups with each demographic",
                    "Develop targeted communication addressing group-specific concerns"
                ],
                category="demographic"
            )
    
    def _analyze_suggestions(self):
        """Generate recommendations from student suggestions."""
        suggestions = self.data.get("suggestions", {})
        aggregated = suggestions.get("aggregated", {})
        
        top_categories = aggregated.get("top_categories", [])
        category_breakdown = aggregated.get("category_breakdown", {})
        
        if "timing" in top_categories[:3] and category_breakdown.get("timing", 0) > 50:
            self._add_recommendation(
                title="Evaluate Timing Flexibility",
                description="Many students suggest timing-related modifications. Consider flexible implementation.",
                priority="medium",
                justification=f"{category_breakdown.get('timing', 0)} suggestions related to timing",
                action_items=[
                    "Review suggestions about notification timing",
                    "Consider different rules for different times of day",
                    "Evaluate weekend vs. weekday policies"
                ],
                category="suggestions"
            )
        
        if "flexibility" in top_categories[:3] and category_breakdown.get("flexibility", 0) > 50:
            self._add_recommendation(
                title="Build in Flexibility Mechanisms",
                description="Students seek flexibility in policy application. Consider exceptions framework.",
                priority="medium",
                justification=f"{category_breakdown.get('flexibility', 0)} suggestions about flexibility",
                action_items=[
                    "Define clear exception procedures",
                    "Create emergency override provisions",
                    "Allow customization where feasible"
                ],
                category="suggestions"
            )
    
    def _analyze_data_quality(self):
        """Generate recommendations about data reliability."""
        overview = self.data.get("overview", {})
        total = overview.get("total_responses", 0)
        valid = overview.get("valid_responses", 0)
        
        if total == 0:
            return
        
        valid_pct = (valid / total) * 100
        
        if valid_pct < 75:
            self._add_recommendation(
                title="Consider Survey Methodology Review",
                description="Lower quality response rate suggests survey design improvements may be needed for future data collection.",
                priority="low",
                justification=f"Only {valid_pct:.1f}% of responses passed quality checks",
                action_items=[
                    "Review survey length and complexity",
                    "Consider incentives for thoughtful responses",
                    "Add attention check questions in future surveys"
                ],
                category="methodology"
            )
    
    def _analyze_consensus(self):
        """Generate recommendations based on Q1/Q2 consensus patterns."""
        cross_tab = self.data.get("cross_tabulation", {})
        
        if not cross_tab:
            return
        
        yes_no_pct = cross_tab.get("yes_no_percent", 0)  # Support Q1, oppose Q2
        no_yes_pct = cross_tab.get("no_yes_percent", 0)  # Oppose Q1, support Q2
        
        # If many people distinguish between the policies
        if yes_no_pct >= 10 or no_yes_pct >= 10:
            self._add_recommendation(
                title="Consider Policies Separately",
                description="Students distinguish between notification and monitoring policies. Consider implementing or communicating them independently.",
                priority="medium",
                justification=f"{yes_no_pct + no_yes_pct:.1f}% voted differently on the two questions",
                action_items=[
                    "Evaluate each policy on its own merits",
                    "Consider implementing the more accepted policy first",
                    "Use staged implementation to build trust"
                ],
                category="policy"
            )


def generate_recommendations(analytics_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function to generate recommendations from analytics data.
    
    Returns structured response with recommendations list and summary.
    """
    engine = RecommendationsEngine(analytics_data)
    recommendations = engine.generate_all_recommendations()
    
    # Count by priority
    high_count = len([r for r in recommendations if r["priority"] == "high"])
    medium_count = len([r for r in recommendations if r["priority"] == "medium"])
    low_count = len([r for r in recommendations if r["priority"] == "low"])
    
    # Generate summary
    if high_count > 0:
        summary = f"There are {high_count} high-priority recommendation(s) that should be addressed before policy implementation."
    elif medium_count > 0:
        summary = f"There are {medium_count} medium-priority recommendation(s) to improve policy acceptance."
    else:
        summary = "Current data suggests proceeding with standard implementation practices."
    
    return {
        "recommendations": recommendations,
        "total": len(recommendations),
        "by_priority": {
            "high": high_count,
            "medium": medium_count,
            "low": low_count
        },
        "summary": summary
    }
