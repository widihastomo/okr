#!/usr/bin/env node

// Vite-only build script for full-stack deployment
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, cpSync } from 'fs';

console.log('🚀 Building with Vite only...');

try {
  // 1. Clean and prepare directories
  console.log('1. Preparing build directories...');
  execSync('rm -rf dist', { stdio: 'inherit' });
  mkdirSync('dist', { recursive: true });

  // 2. Build with Vite (includes both frontend and backend)
  console.log('2. Building application with Vite...');
  execSync('npx vite build --mode production', { stdio: 'inherit' });

  // 3. Copy server files to dist root for deployment
  console.log('3. Preparing server files...');
  
  // Copy server source to dist for Node.js execution
  cpSync('server', 'dist/server', { recursive: true });
  cpSync('shared', 'dist/shared', { recursive: true });
  
  // Create package.json for deployment
  const deployPackage = {
    "type": "module",
    "main": "server/index.ts",
    "scripts": {
      "start": "tsx server/index.ts"
    },
    "dependencies": {
      "tsx": "^4.7.0"
    }
  };
  
  writeFileSync('dist/package.json', JSON.stringify(deployPackage, null, 2));

  // 4. Create startup script
  const startScript = `#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(__dirname, 'server/index.ts');

// Start the server with tsx
const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    PORT: process.env.PORT || '5000'
  }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(\`Server process exited with code \${code}\`);
  process.exit(code);
});
`;

  writeFileSync('dist/index.js', startScript);

  // 5. Verify build outputs
  console.log('4. Verifying build...');
  
  const requiredFiles = [
    'dist/index.js',
    'dist/package.json', 
    'dist/public/index.html',
    'dist/server/index.ts'
  ];

  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`Missing required file: ${file}`);
    }
    console.log(`✓ ${file}`);
  }

  console.log('\n✅ Vite-only build completed successfully!');
  console.log('📦 Ready for deployment with: node dist/index.js');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}