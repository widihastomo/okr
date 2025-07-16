# Production Environment Variables Setup

## ✅ Environment Variables Status: FIXED

### Problem Solved
Production sekarang dapat membaca environment variables dengan benar melalui:
- ✅ Dynamic dotenv loading dalam server/index.ts
- ✅ Environment check script untuk validation
- ✅ Production build yang compatible dengan .env dan system variables

## Required Environment Variables

### 1. Database Configuration
```env
DATABASE_URL=postgresql://user:pass@host:5432/database?sslmode=require
```
**Status**: ✅ **WORKING** - Auto-detects SSL untuk production

### 2. Session Security
```env
SESSION_SECRET=your-very-secure-random-string-here
```
**Status**: ✅ **WORKING** - Required untuk session management

## Optional Environment Variables

### 3. Server Configuration
```env
NODE_ENV=production
PORT=5000
```
**Status**: ✅ **WORKING** - Defaults tersedia jika tidak diset

### 4. Email Configuration
```env
# Custom SMTP (Priority 1)
SMTP_HOST=mx3.mailspace.id
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=admin@refokus.id
SMTP_PASS=your_password
SMTP_FROM=no-reply@mail.refokus.id

# Fallback providers
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_username
MAILTRAP_PASS=your_password
MAILTRAP_FROM=noreply@yourapp.com
```
**Status**: ✅ **WORKING** - Multi-provider fallback system

## Environment Setup Methods

### Method 1: .env File (Recommended for Local Production Testing)
```bash
# Create .env file in project root
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
SESSION_SECRET=your-secure-session-secret
SMTP_HOST=mx3.mailspace.id
SMTP_PORT=465
SMTP_USER=admin@refokus.id
SMTP_PASS=your_password
SMTP_FROM=no-reply@mail.refokus.id
EOF
```

### Method 2: System Environment Variables (Production Deployment)
```bash
# Export environment variables
export NODE_ENV=production
export PORT=5000
export DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
export SESSION_SECRET="your-secure-session-secret"
export SMTP_HOST=mx3.mailspace.id
export SMTP_PORT=465
export SMTP_USER=admin@refokus.id
export SMTP_PASS=your_password
export SMTP_FROM=no-reply@mail.refokus.id
```

## Environment Validation

### Check Environment Variables
```bash
# Run environment check
node production-env-check.js
```

**Expected Output**:
```
✅ All required environment variables are set
🚀 Application should start successfully
```

### Test Production Build
```bash
# Build application
npm run build

# Test production server
NODE_ENV=production node dist/index.js
```

**Expected Output**:
```
🚀 OKR Management System - Production
✅ Environment variables loaded from .env file
🔌 Using Neon serverless connection
📧 Email service initialized
🔒 API rate limiting enabled for production
🔒 Auth rate limiting enabled for production
🔒 RLS middleware enabled for production
✅ Server started successfully
📡 Port: 5000
```

## Production Features Enabled

### Security Features
- ✅ **Rate Limiting**: 500 requests per 15 minutes for API
- ✅ **Auth Rate Limiting**: 10 auth attempts per 15 minutes
- ✅ **RLS (Row Level Security)**: Database-level multi-tenant security
- ✅ **CORS**: Configured for production domains
- ✅ **Helmet**: Security headers enabled
- ✅ **Session Security**: HttpOnly cookies with secure flags

### Database Features
- ✅ **SSL Connection**: Automatic SSL for production
- ✅ **Connection Pooling**: Optimized for production load
- ✅ **Auto-Seeding**: System owner and settings created automatically
- ✅ **Multi-tenant**: Organization-based data isolation

### Email Features
- ✅ **Multi-Provider**: Custom SMTP → Mailtrap → SendGrid → Gmail
- ✅ **SSL/TLS**: Auto-detection based on port
- ✅ **Fallback**: Automatic provider switching on failures

## Deployment Process

### 1. Environment Preparation
```bash
# Check current environment
node production-env-check.js

# Should show all required variables as ✅
```

### 2. Build for Production
```bash
# Build application
npm run build

# Verify build output
ls -la dist/
# Should show: index.js, index.cjs, public/index.html, deploy-info.json
```

### 3. Deploy to Production
```bash
# Upload files to production server
# - dist/ folder
# - server/ folder
# - client/ folder
# - package.json
# - .env file (if using)

# Install dependencies
npm install --production

# Start production server
npm start
```

### 4. Verify Deployment
```bash
# Check health endpoint
curl http://your-domain.com/health

# Check authentication endpoint
curl http://your-domain.com/api/auth/me
```

## Production Credentials

### System Admin Account (Auto-created)
```
Email: admin@refokus.com
Password: RefokusAdmin2025!
Role: System Owner
Organization: Refokus System
```

### Database Access
- Uses DATABASE_URL from environment
- Supports Neon serverless and traditional PostgreSQL
- Automatic SSL configuration for production

## Troubleshooting

### Common Issues and Solutions

#### 1. "Environment variables not loaded"
```bash
# Check .env file exists and is readable
ls -la .env

# Check environment variables
node production-env-check.js
```

#### 2. "Database connection failed"
```bash
# Test database connection
node debug-production-db.js

# Check SSL configuration
# DATABASE_URL should include ?sslmode=require
```

#### 3. "Server failed to start"
```bash
# Check port availability
lsof -i :5000

# Check logs for specific error
NODE_ENV=production node dist/index.js
```

#### 4. "Email not working"
```bash
# Test email configuration
curl -X POST http://localhost:5000/api/admin/test-email
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime environment |
| `PORT` | No | `5000` | Server port |
| `DATABASE_URL` | **Yes** | None | PostgreSQL connection string |
| `SESSION_SECRET` | **Yes** | None | Session encryption key |
| `SMTP_HOST` | No | None | Primary SMTP server |
| `SMTP_PORT` | No | `465` | SMTP port |
| `SMTP_USER` | No | None | SMTP username |
| `SMTP_PASS` | No | None | SMTP password |
| `SMTP_FROM` | No | None | Email sender address |

## Security Notes

### .env File Security
- ✅ Never commit .env files to version control
- ✅ Use strong, unique SESSION_SECRET
- ✅ Restrict file permissions: `chmod 600 .env`
- ✅ Use different secrets for different environments

### Production Security
- ✅ Use HTTPS in production
- ✅ Configure firewall rules
- ✅ Use strong database passwords
- ✅ Regular security updates

---

**Status**: ✅ **PRODUCTION READY**
**Last Updated**: July 16, 2025
**Next Steps**: Deploy to production server with environment variables configured