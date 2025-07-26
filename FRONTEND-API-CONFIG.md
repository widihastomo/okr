# Frontend API Configuration Guide

## Overview

The frontend now supports environment-based API endpoint configuration, automatically determining the correct API endpoints based on environment variables and deployment context.

## How It Works

### Environment-Based Detection

The system uses a 3-tier detection strategy:

1. **VITE_API_URL** (highest priority)
   - If set: Uses this exact URL for all API calls
   - Use for: Replit deployments, custom domains, cross-origin setups

2. **Development Mode** (when VITE_API_URL is empty + NODE_ENV=development)
   - Uses relative URLs with Vite proxy handling
   - Use for: Local development with `npm run dev`

3. **Production Fallback** (when VITE_API_URL is empty + production build)
   - Uses current page origin for API calls
   - Use for: Same-origin deployments

### Configuration Examples

#### Replit Deployment
```bash
VITE_API_URL=https://your-repl-name.replit.app
```

#### Custom Domain
```bash
VITE_API_URL=https://api.yourdomain.com
```

#### Same-Origin Deployment
```bash
# Leave VITE_API_URL empty or unset
```

#### Local Development
```bash
# Leave VITE_API_URL empty - Vite proxy handles API calls
```

## Build Commands

### Standard Build
```bash
npm run build
```
Uses standard Vite build process with environment variable detection.

### Environment-Aware Build (Enhanced)
```bash
node build-env-aware.js
```
Enhanced build with:
- Environment validation
- API configuration debugging
- Build info generation
- Custom HTML with configuration display

## Debugging

### Browser Console
The frontend automatically logs API configuration on startup:
```
🔍 API Configuration
Base URL: https://your-api-url.com
Source: VITE_API_URL
Environment: production
```

### Build Info
Environment-aware builds create `dist/public/build-info.json` with:
- Build timestamp
- Environment configuration
- API strategy used
- Version information

## Implementation Files

- `client/src/lib/api-config.ts` - Core configuration logic
- `client/src/lib/queryClient.ts` - API client with environment detection
- `build-env-aware.js` - Enhanced build script
- `FRONTEND-API-CONFIG.md` - This documentation

## Migration Notes

### From Previous System
- No breaking changes to existing API calls
- Automatic detection replaces manual configuration
- Existing relative API calls continue working

### Environment Variables
- Only `VITE_API_URL` is required for custom endpoints
- All other environment variables remain unchanged
- Backward compatible with existing deployments

## Troubleshooting

### API Calls Failing
1. Check browser console for API configuration logs
2. Verify VITE_API_URL format (include https://)
3. Ensure API endpoint is accessible from frontend domain

### Build Issues
1. Use `node build-env-aware.js` for detailed build diagnostics
2. Check `dist/public/build-info.json` for configuration details
3. Verify environment variables are properly set

### Development Issues
1. Ensure VITE_API_URL is empty for local development
2. Verify Vite proxy configuration in vite.config.ts
3. Check that backend is running on expected port