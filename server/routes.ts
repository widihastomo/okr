import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCycleSchema, insertTemplateSchema, insertObjectiveSchema, insertKeyResultSchema, 
  insertCheckInSchema, insertInitiativeSchema,
  updateKeyResultProgressSchema, createOKRFromTemplateSchema 
} from "@shared/schema";
import { z } from "zod";
import { setupEmailAuth } from "./authRoutes";
import { requireAuth } from "./emailAuth";
import { calculateProgressStatus } from "./progress-tracker";
import { updateObjectiveWithAutoStatus } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupEmailAuth(app);

  // Debug endpoint to check users
  app.get("/api/debug/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Note: Auth routes are handled in authRoutes.ts
  // Cycles endpoints
  app.get("/api/cycles", async (req, res) => {
    try {
      const cycles = await storage.getCycles();
      res.json(cycles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cycles" });
    }
  });

  app.get("/api/cycles/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const cycle = await storage.getCycleWithOKRs(id);
      
      if (!cycle) {
        return res.status(404).json({ message: "Cycle not found" });
      }
      
      res.json(cycle);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cycle" });
    }
  });

  app.post("/api/cycles", requireAuth, async (req, res) => {
    try {
      const data = insertCycleSchema.parse(req.body);
      const cycle = await storage.createCycle(data);
      res.status(201).json(cycle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create cycle" });
    }
  });

  app.patch("/api/cycles/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const data = insertCycleSchema.partial().parse(req.body);
      const updated = await storage.updateCycle(id, data);
      
      if (!updated) {
        return res.status(404).json({ message: "Cycle not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update cycle" });
    }
  });

  app.delete("/api/cycles/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteCycle(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Cycle not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cycle" });
    }
  });

  // Templates endpoints
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const template = await storage.getTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post("/api/templates", requireAuth, async (req, res) => {
    try {
      const data = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(data);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.patch("/api/templates/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const data = insertTemplateSchema.partial().parse(req.body);
      const updated = await storage.updateTemplate(id, data);
      
      if (!updated) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteTemplate(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  app.post("/api/templates/:id/create-okr", requireAuth, async (req, res) => {
    try {
      const templateId = req.params.id;
      const data = createOKRFromTemplateSchema.parse({
        ...req.body,
        templateId
      });
      const okrs = await storage.createOKRFromTemplate(data);
      res.status(201).json(okrs);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create OKR from template" });
    }
  });

  // Objectives endpoints
  app.get("/api/objectives", async (req, res) => {
    try {
      const objectives = await storage.getObjectives();
      res.json(objectives);
    } catch (error) {
      console.error("Error fetching objectives:", error);
      res.status(500).json({ message: "Failed to fetch objectives" });
    }
  });

  app.get("/api/objectives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const objective = await storage.getObjective(id);
      
      if (!objective) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      res.json(objective);
    } catch (error) {
      console.error("Error fetching objective:", error);
      res.status(500).json({ message: "Failed to fetch objective" });
    }
  });

  app.delete("/api/objectives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteObjective(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      res.json({ message: "Objective deleted successfully" });
    } catch (error) {
      console.error("Error deleting objective:", error);
      res.status(500).json({ message: "Failed to delete objective" });
    }
  });

  // User management endpoints
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', requireAuth, async (req, res) => {
    try {
      const user = await storage.upsertUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const updatedUser = await storage.updateUser(req.params.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.patch('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const updatedUser = await storage.updateUser(req.params.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Team management endpoints
  app.get('/api/teams', async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get('/api/teams/:id', async (req, res) => {
    try {
      const teamId = req.params.id;
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post('/api/teams', async (req, res) => {
    try {
      const newTeam = await storage.createTeam(req.body);
      res.json(newTeam);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.put('/api/teams/:id', async (req, res) => {
    try {
      const teamId = req.params.id;
      const updatedTeam = await storage.updateTeam(teamId, req.body);
      if (!updatedTeam) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete('/api/teams/:id', async (req, res) => {
    try {
      const teamId = req.params.id;
      const deleted = await storage.deleteTeam(teamId);
      if (!deleted) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Team member endpoints
  app.get('/api/teams/:id/members', async (req, res) => {
    try {
      const teamId = req.params.id;
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get('/api/users/:id/teams', async (req, res) => {
    try {
      const userTeams = await storage.getUserTeams(req.params.id);
      res.json(userTeams);
    } catch (error) {
      console.error("Error fetching user teams:", error);
      res.status(500).json({ message: "Failed to fetch user teams" });
    }
  });

  app.post('/api/teams/:id/members', async (req, res) => {
    try {
      const teamId = req.params.id;
      const memberData = { ...req.body, teamId };
      const newMember = await storage.addTeamMember(memberData);
      res.json(newMember);
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(500).json({ message: "Failed to add team member" });
    }
  });

  app.delete('/api/teams/:teamId/members/:userId', async (req, res) => {
    try {
      const teamId = req.params.teamId;
      const userId = req.params.userId;
      const removed = await storage.removeTeamMember(teamId, userId);
      if (!removed) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json({ message: "Team member removed successfully" });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: "Failed to remove team member" });
    }
  });

  app.put('/api/teams/:teamId/members/:userId/role', async (req, res) => {
    try {
      const teamId = req.params.teamId;
      const userId = req.params.userId;
      const { role } = req.body;
      const updatedMember = await storage.updateTeamMemberRole(teamId, userId, role);
      if (!updatedMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating team member role:", error);
      res.status(500).json({ message: "Failed to update team member role" });
    }
  });

  // Get single OKR with key results by ID
  app.get("/api/okrs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const okr = await storage.getOKRWithKeyResults(id);
      if (!okr) {
        return res.status(404).json({ message: "OKR not found" });
      }
      res.json(okr);
    } catch (error) {
      console.error("Error fetching OKR:", error);
      res.status(500).json({ message: "Failed to fetch OKR" });
    }
  });

  // Get all OKRs with key results
  app.get("/api/okrs", async (req, res) => {
    try {
      const { status, timeframe } = req.query;
      let okrs = await storage.getOKRsWithKeyResults();
      
      // Apply filters
      if (status && status !== "all") {
        okrs = okrs.filter(okr => okr.status === status);
      }
      

      
      res.json(okrs);
    } catch (error) {
      console.error("Error fetching OKRs:", error);
      res.status(500).json({ message: "Failed to fetch OKRs" });
    }
  });

  // Get OKRs with full 4-level hierarchy (Objective → Key Results → Initiatives → Tasks)
  app.get("/api/okrs-with-hierarchy", async (req, res) => {
    try {
      const { cycleId } = req.query;
      const okrs = await storage.getOKRsWithFullHierarchy(cycleId as string | undefined);
      res.json(okrs);
    } catch (error) {
      console.error("Error fetching OKRs with hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch OKRs with hierarchy" });
    }
  });

  // Create sample OKR data for testing
  app.post("/api/create-sample-data", async (req, res) => {
    try {
      const { createSampleOKRData } = await import("./sample-data");
      const success = await createSampleOKRData();
      if (success) {
        res.json({ message: "Sample OKR data created successfully" });
      } else {
        res.status(500).json({ message: "Failed to create sample data" });
      }
    } catch (error) {
      console.error("Error creating sample data:", error);
      res.status(500).json({ message: "Failed to create sample data" });
    }
  });

  // Get single OKR with key results
  app.get("/api/okrs/:id", async (req, res) => {
    try {
      const id = req.params.id;
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
      console.log("Create OKR request received:", JSON.stringify(req.body, null, 2));
      
      const createOKRSchema = z.object({
        objective: insertObjectiveSchema.extend({
          ownerId: z.string(), // Now expects UUID string
          teamId: z.string().nullable().optional(),
          parentId: z.string().nullable().optional(),
        }),
        keyResults: z.array(insertKeyResultSchema.omit({ objectiveId: true }).extend({
          assignedTo: z.string().nullable().optional(),
        }))
      });
      
      const validatedData = createOKRSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      // Create objective
      const objective = await storage.createObjective(validatedData.objective);
      console.log("Created objective:", objective);
      
      // Create key results
      const keyResults = [];
      for (const krData of validatedData.keyResults) {
        const keyResult = await storage.createKeyResult({
          ...krData,
          objectiveId: objective.id
        });
        keyResults.push(keyResult);
      }
      console.log("Created key results:", keyResults);
      
      // Return complete OKR
      const createdOKR = await storage.getOKRWithKeyResults(objective.id);
      console.log("Complete OKR:", createdOKR);
      res.status(201).json(createdOKR);
    } catch (error) {
      console.error("Error creating OKR:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create OKR", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Update complete OKR (objective + key results)
  app.patch("/api/okrs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      console.log("Update OKR request received:", JSON.stringify(req.body, null, 2));
      
      const updateOKRSchema = z.object({
        objective: insertObjectiveSchema.partial().extend({
          ownerId: z.string().optional(),
          teamId: z.string().nullable().optional(),
          parentId: z.string().nullable().optional(),
        }),
        keyResults: z.array(insertKeyResultSchema.partial().extend({
          id: z.string().optional(),
          assignedTo: z.string().nullable().optional(),
        }))
      });
      
      const validatedData = updateOKRSchema.parse(req.body);
      console.log("Validated update data:", JSON.stringify(validatedData, null, 2));
      
      // Convert teamId to string if provided
      const objectiveUpdate = {
        ...validatedData.objective,
        teamId: validatedData.objective.teamId ? validatedData.objective.teamId.toString() : undefined,
        parentId: validatedData.objective.parentId ? validatedData.objective.parentId.toString() : undefined
      };

      // Update objective
      const updatedObjective = await storage.updateObjective(id, objectiveUpdate);
      if (!updatedObjective) {
        return res.status(404).json({ message: "OKR not found" });
      }
      
      // Update or create key results
      const keyResults = [];
      for (const krData of validatedData.keyResults) {
        if (krData.id) {
          // Update existing key result
          const updated = await storage.updateKeyResult(krData.id, krData);
          if (updated) keyResults.push(updated);
        } else {
          // Create new key result - ensure required fields are present
          if (krData.title && krData.targetValue) {
            const created = await storage.createKeyResult({
              ...krData,
              objectiveId: id,
              title: krData.title,
              targetValue: krData.targetValue
            });
            keyResults.push(created);
          }
        }
      }
      
      // Return complete updated OKR
      const updatedOKR = await storage.getOKRWithKeyResults(id);
      console.log("Updated OKR:", updatedOKR);
      res.json(updatedOKR);
    } catch (error) {
      console.error("Error updating OKR:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update OKR", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Update objective
  app.patch("/api/objectives/:id", async (req, res) => {
    try {
      const id = req.params.id;
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
      const id = req.params.id;
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

  // Get key result with details and progress history
  app.get("/api/key-results/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const keyResult = await storage.getKeyResultWithDetails(id);
      
      if (!keyResult) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      res.json(keyResult);
    } catch (error) {
      console.error("Error fetching key result details:", error);
      res.status(500).json({ message: "Failed to fetch key result details" });
    }
  });

  // Check-ins for progress tracking
  app.post("/api/key-results/:id/check-ins", async (req, res) => {
    try {
      const keyResultId = req.params.id;
      
      if (!keyResultId) {
        return res.status(400).json({ message: "Invalid key result ID" });
      }

      if (!req.body.value) {
        return res.status(400).json({ message: "Value is required" });
      }

      const checkInData = {
        keyResultId,
        value: req.body.value,
        notes: req.body.notes || null,
        confidence: req.body.confidence || 5,
        createdBy: req.body.createdBy || '550e8400-e29b-41d4-a716-446655440001'
      };
      
      const checkIn = await storage.createCheckIn(checkInData);
      
      // Update key result with new current value and auto-calculate status
      await storage.updateKeyResultProgress({
        id: keyResultId,
        currentValue: parseFloat(req.body.value)
      });
      
      res.status(201).json(checkIn);
    } catch (error) {
      console.error("Check-in creation error:", error);
      res.status(500).json({ 
        message: "Failed to create check-in",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update Key Result Progress with Auto Status Calculation
  app.patch("/api/key-results/:id/progress", async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const { currentValue } = req.body;
      
      if (currentValue === undefined || currentValue === null) {
        return res.status(400).json({ message: "Current value is required" });
      }

      const updatedKeyResult = await storage.updateKeyResultProgress({
        id: keyResultId,
        currentValue: parseFloat(currentValue)
      });
      
      if (!updatedKeyResult) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      res.json(updatedKeyResult);
    } catch (error) {
      console.error("Error updating key result progress:", error);
      res.status(500).json({ message: "Failed to update key result progress" });
    }
  });

  // Bulk Update All Status Based on Progress
  app.post("/api/update-all-status", async (req, res) => {
    try {
      // Get all key results and update their status
      const keyResults = await storage.getKeyResults();
      const objectives = await storage.getObjectives();
      let updatedKeyResultsCount = 0;
      let updatedObjectivesCount = 0;
      
      // Update key results status
      for (const keyResult of keyResults) {
        const objective = await storage.getObjective(keyResult.objectiveId);
        if (objective && objective.cycleId) {
          const cycle = await storage.getCycle(objective.cycleId);
          if (cycle && keyResult.dueDate) {
            const startDate = new Date(cycle.startDate);
            const endDate = keyResult.dueDate;
            
            const progressStatus = calculateProgressStatus(keyResult, startDate, endDate);
            
            await storage.updateKeyResult(keyResult.id, {
              status: progressStatus.status
            });
            updatedKeyResultsCount++;
          }
        }
      }
      
      // Update objectives status
      for (const objective of objectives) {
        try {
          await updateObjectiveWithAutoStatus(objective.id);
          updatedObjectivesCount++;
        } catch (error) {
          console.error(`Error updating objective ${objective.id}:`, error);
        }
      }
      
      res.json({ 
        message: `Updated status for ${updatedKeyResultsCount} key results and ${updatedObjectivesCount} objectives`,
        updatedKeyResultsCount,
        updatedObjectivesCount
      });
    } catch (error) {
      console.error("Error updating all status:", error);
      res.status(500).json({ message: "Failed to update all status" });
    }
  });

  app.get("/api/key-results/:id/check-ins", async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const checkIns = await storage.getCheckInsByKeyResultId(keyResultId);
      res.json(checkIns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch check-ins" });
    }
  });

  // Get key result details with progress history
  app.get("/api/key-results/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const keyResult = await storage.getKeyResultWithDetails(id);
      
      if (!keyResult) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      res.json(keyResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch key result details" });
    }
  });

  // Delete OKR
  app.delete("/api/okrs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteObjective(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "OKR not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete OKR" });
    }
  });

  // Get key result details
  app.get("/api/key-results/:id/details", async (req, res) => {
    try {
      const id = req.params.id;
      const keyResult = await storage.getKeyResultWithDetails(id);
      
      if (!keyResult) {
        return res.status(404).json({ message: "Key result not found" });
      }

      res.json(keyResult);
    } catch (error) {
      console.error("Error fetching key result details:", error);
      res.status(500).json({ message: "Failed to fetch key result details" });
    }
  });

  // Check-in routes
  app.post("/api/check-ins", async (req, res) => {
    try {
      const result = insertCheckInSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid check-in data", errors: result.error.errors });
      }

      const checkIn = await storage.createCheckIn(result.data);
      res.status(201).json(checkIn);
    } catch (error) {
      console.error("Error creating check-in:", error);
      res.status(500).json({ message: "Failed to create check-in" });
    }
  });

  // Initiative routes
  app.post("/api/initiatives", async (req, res) => {
    try {
      const result = insertInitiativeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid initiative data", errors: result.error.errors });
      }

      const initiative = await storage.createInitiative(result.data);
      res.status(201).json(initiative);
    } catch (error) {
      console.error("Error creating initiative:", error);
      res.status(500).json({ message: "Failed to create initiative" });
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
