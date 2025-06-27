import { db } from "./db";
import { users, teams, cycles, objectives, keyResults, templates, teamMembers } from "@shared/schema";
import bcrypt from "bcryptjs";

// Predefined UUIDs for consistent data
const userIds = {
  admin: "550e8400-e29b-41d4-a716-446655440001",
  manager: "550e8400-e29b-41d4-a716-446655440002", 
  john: "550e8400-e29b-41d4-a716-446655440003"
};

const teamIds = {
  marketing: "660e8400-e29b-41d4-a716-446655440001",
  engineering: "660e8400-e29b-41d4-a716-446655440002"
};

const cycleIds = {
  current: "770e8400-e29b-41d4-a716-446655440001"
};

async function populateUUIDData() {
  try {
    console.log("🔧 Populating database with UUID data...");

    // Create users
    const hashedPassword = await bcrypt.hash("123456", 10);

    await db.insert(users).values([
      {
        id: userIds.admin,
        email: "admin@example.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin"
      },
      {
        id: userIds.manager,
        email: "manager@example.com", 
        password: hashedPassword,
        firstName: "Manager",
        lastName: "User",
        role: "manager"
      },
      {
        id: userIds.john,
        email: "john@example.com",
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
        role: "member"
      }
    ]);

    // Create teams
    await db.insert(teams).values([
      {
        id: teamIds.marketing,
        name: "Marketing Team",
        description: "Tim Marketing untuk promosi dan branding",
        ownerId: userIds.admin
      },
      {
        id: teamIds.engineering,
        name: "Engineering Team", 
        description: "Tim Engineering untuk pengembangan produk",
        ownerId: userIds.manager
      }
    ]);

    // Create team members
    await db.insert(teamMembers).values([
      {
        teamId: teamIds.marketing,
        userId: userIds.admin,
        role: "admin"
      },
      {
        teamId: teamIds.marketing,
        userId: userIds.john,
        role: "member"
      },
      {
        teamId: teamIds.engineering,
        userId: userIds.manager,
        role: "admin"
      }
    ]);

    // Create cycles
    await db.insert(cycles).values([
      {
        id: cycleIds.current,
        name: "Q1 2025",
        type: "quarterly",
        startDate: "2025-01-01",
        endDate: "2025-03-31",
        status: "active",
        description: "First quarter goals for 2025"
      }
    ]);

    // Create templates
    await db.insert(templates).values([
      {
        name: "Marketing OKR Template",
        description: "Template untuk OKR tim marketing",
        type: "quarterly",
        objectives: JSON.stringify([
          {
            title: "Increase Brand Awareness",
            description: "Meningkatkan awareness brand di target market",
            keyResults: [
              {
                title: "Website Traffic Growth",
                description: "Increase website traffic by 50%",
                targetValue: "10000",
                unit: "number",
                keyResultType: "increase_to"
              }
            ]
          }
        ])
      }
    ]);

    console.log("✅ Database populated successfully with UUID data!");
    
  } catch (error) {
    console.error("❌ Error populating database:", error);
    throw error;
  }
}

// Run the function
populateUUIDData().then(() => {
  console.log("Data population completed");
  process.exit(0);
}).catch((error) => {
  console.error("Failed to populate data:", error);
  process.exit(1);
});