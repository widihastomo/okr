# Setup Mailtrap untuk Development Email

## Langkah 1: Buat Account Mailtrap

1. **Daftar di Mailtrap**
   - Kunjungi: https://mailtrap.io
   - Klik "Sign Up" dan buat account gratis
   - Verifikasi email Anda

## Langkah 2: Buat Inbox

1. **Login ke Dashboard Mailtrap**
2. **Buat Inbox Baru**
   - Klik "Add Inbox"
   - Nama: "Development Emails" (atau nama yang Anda inginkan)
   - Klik "Create"

## Langkah 3: Dapatkan Credentials

1. **Buka Inbox yang Baru Dibuat**
2. **Klik Tab "SMTP Settings"**
3. **Pilih "Node.js - Nodemailer"**
4. **Copy credentials yang ditampilkan**

## Langkah 4: Update File .env

Edit file `.env` yang sudah dibuat dan ganti dengan credentials dari Mailtrap:

```env
# Email Configuration - Mailtrap
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=1a2b3c4d5e6f7g  # Ganti dengan username dari Mailtrap
MAILTRAP_PASS=9h8i7j6k5l4m3n  # Ganti dengan password dari Mailtrap
MAILTRAP_FROM=noreply@yourapp.com
```

## Langkah 5: Restart Aplikasi

Setelah mengubah `.env`, restart aplikasi:
```bash
# Aplikasi akan restart otomatis di Replit
```

## Langkah 6: Test Email

1. **Login sebagai admin ke aplikasi**
2. **Test email dengan endpoint:**
   ```bash
   curl -X POST http://localhost:5000/api/admin/email-settings/test \
     -H "Content-Type: application/json" \
     -d '{"to":"test@example.com","subject":"Test Mailtrap","message":"Email test berhasil!"}'
   ```

## Langkah 7: Cek Inbox Mailtrap

1. **Kembali ke dashboard Mailtrap**
2. **Buka inbox yang dibuat**
3. **Email test akan muncul di inbox**

## Keuntungan Mailtrap

✅ **Safe Testing**: Email tidak benar-benar dikirim ke luar
✅ **Preview Email**: Lihat tampilan email di berbagai client
✅ **Spam Analysis**: Cek apakah email akan masuk spam
✅ **Free Plan**: Hingga 500 emails per bulan
✅ **HTML Preview**: Lihat email dalam format HTML dan teks

## Contoh Credentials

Credentials Mailtrap akan terlihat seperti ini:
```
Host: smtp.mailtrap.io
Port: 2525
Username: 1a2b3c4d5e6f7g
Password: 9h8i7j6k5l4m3n
```

## Troubleshooting

### Email tidak muncul di Mailtrap?
- Periksa credentials di file `.env`
- Pastikan aplikasi sudah di-restart
- Cek log server untuk error message

### "Mailtrap credentials not configured"?
- Pastikan semua variabel MAILTRAP_* sudah diisi
- Restart aplikasi setelah mengubah `.env`
- Cek tidak ada typo di nama variabel

### Connection timeout?
- Pastikan koneksi internet stabil
- Cek firewall tidak memblokir port 2525
- Pastikan menggunakan credentials yang benar

## Next Steps

Setelah Mailtrap berhasil dikonfigurasi:
1. Email registrasi akan berfungsi
2. Email verifikasi akan terkirim
3. Email reset password akan bekerja
4. Semua notifikasi email akan tersimpan di Mailtrap

Untuk production, ganti ke SendGrid atau Gmail SMTP.