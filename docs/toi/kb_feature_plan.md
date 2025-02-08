# Knowledge Base Integration Feature Plan

## Overview
This document outlines the plan for integrating Hubspot Knowledge Base content into the Hedgehog Content Center (HCC). The feature will mirror the existing FAQ functionality but will be adapted for Knowledge Base entries, with specific considerations for different categories (initially Glossary, with architecture supporting future categories including eventual FAQ migration).

## Implementation Status
Last Updated: 2025-02-02 19:32 PST

### Completed Features 
1. Database Schema
   - Created kb_entries table with all required fields
   - Implemented Hubspot compatibility
   - Added HCC-specific fields
   - Applied database migration

2. API Routes
   - Implemented collection endpoints (/api/kb-entries)
   - Implemented individual endpoints (/api/kb-entries/[id])
   - Added validation and error handling
   - Set up status management system

3. KB Management UI
   - Created KB List page with AG Grid
   - Implemented category filtering
   - Added status color coding
   - Created New KB Entry form
   - Integrated SimpleMDE editor
   - Added client-side validation

4. Import/Export System
   - Implemented CSV file upload with Papa Parse
   - Added version conflict detection and handling
   - Created category-based filtering
   - Added progress tracking and error reporting
   - Implemented Hubspot-compatible export
   - Added validation and error handling

5. LLM Integration
   - Set up OpenAI integration
   - Created interactive chat interface
   - Implemented citation management
   - Added technical verification
   - Integrated with KB entry editor
   - Added content generation assistance

### In Progress 
1. Testing & Documentation
   - Unit tests for API routes
   - Integration tests for LLM features
   - User documentation
   - API documentation

## Detailed Component Status

### 1. Database Schema 
#### New Table: kb_entries 
##### Hubspot Fields:
- id (Primary Key)
- knowledge_base_name (String, enum: "KB")
- article_title (String)
- article_subtitle (String)
- article_language (String, enum: "English")
- article_url (String) - Uniqueness identifier for version conflict resolution
  > **Note:** The article_url field generation is currently partially implemented but intentionally not fully functional. This is to preserve Hubspot's ability to manage URLs and maintain entry relationships. The current implementation includes URL generation logic but does not actively update the field in postgres. This state should be maintained until Hubspot integration requirements are fully addressed.
- article_body (Text)
- category (String, enum: ["Glossary", "FAQs", "Getting started", "Troubleshooting", "General", "Reports", "Integrations"])
- subcategory (String)
- keywords (String)
- last_modified_date (DateTime)
- status (String, enum: ["DRAFT", "PUBLISHED"]) - Derived from HCC fields
- archived (Boolean)

##### HCC-Specific Fields:
- internal_status (String, enum: ["Draft", "Review", "Approved", "Archived"]) - Maps to FAQ status
- visibility (String, enum: ["Public", "Private"]) - Maps to FAQ visibility
- notes (Text)
- metadata (JSON)
- created_at (DateTime)
- updated_at (DateTime)

### 2. Status and Visibility Logic 
#### Status Mapping Rules:
1. Hubspot Status Field Logic:
   - Set to "PUBLISHED" when:
     - internal_status = "Approved" AND visibility = "Public"
   - Set to "DRAFT" for all other combinations
   - Note: Private+Approved is valid for HCC-only entries

2. Import Status Mapping:
   - When importing records with status = "PUBLISHED":
     - Set internal_status = "Approved"
     - Set visibility = "Public"
   - When importing records with status = "DRAFT" or other:
     - Set internal_status = "Draft"
     - Set visibility = "Private"

3. Export Rules:
   - Only export records with status = "PUBLISHED"
   - Maintain all Hubspot fields exactly as required
   - Private entries are maintained in HCC only

4. UI Helpers:
   - Tooltip on status fields explaining:
     - Which combinations result in PUBLISHED status
     - That private entries can be approved but won't be exported
     - That private entries are for HCC-internal use

### 3. Import/Export System 
#### Import Page (`/app/kb/import/page.tsx`)
Features:
- CSV file upload interface
- Category filtering (single category selection)
- Version conflict handling:
  1. Detect conflicts by Article URL
  2. Compare Last Modified Date
  3. Display warning: "N records will be overwritten"
  4. Require user confirmation to proceed
  5. Backup overwritten records to log file before replacement
- Progress tracking
- Error handling and display
- Success confirmation

#### Export Page (`/app/kb/export/page.tsx`)
Features:
- Category filtering:
  - Select specific categories to export
  - "All Categories" option
- Only export PUBLISHED records
- Generate exact Hubspot CSV format
- Progress tracking
- Download interface

### 4. KB Management Pages 
#### A. KB List Page (`/app/kb/page.tsx`)
- AG Grid implementation
- Columns:
  - Article Title
  - Category (with filter)
  - Status (both Hubspot and internal)
  - Last Modified Date
  - Visibility
- Features:
  - Category-based filtering
  - Status filtering
  - Links to Import/Export pages
  - Create New button (Category selection required)

#### B. Create/Edit KB Entry Page (`/app/kb/[id]/page.tsx`)
Form Layout:
- Article Title field (text input)
- Article Subtitle field (SimpleMDE editor)
- Article Body field (SimpleMDE editor)
- Category selector (initially only Glossary enabled)
- Internal Status selector
- Visibility selector
- Notes field
- Keywords field

Form Implementation:
- Field Organization:
  - Logical grouping of related fields
  - Clear visual hierarchy
  - Consistent spacing and alignment
- Editor Configuration:
  - SimpleMDE for both subtitle and body
  - Consistent toolbar options
  - Focus handling improvements
  - Proper event handling
- Security Features:
  - Password manager prevention with data-lpignore
  - Form submission handling
  - HTML structure validation
  - Proper event bubbling control

AG Grid Implementation:
- Required Modules:
  - ValidationModule for error handling
  - DateFilterModule for date filtering
  - PaginationModule for pagination support
  - TextFilterModule for text filtering
- Theme Configuration:
  - Set to 'legacy' theme
  - Proper CSS imports in layout
- Column Configuration:
  - Actions column with Edit link
  - Date filters enabled
  - Text filtering enabled
  - Consistent column widths
  - Proper cell formatting

LLM Integration:
1. Interactive Mode:
   - Dedicated "AI Assistance" section with clear heading
   - Card-based interface with blue theme and chat icon
   - Enhanced feature list:
     - Historical evolution tracking
     - Technical depth layering
     - Natural Hedgehog integration
     - SEO optimization
     - Enhanced technical verification
   - Full-width chat interface below feature list
   - Evolution-aware conversation history
   - Technical depth controls
   - Research system integration
   - Category-specific prompting

2. Quick Update Mode:
   - One-click improvement with progress indicator
   - Enhanced research capabilities:
     - Domain-specific searching across:
       - docs.githedgehog.com
       - githedgehog.com/docs
       - github.com/hedgehog
       - githedgehog.com/blog
       - githedgehog.com/news
       - githedgehog.com/resources
     - Architectural pattern matching for:
       - Core Hedgehog Patterns
       - High Availability Patterns
       - Network Patterns
       - Operational Patterns
       - Scaling Patterns
       - Security Patterns
       - Modern Infrastructure
       - Performance Patterns
   - Result processing with:
     - Content hashing for deduplication
     - Structured parsing
     - Timestamp tracking
     - Enhanced error handling

3. Prompt Management:
   - Side panel for prompt customization
   - Enhanced prompt templates:
     - Quick Update:
       - Historical evolution tracking
       - Technical depth layering
       - Natural Hedgehog integration
       - SEO optimization
       - Technical verification requirements
       - Hubspot formatting rules
     - Interactive Chat (Edit):
       - Context-aware assistance with evolution tracking
       - Technical depth-aware guidance
       - Format preservation with enhanced rules
       - Technical accuracy focus with expanded verification
     - Interactive Chat (New):
       - Empty state handling with historical context
       - Evolution-based content structuring
       - Technical depth layering guidance
       - Format requirements with enhanced rules

4. Response Format:
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

5. Research System:
   - Domain-specific search implementation
   - Architectural pattern matching
   - Result deduplication and processing
   - Enhanced error handling and logging
   - Rate limiting and caching

### 5. Hubspot Content Format Compliance
#### A. Format Requirements
1. Article Title:
   - Plain text only
   - Lowercase with hyphens
   - No HTML or markdown
   - Example: "back-end-network"

2. Article Subtitle:
   - Plain text only
   - No formatting (HTML/markdown)
   - Technical terms allowed
   - Punctuation allowed

3. Article Body:
   - Hybrid HTML/Markdown format
   - HTML requirements:
     - Paragraphs in `<p>` tags
     - Line breaks as `<br>`
   - Markdown allowed:
     - Bold text as `**text**`
     - Lists in either format

#### B. Implementation Components
1. Format Utilities (`/lib/formatUtils.ts`):
   ```typescript
   // Title formatting
   export function formatKbTitle(title: string): string {
     return title
       .trim()
       .toLowerCase()
       .replace(/[^a-z0-9\s-]/g, '')
       .replace(/\s+/g, '-');
   }

   // Subtitle formatting
   export function formatKbSubtitle(subtitle: string): string {
     return subtitle
       .trim()
       .replace(/[<>]/g, '')
       .replace(/\*\*/g, '')
       .replace(/\*/g, '')
       .replace(/#{1,6}\s/g, '')
       .replace(/`/g, '');
   }

   // Body formatting
   export function formatKbBody(body: string): string {
     // Wrap paragraphs in <p> tags
     let formatted = body
       .split('\n\n')
       .map(para => para.trim())
       .filter(para => para)
       .map(para => {
         if (para.startsWith('<') && para.endsWith('>')) {
           return para;
         }
         return `<p>${para}</p>`;
       })
       .join('\n\n');

     // Handle line breaks
     formatted = formatted.replace(/(?<!\>)\n(?!\<)/g, '<br>');
     formatted = formatted.replace(/<br><br>/g, '</p>\n\n<p>');

     // Keep markdown bold
     formatted = formatted.replace(/\*\*(.*?)\*\*/g, '**$1**');

     return formatted;
   }
   ```

2. LLM Integration:
   - Updated prompts with format rules
   - Response formatting utilities
   - Format validation before saving

3. UI Components:
   - Form validation for formats
   - Preview functionality
   - Format help tooltips

#### C. Testing Requirements
1. Title Format Tests:
   - Converts to lowercase
   - Replaces spaces with hyphens
   - Removes special characters
   - Handles edge cases

2. Subtitle Format Tests:
   - Removes HTML tags
   - Removes markdown formatting
   - Preserves punctuation
   - Preserves technical terms

3. Body Format Tests:
   - Proper paragraph wrapping
   - Correct line break handling
   - Markdown bold preservation
   - List format handling

### 6. API Routes
New routes needed:
- `/api/kb/`: KB CRUD operations
- `/api/kb/[id]/`: Single KB entry operations
- `/api/kb/[id]/navigation/`: Previous/Next navigation
- `/api/kb/import/`: CSV import with filtering
- `/api/kb/export/`: CSV export with filtering
- `/api/llm/kb/`: KB-specific LLM interaction
- `/api/llm/kb/auto/`: Non-interactive LLM updates

### 7. Database Management and Migration Process

#### Pre-Migration Steps
1. Database Backup:
   ```bash
   # Connect to PostgreSQL
   psql -h localhost -U postgres
   # List databases to confirm name
   \l
   # Exit psql
   \q
   
   # Create backup directory if it doesn't exist
   mkdir -p ~/hcc_db_backups
   
   # Backup the database
   pg_dump -h localhost -U postgres hedgehog > ~/hcc_db_backups/pre_kb_migration_$(date +%Y%m%d_%H%M%S).sql
   ```

2. Verify Backup:
   ```bash
   # Create a test database
   createdb -h localhost -U postgres hedgehog_test
   
   # Restore backup to test database
   psql -h localhost -U postgres hedgehog_test < ~/hcc_db_backups/pre_kb_migration_*.sql
   
   # Verify data in test database
   psql -h localhost -U postgres hedgehog_test
   # Run some verification queries
   SELECT COUNT(*) FROM rfp_qa;
   SELECT COUNT(*) FROM faq;
   \q
   
   # Drop test database
   dropdb -h localhost -U postgres hedgehog_test
   ```

#### Prisma Migration Process
1. Create Migration:
   ```bash
   # Generate the migration
   npx prisma migrate dev --name add_kb_tables --create-only
   ```

2. Review Migration:
   - Check generated migration in `prisma/migrations`
   - Ensure it only adds new tables/fields
   - Verify no destructive changes to existing tables

3. Apply Migration:
   ```bash
   # Apply the migration
   npx prisma migrate deploy
   ```

4. Post-Migration Verification:
   ```bash
   # Connect to PostgreSQL
   psql -h localhost -U postgres hedgehog
   
   # Verify existing data
   SELECT COUNT(*) FROM rfp_qa;
   SELECT COUNT(*) FROM faq;
   
   # Verify new tables
   SELECT COUNT(*) FROM kb_entries;
   \d kb_entries
   ```

#### Data Recovery (if needed)
```bash
# If data is lost during migration:

# Drop affected tables
psql -h localhost -U postgres hedgehog
DROP TABLE kb_entries;
\q

# Restore from backup
psql -h localhost -U postgres hedgehog < ~/hcc_db_backups/pre_kb_migration_*.sql
```

#### Common Issues and Solutions
1. Lost Data After Migration:
   - Always use `--create-only` flag first
   - Review migration before applying
   - Keep backup ready for restore

2. Connection Issues:
   - Verify PostgreSQL is running
   - Check connection string in `.env`
   - Confirm port (default 5432)

3. Permission Issues:
   - Verify postgres user permissions
   - Check database owner
   - Ensure proper role assignments

#### Database Connection Details
```typescript
// .env file
DATABASE_URL="postgresql://postgres:password@localhost:5432/hedgehog"

// Prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Implementation Phases

### Phase 1: Foundation
1. Create KB database schema with HCC extensions
2. Implement base API routes
3. Create KB list page
4. Add import/export pages with filtering

### Phase 2: Core Features
1. Implement create/edit pages
2. Add SimpleMDE integration
3. Implement navigation
4. Add status/visibility logic

### Phase 3: LLM Integration
1. Implement interactive mode
2. Port kb_processor.py logic for non-interactive mode
3. Add DuckDuckGo integration
4. Implement category-specific prompts

### Phase 4: Polish
1. Style consistency verification
2. Error handling
3. Loading states
4. Documentation updates

## Critical Requirements

### SimpleMDE Implementation
Must follow existing pattern:
```typescript
// 1. Dynamic Import
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false
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
```

### Citation Implementation Notes
1. Storage Considerations:
   - Citations stored as plaintext
   - No metadata/markup requirements
   - Compatible with Hubspot import/export

2. Performance Optimization:
   - Cache URL-to-citation mappings
   - Minimize content parsing passes
   - Efficient citation number reassignment

3. Edge Cases:
   - Empty citation sections
   - Invalid citation numbers
   - Malformed URLs
   - Missing references
   - Citations in wrong order

## Outstanding Questions

1. Citation Management:
   - Should we validate URLs before including them?
   - Should we have a maximum citation limit?
   - Should we track citation usage metrics?

2. LLM Integration:
   - Should we implement source quality ranking?
   - Should we cache frequently cited URLs?
   - Should we track citation success rates?

## Next Steps
1. Complete Testing & Documentation
   - Write unit tests for API routes
   - Create integration tests for LLM features
   - Write user documentation
   - Document API endpoints

2. Quality Assurance
   - Perform end-to-end testing
   - Validate LLM responses
   - Test citation accuracy
   - Verify content validation

## Notes
- All core database and API functionality is complete
- Basic UI components are in place
- Import/Export system is now complete
- LLM integration is now complete
- Focus shifting to testing and documentation
- Regular testing throughout development
