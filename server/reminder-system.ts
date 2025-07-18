import { db } from './db';
import { users, objectives, keyResults, tasks, notifications } from '@shared/schema';
import { eq, and, lte, gte, isNull, isNotNull } from 'drizzle-orm';
import { NotificationService } from './notification-service';

export interface ReminderConfig {
  userId: string;
  cadence: 'harian' | 'mingguan' | 'bulanan';
  reminderTime: string; // Format: "HH:MM"
  reminderDay?: string; // For weekly reminders (1-7, Monday = 1)
  reminderDate?: string; // For monthly reminders (1-31)
  isActive: boolean;
  objectiveId?: string;
  teamFocus?: string;
  activeDays?: string[]; // Array of day names: ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']
  notificationTypes?: {
    updateOverdue: boolean;
    taskOverdue: boolean;
    initiativeOverdue: boolean;
    chatMention: boolean;
  };
}

export class ReminderSystem {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Save reminder configuration from onboarding
   */
  async saveReminderConfig(config: ReminderConfig): Promise<void> {
    try {
      // Store reminder config in user's metadata or separate table
      // For now, we'll use a simple approach and store in user table
      await db.update(users)
        .set({
          reminderConfig: config  // Store as object, not JSON string
        })
        .where(eq(users.id, config.userId));

      console.log(`✅ Reminder config saved for user ${config.userId}:`, config);
    } catch (error) {
      console.error('❌ Error saving reminder config:', error);
      throw error;
    }
  }

  /**
   * Get reminder configuration for a user
   */
  async getReminderConfig(userId: string): Promise<ReminderConfig | null> {
    try {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user || !user.reminderConfig) {
        return null;
      }

      // Handle both object and JSON string formats for backward compatibility
      if (typeof user.reminderConfig === 'string') {
        try {
          return JSON.parse(user.reminderConfig) as ReminderConfig;
        } catch (parseError) {
          console.error('❌ Error parsing reminder config JSON:', parseError);
          return null;
        }
      } else if (typeof user.reminderConfig === 'object' && user.reminderConfig !== null) {
        return user.reminderConfig as ReminderConfig;
      } else {
        console.warn('⚠️ Invalid reminder config format');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting reminder config:', error);
      return null;
    }
  }

  /**
   * Check if it's time to send a reminder
   */
  shouldSendReminder(config: ReminderConfig): boolean {
    if (!config.isActive) return false;

    const now = new Date();
    const [hours, minutes] = config.reminderTime.split(':').map(Number);
    
    // Check if current time matches reminder time (within 5 minutes)
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeMatch = currentHour === hours && Math.abs(currentMinute - minutes) <= 5;

    if (!timeMatch) return false;

    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const todayName = dayNames[dayOfWeek];

    switch (config.cadence) {
      case 'harian':
        // For daily reminders, check activeDays filter
        if (config.activeDays && config.activeDays.length > 0) {
          return config.activeDays.includes(todayName);
        }
        return true; // Send daily if no activeDays specified

      case 'mingguan':
        // For weekly reminders, check specific day (reminderDay takes precedence over activeDays)
        if (config.reminderDay) {
          // Use specific day from reminderDay setting
          const targetDay = parseInt(config.reminderDay);
          const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday to 7
          return adjustedDay === targetDay;
        } else if (config.activeDays && config.activeDays.length > 0) {
          // If no specific day set, use first day from activeDays
          const firstActiveDay = config.activeDays[0];
          return todayName === firstActiveDay;
        }
        return dayOfWeek === 1; // Default to Monday

      case 'bulanan':
        // For monthly reminders, check specific date (reminderDate takes precedence)
        const dateOfMonth = now.getDate();
        if (config.reminderDate) {
          const targetDate = parseInt(config.reminderDate);
          return dateOfMonth === targetDate;
        } else {
          // If no specific date, use 1st of month but also check activeDays
          if (dateOfMonth === 1) {
            if (config.activeDays && config.activeDays.length > 0) {
              return config.activeDays.includes(todayName);
            }
            return true;
          }
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Send reminder notification to user
   */
  async sendReminderNotification(userId: string, config: ReminderConfig): Promise<void> {
    try {
      // Get user's current objectives and tasks
      const userObjectives = await db.select()
        .from(objectives)
        .where(eq(objectives.ownerId, userId));

      const userTasks = await db.select()
        .from(tasks)
        .where(and(
          eq(tasks.createdBy, userId),
          isNull(tasks.completedAt)
        ));

      // Create reminder message based on cadence
      let title = '';
      let message = '';

      switch (config.cadence) {
        case 'harian':
          title = '🌅 Reminder Harian - Update Progress';
          message = `Waktu untuk update progress harian Anda! Anda memiliki ${userObjectives.length} objective dan ${userTasks.length} task yang perlu diperhatikan.`;
          break;

        case 'mingguan':
          title = '📅 Reminder Mingguan - Review Progress';
          message = `Saatnya review progress mingguan! Periksa pencapaian objective dan selesaikan task yang tertunda.`;
          break;

        case 'bulanan':
          title = '📊 Reminder Bulanan - Evaluasi Goals';
          message = `Waktu evaluasi bulanan! Tinjau pencapaian goals, update metrics, dan rencanakan strategi bulan depan.`;
          break;
      }

      // Add focus area context
      if (config.teamFocus) {
        const focusMap = {
          'penjualan': 'Penjualan',
          'operasional': 'Operasional',
          'customer_service': 'Customer Service',
          'marketing': 'Marketing'
        };
        const focusName = focusMap[config.teamFocus as keyof typeof focusMap] || config.teamFocus;
        message += ` Fokus area: ${focusName}.`;
      }

      // Send notification
      await this.notificationService.createNotification({
        userId,
        title,
        message,
        type: 'reminder',
        priority: 'medium',
        data: {
          cadence: config.cadence,
          objectiveCount: userObjectives.length,
          taskCount: userTasks.length,
          reminderTime: config.reminderTime
        }
      });

      console.log(`✅ Reminder sent to user ${userId} - ${config.cadence} reminder`);
    } catch (error) {
      console.error('❌ Error sending reminder notification:', error);
      throw error;
    }
  }

  /**
   * Process all active reminders
   */
  async processReminders(): Promise<void> {
    // Reminder processing is disabled to prevent looping
    console.log('🔇 Reminder processing is disabled');
    return;
  }

  /**
   * Start reminder scheduler (runs every minute)
   */
  startReminderScheduler(): void {
    // Reminder scheduler is disabled to prevent looping
    console.log('🔇 Reminder scheduler is disabled');
    return;
  }

  /**
   * Update reminder config for a user
   */
  async updateReminderConfig(userId: string, updates: Partial<ReminderConfig>): Promise<void> {
    try {
      const currentConfig = await this.getReminderConfig(userId);
      
      if (!currentConfig) {
        throw new Error('No reminder config found for user');
      }

      const updatedConfig = { ...currentConfig, ...updates };
      await this.saveReminderConfig(updatedConfig);

      console.log(`✅ Reminder config updated for user ${userId}`);
    } catch (error) {
      console.error('❌ Error updating reminder config:', error);
      throw error;
    }
  }

  /**
   * Disable reminders for a user
   */
  async disableReminders(userId: string): Promise<void> {
    try {
      await this.updateReminderConfig(userId, { isActive: false });
      console.log(`✅ Reminders disabled for user ${userId}`);
    } catch (error) {
      console.error('❌ Error disabling reminders:', error);
      throw error;
    }
  }

  /**
   * Enable reminders for a user
   */
  async enableReminders(userId: string): Promise<void> {
    try {
      await this.updateReminderConfig(userId, { isActive: true });
      console.log(`✅ Reminders enabled for user ${userId}`);
    } catch (error) {
      console.error('❌ Error enabling reminders:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const reminderSystem = new ReminderSystem();