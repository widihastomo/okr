# Reset Data Onboarding

Untuk menghapus data client dan memulai onboarding ulang, ikuti salah satu cara berikut:

## Cara 1: Menggunakan Browser Console (Recommended)

1. Buka Developer Tools (F12 atau Ctrl+Shift+I)
2. Pilih tab "Console"
3. Copy dan paste script berikut, lalu tekan Enter:

```javascript
// Reset data onboarding
localStorage.removeItem('companyDetailsCompleted');
localStorage.removeItem('onboardingCompleted'); 
localStorage.removeItem('welcomeShown');
localStorage.removeItem('tourStarted');
localStorage.removeItem('tourCompleted');
localStorage.removeItem('hasSeenWelcome');
console.log('✅ Data onboarding berhasil direset!');
window.location.href = '/company-onboarding';
```

## Cara 2: Manual LocalStorage Clear

1. Buka Developer Tools (F12)
2. Pilih tab "Application" atau "Storage"
3. Pada sidebar kiri, pilih "Local Storage" > domain aplikasi
4. Hapus key berikut:
   - `companyDetailsCompleted`
   - `onboardingCompleted`
   - `welcomeShown`
   - `tourStarted`
   - `tourCompleted`
   - `hasSeenWelcome`
5. Refresh halaman atau navigate ke `/company-onboarding`

## Cara 3: Hard Refresh

1. Tekan Ctrl+Shift+R (Windows/Linux) atau Cmd+Shift+R (Mac)
2. Atau buka Incognito/Private browsing mode
3. Navigate ke `/company-onboarding`

## Hasil

Setelah reset, user akan:
1. Redirect ke halaman company-onboarding
2. Memulai flow onboarding dari awal
3. Mengisi company details modal jika diperlukan
4. Menjalani 4-step onboarding process

## Troubleshooting

Jika masih tidak bisa akses onboarding:
1. Clear semua cookies dan localStorage
2. Refresh browser
3. Login ulang jika diperlukan