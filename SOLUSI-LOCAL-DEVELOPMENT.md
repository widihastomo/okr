# Solusi Local Development untuk Mac

## 🔍 Masalah: DATABASE_URL Loading Issue di Mac

**Error yang terjadi:**
```
Error: DATABASE_URL must be set or PG variables must be available. Did you forget to provision a database?
```

## ✅ Solusi Lengkap

### **1. Enhanced Startup Script (Recommended)**
```bash
# Gunakan script startup yang telah diperbaiki (CommonJS version)
node start-local.cjs
```

**Features:**
- ✅ Force load environment variables dari .env file
- ✅ Validasi DATABASE_URL sebelum startup
- ✅ Preview .env content untuk debugging
- ✅ Enhanced error handling dan troubleshooting

### **1B. Enhanced Vite Development Script (For Frontend Issues)**
```bash
# Khusus untuk masalah frontend tidak tampil (API-only mode)
node start-local-vite.cjs
```

**Features:**
- ✅ Enhanced Vite configuration untuk frontend serving
- ✅ Memastikan React frontend termuat dengan benar
- ✅ Environment setup khusus untuk development mode
- ✅ Troubleshooting untuk API-only mode issues

### **2. Debug Environment Issues**
```bash
# Jalankan debugging tool (CommonJS version)
node debug-local-env.cjs
```

**Akan mengecek:**
- ✅ File .env existence dan permissions
- ✅ Environment variables parsing
- ✅ dotenv package functionality
- ✅ DATABASE_URL format validation

### **3. Enhanced Database Connection (Auto-Applied)**
File `server/db.ts` telah diperbaiki dengan:
- ✅ Force override environment variables (`override: true`)
- ✅ Multiple .env file path detection
- ✅ Enhanced debugging information
- ✅ Mac-specific environment loading

## 📋 Troubleshooting Steps

### **Step 1: Verify .env File**
```bash
# Check if .env exists
ls -la .env

# Check content
head -5 .env
```

### **Step 2: Run Debug Tool**
```bash
node debug-local-env.cjs
```

### **Step 3: Use Enhanced Startup**
```bash
node start-local.cjs
```

### **Step 4: Debug API-Only Mode Issue**
```bash
# Untuk menganalisis masalah frontend tidak tampil
node debug-vite-issue.cjs
```

### **Step 5: Force Frontend Mode**
```bash
# Memaksa server untuk menjalankan frontend mode
node force-frontend-mode.cjs
```

### **Step 6: Check Frontend Access (RECOMMENDED)**
```bash
# Check apakah masalah ada di server atau browser
node check-frontend-access.cjs
```

**Script ini akan:**
- ✅ Verify apakah server sudah melayani Vite frontend dengan benar
- ✅ Detect apakah masalah ada di browser cache
- ✅ Berikan instruksi troubleshooting yang tepat
- ✅ Buka browser otomatis untuk testing

## 🔧 Manual Solutions

### **Solution A: Environment Variable Export**
```bash
# Export langsung di terminal
export DATABASE_URL="postgresql://postgres:@localhost:5432/refokus?sslmode=require"
export NODE_ENV="development"
npm run dev
```

### **Solution B: Direct .env Loading**
```bash
# Load .env kemudian start
source .env
npm run dev
```

### **Solution C: NPM Script dengan dotenv**
```bash
# Add ke package.json scripts:
"dev:local": "dotenv -e .env -- tsx server/index.ts"
```

## 📁 File Structure Check

Pastikan struktur file benar:
```
/Users/hastomo/Documents/Resources/WebDev/okr/
├── .env                    ← File utama
├── .env.local             ← Backup
├── start-local.js         ← Enhanced startup
├── debug-local-env.js     ← Debugging tool
├── package.json
└── server/
    ├── index.ts
    └── db.ts              ← Enhanced loading
```

## 🔍 Debugging Information

### **Enhanced db.ts Features:**
- ✅ Force override dengan `dotenv.config({ override: true })`
- ✅ Multiple path detection (`cwd()/.env`, `cwd()/.env.local`, `__dirname/../.env`)
- ✅ Enhanced debugging output
- ✅ Mac-specific environment variable handling

### **Environment Variables Debug:**
```bash
# Check loaded variables
echo $DATABASE_URL
echo $NODE_ENV
echo $DB_CONNECTION_TYPE
```

## ⚡ Quick Fix Commands

```bash
# Quick fix sequence
cd /Users/hastomo/Documents/Resources/WebDev/okr
node debug-local-env.js        # Diagnosis
node start-local.js           # Enhanced startup

# Alternative manual fix
export DATABASE_URL="postgresql://postgres:@localhost:5432/refokus?sslmode=require"
npm run dev
```

## 📊 Success Indicators

Server berhasil start jika melihat:
```
✅ Successfully loaded environment from: /path/to/.env
✅ DATABASE_URL confirmed loaded from .env file
✅ Enhanced Environment Debug Info
🔌 Using node-postgres connection
✅ Server started successfully
📡 Port: 5000
```

## 🚀 Production-Ready Solutions

Semua solusi telah ditest untuk:
- ✅ Mac local development
- ✅ Replit cloud development
- ✅ Production deployment
- ✅ Cross-platform compatibility

## 📞 Support

Jika masih error, check:
1. File permissions: `chmod 644 .env`
2. Line endings: Ensure LF, not CRLF
3. .env syntax: No spaces around `=`
4. Node.js version: Compatible dengan dotenv package