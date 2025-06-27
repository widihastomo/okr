import {
  type Cycle, type Template, type Objective, type KeyResult, type User, type Team, type TeamMember, 
  type CheckIn, type Initiative, type Task, type KeyResultWithDetails,
  type InsertCycle, type InsertTemplate, type InsertObjective, type InsertKeyResult, 
  type InsertUser, type UpsertUser, type InsertTeam, type InsertTeamMember,
  type InsertCheckIn, type InsertInitiative,
  type OKRWithKeyResults, type CycleWithOKRs, type UpdateKeyResultProgress, type CreateOKRFromTemplate 
} from "@shared/schema";
import { IStorage } from "./storage";
import { calculateProgressStatus } from "./progress-tracker";
import { calculateObjectiveStatus } from "./objective-status-tracker";

export class SimpleMemStorage implements IStorage {
  private cycles: Map<string, Cycle> = new Map();
  private templates: Map<string, Template> = new Map();
  private objectives: Map<string, Objective> = new Map();
  private keyResults: Map<string, KeyResult> = new Map();
  private users: Map<string, User> = new Map();
  private teams: Map<string, Team> = new Map();
  private teamMembers: Map<string, TeamMember> = new Map();
  private checkIns: Map<string, CheckIn> = new Map();
  private initiatives: Map<string, Initiative> = new Map();
  private tasks: Map<string, Task> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private initializeSampleData() {
    // Create sample users
    const adminUser: User = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      email: "admin@example.com",
      password: "$2b$10$6D94g.O4bv4WhZc5n5PbUOmrckdaAosKKZInMOET74YbhC/sRiT9i",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isActive: true,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const regularUser: User = {
      id: "550e8400-e29b-41d4-a716-446655440002",
      email: "user@example.com", 
      password: "$2b$10$6D94g.O4bv4WhZc5n5PbUOmrckdaAosKKZInMOET74YbhC/sRiT9i",
      firstName: "Regular",
      lastName: "User",
      role: "member",
      isActive: true,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(regularUser.id, regularUser);

    // Create sample team
    const team: Team = {
      id: "6535cd7c-b351-4061-8a02-ef083b1e8c60",
      name: "Engineering Team",
      description: "Main engineering team",
      ownerId: adminUser.id
    };
    this.teams.set(team.id, team);

    // Create sample cycle
    const cycle: Cycle = {
      id: "6535cd7c-b351-4061-8a02-ef083b1e8c61",
      name: "Q1 2025",
      description: "First quarter objectives",
      type: "quarterly",
      status: "active",
      startDate: "2025-01-01",
      endDate: "2025-03-31"
    };
    this.cycles.set(cycle.id, cycle);

    // Create sample objective
    const objective: Objective = {
      id: "7535cd7c-b351-4061-8a02-ef083b1e8c62",
      title: "Improve System Performance",
      description: "Enhance overall system performance and reliability",
      status: "in_progress",
      cycleId: cycle.id,
      owner: "Admin User",
      ownerType: "user",
      ownerId: adminUser.id,
      teamId: team.id,
      parentId: null
    };
    this.objectives.set(objective.id, objective);

    // Create sample key result
    const keyResult: KeyResult = {
      id: "8535cd7c-b351-4061-8a02-ef083b1e8c63",
      title: "Reduce API Response Time",
      description: "Optimize API endpoints for faster response times",
      objectiveId: objective.id,
      currentValue: "200.00",
      targetValue: "100.00",
      baseValue: "300.00",
      unit: "number",
      keyResultType: "decrease_to",
      status: "on_track",
      timeProgressPercentage: "50.00"
    };
    this.keyResults.set(keyResult.id, keyResult);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.generateId(),
      ...userData,
      role: userData.role || "member",
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      isActive: userData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = userData.id ? this.users.get(userData.id) : undefined;
    
    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        id: existingUser.id,
        updatedAt: new Date()
      };
      this.users.set(updatedUser.id, updatedUser);
      return updatedUser;
    } else {
      return this.createUser(userData);
    }
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updated: User = {
      ...user,
      ...userData,
      id: user.id,
      updatedAt: new Date()
    };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Cycle methods
  async getCycles(): Promise<Cycle[]> {
    return Array.from(this.cycles.values());
  }

  async getCycle(id: string): Promise<Cycle | undefined> {
    return this.cycles.get(id);
  }

  async createCycle(cycleData: InsertCycle): Promise<Cycle> {
    const cycle: Cycle = {
      id: this.generateId(),
      ...cycleData,
      description: cycleData.description || null,
      status: cycleData.status || "active"
    };
    this.cycles.set(cycle.id, cycle);
    return cycle;
  }

  async updateCycle(id: string, cycleData: Partial<InsertCycle>): Promise<Cycle | undefined> {
    const cycle = this.cycles.get(id);
    if (!cycle) return undefined;

    const updated: Cycle = { ...cycle, ...cycleData };
    this.cycles.set(id, updated);
    return updated;
  }

  async deleteCycle(id: string): Promise<boolean> {
    return this.cycles.delete(id);
  }

  async getCycleWithOKRs(id: string): Promise<CycleWithOKRs | undefined> {
    const cycle = this.cycles.get(id);
    if (!cycle) return undefined;

    const objectives = Array.from(this.objectives.values()).filter(obj => obj.cycleId === id);
    const okrs = await Promise.all(
      objectives.map(async (objective) => {
        const keyResults = Array.from(this.keyResults.values()).filter(kr => kr.objectiveId === objective.id);
        const overallProgress = this.calculateOverallProgress(keyResults);
        return {
          ...objective,
          keyResults,
          overallProgress
        };
      })
    );

    return {
      ...cycle,
      objectives: okrs,
      totalObjectives: okrs.length,
      completedObjectives: okrs.filter(obj => obj.status === 'completed').length,
      avgProgress: okrs.length > 0 ? 
        okrs.reduce((sum, obj) => sum + obj.overallProgress, 0) / okrs.length : 0
    };
  }

  // Template methods
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async createTemplate(templateData: InsertTemplate): Promise<Template> {
    const template: Template = {
      id: this.generateId(),
      ...templateData,
      description: templateData.description || null,
      isDefault: templateData.isDefault || null
    };
    this.templates.set(template.id, template);
    return template;
  }

  async updateTemplate(id: string, templateData: Partial<InsertTemplate>): Promise<Template | undefined> {
    const template = this.templates.get(id);
    if (!template) return undefined;

    const updated: Template = { ...template, ...templateData };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }

  async createOKRFromTemplate(data: CreateOKRFromTemplate): Promise<OKRWithKeyResults[]> {
    // This is a simplified implementation
    return [];
  }

  // Objective methods
  async getObjectives(): Promise<Objective[]> {
    return Array.from(this.objectives.values());
  }

  async getObjective(id: string): Promise<Objective | undefined> {
    return this.objectives.get(id);
  }

  async getObjectivesByCycleId(cycleId: string): Promise<Objective[]> {
    return Array.from(this.objectives.values()).filter(obj => obj.cycleId === cycleId);
  }

  async createObjective(objectiveData: InsertObjective): Promise<Objective> {
    const objective: Objective = {
      id: this.generateId(),
      ...objectiveData,
      description: objectiveData.description || null,
      status: objectiveData.status || "in_progress",
      cycleId: objectiveData.cycleId || null,
      teamId: objectiveData.teamId || null,
      parentId: objectiveData.parentId || null,
      ownerType: objectiveData.ownerType || "user"
    };
    this.objectives.set(objective.id, objective);
    return objective;
  }

  async updateObjective(id: string, objectiveData: Partial<InsertObjective>): Promise<Objective | undefined> {
    const objective = this.objectives.get(id);
    if (!objective) return undefined;

    const updated: Objective = { ...objective, ...objectiveData };
    this.objectives.set(id, updated);
    return updated;
  }

  async deleteObjective(id: string): Promise<boolean> {
    // Delete associated key results first
    const associatedKeyResults = Array.from(this.keyResults.values()).filter(kr => kr.objectiveId === id);
    for (const kr of associatedKeyResults) {
      await this.deleteKeyResult(kr.id);
    }
    
    return this.objectives.delete(id);
  }

  // Key Result methods
  async getKeyResults(): Promise<KeyResult[]> {
    return Array.from(this.keyResults.values());
  }

  async getKeyResult(id: string): Promise<KeyResult | undefined> {
    return this.keyResults.get(id);
  }

  async getKeyResultsByObjectiveId(objectiveId: string): Promise<KeyResult[]> {
    return Array.from(this.keyResults.values()).filter(kr => kr.objectiveId === objectiveId);
  }

  async createKeyResult(keyResultData: InsertKeyResult): Promise<KeyResult> {
    const keyResult: KeyResult = {
      id: this.generateId(),
      ...keyResultData,
      description: keyResultData.description || null,
      status: keyResultData.status || "in_progress",
      timeProgressPercentage: keyResultData.timeProgressPercentage || null,
      currentValue: keyResultData.currentValue || "0",
      lastUpdated: keyResultData.lastUpdated || null,
      dueDate: keyResultData.dueDate || null,
      confidence: keyResultData.confidence || null
    };
    this.keyResults.set(keyResult.id, keyResult);
    return keyResult;
  }

  async updateKeyResult(id: string, keyResultData: Partial<InsertKeyResult>): Promise<KeyResult | undefined> {
    const keyResult = this.keyResults.get(id);
    if (!keyResult) return undefined;

    const updated: KeyResult = { ...keyResult, ...keyResultData };
    this.keyResults.set(id, updated);
    return updated;
  }

  async updateKeyResultProgress(update: UpdateKeyResultProgress): Promise<KeyResult | undefined> {
    const keyResult = this.keyResults.get(update.id);
    if (!keyResult) return undefined;

    const updated: KeyResult = {
      ...keyResult,
      currentValue: update.currentValue,
      status: update.status || keyResult.status
    };
    this.keyResults.set(update.id, updated);
    return updated;
  }

  async deleteKeyResult(id: string): Promise<boolean> {
    // Delete associated check-ins and initiatives
    const associatedCheckIns = Array.from(this.checkIns.values()).filter(ci => ci.keyResultId === id);
    for (const ci of associatedCheckIns) {
      this.checkIns.delete(ci.id);
    }
    
    const associatedInitiatives = Array.from(this.initiatives.values()).filter(init => init.keyResultId === id);
    for (const init of associatedInitiatives) {
      this.initiatives.delete(init.id);
    }
    
    return this.keyResults.delete(id);
  }

  async getLastCheckInForKeyResult(keyResultId: string): Promise<CheckIn | null> {
    const checkInsForKR = Array.from(this.checkIns.values())
      .filter(ci => ci.keyResultId === keyResultId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return checkInsForKR[0] || null;
  }

  // Team methods
  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const team: Team = {
      id: this.generateId(),
      ...teamData,
      description: teamData.description || null
    };
    this.teams.set(team.id, team);
    return team;
  }

  async updateTeam(id: string, teamData: Partial<InsertTeam>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;

    const updated: Team = { ...team, ...teamData };
    this.teams.set(id, updated);
    return updated;
  }

  async deleteTeam(id: string): Promise<boolean> {
    return this.teams.delete(id);
  }

  async getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]> {
    const members = Array.from(this.teamMembers.values()).filter(tm => tm.teamId === teamId);
    const result = [];
    
    for (const member of members) {
      const user = this.users.get(member.userId);
      if (user) {
        result.push({ ...member, user });
      }
    }
    
    return result;
  }

  async getUserTeams(userId: string): Promise<(TeamMember & { team: Team })[]> {
    const memberships = Array.from(this.teamMembers.values()).filter(tm => tm.userId === userId);
    const result = [];
    
    for (const membership of memberships) {
      const team = this.teams.get(membership.teamId);
      if (team) {
        result.push({ ...membership, team });
      }
    }
    
    return result;
  }

  async addTeamMember(teamMemberData: InsertTeamMember): Promise<TeamMember> {
    const teamMember: TeamMember = {
      id: this.generateId(),
      ...teamMemberData,
      role: teamMemberData.role || "member",
      joinedAt: new Date()
    };
    this.teamMembers.set(teamMember.id, teamMember);
    return teamMember;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    const member = Array.from(this.teamMembers.values()).find(tm => tm.teamId === teamId && tm.userId === userId);
    if (member) {
      return this.teamMembers.delete(member.id);
    }
    return false;
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: "admin" | "member"): Promise<TeamMember | undefined> {
    const member = Array.from(this.teamMembers.values()).find(tm => tm.teamId === teamId && tm.userId === userId);
    if (!member) return undefined;

    const updated: TeamMember = { ...member, role };
    this.teamMembers.set(member.id, updated);
    return updated;
  }

  // CheckIn methods
  async getCheckIns(): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values());
  }

  async getCheckInsByKeyResultId(keyResultId: string): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values()).filter(ci => ci.keyResultId === keyResultId);
  }

  async createCheckIn(checkInData: InsertCheckIn): Promise<CheckIn> {
    const checkIn: CheckIn = {
      id: this.generateId(),
      ...checkInData,
      notes: checkInData.notes || null,
      confidence: checkInData.confidence || 100,
      createdAt: new Date()
    };
    this.checkIns.set(checkIn.id, checkIn);
    return checkIn;
  }

  // Initiative methods
  async getInitiatives(): Promise<Initiative[]> {
    return Array.from(this.initiatives.values());
  }

  async getInitiativesByKeyResultId(keyResultId: string): Promise<Initiative[]> {
    return Array.from(this.initiatives.values()).filter(init => init.keyResultId === keyResultId);
  }

  async createInitiative(initiativeData: InsertInitiative): Promise<Initiative> {
    const initiative: Initiative = {
      id: this.generateId(),
      ...initiativeData,
      description: initiativeData.description || null,
      status: initiativeData.status || "in_progress",
      priority: initiativeData.priority || "medium",
      dueDate: initiativeData.dueDate || null,
      createdAt: new Date()
    };
    this.initiatives.set(initiative.id, initiative);
    return initiative;
  }

  async updateInitiative(id: string, initiativeData: Partial<InsertInitiative>): Promise<Initiative | undefined> {
    const initiative = this.initiatives.get(id);
    if (!initiative) return undefined;

    const updated: Initiative = { ...initiative, ...initiativeData };
    this.initiatives.set(id, updated);
    return updated;
  }

  // Complex query methods
  async getKeyResultWithDetails(id: string): Promise<KeyResultWithDetails | undefined> {
    const keyResult = this.keyResults.get(id);
    if (!keyResult) return undefined;

    const [checkIns, initiatives] = await Promise.all([
      this.getCheckInsByKeyResultId(id),
      this.getInitiativesByKeyResultId(id)
    ]);

    return {
      ...keyResult,
      checkIns,
      initiatives,
      progress: this.calculateProgress(keyResult.currentValue, keyResult.targetValue, keyResult.keyResultType, keyResult.baseValue)
    };
  }

  async getOKRsWithKeyResults(): Promise<OKRWithKeyResults[]> {
    const objectives = Array.from(this.objectives.values());
    
    return await Promise.all(
      objectives.map(async (objective) => {
        const keyResults = await this.getKeyResultsByObjectiveId(objective.id);
        const overallProgress = this.calculateOverallProgress(keyResults);
        
        return {
          ...objective,
          keyResults,
          overallProgress
        };
      })
    );
  }

  async getOKRWithKeyResults(id: string): Promise<OKRWithKeyResults | undefined> {
    const objective = this.objectives.get(id);
    if (!objective) return undefined;

    const keyResults = await this.getKeyResultsByObjectiveId(id);
    const overallProgress = this.calculateOverallProgress(keyResults);

    return {
      ...objective,
      keyResults,
      overallProgress
    };
  }

  // Helper methods
  private calculateProgress(current: string, target: string, keyResultType: string, baseValue?: string | null): number {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 0;
    const baseNum = parseFloat(baseValue || "0") || 0;

    if (keyResultType === "increase_to") {
      if (targetNum <= baseNum) return 0;
      return Math.min(100, Math.max(0, ((currentNum - baseNum) / (targetNum - baseNum)) * 100));
    } else if (keyResultType === "decrease_to") {
      if (baseNum <= targetNum) return 0;
      return Math.min(100, Math.max(0, ((baseNum - currentNum) / (baseNum - targetNum)) * 100));
    } else if (keyResultType === "achieve_or_not") {
      return currentNum >= targetNum ? 100 : 0;
    }

    return 0;
  }

  private calculateOverallProgress(keyResults: KeyResult[]): number {
    if (keyResults.length === 0) return 0;
    
    const totalProgress = keyResults.reduce((sum, kr) => {
      return sum + this.calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
    }, 0);
    
    return Math.round(totalProgress / keyResults.length);
  }

  async getOKRsWithFullHierarchy(cycleId?: string): Promise<any[]> {
    let objectives = Array.from(this.objectives.values());
    
    if (cycleId) {
      objectives = objectives.filter(obj => obj.cycleId === cycleId);
    }
    
    return objectives.map(objective => {
      const keyResults = Array.from(this.keyResults.values())
        .filter(kr => kr.objectiveId === objective.id);
      
      return {
        ...objective,
        keyResults,
        overallProgress: this.calculateOverallProgress(keyResults)
      };
    });
  }
}