import { 
  cycles, templates, objectives, keyResults, users, teams, teamMembers, checkIns, initiatives,
  type Cycle, type Template, type Objective, type KeyResult, type User, type Team, type TeamMember,
  type CheckIn, type Initiative, type KeyResultWithDetails,
  type InsertCycle, type InsertTemplate, type InsertObjective, type InsertKeyResult, 
  type InsertUser, type InsertTeam, type InsertTeamMember,
  type InsertCheckIn, type InsertInitiative,
  type OKRWithKeyResults, type CycleWithOKRs, type UpdateKeyResultProgress, type CreateOKRFromTemplate 
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Cycles
  getCycles(): Promise<Cycle[]>;
  getCycle(id: number): Promise<Cycle | undefined>;
  createCycle(cycle: InsertCycle): Promise<Cycle>;
  updateCycle(id: number, cycle: Partial<InsertCycle>): Promise<Cycle | undefined>;
  deleteCycle(id: number): Promise<boolean>;
  getCycleWithOKRs(id: number): Promise<CycleWithOKRs | undefined>;
  
  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  createOKRFromTemplate(data: CreateOKRFromTemplate): Promise<OKRWithKeyResults[]>;
  
  // Objectives
  getObjectives(): Promise<Objective[]>;
  getObjective(id: number): Promise<Objective | undefined>;
  createObjective(objective: InsertObjective): Promise<Objective>;
  updateObjective(id: number, objective: Partial<InsertObjective>): Promise<Objective | undefined>;
  deleteObjective(id: number): Promise<boolean>;
  getObjectivesByCycleId(cycleId: number): Promise<Objective[]>;
  
  // Key Results
  getKeyResults(): Promise<KeyResult[]>;
  getKeyResultsByObjectiveId(objectiveId: number): Promise<KeyResult[]>;
  getKeyResult(id: number): Promise<KeyResult | undefined>;
  createKeyResult(keyResult: InsertKeyResult): Promise<KeyResult>;
  updateKeyResult(id: number, keyResult: Partial<InsertKeyResult>): Promise<KeyResult | undefined>;
  updateKeyResultProgress(update: UpdateKeyResultProgress): Promise<KeyResult | undefined>;
  deleteKeyResult(id: number): Promise<boolean>;
  
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Teams
  getTeam(id: number): Promise<Team | undefined>;
  getTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  
  // Team Members
  getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]>;
  getUserTeams(userId: number): Promise<(TeamMember & { team: Team })[]>;
  addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: number): Promise<boolean>;
  updateTeamMemberRole(teamId: number, userId: number, role: "admin" | "member"): Promise<TeamMember | undefined>;

  // Check-ins
  getCheckIns(): Promise<CheckIn[]>;
  getCheckInsByKeyResultId(keyResultId: number): Promise<CheckIn[]>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  
  // Initiatives
  getInitiatives(): Promise<Initiative[]>;
  getInitiativesByKeyResultId(keyResultId: number): Promise<Initiative[]>;
  createInitiative(initiative: InsertInitiative): Promise<Initiative>;
  updateInitiative(id: number, initiative: Partial<InsertInitiative>): Promise<Initiative | undefined>;
  
  // Key Result with Details
  getKeyResultWithDetails(id: number): Promise<KeyResultWithDetails | undefined>;

  // Combined
  getOKRsWithKeyResults(): Promise<OKRWithKeyResults[]>;
  getOKRWithKeyResults(id: number): Promise<OKRWithKeyResults | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.id) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, parseInt(userData.id)))
        .returning();
      return user;
    } else {
      // Create new user
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    }
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, parseInt(id)))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Team operations
  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(teamData).returning();
    return team;
  }

  async updateTeam(id: number, teamData: Partial<InsertTeam>): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set({ ...teamData, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id));
    return result.rowCount > 0;
  }

  // Team member operations
  async getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]> {
    const result = await db
      .select({
        // TeamMember fields
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        userId: teamMembers.userId,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
        // User fields
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));
    
    return result;
  }

  async getUserTeams(userId: string): Promise<(TeamMember & { team: Team })[]> {
    const result = await db
      .select()
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId));
    
    return result.map(row => ({
      ...row.team_members,
      team: row.teams
    }));
  }

  async addTeamMember(teamMemberData: InsertTeamMember): Promise<TeamMember> {
    const [teamMember] = await db.insert(teamMembers).values(teamMemberData).returning();
    return teamMember;
  }

  async removeTeamMember(teamId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async updateTeamMemberRole(teamId: number, userId: string, role: "admin" | "member"): Promise<TeamMember | undefined> {
    const [teamMember] = await db
      .update(teamMembers)
      .set({ role })
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .returning();
    return teamMember;
  }

  // Continue with existing OKR methods (will need to be adapted for database)
  async getCycles(): Promise<Cycle[]> {
    return await db.select().from(cycles);
  }

  async getCycle(id: number): Promise<Cycle | undefined> {
    const [cycle] = await db.select().from(cycles).where(eq(cycles.id, id));
    return cycle;
  }

  async createCycle(cycleData: InsertCycle): Promise<Cycle> {
    const [cycle] = await db.insert(cycles).values(cycleData).returning();
    return cycle;
  }

  async updateCycle(id: number, cycleData: Partial<InsertCycle>): Promise<Cycle | undefined> {
    const [cycle] = await db
      .update(cycles)
      .set(cycleData)
      .where(eq(cycles.id, id))
      .returning();
    return cycle;
  }

  async deleteCycle(id: number): Promise<boolean> {
    const result = await db.delete(cycles).where(eq(cycles.id, id));
    return result.rowCount > 0;
  }

  async getCycleWithOKRs(id: number): Promise<CycleWithOKRs | undefined> {
    const cycle = await this.getCycle(id);
    if (!cycle) return undefined;

    const cycleObjectives = await db.select().from(objectives).where(eq(objectives.cycleId, id));
    const objectivesWithKeyResults = await Promise.all(
      cycleObjectives.map(async (obj) => {
        const keyResults = await db.select().from(keyResults).where(eq(keyResults.objectiveId, obj.id));
        const overallProgress = this.calculateOverallProgress(keyResults);
        return { ...obj, keyResults, overallProgress };
      })
    );

    const totalObjectives = objectivesWithKeyResults.length;
    const completedObjectives = objectivesWithKeyResults.filter(obj => obj.status === "completed").length;
    const avgProgress = totalObjectives > 0 
      ? objectivesWithKeyResults.reduce((sum, obj) => sum + obj.overallProgress, 0) / totalObjectives 
      : 0;

    return {
      ...cycle,
      objectives: objectivesWithKeyResults,
      totalObjectives,
      completedObjectives,
      avgProgress
    };
  }

  private calculateProgress(current: string, target: string, keyResultType: string, baseValue?: string | null): number {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    const baseNum = baseValue ? parseFloat(baseValue) : 0;

    switch (keyResultType) {
      case "increase_to":
        if (baseValue) {
          return Math.min(100, Math.max(0, ((currentNum - baseNum) / (targetNum - baseNum)) * 100));
        }
        return Math.min(100, (currentNum / targetNum) * 100);
      case "decrease_to":
        if (baseValue) {
          return Math.min(100, Math.max(0, ((baseNum - currentNum) / (baseNum - targetNum)) * 100));
        }
        return currentNum <= targetNum ? 100 : 0;
      case "achieve_or_not":
        return currentNum >= targetNum ? 100 : 0;
      default:
        return 0;
    }
  }

  private calculateOverallProgress(keyResults: KeyResult[]): number {
    if (keyResults.length === 0) return 0;
    const totalProgress = keyResults.reduce((sum, kr) => {
      return sum + this.calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
    }, 0);
    return totalProgress / keyResults.length;
  }

  // Continue implementing other methods for templates, objectives, key results...
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async createTemplate(templateData: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(templateData).returning();
    return template;
  }

  async updateTemplate(id: number, templateData: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [template] = await db
      .update(templates)
      .set(templateData)
      .where(eq(templates.id, id))
      .returning();
    return template;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id));
    return result.rowCount > 0;
  }

  async createOKRFromTemplate(data: CreateOKRFromTemplate): Promise<OKRWithKeyResults[]> {
    // Implementation for creating OKRs from templates
    const template = await this.getTemplate(data.templateId);
    if (!template) throw new Error("Template not found");

    const templateObjectives = JSON.parse(template.objectives);
    const createdOKRs: OKRWithKeyResults[] = [];

    for (const templateObj of templateObjectives) {
      const [objective] = await db.insert(objectives).values({
        cycleId: data.cycleId,
        title: templateObj.title,
        description: templateObj.description,
        timeframe: templateObj.timeframe || "",
        owner: templateObj.owner || "",
        status: "in_progress",
        level: "individual",
        teamId: null,
        parentId: null
      }).returning();

      const keyResultsData = templateObj.keyResults.map((kr: any) => ({
        objectiveId: objective.id,
        title: kr.title,
        description: kr.description || null,
        currentValue: "0",
        targetValue: kr.targetValue,
        baseValue: kr.baseValue || null,
        unit: kr.unit,
        keyResultType: kr.type,
        status: "in_progress",
        assignedTo: null
      }));

      const createdKeyResults = await Promise.all(
        keyResultsData.map(async (krData) => {
          const [kr] = await db.insert(keyResults).values(krData).returning();
          return kr;
        })
      );

      const overallProgress = this.calculateOverallProgress(createdKeyResults);
      createdOKRs.push({ ...objective, keyResults: createdKeyResults, overallProgress });
    }

    return createdOKRs;
  }

  async getObjectivesByCycleId(cycleId: number): Promise<Objective[]> {
    return await db.select().from(objectives).where(eq(objectives.cycleId, cycleId));
  }

  async getObjectives(): Promise<Objective[]> {
    return await db.select().from(objectives);
  }

  async getObjective(id: number): Promise<Objective | undefined> {
    const [objective] = await db.select().from(objectives).where(eq(objectives.id, id));
    return objective;
  }

  async createObjective(objectiveData: InsertObjective): Promise<Objective> {
    const [objective] = await db.insert(objectives).values(objectiveData).returning();
    return objective;
  }

  async updateObjective(id: number, objectiveData: Partial<InsertObjective>): Promise<Objective | undefined> {
    const [objective] = await db
      .update(objectives)
      .set(objectiveData)
      .where(eq(objectives.id, id))
      .returning();
    return objective;
  }

  async deleteObjective(id: number): Promise<boolean> {
    const result = await db.delete(objectives).where(eq(objectives.id, id));
    return result.rowCount > 0;
  }

  async getKeyResults(): Promise<KeyResult[]> {
    return await db.select().from(keyResults);
  }

  async getKeyResultsByObjectiveId(objectiveId: number): Promise<KeyResult[]> {
    return await db.select().from(keyResults).where(eq(keyResults.objectiveId, objectiveId));
  }

  async getKeyResult(id: number): Promise<KeyResult | undefined> {
    const [keyResult] = await db.select().from(keyResults).where(eq(keyResults.id, id));
    return keyResult;
  }

  async createKeyResult(keyResultData: InsertKeyResult): Promise<KeyResult> {
    const [keyResult] = await db.insert(keyResults).values(keyResultData).returning();
    return keyResult;
  }

  async updateKeyResult(id: number, keyResultData: Partial<InsertKeyResult>): Promise<KeyResult | undefined> {
    const [keyResult] = await db
      .update(keyResults)
      .set(keyResultData)
      .where(eq(keyResults.id, id))
      .returning();
    return keyResult;
  }

  async updateKeyResultProgress(update: UpdateKeyResultProgress): Promise<KeyResult | undefined> {
    const [keyResult] = await db
      .update(keyResults)
      .set({
        currentValue: update.currentValue.toString(),
        status: update.status
      })
      .where(eq(keyResults.id, update.id))
      .returning();
    return keyResult;
  }

  async deleteKeyResult(id: number): Promise<boolean> {
    const result = await db.delete(keyResults).where(eq(keyResults.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Check-ins
  async getCheckIns(): Promise<CheckIn[]> {
    return await db.select().from(checkIns).orderBy(checkIns.createdAt);
  }

  async getCheckInsByKeyResultId(keyResultId: number): Promise<CheckIn[]> {
    return await db.select().from(checkIns)
      .where(eq(checkIns.keyResultId, keyResultId))
      .orderBy(checkIns.createdAt);
  }

  async createCheckIn(checkInData: InsertCheckIn): Promise<CheckIn> {
    const [checkIn] = await db.insert(checkIns).values({
      keyResultId: checkInData.keyResultId,
      value: checkInData.value,
      notes: checkInData.notes || null,
      confidence: checkInData.confidence || 5,
      createdBy: checkInData.createdBy || "user1",
      createdAt: new Date(),
    }).returning();
    return checkIn;
  }

  // Initiatives
  async getInitiatives(): Promise<Initiative[]> {
    return await db.select().from(initiatives).orderBy(initiatives.createdAt);
  }

  async getInitiativesByKeyResultId(keyResultId: number): Promise<Initiative[]> {
    return await db.select().from(initiatives)
      .where(eq(initiatives.keyResultId, keyResultId))
      .orderBy(initiatives.createdAt);
  }

  async createInitiative(initiativeData: InsertInitiative): Promise<Initiative> {
    const [initiative] = await db.insert(initiatives).values({
      ...initiativeData,
      createdBy: "current-user", // TODO: Replace with actual user ID from session
      createdAt: new Date(),
    }).returning();
    return initiative;
  }

  async updateInitiative(id: number, initiativeData: Partial<InsertInitiative>): Promise<Initiative | undefined> {
    const [initiative] = await db
      .update(initiatives)
      .set(initiativeData)
      .where(eq(initiatives.id, id))
      .returning();
    return initiative;
  }

  // Key Result with Details
  async getKeyResultWithDetails(id: number): Promise<KeyResultWithDetails | undefined> {
    const keyResult = await this.getKeyResult(id);
    if (!keyResult) return undefined;

    const keyResultCheckIns = await this.getCheckInsByKeyResultId(id);
    const keyResultInitiatives = await this.getInitiativesByKeyResultId(id);

    // Generate progress history from check-ins
    const progressHistory = keyResultCheckIns.map(checkIn => ({
      date: checkIn.createdAt.toISOString().split('T')[0],
      value: checkIn.value,
      notes: checkIn.notes || undefined,
    }));

    return {
      ...keyResult,
      checkIns: keyResultCheckIns,
      initiatives: keyResultInitiatives,
      progressHistory,
    };
  }

  async getOKRsWithKeyResults(): Promise<OKRWithKeyResults[]> {
    const allObjectives = await db.select().from(objectives);
    const okrsWithKeyResults = await Promise.all(
      allObjectives.map(async (obj) => {
        const objKeyResults = await db.select().from(keyResults).where(eq(keyResults.objectiveId, obj.id));
        const overallProgress = this.calculateOverallProgress(objKeyResults);
        return { ...obj, keyResults: objKeyResults, overallProgress };
      })
    );
    return okrsWithKeyResults;
  }

  async getOKRWithKeyResults(id: number): Promise<OKRWithKeyResults | undefined> {
    const objective = await this.getObjective(id);
    if (!objective) return undefined;

    const objKeyResults = await this.getKeyResultsByObjectiveId(id);
    const overallProgress = this.calculateOverallProgress(objKeyResults);
    return { ...objective, keyResults: objKeyResults, overallProgress };
  }
}

// MemStorage moved to storage-memory.ts

// DatabaseStorage akan diimport dari file ini
export const storage = new DatabaseStorage();
