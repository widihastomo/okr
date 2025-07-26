import { db } from "./server/db.js";
import { userOnboardingProgress, users } from "./shared/schema.js";
import { eq } from "drizzle-orm";

async function resetUserOnboarding() {
  try {
    const userId = "29d8dc2e-4efb-4a79-a81a-2f91cf9cd4f9"; // Current user ID
    
    console.log("🔄 Resetting onboarding data for user:", userId);
    
    // Reset user tour completion status
    await db.update(users)
      .set({
        tourStarted: false,
        tourStartedAt: null,
        tourCompleted: false,
        tourCompletedAt: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    console.log("✅ User tour data reset successfully");
    
    // Delete user onboarding progress record
    const deletedProgress = await db.delete(userOnboardingProgress)
      .where(eq(userOnboardingProgress.userId, userId));
    
    console.log("✅ User onboarding progress deleted:", deletedProgress);
    
    console.log("🎯 Onboarding data reset completed!");
    console.log("📝 User can now start fresh onboarding process");
    
  } catch (error) {
    console.error("❌ Error resetting onboarding data:", error);
  }
}

// Run the reset
resetUserOnboarding().then(() => {
  console.log("Script completed");
  process.exit(0);
}).catch(error => {
  console.error("Script failed:", error);
  process.exit(1);
});