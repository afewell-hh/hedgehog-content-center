"""
Quality control system for KB entry content validation.
Implements rubric-based evaluation and validation checks.
"""

import json
from typing import Dict, List, Tuple
from dataclasses import dataclass
import openai
from bs4 import BeautifulSoup
import re

@dataclass
class QualityMetrics:
    technical_accuracy: float
    educational_value: float
    seo_optimization: float
    content_structure: float
    overall_score: float
    recommendations: List[str]
    validation_status: str
    validation_details: str

class QualityControl:
    def __init__(self, openai_api_key: str):
        """Initialize the quality control system."""
        self.openai_api_key = openai_api_key
        self.min_scores = {
            "technical_accuracy": 8.0,
            "educational_value": 7.0,
            "seo_optimization": 7.0,
            "content_structure": 8.0,
            "overall": 7.5
        }
    
    async def evaluate_entry(self, title: str, subtitle: str, body: str, 
                           keywords: List[str], research_data: Dict) -> QualityMetrics:
        """Evaluate a KB entry against quality standards."""
        # Run all evaluations
        technical_score = await self._evaluate_technical_accuracy(
            title, subtitle, body, research_data
        )
        educational_score = await self._evaluate_educational_value(
            subtitle, body
        )
        seo_score = await self._evaluate_seo(
            title, subtitle, body, keywords
        )
        structure_score = await self._evaluate_structure(
            subtitle, body
        )
        
        # Calculate overall score
        overall_score = sum([
            technical_score * 0.35,  # Highest weight for technical accuracy
            educational_score * 0.25,
            seo_score * 0.20,
            structure_score * 0.20
        ])
        
        # Get recommendations
        recommendations = await self._generate_recommendations(
            technical_score, educational_score, seo_score, structure_score,
            title, subtitle, body, keywords
        )
        
        # Determine validation status
        validation_status, validation_details = self._validate_scores(
            technical_score, educational_score, seo_score, 
            structure_score, overall_score
        )
        
        return QualityMetrics(
            technical_accuracy=technical_score,
            educational_value=educational_score,
            seo_optimization=seo_score,
            content_structure=structure_score,
            overall_score=overall_score,
            recommendations=recommendations,
            validation_status=validation_status,
            validation_details=validation_details
        )
    
    async def _evaluate_technical_accuracy(self, title: str, subtitle: str, 
                                         body: str, research_data: Dict) -> float:
        """Evaluate technical accuracy of the content."""
        evaluation_prompt = f"""
        Evaluate the technical accuracy of this KB entry:
        
        Title: {title}
        Subtitle: {subtitle}
        Body: {body}
        
        Research Data: {json.dumps(research_data)}
        
        Score from 0-10 based on:
        1. Factual correctness
        2. Industry standard alignment
        3. Technical depth appropriateness
        4. Verified Hedgehog claims
        
        Return score and explanation in JSON:
        {{
            "score": float,
            "explanation": string
        }}
        """
        
        result = await self._get_gpt4_evaluation(evaluation_prompt)
        return float(result["score"]) if result else 0.0
    
    async def _evaluate_educational_value(self, subtitle: str, body: str) -> float:
        """Evaluate educational value of the content."""
        evaluation_prompt = f"""
        Evaluate the educational value of this KB entry:
        
        Subtitle: {subtitle}
        Body: {body}
        
        Score from 0-10 based on:
        1. Concept clarity
        2. Logical progression
        3. Practical examples
        4. Prerequisite handling
        
        Return score and explanation in JSON:
        {{
            "score": float,
            "explanation": string
        }}
        """
        
        result = await self._get_gpt4_evaluation(evaluation_prompt)
        return float(result["score"]) if result else 0.0
    
    async def _evaluate_seo(self, title: str, subtitle: str, 
                           body: str, keywords: List[str]) -> float:
        """Evaluate SEO optimization."""
        # Check keyword density
        text = f"{title} {subtitle} {body}"
        word_count = len(text.split())
        
        keyword_scores = []
        for keyword in keywords:
            count = len(re.findall(rf'\b{re.escape(keyword)}\b', text, re.I))
            density = (count / word_count) * 100
            # Ideal density is between 0.5% and 2.5%
            keyword_scores.append(min(10, max(0, 10 - abs(1.5 - density) * 4)))
        
        # Check content length (300-1000 words ideal)
        length_score = 10
        if word_count < 300:
            length_score = word_count / 30  # Scales up to 10 at 300 words
        elif word_count > 1000:
            length_score = max(0, 10 - (word_count - 1000) / 100)
        
        # Average the scores
        return sum(keyword_scores) / len(keyword_scores) * 0.7 + length_score * 0.3
    
    async def _evaluate_structure(self, subtitle: str, body: str) -> float:
        """Evaluate content structure and formatting."""
        score = 10.0
        deductions = []
        
        # Check subtitle length (50-75 words ideal)
        subtitle_words = len(subtitle.split())
        if subtitle_words < 40 or subtitle_words > 85:
            score -= 1
            deductions.append("Subtitle length outside ideal range")
        
        # Check HTML formatting
        soup = BeautifulSoup(body, 'html.parser')
        
        # Check for required HTML elements
        if not soup.find_all('p'):
            score -= 2
            deductions.append("Missing paragraph tags")
        
        if not soup.find_all(['h3', 'h4']):
            score -= 1
            deductions.append("Missing section headers")
        
        # Check for proper list formatting
        lists = soup.find_all(['ul', 'ol'])
        for lst in lists:
            if not lst.find_all('li'):
                score -= 1
                deductions.append("List without list items")
        
        return max(0, score)
    
    async def _generate_recommendations(self, technical_score: float, 
                                     educational_score: float,
                                     seo_score: float, structure_score: float,
                                     title: str, subtitle: str, body: str,
                                     keywords: List[str]) -> List[str]:
        """Generate improvement recommendations based on scores."""
        recommendations = []
        
        if technical_score < self.min_scores["technical_accuracy"]:
            recommendations.append(
                "Improve technical accuracy: Verify claims and add specific examples"
            )
        
        if educational_score < self.min_scores["educational_value"]:
            recommendations.append(
                "Enhance educational value: Add examples and clarify concepts"
            )
        
        if seo_score < self.min_scores["seo_optimization"]:
            recommendations.append(
                "Optimize SEO: Adjust keyword density and content length"
            )
        
        if structure_score < self.min_scores["content_structure"]:
            recommendations.append(
                "Improve structure: Add proper HTML formatting and headers"
            )
        
        return recommendations
    
    def _validate_scores(self, technical_score: float, educational_score: float,
                        seo_score: float, structure_score: float,
                        overall_score: float) -> Tuple[str, str]:
        """Validate scores against minimum requirements."""
        failures = []
        
        if technical_score < self.min_scores["technical_accuracy"]:
            failures.append("Technical accuracy below minimum")
        
        if educational_score < self.min_scores["educational_value"]:
            failures.append("Educational value below minimum")
        
        if seo_score < self.min_scores["seo_optimization"]:
            failures.append("SEO optimization below minimum")
        
        if structure_score < self.min_scores["content_structure"]:
            failures.append("Content structure below minimum")
        
        if overall_score < self.min_scores["overall"]:
            failures.append("Overall score below minimum")
        
        if failures:
            return "FAIL", "; ".join(failures)
        return "PASS", "All criteria met"
    
    async def _get_gpt4_evaluation(self, prompt: str) -> Dict:
        """Get GPT-4 evaluation for a given prompt."""
        try:
            openai.api_key = self.openai_api_key
            response = await openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1000
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in GPT-4 evaluation: {e}")
            return None

# Example usage:
"""
qc = QualityControl(os.getenv("OPENAI_API_KEY"))
metrics = await qc.evaluate_entry(
    title="Container Orchestration",
    subtitle="Container orchestration automates the deployment, management, scaling, and networking of containers...",
    body="<p>Container orchestration is a critical component...</p>",
    keywords=["container orchestration", "kubernetes", "docker"],
    research_data={"technical_details": [...]}
)

print(f"Quality Metrics:\n{json.dumps(metrics.__dict__, indent=2)}")
"""
