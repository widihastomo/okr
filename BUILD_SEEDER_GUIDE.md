# Build Seeder Guide

## Overview

Build seeder adalah sistem yang secara otomatis membuat data essential untuk sistem saat proses build production. Sistem ini memastikan bahwa aplikasi siap digunakan segera setelah deployment.

## Scripts yang Tersedia

### 1. Build Seeder (Standalone)
```bash
npx tsx server/build-seeder.ts
```
- Membuat system owner account
- Membuat application settings
- Membuat subscription plans
- Ideal untuk development testing

### 2. Build dengan Seeder (Production)
```bash
node build-with-seeder.js
```
- Menjalankan seeder terlebih dahulu
- Kemudian melakukan build production
- Menghasilkan folder `dist/` yang siap deploy
- Termasuk seeder standalone untuk production

## Data yang Dibuat oleh Seeder

### 1. System Owner Account
- **Email**: admin@refokus.com
- **Password**: RefokusAdmin2025!
- **Role**: System Owner dengan akses penuh
- **Organization**: Refokus System (system organization)

### 2. Application Settings (22 setting)
- **General Settings**: App name, description, version, company info
- **Appearance Settings**: Primary color, secondary color, logo, favicon
- **Feature Settings**: Notifications, achievements, gamification, trials
- **Security Settings**: Session timeout, password policies, login attempts
- **Business Settings**: Trial duration, max users, currency
- **Integration Settings**: Email notifications, provider settings

### 3. Subscription Plans (4 plans)
- **Free Trial**: 7 hari gratis, maksimal 3 user
- **Starter**: 199k IDR/bulan, maksimal 10 user
- **Growth**: 499k IDR/bulan, maksimal 50 user
- **Enterprise**: 999k IDR/bulan, unlimited user

### 4. Billing Periods (10 periods)
- Monthly, quarterly, dan annual billing untuk setiap plan
- Pricing dengan discount untuk longer commitments

## Environment Configuration

### Database Connection
Seeder mendukung 2 cara konfigurasi database:

1. **DATABASE_URL** (recommended)
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```

2. **Individual PG Variables**
   ```env
   PGUSER=username
   PGPASSWORD=password
   PGHOST=hostname
   PGPORT=5432
   PGDATABASE=dbname
   ```

### Required Environment Variables
```env
NODE_ENV=production
DATABASE_URL=your-database-url
SESSION_SECRET=your-session-secret
```

## Production Deployment Workflow

### 1. Development Testing
```bash
# Test seeder in development
npx tsx server/build-seeder.ts

# Verify data created
# Check database for users, settings, subscription plans
```

### 2. Production Build
```bash
# Build with integrated seeder
node build-with-seeder.js

# Output files in dist/:
# - index.js (main application)
# - seed.js (standalone seeder)
# - public/ (frontend assets)
# - package.json (production dependencies)
# - .env.example (environment template)
# - README.md (deployment guide)
```

### 3. Production Deployment
```bash
# Copy dist/ to production server
# Configure environment variables
# Install dependencies
npm install

# Run seeder (if needed)
npm run seed

# Start application
npm start
```

## Error Handling

### Database Connection Issues
- Script akan otomatis mencoba construct DATABASE_URL dari PG variables
- Jika gagal, akan memberikan error message yang detail
- Mendukung SSL connections untuk production

### Duplicate Data Prevention
- Seeder menggunakan `onConflictDoNothing()` untuk mencegah duplicate data
- Jika data sudah ada, akan skip dengan pesan informasi
- Tidak akan override data yang sudah ada

### Production vs Development
- **Development**: Menampilkan error lengkap dan exit jika gagal
- **Production**: Log error tapi tetap lanjut build process
- Environment-aware messaging dan logging

## Security Features

### Password Hashing
- Menggunakan bcrypt untuk hash password system owner
- Salt rounds sesuai dengan production security standards

### SSL Database Connection
- Otomatis menambahkan `?sslmode=require` untuk constructed URLs
- Mendukung SSL certificates untuk production databases

### Environment Variable Protection
- Tidak pernah log password atau sensitive data
- Mask database URLs dalam log output

## Integration dengan Build Process

### Automatic Seeder Execution
- Build script otomatis menjalankan seeder sebelum build
- Jika seeder gagal, build tetap lanjut dengan warning
- Seeder standalone disertakan dalam output untuk manual execution

### Build Verification
- Verifikasi semua file yang dibutuhkan sudah dibuat
- Check file sizes untuk memastikan build berhasil
- Generate build metadata dengan timestamp dan durasi

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Pastikan DATABASE_URL benar
   - Check database server running
   - Verify SSL configuration

2. **Permission Errors**
   - Pastikan user database memiliki permission CREATE
   - Check schema access permissions

3. **Duplicate Key Errors**
   - Seeder menggunakan conflict resolution
   - Tidak akan gagal jika data sudah ada

4. **Build Failures**
   - Seeder error tidak akan stop build process
   - Check logs untuk specific error messages
   - Manual seeder execution tersedia

### Manual Recovery
```bash
# Jika seeder gagal during build
node dist/seed.js

# Atau run original seeder
npx tsx server/build-seeder.ts

# Atau run production seeder
npx tsx server/create-production-seeder.ts
```

## Best Practices

### Development
- Run seeder sebelum testing untuk ensure consistent data
- Use development environment variables
- Test dengan clean database untuk verify seeder functionality

### Production
- Always backup database before running seeder
- Use production-grade DATABASE_URL dengan SSL
- Monitor seeder execution logs
- Keep default password secure dan change immediately

### Deployment
- Include seeder execution dalam deployment pipeline
- Verify essential data setelah deployment
- Keep seeder scripts updated dengan schema changes

## Support

Untuk technical support atau questions tentang build seeder:
- Check logs untuk error messages
- Verify environment variables
- Test database connectivity
- Contact: admin@refokus.com