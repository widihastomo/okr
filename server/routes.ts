import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCycleSchema, insertTemplateSchema, insertObjectiveSchema, insertKeyResultSchema, 
  insertCheckInSchema, insertInitiativeSchema, insertInitiativeMemberSchema, insertInitiativeDocumentSchema, 
  insertTaskSchema, insertTaskCommentSchema, insertInitiativeNoteSchema, updateKeyResultProgressSchema, createOKRFromTemplateSchema,
  insertSuccessMetricSchema, insertSuccessMetricUpdateSchema, insertDailyReflectionSchema, updateOnboardingProgressSchema,
  subscriptionPlans, organizations, organizationSubscriptions, users, dailyReflections,
  type User, type SubscriptionPlan, type Organization, type OrganizationSubscription, type UserOnboardingProgress, type UpdateOnboardingProgress
} from "@shared/schema";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { setupEmailAuth } from "./authRoutes";
import { requireAuth, hashPassword } from "./emailAuth";
import { calculateProgressStatus } from "./progress-tracker";
import { updateObjectiveWithAutoStatus } from "./storage";
import { updateCycleStatuses } from "./cycle-status-updater";
import { gamificationService } from "./gamification";
import { populateGamificationData } from "./gamification-data";
import { registerAIRoutes } from "./ai-routes";
import { NotificationService } from "./notification-service";
import { calculateKeyResultProgress } from "@shared/progress-calculator";
import { 
  generateHabitSuggestions, 
  generateFallbackHabitSuggestions,
  type HabitAlignmentRequest 
} from "./habit-alignment";
import { db } from "./db";
import { eq, and, desc, inArray } from "drizzle-orm";

// System Owner middleware to protect admin endpoints
const isSystemOwner = (req: any, res: any, next: any) => {
  const user = req.user as User;
  if (!user?.isSystemOwner) {
    return res.status(403).json({ message: "Access denied. System owner access required." });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupEmailAuth(app);
  
  // Auto-login middleware for development (before auth routes)
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      if (!req.session.userId && req.path.startsWith('/api/')) {
        req.session.userId = "11111111-1111-1111-1111-111111111111"; // System owner ID
        console.log('🔄 Auto-login middleware: session set for development');
      }
      next();
    });
  }

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
  app.get("/api/cycles", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all cycles, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      // If system owner, return all cycles, otherwise filter by organization
      if (currentUser.isSystemOwner) {
        const cycles = await storage.getCycles();
        res.json(cycles);
      } else {
        const cycles = await storage.getCyclesByOrganization(currentUser.organizationId!);
        res.json(cycles);
      }
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
  app.get("/api/objectives", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all objectives, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let objectives;
      if (currentUser.isSystemOwner) {
        objectives = await storage.getObjectives();
      } else {
        objectives = await storage.getObjectivesByOrganization(currentUser.organizationId!);
      }
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

  // Get cascade deletion info for objective
  app.get("/api/objectives/:id/cascade-info", async (req, res) => {
    try {
      const id = req.params.id;
      
      // Get objective info
      const objective = await storage.getObjective(id);
      if (!objective) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      // Get key results count
      const keyResultsList = await storage.getKeyResultsByObjectiveId(id);
      
      // Get initiatives count (from all key results)
      let initiativesCount = 0;
      let tasksCount = 0;
      
      for (const keyResult of keyResultsList) {
        const keyResultInitiatives = await storage.getInitiativesByKeyResultId(keyResult.id);
        initiativesCount += keyResultInitiatives.length;
        
        // Get tasks count for each initiative
        for (const initiative of keyResultInitiatives) {
          const initiativeTasks = await storage.getTasksByInitiativeId(initiative.id);
          tasksCount += initiativeTasks.length;
        }
      }
      
      res.json({
        objective: {
          id: objective.id,
          title: objective.title
        },
        counts: {
          keyResults: keyResultsList.length,
          initiatives: initiativesCount,
          tasks: tasksCount
        }
      });
    } catch (error) {
      console.error("Error getting cascade info:", error);
      res.status(500).json({ message: "Failed to get cascade info" });
    }
  });

  app.delete("/api/objectives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteObjectiveWithCascade(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Objective not found" });
      }
      
      res.json({ message: "Objective and all related data deleted successfully" });
    } catch (error) {
      console.error("Error deleting objective:", error);
      res.status(500).json({ message: "Failed to delete objective" });
    }
  });

  // User management endpoints
  app.get('/api/users', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all users, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let orgUsers;
      if (currentUser.isSystemOwner) {
        orgUsers = await storage.getUsers();
      } else {
        orgUsers = await storage.getUsersByOrganization(currentUser.organizationId!);
      }
      res.json(orgUsers);
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
  app.get('/api/teams', requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all teams, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let teams;
      if (currentUser.isSystemOwner) {
        teams = await storage.getTeams();
      } else {
        teams = await storage.getTeamsByOrganization(currentUser.organizationId!);
      }
      
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
        })).optional().default([])
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
        // Handle empty numeric values - use appropriate defaults based on key result type
        const processedKrData = {
          ...krData,
          objectiveId: objective.id,
          baseValue: krData.baseValue === "" ? null : krData.baseValue,
          // Schema requires targetValue and currentValue to be non-null, use "0" as default
          targetValue: krData.targetValue === "" ? "0" : krData.targetValue,
          currentValue: krData.currentValue === "" ? "0" : krData.currentValue,
          // Handle empty assignedTo field - convert empty string to null
          assignedTo: krData.assignedTo === "" ? null : krData.assignedTo
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
          baseValue: krData.baseValue === "" ? null : krData.baseValue,
          // Handle empty assignedTo field - convert empty string to null
          assignedTo: krData.assignedTo === "" ? null : krData.assignedTo
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
              targetValue: krData.targetValue,
              // Ensure numeric fields have proper defaults
              currentValue: krData.currentValue === "" ? "0" : krData.currentValue || "0"
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

  // Get comprehensive activity log for an objective
  app.get("/api/objectives/:id/activity-log", async (req, res) => {
    try {
      const objectiveId = req.params.id;
      
      // Get objective with key results
      const objective = await storage.getOKRWithKeyResults(objectiveId);
      if (!objective) {
        return res.status(404).json({ message: "Objective not found" });
      }

      // Collect all activities
      const activities = [];

      // 1. Key Result check-ins
      for (const kr of objective.keyResults) {
        const checkIns = await storage.getCheckInsByKeyResultId(kr.id);
        for (const checkIn of checkIns) {
          // Calculate progress percentage based on Key Result type
          const progressResult = calculateKeyResultProgress(
            checkIn.value,
            kr.targetValue,
            kr.keyResultType,
            kr.baseValue
          );
          
          activities.push({
            id: checkIn.id,
            type: 'key_result_checkin',
            entityId: kr.id,
            entityTitle: kr.title,
            action: 'update',
            value: progressResult.progressPercentage.toString(),
            unit: '%',
            notes: checkIn.notes,
            confidence: checkIn.confidence,
            createdAt: checkIn.createdAt,
            createdBy: checkIn.createdBy,
          });
        }
      }

      // 2. Initiative updates (from initiatives related to key results)
      const initiatives = await storage.getInitiativesByObjectiveId(objectiveId);
      for (const initiative of initiatives) {
        activities.push({
          id: initiative.id,
          type: 'initiative',
          entityId: initiative.id,
          entityTitle: initiative.title,
          action: 'update',
          value: initiative.progressPercentage?.toString(),
          unit: '%',
          notes: `Status: ${initiative.status}, Priority: ${initiative.priority}`,
          createdAt: initiative.updatedAt || initiative.createdAt,
          createdBy: initiative.picId,
        });

        // 3. Task updates (from tasks related to initiatives)
        const tasks = await storage.getTasksByInitiativeId(initiative.id);
        for (const task of tasks) {
          activities.push({
            id: task.id,
            type: 'task',
            entityId: task.id,
            entityTitle: task.title,
            action: task.status === 'completed' ? 'completed' : 'update',
            value: task.status === 'completed' ? '100' : task.status === 'in_progress' ? '50' : '0',
            unit: '%',
            notes: `Status: ${task.status}, Priority: ${task.priority}`,
            createdAt: task.createdAt,
            createdBy: task.assignedTo,
          });
        }
      }

      // Sort by most recent
      activities.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ message: "Failed to fetch activity log" });
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

  // Create standalone key result
  app.post("/api/key-results", requireAuth, async (req, res) => {
    try {
      const keyResultData = insertKeyResultSchema.parse({
        ...req.body,
        // Ensure proper defaults for required fields
        currentValue: req.body.currentValue === "" ? "0" : req.body.currentValue || "0",
        targetValue: req.body.targetValue === "" ? "0" : req.body.targetValue,
        baseValue: req.body.baseValue === "" ? "0" : req.body.baseValue,
        unit: req.body.unit || "number",
        status: req.body.status || "in_progress",
        assignedTo: req.body.assignedTo === "" ? null : req.body.assignedTo
      });

      const keyResult = await storage.createKeyResult(keyResultData);
      
      // Update objective progress and status after adding key result
      if (keyResult.objectiveId) {
        await updateObjectiveWithAutoStatus(keyResult.objectiveId);
      }

      res.status(201).json(keyResult);
    } catch (error) {
      console.error("Error creating key result:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create key result", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Delete key result
  app.delete("/api/key-results/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      
      // Get key result info before deletion for objective update
      const keyResult = await storage.getKeyResult(id);
      const objectiveId = keyResult?.objectiveId;
      
      // Delete the key result (cascade deletion should handle related check-ins)
      const deleted = await storage.deleteKeyResult(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Key result not found" });
      }
      
      // Update objective progress and status after key result deletion
      if (objectiveId) {
        await updateObjectiveWithAutoStatus(objectiveId);
      }
      
      res.json({ message: "Key result deleted successfully" });
    } catch (error) {
      console.error("Error deleting key result:", error);
      res.status(500).json({ message: "Failed to delete key result", error: error instanceof Error ? error.message : String(error) });
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
      
      // Get the key result to include objectiveId in response for cache invalidation
      const keyResult = await storage.getKeyResult(keyResultId);
      
      res.status(201).json({
        ...checkIn,
        objectiveId: keyResult?.objectiveId
      });
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
      
      // Ensure unit field is never null - set default if missing or null
      if (!updateData.unit || updateData.unit === null) {
        updateData.unit = "number";
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
            role: "contributor"
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

  // Success Metrics endpoints
  app.get("/api/initiatives/:initiativeId/success-metrics", async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
      const metrics = await storage.getSuccessMetricsByInitiativeId(initiativeId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching success metrics:", error);
      res.status(500).json({ message: "Failed to fetch success metrics" });
    }
  });

  app.post("/api/initiatives/:initiativeId/success-metrics", requireAuth, async (req, res) => {
    try {
      const initiativeId = req.params.initiativeId;
      const result = insertSuccessMetricSchema.safeParse({
        ...req.body,
        initiativeId
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid success metric data", errors: result.error.errors });
      }

      const metric = await storage.createSuccessMetric(result.data);
      res.status(201).json(metric);
    } catch (error) {
      console.error("Error creating success metric:", error);
      res.status(500).json({ message: "Failed to create success metric" });
    }
  });

  app.patch("/api/success-metrics/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const updatedMetric = await storage.updateSuccessMetric(id, req.body);
      
      if (!updatedMetric) {
        return res.status(404).json({ message: "Success metric not found" });
      }
      
      res.json(updatedMetric);
    } catch (error) {
      console.error("Error updating success metric:", error);
      res.status(500).json({ message: "Failed to update success metric" });
    }
  });

  app.delete("/api/success-metrics/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteSuccessMetric(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Success metric not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting success metric:", error);
      res.status(500).json({ message: "Failed to delete success metric" });
    }
  });

  // Success Metric Updates endpoints
  app.get("/api/success-metrics/:metricId/updates", async (req, res) => {
    try {
      const metricId = req.params.metricId;
      const updates = await storage.getSuccessMetricUpdates(metricId);
      res.json(updates);
    } catch (error) {
      console.error("Error fetching success metric updates:", error);
      res.status(500).json({ message: "Failed to fetch success metric updates" });
    }
  });

  app.post("/api/success-metrics/:metricId/updates", requireAuth, async (req, res) => {
    try {
      const metricId = req.params.metricId;
      const currentUser = req.user as User;
      
      const result = insertSuccessMetricUpdateSchema.safeParse({
        ...req.body,
        metricId,
        createdBy: currentUser.id
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid update data", errors: result.error.errors });
      }

      const update = await storage.createSuccessMetricUpdate(result.data);
      
      // Update the metric's current achievement value
      await storage.updateSuccessMetric(metricId, {
        achievement: result.data.achievement
      });
      
      res.status(201).json(update);
    } catch (error) {
      console.error("Error creating success metric update:", error);
      res.status(500).json({ message: "Failed to create success metric update" });
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
          if (cycle) {
            const startDate = new Date(cycle.startDate);
            const endDate = new Date(cycle.endDate);
            
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

  // Get Key Result Check-in Count
  app.get("/api/key-results/:id/check-ins/count", async (req, res) => {
    try {
      const keyResultId = req.params.id;
      const checkIns = await storage.getCheckInsByKeyResultId(keyResultId);
      res.json({ count: checkIns.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch check-in count" });
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
  app.get("/api/initiatives", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all initiatives, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let initiatives;
      if (currentUser.isSystemOwner) {
        initiatives = await storage.getInitiatives();
      } else {
        initiatives = await storage.getInitiativesByOrganization(currentUser.organizationId!);
      }
      res.json(initiatives);
    } catch (error) {
      console.error("Error fetching initiatives:", error);
      res.status(500).json({ message: "Failed to fetch initiatives" });
    }
  });

  // Get initiatives by objective ID
  app.get("/api/initiatives/objective/:id", async (req, res) => {
    try {
      const objectiveId = req.params.id;
      const initiatives = await storage.getInitiativesByObjectiveId(objectiveId);
      res.json(initiatives);
    } catch (error) {
      console.error("Error fetching initiatives for objective:", error);
      res.status(500).json({ message: "Failed to fetch initiatives" });
    }
  });

  app.post("/api/initiatives", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      console.log("Initiative creation request:", JSON.stringify(req.body, null, 2));
      console.log("Current user:", currentUser);
      
      // Calculate priority score automatically using the priority calculator
      const { impactScore, effortScore, confidenceScore } = req.body;
      
      let calculatedPriorityScore = null;
      let calculatedPriorityLevel = "medium";
      
      if (impactScore && effortScore && confidenceScore) {
        try {
          const { calculatePriority } = await import("./priority-calculator");
          const priorityResult = calculatePriority({
            impactScore,
            effortScore,
            confidenceScore
          });
          calculatedPriorityScore = priorityResult.priorityScore.toString();
          calculatedPriorityLevel = priorityResult.priorityLevel;
          
          console.log("Priority calculation result:", {
            inputs: { impactScore, effortScore, confidenceScore },
            result: priorityResult
          });
        } catch (calcError) {
          console.error("Priority calculation error:", calcError);
        }
      }
      
      // Process the initiative data with authentication
      const initiativeData = {
        ...req.body,
        createdBy: currentUser.id,
        picId: req.body.picId === "none" || !req.body.picId ? null : req.body.picId,
        budget: req.body.budget ? req.body.budget.toString() : null,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        priorityScore: calculatedPriorityScore,
        priority: calculatedPriorityLevel,
      };
      
      const result = insertInitiativeSchema.safeParse(initiativeData);
      if (!result.success) {
        console.error("Validation errors:", JSON.stringify(result.error.errors, null, 2));
        return res.status(400).json({ message: "Invalid initiative data", errors: result.error.errors });
      }

      const initiative = await storage.createInitiative(result.data);
      
      // Award points for creating an initiative
      try {
        await gamificationService.awardPoints(
          currentUser.id,
          "initiative_created",
          "initiative",
          initiative.id,
          25, // 25 points for creating initiative
          { title: initiative.title, keyResultId: initiative.keyResultId }
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

  // Create initiative with success metrics
  app.post("/api/initiatives/with-metrics", requireAuth, async (req, res) => {
    try {
      const { initiative, successMetrics } = req.body;
      const currentUser = req.user as User;

      // Add auth fields to initiative
      const initiativeData = {
        ...initiative,
        keyResultId: req.body.keyResultId,
        createdBy: currentUser.id,
      };

      // Validate initiative data
      const initiativeResult = insertInitiativeSchema.safeParse(initiativeData);
      if (!initiativeResult.success) {
        return res.status(400).json({ 
          message: "Invalid initiative data", 
          errors: initiativeResult.error.errors 
        });
      }

      // Create the initiative
      const newInitiative = await storage.createInitiative(initiativeResult.data);

      // Create success metrics if provided
      if (successMetrics && successMetrics.length > 0) {
        const metricPromises = successMetrics.map((metric: any) => {
          const metricData = {
            ...metric,
            initiativeId: newInitiative.id,
          };
          return storage.createSuccessMetric(metricData);
        });

        await Promise.all(metricPromises);
      }

      res.status(201).json(newInitiative);
    } catch (error) {
      console.error("Error creating initiative with metrics:", error);
      res.status(500).json({ message: "Failed to create initiative with metrics" });
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
      
      // If impact, effort, or confidence scores are being updated, recalculate priority
      const { impactScore, effortScore, confidenceScore } = req.body;
      let updateData = { ...req.body };
      
      if (impactScore || effortScore || confidenceScore) {
        // Get current initiative data to merge with new scores
        const currentInitiative = await storage.getInitiativeWithDetails(id);
        if (currentInitiative) {
          const scores = {
            impactScore: impactScore || currentInitiative.impactScore,
            effortScore: effortScore || currentInitiative.effortScore,
            confidenceScore: confidenceScore || currentInitiative.confidenceScore
          };
          
          try {
            const { calculatePriority } = await import("./priority-calculator");
            const priorityResult = calculatePriority(scores);
            
            updateData.priorityScore = priorityResult.priorityScore.toString();
            updateData.priority = priorityResult.priorityLevel;
            
            console.log("Priority recalculation for update:", {
              initiativeId: id,
              inputs: scores,
              result: priorityResult
            });
          } catch (calcError) {
            console.error("Priority calculation error during update:", calcError);
          }
        }
      }
      
      const updatedInitiative = await storage.updateInitiative(id, updateData);
      
      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }
      
      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error updating initiative:", error);
      res.status(500).json({ message: "Failed to update initiative" });
    }
  });

  app.put("/api/initiatives/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const result = insertInitiativeSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid initiative data", errors: result.error.errors });
      }

      const updatedInitiative = await storage.updateInitiative(id, result.data);
      
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


  // Get all tasks
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      
      // System owners can access all tasks, regular users need organization
      if (!currentUser.isSystemOwner && !currentUser.organizationId) {
        return res.status(400).json({ message: "User not associated with an organization" });
      }
      
      let allTasks;
      if (currentUser.isSystemOwner) {
        allTasks = await storage.getTasks();
      } else {
        allTasks = await storage.getTasksByOrganization(currentUser.organizationId!);
      }
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
      if (process.env.NODE_ENV !== 'production') {
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
        assignedTo: req.body.assignedTo === "unassigned" || !req.body.assignedTo ? null : req.body.assignedTo,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        initiativeId: req.body.initiativeId === "no-initiative" || !req.body.initiativeId ? null : req.body.initiativeId,
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

  // Get tasks for an objective
  app.get("/api/tasks/objective/:objectiveId", async (req, res) => {
    try {
      const objectiveId = req.params.objectiveId;
      
      // First get all initiatives for this objective
      const initiatives = await storage.getInitiativesByObjectiveId(objectiveId);
      
      // Then get all tasks for these initiatives
      const tasks = [];
      for (const initiative of initiatives) {
        const initiativeTasks = await storage.getTasksByInitiativeId(initiative.id);
        
        // Add initiative info to each task
        const tasksWithInitiative = initiativeTasks.map(task => ({
          ...task,
          initiative: {
            id: initiative.id,
            title: initiative.title
          }
        }));
        
        tasks.push(...tasksWithInitiative);
      }
      
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks for objective:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
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
      if (updatedTask.initiativeId && typeof updatedTask.initiativeId === 'string') {
        await storage.updateInitiativeProgress(updatedTask.initiativeId);
      }
      
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

  // Task Comments API Routes
  app.get("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const taskId = req.params.taskId;
      const comments = await storage.getTaskComments(taskId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching task comments:", error);
      res.status(500).json({ message: "Failed to fetch task comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", requireAuth, async (req, res) => {
    try {
      const taskId = req.params.taskId;
      const currentUser = req.user as User;
      
      const commentData = {
        ...req.body,
        taskId,
        userId: currentUser.id,
      };
      
      const result = insertTaskCommentSchema.safeParse(commentData);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid comment data", 
          errors: result.error.errors 
        });
      }

      const comment = await storage.createTaskComment(result.data);
      
      // Create notifications for comment added and user mentions
      try {
        // Get task details to know who is assigned to it
        const task = await storage.getTask(taskId);
        
        if (task) {
          // Notify assigned user about new comment
          if (task.assignedTo && task.assignedTo !== currentUser.id) {
            await NotificationService.notifyCommentAdded(
              taskId,
              task.title,
              task.assignedTo,
              currentUser.id,
              currentUser.organizationId || ""
            );
          }
          
          // Notify mentioned users
          if (result.data.mentionedUsers && Array.isArray(result.data.mentionedUsers)) {
            for (const mentionedUserId of result.data.mentionedUsers) {
              if (mentionedUserId && mentionedUserId.trim() && mentionedUserId !== currentUser.id) {
                await NotificationService.notifyUserMentioned(
                  taskId,
                  task.title,
                  mentionedUserId,
                  currentUser.id,
                  currentUser.organizationId || ""
                );
              }
            }
          }
        }
      } catch (notificationError) {
        console.error("Error creating notifications for comment:", notificationError);
        // Don't fail the comment creation if notifications fail
      }
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating task comment:", error);
      res.status(500).json({ message: "Failed to create task comment" });
    }
  });

  app.put("/api/tasks/:taskId/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const { taskId, commentId } = req.params;
      const currentUser = req.user as User;
      
      const commentData = {
        ...req.body,
        taskId,
        userId: currentUser.id,
        isEdited: true,
        editedAt: new Date().toISOString(),
      };
      
      const result = insertTaskCommentSchema.safeParse(commentData);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid comment data", 
          errors: result.error.errors 
        });
      }

      const comment = await storage.updateTaskComment(commentId, result.data);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.json(comment);
    } catch (error) {
      console.error("Error updating task comment:", error);
      res.status(500).json({ message: "Failed to update task comment" });
    }
  });

  app.delete("/api/tasks/:taskId/comments/:commentId", requireAuth, async (req, res) => {
    try {
      const { commentId } = req.params;
      const deleted = await storage.deleteTaskComment(commentId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task comment:", error);
      res.status(500).json({ message: "Failed to delete task comment" });
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

  // Habit Alignment Wizard endpoints
  app.post("/api/ai/habit-suggestions", requireAuth, async (req, res) => {
    try {
      const { objectiveIds, preferences, userId } = req.body;
      
      if (!objectiveIds || !Array.isArray(objectiveIds) || objectiveIds.length === 0) {
        return res.status(400).json({ message: "At least one objective ID is required" });
      }

      // Fetch the objectives with key results
      const objectives = await Promise.all(
        objectiveIds.map(async (id: string) => {
          const objective = await storage.getOKRWithKeyResults(id);
          if (!objective) {
            throw new Error(`Objective with ID ${id} not found`);
          }
          return objective;
        })
      );

      const request: HabitAlignmentRequest = {
        objectiveIds,
        objectives: objectives as any, // Type assertion for compatibility
        preferences: preferences || {
          timeAvailable: '30',
          difficulty: 'medium',
          categories: [],
          focusAreas: []
        },
        userId: userId || req.session?.userId || ""
      };

      try {
        // Try AI-powered suggestions first
        const result = await generateHabitSuggestions(request);
        res.json(result);
      } catch (aiError) {
        console.log("AI suggestions failed, using fallback:", aiError);
        // Fallback to rule-based suggestions
        const fallbackResult = generateFallbackHabitSuggestions(request);
        res.json(fallbackResult);
      }
    } catch (error) {
      console.error("Error generating habit suggestions:", error);
      res.status(500).json({ message: "Failed to generate habit suggestions" });
    }
  });

  // Create habit tracking entries
  app.post("/api/habits", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const habits = req.body;
      if (!Array.isArray(habits)) {
        return res.status(400).json({ message: "Habits must be an array" });
      }

      // Store habits in database (for now, just return success)
      // In a real implementation, you would save these to a habits table
      const createdHabits = habits.map((habit, index) => ({
        id: `habit-${Date.now()}-${index}`,
        ...habit,
        userId,
        createdAt: new Date().toISOString(),
        isActive: true
      }));

      console.log("Created habits:", createdHabits);
      
      res.status(201).json({ 
        message: "Habits created successfully", 
        habits: createdHabits 
      });
    } catch (error) {
      console.error("Error creating habits:", error);
      res.status(500).json({ message: "Failed to create habits" });
    }
  });

  // Get user's habits
  app.get("/api/habits", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // For now, return empty array since we haven't implemented full habit storage
      // In a real implementation, you would fetch from a habits table
      res.json([]);
    } catch (error) {
      console.error("Error fetching habits:", error);
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  // Close initiative endpoint
  app.post("/api/initiatives/:id/close", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const initiativeId = req.params.id;
      const closureData = req.body;

      // Validate closure data
      const closureSchema = z.object({
        finalResult: z.enum(['berhasil', 'tidak_berhasil', 'ulangi']),
        learningInsights: z.string().min(10),
        closureNotes: z.string().min(5),
        budgetUsed: z.number().optional(),
        attachmentUrls: z.array(z.string()).optional(),
        finalMetrics: z.array(z.object({
          metricId: z.string(),
          finalAchievement: z.string()
        }))
      });

      const validatedData = closureSchema.parse(closureData);

      // Update final metrics
      for (const metric of validatedData.finalMetrics) {
        await storage.updateSuccessMetric(metric.metricId, {
          achievement: metric.finalAchievement
        });

        // Create update record
        await storage.createSuccessMetricUpdate({
          metricId: metric.metricId,
          achievement: metric.finalAchievement,
          notes: 'Final achievement update during initiative closure',
          createdBy: userId
        });
      }

      // Update initiative with closure data
      const updatedInitiative = await storage.updateInitiative(initiativeId, {
        status: 'selesai',
        finalResult: validatedData.finalResult,
        learningInsights: validatedData.learningInsights,
        closureNotes: validatedData.closureNotes,
        budgetUsed: validatedData.budgetUsed,
        attachmentUrls: validatedData.attachmentUrls || [],
        closedBy: userId,
        closedAt: new Date(),
        completedAt: new Date()
      });

      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error closing initiative:", error);
      res.status(500).json({ message: "Failed to close initiative" });
    }
  });

  // Cancel initiative endpoint
  app.post("/api/initiatives/:id/cancel", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const initiativeId = req.params.id;
      const { cancelReason } = req.body;

      if (!cancelReason) {
        return res.status(400).json({ message: "Cancel reason is required" });
      }

      const updatedInitiative = await storage.updateInitiative(initiativeId, {
        status: 'dibatalkan',
        closureNotes: cancelReason,
        closedBy: userId,
        closedAt: new Date()
      });

      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error cancelling initiative:", error);
      res.status(500).json({ message: "Failed to cancel initiative" });
    }
  });

  // Update initiative status endpoint
  app.post("/api/initiatives/:id/update-status", requireAuth, async (req, res) => {
    try {
      const { updateInitiativeStatus } = await import("./initiative-status-manager");
      const initiativeId = req.params.id;
      
      const result = await updateInitiativeStatus(initiativeId);
      
      if (result) {
        res.json({
          message: "Status updated successfully",
          update: result
        });
      } else {
        res.json({
          message: "No status change required"
        });
      }
    } catch (error) {
      console.error("Error updating initiative status:", error);
      res.status(500).json({ message: "Failed to update initiative status" });
    }
  });

  // SaaS Subscription Routes
  
  // Get all subscription plans (public endpoint - only active plans)
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Admin API - Get all subscription plans (including inactive)
  app.get("/api/admin/subscription-plans", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.createdAt);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching admin subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Get subscription plans with billing periods
  app.get("/api/admin/subscription-plans-with-periods", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { billingPeriods } = await import("@shared/schema");
      
      const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.createdAt);
      
      // Get billing periods for each plan
      const plansWithPeriods = await Promise.all(
        plans.map(async (plan) => {
          const periods = await db.select().from(billingPeriods)
            .where(eq(billingPeriods.planId, plan.id))
            .orderBy(billingPeriods.periodMonths);
          return { ...plan, billingPeriods: periods };
        })
      );
      
      res.json(plansWithPeriods);
    } catch (error) {
      console.error("Error fetching subscription plans with billing periods:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans with billing periods" });
    }
  });

  // Admin API - Create new subscription plan
  app.post("/api/admin/subscription-plans", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        price: true, // Price is now handled through billing periods
      });
      
      const validatedData = insertSubscriptionPlanSchema.parse(req.body);
      
      const [newPlan] = await db.insert(subscriptionPlans)
        .values({
          ...validatedData,
          price: "0", // Default price, actual pricing handled by billing periods
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      res.status(201).json(newPlan);
    } catch (error: any) {
      console.error("Error creating subscription plan:", error);
      
      // Handle duplicate slug error specifically
      if (error.code === '23505' && error.constraint === 'subscription_plans_slug_key') {
        res.status(400).json({ message: "Slug sudah digunakan. Silakan gunakan slug yang berbeda." });
      } else {
        res.status(500).json({ message: "Failed to create subscription plan" });
      }
    }
  });

  // Admin API - Update subscription plan
  app.put("/api/admin/subscription-plans/:id", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const planId = req.params.id;
      
      const updateSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).partial();
      const validatedData = updateSubscriptionPlanSchema.parse(req.body);
      
      const [updatedPlan] = await db.update(subscriptionPlans)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.id, planId))
        .returning();
      
      if (!updatedPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Failed to update subscription plan" });
    }
  });

  // Admin API - Get organizations with detailed information
  app.get("/api/admin/organizations-detailed", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq, sql } = await import("drizzle-orm");
      
      console.log("🔍 Fetching organizations with detailed info...");
      
      // Get organizations with owner info and user count
      const result = await db.execute(sql`
        SELECT 
          o.*,
          u.first_name as owner_first_name,
          u.last_name as owner_last_name,
          u.email as owner_email,
          COUNT(DISTINCT org_users.id) as user_count
        FROM organizations o
        LEFT JOIN users u ON o.owner_id = u.id
        LEFT JOIN users org_users ON org_users.organization_id = o.id
        GROUP BY o.id, u.id
        ORDER BY o.created_at DESC
      `);
      
      console.log(`📊 Found ${result.rows.length} organizations in database`);
      
      const organizations = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        logo: row.logo,
        website: row.website,
        industry: row.industry,
        size: row.size,
        ownerId: row.owner_id,
        registrationStatus: row.registration_status,
        approvedBy: row.approved_by,
        approvedAt: row.approved_at,
        rejectedBy: row.rejected_by,
        rejectedAt: row.rejected_at,
        rejectionReason: row.rejection_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userCount: parseInt(row.user_count) || 0,
        owner: row.owner_first_name ? {
          firstName: row.owner_first_name,
          lastName: row.owner_last_name,
          email: row.owner_email,
        } : null,
      }));
      
      console.log(`✅ Returning ${organizations.length} organizations to client`);
      res.json(organizations);
    } catch (error) {
      console.error("❌ Error fetching detailed organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Admin API - Approve organization
  app.post("/api/admin/organizations/:id/approve", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const organizationId = req.params.id;
      const currentUser = req.user as User;
      
      const [updatedOrg] = await db.update(organizations)
        .set({
          registrationStatus: 'approved',
          approvedBy: currentUser.id,
          approvedAt: new Date(),
          // Clear rejection fields if previously rejected
          rejectedBy: null,
          rejectedAt: null,
          rejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();
      
      if (!updatedOrg) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrg);
    } catch (error) {
      console.error("Error approving organization:", error);
      res.status(500).json({ message: "Failed to approve organization" });
    }
  });

  // Admin API - Reject organization
  app.post("/api/admin/organizations/:id/reject", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const organizationId = req.params.id;
      const currentUser = req.user as User;
      const { reason } = req.body;
      
      if (!reason || !reason.trim()) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      const [updatedOrg] = await db.update(organizations)
        .set({
          registrationStatus: 'rejected',
          rejectedBy: currentUser.id,
          rejectedAt: new Date(),
          rejectionReason: reason.trim(),
          // Clear approval fields if previously approved
          approvedBy: null,
          approvedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();
      
      if (!updatedOrg) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrg);
    } catch (error) {
      console.error("Error rejecting organization:", error);
      res.status(500).json({ message: "Failed to reject organization" });
    }
  });

  // Admin API - Suspend organization
  app.post("/api/admin/organizations/:id/suspend", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const organizationId = req.params.id;
      
      const [updatedOrg] = await db.update(organizations)
        .set({
          registrationStatus: 'suspended',
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();
      
      if (!updatedOrg) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrg);
    } catch (error) {
      console.error("Error suspending organization:", error);
      res.status(500).json({ message: "Failed to suspend organization" });
    }
  });

  // Admin API - Reactivate organization
  app.post("/api/admin/organizations/:id/reactivate", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const organizationId = req.params.id;
      
      const [updatedOrg] = await db.update(organizations)
        .set({
          registrationStatus: 'approved',
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();
      
      if (!updatedOrg) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrg);
    } catch (error) {
      console.error("Error reactivating organization:", error);
      res.status(500).json({ message: "Failed to reactivate organization" });
    }
  });

  // Admin API - Delete subscription plan
  app.delete("/api/admin/subscription-plans/:id", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const planId = req.params.id;
      
      // Check if any organizations are using this plan
      const { organizationSubscriptions } = await import("@shared/schema");
      const [activeSubscription] = await db.select()
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.planId, planId))
        .limit(1);
      
      if (activeSubscription) {
        return res.status(400).json({ 
          message: "Cannot delete subscription plan that is in use by organizations" 
        });
      }
      
      const [deletedPlan] = await db.delete(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .returning();
      
      if (!deletedPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      res.json({ message: "Subscription plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ message: "Failed to delete subscription plan" });
    }
  });

  // Admin API - Toggle subscription plan status
  app.patch("/api/admin/subscription-plans/:id/toggle-status", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const planId = req.params.id;
      
      // Get current plan
      const [currentPlan] = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId));
      
      if (!currentPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      const [updatedPlan] = await db.update(subscriptionPlans)
        .set({
          isActive: !currentPlan.isActive,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.id, planId))
        .returning();
      
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error toggling subscription plan status:", error);
      res.status(500).json({ message: "Failed to toggle subscription plan status" });
    }
  });

  // Billing Period Management Endpoints
  app.post("/api/admin/billing-periods", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { billingPeriods } = await import("@shared/schema");
      const { createInsertSchema } = await import("drizzle-zod");
      
      console.log("Creating billing period with data:", req.body);
      
      const insertBillingPeriodSchema = createInsertSchema(billingPeriods).omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      });
      const validatedData = insertBillingPeriodSchema.parse(req.body);
      
      const [newPeriod] = await db.insert(billingPeriods)
        .values({
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      res.status(201).json(newPeriod);
    } catch (error) {
      console.error("Error creating billing period:", error);
      res.status(500).json({ message: "Failed to create billing period" });
    }
  });

  app.put("/api/admin/billing-periods/:id", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { billingPeriods } = await import("@shared/schema");
      const { createInsertSchema } = await import("drizzle-zod");
      const { eq } = await import("drizzle-orm");
      const periodId = req.params.id;
      
      const updateBillingPeriodSchema = createInsertSchema(billingPeriods).partial();
      const validatedData = updateBillingPeriodSchema.parse(req.body);
      
      const [updatedPeriod] = await db.update(billingPeriods)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(billingPeriods.id, periodId))
        .returning();
      
      if (!updatedPeriod) {
        return res.status(404).json({ message: "Billing period not found" });
      }
      
      res.json(updatedPeriod);
    } catch (error) {
      console.error("Error updating billing period:", error);
      res.status(500).json({ message: "Failed to update billing period" });
    }
  });

  app.delete("/api/admin/billing-periods/:id", requireAuth, isSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { billingPeriods } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const periodId = req.params.id;
      
      const [deletedPeriod] = await db.delete(billingPeriods)
        .where(eq(billingPeriods.id, periodId))
        .returning();
      
      if (!deletedPeriod) {
        return res.status(404).json({ message: "Billing period not found" });
      }
      
      res.json({ message: "Billing period deleted successfully" });
    } catch (error) {
      console.error("Error deleting billing period:", error);
      res.status(500).json({ message: "Failed to delete billing period" });
    }
  });

  // Organization subscription assignment endpoints (System Owner only)
  
  // Get organization with subscription details
  app.get("/api/admin/organizations/:id/subscription", isSystemOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { organizations, organizationSubscriptions, subscriptionPlans } = await import("@shared/schema");

      const [orgWithSubscription] = await db
        .select({
          organization: organizations,
          subscription: organizationSubscriptions,
          plan: subscriptionPlans,
        })
        .from(organizations)
        .leftJoin(organizationSubscriptions, eq(organizations.id, organizationSubscriptions.organizationId))
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizations.id, id))
        .limit(1);

      if (!orgWithSubscription) {
        return res.status(404).json({ message: "Organization not found" });
      }

      res.json(orgWithSubscription);
    } catch (error) {
      console.error("Error fetching organization subscription:", error);
      res.status(500).json({ message: "Failed to fetch organization subscription" });
    }
  });

  // Assign subscription plan to organization
  app.post("/api/admin/organizations/:id/subscription", isSystemOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      const { db } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const { organizations, organizationSubscriptions, subscriptionPlans } = await import("@shared/schema");

      // Verify organization exists
      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Verify plan exists and is active
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.isActive, true)))
        .limit(1);

      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found or inactive" });
      }

      // Check if organization already has a subscription
      const [existingSubscription] = await db
        .select()
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.organizationId, id))
        .limit(1);

      let subscription;
      if (existingSubscription) {
        // Update existing subscription
        [subscription] = await db
          .update(organizationSubscriptions)
          .set({
            planId,
            updatedAt: new Date(),
          })
          .where(eq(organizationSubscriptions.organizationId, id))
          .returning();
      } else {
        // Create new subscription
        [subscription] = await db
          .insert(organizationSubscriptions)
          .values({
            organizationId: id,
            planId,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }

      res.json({ subscription, plan });
    } catch (error) {
      console.error("Error assigning subscription:", error);
      res.status(500).json({ message: "Failed to assign subscription" });
    }
  });

  // Remove subscription from organization
  app.delete("/api/admin/organizations/:id/subscription", isSystemOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { organizationSubscriptions } = await import("@shared/schema");

      await db
        .delete(organizationSubscriptions)
        .where(eq(organizationSubscriptions.organizationId, id));

      res.json({ message: "Subscription removed successfully" });
    } catch (error) {
      console.error("Error removing subscription:", error);
      res.status(500).json({ message: "Failed to remove subscription" });
    }
  });

  // Get current user's organization and subscription
  app.get("/api/my-organization", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      
      // Get user with organization
      const user = await storage.getUser(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      // Get organization
      const [organization] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Get subscription
      const [subscription] = await db.select()
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizationSubscriptions.organizationId, organization.id));

      res.json({
        organization,
        subscription: subscription ? {
          ...subscription.organization_subscriptions,
          plan: subscription.subscription_plans
        } : null
      });
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization data" });
    }
  });

  // Get current user's organization with role information
  app.get("/api/my-organization-with-role", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      
      // Get user with organization
      const user = await storage.getUser(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      // Get organization
      const [organization] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Get subscription
      const [subscription] = await db.select()
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizationSubscriptions.organizationId, organization.id));

      res.json({
        organization,
        subscription: subscription ? {
          ...subscription.organization_subscriptions,
          plan: subscription.subscription_plans
        } : null
      });
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization data" });
    }
  });

  // Add-on Management Endpoints

  // Get all available add-ons (public)
  app.get("/api/subscription-add-ons", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { subscriptionAddOns } = await import("@shared/schema");
      
      const planSlug = req.query.planSlug as string;
      
      const addOns = await db.select().from(subscriptionAddOns).where(eq(subscriptionAddOns.isActive, true));
      
      // Filter add-ons based on plan if specified
      const filteredAddOns = planSlug 
        ? addOns.filter(addon => 
            addon.applicablePlans.length === 0 || // Available for all plans
            addon.applicablePlans.includes(planSlug)
          )
        : addOns;
      
      res.json(filteredAddOns);
    } catch (error) {
      console.error("Error fetching add-ons:", error);
      res.status(500).json({ message: "Failed to fetch add-ons" });
    }
  });

  // Get organization's add-on subscriptions
  app.get("/api/organization/add-ons", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const { organizationAddOnSubscriptions, subscriptionAddOns } = await import("@shared/schema");
      
      const user = await storage.getUser(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      const addOnSubs = await db.select({
        subscription: organizationAddOnSubscriptions,
        addOn: subscriptionAddOns
      })
      .from(organizationAddOnSubscriptions)
      .leftJoin(subscriptionAddOns, eq(organizationAddOnSubscriptions.addOnId, subscriptionAddOns.id))
      .where(eq(organizationAddOnSubscriptions.organizationId, user.organizationId));

      res.json(addOnSubs);
    } catch (error) {
      console.error("Error fetching organization add-ons:", error);
      res.status(500).json({ message: "Failed to fetch organization add-ons" });
    }
  });

  // Subscribe to an add-on
  app.post("/api/organization/add-ons/subscribe", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { addOnId, quantity = 1 } = req.body;
      
      if (!addOnId) {
        return res.status(400).json({ message: "Add-on ID is required" });
      }

      const { db } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const { 
        organizationAddOnSubscriptions, 
        subscriptionAddOns, 
        organizations 
      } = await import("@shared/schema");
      
      const user = await storage.getUser(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      // Check if user is organization owner
      const [organization] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
      if (!organization || organization.ownerId !== user.id) {
        return res.status(403).json({ message: "Only organization owner can subscribe to add-ons" });
      }

      // Get add-on details
      const [addOn] = await db.select().from(subscriptionAddOns).where(eq(subscriptionAddOns.id, addOnId));
      if (!addOn || !addOn.isActive) {
        return res.status(404).json({ message: "Add-on not found or inactive" });
      }

      // Check if already subscribed
      const [existingSubscription] = await db.select()
        .from(organizationAddOnSubscriptions)
        .where(and(
          eq(organizationAddOnSubscriptions.organizationId, user.organizationId),
          eq(organizationAddOnSubscriptions.addOnId, addOnId),
          eq(organizationAddOnSubscriptions.status, "active")
        ));

      if (existingSubscription) {
        // Update quantity if already subscribed
        const newQuantity = existingSubscription.quantity + quantity;
        const newTotalPrice = (parseFloat(addOn.unitPrice) * newQuantity).toString();
        
        const [updatedSubscription] = await db.update(organizationAddOnSubscriptions)
          .set({
            quantity: newQuantity,
            totalPrice: newTotalPrice,
            updatedAt: new Date(),
          })
          .where(eq(organizationAddOnSubscriptions.id, existingSubscription.id))
          .returning();

        res.json(updatedSubscription);
      } else {
        // Create new subscription
        const totalPrice = (parseFloat(addOn.unitPrice) * quantity).toString();
        
        const [newSubscription] = await db.insert(organizationAddOnSubscriptions)
          .values({
            organizationId: user.organizationId,
            addOnId,
            quantity,
            unitPrice: addOn.unitPrice,
            totalPrice,
            status: "active",
          })
          .returning();

        res.json(newSubscription);
      }
    } catch (error) {
      console.error("Error subscribing to add-on:", error);
      res.status(500).json({ message: "Failed to subscribe to add-on" });
    }
  });

  // Update add-on subscription quantity
  app.patch("/api/organization/add-ons/:subscriptionId", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { subscriptionId } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 0) {
        return res.status(400).json({ message: "Valid quantity is required" });
      }

      const { db } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const { 
        organizationAddOnSubscriptions, 
        subscriptionAddOns,
        organizations 
      } = await import("@shared/schema");
      
      const user = await storage.getUser(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      // Check if user is organization owner
      const [organization] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
      if (!organization || organization.ownerId !== user.id) {
        return res.status(403).json({ message: "Only organization owner can modify add-ons" });
      }

      // Get subscription with add-on details
      const [subscriptionWithAddOn] = await db.select({
        subscription: organizationAddOnSubscriptions,
        addOn: subscriptionAddOns
      })
      .from(organizationAddOnSubscriptions)
      .leftJoin(subscriptionAddOns, eq(organizationAddOnSubscriptions.addOnId, subscriptionAddOns.id))
      .where(and(
        eq(organizationAddOnSubscriptions.id, subscriptionId),
        eq(organizationAddOnSubscriptions.organizationId, user.organizationId)
      ));

      if (!subscriptionWithAddOn || !subscriptionWithAddOn.addOn) {
        return res.status(404).json({ message: "Add-on subscription not found" });
      }

      if (quantity === 0) {
        // Cancel subscription if quantity is 0
        const [cancelledSubscription] = await db.update(organizationAddOnSubscriptions)
          .set({
            status: "cancelled",
            cancelledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(organizationAddOnSubscriptions.id, subscriptionId))
          .returning();

        res.json(cancelledSubscription);
      } else {
        // Update quantity
        const newTotalPrice = (parseFloat(subscriptionWithAddOn.addOn.unitPrice) * quantity).toString();
        
        const [updatedSubscription] = await db.update(organizationAddOnSubscriptions)
          .set({
            quantity,
            totalPrice: newTotalPrice,
            updatedAt: new Date(),
          })
          .where(eq(organizationAddOnSubscriptions.id, subscriptionId))
          .returning();

        res.json(updatedSubscription);
      }
    } catch (error) {
      console.error("Error updating add-on subscription:", error);
      res.status(500).json({ message: "Failed to update add-on subscription" });
    }
  });

  // Check organization limits (for enforcing plan restrictions)
  app.get("/api/organization/check-limits", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { db } = await import("./db");
      const { eq, count, and } = await import("drizzle-orm");
      const { organizationAddOnSubscriptions, subscriptionAddOns } = await import("@shared/schema");
      
      const user = await storage.getUser(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ message: "No organization found for user" });
      }

      // Get organization subscription
      const [subscription] = await db.select()
        .from(organizationSubscriptions)
        .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(eq(organizationSubscriptions.organizationId, user.organizationId));

      if (!subscription || !subscription.subscription_plans) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      // Count users in organization
      const [{ value: userCount }] = await db.select({ value: count() })
        .from(users)
        .where(eq(users.organizationId, user.organizationId));

      // Get extra user add-ons
      const [extraUserAddOn] = await db.select({
        addOn: subscriptionAddOns,
        subscription: organizationAddOnSubscriptions
      })
      .from(organizationAddOnSubscriptions)
      .leftJoin(subscriptionAddOns, eq(organizationAddOnSubscriptions.addOnId, subscriptionAddOns.id))
      .where(and(
        eq(organizationAddOnSubscriptions.organizationId, user.organizationId),
        eq(subscriptionAddOns.slug, "extra-user"),
        eq(organizationAddOnSubscriptions.status, "active")
      ));

      const plan = subscription.subscription_plans;
      const baseMaxUsers = plan.maxUsers;
      const extraUsers = extraUserAddOn?.subscription?.quantity || 0;
      const totalMaxUsers = baseMaxUsers ? baseMaxUsers + extraUsers : null; // null means unlimited

      const limits = {
        maxUsers: totalMaxUsers,
        baseMaxUsers: baseMaxUsers,
        extraUsers: extraUsers,
        currentUsers: userCount,
        canAddUsers: totalMaxUsers ? userCount < totalMaxUsers : true,
        planName: plan.name,
        planSlug: plan.slug
      };

      res.json(limits);
    } catch (error) {
      console.error("Error checking organization limits:", error);
      res.status(500).json({ message: "Failed to check organization limits" });
    }
  });

  // System Admin Routes (only for system owner)
  const requireSystemOwner = async (req: any, res: any, next: any) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user || !(user as any).isSystemOwner) {
        return res.status(403).json({ message: "Access denied. System owner only." });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization check failed" });
    }
  };

  // Get all organizations (system admin)
  app.get("/api/admin/organizations", requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { eq, sql } = await import("drizzle-orm");
      
      const orgs = await db.select({
        organization: organizations,
        subscription: organizationSubscriptions,
        plan: subscriptionPlans,
        userCount: sql`(SELECT COUNT(*) FROM users WHERE organization_id = organizations.id)::int`
      })
      .from(organizations)
      .leftJoin(organizationSubscriptions, eq(organizations.id, organizationSubscriptions.organizationId))
      .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id));

      res.json(orgs.map(row => ({
        ...row.organization,
        subscription: row.subscription,
        plan: row.plan,
        userCount: row.userCount
      })));
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Get all users (system admin)
  app.get("/api/admin/users", requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        organizationId: users.organizationId,
        isActive: users.isActive,
        createdAt: users.createdAt
      }).from(users);

      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get system stats (system admin)
  app.get("/api/admin/stats", requireSystemOwner, async (req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      
      const stats = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM organizations WHERE created_at >= date_trunc('month', CURRENT_DATE))::int as new_orgs_this_month,
          (SELECT COUNT(*) FROM users WHERE is_active = true)::int as active_users,
          (SELECT SUM(CAST(subscription_plans.price AS NUMERIC)) 
           FROM organization_subscriptions 
           JOIN subscription_plans ON organization_subscriptions.plan_id = subscription_plans.id
           WHERE organization_subscriptions.status = 'active')::int as monthly_revenue
      `);

      const result = stats && stats.length > 0 ? (stats as any)[0] : {};
      
      res.json({
        newOrgsThisMonth: result.new_orgs_this_month || 0,
        activeUsers: result.active_users || 0,
        monthlyRevenue: result.monthly_revenue || 0,
        revenueGrowth: 15,
        uptime: "99.9%"
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Register AI routes
  registerAIRoutes(app);

  // Role Management API Routes
  const { roleManagementService } = await import("./role-management");

  // Get user permissions
  app.get("/api/users/:id/permissions", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const userWithPermissions = await roleManagementService.getUserPermissions(userId);
      res.json(userWithPermissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  // Grant permission to user
  app.post("/api/users/:id/permissions", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const { permission, resource, expiresAt } = req.body;
      const grantedBy = req.session.userId;

      await roleManagementService.grantPermission(userId, permission, grantedBy, resource, expiresAt);
      res.json({ success: true });
    } catch (error) {
      console.error("Error granting permission:", error);
      res.status(500).json({ message: "Failed to grant permission" });
    }
  });

  // Revoke permission from user
  app.delete("/api/users/:id/permissions/:permission", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const permission = req.params.permission;
      const { resource } = req.body;
      const performedBy = req.session.userId;

      await roleManagementService.revokePermission(userId, permission as any, performedBy, resource);
      res.json({ success: true });
    } catch (error) {
      console.error("Error revoking permission:", error);
      res.status(500).json({ message: "Failed to revoke permission" });
    }
  });

  // Update user role and permissions
  app.put("/api/users/:id/role", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const { role, permissions } = req.body;
      const performedBy = req.session.userId;

      await roleManagementService.updateUserRole(userId, role, permissions, performedBy);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Get organization users with permissions
  app.get("/api/organizations/:id/users", requireAuth, async (req, res) => {
    try {
      const organizationId = req.params.id;
      const users = await roleManagementService.getOrganizationUsers(organizationId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching organization users:", error);
      res.status(500).json({ message: "Failed to fetch organization users" });
    }
  });

  // Get role templates
  app.get("/api/role-templates", requireAuth, async (req, res) => {
    try {
      const organizationId = req.query.organizationId as string;
      const templates = await roleManagementService.getRoleTemplates(organizationId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching role templates:", error);
      res.status(500).json({ message: "Failed to fetch role templates" });
    }
  });

  // Create role template
  app.post("/api/role-templates", requireAuth, async (req, res) => {
    try {
      const templateData = {
        ...req.body,
        createdBy: req.session.userId,
      };
      const templateId = await roleManagementService.createRoleTemplate(templateData);
      res.json({ id: templateId, success: true });
    } catch (error) {
      console.error("Error creating role template:", error);
      res.status(500).json({ message: "Failed to create role template" });
    }
  });

  // Apply role template to user
  app.post("/api/users/:id/apply-role-template", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const { templateId } = req.body;
      const performedBy = req.session.userId;

      await roleManagementService.applyRoleTemplate(userId, templateId, performedBy);
      res.json({ success: true });
    } catch (error) {
      console.error("Error applying role template:", error);
      res.status(500).json({ message: "Failed to apply role template" });
    }
  });

  // Get user activity log
  app.get("/api/users/:id/activity", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const activityLog = await roleManagementService.getUserActivityLog(userId, limit);
      res.json(activityLog);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  // Deactivate/Reactivate user
  app.patch("/api/users/:id/status", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const { isActive } = req.body;
      const performedBy = req.session.userId;

      if (isActive) {
        await roleManagementService.reactivateUser(userId, performedBy);
      } else {
        await roleManagementService.deactivateUser(userId, performedBy);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Check if user has specific permission
  app.get("/api/users/:id/has-permission/:permission", requireAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const permission = req.params.permission;
      const resource = req.query.resource as string;

      const hasPermission = await roleManagementService.hasPermission(userId, permission as any, resource);
      res.json({ hasPermission });
    } catch (error) {
      console.error("Error checking permission:", error);
      res.status(500).json({ message: "Failed to check permission" });
    }
  });

  // Daily Reflections API routes
  app.post("/api/daily-reflections", requireAuth, async (req, res) => {
    try {
      const { date, whatWorkedWell, challenges, tomorrowPriorities } = req.body;
      const userId = (req.user as any)?.id;
      const organizationId = (req.user as any)?.organizationId;

      if (!userId || !organizationId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if reflection already exists for this date
      const existingReflection = await db
        .select()
        .from(dailyReflections)
        .where(
          and(
            eq(dailyReflections.userId, userId),
            eq(dailyReflections.date, date)
          )
        );

      if (existingReflection.length > 0) {
        // Update existing reflection
        const updatedReflection = await db
          .update(dailyReflections)
          .set({
            whatWorkedWell,
            challenges,
            tomorrowPriorities,
            updatedAt: new Date()
          })
          .where(eq(dailyReflections.id, existingReflection[0].id))
          .returning();

        res.json(updatedReflection[0]);
      } else {
        // Create new reflection
        const newReflection = await db
          .insert(dailyReflections)
          .values({
            userId,
            organizationId,
            date,
            whatWorkedWell,
            challenges,
            tomorrowPriorities
          })
          .returning();

        res.json(newReflection[0]);
      }
    } catch (error) {
      console.error("Error saving daily reflection:", error);
      res.status(500).json({ error: "Failed to save daily reflection" });
    }
  });

  app.get("/api/daily-reflections", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { date, limit = 10 } = req.query;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (date) {
        const reflections = await db
          .select()
          .from(dailyReflections)
          .where(
            and(
              eq(dailyReflections.userId, userId),
              eq(dailyReflections.date, date as string)
            )
          );
        return res.json(reflections);
      }

      const reflections = await db
        .select()
        .from(dailyReflections)
        .where(eq(dailyReflections.userId, userId))
        .orderBy(desc(dailyReflections.date))
        .limit(parseInt(limit as string));

      res.json(reflections);
    } catch (error) {
      console.error("Error fetching daily reflections:", error);
      res.status(500).json({ error: "Failed to fetch daily reflections" });
    }
  });

  // Habit Alignment API routes
  app.post("/api/habits/generate", requireAuth, async (req, res) => {
    try {
      const { generateHabitSuggestions, generateFallbackHabitSuggestions } = await import("./habit-alignment");
      
      const { objectiveIds, objectives, preferences, userId } = req.body;
      
      if (!objectiveIds || !Array.isArray(objectiveIds) || objectiveIds.length === 0) {
        return res.status(400).json({ error: "objectiveIds is required and must be a non-empty array" });
      }
      
      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({ error: "preferences is required" });
      }

      const request = {
        objectiveIds,
        objectives: objectives || [],
        preferences,
        userId: userId || (req.user as any)?.id
      };

      try {
        // Try AI-powered suggestions first
        const result = await generateHabitSuggestions(request);
        res.json(result);
      } catch (aiError) {
        console.warn('AI suggestions failed, falling back to rule-based suggestions:', aiError);
        // Fallback to rule-based suggestions
        const fallbackResult = generateFallbackHabitSuggestions(request);
        res.json(fallbackResult);
      }
    } catch (error) {
      console.error("Error generating habit suggestions:", error);
      res.status(500).json({ error: "Failed to generate habit suggestions" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await storage.getNotifications(currentUser.id, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Test notification creation endpoint
  app.post("/api/notifications/test", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;

      const testNotification = await storage.createNotification({
        userId: currentUser.id,
        organizationId: currentUser.organizationId || "",
        type: 'comment_added',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working',
        entityType: 'task',
        entityId: '00000000-0000-0000-0000-000000000000',
        entityTitle: 'Test Task',
        actorId: currentUser.id,
        isRead: false,
        metadata: { test: true }
      });

      res.json(testNotification);
    } catch (error: any) {
      console.error("Error creating test notification:", error);
      res.status(500).json({ message: "Failed to create test notification" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const count = await storage.getUnreadNotificationsCount(currentUser.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread notification count" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.markNotificationAsRead(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const success = await storage.markAllNotificationsAsRead(currentUser.id);
      res.json({ message: "All notifications marked as read", success });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Temporary endpoint to manually test initiative deadline checking
  app.post("/api/test/check-initiative-deadlines", requireAuth, async (req, res) => {
    try {
      const { checkInitiativeDeadlines } = await import("./initiative-deadline-checker");
      await checkInitiativeDeadlines();
      res.json({ message: "Initiative deadline check completed" });
    } catch (error: any) {
      console.error("Error checking initiative deadlines:", error);
      res.status(500).json({ message: "Failed to check initiative deadlines" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteNotification(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.get("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const preferences = await storage.getNotificationPreferences(currentUser.id);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  app.post("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const preferences = await storage.createOrUpdateNotificationPreferences({
        userId: currentUser.id,
        ...req.body,
      });
      res.json(preferences);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Organization user management endpoints for client users
  app.get("/api/organization/users", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.organizationId) {
        return res.status(400).json({ error: "User not associated with an organization" });
      }

      // Only organization owners can access this endpoint
      const organization = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      if (organization.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isOwner = organization[0].ownerId === user.id || user.role === "admin" || user.isSystemOwner;
      if (!isOwner) {
        return res.status(403).json({ error: "Access denied. Only organization owners can manage users." });
      }

      // Get all users in the organization
      const orgUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        organizationId: users.organizationId,
        createdAt: users.createdAt
      }).from(users).where(eq(users.organizationId, user.organizationId));

      res.json(orgUsers);
    } catch (error) {
      console.error("Error fetching organization users:", error);
      res.status(500).json({ error: "Failed to fetch organization users" });
    }
  });

  app.post("/api/organization/invite", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { email } = req.body;

      if (!user.organizationId) {
        return res.status(400).json({ error: "User not associated with an organization" });
      }

      // Only organization owners can invite users
      const organization = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      if (organization.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isOwner = organization[0].ownerId === user.id || user.role === "admin" || user.isSystemOwner;
      if (!isOwner) {
        return res.status(403).json({ error: "Access denied. Only organization owners can invite users." });
      }

      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        // If user exists but not in this organization, add them
        if (existingUser[0].organizationId !== user.organizationId) {
          await db.update(users)
            .set({ organizationId: user.organizationId })
            .where(eq(users.id, existingUser[0].id));
          
          res.json({ message: "User added to organization successfully" });
        } else {
          res.status(400).json({ error: "User already exists in this organization" });
        }
      } else {
        // For now, we'll create a placeholder user that needs to complete registration
        // In a real implementation, you'd send an invitation email
        const [newUser] = await db.insert(users).values({
          id: crypto.randomUUID(),
          email,
          passwordHash: "", // Empty until they complete registration
          organizationId: user.organizationId,
          role: "member",
          isActive: false, // Inactive until they complete registration
          createdAt: new Date().toISOString()
        }).returning();

        res.json({ message: "Invitation sent successfully", user: newUser });
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      res.status(500).json({ error: "Failed to invite user" });
    }
  });

  app.put("/api/organization/users/:userId/status", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { userId } = req.params;
      const { isActive } = req.body;

      if (!user.organizationId) {
        return res.status(400).json({ error: "User not associated with an organization" });
      }

      // Only organization owners can update user status
      const organization = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      if (organization.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isOwner = organization[0].ownerId === user.id || user.role === "admin" || user.isSystemOwner;
      if (!isOwner) {
        return res.status(403).json({ error: "Access denied. Only organization owners can update user status." });
      }

      // Update user status
      await db.update(users)
        .set({ isActive })
        .where(and(eq(users.id, userId), eq(users.organizationId, user.organizationId)));

      res.json({ message: "User status updated successfully" });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  app.delete("/api/organization/users/:userId", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { userId } = req.params;

      if (!user.organizationId) {
        return res.status(400).json({ error: "User not associated with an organization" });
      }

      // Only organization owners can remove users
      const organization = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      if (organization.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isOwner = organization[0].ownerId === user.id || user.role === "admin" || user.isSystemOwner;
      if (!isOwner) {
        return res.status(403).json({ error: "Access denied. Only organization owners can remove users." });
      }

      // Don't allow removing the organization owner
      if (userId === organization[0].ownerId) {
        return res.status(400).json({ error: "Cannot remove organization owner" });
      }

      // Remove user from organization (set organizationId to null instead of deleting)
      await db.update(users)
        .set({ organizationId: null, isActive: false })
        .where(and(eq(users.id, userId), eq(users.organizationId, user.organizationId)));

      res.json({ message: "User removed from organization successfully" });
    } catch (error) {
      console.error("Error removing user:", error);
      res.status(500).json({ error: "Failed to remove user" });
    }
  });

  // Client registration endpoint
  app.post('/api/client-registration', async (req, res) => {
    try {
      const registrationData = req.body;
      
      // Import clientRegistrationSchema separately to avoid circular imports
      const { clientRegistrationSchema } = await import("@shared/schema");
      
      // Validate input data
      const validatedData = clientRegistrationSchema.parse(registrationData);
      
      // Parallel validation checks for better performance
      const [existingOrg, existingUser] = await Promise.all([
        storage.getOrganizationBySlug(validatedData.organizationSlug),
        storage.getUserByEmail(validatedData.email)
      ]);
      
      if (existingOrg) {
        return res.status(400).json({ 
          message: "Slug organisasi sudah digunakan. Silakan pilih yang lain." 
        });
      }
      
      if (existingUser) {
        return res.status(400).json({ 
          message: "Email sudah terdaftar. Silakan gunakan email lain." 
        });
      }
      
      // Auto-generate slug from organization name
      let baseSlug = validatedData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-");
      
      // Use random suffix for better performance
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const slug = `${baseSlug}-${randomSuffix}`;
      
      // Create organization with pending status
      const organizationData = {
        name: validatedData.organizationName,
        slug: slug,
        website: validatedData.website || null,
        industry: validatedData.industry,
        size: validatedData.size,
        registrationStatus: "pending" as const,
      };
      
      const organization = await storage.createOrganization(organizationData);
      
      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const userData: any = {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: "organization_admin" as const,
        organizationId: organization.id,
        jobTitle: validatedData.jobTitle,
        department: validatedData.department,
        isActive: false, // Will be activated when org is approved
      };
      
      const user = await storage.createUser(userData);
      
      // Update organization with owner ID
      await storage.updateOrganization(organization.id, { ownerId: user.id });
      
      res.json({ 
        message: "Pendaftaran berhasil. Permohonan Anda sedang dalam proses review.",
        organizationId: organization.id,
        userId: user.id
      });
      
    } catch (error: any) {
      console.error('Client registration error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Data tidak valid",
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Terjadi kesalahan saat mendaftar. Silakan coba lagi." 
      });
    }
  });

  // Onboarding Progress API Routes
  app.get("/api/user/onboarding-progress", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const progress = await storage.getUserOnboardingProgress(currentUser.id);
      res.json(progress);
    } catch (error: any) {
      console.error("Error fetching onboarding progress:", error);
      res.status(500).json({ message: "Failed to fetch onboarding progress" });
    }
  });

  app.put("/api/user/onboarding-progress", requireAuth, async (req, res) => {
    try {
      const currentUser = req.user as User;
      const updateData = updateOnboardingProgressSchema.parse(req.body);
      
      const updatedProgress = await storage.updateUserOnboardingProgress(currentUser.id, updateData);
      res.json(updatedProgress);
    } catch (error: any) {
      console.error("Error updating onboarding progress:", error);
      res.status(500).json({ message: "Failed to update onboarding progress" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}