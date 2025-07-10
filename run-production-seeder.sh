#!/bin/bash

# Script untuk menjalankan production seeder dengan environment yang benar
# Usage: ./run-production-seeder.sh

echo "🚀 Starting production seeder with environment setup..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not found in environment"
    echo "🔍 Checking for database connection..."
    
    # Try to use existing environment variables
    if [ -n "$PGUSER" ] && [ -n "$PGPASSWORD" ] && [ -n "$PGHOST" ] && [ -n "$PGDATABASE" ]; then
        export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:${PGPORT:-5432}/$PGDATABASE"
        echo "✅ DATABASE_URL constructed from PG variables"
    else
        echo "❌ DATABASE_URL must be set or PG variables must be available"
        echo "Please set DATABASE_URL environment variable:"
        echo "export DATABASE_URL=postgresql://user:password@host:port/database"
        exit 1
    fi
else
    echo "✅ DATABASE_URL is set"
fi

# Set NODE_ENV to production if not set
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
    echo "✅ NODE_ENV set to production"
fi

# Run the seeder
echo "🌱 Running production seeder..."
npx tsx server/create-production-seeder.ts

if [ $? -eq 0 ]; then
    echo "🎉 Production seeder completed successfully!"
else
    echo "❌ Production seeder failed"
    exit 1
fi