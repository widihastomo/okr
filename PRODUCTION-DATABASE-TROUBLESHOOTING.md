# Production Database Troubleshooting Guide

## Quick Diagnosis

Jika koneksi database gagal di production, jalankan script debug:

```bash
node debug-production-db.js
```

## Common Issues dan Solutions

### 1. SSL Connection Required

**Error**: `SSL connection required` atau `sslmode=require`

**Solution**:
```env
# Pastikan DATABASE_URL menggunakan SSL
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Atau gunakan parameter SSL lainnya
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require&sslrootcert=rds-ca-2019-root.pem
```

### 2. Connection Timeout

**Error**: `Connection timeout` atau `ECONNREFUSED`

**Solutions**:
- Cek koneksi database server aktif
- Verifikasi firewall mengizinkan port 5432
- Gunakan IP whitelist jika perlu

### 3. Authentication Failed

**Error**: `28000` atau `28P01`

**Solutions**:
- Verifikasi username dan password benar
- Pastikan user memiliki privilege untuk connect
- Cek database name sudah benar

### 4. Host Not Found

**Error**: `ENOTFOUND` atau DNS error

**Solutions**:
- Verifikasi hostname database benar
- Cek DNS resolution
- Gunakan IP address langsung jika DNS bermasalah

## Database Connection Types

### Neon Serverless (Recommended)
```env
DB_CONNECTION_TYPE=neon
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
```

### Node-Postgres (Traditional)
```env
DB_CONNECTION_TYPE=node-postgres
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
```

## SSL Configuration

### Production SSL Settings
```env
# Production environment
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
```

### Development SSL Settings
```env
# Development environment
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

## Alternative Configuration

Jika DATABASE_URL tidak tersedia, gunakan PG variables:

```env
PGUSER=your_username
PGPASSWORD=your_password
PGHOST=your_host
PGPORT=5432
PGDATABASE=your_database
```

System akan otomatis construct DATABASE_URL dengan SSL untuk production.

## Testing Connection

### Manual Test
```bash
# Test dengan psql
psql "postgresql://user:pass@host:5432/dbname?sslmode=require"

# Test dengan node debug script
node debug-production-db.js
```

### Application Test
```bash
# Production build test
npm run build
NODE_ENV=production node dist/index.cjs
```

## Performance Optimization

### Connection Pool Settings
```typescript
// Optimized for production
connectionPool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,                      // Max connections
  idleTimeoutMillis: 30000,     // Close idle connections
  connectionTimeoutMillis: 10000, // Connection timeout
  ssl: {
    rejectUnauthorized: false,
    require: true
  }
});
```

## Troubleshooting Steps

1. **Check Environment Variables**
   ```bash
   echo $DATABASE_URL
   echo $NODE_ENV
   ```

2. **Run Debug Script**
   ```bash
   node debug-production-db.js
   ```

3. **Test Connection Manually**
   ```bash
   psql $DATABASE_URL
   ```

4. **Check Application Logs**
   ```bash
   # Look for database connection errors
   grep -i "database" logs/app.log
   ```

5. **Verify SSL Requirements**
   ```bash
   # Check if SSL is required
   psql "postgresql://user:pass@host:5432/dbname" # Should fail
   psql "postgresql://user:pass@host:5432/dbname?sslmode=require" # Should work
   ```

## Production Checklist

- [ ] DATABASE_URL configured with SSL
- [ ] Database server allows connections from production IP
- [ ] Firewall allows port 5432
- [ ] Database user has correct permissions
- [ ] SSL certificates valid (if using custom CA)
- [ ] Connection pooling configured
- [ ] Timeout values appropriate for production
- [ ] Environment variables properly set
- [ ] Database schema up to date

## Common Providers

### Neon (Recommended)
```env
DATABASE_URL=postgresql://user:pass@ep-name.region.aws.neon.tech/dbname?sslmode=require
```

### Supabase
```env
DATABASE_URL=postgresql://postgres:pass@db.project.supabase.co:5432/postgres?sslmode=require
```

### AWS RDS
```env
DATABASE_URL=postgresql://user:pass@rds-instance.region.rds.amazonaws.com:5432/dbname?sslmode=require
```

### Railway
```env
DATABASE_URL=postgresql://user:pass@containers-us-west-1.railway.app:5432/railway?sslmode=require
```

## Support

Jika masalah masih berlanjut, kirimkan output dari:
```bash
node debug-production-db.js
```

Dan sertakan informasi:
- Database provider (Neon, Supabase, AWS RDS, dll)
- Error message lengkap
- Environment variables (tanpa password)
- Production platform (Vercel, Netlify, Railway, dll)