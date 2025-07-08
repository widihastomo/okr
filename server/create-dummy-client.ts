import { db } from "./db";
import { 
  organizations, 
  organizationSubscriptions, 
  organizationAddOnSubscriptions, 
  users, 
  teamMembers 
} from "@shared/schema";
import { hashPassword } from "./emailAuth";
import { eq } from "drizzle-orm";

async function createDummyClient() {
  try {
    console.log("🏢 Creating dummy client organizations with subscriptions + add-ons...");

    // Check if users already exist, delete them if they do
    await db.delete(users).where(eq(users.id, "99999999-aaaa-bbbb-cccc-dddddddddddd"));
    await db.delete(users).where(eq(users.id, "88888888-aaaa-bbbb-cccc-dddddddddddd"));
    
    console.log("🧹 Cleaned up existing dummy users...");

    // 1. Create Owner User for CV Digital Kreatif FIRST (to satisfy foreign key)
    const hashedPassword = await hashPassword("password123");
    const [user1] = await db.insert(users).values({
      id: "99999999-aaaa-bbbb-cccc-dddddddddddd",
      email: "owner@digitalkreatif.com",
      username: "Sarah Wijaya",
      password: hashedPassword, // Use password field instead of passwordHash
      role: "member",
      organizationId: null, // Will be updated after org creation
      firstName: "Sarah",
      lastName: "Wijaya",
      profileImageUrl: null,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date()
    }).returning();

    // 2. Create Organization: CV Digital Kreatif (Tim Startup)
    const [org1] = await db.insert(organizations).values({
      id: "99999999-dddd-cccc-bbbb-aaaaaaaaaaaa",
      name: "CV Digital Kreatif",
      slug: "cv-digital-kreatif",
      description: "Startup digital marketing dan web development dengan tim 8 orang",
      ownerId: "99999999-aaaa-bbbb-cccc-dddddddddddd",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date()
    }).returning();

    // 3. Update user's organizationId now that org exists
    await db.update(users)
      .set({ organizationId: org1.id })
      .where(eq(users.id, user1.id));

    // 4. Create additional team members
    const teamMembers = [
      { name: "Andi Pratama", email: "andi@digitalkreatif.com", role: "developer" },
      { name: "Maya Sari", email: "maya@digitalkreatif.com", role: "designer" },
      { name: "Budi Santoso", email: "budi@digitalkreatif.com", role: "marketing" }
    ];

    for (let i = 0; i < teamMembers.length; i++) {
      const member = teamMembers[i];
      await db.insert(users).values({
        id: `99999999-bbbb-cccc-dddd-${String(i).padStart(12, '0')}`,
        email: member.email,
        username: member.name,
        password: hashedPassword, // Use password field instead of passwordHash
        role: "member",
        organizationId: org1.id,
        firstName: member.name.split(' ')[0],
        lastName: member.name.split(' ')[1] || '',
        profileImageUrl: null,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date()
      });
    }

    // 5. Subscribe to Growth Plan (Rp 299,000/month)
    await db.insert(organizationSubscriptions).values({
      id: "99999999-1111-2222-3333-444444444444",
      organizationId: org1.id,
      planId: "f3b79c23-45d6-4e1f-8b7a-9c2d4e5f6789", // Growth Plan
      status: "active",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-01-01"),
      autoRenew: true,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date()
    });

    // 6. Add Multiple Add-Ons for CV Digital Kreatif
    const addOnSubscriptions = [
      {
        addOnId: "ae7b0424-c687-4979-a50a-82ff085dea01", // Penambahan User
        quantity: 3, // 3 additional users (team has 4 total, growth plan covers 10)
        monthlyPrice: "75000" // 25k x 3 users
      },
      {
        addOnId: "b7540674-a154-4cb1-89b1-11f3c7e8d902", // Storage Tambahan 10GB  
        quantity: 1,
        monthlyPrice: "15000"
      },
      {
        addOnId: "c8651785-b265-5dc2-9a2b-22g4d8f9ea03", // Advanced Analytics
        quantity: 1, 
        monthlyPrice: "50000"
      }
    ];

    for (let i = 0; i < addOnSubscriptions.length; i++) {
      const addon = addOnSubscriptions[i];
      await db.insert(organizationAddOnSubscriptions).values({
        id: `99999999-${i + 1}111-2222-3333-444444444444`,
        organizationId: org1.id,
        addOnId: addon.addOnId,
        quantity: addon.quantity,
        monthlyPrice: addon.monthlyPrice,
        status: "active",
        startDate: new Date("2025-01-01"),
        autoRenew: true,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date()
      });
    }

    // 7. Create Owner User for PT Solusi Tech FIRST
    const [user2] = await db.insert(users).values({
      id: "88888888-aaaa-bbbb-cccc-dddddddddddd",
      email: "ceo@solusitecht.com", 
      username: "Rizki Nugraha",
      password: hashedPassword, // Use password field instead of passwordHash
      role: "member",
      organizationId: null, // Will be updated after org creation
      firstName: "Rizki",
      lastName: "Nugraha", 
      profileImageUrl: null,
      createdAt: new Date("2024-11-15"),
      updatedAt: new Date()
    }).returning();

    // 8. Create Second Organization: PT Solusi Tech (Medium Company)
    const [org2] = await db.insert(organizations).values({
      id: "88888888-dddd-cccc-bbbb-aaaaaaaaaaaa", 
      name: "PT Solusi Tech",
      slug: "pt-solusi-tech",
      description: "Perusahaan software development dengan 18 karyawan",
      ownerId: "88888888-aaaa-bbbb-cccc-dddddddddddd",
      createdAt: new Date("2024-11-15"),
      updatedAt: new Date()
    }).returning();

    // 9. Update user2's organizationId now that org2 exists
    await db.update(users)
      .set({ organizationId: org2.id })
      .where(eq(users.id, user2.id));

    // 10. Subscribe to Scale Plan (Rp 749,000/month) 
    await db.insert(organizationSubscriptions).values({
      id: "88888888-1111-2222-3333-444444444444",
      organizationId: org2.id,
      planId: "a1c5e789-67f8-4b3d-9e2a-1f4c6d8b5e90", // Scale Plan
      status: "active", 
      startDate: new Date("2024-11-15"),
      endDate: new Date("2025-11-15"),
      autoRenew: true,
      createdAt: new Date("2024-11-15"),
      updatedAt: new Date()
    });

    // 11. Add Premium Add-Ons for PT Solusi Tech
    const premiumAddOns = [
      {
        addOnId: "d9762896-c376-6ed3-ab3c-33h5e9gaeb04", // Priority Support
        quantity: 1,
        monthlyPrice: "75000"
      },
      {
        addOnId: "e0873907-d487-7fe4-bc4d-44i6fah0fc05", // API Access Extended
        quantity: 1,
        monthlyPrice: "35000" 
      },
      {
        addOnId: "c8651785-b265-5dc2-9a2b-22g4d8f9ea03", // Advanced Analytics
        quantity: 1,
        monthlyPrice: "50000"
      }
    ];

    for (let i = 0; i < premiumAddOns.length; i++) {
      const addon = premiumAddOns[i];
      await db.insert(organizationAddOnSubscriptions).values({
        id: `88888888-${i + 1}111-2222-3333-444444444444`,
        organizationId: org2.id,
        addOnId: addon.addOnId,
        quantity: addon.quantity,
        monthlyPrice: addon.monthlyPrice,
        status: "active",
        startDate: new Date("2024-11-15"),
        autoRenew: true,
        createdAt: new Date("2024-11-15"),
        updatedAt: new Date()
      });
    }

    console.log("✅ Dummy client organizations created successfully!");
    console.log("\n📊 Summary:");
    console.log("1. CV Digital Kreatif:");
    console.log("   - Plan: Growth (Rp 299,000/month)");
    console.log("   - Add-ons: Extra Users (Rp 75,000), Storage (Rp 15,000), Analytics (Rp 50,000)");
    console.log("   - Total: Rp 439,000/month");
    console.log("   - Login: owner@digitalkreatif.com / password123");
    
    console.log("\n2. PT Solusi Tech:");
    console.log("   - Plan: Scale (Rp 749,000/month)");  
    console.log("   - Add-ons: Priority Support (Rp 75,000), API Access (Rp 35,000), Analytics (Rp 50,000)");
    console.log("   - Total: Rp 909,000/month");
    console.log("   - Login: ceo@solusitecht.com / password123");

  } catch (error) {
    console.error("❌ Error creating dummy clients:", error);
  }
}

// Run the script
createDummyClient().then(() => {
  console.log("🎉 Dummy client creation completed!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Failed to create dummy clients:", error);
  process.exit(1);
});