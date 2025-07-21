#!/usr/bin/env node

/**
 * Debug script untuk menganalisis masalah Vite serving di local development
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debug Vite Serving Issue');
console.log('📍 Working directory:', process.cwd());

// Function to analyze server configuration
function analyzeServerConfiguration() {
  console.log('\n' + '='.repeat(50));
  console.log('🔧 SERVER CONFIGURATION ANALYSIS');
  console.log('='.repeat(50));
  
  // Check server/index.ts
  const serverIndexPath = path.join(process.cwd(), 'server', 'index.ts');
  if (fs.existsSync(serverIndexPath)) {
    console.log('✅ server/index.ts found');
    
    try {
      const content = fs.readFileSync(serverIndexPath, 'utf8');
      
      // Check for Vite setup
      if (content.includes('setupVite')) {
        console.log('✅ setupVite function called in server');
      } else {
        console.log('❌ setupVite function NOT found in server');
      }
      
      // Check for isDevelopment condition
      if (content.includes('config.isDevelopment')) {
        console.log('✅ Development mode check found');
      } else {
        console.log('❌ Development mode check NOT found');
      }
      
      // Check for route order
      const lines = content.split('\n');
      let setupViteLine = -1;
      let registerRoutesLine = -1;
      
      lines.forEach((line, index) => {
        if (line.includes('setupVite(app, server)')) {
          setupViteLine = index;
        }
        if (line.includes('registerRoutes(app)')) {
          registerRoutesLine = index;
        }
      });
      
      if (setupViteLine > -1 && registerRoutesLine > -1) {
        if (setupViteLine > registerRoutesLine) {
          console.log('✅ Vite setup is after route registration (correct order)');
        } else {
          console.log('⚠️  Vite setup is before route registration (potential issue)');
        }
      }
      
    } catch (error) {
      console.log('❌ Error reading server/index.ts:', error.message);
    }
  } else {
    console.log('❌ server/index.ts not found');
  }
}

// Function to check Vite configuration
function checkViteConfiguration() {
  console.log('\n' + '='.repeat(50));
  console.log('⚙️  VITE CONFIGURATION CHECK');
  console.log('='.repeat(50));
  
  // Check vite.config.ts
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    console.log('✅ vite.config.ts found');
    
    try {
      const content = fs.readFileSync(viteConfigPath, 'utf8');
      
      // Check root configuration
      if (content.includes('root:')) {
        console.log('✅ Root path configured');
        const rootMatch = content.match(/root:\s*path\.resolve\([^)]+\)/);
        if (rootMatch) {
          console.log(`📁 Root config: ${rootMatch[0]}`);
        }
      }
      
      // Check build configuration
      if (content.includes('outDir:')) {
        console.log('✅ Output directory configured');
      }
      
      // Check proxy configuration
      if (content.includes('proxy:')) {
        console.log('✅ Proxy configuration found');
      }
      
    } catch (error) {
      console.log('❌ Error reading vite.config.ts:', error.message);
    }
  } else {
    console.log('❌ vite.config.ts not found');
  }
  
  // Check server/vite.ts
  const serverVitePath = path.join(process.cwd(), 'server', 'vite.ts');
  if (fs.existsSync(serverVitePath)) {
    console.log('✅ server/vite.ts found');
  } else {
    console.log('❌ server/vite.ts not found');
  }
}

// Function to check client files
function checkClientFiles() {
  console.log('\n' + '='.repeat(50));
  console.log('📱 CLIENT FILES CHECK');
  console.log('='.repeat(50));
  
  const clientFiles = [
    'client/index.html',
    'client/src/main.tsx',
    'client/src/App.tsx'
  ];
  
  clientFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
      
      if (file === 'client/index.html') {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('/src/main.tsx')) {
            console.log('  ✅ Main TypeScript entry point found');
          } else {
            console.log('  ❌ Main TypeScript entry point NOT found');
          }
        } catch (error) {
          console.log(`  ❌ Error reading ${file}:`, error.message);
        }
      }
    } else {
      console.log(`❌ ${file} not found`);
    }
  });
}

// Function to provide recommendations
function provideRecommendations() {
  console.log('\n' + '='.repeat(50));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(50));
  
  console.log('\n📋 Possible solutions for API-only mode:');
  
  console.log('\n1. 🔄 Try accessing with different URL paths:');
  console.log('   - http://localhost:5000/');
  console.log('   - http://localhost:5000/index.html');
  console.log('   - http://localhost:5000/dashboard');
  
  console.log('\n2. 🧹 Clear browser cache and cookies:');
  console.log('   - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)');
  console.log('   - Clear browser cache completely');
  console.log('   - Try incognito/private browsing mode');
  
  console.log('\n3. 🔍 Check browser developer tools:');
  console.log('   - Open browser console (F12)');
  console.log('   - Look for JavaScript errors');
  console.log('   - Check Network tab for failed requests');
  
  console.log('\n4. 🚀 Try alternative startup methods:');
  console.log('   - Use the original startup: npm run dev');
  console.log('   - Try with explicit port: PORT=5000 npm run dev');
  console.log('   - Test with different port: PORT=3000 npm run dev');
  
  console.log('\n5. 🔧 Environment variables check:');
  console.log('   - Ensure NODE_ENV=development');
  console.log('   - Check if DATABASE_URL is properly set');
  console.log('   - Verify all required environment variables');
  
  console.log('\n6. 📦 Dependencies check:');
  console.log('   - Delete node_modules: rm -rf node_modules');
  console.log('   - Reinstall dependencies: npm install');
  console.log('   - Clear npm cache: npm cache clean --force');
}

// Main execution
function main() {
  console.log('🎯 Starting Vite serving issue diagnosis...\n');
  
  analyzeServerConfiguration();
  checkViteConfiguration();
  checkClientFiles();
  provideRecommendations();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 DIAGNOSIS COMPLETE');
  console.log('='.repeat(50));
  console.log('\n📋 Next steps:');
  console.log('1. Try the recommendations above');
  console.log('2. Check browser console for errors');
  console.log('3. If still having issues, try different ports');
  console.log('4. Consider restarting the development server');
  
  console.log('\n🏁 Debug analysis completed');
}

// Run the debug script
main();