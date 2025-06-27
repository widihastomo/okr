import { db } from "./db";
import { keyResults, objectives, cycles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { calculateProgressStatus } from "./progress-tracker";

async function debugStatus() {
  try {
    console.log("=== Debug Status Calculation ===");
    
    // Get all key results
    const allKeyResults = await db.select().from(keyResults);
    console.log(`Found ${allKeyResults.length} key results`);
    
    for (const kr of allKeyResults) {
      console.log(`\n--- Key Result: ${kr.title} ---`);
      console.log(`ID: ${kr.id}`);
      console.log(`Current: ${kr.currentValue}, Target: ${kr.targetValue}, Base: ${kr.baseValue}`);
      console.log(`Type: ${kr.keyResultType}, Current Status: ${kr.status}`);
      console.log(`Due Date: ${kr.dueDate}`);
      console.log(`Objective ID: ${kr.objectiveId}`);
      
      // Get objective
      const [objective] = await db.select().from(objectives).where(eq(objectives.id, kr.objectiveId));
      if (!objective) {
        console.log("❌ No objective found");
        continue;
      }
      
      console.log(`Objective: ${objective.title}, Cycle ID: ${objective.cycleId}`);
      
      if (!objective.cycleId) {
        console.log("❌ No cycle ID in objective");
        continue;
      }
      
      // Get cycle
      const [cycle] = await db.select().from(cycles).where(eq(cycles.id, objective.cycleId));
      if (!cycle) {
        console.log("❌ No cycle found");
        continue;
      }
      
      console.log(`Cycle: ${cycle.name}, Start: ${cycle.startDate}, End: ${cycle.endDate}`);
      
      if (!kr.dueDate) {
        console.log("❌ No due date on key result");
        continue;
      }
      
      // Calculate status
      const startDate = new Date(cycle.startDate);
      const endDate = kr.dueDate;
      const now = new Date();
      
      console.log(`Start: ${startDate.toISOString()}`);
      console.log(`End: ${endDate.toISOString()}`);
      console.log(`Now: ${now.toISOString()}`);
      
      const progressStatus = calculateProgressStatus(kr, startDate, endDate);
      
      console.log(`✅ Calculated Status: ${progressStatus.status}`);
      console.log(`Progress: ${progressStatus.progressPercentage}%`);
      console.log(`Time Progress: ${progressStatus.timeProgressPercentage}%`);
      console.log(`Recommendation: ${progressStatus.recommendation}`);
      
      // Update the status
      if (progressStatus.status !== kr.status) {
        await db
          .update(keyResults)
          .set({ status: progressStatus.status })
          .where(eq(keyResults.id, kr.id));
        console.log(`✅ Updated status from ${kr.status} to ${progressStatus.status}`);
      } else {
        console.log(`✓ Status unchanged: ${kr.status}`);
      }
    }
    
    console.log("\n=== Debug Complete ===");
    return true;
  } catch (error) {
    console.error("Debug error:", error);
    return false;
  }
}

debugStatus().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});