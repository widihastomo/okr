// Script to reset corrupted onboarding completedSteps data
import { db } from './server/db.js';
import { organizations } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function resetOnboardingSteps() {
  try {
    console.log('🔄 Starting onboarding steps reset...');
    
    // Find all organizations with onboarding data
    const allOrgs = await db.select().from(organizations);
    
    console.log(`📊 Found ${allOrgs.length} organizations`);
    
    for (const org of allOrgs) {
      const data = org.onboardingData;
      
      if (data && data.completedSteps && Array.isArray(data.completedSteps)) {
        const currentStep = data.currentStep || 0;
        
        // Create proper completedSteps array based on currentStep
        const properCompletedSteps = currentStep > 0 
          ? Array.from({length: currentStep}, (_, i) => i + 1)
          : [];
        
        // Update the data with proper completedSteps
        const updatedData = {
          ...data,
          completedSteps: properCompletedSteps
        };
        
        // Update in database
        await db
          .update(organizations)
          .set({ onboardingData: updatedData })
          .where(eq(organizations.id, org.id));
        
        console.log(`✅ Fixed onboarding for org ${org.id}:`);
        console.log(`   - currentStep: ${currentStep}`);
        console.log(`   - old completedSteps: [${data.completedSteps.join(', ')}] (${data.completedSteps.length} items)`);
        console.log(`   - new completedSteps: [${properCompletedSteps.join(', ')}] (${properCompletedSteps.length} items)`);
      }
    }
    
    console.log('🎉 Onboarding steps reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Error resetting onboarding steps:', error);
  }
}

// Run if this is the main module
resetOnboardingSteps().then(() => process.exit(0));