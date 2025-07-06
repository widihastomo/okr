import { storage } from "./storage";
import { type InsertNotification } from "@shared/schema";

export class NotificationService {
  // Task notifications
  static async notifyTaskCreated(taskId: string, taskTitle: string, assignedToId: string, createdById: string, organizationId: string) {
    if (assignedToId && assignedToId !== createdById) {
      await storage.createNotification({
        userId: assignedToId,
        organizationId,
        type: 'task_created',
        title: 'Task Baru Ditugaskan',
        message: `Anda ditugaskan untuk task "${taskTitle}"`,
        entityType: 'task',
        entityId: taskId,
        entityTitle: taskTitle,
        actorId: createdById,
        isRead: false,
      });
    }
  }

  static async notifyTaskStatusChanged(taskId: string, taskTitle: string, oldStatus: string, newStatus: string, assignedToId: string, changedById: string, organizationId: string) {
    if (assignedToId && assignedToId !== changedById) {
      const statusMap: Record<string, string> = {
        todo: 'Belum Mulai',
        in_progress: 'Sedang Berjalan',
        completed: 'Selesai',
      };

      await storage.createNotification({
        userId: assignedToId,
        organizationId,
        type: 'task_status_changed',
        title: 'Status Task Diperbarui',
        message: `Status task "${taskTitle}" diubah menjadi ${statusMap[newStatus] || newStatus}`,
        entityType: 'task',
        entityId: taskId,
        entityTitle: taskTitle,
        actorId: changedById,
        isRead: false,
        metadata: { oldStatus, newStatus },
      });
    }
  }

  static async notifyTaskDueDateChanged(taskId: string, taskTitle: string, newDueDate: string, assignedToId: string, changedById: string, organizationId: string) {
    if (assignedToId && assignedToId !== changedById) {
      await storage.createNotification({
        userId: assignedToId,
        organizationId,
        type: 'task_due_date_changed',
        title: 'Due Date Task Diperbarui',
        message: `Due date task "${taskTitle}" telah diperbarui`,
        entityType: 'task',
        entityId: taskId,
        entityTitle: taskTitle,
        actorId: changedById,
        isRead: false,
        metadata: { newDueDate },
      });
    }
  }

  // Comment notifications
  static async notifyCommentAdded(taskId: string, taskTitle: string, assignedToId: string, commentedById: string, organizationId: string) {
    if (assignedToId && assignedToId !== commentedById) {
      await storage.createNotification({
        userId: assignedToId,
        organizationId,
        type: 'comment_added',
        title: 'Komentar Baru',
        message: `Komentar baru ditambahkan pada task "${taskTitle}"`,
        entityType: 'task',
        entityId: taskId,
        entityTitle: taskTitle,
        actorId: commentedById,
        isRead: false,
      });
    }
  }

  static async notifyUserMentioned(taskId: string, taskTitle: string, mentionedUserId: string, commentedById: string, organizationId: string) {
    if (mentionedUserId !== commentedById) {
      await storage.createNotification({
        userId: mentionedUserId,
        organizationId,
        type: 'user_mentioned',
        title: 'Anda Disebutkan',
        message: `Anda disebutkan dalam komentar task "${taskTitle}"`,
        entityType: 'task',
        entityId: taskId,
        entityTitle: taskTitle,
        actorId: commentedById,
        isRead: false,
      });
    }
  }

  // Objective notifications
  static async notifyObjectiveCreated(objectiveId: string, objectiveTitle: string, assignedToId: string, createdById: string, organizationId: string) {
    if (assignedToId && assignedToId !== createdById) {
      await storage.createNotification({
        userId: assignedToId,
        organizationId,
        type: 'objective_created',
        title: 'Objective Baru Ditugaskan',
        message: `Anda ditugaskan untuk objective "${objectiveTitle}"`,
        entityType: 'objective',
        entityId: objectiveId,
        entityTitle: objectiveTitle,
        actorId: createdById,
        isRead: false,
      });
    }
  }

  static async notifyObjectiveStatusChanged(objectiveId: string, objectiveTitle: string, oldStatus: string, newStatus: string, assignedToId: string, changedById: string, organizationId: string) {
    if (assignedToId && assignedToId !== changedById) {
      const statusMap: Record<string, string> = {
        on_track: 'Sesuai Target',
        at_risk: 'Berisiko',
        behind: 'Tertinggal',
        completed: 'Selesai',
        in_progress: 'Sedang Berjalan',
        not_started: 'Belum Mulai',
      };

      await storage.createNotification({
        userId: assignedToId,
        organizationId,
        type: 'objective_status_changed',
        title: 'Status Objective Diperbarui',
        message: `Status objective "${objectiveTitle}" diubah menjadi ${statusMap[newStatus] || newStatus}`,
        entityType: 'objective',
        entityId: objectiveId,
        entityTitle: objectiveTitle,
        actorId: changedById,
        isRead: false,
        metadata: { oldStatus, newStatus },
      });
    }
  }

  // Key Result notifications
  static async notifyKeyResultUpdated(keyResultId: string, keyResultTitle: string, assignedToId: string, updatedById: string, organizationId: string, progress?: number) {
    if (assignedToId && assignedToId !== updatedById) {
      await storage.createNotification({
        userId: assignedToId,
        organizationId,
        type: 'key_result_updated',
        title: 'Angka Target Diperbarui',
        message: `Progress angka target "${keyResultTitle}" telah diperbarui${progress ? ` (${Math.round(progress)}%)` : ''}`,
        entityType: 'key_result',
        entityId: keyResultId,
        entityTitle: keyResultTitle,
        actorId: updatedById,
        isRead: false,
        metadata: { progress },
      });
    }
  }

  // Initiative notifications
  static async notifyInitiativeCreated(initiativeId: string, initiativeTitle: string, assignedToId: string, createdById: string, organizationId: string) {
    if (assignedToId && assignedToId !== createdById) {
      await storage.createNotification({
        userId: assignedToId,
        organizationId,
        type: 'initiative_created',
        title: 'Inisiatif Baru Ditugaskan',
        message: `Anda ditugaskan untuk inisiatif "${initiativeTitle}"`,
        entityType: 'initiative',
        entityId: initiativeId,
        entityTitle: initiativeTitle,
        actorId: createdById,
        isRead: false,
      });
    }
  }

  static async notifyInitiativeStatusChanged(initiativeId: string, initiativeTitle: string, oldStatus: string, newStatus: string, assignedToId: string, changedById: string, organizationId: string) {
    if (assignedToId && assignedToId !== changedById) {
      const statusMap: Record<string, string> = {
        draft: 'Draft',
        sedang_berjalan: 'Sedang Berjalan',
        selesai: 'Selesai',
        dibatalkan: 'Dibatalkan',
      };

      await storage.createNotification({
        userId: assignedToId,
        organizationId,
        type: 'initiative_status_changed',
        title: 'Status Inisiatif Diperbarui',
        message: `Status inisiatif "${initiativeTitle}" diubah menjadi ${statusMap[newStatus] || newStatus}`,
        entityType: 'initiative',
        entityId: initiativeId,
        entityTitle: initiativeTitle,
        actorId: changedById,
        isRead: false,
        metadata: { oldStatus, newStatus },
      });
    }
  }

  // Team notifications
  static async notifyAddedToTeam(teamId: string, teamName: string, userId: string, addedById: string, organizationId: string) {
    if (userId !== addedById) {
      await storage.createNotification({
        userId,
        organizationId,
        type: 'added_to_team',
        title: 'Ditambahkan ke Tim',
        message: `Anda telah ditambahkan ke tim "${teamName}"`,
        entityType: 'team',
        entityId: teamId,
        entityTitle: teamName,
        actorId: addedById,
        isRead: false,
      });
    }
  }

  static async notifyRoleChanged(teamId: string, teamName: string, userId: string, newRole: string, changedById: string, organizationId: string) {
    if (userId !== changedById) {
      const roleMap: Record<string, string> = {
        lead: 'Lead',
        member: 'Member',
        contributor: 'Contributor',
      };

      await storage.createNotification({
        userId,
        organizationId,
        type: 'role_changed',
        title: 'Role Tim Diperbarui',
        message: `Role Anda di tim "${teamName}" diubah menjadi ${roleMap[newRole] || newRole}`,
        entityType: 'team',
        entityId: teamId,
        entityTitle: teamName,
        actorId: changedById,
        isRead: false,
        metadata: { newRole },
      });
    }
  }
}