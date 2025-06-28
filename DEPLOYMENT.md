# Deployment Guide

## Quick Deployment

### 1. Build for Production
```bash
node build-simple.js
```

### 2. Test Deployment
```bash
node deploy-test.js
```

### 3. Deploy
Click the "Deploy" button in Replit or use:
```bash
npm start
```

## Deployment Configuration

### Required Files
- `dist/index.js` - Production server bundle
- `dist/public/index.html` - Frontend assets
- `package.json` - Start script configuration

### Environment Variables
- `NODE_ENV=production` - Enables production mode
- `PORT` - Server port (defaults to 5000)
- `DATABASE_URL` - PostgreSQL connection string

### Start Script
```json
{
  "scripts": {
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

## Deployment Features

### Health Check Endpoint
- **URL**: `/health`
- **Response**: `{"status":"ok","timestamp":"2025-06-28T02:13:06.520Z"}`
- **Purpose**: Deployment verification and monitoring

### Root Endpoint
- **URL**: `/`
- **Response**: Serves the web application
- **Fallback**: Basic HTML page with API links

### API Endpoints
- **Base URL**: `/api/*`
- **Authentication**: Session-based with PostgreSQL storage
- **Data Format**: JSON responses

## Build Process

### Server Build
- Uses ESBuild for fast TypeScript compilation
- Bundles server code into single `dist/index.js` file
- Minified and optimized for production

### Frontend Build
- Fallback mode for deployment compatibility
- Handles build timeouts gracefully
- Creates minimal assets when full build fails

## Troubleshooting

### Build Issues
If frontend build times out:
```bash
# Use fallback build mode
node build-simple.js
```

### Server Issues
Check server logs for:
- Database connection errors
- Port binding issues
- Authentication problems

### Health Check Failures
Verify:
- Server is running on correct port
- `/health` endpoint returns JSON with `"status":"ok"`
- No blocking database operations

## Production Optimizations

- Asynchronous database initialization
- Process stability handlers for graceful shutdowns
- Optimized static file serving
- Efficient port binding to `0.0.0.0`
- Proper error handling and logging