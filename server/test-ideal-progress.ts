import { db } from "./db";
import { keyResults, objectives, cycles } from "@shared/schema";
import { eq } from "drizzle-orm";

// Test the ideal progress calculation
function calculateIdealProgress(startDate: string, dueDate: string): number {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(dueDate);
  
  if (now <= start) return 0;
  if (now >= end) return 100;
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  return Math.round((elapsed / totalDuration) * 100);
}

async function testIdealProgress() {
  console.log("=== Testing Ideal Progress Calculation ===");
  console.log(`Current Date: ${new Date().toISOString().split('T')[0]}`);
  
  // Test cases with different scenarios
  const testCases = [
    {
      name: "Q3 2025 Cycle (Not Started)",
      startDate: "2025-07-01",
      dueDate: "2025-09-30",
      expected: 0 // Since we're before July 1st
    },
    {
      name: "Already Started (Mid-way)",
      startDate: "2025-06-01", 
      dueDate: "2025-08-01",
      expected: "calculated"
    },
    {
      name: "Short Term (2 weeks)",
      startDate: "2025-06-20",
      dueDate: "2025-07-05",
      expected: "calculated"
    }
  ];
  
  console.log("\n--- Test Results ---");
  testCases.forEach(test => {
    const result = calculateIdealProgress(test.startDate, test.dueDate);
    console.log(`${test.name}:`);
    console.log(`  Start: ${test.startDate}, Due: ${test.dueDate}`);
    console.log(`  Ideal Progress: ${result}%`);
    console.log(`  Expected: ${test.expected === "calculated" ? "varies" : test.expected + "%"}`);
    console.log("");
  });
  
  // Check actual key results in database
  console.log("--- Actual Key Results ---");
  const keyResultsList = await db.select().from(keyResults);
  
  for (const kr of keyResultsList) {
    if (!kr.dueDate) continue;
    
    const [objective] = await db.select().from(objectives).where(eq(objectives.id, kr.objectiveId));
    if (!objective?.cycleId) continue;
    
    const [cycle] = await db.select().from(cycles).where(eq(cycles.id, objective.cycleId));
    if (!cycle) continue;
    
    const idealProgress = calculateIdealProgress(cycle.startDate, kr.dueDate.toISOString().split('T')[0]);
    
    console.log(`${kr.title}:`);
    console.log(`  Cycle: ${cycle.startDate} to ${cycle.endDate}`);
    console.log(`  Due Date: ${kr.dueDate.toISOString().split('T')[0]}`);
    console.log(`  Ideal Progress: ${idealProgress}%`);
    console.log(`  Stored Time Progress: ${kr.timeProgressPercentage}%`);
    console.log("");
  }
}

testIdealProgress().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});