import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCycleSchema, insertTemplateSchema, insertObjectiveSchema, insertKeyResultSchema, 
  insertCheckInSchema, insertInitiativeSchema, insertInitiativeMemberSchema, insertInitiativeDocumentSchema, 
  insertTaskSchema, insertInitiativeNoteSchema, updateKeyResultProgressSchema, createOKRFromTemplateSchema,
  type User
} from "@shared/schema";
import { z } from "zod";
import { setupEmailAuth } from "./authRoutes";
import { requireAuth, hashPassword } from "./emailAuth";
import { calculateProgressStatus } from "./progress-tracker";
import { updateObjectiveWithAutoStatus } from "./storage";
import { updateCycleStatuses } from "./cycle-status-updater";
import { gamificationService } from "./gamification";
import { populateGamificationData } from "./gamification-data";

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
      // Hash the password before storing
      const { password, ...userData } = req.body;
      const hashedPassword = await hashPassword(password);
      
      const user = await storage.upsertUser({
        ...userData,
        password: hashedPassword
      });
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

  app.put('/api/users/:id/password', requireAuth, async (req, res) => {
    try {
      const { password } = req.body;
      const hashedPassword = await hashPassword(password);
      
      const updatedUser = await storage.updateUser(req.params.id, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
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
      // Include member data for each team
      const teamsWithMembers = await Promise.all(teams.map(async (team) => {
        const members = await storage.getTeamMembers(team.id);
        return {
          ...team,
          members: members
        };
      }));
      res.json(teamsWithMembers);
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
      
      // If ownerType is team, set teamId to ownerId
      const objectiveData = {
        ...validatedData.objective,
        teamId: validatedData.objective.ownerType === 'team' ? validatedData.objective.ownerId : null
      };
      
      // Create objective
      const objective = await storage.createObjective(objectiveData);
      console.log("Created objective:", objective);
      
      // Create key results
      const keyResults = [];
      for (const krData of validatedData.keyResults) {
        // Handle empty baseValue - convert empty string to null for database
        const processedKrData = {
          ...krData,
          objectiveId: objective.id,
          baseValue: krData.baseValue === "" ? null : krData.baseValue
        };
        const keyResult = await storage.createKeyResult(processedKrData);
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
      // If ownerType is team, set teamId to ownerId
      const objectiveUpdate = {
        ...validatedData.objective,
        teamId: validatedData.objective.ownerType === 'team' && validatedData.objective.ownerId 
          ? validatedData.objective.ownerId 
          : (validatedData.objective.ownerType === 'user' ? null : validatedData.objective.teamId),
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
        // Handle empty baseValue - convert empty string to null for database
        const processedKrData = {
          ...krData,
          baseValue: krData.baseValue === "" ? null : krData.baseValue
        };
        
        if (krData.id) {
          // Update existing key result
          const updated = await storage.updateKeyResult(krData.id, processedKrData);
          if (updated) keyResults.push(updated);
        } else {
          // Create new key result - ensure required fields are present
          if (krData.title && krData.targetValue) {
            const created = await storage.createKeyResult({
              ...processedKrData,
              objectiveId: id,
              title: krData.title,
              targetValue: krData.targetValue
            });
            keyResults.push(created);
          }
        }
      }
      
      // Recalculate objective progress and status after key results changes
      await updateObjectiveWithAutoStatus(id);
      
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

  // Get all key results
  app.get("/api/key-results", async (req, res) => {
    try {
      const keyResults = await storage.getKeyResults();
      res.json(keyResults);
    } catch (error) {
      console.error("Error fetching key results:", error);
      res.status(500).json({ message: "Failed to fetch key results" });
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

      // Award points for creating a check-in
      try {
        await gamificationService.awardPoints(
          checkInData.createdBy,
          "check_in_created",
          "key_result",
          keyResultId,
          10, // 10 points for check-in
          { value: req.body.value, notes: req.body.notes }
        );
      } catch (gamificationError) {
        console.error("Error awarding points for check-in:", gamificationError);
        // Don't fail the check-in creation if gamification fails
      }
      
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

  // Update Key Result (full update)
  app.patch("/api/key-results/:id", async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const updateData = req.body;
      
      // Convert numeric strings to numbers
      if (updateData.currentValue) updateData.currentValue = parseFloat(updateData.currentValue).toString();
      if (updateData.targetValue) updateData.targetValue = parseFloat(updateData.targetValue).toString();
      if (updateData.baseValue) updateData.baseValue = updateData.baseValue ? parseFloat(updateData.baseValue).toString() : null;
      
      // Convert date string to Date if provided
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }

      const updatedKeyResult = await storage.updateKeyResult(keyResultId, updateData);
      
      if (!updatedKeyResult) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      res.json(updatedKeyResult);
    } catch (error) {
      console.error("Error updating key result:", error);
      res.status(500).json({ message: "Failed to update key result" });
    }
  });

  // Delete Key Result
  app.delete("/api/key-results/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteKeyResult(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      res.status(200).json({ message: "Key result deleted successfully" });
    } catch (error) {
      console.error("Error deleting key result:", error);
      res.status(500).json({ message: "Failed to delete key result" });
    }
  });

  // Get initiatives for a key result
  app.get("/api/key-results/:id/initiatives", async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const initiatives = await storage.getInitiativesByKeyResultId(keyResultId);
      res.json(initiatives);
    } catch (error) {
      console.error("Error fetching initiatives:", error);
      res.status(500).json({ message: "Failed to fetch initiatives" });
    }
  });

  // Create initiative for a key result (requires authentication)
  app.post("/api/key-results/:id/initiatives", requireAuth, async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const currentUser = (req as any).user;
      const { members, tasks, ...initiativeData } = req.body;
      
      console.log("Initiative creation request:", JSON.stringify(req.body, null, 2));
      console.log("Current user:", currentUser);
      console.log("Initiative data:", initiativeData);
      
      const validatedData = insertInitiativeSchema.parse({
        ...initiativeData,
        keyResultId,
        createdBy: currentUser.id,
        picId: initiativeData.picId === "none" || !initiativeData.picId ? null : initiativeData.picId,
        budget: initiativeData.budget ? initiativeData.budget.toString() : null,
        startDate: initiativeData.startDate ? new Date(initiativeData.startDate) : null,
        dueDate: initiativeData.dueDate ? new Date(initiativeData.dueDate) : null,
      });
      
      const initiative = await storage.createInitiative(validatedData);
      
      // Add members to the initiative if provided
      if (members && Array.isArray(members) && members.length > 0) {
        for (const userId of members) {
          await storage.createInitiativeMember({
            initiativeId: initiative.id,
            userId,
            role: "member",
          });
        }
      }
      
      // Create tasks for the initiative if provided
      if (tasks && Array.isArray(tasks) && tasks.length > 0) {
        for (const taskData of tasks) {
          const validatedTaskData = insertTaskSchema.parse({
            ...taskData,
            initiativeId: initiative.id,
            createdBy: currentUser.id,
            assignedTo: taskData.assignedTo === "none" || !taskData.assignedTo ? null : taskData.assignedTo,
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          });
          await storage.createTask(validatedTaskData);
        }
      }

      // Award points for creating an initiative
      try {
        await gamificationService.awardPoints(
          currentUser.id,
          "initiative_created",
          "initiative",
          initiative.id,
          25, // 25 points for creating initiative
          { title: initiative.title, keyResultId }
        );
      } catch (gamificationError) {
        console.error("Error awarding points for initiative creation:", gamificationError);
      }
      
      res.status(201).json(initiative);
    } catch (error) {
      console.error("Error creating initiative:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create initiative" });
    }
  });

  // Update initiative
  app.patch("/api/initiatives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["not_started", "in_progress", "completed", "on_hold"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.string().nullable().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      const processedData = {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      };
      const updatedInitiative = await storage.updateInitiative(id, processedData);
      
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error updating initiative:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update initiative" });
    }
  });

  // Update initiative
  app.put("/api/initiatives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const updateData = req.body;
      
      // Convert date strings to Date objects if present
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      
      // Handle null values for optional fields
      if (updateData.picId === "none" || updateData.picId === "") {
        updateData.picId = null;
      }
      if (updateData.budget === "") {
        updateData.budget = null;
      }
      
      // Check if we're updating members
      if (updateData.members !== undefined) {
        // Get current initiative details
        const currentInitiative = await storage.getInitiativeWithDetails(id);
        if (!currentInitiative) {
          return res.status(404).json({ message: "Initiative not found" });
        }
        
        // Get current members
        const currentMembers = await storage.getInitiativeMembers(id);
        const currentMemberIds = currentMembers.map(m => m.userId);
        
        // Find members being removed
        const newMemberIds = updateData.members || [];
        const removedMemberIds = currentMemberIds.filter(memberId => !newMemberIds.includes(memberId));
        
        // Check if any removed members have assigned tasks
        if (removedMemberIds.length > 0) {
          const tasks = await storage.getTasksByInitiativeId(id);
          const membersWithTasks = [];
          
          for (const memberId of removedMemberIds) {
            const memberTasks = tasks.filter(task => task.assignedTo === memberId);
            if (memberTasks.length > 0) {
              const user = await storage.getUser(memberId);
              membersWithTasks.push({
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                taskCount: memberTasks.length
              });
            }
          }
          
          if (membersWithTasks.length > 0) {
            const errorMessage = membersWithTasks
              .map(m => `${m.userName} memiliki ${m.taskCount} task`)
              .join(', ');
            return res.status(400).json({ 
              message: `Tidak dapat menghapus member karena masih memiliki task yang ditugaskan: ${errorMessage}. Silakan hapus atau reassign task terlebih dahulu.`
            });
          }
        }
        
        // Update members
        // First, delete all existing members
        await storage.deleteInitiativeMembersByInitiativeId(id);
        
        // Then add new members
        for (const userId of newMemberIds) {
          await storage.createInitiativeMember({
            initiativeId: id,
            userId: userId,
            role: "member"
          });
        }
      }
      
      // Remove members from updateData before passing to storage
      const { members, ...dataToUpdate } = updateData;
      
      const updatedInitiative = await storage.updateInitiative(id, dataToUpdate);
      
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error updating initiative:", error);
      res.status(500).json({ message: "Failed to update initiative" });
    }
  });

  // Delete initiative
  app.delete("/api/initiatives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteInitiative(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      res.status(200).json({ message: "Initiative deleted successfully" });
    } catch (error) {
      console.error("Error deleting initiative:", error);
      res.status(500).json({ message: "Failed to delete initiative" });
    }
  });

  // Get initiative notes
  app.get("/api/initiatives/:initiativeId/notes", async (req, res) => {
    try {
      const { initiativeId } = req.params;
      const notes = await storage.getInitiativeNotes(initiativeId);
      
      // Get user information for each note
      const notesWithUsers = await Promise.all(
        notes.map(async (note) => {
          const user = await storage.getUser(note.createdBy);
          return {
            ...note,
            createdByUser: user || null
          };
        })
      );
      
      res.json(notesWithUsers);
    } catch (error) {
      console.error("Error fetching initiative notes:", error);
      res.status(500).json({ message: "Failed to fetch initiative notes" });
    }
  });

  // Create initiative note
  app.post("/api/initiatives/:initiativeId/notes", requireAuth, async (req, res) => {
    try {
      const { initiativeId } = req.params;
      const currentUser = req.user as User;
      
      const createNoteSchema = insertInitiativeNoteSchema.extend({
        initiativeId: z.string().uuid(),
        createdBy: z.string().uuid()
      });
      
      const noteData = createNoteSchema.parse({
        ...req.body,
        initiativeId,
        createdBy: currentUser.id
      });
      
      const newNote = await storage.createInitiativeNote(noteData);
      
      // Get user information for the response
      const noteWithUser = {
        ...newNote,
        createdByUser: currentUser
      };
      
      res.status(201).json(noteWithUser);
    } catch (error) {
      console.error("Error creating initiative note:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create initiative note" });
    }
  });

  // Update initiative note
  app.patch("/api/initiatives/:initiativeId/notes/:noteId", requireAuth, async (req, res) => {
    try {
      const { noteId } = req.params;
      const currentUser = req.user as User;
      
      // Get existing note to check ownership
      const existingNote = await storage.getInitiativeNotes(req.params.initiativeId);
      const note = existingNote.find(n => n.id === noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Only allow creator to update their note
      if (note.createdBy !== currentUser.id) {
        return res.status(403).json({ message: "Unauthorized to update this note" });
      }
      
      const updateNoteSchema = insertInitiativeNoteSchema.partial();
      const updateData = updateNoteSchema.parse(req.body);
      
      const updatedNote = await storage.updateInitiativeNote(noteId, updateData);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Get user information for the response
      const noteWithUser = {
        ...updatedNote,
        createdByUser: currentUser
      };
      
      res.json(noteWithUser);
    } catch (error) {
      console.error("Error updating initiative note:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update initiative note" });
    }
  });

  // Delete initiative note
  app.delete("/api/initiatives/:initiativeId/notes/:noteId", requireAuth, async (req, res) => {
    try {
      const { noteId, initiativeId } = req.params;
      const currentUser = req.user as User;
      
      // Get existing note to check ownership
      const existingNotes = await storage.getInitiativeNotes(initiativeId);
      const note = existingNotes.find(n => n.id === noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Only allow creator to delete their note
      if (note.createdBy !== currentUser.id) {
        return res.status(403).json({ message: "Unauthorized to delete this note" });
      }
      
      const deleted = await storage.deleteInitiativeNote(noteId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting initiative note:", error);
      res.status(500).json({ message: "Failed to delete initiative note" });
    }
  });

  // Update task
  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const updateData = req.body;
      
      // Handle date conversion properly
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      
      const updatedTask = await storage.updateTask(id, updateData);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Auto-add assigned user as initiative member if not already a member
      let addedAsMember = false;
      if (updatedTask.assignedTo && updatedTask.initiativeId) {
        try {
          // Check if user is already a member
          const existingMembers = await storage.getInitiativeMembers(updatedTask.initiativeId);
          const isAlreadyMember = existingMembers.some(member => 
            member.userId === updatedTask.assignedTo || member.user?.id === updatedTask.assignedTo
          );
          
          if (!isAlreadyMember) {
            // Add user as initiative member
            await storage.createInitiativeMember({
              initiativeId: updatedTask.initiativeId,
              userId: updatedTask.assignedTo,
              role: "member"
            });
            addedAsMember = true;
          }
        } catch (error) {
          console.error("Error adding user as initiative member:", error);
        }
      }
      
      res.json({ task: updatedTask, addedAsMember });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Update task status (PATCH for partial updates)
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedTask = await storage.updateTask(id, { status });
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Auto-update initiative progress when task status changes
      if (updatedTask.initiativeId) {
        try {
          await storage.updateInitiativeProgress(updatedTask.initiativeId);
        } catch (error) {
          console.error("Error updating initiative progress:", error);
        }
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
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

  // Manual Cycle Status Update
  app.post("/api/update-cycle-status", async (req, res) => {
    try {
      const updates = await updateCycleStatuses();
      
      if (updates.length === 0) {
        res.json({ 
          message: "Semua siklus sudah memiliki status yang sesuai", 
          updates: [] 
        });
      } else {
        res.json({ 
          message: `Berhasil memperbarui status ${updates.length} siklus`, 
          updates: updates 
        });
      }
    } catch (error) {
      console.error("Error updating cycle statuses:", error);
      res.status(500).json({ message: "Gagal memperbarui status siklus" });
    }
  });

  // Manual Initiative Progress Recalculation
  app.post("/api/update-initiative-progress", async (req, res) => {
    try {
      const initiatives = await storage.getInitiatives();
      let updatedCount = 0;

      for (const initiative of initiatives) {
        try {
          await storage.updateInitiativeProgress(initiative.id);
          updatedCount++;
        } catch (error) {
          console.error(`Error updating initiative ${initiative.id} progress:`, error);
        }
      }
      
      res.json({ 
        message: `Berhasil memperbarui progress ${updatedCount} initiative`,
        updatedInitiativesCount: updatedCount
      });
    } catch (error) {
      console.error("Error updating initiative progress:", error);
      res.status(500).json({ message: "Gagal memperbarui progress initiative" });
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

  // Initiative/Project routes
  app.get("/api/initiatives", async (req, res) => {
    try {
      const initiatives = await storage.getInitiatives();
      res.json(initiatives);
    } catch (error) {
      console.error("Error fetching initiatives:", error);
      res.status(500).json({ message: "Failed to fetch initiatives" });
    }
  });

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

  app.get("/api/initiatives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const initiative = await storage.getInitiativeWithDetails(id);
      
      if (!initiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      res.json(initiative);
    } catch (error) {
      console.error("Error fetching initiative:", error);
      res.status(500).json({ message: "Failed to fetch initiative" });
    }
  });

  app.patch("/api/initiatives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const updatedInitiative = await storage.updateInitiative(id, req.body);
      
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error updating initiative:", error);
      res.status(500).json({ message: "Failed to update initiative" });
    }
  });

  // Initiative member routes
  app.get("/api/initiative-members", async (req, res) => {
    try {
      const members = await storage.getAllInitiativeMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching initiative members:", error);
      res.status(500).json({ message: "Failed to fetch initiative members" });
    }
  });

  app.post("/api/initiative-members", async (req, res) => {
    try {
      const result = insertInitiativeMemberSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid member data", errors: result.error.errors });
      }

      const member = await storage.createInitiativeMember(result.data);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding initiative member:", error);
      res.status(500).json({ message: "Failed to add member" });
    }
  });

  app.delete("/api/initiative-members/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteInitiativeMember(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing initiative member:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  // Initiative document routes
  app.post("/api/initiative-documents", async (req, res) => {
    try {
      const result = insertInitiativeDocumentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid document data", errors: result.error.errors });
      }

      const document = await storage.createInitiativeDocument(result.data);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error adding initiative document:", error);
      res.status(500).json({ message: "Failed to add document" });
    }
  });

  app.delete("/api/initiative-documents/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteInitiativeDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing initiative document:", error);
      res.status(500).json({ message: "Failed to remove document" });
    }
  });

  // Task routes
  app.post("/api/tasks", async (req, res) => {
    try {
      const result = insertTaskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid task data", errors: result.error.errors });
      }

      const task = await storage.createTask(result.data);
      
      // Auto-add assigned user as initiative member if not already a member
      let addedAsMember = false;
      if (task.assignedTo && task.initiativeId) {
        try {
          // Check if user is already a member
          const existingMembers = await storage.getInitiativeMembers(task.initiativeId);
          const isAlreadyMember = existingMembers.some(member => 
            member.userId === task.assignedTo || member.user?.id === task.assignedTo
          );
          
          if (!isAlreadyMember) {
            // Add user as initiative member
            await storage.createInitiativeMember({
              initiativeId: task.initiativeId,
              userId: task.assignedTo,
              role: "member"
            });
            addedAsMember = true;
          }
        } catch (error) {
          console.error("Error adding user as initiative member:", error);
        }
      }
      
      res.status(201).json({ task, addedAsMember });
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const allTasks = await storage.getTasks();
      res.json(allTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const allTasks = await storage.getTasks();
      res.json(allTasks);
    } catch (error) {
      console.error("Error fetching all tasks:", error);
      res.status(500).json({ message: "Failed to fetch all tasks" });
    }
  });

  // Get tasks for a specific user
  app.get("/api/users/:userId/tasks", async (req, res) => {
    try {
      const userId = req.params.userId;
      const userTasks = await storage.getTasksByUserId(userId);
      res.json(userTasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ message: "Failed to fetch user tasks" });
    }
  });

  // Create a standalone task
  app.post("/api/tasks", async (req, res) => {
    try {
      // Get current user ID - handle both development and production modes
      let currentUserId: string;
      if (process.env.NODE_ENV === 'development') {
        // Use mock user ID for development
        currentUserId = "550e8400-e29b-41d4-a716-446655440001";
      } else {
        // Production mode - require authentication
        if (!req.session?.userId) {
          return res.status(401).json({ message: "Authentication required" });
        }
        currentUserId = req.session.userId;
      }

      // Validate and prepare task data
      const taskData = {
        title: req.body.title,
        description: req.body.description || "",
        status: req.body.status || "not_started",
        priority: req.body.priority || "medium",
        createdBy: currentUserId,
        assignedTo: req.body.assignedTo === "unassigned" ? null : req.body.assignedTo,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        initiativeId: req.body.initiativeId === "no-initiative" ? null : req.body.initiativeId,
      };

      console.log("Creating standalone task with data:", {
        ...taskData,
        dueDate: taskData.dueDate?.toISOString(),
        currentUserId
      });

      const result = insertTaskSchema.safeParse(taskData);
      if (!result.success) {
        console.error("Task validation failed:", {
          data: taskData,
          errors: result.error.errors,
          sessionUserId: req.session?.userId,
          currentUserId
        });
        return res.status(400).json({ message: "Invalid task data", errors: result.error.errors });
      }

      const task = await storage.createTask(result.data);
      
      // Update initiative progress if task is linked to an initiative
      if (task.initiativeId) {
        await storage.updateInitiativeProgress(task.initiativeId);
      }

      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating standalone task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Get single task with details
  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const taskId = req.params.id;
      const task = await storage.getTaskWithDetails(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  // Create task for specific initiative
  // Get tasks by initiative ID
  app.get("/api/initiatives/:initiativeId/tasks", async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
      const tasks = await storage.getTasksByInitiativeId(initiativeId);
      
      // Get user details for each task
      const tasksWithUsers = await Promise.all(tasks.map(async (task) => {
        let assignedUser = null;
        if (task.assignedTo) {
          assignedUser = await storage.getUser(task.assignedTo);
        }
        return {
          ...task,
          assignedUser
        };
      }));
      
      res.json(tasksWithUsers);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/initiatives/:initiativeId/tasks", async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
      
      // Get current user ID - handle both development and production modes
      let currentUserId: string;
      if (process.env.NODE_ENV === 'development') {
        // Use mock user ID for development
        currentUserId = "550e8400-e29b-41d4-a716-446655440001";
      } else {
        // Production mode - require authentication
        if (!req.session?.userId) {
          return res.status(401).json({ message: "Authentication required" });
        }
        currentUserId = req.session.userId;
      }
      
      const taskData = {
        ...req.body,
        initiativeId,
        createdBy: currentUserId,
        assignedTo: req.body.assignedTo === "unassigned" || !req.body.assignedTo ? null : req.body.assignedTo,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      };

      const result = insertTaskSchema.safeParse(taskData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid task data", errors: result.error.errors });
      }

      const task = await storage.createTask(result.data);
      
      // Auto-add assigned user as initiative member if not already a member
      let addedAsMember = false;
      if (task.assignedTo && task.initiativeId) {
        try {
          // Check if user is already a member
          const existingMembers = await storage.getInitiativeMembers(task.initiativeId);
          const isAlreadyMember = existingMembers.some(member => member.userId === task.assignedTo);
          
          if (!isAlreadyMember) {
            // Add user as initiative member
            await storage.createInitiativeMember({
              initiativeId: task.initiativeId,
              userId: task.assignedTo,
              role: "member"
            });
            addedAsMember = true;
          }
        } catch (memberError) {
          console.error("Error adding user as initiative member:", memberError);
          // Continue without failing the task creation
        }
      }
      
      // Update initiative progress after creating task
      await storage.updateInitiativeProgress(initiativeId);
      
      res.status(201).json({ ...task, addedAsMember });
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      
      // Get the original task before updating to check previous assignee
      const originalTask = await storage.getTask(id);
      const originalAssignedTo = originalTask?.assignedTo;
      console.log("📋 Original task assignee:", originalAssignedTo);
      console.log("🔄 New assignee will be:", req.body.assignedTo);
      
      const updatedTask = await storage.updateTask(id, req.body);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Auto-add assigned user as initiative member if not already a member
      let addedAsMember = false;
      let removedAsMember = false;
      
      if (updatedTask.assignedTo && updatedTask.initiativeId) {
        try {
          // Check if user is already a member
          const existingMembers = await storage.getInitiativeMembers(updatedTask.initiativeId);
          const isAlreadyMember = existingMembers.some(member => member.userId === updatedTask.assignedTo);
          
          if (!isAlreadyMember) {
            // Add user as initiative member
            await storage.createInitiativeMember({
              initiativeId: updatedTask.initiativeId,
              userId: updatedTask.assignedTo,
              role: "member"
            });
            addedAsMember = true;
          }
        } catch (memberError) {
          console.error("Error adding user as initiative member:", memberError);
          // Continue without failing the task update
        }
      }
      
      // Check if the previous assignee should be removed from initiative members
      if (originalAssignedTo && 
          originalAssignedTo !== updatedTask.assignedTo && 
          updatedTask.initiativeId) {
        try {
          console.log("🔍 Checking member removal for user:", originalAssignedTo);
          
          // Check if the previous assignee has any other tasks in this initiative
          const allTasks = await storage.getTasksByInitiativeId(updatedTask.initiativeId);
          const hasOtherTasks = allTasks.some(task => 
            task.assignedTo === originalAssignedTo && task.id !== id
          );
          
          // Get initiative details to check if user is PIC
          const initiative = await storage.getInitiativeWithDetails(updatedTask.initiativeId);
          const isPIC = initiative && initiative.picId === originalAssignedTo;
          
          console.log(`User ${originalAssignedTo}: hasOtherTasks=${hasOtherTasks}, isPIC=${isPIC}`);
          
          // If user has no other tasks and is not PIC, remove them as member
          if (!hasOtherTasks && !isPIC) {
            const existingMembers = await storage.getInitiativeMembers(updatedTask.initiativeId);
            const memberToRemove = existingMembers.find(member => member.userId === originalAssignedTo);
            
            if (memberToRemove) {
              await storage.deleteInitiativeMember(memberToRemove.id);
              removedAsMember = true;
              console.log("✅ Member removed from initiative");
            }
          }
        } catch (memberError) {
          console.error("Error removing user from initiative members:", memberError);
        }
      } else {
        console.log("❌ Member removal conditions not met:", {
          originalAssignedTo: !!originalAssignedTo,
          differentAssignee: originalAssignedTo !== updatedTask.assignedTo,
          hasInitiativeId: !!updatedTask.initiativeId
        });
      }
      
      // Update initiative progress after updating task
      await storage.updateInitiativeProgress(updatedTask.initiativeId);
      
      res.json({ task: updatedTask, addedAsMember, removedAsMember });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const updatedTask = await storage.updateTask(id, req.body);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
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

  // Gamification API Routes
  app.get("/api/gamification/stats/:userId", requireAuth, async (req, res) => {
    try {
      const userId = req.params.userId;
      const stats = await gamificationService.getUserStats(userId);
      
      if (!stats) {
        // Initialize stats for new user
        const newStats = await gamificationService.initializeUserStats(userId);
        return res.json(newStats);
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get("/api/gamification/achievements/:userId", requireAuth, async (req, res) => {
    try {
      const userId = req.params.userId;
      const achievements = await gamificationService.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  app.get("/api/gamification/activity/:userId", requireAuth, async (req, res) => {
    try {
      const userId = req.params.userId;
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await gamificationService.getUserActivity(userId, limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  app.get("/api/gamification/leaderboard", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await gamificationService.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Initialize gamification data
  app.post("/api/gamification/initialize", requireAuth, async (req, res) => {
    try {
      await populateGamificationData();
      res.json({ message: "Gamification data initialized successfully" });
    } catch (error) {
      console.error("Error initializing gamification data:", error);
      res.status(500).json({ message: "Failed to initialize gamification data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
