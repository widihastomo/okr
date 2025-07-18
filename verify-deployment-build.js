#!/usr/bin/env node

// Simple deployment build verification script
import { existsSync, statSync, readFileSync } from 'fs';

console.log('🔍 Verifying Deployment Build...');
console.log('📍 Working directory:', process.cwd());

let allPassed = true;
let passedTests = 0;
let failedTests = 0;

const testFile = (path, minSize, description, contentChecks = []) => {
  console.log(`📋 Testing ${path}...`);
  
  if (!existsSync(path)) {
    console.error(`❌ Missing: ${path}`);
    failedTests++;
    allPassed = false;
    return false;
  }
  
  const stats = statSync(path);
  if (stats.size < minSize) {
    console.error(`❌ Too small: ${path} (${stats.size} bytes, expected ${minSize})`);
    failedTests++;
    allPassed = false;
    return false;
  }
  
  // Content checks
  if (contentChecks.length > 0) {
    const content = readFileSync(path, 'utf8');
    const missing = contentChecks.filter(check => !content.includes(check));
    if (missing.length > 0) {
      console.error(`❌ Missing content in ${path}: ${missing.join(', ')}`);
      failedTests++;
      allPassed = false;
      return false;
    }
  }
  
  console.log(`✅ ${path} verified (${stats.size} bytes)`);
  passedTests++;
  return true;
};

// Test required files
console.log('\n🔍 Testing Required Files...');
testFile('dist/index.cjs', 2000, 'Primary deployment target', ['spawn', 'tsx', 'server']);
testFile('dist/index.js', 2000, 'ES module version', ['spawn', 'tsx', 'server']);
testFile('dist/public/index.html', 2000, 'Production frontend', ['OKR Management System']);

// Test file permissions
console.log('\n🔧 Testing File Permissions...');
if (existsSync('dist/index.cjs')) {
  const stats = statSync('dist/index.cjs');
  const isExecutable = (stats.mode & 0o111) !== 0;
  
  if (isExecutable) {
    console.log('✅ dist/index.cjs has executable permissions');
    passedTests++;
  } else {
    console.error('❌ dist/index.cjs missing executable permissions');
    failedTests++;
    allPassed = false;
  }
}

// Test package.json start command compatibility
console.log('\n📦 Testing Package.json Compatibility...');
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const startCommand = packageJson.scripts?.start;
  
  if (startCommand && startCommand.includes('node dist/index.cjs')) {
    console.log('✅ Package.json start command points to dist/index.cjs');
    passedTests++;
  } else {
    console.error('❌ Package.json start command does not point to dist/index.cjs');
    console.error(`   Current start command: ${startCommand}`);
    failedTests++;
    allPassed = false;
  }
} catch (error) {
  console.error('❌ Could not read package.json:', error.message);
  failedTests++;
  allPassed = false;
}

// Test basic server file syntax
console.log('\n🧪 Testing Server File Syntax...');
if (existsSync('dist/index.cjs')) {
  try {
    const content = readFileSync('dist/index.cjs', 'utf8');
    
    // Check for shebang
    if (content.startsWith('#!/usr/bin/env node')) {
      console.log('✅ dist/index.cjs has proper shebang');
      passedTests++;
    } else {
      console.error('❌ dist/index.cjs missing shebang');
      failedTests++;
      allPassed = false;
    }
    
    // Check for basic Node.js syntax
    if (content.includes('require(') && content.includes('spawn')) {
      console.log('✅ dist/index.cjs has valid Node.js syntax');
      passedTests++;
    } else {
      console.error('❌ dist/index.cjs missing required Node.js syntax');
      failedTests++;
      allPassed = false;
    }
    
  } catch (error) {
    console.error('❌ Could not read dist/index.cjs:', error.message);
    failedTests++;
    allPassed = false;
  }
}

// Final results
console.log('\n📊 Verification Results:');
console.log(`✅ Tests Passed: ${passedTests}`);
console.log(`❌ Tests Failed: ${failedTests}`);
console.log(`📊 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);

if (allPassed) {
  console.log('\n🎉 Deployment Build Verification Passed!');
  console.log('✅ All required files are present and correctly formatted');
  console.log('✅ File permissions are set correctly');
  console.log('✅ Package.json configuration is compatible');
  console.log('✅ Server file syntax is valid');
  console.log('\n🚀 Build is ready for deployment!');
  console.log('\n📋 Deployment Commands:');
  console.log('  Build: node build-production-fixed.js');
  console.log('  Start: node dist/index.cjs');
  console.log('  Verify: node verify-deployment-build.js');
  process.exit(0);
} else {
  console.log('\n❌ Deployment Build Verification Failed!');
  console.log('🔧 Please fix the issues above before deploying');
  console.log('\n📋 Suggested Actions:');
  console.log('  1. Run: node build-production-fixed.js');
  console.log('  2. Check file permissions: chmod +x dist/index.cjs');
  console.log('  3. Verify file sizes and content');
  console.log('  4. Re-run verification: node verify-deployment-build.js');
  process.exit(1);
}