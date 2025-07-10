#!/usr/bin/env node

/**
 * Production build script with integrated database seeder
 * This script builds the application and seeds essential data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build with seeder...');

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function runCommand(command, description) {
  log(`📋 ${description}...`);
  const startTime = Date.now();
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    log(`✅ ${description} completed in ${Date.now() - startTime}ms`);
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`);
    throw error;
  }
}

function verifyFile(filePath, minSize = 0) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }
  
  const stats = fs.statSync(filePath);
  if (stats.size < minSize) {
    throw new Error(`File too small: ${filePath} (${stats.size} bytes)`);
  }
  
  log(`✅ ${filePath} verified (${Math.round(stats.size / 1024)}KB)`);
}

async function buildProduction() {
  const startTime = Date.now();
  
  try {
    // 1. Run database seeder first
    log('🌱 Running database seeder...');
    try {
      runCommand('npx tsx server/build-seeder.ts', 'Database seeding');
    } catch (error) {
      log('⚠️  Database seeder failed - continuing with build process');
      log('📋 Manual seeder execution may be required after deployment');
    }
    
    // 2. Clean dist directory
    log('🧹 Cleaning dist directory...');
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    fs.mkdirSync('dist', { recursive: true });
    
    // 3. Build frontend with optimizations
    runCommand(
      'npx vite build --mode production --minify esbuild --target esnext', 
      'Building frontend'
    );
    
    // 4. Build server with esbuild
    runCommand(
      'npx esbuild server/index.ts --bundle --platform=node --target=node18 --outfile=dist/index.js --external:@neondatabase/serverless --external:drizzle-orm --external:express --external:bcryptjs --external:dotenv --external:openai --external:express-session --external:connect-pg-simple --external:passport --external:passport-local --external:ws --external:pg --minify --sourcemap=false --format=cjs --metafile=dist/meta.json',
      'Building server'
    );
    
    // 5. Copy necessary files
    log('📁 Copying necessary files...');
    
    // Copy package.json with production dependencies
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const prodPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      type: "commonjs",
      scripts: {
        start: "node index.js",
        seed: "node seed.js"
      },
      dependencies: {
        "@neondatabase/serverless": packageJson.dependencies["@neondatabase/serverless"],
        "drizzle-orm": packageJson.dependencies["drizzle-orm"],
        "express": packageJson.dependencies["express"],
        "bcryptjs": packageJson.dependencies["bcryptjs"],
        "dotenv": packageJson.dependencies["dotenv"],
        "openai": packageJson.dependencies["openai"],
        "express-session": packageJson.dependencies["express-session"],
        "connect-pg-simple": packageJson.dependencies["connect-pg-simple"],
        "passport": packageJson.dependencies["passport"],
        "passport-local": packageJson.dependencies["passport-local"],
        "ws": packageJson.dependencies["ws"],
        "pg": packageJson.dependencies["pg"]
      }
    };
    
    fs.writeFileSync('dist/package.json', JSON.stringify(prodPackageJson, null, 2));
    
    // 6. Create standalone seeder for production
    log('🌱 Creating standalone seeder...');
    runCommand(
      'npx esbuild server/build-seeder.ts --bundle --platform=node --target=node18 --outfile=dist/seed.js --external:@neondatabase/serverless --external:drizzle-orm --external:bcryptjs --external:dotenv --external:pg --minify --sourcemap=false --format=cjs',
      'Building standalone seeder'
    );
    
    // 7. Copy shared schema for seeder
    runCommand(
      'npx esbuild shared/schema.ts --bundle --platform=node --target=node18 --outfile=dist/schema.js --external:drizzle-orm --external:pg-core --minify --sourcemap=false --format=cjs',
      'Building shared schema'
    );
    
    // 8. Verify build files
    verifyFile('dist/index.js', 50000); // At least 50KB
    verifyFile('dist/public/index.html', 1000); // At least 1KB
    verifyFile('dist/package.json', 100); // At least 100 bytes
    verifyFile('dist/seed.js', 5000); // At least 5KB
    
    // 9. Create deployment files
    log('📋 Creating deployment files...');
    
    // Create .env template
    const envTemplate = `# Production Environment Variables
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
# Or use individual PG variables:
# PGUSER=username
# PGPASSWORD=password
# PGHOST=host
# PGPORT=5432
# PGDATABASE=database

# Application Settings
NODE_ENV=production
PORT=5000

# Security
SESSION_SECRET=your-super-secret-session-key-here

# Email Configuration (choose one provider)
# Mailtrap (for testing)
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your-username
MAILTRAP_PASS=your-password
MAILTRAP_FROM=noreply@refokus.com

# SendGrid (for production)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM=noreply@refokus.com

# Gmail SMTP (alternative)
GMAIL_EMAIL=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
GMAIL_FROM=noreply@refokus.com
`;
    
    fs.writeFileSync('dist/.env.example', envTemplate);
    
    // Create deployment README
    const deploymentReadme = `# Production Deployment

## Quick Start

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure environment:**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your production values
   \`\`\`

3. **Run database seeder:**
   \`\`\`bash
   npm run seed
   \`\`\`

4. **Start application:**
   \`\`\`bash
   npm start
   \`\`\`

## System Owner Account

After running the seeder, you can login with:
- **Email:** admin@refokus.com
- **Password:** RefokusAdmin2025!

⚠️ **Important:** Change the default password immediately after first login!

## Environment Variables

### Required Variables
- \`DATABASE_URL\` - PostgreSQL connection string
- \`SESSION_SECRET\` - Session encryption key
- \`NODE_ENV=production\`

### Email Configuration
Choose one email provider and configure the respective variables:
- **Mailtrap:** MAILTRAP_HOST, MAILTRAP_PORT, MAILTRAP_USER, MAILTRAP_PASS, MAILTRAP_FROM
- **SendGrid:** SENDGRID_API_KEY, SENDGRID_FROM
- **Gmail:** GMAIL_EMAIL, GMAIL_PASSWORD, GMAIL_FROM

## Features Created by Seeder

### System Owner Account
- Full platform administration access
- Email: admin@refokus.com
- Organization: Refokus System

### Application Settings
- ${prodPackageJson.name} configuration
- Appearance settings (colors, branding)
- Feature toggles (notifications, achievements, trials)
- Security settings (session timeout, password policies)
- Business settings (trial duration, currency)

### Subscription Plans
1. **Free Trial** - 7 days, up to 3 users
2. **Starter** - 199k IDR/month, up to 10 users
3. **Growth** - 499k IDR/month, up to 50 users  
4. **Enterprise** - 999k IDR/month, unlimited users

## Troubleshooting

### Database Connection Issues
1. Verify DATABASE_URL is correct
2. Check database server is running
3. Ensure SSL is configured properly
4. Try individual PG variables instead of DATABASE_URL

### Seeder Issues
1. Check database connection
2. Verify all required environment variables
3. Run seeder manually: \`npm run seed\`
4. Check logs for specific error messages

### Email Issues
1. Verify email provider credentials
2. Check email configuration in application settings
3. Test with different email providers
4. Ensure proper firewall/security group settings

## Support

For technical support, contact: support@refokus.com
`;
    
    fs.writeFileSync('dist/README.md', deploymentReadme);
    
    // 10. Create build metadata
    const buildInfo = {
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime}ms`,
      environment: 'production',
      nodeVersion: process.version,
      platform: process.platform,
      seederIncluded: true,
      features: [
        'System Owner Account',
        'Application Settings',
        'Subscription Plans',
        'Database Seeder',
        'Email Configuration',
        'Production Ready'
      ]
    };
    fs.writeFileSync('dist/build-info.json', JSON.stringify(buildInfo, null, 2));
    
    // 11. Final verification
    log('🔍 Final verification...');
    const distFiles = fs.readdirSync('dist');
    const requiredFiles = ['index.js', 'public', 'package.json', 'seed.js', '.env.example', 'README.md'];
    
    for (const file of requiredFiles) {
      if (!distFiles.includes(file)) {
        throw new Error(`Missing required file in dist: ${file}`);
      }
    }
    
    const totalDuration = Date.now() - startTime;
    log(`✅ Production build with seeder completed successfully!`);
    log(`⏱️  Total build time: ${totalDuration}ms`);
    log(`📁 Output directory: dist/`);
    log(`🌱 Database seeder: dist/seed.js`);
    log(`📋 Deployment guide: dist/README.md`);
    log(`🎉 Ready for production deployment!`);
    
  } catch (error) {
    log(`❌ Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the build
buildProduction().catch(console.error);