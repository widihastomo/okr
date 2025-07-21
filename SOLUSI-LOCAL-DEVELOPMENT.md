# SOLUSI LENGKAP - DATABASE_URL ERROR DI LOCAL DEVELOPMENT

## 🚨 MASALAH
```
❌ DATABASE_URL tidak ditemukan di environment variables!
Error: DATABASE_URL must be set or PG variables must be available
```

## ✅ SOLUSI CEPAT

### Option 1: Gunakan Script Local Development yang sudah dibuat

```bash
# Masuk ke folder project
cd /Users/hastomo/Documents/Resources/WebDev/okr

# Jalankan script local development
node start-local.js
```

Script ini akan:
- ✅ Auto-copy .env.local ke .env jika .env tidak ada
- ✅ Validasi content DATABASE_URL di .env file
- ✅ Force load environment variables dengan dotenv
- ✅ Start npm run dev dengan environment yang benar

### Option 2: Manual Setup .env File

1. **Pastikan file .env ada di root project:**
   ```bash
   cd /Users/hastomo/Documents/Resources/WebDev/okr
   ls -la | grep .env
   ```

2. **Jika tidak ada, copy dari .env.local:**
   ```bash
   cp .env.local .env
   ```

3. **Atau buat file .env baru dengan content:**
   ```bash
   cat > .env << 'EOF'
   # Database Configuration
   DATABASE_URL=postgresql://neondb_owner:npg_YuHkG0BUSgb3@ep-super-fog-a69ws4u6.us-west-2.aws.neon.tech/neondb?sslmode=require
   DB_CONNECTION_TYPE=neon
   NODE_ENV=development
   SESSION_SECRET=local_development_session_secret_12345
   PORT=5000
   EOF
   ```

4. **Test environment loading:**
   ```bash
   node debug-local-env.js
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## 🔍 DEBUGGING COMMANDS

```bash
# Test environment loading
node debug-local-env.js

# Check file exists
ls -la .env

# Check file content
cat .env | head -5

# Test with enhanced local script
node start-local.js
```

## 📋 OUTPUT YANG DIHARAPKAN

```
🚀 Starting local development server...
✅ Environment file validated
✅ DATABASE_URL loaded successfully
✅ Environment variables loaded from .env file via dotenv
✅ DATABASE_URL exists: true
✅ Database connection successful (Neon)
```

## 🆘 JIKA MASIH ERROR

1. **Cek working directory:**
   ```bash
   pwd
   # Harus: /Users/hastomo/Documents/Resources/WebDev/okr
   ```

2. **Cek file permissions:**
   ```bash
   ls -la .env
   # Harus readable: -rw-r--r--
   ```

3. **Force install dotenv:**
   ```bash
   npm install dotenv --save
   ```

4. **Reset environment:**
   ```bash
   rm .env
   cp .env.local .env
   node start-local.js
   ```

## 🎯 QUICK FIX - SATU BARIS

```bash
cd /Users/hastomo/Documents/Resources/WebDev/okr && cp .env.local .env && node start-local.js
```

## 📞 SUPPORT

Jika masih error, jalankan debug script dan kirim output:
```bash
node debug-local-env.js > debug-output.txt 2>&1
cat debug-output.txt
```