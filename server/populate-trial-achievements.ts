import { db } from "./db";
import { trialAchievements } from "@shared/schema";
import { eq } from "drizzle-orm";

const defaultTrialAchievements = [
  // Onboarding Setup Missions
  {
    name: "🚀 Memulai Perjalanan",
    description: "Selamat datang! Bergabung dengan platform dan memulai trial gratis",
    icon: "PartyPopper",
    category: "setup",
    points: 25,
    triggerType: "action",
    triggerCondition: { action: "trial_started" },
  },
  {
    name: "👤 Misi: Tambah Pengguna",
    description: "Mengundang dan menambahkan anggota tim pertama ke organisasi",
    icon: "UserPlus",
    category: "setup",
    points: 30,
    triggerType: "action",
    triggerCondition: { action: "invite_user" },
  },
  {
    name: "👥 Misi: Buat Tim",
    description: "Membuat tim pertama untuk mengorganisir anggota",
    icon: "Users",
    category: "setup",
    points: 25,
    triggerType: "action",
    triggerCondition: { action: "create_team" },
  },
  {
    name: "🔄 Misi: Kelola Cycle",
    description: "Membuat atau mengatur cycle untuk periode waktu kerja",
    icon: "Calendar",
    category: "setup",
    points: 20,
    triggerType: "action",
    triggerCondition: { action: "create_cycle" },
  },

  // Operational Workflow Missions
  {
    name: "🎯 Misi: Buat Objective",
    description: "Membuat objective pertama untuk menetapkan tujuan jelas",
    icon: "Target",
    category: "workflow",
    points: 40,
    triggerType: "action",
    triggerCondition: { action: "create_objective" },
  },
  {
    name: "📊 Misi: Tambah Key Results",
    description: "Menambahkan 2 key results untuk mengukur pencapaian objective",
    icon: "BarChart3",
    category: "workflow",
    points: 35,
    triggerType: "action",
    triggerCondition: { action: "create_key_result", count: 2 },
  },
  {
    name: "💡 Misi: Buat Inisiatif",
    description: "Membuat inisiatif pertama untuk rencana aksi mencapai objective",
    icon: "Lightbulb",
    category: "workflow",
    points: 30,
    triggerType: "action",
    triggerCondition: { action: "create_initiative" },
  },
  {
    name: "✅ Misi: Tambah Task",
    description: "Membuat task pertama untuk melakukan pekerjaan konkret",
    icon: "CheckSquare",
    category: "workflow",
    points: 25,
    triggerType: "action",
    triggerCondition: { action: "create_task" },
  },

  // Progress Monitoring Missions
  {
    name: "📈 Misi: Lakukan Check-in",
    description: "Melakukan check-in pertama untuk update progress key result",
    icon: "TrendingUp",
    category: "monitoring",
    points: 30,
    triggerType: "action",
    triggerCondition: { action: "first_checkin" },
  },
  {
    name: "🔄 Misi: Update Progress",
    description: "Melakukan check-in pada 3 key results berbeda",
    icon: "LineChart",
    category: "monitoring",
    points: 40,
    triggerType: "action",
    triggerCondition: { action: "checkin", count: 3 },
  },
  {
    name: "⚡ Misi: Selesaikan Task",
    description: "Menyelesaikan 3 task untuk menunjukkan eksekusi yang konsisten",
    icon: "Zap",
    category: "monitoring",
    points: 35,
    triggerType: "action",
    triggerCondition: { action: "complete_task", count: 3 },
  },
  {
    name: "🔥 Misi: Konsistensi 3 Hari",
    description: "Aktif menggunakan sistem selama 3 hari berturut-turut",
    icon: "Flame",
    category: "monitoring",
    points: 50,
    triggerType: "streak",
    triggerCondition: { streak: 3 },
  },

  // Mastery & Completion Missions
  {
    name: "🏆 Misi: Selesaikan Objective",
    description: "Menyelesaikan objective pertama hingga mencapai 100%",
    icon: "Trophy",
    category: "mastery",
    points: 100,
    triggerType: "milestone",
    triggerCondition: { milestone: "first_complete_okr" },
  },
  {
    name: "🌟 Misi: Master Inisiatif",
    description: "Menyelesaikan inisiatif dengan sempurna termasuk semua task",
    icon: "Award",
    category: "mastery",
    points: 80,
    triggerType: "action",
    triggerCondition: { action: "complete_initiative" },
  },
  {
    name: "🎓 Onboarding Complete",
    description: "Selamat! Anda telah menyelesaikan semua misi onboarding",
    icon: "GraduationCap",
    category: "mastery",
    points: 200,
    triggerType: "milestone",
    triggerCondition: { milestone: "trial_completion" },
  },
];

export async function populateTrialAchievements() {
  console.log("🏆 Populating trial achievements...");

  try {
    // Check if achievements already exist
    const existingAchievements = await db.select().from(trialAchievements).limit(1);
    
    if (existingAchievements.length > 0) {
      console.log("✅ Trial achievements already exist, skipping...");
      return;
    }

    // Insert all default achievements
    for (const achievement of defaultTrialAchievements) {
      await db.insert(trialAchievements).values({
        ...achievement,
        triggerCondition: achievement.triggerCondition,
        isActive: true,
        trialOnly: true,
      });
    }

    console.log(`✅ Successfully populated ${defaultTrialAchievements.length} trial achievements`);
  } catch (error) {
    console.error("❌ Error populating trial achievements:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateTrialAchievements()
    .then(() => {
      console.log("✅ Trial achievements population completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}