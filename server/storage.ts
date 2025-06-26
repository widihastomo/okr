import { 
  cycles, templates, objectives, keyResults, users, teams, teamMembers, checkIns, initiatives,
  type Cycle, type Template, type Objective, type KeyResult, type User, type Team, type TeamMember,
  type CheckIn, type Initiative, type KeyResultWithDetails,
  type InsertCycle, type InsertTemplate, type InsertObjective, type InsertKeyResult, 
  type InsertUser, type InsertTeam, type InsertTeamMember, type UpsertUser,
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
  getUsers(): Promise<User[]>;
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
  getUserTeams(userId: string): Promise<(TeamMember & { team: Team })[]>;
  addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: string): Promise<boolean>;
  updateTeamMemberRole(teamId: number, userId: string, role: "admin" | "member"): Promise<TeamMember | undefined>;

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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
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
      ...checkInData,
      createdBy: "current-user", // TODO: Replace with actual user ID from session
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

export class MemStorage implements IStorage {
  private cycles: Map<number, Cycle>;
  private templates: Map<number, Template>;
  private objectives: Map<number, Objective>;
  private keyResults: Map<number, KeyResult>;
  private users: Map<string, User>;
  private teams: Map<number, Team>;
  private teamMembersMap: Map<number, TeamMember>;
  private currentCycleId: number;
  private currentTemplateId: number;
  private currentObjectiveId: number;
  private currentKeyResultId: number;
  private currentTeamId: number;
  private currentTeamMemberId: number;

  constructor() {
    this.cycles = new Map();
    this.templates = new Map();
    this.objectives = new Map();
    this.keyResults = new Map();
    this.users = new Map();
    this.teams = new Map();
    this.teamMembersMap = new Map();
    this.currentCycleId = 4;
    this.currentTemplateId = 1;
    this.currentObjectiveId = 1;
    this.currentKeyResultId = 1;
    this.currentTeamId = 0;
    this.currentTeamMemberId = 0;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample Users (for testing hierarchy system)
    const user1: User = {
      id: "user1",
      email: "john.doe@company.com",
      firstName: "John",
      lastName: "Doe",
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user2: User = {
      id: "user2", 
      email: "jane.smith@company.com",
      firstName: "Jane",
      lastName: "Smith",
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user3: User = {
      id: "user3",
      email: "mike.wilson@company.com", 
      firstName: "Mike",
      lastName: "Wilson",
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set("user1", user1);
    this.users.set("user2", user2);
    this.users.set("user3", user3);

    // Sample Cycles
    const cycle1: Cycle = {
      id: 1,
      name: "January 2025",
      type: "monthly",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      status: "active",
      description: "January monthly objectives for 2025"
    };
    
    const cycle2: Cycle = {
      id: 2,
      name: "Q1 2025",
      type: "quarterly",
      startDate: "2025-01-01",
      endDate: "2025-03-31",
      status: "planning",
      description: "First quarter of 2025 focused on growth and engagement"
    };
    
    const cycle3: Cycle = {
      id: 3,
      name: "Annual 2025",
      type: "annual",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "planning",
      description: "Annual strategic objectives for 2025"
    };
    
    this.cycles.set(1, cycle1);
    this.cycles.set(2, cycle2);
    this.cycles.set(3, cycle3);
    
    // Sample Templates
    const template1: Template = {
      id: 1,
      name: "Product Growth Template",
      description: "Standard template for product growth objectives",
      type: "quarterly",
      isDefault: true,
      objectives: JSON.stringify([
        {
          title: "Increase Product Adoption",
          description: "Drive user acquisition and engagement",
          owner: "Product Team",
          keyResults: [
            {
              title: "Increase monthly active users",
              description: "Focus on user acquisition",
              unit: "number",
              keyResultType: "increase_to"
            },
            {
              title: "Improve app store rating",
              description: "Enhance user satisfaction",
              unit: "number",
              keyResultType: "increase_to"
            }
          ]
        }
      ])
    };
    
    this.templates.set(1, template1);
    
    // Company Level Objective (Parent)
    const obj1: Objective = {
      id: 1,
      cycleId: 1,
      title: "Increase Product Adoption and User Engagement",
      description: "Drive user acquisition and improve engagement metrics to establish stronger market presence",
      timeframe: "Q1 2025",
      owner: "user1", // John Doe as CEO
      status: "on_track",
      teamId: null,
      parentId: null // Top level objective
    };
    this.objectives.set(1, obj1);

    // Sample Key Results for Objective 1
    const kr1: KeyResult = {
      id: 1,
      objectiveId: 1,
      title: "Increase monthly active users to 50,000",
      description: "Current: 39,200 users | Target: 50,000 users",
      currentValue: "39200",
      targetValue: "50000",
      baseValue: null,
      unit: "number",
      keyResultType: "increase_to",
      status: "on_track",
      assignedTo: null
    };
    
    const kr2: KeyResult = {
      id: 2,
      objectiveId: 1,
      title: "Achieve 4.5+ app store rating",
      description: "Current: 4.2 rating | Target: 4.5 rating",
      currentValue: "4.2",
      targetValue: "4.5",
      baseValue: null,
      unit: "number",
      keyResultType: "increase_to",
      status: "at_risk",
      assignedTo: null
    };
    
    const kr3: KeyResult = {
      id: 3,
      objectiveId: 1,
      title: "Reduce customer churn rate to under 5%",
      description: "Current: 3.2% | Target: <5%",
      currentValue: "3.2",
      targetValue: "5",
      baseValue: "8.5",
      unit: "percentage",
      keyResultType: "decrease_to",
      status: "completed",
      assignedTo: null
    };

    this.keyResults.set(1, kr1);
    this.keyResults.set(2, kr2);
    this.keyResults.set(3, kr3);

    // Team Level Objective (Child of Company Objective)
    const obj2: Objective = {
      id: 2,
      cycleId: 1,
      title: "Strengthen Team Performance and Culture",
      description: "Build a high-performing team culture with improved collaboration and skill development",
      timeframe: "Q1 2025",
      owner: "Sarah Johnson",
      status: "at_risk",
      teamId: 1,
      parentId: 1 // Child of Company objective
    };
    this.objectives.set(2, obj2);

    // Individual Level Objective (Child of Team Objective)
    const obj3: Objective = {
      id: 3,
      cycleId: 1,
      title: "Improve Personal Productivity and Skills",
      description: "Individual development goals to support team objectives",
      timeframe: "Q1 2025",
      owner: "Individual Contributor",
      status: "on_track",
      teamId: 1,
      parentId: 2 // Child of Team objective
    };
    this.objectives.set(3, obj3);

    // Sample Key Results for Objective 2
    const kr4: KeyResult = {
      id: 4,
      objectiveId: 2,
      title: "Achieve 90% employee satisfaction score",
      description: "Current: 78% | Target: 90%",
      currentValue: "78",
      targetValue: "90",
      baseValue: null,
      unit: "percentage",
      keyResultType: "increase_to",
      status: "at_risk"
    };
    
    const kr5: KeyResult = {
      id: 5,
      objectiveId: 2,
      title: "Complete skills development for 100% of team",
      description: "Current: 6/12 members | Target: 12/12 members",
      currentValue: "6",
      targetValue: "12",
      baseValue: null,
      unit: "number",
      keyResultType: "achieve_or_not",
      status: "in_progress"
    };

    // Add key result for individual objective
    const kr6: KeyResult = {
      id: 6,
      objectiveId: 3,
      title: "Complete 3 professional courses",
      description: "Current: 1/3 courses | Target: 3/3 courses",
      currentValue: "1",
      targetValue: "3",
      baseValue: null,
      unit: "courses",
      keyResultType: "increase_to",
      status: "on_track"
    };

    this.keyResults.set(4, kr4);
    this.keyResults.set(5, kr5);
    this.keyResults.set(6, kr6);

    this.currentCycleId = 3;
    this.currentTemplateId = 2;
    this.currentObjectiveId = 4;
    this.currentKeyResultId = 7;
  }

  private calculateProgress(current: string, target: string, keyResultType: string, baseValue?: string | null): number {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    
    switch (keyResultType) {
      case "increase_to":
        // Progress = (current / target) * 100, capped at 100%
        if (targetNum === 0) return 0;
        return Math.min(100, Math.max(0, (currentNum / targetNum) * 100));
        
      case "decrease_to":
        // Progress = ((Base Value - Current) / (Base Value - Target)) * 100%
        const baseNum = baseValue && baseValue !== null ? parseFloat(baseValue) : targetNum * 2; // Default base value if not provided
        if (baseNum <= targetNum) return currentNum <= targetNum ? 100 : 0; // Invalid base value case
        const decreaseProgress = ((baseNum - currentNum) / (baseNum - targetNum)) * 100;
        return Math.min(100, Math.max(0, decreaseProgress));
        
      case "achieve_or_not":
        // Binary: 100% if current >= target, 0% otherwise
        return currentNum >= targetNum ? 100 : 0;
        
      default:
        return 0;
    }
  }

  private calculateOverallProgress(keyResults: KeyResult[]): number {
    if (keyResults.length === 0) return 0;
    const totalProgress = keyResults.reduce((sum, kr) => 
      sum + this.calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue), 0);
    return Math.round(totalProgress / keyResults.length);
  }

  // Cycles
  async getCycles(): Promise<Cycle[]> {
    return Array.from(this.cycles.values());
  }

  async getCycle(id: number): Promise<Cycle | undefined> {
    return this.cycles.get(id);
  }

  async createCycle(insertCycle: InsertCycle): Promise<Cycle> {
    const id = this.currentCycleId++;
    const cycle: Cycle = { 
      ...insertCycle, 
      id,
      description: insertCycle.description || null,
      status: insertCycle.status || "planning"
    };
    this.cycles.set(id, cycle);
    return cycle;
  }

  async updateCycle(id: number, updateData: Partial<InsertCycle>): Promise<Cycle | undefined> {
    const existing = this.cycles.get(id);
    if (!existing) return undefined;
    
    const updated: Cycle = { 
      ...existing, 
      ...updateData,
      description: updateData.description !== undefined ? updateData.description : existing.description,
      status: updateData.status || existing.status
    };
    this.cycles.set(id, updated);
    return updated;
  }

  async deleteCycle(id: number): Promise<boolean> {
    // Also delete associated objectives and key results
    const objectives = Array.from(this.objectives.values()).filter(obj => obj.cycleId === id);
    for (const obj of objectives) {
      await this.deleteObjective(obj.id);
    }
    return this.cycles.delete(id);
  }

  async getCycleWithOKRs(id: number): Promise<CycleWithOKRs | undefined> {
    const cycle = this.cycles.get(id);
    if (!cycle) return undefined;

    const objectives = await this.getObjectivesByCycleId(id);
    const okrsWithKeyResults: OKRWithKeyResults[] = [];

    for (const obj of objectives) {
      const keyResults = await this.getKeyResultsByObjectiveId(obj.id);
      const overallProgress = this.calculateOverallProgress(keyResults);
      okrsWithKeyResults.push({
        ...obj,
        keyResults,
        overallProgress
      });
    }

    const totalObjectives = objectives.length;
    const completedObjectives = objectives.filter(obj => obj.status === "completed").length;
    const avgProgress = okrsWithKeyResults.length > 0 
      ? Math.round(okrsWithKeyResults.reduce((sum, okr) => sum + okr.overallProgress, 0) / okrsWithKeyResults.length)
      : 0;

    return {
      ...cycle,
      objectives: okrsWithKeyResults,
      totalObjectives,
      completedObjectives,
      avgProgress
    };
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.currentTemplateId++;
    const template: Template = { 
      ...insertTemplate, 
      id,
      description: insertTemplate.description || null,
      isDefault: insertTemplate.isDefault || false
    };
    this.templates.set(id, template);
    return template;
  }

  async updateTemplate(id: number, updateData: Partial<InsertTemplate>): Promise<Template | undefined> {
    const existing = this.templates.get(id);
    if (!existing) return undefined;
    
    const updated: Template = { 
      ...existing, 
      ...updateData,
      description: updateData.description !== undefined ? updateData.description : existing.description,
      isDefault: updateData.isDefault !== undefined ? updateData.isDefault : existing.isDefault
    };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }

  async createOKRFromTemplate(data: CreateOKRFromTemplate): Promise<OKRWithKeyResults[]> {
    const template = this.templates.get(data.templateId);
    const cycle = this.cycles.get(data.cycleId);
    
    if (!template || !cycle) {
      throw new Error("Template or cycle not found");
    }

    const templateObjectives = JSON.parse(template.objectives);
    const createdOKRs: OKRWithKeyResults[] = [];

    for (const templateObj of templateObjectives) {
      // Create objective
      const objective = await this.createObjective({
        cycleId: data.cycleId,
        title: templateObj.title,
        description: templateObj.description,
        timeframe: cycle.name,
        owner: templateObj.owner,
        status: "in_progress"
      });

      // Create key results
      const keyResults: KeyResult[] = [];
      for (const templateKr of templateObj.keyResults) {
        const keyResult = await this.createKeyResult({
          objectiveId: objective.id,
          title: templateKr.title,
          description: templateKr.description,
          currentValue: "0",
          targetValue: "0", // To be set by user
          baseValue: null,
          unit: templateKr.unit,
          keyResultType: templateKr.keyResultType,
          status: "in_progress"
        });
        keyResults.push(keyResult);
      }

      const overallProgress = this.calculateOverallProgress(keyResults);
      createdOKRs.push({
        ...objective,
        keyResults,
        overallProgress
      });
    }

    return createdOKRs;
  }

  async getObjectivesByCycleId(cycleId: number): Promise<Objective[]> {
    return Array.from(this.objectives.values()).filter(obj => obj.cycleId === cycleId);
  }

  async getObjectives(): Promise<Objective[]> {
    return Array.from(this.objectives.values());
  }

  async getObjective(id: number): Promise<Objective | undefined> {
    return this.objectives.get(id);
  }

  async createObjective(insertObjective: InsertObjective): Promise<Objective> {
    const id = this.currentObjectiveId++;
    const objective: Objective = { 
      ...insertObjective, 
      id,
      description: insertObjective.description || null,
      status: insertObjective.status || "in_progress",
      cycleId: insertObjective.cycleId || null
    };
    this.objectives.set(id, objective);
    return objective;
  }

  async updateObjective(id: number, updateData: Partial<InsertObjective>): Promise<Objective | undefined> {
    const existing = this.objectives.get(id);
    if (!existing) return undefined;
    
    const updated: Objective = { 
      ...existing, 
      ...updateData,
      description: updateData.description !== undefined ? updateData.description : existing.description,
      status: updateData.status || existing.status
    };
    this.objectives.set(id, updated);
    return updated;
  }

  async deleteObjective(id: number): Promise<boolean> {
    // Also delete associated key results
    const keyResults = await this.getKeyResultsByObjectiveId(id);
    keyResults.forEach(kr => this.keyResults.delete(kr.id));
    
    return this.objectives.delete(id);
  }

  async getKeyResults(): Promise<KeyResult[]> {
    return Array.from(this.keyResults.values());
  }

  async getKeyResultsByObjectiveId(objectiveId: number): Promise<KeyResult[]> {
    return Array.from(this.keyResults.values()).filter(kr => kr.objectiveId === objectiveId);
  }

  async getKeyResult(id: number): Promise<KeyResult | undefined> {
    return this.keyResults.get(id);
  }

  async createKeyResult(insertKeyResult: InsertKeyResult): Promise<KeyResult> {
    const id = this.currentKeyResultId++;
    const keyResult: KeyResult = { 
      ...insertKeyResult, 
      id,
      description: insertKeyResult.description || null,
      status: insertKeyResult.status || "in_progress",
      currentValue: insertKeyResult.currentValue || "0",
      unit: insertKeyResult.unit || "number",
      keyResultType: insertKeyResult.keyResultType || "increase_to",
      baseValue: insertKeyResult.baseValue || null,
      assignedTo: insertKeyResult.assignedTo || null
    };
    this.keyResults.set(id, keyResult);
    return keyResult;
  }

  async updateKeyResult(id: number, updateData: Partial<InsertKeyResult>): Promise<KeyResult | undefined> {
    const existing = this.keyResults.get(id);
    if (!existing) return undefined;
    
    const updated: KeyResult = { 
      ...existing, 
      ...updateData,
      description: updateData.description !== undefined ? updateData.description : existing.description,
      status: updateData.status || existing.status,
      currentValue: updateData.currentValue || existing.currentValue,
      unit: updateData.unit || existing.unit,
      keyResultType: updateData.keyResultType || existing.keyResultType
    };
    this.keyResults.set(id, updated);
    return updated;
  }

  async updateKeyResultProgress(update: UpdateKeyResultProgress): Promise<KeyResult | undefined> {
    const existing = this.keyResults.get(update.id);
    if (!existing) return undefined;
    
    const updated: KeyResult = { 
      ...existing, 
      currentValue: update.currentValue.toString(),
      ...(update.status && { status: update.status })
    };
    this.keyResults.set(update.id, updated);
    return updated;
  }

  async deleteKeyResult(id: number): Promise<boolean> {
    return this.keyResults.delete(id);
  }

  // User management methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    const updated: User = {
      ...existing,
      ...userData,
      updatedAt: new Date()
    };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Team management methods
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const team: Team = {
      id: ++this.currentTeamId,
      ...teamData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.teams.set(team.id, team);
    return team;
  }

  async updateTeam(id: number, teamData: Partial<InsertTeam>): Promise<Team | undefined> {
    const existing = this.teams.get(id);
    if (!existing) return undefined;
    
    const updated: Team = {
      ...existing,
      ...teamData,
      updatedAt: new Date()
    };
    this.teams.set(id, updated);
    return updated;
  }

  async deleteTeam(id: number): Promise<boolean> {
    return this.teams.delete(id);
  }

  async getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]> {
    const members = Array.from(this.teamMembersMap.values())
      .filter(member => member.teamId === teamId);
    
    return members.map(member => {
      const user = this.users.get(member.userId);
      return {
        ...member,
        user: user!
      };
    });
  }

  async getUserTeams(userId: string): Promise<(TeamMember & { team: Team })[]> {
    const memberships = Array.from(this.teamMembersMap.values())
      .filter(member => member.userId === userId);
    
    return memberships.map(member => {
      const team = this.teams.get(member.teamId);
      return {
        ...member,
        team: team!
      };
    });
  }

  async addTeamMember(teamMemberData: InsertTeamMember): Promise<TeamMember> {
    const teamMember: TeamMember = {
      id: ++this.currentTeamMemberId,
      ...teamMemberData,
      joinedAt: new Date()
    };
    this.teamMembersMap.set(teamMember.id, teamMember);
    return teamMember;
  }

  async removeTeamMember(teamId: number, userId: string): Promise<boolean> {
    const member = Array.from(this.teamMembersMap.values())
      .find(m => m.teamId === teamId && m.userId === userId);
    
    if (!member) return false;
    return this.teamMembersMap.delete(member.id);
  }

  async updateTeamMemberRole(teamId: number, userId: string, role: "admin" | "member"): Promise<TeamMember | undefined> {
    const member = Array.from(this.teamMembersMap.values())
      .find(m => m.teamId === teamId && m.userId === userId);
    
    if (!member) return undefined;
    
    const updated: TeamMember = {
      ...member,
      role
    };
    this.teamMembersMap.set(member.id, updated);
    return updated;
  }

  // Check-ins and initiatives (stub implementations)
  async getCheckIns(): Promise<CheckIn[]> {
    return [];
  }

  async getCheckInsByKeyResultId(keyResultId: number): Promise<CheckIn[]> {
    return [];
  }

  async createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
    return {
      id: 1,
      ...checkIn,
      createdAt: new Date()
    };
  }

  async getInitiatives(): Promise<Initiative[]> {
    return [];
  }

  async getInitiativesByKeyResultId(keyResultId: number): Promise<Initiative[]> {
    return [];
  }

  async createInitiative(initiative: InsertInitiative): Promise<Initiative> {
    return {
      id: 1,
      ...initiative,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateInitiative(id: number, initiative: Partial<InsertInitiative>): Promise<Initiative | undefined> {
    return undefined;
  }

  async getKeyResultWithDetails(id: number): Promise<KeyResultWithDetails | undefined> {
    const keyResult = this.keyResults.get(id);
    if (!keyResult) return undefined;
    
    return {
      ...keyResult,
      checkIns: [],
      initiatives: [],
      progressHistory: []
    };
  }

  async getOKRsWithKeyResults(): Promise<OKRWithKeyResults[]> {
    const objectives = await this.getObjectives();
    const result: OKRWithKeyResults[] = [];
    
    for (const objective of objectives) {
      const keyResults = await this.getKeyResultsByObjectiveId(objective.id);
      const overallProgress = this.calculateOverallProgress(keyResults);
      result.push({ ...objective, keyResults, overallProgress });
    }
    
    return result;
  }

  async getOKRWithKeyResults(id: number): Promise<OKRWithKeyResults | undefined> {
    const objective = await this.getObjective(id);
    if (!objective) return undefined;
    
    const keyResults = await this.getKeyResultsByObjectiveId(id);
    const overallProgress = this.calculateOverallProgress(keyResults);
    return { ...objective, keyResults, overallProgress };
  }
}

export const storage = new MemStorage();
