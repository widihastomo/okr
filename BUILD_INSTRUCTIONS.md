# Production Build Instructions

## Build Script Options

Due to the ES module configuration in package.json (`"type": "module"`), there are multiple ways to run the frontend production build:

### Option 1: Direct CommonJS execution (Recommended)
```bash
node build-frontend-production.cjs
```

### Option 2: ES Module wrapper
```bash
node scripts/build-frontend-production-wrapper.mjs
```

### Option 3: NPM script (if package.json is updated to reference .cjs)
```bash
npm run build:frontend-production
```
**Note:** Currently this will fail because package.json still references the old .js filename.

## Build Output
- **Location:** `dist/public/`
- **Files:** index.html, CSS, JS assets, images
- **Build Time:** ~25 seconds
- **Bundle Size:** ~2.8MB JS, ~170KB CSS

## Production Deployment Commands
```bash
# Build frontend only
node build-frontend-production.cjs

# Build complete production bundle (frontend + backend)
node build-with-seeder.cjs

# Start production server
NODE_ENV=production node dist/index.cjs
```

## Troubleshooting
- If you see "require is not defined in ES module scope", use the .cjs file directly
- If you see "MODULE_NOT_FOUND", ensure you're using the correct filename (.cjs not .js)
- For local development on Mac, use the wrapper script for better compatibility