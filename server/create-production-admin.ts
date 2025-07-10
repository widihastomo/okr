import { db } from "./db";
import { users, organizations } from "../shared/schema";
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
      website: "https://refokus.com",
      industry: "Technology",
      size: "1-10",
    }).returning();

    console.log("✅ System organization created:", systemOrg.id);

    // Create system owner user
    const [systemOwner] = await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      isSystemOwner: true,
      isEmailVerified: true,
      organizationId: systemOrg.id,
      role: "system_owner",
      isActive: true,
    }).returning();

    console.log("✅ System owner created:", systemOwner.id);

    // Update organization to set owner
    await db.update(organizations)
      .set({ ownerId: systemOwner.id })
      .where(eq(organizations.id, systemOrg.id));

    console.log("✅ Organization owner updated");

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
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if this script is being run directly
if (process.argv[1] === __filename || process.argv[1] === fileURLToPath(import.meta.url)) {
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