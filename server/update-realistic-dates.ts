import { db } from "./db";
import { cycles, keyResults } from "@shared/schema";
import { eq } from "drizzle-orm";

async function updateRealisticDates() {
  try {
    console.log("Updating dates to realistic values for testing...");
    
    // Update cycle to current period (July-September 2025)
    const [cycle] = await db.select().from(cycles);
    if (cycle) {
      await db
        .update(cycles)
        .set({
          name: "Q3 2025",
          startDate: "2025-07-01",
          endDate: "2025-09-30"
        })
        .where(eq(cycles.id, cycle.id));
      
      console.log("✅ Updated cycle to Q3 2025 (July-September)");
    }
    
    // Update key result due dates to various points in the current cycle
    const allKeyResults = await db.select().from(keyResults);
    const dueDates = [
      new Date("2025-07-15"), // Mid-July
      new Date("2025-08-15"), // Mid-August  
      new Date("2025-08-30"), // End of August
      new Date("2025-09-15"), // Mid-September
      new Date("2025-09-30")  // End of cycle
    ];
    
    for (let i = 0; i < allKeyResults.length; i++) {
      const kr = allKeyResults[i];
      const dueDate = dueDates[i % dueDates.length];
      
      await db
        .update(keyResults)
        .set({ dueDate })
        .where(eq(keyResults.id, kr.id));
      
      console.log(`✅ Updated ${kr.title} due date to ${dueDate.toDateString()}`);
    }
    
    console.log("✅ All dates updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating dates:", error);
    return false;
  }
}

updateRealisticDates().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});