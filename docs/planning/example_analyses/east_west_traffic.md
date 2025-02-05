# Intent Analysis Example: East-West Traffic

## Input Content
```
Title: east-west traffic
Body: In an AI cloud environment, "east-west traffic" refers to the communication flow between resources or components within the cloud infrastructure itself...
```

## Expected Intent Analysis
```json
{
    "term_classification": {
        "type": "universal",
        "primary_domain": "networking",
        "temporal_context": "Well-established networking concept, predates cloud computing",
        "context_validation": {
            "correct_contexts": ["any datacenter network", "enterprise networks", "cloud networks"],
            "incorrect_contexts": ["AI-specific networking", "cloud-specific communication"],
            "context_notes": "Current content incorrectly scopes this to AI cloud environments. This is a universal networking concept applicable to any internal network traffic."
        }
    },
    "core_definition": {
        "fundamental_meaning": "Network traffic that flows between servers or services within the same network or datacenter",
        "essential_elements": [
            "Internal communication",
            "Server-to-server traffic",
            "Intra-datacenter communication",
            "Lateral network traffic"
        ],
        "valid_interpretations": [
            "Internal service communication",
            "Server-to-server data transfer",
            "Inter-service traffic within a network"
        ],
        "scope_correction_needed": true,
        "scope_notes": "Definition needs to be broadened beyond AI/cloud context to reflect universal applicability"
    },
    "hedgehog_hints": {
        "mentioned_connections": [],
        "research_suggestions": [
            "Research Hedgehog's handling of east-west traffic",
            "Look for specific optimizations or features",
            "Investigate any unique implementations"
        ]
    },
    "research_guidance": {
        "primary_focus": "Universal networking concept and principles",
        "verification_needs": [
            "Confirm standard industry definition",
            "Verify common use cases across different environments",
            "Research typical traffic patterns"
        ],
        "scope_considerations": [
            "Start with general networking definition",
            "Include various application contexts",
            "Avoid limiting to specific environments"
        ],
        "hedgehog_aspects_to_research": [
            "Traffic handling features",
            "Network fabric capabilities",
            "Any specific optimizations"
        ]
    }
}
```

## Analysis Notes
1. Term Classification:
   - Correctly identifies as universal term
   - Flags incorrect AI-specific scoping
   - Maintains broad applicability

2. Core Definition:
   - Focuses on fundamental networking concept
   - Not limited to specific environments
   - Includes essential technical aspects

3. Hedgehog References:
   - Notes absence of explicit references
   - Suggests areas for research
   - Maintains focus on general concept first

4. Research Guidance:
   - Emphasizes universal definition
   - Suggests investigating various contexts
   - Includes Hedgehog-specific research as secondary focus
