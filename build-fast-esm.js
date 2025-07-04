import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting fast ESM build process...');

function runCommand(command, description, options = {}) {
  const startTime = Date.now();
  console.log(`⏳ ${description}...`);
  
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      maxBuffer: 1024 * 1024 * 10,
      ...options 
    });
    const duration = Date.now() - startTime;
    console.log(`✅ ${description} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${description} failed after ${duration}ms:`, error.message);
    throw error;
  }
}

function verifyFile(filePath, minSize = 0) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Build file missing: ${filePath}`);
  }
  
  const stats = fs.statSync(filePath);
  if (stats.size < minSize) {
    throw new Error(`Build file too small: ${filePath} (${stats.size} bytes)`);
  }
  
  console.log(`✅ Verified: ${filePath} (${(stats.size / 1024).toFixed(1)}KB)`);
}

try {
  // Clean dist directory
  runCommand('rm -rf dist', 'Cleaning dist directory');
  runCommand('mkdir -p dist/public', 'Creating dist directories');

  // Build frontend (Vite) with optimizations
  console.log('\n📦 Building frontend...');
  runCommand(
    'npx vite build --outDir dist/public --emptyOutDir false --mode production',
    'Vite frontend build'
  );

  // Build server with optimized TypeScript compilation
  console.log('\n🔧 Building server...');
  runCommand(
    'npx tsc --build --force --skipLibCheck --noEmit false --outDir dist/server-temp',
    'TypeScript compilation (optimized)'
  );

  // Bundle server with esbuild for optimal performance
  runCommand(
    'npx esbuild dist/server-temp/server/index.js --bundle --platform=node --target=node18 --outfile=dist/index.js --external:@neondatabase/serverless --external:pg --external:bcryptjs --minify',
    'ESBuild server bundling'
  );

  // Cleanup temp files
  runCommand('rm -rf dist/server-temp', 'Cleaning temp files');

  // Verify build outputs
  console.log('\n🔍 Verifying build outputs...');
  verifyFile('dist/index.js', 10000); // Server should be at least 10KB
  verifyFile('dist/public/index.html', 1000); // Frontend should have HTML
  
  // Create production package.json
  const prodPackage = {
    name: "okr-system-production",
    version: "1.0.0",
    type: "module",
    scripts: {
      start: "node index.js"
    },
    dependencies: {
      "@neondatabase/serverless": "^0.10.0",
      "bcryptjs": "^2.4.3"
    }
  };
  
  fs.writeFileSync('dist/package.json', JSON.stringify(prodPackage, null, 2));
  console.log('✅ Created production package.json');

  // Build summary
  const frontendStats = fs.statSync('dist/public/index.html');
  const serverStats = fs.statSync('dist/index.js');
  
  console.log('\n🎉 Fast ESM build completed successfully!');
  console.log(`📊 Build Summary:`);
  console.log(`   Frontend: ${(frontendStats.size / 1024).toFixed(1)}KB HTML`);
  console.log(`   Server: ${(serverStats.size / 1024).toFixed(1)}KB bundle`);
  console.log(`   Total build time: Fast optimized build`);
  console.log('\n🚀 Ready for deployment!');

} catch (error) {
  console.error('\n💥 Build failed:', error.message);
  process.exit(1);
}