# KB Entry Prompt Structure

## Overview
This document defines the structured prompting system for generating and improving KB entries. The system is designed to ensure consistent, high-quality content that balances technical accuracy, educational value, and SEO optimization.

## Core Components

### 1. Intent Analysis Prompt
```
You are an expert in technical concept analysis, particularly skilled at distinguishing between universal technical concepts and context-specific applications. Analyze this KB entry to understand its core meaning and context, being careful to validate any contextual assumptions.

CONTENT TO ANALYZE:
Title: {title}
Category: {category}
Current Subtitle: {subtitle}
Current Body: {body}

ANALYSIS TASKS:

1. Term Classification:
   - Is this a universal technical term or context-specific term?
   - What is the primary technical domain this term belongs to?
   - Has the term's meaning evolved over time or in different contexts?
   - Validate if any context-specific framing (e.g., "in AI clouds...") is actually inherent to the term

2. Core Definition Analysis:
   - What is the fundamental, industry-standard definition?
   - Is the current definition overly narrow or context-specific?
   - Are there multiple valid interpretations or applications?
   - What are the essential elements that must be included?

3. Context Validation:
   - Identify any potentially incorrect context assumptions
   - Note where existing content may be overly specific
   - Distinguish between general principles and specific applications
   - Flag any terminology that needs broader or narrower scope

4. Hedgehog Reference Analysis:
   - Identify mentioned Hedgehog connections
   - Treat these as research hints, not definitive connections
   - Note the nature of each connection (e.g., implementation, integration, enhancement)
   - Consider if connections are properly scoped and accurate

OUTPUT FORMAT:
<intent_analysis>
<term_classification>
{
    "type": "universal|context_specific",
    "primary_domain": "string",
    "temporal_context": "string",
    "historical_evolution": {
        "original_context": "string",
        "key_developments": ["string"],
        "current_state": "string"
    },
    "context_validation": {
        "correct_contexts": ["string"],
        "incorrect_contexts": ["string"],
        "context_notes": "string"
    }
}
</term_classification>

<core_definition>
{
    "fundamental_meaning": "string",
    "essential_elements": ["string"],
    "valid_interpretations": ["string"],
    "modern_approaches": {
        "current_trends": ["string"],
        "advantages": ["string"],
        "industry_adoption": "string"
    },
    "scope_correction_needed": boolean,
    "scope_notes": "string"
}
</core_definition>

<hedgehog_hints>
{
    "mentioned_connections": [
        {
            "component": "string",
            "relationship": "string",
            "evolution_context": "string",
            "technical_advantages": ["string"],
            "confidence": "high|medium|low",
            "needs_verification": boolean
        }
    ],
    "research_suggestions": ["string"]
}
</hedgehog_hints>

<research_guidance>
{
    "primary_focus": "string",
    "verification_needs": ["string"],
    "scope_considerations": ["string"],
    "hedgehog_aspects_to_research": ["string"]
}
</research_guidance>
</intent_analysis>
```

### 2. Research Phase Prompt
```
You are conducting research for a Hedgehog Knowledge Base entry. Use the provided intent analysis to guide your research focus.

CONTEXT:
Title: {title}
Intent Analysis: {intent_analysis}

RESEARCH TASKS:
1. Historical Context Research:
   - Trace the evolution of the concept
   - Identify key technological shifts
   - Document traditional approaches and limitations
   - Map the transition to modern implementations

2. Technical Research (Guided by Intent):
   - Search githedgehog.com focusing on identified context
   - Validate technical details via DuckDuckGo within specified domain
   - Map relationships to other Hedgehog concepts
   - Identify potential cross-linking opportunities
   - Focus on {primary_interpretation} context

3. Modern Trends Analysis:
   - Research current industry best practices
   - Identify emerging patterns and approaches
   - Document advantages of modern implementations
   - Map Hedgehog's position in the evolution

4. SEO Analysis (Context-Aware):
   - Research common search patterns within identified domain
   - Identify high-value technical keywords specific to usage context
   - Analyze competitor content structure for similar interpretations
   - Note frequently asked questions in relevant context

OUTPUT FORMAT:
<research>
<hedgehog_context>
[Verified information about Hedgehog's relationship to the topic, aligned with intent]
</hedgehog_context>

<technical_details>
[Core technical concepts and current industry understanding, focused on identified context]
</technical_details>

<seo_insights>
[Key search terms and content structure recommendations, domain-specific]
</seo_insights>

<cross_links>
[Potential KB entries to reference, context-aligned]
</cross_links>
</research>
```

### 3. Content Generation Prompt
```
You are an expert technical educator enhancing Hedgehog's knowledge base. Use the provided research to create or improve this entry.

CONTEXT:
Title: {title}
Category: {category}
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
   Structure:
   a. Historical Context and Evolution
      - Begin with traditional approach/origin
      - Identify key limitations or challenges
      - Show evolution to modern solutions
   
   b. Modern Implementation (with Hedgehog Integration)
      - Introduce current best practices
      - Naturally connect to Hedgehog's approach
      - Highlight technical advantages
      - Use specific examples and features
   
   c. Industry Impact and Future Trends
      - Discuss broader implications
      - Note continuing relevance of traditional approaches
      - Connect to industry transformation
      - Emphasize dynamic, evolving nature

   Technical Depth Guidelines:
   - Start with familiar concepts
   - Build to modern terminology
   - Support with specific examples
   - Connect features to benefits

3. Keywords:
   - Primary topic terms
   - Related technical concepts
   - Problem-solving phrases
   - Industry-standard terminology
   - Include relevant Hedgehog terms

QUALITY GUIDELINES:
1. Technical Accuracy:
   - Verify all technical claims
   - Use current, industry-standard terminology
   - Maintain appropriate technical depth

2. Educational Value:
   - Focus on understanding over memorization
   - Build from fundamental concepts
   - Use clear, relatable examples

3. Hedgehog Integration:
   - Body MUST include Hedgehog references
   - References should feel natural, not forced
   - Subtitle MAY include Hedgehog ONLY if it fits naturally
   - Maintain focus on educational value
   - Use research-verified connections

4. SEO Optimization:
   - Use keywords strategically
   - Consider technical search intent
   - Include relevant terminology

OUTPUT FORMAT:
<response>
<subtitle>
[Educational definition, optionally including Hedgehog if it fits naturally]
</subtitle>

<body>
[Structured explanation with proper HTML formatting, MUST include natural Hedgehog references]
</body>

<keywords>
[Comma-separated technical keywords]
</keywords>

<cross_links>
[Recommended cross-references]
</cross_links>
</response>
```

### 4. Quality Control Prompt
```
You are a technical documentation expert validating a KB entry. Evaluate the content against our quality standards, paying special attention to proper scope and Hedgehog integration.

CONTENT TO EVALUATE:
Title: {title}
Subtitle: {subtitle}
Body: {body}
Keywords: {keywords}
Intent Analysis: {intent_analysis}

EVALUATION CRITERIA:

1. Definition Accuracy (0-10):
   Subtitle Evaluation:
   - Provides clear, educational definition
   - Uses vendor-neutral language
   - Maintains appropriate scope (universal vs. specific)
   - Respects length constraints (50-75 words)
   - If Hedgehog is mentioned, validates natural fit
   
   Body Evaluation:
   - Builds on subtitle foundation
   - Maintains technical accuracy
   - Uses industry-standard terminology
   - Provides appropriate depth

2. Context Handling (0-10):
   - Aligns with intent analysis
   - Avoids incorrect context assumptions
   - Distinguishes universal vs. specific concepts
   - Provides appropriate examples
   - Maintains proper scope throughout

3. Hedgehog Integration (0-10):
   Subtitle Check:
   - If present, validates natural fit
   - Doesn't compromise core definition
   - Maintains educational focus
   
   Body Check:
   - Contains required Hedgehog references
   - References feel natural and relevant
   - Uses verified technical connections
   - Maintains educational value
   - Properly scoped to topic

4. Educational Value (0-10):
   - Builds understanding progressively
   - Uses clear, accessible language
   - Provides practical context
   - Addresses common misconceptions
   - Maintains professional tone

5. SEO Optimization (0-10):
   - Appropriate keyword density
   - Natural language flow
   - Proper content length
   - Technical term usage
   - Search intent alignment

OUTPUT FORMAT:
<evaluation>
<scores>
{
    "definition_accuracy": {
        "score": float,
        "subtitle_notes": "string",
        "body_notes": "string"
    },
    "context_handling": {
        "score": float,
        "notes": "string",
        "scope_issues": ["string"]
    },
    "hedgehog_integration": {
        "score": float,
        "subtitle_assessment": "string",
        "body_assessment": "string",
        "improvement_needs": ["string"]
    },
    "educational_value": {
        "score": float,
        "strengths": ["string"],
        "weaknesses": ["string"]
    },
    "seo_optimization": {
        "score": float,
        "keyword_analysis": "string",
        "length_assessment": "string"
    },
    "overall": float
}
</scores>

<recommendations>
{
    "critical_fixes": ["string"],
    "improvements": ["string"],
    "optimization_suggestions": ["string"]
}
</recommendations>

<validation_result>
{
    "status": "pass|fail",
    "blocking_issues": ["string"],
    "notes": "string"
}
</validation_result>
</evaluation>
```

## Implementation Notes

### Research Integration
1. Store research results for:
   - Cross-linking suggestions
   - Content validation
   - Future updates
   - Quality tracking

### Quality Thresholds
1. Minimum Score Requirements:
   - Definition Accuracy: 8+
   - Context Handling: 8+
   - Hedgehog Integration: 7+
   - Educational Value: 8+
   - SEO Optimization: 7+
   - Overall: 7.5+

2. Automatic Failure Conditions:
   - Missing required Hedgehog references in body
   - Incorrect scope or context
   - Technical inaccuracies
   - Poor educational value
   - Forced or unnatural Hedgehog references

### Continuous Improvement
1. Track common issues for prompt refinement
2. Monitor SEO performance
3. Gather user feedback
4. Update examples and guidelines
5. Refine quality thresholds based on results
