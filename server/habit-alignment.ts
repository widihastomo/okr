import OpenAI from "openai";
import type { OKRWithKeyResults } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface HabitPreferences {
  timeAvailable: string; // minutes per day
  difficulty: 'easy' | 'medium' | 'hard';
  categories: string[];
  focusAreas: string[];
}

export interface HabitSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'monthly';
  difficulty: 'easy' | 'medium' | 'hard';
  impactScore: number;
  alignedObjectives: string[];
  timeCommitment: string;
  frequency: string;
  examples: string[];
}

export interface HabitAlignmentRequest {
  objectiveIds: string[];
  objectives: OKRWithKeyResults[];
  preferences: HabitPreferences;
  userId: string;
}

/**
 * Generate AI-powered habit suggestions based on user objectives and preferences
 */
export async function generateHabitSuggestions(request: HabitAlignmentRequest): Promise<{ suggestions: HabitSuggestion[] }> {
  try {
    const { objectives, preferences } = request;
    
    // Build context for AI
    const objectiveContext = objectives.map(obj => ({
      title: obj.title,
      description: obj.description,
      keyResults: obj.keyResults?.map(kr => ({
        title: kr.title,
        type: kr.keyResultType,
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
        unit: kr.unit
      })) || [],
      progress: obj.overallProgress || 0
    }));

    const prompt = `
Analyze these business objectives and generate personalized daily/weekly habits that will directly accelerate progress toward these goals.

OBJECTIVES:
${JSON.stringify(objectiveContext, null, 2)}

USER PREFERENCES:
- Available time per day: ${preferences.timeAvailable} minutes
- Difficulty preference: ${preferences.difficulty}
- Focus areas: ${preferences.focusAreas.join(', ') || 'None specified'}

REQUIREMENTS:
1. Generate 3-5 highly specific, actionable habits
2. Each habit should directly connect to at least one objective
3. Focus on high-impact activities that compound over time
4. Make habits concrete and measurable
5. Consider the user's time constraints and difficulty preference
6. Provide 2-3 specific examples for each habit

Respond with a JSON object containing an array of habits with this exact structure:
{
  "suggestions": [
    {
      "id": "unique-id",
      "title": "Habit Name",
      "description": "Clear description of what the habit involves and why it helps",
      "category": "daily|weekly|monthly",
      "difficulty": "easy|medium|hard",
      "impactScore": 75,
      "alignedObjectives": ["objective-id-1"],
      "timeCommitment": "20 menit",
      "frequency": "Setiap hari",
      "examples": ["Specific action 1", "Specific action 2", "Specific action 3"]
    }
  ]
}

Use Indonesian language for all user-facing text. Focus on business/professional habits that directly support the objectives.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert in habit formation and business productivity. You specialize in creating personalized habit recommendations that align with specific business objectives and accelerate goal achievement."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    
    // Validate and enhance the suggestions
    const validatedSuggestions = result.suggestions.map((suggestion: any, index: number) => ({
      id: suggestion.id || `ai-habit-${index}`,
      title: suggestion.title || "Untitled Habit",
      description: suggestion.description || "",
      category: ['daily', 'weekly', 'monthly'].includes(suggestion.category) ? suggestion.category : 'daily',
      difficulty: ['easy', 'medium', 'hard'].includes(suggestion.difficulty) ? suggestion.difficulty : preferences.difficulty,
      impactScore: Math.max(0, Math.min(100, suggestion.impactScore || 75)),
      alignedObjectives: Array.isArray(suggestion.alignedObjectives) ? suggestion.alignedObjectives : [],
      timeCommitment: suggestion.timeCommitment || `${preferences.timeAvailable} menit`,
      frequency: suggestion.frequency || "Setiap hari",
      examples: Array.isArray(suggestion.examples) ? suggestion.examples.slice(0, 5) : []
    }));

    return { suggestions: validatedSuggestions };

  } catch (error) {
    console.error('Error generating AI habit suggestions:', error);
    throw new Error('Failed to generate habit suggestions');
  }
}

/**
 * Generate fallback habit suggestions when AI is not available
 */
export function generateFallbackHabitSuggestions(request: HabitAlignmentRequest): { suggestions: HabitSuggestion[] } {
  const { objectives, preferences, objectiveIds } = request;
  const suggestions: HabitSuggestion[] = [];

  objectives.forEach((objective, index) => {
    const objLower = objective.title.toLowerCase();
    
    // Sales/Revenue related habits
    if (objLower.includes('penjualan') || objLower.includes('revenue') || objLower.includes('sales') ||
        objective.keyResults?.some(kr => kr.unit === 'Rp')) {
      suggestions.push({
        id: `sales-${objective.id}`,
        title: "Daily Prospecting Routine",
        description: "Kontak prospek baru setiap hari untuk membangun pipeline penjualan yang konsisten dan terukur",
        category: 'daily',
        difficulty: preferences.difficulty,
        impactScore: 85,
        alignedObjectives: [objective.id],
        timeCommitment: `${Math.min(parseInt(preferences.timeAvailable), 45)} menit`,
        frequency: "Setiap hari kerja",
        examples: ["Cold call 3-5 leads baru", "Follow up 2-3 warm prospects", "Update CRM dan analisis conversion"]
      });
    }

    // Productivity/Efficiency habits
    if (objLower.includes('produktivitas') || objLower.includes('efisiensi') || objLower.includes('efficiency')) {
      suggestions.push({
        id: `productivity-${objective.id}`,
        title: "Morning Focus Block",
        description: "Mulai hari dengan sesi fokus mendalam untuk menyelesaikan tugas prioritas tertinggi tanpa distraksi",
        category: 'daily',
        difficulty: preferences.difficulty === 'hard' ? 'medium' : 'easy',
        impactScore: 80,
        alignedObjectives: [objective.id],
        timeCommitment: `${preferences.timeAvailable} menit`,
        frequency: "Setiap pagi kerja",
        examples: ["Time blocking untuk deep work", "Review dan prioritas daily tasks", "Eliminate distractions selama focus time"]
      });
    }

    // Learning/Development habits
    if (objLower.includes('skill') || objLower.includes('learning') || objLower.includes('development') || objLower.includes('training')) {
      suggestions.push({
        id: `learning-${objective.id}`,
        title: "Daily Skill Development",
        description: "Investasi konsisten dalam pengembangan skill yang langsung mendukung pencapaian objective",
        category: 'daily',
        difficulty: preferences.difficulty,
        impactScore: 90,
        alignedObjectives: [objective.id],
        timeCommitment: `${Math.max(15, parseInt(preferences.timeAvailable) - 10)} menit`,
        frequency: "Setiap hari",
        examples: ["Online course module", "Industry artikel/research", "Practice exercises atau project"]
      });
    }

    // Customer/Service related habits
    if (objLower.includes('customer') || objLower.includes('pelanggan') || objLower.includes('service')) {
      suggestions.push({
        id: `customer-${objective.id}`,
        title: "Customer Touch Points",
        description: "Inisiatif proaktif untuk meningkatkan relationship dan satisfaction dengan existing customers",
        category: 'daily',
        difficulty: 'medium',
        impactScore: 75,
        alignedObjectives: [objective.id],
        timeCommitment: "20 menit",
        frequency: "Setiap hari kerja",
        examples: ["Check-in call dengan 1-2 customers", "Respond customer feedback", "Identify upsell opportunities"]
      });
    }

    // Quality/Process improvement habits
    if (objLower.includes('quality') || objLower.includes('kualitas') || objLower.includes('process')) {
      suggestions.push({
        id: `quality-${objective.id}`,
        title: "Continuous Improvement Check",
        description: "Review harian untuk mengidentifikasi dan implementasi perbaikan proses kecil namun impactful",
        category: 'daily',
        difficulty: 'easy',
        impactScore: 70,
        alignedObjectives: [objective.id],
        timeCommitment: "15 menit",
        frequency: "Setiap hari",
        examples: ["Identify 1 process bottleneck", "Document improvement ideas", "Implement quick wins"]
      });
    }
  });

  // Add universal productivity habits
  suggestions.push({
    id: 'universal-review',
    title: "Weekly OKR Progress Review",
    description: "Review mendalam progress semua objectives, identifikasi obstacles, dan adjust strategy untuk minggu berikutnya",
    category: 'weekly',
    difficulty: 'easy',
    impactScore: 85,
    alignedObjectives: objectiveIds,
    timeCommitment: "30-45 menit",
    frequency: "Setiap minggu",
    examples: ["Analyze key metrics progress", "Identify blockers dan solutions", "Plan high-impact activities untuk minggu depan"]
  });

  if (preferences.difficulty !== 'easy') {
    suggestions.push({
      id: 'universal-networking',
      title: "Strategic Networking",
      description: "Bangun relationship yang dapat mendukung pencapaian objectives melalui networking yang targeted dan konsisten",
      category: 'weekly',
      difficulty: 'medium',
      impactScore: 70,
      alignedObjectives: objectiveIds,
      timeCommitment: "30 menit",
      frequency: "2-3 kali seminggu",
      examples: ["LinkedIn engagement dengan industry leaders", "Join relevant professional discussions", "Schedule coffee chat dengan strategic contacts"]
    });
  }

  // Filter based on time availability
  const timeLimit = parseInt(preferences.timeAvailable);
  return {
    suggestions: suggestions
      .filter(suggestion => {
        const suggestionTime = parseInt(suggestion.timeCommitment.split(' ')[0]);
        return suggestionTime <= timeLimit + 10; // Allow 10 minutes buffer
      })
      .slice(0, 6) // Limit to 6 suggestions max
  };
}

/**
 * Calculate habit alignment score based on objectives and preferences
 */
export function calculateHabitAlignment(
  habit: HabitSuggestion, 
  objectives: OKRWithKeyResults[], 
  preferences: HabitPreferences
): number {
  let score = habit.impactScore;

  // Boost score for difficulty preference match
  if (habit.difficulty === preferences.difficulty) {
    score += 10;
  }

  // Boost score for time commitment alignment
  const habitTime = parseInt(habit.timeCommitment.split(' ')[0]);
  const availableTime = parseInt(preferences.timeAvailable);
  if (habitTime <= availableTime) {
    score += 5;
  }

  // Boost score for focus area alignment
  const habitTitle = habit.title.toLowerCase();
  const habitDesc = habit.description.toLowerCase();
  preferences.focusAreas.forEach(area => {
    if (habitTitle.includes(area.toLowerCase()) || habitDesc.includes(area.toLowerCase())) {
      score += 5;
    }
  });

  // Boost score for multiple objective alignment
  if (habit.alignedObjectives.length > 1) {
    score += 5;
  }

  return Math.min(100, score);
}