# Project Architecture

## Project Overview
The Hedgehog Content Center is a web application designed to manage and transform RFP Q&A content into FAQ entries, and maintain a comprehensive Knowledge Base. It provides workflows for browsing RFP Q&A records, generating FAQ entries with AI assistance, and managing Knowledge Base content with advanced features like LLM-assisted content creation and citation management.

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
   - Technical verification through DuckDuckGo search
   - Markdown editing for both questions and answers
   - Status and visibility management
   - Notes and metadata tracking
   - Consistent card-based layouts

3. Knowledge Base Management
   - Comprehensive content management system
   - LLM-assisted content creation and editing
   - Citation management and verification
   - Import/Export functionality with CSV support
   - Category-based organization
   - Status tracking (Draft/Review/Approved/Archived)
   - Visibility control (Public/Private)
   - Technical verification system
   - Interactive chat interface for content assistance

4. Content Association
   - Metadata linking between RFP Q&A and FAQ entries
   - Related FAQ tracking and display using AG Grid
   - Version and status management
   - Visibility states: private, public, draft, pending_review, approved, rejected, archived, needs-work

## AI Assistance Architecture

### Research System
The application implements a sophisticated research system for gathering Hedgehog-related information:

1. Core Components:
   - `ResearchAgent` (`/kb_ref/kb_processor.py`)
     - Domain-specific search across Hedgehog resources
     - Architectural pattern matching
     - Result deduplication and processing
   
   - Search Domains:
     - docs.githedgehog.com
     - githedgehog.com/docs
     - github.com/hedgehog
     - githedgehog.com/blog
     - githedgehog.com/news
     - githedgehog.com/resources

2. Architectural Patterns:
   ```typescript
   interface PatternCategories {
     corePatterns: string[];      // Cloud native, network fabric, etc.
     haPatterns: string[];        // Active-active, redundancy, etc.
     networkPatterns: string[];   // ECMP, BGP, EVPN, etc.
     operationalPatterns: string[]; // Zero-touch provisioning, etc.
     scalingPatterns: string[];   // Horizontal/vertical scaling
     securityPatterns: string[];  // Microsegmentation, zero trust
     infrastructurePatterns: string[]; // Kubernetes, gitops
     performancePatterns: string[]; // Traffic engineering, QoS
   }
   ```

### Prompt System
The application implements a sophisticated prompt management system for AI interactions:

1. Core Components:
   - `usePrompts` Hook (`/app/hooks/usePrompts.ts`)
     - Manages prompt state and persistence
     - Provides prompt update functionality
     - Handles default fallbacks
     - Supports evolution tracking
   
   - `PromptPanel` Component (`/components/PromptPanel.tsx`)
     - Side panel UI for prompt viewing/editing
     - Real-time prompt updates
     - Type-specific prompt management
     - Technical depth controls

2. Prompt Types:
   ```typescript
   interface Prompts {
     quickUpdate: string;    // Enhanced content improvement with evolution tracking
     interactive: string;    // Edit page interactive chat with technical depth
     newEntry: string;      // New page interactive chat with evolution context
   }
   ```

3. Response Format:
   ```xml
   <response>
     <subtitle>[content]</subtitle>
     <body>[content]</body>
     <keywords>[content]</keywords>
     <explanation>[content]</explanation>
     <evolution_context>[content]</evolution_context>
     <technical_depth>[content]</technical_depth>
   </response>
   ```

### AI Integration Modes

1. Quick Update Mode:
   - Purpose: Enhanced content improvement with historical context
   - Components:
     - Auto-update endpoint (`/api/llm/kb/auto/route.ts`)
     - Research system integration
     - Loading state management
     - Field synchronization
   - Features:
     - Historical evolution tracking
     - Technical depth layering
     - Natural Hedgehog integration
     - SEO optimization
     - Enhanced technical verification
     - Format compliance

2. Interactive Chat Mode:
   - Purpose: Evolution-aware content creation/improvement
   - Components:
     - Chat interface (`KbLlmInteraction`)
     - Research context provider
     - Technical depth manager
     - Field synchronization
   - Features:
     - Evolution-based suggestions
     - Technical depth-aware assistance
     - Enhanced format guidance
     - Expanded technical verification

### Content Processing Pipeline

1. Input Processing:
   ```typescript
   interface KbEntry {
     title: string;
     subtitle: string;
     body: string;
     category: string;
     keywords: string;
     evolution_context?: string;
     technical_depth?: string;
   }
   ```

2. Research Steps:
   - Domain-specific searching
   - Architectural pattern matching
   - Result deduplication
   - Content validation

3. Verification Steps:
   - Technical accuracy check
   - Evolution context validation
   - Technical depth assessment
   - Format compliance validation
   - Source verification
   - Keyword relevance

4. Output Processing:
   - Evolution-aware formatting
   - Technical depth layering
   - Field validation
   - HTML/Markdown hybrid formatting
   - Keyword optimization

### Integration Points

1. OpenAI Integration:
   - Model: GPT-4-1106-preview
   - Temperature: 0.7
   - Max tokens: 4000
   - Error handling
   - Rate limiting

2. DuckDuckGo Integration:
   - Purpose: Technical verification
   - Search result processing
   - Source validation

### State Management

1. Form State:
   ```typescript
   interface FormData {
     article_title: string;
     article_subtitle: string;
     article_body: string;
     category: string;
     keywords: string;
     // ... other fields
   }
   ```

2. Prompt State:
   ```typescript
   interface PromptPanelState {
     isOpen: boolean;
     type: 'quickUpdate' | 'interactive' | 'newEntry';
     prompt: string;
   }
   ```

3. Chat State:
   ```typescript
   interface ChatState {
     messages: Message[];
     loading: boolean;
     error: string | null;
   }
   ```

### Security Considerations

1. Prompt Protection:
   - Validation before updates
   - Default fallbacks
   - Error boundaries

2. Content Validation:
   - Input sanitization
   - Format verification
   - Source checking

3. API Security:
   - Rate limiting
   - Error handling
   - Input validation

### Development Guidelines

1. Prompt Development:
   - Maintain technical accuracy
   - Include format requirements
   - Add context awareness
   - Provide clear guidance

2. Response Handling:
   - Parse XML format
   - Validate all sections
   - Handle missing fields
   - Maintain format compliance

3. UI Integration:
   - Consistent loading states
   - Clear error messages
   - Smooth field updates
   - Responsive design

### Testing Requirements

1. Prompt Testing:
   - Format validation
   - Response parsing
   - Error handling
   - Default fallbacks

2. Integration Testing:
   - API communication
   - State management
   - Field synchronization
   - Error scenarios

3. UI Testing:
   - Component rendering
   - User interactions
   - Loading states
   - Error displays

## Core Components

### Frontend (Next.js)
- Purpose: Provide user interface for content management
- Key interfaces: 
  - `/app/rfp-qa/`: RFP Q&A browsing interface with AG Grid
  - `/app/create-faq/`: FAQ generation workflow
    - Record selection view with AG Grid
    - Detail view with LLM interaction
    - SimpleMDE for both question and answer fields
    - Previous/Next Record navigation (white buttons with orange border)
  - `/app/faq/`: FAQ browsing and management interface
    - List view with AG Grid
    - Detail view with SimpleMDE editors
    - Related FAQs display with AG Grid
    - Previous/Next Record navigation (white buttons with orange border)
  - `/app/kb/`: Knowledge Base management
    - List view with AG Grid and category filtering
    - Detail view with SimpleMDE editor
    - LLM chat assistant for content creation
    - Citation management system
    - Import/Export functionality
- Dependencies: 
  - Next.js
  - AG Grid
  - TailwindCSS
  - SimpleMDE (dynamic import)
  - React Markdown
  - Remark GFM
  - OpenAI SDK
- File locations: 
  - `/app/rfp-qa/page.tsx`: Main RFP Q&A listing
  - `/app/create-faq/page.tsx`: FAQ creation entry point
  - `/app/create-faq/[rfp_id]/page.tsx`: FAQ generation interface
  - `/app/faq/[id]/page.tsx`: FAQ detail page
  - `/app/kb/page.tsx`: KB entries list
  - `/app/kb/[id]/page.tsx`: KB entry edit page
  - `/app/kb/new/page.tsx`: New KB entry page
  - `/app/kb/import/page.tsx`: Import KB entries
  - `/app/kb/export/page.tsx`: Export KB entries
  - `/app/api/`: API routes
  - `/app/components/`: Shared components
  - `/lib/llm/`: LLM service and utilities
  - `/lib/hooks/`: Custom React hooks

### Content Processing Pipeline
- **Format Utilities**
  - Purpose: Ensure consistent content formatting across the application
  - Components:
    - Title Formatter: Plain text processing
    - Subtitle Formatter: Educational glossary-style formatting
    - Body Formatter: HubSpot-compliant HTML processing
    - URL Generator: Standardized KB URL creation
  - Key Interfaces:
    ```typescript
    interface FormatUtils {
      formatKbTitle(title: string): string;
      formatKbSubtitle(subtitle: string): string;
      formatKbBody(body: string): string;
    }

    interface UrlUtils {
      generateKbUrl(category: string, title: string): string;
      shouldUpdateKbUrl(currentUrl: string | null): boolean;
    }
    ```
  - Update Triggers:
    - Content creation/editing
    - Quick Update operations
    - Batch content processing

### LLM Integration System
- **Quick Update Feature**
  - Purpose: AI-assisted KB entry enhancement
  - Components:
    - Research Agent: Gathers context from multiple sources
    - Content Generator: Creates formatted content
    - Quality Control: Validates output against requirements
  - Key Interfaces:
    ```typescript
    interface QuickUpdateRequest {
      title: string;
      subtitle: string;
      body: string;
      category: string;
      keywords: string;
      article_url: string;
      prompt: string;
    }

    interface QuickUpdateResponse {
      subtitle: string;
      body: string;
      keywords: string;
      article_url: string;
    }
    ```
  - Dependencies:
    - OpenAI GPT-4
    - DuckDuckGo Search
    - Format Utilities
    - URL Management

### Backend (API Routes)
- Purpose: Handle data operations and LLM integration
- Key endpoints:
  - `/api/rfp-qa/`: RFP Q&A operations
  - `/api/faq/`: FAQ CRUD operations
  - `/api/faq/[id]/`: Single FAQ operations
  - `/api/faq/[id]/navigation/`: Previous/Next navigation
  - `/api/faq/related/[id]/`: Related FAQ retrieval
  - `/api/llm/`: LLM interaction and FAQ generation
  - `/api/kb-entries/`: KB entries collection operations
  - `/api/kb-entries/[id]/`: Single KB entry operations
  - `/api/kb-llm/`: KB-specific LLM operations
- Dependencies:
  - Prisma ORM
  - PostgreSQL
  - OpenAI API
  - DuckDuckGo search

### Database (PostgreSQL)
- Purpose: Persistent storage for all content
- Key models:
  - RfpQa: Source Q&A content
    - Fields: id, question, answer, metadata, created_at, updated_at
    - Relations: One-to-many with FAQ model
  - Faq: Generated FAQ entries
    - Fields: id, question, answer, visibility, status, notes, metadata, created_at, updated_at
    - Relations: Optional relation to RfpQa for tracking source
    - Status options: draft, review, approved, archived
    - Visibility options: public, private
  - KbEntries: Knowledge Base entries
    - Fields: id, article_title, article_subtitle, article_body, category, subcategory, keywords, internal_status, visibility, notes, metadata
    - Status options: Draft, Review, Approved, Archived
    - Visibility options: Public, Private
    - Metadata includes: citations, technical verification results
- Schema location: `/prisma/schema.prisma`

### LLM Integration
- Purpose: Provide AI assistance for content creation and management
- Components:
  - OpenAI Service (`/lib/llm/openai.ts`)
    - Content generation
    - Citation processing
    - Technical verification
  - LLM Chat Component (`/components/LLMChat.tsx`)
    - Interactive chat interface
    - Real-time content updates
    - Citation management
  - Custom Hook (`/lib/hooks/useLLM.ts`)
    - State management
    - API interaction
    - Error handling
- Dependencies:
  - OpenAI API (GPT-4)
  - Web search for verification
  - Citation extraction system

## Implementation Details

### Navigation Pattern
1. Previous/Next Record Navigation
   - Location: FAQ detail, create-faq, and KB detail pages
   - Styling:
     - White background
     - Orange border (border-orange-600)
     - Orange text (text-orange-600)
     - Hover effect (hover:bg-orange-50)
   - Button text: "Previous Record" and "Next Record"
   - Implementation:
     ```typescript
     <button
       className="px-4 py-2 border border-orange-600 text-orange-600 rounded hover:bg-orange-50"
       onClick={handlePrevious}
     >
       Previous Record
     </button>
     ```

### LLM Integration Pattern
1. Service Layer
   ```typescript
   class LLMService {
     async generateContent(prompt: string, context: string): Promise<string>;
     async processWithCitations(text: string): Promise<CitationResult>;
     async verifyContent(content: string, context: string): Promise<VerificationResult>;
   }
   ```

2. React Hook
   ```typescript
   function useLLM() {
     const generateContent = async (prompt: string, context: string) => {...};
     const processCitations = async (text: string) => {...};
     const verifyContent = async (content: string, context: string) => {...};
     return { loading, error, generateContent, processCitations, verifyContent };
   }
   ```

3. Chat Component
   ```typescript
   function LLMChat({ context, onUpdateContent, onAddCitation }) {
     const { loading, generateContent, processCitations } = useLLM();
     // Implementation details...
   }
   ```

### React Patterns
1. React Hooks
   - useState for local state
   - useEffect for side effects
   - useMemo for performance
   - React.use() for params
   - Custom hooks for reusable logic

2. Component Organization
   - Page components in app directory
   - Shared components in components directory
   - Utility functions in lib directory
   - API routes in api directory

3. Data Flow
   - Props for parent-child communication
   - Context for global state
   - API calls for data persistence
   - LLM service for AI operations

4. Error Handling
   - Try-catch blocks in async operations
   - Error boundaries for component errors
   - Loading states for async operations
   - User-friendly error messages

## Development Guidelines
1. Code Organization
   - Follow Next.js app directory structure
   - Keep components focused and reusable
   - Use TypeScript for type safety
   - Implement proper error handling

2. State Management
   - Use React hooks for local state
   - Implement proper loading states
   - Handle errors gracefully
   - Maintain consistent data flow

3. UI/UX Standards
   - Use TailwindCSS for styling
   - Follow consistent color scheme
   - Implement responsive design
   - Provide loading indicators

4. API Design
   - RESTful endpoints
   - Proper error responses
   - Input validation
   - Consistent response format

5. Database Operations
   - Use Prisma for type safety
   - Implement proper transactions
   - Handle edge cases
   - Maintain data integrity

## SimpleMDE Implementation Pattern
**CRITICAL: DO NOT REMOVE OR MODIFY THIS SECTION**

The SimpleMDE editor is used for all Markdown editing in the application. This pattern MUST be followed exactly to prevent focus loss issues:

```typescript
// 1. Dynamic Import
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false  // Required to prevent hydration issues
});

// 2. Memoized Options
const editorOptions = useMemo(() => ({
  spellChecker: false,
  status: false,
  toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "preview"],
}), []);

// 3. Memoized Change Handler (CRITICAL)
const handleChange = useMemo(() => (value: string) => {
  setValue(value);
}, []);

// 4. Component Usage
<SimpleMDE
  value={value}
  onChange={handleChange}
  options={editorOptions}
/>
```

#### Requirements
1. Dynamic Import with ssr: false
2. Memoized options object
3. Memoized change handler
4. Never use setState directly as onChange

#### Known Locations
1. `/app/faq/new/page.tsx`
2. `/app/create-faq/[rfp_id]/page.tsx`
3. `/app/faq/[id]/page.tsx`
4. `/app/kb/new/page.tsx`
5. `/app/kb/[id]/page.tsx`

#### Error Identification
The focus loss bug manifests as:
- Single character input only
- Focus loss after each keystroke
- Required repeated clicking

If these symptoms appear, verify implementation against this pattern.

## Content Formatting System
- **HTML Tag Management**
  - Whitelist of allowed tags and attributes
  - Support for text alignment and decoration
  - Markdown to HTML conversion
  - Cross-linking capability

- **URL Management**
  - Pattern: `https://githedgehog.com/kb/{category}/{slug}`
  - Slug generation from title
  - Preservation of existing valid URLs
  - Validation system

### SEO Optimization
- **Content Length Guidelines**
  - Subtitle: 1-2 sentences
  - Body: 300-1000 words (optimized for search)
  - Keywords: 5-8 relevant technical terms

- **Keyword Integration**
  - Primary topic keywords
  - Related technical terms
  - Problem-solving keywords
  - Industry-standard terminology

### Quality Control System
- **Content Validation**
  - Technical accuracy checks
  - Format compliance verification
  - SEO optimization validation
  - Cross-linking suggestions

- **Business Value Alignment**
  - Hedgehog reference validation
  - Value proposition integration
  - Use case relevance
  - Technical depth assessment
