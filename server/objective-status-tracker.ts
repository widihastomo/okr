import type { Objective, KeyResult, Cycle } from "@shared/schema";

export interface ObjectiveStatusResult {
  status: 'not_started' | 'on_track' | 'at_risk' | 'behind' | 'paused' | 'canceled' | 'completed' | 'partially_achieved' | 'not_achieved';
  reasoning: string;
  confidence: string;
}

export function calculateObjectiveStatus(
  objective: Objective,
  keyResults: KeyResult[],
  cycle: Cycle | null
): ObjectiveStatusResult {
  
  // Jika objective diset manual ke paused atau canceled
  if (objective.status === 'paused') {
    return {
      status: 'paused',
      reasoning: 'Objective dihentikan sementara',
      confidence: 'Misalnya karena prioritas lain, resource dipindah'
    };
  }
  
  if (objective.status === 'canceled') {
    return {
      status: 'canceled',
      reasoning: 'Objective dibatalkan permanen',
      confidence: 'Sudah diputuskan tidak lagi relevan'
    };
  }

  // Jika tidak ada key results
  if (keyResults.length === 0) {
    return {
      status: 'not_started',
      reasoning: 'Diawal cycle, belum ada progress sama sekali',
      confidence: 'Belum mulai aktivitas'
    };
  }

  // Hitung overall progress dari key results
  const totalProgress = keyResults.reduce((sum, kr) => {
    const progress = calculateKeyResultProgress(kr);
    return sum + progress;
  }, 0);
  
  const overallProgress = totalProgress / keyResults.length;

  // Hitung waktu yang berlalu dalam cycle
  const timeProgress = calculateTimeProgress(cycle);
  
  // Tentukan status berdasarkan progress dan waktu
  if (overallProgress >= 100) {
    return {
      status: 'completed',
      reasoning: 'Semua Key Results tercapai 100% sebelum atau setelah cycle berakhir',
      confidence: 'Objective sudah tuntas dengan sukses'
    };
  }

  // Jika cycle sudah selesai
  if (timeProgress >= 100) {
    if (overallProgress >= 50) {
      return {
        status: 'partially_achieved',
        reasoning: 'Cycle sudah selesai, sebagian KR tercapai (>50%)',
        confidence: 'Outcome tercapai sebagian, tetapi di-close'
      };
    } else {
      return {
        status: 'not_achieved',
        reasoning: 'Cycle sudah selesai, progress sangat rendah atau KR mayoritas tidak tercapai',
        confidence: 'Objective gagal di periode tersebut'
      };
    }
  }

  // Cycle masih berjalan - hitung gap antara progress dan timeline
  const gap = overallProgress - timeProgress;

  if (gap >= 0) {
    return {
      status: 'on_track',
      reasoning: 'Cycle masih berjalan, progress sesuai timeline & target',
      confidence: 'Confidence tinggi, tidak ada issue signifikan'
    };
  } else if (gap >= -20) {
    return {
      status: 'at_risk',
      reasoning: 'Cycle masih berjalan, ada risiko signifikan yang bisa menghambat tercapai',
      confidence: 'Butuh mitigasi / perhatian manajemen'
    };
  } else {
    return {
      status: 'behind',
      reasoning: 'Cycle masih berjalan, progress jauh di bawah target timeline',
      confidence: 'Confidence rendah, perlu intervensi besar'
    };
  }
}

function calculateKeyResultProgress(keyResult: KeyResult): number {
  const current = parseFloat(keyResult.currentValue) || 0;
  const target = parseFloat(keyResult.targetValue) || 0;
  const base = parseFloat(keyResult.baseValue || "0") || 0;

  let progressPercentage = 0;

  switch (keyResult.keyResultType) {
    case "increase_to":
      // Formula: (Current - Base) / (Target - Base) * 100%
      if (target <= base) {
        // Invalid configuration: target should be greater than base
        progressPercentage = 0;
      } else {
        progressPercentage = ((current - base) / (target - base)) * 100;
        progressPercentage = Math.min(100, Math.max(0, progressPercentage));
      }
      break;
    
    case "decrease_to":
      // Formula: (Base - Current) / (Base - Target) * 100%
      if (base <= target) {
        // Invalid configuration: base should be greater than target
        progressPercentage = 0;
      } else {
        progressPercentage = ((base - current) / (base - target)) * 100;
        progressPercentage = Math.min(100, Math.max(0, progressPercentage));
      }
      break;
    
    case "should_stay_above":
      // Binary: 100% if current >= target, 0% otherwise
      progressPercentage = current >= target ? 100 : 0;
      break;
    
    case "should_stay_below":
      // Binary: 100% if current <= target, 0% otherwise
      progressPercentage = current <= target ? 100 : 0;
      break;
    
    case "achieve_or_not":
      // Binary: 100% if current >= target, 0% otherwise
      progressPercentage = current >= target ? 100 : 0;
      break;
    
    default:
      // Fallback for unknown types
      progressPercentage = 0;
      break;
  }

  return Math.round(progressPercentage * 100) / 100; // Round to 2 decimal places
}

function calculateTimeProgress(cycle: Cycle | null): number {
  if (!cycle) return 0;
  
  const now = new Date();
  const startDate = new Date(cycle.startDate);
  const endDate = new Date(cycle.endDate);
  
  if (now < startDate) return 0;
  if (now > endDate) return 100;
  
  const totalTime = endDate.getTime() - startDate.getTime();
  const timePassed = now.getTime() - startDate.getTime();
  
  return (timePassed / totalTime) * 100;
}

export function getObjectiveStatusColor(status: string): string {
  switch (status) {
    case 'not_started':
      return 'bg-blue-500';
    case 'on_track':
      return 'bg-green-500';
    case 'at_risk':
      return 'bg-orange-500';
    case 'behind':
      return 'bg-red-500';
    case 'paused':
      return 'bg-yellow-500';
    case 'canceled':
      return 'bg-gray-500';
    case 'completed':
      return 'bg-purple-500';
    case 'partially_achieved':
      return 'bg-green-400';
    case 'not_achieved':
      return 'bg-red-600';
    default:
      return 'bg-gray-400';
  }
}

export function getObjectiveStatusLabel(status: string): string {
  switch (status) {
    case 'not_started':
      return 'Not Started';
    case 'on_track':
      return 'On Track';
    case 'at_risk':
      return 'At Risk';
    case 'behind':
      return 'Behind';
    case 'paused':
      return 'Paused';
    case 'canceled':
      return 'Canceled';
    case 'completed':
      return 'Completed';
    case 'partially_achieved':
      return 'Partially Achieved';
    case 'not_achieved':
      return 'Not Achieved';
    default:
      return 'Unknown';
  }
}