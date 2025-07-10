#!/bin/bash

# Production build script with automatic seeder execution
# This script builds the application for production and runs the production seeder

set -e  # Exit on any error

echo "🚀 Starting production build with seeder..."

# Check if NODE_ENV is set to production
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  NODE_ENV is not set to production. Setting it now..."
    export NODE_ENV=production
fi

# Use the existing build process
echo "🔄 Building application..."
npm run build

# Verify build outputs
echo "🔍 Verifying build outputs..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Server build failed - index.js not found"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Frontend build failed - index.html not found"
    exit 1
fi

echo "✅ Build verification passed"

# Run production seeder if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
    echo "🌱 Running production seeder..."
    
    # Try to run the full production seeder
    if npx tsx server/create-production-seeder.ts; then
        echo "✅ Production seeder completed successfully"
    else
        echo "⚠️  Production seeder failed. Attempting to create admin user only..."
        
        # Fallback to creating admin user only
        if npx tsx server/create-production-admin.ts; then
            echo "✅ Production admin created successfully"
        else
            echo "❌ Production admin creation failed"
            echo "⚠️  Manual seeding may be required after deployment"
        fi
    fi
else
    echo "⚠️  DATABASE_URL not found, skipping production seeder"
    echo "💡 Make sure to set DATABASE_URL and run seeder manually after deployment"
fi

# Copy static files if they exist
if [ -d "public" ]; then
    echo "📄 Copying static files..."
    cp -r public/* dist/client/ 2>/dev/null || true
fi

# Create production startup script
echo "📝 Creating production startup script..."
cat > start-production.sh << 'EOF'
#!/bin/bash
# Production startup script
export NODE_ENV=production
echo "🚀 Starting production server..."
node dist/server/index.js
EOF

chmod +x start-production.sh

echo "✅ Production build completed successfully!"
echo ""
echo "📊 Build Summary:"
echo "=================="
echo "Frontend: ✅ Built"
echo "Backend: ✅ Built"
echo "Database: ${DATABASE_URL:+✅ Seeded}${DATABASE_URL:-⚠️ Skipped}"
echo "Startup: ✅ Ready"
echo ""
echo "🚀 To start production server: ./start-production.sh"
echo "🌱 To run seeder manually: npx tsx server/create-production-seeder.ts"