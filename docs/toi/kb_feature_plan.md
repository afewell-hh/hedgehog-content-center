# Knowledge Base Integration Feature Plan

## Overview
This document outlines the plan for integrating Hubspot Knowledge Base content into the Hedgehog Content Center (HCC). The feature will mirror the existing FAQ functionality but will be adapted for Knowledge Base entries, with specific considerations for different categories (initially Glossary, with architecture supporting future categories including eventual FAQ migration).

## Implementation Status
Last Updated: 2025-02-02

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

3. Status and Visibility Logic
   - Implemented status mapping rules
   - Added UI helpers for status fields

### In Progress 
1. UI Implementation
   - KB List Page
   - Create/Edit KB Entry Form
   - Import/Export Interface

2. Import/Export System
   - CSV File Upload Interface
   - Version Conflict Handling
   - Export Generation

### Pending 
1. LLM Integration
   - Interactive Mode
   - Non-Interactive Mode
   - Citation Management

## Core Components

### 1. Database Schema 
#### New Table: kb_entries 
##### Hubspot Fields:
- id (Primary Key)
- knowledge_base_name (String, enum: "KB")
- article_title (String)
- article_subtitle (String)
- article_language (String, enum: "English")
- article_url (String) - Uniqueness identifier for version conflict resolution
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
- Article Title field
- Article Subtitle field
- Article Body field (SimpleMDE)
- Category selector (initially only Glossary enabled)
- Internal Status selector
- Visibility selector
- Notes field
- Keywords field

LLM Integration:
1. Interactive Mode:
   - Chat-style interface similar to FAQ edit page
   - Context-aware of current field values
   - Category-specific prompting
   - DuckDuckGo search integration

2. Non-Interactive Mode:
   - "Update KB Entry" button
   - Uses kb_processor.py prompt system
   - Writer/Editor agent pattern
   - Technical verification
   - Automatic updates to fields

### 5. LLM Integration 
#### A. Interactive Mode
- Purpose: User-driven updates with real-time assistance
- Implementation matching FAQ pages:
  - Chat-style interface in same location
  - Conversation history display below
  - Context includes Article Title, Subtitle, and Body
- Citation Requirements:
  - Numbered citations in content ([1], [2], etc.)
  - Footnotes section at bottom of Article Body
  - Format: [n]: URL
  - Preserve existing citations when updating
  - Remove unused citations
  - Add new citations as needed
- Components:
  - Chat interface
  - Field-aware context
  - Category-specific help
  - Citation management

#### B. Non-Interactive Mode
- Purpose: Automated content improvement
- UI Elements:
  - "Update KB Entry" button
  - Confirmation dialog explaining the action
  - Tooltip/hover text explaining functionality
- Components:
  - Writer agent
  - Editor agent
  - DuckDuckGo verification
  - Citation management (same as interactive mode)
  - Structured response format

#### C. Citation Management
Citation Rules:
1. Format:
   - Use plaintext bracketed numbers: [1], [2], etc.
   - No rich text formatting to ensure Hubspot compatibility
   - Citations can appear in Article Subtitle and Body
   - Footnotes section only appears in Article Body
   - Footnotes section starts with "References:"

2. Citation Ordering:
   - Numbers assigned in order of appearance
   - Subtitle citations are processed first
   - Body citations are processed second
   - Example:
     ```
     Subtitle: This is a concept [1] with context [2]
     Body: More details about [3] and revisiting first concept [1].
     
     References:
     [1]: https://example.com/first
     [2]: https://example.com/second
     [3]: https://example.com/third
     ```

3. URL Deduplication:
   - Each unique URL gets one citation number
   - Repeated citations of same URL reuse the original number
   - Example:
     ```
     Body: First reference [1], second reference [2], 
     then citing first source again [1].
     
     References:
     [1]: https://example.com/first
     [2]: https://example.com/second
     ```

4. Update Process:
   - Extract existing citations and URLs
   - Build URL-to-number mapping
   - Process subtitle citations first
   - Process body citations second
   - Generate new footnotes section
   - Replace old footnotes section

5. Implementation Details:
```typescript
interface Citation {
  number: number;
  url: string;
  locations: {
    field: 'subtitle' | 'body';
    position: number;
  }[];
}

interface CitationManager {
  // Track URL to citation number mapping
  urlMap: Map<string, number>;
  
  // Process citations in correct order
  processCitations(subtitle: string, body: string): {
    newSubtitle: string;
    newBody: string;
    citations: Citation[];
  };

  // Extract citations from text
  extractCitations(text: string): Citation[];

  // Generate footnotes section
  generateFootnotes(citations: Citation[]): string;

  // Update content preserving non-citation text
  updateContent(originalContent: string, citations: Citation[]): string;
}
```

6. LLM Integration:
   - Prompt Design:
     ```
     Given the following KB entry:
     Title: {title}
     Subtitle: {subtitle}
     Body: {body}

     Update the content to be more accurate and comprehensive.
     Requirements:
     1. Use numbered citations [1] to support key facts
     2. Cite authoritative sources
     3. Maintain existing accurate citations
     4. Remove outdated citations
     5. Place footnotes at end of body

     Response Format:
     {
       "subtitle": "Updated subtitle with [n] citations",
       "body": "Updated body with [n] citations\n\nReferences:\n[1]: url1\n[2]: url2",
       "reasoning": "Brief explanation of changes and citations"
     }
     ```

7. Error Handling:
   - Invalid citation format detection
   - Missing reference detection
   - URL validation
   - Footnotes section integrity checks

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
1. Review database backup and migration process
2. Create test database for migration validation
3. Prepare migration scripts
4. Review citation management approach
5. Begin implementation with Phase 1
