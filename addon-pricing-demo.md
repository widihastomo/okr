# Sistem Pricing Add-On: Per User/Month Model

## Model Pricing yang Didukung

Sistem addon management mendukung 3 model pricing yang fleksibel:

### 1. **Per User** (per_user)
```json
{
  "name": "Penambahan User",
  "slug": "additional-user", 
  "type": "per_user",
  "price": "25000"
}
```
- **Cara Kerja**: Harga dikalikan dengan jumlah user yang ditambahkan
- **Contoh**: 25.000 IDR x 5 user = 125.000 IDR/bulan
- **Cocok untuk**: Addon kapasitas user, lisensi software per user

### 2. **Monthly** (monthly)
```json
{
  "name": "Advanced Analytics",
  "slug": "advanced-analytics",
  "type": "monthly", 
  "price": "50000"
}
```
- **Cara Kerja**: Harga tetap per bulan untuk seluruh organisasi
- **Contoh**: 50.000 IDR/bulan (flat rate)
- **Cocok untuk**: Fitur premium, akses analytics, integrasi khusus

### 3. **One Time** (one_time)
```json
{
  "name": "Setup Premium",
  "slug": "premium-setup",
  "type": "one_time",
  "price": "100000"
}
```
- **Cara Kerja**: Pembayaran sekali untuk aktivasi permanen
- **Contoh**: 100.000 IDR (sekali bayar)
- **Cocok untuk**: Setup khusus, konfigurasi premium, onboarding

## Implementasi Per User/Month

### Di Database:
```sql
organization_add_on_subscriptions (
  quantity INTEGER DEFAULT 1, -- Jumlah user untuk type "per_user"
  add_on_id UUID -- Reference ke addon dengan type "per_user"
)
```

### Di Frontend:
- **Quantity Input**: User bisa pilih berapa user yang ingin ditambahkan
- **Real-time Calculation**: Harga otomatis dikalkulasi (price × quantity)
- **Billing Integration**: Terintegrasi dengan billing period (monthly/quarterly/annual)

### Contoh User Experience:
1. User pilih "Penambahan User" addon
2. Input quantity: "10 user"
3. Sistem kalkulasi: 25.000 × 10 = 250.000 IDR/bulan
4. Subscribe dengan billing period yang dipilih
5. Invoice otomatis generated sesuai billing cycle

### Benefit Per User Model:
- **Scalable**: Organisasi bayar sesuai kebutuhan actual
- **Fair Pricing**: Tidak overpay untuk kapasitas yang tidak digunakan  
- **Growth Friendly**: Mudah scale up/down sesuai pertumbuhan tim
- **Transparent**: Biaya jelas dan predictable

Sistem ini memberikan fleksibilitas maksimal untuk berbagai model bisnis SaaS!