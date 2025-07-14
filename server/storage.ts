import { 
  cycles, templates, objectives, keyResults, users, teams, teamMembers, checkIns, initiatives, tasks, taskComments, taskAuditTrail,
  initiativeMembers, initiativeDocuments, initiativeNotes, initiativeComments, initiativeSuccessMetrics, successMetricUpdates,
  notifications, notificationPreferences, userOnboardingProgress, organizations, applicationSettings,
  type Cycle, type Template, type Objective, type KeyResult, type User, type Team, type TeamMember,
  type CheckIn, type Initiative, type Task, type TaskComment, type TaskAuditTrail, type KeyResultWithDetails, type InitiativeMember, type InitiativeDocument,
  type InitiativeNote, type InitiativeComment, type InsertCycle, type InsertTemplate, type InsertObjective, type InsertKeyResult, 
  type InsertUser, type UpsertUser, type InsertTeam, type InsertTeamMember,
  type InsertCheckIn, type InsertInitiative, type InsertInitiativeMember, type InsertInitiativeDocument, type InsertTask,
  type InsertTaskComment, type InsertTaskAuditTrail, type InsertInitiativeNote, type InsertInitiativeComment, type OKRWithKeyResults, type CycleWithOKRs, type UpdateKeyResultProgress, type CreateGoalFromTemplate,
  type SuccessMetric, type InsertSuccessMetric, type SuccessMetricUpdate, type InsertSuccessMetricUpdate,
  type Notification, type InsertNotification, type NotificationPreferences, type InsertNotificationPreferences,
  type UserOnboardingProgress, type InsertUserOnboardingProgress, type UpdateOnboardingProgress,
  type ApplicationSetting, type InsertApplicationSetting, type UpdateApplicationSetting,
  type Organization
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray, count } from "drizzle-orm";
import { calculateProgressStatus } from "./progress-tracker";
import { calculateObjectiveStatus } from "./objective-status-tracker";

export interface IStorage {
  // Cycles
  getCycles(): Promise<Cycle[]>;
  getCyclesByOrganization(organizationId: string): Promise<Cycle[]>;
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
  getObjectivesByOrganization(organizationId: string): Promise<Objective[]>;
  getObjective(id: string): Promise<Objective | undefined>;
  createObjective(objective: InsertObjective): Promise<Objective>;
  updateObjective(id: string, objective: Partial<InsertObjective>): Promise<Objective | undefined>;
  deleteObjective(id: string): Promise<boolean>;
  deleteObjectiveWithCascade(id: string): Promise<boolean>;
  getObjectivesByCycleId(cycleId: string): Promise<Objective[]>;
  
  // Key Results
  getKeyResults(): Promise<KeyResult[]>;
  getKeyResultsByOrganization(organizationId: string): Promise<KeyResult[]>;
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
  getUsersByOrganization(organizationId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User | undefined>;
  updateUserReminderConfig(userId: string, config: any): Promise<void>;
  deleteUser(id: string): Promise<boolean>;
  
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  
  // Teams
  getTeam(id: string): Promise<Team | undefined>;
  getTeams(): Promise<Team[]>;
  getTeamsByOrganization(organizationId: string): Promise<Team[]>;
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
  getInitiativesByOrganization(organizationId: string): Promise<Initiative[]>;
  getInitiativesByKeyResultId(keyResultId: string): Promise<Initiative[]>;
  getInitiativesByObjectiveId(objectiveId: string, organizationId?: string): Promise<Initiative[]>;
  getInitiativeWithDetails(id: string): Promise<any>;
  createInitiative(initiative: InsertInitiative): Promise<Initiative>;
  updateInitiative(id: string, initiative: Partial<InsertInitiative>): Promise<Initiative | undefined>;
  deleteInitiative(id: string): Promise<boolean>;
  
  // Initiative Members
  getAllInitiativeMembers(): Promise<InitiativeMember[]>;
  getInitiativeMembers(initiativeId: string): Promise<(InitiativeMember & { user: User })[]>;
  createInitiativeMember(member: InsertInitiativeMember): Promise<InitiativeMember>;
  deleteInitiativeMember(id: string): Promise<boolean>;
  deleteInitiativeMembersByInitiativeId(initiativeId: string): Promise<boolean>;
  
  // Initiative Documents
  createInitiativeDocument(document: InsertInitiativeDocument): Promise<InitiativeDocument>;
  deleteInitiativeDocument(id: string): Promise<boolean>;
  
  // Initiative Notes
  getInitiativeNotes(initiativeId: string): Promise<InitiativeNote[]>;
  createInitiativeNote(note: InsertInitiativeNote): Promise<InitiativeNote>;
  updateInitiativeNote(id: string, note: Partial<InsertInitiativeNote>): Promise<InitiativeNote | undefined>;
  deleteInitiativeNote(id: string): Promise<boolean>;

  // Initiative Comments
  getInitiativeComments(initiativeId: string): Promise<(InitiativeComment & { user: User })[]>;
  createInitiativeComment(comment: InsertInitiativeComment): Promise<InitiativeComment>;
  updateInitiativeComment(id: string, comment: Partial<InsertInitiativeComment>): Promise<InitiativeComment | undefined>;
  deleteInitiativeComment(id: string): Promise<boolean>;
  
  // Initiative History
  getInitiativeHistory(initiativeId: string): Promise<any[]>;
  
  // Success Metrics
  getSuccessMetricsByInitiativeId(initiativeId: string): Promise<SuccessMetric[]>;
  getSuccessMetric(id: string): Promise<SuccessMetric | undefined>;
  createSuccessMetric(metric: InsertSuccessMetric): Promise<SuccessMetric>;
  updateSuccessMetric(id: string, metric: Partial<InsertSuccessMetric>): Promise<SuccessMetric | undefined>;
  deleteSuccessMetric(id: string): Promise<boolean>;
  getSuccessMetricUpdates(metricId: string): Promise<SuccessMetricUpdate[]>;
  createSuccessMetricUpdate(update: InsertSuccessMetricUpdate): Promise<SuccessMetricUpdate>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getTasksByOrganization(organizationId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  getTasksByInitiativeId(initiativeId: string): Promise<Task[]>;
  getTasksByUserId(userId: string): Promise<Task[]>;
  updateInitiativeProgress(initiativeId: string): Promise<void>;
  getTaskWithDetails(id: string): Promise<Task | undefined>;
  
  // Task Comments
  getTaskComments(taskId: string): Promise<(TaskComment & { user: User })[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  updateTaskComment(id: string, comment: Partial<InsertTaskComment>): Promise<TaskComment | undefined>;
  deleteTaskComment(id: string): Promise<boolean>;

  // Task Audit Trail
  getTaskAuditTrail(taskId: string): Promise<(TaskAuditTrail & { user: User })[]>;
  createTaskAuditTrail(auditTrail: InsertTaskAuditTrail): Promise<TaskAuditTrail>;
  
  // Key Result with Details
  getKeyResultWithDetails(id: string): Promise<KeyResultWithDetails | undefined>;

  // Notifications
  getNotifications(userId: string, limit?: number): Promise<(Notification & { actor?: User })[]>;
  getUnreadNotificationsCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;
  deleteNotification(id: string): Promise<boolean>;
  
  // Notification Preferences
  getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined>;
  createOrUpdateNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences>;

  // Combined
  getOKRsWithKeyResults(): Promise<OKRWithKeyResults[]>;
  
  // Client Registration Support
  getOrganizationBySlug(slug: string): Promise<any>;
  createOrganization(org: any): Promise<any>;
  updateOrganization(id: string, updates: any): Promise<any>;
  getOKRWithKeyResults(id: string): Promise<OKRWithKeyResults | undefined>;
  getOKRsWithFullHierarchy(cycleId?: string): Promise<any[]>;
  
  // Onboarding Progress
  getUserOnboardingProgress(userId: string): Promise<UserOnboardingProgress | null>;
  updateUserOnboardingProgress(userId: string, progress: UpdateOnboardingProgress): Promise<UserOnboardingProgress>;
  
  // Organization Onboarding Status
  getOrganizationOnboardingStatus(organizationId: string): Promise<{ isCompleted: boolean; completedAt?: Date; data?: any }>;
  completeOrganizationOnboarding(organizationId: string): Promise<{ isCompleted: boolean; completedAt: Date }>;
  saveCompanyOnboardingProgress(organizationId: string, onboardingData: any): Promise<any>;
  
  // Create first objective from onboarding data
  createFirstObjectiveFromOnboarding(userId: string, onboardingData: any): Promise<Objective | undefined>;
  
  // Member Invitations
  getMemberInvitations(organizationId: string): Promise<User[]>;
  getMemberInvitationByToken(token: string): Promise<User | undefined>;
  createMemberInvitation(invitation: Omit<InsertUser, 'id' | 'password' | 'invitationToken'>): Promise<User>;
  updateMemberInvitation(id: string, invitation: Partial<InsertUser>): Promise<User | undefined>;
  deleteMemberInvitation(id: string): Promise<boolean>;
  acceptMemberInvitation(token: string, userData: { password: string; firstName?: string; lastName?: string }): Promise<User | undefined>;
  
  // Application Settings
  getApplicationSettings(): Promise<ApplicationSetting[]>;
  getApplicationSetting(key: string): Promise<ApplicationSetting | undefined>;
  createApplicationSetting(setting: InsertApplicationSetting): Promise<ApplicationSetting>;
  updateApplicationSetting(key: string, setting: UpdateApplicationSetting): Promise<ApplicationSetting | undefined>;
  deleteApplicationSetting(key: string): Promise<boolean>;
  getPublicApplicationSettings(): Promise<ApplicationSetting[]>;
}

// Helper function to calculate and update status automatically
async function updateKeyResultWithAutoStatus(keyResult: KeyResult, cycleId: string): Promise<KeyResult> {
  // Get cycle to determine dates
  const [cycle] = await db.select().from(cycles).where(eq(cycles.id, cycleId));
  
  if (cycle) {
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.endDate);
    
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

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getUsersByOrganization(organizationId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.organizationId, organizationId));
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning() as User[];
    if (!result || result.length === 0) {
      throw new Error("Failed to create user");
    }
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning() as User[];
    if (!result || result.length === 0) {
      throw new Error("Failed to upsert user");
    }
    return result[0];
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserReminderConfig(userId: string, config: any): Promise<void> {
    await db
      .update(users)
      .set({ reminderConfig: config, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getReminderSettings(userId: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.reminderConfig) {
      return null;
    }
    
    // Handle both object and JSON string formats for backward compatibility
    if (typeof user.reminderConfig === 'string') {
      try {
        return JSON.parse(user.reminderConfig);
      } catch (error) {
        console.error('Error parsing reminder config JSON:', error);
        return null;
      }
    } else {
      return user.reminderConfig;
    }
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
  
  async getTeamsByOrganization(organizationId: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.organizationId, organizationId));
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
  
  async getCyclesByOrganization(organizationId: string): Promise<Cycle[]> {
    // Cycles don't have organizationId, so we need to get cycles that have objectives from this organization
    const result = await db
      .selectDistinct({ cycle: cycles })
      .from(cycles)
      .leftJoin(objectives, eq(objectives.cycleId, cycles.id))
      .leftJoin(users, eq(users.id, objectives.ownerId))
      .where(eq(users.organizationId, organizationId));
    
    return result.map(r => r.cycle).filter(Boolean) as Cycle[];
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
        // Formula: (Current - Base) / (Target - Base) * 100%
        if (targetNum <= baseNum) return 0; // Invalid configuration
        return Math.min(100, Math.max(0, ((currentNum - baseNum) / (targetNum - baseNum)) * 100));
      
      case "decrease_to":
        // Formula: (Base - Current) / (Base - Target) * 100%
        if (baseNum <= targetNum) return 0; // Invalid configuration
        return Math.min(100, Math.max(0, ((baseNum - currentNum) / (baseNum - targetNum)) * 100));
      
      case "should_stay_above":
        // Binary: 100% if current >= target, 0% otherwise
        return currentNum >= targetNum ? 100 : 0;
      
      case "should_stay_below":
        // Binary: 100% if current <= target, 0% otherwise
        return currentNum <= targetNum ? 100 : 0;
      
      case "achieve_or_not":
        // Binary: 100% if current >= target, 0% otherwise
        return currentNum >= targetNum ? 100 : 0;
      
      default:
        return 0; // Unknown type, return 0
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
  
  async getObjectivesByOrganization(organizationId: string): Promise<Objective[]> {
    // Join with users to filter by organization
    const result = await db
      .select({ objective: objectives })
      .from(objectives)
      .innerJoin(users, eq(users.id, objectives.ownerId))
      .where(eq(users.organizationId, organizationId));
    
    return result.map(r => r.objective);
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

  async deleteObjectiveWithCascade(id: string): Promise<boolean> {
    try {
      // Get all key results for this objective
      const objectiveKeyResults = await db.select().from(keyResults).where(eq(keyResults.objectiveId, id));
      
      // For each key result, delete related data
      for (const keyResult of objectiveKeyResults) {
        // Delete check-ins for each key result
        await db.delete(checkIns).where(eq(checkIns.keyResultId, keyResult.id));
        
        // Get all initiatives for this key result and delete related data
        const keyResultInitiatives = await db.select().from(initiatives).where(eq(initiatives.keyResultId, keyResult.id));
        
        for (const initiative of keyResultInitiatives) {
          // Delete tasks for each initiative
          await db.delete(tasks).where(eq(tasks.initiativeId, initiative.id));
          
          // Delete initiative members
          await db.delete(initiativeMembers).where(eq(initiativeMembers.initiativeId, initiative.id));
          
          // Delete initiative documents
          await db.delete(initiativeDocuments).where(eq(initiativeDocuments.initiativeId, initiative.id));
          
          // Delete initiative notes
          await db.delete(initiativeNotes).where(eq(initiativeNotes.initiativeId, initiative.id));
          
          // Delete success metrics and their updates
          const successMetrics = await db.select({ id: initiativeSuccessMetrics.id })
            .from(initiativeSuccessMetrics)
            .where(eq(initiativeSuccessMetrics.initiativeId, initiative.id));
          
          if (successMetrics.length > 0) {
            const metricIds = successMetrics.map(m => m.id);
            await db.delete(successMetricUpdates).where(inArray(successMetricUpdates.metricId, metricIds));
          }
          
          await db.delete(initiativeSuccessMetrics).where(eq(initiativeSuccessMetrics.initiativeId, initiative.id));
          
          // Delete the initiative itself
          await db.delete(initiatives).where(eq(initiatives.id, initiative.id));
        }
        
        // Delete the key result itself
        await db.delete(keyResults).where(eq(keyResults.id, keyResult.id));
      }
      
      // Finally, delete the objective
      const result = await db.delete(objectives).where(eq(objectives.id, id));
      return (result.rowCount ?? 0) > 0;
      
    } catch (error) {
      console.error("Error in cascading delete:", error);
      throw error;
    }
  }

  // Key Results
  async getKeyResults(): Promise<KeyResult[]> {
    const keyResultsData = await db.select().from(keyResults);
    
    // Calculate progress for each key result using the shared progress calculator
    const { calculateKeyResultProgress } = await import("../shared/progress-calculator");
    
    return keyResultsData.map(kr => {
      const progressResult = calculateKeyResultProgress(
        kr.currentValue,
        kr.targetValue,
        kr.keyResultType,
        kr.baseValue
      );
      
      return {
        ...kr,
        progress: progressResult.progressPercentage,
        isCompleted: progressResult.isCompleted,
        isValid: progressResult.isValid
      };
    });
  }

  async getKeyResultsByOrganization(organizationId: string): Promise<KeyResult[]> {
    // Join with objectives and users to filter by organization
    const result = await db
      .select({ keyResult: keyResults })
      .from(keyResults)
      .innerJoin(objectives, eq(objectives.id, keyResults.objectiveId))
      .innerJoin(users, eq(users.id, objectives.ownerId))
      .where(eq(users.organizationId, organizationId));
    
    // Calculate progress for each key result using the shared progress calculator
    const { calculateKeyResultProgress } = await import("../shared/progress-calculator");
    
    return result.map(r => {
      const kr = r.keyResult;
      const progressResult = calculateKeyResultProgress(
        kr.currentValue,
        kr.targetValue,
        kr.keyResultType,
        kr.baseValue
      );
      
      return {
        ...kr,
        progress: progressResult.progressPercentage,
        isCompleted: progressResult.isCompleted,
        isValid: progressResult.isValid
      };
    });
  }

  async getKeyResultsByObjectiveId(objectiveId: string): Promise<KeyResult[]> {
    const keyResultsList = await db.select().from(keyResults).where(eq(keyResults.objectiveId, objectiveId));
    
    // Import the shared progress calculator
    const { calculateKeyResultProgress } = await import("../shared/progress-calculator");
    
    // Get the objective to find the cycle for date calculation
    const objective = await this.getObjective(objectiveId);
    if (!objective || !objective.cycleId) {
      return await Promise.all(keyResultsList.map(async kr => {
        const lastCheckIn = await this.getLastCheckInForKeyResult(kr.id);
        const progressResult = calculateKeyResultProgress(
          kr.currentValue,
          kr.targetValue,
          kr.keyResultType,
          kr.baseValue
        );
        
        return {
          ...kr,
          progress: progressResult.progressPercentage,
          isCompleted: progressResult.isCompleted,
          isValid: progressResult.isValid,
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
        const progressResult = calculateKeyResultProgress(
          kr.currentValue,
          kr.targetValue,
          kr.keyResultType,
          kr.baseValue
        );
        
        return {
          ...kr,
          progress: progressResult.progressPercentage,
          isCompleted: progressResult.isCompleted,
          isValid: progressResult.isValid,
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
        const endDate = new Date(cycle.endDate);
        
        const progressStatus = calculateProgressStatus(kr, startDate, endDate);
        const lastCheckIn = await this.getLastCheckInForKeyResult(kr.id);
        const progressResult = calculateKeyResultProgress(
          kr.currentValue,
          kr.targetValue,
          kr.keyResultType,
          kr.baseValue
        );
        
        return {
          ...kr,
          progress: progressResult.progressPercentage,
          isCompleted: progressResult.isCompleted,
          isValid: progressResult.isValid,
          status: progressStatus.status,
          timeProgressPercentage: progressStatus.timeProgressPercentage,
          lastCheckIn
        };
      } catch (error) {
        console.error('Error calculating progress status for key result:', kr.id, error);
        const lastCheckIn = await this.getLastCheckInForKeyResult(kr.id);
        const progressResult = calculateKeyResultProgress(
          kr.currentValue,
          kr.targetValue,
          kr.keyResultType,
          kr.baseValue
        );
        
        // Return key result with default values if calculation fails
        return {
          ...kr,
          progress: progressResult.progressPercentage,
          isCompleted: progressResult.isCompleted,
          isValid: progressResult.isValid,
          status: kr.status || 'on_track',
          timeProgressPercentage: 0,
          lastCheckIn
        };
      }
    }));
  }

  async getKeyResult(id: string): Promise<KeyResult | undefined> {
    const [keyResult] = await db.select().from(keyResults).where(eq(keyResults.id, id));
    if (!keyResult) return undefined;
    
    // Calculate progress using the shared progress calculator
    const { calculateKeyResultProgress } = await import("../shared/progress-calculator");
    const progressResult = calculateKeyResultProgress(
      keyResult.currentValue,
      keyResult.targetValue,
      keyResult.keyResultType,
      keyResult.baseValue
    );
    
    return {
      ...keyResult,
      progress: progressResult.progressPercentage,
      isCompleted: progressResult.isCompleted,
      isValid: progressResult.isValid
    };
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
  
  async getInitiativesByOrganization(organizationId: string): Promise<Initiative[]> {
    // Join with users through createdBy to filter by organization
    const result = await db
      .select({ initiative: initiatives })
      .from(initiatives)
      .innerJoin(users, eq(users.id, initiatives.createdBy))
      .where(eq(users.organizationId, organizationId));
    
    return result.map(r => r.initiative);
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

  async getInitiativesByObjectiveId(objectiveId: string, organizationId?: string): Promise<Initiative[]> {
    // First get all key results for this objective
    const keyResultsList = await this.getKeyResultsByObjectiveId(objectiveId);
    
    // Then get all initiatives for these key results with organization filtering
    const initiativesList = [];
    for (const kr of keyResultsList) {
      if (organizationId) {
        // Filter by organization - get initiatives first, then filter by creator's organization
        const krInitiatives = await db.select().from(initiatives).where(eq(initiatives.keyResultId, kr.id));
        
        // Filter by checking each initiative's creator organization
        const filteredInitiatives = [];
        for (const initiative of krInitiatives) {
          const creator = await this.getUser(initiative.createdBy);
          if (creator && creator.organizationId === organizationId) {
            filteredInitiatives.push(initiative);
          }
        }
        
        initiativesList.push(...filteredInitiatives);
      } else {
        // No organization filter (backward compatibility)
        const krInitiatives = await db.select().from(initiatives).where(eq(initiatives.keyResultId, kr.id));
        initiativesList.push(...krInitiatives);
      }
    }
    
    return initiativesList;
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
    
    // Delete success metrics and their updates
    await db.delete(successMetricUpdates).where(
      inArray(successMetricUpdates.metricId, 
        db.select({ id: initiativeSuccessMetrics.id })
          .from(initiativeSuccessMetrics)
          .where(eq(initiativeSuccessMetrics.initiativeId, id))
      )
    );
    await db.delete(initiativeSuccessMetrics).where(eq(initiativeSuccessMetrics.initiativeId, id));
    
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

  async deleteInitiativeMembersByInitiativeId(initiativeId: string): Promise<boolean> {
    const result = await db.delete(initiativeMembers).where(eq(initiativeMembers.initiativeId, initiativeId));
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
  
  async getTasksByOrganization(organizationId: string): Promise<Task[]> {
    // Join with users through createdBy to filter by organization
    const result = await db
      .select({ task: tasks })
      .from(tasks)
      .innerJoin(users, eq(users.id, tasks.createdBy))
      .where(eq(users.organizationId, organizationId));
    
    return result.map(r => r.task);
  }

  async getTasksByInitiativeId(initiativeId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.initiativeId, initiativeId));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    
    // Create audit trail for task creation
    await this.createTaskAuditTrail({
      taskId: task.id,
      userId: task.createdBy,
      action: "created",
      oldValue: null,
      newValue: task.title,
      changeDescription: `Task dibuat dengan judul: "${task.title}"`
    });
    
    // Recalculate initiative progress after task creation (only if task is linked to initiative)
    if (taskData.initiativeId) {
      await this.updateInitiativeProgress(taskData.initiativeId);
    }
    
    return task;
  }

  async updateTask(id: string, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();

    if (task && task.initiativeId) {
      // Recalculate initiative progress after task update (only if task is linked to initiative)
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

    // Get related key result with progress calculation
    let keyResult = null;
    if (initiative.keyResultId) {
      const [kr] = await db.select().from(keyResults).where(eq(keyResults.id, initiative.keyResultId));
      if (kr) {
        // Calculate progress using the shared progress calculator
        const { calculateKeyResultProgress } = await import("../shared/progress-calculator");
        const progressResult = calculateKeyResultProgress(
          kr.currentValue,
          kr.targetValue,
          kr.keyResultType,
          kr.baseValue
        );
        keyResult = {
          ...kr,
          progress: progressResult.progressPercentage,
          isCompleted: progressResult.isCompleted,
          isValid: progressResult.isValid
        };
      }
    }

    return {
      ...initiative,
      pic,
      members,
      documents,
      tasks: tasksData,
      keyResult,
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

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }



  async deleteTask(id: string): Promise<boolean> {
    // Get task before deletion to access initiativeId
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    
    if (!task) {
      return false;
    }
    
    // Delete related data first to avoid foreign key constraint violations
    try {
      console.log(`🗑️ Deleting task ${id} and related data...`);
      
      // Delete task comments
      const commentsResult = await db.delete(taskComments).where(eq(taskComments.taskId, id));
      console.log(`🗑️ Deleted ${commentsResult.rowCount} comments for task ${id}`);
      
      // Delete task audit trail
      const auditResult = await db.delete(taskAuditTrail).where(eq(taskAuditTrail.taskId, id));
      console.log(`🗑️ Deleted ${auditResult.rowCount} audit trail entries for task ${id}`);
      
      // Delete the task itself
      const result = await db.delete(tasks).where(eq(tasks.id, id));
      console.log(`🗑️ Deleted task ${id}, result: ${result.rowCount} rows affected`);
      
      if (result.rowCount > 0 && task.initiativeId) {
        // Recalculate initiative progress after task deletion (only if task was linked to initiative)
        await this.updateInitiativeProgress(task.initiativeId);
      }
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting task and related data:", error);
      throw error;
    }
  }

  // Initiative Notes
  async getInitiativeNotes(initiativeId: string): Promise<InitiativeNote[]> {
    return await db
      .select()
      .from(initiativeNotes)
      .where(eq(initiativeNotes.initiativeId, initiativeId))
      .orderBy(desc(initiativeNotes.createdAt));
  }

  async createInitiativeNote(note: InsertInitiativeNote): Promise<InitiativeNote> {
    const [newNote] = await db.insert(initiativeNotes).values(note).returning();
    return newNote;
  }

  async updateInitiativeNote(id: string, note: Partial<InsertInitiativeNote>): Promise<InitiativeNote | undefined> {
    const [updatedNote] = await db
      .update(initiativeNotes)
      .set({ ...note, updatedAt: new Date() })
      .where(eq(initiativeNotes.id, id))
      .returning();
    return updatedNote || undefined;
  }

  async deleteInitiativeNote(id: string): Promise<boolean> {
    const result = await db.delete(initiativeNotes).where(eq(initiativeNotes.id, id));
    return result.rowCount > 0;
  }

  // Initiative Comments
  async getInitiativeComments(initiativeId: string): Promise<(InitiativeComment & { user: User })[]> {
    console.log('🔍 getInitiativeComments called with initiativeId:', initiativeId);
    
    const result = await db
      .select({
        id: initiativeComments.id,
        initiativeId: initiativeComments.initiativeId,
        userId: initiativeComments.userId,
        content: initiativeComments.content,
        mentionedUsers: initiativeComments.mentionedUsers,
        parentId: initiativeComments.parentId,
        isEdited: initiativeComments.isEdited,
        editedAt: initiativeComments.editedAt,
        createdAt: initiativeComments.createdAt,
        updatedAt: initiativeComments.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          password: users.password
        }
      })
      .from(initiativeComments)
      .leftJoin(users, eq(initiativeComments.userId, users.id))
      .where(eq(initiativeComments.initiativeId, initiativeId))
      .orderBy(desc(initiativeComments.createdAt));
    
    console.log('📝 getInitiativeComments result:', JSON.stringify(result, null, 2));
    return result;
  }

  async createInitiativeComment(comment: InsertInitiativeComment): Promise<InitiativeComment> {
    const [newComment] = await db.insert(initiativeComments).values(comment).returning();
    return newComment;
  }

  async updateInitiativeComment(id: string, comment: Partial<InsertInitiativeComment>): Promise<InitiativeComment | undefined> {
    const [updatedComment] = await db
      .update(initiativeComments)
      .set({ ...comment, updatedAt: new Date() })
      .where(eq(initiativeComments.id, id))
      .returning();
    return updatedComment || undefined;
  }

  async deleteInitiativeComment(id: string): Promise<boolean> {
    console.log('🗑️ Deleting initiative comment:', id);
    
    // First, delete all child comments (replies) that reference this comment as parent
    const childDeleteResult = await db
      .delete(initiativeComments)
      .where(eq(initiativeComments.parentId, id));
    
    console.log('🗑️ Deleted child comments:', childDeleteResult.rowCount || 0);
    
    // Then delete the parent comment
    const parentDeleteResult = await db
      .delete(initiativeComments)
      .where(eq(initiativeComments.id, id));
    
    console.log('🗑️ Deleted parent comment:', parentDeleteResult.rowCount || 0);
    
    return (parentDeleteResult.rowCount || 0) > 0;
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    // Get all tasks assigned to the user with related initiative, key result, objective, and user information
    const userTasks = await db
      .select({
        task: tasks,
        initiative: initiatives,
        keyResult: keyResults,
        objective: objectives,
        assignedUser: users
      })
      .from(tasks)
      .leftJoin(initiatives, eq(tasks.initiativeId, initiatives.id))
      .leftJoin(keyResults, eq(initiatives.keyResultId, keyResults.id))
      .leftJoin(objectives, eq(keyResults.objectiveId, objectives.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.dueDate));

    // Transform the results to include nested data
    return userTasks.map(row => ({
      ...row.task,
      assignedUser: row.assignedUser || undefined,
      initiative: row.initiative ? {
        ...row.initiative,
        keyResult: row.keyResult ? {
          ...row.keyResult,
          objective: row.objective || undefined
        } : undefined
      } : undefined
    }));
  }

  // Success Metrics
  async getSuccessMetricsByInitiativeId(initiativeId: string): Promise<SuccessMetric[]> {
    return await db
      .select()
      .from(initiativeSuccessMetrics)
      .where(eq(initiativeSuccessMetrics.initiativeId, initiativeId))
      .orderBy(desc(initiativeSuccessMetrics.createdAt));
  }

  async getSuccessMetric(id: string): Promise<SuccessMetric | undefined> {
    const [metric] = await db
      .select()
      .from(initiativeSuccessMetrics)
      .where(eq(initiativeSuccessMetrics.id, id));
    return metric || undefined;
  }

  async createSuccessMetric(metric: InsertSuccessMetric): Promise<SuccessMetric> {
    const [newMetric] = await db.insert(initiativeSuccessMetrics).values(metric).returning();
    return newMetric;
  }

  async updateSuccessMetric(id: string, metric: Partial<InsertSuccessMetric> & { lastUpdateBy?: string }): Promise<SuccessMetric | undefined> {
    const [updatedMetric] = await db
      .update(initiativeSuccessMetrics)
      .set({ ...metric, updatedAt: new Date(), lastUpdateBy: metric.lastUpdateBy })
      .where(eq(initiativeSuccessMetrics.id, id))
      .returning();
    return updatedMetric || undefined;
  }

  async deleteSuccessMetric(id: string): Promise<boolean> {
    // First delete all related updates
    await db.delete(successMetricUpdates).where(eq(successMetricUpdates.metricId, id));
    
    // Then delete the metric itself
    const result = await db.delete(initiativeSuccessMetrics).where(eq(initiativeSuccessMetrics.id, id));
    return result.rowCount > 0;
  }

  async getSuccessMetricUpdates(metricId: string): Promise<SuccessMetricUpdate[]> {
    return await db
      .select()
      .from(successMetricUpdates)
      .where(eq(successMetricUpdates.metricId, metricId))
      .orderBy(desc(successMetricUpdates.createdAt));
  }

  async createSuccessMetricUpdate(update: InsertSuccessMetricUpdate): Promise<SuccessMetricUpdate> {
    const [newUpdate] = await db.insert(successMetricUpdates).values(update).returning();
    return newUpdate;
  }

  // Task Comments
  async getTaskComments(taskId: string): Promise<(TaskComment & { user: User })[]> {
    const comments = await db
      .select({
        comment: taskComments,
        user: users,
      })
      .from(taskComments)
      .innerJoin(users, eq(taskComments.userId, users.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(desc(taskComments.createdAt));

    return comments.map(row => ({
      ...row.comment,
      user: row.user,
    }));
  }

  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const [newComment] = await db.insert(taskComments).values(comment).returning();
    return newComment;
  }

  async updateTaskComment(id: string, comment: Partial<InsertTaskComment>): Promise<TaskComment | undefined> {
    const [updatedComment] = await db
      .update(taskComments)
      .set({
        ...comment,
        updatedAt: new Date(),
      })
      .where(eq(taskComments.id, id))
      .returning();
    return updatedComment || undefined;
  }

  async deleteTaskComment(id: string): Promise<boolean> {
    const result = await db.delete(taskComments).where(eq(taskComments.id, id));
    return result.rowCount > 0;
  }

  // Task Audit Trail
  async getTaskAuditTrail(taskId: string): Promise<(TaskAuditTrail & { user: User })[]> {
    const auditTrail = await db
      .select({
        auditTrail: taskAuditTrail,
        user: users,
      })
      .from(taskAuditTrail)
      .innerJoin(users, eq(taskAuditTrail.userId, users.id))
      .where(eq(taskAuditTrail.taskId, taskId))
      .orderBy(desc(taskAuditTrail.createdAt));

    return auditTrail.map(row => ({
      ...row.auditTrail,
      user: row.user,
    }));
  }

  async createTaskAuditTrail(auditTrailData: InsertTaskAuditTrail): Promise<TaskAuditTrail> {
    const [newAuditTrail] = await db.insert(taskAuditTrail).values(auditTrailData).returning();
    return newAuditTrail;
  }

  // Notifications
  async getNotifications(userId: string, limit: number = 50): Promise<(Notification & { actor?: User })[]> {
    const notificationList = await db
      .select({
        notification: notifications,
        actor: users,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actorId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return notificationList.map(row => ({
      ...row.notification,
      actor: row.actor || undefined,
    }));
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return unreadNotifications.length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(notifications.id, id));
    
    return result.rowCount > 0;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date(),
        updatedAt: new Date() 
      })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return result.rowCount > 0;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return result.rowCount > 0;
  }

  // Notification Preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    
    return preferences;
  }

  async createOrUpdateNotificationPreferences(preferences: InsertNotificationPreferences): Promise<NotificationPreferences> {
    const existing = await this.getNotificationPreferences(preferences.userId);
    
    if (existing) {
      const [updated] = await db
        .update(notificationPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, preferences.userId))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(notificationPreferences)
        .values(preferences)
        .returning();
      
      return created;
    }
  }
  
  // Client Registration Support Methods
  async getOrganizationBySlug(slug: string): Promise<any> {
    const { organizations } = await import("@shared/schema");
    const result = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return result[0];
  }

  async createOrganization(orgData: any): Promise<any> {
    const { organizations } = await import("@shared/schema");
    const result = await db.insert(organizations).values(orgData).returning() as any[];
    if (!result || result.length === 0) {
      throw new Error("Failed to create organization");
    }
    return result[0];
  }

  async updateOrganization(id: string, updates: any): Promise<any> {
    const { organizations } = await import("@shared/schema");
    const [updated] = await db.update(organizations)
      .set(updates)
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  // Onboarding Progress methods
  async getUserOnboardingProgress(userId: string): Promise<UserOnboardingProgress | null> {
    try {
      const [progress] = await db.select().from(userOnboardingProgress).where(eq(userOnboardingProgress.userId, userId));
      return progress || null;
    } catch (error) {
      console.error("Error fetching onboarding progress:", error);
      throw error;
    }
  }

  async updateUserOnboardingProgress(userId: string, progressData: UpdateOnboardingProgress): Promise<UserOnboardingProgress> {
    try {
      // Check if user already has progress data
      const existingProgress = await this.getUserOnboardingProgress(userId);
      
      if (existingProgress) {
        // Update existing progress
        const [updatedProgress] = await db
          .update(userOnboardingProgress)
          .set({
            ...progressData,
            updatedAt: new Date()
          })
          .where(eq(userOnboardingProgress.userId, userId))
          .returning();
        
        return updatedProgress;
      } else {
        // Create new progress record
        const [newProgress] = await db
          .insert(userOnboardingProgress)
          .values({
            userId,
            ...progressData,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        return newProgress;
      }
    } catch (error) {
      console.error("Error updating onboarding progress:", error);
      throw error;
    }
  }
  
  // Organization Onboarding Status - Optimized for performance
  async getOrganizationOnboardingStatus(organizationId: string): Promise<{ isCompleted: boolean; completedAt?: Date; data?: any }> {
    try {
      console.log("📋 Fetching onboarding status for organization:", organizationId);
      
      // Only select the fields we need for better performance
      const [organization] = await db
        .select({
          onboardingCompleted: organizations.onboardingCompleted,
          onboardingCompletedAt: organizations.onboardingCompletedAt,
          onboardingData: organizations.onboardingData
        })
        .from(organizations)
        .where(eq(organizations.id, organizationId));
      
      if (!organization) {
        console.log("❌ Organization not found for ID:", organizationId);
        return { isCompleted: false };
      }
      
      const result = {
        isCompleted: organization.onboardingCompleted || false,
        completedAt: organization.onboardingCompletedAt || undefined,
        data: organization.onboardingData || undefined
      };
      
      console.log("✅ Organization onboarding status:", result);
      return result;
    } catch (error) {
      console.error("Error fetching organization onboarding status:", error);
      throw error;
    }
  }
  
  async completeOrganizationOnboarding(organizationId: string): Promise<{ isCompleted: boolean; completedAt: Date }> {
    try {
      const completedAt = new Date();
      
      const [updatedOrganization] = await db
        .update(organizations)
        .set({
          onboardingCompleted: true,
          onboardingCompletedAt: completedAt,
          updatedAt: completedAt
        })
        .where(eq(organizations.id, organizationId))
        .returning();
      
      if (!updatedOrganization) {
        throw new Error("Organization not found");
      }
      
      return {
        isCompleted: true,
        completedAt: completedAt
      };
    } catch (error) {
      console.error("Error completing organization onboarding:", error);
      throw error;
    }
  }

  async saveCompanyOnboardingProgress(organizationId: string, onboardingData: any): Promise<any> {
    try {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      
      const [updatedOrganization] = await db
        .update(organizations)
        .set({
          onboardingData: onboardingData,
          updatedAt: new Date()
        })
        .where(eq(organizations.id, organizationId))
        .returning();
      
      if (!updatedOrganization) {
        throw new Error("Organization not found");
      }
      
      return {
        success: true,
        data: onboardingData
      };
    } catch (error) {
      console.error("Error saving company onboarding progress:", error);
      throw error;
    }
  }

  // Create first objective from onboarding data
  async createFirstObjectiveFromOnboarding(userId: string, onboardingData: any): Promise<Objective | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      // Always create a new cycle from onboarding data to ensure it matches user input
      const startDate = onboardingData.cycleStartDate ? new Date(onboardingData.cycleStartDate) : new Date();
      const endDate = onboardingData.cycleEndDate ? new Date(onboardingData.cycleEndDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      console.log(`🔄 Creating cycle from onboarding data:`, {
        cycleStartDate: onboardingData.cycleStartDate,
        cycleEndDate: onboardingData.cycleEndDate,
        cycleDuration: onboardingData.cycleDuration,
        calculatedStartDate: startDate.toISOString(),
        calculatedEndDate: endDate.toISOString()
      });
      
      // Generate cycle name based on dates and duration
      const cycleName = onboardingData.cycleDuration === '1_bulan' ? 
        `Bulanan - ${startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}` :
        onboardingData.cycleDuration === '3_bulan' ? 
        `Triwulanan - ${startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}` :
        onboardingData.cycleDuration === '6_bulan' ? 
        `Semester - ${startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}` :
        `Tahunan - ${startDate.getFullYear()}`;
      
      const cycleData = {
        name: cycleName,
        type: onboardingData.cycleDuration === '1_bulan' ? 'monthly' : 
              onboardingData.cycleDuration === '3_bulan' ? 'quarterly' :
              onboardingData.cycleDuration === '6_bulan' ? 'biannual' : 'annual',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active',
        description: `Siklus dari hasil onboarding perusahaan - ${onboardingData.teamFocus || 'General'}`
      };
      
      console.log(`🔄 Creating cycle from onboarding: ${cycleName} (${cycleData.startDate} to ${cycleData.endDate})`);
      
      console.log("🔄 Inserting cycle data:", cycleData);
      const [newCycle] = await db.insert(cycles).values(cycleData).returning();
      console.log("✅ Cycle created successfully:", newCycle);
      const activeCycle = [newCycle];
      
      // Create objective from onboarding data
      const objectiveData = {
        cycleId: activeCycle[0].id,
        title: onboardingData.objective,
        description: `Objective pertama dari hasil onboarding (${onboardingData.teamFocus || 'General'})`,
        owner: user.firstName || user.email,
        ownerType: 'user',
        ownerId: userId,
        status: 'not_started'
      };
      
      const [newObjective] = await db.insert(objectives).values(objectiveData).returning();
      
      if (!newObjective) {
        throw new Error("Failed to create objective");
      }
      
      // Create key results from onboarding data
      if (onboardingData.keyResults && onboardingData.keyResults.length > 0) {
        const keyResultsData = onboardingData.keyResults
          .filter((kr: string) => kr && kr.trim() !== '' && kr !== 'custom')
          .map((kr: string) => ({
            objectiveId: newObjective.id,
            title: kr,
            description: `Key result dari hasil onboarding`,
            currentValue: "0",
            targetValue: "100",
            unit: "percentage",
            keyResultType: "increase_to",
            status: "on_track",
            assignedTo: userId
          }));
        
        if (keyResultsData.length > 0) {
          await db.insert(keyResults).values(keyResultsData);
        }
      }
      
      // Create initiatives from onboarding data
      if (onboardingData.initiatives && onboardingData.initiatives.length > 0) {
        const objectiveKeyResults = await db.select().from(keyResults).where(eq(keyResults.objectiveId, newObjective.id));
        
        if (objectiveKeyResults.length > 0) {
          // Helper function to generate random deadline within cycle range
          // Some tasks will have today's deadline to immediately show up in daily focus
          const generateRandomDeadline = (startDate: string, endDate: string, index: number = 0) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set to beginning of day
            
            // For the first 2 tasks, set deadline to today so they appear immediately
            if (index < 2) {
              return today;
            }
            
            // For remaining tasks, generate random dates within cycle range
            const start = new Date(startDate);
            const end = new Date(endDate);
            const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
            return new Date(randomTime);
          };

          // Use cycle dates from onboarding data or create default range
          const cycleStartDate = onboardingData.cycleStartDate || new Date().toISOString().split('T')[0];
          const cycleEndDate = onboardingData.cycleEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          const initiativesData = onboardingData.initiatives
            .filter((init: string) => init && init.trim() !== '' && init !== 'custom')
            .map((init: string) => ({
              keyResultId: objectiveKeyResults[0].id, // Link to first key result
              title: init,
              description: `Inisiatif dari hasil onboarding`,
              status: 'draft',
              priority: 'medium',
              picId: userId,
              impactScore: 3,
              effortScore: 3,
              confidenceScore: 3,
              priorityScore: "3.00",
              createdBy: userId,
              startDate: new Date(cycleStartDate),
              dueDate: new Date(cycleEndDate)
            }));
          
          if (initiativesData.length > 0) {
            const createdInitiatives = await db.insert(initiatives).values(initiativesData).returning();
            
            // Create tasks from onboarding data
            if (onboardingData.tasks && onboardingData.tasks.length > 0 && createdInitiatives.length > 0) {
              const tasksData = onboardingData.tasks
                .filter((task: string) => task && task.trim() !== '' && task !== 'custom')
                .map((task: string, index: number) => ({
                  initiativeId: createdInitiatives[0].id, // Link to first initiative
                  title: task,
                  description: `Task dari hasil onboarding`,
                  status: 'not_started',
                  priority: 'medium',
                  assignedTo: userId,
                  createdBy: userId,
                  dueDate: generateRandomDeadline(cycleStartDate, cycleEndDate, index)
                }));
              
              if (tasksData.length > 0) {
                await db.insert(tasks).values(tasksData);
                const todayTasksCount = Math.min(2, tasksData.length);
                const futureTasksCount = tasksData.length - todayTasksCount;
                console.log(`📅 Created ${tasksData.length} tasks: ${todayTasksCount} with today's deadline, ${futureTasksCount} with random deadlines between ${cycleStartDate} and ${cycleEndDate}`);
              }
            }
            
            console.log(`📅 Created ${initiativesData.length} initiatives with startDate: ${cycleStartDate} and dueDate: ${cycleEndDate}`);
          }
        }
      }
      
      return newObjective;
    } catch (error) {
      console.error("Error creating first objective from onboarding:", error);
      throw error;
    }
  }
  
  // Member Invitation methods
  async getMemberInvitations(organizationId: string): Promise<User[]> {
    try {
      const invitations = await db
        .select()
        .from(users)
        .where(and(
          eq(users.organizationId, organizationId),
          eq(users.invitationStatus, 'pending')
        ))
        .orderBy(desc(users.createdAt));
      
      return invitations;
    } catch (error) {
      console.error("Error fetching member invitations:", error);
      throw error;
    }
  }
  
  async getMemberInvitationByToken(token: string): Promise<User | undefined> {
    try {
      console.log("🔍 Searching for invitation token:", token);
      const [invitation] = await db
        .select()
        .from(users)
        .where(eq(users.invitationToken, token));
      
      console.log("📋 Query result:", invitation ? "Found invitation" : "No invitation found");
      if (invitation) {
        console.log("✅ Invitation details:", {
          id: invitation.id,
          email: invitation.email,
          status: invitation.invitationStatus,
          token: invitation.invitationToken
        });
      }
      
      return invitation;
    } catch (error) {
      console.error("Error fetching member invitation by token:", error);
      throw error;
    }
  }
  
  async createMemberInvitation(invitation: Omit<InsertUser, 'id' | 'password' | 'invitationToken'>): Promise<User> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
      
      // Generate random UUID token for invitation
      const crypto = await import('crypto');
      const invitationToken = crypto.randomUUID();
      
      const [newInvitation] = await db
        .insert(users)
        .values({
          ...invitation,
          invitationStatus: 'pending',
          invitationExpiresAt: expiresAt,
          invitationToken: invitationToken,
          password: null, // No password for invited users
          isActive: false, // Invited users should be inactive until they accept
        })
        .returning();
      
      return newInvitation;
    } catch (error) {
      console.error("Error creating member invitation:", error);
      throw error;
    }
  }
  
  async updateMemberInvitation(id: string, invitation: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updatedInvitation] = await db
        .update(users)
        .set({
          ...invitation,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      
      return updatedInvitation;
    } catch (error) {
      console.error("Error updating member invitation:", error);
      throw error;
    }
  }
  
  async deleteMemberInvitation(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(users)
        .where(eq(users.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting member invitation:", error);
      throw error;
    }
  }
  
  async acceptMemberInvitation(token: string, userData: { password: string; firstName?: string; lastName?: string }): Promise<User | undefined> {
    try {
      console.log("🔍 acceptMemberInvitation called with:", {
        token,
        userData: {
          password: userData.password ? '[PROVIDED]' : '[MISSING]',
          firstName: userData.firstName || '[MISSING]',
          lastName: userData.lastName || '[MISSING]'
        }
      });
      
      // Get the invitation
      const invitation = await this.getMemberInvitationByToken(token);
      if (!invitation) {
        console.log("❌ Invalid invitation token");
        throw new Error("Invalid invitation token");
      }
      
      console.log("✅ Invitation found:", {
        id: invitation.id,
        email: invitation.email,
        status: invitation.invitationStatus,
        expiresAt: invitation.invitationExpiresAt
      });
      
      // Check if invitation is expired
      if (invitation.invitationExpiresAt && new Date() > invitation.invitationExpiresAt) {
        console.log("❌ Invitation has expired");
        throw new Error("Invitation has expired");
      }
      
      // Check if invitation is already accepted
      if (invitation.invitationStatus === "accepted") {
        console.log("❌ Invitation has already been accepted");
        throw new Error("Invitation has already been accepted");
      }
      
      // Update the user with password and acceptance info
      const updateData = {
        password: userData.password, // Add password
        firstName: userData.firstName || invitation.firstName,
        lastName: userData.lastName || invitation.lastName,
        invitationStatus: "accepted",
        invitationAcceptedAt: new Date(),
        isActive: true,
        isEmailVerified: true,
        updatedAt: new Date(),
      };
      
      console.log("🔄 Updating user with data:", {
        ...updateData,
        password: '[HIDDEN]'
      });
      
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, invitation.id))
        .returning();
      
      console.log("✅ User updated successfully:", {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isActive: updatedUser.isActive
      });
      
      return updatedUser;
    } catch (error) {
      console.error("❌ Error accepting member invitation:", error);
      throw error;
    }
  }

  async convertInvitationToInactiveMember(invitationId: string): Promise<User | undefined> {
    try {
      // Get the invitation user
      const invitation = await this.getUser(invitationId);
      if (!invitation) {
        throw new Error("Invitation not found");
      }

      // Check if invitation is already accepted
      if (invitation.invitationStatus === "accepted") {
        throw new Error("Invitation has already been accepted");
      }

      // Update the user to inactive member status
      const [inactiveUser] = await db
        .update(users)
        .set({
          invitationStatus: "inactive", // Mark as inactive member
          invitationAcceptedAt: new Date(),
          isActive: false, // Set as inactive
          isEmailVerified: false, // Not verified since they haven't registered
          firstName: invitation.firstName || invitation.email.split('@')[0], // Use email prefix as temporary name
          updatedAt: new Date(),
        })
        .where(eq(users.id, invitationId))
        .returning();

      return inactiveUser;
    } catch (error) {
      console.error("Error converting invitation to inactive member:", error);
      throw error;
    }
  }
  
  // Application Settings methods
  async getApplicationSettings(): Promise<ApplicationSetting[]> {
    try {
      const settings = await db
        .select()
        .from(applicationSettings)
        .orderBy(applicationSettings.category, applicationSettings.key);
      
      return settings;
    } catch (error) {
      console.error("Error fetching application settings:", error);
      throw error;
    }
  }
  
  async getApplicationSetting(key: string): Promise<ApplicationSetting | undefined> {
    try {
      const [setting] = await db
        .select()
        .from(applicationSettings)
        .where(eq(applicationSettings.key, key));
      
      return setting;
    } catch (error) {
      console.error("Error fetching application setting:", error);
      throw error;
    }
  }
  
  async createApplicationSetting(setting: InsertApplicationSetting): Promise<ApplicationSetting> {
    try {
      const [newSetting] = await db
        .insert(applicationSettings)
        .values(setting)
        .returning();
      
      return newSetting;
    } catch (error) {
      console.error("Error creating application setting:", error);
      throw error;
    }
  }
  
  async updateApplicationSetting(key: string, setting: UpdateApplicationSetting): Promise<ApplicationSetting | undefined> {
    try {
      const [updatedSetting] = await db
        .update(applicationSettings)
        .set({
          ...setting,
          updatedAt: new Date(),
        })
        .where(eq(applicationSettings.key, key))
        .returning();
      
      return updatedSetting;
    } catch (error) {
      console.error("Error updating application setting:", error);
      throw error;
    }
  }
  
  async deleteApplicationSetting(key: string): Promise<boolean> {
    try {
      const result = await db
        .delete(applicationSettings)
        .where(eq(applicationSettings.key, key));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting application setting:", error);
      throw error;
    }
  }
  
  async getPublicApplicationSettings(): Promise<ApplicationSetting[]> {
    try {
      const settings = await db
        .select()
        .from(applicationSettings)
        .where(eq(applicationSettings.isPublic, true))
        .orderBy(applicationSettings.category, applicationSettings.key);
      
      return settings;
    } catch (error) {
      console.error("Error fetching public application settings:", error);
      throw error;
    }
  }

  async getInitiativeHistory(initiativeId: string): Promise<any[]> {
    try {
      // Get initiative details for creation info
      const initiative = await db
        .select({
          id: initiatives.id,
          title: initiatives.title,
          createdAt: initiatives.createdAt,
          createdBy: initiatives.createdBy,
          updatedAt: initiatives.updatedAt,
          creator: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role
          }
        })
        .from(initiatives)
        .innerJoin(users, eq(users.id, initiatives.createdBy))
        .where(eq(initiatives.id, initiativeId))
        .limit(1);

      if (!initiative || initiative.length === 0) {
        return [];
      }

      const initiativeData = initiative[0];
      
      // Build history array with creation entry
      const history = [];
      
      // Add initiative creation entry
      history.push({
        id: `${initiativeData.id}-created`,
        action: 'created',
        description: 'Inisiatif dibuat',
        timestamp: initiativeData.createdAt,
        user: {
          id: initiativeData.creator.id,
          email: initiativeData.creator.email,
          firstName: initiativeData.creator.firstName,
          lastName: initiativeData.creator.lastName,
          role: initiativeData.creator.role
        }
      });

      // Get success metrics updates for this initiative
      const successMetricsData = await db
        .select({
          id: initiativeSuccessMetrics.id,
          name: initiativeSuccessMetrics.name,
          achievement: initiativeSuccessMetrics.achievement,
          target: initiativeSuccessMetrics.target,
          unit: initiativeSuccessMetrics.unit,
          updatedAt: initiativeSuccessMetrics.updatedAt,
          lastUpdateBy: initiativeSuccessMetrics.lastUpdateBy,
          updaterEmail: users.email,
          updaterFirstName: users.firstName,
          updaterLastName: users.lastName,
          updaterRole: users.role
        })
        .from(initiativeSuccessMetrics)
        .leftJoin(users, eq(users.id, initiativeSuccessMetrics.lastUpdateBy))
        .where(eq(initiativeSuccessMetrics.initiativeId, initiativeId))
        .orderBy(desc(initiativeSuccessMetrics.updatedAt));

      // Add success metrics updates to history
      for (const metric of successMetricsData) {
        if (metric.updatedAt && metric.lastUpdateBy && metric.updater) {
          const formattedAchievement = metric.unit === 'currency' 
            ? `Rp ${Number(metric.achievement || 0).toLocaleString()}`
            : metric.unit === 'percentage' 
            ? `${metric.achievement || 0}%`
            : `${metric.achievement || 0}`;
          
          const formattedTarget = metric.unit === 'currency' 
            ? `Rp ${Number(metric.target || 0).toLocaleString()}`
            : metric.unit === 'percentage' 
            ? `${metric.target || 0}%`
            : `${metric.target || 0}`;

          history.push({
            id: `${metric.id}-updated-${metric.updatedAt}`,
            action: 'metric_updated',
            description: `Metrik "${metric.name}" diupdate: ${formattedAchievement} dari target ${formattedTarget}`,
            timestamp: metric.updatedAt,
            user: {
              id: metric.updater.id,
              email: metric.updater.email,
              firstName: metric.updater.firstName,
              lastName: metric.updater.lastName,
              role: metric.updater.role
            }
          });
        }
      }

      // Sort by timestamp descending (newest first)
      history.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });

      return history;
    } catch (error) {
      console.error("Error fetching initiative history:", error);
      return [];
    }
  }
}

// Use database storage
export const storage = new DatabaseStorage();