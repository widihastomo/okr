# Port Deployment Guide untuk Replit

## 🚀 Cara Menggunakan Port 5001 untuk Deployment

### **Default Configuration (Port 5000)**
```bash
# Standard development server
npm run dev
# Server akan berjalan di http://localhost:5000
```

### **Custom Port 5001 Deployment**
```bash
# Menggunakan script khusus
bash start-port-5001.sh
# Server akan berjalan di http://localhost:5001
```

### **Manual Port Configuration**
```bash
# Set environment variable
export PORT=5001
npm run dev
```

## 📁 File Configuration

### 1. `.env` File Settings
```bash
# Server Configuration (default: 5000, deployment: set via env var)
PORT=5000  # Default untuk development

# Untuk deployment dengan port khusus:
# PORT=5001  # Uncomment dan ubah sesuai kebutuhan
```

### 2. Environment Variable Override
```bash
# Temporary port change untuk satu session
PORT=5001 npm run dev

# Permanent export untuk session
export PORT=5001
npm run dev
```

## 🔧 Port Conflict Resolution System

Aplikasi memiliki automatic port retry system:
- Jika port 5001 sibuk → coba port 5002
- Jika port 5002 sibuk → coba port 5003  
- Maksimal 10 port attempts

## 📊 Port Mapping di Replit

Berdasarkan `.replit` configuration:
- Local Port 5000 → External Port 80 (default web)
- Local Port 5001 → External Port 4200
- Local Port 3030 → External Port 3000 (production)

## 🚀 Deployment Commands

### Development (Port 5000)
```bash
npm run dev
```

### Custom Port (Port 5001)
```bash
bash start-port-5001.sh
```

### Production (Port 3030)
```bash
NODE_ENV=production PORT=3030 node dist/index.cjs
```

## 🌐 External URLs

- **Development**: https://your-repl-url.replit.dev (port 5000 → external 80)
- **Custom Port**: https://your-repl-url-4200.replit.dev (port 5001 → external 4200)
- **Production**: https://your-repl-url-3000.replit.dev (port 3030 → external 3000)

## ✅ Verification

```bash
# Test health endpoint
curl http://localhost:5001/health

# Check if port is accessible
curl http://localhost:5001/
```

## 🔍 Troubleshooting

1. **Workflow expects port 5000**: Gunakan script khusus atau manual export
2. **Port conflict**: System akan automatic retry ke port berikutnya
3. **External access**: Check Replit port mapping configuration