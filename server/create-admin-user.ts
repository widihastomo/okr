import { storage } from "./storage";
import { hashPassword } from "./emailAuth";

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingUser = await storage.getUserByEmail("admin@example.com");
    if (existingUser) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const hashedPassword = await hashPassword("123456");
    const adminUser = await storage.createUser({
      email: "admin@example.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isActive: true,
    });

    console.log("Admin user created successfully:", {
      id: adminUser.id,
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      role: adminUser.role
    });

    // Create a regular user for testing
    const regularPassword = await hashPassword("123456");
    const regularUser = await storage.createUser({
      email: "user@example.com",
      password: regularPassword,
      firstName: "Regular",
      lastName: "User",
      role: "member",
      isActive: true,
    });

    console.log("Regular user created successfully:", {
      id: regularUser.id,
      email: regularUser.email,
      firstName: regularUser.firstName,
      lastName: regularUser.lastName,
      role: regularUser.role
    });

  } catch (error) {
    console.error("Error creating users:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminUser();
}

export { createAdminUser };