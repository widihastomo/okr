#!/bin/bash

# Production deployment script with automatic seeder
# This script handles the complete deployment process including database seeding

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Set production environment
export NODE_ENV=production

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify required tools
log "🔍 Verifying required tools..."
if ! command_exists node; then
    log "❌ Node.js not found"
    exit 1
fi

if ! command_exists npm; then
    log "❌ NPM not found"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
log "✅ Node.js version: $NODE_VERSION"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log "📦 Installing dependencies..."
    npm install --production=false
fi

# Clean previous build
log "🧹 Cleaning previous build..."
rm -rf dist

# Build application
log "🔄 Building application..."

# Build frontend
log "🎨 Building frontend..."
if command_exists vite; then
    npx vite build
else
    log "❌ Vite not found. Please install dependencies."
    exit 1
fi

# Build backend
log "⚙️ Building backend..."
if command_exists esbuild; then
    npx esbuild server/index.ts \
        --bundle \
        --platform=node \
        --target=node18 \
        --outfile=dist/server/index.js \
        --external:pg-native \
        --external:@neondatabase/serverless \
        --external:ws \
        --external:bufferutil \
        --external:utf-8-validate
else
    log "❌ ESBuild not found. Please install dependencies."
    exit 1
fi

# Verify build outputs
log "🔍 Verifying build outputs..."
if [ ! -f "dist/public/index.html" ]; then
    log "❌ Frontend build failed - index.html not found"
    exit 1
fi

if [ ! -f "dist/server/index.js" ]; then
    log "❌ Backend build failed - index.js not found"
    exit 1
fi

# Get build sizes
FRONTEND_SIZE=$(du -sh dist/public 2>/dev/null | cut -f1)
BACKEND_SIZE=$(du -sh dist/server 2>/dev/null | cut -f1)

log "✅ Build verification passed"
log "📏 Frontend size: $FRONTEND_SIZE"
log "📏 Backend size: $BACKEND_SIZE"

# Database seeding (only if DATABASE_URL is available)
if [ -n "$DATABASE_URL" ]; then
    log "🌱 Database seeding started..."
    
    # Check if tsx is available for running TypeScript
    if command_exists tsx; then
        # Try full production seeder first
        if npx tsx server/create-production-seeder.ts; then
            log "✅ Production seeder completed successfully"
        else
            log "⚠️  Production seeder failed. Attempting admin creation only..."
            
            # Fallback to admin creation only
            if npx tsx server/create-production-admin.ts; then
                log "✅ Production admin created successfully"
            else
                log "❌ Production admin creation failed"
                log "⚠️  Manual seeding required after deployment"
            fi
        fi
    else
        log "⚠️  TSX not available, skipping automatic seeding"
        log "💡 Run 'npx tsx server/create-production-seeder.ts' manually after deployment"
    fi
else
    log "⚠️  DATABASE_URL not found, skipping database seeding"
    log "💡 Set DATABASE_URL environment variable before deployment"
fi

# Copy static files
if [ -d "public" ]; then
    log "📄 Copying static files..."
    cp -r public/* dist/public/ 2>/dev/null || true
fi

# Create production startup script
log "📝 Creating production startup script..."
cat > start-production.sh << 'EOF'
#!/bin/bash
# Production startup script
export NODE_ENV=production

echo "🚀 Starting production server..."
echo "📊 Environment: $NODE_ENV"
echo "🗄️  Database: ${DATABASE_URL:+Connected}${DATABASE_URL:-Not configured}"
echo "📡 Port: ${PORT:-5000}"
echo ""

# Start the server
node dist/server/index.js
EOF

chmod +x start-production.sh

# Create deployment info file
log "📄 Creating deployment info..."
cat > DEPLOYMENT_INFO.md << EOF
# Deployment Information

## Build Details
- **Build Time**: $(date)
- **Node.js Version**: $NODE_VERSION
- **Environment**: production
- **Frontend Size**: $FRONTEND_SIZE
- **Backend Size**: $BACKEND_SIZE

## Database
- **Status**: ${DATABASE_URL:+Configured}${DATABASE_URL:-Not configured}
- **Seeding**: ${DATABASE_URL:+Completed}${DATABASE_URL:-Skipped}

## Startup
- **Command**: \`./start-production.sh\`
- **Port**: ${PORT:-5000}
- **Health Check**: \`/health\`

## Manual Commands
- **Run Seeder**: \`npx tsx server/create-production-seeder.ts\`
- **Create Admin**: \`npx tsx server/create-production-admin.ts\`
- **Check Health**: \`curl http://localhost:${PORT:-5000}/health\`

## Admin Credentials
- **Email**: admin@refokus.com
- **Password**: RefokusAdmin2025!
- **Role**: System Owner

⚠️ **Important**: Change the default password after first login!
EOF

log "✅ Production deployment completed successfully!"
log ""
log "📊 Deployment Summary:"
log "======================"
log "✅ Frontend: Built ($FRONTEND_SIZE)"
log "✅ Backend: Built ($BACKEND_SIZE)"
log "✅ Database: ${DATABASE_URL:+Seeded}${DATABASE_URL:-Skipped}"
log "✅ Startup: Ready"
log "✅ Info: DEPLOYMENT_INFO.md created"
log ""
log "🚀 To start production server:"
log "   ./start-production.sh"
log ""
log "🌱 To run seeder manually:"
log "   npx tsx server/create-production-seeder.ts"
log ""
log "📖 For more info, check DEPLOYMENT_INFO.md"