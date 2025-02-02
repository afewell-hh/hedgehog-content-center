# Transfer of Information (TOI) Methodology

This document outlines a methodology for maintaining project continuity across development sessions, particularly useful for AI-assisted development. It provides a structured approach to documentation, project tracking, and knowledge transfer.

## Initial Setup

### 1. Create TOI Directory Structure
```
/docs
  /toi
    architecture.md      # System design and architecture
    implementation_state.md  # Current implementation status
    project_tracking.md  # Active work and future plans
```

### 2. Base Document Templates

#### architecture.md Template
```markdown
# Project Architecture

## Project Overview
[Brief description of project purpose and goals]

## Key Concepts
1. [Core concept 1]
2. [Core concept 2]
   - Key characteristics
   - Important considerations

## Core Components
[For each major component:]
- Purpose and responsibility
- Key interfaces
- Dependencies
- File locations
- Update triggers

## Implementation Details
[For each major feature:]
- Design decisions
- Data structures
- Algorithms
- Examples

## Development Guidelines
1. Code organization
2. Best practices
3. Standards
4. Patterns to follow
```

#### implementation_state.md Template
```markdown
# Implementation State

## Core Architecture
[Current state of core systems]

## Completed Features
[For each completed feature:]
- Description
- Implementation details
- Location
- Dependencies

## In Progress Features
[For each in-progress feature:]
- Current status
- Remaining work
- Known issues
- Next steps

## Known Issues
[For each issue:]
- Description
- Impact
- Workarounds
- Plan for resolution

## Critical Dependencies
[List of dependencies with:]
- Versions
- Purpose
- Integration points
```

#### project_tracking.md Template
```markdown
# Project Tracking

## Active Development
[Last updated: DATE]

### Current Sprint
[Description of current focus]

### In Progress
[For each active task:]
- Description
- Status
- Next steps
- Blockers

### Recently Completed
[List of recently completed work]

### Immediate Next Tasks
[Prioritized list of next tasks]

## Key Milestones and Commits
[For each milestone:]
- Description
- Commit hash
- Key changes
- Impact

## Session Handoff
[Updated each session:]
1. Current focus
2. Latest changes
3. Important decisions
4. Implementation state
5. Next steps
```

## Maintenance Workflow

### 1. Starting a New Session
1. Review all TOI documents
2. Note current status
3. Identify relevant sections to update
4. Plan immediate work

### 2. During Development
1. Document design decisions as they're made
2. Update implementation status
3. Note discovered issues
4. Track technical debt
5. Make frequent, atomic commits

### 3. Completing Work
1. Update affected TOI sections
2. Review for accuracy
3. Make detailed commit
4. Ensure continuation instructions are clear

### 4. Ending Session
1. Review all TOI documents
2. Update project tracking
3. Ensure clear continuation path
4. Commit final updates

## Git Commit Standards

### 1. Commit Message Format
```
type: Brief summary

- Detailed bullet points of changes
- Reasoning for changes
- Impact on other components

Additional context if needed
```

### 2. Commit Types
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Formatting changes
- refactor: Code restructuring
- test: Test additions/modifications
- chore: Maintenance tasks

### 3. Commit Frequency
- Commit after each logical change
- Keep commits focused and atomic
- Include TOI updates with related code changes
- Use descriptive messages

## Quality Standards

### 1. Documentation Quality
- Clear and concise
- Well-organized
- Current and accurate
- Includes examples
- Links related information

### 2. Code Examples
- Include current state
- Show expected outputs
- Demonstrate usage
- Highlight key patterns

### 3. Implementation Details
- Design decisions and rationale
- Data structures
- Algorithms
- Integration points
- Dependencies

### 4. Project Tracking
- Current status
- Next steps
- Known issues
- Future plans
- Dependencies

## Session Continuity

### 1. Handoff Information
- Current task status
- Recent changes
- Important decisions
- Next steps
- Known issues

### 2. Context Preservation
- Document assumptions
- Note dependencies
- Explain rationale
- Track decisions
- Maintain examples

### 3. Progress Tracking
- Use commit hashes
- Link related changes
- Track milestones
- Note blockers
- Document workarounds

## Best Practices

### 1. Documentation
- Keep it current
- Be specific
- Include examples
- Link related items
- Remove outdated info
- Use clear language

### 2. Project Management
- Track progress
- Note blockers
- Plan ahead
- Document decisions
- Maintain priorities

### 3. Code Quality
- Follow standards
- Document complex logic
- Include tests
- Handle errors
- Consider future needs

### 4. Communication
- Be clear
- Provide context
- Include examples
- Note assumptions
- Link resources

## Getting Started with TOI

### 1. New Project Setup
1. Create TOI directory structure
2. Copy template files
3. Customize for project
4. Document initial state
5. Plan first milestone

### 2. First Session
1. Document project goals
2. Define architecture
3. Plan initial work
4. Set up tracking
5. Begin implementation

### 3. Ongoing Maintenance
1. Update regularly
2. Keep accurate
3. Plan ahead
4. Track progress
5. Maintain quality

## Remember
- TOI is critical for project continuity
- Keep documentation current
- Make frequent, detailed commits
- Think about future sessions
- Include context and rationale
- Plan for handoffs
