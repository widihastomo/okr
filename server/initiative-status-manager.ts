import { db } from './db';
import { initiatives, tasks, successMetricUpdates, initiativeSuccessMetrics } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface InitiativeStatusUpdate {
  id: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
}

export interface InitiativeClosureData {
  finalResult: 'berhasil' | 'tidak_berhasil' | 'ulangi';
  learningInsights: string;
  closureNotes: string;
  budgetUsed?: number;
  attachmentUrls?: string[];
  finalMetrics: Array<{
    metricId: string;
    finalAchievement: string;
  }>;
}

/**
 * Calculates the appropriate status for an initiative based on its tasks and metrics
 */
export function calculateInitiativeStatus(
  currentStatus: string,
  tasks: any[],
  successMetrics: any[]
): string {
  // If already closed (selesai/dibatalkan), don't change
  if (currentStatus === 'selesai' || currentStatus === 'dibatalkan') {
    return currentStatus;
  }

  // Check if any task is in progress or completed
  const hasRunningTasks = tasks.some(task => 
    task.status === 'in_progress' || task.status === 'completed'
  );

  // Check if any success metric has been updated (not default value)
  const hasMetricUpdates = successMetrics.some(metric => 
    metric.achievement !== '0' && metric.achievement !== ''
  );

  // Determine status based on activity
  if (hasRunningTasks || hasMetricUpdates) {
    return 'sedang_berjalan';
  }

  // If tasks and metrics exist but none are active, keep as draft
  if (tasks.length > 0 || successMetrics.length > 0) {
    return 'draft';
  }

  // Default to draft
  return 'draft';
}

/**
 * Updates initiative status automatically based on task and metric activity
 */
export async function updateInitiativeStatus(initiativeId: string): Promise<InitiativeStatusUpdate | null> {
  try {
    // Get current initiative
    const initiative = await db.query.initiatives.findFirst({
      where: eq(initiatives.id, initiativeId),
    });

    if (!initiative) {
      throw new Error('Initiative not found');
    }

    // Skip if already closed
    if (initiative.status === 'selesai' || initiative.status === 'dibatalkan') {
      return null;
    }

    // Get related tasks
    const initiativeTasks = await db.query.tasks.findMany({
      where: eq(tasks.initiativeId, initiativeId),
    });

    // Get success metrics
    const metrics = await db.query.initiativeSuccessMetrics.findMany({
      where: eq(initiatives.id, initiativeId),
    });

    // Calculate new status
    const newStatus = calculateInitiativeStatus(initiative.status, initiativeTasks, metrics);

    // Update if status changed
    if (newStatus !== initiative.status) {
      await db
        .update(initiatives)
        .set({ 
          status: newStatus,
          updatedAt: new Date()
        })
        .where(eq(initiatives.id, initiativeId));

      return {
        id: initiativeId,
        oldStatus: initiative.status,
        newStatus,
        reason: getStatusChangeReason(initiative.status, newStatus, initiativeTasks, metrics)
      };
    }

    return null;
  } catch (error) {
    console.error('Error updating initiative status:', error);
    return null;
  }
}

/**
 * Close an initiative with completion data
 */
export async function closeInitiative(
  initiativeId: string,
  closureData: InitiativeClosureData,
  closedBy: string
): Promise<void> {
  try {
    // Update final metrics first
    for (const metric of closureData.finalMetrics) {
      // Update the metric's achievement value
      await db
        .update(initiativeSuccessMetrics)
        .set({ 
          achievement: metric.finalAchievement,
          updatedAt: new Date()
        })
        .where(eq(initiativeSuccessMetrics.id, metric.metricId));

      // Create an update record
      await db.insert(successMetricUpdates).values({
        metricId: metric.metricId,
        achievement: metric.finalAchievement,
        notes: 'Final achievement update during initiative closure',
        createdBy: closedBy
      });
    }

    // Update initiative with closure data
    await db
      .update(initiatives)
      .set({
        status: 'selesai',
        finalResult: closureData.finalResult,
        learningInsights: closureData.learningInsights,
        closureNotes: closureData.closureNotes,
        budgetUsed: closureData.budgetUsed,
        attachmentUrls: closureData.attachmentUrls || [],
        closedBy: closedBy,
        closedAt: new Date(),
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(initiatives.id, initiativeId));

  } catch (error) {
    console.error('Error closing initiative:', error);
    throw error;
  }
}

/**
 * Cancel an initiative
 */
export async function cancelInitiative(
  initiativeId: string,
  cancelReason: string,
  cancelledBy: string
): Promise<void> {
  try {
    await db
      .update(initiatives)
      .set({
        status: 'dibatalkan',
        closureNotes: cancelReason,
        closedBy: cancelledBy,
        closedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(initiatives.id, initiativeId));

  } catch (error) {
    console.error('Error cancelling initiative:', error);
    throw error;
  }
}

/**
 * Get status change reason for logging
 */
function getStatusChangeReason(
  oldStatus: string,
  newStatus: string,
  tasks: any[],
  metrics: any[]
): string {
  if (oldStatus === 'draft' && newStatus === 'sedang_berjalan') {
    const hasRunningTasks = tasks.some(t => t.status === 'in_progress');
    const hasMetricUpdates = metrics.some(m => m.achievement !== '0');
    
    if (hasRunningTasks && hasMetricUpdates) {
      return 'Task started and metrics updated';
    } else if (hasRunningTasks) {
      return 'At least one task started';
    } else if (hasMetricUpdates) {
      return 'Success metrics updated';
    }
  }
  
  return `Status changed from ${oldStatus} to ${newStatus}`;
}

/**
 * Get status display information
 */
export function getInitiativeStatusInfo(status: string) {
  const statusMap = {
    'draft': {
      label: 'Draft',
      description: 'Inisiatif dan task sudah dibuat, belum ada yang berjalan',
      color: 'gray',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-200'
    },
    'sedang_berjalan': {
      label: 'On Progress',
      description: 'Minimal 1 task dimulai atau metrik diupdate',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200'
    },
    'selesai': {
      label: 'Selesai',
      description: 'Inisiatif telah diselesaikan',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200'
    },
    'dibatalkan': {
      label: 'Dibatalkan',
      description: 'Inisiatif dibatalkan sebelum selesai',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200'
    }
  };

  return statusMap[status as keyof typeof statusMap] || statusMap['draft'];
}

/**
 * Check if initiative can be edited based on status
 */
export function canEditInitiative(status: string): boolean {
  return status === 'draft' || status === 'sedang_berjalan';
}

/**
 * Check if initiative can be closed based on status
 */
export function canCloseInitiative(status: string): boolean {
  return status === 'sedang_berjalan';
}

/**
 * Check if initiative can be cancelled based on status
 */
export function canCancelInitiative(status: string): boolean {
  return status === 'draft' || status === 'sedang_berjalan';
}