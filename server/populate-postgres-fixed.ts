import { db } from "./db";
import { 
  users, teams, teamMembers, cycles, objectives, keyResults, checkIns, initiatives,
  type InsertUser, type InsertTeam, type InsertTeamMember, type InsertCycle,
  type InsertObjective, type InsertKeyResult, type InsertCheckIn, type InsertInitiative
} from "@shared/schema";

async function populateDatabase() {
  console.log("Populating PostgreSQL database with sample data...");

  try {
    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already populated, skipping initialization");
      return;
    }

    // Create sample users - IDs are auto-generated
    const sampleUsers: InsertUser[] = [
      {
        email: "admin@example.com",
        password: "$2b$12$rPhsoxHWgBdabXYp36hfA.E4x03qNvol91BAizDZV1YL1VQhe5Zc.", // hashed "password123"
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isActive: true,
      },
      {
        email: "manager@example.com",
        password: "$2b$12$rPhsoxHWgBdabXYp36hfA.E4x03qNvol91BAizDZV1YL1VQhe5Zc.", // hashed "password123"
        firstName: "Manager",
        lastName: "User",
        role: "manager",
        isActive: true,
      },
      {
        email: "dev@example.com",
        password: "$2b$12$rPhsoxHWgBdabXYp36hfA.E4x03qNvol91BAizDZV1YL1VQhe5Zc.", // hashed "password123"
        firstName: "Developer",
        lastName: "User",
        role: "member",
        isActive: true,
      }
    ];

    const insertedUsers = await db.insert(users).values(sampleUsers).returning();
    console.log("✓ Created sample users");

    // Create sample team
    const sampleTeam: InsertTeam = {
      name: "Engineering Team",
      description: "Core development team",
      ownerId: insertedUsers[0].id, // Admin user as owner
    };

    const insertedTeams = await db.insert(teams).values(sampleTeam).returning();
    console.log("✓ Created sample team");

    // Create team memberships
    const teamMemberships: InsertTeamMember[] = [
      {
        teamId: insertedTeams[0].id,
        userId: insertedUsers[1].id, // Manager
        role: "admin",
      },
      {
        teamId: insertedTeams[0].id,
        userId: insertedUsers[2].id, // Developer
        role: "member",
      }
    ];

    await db.insert(teamMembers).values(teamMemberships);
    console.log("✓ Created team memberships");

    // Create sample cycle
    const sampleCycle: InsertCycle = {
      name: "Q1 2025",
      type: "quarterly",
      startDate: "2025-01-01",
      endDate: "2025-03-31",
      status: "active",
      description: "First quarter objectives for 2025",
    };

    const insertedCycles = await db.insert(cycles).values(sampleCycle).returning();
    console.log("✓ Created sample cycle");

    // Create sample objectives
    const sampleObjectives: InsertObjective[] = [
      {
        cycleId: insertedCycles[0].id,
        title: "Improve System Performance",
        description: "Optimize application performance and reduce response times",
        owner: "Engineering Team",
        ownerType: "team",
        ownerId: insertedTeams[0].id,
        teamId: insertedTeams[0].id,
        status: "on_track",
      },
      {
        cycleId: insertedCycles[0].id,
        title: "Enhance User Experience",
        description: "Improve user interface and user experience across the platform",
        owner: "Product Team",
        ownerType: "user",
        ownerId: insertedUsers[1].id,
        status: "not_started",
      }
    ];

    const insertedObjectives = await db.insert(objectives).values(sampleObjectives).returning();
    console.log("✓ Created sample objectives");

    // Create sample key results
    const sampleKeyResults: InsertKeyResult[] = [
      {
        objectiveId: insertedObjectives[0].id,
        title: "Reduce API Response Time",
        description: "Optimize database queries and API endpoints",
        currentValue: "250.00",
        targetValue: "100.00",
        baseValue: "500.00",
        unit: "number",
        keyResultType: "decrease_to",
        status: "on_track",
        dueDate: new Date("2025-03-15"),
        confidence: 75,
        timeProgressPercentage: 25
      },
      {
        objectiveId: insertedObjectives[1].id,
        title: "Increase User Satisfaction Score",
        description: "Improve overall user experience rating",
        currentValue: "4.2",
        targetValue: "4.8",
        baseValue: "4.0",
        unit: "number",
        keyResultType: "increase_to",
        status: "not_started",
        dueDate: new Date("2025-03-31"),
        confidence: 60,
        timeProgressPercentage: 0
      }
    ];

    const insertedKeyResults = await db.insert(keyResults).values(sampleKeyResults).returning();
    console.log("✓ Created sample key results");

    // Create sample check-in
    const sampleCheckIn: InsertCheckIn = {
      keyResultId: insertedKeyResults[0].id,
      value: "350.00",
      confidence: 80,
      notes: "Good progress on database query optimization",
      createdBy: insertedUsers[2].id, // Developer user
    };

    await db.insert(checkIns).values(sampleCheckIn);
    console.log("✓ Created sample check-in");

    // Create sample initiative
    const sampleInitiative: InsertInitiative = {
      keyResultId: insertedKeyResults[0].id,
      title: "Database Query Optimization",
      description: "Optimize slow database queries and add proper indexing",
      status: "in_progress",
      dueDate: new Date("2025-02-28"),
      createdBy: insertedUsers[0].id, // Admin user
    };

    await db.insert(initiatives).values(sampleInitiative);
    console.log("✓ Created sample initiative");

    console.log("✅ Database populated successfully with sample data!");

  } catch (error) {
    console.error("❌ Error populating database:", error);
    throw error;
  }
}

// Run if called directly (not when imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  populateDatabase()
    .then(() => {
      console.log("Population complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Population failed:", error);
      process.exit(1);
    });
}

export { populateDatabase };