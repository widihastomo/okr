import { 
  cycles, templates, objectives, keyResults, users, teams, teamMembers, checkIns, initiatives, tasks,
  type Cycle, type Template, type Objective, type KeyResult, type User, type Team, type TeamMember,
  type CheckIn, type Initiative, type Task, type KeyResultWithDetails,
  type InsertCycle, type InsertTemplate, type InsertObjective, type InsertKeyResult, 
  type InsertUser, type UpsertUser, type InsertTeam, type InsertTeamMember,
  type InsertCheckIn, type InsertInitiative,
  type OKRWithKeyResults, type CycleWithOKRs, type UpdateKeyResultProgress, type CreateOKRFromTemplate 
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { calculateProgressStatus } from "./progress-tracker";
import { calculateObjectiveStatus } from "./objective-status-tracker";

export interface IStorage {
  // Cycles
  getCycles(): Promise<Cycle[]>;
  getCycle(id: string): Promise<Cycle | undefined>;
  createCycle(cycle: InsertCycle): Promise<Cycle>;
  updateCycle(id: string, cycle: Partial<InsertCycle>): Promise<Cycle | undefined>;
  deleteCycle(id: string): Promise<boolean>;
  getCycleWithOKRs(id: string): Promise<CycleWithOKRs | undefined>;
  
  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: string, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: string): Promise<boolean>;
  createOKRFromTemplate(data: CreateOKRFromTemplate): Promise<OKRWithKeyResults[]>;
  
  // Objectives
  getObjectives(): Promise<Objective[]>;
  getObjective(id: string): Promise<Objective | undefined>;
  createObjective(objective: InsertObjective): Promise<Objective>;
  updateObjective(id: string, objective: Partial<InsertObjective>): Promise<Objective | undefined>;
  deleteObjective(id: string): Promise<boolean>;
  getObjectivesByCycleId(cycleId: string): Promise<Objective[]>;
  
  // Key Results
  getKeyResults(): Promise<KeyResult[]>;
  getKeyResultsByObjectiveId(objectiveId: string): Promise<KeyResult[]>;
  getKeyResult(id: string): Promise<KeyResult | undefined>;
  createKeyResult(keyResult: InsertKeyResult): Promise<KeyResult>;
  updateKeyResult(id: string, keyResult: Partial<InsertKeyResult>): Promise<KeyResult | undefined>;
  updateKeyResultProgress(update: UpdateKeyResultProgress): Promise<KeyResult | undefined>;
  deleteKeyResult(id: string): Promise<boolean>;
  
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Teams
  getTeam(id: string): Promise<Team | undefined>;
  getTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;
  
  // Team Members
  getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]>;
  getUserTeams(userId: string): Promise<(TeamMember & { team: Team })[]>;
  addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: string, userId: string): Promise<boolean>;
  updateTeamMemberRole(teamId: string, userId: string, role: "admin" | "member"): Promise<TeamMember | undefined>;

  // Check-ins
  getCheckIns(): Promise<CheckIn[]>;
  getCheckInsByKeyResultId(keyResultId: string): Promise<CheckIn[]>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  
  // Initiatives
  getInitiatives(): Promise<Initiative[]>;
  getInitiativesByKeyResultId(keyResultId: string): Promise<Initiative[]>;
  createInitiative(initiative: InsertInitiative): Promise<Initiative>;
  updateInitiative(id: string, initiative: Partial<InsertInitiative>): Promise<Initiative | undefined>;
  
  // Key Result with Details
  getKeyResultWithDetails(id: string): Promise<KeyResultWithDetails | undefined>;

  // Combined
  getOKRsWithKeyResults(): Promise<OKRWithKeyResults[]>;
  getOKRWithKeyResults(id: string): Promise<OKRWithKeyResults | undefined>;
  getOKRsWithFullHierarchy(cycleId?: string): Promise<any[]>;
}

// Helper function to calculate and update status automatically
async function updateKeyResultWithAutoStatus(keyResult: KeyResult, cycleId: string): Promise<KeyResult> {
  // Get cycle to determine dates
  const [cycle] = await db.select().from(cycles).where(eq(cycles.id, cycleId));
  
  if (cycle && keyResult.dueDate) {
    const startDate = new Date(cycle.startDate);
    const endDate = keyResult.dueDate;
    
    const progressStatus = calculateProgressStatus(keyResult, startDate, endDate);
    
    // Update the key result with the calculated status and time progress
    const [updatedKeyResult] = await db
      .update(keyResults)
      .set({ 
        status: progressStatus.status,
        timeProgressPercentage: progressStatus.timeProgressPercentage,
        lastUpdated: new Date()
      })
      .where(eq(keyResults.id, keyResult.id))
      .returning();
      
    return updatedKeyResult || keyResult;
  }
  
  return keyResult;
}

// Helper function to calculate objective status based on key results
export async function updateObjectiveWithAutoStatus(objectiveId: string): Promise<void> {
  // Get objective with its key results and cycle
  const [objective] = await db.select().from(objectives).where(eq(objectives.id, objectiveId));
  if (!objective) return;
  
  const objectiveKeyResults = await db.select().from(keyResults).where(eq(keyResults.objectiveId, objectiveId));
  const cycle = objective.cycleId ? await db.select().from(cycles).where(eq(cycles.id, objective.cycleId)).then(rows => rows[0]) : null;
  
  // Calculate new status
  const statusResult = calculateObjectiveStatus(objective, objectiveKeyResults, cycle);
  
  // Update objective with new status
  await db
    .update(objectives)
    .set({ status: statusResult.status })
    .where(eq(objectives.id, objectiveId));
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    const [user] = await db.insert(users).values(userData).returning();
    return user;
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
    return (result.rowCount ?? 0) > 0;
  }

  // Teams
  async getTeam(id: string): Promise<Team | undefined> {
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

  async updateTeam(id: string, teamData: Partial<InsertTeam>): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set({ ...teamData, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async deleteTeam(id: string): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Team Members
  async getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]> {
    return await db
      .select()
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId))
      .then((rows) =>
        rows.map((row) => ({
          ...row.team_members,
          user: row.users!,
        }))
      );
  }

  async getUserTeams(userId: string): Promise<(TeamMember & { team: Team })[]> {
    return await db
      .select()
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId))
      .then((rows) =>
        rows.map((row) => ({
          ...row.team_members,
          team: row.teams!,
        }))
      );
  }

  async addTeamMember(teamMemberData: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values(teamMemberData).returning();
    return member;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: "admin" | "member"): Promise<TeamMember | undefined> {
    const [member] = await db
      .update(teamMembers)
      .set({ role })
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .returning();
    return member;
  }

  // Cycles
  async getCycles(): Promise<Cycle[]> {
    return await db.select().from(cycles);
  }

  async getCycle(id: string): Promise<Cycle | undefined> {
    const [cycle] = await db.select().from(cycles).where(eq(cycles.id, id));
    return cycle;
  }

  async createCycle(cycleData: InsertCycle): Promise<Cycle> {
    const [cycle] = await db.insert(cycles).values(cycleData).returning();
    return cycle;
  }

  async updateCycle(id: string, cycleData: Partial<InsertCycle>): Promise<Cycle | undefined> {
    const [cycle] = await db
      .update(cycles)
      .set(cycleData)
      .where(eq(cycles.id, id))
      .returning();
    return cycle;
  }

  async deleteCycle(id: string): Promise<boolean> {
    const result = await db.delete(cycles).where(eq(cycles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCycleWithOKRs(id: string): Promise<CycleWithOKRs | undefined> {
    const cycle = await this.getCycle(id);
    if (!cycle) return undefined;

    const cycleObjectives = await this.getObjectivesByCycleId(id);
    const objectivesWithKeyResults = await Promise.all(
      cycleObjectives.map(async (objective) => {
        const keyResultsList = await this.getKeyResultsByObjectiveId(objective.id);
        const overallProgress = this.calculateOverallProgress(keyResultsList);
        return {
          ...objective,
          keyResults: keyResultsList,
          overallProgress,
        };
      })
    );

    const totalObjectives = objectivesWithKeyResults.length;
    const completedObjectives = objectivesWithKeyResults.filter(
      (obj) => obj.overallProgress >= 100
    ).length;
    const avgProgress = totalObjectives > 0 
      ? objectivesWithKeyResults.reduce((sum, obj) => sum + obj.overallProgress, 0) / totalObjectives
      : 0;

    return {
      ...cycle,
      objectives: objectivesWithKeyResults,
      totalObjectives,
      completedObjectives,
      avgProgress,
    };
  }

  private calculateProgress(current: string, target: string, keyResultType: string, baseValue?: string | null): number {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 0;
    const baseNum = parseFloat(baseValue || "0") || 0;

    switch (keyResultType) {
      case "increase_to":
        if (targetNum <= baseNum) return 0;
        return Math.min(100, Math.max(0, ((currentNum - baseNum) / (targetNum - baseNum)) * 100));
      
      case "decrease_to":
        if (baseNum <= targetNum) return 0;
        return Math.min(100, Math.max(0, ((baseNum - currentNum) / (baseNum - targetNum)) * 100));
      
      case "achieve_or_not":
        return currentNum >= targetNum ? 100 : 0;
      
      default:
        return Math.min(100, Math.max(0, (currentNum / targetNum) * 100));
    }
  }

  private calculateOverallProgress(keyResults: KeyResult[]): number {
    if (keyResults.length === 0) return 0;
    
    const totalProgress = keyResults.reduce((sum, kr) => {
      return sum + this.calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue);
    }, 0);
    
    return totalProgress / keyResults.length;
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async createTemplate(templateData: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(templateData).returning();
    return template;
  }

  async updateTemplate(id: string, templateData: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [template] = await db
      .update(templates)
      .set(templateData)
      .where(eq(templates.id, id))
      .returning();
    return template;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createOKRFromTemplate(data: CreateOKRFromTemplate): Promise<OKRWithKeyResults[]> {
    const template = await this.getTemplate(data.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const templateData = JSON.parse(template.objectives) as any;
    const createdOKRs: OKRWithKeyResults[] = [];

    for (const objData of templateData.objectives) {
      // Create objective
      const objective = await this.createObjective({
        title: objData.title,
        description: objData.description,
        cycleId: data.cycleId,
        timeframe: objData.timeframe,
        owner: objData.owner,
        ownerType: objData.ownerType,
        ownerId: objData.ownerId,
        teamId: objData.teamId,
        status: "in_progress",
      });

      // Create key results
      const keyResultsPromises = objData.keyResults.map((krData: any) => 
        this.createKeyResult({
          ...krData,
          objectiveId: objective.id,
          status: "in_progress",
        })
      );

      const keyResultsList = await Promise.all(keyResultsPromises);
      const overallProgress = this.calculateOverallProgress(keyResultsList);

      createdOKRs.push({
        ...objective,
        keyResults: keyResultsList,
        overallProgress,
      });
    }

    return createdOKRs;
  }

  // Objectives
  async getObjectivesByCycleId(cycleId: string): Promise<Objective[]> {
    return await db.select().from(objectives).where(eq(objectives.cycleId, cycleId));
  }

  async getObjectives(): Promise<Objective[]> {
    return await db.select().from(objectives);
  }

  async getObjective(id: string): Promise<Objective | undefined> {
    const [objective] = await db.select().from(objectives).where(eq(objectives.id, id));
    return objective;
  }

  async createObjective(objectiveData: InsertObjective): Promise<Objective> {
    const [objective] = await db.insert(objectives).values(objectiveData).returning();
    return objective;
  }

  async updateObjective(id: string, objectiveData: Partial<InsertObjective>): Promise<Objective | undefined> {
    const [objective] = await db
      .update(objectives)
      .set(objectiveData)
      .where(eq(objectives.id, id))
      .returning();
    return objective;
  }

  async deleteObjective(id: string): Promise<boolean> {
    const result = await db.delete(objectives).where(eq(objectives.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Key Results
  async getKeyResults(): Promise<KeyResult[]> {
    return await db.select().from(keyResults);
  }

  async getKeyResultsByObjectiveId(objectiveId: string): Promise<KeyResult[]> {
    const keyResultsList = await db.select().from(keyResults).where(eq(keyResults.objectiveId, objectiveId));
    
    // Get the objective to find the cycle for date calculation
    const objective = await this.getObjective(objectiveId);
    if (!objective || !objective.cycleId) {
      return keyResultsList.map(kr => ({
        ...kr,
        status: kr.status || 'on_track',
        timeProgressPercentage: 0
      }));
    }
    
    // Get cycle information for date calculation
    const cycle = await this.getCycle(objective.cycleId);
    if (!cycle) {
      return keyResultsList.map(kr => ({
        ...kr,
        status: kr.status || 'on_track',
        timeProgressPercentage: 0
      }));
    }
    
    // Calculate status and timeProgressPercentage for each key result
    return keyResultsList.map(kr => {
      try {
        const startDate = new Date(cycle.startDate);
        const endDate = new Date(kr.dueDate || cycle.endDate);
        
        const progressStatus = calculateProgressStatus(kr, startDate, endDate);
        
        return {
          ...kr,
          status: progressStatus.status,
          timeProgressPercentage: progressStatus.timeProgressPercentage
        };
      } catch (error) {
        console.error('Error calculating progress status for key result:', kr.id, error);
        // Return key result with default values if calculation fails
        return {
          ...kr,
          status: kr.status || 'on_track',
          timeProgressPercentage: 0
        };
      }
    });
  }

  async getKeyResult(id: string): Promise<KeyResult | undefined> {
    const [keyResult] = await db.select().from(keyResults).where(eq(keyResults.id, id));
    return keyResult;
  }

  async createKeyResult(keyResultData: InsertKeyResult): Promise<KeyResult> {
    const [keyResult] = await db.insert(keyResults).values(keyResultData).returning();
    return keyResult;
  }

  async updateKeyResult(id: string, keyResultData: Partial<InsertKeyResult>): Promise<KeyResult | undefined> {
    const [keyResult] = await db
      .update(keyResults)
      .set(keyResultData)
      .where(eq(keyResults.id, id))
      .returning();
    return keyResult;
  }

  async updateKeyResultProgress(update: UpdateKeyResultProgress): Promise<KeyResult | undefined> {
    // First get the current key result to calculate auto status
    const currentKeyResult = await this.getKeyResult(update.id);
    if (!currentKeyResult) return undefined;

    // Update the current value
    const [updatedKeyResult] = await db
      .update(keyResults)
      .set({ 
        currentValue: update.currentValue.toString(),
        lastUpdated: new Date()
      })
      .where(eq(keyResults.id, update.id))
      .returning();

    if (!updatedKeyResult) return undefined;

    // Get the objective to find the cycle for date calculation
    const objective = await this.getObjective(updatedKeyResult.objectiveId);
    if (objective && objective.cycleId) {
      // Auto-calculate and update status based on progress
      const finalKeyResult = await updateKeyResultWithAutoStatus(updatedKeyResult, objective.cycleId);
      
      // Update the objective status based on its key results
      await updateObjectiveWithAutoStatus(updatedKeyResult.objectiveId);
      
      return finalKeyResult;
    }

    return updatedKeyResult;
  }

  async deleteKeyResult(id: string): Promise<boolean> {
    const result = await db.delete(keyResults).where(eq(keyResults.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Check-ins
  async getCheckIns(): Promise<CheckIn[]> {
    return await db.select().from(checkIns);
  }

  async getCheckInsByKeyResultId(keyResultId: string): Promise<CheckIn[]> {
    return await db.select().from(checkIns).where(eq(checkIns.keyResultId, keyResultId));
  }

  async createCheckIn(checkInData: InsertCheckIn): Promise<CheckIn> {
    const [checkIn] = await db.insert(checkIns).values(checkInData).returning();
    return checkIn;
  }

  // Initiatives
  async getInitiatives(): Promise<Initiative[]> {
    return await db.select().from(initiatives);
  }

  async getInitiativesByKeyResultId(keyResultId: string): Promise<Initiative[]> {
    return await db.select().from(initiatives).where(eq(initiatives.keyResultId, keyResultId));
  }

  async createInitiative(initiativeData: InsertInitiative): Promise<Initiative> {
    const [initiative] = await db.insert(initiatives).values(initiativeData).returning();
    return initiative;
  }

  async updateInitiative(id: string, initiativeData: Partial<InsertInitiative>): Promise<Initiative | undefined> {
    const [initiative] = await db
      .update(initiatives)
      .set(initiativeData)
      .where(eq(initiatives.id, id))
      .returning();
    return initiative;
  }

  // Key Result with Details
  async getKeyResultWithDetails(id: string): Promise<KeyResultWithDetails | undefined> {
    const keyResult = await this.getKeyResult(id);
    if (!keyResult) return undefined;

    const [checkInsList, initiativesList] = await Promise.all([
      this.getCheckInsByKeyResultId(id),
      this.getInitiativesByKeyResultId(id),
    ]);

    const progressHistory = checkInsList.map((checkIn) => ({
      date: checkIn.createdAt?.toISOString().split('T')[0] || '',
      value: parseFloat(checkIn.value),
      notes: checkIn.notes || undefined,
    }));

    return {
      ...keyResult,
      checkIns: checkInsList,
      initiatives: initiativesList,
      progressHistory,
    };
  }

  // Combined operations
  async getOKRsWithKeyResults(): Promise<OKRWithKeyResults[]> {
    const allObjectives = await this.getObjectives();
    return await Promise.all(
      allObjectives.map(async (objective) => {
        const keyResultsList = await this.getKeyResultsByObjectiveId(objective.id);
        const overallProgress = this.calculateOverallProgress(keyResultsList);
        return {
          ...objective,
          keyResults: keyResultsList,
          overallProgress,
        };
      })
    );
  }

  async getOKRWithKeyResults(id: string): Promise<OKRWithKeyResults | undefined> {
    const objective = await this.getObjective(id);
    if (!objective) return undefined;

    const keyResultsList = await this.getKeyResultsByObjectiveId(id);
    const overallProgress = this.calculateOverallProgress(keyResultsList);

    return {
      ...objective,
      keyResults: keyResultsList,
      overallProgress,
    };
  }

  async getOKRsWithFullHierarchy(cycleId?: string): Promise<any[]> {
    let objectivesList: Objective[];
    
    if (cycleId) {
      objectivesList = await db.select().from(objectives).where(eq(objectives.cycleId, cycleId));
    } else {
      objectivesList = await db.select().from(objectives);
    }

    return await Promise.all(
      objectivesList.map(async (objective) => {
        const keyResultsList = await this.getKeyResultsByObjectiveId(objective.id);
        
        const keyResultsWithDetails = await Promise.all(
          keyResultsList.map(async (kr) => {
            const [checkInsList, initiativesList] = await Promise.all([
              this.getCheckInsByKeyResultId(kr.id),
              this.getInitiativesByKeyResultId(kr.id),
            ]);

            return {
              ...kr,
              checkIns: checkInsList,
              initiatives: initiativesList,
              progress: this.calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue),
            };
          })
        );

        const overallProgress = this.calculateOverallProgress(keyResultsList);

        return {
          ...objective,
          keyResults: keyResultsWithDetails,
          overallProgress,
        };
      })
    );
  }
}

export const storage = new DatabaseStorage();