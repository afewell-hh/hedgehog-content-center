import pandas as pd
from langchain_community.utilities import DuckDuckGoSearchAPIWrapper
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
import os
from datetime import datetime
from dotenv import load_dotenv
import re
import argparse
import json
import time
import hashlib
import uuid

# Load environment variables
load_dotenv()

# Define the prompt templates
INTENT_ANALYSIS_PROMPT = """You are an expert technical analyst evaluating knowledge base entries. Your task is to analyze the intent and context of terms to ensure accurate representation.

CONTENT TO ANALYZE:
Title: {title}
Subtitle: {subtitle}
Body: {body}

ANALYSIS REQUIREMENTS:
1. Term Classification
2. Core Definition Analysis
3. Context Validation
4. Research Guidance

OUTPUT FORMAT:
<analysis>
{
    "term_classification": {
        "type": "universal|context_specific",
        "primary_domain": "string",
        "temporal_context": "string",
        "context_validation": {
            "correct_contexts": ["string"],
            "incorrect_contexts": ["string"],
            "context_notes": "string"
        }
    },
    "core_definition": {
        "fundamental_meaning": "string",
        "essential_elements": ["string"],
        "valid_interpretations": ["string"],
        "scope_correction_needed": boolean,
        "scope_notes": "string"
    },
    "hedgehog_hints": {
        "mentioned_connections": [
            {
                "component": "string",
                "relationship": "string",
                "confidence": "high|medium|low",
                "needs_verification": boolean
            }
        ],
        "research_suggestions": ["string"]
    },
    "research_guidance": {
        "primary_focus": "string",
        "verification_needs": ["string"],
        "scope_considerations": ["string"],
        "hedgehog_aspects_to_research": ["string"]
    }
}
</analysis>"""

CONTENT_GENERATION_PROMPT = """You are an expert technical educator enhancing Hedgehog's knowledge base. Create content that flows naturally without explicit sections or headers.

CONTEXT:
Title: {title}
Research Results: {research_output}
Intent Analysis: {intent_analysis}

REQUIREMENTS:

1. Subtitle (50-75 words):
   Primary Requirements:
   - Clear, educational definition
   - Vendor-neutral language
   - Technical accuracy
   - Accessibility without oversimplification
   - Focus on fundamental industry-standard definition
   
   Hedgehog References:
   - OPTIONAL: Include ONLY if it fits naturally within length constraints
   - Must not compromise the clarity of the core definition
   - Should not force or stretch to include Hedgehog
   - Primary focus must remain on educational value

2. Body (300-1000 words):
   - Write as a continuous narrative without section headers
   - Begin with historical context or traditional approaches
   - Naturally evolve to modern implementations
   - Weave in Hedgehog's approach as part of the modern evolution
   - Connect technical features to practical benefits
   - Conclude with industry impact and future trends
   
   IMPORTANT FORMATTING:
   - Use only <p> tags for basic paragraph structure
   - NO section headers or artificial divisions
   - Each paragraph should flow naturally into the next
   - Include Hedgehog references where they fit naturally in the narrative

3. Keywords:
   - Primary topic terms
   - Related technical concepts
   - Problem-solving phrases
   - Industry-standard terminology
   - Include relevant Hedgehog terms

Format your response exactly like this:
<entry>
<subtitle>
[Educational definition, optionally including Hedgehog if it fits naturally]
</subtitle>

<body>
[Single cohesive narrative with only <p> tags for paragraphs]
</body>

<keywords>
[Comma-separated technical keywords]
</keywords>
</entry>"""

QUALITY_CONTROL_PROMPT = """You are a technical documentation expert validating a KB entry. Evaluate the content against our quality standards, paying special attention to proper scope, narrative flow, and Hedgehog integration.

CONTENT TO EVALUATE:
Title: {title}
Subtitle: {subtitle}
Body: {body}
Keywords: {keywords}
Intent Analysis: {intent_analysis}

EVALUATION CRITERIA:

1. Structural Quality (Critical)
   - No section headers or artificial divisions
   - Natural narrative flow
   - Proper use of <p> tags only
   - Smooth transitions between concepts

2. Content Evolution
   - Historical context/traditional approach present
   - Clear progression to modern solutions
   - Natural integration of Hedgehog features
   - Industry impact and trends included

3. Technical Integration
   - Appropriate technical depth
   - Accurate technical details
   - Clear feature-benefit connections
   - Proper terminology use

4. Hedgehog Integration
   - Natural inclusion of Hedgehog references
   - Relevant technical connections
   - Value proposition clear but not forced
   - Multiple connection points if possible

OUTPUT FORMAT:
<evaluation>
<scores>
{
    "structural_quality": {
        "score": float,
        "has_section_headers": boolean,
        "flow_issues": ["string"],
        "formatting_issues": ["string"]
    },
    "content_evolution": {
        "score": float,
        "missing_elements": ["string"],
        "improvement_suggestions": ["string"]
    },
    "technical_integration": {
        "score": float,
        "accuracy_issues": ["string"],
        "depth_assessment": "string"
    },
    "hedgehog_integration": {
        "score": float,
        "connection_quality": "string",
        "missed_opportunities": ["string"]
    }
}
</scores>

<notes_field_content>
[Concise summary of key issues and recommendations for the KB entry notes field]
</notes_field_content>

<validation_result>
{
    "status": "pass|fail",
    "blocking_issues": ["string"],
    "notes": "string"
}
</validation_result>
</evaluation>"""

RESEARCH_PROMPT = """You are an expert technical researcher focusing on finding meaningful connections between technical concepts and Hedgehog's architecture, features, and capabilities.

CONTEXT:
Title: {title}
Intent Analysis: {intent_analysis}
Primary Focus: {primary_focus}
Scope Considerations: {scope_considerations}
Hedgehog Research Areas: {hedgehog_research_areas}
Verification Needs: {verification_needs}

SEARCH RESULTS:
Documentation Results: {docs_results}
Blog Results: {blog_results}
Additional Results: {additional_results}

RESEARCH TASKS:

1. Direct Connection Analysis:
   - Analyze direct mentions of the concept in Hedgehog documentation
   - Identify explicit implementations or uses
   - Note any direct technical relationships

2. Architectural Pattern Matching:
   - Look for similar architectural patterns in Hedgehog
   - Identify parallel implementation approaches
   - Note design philosophy alignments

3. Feature Relationship Discovery:
   - Map concept to related Hedgehog features
   - Identify complementary capabilities
   - Note integration possibilities

4. Evolution Context:
   - Compare traditional approaches vs Hedgehog's modern implementation
   - Identify technological improvements
   - Note architectural advantages

5. Technical Value Analysis:
   - Map concept benefits to Hedgehog advantages
   - Identify efficiency improvements
   - Note operational benefits

OUTPUT FORMAT:
<research_results>
<direct_connections>
{
    "explicit_mentions": ["string"],
    "implementation_details": ["string"],
    "technical_relationships": ["string"]
}
</direct_connections>

<architectural_patterns>
{
    "similar_patterns": ["string"],
    "design_alignments": ["string"],
    "implementation_approaches": ["string"]
}
</architectural_patterns>

<feature_relationships>
{
    "related_features": [
        {
            "feature": "string",
            "relationship": "string",
            "confidence": "high|medium|low"
        }
    ],
    "integration_points": ["string"]
}
</feature_relationships>

<evolution_context>
{
    "traditional_approach": "string",
    "hedgehog_approach": "string",
    "advantages": ["string"]
}
</evolution_context>

<technical_value>
{
    "benefits_mapping": [
        {
            "concept_benefit": "string",
            "hedgehog_advantage": "string"
        }
    ],
    "efficiency_gains": ["string"],
    "operational_benefits": ["string"]
}
</technical_value>

<connection_summary>
[Concise summary of the most relevant and confident connections found]
</connection_summary>
</research_results>"""

class IntentAnalysisAgent:
    def __init__(self, llm):
        self.llm = llm
        self.prompt = PromptTemplate(
            input_variables=["title", "subtitle", "body"],
            template=INTENT_ANALYSIS_PROMPT
        )
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)
    
    def analyze(self, title: str, subtitle: str, body: str) -> dict:
        """Analyze the intent and context of a KB entry"""
        response = self.chain.run(
            title=title,
            subtitle=subtitle,
            body=body
        )
        
        # Extract JSON from response
        if '<analysis>' in response and '</analysis>' in response:
            analysis_json = response.split('<analysis>')[1].split('</analysis>')[0].strip()
            try:
                return json.loads(analysis_json)
            except json.JSONDecodeError:
                return None
        return None

class ResearchAgent:
    def __init__(self, llm):
        self.llm = llm
        self.search = DuckDuckGoSearchAPIWrapper()
        self.prompt = PromptTemplate(
            input_variables=[
                "title", "intent_analysis", "primary_focus", 
                "scope_considerations", "hedgehog_research_areas",
                "verification_needs", "docs_results", "blog_results",
                "additional_results"
            ],
            template=RESEARCH_PROMPT
        )
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)

    def _get_architectural_patterns(self, term: str) -> list:
        """Identify relevant architectural patterns for Hedgehog architecture"""
        base_patterns = [
            # Core Hedgehog Patterns
            "cloud native",
            "distributed control plane",
            "multi-tenant",
            "network fabric",
            "network automation",
            "intent based networking",
            
            # High Availability Patterns
            "high availability",
            "fault tolerance",
            "active-active",
            "active-passive",
            "redundancy",
            
            # Network Patterns
            "load balancing",
            "ECMP",
            "BGP",
            "EVPN",
            "VXLAN",
            "MC-LAG",
            "spine-leaf",
            
            # Operational Patterns
            "zero-touch provisioning",
            "automated deployment",
            "configuration management",
            "service mesh",
            
            # Scaling Patterns
            "horizontal scaling",
            "vertical scaling",
            "distributed systems",
            "elastic scaling",
            
            # Security Patterns
            "microsegmentation",
            "zero trust",
            "network security",
            
            # Modern Infrastructure
            "containerization",
            "kubernetes integration",
            "infrastructure as code",
            "gitops",
            
            # Performance Patterns
            "traffic engineering",
            "quality of service",
            "bandwidth optimization",
            "latency reduction"
        ]
        
        return [f"{term} {pattern}" for pattern in base_patterns]

    def _execute_search(self, query: str) -> list:
        """Execute a search with error handling and rate limiting"""
        try:
            # Define search domains
            domains = [
                "docs.githedgehog.com",
                "githedgehog.com/docs",
                "github.com/hedgehog"
            ]
            
            results = []
            for domain in domains:
                try:
                    # Add domain-specific search
                    domain_results = self.search.run(f"site:{domain} {query}")
                    
                    # Process and structure results
                    if domain_results:
                        results.append({
                            "query": query,
                            "domain": domain,
                            "content": domain_results,
                            "timestamp": datetime.now().isoformat(),
                            "source_type": "documentation" if "docs" in domain else "code"
                        })
                    
                    # Basic rate limiting
                    time.sleep(0.5)
                    
                except Exception as domain_error:
                    print(f"Error searching {domain}: {str(domain_error)}")
                    continue
            
            return results
            
        except Exception as e:
            print(f"Search error for query '{query}': {str(e)}")
            return []

    def _execute_blog_search(self, query: str) -> list:
        """Execute a blog search with error handling"""
        try:
            # Define blog-specific domains
            blog_domains = [
                "githedgehog.com/blog",
                "githedgehog.com/news",
                "githedgehog.com/resources"
            ]
            
            results = []
            for domain in blog_domains:
                try:
                    # Add domain-specific search
                    blog_results = self.search.run(f"site:{domain} {query}")
                    
                    # Process and structure results
                    if blog_results:
                        results.append({
                            "query": query,
                            "domain": domain,
                            "content": blog_results,
                            "timestamp": datetime.now().isoformat(),
                            "source_type": "blog"
                        })
                    
                    # Basic rate limiting
                    time.sleep(0.5)
                    
                except Exception as domain_error:
                    print(f"Error searching {domain}: {str(domain_error)}")
                    continue
            
            return results
            
        except Exception as e:
            print(f"Blog search error for query '{query}': {str(e)}")
            return []

    def _get_result_id(self, result: dict) -> str:
        """Generate a unique identifier for a search result"""
        try:
            # Create unique ID based on domain and content hash
            content_hash = hashlib.md5(result["content"].encode()).hexdigest()
            return f"{result['domain']}:{content_hash}"
        except Exception as e:
            print(f"Error generating result ID: {str(e)}")
            return str(uuid.uuid4())  # Fallback to random UUID

    def _parse_research_results(self, result: str) -> dict:
        """Parse the research results into a structured format"""
        try:
            # Extract sections from XML-style output
            sections = {}
            
            # Parse direct connections
            if '<direct_connections>' in result and '</direct_connections>' in result:
                direct_connections = result.split('<direct_connections>')[1].split('</direct_connections>')[0]
                sections['direct_connections'] = json.loads(direct_connections)
            
            # Parse architectural patterns
            if '<architectural_patterns>' in result and '</architectural_patterns>' in result:
                patterns = result.split('<architectural_patterns>')[1].split('</architectural_patterns>')[0]
                sections['architectural_patterns'] = json.loads(patterns)
            
            # Parse feature relationships
            if '<feature_relationships>' in result and '</feature_relationships>' in result:
                relationships = result.split('<feature_relationships>')[1].split('</feature_relationships>')[0]
                sections['feature_relationships'] = json.loads(relationships)
            
            # Parse evolution context
            if '<evolution_context>' in result and '</evolution_context>' in result:
                evolution = result.split('<evolution_context>')[1].split('</evolution_context>')[0]
                sections['evolution_context'] = json.loads(evolution)
            
            # Parse technical value
            if '<technical_value>' in result and '</technical_value>' in result:
                value = result.split('<technical_value>')[1].split('</technical_value>')[0]
                sections['technical_value'] = json.loads(value)
            
            # Parse connection summary
            if '<connection_summary>' in result and '</connection_summary>' in result:
                summary = result.split('<connection_summary>')[1].split('</connection_summary>')[0].strip()
                sections['connection_summary'] = summary
            
            return {
                "status": "success",
                "sections": sections,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "parse_error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def research(self, title: str, intent_analysis: dict) -> dict:
        """Perform comprehensive research based on intent analysis"""
        try:
            # Extract research parameters
            params = self._extract_research_params(intent_analysis)
            
            # Perform searches with expanded context
            docs_results = self._search_docs(title, params.get("primary_focus"))
            blog_results = self._search_blog(title)
            additional_results = self._search_additional(title, params.get("domain"))
            
            # Run research chain
            result = self.chain.run({
                "title": title,
                "intent_analysis": intent_analysis,
                "primary_focus": params.get("primary_focus"),
                "scope_considerations": params.get("scope_considerations"),
                "hedgehog_research_areas": params.get("hedgehog_research_areas"),
                "verification_needs": params.get("verification_needs"),
                "docs_results": docs_results,
                "blog_results": blog_results,
                "additional_results": additional_results
            })
            
            return self._parse_research_results(result)
            
        except Exception as e:
            return {
                "error": str(e),
                "status": "research_failed"
            }

    def _extract_research_params(self, intent_analysis: dict) -> dict:
        """Extract research parameters from intent analysis"""
        try:
            return {
                "primary_focus": intent_analysis.get("research_guidance", {}).get("primary_focus"),
                "scope_considerations": intent_analysis.get("research_guidance", {}).get("scope_considerations"),
                "hedgehog_research_areas": intent_analysis.get("hedgehog_hints", {}).get("research_suggestions"),
                "verification_needs": intent_analysis.get("research_guidance", {}).get("verification_needs"),
                "domain": intent_analysis.get("term_classification", {}).get("primary_domain")
            }
        except Exception as e:
            print(f"Error extracting research parameters: {str(e)}")
            return {}

class ContentGenerationAgent:
    def __init__(self, llm):
        self.llm = llm
        self.prompt = PromptTemplate(
            input_variables=["title", "research_output", "intent_analysis"],
            template=CONTENT_GENERATION_PROMPT
        )
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)
    
    def generate(self, title: str, research_output: str, intent_analysis: dict) -> tuple[str, str, list]:
        """Generate content based on research and intent analysis"""
        response = self.chain.run(
            title=title,
            research_output=research_output,
            intent_analysis=json.dumps(intent_analysis, indent=2)
        )
        
        # Parse response
        subtitle = ""
        body = ""
        keywords = []
        
        if '<entry>' in response and '</entry>' in response:
            entry = response.split('<entry>')[1].split('</entry>')[0].strip()
            
            # Extract subtitle
            if '<subtitle>' in entry and '</subtitle>' in entry:
                subtitle = entry.split('<subtitle>')[1].split('</subtitle>')[0].strip()
            
            # Extract body
            if '<body>' in entry and '</body>' in entry:
                body = entry.split('<body>')[1].split('</body>')[0].strip()
            
            # Extract keywords
            if '<keywords>' in entry and '</keywords>' in entry:
                keywords_str = entry.split('<keywords>')[1].split('</keywords>')[0].strip()
                keywords = [k.strip() for k in keywords_str.split(',')]
        
        return subtitle, body, keywords

class QualityControlAgent:
    def __init__(self, llm):
        self.llm = llm
        self.prompt = PromptTemplate(
            input_variables=["title", "subtitle", "body", "keywords", "intent_analysis"],
            template=QUALITY_CONTROL_PROMPT
        )
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)

    def evaluate(self, title: str, subtitle: str, body: str, keywords: list, intent_analysis: dict):
        """Evaluate content quality and provide detailed feedback"""
        try:
            result = self.chain.run({
                "title": title,
                "subtitle": subtitle,
                "body": body,
                "keywords": keywords,
                "intent_analysis": intent_analysis
            })
            
            # Parse the evaluation result
            evaluation = self._parse_evaluation(result)
            
            # Generate notes field content
            notes = self._extract_notes_content(evaluation)
            
            return {
                "evaluation": evaluation,
                "notes": notes,
                "status": evaluation["validation_result"]["status"]
            }
        except Exception as e:
            return {
                "error": str(e),
                "notes": "Error during quality evaluation",
                "status": "fail"
            }

    def _parse_evaluation(self, result: str) -> dict:
        """Parse the evaluation output into a structured format"""
        # Implementation of parsing logic
        pass

    def _extract_notes_content(self, evaluation: dict) -> str:
        """Extract and format content for the KB entry notes field"""
        notes = []
        
        # Add structural issues
        if evaluation["scores"]["structural_quality"]["has_section_headers"]:
            notes.append("⚠️ STRUCTURE: Contains section headers - needs reformatting")
        
        if evaluation["scores"]["structural_quality"]["flow_issues"]:
            notes.append("📝 FLOW: " + "; ".join(evaluation["scores"]["structural_quality"]["flow_issues"]))
        
        # Add content evolution issues
        if evaluation["scores"]["content_evolution"]["missing_elements"]:
            notes.append("🔄 EVOLUTION: Missing - " + "; ".join(evaluation["scores"]["content_evolution"]["missing_elements"]))
        
        # Add Hedgehog integration feedback
        if evaluation["scores"]["hedgehog_integration"]["score"] < 7:
            notes.append("🦔 HEDGEHOG: " + evaluation["scores"]["hedgehog_integration"]["connection_quality"])
            if evaluation["scores"]["hedgehog_integration"]["missed_opportunities"]:
                notes.append("💡 OPPORTUNITIES: " + "; ".join(evaluation["scores"]["hedgehog_integration"]["missed_opportunities"]))
        
        # Add blocking issues if any
        if evaluation["validation_result"]["blocking_issues"]:
            notes.append("🚫 BLOCKING: " + "; ".join(evaluation["validation_result"]["blocking_issues"]))
        
        return "\n".join(notes)

class KnowledgeBaseProcessor:
    def __init__(self, input_file: str, provider: str = 'openai'):
        self.input_file = input_file
        self.df = pd.read_csv(input_file)
        
        # Initialize LLM based on provider
        self.llm = self._initialize_llm(provider)
        
        # Add metadata columns
        self.df['processing_status'] = ''
        self.df['validation_issues'] = ''
        self.df['processing_timestamp'] = ''
        self.df['research_results'] = ''
        self.df['intent_analysis'] = ''
        self.df['quality_scores'] = ''
        self.df['recommendations'] = ''
        
        # Initialize agents
        self.intent_analyzer = IntentAnalysisAgent(self.llm)
        self.researcher = ResearchAgent(self.llm)
        self.content_generator = ContentGenerationAgent(self.llm)
        self.quality_controller = QualityControlAgent(self.llm)
    
    def _initialize_llm(self, provider: str):
        """Initialize the appropriate LLM based on provider"""
        if provider == 'openai':
            return ChatOpenAI(
                temperature=0.3,
                model="gpt-4o"
            )
        elif provider == 'anthropic':
            return ChatAnthropic(
                temperature=0.3,
                model="claude-3.5-haiku"
            )
        elif provider == 'google':
            return ChatGoogleGenerativeAI(
                temperature=0.3,
                model="gemini-pro"
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    def process_entry(self, title: str, current_body: str, current_subtitle: str, context: str) -> tuple[str, str, list, dict]:
        """Process a single entry with intent analysis, research, content generation, and quality control"""
        max_iterations = 3
        
        # Step 1: Intent Analysis
        intent_analysis = self.intent_analyzer.analyze(title, current_subtitle, current_body)
        if not intent_analysis:
            return None, None, [], "Failed to analyze intent"
        
        # Step 2: Research
        research_results = self.researcher.research(title, intent_analysis)
        if not research_results:
            return None, None, [], "Failed to gather research"
        
        for iteration in range(max_iterations):
            # Step 3: Content Generation
            subtitle, body, keywords = self.content_generator.generate(
                title=title,
                research_output=json.dumps(research_results, indent=2),
                intent_analysis=intent_analysis
            )
            
            # Step 4: Quality Control
            qa_results = self.quality_controller.evaluate(
                title=title,
                subtitle=subtitle,
                body=body,
                keywords=keywords,
                intent_analysis=intent_analysis
            )
            
            if qa_results["status"] == "pass":
                return subtitle, body, keywords, {
                    "intent_analysis": intent_analysis,
                    "research_results": research_results,
                    "quality_scores": qa_results["evaluation"],
                    "recommendations": qa_results["notes"],
                    "status": qa_results["status"]
                }
            
            if iteration == max_iterations - 1:
                return subtitle, body, keywords, {
                    "intent_analysis": intent_analysis,
                    "research_results": research_results,
                    "quality_scores": qa_results["evaluation"],
                    "recommendations": qa_results["notes"],
                    "status": "max_iterations_reached"
                }
        
        return None, None, [], "Failed to produce acceptable entry"

    def process_batch(self, start_idx: int, batch_size: int = 5):
        """Process a batch of entries"""
        end_idx = min(start_idx + batch_size, len(self.df))
        
        for idx in range(start_idx, end_idx):
            try:
                # Get current entry
                title = self.df.iloc[idx]['Article title']
                current_body = self.df.iloc[idx]['Article body']
                current_subtitle = self.df.iloc[idx]['Article subtitle']
                
                # Process entry
                subtitle, body, keywords, metadata = self.process_entry(
                    title=title,
                    current_body=current_body,
                    current_subtitle=current_subtitle,
                    context=""  # No longer needed as research is handled by ResearchAgent
                )
                
                if subtitle and body:
                    # Update fields
                    self.df.at[idx, 'Article subtitle'] = subtitle
                    self.df.at[idx, 'Article body'] = body
                    self.df.at[idx, 'processing_status'] = 'processed'
                    self.df.at[idx, 'intent_analysis'] = json.dumps(metadata.get('intent_analysis', {}))
                    self.df.at[idx, 'research_results'] = json.dumps(metadata.get('research_results', {}))
                    self.df.at[idx, 'quality_scores'] = json.dumps(metadata.get('quality_scores', {}))
                    self.df.at[idx, 'recommendations'] = json.dumps(metadata.get('recommendations', []))
                else:
                    self.df.at[idx, 'processing_status'] = 'failed'
                    self.df.at[idx, 'validation_issues'] = metadata
                
                self.df.at[idx, 'processing_timestamp'] = datetime.now().isoformat()
                
            except Exception as e:
                self.df.at[idx, 'processing_status'] = 'error'
                self.df.at[idx, 'validation_issues'] = str(e)

    def save_results(self, output_file: str):
        """Save the processed results"""
        self.df.to_csv(output_file, index=False, quoting=1)  # QUOTE_ALL for consistent formatting

def main():
    parser = argparse.ArgumentParser(description='Process knowledge base entries with different LLM providers')
    parser.add_argument('input_file', help='Input CSV file')
    parser.add_argument('output_file', help='Output CSV file')
    parser.add_argument('-p', '--provider', 
                       choices=['openai', 'anthropic', 'google'],
                       default='openai',
                       help='LLM provider to use (default: openai)')
    
    args = parser.parse_args()
    
    # Initialize processor with specified provider
    processor = KnowledgeBaseProcessor(args.input_file, args.provider)
    
    # Process test batch
    processor.process_batch(0, 3)
    
    # Save results
    processor.save_results(args.output_file)

if __name__ == "__main__":
    main()