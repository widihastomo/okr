import { db } from "./db";
import { 
  users, teams, teamMembers, cycles, objectives, keyResults, checkIns, initiatives,
  type InsertUser, type InsertTeam, type InsertTeamMember, type InsertCycle,
  type InsertObjective, type InsertKeyResult, type InsertCheckIn, type InsertInitiative
} from "@shared/schema";

async function populateDatabase() {
  console.log("Populating PostgreSQL database with sample data...");

  try {
    // Create sample users
    const sampleUsers: InsertUser[] = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "admin@example.com",
        password: "$2b$12$rPhsoxHWgBdabXYp36hfA.E4x03qNvol91BAizDZV1YL1VQhe5Zc.", // hashed "password123"
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002", 
        email: "manager@example.com",
        password: "$2b$12$rPhsoxHWgBdabXYp36hfA.E4x03qNvol91BAizDZV1YL1VQhe5Zc.", // hashed "password123"
        firstName: "Manager",
        lastName: "User",
        role: "manager",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        email: "dev@example.com",
        password: "$2b$12$rPhsoxHWgBdabXYp36hfA.E4x03qNvol91BAizDZV1YL1VQhe5Zc.", // hashed "password123"
        firstName: "Developer",
        lastName: "User",
        role: "member",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    await db.insert(users).values(sampleUsers).onConflictDoNothing();
    console.log("✓ Created sample users");

    // Create sample team
    const sampleTeam: InsertTeam = {
      id: "6535cd7c-b351-4061-8a02-ef083b1e8c60",
      name: "Engineering Team",
      description: "Core engineering and development team",
      ownerId: "550e8400-e29b-41d4-a716-446655440001",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(teams).values(sampleTeam).onConflictDoNothing();
    console.log("✓ Created sample team");

    // Create team memberships
    const teamMemberships: InsertTeamMember[] = [
      {
        id: "7535cd7c-b351-4061-8a02-ef083b1e8c70",
        teamId: "6535cd7c-b351-4061-8a02-ef083b1e8c60",
        userId: "550e8400-e29b-41d4-a716-446655440001",
        role: "admin",
        joinedAt: new Date(),
      },
      {
        id: "7535cd7c-b351-4061-8a02-ef083b1e8c71",
        teamId: "6535cd7c-b351-4061-8a02-ef083b1e8c60", 
        userId: "550e8400-e29b-41d4-a716-446655440002",
        role: "member",
        joinedAt: new Date(),
      }
    ];

    await db.insert(teamMembers).values(teamMemberships).onConflictDoNothing();
    console.log("✓ Created team memberships");

    // Create sample cycle
    const sampleCycle: InsertCycle = {
      id: "6535cd7c-b351-4061-8a02-ef083b1e8c61",
      name: "Q1 2025",
      description: "First quarter objectives for 2025",
      type: "quarterly",
      startDate: "2025-01-01",
      endDate: "2025-03-31", 
      status: "active"
    };

    await db.insert(cycles).values(sampleCycle).onConflictDoNothing();
    console.log("✓ Created sample cycle");

    // Create sample objective
    const sampleObjective: InsertObjective = {
      id: "7535cd7c-b351-4061-8a02-ef083b1e8c62",
      title: "Improve System Performance",
      description: "Enhance overall system performance and reliability",
      cycleId: "6535cd7c-b351-4061-8a02-ef083b1e8c61",
      owner: "Admin User",
      ownerType: "user",
      ownerId: "550e8400-e29b-41d4-a716-446655440001",
      status: "in_progress",
      teamId: "6535cd7c-b351-4061-8a02-ef083b1e8c60",
      parentId: null
    };

    // Create multiple objectives with parent-child hierarchy
    const objectives_data = [
      // Parent objective (Company Level)
      {
        id: "7535cd7c-b351-4061-8a02-ef083b1e8c62",
        title: "Improve System Performance",
        description: "Enhance overall system performance and reliability",
        cycleId: "6535cd7c-b351-4061-8a02-ef083b1e8c61",
        owner: "Admin User",
        ownerType: "user",
        ownerId: "550e8400-e29b-41d4-a716-446655440001",
        status: "in_progress",
        teamId: "6535cd7c-b351-4061-8a02-ef083b1e8c60",
        parentId: null
      },
      // Child objective (Department Level)
      {
        id: "7535cd7c-b351-4061-8a02-ef083b1e8c72",
        title: "Optimize Backend Performance",
        description: "Focus on backend API and database optimization",
        cycleId: "6535cd7c-b351-4061-8a02-ef083b1e8c61",
        owner: "Admin User",
        ownerType: "user", 
        ownerId: "550e8400-e29b-41d4-a716-446655440001",
        status: "in_progress",
        teamId: "6535cd7c-b351-4061-8a02-ef083b1e8c60",
        parentId: "7535cd7c-b351-4061-8a02-ef083b1e8c62"
      },
      // Child objective (Department Level)
      {
        id: "7535cd7c-b351-4061-8a02-ef083b1e8c73",
        title: "Improve Frontend Performance",
        description: "Optimize frontend loading times and user experience",
        cycleId: "6535cd7c-b351-4061-8a02-ef083b1e8c61",
        owner: "Jane Smith",
        ownerType: "user",
        ownerId: "550e8400-e29b-41d4-a716-446655440002",
        status: "on_track",
        teamId: "6535cd7c-b351-4061-8a02-ef083b1e8c60",
        parentId: "7535cd7c-b351-4061-8a02-ef083b1e8c62"
      },
      // Another top-level objective
      {
        id: "7535cd7c-b351-4061-8a02-ef083b1e8c74",
        title: "Increase Customer Satisfaction",
        description: "Improve overall customer experience and satisfaction scores",
        cycleId: "6535cd7c-b351-4061-8a02-ef083b1e8c61",
        owner: "Admin User",
        ownerType: "user",
        ownerId: "550e8400-e29b-41d4-a716-446655440001",
        status: "not_started",
        teamId: "6535cd7c-b351-4061-8a02-ef083b1e8c60",
        parentId: null
      },
      // Child of customer satisfaction
      {
        id: "7535cd7c-b351-4061-8a02-ef083b1e8c75",
        title: "Reduce Support Response Time",
        description: "Decrease average customer support response time",
        cycleId: "6535cd7c-b351-4061-8a02-ef083b1e8c61",
        owner: "Jane Smith", 
        ownerType: "user",
        ownerId: "550e8400-e29b-41d4-a716-446655440002",
        status: "in_progress",
        teamId: "6535cd7c-b351-4061-8a02-ef083b1e8c60",
        parentId: "7535cd7c-b351-4061-8a02-ef083b1e8c74"
      }
    ];

    await db.insert(objectives).values(objectives_data).onConflictDoNothing();
    console.log("✓ Created sample objectives with hierarchy");

    // Create sample key result
    const sampleKeyResult: InsertKeyResult = {
      id: "8535cd7c-b351-4061-8a02-ef083b1e8c63",
      title: "Reduce API Response Time",
      description: "Optimize API endpoints for faster response times",
      objectiveId: "7535cd7c-b351-4061-8a02-ef083b1e8c62",
      currentValue: "200.00",
      targetValue: "100.00", 
      baseValue: "200.00",
      unit: "ms",
      keyResultType: "decrease_to",
      status: "in_progress",
      dueDate: new Date("2025-03-15"),
      lastUpdated: new Date(),
      confidence: 75,
      timeProgressPercentage: 25.0
    };

    await db.insert(keyResults).values(sampleKeyResult).onConflictDoNothing();
    console.log("✓ Created sample key result");

    // Create sample check-in
    const sampleCheckIn: InsertCheckIn = {
      id: "9535cd7c-b351-4061-8a02-ef083b1e8c64",
      keyResultId: "8535cd7c-b351-4061-8a02-ef083b1e8c63",
      value: "180.00",
      confidence: 80,
      notes: "Good progress on database query optimization",
      createdBy: "550e8400-e29b-41d4-a716-446655440001",
      createdAt: new Date()
    };

    await db.insert(checkIns).values(sampleCheckIn).onConflictDoNothing();
    console.log("✓ Created sample check-in");

    // Create sample initiative
    const sampleInitiative: InsertInitiative = {
      id: "a535cd7c-b351-4061-8a02-ef083b1e8c65",
      keyResultId: "8535cd7c-b351-4061-8a02-ef083b1e8c63",
      title: "Database Query Optimization",
      description: "Optimize slow database queries and add proper indexing",
      status: "in_progress",
      dueDate: new Date("2025-02-28"),
      assigneeId: "550e8400-e29b-41d4-a716-446655440003",
      createdBy: "550e8400-e29b-41d4-a716-446655440001",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(initiatives).values(sampleInitiative).onConflictDoNothing();
    console.log("✓ Created sample initiative");

    console.log("✅ Database populated successfully with sample data!");

  } catch (error) {
    console.error("❌ Error populating database:", error);
    throw error;
  }
}

// Run if called directly
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