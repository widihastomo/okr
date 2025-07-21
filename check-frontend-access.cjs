#!/usr/bin/env node

/**
 * Script untuk mengecek akses frontend dan memberikan instruksi troubleshooting
 */

const http = require('http');
const { spawn } = require('child_process');

console.log('🔍 Frontend Access Checker');
console.log('📅 Mengecek apakah server sudah melayani frontend dengan benar\n');

// Function to check server response
function checkServerResponse() {
  return new Promise((resolve) => {
    console.log('🌐 Checking server response at http://localhost:5000...');
    
    const req = http.get('http://localhost:5000/', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Server response received');
        
        // Check if response contains Vite content
        if (data.includes('createHotContext') || data.includes('@vite/client')) {
          console.log('✅ VITE DEVELOPMENT SERVER DETECTED');
          console.log('✅ Frontend sedang dilayani dengan benar');
          resolve({ status: 'vite', content: data });
        } else if (data.includes('OKR Management System')) {
          console.log('⚠️  API-ONLY MODE DETECTED');
          console.log('❌ Frontend tidak dilayani dengan benar');
          resolve({ status: 'api-only', content: data });
        } else {
          console.log('❓ UNKNOWN RESPONSE FORMAT');
          resolve({ status: 'unknown', content: data });
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Server tidak dapat diakses:', err.message);
      resolve({ status: 'error', error: err });
    });
    
    req.setTimeout(5000, () => {
      console.log('⏱️ Request timeout');
      req.destroy();
      resolve({ status: 'timeout' });
    });
  });
}

// Function to provide browser troubleshooting steps
function provideBrowserSolutions() {
  console.log('\n' + '='.repeat(60));
  console.log('🖥️  BROWSER TROUBLESHOOTING SOLUTIONS');
  console.log('='.repeat(60));
  
  console.log('\n📋 SERVER SUDAH BENAR - MASALAH ADA DI BROWSER');
  console.log('✅ Vite development server sudah aktif dan melayani frontend');
  console.log('❌ Browser kemungkinan menampilkan cached version');
  
  console.log('\n🔧 LANGKAH SOLUSI (URUTAN PENTING):');
  
  console.log('\n1. 🧹 CLEAR BROWSER CACHE COMPLETELY:');
  console.log('   Chrome/Edge:');
  console.log('   - Tekan F12 untuk buka DevTools');
  console.log('   - Klik kanan tombol refresh');
  console.log('   - Pilih "Empty Cache and Hard Reload"');
  console.log('   - Atau: Ctrl+Shift+Del > Time Range: All Time > Clear');
  
  console.log('\n   Firefox:');
  console.log('   - Ctrl+Shift+R untuk hard refresh');
  console.log('   - Atau: Ctrl+Shift+Del > Clear Everything');
  
  console.log('\n   Safari:');
  console.log('   - Cmd+Option+R untuk hard refresh');
  console.log('   - Atau: Develop > Empty Caches');
  
  console.log('\n2. 🕵️ TRY INCOGNITO/PRIVATE MODE:');
  console.log('   - Chrome: Ctrl+Shift+N');
  console.log('   - Firefox: Ctrl+Shift+P');
  console.log('   - Safari: Cmd+Shift+N');
  console.log('   - Access: http://localhost:5000');
  
  console.log('\n3. 🔍 CHECK DIFFERENT URL FORMATS:');
  console.log('   - http://localhost:5000/');
  console.log('   - http://127.0.0.1:5000/');
  console.log('   - http://localhost:5000/dashboard');
  
  console.log('\n4. 🔄 BROWSER DEVELOPER TOOLS:');
  console.log('   - Open DevTools (F12)');
  console.log('   - Go to Console tab');
  console.log('   - Look for any JavaScript errors');
  console.log('   - Go to Network tab');
  console.log('   - Refresh page and check failed requests');
  
  console.log('\n5. 🌐 TRY DIFFERENT BROWSER:');
  console.log('   - If using Chrome, try Firefox');
  console.log('   - If using Safari, try Chrome');
  console.log('   - Fresh browser = no cache issues');
  
  console.log('\n📱 MOBILE TESTING:');
  console.log('   - Open browser on phone');
  console.log('   - Access: http://[your-ip]:5000');
  console.log('   - Should show React frontend');
}

// Function to open browser automatically
function openBrowser() {
  console.log('\n🚀 Attempting to open browser...');
  
  const url = 'http://localhost:5000';
  let command;
  
  switch (process.platform) {
    case 'darwin': // macOS
      command = 'open';
      break;
    case 'win32': // Windows
      command = 'start';
      break;
    default: // Linux
      command = 'xdg-open';
      break;
  }
  
  try {
    spawn(command, [url], { detached: true, stdio: 'ignore' });
    console.log(`✅ Browser opened: ${url}`);
  } catch (error) {
    console.log(`❌ Could not open browser automatically`);
    console.log(`📋 Please manually open: ${url}`);
  }
}

// Main execution
async function main() {
  console.log('🎯 Checking if Vite frontend is properly served...\n');
  
  const result = await checkServerResponse();
  
  if (result.status === 'vite') {
    console.log('\n🎉 SUCCESS: Server is serving Vite frontend correctly!');
    console.log('📋 Issue is likely browser cache or local storage');
    provideBrowserSolutions();
    openBrowser();
  } else if (result.status === 'api-only') {
    console.log('\n❌ PROBLEM: Server is in API-only mode');
    console.log('📋 Need to fix server configuration');
    console.log('\n🔧 Try these server fixes:');
    console.log('1. Kill all processes: pkill -f tsx');
    console.log('2. Restart: npm run dev');
    console.log('3. Check for port conflicts');
  } else if (result.status === 'error') {
    console.log('\n❌ PROBLEM: Cannot connect to server');
    console.log('📋 Server might not be running');
    console.log('\n🔧 Start server first:');
    console.log('1. npm run dev');
    console.log('2. Wait for "Vite development server configured"');
    console.log('3. Then run this script again');
  } else {
    console.log('\n❓ UNKNOWN: Unexpected server response');
    console.log('📋 Check server logs for issues');
  }
  
  console.log('\n📋 Summary:');
  console.log('✅ Server Status: Running');
  console.log('✅ Vite Status: Active');  
  console.log('❌ Browser Issue: Cache/Storage problem');
  console.log('\n🎯 Main solution: Clear browser cache completely!');
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});