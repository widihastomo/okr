// Script to create sample referral codes for testing
import { db } from './server/db.js';
import { referralCodes, users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function createSampleReferralCodes() {
  try {
    console.log('🔍 Creating sample referral codes...');

    // Find system owner (admin) user
    const adminUser = await db.select()
      .from(users)
      .where(eq(users.email, 'admin@refokus.com'))
      .limit(1);

    if (!adminUser.length) {
      console.error('❌ Admin user not found');
      return;
    }

    const admin = adminUser[0];
    console.log('✅ Found admin user:', admin.email);

    // Sample referral codes
    const sampleCodes = [
      {
        code: 'WELCOME2025',
        discountType: 'percentage',
        discountValue: '25.00',
        maxUses: 50,
        description: 'Diskon 25% untuk pengguna baru tahun 2025',
        createdBy: admin.id,
        isActive: true,
        expiresAt: new Date('2025-12-31'),
      },
      {
        code: 'STARTUP100',
        discountType: 'fixed_amount',
        discountValue: '100000.00',
        maxUses: 20,
        description: 'Potongan Rp 100.000 untuk startup',
        createdBy: admin.id,
        isActive: true,
        expiresAt: new Date('2025-06-30'),
      },
      {
        code: 'FREEMONTH',
        discountType: 'free_months',
        discountValue: '1.00',
        maxUses: 30,
        description: 'Gratis 1 bulan langganan',
        createdBy: admin.id,
        isActive: true,
        expiresAt: new Date('2025-12-31'),
      },
      {
        code: 'TESTCODE',
        discountType: 'percentage',
        discountValue: '15.00',
        maxUses: null, // unlimited
        description: 'Kode test untuk development',
        createdBy: admin.id,
        isActive: true,
        expiresAt: null, // no expiration
      },
      {
        code: 'REFOKUS50',
        discountType: 'percentage',
        discountValue: '50.00',
        maxUses: 10,
        description: 'Special discount 50% - limited edition',
        createdBy: admin.id,
        isActive: true,
        expiresAt: new Date('2025-03-31'),
      }
    ];

    // Insert sample codes
    for (const codeData of sampleCodes) {
      try {
        // Check if code already exists
        const existing = await db.select()
          .from(referralCodes)
          .where(eq(referralCodes.code, codeData.code))
          .limit(1);

        if (existing.length > 0) {
          console.log(`⚠️  Code ${codeData.code} already exists, skipping`);
          continue;
        }

        // Insert new code
        await db.insert(referralCodes).values(codeData);
        console.log(`✅ Created referral code: ${codeData.code} (${codeData.discountType}: ${codeData.discountValue})`);
      } catch (error) {
        console.error(`❌ Failed to create code ${codeData.code}:`, error.message);
      }
    }

    console.log('\n🎉 Sample referral codes creation completed!');
    console.log('\n📋 Available test codes:');
    console.log('• WELCOME2025 - 25% discount (expires Dec 31, 2025)');
    console.log('• STARTUP100 - Rp 100,000 fixed discount (expires Jun 30, 2025)');
    console.log('• FREEMONTH - 1 free month (expires Dec 31, 2025)');
    console.log('• TESTCODE - 15% discount (unlimited, no expiry)');
    console.log('• REFOKUS50 - 50% discount (limited 10 uses, expires Mar 31, 2025)');
    
  } catch (error) {
    console.error('❌ Error creating sample referral codes:', error);
  }
}

// Run the script
createSampleReferralCodes()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });