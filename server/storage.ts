import { 
  cycles, templates, objectives, keyResults, users, teams, teamMembers, checkIns, initiatives, tasks,
  initiativeMembers, initiativeDocuments,
  type Cycle, type Template, type Objective, type KeyResult, type User, type Team, type TeamMember,
  type CheckIn, type Initiative, type Task, type KeyResultWithDetails, type InitiativeMember, type InitiativeDocument,
  type InsertCycle, type InsertTemplate, type InsertObjective, type InsertKeyResult, 
  type InsertUser, type UpsertUser, type InsertTeam, type InsertTeamMember,
  type InsertCheckIn, type InsertInitiative, type InsertInitiativeMember, type InsertInitiativeDocument, type InsertTask,
  type OKRWithKeyResults, type CycleWithOKRs, type UpdateKeyResultProgress, type CreateOKRFromTemplate 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
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
  getLastCheckInForKeyResult(keyResultId: string): Promise<CheckIn | null>;
  
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
  getInitiativeWithDetails(id: string): Promise<any>;
  createInitiative(initiative: InsertInitiative): Promise<Initiative>;
  updateInitiative(id: string, initiative: Partial<InsertInitiative>): Promise<Initiative | undefined>;
  deleteInitiative(id: string): Promise<boolean>;
  
  // Initiative Members
  getAllInitiativeMembers(): Promise<InitiativeMember[]>;
  createInitiativeMember(member: InsertInitiativeMember): Promise<InitiativeMember>;
  deleteInitiativeMember(id: string): Promise<boolean>;
  
  // Initiative Documents
  createInitiativeDocument(document: InsertInitiativeDocument): Promise<InitiativeDocument>;
  deleteInitiativeDocument(id: string): Promise<boolean>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  getTasksByInitiativeId(initiativeId: string): Promise<Task[]>;
  getTasksByUserId(userId: string): Promise<Task[]>;
  updateInitiativeProgress(initiativeId: string): Promise<void>;
  getTaskWithDetails(id: string): Promise<Task | undefined>;
  
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
    const result = await db
      .select({
        // TeamMember fields
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        userId: teamMembers.userId,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
        // User fields - properly structured
        user: {
          id: users.id,
          email: users.email,
          password: users.password,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          profileImageUrl: users.profileImageUrl,
          isActive: users.isActive,
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
      return await Promise.all(keyResultsList.map(async kr => {
        const lastCheckIn = await this.getLastCheckInForKeyResult(kr.id);
        return {
          ...kr,
          status: kr.status || 'on_track',
          timeProgressPercentage: 0,
          lastCheckIn
        };
      }));
    }
    
    // Get cycle information for date calculation
    const cycle = await this.getCycle(objective.cycleId);
    if (!cycle) {
      return await Promise.all(keyResultsList.map(async kr => {
        const lastCheckIn = await this.getLastCheckInForKeyResult(kr.id);
        return {
          ...kr,
          status: kr.status || 'on_track',
          timeProgressPercentage: 0,
          lastCheckIn
        };
      }));
    }
    
    // Calculate status and timeProgressPercentage for each key result and get last check-in
    return await Promise.all(keyResultsList.map(async kr => {
      try {
        const startDate = new Date(cycle.startDate);
        const endDate = new Date(kr.dueDate || cycle.endDate);
        
        const progressStatus = calculateProgressStatus(kr, startDate, endDate);
        const lastCheckIn = await this.getLastCheckInForKeyResult(kr.id);
        
        return {
          ...kr,
          status: progressStatus.status,
          timeProgressPercentage: progressStatus.timeProgressPercentage,
          lastCheckIn
        };
      } catch (error) {
        console.error('Error calculating progress status for key result:', kr.id, error);
        const lastCheckIn = await this.getLastCheckInForKeyResult(kr.id);
        // Return key result with default values if calculation fails
        return {
          ...kr,
          status: kr.status || 'on_track',
          timeProgressPercentage: 0,
          lastCheckIn
        };
      }
    }));
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
    // First delete all related check-ins to avoid foreign key constraint errors
    await db.delete(checkIns).where(eq(checkIns.keyResultId, id));
    
    // Then delete the key result
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

  async getLastCheckInForKeyResult(keyResultId: string): Promise<CheckIn | null> {
    const [lastCheckIn] = await db
      .select()
      .from(checkIns)
      .where(eq(checkIns.keyResultId, keyResultId))
      .orderBy(desc(checkIns.createdAt))
      .limit(1);
    return lastCheckIn || null;
  }

  async createCheckIn(checkInData: InsertCheckIn): Promise<CheckIn> {
    const [checkIn] = await db.insert(checkIns).values(checkInData).returning();
    return checkIn;
  }

  // Initiatives
  async getInitiatives(): Promise<Initiative[]> {
    return await db.select().from(initiatives);
  }

  async getAllInitiativeMembers(): Promise<InitiativeMember[]> {
    return await db.select().from(initiativeMembers);
  }

  async getInitiativesByKeyResultId(keyResultId: string): Promise<any[]> {
    const initiativesList = await db.select().from(initiatives).where(eq(initiatives.keyResultId, keyResultId));
    
    // Get tasks and members for each initiative
    const initiativesWithDetails = await Promise.all(
      initiativesList.map(async (initiative) => {
        const tasksList = await this.getTasksByInitiativeId(initiative.id);
        const membersList = await this.getInitiativeMembers(initiative.id);
        return {
          ...initiative,
          tasks: tasksList,
          members: membersList,
        };
      })
    );
    
    return initiativesWithDetails;
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

  async deleteInitiative(id: string): Promise<boolean> {
    // First delete related records
    await db.delete(tasks).where(eq(tasks.initiativeId, id));
    await db.delete(initiativeMembers).where(eq(initiativeMembers.initiativeId, id));
    await db.delete(initiativeDocuments).where(eq(initiativeDocuments.initiativeId, id));
    
    // Then delete the initiative
    const result = await db.delete(initiatives).where(eq(initiatives.id, id));
    return result.rowCount > 0;
  }

  // Initiative Members
  async createInitiativeMember(memberData: InsertInitiativeMember): Promise<InitiativeMember> {
    const [member] = await db.insert(initiativeMembers).values(memberData).returning();
    return member;
  }

  async deleteInitiativeMember(id: string): Promise<boolean> {
    const result = await db.delete(initiativeMembers).where(eq(initiativeMembers.id, id));
    return result.rowCount > 0;
  }

  async getInitiativeMembers(initiativeId: string): Promise<(InitiativeMember & { user: User })[]> {
    return await db
      .select({
        id: initiativeMembers.id,
        initiativeId: initiativeMembers.initiativeId,
        userId: initiativeMembers.userId,
        role: initiativeMembers.role,
        joinedAt: initiativeMembers.joinedAt,
        user: users,
      })
      .from(initiativeMembers)
      .innerJoin(users, eq(initiativeMembers.userId, users.id))
      .where(eq(initiativeMembers.initiativeId, initiativeId));
  }

  // Tasks for automatic progress calculation
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTasksByInitiativeId(initiativeId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.initiativeId, initiativeId));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    
    // Recalculate initiative progress after task creation
    await this.updateInitiativeProgress(taskData.initiativeId);
    
    return task;
  }

  async updateTask(id: string, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();

    if (task) {
      // Recalculate initiative progress after task update
      await this.updateInitiativeProgress(task.initiativeId);
    }

    return task;
  }

  async getTaskWithDetails(id: string): Promise<any | undefined> {
    const result = await db
      .select({
        task: tasks,
        assignedUser: users,
        initiative: initiatives,
        keyResult: keyResults,
        objective: objectives
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .leftJoin(initiatives, eq(tasks.initiativeId, initiatives.id))
      .leftJoin(keyResults, eq(initiatives.keyResultId, keyResults.id))
      .leftJoin(objectives, eq(keyResults.objectiveId, objectives.id))
      .where(eq(tasks.id, id));

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row.task,
      assignedUser: row.assignedUser || undefined,
      initiative: row.initiative ? {
        ...row.initiative,
        keyResult: row.keyResult ? {
          ...row.keyResult,
          objective: row.objective || undefined
        } : undefined
      } : undefined
    };
  }

  // Automatic progress calculation based on completed tasks
  async updateInitiativeProgress(initiativeId: string): Promise<void> {
    const allTasks = await this.getTasksByInitiativeId(initiativeId);
    
    if (allTasks.length === 0) {
      // No tasks, keep progress at 0
      await db
        .update(initiatives)
        .set({ progressPercentage: 0 })
        .where(eq(initiatives.id, initiativeId));
      return;
    }

    const completedTasks = allTasks.filter(task => task.status === "completed");
    const progressPercentage = Math.round((completedTasks.length / allTasks.length) * 100);

    await db
      .update(initiatives)
      .set({ progressPercentage })
      .where(eq(initiatives.id, initiativeId));
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
  // Initiative with details (project management)
  async getInitiativeWithDetails(id: string): Promise<any> {
    const [initiative] = await db.select().from(initiatives).where(eq(initiatives.id, id));
    if (!initiative) return undefined;

    // Get PIC (Person in Charge)
    let pic = null;
    if (initiative.picId) {
      const [picUser] = await db.select().from(users).where(eq(users.id, initiative.picId));
      pic = picUser;
    }

    // Get members with user details
    const members = await db
      .select({
        id: initiativeMembers.id,
        role: initiativeMembers.role,
        joinedAt: initiativeMembers.joinedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(initiativeMembers)
      .leftJoin(users, eq(initiativeMembers.userId, users.id))
      .where(eq(initiativeMembers.initiativeId, id));

    // Get documents with uploader details
    const documents = await db
      .select({
        id: initiativeDocuments.id,
        title: initiativeDocuments.title,
        description: initiativeDocuments.description,
        fileUrl: initiativeDocuments.fileUrl,
        fileName: initiativeDocuments.fileName,
        fileSize: initiativeDocuments.fileSize,
        fileType: initiativeDocuments.fileType,
        category: initiativeDocuments.category,
        uploadedAt: initiativeDocuments.uploadedAt,
        uploadedBy: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(initiativeDocuments)
      .leftJoin(users, eq(initiativeDocuments.uploadedBy, users.id))
      .where(eq(initiativeDocuments.initiativeId, id));

    // Get tasks with assigned user details
    const tasksData = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        assignedTo: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.initiativeId, id));

    return {
      ...initiative,
      pic,
      members,
      documents,
      tasks: tasksData,
    };
  }

  // Initiative Documents
  async createInitiativeDocument(documentData: InsertInitiativeDocument): Promise<InitiativeDocument> {
    const [document] = await db.insert(initiativeDocuments).values(documentData).returning();
    return document;
  }

  async deleteInitiativeDocument(id: string): Promise<boolean> {
    const result = await db.delete(initiativeDocuments).where(eq(initiativeDocuments.id, id));
    return result.rowCount > 0;
  }

  async deleteTask(id: string): Promise<boolean> {
    // Get task before deletion to access initiativeId
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    
    if (result.rowCount > 0 && task) {
      // Recalculate initiative progress after task deletion
      await this.updateInitiativeProgress(task.initiativeId);
    }
    
    return result.rowCount > 0;
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    // Get all tasks assigned to the user with related initiative, key result, and objective information
    const userTasks = await db
      .select({
        task: tasks,
        initiative: initiatives,
        keyResult: keyResults,
        objective: objectives
      })
      .from(tasks)
      .leftJoin(initiatives, eq(tasks.initiativeId, initiatives.id))
      .leftJoin(keyResults, eq(initiatives.keyResultId, keyResults.id))
      .leftJoin(objectives, eq(keyResults.objectiveId, objectives.id))
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.dueDate));

    // Transform the results to include nested data
    return userTasks.map(row => ({
      ...row.task,
      initiative: row.initiative ? {
        ...row.initiative,
        keyResult: row.keyResult ? {
          ...row.keyResult,
          objective: row.objective || undefined
        } : undefined
      } : undefined
    }));
  }
}

// Use database storage
export const storage = new DatabaseStorage();