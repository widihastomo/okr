
const { execSync } = require('child_process');
const { writeFileSync, readFileSync, existsSync } = require('fs');
const path = require('path');

console.log('🏗️  Building Frontend for Production...');

// 1. Set production environment
process.env.NODE_ENV = 'production';

// 2. Get current Replit URL for API
const replitUrl = process.env.REPLIT_DOMAINS?.split(',')[0];
if (replitUrl) {
  process.env.VITE_API_URL = `https://${replitUrl}`;
  console.log(`🔗 API URL set to: ${process.env.VITE_API_URL}`);
} else {
  console.log('⚠️  REPLIT_DOMAINS not found, using relative API URLs');
}

try {
  // 3. Build frontend
  console.log('📦 Building frontend with Vite...');
  execSync('npm run build', { 
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env }
  });

  // 4. Verify build output
  const distPath = path.resolve('dist/public');
  if (existsSync(path.join(distPath, 'index.html'))) {
    console.log('✅ Frontend build completed successfully!');
    console.log(`📁 Build output: ${distPath}`);
    
    // 5. Create production config file
    const productionConfig = {
      buildTime: new Date().toISOString(),
      apiUrl: process.env.VITE_API_URL || 'relative',
      replitUrl: replitUrl || 'unknown',
      mode: 'production'
    };
    
    writeFileSync(
      path.join(distPath, 'build-config.json'), 
      JSON.stringify(productionConfig, null, 2)
    );
    
    console.log('📋 Production config created');
    console.log('🚀 Frontend ready for deployment!');
  } else {
    throw new Error('Build output not found');
  }

} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}
