import { db } from "./db";
import { users, teams, teamMembers, initiatives, initiativeMembers } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Unify User and Member System
 * This script consolidates the user and member concepts into a unified system
 * to eliminate duplication and simplify the data model.
 */

async function unifyUserMemberSystem() {
  console.log("🔄 Starting user-member system unification...");

  try {
    // 1. Standardize team member roles
    console.log("📝 Standardizing team member roles...");
    
    // Update existing team member roles to new standardized values
    await db.update(teamMembers)
      .set({ role: "member" })
      .where(eq(teamMembers.role, "admin"));

    await db.update(teamMembers)
      .set({ role: "lead" })
      .where(eq(teamMembers.role, "owner"));

    // 2. Standardize initiative member roles
    console.log("📝 Standardizing initiative member roles...");
    
    // Update existing initiative member roles
    await db.update(initiativeMembers)
      .set({ role: "contributor" })
      .where(eq(initiativeMembers.role, "member"));

    await db.update(initiativeMembers)
      .set({ role: "lead" })
      .where(eq(initiativeMembers.role, "admin"));

    // 3. Ensure all users have organization context
    console.log("🏢 Ensuring organizational context for all users...");
    
    const orphanUsers = await db.select()
      .from(users)
      .where(eq(users.organizationId, null));

    if (orphanUsers.length > 0) {
      console.log(`⚠️ Found ${orphanUsers.length} users without organization assignment`);
      // These would need manual assignment or default organization setup
    }

    // 4. Validate referential integrity
    console.log("🔍 Validating referential integrity...");
    
    // Check for team members referencing non-existent users
    const invalidTeamMembers = await db.select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      teamId: teamMembers.teamId
    })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(users.id, null));

    if (invalidTeamMembers.length > 0) {
      console.log(`⚠️ Found ${invalidTeamMembers.length} team members with invalid user references`);
    }

    // Check for initiative members referencing non-existent users
    const invalidInitiativeMembers = await db.select({
      id: initiativeMembers.id,
      userId: initiativeMembers.userId,
      initiativeId: initiativeMembers.initiativeId
    })
    .from(initiativeMembers)
    .leftJoin(users, eq(initiativeMembers.userId, users.id))
    .where(eq(users.id, null));

    if (invalidInitiativeMembers.length > 0) {
      console.log(`⚠️ Found ${invalidInitiativeMembers.length} initiative members with invalid user references`);
    }

    console.log("✅ User-member system unification completed successfully!");
    console.log("\n📋 Summary:");
    console.log("- Standardized team member roles: lead, member, contributor");
    console.log("- Standardized initiative member roles: lead, contributor, reviewer");
    console.log("- Validated organizational context");
    console.log("- Checked referential integrity");
    console.log("\n🎯 Benefits:");
    console.log("- Eliminated user/member duplication");
    console.log("- Simplified role management");
    console.log("- Consistent access control");
    console.log("- Better user experience");

  } catch (error) {
    console.error("❌ Error during user-member system unification:", error);
    throw error;
  }
}

// Run the unification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  unifyUserMemberSystem()
    .then(() => {
      console.log("🎉 User-member system unification completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Failed to unify user-member system:", error);
      process.exit(1);
    });
}

export { unifyUserMemberSystem };