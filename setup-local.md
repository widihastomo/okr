# Setup Local Development

## Quick Fix untuk DATABASE_URL Error

### Option 1: Gunakan Database Neon (Recommended)
1. Copy file `.env` dari Replit ke project local Anda
2. Pastikan file `.env` ada di root folder project (sama level dengan package.json)
3. Isi DATABASE_URL dengan connection string berikut:

```bash
# Copy file .env dari Replit atau buat file .env baru dengan content:
DATABASE_URL=postgresql://neondb_owner:npg_YuHkG0BUSgb3@ep-super-fog-a69ws4u6.us-west-2.aws.neon.tech/neondb?sslmode=require
DB_CONNECTION_TYPE=neon
NODE_ENV=development
SESSION_SECRET=your_session_secret_here_local
PORT=5000
```

### Option 2: Setup PostgreSQL Local
Jika ingin menggunakan database local:

1. Install PostgreSQL di Mac:
```bash
brew install postgresql
brew services start postgresql
```

2. Buat database local:
```bash
createdb okr_local
```

3. Update .env:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/okr_local
DB_CONNECTION_TYPE=node-postgres
```

### Troubleshooting

#### Jika masih error "DATABASE_URL not found":
1. Pastikan file .env ada di root folder project
2. Restart terminal dan npm run dev
3. Check apakah dotenv ter-install: `npm list dotenv`

#### Debug Steps:
1. Run aplikasi dan lihat output console
2. Akan muncul debug info seperti:
   ```
   🔍 Environment Debug Info:
   - NODE_ENV: development
   - DATABASE_URL exists: true/false
   - Current working directory: /path/to/project
   ```

3. Jika DATABASE_URL exists: false, berarti .env tidak ter-load

## Quick Commands

```bash
# Install dependencies
npm install

# Setup database (if using local PostgreSQL)
npm run db:push

# Start development server
npm run dev
```

## Verification

Server berhasil jika muncul log:
```
✅ Database connection successful (Neon)
✅ Server started successfully
🌐 Environment: development
🚀 Server listening on host: 0.0.0.0
📡 Port: 5000
```