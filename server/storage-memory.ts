import {
  cycles, templates, objectives, keyResults, users, teams, teamMembers, checkIns, initiatives,
  type Cycle, type Template, type Objective, type KeyResult, type User, type Team, type TeamMember, type CheckIn, type Initiative,
  type InsertCycle, type InsertTemplate, type InsertObjective, type InsertKeyResult, type InsertUser, type InsertTeam, type InsertTeamMember, type InsertCheckIn, type InsertInitiative,
  type UpdateKeyResultProgress, type CreateOKRFromTemplate, type CycleWithOKRs, type OKRWithKeyResults, type KeyResultWithDetails, type UpsertUser
} from "@shared/schema";
import { IStorage } from "./storage";

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
  private currentUserId: number;
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
    this.currentCycleId = 1;
    this.currentTemplateId = 1;
    this.currentObjectiveId = 1;
    this.currentKeyResultId = 1;
    this.currentUserId = 1;
    this.currentTeamId = 1;
    this.currentTeamMemberId = 1;
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample users with password "123456"
    const user1: User = {
      id: "1",
      email: "admin@example.com",
      password: "$2b$10$6D94g.O4bv4WhZc5n5PbUOmrckdaAosKKZInMOET74YbhC/sRiT9i", // password: 123456
      firstName: "Admin",
      lastName: "User",
      profileImageUrl: null,
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user2: User = {
      id: "2",
      email: "manager@example.com",
      password: "$2b$10$6D94g.O4bv4WhZc5n5PbUOmrckdaAosKKZInMOET74YbhC/sRiT9i", // password: 123456
      firstName: "Manager",
      lastName: "User",
      profileImageUrl: null,
      role: "manager",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user3: User = {
      id: "3",
      email: "john@example.com",
      password: "$2b$10$6D94g.O4bv4WhZc5n5PbUOmrckdaAosKKZInMOET74YbhC/sRiT9i", // password: 123456
      firstName: "John",
      lastName: "Doe",
      profileImageUrl: null,
      role: "member",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set("1", user1);
    this.users.set("2", user2);
    this.users.set("3", user3);
    this.currentUserId = 4;

    // Create sample teams
    const team1: Team = {
      id: 1,
      name: "Engineering",
      description: "Software development team",
      ownerId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.teams.set(1, team1);
    this.currentTeamId = 2;

    // Create sample cycles
    const cycle1: Cycle = {
      id: 1,
      name: "Q1 2024",
      description: "First quarter objectives",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-03-31"),
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cycles.set(1, cycle1);
    this.currentCycleId = 2;

    // Create sample objectives and key results
    const obj1: Objective = {
      id: 1,
      title: "Improve Product Quality",
      description: "Focus on reducing bugs and improving user experience",
      cycleId: 1,
      ownerId: 1,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const kr1: KeyResult = {
      id: 1,
      title: "Reduce bug reports",
      description: "Decrease customer bug reports by 50%",
      objectiveId: 1,
      currentValue: "25",
      targetValue: "50",
      baseValue: "100",
      unit: "number",
      keyResultType: "decrease_to",
      status: "active",
      dueDate: new Date("2024-03-31"),
      lastUpdated: new Date(),
      confidence: 75,
    };

    this.objectives.set(1, obj1);
    this.keyResults.set(1, kr1);
    this.currentObjectiveId = 2;
    this.currentKeyResultId = 2;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentUserId.toString(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    this.currentUserId++;
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    if (existingUser) {
      const updated: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id, updated);
      return updated;
    } else {
      const user: User = {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userData.id, user);
      return user;
    }
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    const updated: User = {
      ...existing,
      ...userData,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Cycle operations
  async getCycles(): Promise<Cycle[]> {
    return Array.from(this.cycles.values());
  }

  async getCycle(id: number): Promise<Cycle | undefined> {
    return this.cycles.get(id);
  }

  async createCycle(insertCycle: InsertCycle): Promise<Cycle> {
    const cycle: Cycle = { 
      id: this.currentCycleId++,
      ...insertCycle,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cycles.set(cycle.id, cycle);
    return cycle;
  }

  async updateCycle(id: number, updateData: Partial<InsertCycle>): Promise<Cycle | undefined> {
    const existing = this.cycles.get(id);
    if (!existing) return undefined;
    
    const updated: Cycle = { 
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.cycles.set(id, updated);
    return updated;
  }

  async deleteCycle(id: number): Promise<boolean> {
    return this.cycles.delete(id);
  }

  async getCycleWithOKRs(id: number): Promise<CycleWithOKRs | undefined> {
    const cycle = this.cycles.get(id);
    if (!cycle) return undefined;

    const objectives = Array.from(this.objectives.values()).filter(obj => obj.cycleId === id);
    const okrs = await Promise.all(objectives.map(async (objective) => {
      const keyResults = Array.from(this.keyResults.values()).filter(kr => kr.objectiveId === objective.id);
      const progress = this.calculateOverallProgress(keyResults);
      return {
        ...objective,
        keyResults,
        progress,
      };
    }));

    return {
      ...cycle,
      okrs,
    };
  }

  // Template operations
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const template: Template = { 
      id: this.currentTemplateId++,
      ...insertTemplate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.templates.set(template.id, template);
    return template;
  }

  async updateTemplate(id: number, updateData: Partial<InsertTemplate>): Promise<Template | undefined> {
    const existing = this.templates.get(id);
    if (!existing) return undefined;
    
    const updated: Template = { 
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }

  async createOKRFromTemplate(data: CreateOKRFromTemplate): Promise<OKRWithKeyResults[]> {
    // This is a simplified implementation
    return [];
  }

  // Objective operations
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
    const objective: Objective = { 
      id: this.currentObjectiveId++,
      ...insertObjective,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.objectives.set(objective.id, objective);
    return objective;
  }

  async updateObjective(id: number, updateData: Partial<InsertObjective>): Promise<Objective | undefined> {
    const existing = this.objectives.get(id);
    if (!existing) return undefined;
    
    const updated: Objective = { 
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.objectives.set(id, updated);
    return updated;
  }

  async deleteObjective(id: number): Promise<boolean> {
    return this.objectives.delete(id);
  }

  // Key Result operations
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
    const keyResult: KeyResult = { 
      id: this.currentKeyResultId++,
      ...insertKeyResult,
      lastUpdated: new Date(),
    };
    this.keyResults.set(keyResult.id, keyResult);
    return keyResult;
  }

  async updateKeyResult(id: number, updateData: Partial<InsertKeyResult>): Promise<KeyResult | undefined> {
    const existing = this.keyResults.get(id);
    if (!existing) return undefined;
    
    const updated: KeyResult = { 
      ...existing,
      ...updateData,
      lastUpdated: new Date(),
    };
    this.keyResults.set(id, updated);
    return updated;
  }

  async updateKeyResultProgress(update: UpdateKeyResultProgress): Promise<KeyResult | undefined> {
    const existing = this.keyResults.get(update.id);
    if (!existing) return undefined;
    
    const updated: KeyResult = { 
      ...existing,
      currentValue: update.currentValue,
      confidence: update.confidence,
      lastUpdated: new Date(),
    };
    this.keyResults.set(update.id, updated);
    return updated;
  }

  async deleteKeyResult(id: number): Promise<boolean> {
    return this.keyResults.delete(id);
  }

  // Team operations (simplified)
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const team: Team = {
      id: this.currentTeamId++,
      ...teamData,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      updatedAt: new Date(),
    };
    this.teams.set(id, updated);
    return updated;
  }

  async deleteTeam(id: number): Promise<boolean> {
    return this.teams.delete(id);
  }

  async getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]> {
    const members = Array.from(this.teamMembersMap.values()).filter(tm => tm.teamId === teamId);
    return members.map(member => {
      const user = this.users.get(member.userId.toString());
      return { ...member, user: user! };
    });
  }

  async getUserTeams(userId: string): Promise<(TeamMember & { team: Team })[]> {
    const userIdNum = parseInt(userId);
    const memberships = Array.from(this.teamMembersMap.values()).filter(tm => tm.userId === userIdNum);
    return memberships.map(membership => {
      const team = this.teams.get(membership.teamId);
      return { ...membership, team: team! };
    });
  }

  async addTeamMember(teamMemberData: InsertTeamMember): Promise<TeamMember> {
    const teamMember: TeamMember = {
      id: this.currentTeamMemberId++,
      ...teamMemberData,
      joinedAt: new Date(),
    };
    this.teamMembersMap.set(teamMember.id, teamMember);
    return teamMember;
  }

  async removeTeamMember(teamId: number, userId: string): Promise<boolean> {
    const userIdNum = parseInt(userId);
    const member = Array.from(this.teamMembersMap.values()).find(tm => tm.teamId === teamId && tm.userId === userIdNum);
    if (member) {
      return this.teamMembersMap.delete(member.id);
    }
    return false;
  }

  async updateTeamMemberRole(teamId: number, userId: string, role: "admin" | "member"): Promise<TeamMember | undefined> {
    const userIdNum = parseInt(userId);
    const member = Array.from(this.teamMembersMap.values()).find(tm => tm.teamId === teamId && tm.userId === userIdNum);
    if (member) {
      const updated: TeamMember = {
        ...member,
        role,
      };
      this.teamMembersMap.set(member.id, updated);
      return updated;
    }
    return undefined;
  }

  // Check-in and Initiative operations (simplified)
  async getCheckIns(): Promise<CheckIn[]> {
    return [];
  }

  async getCheckInsByKeyResultId(keyResultId: number): Promise<CheckIn[]> {
    return [];
  }

  async createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
    const newCheckIn: CheckIn = {
      id: 1,
      ...checkIn,
      createdAt: new Date(),
    };
    return newCheckIn;
  }

  async getInitiatives(): Promise<Initiative[]> {
    return [];
  }

  async getInitiativesByKeyResultId(keyResultId: number): Promise<Initiative[]> {
    return [];
  }

  async createInitiative(initiative: InsertInitiative): Promise<Initiative> {
    const newInitiative: Initiative = {
      id: 1,
      ...initiative,
      createdAt: new Date(),
    };
    return newInitiative;
  }

  async updateInitiative(id: number, initiative: Partial<InsertInitiative>): Promise<Initiative | undefined> {
    return undefined;
  }

  async getKeyResultWithDetails(id: number): Promise<KeyResultWithDetails | undefined> {
    return undefined;
  }

  async getOKRsWithKeyResults(): Promise<OKRWithKeyResults[]> {
    const objectives = Array.from(this.objectives.values());
    return await Promise.all(objectives.map(async (objective) => {
      const keyResults = Array.from(this.keyResults.values()).filter(kr => kr.objectiveId === objective.id);
      const progress = this.calculateOverallProgress(keyResults);
      return {
        ...objective,
        keyResults,
        progress,
      };
    }));
  }

  async getOKRWithKeyResults(id: number): Promise<OKRWithKeyResults | undefined> {
    const objective = this.objectives.get(id);
    if (!objective) return undefined;

    const keyResults = Array.from(this.keyResults.values()).filter(kr => kr.objectiveId === id);
    const progress = this.calculateOverallProgress(keyResults);
    
    return {
      ...objective,
      keyResults,
      progress,
    };
  }

  private calculateProgress(current: string, target: string, keyResultType: string, baseValue?: string | null): number {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 0;
    const baseNum = parseFloat(baseValue || "0") || 0;

    switch (keyResultType) {
      case "increase_to":
        if (targetNum === baseNum) return 0;
        return Math.max(0, Math.min(100, ((currentNum - baseNum) / (targetNum - baseNum)) * 100));
      case "decrease_to":
        if (baseNum === targetNum) return 0;
        return Math.max(0, Math.min(100, ((baseNum - currentNum) / (baseNum - targetNum)) * 100));
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
    
    return Math.round(totalProgress / keyResults.length);
  }
}

export const storage = new MemStorage();