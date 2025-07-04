/**
 * Helper functions for determining status based on progress and timeline
 */

export type ProgressStatus = 'on_track' | 'at_risk' | 'behind' | 'completed' | 'ahead';

/**
 * Calculate ideal progress based on timeline
 */
export function calculateIdealProgress(startDate: Date, endDate: Date): number {
  const now = new Date();
  const totalTime = endDate.getTime() - startDate.getTime();
  const elapsedTime = now.getTime() - startDate.getTime();
  
  if (elapsedTime <= 0) return 0;
  if (elapsedTime >= totalTime) return 100;
  
  return (elapsedTime / totalTime) * 100;
}

/**
 * Determine status based on progress percentage and ideal progress
 */
export function getProgressStatus(progressPercentage: number, idealProgress: number): ProgressStatus {
  if (progressPercentage >= 100) return 'completed';
  
  const gap = progressPercentage - idealProgress;
  
  if (gap >= 5) return 'ahead';
  if (gap >= -5) return 'on_track';
  if (gap >= -20) return 'at_risk';
  return 'behind';
}

/**
 * Get status color class for progress bars
 */
export function getStatusColor(status: ProgressStatus): string {
  switch (status) {
    case 'on_track':
      return 'bg-green-500';
    case 'at_risk':
      return 'bg-orange-500';
    case 'behind':
      return 'bg-red-500';
    case 'completed':
      return 'bg-green-600';
    case 'ahead':
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
}