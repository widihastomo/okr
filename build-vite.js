#!/usr/bin/env node

// Simplified Vite-only build for deployment
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

console.log('🚀 Building with Vite only...');

try {
  // 1. Clean build directory
  console.log('1. Cleaning build directory...');
  execSync('rm -rf dist', { stdio: 'inherit' });
  mkdirSync('dist', { recursive: true });

  // 2. Build frontend with Vite
  console.log('2. Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });

  // 3. Create simple server entry point
  console.log('3. Creating deployment server...');
  
  const serverCode = `// Production server entry point
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

  writeFileSync('dist/index.js', serverCode);

  // 4. Create package.json for deployment
  const packageJson = {
    "type": "module",
    "main": "index.js",
    "scripts": {
      "start": "node index.js"
    },
    "dependencies": {
      "express": "^4.18.2"
    }
  };

  writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 2));

  // 5. Verify build
  const requiredFiles = ['dist/index.js', 'dist/public/index.html', 'dist/package.json'];
  
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`Missing: ${file}`);
    }
    console.log(`✓ ${file}`);
  }

  console.log('\n✅ Vite-only build completed!');
  console.log('Ready for deployment');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}