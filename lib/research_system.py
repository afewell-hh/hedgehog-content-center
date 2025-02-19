"""
Research system for KB entry content generation.
Implements multi-source research and analysis for high-quality content generation.
"""

import json
import os
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup
import openai
from dataclasses import dataclass
from urllib.parse import urljoin

@dataclass
class IntentAnalysis:
    primary_interpretation: str
    domain_context: Dict[str, str]
    concept_scope: Dict[str, List[str]]
    key_relationships: List[Dict[str, str]]
    hedgehog_context: Dict[str, str]
    research_guidance: List[str]

@dataclass
class ResearchResult:
    hedgehog_context: List[Dict[str, str]]  # Source URL and relevant content
    technical_details: List[Dict[str, str]]  # Source URL and technical information
    seo_insights: Dict[str, List[str]]  # Keywords and search patterns
    cross_links: List[Dict[str, str]]  # Related KB entries

class ResearchSystem:
    def __init__(self, openai_api_key: str):
        """Initialize the research system with necessary API keys."""
        self.openai_api_key = openai_api_key
        self.base_url = "https://githedgehog.com"
        self.github_repos = [
            "githedgehog/fabric",
            "githedgehog/fabricator",
            "githedgehog/dataplane",
            "githedgehog/docs",
            "githedgehog/lab"
        ]
    
    async def analyze_intent(self, title: str, category: str, 
                           subtitle: str, body: str) -> IntentAnalysis:
        """Analyze the intent and context of an existing KB entry."""
        analysis_prompt = f"""
        Analyze this KB entry to understand its precise intended meaning and context:

        Title: {title}
        Category: {category}
        Subtitle: {subtitle}
        Body: {body}

        Focus on:
        1. Domain Context
        2. Concept Boundaries
        3. Usage Context
        4. Hedgehog Context

        Return analysis in JSON format:
        {{
            "primary_interpretation": "string",
            "domain_context": {{
                "technical_domain": "string",
                "industry_context": "string",
                "temporal_context": "string"
            }},
            "concept_scope": {{
                "included": ["string"],
                "excluded": ["string"],
                "constraints": ["string"]
            }},
            "key_relationships": [
                {{
                    "concept": "string",
                    "relationship": "string"
                }}
            ],
            "hedgehog_context": {{
                "product_relationship": "string",
                "implementation_details": "string"
            }},
            "research_guidance": ["string"]
        }}
        """

        try:
            openai.api_key = self.openai_api_key
            response = await openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": analysis_prompt}],
                temperature=0.3,
                max_tokens=2000
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return IntentAnalysis(
                primary_interpretation=result["primary_interpretation"],
                domain_context=result["domain_context"],
                concept_scope=result["concept_scope"],
                key_relationships=result["key_relationships"],
                hedgehog_context=result["hedgehog_context"],
                research_guidance=result["research_guidance"]
            )
        except Exception as e:
            print(f"Error in intent analysis: {e}")
            raise
        
    async def research_topic(self, title: str, category: str, 
                           subtitle: str = "", body: str = "") -> ResearchResult:
        """Conduct comprehensive research on a topic."""
        # First, analyze intent
        intent_analysis = await self.analyze_intent(title, category, subtitle, body)
        
        # Use intent analysis to guide research
        hedgehog_context = await self._research_hedgehog_sources(
            title, intent_analysis
        )
        technical_details = await self._research_technical_details(
            title, intent_analysis
        )
        seo_insights = await self._analyze_seo(
            title, category, intent_analysis
        )
        cross_links = await self._find_cross_links(
            title, category, intent_analysis
        )
        
        return ResearchResult(
            hedgehog_context=hedgehog_context,
            technical_details=technical_details,
            seo_insights=seo_insights,
            cross_links=cross_links
        )
    
    async def _research_hedgehog_sources(self, title: str, 
                                       intent: IntentAnalysis) -> List[Dict[str, str]]:
        """Research Hedgehog-specific information from official sources."""
        results = []
        
        # Enhance search with intent context
        search_context = f"{title} {intent.primary_interpretation}"
        
        # Search githedgehog.com with context
        try:
            site_content = await self._search_site(
                search_context, 
                intent.domain_context["technical_domain"]
            )
            if site_content:
                results.extend(site_content)
        except Exception as e:
            print(f"Error searching githedgehog.com: {e}")
        
        # Search GitHub repos with context
        try:
            github_content = await self._search_github_repos(
                search_context,
                intent.research_guidance
            )
            if github_content:
                results.extend(github_content)
        except Exception as e:
            print(f"Error searching GitHub repos: {e}")
        
        return results
    
    async def _research_technical_details(self, title: str, 
                                        intent: IntentAnalysis) -> List[Dict[str, str]]:
        """Research technical details using DuckDuckGo."""
        results = []
        
        # Create context-aware search query
        search_query = f"{title} {intent.primary_interpretation} {intent.domain_context['technical_domain']}"
        
        try:
            search_results = await self._search_duckduckgo(
                search_query,
                intent.concept_scope["included"]
            )
            if search_results:
                results.extend(search_results)
        except Exception as e:
            print(f"Error searching DuckDuckGo: {e}")
        
        return results
    
    async def _analyze_seo(self, title: str, category: str, 
                          intent: IntentAnalysis) -> Dict[str, List[str]]:
        """Analyze SEO patterns and keywords with intent context."""
        seo_results = {
            "primary_keywords": [],
            "related_terms": [],
            "search_patterns": [],
            "technical_phrases": []
        }
        
        try:
            analysis_prompt = f"""
            Analyze the technical term "{title}" in this specific context:
            
            Primary Interpretation: {intent.primary_interpretation}
            Technical Domain: {intent.domain_context['technical_domain']}
            Industry Context: {intent.domain_context['industry_context']}
            
            Consider these aspects:
            1. Primary technical keywords in this specific context
            2. Related technical terms within {intent.domain_context['technical_domain']}
            3. Common search patterns for this interpretation
            4. Key technical phrases in this domain
            
            Format as JSON with these keys:
            - primary_keywords
            - related_terms
            - search_patterns
            - technical_phrases
            """
            
            response = await self._get_gpt4_analysis(analysis_prompt)
            if response:
                seo_results.update(json.loads(response))
        except Exception as e:
            print(f"Error in SEO analysis: {e}")
        
        return seo_results
    
    async def _find_cross_links(self, title: str, category: str, 
                              intent: IntentAnalysis) -> List[Dict[str, str]]:
        """Identify potential cross-linking opportunities."""
        cross_links = []
        
        try:
            # Search existing KB entries
            related_entries = await self._search_kb_entries(title, category, intent)
            if related_entries:
                cross_links.extend(related_entries)
        except Exception as e:
            print(f"Error finding cross-links: {e}")
        
        return cross_links
    
    async def _search_site(self, query: str, technical_domain: str) -> List[Dict[str, str]]:
        """Search githedgehog.com for relevant content."""
        # Implement site search logic
        pass
    
    async def _search_github_repos(self, query: str, research_guidance: List[str]) -> List[Dict[str, str]]:
        """Search Hedgehog GitHub repositories."""
        # Implement GitHub search logic
        pass
    
    async def _search_duckduckgo(self, query: str, included_concepts: List[str]) -> List[Dict[str, str]]:
        """Search DuckDuckGo for technical information."""
        # Implement DuckDuckGo search logic
        pass
    
    async def _search_kb_entries(self, title: str, category: str, intent: IntentAnalysis) -> List[Dict[str, str]]:
        """Search existing KB entries for cross-linking."""
        # Implement KB entry search logic
        pass
    
    async def _get_gpt4_analysis(self, prompt: str) -> Optional[str]:
        """Get GPT-4 analysis for a given prompt."""
        try:
            openai.api_key = self.openai_api_key
            response = await openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in GPT-4 analysis: {e}")
            return None

# Example usage:
"""
research_system = ResearchSystem(os.getenv("OPENAI_API_KEY"))
results = await research_system.research_topic(
    title="Container Orchestration",
    category="Cloud Infrastructure"
)

# Use results in content generation:
print(json.dumps(results, indent=2))
"""
