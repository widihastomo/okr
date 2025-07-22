import { storage } from "./storage";
import { db } from "./db";
import { cycles } from "../shared/schema";

export async function createComprehensiveDummyData(userId: string, organizationId: string) {
  try {
    console.log("🚀 Creating comprehensive dummy data system...");

    // Get current user data
    const currentUser = await storage.getUser(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Get or create cycles for this organization
    const existingCycles = await storage.getCycles();
    const organizationCycles = existingCycles.filter(cycle => cycle.organizationId === organizationId);
    let monthlyCycle = organizationCycles.find(cycle => cycle.type === "monthly");
    
    // Create cycles if they don't exist
    if (organizationCycles.length === 0) {
      console.log("🔧 No cycles found, creating basic cycles...");
      
      // Create annual cycle
      const currentYear = new Date().getFullYear();
      await db.insert(cycles).values({
        name: `Annual ${currentYear}`,
        type: "annual",
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        organizationId: organizationId,
        createdBy: userId
      });
      
      // Create quarterly cycles
      const quarters = [
        { name: `Q1 ${currentYear}`, start: `${currentYear}-01-01`, end: `${currentYear}-03-31` },
        { name: `Q2 ${currentYear}`, start: `${currentYear}-04-01`, end: `${currentYear}-06-30` },
        { name: `Q3 ${currentYear}`, start: `${currentYear}-07-01`, end: `${currentYear}-09-30` },
        { name: `Q4 ${currentYear}`, start: `${currentYear}-10-01`, end: `${currentYear}-12-31` }
      ];
      
      for (const quarter of quarters) {
        await db.insert(cycles).values({
          name: quarter.name,
          type: "quarterly",
          startDate: quarter.start,
          endDate: quarter.end,
          organizationId: organizationId,
          createdBy: userId
        });
      }
      
      // Create current monthly cycle
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const monthName = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
      
      const [insertedMonthlyCycle] = await db.insert(cycles).values({
        name: monthName,
        type: "monthly",
        startDate: startDate,
        endDate: endDate,
        organizationId: organizationId,
        createdBy: userId
      }).returning();
      monthlyCycle = insertedMonthlyCycle;
      
      console.log("✅ Created cycles:", { annual: 1, quarterly: 4, monthly: 1 });
    }
    
    // Ensure we have a monthly cycle
    if (!monthlyCycle) {
      monthlyCycle = organizationCycles.find(cycle => cycle.type === "monthly");
      if (!monthlyCycle) {
        throw new Error("Failed to create or find monthly cycle for this organization.");
      }
    }

    // Get or create teams for this organization  
    const teams = await storage.getTeams();
    const organizationTeams = teams.filter(team => team.organizationId === organizationId);
    let companyTeam = organizationTeams.find(team => team.name.toLowerCase().includes("company") || team.name.toLowerCase().includes("perusahaan"));
    let marketingTeam = organizationTeams.find(team => team.name.toLowerCase().includes("marketing"));
    let salesTeam = organizationTeams.find(team => team.name.toLowerCase().includes("sales"));
    let operationTeam = organizationTeams.find(team => team.name.toLowerCase().includes("operation") || team.name.toLowerCase().includes("operasi"));

    console.log("🏢 Found teams for organization:", {
      organizationId,
      totalTeams: organizationTeams.length,
      allTeamNames: organizationTeams.map(t => t.name),
      companyTeam: companyTeam?.name,
      marketingTeam: marketingTeam?.name,
      salesTeam: salesTeam?.name,
      operationTeam: operationTeam?.name
    });

    // Create teams if they don't exist
    if (organizationTeams.length === 0) {
      console.log("🔧 No teams found, creating basic teams...");
      
      companyTeam = await storage.createTeam({
        name: "Company Team",
        description: "Tim utama perusahaan",
        organizationId: organizationId,
        ownerId: userId,
        createdBy: userId
      });

      marketingTeam = await storage.createTeam({
        name: "Marketing Team", 
        description: "Tim marketing dan branding",
        organizationId: organizationId,
        ownerId: userId,
        createdBy: userId
      });

      salesTeam = await storage.createTeam({
        name: "Sales Team",
        description: "Tim penjualan dan customer acquisition", 
        organizationId: organizationId,
        ownerId: userId,
        createdBy: userId
      });

      operationTeam = await storage.createTeam({
        name: "Operation Team",
        description: "Tim operasional dan proses bisnis",
        organizationId: organizationId, 
        ownerId: userId,
        createdBy: userId
      });
      
      console.log("✅ Created teams:", { 
        companyTeam: companyTeam.name, 
        marketingTeam: marketingTeam.name, 
        salesTeam: salesTeam.name, 
        operationTeam: operationTeam.name 
      });

      console.log("✅ Basic teams created successfully");
    }

    console.log("📊 Creating comprehensive goals structure...");

    // 1. Create Parent Goal (Company Team)
    const parentGoal = await storage.createObjective({
      title: "Meningkatkan Pendapatan Perusahaan 35% - Contoh",
      description: "Mencapai target pertumbuhan pendapatan yang ambisius melalui ekspansi pasar dan peningkatan efisiensi operasional",
      cycleId: monthlyCycle.id,
      organizationId: organizationId,
      owner: companyTeam?.name || "Company Team",
      ownerType: "team",
      ownerId: companyTeam?.id || userId,
      status: "on_track",
      teamId: companyTeam?.id
    });

    // 2. Create Marketing Child Goal
    const marketingGoal = await storage.createObjective({
      title: "Meningkatkan Brand Awareness 50% - Contoh",
      description: "Membangun kesadaran merek yang kuat melalui kampanye digital dan content marketing yang efektif",
      cycleId: monthlyCycle.id,
      organizationId: organizationId,
      owner: marketingTeam?.name || "Marketing Team",
      ownerType: "team", 
      ownerId: marketingTeam?.id || userId,
      status: "on_track",
      teamId: marketingTeam?.id,
      parentId: parentGoal.id
    });

    // 3. Create Sales Child Goal
    const salesGoal = await storage.createObjective({
      title: "Mencapai Target Penjualan 40% - Contoh",
      description: "Meningkatkan konversi penjualan melalui strategi outbound dan customer relationship yang lebih baik",
      cycleId: monthlyCycle.id,
      organizationId: organizationId,
      owner: salesTeam?.name || "Sales Team",
      ownerType: "team",
      ownerId: salesTeam?.id || userId,
      status: "on_track",
      teamId: salesTeam?.id,
      parentId: parentGoal.id
    });

    // 4. Create Operation Child Goal
    const operationGoal = await storage.createObjective({
      title: "Optimalisasi Efisiensi Operasional 25% - Contoh",
      description: "Meningkatkan produktivitas dan mengurangi waste melalui digitalisasi proses bisnis",
      cycleId: monthlyCycle.id,
      organizationId: organizationId,
      owner: operationTeam?.name || "Operation Team",
      ownerType: "team",
      ownerId: operationTeam?.id || userId,
      status: "on_track",
      teamId: operationTeam?.id,
      parentId: parentGoal.id
    });

    // 5. Create Personal Goal
    const personalGoal = await storage.createObjective({
      title: "Pengembangan Skill Leadership 100% - Contoh",
      description: "Meningkatkan kemampuan kepemimpinan melalui training dan praktik langsung dalam manajemen tim",
      cycleId: monthlyCycle.id,
      organizationId: organizationId,
      owner: currentUser.name || "Personal",
      ownerType: "user",
      ownerId: userId,
      status: "on_track"
    });

    console.log("🎯 Creating key results for each goal...");

    // Create Key Results for Marketing Goal
    const marketingKR1 = await storage.createKeyResult({
      objectiveId: marketingGoal.id,
      organizationId: organizationId,
      title: "Meningkatkan Social Media Followers",
      description: "Target followers Instagram dan LinkedIn",
      currentValue: "2500",
      targetValue: "5000",
      baseValue: "2000",
      unit: "followers",
      keyResultType: "increase_to",
      status: "on_track",
      assignedTo: userId
    });

    const marketingKR2 = await storage.createKeyResult({
      objectiveId: marketingGoal.id,
      organizationId: organizationId,
      title: "Website Traffic Growth",
      description: "Meningkatkan kunjungan website bulanan",
      currentValue: "12000",
      targetValue: "20000",
      baseValue: "10000",
      unit: "visits",
      keyResultType: "increase_to",
      status: "on_track",
      assignedTo: userId
    });

    // Create Key Results for Sales Goal
    const salesKR1 = await storage.createKeyResult({
      objectiveId: salesGoal.id,
      organizationId: organizationId,
      title: "New Customer Acquisition",
      description: "Menambah jumlah customer baru",
      currentValue: "45",
      targetValue: "100",
      baseValue: "30",
      unit: "customers",
      keyResultType: "increase_to",
      status: "on_track",
      assignedTo: userId
    });

    const salesKR2 = await storage.createKeyResult({
      objectiveId: salesGoal.id,
      organizationId: organizationId,
      title: "Sales Conversion Rate",
      description: "Meningkatkan tingkat konversi penjualan",
      currentValue: "15",
      targetValue: "25",
      baseValue: "10",
      unit: "percentage",
      keyResultType: "increase_to",
      status: "on_track",
      assignedTo: userId
    });

    // Create Key Results for Operation Goal
    const operationKR1 = await storage.createKeyResult({
      objectiveId: operationGoal.id,
      organizationId: organizationId,
      title: "Process Automation",
      description: "Mengotomatisasi proses manual yang repetitif",
      currentValue: "3",
      targetValue: "8",
      baseValue: "1",
      unit: "processes",
      keyResultType: "increase_to",
      status: "on_track",
      assignedTo: userId
    });

    const operationKR2 = await storage.createKeyResult({
      objectiveId: operationGoal.id,
      organizationId: organizationId,
      title: "Cost Reduction",
      description: "Mengurangi biaya operasional bulanan",
      currentValue: "15",
      targetValue: "25",
      baseValue: "10",
      unit: "percentage",
      keyResultType: "increase_to",
      status: "on_track",
      assignedTo: userId
    });

    // Create Key Results for Personal Goal
    const personalKR1 = await storage.createKeyResult({
      objectiveId: personalGoal.id,
      organizationId: organizationId,
      title: "Leadership Training Hours",
      description: "Menyelesaikan training kepemimpinan",
      currentValue: "8",
      targetValue: "40",
      baseValue: "0",
      unit: "hours",
      keyResultType: "increase_to",
      status: "on_track",
      assignedTo: userId
    });

    console.log("🚀 Creating initiatives with complete structure...");

    // Create Marketing Initiative
    const marketingInitiative = await storage.createInitiative({
      keyResultId: marketingKR1.id,
      organizationId: organizationId,
      title: "Kampanye Social Media Engagement - Contoh",
      description: "Pelaksanaan kampanye konten harian di Instagram dan LinkedIn untuk meningkatkan engagement dan followers",
      implementationPlan: "1. Buat content calendar mingguan\n2. Produksi konten visual dan video\n3. Posting konsisten 2x sehari\n4. Monitor engagement dan respond to comments\n5. Analisis performance dan optimasi strategi",
      status: "sedang_berjalan",
      priority: "high",
      picId: userId,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now
      budget: "5000000",
      createdBy: userId
    });

    // Create Sales Initiative
    const salesInitiative = await storage.createInitiative({
      keyResultId: salesKR1.id,
      organizationId: organizationId,
      title: "Program Customer Acquisition - Contoh",
      description: "Strategi komprehensif untuk mendapatkan customer baru melalui outbound sales dan referral program",
      implementationPlan: "1. Identifikasi target customer profile\n2. Buat sales script dan materials\n3. Lakukan cold calling dan email campaign\n4. Setup referral program dengan incentives\n5. Follow up leads dan convert to customers",
      status: "sedang_berjalan",
      priority: "high",
      picId: userId,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      budget: "8000000",
      createdBy: userId
    });

    console.log("📋 Creating success metrics and DoD items...");

    // Create Success Metrics for Marketing Initiative
    await storage.createSuccessMetric({
      initiativeId: marketingInitiative.id,
      organizationId: organizationId,
      name: "Daily Post Consistency",
      target: "2 posts per day",
      achievement: "1.8 posts per day",
      createdBy: userId
    });

    await storage.createSuccessMetric({
      initiativeId: marketingInitiative.id,
      organizationId: organizationId,
      name: "Engagement Rate",
      target: "5% engagement rate",
      achievement: "4.2% engagement rate",
      createdBy: userId
    });

    // Create Success Metrics for Sales Initiative
    await storage.createSuccessMetric({
      initiativeId: salesInitiative.id,
      organizationId: organizationId,
      name: "Qualified Leads Generated",
      target: "50 qualified leads",
      achievement: "23 qualified leads",
      createdBy: userId
    });

    await storage.createSuccessMetric({
      initiativeId: salesInitiative.id,
      organizationId: organizationId,
      name: "Conversion Rate from Leads",
      target: "20% conversion rate",
      achievement: "18% conversion rate",
      createdBy: userId
    });

    // Create DoD Items for Marketing Initiative
    await storage.createDefinitionOfDoneItem({
      initiativeId: marketingInitiative.id,
      organizationId: organizationId,
      title: "Content calendar untuk 30 hari ke depan telah dibuat dan disetujui",
      isCompleted: true,
      completedBy: userId,
      createdBy: userId
    });

    await storage.createDefinitionOfDoneItem({
      initiativeId: marketingInitiative.id,
      organizationId: organizationId,
      title: "Brand guidelines dan visual identity telah ditetapkan",
      isCompleted: true,
      completedBy: userId,
      createdBy: userId
    });

    await storage.createDefinitionOfDoneItem({
      initiativeId: marketingInitiative.id,
      organizationId: organizationId,
      title: "Social media analytics dashboard telah setup dan monitoring aktif",
      isCompleted: false,
      createdBy: userId
    });

    // Create DoD Items for Sales Initiative
    await storage.createDefinitionOfDoneItem({
      initiativeId: salesInitiative.id,
      organizationId: organizationId,
      title: "Customer persona dan target market telah didefinisikan dengan detail",
      isCompleted: true,
      completedBy: userId,
      createdBy: userId
    });

    await storage.createDefinitionOfDoneItem({
      initiativeId: salesInitiative.id,
      organizationId: organizationId,
      title: "Sales materials dan presentation deck telah disiapkan",
      isCompleted: false,
      createdBy: userId
    });

    await storage.createDefinitionOfDoneItem({
      initiativeId: salesInitiative.id,
      organizationId: organizationId,
      title: "CRM system telah dikonfigurasi untuk lead tracking",
      isCompleted: false,
      createdBy: userId
    });

    console.log("📝 Creating tasks for initiatives...");

    // Create Tasks for Marketing Initiative
    await storage.createTask({
      initiativeId: marketingInitiative.id,
      organizationId: organizationId,
      title: "Buat konten Instagram story harian",
      description: "Membuat dan posting Instagram story dengan konten edukatif dan engaging setiap hari",
      status: "in_progress",
      priority: "high",
      assignedTo: userId,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: userId
    });

    await storage.createTask({
      initiativeId: marketingInitiative.id,
      organizationId: organizationId,
      title: "Design template konten untuk LinkedIn",
      description: "Membuat template design yang konsisten untuk postingan LinkedIn",
      status: "completed",
      priority: "medium",
      assignedTo: userId,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: userId
    });

    await storage.createTask({
      initiativeId: marketingInitiative.id,
      organizationId: organizationId,
      title: "Setup Google Analytics untuk website tracking",
      description: "Konfigurasi Google Analytics dan setup conversion tracking",
      status: "not_started",
      priority: "medium",
      assignedTo: userId,
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      createdBy: userId
    });

    // Create Tasks for Sales Initiative
    await storage.createTask({
      initiativeId: salesInitiative.id,
      organizationId: organizationId,
      title: "Cold calling 20 prospek harian",
      description: "Melakukan cold calling kepada 20 prospek potensial setiap hari",
      status: "in_progress",
      priority: "high",
      assignedTo: userId,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdBy: userId
    });

    await storage.createTask({
      initiativeId: salesInitiative.id,
      organizationId: organizationId,
      title: "Buat email sequence untuk lead nurturing",
      description: "Menulis 5 email sequence untuk nurturing leads yang belum convert",
      status: "completed",
      priority: "high",
      assignedTo: userId,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdBy: userId
    });

    console.log("📈 Creating check-ins for key results...");

    // Create Check-ins for Marketing KR1
    await storage.createCheckIn({
      keyResultId: marketingKR1.id,
      organizationId: organizationId,
      value: "2500",
      notes: "Followers bertambah 500 dalam seminggu terakhir melalui kampanye konten yang konsisten. Engagement rate juga meningkat signifikan.",
      confidence: 8,
      createdBy: userId
    });

    // Create Check-ins for Sales KR1
    await storage.createCheckIn({
      keyResultId: salesKR1.id,
      organizationId: organizationId,
      value: "45",
      notes: "Berhasil menambah 15 customer baru bulan ini. Strategi cold calling dan referral program mulai menunjukkan hasil positif.",
      confidence: 7,
      createdBy: userId
    });

    console.log("📝 Creating timeline entries...");

    // Create Timeline Entries for daily updates
    await storage.createTimelineUpdate({
      userId: userId,
      organizationId: organizationId,
      updateDate: new Date(),
      summary: "Update harian: Progress kampanye marketing dan sales acquisition berjalan baik. Target followers Instagram tercapai 50%, customer baru bertambah 15 orang.",
      detail: JSON.stringify({
        keyResultsUpdated: [
          { name: "Social Media Followers", oldValue: "2000", newValue: "2500" },
          { name: "New Customer Acquisition", oldValue: "30", newValue: "45" }
        ],
        tasksCompleted: [
          { name: "Design template konten untuk LinkedIn" },
          { name: "Buat email sequence untuk lead nurturing" }
        ],
        successMetricsUpdated: [
          { name: "Daily Post Consistency", achievement: "1.8 posts per day" },
          { name: "Qualified Leads Generated", achievement: "23 qualified leads" }
        ],
        whatWorked: "Konten visual di Instagram mendapat response sangat baik, conversion rate dari email sequence mencapai 18%",
        challenges: "Masih perlu optimasi timing posting untuk engagement yang lebih tinggi"
      }),
      createdBy: userId
    });

    await storage.createTimelineUpdate({
      userId: userId,
      organizationId: organizationId,
      updateDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      summary: "Check-in mingguan: Milestone penting tercapai dalam initiative marketing dan sales. DoD items mulai diselesaikan secara bertahap.",
      detail: JSON.stringify({
        deliverablesCompleted: [
          { name: "Content calendar untuk 30 hari ke depan telah dibuat dan disetujui" },
          { name: "Customer persona dan target market telah didefinisikan dengan detail" }
        ],
        initiativesUpdated: [
          { name: "Kampanye Social Media Engagement", status: "sedang_berjalan", progress: "65%" },
          { name: "Program Customer Acquisition", status: "sedang_berjalan", progress: "45%" }
        ],
        whatWorked: "Timeline eksekusi berjalan sesuai rencana, tim sangat responsif dalam feedback",
        challenges: "Beberapa deliverables memerlukan revisi berdasarkan market research terbaru"
      }),
      createdBy: userId
    });

    console.log("✅ Comprehensive dummy data creation completed successfully!");
    
    return {
      success: true,
      data: {
        parentGoal: parentGoal.id,
        childGoals: [marketingGoal.id, salesGoal.id, operationGoal.id, personalGoal.id],
        keyResults: [marketingKR1.id, marketingKR2.id, salesKR1.id, salesKR2.id, operationKR1.id, operationKR2.id, personalKR1.id],
        initiatives: [marketingInitiative.id, salesInitiative.id],
        message: "Comprehensive dummy data created successfully with complete OKR structure, initiatives, tasks, and timeline entries"
      }
    };

  } catch (error) {
    console.error("❌ Error creating comprehensive dummy data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}