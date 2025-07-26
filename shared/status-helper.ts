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
  
  if (gap >= 10) return 'ahead';
  if (gap >= -10) return 'on_track';
  if (gap >= -25) return 'at_risk';
  return 'behind';
}

/**
 * Calculate dynamic status for key result based on current progress and timeline (STRICT VERSION)
 */
export function calculateKeyResultStatus(
  currentProgress: number,
  cycleStartDate: Date,
  cycleEndDate: Date
): { status: 'on_track' | 'at_risk' | 'off_track'; statusText: string } {
  const idealProgress = calculateIdealProgress(cycleStartDate, cycleEndDate);
  
  // STRICT logic: if below ideal target, immediately becomes at risk
  if (currentProgress >= 100) {
    return { status: 'on_track', statusText: 'On Track' };
  }
  
  if (currentProgress >= idealProgress) {
    return { status: 'on_track', statusText: 'On Track' };
  }
  
  const gap = idealProgress - currentProgress;
  
  // Strict thresholds based on how far behind ideal target
  // At Risk: 0-15% below ideal target
  // Off Track: >15% below ideal target
  if (gap <= 15) {
    return { status: 'at_risk', statusText: 'At Risk' };
  }
  
  return { status: 'off_track', statusText: 'Off Track' };
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