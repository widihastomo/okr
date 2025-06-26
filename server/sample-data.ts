import { storage } from "./storage";

export async function createSampleOKRData() {
  try {
    console.log("Creating sample OKR data...");

    // Create a cycle first
    const cycle = await storage.createCycle({
      name: "Q1 2025",
      description: "First quarter goals for 2025",
      type: "quarterly",
      status: "active",
      startDate: "2025-01-01",
      endDate: "2025-03-31"
    });

    // Create an objective
    const objective = await storage.createObjective({
      title: "Increase Revenue by 30%",
      description: "Drive revenue growth through customer acquisition and retention",
      status: "active",
      timeframe: "quarterly",
      owner: "Sales Team",
      ownerType: "team",
      ownerId: 1,
      cycleId: cycle.id
    });

    // Create key results
    const keyResult1 = await storage.createKeyResult({
      title: "Acquire 500 new customers",
      description: "Focus on enterprise and mid-market segments",
      objectiveId: objective.id,
      currentValue: "150",
      targetValue: "500",
      baseValue: "0",
      unit: "customers",
      keyResultType: "increase_to",
      status: "active"
    });

    const keyResult2 = await storage.createKeyResult({
      title: "Increase customer retention to 95%",
      description: "Reduce churn through improved support and engagement",
      objectiveId: objective.id,
      currentValue: "88",
      targetValue: "95",
      baseValue: "85",
      unit: "percentage",
      keyResultType: "increase_to",
      status: "active"
    });

    // Create initiatives for key result 1
    const initiative1 = await storage.createInitiative({
      title: "Launch Enterprise Sales Campaign",
      description: "Targeted outreach to Fortune 500 companies",
      keyResultId: keyResult1.id,
      status: "in_progress",
      priority: "high",
      dueDate: new Date("2025-02-15")
    });

    const initiative2 = await storage.createInitiative({
      title: "Optimize Lead Generation Process",
      description: "Improve conversion rates from marketing qualified leads",
      keyResultId: keyResult1.id,
      status: "not_started",
      priority: "medium",
      dueDate: new Date("2025-02-28")
    });

    // Create initiatives for key result 2
    const initiative3 = await storage.createInitiative({
      title: "Customer Success Program",
      description: "Implement proactive customer success initiatives",
      keyResultId: keyResult2.id,
      status: "in_progress",
      priority: "high",
      dueDate: new Date("2025-03-15")
    });

    console.log("Sample OKR data created successfully!");
    return true;
  } catch (error) {
    console.error("Error creating sample data:", error);
    return false;
  }
}