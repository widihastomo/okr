import { db } from "./db";
import { objectives, cycles } from "@shared/schema";
import { eq } from "drizzle-orm";

async function fixObjectiveCycle() {
  try {
    console.log("Fixing objective cycle assignment...");
    
    // Get the cycle and objective
    const [cycle] = await db.select().from(cycles);
    const [objective] = await db.select().from(objectives);
    
    if (!cycle || !objective) {
      console.log("Missing cycle or objective");
      return false;
    }
    
    console.log(`Cycle: ${cycle.name} (${cycle.id})`);
    console.log(`Objective: ${objective.title} (${objective.id})`);
    console.log(`Current objective cycle ID: ${objective.cycleId}`);
    
    // Update objective to link to cycle
    await db
      .update(objectives)
      .set({ cycleId: cycle.id })
      .where(eq(objectives.id, objective.id));
    
    console.log(`✅ Updated objective to use cycle ID: ${cycle.id}`);
    
    return true;
  } catch (error) {
    console.error("Error fixing objective cycle:", error);
    return false;
  }
}

fixObjectiveCycle().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});