# Production Setup Guide

## Seeder Script untuk Akun System Owner

Proyek ini menyediakan script untuk membuat akun system owner untuk production deployment.

### Script yang Tersedia

#### 1. Script Utama (Recommended)
```bash
./seed-production.sh
```
**Fungsi:** Membuat data production lengkap termasuk:
- Akun system owner
- Subscription plans (Free Trial, Starter, Growth, Enterprise)
- System organization
- Verifikasi setup

#### 2. Script Admin Only
```bash
./create-production-admin.sh
```
**Fungsi:** Hanya membuat akun system owner saja

### Cara Penggunaan

1. **Pastikan database production sudah siap:**
   ```bash
   # Pastikan DATABASE_URL sudah di-set
   echo $DATABASE_URL
   ```

2. **Jalankan seeder production:**
   ```bash
   ./seed-production.sh
   ```

3. **Credentials yang akan dibuat:**
   - **Email:** admin@refokus.com
   - **Password:** RefokusAdmin2025!
   - **Role:** System Owner
   - **Organization:** Refokus System

### Hasil Setelah Seeding

✅ **System Owner Account**
- Email: admin@refokus.com
- Password: RefokusAdmin2025!
- Full system privileges
- System organization access

✅ **Subscription Plans**
- Free Trial (7 hari, max 3 users)
- Starter (Rp 199,000/bulan, max 10 users)
- Growth (Rp 499,000/bulan, max 50 users)
- Enterprise (Rp 999,000/bulan, unlimited users)

✅ **System Organization**
- Nama: Refokus System
- Slug: refokus-system
- System administrator organization

### Keamanan Production

⚠️ **PENTING - Langkah Keamanan:**

1. **Ganti password default** segera setelah login pertama
2. **Gunakan environment variables** untuk credentials sensitif
3. **Aktifkan 2FA** jika tersedia
4. **Backup database** sebelum seeding
5. **Simpan credentials** di tempat yang aman

### Troubleshooting

**Error: System owner already exists**
```
⚠️ System owner already exists:
   Email: admin@refokus.com
   ID: [user-id]
```
**Solusi:** Gunakan credentials yang sudah ada atau hapus akun existing terlebih dahulu

**Error: Database connection failed**
```
❌ Error creating production admin: [error]
```
**Solusi:** Periksa DATABASE_URL dan koneksi database

### Manual Execution

Jika shell script tidak bisa dijalankan, gunakan command langsung:

```bash
# Untuk seeder lengkap
npx tsx server/create-production-seeder.ts

# Untuk admin only
npx tsx server/create-production-admin.ts
```

### Verification

Setelah seeding berhasil, verifikasi dengan:

1. **Login ke aplikasi** menggunakan credentials yang dibuat
2. **Cek system admin dashboard** tersedia
3. **Verifikasi subscription plans** ada di database
4. **Test create organization** dan user management

### Production Deployment Checklist

- [ ] Database production sudah siap
- [ ] Environment variables sudah di-set
- [ ] Seeding production berhasil
- [ ] System owner login berhasil
- [ ] Ganti password default
- [ ] Backup database
- [ ] Monitor logs untuk error
- [ ] Test basic functionality

## Support

Jika mengalami masalah dengan seeding production, periksa:
1. Database connection
2. Environment variables
3. Logs error dari script
4. Permissions untuk create tables/users