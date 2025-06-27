import { db } from "./db";
import { keyResults, objectives } from "@shared/schema";
import { eq } from "drizzle-orm";

async function updateStatusDemo() {
  try {
    console.log("Creating additional sample data with different status values...");
    
    // Get existing objective
    const existingObjectives = await db.select().from(objectives);
    if (existingObjectives.length === 0) {
      console.log("No objectives found, cannot create sample data");
      return false;
    }
    
    const objectiveId = existingObjectives[0].id;
    console.log(`Using objective: ${existingObjectives[0].title}`);
    
    // Create multiple key results with different statuses and progress levels
    const sampleKeyResults = [
      {
        id: "550e8400-e29b-41d4-a716-446655440101",
        title: "Increase Monthly Revenue",
        description: "Grow monthly recurring revenue to target level",
        currentValue: "100000",
        targetValue: "100000", 
        baseValue: "80000",
        unit: "currency",
        keyResultType: "increase_to",
        status: "completed",
        objectiveId: objectiveId,
        assignedUserId: "550e8400-e29b-41d4-a716-446655440001",
        dueDate: new Date("2025-03-15")
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440102",
        title: "Reduce Customer Churn Rate",
        description: "Lower monthly churn rate to improve retention",
        currentValue: "3.5",
        targetValue: "2.0",
        baseValue: "5.0", 
        unit: "percentage",
        keyResultType: "decrease_to",
        status: "on_track",
        objectiveId: objectiveId,
        assignedUserId: "550e8400-e29b-41d4-a716-446655440001",
        dueDate: new Date("2025-03-15")
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440103",
        title: "Launch New Product Feature",
        description: "Successfully launch the new analytics dashboard",
        currentValue: "0",
        targetValue: "1",
        unit: "number",
        keyResultType: "achieve_or_not",
        status: "at_risk",
        objectiveId: objectiveId,
        assignedUserId: "550e8400-e29b-41d4-a716-446655440001", 
        dueDate: new Date("2025-03-15")
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440104",
        title: "Acquire New Customers",
        description: "Onboard new enterprise customers this quarter",
        currentValue: "15",
        targetValue: "50",
        baseValue: "10",
        unit: "number", 
        keyResultType: "increase_to",
        status: "behind",
        objectiveId: objectiveId,
        assignedUserId: "550e8400-e29b-41d4-a716-446655440001",
        dueDate: new Date("2025-03-15")
      }
    ];
    
    // Insert sample key results
    for (const kr of sampleKeyResults) {
      try {
        await db.insert(keyResults).values(kr).onConflictDoUpdate({
          target: keyResults.id,
          set: {
            title: kr.title,
            description: kr.description,
            currentValue: kr.currentValue,
            targetValue: kr.targetValue,
            baseValue: kr.baseValue,
            unit: kr.unit,
            keyResultType: kr.keyResultType,
            status: kr.status
          }
        });
        console.log(`Created/updated key result: ${kr.title} (${kr.status})`);
      } catch (error) {
        console.error(`Error creating key result ${kr.title}:`, error);
      }
    }
    
    console.log("Sample data creation completed!");
    return true;
  } catch (error) {
    console.error("Error updating status demo:", error);
    return false;
  }
}

updateStatusDemo().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});