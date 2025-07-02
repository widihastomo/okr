/**
 * Unified progress calculation logic for Key Results
 * This ensures consistent calculations across frontend and backend
 */

export interface ProgressCalculationResult {
  progressPercentage: number;
  isCompleted: boolean;
  isValid: boolean;
}

/**
 * Calculate progress for all Key Result types
 * @param currentValue Current value as string
 * @param targetValue Target value as string  
 * @param keyResultType Type of key result calculation
 * @param baseValue Base value as string (optional)
 * @returns Progress calculation result
 */
export function calculateKeyResultProgress(
  currentValue: string,
  targetValue: string,
  keyResultType: string,
  baseValue?: string | null
): ProgressCalculationResult {
  const current = parseFloat(currentValue) || 0;
  const target = parseFloat(targetValue) || 0;
  const base = parseFloat(baseValue || "0") || 0;

  let progressPercentage = 0;
  let isCompleted = false;
  let isValid = true;

  switch (keyResultType) {
    case "increase_to":
      // Formula: (Current - Base) / (Target - Base) * 100%
      if (target <= base) {
        // Invalid configuration: target should be greater than base
        isValid = false;
        progressPercentage = 0;
      } else {
        progressPercentage = ((current - base) / (target - base)) * 100;
        progressPercentage = Math.min(100, Math.max(0, progressPercentage));
        isCompleted = current >= target;
      }
      break;

    case "decrease_to":
      // Formula: (Base - Current) / (Base - Target) * 100%
      if (base <= target) {
        // Invalid configuration: base should be greater than target
        isValid = false;
        progressPercentage = 0;
      } else {
        progressPercentage = ((base - current) / (base - target)) * 100;
        progressPercentage = Math.min(100, Math.max(0, progressPercentage));
        isCompleted = current <= target;
      }
      break;

    case "should_stay_above":
      // Binary: 100% if current >= target, 0% otherwise
      progressPercentage = current >= target ? 100 : 0;
      isCompleted = current >= target;
      break;

    case "should_stay_below":
      // Binary: 100% if current <= target, 0% otherwise
      progressPercentage = current <= target ? 100 : 0;
      isCompleted = current <= target;
      break;

    case "achieve_or_not":
      // Binary: 100% if current >= target, 0% otherwise
      progressPercentage = current >= target ? 100 : 0;
      isCompleted = current >= target;
      break;

    default:
      // Fallback for unknown types
      isValid = false;
      progressPercentage = 0;
      break;
  }

  return {
    progressPercentage: Math.round(progressPercentage * 100) / 100, // Round to 2 decimal places
    isCompleted,
    isValid
  };
}

/**
 * Get human-readable description of calculation method
 */
export function getCalculationMethodDescription(keyResultType: string): string {
  switch (keyResultType) {
    case "increase_to":
      return "Progress = (Nilai Saat Ini - Nilai Awal) / (Target - Nilai Awal) × 100%";
    case "decrease_to":
      return "Progress = (Nilai Awal - Nilai Saat Ini) / (Nilai Awal - Target) × 100%";
    case "should_stay_above":
      return "Progress = 100% jika Nilai Saat Ini ≥ Target, 0% jika sebaliknya";
    case "should_stay_below":
      return "Progress = 100% jika Nilai Saat Ini ≤ Target, 0% jika sebaliknya";
    case "achieve_or_not":
      return "Progress = 100% jika tercapai, 0% jika belum tercapai";
    default:
      return "Metode perhitungan tidak dikenal";
  }
}

/**
 * Validate key result configuration
 */
export function validateKeyResultConfig(
  targetValue: string,
  keyResultType: string,
  baseValue?: string | null
): { isValid: boolean; error?: string } {
  const target = parseFloat(targetValue) || 0;
  const base = parseFloat(baseValue || "0") || 0;

  switch (keyResultType) {
    case "increase_to":
      if (target <= base) {
        return {
          isValid: false,
          error: "Target harus lebih besar dari nilai awal untuk tipe 'Naik ke'"
        };
      }
      break;

    case "decrease_to":
      if (base <= target) {
        return {
          isValid: false,
          error: "Nilai awal harus lebih besar dari target untuk tipe 'Turun ke'"
        };
      }
      break;

    case "should_stay_above":
    case "should_stay_below":
    case "achieve_or_not":
      // These types don't have specific validation requirements
      break;

    default:
      return {
        isValid: false,
        error: "Tipe Key Result tidak dikenal"
      };
  }

  return { isValid: true };
}