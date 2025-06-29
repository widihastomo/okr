import { db } from "./db";
import {
  achievements,
  levelRewards,
  type InsertAchievement,
  type InsertLevelReward,
} from "@shared/schema";

export async function populateGamificationData() {
  console.log("Populating gamification data...");

  // Sample achievements
  const sampleAchievements: InsertAchievement[] = [
    // Progress Achievements
    {
      name: "First Steps",
      description: "Complete your first objective",
      category: "progress",
      badgeIcon: "Target",
      badgeColor: "bg-green-100 text-green-800 border-green-200",
      points: 50,
      condition: { type: "objectives_completed", target: 1 },
      rarity: "common",
    },
    {
      name: "Goal Achiever",
      description: "Complete 5 objectives",
      category: "progress",
      badgeIcon: "Trophy",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      points: 150,
      condition: { type: "objectives_completed", target: 5 },
      rarity: "rare",
    },
    {
      name: "Progress Tracker",
      description: "Create 10 check-ins",
      category: "progress",
      badgeIcon: "CheckCircle",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      points: 100,
      condition: { type: "check_ins_created", target: 10 },
      rarity: "common",
    },
    {
      name: "Key Result Master",
      description: "Complete 10 key results",
      category: "progress",
      badgeIcon: "Award",
      badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      points: 200,
      condition: { type: "key_results_completed", target: 10 },
      rarity: "epic",
    },

    // Streak Achievements
    {
      name: "Consistent Performer",
      description: "Maintain a 7-day activity streak",
      category: "streak",
      badgeIcon: "Flame",
      badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
      points: 100,
      condition: { type: "daily_streak", target: 7 },
      rarity: "rare",
    },
    {
      name: "Dedication Master",
      description: "Maintain a 30-day activity streak",
      category: "streak",
      badgeIcon: "Zap",
      badgeColor: "bg-red-100 text-red-800 border-red-200",
      points: 300,
      condition: { type: "daily_streak", target: 30 },
      rarity: "legendary",
    },
    {
      name: "Marathon Runner",
      description: "Achieve a longest streak of 60 days",
      category: "streak",
      badgeIcon: "Calendar",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      points: 500,
      condition: { type: "longest_streak", target: 60 },
      rarity: "legendary",
    },

    // Milestone Achievements
    {
      name: "Point Collector",
      description: "Earn 500 total points",
      category: "milestone",
      badgeIcon: "Star",
      badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      points: 50,
      condition: { type: "total_points", target: 500 },
      rarity: "common",
    },
    {
      name: "Rising Star",
      description: "Reach level 5",
      category: "milestone",
      badgeIcon: "TrendingUp",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      points: 100,
      condition: { type: "level_reached", target: 5 },
      rarity: "rare",
    },
    {
      name: "Elite Performer",
      description: "Reach level 10",
      category: "milestone",
      badgeIcon: "Crown",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      points: 250,
      condition: { type: "level_reached", target: 10 },
      rarity: "epic",
    },
    {
      name: "Point Master",
      description: "Earn 2000 total points",
      category: "milestone",
      badgeIcon: "Diamond",
      badgeColor: "bg-pink-100 text-pink-800 border-pink-200",
      points: 200,
      condition: { type: "total_points", target: 2000 },
      rarity: "epic",
    },

    // Collaboration Achievements
    {
      name: "Team Player",
      description: "Create your first initiative",
      category: "collaboration",
      badgeIcon: "Users",
      badgeColor: "bg-green-100 text-green-800 border-green-200",
      points: 75,
      condition: { type: "initiatives_created", target: 1 },
      rarity: "common",
    },
    {
      name: "Project Leader",
      description: "Create 5 initiatives",
      category: "collaboration",
      badgeIcon: "Briefcase",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      points: 200,
      condition: { type: "initiatives_created", target: 5 },
      rarity: "rare",
    },
    {
      name: "Collaboration Champion",
      description: "Achieve 500 collaboration score",
      category: "collaboration",
      badgeIcon: "Heart",
      badgeColor: "bg-red-100 text-red-800 border-red-200",
      points: 250,
      condition: { type: "collaboration_score", target: 500 },
      rarity: "epic",
    },
  ];

  // Sample level rewards
  const sampleLevelRewards: InsertLevelReward[] = [
    {
      level: 1,
      title: "Newcomer",
      description: "Welcome to the OKR journey!",
      badgeIcon: "UserPlus",
      badgeColor: "bg-gray-100 text-gray-800 border-gray-200",
      pointsRequired: 0,
      unlockMessage: "Welcome to your OKR journey! Start setting goals and tracking progress.",
    },
    {
      level: 2,
      title: "Goal Setter",
      description: "You're getting the hang of setting objectives",
      badgeIcon: "Target",
      badgeColor: "bg-green-100 text-green-800 border-green-200",
      pointsRequired: 100,
      unlockMessage: "Great job! You're learning to set and track meaningful objectives.",
    },
    {
      level: 3,
      title: "Progress Tracker",
      description: "You consistently track your progress",
      badgeIcon: "BarChart3",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      pointsRequired: 150,
      unlockMessage: "Excellent! Your consistent progress tracking is paying off.",
    },
    {
      level: 4,
      title: "Achiever",
      description: "You're achieving your goals regularly",
      badgeIcon: "CheckCircle2",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      pointsRequired: 200,
      unlockMessage: "Outstanding! You're consistently achieving your objectives.",
    },
    {
      level: 5,
      title: "Team Leader",
      description: "You lead by example and collaborate well",
      badgeIcon: "Users2",
      badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
      pointsRequired: 250,
      unlockMessage: "Impressive! Your leadership and collaboration skills are evident.",
    },
    {
      level: 6,
      title: "Strategist",
      description: "You think strategically about objectives",
      badgeIcon: "Brain",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      pointsRequired: 300,
      unlockMessage: "Brilliant! Your strategic thinking sets you apart.",
    },
    {
      level: 7,
      title: "Mentor",
      description: "You help others achieve their goals",
      badgeIcon: "GraduationCap",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
      pointsRequired: 350,
      unlockMessage: "Wonderful! Your mentorship is helping others succeed.",
    },
    {
      level: 8,
      title: "Innovator",
      description: "You bring innovative approaches to goal achievement",
      badgeIcon: "Lightbulb",
      badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pointsRequired: 400,
      unlockMessage: "Amazing! Your innovative approach is inspiring.",
    },
    {
      level: 9,
      title: "Expert",
      description: "You're an expert at OKR management",
      badgeIcon: "Award",
      badgeColor: "bg-pink-100 text-pink-800 border-pink-200",
      pointsRequired: 450,
      unlockMessage: "Exceptional! You've mastered the art of OKR management.",
    },
    {
      level: 10,
      title: "Legend",
      description: "You're a legendary performer",
      badgeIcon: "Crown",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      pointsRequired: 500,
      unlockMessage: "Legendary! You've reached the pinnacle of OKR excellence.",
    },
  ];

  try {
    // Check if data already exists
    const existingAchievements = await db.select().from(achievements).limit(1);
    const existingLevelRewards = await db.select().from(levelRewards).limit(1);

    if (existingAchievements.length === 0) {
      await db.insert(achievements).values(sampleAchievements);
      console.log("✅ Sample achievements inserted");
    } else {
      console.log("✅ Achievements already exist");
    }

    if (existingLevelRewards.length === 0) {
      await db.insert(levelRewards).values(sampleLevelRewards);
      console.log("✅ Level rewards inserted");
    } else {
      console.log("✅ Level rewards already exist");
    }

    console.log("✅ Gamification data population completed");
  } catch (error) {
    console.error("❌ Error populating gamification data:", error);
    throw error;
  }
}