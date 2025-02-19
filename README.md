# Hedgehog Content Center

A Next.js application for managing knowledge base content with AI-powered features.

## Prerequisites

1. Node.js (v18 or later)
2. PostgreSQL (v14 or later)
3. npm or yarn package manager

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/afewell-hh/hedgehog-content-center.git
cd hedgehog-content-center

# Install dependencies
npm install
```

### 2. Database Setup

#### Option 1: Manual Setup

1. Install PostgreSQL if you haven't already:
   ```bash
   # macOS using Homebrew
   brew install postgresql@14
   brew services start postgresql@14
   ```

2. Create a new database:
   ```bash
   createdb hedgehog_content
   ```

3. Create a `.env` file in the project root:
   ```
   DATABASE_URL="postgresql://your-username@localhost:5432/hedgehog_content"
   OPENAI_API_KEY="your-openai-api-key"
   ```

#### Option 2: Automated Setup (Recommended)

1. Make the setup script executable:
   ```bash
   chmod +x scripts/setup-db.sh
   ```

2. Run the setup script:
   ```bash
   ./scripts/setup-db.sh
   ```

### 3. Initialize Database Schema

```bash
# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Importing Content

1. Navigate to the KB page at [http://localhost:3000/kb](http://localhost:3000/kb)
2. Click the "Import" button
3. Upload your CSV file following the Hubspot KB schema:
   - Knowledge base name
   - Article title
   - Article subtitle
   - Article language
   - Article URL
   - Article body
   - Category
   - Subcategory
   - Keywords
   - Last modified date
   - Status
   - Archived

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run prisma:studio`: Open Prisma Studio to manage database

## Environment Variables

Create a `.env` file with the following variables:

```
DATABASE_URL="postgresql://your-username@localhost:5432/hedgehog_content"
OPENAI_API_KEY="your-openai-api-key"
```

## Database Schema

The application uses three main tables:
- `kb_entries`: Knowledge base articles
- `faq`: Frequently asked questions
- `rfp_qa`: RFP questions and answers

See `prisma/schema.prisma` for complete schema details.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

[Add your license information here]
