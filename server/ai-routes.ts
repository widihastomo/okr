import { Request, Response } from "express";
import { generateContextualInsights, generateQuickTips, analyzeProgressPatterns } from "./ai-insights";
import { requireAuth } from "./emailAuth";

/**
 * Route handler for AI insights generation
 */
export async function handleAIInsights(req: Request, res: Response) {
  try {
    const { userId, context, data } = req.body;

    if (!userId || !context) {
      return res.status(400).json({ 
        error: "Missing required fields: userId and context" 
      });
    }

    const insights = await generateContextualInsights({
      userId,
      context,
      data
    });

    res.json(insights);
  } catch (error) {
    console.error("AI insights route error:", error);
    res.status(500).json({ 
      error: "Failed to generate AI insights",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Route handler for quick tips generation
 */
export async function handleQuickTips(req: Request, res: Response) {
  try {
    const { scenario } = req.body;

    if (!scenario) {
      return res.status(400).json({ 
        error: "Missing required field: scenario" 
      });
    }

    const tips = await generateQuickTips(scenario);
    res.json(tips);
  } catch (error) {
    console.error("Quick tips route error:", error);
    res.status(500).json({ 
      error: "Failed to generate quick tips",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Route handler for progress pattern analysis
 */
export async function handleProgressAnalysis(req: Request, res: Response) {
  try {
    const { keyResultId } = req.params;

    if (!keyResultId) {
      return res.status(400).json({ 
        error: "Missing required parameter: keyResultId" 
      });
    }

    const insights = await analyzeProgressPatterns(keyResultId);
    res.json(insights);
  } catch (error) {
    console.error("Progress analysis route error:", error);
    res.status(500).json({ 
      error: "Failed to analyze progress patterns",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Register AI-related routes
 */
export function registerAIRoutes(app: any) {
  // Main AI insights endpoint
  app.post("/api/ai-insights", requireAuth, handleAIInsights);
  
  // Quick tips endpoint
  app.post("/api/ai-tips", requireAuth, handleQuickTips);
  
  // Progress pattern analysis endpoint
  app.get("/api/ai-analysis/:keyResultId", requireAuth, handleProgressAnalysis);
  
  console.log("✅ AI routes registered successfully");
}