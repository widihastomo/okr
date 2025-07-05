/**
 * Priority Calculator for Initiatives
 * 
 * Calculates automatic priority based on Impact, Effort, and Confidence scores
 * using a weighted formula to determine priority levels.
 */

export interface PriorityInputs {
  impactScore: number;      // 1-5: Business impact (higher = more impact)
  effortScore: number;      // 1-5: Implementation effort (higher = more effort)
  confidenceScore: number;  // 1-5: Confidence in success (higher = more confident)
}

export interface PriorityResult {
  priorityScore: number;    // Calculated priority score
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;        // Explanation of the calculation
}

/**
 * Calculate priority score using weighted formula:
 * Priority Score = (Impact × 0.4) + ((6 - Effort) × 0.3) + (Confidence × 0.3)
 * 
 * Logic:
 * - Impact: Higher impact = higher priority (40% weight)
 * - Effort: Lower effort = higher priority (30% weight) - inverted scale
 * - Confidence: Higher confidence = higher priority (30% weight)
 */
export function calculatePriority(inputs: PriorityInputs): PriorityResult {
  const { impactScore, effortScore, confidenceScore } = inputs;

  // Validate inputs (1-5 scale)
  if (!isValidScore(impactScore) || !isValidScore(effortScore) || !isValidScore(confidenceScore)) {
    throw new Error("All scores must be between 1 and 5");
  }

  // Calculate weighted priority score
  // Effort is inverted (6 - effort) so lower effort = higher priority
  const priorityScore = 
    (impactScore * 0.4) +           // Impact weight: 40%
    ((6 - effortScore) * 0.3) +     // Effort weight: 30% (inverted)
    (confidenceScore * 0.3);        // Confidence weight: 30%

  // Determine priority level based on score ranges
  const priorityLevel = getPriorityLevel(priorityScore);

  // Generate reasoning
  const reasoning = generateReasoning(inputs, priorityScore, priorityLevel);

  return {
    priorityScore: Number(priorityScore.toFixed(2)),
    priorityLevel,
    reasoning
  };
}

/**
 * Validate that score is within 1-5 range
 */
function isValidScore(score: number): boolean {
  return typeof score === 'number' && score >= 1 && score <= 5;
}

/**
 * Convert priority score to priority level
 * Score ranges (adjusted for 5-point scale):
 * - 4.5-5.0: Critical
 * - 3.5-4.4: High  
 * - 2.5-3.4: Medium
 * - 1.0-2.4: Low
 */
function getPriorityLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 4.5) return 'critical';
  if (score >= 3.5) return 'high';
  if (score >= 2.5) return 'medium';
  return 'low';
}

/**
 * Generate human-readable reasoning for the priority calculation
 */
function generateReasoning(inputs: PriorityInputs, score: number, level: string): string {
  const { impactScore, effortScore, confidenceScore } = inputs;
  
  const impactDesc = getScoreDescription(impactScore, 'impact');
  const effortDesc = getScoreDescription(effortScore, 'effort');
  const confidenceDesc = getScoreDescription(confidenceScore, 'confidence');

  return `Prioritas ${level} (skor: ${score.toFixed(2)}) berdasarkan ${impactDesc}, ${effortDesc}, dan ${confidenceDesc}. Formula: (Impact×0.4) + (Kemudahan×0.3) + (Keyakinan×0.3).`;
}

/**
 * Get descriptive text for score values
 */
function getScoreDescription(score: number, type: 'impact' | 'effort' | 'confidence'): string {
  const level = getScoreLevel(score);
  
  switch (type) {
    case 'impact':
      return `dampak bisnis ${level} (${score}/5)`;
    case 'effort':
      return `tingkat kesulitan ${level} (${score}/5)`;
    case 'confidence':
      return `tingkat keyakinan ${level} (${score}/5)`;
  }
}

/**
 * Convert numerical score to descriptive level (5-point scale)
 */
function getScoreLevel(score: number): string {
  if (score >= 5) return 'sangat tinggi';
  if (score >= 4) return 'tinggi';
  if (score >= 3) return 'sedang';
  if (score >= 2) return 'rendah';
  return 'sangat rendah';
}

/**
 * Get priority color for UI display
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get priority label in Indonesian
 */
export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'critical': return 'Kritis';
    case 'high': return 'Tinggi';
    case 'medium': return 'Sedang';
    case 'low': return 'Rendah';
    default: return 'Tidak Diketahui';
  }
}

/**
 * Bulk calculate priorities for multiple initiatives
 */
export function calculateBulkPriorities(initiatives: Array<PriorityInputs & { id: string }>): Array<{ id: string } & PriorityResult> {
  return initiatives.map(initiative => ({
    id: initiative.id,
    ...calculatePriority({
      impactScore: initiative.impactScore,
      effortScore: initiative.effortScore,
      confidenceScore: initiative.confidenceScore
    })
  }));
}