# Implementation State

## Core Architecture
- Next.js application with TypeScript and app directory structure
- PostgreSQL database with Prisma ORM for data persistence
- AG Grid for efficient data display and interaction
- OpenAI GPT-3.5-turbo integration for FAQ generation
- TailwindCSS for styling
- SimpleMDE for Markdown editing

## Completed Features

### RFP Q&A Browsing (/app/rfp-qa/)
- Description: Interface for viewing and searching RFP Q&A records
- Implementation:
  - AG Grid with server-side filtering
  - Previous/Next record navigation
  - Search functionality
- Location: 
  - Page: `/app/rfp-qa/page.tsx`
  - API: `/app/api/rfp-qa/route.ts`
- Dependencies: AG Grid, Prisma, PostgreSQL

### FAQ Generation (/app/create-faq/)
- Description: Workflow for creating FAQ entries from RFP Q&A content
- Implementation:
  - Two-step process:
    1. Record selection via AG Grid
    2. Detail view with LLM interaction
  - Features:
    - AI-assisted content generation
    - Interactive LLM dialogue
    - Real-time content refinement
    - Dialogue history tracking
    - Status and visibility management
    - Notes field
    - Related FAQ display
- Location:
  - List view: `/app/create-faq/page.tsx`
  - Detail view: `/app/create-faq/[rfp_id]/page.tsx`
  - LLM API: `/app/api/llm/route.ts`
  - FAQ API: `/app/api/faq/route.ts`
- Dependencies: OpenAI API, SimpleMDE, Prisma, PostgreSQL

### FAQ Management (/app/faq/)
- Description: Interface for browsing FAQ entries
- Implementation:
  - AG Grid with filtering
  - Status management
  - Visibility controls
  - Markdown rendering
- Location:
  - Page: `/app/faq/page.tsx`
  - API: `/app/api/faq/route.ts`
- Dependencies: AG Grid, Prisma, PostgreSQL

### LLM Integration

### FAQ Generation API
- **Endpoint**: `/api/llm`
- **Method**: POST
- **Modes**: 
  - `generate`: Creates new FAQ entries from RFP Q&A content
  - `dialogue`: Supports interactive refinement of FAQ entries

### Web Search Integration
- Integrated DuckDuckGo search functionality to verify technical details
- Search scope limited to `githedgehog.com` domain
- Results limited to top 3 most relevant matches
- Search is triggered only when LLM needs to verify technical details not covered in RFP Q&A

### Error Handling
- Comprehensive error handling at both client and server levels
- Detailed error logging and user-friendly error messages
- Validation for required fields and API responses
- Graceful handling of OpenAI API errors

### Data Models

#### FAQ Generation Request
```typescript
{
  mode: "generate",
  question: string,  // RFP question
  answer: string     // RFP answer
}
```

#### FAQ Generation Response
```typescript
{
  question: string,  // Generated FAQ question
  answer: string     // Generated FAQ answer
}
```

#### Dialogue Request
```typescript
{
  mode: "dialogue",
  userInput: string,
  currentFaq: {
    question: string,
    answer: string
  }
}
```

#### Dialogue Response
```typescript
{
  message?: string,           // Optional dialogue message
  question?: string,          // Updated FAQ question (if changed)
  answer?: string,           // Updated FAQ answer (if changed)
  functionCall?: string      // Type of update performed
}
```

### Environment Variables
- `OPENAI_API_KEY`: Required for OpenAI API access

## In Progress Features
No features currently in progress.

## Known Issues
No known issues in the current implementation.

## Critical Dependencies

### Frontend
- Next.js: ^14.0.0
- AG Grid Community: Latest version
- AG Grid React: Latest version
- TailwindCSS: Latest version
- SimpleMDE React: Latest version
- React Markdown: Latest version
- Remark GFM: Latest version

### Backend
- PostgreSQL: Latest version
- Prisma: Latest version
- OpenAI API: Latest version
- Node.js: ^18.0.0

### Development
- TypeScript: ^5.0.0
- ESLint: Latest version
- PostCSS: Latest version

## Integration Points

### Database Schema
- RFP_QA table:
  - id (PK)
  - question
  - answer
  - metadata (JSONB)
  - created_at
  - updated_at

- FAQ table:
  - id (PK)
  - question
  - answer
  - visibility
  - status
  - notes
  - metadata (JSONB, includes rfp_id)
  - created_at
  - updated_at

### API Endpoints
- `/api/rfp-qa/`:
  - GET: List/search RFP Q&A records
  - GET /{id}: Get specific record
  - GET /next/{id}: Get next record
  - GET /prev/{id}: Get previous record

- `/api/faq/`:
  - GET: List/search FAQs
  - POST: Create new FAQ
  - GET /related/{rfp_id}: Get related FAQs

- `/api/llm/`:
  - POST: Generate/refine FAQ content
  - Modes: generate, dialogue
