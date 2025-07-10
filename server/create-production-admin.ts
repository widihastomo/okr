import { db } from "./db";
import { users, organizations, organizationMembers } from "../shared/schema";
import { hashPassword } from "./emailAuth";
import { eq } from "drizzle-orm";

/**
 * Create system owner account for production environment
 * This script creates a secure system administrator account with:
 * - Strong password hashing
 * - System owner privileges
 * - Proper organization setup
 * - Environment-specific configuration
 */
async function createProductionAdmin() {
  console.log("🔐 Creating production system owner account...");

  try {
    // Check if system owner already exists
    const existingSystemOwner = await db
      .select()
      .from(users)
      .where(eq(users.isSystemOwner, true))
      .limit(1);

    if (existingSystemOwner.length > 0) {
      console.log("⚠️ System owner already exists:");
      console.log(`   Email: ${existingSystemOwner[0].email}`);
      console.log(`   ID: ${existingSystemOwner[0].id}`);
      console.log("   Use existing credentials or delete existing account first");
      return;
    }

    // Production admin credentials
    const adminEmail = "admin@refokus.com";
    const adminPassword = "RefokusAdmin2025!"; // Strong default password
    const adminFirstName = "System";
    const adminLastName = "Administrator";

    // Hash password securely
    const hashedPassword = await hashPassword(adminPassword);

    // Create system organization first
    const [systemOrg] = await db.insert(organizations).values({
      name: "Refokus System",
      slug: "refokus-system",
      description: "System administration organization",
      industry: "Technology",
      size: "1-10",
      website: "https://refokus.com",
      isSystemOrganization: true,
    }).returning();

    console.log("✅ System organization created:", systemOrg.id);

    // Create system owner user
    const [systemOwner] = await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      isSystemOwner: true,
      emailVerified: true,
      organizationId: systemOrg.id,
      role: "system_owner",
      isActive: true,
    }).returning();

    console.log("✅ System owner created:", systemOwner.id);

    // Add system owner to organization as admin
    await db.insert(organizationMembers).values({
      userId: systemOwner.id,
      organizationId: systemOrg.id,
      role: "admin",
      invitedBy: systemOwner.id,
      joinedAt: new Date(),
    });

    console.log("✅ System owner added to organization");

    // Log production credentials
    console.log("\n🎯 PRODUCTION SYSTEM OWNER CREDENTIALS:");
    console.log("==========================================");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`User ID: ${systemOwner.id}`);
    console.log(`Organization ID: ${systemOrg.id}`);
    console.log("==========================================");
    console.log("⚠️  SECURITY REMINDER:");
    console.log("   1. Change the default password immediately after first login");
    console.log("   2. Enable two-factor authentication if available");
    console.log("   3. Keep these credentials secure and private");
    console.log("   4. Consider using environment variables for sensitive data");
    console.log("==========================================\n");

    console.log("✅ Production system owner setup completed successfully!");

  } catch (error) {
    console.error("❌ Error creating production admin:", error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  createProductionAdmin()
    .then(() => {
      console.log("🎉 Production admin creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Production admin creation failed:", error);
      process.exit(1);
    });
}

export { createProductionAdmin };