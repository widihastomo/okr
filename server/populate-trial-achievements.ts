import { db } from "./db";
import { trialAchievements } from "@shared/schema";
import { eq } from "drizzle-orm";

const defaultTrialAchievements = [
  // Setup Category
  {
    name: "Selamat Datang!",
    description: "Bergabung dengan platform dan memulai trial gratis",
    icon: "PartyPopper",
    category: "setup",
    points: 25,
    triggerType: "action",
    triggerCondition: { action: "trial_started" },
  },
  {
    name: "Profile Lengkap",
    description: "Melengkapi informasi profil Anda",
    icon: "User",
    category: "setup",
    points: 15,
    triggerType: "milestone",
    triggerCondition: { milestone: "setup_profile" },
  },
  {
    name: "Tim Pertama",
    description: "Mengundang anggota tim pertama ke organisasi",
    icon: "Users",
    category: "setup",
    points: 20,
    triggerType: "action",
    triggerCondition: { action: "invite_user" },
  },

  // Engagement Category
  {
    name: "Goal Setter",
    description: "Membuat objective pertama Anda",
    icon: "Target",
    category: "engagement",
    points: 30,
    triggerType: "action",
    triggerCondition: { action: "create_objective" },
  },
  {
    name: "Metrics Master",
    description: "Menambahkan 3 key results",
    icon: "BarChart3",
    category: "engagement",
    points: 25,
    triggerType: "action",
    triggerCondition: { action: "create_key_result", count: 3 },
  },
  {
    name: "Executor",
    description: "Membuat inisiatif pertama untuk mencapai goals",
    icon: "Lightbulb",
    category: "engagement",
    points: 20,
    triggerType: "action",
    triggerCondition: { action: "create_initiative" },
  },
  {
    name: "Task Master",
    description: "Menyelesaikan 5 task",
    icon: "CheckSquare",
    category: "engagement",
    points: 35,
    triggerType: "action",
    triggerCondition: { action: "complete_task", count: 5 },
  },

  // Progress Category
  {
    name: "Progress Tracker",
    description: "Melakukan check-in pertama pada key result",
    icon: "TrendingUp",
    category: "progress",
    points: 20,
    triggerType: "action",
    triggerCondition: { action: "first_checkin" },
  },
  {
    name: "Consistent Player",
    description: "Aktif selama 3 hari berturut-turut",
    icon: "Calendar",
    category: "progress",
    points: 40,
    triggerType: "streak",
    triggerCondition: { streak: 3 },
  },
  {
    name: "Week Warrior",
    description: "Aktif selama 7 hari berturut-turut",
    icon: "Flame",
    category: "progress",
    points: 100,
    triggerType: "streak",
    triggerCondition: { streak: 7 },
  },
  {
    name: "Data Driven",
    description: "Update progress pada 10 key results",
    icon: "LineChart",
    category: "progress",
    points: 50,
    triggerType: "action",
    triggerCondition: { action: "checkin", count: 10 },
  },

  // Completion Category
  {
    name: "First Victory",
    description: "Menyelesaikan objective pertama Anda",
    icon: "Trophy",
    category: "completion",
    points: 100,
    triggerType: "milestone",
    triggerCondition: { milestone: "first_complete_okr" },
  },
  {
    name: "Initiative Champion",
    description: "Menyelesaikan inisiatif dengan sempurna",
    icon: "Award",
    category: "completion",
    points: 75,
    triggerType: "action",
    triggerCondition: { action: "complete_initiative" },
  },
  {
    name: "Team Leader",
    description: "Memimpin tim dengan 3+ anggota aktif",
    icon: "Crown",
    category: "completion",
    points: 80,
    triggerType: "milestone",
    triggerCondition: { milestone: "team_leadership" },
  },
  {
    name: "Trial Graduate",
    description: "Menyelesaikan semua tugas trial dengan sempurna",
    icon: "GraduationCap",
    category: "completion",
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