import { pgTable, text, serial, integer, decimal, timestamp, boolean, varchar, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const cycles = pgTable("cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // e.g., "January 2025", "Q1 2025", "Annual 2025"
  type: text("type").notNull(), // "monthly", "quarterly", "annual"
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status").notNull().default("planning"), // "planning", "active", "completed"
  description: text("description"),
});

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "monthly", "quarterly", "annual"
  isDefault: boolean("is_default").default(false),
  objectives: text("objectives").notNull(), // JSON string of objective templates
});

export const objectives = pgTable("objectives", {
  id: uuid("id").primaryKey().defaultRandom(),
  cycleId: uuid("cycle_id").references(() => cycles.id),
  title: text("title").notNull(),
  description: text("description"),
  owner: text("owner").notNull(), // kept for backward compatibility
  ownerType: text("owner_type").notNull().default("user"), // "user" or "team"
  ownerId: uuid("owner_id").notNull(), // user ID or team ID
  status: text("status").notNull().default("not_started"), // "not_started", "on_track", "at_risk", "behind", "paused", "canceled", "completed", "partially_achieved", "not_achieved"
  teamId: uuid("team_id").references(() => teams.id), // for team OKRs
  parentId: uuid("parent_id"), // self-reference for parent-child hierarchy
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with email/password authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  role: text("role").notNull().default("member"), // "admin", "manager", "member"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: uuid("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team members junction table
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull(),
  userId: uuid("user_id").notNull(),
  role: text("role").notNull().default("member"), // "admin", "member"
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const keyResults = pgTable("key_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  objectiveId: uuid("objective_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }).notNull().default("0"),
  targetValue: decimal("target_value", { precision: 15, scale: 2 }).notNull(),
  baseValue: decimal("base_value", { precision: 15, scale: 2 }), // Starting point for calculations
  unit: text("unit").notNull().default("number"), // "number", "percentage", "currency"
  keyResultType: text("key_result_type").notNull().default("increase_to"), // "increase_to", "decrease_to", "achieve_or_not"
  status: text("status").notNull().default("on_track"), // "on_track", "at_risk", "behind", "completed"
  dueDate: timestamp("due_date"), // Target completion date
  lastUpdated: timestamp("last_updated").defaultNow(),
  confidence: integer("confidence").default(5), // 1-10 scale for confidence level
  timeProgressPercentage: integer("time_progress_percentage").default(0), // Ideal progress based on timeline
});

// Check-ins for tracking progress updates
export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyResultId: uuid("key_result_id").references(() => keyResults.id).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  confidence: integer("confidence").notNull().default(5), // 1-10 scale
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // user ID
});

// Initiatives/Projects linked to key results
export const initiatives = pgTable("initiatives", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyResultId: uuid("key_result_id").references(() => keyResults.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("not_started"), // "not_started", "in_progress", "completed", "on_hold", "cancelled"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "critical"
  picId: uuid("pic_id").references(() => users.id), // Person in Charge
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  budget: decimal("budget", { precision: 15, scale: 2 }), // Project budget
  progressPercentage: integer("progress_percentage").default(0), // 0-100%
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // user ID
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project team members
export const initiativeMembers = pgTable("initiative_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiativeId: uuid("initiative_id").references(() => initiatives.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("member"), // "member", "lead", "reviewer"
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Project documents
export const initiativeDocuments = pgTable("initiative_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiativeId: uuid("initiative_id").references(() => initiatives.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"), // URL to document file
  fileName: text("file_name"),
  fileSize: integer("file_size"), // in bytes
  fileType: text("file_type"), // "pdf", "doc", "xls", "ppt", etc.
  category: text("category").notNull().default("general"), // "requirement", "design", "technical", "report", "general"
  uploadedBy: uuid("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Tasks linked to initiatives
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiativeId: uuid("initiative_id").references(() => initiatives.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // "pending", "in_progress", "completed", "cancelled"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high"
  assignedTo: uuid("assigned_to"), // user ID
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").notNull(), // user ID
});

export const insertCycleSchema = createInsertSchema(cycles).omit({
  id: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
});

export const insertObjectiveSchema = createInsertSchema(objectives).omit({
  id: true,
});

export const insertKeyResultSchema = createInsertSchema(keyResults).omit({
  id: true,
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  createdAt: true,
});

export const insertInitiativeSchema = createInsertSchema(initiatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInitiativeMemberSchema = createInsertSchema(initiativeMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertInitiativeDocumentSchema = createInsertSchema(initiativeDocuments).omit({
  id: true,
  uploadedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Gamification Tables
export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "progress", "streak", "milestone", "collaboration"
  badgeIcon: text("badge_icon").notNull(), // icon name for the badge
  badgeColor: text("badge_color").notNull(), // color scheme for the badge
  points: integer("points").notNull().default(0),
  condition: jsonb("condition").notNull(), // JSON defining achievement conditions
  isActive: boolean("is_active").notNull().default(true),
  rarity: text("rarity").notNull().default("common"), // "common", "rare", "epic", "legendary"
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  achievementId: uuid("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: integer("progress").notNull().default(0), // current progress towards achievement
  isCompleted: boolean("is_completed").notNull().default(false),
});

export const userStats = pgTable("user_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id).unique(),
  totalPoints: integer("total_points").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0), // days of consecutive activity
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: text("last_activity_date"),
  objectivesCompleted: integer("objectives_completed").notNull().default(0),
  keyResultsCompleted: integer("key_results_completed").notNull().default(0),
  checkInsCreated: integer("check_ins_created").notNull().default(0),
  initiativesCreated: integer("initiatives_created").notNull().default(0),
  collaborationScore: integer("collaboration_score").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const levelRewards = pgTable("level_rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  level: integer("level").notNull().unique(),
  title: text("title").notNull(), // "Goal Setter", "Progress Tracker", etc.
  description: text("description").notNull(),
  badgeIcon: text("badge_icon").notNull(),
  badgeColor: text("badge_color").notNull(),
  pointsRequired: integer("points_required").notNull(),
  unlockMessage: text("unlock_message").notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // "check_in_created", "objective_completed", etc.
  entityType: text("entity_type").notNull(), // "objective", "key_result", "initiative"
  entityId: uuid("entity_id").notNull(),
  pointsEarned: integer("points_earned").notNull().default(0),
  metadata: jsonb("metadata"), // additional context about the action
  createdAt: timestamp("created_at").defaultNow(),
});

export const updateKeyResultProgressSchema = z.object({
  id: z.string(),
  currentValue: z.number(),
  status: z.enum(["on_track", "at_risk", "completed", "in_progress"]).optional(),
});

export const createOKRFromTemplateSchema = z.object({
  cycleId: z.string(),
  templateId: z.string(),
});

// Gamification Insert Schemas
export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  updatedAt: true,
});

export const insertLevelRewardSchema = createInsertSchema(levelRewards).omit({
  id: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertCycle = z.infer<typeof insertCycleSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertObjective = z.infer<typeof insertObjectiveSchema>;
export type InsertKeyResult = z.infer<typeof insertKeyResultSchema>;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type InsertInitiative = z.infer<typeof insertInitiativeSchema>;
export type InsertInitiativeMember = z.infer<typeof insertInitiativeMemberSchema>;
export type InsertInitiativeDocument = z.infer<typeof insertInitiativeDocumentSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateKeyResultProgress = z.infer<typeof updateKeyResultProgressSchema>;
export type CreateOKRFromTemplate = z.infer<typeof createOKRFromTemplateSchema>;

// Gamification Types
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type InsertLevelReward = z.infer<typeof insertLevelRewardSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Primary type definitions - single source of truth
export type Cycle = typeof cycles.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Objective = typeof objectives.$inferSelect;
export type KeyResult = typeof keyResults.$inferSelect;
export type CheckIn = typeof checkIns.$inferSelect;
export type Initiative = typeof initiatives.$inferSelect;
export type InitiativeMember = typeof initiativeMembers.$inferSelect;
export type InitiativeDocument = typeof initiativeDocuments.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;

// Gamification Primary Types
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
export type LevelReward = typeof levelRewards.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedTeams: many(teams),
  teamMemberships: many(teamMembers),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const keyResultsRelations = relations(keyResults, ({ one, many }) => ({
  objective: one(objectives, {
    fields: [keyResults.objectiveId],
    references: [objectives.id],
  }),
  checkIns: many(checkIns),
  initiatives: many(initiatives),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  keyResult: one(keyResults, {
    fields: [checkIns.keyResultId],
    references: [keyResults.id],
  }),
  creator: one(users, {
    fields: [checkIns.createdBy],
    references: [users.id],
  }),
}));

export const initiativesRelations = relations(initiatives, ({ one, many }) => ({
  keyResult: one(keyResults, {
    fields: [initiatives.keyResultId],
    references: [keyResults.id],
  }),
  creator: one(users, {
    fields: [initiatives.createdBy],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  initiative: one(initiatives, {
    fields: [tasks.initiativeId],
    references: [initiatives.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
}));

// Gamification Relations
export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  firstName: z.string().min(1, "Nama depan harus diisi"),
  lastName: z.string().optional(),
});

// Insert schemas for new tables
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

// Additional types for compatibility
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = InsertUser & { id?: string };
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export type KeyResultWithDetails = KeyResult & {
  checkIns: CheckIn[];
  initiatives: Initiative[];
  progressHistory: { date: string; value: number; notes?: string }[];
};

export type KeyResultWithLastCheckIn = KeyResult & {
  lastCheckIn?: CheckIn | null;
};

export type OKRWithKeyResults = Objective & {
  keyResults: KeyResultWithLastCheckIn[];
  overallProgress: number;
};

export type CycleWithOKRs = Cycle & {
  objectives: OKRWithKeyResults[];
  totalObjectives: number;
  completedObjectives: number;
  avgProgress: number;
};
