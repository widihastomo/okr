# Production Seeder Troubleshooting Guide

## 🔧 Common Issues and Solutions

### 1. DATABASE_URL Error

**Error:** `DATABASE_URL must be set. Did you forget to provision a database?`

**Solutions:**

#### Option A: Set DATABASE_URL directly
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
npx tsx server/create-production-seeder.ts
```

#### Option B: Use PG environment variables
```bash
# These are usually already set in Replit
export PGUSER="neondb_owner"
export PGPASSWORD="your_password"
export PGHOST="ep-super-fog-a69ws4u6.us-west-2.aws.neon.tech"
export PGDATABASE="neondb"
export PGPORT="5432"

# The seeder will automatically construct DATABASE_URL
npx tsx server/create-production-seeder.ts
```

#### Option C: Use provided scripts
```bash
# Use the helper script (recommended)
./run-production-seeder.sh

# Or test environment setup
node test-seeder.js
```

### 2. Permission Denied Error

**Error:** `./script.sh: Permission denied`

**Solution:**
```bash
chmod +x run-production-seeder.sh
chmod +x test-seeder.js
./run-production-seeder.sh
```

### 3. Node.js ES Module Error

**Error:** `require is not defined in ES module scope`

**Solution:**
- Use `import` instead of `require`
- Or rename script to `.cjs` extension
- The provided scripts are already fixed for ES modules

## 🚀 Available Scripts

### 1. `run-production-seeder.sh`
Complete production seeder with environment setup
```bash
./run-production-seeder.sh
```

### 2. `test-seeder.js`
Test environment setup and run seeder
```bash
node test-seeder.js
```

### 3. `build-production-with-seeder.js`
Full production build with automatic seeding
```bash
node build-production-with-seeder.js
```

### 4. Direct execution
Run seeder directly (requires proper environment)
```bash
npx tsx server/create-production-seeder.ts
```

## 🔍 Environment Check

To check your current environment:
```bash
node test-seeder.js
```

This will show:
- Current environment variables
- Database connection status
- Whether DATABASE_URL can be constructed
- Test seeder execution

## 🛠️ Manual Database Setup

If you need to manually set up the database connection:

1. **Get your database credentials:**
   - Check Replit's database tab
   - Look for PGUSER, PGPASSWORD, PGHOST, PGDATABASE variables

2. **Construct DATABASE_URL:**
   ```bash
   export DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"
   ```

3. **Test connection:**
   ```bash
   node test-seeder.js
   ```

## 📋 Production Seeder Output

Successful run should show:
```
🚀 Starting production data seeding...
👤 Creating system owner account...
⚠️  System owner already exists, skipping creation
💳 Creating subscription plans...
⚠️  Subscription plans already exist, skipping creation
🔍 Verifying production setup...
✅ System owners: 2
✅ Subscription plans: 4
✅ System organizations: 1
✅ Production seeding completed successfully!
```

## 🔒 Production Credentials

After successful seeding, you'll have:
- **System Owner**: admin@refokus.com / RefokusAdmin2025!
- **Subscription Plans**: Free Trial, Starter, Growth, Enterprise
- **System Organization**: Refokus System

## 📞 Support

If you still encounter issues:
1. Check that database is provisioned in Replit
2. Verify environment variables are set
3. Try the test script: `node test-seeder.js`
4. Check server logs for additional error details