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
   - Dedicated "AI Assistance" section with clear heading
   - Card-based interface with blue theme and chat icon
   - Feature list explaining capabilities:
     - Ask specific questions
     - Get writing suggestions
     - Refine content iteratively
   - Full-width chat interface below feature list
   - Conversation history with fixed height and scrollbar
   - Aware of Article Title, Subtitle, and Body
   - Category-specific prompting
   - DuckDuckGo search integration

2. Non-Interactive Mode:
   - Green-themed card with lightning bolt icon
   - Feature list explaining capabilities:
     - Fact-checks against reliable sources
     - Adds relevant citations
     - Improves clarity and completeness
   - "Update with AI" button with loading animation
   - Confirmation dialog explaining the process
   - Side-by-side features and button layout
   - Writer agent for content generation
   - Editor agent for refinement
   - DuckDuckGo verification
   - Citation management system

### 5. LLM Integration 
#### A. Interactive Mode
- Purpose: User-driven updates with real-time assistance
- Implementation:
  - Dedicated "AI Assistance" section with clear heading
  - Card-based interface with blue theme and chat icon
  - Feature list explaining capabilities:
    - Ask specific questions
    - Get writing suggestions
    - Refine content iteratively
  - Full-width chat interface below feature list
  - Conversation history with fixed height and scrollbar
- Context Integration:
  - Aware of Article Title, Subtitle, and Body
  - Category-specific prompting
  - DuckDuckGo search integration
- Citation Requirements:
  - Numbered citations in content ([1], [2], etc.)
  - Footnotes section at bottom of Article Body
  - Format: [n]: URL
  - Preserve existing citations when updating
  - Remove unused citations
  - Add new citations as needed

#### B. Non-Interactive Mode
- Purpose: Automated content improvement
- UI Elements:
  - Green-themed card with lightning bolt icon
  - Feature list explaining capabilities:
    - Fact-checks against reliable sources
    - Adds relevant citations
    - Improves clarity and completeness
  - "Update with AI" button with loading animation
  - Confirmation dialog explaining the process
  - Side-by-side features and button layout
- Technical Components:
  - Writer agent for content generation
  - Editor agent for refinement
  - DuckDuckGo verification
  - Citation management system

#### C. Implementation Details
- Edit Page (`/app/kb/[id]/page.tsx`):
  - Both Interactive and Non-Interactive modes
  - Stacked card layout with full width
  - Clear visual hierarchy and spacing
  - Consistent styling with other KB pages

- New Entry Page (`/app/kb/new/page.tsx`):
  - Interactive mode only
  - Matching card-based styling
  - Same feature list and chat interface

- API Endpoints:
  - `/api/llm/kb/`: Interactive chat endpoint
  - `/api/llm/kb/auto/`: Non-interactive update endpoint

- Components:
  - LLM Chat component for interactive mode
  - Loading states and animations
  - Error handling and user feedback
  - Consistent card component styling

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
