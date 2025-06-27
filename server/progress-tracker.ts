import type { KeyResult } from '@shared/schema';

export interface ProgressStatus {
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
  progressPercentage: number;
  timeProgressPercentage: number;
  recommendation: string;
}

export function calculateProgressStatus(
  keyResult: KeyResult,
  startDate: Date,
  endDate: Date
): ProgressStatus {
  const current = parseFloat(keyResult.currentValue);
  const target = parseFloat(keyResult.targetValue);
  const base = parseFloat(keyResult.baseValue || '0');
  
  // Calculate progress percentage based on key result type
  let progressPercentage = 0;
  
  switch (keyResult.keyResultType) {
    case 'increase_to':
      progressPercentage = base !== target 
        ? Math.max(0, Math.min(100, ((current - base) / (target - base)) * 100))
        : current >= target ? 100 : 0;
      break;
    case 'decrease_to':
      progressPercentage = base !== target
        ? Math.max(0, Math.min(100, ((base - current) / (base - target)) * 100))
        : current <= target ? 100 : 0;
      break;
    case 'achieve_or_not':
      progressPercentage = current >= target ? 100 : 0;
      break;
  }
  
  // Calculate time progress percentage
  const now = new Date();
  const totalTime = endDate.getTime() - startDate.getTime();
  const elapsedTime = now.getTime() - startDate.getTime();
  const timeProgressPercentage = Math.max(0, Math.min(100, (elapsedTime / totalTime) * 100));
  
  // Determine status based on ideal progress comparison
  let status: ProgressStatus['status'];
  let recommendation: string;
  
  if (progressPercentage >= 100) {
    status = 'completed';
    recommendation = 'Target tercapai 100%! Luar biasa!';
  } else if (progressPercentage >= timeProgressPercentage) {
    status = 'on_track';
    recommendation = 'Progress sesuai atau lebih baik dari capaian ideal hari ini.';
  } else if (progressPercentage >= timeProgressPercentage * 0.8) {
    status = 'at_risk';
    recommendation = 'Progress kurang dari 80% capaian ideal, perlu percepatan.';
  } else {
    status = 'behind';
    recommendation = 'Progress jauh tertinggal dari capaian ideal, butuh tindakan segera.';
  }
  
  return {
    status,
    progressPercentage: Math.round(progressPercentage),
    timeProgressPercentage: Math.round(timeProgressPercentage),
    recommendation
  };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'ahead':
      return 'bg-blue-500';
    case 'on_track':
      return 'bg-green-400';
    case 'at_risk':
      return 'bg-yellow-500';
    case 'behind':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'ahead':
      return 'Ahead';
    case 'on_track':
      return 'On track';
    case 'at_risk':
      return 'At risk';
    case 'behind':
      return 'Behind';
    default:
      return 'In progress';
  }
}