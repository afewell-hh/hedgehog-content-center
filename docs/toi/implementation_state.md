# Implementation State

## Core Architecture
- Next.js application with TypeScript and app directory structure
- PostgreSQL database with Prisma ORM for data persistence
- AG Grid for efficient data display and interaction
- OpenAI GPT-4 integration for content generation and verification
- TailwindCSS for styling
- SimpleMDE for Markdown editing (both question and answer fields)
- DuckDuckGo integration for technical verification

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
    - Interactive LLM dialogue with technical verification
    - Real-time content refinement
    - Dialogue history tracking with fixed height and scrollbar
    - Status and visibility management
    - Notes field
    - Related FAQ display using AG Grid
    - SimpleMDE for both question and answer fields
    - Consistent card-based layout
- Location:
  - List view: `/app/create-faq/page.tsx`
  - Detail view: `/app/create-faq/[rfp_id]/page.tsx`
  - LLM API: `/app/api/llm/route.ts`
  - FAQ API: `/app/api/faq/route.ts`
- Dependencies: OpenAI API, SimpleMDE, Prisma, PostgreSQL, DuckDuckGo search

### FAQ Management (/app/faq/)
- Description: Interface for browsing and editing FAQ entries
- Implementation:
  - AG Grid with filtering
  - Status management (draft/review/approved/archived)
  - Visibility controls (public/private)
  - Enhanced detail page features:
    - Previous/Next record navigation with "Previous Record" and "Next Record" buttons
    - White buttons with orange border and text for navigation
    - LLM interaction with dialogue history
    - SimpleMDE for question and answer editing
    - Related FAQs display using AG Grid
    - Consistent card-based layout matching create-faq
- Location:
  - List view: `/app/faq/page.tsx`
  - Detail view: `/app/faq/[id]/page.tsx`
  - Navigation API: `/app/api/faq/[id]/navigation/route.ts`
  - FAQ API: `/app/api/faq/[id]/route.ts`
  - Related FAQs API: `/app/api/faq/related/[id]/route.ts`
- Dependencies: AG Grid, SimpleMDE, Prisma, PostgreSQL, OpenAI API

### Knowledge Base Management (/app/kb/)
- Description: Comprehensive system for managing Knowledge Base entries
- Implementation:
  - Core Features:
    - AG Grid list view with category filtering
    - Detail view with SimpleMDE editor
    - AI Assistance section with dual LLM modes:
      - Interactive chat with card-based UI
      - Non-interactive quick update with visual feedback
    - Citation management system
    - Import/Export functionality with CSV support
    - Category-based organization
    - Status tracking (Draft/Review/Approved/Archived)
    - Visibility control (Public/Private)
    - Technical verification system
  - Navigation:
    - Main KB list page
    - New entry page with interactive chat
    - Edit entry page with both LLM modes
    - Import page
    - Export page
  - LLM Integration:
    - Interactive Mode:
      - Card-based chat interface
      - Feature list and descriptive icon
      - Context-aware assistance
      - Real-time suggestions
    - Non-Interactive Mode:
      - Quick update card with feature list
      - Loading state animation
      - Confirmation dialog
      - Automatic content improvement
    - Shared Features:
      - Content generation assistance
      - Citation processing
      - Technical verification
      - Source validation
- Location:
  - List view: `/app/kb/page.tsx`
  - Detail view: `/app/kb/[id]/page.tsx`
  - New entry: `/app/kb/new/page.tsx`
  - Import: `/app/kb/import/page.tsx`
  - Export: `/app/kb/export/page.tsx`
  - KB API: `/app/api/kb-entries/route.ts`
  - KB Entry API: `/app/api/kb-entries/[id]/route.ts`
  - KB LLM API: `/app/api/llm/kb/route.ts`
  - KB Auto LLM API: `/app/api/llm/kb/auto/route.ts`
  - LLM Service: `/lib/llm/openai.ts`
  - LLM Hook: `/lib/hooks/useLLM.ts`
  - LLM Chat Component: `/components/LLMChat.tsx`
- Dependencies: AG Grid, SimpleMDE, Prisma, PostgreSQL, OpenAI API, DuckDuckGo search

### AG Grid Implementation
- Required Modules:
  - ValidationModule for error handling
  - DateFilterModule for date filtering
  - PaginationModule for pagination support
  - TextFilterModule for text filtering
- Theme Configuration:
  - Set to 'legacy' theme
  - Proper CSS imports in layout
- Column Configuration:
  - Actions column simplified to Edit link
  - Date filters enabled
  - Text filtering enabled

### Form Implementation
- Field Organization:
  - Article Title (text input)
  - Article Subtitle (SimpleMDE editor)
  - Article Body (SimpleMDE editor)
  - Category selector
  - Status and visibility controls
- Editor Configuration:
  - Both subtitle and body use SimpleMDE
  - Consistent options across editors
  - Focus handling improvements
- Security Features:
  - Password manager prevention
  - Form submission handling
  - HTML structure validation

### SimpleMDE Editor Implementation
**CRITICAL: DO NOT REMOVE OR MODIFY THIS SECTION WITHOUT EXPLICIT APPROVAL**

The application uses SimpleMDE editors extensively for Markdown editing. A recurring focus loss issue has been identified and resolved multiple times. This section documents the current state and requirements.

#### Current Implementation Status
- All SimpleMDE instances MUST follow this exact pattern:
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

#### Implementation Locations
The pattern is currently implemented in:
1. `/app/faq/new/page.tsx`
2. `/app/create-faq/[rfp_id]/page.tsx`
3. `/app/faq/[id]/page.tsx`
4. `/app/kb/new/page.tsx`
5. `/app/kb/[id]/page.tsx`

#### Error Identification
The focus loss bug manifests as:
- Cursor jumping to start
- Required repeated clicking

If these symptoms appear, verify implementation against this pattern.

### Hubspot Formatting Rules
**CRITICAL: DO NOT MODIFY THESE RULES WITHOUT EXPLICIT APPROVAL**

The application enforces specific formatting rules for Hubspot compatibility:

#### 1. Article Title Format
- Plain text only, no HTML or markdown
- Lowercase with hyphens for spaces
- Example: "back-end-network", "north-south-traffic"
- Implementation: `formatKbTitle` in `/lib/formatUtils.ts`

#### 2. Article Subtitle Format
- Plain text only
- No HTML or markdown formatting
- Allows punctuation and technical terms
- Implementation: `formatKbSubtitle` in `/lib/formatUtils.ts`

#### 3. Article Body Format
- Hybrid HTML/Markdown format
- HTML elements:
  - Paragraphs must use `<p>` tags
  - Line breaks use `<br>` tags
- Markdown elements:
  - Bold text uses `**text**`
  - Lists can use either HTML or markdown
- Implementation: `formatKbBody` in `/lib/formatUtils.ts`

#### Implementation Details
1. Format Utilities (`/lib/formatUtils.ts`):
   - `formatKbTitle`: Ensures lowercase with hyphens
   - `formatKbSubtitle`: Strips HTML/markdown
   - `formatKbBody`: Enforces hybrid format
   - `formatLlmResponse`: Formats all LLM responses

2. LLM Integration:
   - Updated prompts to enforce formatting
   - Format validation before saving
   - Clear error messages for format violations

3. UI Components:
   - Form validation for format rules
   - Preview shows formatted content
   - Help text explains format requirements

#### Verification Steps
To verify format compliance:
1. Title should be lowercase with hyphens
2. Subtitle should be plain text
3. Body should have:
   - Paragraphs in `<p>` tags
   - Line breaks as `<br>`
   - Bold text as `**text**`

### LLM Integration Updates
1. Interactive Mode (`/app/components/KbLlmInteraction.tsx`):
   - Removed nested form elements
   - Added keyboard shortcuts (Cmd/Ctrl + Enter)
   - Improved loading states
   - Format validation for responses

2. Auto-Update Mode (`/app/api/llm/kb/auto/route.ts`):
   - Enhanced prompt with format rules
   - Automatic format correction
   - Improved error handling
   - Technical accuracy checks

3. Shared Features:
   - Format utilities for responses
   - Consistent error handling
   - Loading state indicators
   - Clear success/error messages

## In Progress Features
None - All planned features are currently implemented

## Known Issues and Implementation Requirements

## Critical Dependencies
1. OpenAI API
   - Version: GPT-4
   - Purpose: Content generation, verification, and citation processing
   - Integration: `/lib/llm/openai.ts`

2. Prisma ORM
   - Version: Latest
   - Purpose: Database operations
   - Schema: `/prisma/schema.prisma`

3. AG Grid
   - Version: Latest
   - Purpose: Data display and interaction
   - CSS: Imported in layout.tsx

4. SimpleMDE
   - Version: Latest
   - Purpose: Markdown editing
   - Implementation: See SimpleMDE section above

5. DuckDuckGo Search
   - Purpose: Technical verification
   - Integration: `/lib/llm/openai.ts`

## Environment Variables
Required variables:
```
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
OPENAI_API_KEY="your-api-key-here"
