import { storage } from './storage';
import { db } from './db';
import { checkIns, keyResults, users, objectives, cycles, organizations } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

async function populateTimelineDummy() {
  try {
    console.log('🚀 Mulai populate timeline dummy data...');
    
    // Get current user's organization
    const currentUser = await db.select().from(users).where(eq(users.email, 'ini.indonesia1@gmail.com')).limit(1);
    if (!currentUser.length) {
      console.log('❌ User tidak ditemukan');
      return;
    }
    
    const user = currentUser[0];
    const organizationId = user.organizationId;
    
    console.log('✅ User ditemukan:', user.firstName || user.email, user.lastName || '');
    console.log('🏢 Organization ID:', organizationId);
    
    // Get existing key results for this organization
    const existingKeyResults = await db.select().from(keyResults)
      .innerJoin(objectives, eq(keyResults.objectiveId, objectives.id))
      .where(eq(objectives.organizationId, organizationId))
      .limit(5);
    
    if (!existingKeyResults.length) {
      console.log('⚠️ Tidak ada key results ditemukan, buat key result dummy terlebih dahulu');
      return;
    }
    
    console.log('✅ Key results ditemukan:', existingKeyResults.length);
    console.log('🔍 Data structure:', JSON.stringify(existingKeyResults[0], null, 2));
    
    // Create sample check-ins for timeline
    const sampleCheckIns = [
      {
        keyResultId: existingKeyResults[0].key_results.id,
        value: '12.00', // Required value field
        notes: 'Progress bagus minggu ini! Berhasil menyelesaikan campaign email marketing pertama dan response rate cukup memuaskan. Tim sangat antusias dengan hasil awal.',
        confidence: 8,
        createdBy: user.id,
        organizationId: organizationId,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        keyResultId: existingKeyResults[1] ? existingKeyResults[1].key_results.id : existingKeyResults[0].key_results.id,
        value: '8.00', // Required value field
        notes: 'Minggu ini fokus pada optimasi conversion rate. Sudah implementasi A/B testing untuk landing page dan hasil awal menunjukkan peningkatan 3%. Masih perlu improvement lebih lanjut.',
        confidence: 6,
        createdBy: user.id,
        organizationId: organizationId,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        keyResultId: existingKeyResults[0].key_results.id,
        value: '25.00', // Required value field
        notes: 'Update harian: Selesai setup automated email sequence dan monitoring dashboard. Tim sales sudah mulai menggunakan lead scoring system. Confident akan mencapai target bulan ini!',
        confidence: 9,
        createdBy: user.id,
        organizationId: organizationId,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        keyResultId: existingKeyResults[1] ? existingKeyResults[1].key_results.id : existingKeyResults[0].key_results.id,
        value: '11.00', // Required value field
        notes: 'Breakthrough! Berhasil identifikasi bottleneck di conversion funnel dan implement quick fix. Conversion rate naik jadi 11%. Tim marketing celebrate! 🎉',
        confidence: 8,
        createdBy: user.id,
        organizationId: organizationId,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        keyResultId: existingKeyResults[0].key_results.id,
        value: '35.00', // Required value field
        notes: 'Weekly review: Customer acquisition momentum sangat baik. Sudah onboard 35 pelanggan baru minggu ini. Strategy content marketing dan referral program mulai menunjukkan hasil.',
        confidence: 7,
        createdBy: user.id,
        organizationId: organizationId,
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      }
    ];
    
    // Insert check-ins
    console.log('📝 Membuat check-ins dummy...');
    const createdCheckIns = [];
    
    for (const checkInData of sampleCheckIns) {
      try {
        const checkIn = await storage.createCheckIn(checkInData);
        createdCheckIns.push(checkIn);
        console.log(`✅ Check-in created: ${checkIn.id}`);
      } catch (error) {
        console.error('❌ Error creating check-in:', error);
      }
    }
    
    console.log(`🎉 Timeline dummy data berhasil dibuat!`);
    console.log(`📊 Total check-ins: ${createdCheckIns.length}`);
    console.log('🔗 Silakan buka halaman Timeline untuk melihat hasilnya');
    
  } catch (error) {
    console.error('❌ Error populate timeline dummy:', error);
  }
}

// Run the script
populateTimelineDummy().then(() => {
  console.log('✅ Populate timeline dummy selesai');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});