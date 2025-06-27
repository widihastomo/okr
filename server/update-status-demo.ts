import { db } from "./db";
import { keyResults, objectives, cycles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { calculateProgressStatus } from "./progress-tracker";

async function updateStatusDemo() {
  try {
    console.log("=== Updating Status with Time Progress Demo ===");
    
    // Get all key results
    const allKeyResults = await db.select().from(keyResults);
    console.log(`Found ${allKeyResults.length} key results to update`);
    
    let updatedCount = 0;
    
    for (const kr of allKeyResults) {
      console.log(`\n--- Processing: ${kr.title} ---`);
      
      // Get objective to find cycle
      const [objective] = await db.select().from(objectives).where(eq(objectives.id, kr.objectiveId));
      if (!objective || !objective.cycleId) {
        console.log("❌ No objective or cycle found, skipping");
        continue;
      }
      
      // Get cycle for date calculation
      const [cycle] = await db.select().from(cycles).where(eq(cycles.id, objective.cycleId));
      if (!cycle || !kr.dueDate) {
        console.log("❌ No cycle or due date found, skipping");
        continue;
      }
      
      console.log(`Cycle: ${cycle.name} (${cycle.startDate} to ${cycle.endDate})`);
      console.log(`Key Result Due: ${kr.dueDate.toISOString().split('T')[0]}`);
      
      // Calculate status with time progress
      const startDate = new Date(cycle.startDate);
      const endDate = kr.dueDate;
      const progressStatus = calculateProgressStatus(kr, startDate, endDate);
      
      console.log(`Current Status: ${kr.status} -> New Status: ${progressStatus.status}`);
      console.log(`Progress: ${progressStatus.progressPercentage}%, Time Progress: ${progressStatus.timeProgressPercentage}%`);
      console.log(`Recommendation: ${progressStatus.recommendation}`);
      
      // Update key result with status and time progress
      await db
        .update(keyResults)
        .set({
          status: progressStatus.status,
          timeProgressPercentage: progressStatus.timeProgressPercentage
        })
        .where(eq(keyResults.id, kr.id));
      
      updatedCount++;
      console.log("✅ Updated successfully");
    }
    
    console.log(`\n=== Demo Complete: Updated ${updatedCount} key results ===`);
    return true;
  } catch (error) {
    console.error("Demo error:", error);
    return false;
  }
}

updateStatusDemo().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});