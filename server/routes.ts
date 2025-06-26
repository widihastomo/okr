import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertObjectiveSchema, insertKeyResultSchema, updateKeyResultProgressSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all OKRs with key results
  app.get("/api/okrs", async (req, res) => {
    try {
      const { status, timeframe } = req.query;
      let okrs = await storage.getOKRsWithKeyResults();
      
      // Apply filters
      if (status && status !== "all") {
        okrs = okrs.filter(okr => okr.status === status);
      }
      
      if (timeframe && timeframe !== "all") {
        okrs = okrs.filter(okr => okr.timeframe === timeframe);
      }
      
      res.json(okrs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch OKRs" });
    }
  });

  // Get single OKR with key results
  app.get("/api/okrs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const okr = await storage.getOKRWithKeyResults(id);
      
      if (!okr) {
        return res.status(404).json({ message: "OKR not found" });
      }
      
      res.json(okr);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch OKR" });
    }
  });

  // Create new OKR with key results
  app.post("/api/okrs", async (req, res) => {
    try {
      const createOKRSchema = z.object({
        objective: insertObjectiveSchema,
        keyResults: z.array(insertKeyResultSchema.omit({ objectiveId: true }))
      });
      
      const validatedData = createOKRSchema.parse(req.body);
      
      // Create objective
      const objective = await storage.createObjective(validatedData.objective);
      
      // Create key results
      const keyResults = [];
      for (const krData of validatedData.keyResults) {
        const keyResult = await storage.createKeyResult({
          ...krData,
          objectiveId: objective.id
        });
        keyResults.push(keyResult);
      }
      
      // Return complete OKR
      const createdOKR = await storage.getOKRWithKeyResults(objective.id);
      res.status(201).json(createdOKR);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create OKR" });
    }
  });

  // Update objective
  app.patch("/api/objectives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertObjectiveSchema.partial().parse(req.body);
      
      const updated = await storage.updateObjective(id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update objective" });
    }
  });

  // Update key result progress
  app.patch("/api/key-results/:id/progress", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = updateKeyResultProgressSchema.parse({
        ...req.body,
        id
      });
      
      const updated = await storage.updateKeyResultProgress(updateData);
      if (!updated) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update key result progress" });
    }
  });

  // Delete OKR
  app.delete("/api/okrs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteObjective(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "OKR not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete OKR" });
    }
  });

  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const okrs = await storage.getOKRsWithKeyResults();
      
      const stats = {
        totalOKRs: okrs.length,
        onTrack: okrs.filter(okr => okr.status === "on_track").length,
        atRisk: okrs.filter(okr => okr.status === "at_risk").length,
        completed: okrs.filter(okr => okr.status === "completed").length,
        avgProgress: okrs.length > 0 ? Math.round(okrs.reduce((sum, okr) => sum + okr.overallProgress, 0) / okrs.length) : 0
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
