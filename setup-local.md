# Setup OKR Management System - Local Development

## Prerequisites

1. **Node.js (versi 18 atau 20)**
   - Download dari [nodejs.org](https://nodejs.org)
   - Verifikasi: `node --version` dan `npm --version`

2. **PostgreSQL Database**
   - Download dari [postgresql.org](https://postgresql.org)
   - Atau gunakan Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

## Installation Steps

### 1. Setup Project
```bash
# Clone atau download project
git clone [repository-url]
cd okr-management-system

# Install dependencies
npm install
```

### 2. Database Setup
```sql
-- Buka psql atau pgAdmin dan jalankan:
CREATE DATABASE okr_management;
CREATE USER okr_user WITH PASSWORD 'okr_password';
GRANT ALL PRIVILEGES ON DATABASE okr_management TO okr_user;
```

### 3. Environment Configuration
Buat file `.env` di root project:
```env
NODE_ENV=development
DATABASE_URL=postgresql://okr_user:okr_password@localhost:5432/okr_management
PORT=3000
SESSION_SECRET=your-secret-key-here
```

**Penting:** Ganti `okr_user`, `okr_password`, dan `your-secret-key-here` sesuai konfigurasi Anda.

### 4. Database Schema
```bash
# Push schema ke database
npm run db:push
```

### 5. Start Application
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Access Application

- **URL:** http://localhost:3000
- **Default Admin Login:**
  - Email: `admin@example.com`
  - Password: `password123`

## Troubleshooting

### Error "DATABASE_URL must be set"
- Pastikan file `.env` ada di root folder
- Periksa format DATABASE_URL sudah benar
- Restart aplikasi setelah mengubah .env

### Error Database Connection
- Pastikan PostgreSQL running: `systemctl status postgresql` (Linux) atau cek Services (Windows)
- Test koneksi: `psql -h localhost -U okr_user -d okr_management`
- Periksa firewall tidak memblokir port 5432

### Port Already in Use
- Default port sekarang 3000, jika masih conflict ubah PORT di file .env ke port lain (contoh: 8000)
- Atau stop aplikasi yang menggunakan port tersebut

### Permission Denied
```bash
# Fix npm permissions (Linux/Mac)
sudo chown -R $(whoami) ~/.npm
```

## Production Deployment

Untuk deployment production:
```bash
# Build aplikasi
npm run build

# Set environment
export NODE_ENV=production
export DATABASE_URL=postgresql://user:pass@host:port/db

# Start server
npm start
```

## Features Available

- ✅ User Management & Authentication
- ✅ OKR Creation & Tracking
- ✅ Progress Monitoring with Charts
- ✅ Team Collaboration
- ✅ Initiative & Task Management
- ✅ Automatic Status Calculations
- ✅ Cycle Management (Monthly/Quarterly/Annual)

## Support

Jika mengalami masalah, periksa:
1. Console browser untuk error JavaScript
2. Terminal/command prompt untuk error server
3. Database logs untuk error koneksi
4. File .env format dan nilai yang benar