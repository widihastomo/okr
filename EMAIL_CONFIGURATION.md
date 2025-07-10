# Email Configuration Guide

Konfigurasi email system sudah dipindahkan dari database settings ke environment variables untuk keamanan dan fleksibilitas yang lebih baik.

## Environment Variables

### Mailtrap (untuk Development/Testing)
```env
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
MAILTRAP_FROM=noreply@yourapp.com
```

### SendGrid (untuk Production)
```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM=noreply@yourapp.com
```

### Gmail SMTP (Alternative)
```env
GMAIL_EMAIL=your_gmail_address@gmail.com
GMAIL_PASSWORD=your_gmail_app_password
GMAIL_FROM=noreply@yourapp.com
```

### Generic SMTP (Alternative)
```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@yourapp.com
```

## Email Provider Priority

System akan mencoba provider email dalam urutan berikut:
1. **Mailtrap** (untuk testing dan development)
2. **SendGrid** (untuk production)
3. **Gmail SMTP** (fallback)
4. **Generic SMTP** (fallback)

## Setup Instructions

### 1. Mailtrap (Development)
1. Register di https://mailtrap.io
2. Buat inbox baru
3. Copy credentials ke environment variables

### 2. SendGrid (Production)
1. Register di https://sendgrid.com
2. Buat API key dengan Send Mail permission
3. Verify domain sender untuk production

### 3. Gmail SMTP
1. Enable 2-factor authentication
2. Generate App Password di Google Account settings
3. Gunakan App Password sebagai GMAIL_PASSWORD

## Testing Email

System admin dapat test email menggunakan endpoint:
```
POST /api/admin/email-settings/test
```

Dengan body:
```json
{
  "to": "test@example.com",
  "subject": "Test Email",
  "message": "This is a test message"
}
```

## Security Benefits

- ✅ Credential tersimpan di environment variables (tidak di database)
- ✅ Tidak ada exposure di UI admin
- ✅ Mudah untuk deployment automation
- ✅ Lebih secure untuk production environment

## Migration Notes

- Database email settings sudah deprecated
- UI admin email settings sudah dihapus
- Hanya tersisa endpoint test email untuk system admin
- Semua konfigurasi harus dilakukan via environment variables

## Troubleshooting

### Common Issues

1. **"All email providers failed"**
   - Periksa apakah minimal satu provider sudah dikonfigurasi
   - Periksa validitas credentials
   - Pastikan environment variables sudah di-load

2. **"SMTP connection failed"**
   - Periksa SMTP host dan port
   - Verifikasi username dan password
   - Periksa firewall dan network connectivity

3. **"SendGrid API key not configured"**
   - Pastikan SENDGRID_API_KEY sudah diset
   - Verifikasi API key masih valid
   - Periksa domain verification di SendGrid

4. **"Gmail authentication failed"**
   - Gunakan App Password, bukan password biasa
   - Pastikan 2-factor authentication aktif
   - Periksa "Less secure app access" settings

### Testing Email Configuration

1. Login sebagai system admin
2. Gunakan endpoint test:
   ```bash
   curl -X POST http://localhost:5000/api/admin/email-settings/test \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{"to":"test@example.com","subject":"Test","message":"Test message"}'
   ```

### Environment Setup

Pastikan file `.env` berisi konfigurasi yang sesuai dengan provider yang akan digunakan:

```bash
# Copy dari .env.example
cp .env.example .env

# Edit sesuai dengan provider yang dipilih
nano .env
```

### Development vs Production

- **Development**: Gunakan Mailtrap untuk safe testing
- **Production**: Gunakan SendGrid atau Gmail SMTP
- **Staging**: Bisa menggunakan Gmail SMTP untuk testing