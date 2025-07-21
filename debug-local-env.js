// Debug script untuk local environment loading
console.log("🔍 DEBUG LOCAL ENVIRONMENT LOADING");

// Load dotenv explicitly
require('dotenv').config();

console.log("Environment variables check:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("- Working directory:", process.cwd());

if (process.env.DATABASE_URL) {
  const masked = process.env.DATABASE_URL.replace(/postgresql:\/\/[^:]+:[^@]+@/, 'postgresql://***:***@');
  console.log("- DATABASE_URL:", masked);
} else {
  console.log("❌ DATABASE_URL not found in process.env");
}

// Check .env file exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  console.log("✅ .env file exists at:", envPath);
  
  // Read and show content
  const content = fs.readFileSync(envPath, 'utf8');
  console.log("\n📄 .env file content:");
  content.split('\n').forEach((line, index) => {
    if (line.trim() && !line.startsWith('#')) {
      const maskedLine = line.includes('DATABASE_URL') ? 
        line.replace(/postgresql:\/\/[^:]+:[^@]+@/, 'postgresql://***:***@') : line;
      console.log(`  ${index + 1}: ${maskedLine}`);
    }
  });
} else {
  console.log("❌ .env file NOT found at:", envPath);
}

console.log("\n🔍 Available process.env keys starting with 'D':");
Object.keys(process.env)
  .filter(key => key.startsWith('D'))
  .forEach(key => console.log(`  - ${key}: ${key === 'DATABASE_URL' ? '***masked***' : process.env[key]}`));