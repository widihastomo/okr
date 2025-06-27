import type { KeyResult } from '@shared/schema';

export interface ProgressStatus {
  status: 'on_track' | 'at_risk' | 'behind' | 'completed' | 'ahead';
  progressPercentage: number;
  timeProgressPercentage: number;
  recommendation: string;
}

function calculate_progress_status(progress: number, time_passed: number, total_time: number) {
  let idealProgress: number, gap: number, status: string;

  if (time_passed >= total_time) {
    // Lewat cycle
    idealProgress = 100;
    gap = progress - idealProgress;

    if (progress >= 100) {
      status = "completed";
    } else {
      status = "behind";
    }
  } else {
    // Dalam cycle
    idealProgress = (time_passed / total_time) * 100;
    gap = progress - idealProgress;

    if (progress >= 100) {
      status = "completed";
    } else if (gap >= 5) {
      status = "ahead";
    } else if (gap >= -5 && gap < 5) {
      status = "on_track";
    } else if (gap >= -20 && gap < -5) {
      status = "at_risk";
    } else {
      status = "behind";
    }
  }

  return {
    idealProgress: Number(idealProgress.toFixed(2)),
    gap: Number(gap.toFixed(2)),
    status: status
  };
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
  
  // Use the exact formula from the user
  const statusResult = calculate_progress_status(progressPercentage, elapsedTime, totalTime);
  const timeProgressPercentage = statusResult.idealProgress;
  
  // Generate recommendation based on status and gap
  let recommendation: string;
  
  if (elapsedTime >= totalTime) {
    // Cycle telah berakhir
    if (progressPercentage >= 100) {
      recommendation = 'Selamat! Key result telah selesai tepat waktu.';
    } else {
      recommendation = `Cycle telah berakhir namun progress baru ${progressPercentage.toFixed(1)}%. Perlu evaluasi dan perencanaan ulang.`;
    }
  } else {
    // Masih dalam cycle
    if (progressPercentage >= 100) {
      recommendation = 'Selamat! Key result telah selesai sebelum deadline.';
    } else if (statusResult.gap >= 5) {
      recommendation = `Kerja bagus! Anda ${statusResult.gap.toFixed(1)}% lebih cepat dari target ideal.`;
    } else if (statusResult.gap >= -5 && statusResult.gap < 5) {
      recommendation = `Sesuai target. Gap: ${statusResult.gap.toFixed(1)}%. Pertahankan momentum ini.`;
    } else if (statusResult.gap >= -20 && statusResult.gap < -5) {
      recommendation = `Perlu perhatian. Anda ${Math.abs(statusResult.gap).toFixed(1)}% di bawah target ideal. Pertimbangkan tindakan korektif.`;
    } else {
      recommendation = `Tertinggal ${Math.abs(statusResult.gap).toFixed(1)}% dari target ideal. Butuh tindakan segera.`;
    }
  }
  
  return {
    status: statusResult.status as ProgressStatus['status'],
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