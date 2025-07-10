import { db } from "./db";
import { users, organizations } from "../shared/schema";
import { hashPassword } from "./emailAuth";
import { eq } from "drizzle-orm";

/**
 * Create a test system owner account for development/testing
 * This creates a simple admin account that you can use immediately
 */
async function createTestAdmin() {
  console.log("👤 Creating test system owner account...");

  try {
    // Check if test admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "owner@system.com"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("✅ Test admin already exists:");
      console.log(`   Email: owner@system.com`);
      console.log(`   Password: password`);
      console.log(`   User ID: ${existingAdmin[0].id}`);
      console.log("   Use these credentials to login");
      return;
    }

    // Test admin credentials (simple for development)
    const adminEmail = "owner@system.com";
    const adminPassword = "password";
    const hashedPassword = await hashPassword(adminPassword);

    // Create test organization
    const [testOrg] = await db.insert(organizations).values({
      name: "System Admin Organization",
      slug: "system-admin-org",
      website: "https://system.com",
      industry: "Technology",
      size: "1-10",
    }).returning();

    console.log("✅ Test organization created:", testOrg.id);

    // Create test system owner user
    const [testAdmin] = await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      firstName: "System",
      lastName: "Owner",
      isSystemOwner: true,
      isEmailVerified: true,
      organizationId: testOrg.id,
      role: "system_owner",
      isActive: true,
    }).returning();

    console.log("✅ Test system owner created:", testAdmin.id);

    // Update organization to set owner
    await db.update(organizations)
      .set({ ownerId: testAdmin.id })
      .where(eq(organizations.id, testOrg.id));

    console.log("✅ Organization owner updated");

    // Display credentials
    console.log("\n🎯 TEST SYSTEM OWNER CREDENTIALS:");
    console.log("==========================================");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`User ID: ${testAdmin.id}`);
    console.log(`Organization ID: ${testOrg.id}`);
    console.log("==========================================");
    console.log("✅ You can now login with these credentials!");

  } catch (error) {
    console.error("❌ Error creating test admin:", error);
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
  createTestAdmin()
    .then(() => {
      console.log("🎉 Test admin creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Test admin creation failed:", error);
      process.exit(1);
    });
}

export { createTestAdmin };