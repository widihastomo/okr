import { db } from "./db";
import { cycles, objectives, keyResults, initiatives, tasks } from "@shared/schema";
import { eq } from "drizzle-orm";

const TRIAL_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d480';
const TRIAL_ORG_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

export async function createTrialDummyData() {
  console.log("🗓️ Creating trial dummy data...");

  try {
    // Check if data already exists
    const existingCycles = await db.select().from(cycles).where(eq(cycles.id, 'f47ac10b-58cc-4372-a567-0e02b2c3d481')).limit(1);
    
    if (existingCycles.length > 0) {
      console.log("✅ Trial dummy data already exists, skipping...");
      return;
    }

    // 1. Create monthly cycle for July 2025 (1 month period)
    const julyCycle = await db.insert(cycles).values({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
      name: 'Juli 2025',
      type: 'monthly',
      startDate: '2025-07-01',
      endDate: '2025-07-31',
      status: 'active',
      description: 'Cycle bulanan untuk trial user - Juli 2025',
    }).returning();

    console.log("✅ Created July 2025 cycle");

    // 2. Create dummy objective owned by trial user
    const objective = await db.insert(objectives).values({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
      cycleId: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
      title: 'Meningkatkan Produktivitas Tim Startup',
      description: 'Objective untuk meningkatkan produktivitas dan efisiensi tim dalam mengembangkan produk startup',
      owner: 'Trial User',
      ownerType: 'user',
      ownerId: TRIAL_USER_ID,
      status: 'in_progress',
    }).returning();

    console.log("✅ Created objective");

    // 3. Create key results for the objective
    const keyResult1 = await db.insert(keyResults).values({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d483',
      objectiveId: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
      title: 'Meningkatkan kecepatan development menjadi 85%',
      description: 'Mengukur efisiensi development tim dalam menyelesaikan fitur',
      keyResultType: 'increase_to',
      unit: 'percentage',
      baselineValue: 60,
      targetValue: 85,
      currentValue: 72,
      assignedTo: TRIAL_USER_ID,
    }).returning();

    const keyResult2 = await db.insert(keyResults).values({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d484',
      objectiveId: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
      title: 'Mengurangi bug production menjadi maksimal 5 per minggu',
      description: 'Mengukur kualitas code yang dihasilkan tim',
      keyResultType: 'decrease_to',
      unit: 'number',
      baselineValue: 15,
      targetValue: 5,
      currentValue: 8,
      assignedTo: TRIAL_USER_ID,
    }).returning();

    console.log("✅ Created key results");

    // 4. Create initiatives owned by trial user
    const initiative1 = await db.insert(initiatives).values({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d485',
      keyResultId: 'f47ac10b-58cc-4372-a567-0e02b2c3d483',
      objectiveId: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
      title: 'Implementasi Code Review Process',
      description: 'Mengimplementasikan proses code review yang sistematis untuk meningkatkan kualitas code',
      status: 'sedang_berjalan',
      priority: 4.2,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-07-15'),
      budget: 500000,
      createdBy: TRIAL_USER_ID,
    }).returning();

    const initiative2 = await db.insert(initiatives).values({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d486',
      keyResultId: 'f47ac10b-58cc-4372-a567-0e02b2c3d484',
      objectiveId: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
      title: 'Setup Automated Testing Pipeline',
      description: 'Membangun pipeline automated testing untuk mengurangi bug dan meningkatkan confidence deployment',
      status: 'draft',
      priority: 3.8,
      startDate: new Date('2025-07-08'),
      endDate: new Date('2025-07-22'),
      budget: 750000,
      createdBy: TRIAL_USER_ID,
    }).returning();

    console.log("✅ Created initiatives");

    // 5. Create tasks for initiatives
    const tasks1 = [
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d487',
        title: 'Setup GitHub PR Template',
        description: 'Membuat template untuk pull request yang mencakup checklist code review',
        priority: 'high',
        dueDate: new Date('2025-07-10'),
        status: 'completed',
        initiativeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d485',
        createdBy: TRIAL_USER_ID,
      },
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d488',
        title: 'Dokumentasi Code Review Guidelines',
        description: 'Membuat dokumentasi guidelines untuk proses code review tim',
        priority: 'medium',
        dueDate: new Date('2025-07-12'),
        status: 'in_progress',
        initiativeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d485',
        createdBy: TRIAL_USER_ID,
      },
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d489',
        title: 'Training Tim Code Review',
        description: 'Mengadakan training untuk tim tentang best practices code review',
        priority: 'medium',
        dueDate: new Date('2025-07-15'),
        status: 'pending',
        initiativeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d485',
        createdBy: TRIAL_USER_ID,
      },
    ];

    const tasks2 = [
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d490',
        title: 'Setup Jest Testing Framework',
        description: 'Konfigurasi Jest untuk unit testing di frontend dan backend',
        priority: 'high',
        dueDate: new Date('2025-07-12'),
        status: 'in_progress',
        initiativeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d486',
        createdBy: TRIAL_USER_ID,
      },
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d491',
        title: 'Implementasi CI/CD Pipeline',
        description: 'Setup GitHub Actions untuk automated testing dan deployment',
        priority: 'high',
        dueDate: new Date('2025-07-18'),
        status: 'pending',
        initiativeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d486',
        createdBy: TRIAL_USER_ID,
      },
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d492',
        title: 'Monitoring & Alerting Setup',
        description: 'Setup monitoring untuk track test coverage dan failure rate',
        priority: 'medium',
        dueDate: new Date('2025-07-20'),
        status: 'pending',
        initiativeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d486',
        createdBy: TRIAL_USER_ID,
      },
    ];

    // Insert all tasks
    for (const task of [...tasks1, ...tasks2]) {
      await db.insert(tasks).values(task);
    }

    console.log("✅ Created tasks");

    // 6. Create August cycle as well for continuity
    await db.insert(cycles).values({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d493',
      name: 'Agustus 2025',
      type: 'monthly',
      startDate: '2025-08-01',
      endDate: '2025-08-31',
      status: 'planning',
      description: 'Cycle bulanan untuk trial user - Agustus 2025',
    });

    console.log("✅ Created August 2025 cycle");

    console.log(`✅ Successfully created trial dummy data:
    - 2 monthly cycles (Juli & Agustus 2025)
    - 1 objective dengan 2 key results
    - 2 initiatives dengan 6 tasks
    - Semua owned by trial user: ${TRIAL_USER_ID}`);

  } catch (error) {
    console.error("❌ Error creating trial dummy data:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTrialDummyData()
    .then(() => {
      console.log("✅ Trial dummy data creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}