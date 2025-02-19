#!/bin/bash

# Exit on error
set -e

echo "Setting up Hedgehog Content Center database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install postgresql@14
        brew services start postgresql@14
    else
        echo "Please install PostgreSQL manually for your operating system"
        exit 1
    fi
fi

# Database configuration
DB_NAME="hedgehog_content"
DB_USER=$(whoami)

# Check if database already exists
if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "Database $DB_NAME already exists"
else
    echo "Creating database $DB_NAME..."
    createdb "$DB_NAME"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
DATABASE_URL="postgresql://$DB_USER@localhost:5432/$DB_NAME"
# Add your OpenAI API key below
OPENAI_API_KEY=""
EOF
    echo "Created .env file. Please add your OpenAI API key to the .env file."
fi

echo "Running Prisma migrations..."
npx prisma migrate dev

echo "Generating Prisma client..."
npx prisma generate

echo "Setup complete! You can now run 'npm run dev' to start the application."
