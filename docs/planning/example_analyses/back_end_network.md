# Intent Analysis Example: Back-end Network

## Input Content
```
Title: back-end network
Subtitle: AI clouds typically have a separate network segment for GPUs to communicate with each for multi-stage training computations with large data sets. Hedgehog optimizes the back-end network for large elephant flows using RDMA, PFC and ECN.
```

## Expected Intent Analysis
```json
{
    "term_classification": {
        "type": "context_specific",
        "primary_domain": "networking",
        "temporal_context": "Term has gained specific meaning in AI/ML infrastructure context",
        "context_validation": {
            "correct_contexts": ["AI infrastructure", "GPU clusters", "ML training systems"],
            "incorrect_contexts": ["general datacenter networks", "traditional backend systems"],
            "context_notes": "While 'backend network' could be used generally, this specific term has evolved to have particular meaning in AI infrastructure"
        }
    },
    "core_definition": {
        "fundamental_meaning": "Network segment specifically designed for high-bandwidth, low-latency communication between GPUs or other AI accelerators",
        "essential_elements": [
            "GPU/accelerator interconnect",
            "High bandwidth requirements",
            "Low latency requirements",
            "Support for parallel processing"
        ],
        "valid_interpretations": [
            "AI training cluster network",
            "GPU mesh network",
            "AI accelerator fabric"
        ],
        "scope_correction_needed": false,
        "scope_notes": "Current context is appropriate given term's modern usage"
    },
    "hedgehog_hints": {
        "mentioned_connections": [
            {
                "component": "network optimization",
                "relationship": "optimization features",
                "confidence": "high",
                "needs_verification": true
            }
        ],
        "research_suggestions": [
            "Verify RDMA, PFC, ECN implementation",
            "Research other Hedgehog optimizations for AI workloads",
            "Look for specific performance metrics or benchmarks"
        ]
    },
    "research_guidance": {
        "primary_focus": "Modern AI infrastructure networking requirements",
        "verification_needs": [
            "Confirm specific Hedgehog optimization features",
            "Validate technical requirements for GPU communication",
            "Verify industry standard approaches"
        ],
        "scope_considerations": [
            "Focus on AI/ML specific networking needs",
            "Consider both training and inference requirements",
            "Include relevant networking protocols and standards"
        ],
        "hedgehog_aspects_to_research": [
            "Network optimization features",
            "RDMA support details",
            "Performance characteristics"
        ]
    }
}
```

## Analysis Notes
1. Term Classification:
   - Correctly identifies this as a context-specific term
   - Recognizes its evolution in meaning with AI's rise
   - Properly scopes to AI infrastructure

2. Core Definition:
   - Maintains focus on technical aspects
   - Includes essential networking requirements
   - Properly scoped to AI context

3. Hedgehog References:
   - Treats existing reference as a hint
   - Flags need for verification
   - Suggests broader research areas

4. Research Guidance:
   - Balances AI-specific and general networking aspects
   - Includes verification of Hedgehog features
   - Maintains technical accuracy focus
