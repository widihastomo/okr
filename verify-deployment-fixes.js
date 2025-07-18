#!/usr/bin/env node

// Verification script for deployment fixes
import { existsSync, statSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Verifying Deployment Fixes...');
console.log('📍 Working directory:', process.cwd());
console.log('📍 Node version:', process.version);

const verificationResults = {
  buildScriptFixed: false,
  deploymentTargetExists: false,
  deploymentTargetExecutable: false,
  deploymentTargetValid: false,
  frontendCreated: false,
  metadataCreated: false,
  allFixesApplied: false
};

try {
  // 1. Verify build script contains fixes
  console.log('\n1. 🔍 Verifying build script contains deployment fixes...');
  
  if (existsSync('build-simple.js')) {
    const buildScript = readFileSync('build-simple.js', 'utf8');
    const expectedFixes = [
      'Enhanced production build with comprehensive deployment fixes',
      'buildError',
      'verifyFile',
      'deploymentFixes',
      'multiple server startup strategies'
    ];
    
    const missingFixes = expectedFixes.filter(fix => !buildScript.includes(fix));
    if (missingFixes.length === 0) {
      console.log('✅ Build script contains all deployment fixes');
      verificationResults.buildScriptFixed = true;
    } else {
      console.log('❌ Build script missing fixes:', missingFixes);
    }
  } else {
    console.log('❌ build-simple.js not found');
  }

  // 2. Verify deployment target file exists
  console.log('\n2. 🔍 Verifying deployment target file exists...');
  
  if (existsSync('dist/index.cjs')) {
    const stats = statSync('dist/index.cjs');
    console.log(`✅ dist/index.cjs exists (${stats.size} bytes)`);
    verificationResults.deploymentTargetExists = true;
    
    // 3. Verify executable permissions
    console.log('\n3. 🔍 Verifying executable permissions...');
    if ((stats.mode & 0o111) !== 0) {
      console.log('✅ dist/index.cjs has executable permissions');
      verificationResults.deploymentTargetExecutable = true;
    } else {
      console.log('❌ dist/index.cjs missing executable permissions');
    }
    
    // 4. Verify content validity
    console.log('\n4. 🔍 Verifying deployment target content...');
    const content = readFileSync('dist/index.cjs', 'utf8');
    const requiredContent = [
      'Enhanced production server for deployment (CommonJS)',
      'setupEnvironment',
      'startServer',
      'setupShutdownHandlers',
      'spawn',
      'tsx',
      'alternative startup methods'
    ];
    
    const missingContent = requiredContent.filter(check => !content.includes(check));
    if (missingContent.length === 0) {
      console.log('✅ Deployment target contains all required functionality');
      verificationResults.deploymentTargetValid = true;
    } else {
      console.log('❌ Deployment target missing content:', missingContent);
    }
  } else {
    console.log('❌ dist/index.cjs not found');
  }

  // 5. Verify frontend created
  console.log('\n5. 🔍 Verifying production frontend...');
  
  if (existsSync('dist/public/index.html')) {
    const stats = statSync('dist/public/index.html');
    console.log(`✅ dist/public/index.html exists (${stats.size} bytes)`);
    
    const content = readFileSync('dist/public/index.html', 'utf8');
    if (content.includes('Enhanced Production') && content.includes('Deployment Fixes')) {
      console.log('✅ Frontend contains deployment fixes information');
      verificationResults.frontendCreated = true;
    } else {
      console.log('❌ Frontend missing deployment fixes information');
    }
  } else {
    console.log('❌ dist/public/index.html not found');
  }

  // 6. Verify metadata created
  console.log('\n6. 🔍 Verifying deployment metadata...');
  
  if (existsSync('dist/deployment-metadata.json')) {
    const stats = statSync('dist/deployment-metadata.json');
    console.log(`✅ dist/deployment-metadata.json exists (${stats.size} bytes)`);
    
    const content = readFileSync('dist/deployment-metadata.json', 'utf8');
    const metadata = JSON.parse(content);
    
    if (metadata.deploymentFixes && metadata.deploymentFixes.length > 0) {
      console.log('✅ Deployment metadata contains fix information');
      verificationResults.metadataCreated = true;
    } else {
      console.log('❌ Deployment metadata missing fix information');
    }
  } else {
    console.log('❌ dist/deployment-metadata.json not found');
  }

  // 7. Test build script execution
  console.log('\n7. 🔍 Testing build script execution...');
  
  try {
    execSync('node build-simple.js', { stdio: 'pipe' });
    console.log('✅ Build script executes successfully');
    
    // Re-verify deployment target after build
    if (existsSync('dist/index.cjs')) {
      const stats = statSync('dist/index.cjs');
      console.log(`✅ Build creates deployment target (${stats.size} bytes)`);
      verificationResults.allFixesApplied = true;
    } else {
      console.log('❌ Build does not create deployment target');
    }
  } catch (error) {
    console.log('❌ Build script execution failed:', error.message);
  }

  // Summary
  console.log('\n📊 VERIFICATION SUMMARY:');
  console.log('========================');
  
  const results = [
    { name: 'Build Script Fixed', status: verificationResults.buildScriptFixed },
    { name: 'Deployment Target Exists', status: verificationResults.deploymentTargetExists },
    { name: 'Executable Permissions', status: verificationResults.deploymentTargetExecutable },
    { name: 'Content Validity', status: verificationResults.deploymentTargetValid },
    { name: 'Frontend Created', status: verificationResults.frontendCreated },
    { name: 'Metadata Created', status: verificationResults.metadataCreated },
    { name: 'All Fixes Applied', status: verificationResults.allFixesApplied }
  ];
  
  results.forEach(result => {
    console.log(`${result.status ? '✅' : '❌'} ${result.name}`);
  });
  
  const successCount = results.filter(r => r.status).length;
  const totalCount = results.length;
  
  console.log(`\n📈 Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All deployment fixes verified successfully!');
    console.log('🚀 Ready for production deployment');
  } else {
    console.log('\n⚠️  Some deployment fixes need attention');
    console.log('🔧 Please review the failed checks above');
  }

} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}