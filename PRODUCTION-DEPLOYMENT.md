# Production Deployment Guide

## Overview

This guide covers the complete production deployment process for the Refokus OKR Platform, including automatic database seeding and system owner account creation.

## Quick Start

### Automated Deployment

```bash
# Run the complete deployment with automatic seeding
./deploy-production.sh
```

This single command will:
1. Build the frontend and backend
2. Run production database seeder
3. Create system owner account
4. Generate startup scripts
5. Create deployment documentation

### Manual Steps

If you prefer manual control:

```bash
# Build only
./build-production.sh

# Seed database manually
npx tsx server/create-production-seeder.ts

# Start production server
./start-production.sh
```

## Environment Requirements

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Environment
NODE_ENV=production
```

### Optional Environment Variables

```bash
# Server
PORT=5000

# Payment Gateway
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_SERVER_KEY=your_midtrans_server_key

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key

# AI Features
OPENAI_API_KEY=your_openai_api_key
```

## Database Seeding

### Automatic Seeding (Recommended)

During deployment, the system automatically seeds the database with:

- **System Owner Account**: admin@refokus.com / RefokusAdmin2025!
- **Subscription Plans**: Free Trial, Starter, Growth, Enterprise
- **System Organization**: Refokus System
- **Essential Settings**: Application configurations

### Manual Seeding

If automatic seeding fails, run these commands:

```bash
# Complete production seeding
npx tsx server/create-production-seeder.ts

# Or create admin user only
npx tsx server/create-production-admin.ts

# Or create test admin for development
npx tsx server/create-test-admin.ts
```

## System Owner Accounts

### Production Admin
- **Email**: admin@refokus.com
- **Password**: RefokusAdmin2025!
- **Role**: System Owner
- **Organization**: Refokus System

### Test Admin (Development)
- **Email**: owner@system.com
- **Password**: password
- **Role**: System Owner
- **Organization**: System Admin Organization

⚠️ **Important**: Change default passwords immediately after first login!

## Deployment Scripts

### Main Scripts

1. **`deploy-production.sh`** - Complete deployment with seeding
2. **`build-production.sh`** - Build only without seeding
3. **`start-production.sh`** - Start production server

### Seeder Scripts

1. **`create-production-seeder.ts`** - Complete production setup
2. **`create-production-admin.ts`** - System owner only
3. **`create-test-admin.ts`** - Test admin for development

## Deployment Process

### 1. Pre-deployment Checklist

- [ ] DATABASE_URL configured
- [ ] NODE_ENV set to production
- [ ] All required dependencies installed
- [ ] Environment variables configured

### 2. Build Process

```bash
# Frontend build
npm run build:client

# Backend build
npm run build:server
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:push

# Seed production data
npx tsx server/create-production-seeder.ts
```

### 4. Health Checks

```bash
# Check server health
curl http://localhost:5000/health

# Check database connection
curl http://localhost:5000/api/health
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify DATABASE_URL is correct
   - Check database server is running
   - Ensure network connectivity

2. **Seeding Failed**
   - Check database permissions
   - Verify schema is up to date
   - Run `npm run db:push` first

3. **Build Failed**
   - Verify Node.js version (18+)
   - Check dependencies are installed
   - Review build logs for errors

### Recovery Commands

```bash
# Reset database and reseed
npm run db:push
npx tsx server/create-production-seeder.ts

# Create admin user if missing
npx tsx server/create-production-admin.ts

# Clean build and retry
rm -rf dist node_modules
npm install
./deploy-production.sh
```

## Security Considerations

### Database Security
- Use strong database passwords
- Enable SSL connections
- Implement proper backup strategies
- Monitor database access logs

### Application Security
- Change default admin passwords
- Enable HTTPS in production
- Implement rate limiting
- Monitor authentication attempts

### Environment Security
- Use environment-specific secrets
- Implement proper logging
- Set up monitoring and alerts
- Regular security updates

## Monitoring

### Health Endpoints
- `/health` - Basic server health
- `/api/health` - Database health
- `/api/auth/health` - Authentication health

### Key Metrics
- Database connection pool usage
- Authentication success/failure rates
- API response times
- Error rates and logs

## Backup Strategy

### Database Backups
- Schedule daily automated backups
- Test backup restoration process
- Store backups in secure location
- Monitor backup success

### Application Backups
- Version control for code
- Environment configuration backups
- Document deployment configurations
- Maintain rollback procedures

## Post-Deployment

### 1. Verify Deployment

```bash
# Check server is running
curl http://localhost:5000/health

# Test admin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@refokus.com","password":"RefokusAdmin2025!"}'
```

### 2. System Configuration

1. Login as system owner
2. Change default password
3. Configure email settings
4. Set up payment gateway
5. Configure AI features (if applicable)

### 3. User Management

1. Create organization admins
2. Set up subscription plans
3. Configure trial settings
4. Set up notification preferences

## Support

For deployment issues:
1. Check server logs
2. Review DEPLOYMENT_INFO.md
3. Verify environment variables
4. Test database connectivity
5. Check build outputs

## Files Generated

After deployment, these files are created:
- `dist/` - Built application
- `start-production.sh` - Production startup script
- `DEPLOYMENT_INFO.md` - Deployment summary
- Server logs and health check endpoints

## Next Steps

1. Set up monitoring and alerting
2. Configure automated backups
3. Set up SSL/TLS certificates
4. Configure domain and DNS
5. Set up CI/CD pipeline