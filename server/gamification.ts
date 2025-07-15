import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  achievements,
  userAchievements,
  userStats,
  levelRewards,
  activityLogs,
  type Achievement,
  type UserStats,
  type UserAchievement,
  type ActivityLog,
  type InsertActivityLog,
  type InsertUserAchievement,
} from "@shared/schema";

export class GamificationService {
  
  /**
   * Initialize user stats when a new user is created
   */
  async initializeUserStats(userId: string, organizationId?: string): Promise<UserStats> {
    const [existingStats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));

    if (existingStats) {
      return existingStats;
    }

    // Get user's organization ID if not provided
    if (!organizationId) {
      const [user] = await db
        .select({ organizationId: users.organizationId })
        .from(users)
        .where(eq(users.id, userId));
      
      if (user?.organizationId) {
        organizationId = user.organizationId;
      }
    }

    const [newStats] = await db
      .insert(userStats)
      .values({
        userId,
        organizationId,
        totalPoints: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date().toISOString().split('T')[0],
        objectivesCompleted: 0,
        keyResultsCompleted: 0,
        checkInsCreated: 0,
        initiativesCreated: 0,
        collaborationScore: 0,
      })
      .returning();

    return newStats;
  }

  /**
   * Award points and update user stats for various actions
   */
  async awardPoints(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    points: number,
    metadata?: any
  ): Promise<void> {
    // Create activity log
    await db.insert(activityLogs).values({
      userId,
      action,
      entityType,
      entityId,
      pointsEarned: points,
      metadata,
    });

    // Update user stats
    const [currentStats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));

    if (!currentStats) {
      await this.initializeUserStats(userId);
      return this.awardPoints(userId, action, entityType, entityId, points, metadata);
    }

    const newTotalPoints = currentStats.totalPoints + points;
    const newLevel = this.calculateLevel(newTotalPoints);
    const todayDate = new Date().toISOString().split('T')[0];
    
    // Update activity streak
    let newCurrentStreak = currentStats.currentStreak;
    let newLongestStreak = currentStats.longestStreak;
    
    if (currentStats.lastActivityDate !== todayDate) {
      const lastActivity = new Date(currentStats.lastActivityDate || todayDate);
      const today = new Date(todayDate);
      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        newCurrentStreak = currentStats.currentStreak + 1;
      } else if (daysDiff > 1) {
        // Streak broken
        newCurrentStreak = 1;
      }
      // Same day = keep current streak
      
      newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
    }

    // Update specific stat counters based on action
    const updateData: any = {
      totalPoints: newTotalPoints,
      level: newLevel,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: todayDate,
      updatedAt: new Date(),
    };

    switch (action) {
      case "objective_completed":
        updateData.objectivesCompleted = currentStats.objectivesCompleted + 1;
        break;
      case "key_result_completed":
        updateData.keyResultsCompleted = currentStats.keyResultsCompleted + 1;
        break;
      case "check_in_created":
        updateData.checkInsCreated = currentStats.checkInsCreated + 1;
        break;
      case "initiative_created":
        updateData.initiativesCreated = currentStats.initiativesCreated + 1;
        break;
      case "collaboration_action":
        updateData.collaborationScore = currentStats.collaborationScore + points;
        break;
    }

    await db
      .update(userStats)
      .set(updateData)
      .where(eq(userStats.userId, userId));

    // Check for new achievements
    await this.checkAndAwardAchievements(userId);

    // Check for level up
    if (newLevel > currentStats.level) {
      await this.handleLevelUp(userId, newLevel);
    }
  }

  /**
   * Calculate user level based on total points
   */
  private calculateLevel(totalPoints: number): number {
    // Level progression: 100 points for level 2, then +50 points per level
    if (totalPoints < 100) return 1;
    return Math.floor((totalPoints - 100) / 50) + 2;
  }

  /**
   * Handle level up rewards and notifications
   */
  private async handleLevelUp(userId: string, newLevel: number): Promise<void> {
    const [levelReward] = await db
      .select()
      .from(levelRewards)
      .where(eq(levelRewards.level, newLevel));

    if (levelReward) {
      // Award level up achievement if exists
      await this.awardPoints(
        userId,
        "level_up",
        "user",
        userId,
        levelReward.pointsRequired,
        { level: newLevel, reward: levelReward }
      );
    }
  }

  /**
   * Check and award achievements based on user stats
   */
  async checkAndAwardAchievements(userId: string): Promise<UserAchievement[]> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));

    if (!stats) return [];

    const allAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.isActive, true));

    const userCompletedAchievements = await db
      .select()
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.isCompleted, true)
      ));

    const completedAchievementIds = new Set(
      userCompletedAchievements.map(ua => ua.achievementId)
    );

    const newAchievements: UserAchievement[] = [];

    for (const achievement of allAchievements) {
      if (completedAchievementIds.has(achievement.id)) continue;

      const condition = achievement.condition as any;
      let isCompleted = false;

      // Check achievement conditions
      switch (achievement.category) {
        case "progress":
          if (condition.type === "objectives_completed") {
            isCompleted = stats.objectivesCompleted >= condition.target;
          } else if (condition.type === "key_results_completed") {
            isCompleted = stats.keyResultsCompleted >= condition.target;
          } else if (condition.type === "check_ins_created") {
            isCompleted = stats.checkInsCreated >= condition.target;
          }
          break;

        case "streak":
          if (condition.type === "daily_streak") {
            isCompleted = stats.currentStreak >= condition.target;
          } else if (condition.type === "longest_streak") {
            isCompleted = stats.longestStreak >= condition.target;
          }
          break;

        case "milestone":
          if (condition.type === "total_points") {
            isCompleted = stats.totalPoints >= condition.target;
          } else if (condition.type === "level_reached") {
            isCompleted = stats.level >= condition.target;
          }
          break;

        case "collaboration":
          if (condition.type === "collaboration_score") {
            isCompleted = stats.collaborationScore >= condition.target;
          }
          break;
      }

      if (isCompleted) {
        // Award achievement
        const [newUserAchievement] = await db
          .insert(userAchievements)
          .values({
            userId,
            achievementId: achievement.id,
            progress: condition.target,
            isCompleted: true,
          })
          .returning();

        newAchievements.push(newUserAchievement);

        // Award achievement points
        await this.awardPoints(
          userId,
          "achievement_unlocked",
          "achievement",
          achievement.id,
          achievement.points,
          { achievement: achievement.name }
        );
      }
    }

    return newAchievements;
  }

  /**
   * Get user's current stats
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));

    return stats || null;
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const result = await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
        progress: userAchievements.progress,
        isCompleted: userAchievements.isCompleted,
        achievement: achievements,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));

    return result;
  }

  /**
   * Get user's recent activity
   */
  async getUserActivity(userId: string, limit: number = 10): Promise<ActivityLog[]> {
    const activity = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);

    return activity;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<(UserStats & { user: any })[]> {
    const leaderboard = await db.execute(sql`
      SELECT 
        us.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email
      FROM user_stats us
      JOIN users u ON us.user_id = u.id
      ORDER BY us.total_points DESC, us.level DESC
      LIMIT ${limit}
    `);

    return leaderboard.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      totalPoints: row.total_points,
      level: row.level,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastActivityDate: row.last_activity_date,
      objectivesCompleted: row.objectives_completed,
      keyResultsCompleted: row.key_results_completed,
      checkInsCreated: row.check_ins_created,
      initiativesCreated: row.initiatives_created,
      collaborationScore: row.collaboration_score,
      updatedAt: row.updated_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
      },
    }));
  }
}

export const gamificationService = new GamificationService();