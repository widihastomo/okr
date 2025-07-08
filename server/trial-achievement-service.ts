import { db } from "./db";
import { 
  trialAchievements, 
  userTrialAchievements, 
  trialProgress,
  users,
  organizationSubscriptions,
  objectives,
  keyResults,
  initiatives,
  tasks
} from "@shared/schema";
import { eq, and, count, sql } from "drizzle-orm";
import type { TrialAchievement, UserTrialAchievement, TrialProgress, User } from "@shared/schema";

export interface TrialAchievementTrigger {
  type: 'action' | 'milestone' | 'streak';
  condition: {
    action?: string; // e.g., "create_objective", "complete_task", "check_in"
    count?: number; // minimum count to trigger
    streak?: number; // consecutive days
    value?: any; // additional data
  };
}

export class TrialAchievementService {
  
  /**
   * Initialize trial progress for a new user
   */
  async initializeTrialProgress(userId: string, organizationId: string): Promise<TrialProgress> {
    const existingProgress = await db.select()
      .from(trialProgress)
      .where(eq(trialProgress.userId, userId))
      .limit(1);
    
    if (existingProgress.length > 0) {
      return existingProgress[0];
    }

    const [newProgress] = await db.insert(trialProgress)
      .values({
        userId,
        organizationId,
        totalPoints: 0,
        achievementsUnlocked: 0,
        currentStreak: 0,
        longestStreak: 0,
        progressData: {},
      })
      .returning();

    return newProgress;
  }

  /**
   * Check and award achievements based on user actions
   */
  async checkAndAwardAchievements(userId: string, action: string, metadata?: any): Promise<UserTrialAchievement[]> {
    // Only process for trial users
    const user = await this.getUserWithTrialStatus(userId);
    if (!user || !user.isTrialUser) {
      return [];
    }

    // Get all active achievements that might be triggered by this action
    const availableAchievements = await db.select()
      .from(trialAchievements)
      .where(and(
        eq(trialAchievements.isActive, true),
        eq(trialAchievements.trialOnly, true)
      ));

    const newAchievements: UserTrialAchievement[] = [];

    for (const achievement of availableAchievements) {
      // Check if user already has this achievement
      const existingAchievement = await db.select()
        .from(userTrialAchievements)
        .where(and(
          eq(userTrialAchievements.userId, userId),
          eq(userTrialAchievements.achievementId, achievement.id)
        ))
        .limit(1);

      if (existingAchievement.length > 0) {
        continue; // Already unlocked
      }

      // Check if achievement should be triggered
      const shouldTrigger = await this.checkAchievementCondition(userId, action, achievement, metadata);
      
      if (shouldTrigger) {
        const newAchievement = await this.awardAchievement(userId, achievement, metadata);
        newAchievements.push(newAchievement);
      }
    }

    return newAchievements;
  }

  /**
   * Award specific achievement to user
   */
  private async awardAchievement(userId: string, achievement: TrialAchievement, metadata?: any): Promise<UserTrialAchievement> {
    // Award the achievement
    const [userAchievement] = await db.insert(userTrialAchievements)
      .values({
        userId,
        achievementId: achievement.id,
        pointsEarned: achievement.points,
        metadata,
      })
      .returning();

    // Update user's trial progress
    await db.update(trialProgress)
      .set({
        totalPoints: sql`${trialProgress.totalPoints} + ${achievement.points}`,
        achievementsUnlocked: sql`${trialProgress.achievementsUnlocked} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(trialProgress.userId, userId));

    return userAchievement;
  }

  /**
   * Check if achievement condition is met
   */
  private async checkAchievementCondition(
    userId: string, 
    action: string, 
    achievement: TrialAchievement, 
    metadata?: any
  ): Promise<boolean> {
    const condition = achievement.triggerCondition as TrialAchievementTrigger['condition'];
    
    // Simple action-based achievements
    if (achievement.triggerType === 'action' && condition.action === action) {
      if (condition.count) {
        const currentCount = await this.getActionCount(userId, action);
        return currentCount >= condition.count;
      }
      return true;
    }

    // Milestone-based achievements
    if (achievement.triggerType === 'milestone') {
      return await this.checkMilestoneCondition(userId, condition);
    }

    // Streak-based achievements
    if (achievement.triggerType === 'streak' && condition.streak) {
      const currentStreak = await this.getCurrentStreak(userId);
      return currentStreak >= condition.streak;
    }

    return false;
  }

  /**
   * Get count of specific actions by user
   */
  private async getActionCount(userId: string, action: string): Promise<number> {
    switch (action) {
      case 'create_objective':
        const [objCount] = await db.select({ count: count() })
          .from(objectives)
          .where(eq(objectives.ownerId, userId));
        return objCount.count;

      case 'create_key_result':
        const [krCount] = await db.select({ count: count() })
          .from(keyResults)
          .where(eq(keyResults.assignedTo, userId));
        return krCount.count;

      case 'create_initiative':
        const [initCount] = await db.select({ count: count() })
          .from(initiatives)
          .where(eq(initiatives.createdBy, userId));
        return initCount.count;

      case 'complete_task':
        const [taskCount] = await db.select({ count: count() })
          .from(tasks)
          .where(and(
            eq(tasks.assignedTo, userId),
            eq(tasks.status, 'completed')
          ));
        return taskCount.count;

      default:
        return 0;
    }
  }

  /**
   * Check milestone conditions
   */
  private async checkMilestoneCondition(userId: string, condition: any): Promise<boolean> {
    // Example milestone conditions
    if (condition.milestone === 'first_complete_okr') {
      const [completedOKRs] = await db.select({ count: count() })
        .from(objectives)
        .where(and(
          eq(objectives.ownerId, userId),
          eq(objectives.status, 'completed')
        ));
      return completedOKRs.count >= 1;
    }

    if (condition.milestone === 'setup_profile') {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      return !!(user && user.firstName && user.lastName);
    }

    return false;
  }

  /**
   * Get current streak for user
   */
  private async getCurrentStreak(userId: string): Promise<number> {
    const [progress] = await db.select()
      .from(trialProgress)
      .where(eq(trialProgress.userId, userId))
      .limit(1);
    
    return progress?.currentStreak || 0;
  }

  /**
   * Update user's activity streak
   */
  async updateActivityStreak(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    const [progress] = await db.select()
      .from(trialProgress)
      .where(eq(trialProgress.userId, userId))
      .limit(1);

    if (!progress) {
      await this.initializeTrialProgress(userId, ''); // Initialize if not exists
      return;
    }

    const lastActivity = progress.lastActivityDate?.toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let newStreak = progress.currentStreak;

    if (lastActivity === yesterday) {
      // Consecutive day
      newStreak = progress.currentStreak + 1;
    } else if (lastActivity !== today) {
      // Gap in activity
      newStreak = 1;
    }

    const newLongestStreak = Math.max(progress.longestStreak, newStreak);

    await db.update(trialProgress)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(trialProgress.userId, userId));
  }

  /**
   * Get user's trial achievements
   */
  async getUserTrialAchievements(userId: string): Promise<any[]> {
    const achievements = await db.select({
      id: trialAchievements.id,
      name: trialAchievements.name,
      description: trialAchievements.description,
      icon: trialAchievements.icon,
      category: trialAchievements.category,
      points: trialAchievements.points,
      unlocked: sql<boolean>`CASE WHEN ${userTrialAchievements.id} IS NOT NULL THEN true ELSE false END`,
      unlockedAt: userTrialAchievements.unlockedAt,
      pointsEarned: userTrialAchievements.pointsEarned,
    })
    .from(trialAchievements)
    .leftJoin(userTrialAchievements, and(
      eq(userTrialAchievements.achievementId, trialAchievements.id),
      eq(userTrialAchievements.userId, userId)
    ))
    .where(eq(trialAchievements.isActive, true))
    .orderBy(trialAchievements.category, trialAchievements.points);

    return achievements;
  }

  /**
   * Get user's trial progress
   */
  async getUserTrialProgress(userId: string): Promise<TrialProgress | null> {
    const [progress] = await db.select()
      .from(trialProgress)
      .where(eq(trialProgress.userId, userId))
      .limit(1);

    return progress || null;
  }

  /**
   * Check if user is on trial
   */
  private async getUserWithTrialStatus(userId: string): Promise<{ isTrialUser: boolean } | null> {
    const [user] = await db.select({
      id: users.id,
      organizationId: users.organizationId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

    if (!user || !user.organizationId) {
      return null;
    }

    const [orgSubscription] = await db.select()
      .from(organizationSubscriptions)
      .where(eq(organizationSubscriptions.organizationId, user.organizationId))
      .limit(1);

    const isTrialUser = orgSubscription?.status === 'trialing';

    return { isTrialUser };
  }
}

export const trialAchievementService = new TrialAchievementService();