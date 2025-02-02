# Project Architecture

## Project Overview
The Hedgehog Content Center is a web application designed to manage and transform RFP Q&A content into FAQ entries. It provides a workflow for browsing RFP Q&A records, generating FAQ entries with AI assistance, and managing the resulting FAQ content.

## Key Concepts
1. RFP Q&A Management
   - Storage and retrieval of RFP questions and answers
   - Searchable interface for browsing records using AG Grid
   - Integration with PostgreSQL database
   - Previous/Next navigation between RFP records

2. FAQ Generation Workflow
   - AI-assisted transformation of RFP content to FAQ format
   - Two-mode LLM interaction system:
     - Initial FAQ generation mode
     - Interactive dialogue mode for refinement
   - Markdown support for FAQ content
   - Status and visibility management
   - Notes and metadata tracking

3. Content Association
   - Metadata linking between RFP Q&A and FAQ entries
   - Related FAQ tracking and display
   - Version and status management
   - Visibility states: private, public, draft, pending_review, approved, rejected, archived, needs-work

## Core Components

### Frontend (Next.js)
- Purpose: Provide user interface for content management
- Key interfaces: 
  - `/app/rfp-qa/`: RFP Q&A browsing interface with AG Grid
  - `/app/create-faq/`: FAQ generation workflow
    - Record selection view with AG Grid
    - Detail view with LLM interaction
  - `/app/faq/`: FAQ browsing and management interface
    - List view with AG Grid
    - Detail view with SimpleMDE and TipTap editors
    - Related FAQs display
- Dependencies: 
  - Next.js
  - AG Grid
  - TailwindCSS
  - SimpleMDE (dynamic import)
  - TipTap Editor
  - React Markdown
- File locations: 
  - `/app/rfp-qa/page.tsx`: Main RFP Q&A listing
  - `/app/create-faq/page.tsx`: FAQ creation entry point
  - `/app/create-faq/[rfp_id]/page.tsx`: FAQ generation interface
  - `/app/faq/page.tsx`: FAQ browsing interface
  - `/app/faq/[id]/page.tsx`: FAQ detail view
  - `/app/components/`: Shared components
    - `FaqEditor.tsx`: FAQ editing interface
    - `LlmInteraction.tsx`: LLM chat interface
    - `RelatedFaqs.tsx`: Related FAQs grid
- Update triggers: User interactions, API responses, LLM completions

### Backend API
- Purpose: Handle data operations and LLM integration
- Key interfaces: 
  - `/api/rfp-qa/`: RFP Q&A CRUD operations
  - `/api/faq/`: FAQ CRUD operations
    - `[id]`: Single FAQ operations
    - `related/[id]`: Related FAQs lookup
  - `/api/llm/`: LLM interaction endpoint
    - Generation mode
    - Dialogue mode
    - Web search integration
- Dependencies: 
  - PostgreSQL: Data persistence
  - OpenAI API: LLM integration
  - DuckDuckGo: Web search
  - Prisma: ORM layer
- File locations: `/app/api/`
- Update triggers: Frontend requests, database changes

### LLM Integration
- Purpose: AI-assisted FAQ generation and refinement
- Components:
  - Generation mode: Creates initial FAQ from RFP content
  - Dialogue mode: Interactive refinement of proposed FAQ
  - Web search: Technical verification using githedgehog.com
- Implementation:
  - Model: GPT-3.5-turbo
  - Function calling for structured outputs
  - System prompts for maintaining context
  - Temperature: 0.7 for balanced creativity
  - Error handling:
    - Input validation
    - Structured error responses
    - Environment variable validation
    - User-friendly error messages
- File location: `/app/api/llm/route.ts`

### Database (PostgreSQL)
- Purpose: Persistent storage of RFP and FAQ content
- Key tables: 
  - rfp_qa: Stores RFP questions and answers
  - faq: Stores generated FAQs with metadata
    - Added relation to rfp_qa table
    - Enhanced status tracking
    - Added notes field
- File locations: `/prisma/`: Schema and migrations
- Update triggers: API operations

## LLM Integration Architecture

### Overview
The LLM integration is designed to provide intelligent FAQ generation and refinement capabilities. It combines OpenAI's GPT-3.5-turbo model with web search functionality to ensure technically accurate and audience-appropriate content generation.

### Components

#### 1. LLM API Service (`/app/api/llm/route.ts`)
- **Purpose**: Handles all LLM-related operations
- **Features**:
  - FAQ generation from RFP content
  - Interactive dialogue for FAQ refinement
  - Web search integration for technical verification
  - Error handling and input validation
  - Structured output via function calling

#### 2. Web Search Service
- **Purpose**: Verify technical details using Hedgehog's public documentation
- **Implementation**: 
  - Uses DuckDuckGo's HTML endpoint
  - Site-specific search on githedgehog.com
  - Result parsing and formatting
  - Error handling for failed searches

### System Prompts

#### FAQ Generation Prompt
- **Objectives**:
  1. Create user-friendly, public-facing FAQs
  2. Maintain confidentiality
  3. Target appropriate audience level
  4. Ensure technical accuracy
- **Guidelines**:
  - Remove customer-specific information
  - Simplify technical jargon
  - Verify technical details when generalizing
  - Format consistently

#### Dialogue Prompt
- **Objectives**:
  1. Guide FAQ refinement process
  2. Maintain context awareness
  3. Suggest improvements
- **Guidelines**:
  - Consider user feedback
  - Maintain technical accuracy
  - Preserve formatting consistency

### Function Definitions

#### Search Function
```typescript
search_githedgehog: {
  description: "Search githedgehog.com for technical information",
  parameters: {
    query: string  // Search query
  }
}
```

#### FAQ Generation Function
```typescript
return_faq: {
  description: "Returns the generated FAQ entry",
  parameters: {
    question: string,  // FAQ question
    answer: string    // FAQ answer
  }
}
```

### Data Flow

1. **FAQ Generation**:
   ```
   RFP Q&A → LLM Analysis → (Optional Web Search) → FAQ Generation → Response
   ```

2. **Interactive Dialogue**:
   ```
   User Input → Context Loading → LLM Analysis → (Optional Web Search) → 
   FAQ Update/Response → Response
   ```

### Error Handling Architecture

1. **Client-Side**:
   - API call wrapping
   - Response validation
   - Error message parsing
   - User feedback

2. **Server-Side**:
   - Input validation
   - API error handling
   - Search error handling
   - Structured error responses

### Security Considerations

1. **API Key Management**:
   - Environment variable based
   - Server-side only access

2. **Data Privacy**:
   - No customer data storage
   - Prompt-based confidentiality rules
   - Public domain search only

## Implementation Details

### RFP Q&A Browsing
- AG Grid implementation for efficient data display
- Server-side search functionality
- Record navigation (Previous/Next)
- Markdown rendering support

### FAQ Generation Workflow
1. RFP record selection from grid view
2. AI-assisted FAQ generation
   - System prompt ensures:
     - Confidentiality (removes customer-specific info)
     - Appropriate audience targeting
     - Clear formatting
3. Interactive content refinement
   - Real-time LLM dialogue
   - Direct question/answer editing
   - Dialogue history tracking
4. Metadata management
   - Visibility control
   - Status tracking
   - Notes field
5. Related FAQ tracking
   - Display of associated FAQs
   - Metadata-based relationship tracking

### Data Models
- RFP Q&A: 
  - id: number
  - question: string
  - answer: string
  - metadata: object
- FAQ:
  - id: number
  - question: string
  - answer: string
  - visibility: string
  - status: string
  - notes: string
  - metadata: object (includes rfp_id reference)

## Development Guidelines
1. Code Organization
   - Next.js app directory structure
   - API routes in `/app/api/`
   - Shared components in `/app/components/`
   - Type definitions for data models

2. Best Practices
   - TypeScript for type safety
   - Server-side data fetching
   - Client-side state management with React hooks
   - AI interaction patterns for content generation
   - Error handling and validation
   - Markdown support for rich text

3. Standards
   - ESLint configuration
   - Prisma schema conventions
   - API response formats
   - LLM prompt engineering patterns

4. Patterns to Follow
   - React Server Components where applicable
   - API route organization by resource
   - Error handling and validation
   - LLM interaction patterns
   - Status and visibility management
   - Content relationship tracking
