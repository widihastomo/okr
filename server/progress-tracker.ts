import type { KeyResult } from '@shared/schema';

export interface ProgressStatus {
  status: 'on_track' | 'at_risk' | 'behind' | 'completed' | 'ahead';
  progressPercentage: number;
  timeProgressPercentage: number;
  recommendation: string;
}

function calculate_progress_status(progress: number, time_passed: number, total_time: number) {
  const ideal_progress = (time_passed / total_time) * 100;
  const gap = progress - ideal_progress;
  
  let status: string;
  
  if (progress >= 100) {
    status = "Completed";
  } else if (gap >= 0) {
    status = "Ahead";
  } else if (-0 <= gap && gap < 0) {
    status = "On Track";
  } else if (-20 <= gap && gap < -0) {
    status = "At Risk";
  } else {
    status = "Behind";
  }
  
  return { idealProgress: ideal_progress, gap: gap, status: status };
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
  
  // Calculate time progress using the provided formula
  const now = new Date();
  const totalTime = endDate.getTime() - startDate.getTime();
  const elapsedTime = now.getTime() - startDate.getTime();
  
  // Use the exact formula from the image
  const statusResult = calculate_progress_status(progressPercentage, elapsedTime, totalTime);
  const timeProgressPercentage = Math.round(statusResult.idealProgress);
  
  // Map status to our system values and set recommendations
  let status: ProgressStatus['status'];
  let recommendation: string;
  
  switch (statusResult.status) {
    case "Completed":
      status = 'completed';
      recommendation = 'Target tercapai 100%! Luar biasa!';
      break;
    case "Ahead":
      status = 'ahead';
      recommendation = `Progress lebih cepat ${Math.round(statusResult.gap)}% dari jadwal ideal!`;
      break;
    case "On Track":
      status = 'on_track';
      recommendation = 'Progress sesuai dengan capaian ideal hari ini.';
      break;
    case "At Risk":
      status = 'at_risk';
      recommendation = `Progress tertinggal ${Math.round(Math.abs(statusResult.gap))}% dari ideal, perlu percepatan.`;
      break;
    case "Behind":
      status = 'behind';
      recommendation = `Progress tertinggal ${Math.round(Math.abs(statusResult.gap))}% dari ideal, butuh tindakan segera.`;
      break;
    default:
      status = 'on_track';
      recommendation = 'Progress dalam tahap normal.';
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