import { storage } from "./storage";

/**
 * Check for initiatives that are approaching deadline or overdue
 * and send notifications to the responsible users
 */
export async function checkInitiativeDeadlines(): Promise<void> {
  try {
    // Skip deadline checks in development environment to avoid SSL issues
    if (process.env.NODE_ENV !== 'production') {
      console.log("ℹ️ Skipping initiative deadline checks in development environment");
      return;
    }
    
    console.log("🔔 Checking initiative deadlines...");
    
    // Get current date in GMT+7 (WIB - Waktu Indonesia Barat)
    const now = new Date();
    const gmt7Offset = 7 * 60 * 60 * 1000; // GMT+7 in milliseconds
    const currentDate = new Date(now.getTime() + gmt7Offset);
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    // Calculate dates for checking
    const twoDaysFromNow = new Date(currentDateOnly);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    // Get all active initiatives (not closed or cancelled)
    const initiatives = await storage.getInitiatives();
    const activeInitiatives = initiatives.filter((initiative: any) => 
      initiative.status === 'draft' || initiative.status === 'sedang_berjalan'
    );

    let notificationsSent = 0;

    for (const initiative of activeInitiatives) {
      if (!initiative.dueDate) continue;

      const dueDate = new Date(initiative.dueDate);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

      // Check if initiative is overdue (due date has passed)
      if (dueDateOnly < currentDateOnly) {
        await sendOverdueNotification(initiative);
        notificationsSent++;
      }
      // Check if initiative deadline is approaching (2 days from now)
      else if (dueDateOnly.getTime() === twoDaysFromNow.getTime()) {
        await sendApproachingDeadlineNotification(initiative);
        notificationsSent++;
      }
    }

    console.log(`📨 Initiative deadline check completed. Sent ${notificationsSent} notifications.`);
  } catch (error) {
    console.error("❌ Error checking initiative deadlines:", error);
  }
}

/**
 * Send notification for overdue initiative
 */
async function sendOverdueNotification(initiative: any): Promise<void> {
  try {
    // Get initiative members to notify
    const members = await storage.getInitiativeMembers(initiative.id);
    
    for (const member of members) {
      // Get user's organization ID
      const user = await storage.getUser(member.userId);
      if (!user) continue;
      
      await storage.createNotification({
        userId: member.userId,
        organizationId: user.organizationId,
        type: 'initiative_overdue',
        title: 'Inisiatif Melewati Deadline',
        message: `Inisiatif "${initiative.title}" sudah melewati tanggal deadline. Pertimbangkan untuk menutup atau memperpanjang inisiatif ini.`,
        entityType: 'initiative',
        entityId: initiative.id,
        entityTitle: initiative.title,
        actorId: null, // System notification
        isRead: false
      });
    }

    console.log(`📬 Sent overdue notifications for initiative: ${initiative.title}`);
  } catch (error) {
    console.error(`❌ Error sending overdue notification for initiative ${initiative.id}:`, error);
  }
}

/**
 * Send notification for initiative deadline approaching
 */
async function sendApproachingDeadlineNotification(initiative: any): Promise<void> {
  try {
    // Get initiative members to notify
    const members = await storage.getInitiativeMembers(initiative.id);
    
    for (const member of members) {
      // Get user's organization ID
      const user = await storage.getUser(member.userId);
      if (!user) continue;
      
      await storage.createNotification({
        userId: member.userId,
        organizationId: user.organizationId,
        type: 'initiative_deadline',
        title: 'Deadline Inisiatif Mendekat',
        message: `Inisiatif "${initiative.title}" akan berakhir dalam 2 hari. Pastikan semua tugas dan target sudah selesai.`,
        entityType: 'initiative',
        entityId: initiative.id,
        entityTitle: initiative.title,
        actorId: null, // System notification
        isRead: false
      });
    }

    console.log(`📬 Sent approaching deadline notifications for initiative: ${initiative.title}`);
  } catch (error) {
    console.error(`❌ Error sending approaching deadline notification for initiative ${initiative.id}:`, error);
  }
}

/**
 * Schedule initiative deadline checking to run daily
 */
export function scheduleInitiativeDeadlineChecks(): void {
  // Run immediately on startup
  checkInitiativeDeadlines();
  
  // Schedule to run every 24 hours
  setInterval(() => {
    checkInitiativeDeadlines();
  }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

  console.log("⏰ Initiative deadline checker scheduled to run every 24 hours");
}