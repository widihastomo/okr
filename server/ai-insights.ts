import OpenAI from "openai";
import { db } from "./db";
import { objectives, keyResults, checkIns, cycles } from "../shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIInsight {
  type: 'suggestion' | 'warning' | 'tip' | 'celebration';
  title: string;
  message: string;
  confidence: number;
  actionable?: boolean;
  context?: string;
}

export interface ContextualHelpRequest {
  userId: string;
  context: 'dashboard' | 'objective_detail' | 'key_result_detail' | 'check_in' | 'create_okr';
  data?: any;
}

/**
 * Generate AI-powered contextual insights based on user data and current context
 */
export async function generateContextualInsights(request: ContextualHelpRequest): Promise<AIInsight[]> {
  try {
    const userOKRData = await getUserOKRContext(request.userId);
    const contextualPrompt = buildContextualPrompt(request, userOKRData);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert OKR (Objectives and Key Results) advisor for an Indonesian business context. 
          Provide actionable, specific insights in Indonesian language. Focus on practical recommendations based on data patterns.
          Respond with JSON containing an array of insights with type, title, message, confidence (0-1), actionable boolean, and context.`
        },
        {
          role: "user",
          content: contextualPrompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || '{"insights": []}');
    return result.insights || [];
  } catch (error) {
    console.error("AI insights generation error:", error);
    return [];
  }
}

/**
 * Fetch comprehensive OKR context for a user
 */
async function getUserOKRContext(userId: string) {
  try {
    // Get user's objectives with key results
    const userObjectives = await db
      .select({
        id: objectives.id,
        title: objectives.title,
        description: objectives.description,
        status: objectives.status,
        cycleId: objectives.cycleId,
        ownerId: objectives.ownerId
      })
      .from(objectives)
      .where(eq(objectives.ownerId, userId));

    // Get key results for these objectives
    const objectiveIds = userObjectives.map(obj => obj.id);
    const userKeyResults = objectiveIds.length > 0 ? await db
      .select({
        id: keyResults.id,
        objectiveId: keyResults.objectiveId,
        title: keyResults.title,
        keyResultType: keyResults.keyResultType,
        currentValue: keyResults.currentValue,
        targetValue: keyResults.targetValue,
        baseValue: keyResults.baseValue,
        status: keyResults.status
      })
      .from(keyResults)
      .where(eq(keyResults.objectiveId, objectiveIds[0])) // Simplified for performance
      : [];

    // Get recent check-ins
    const recentCheckIns = await db
      .select({
        id: checkIns.id,
        keyResultId: checkIns.keyResultId,
        value: checkIns.value,
        notes: checkIns.notes,
        confidence: checkIns.confidence,
        createdAt: checkIns.createdAt
      })
      .from(checkIns)
      .where(eq(checkIns.createdBy, userId))
      .orderBy(desc(checkIns.createdAt))
      .limit(5);

    // Get active cycles
    const now = new Date();
    const activeCycles = await db
      .select()
      .from(cycles)
      .where(
        and(
          lte(cycles.startDate, now.toISOString()),
          gte(cycles.endDate, now.toISOString())
        )
      );

    return {
      objectives: userObjectives,
      keyResults: userKeyResults,
      recentCheckIns: recentCheckIns,
      activeCycles: activeCycles,
      totalObjectives: userObjectives.length,
      completedObjectives: userObjectives.filter(obj => obj.status === 'completed').length,
      avgProgress: 0 // Will calculate from key results if needed
    };
  } catch (error) {
    console.error("Error fetching user OKR context:", error);
    return null;
  }
}

/**
 * Build contextual prompt based on user context and current page
 */
function buildContextualPrompt(request: ContextualHelpRequest, userData: any): string {
  const baseContext = `
Analisis data OKR pengguna berikut dan berikan insight yang relevan:

Data Pengguna:
- Total Objectives: ${userData?.totalObjectives || 0}
- Objectives Selesai: ${userData?.completedObjectives || 0}
- Rata-rata Progress: ${userData?.avgProgress?.toFixed(1) || 0}%
- Check-ins Terakhir: ${userData?.recentCheckIns?.length || 0}
- Siklus Aktif: ${userData?.activeCycles?.length || 0}

Konteks Halaman: ${request.context}
`;

  let specificContext = '';

  switch (request.context) {
    case 'dashboard':
      specificContext = `
Pengguna sedang melihat dashboard. Berikan insight tentang:
- Performa keseluruhan OKR
- Tren progress
- Rekomendasi prioritas
- Peringatan untuk objektif yang tertinggal
`;
      break;
    
    case 'objective_detail':
      specificContext = `
Pengguna sedang melihat detail objektif. Berikan insight tentang:
- Performa key results
- Saran perbaikan
- Identifikasi risiko
- Rekomendasi check-in
`;
      break;
    
    case 'key_result_detail':
      specificContext = `
Pengguna sedang melihat detail key result. Berikan insight tentang:
- Analisis progress vs target
- Prediksi pencapaian
- Saran strategi
- Identifikasi hambatan
`;
      break;
    
    case 'check_in':
      specificContext = `
Pengguna sedang melakukan check-in. Berikan insight tentang:
- Validasi nilai yang diinput
- Saran confidence level
- Rekomendasi catatan
- Peringatan deadline
`;
      break;
    
    case 'create_okr':
      specificContext = `
Pengguna sedang membuat OKR baru. Berikan insight tentang:
- Best practices untuk objectives
- Saran key results yang SMART
- Rekomendasi target yang realistis
- Tips formulasi yang efektif
`;
      break;
  }

  return `${baseContext}\n${specificContext}\n
Berikan maksimal 3 insight dalam format JSON:
{
  "insights": [
    {
      "type": "suggestion|warning|tip|celebration",
      "title": "Judul singkat",
      "message": "Pesan detail dalam bahasa Indonesia",
      "confidence": 0.8,
      "actionable": true,
      "context": "dashboard"
    }
  ]
}`;
}

/**
 * Generate quick tips for specific OKR scenarios
 */
export async function generateQuickTips(scenario: string): Promise<AIInsight[]> {
  try {
    const tipPrompts = {
      'low_progress': 'Berikan tips untuk meningkatkan progress OKR yang tertinggal',
      'high_confidence': 'Berikan saran untuk mempertahankan momentum positif',
      'missing_checkins': 'Berikan reminder pentingnya check-in rutin',
      'approaching_deadline': 'Berikan strategi untuk mengejar deadline yang mendekat'
    };

    const prompt = tipPrompts[scenario as keyof typeof tipPrompts] || 'Berikan tips umum OKR';

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Berikan tips praktis OKR dalam bahasa Indonesia. Respon harus dalam format JSON dengan array insights."
        },
        {
          role: "user",
          content: `${prompt}. Format: {"insights": [{"type": "tip", "title": "...", "message": "...", "confidence": 0.9, "actionable": true}]}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || '{"insights": []}');
    return result.insights || [];
  } catch (error) {
    console.error("Quick tips generation error:", error);
    return [];
  }
}

/**
 * Analyze progress patterns and provide predictive insights
 */
export async function analyzeProgressPatterns(keyResultId: string): Promise<AIInsight[]> {
  try {
    // Get historical check-ins for the key result
    const checkInHistory = await db
      .select({
        value: checkIns.value,
        confidence: checkIns.confidence,
        createdAt: checkIns.createdAt,
        notes: checkIns.notes
      })
      .from(checkIns)
      .where(eq(checkIns.keyResultId, keyResultId))
      .orderBy(desc(checkIns.createdAt))
      .limit(10);

    if (checkInHistory.length < 2) {
      return [{
        type: 'tip',
        title: 'Butuh Lebih Banyak Data',
        message: 'Lakukan check-in secara rutin untuk mendapatkan analisis pola yang lebih akurat.',
        confidence: 0.9,
        actionable: true,
        context: 'progress_analysis'
      }];
    }

    const analysisPrompt = `
Analisis pola progress berikut dan berikan insight prediktif:

Data Check-in (terbaru ke terlama):
${checkInHistory.map((ci, idx) => `
${idx + 1}. Nilai: ${ci.value}, Confidence: ${ci.confidence}/10
   Tanggal: ${ci.createdAt ? ci.createdAt.toLocaleDateString('id-ID') : 'Unknown'}
   Catatan: ${ci.notes || 'Tidak ada catatan'}
`).join('')}

Berikan analisis tren, prediksi pencapaian, dan rekomendasi dalam format JSON.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Analisis pola progress dan berikan prediksi serta rekomendasi dalam bahasa Indonesia."
        },
        {
          role: "user",
          content: `${analysisPrompt}\n\nFormat: {"insights": [{"type": "suggestion", "title": "...", "message": "...", "confidence": 0.8, "actionable": true}]}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800
    });

    const result = JSON.parse(response.choices[0].message.content || '{"insights": []}');
    return result.insights || [];
  } catch (error) {
    console.error("Progress pattern analysis error:", error);
    return [];
  }
}