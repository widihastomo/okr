import { pgTable, text, serial, integer, decimal, timestamp, boolean, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const cycles = pgTable("cycles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "January 2025", "Q1 2025", "Annual 2025"
  type: text("type").notNull(), // "monthly", "quarterly", "annual"
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status").notNull().default("planning"), // "planning", "active", "completed"
  description: text("description"),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "monthly", "quarterly", "annual"
  isDefault: boolean("is_default").default(false),
  objectives: text("objectives").notNull(), // JSON string of objective templates
});

export const objectives = pgTable("objectives", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").references(() => cycles.id),
  title: text("title").notNull(),
  description: text("description"),
  timeframe: text("timeframe").notNull(), // e.g., "Q4 2024"
  owner: text("owner").notNull(),
  status: text("status").notNull().default("in_progress"), // "on_track", "at_risk", "completed", "in_progress"
  level: text("level").notNull().default("individual"), // "company", "team", "individual"
  teamId: integer("team_id").references(() => teams.id), // for team-level OKRs
  parentId: integer("parent_id").references(() => objectives.id), // for linking to parent OKR
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

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default("member"), // "admin", "manager", "member"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team members junction table
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("member"), // "admin", "member"
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const keyResults = pgTable("key_results", {
  id: serial("id").primaryKey(),
  objectiveId: integer("objective_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }).notNull().default("0"),
  targetValue: decimal("target_value", { precision: 10, scale: 2 }).notNull(),
  baseValue: decimal("base_value", { precision: 10, scale: 2 }), // Starting point for calculations
  unit: text("unit").notNull().default("number"), // "number", "percentage", "currency"
  keyResultType: text("key_result_type").notNull().default("increase_to"), // "increase_to", "decrease_to", "achieve_or_not"
  status: text("status").notNull().default("in_progress"), // "on_track", "at_risk", "completed", "in_progress"
});

// Check-ins for tracking progress updates
export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  keyResultId: integer("key_result_id").references(() => keyResults.id).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  confidence: integer("confidence").notNull().default(5), // 1-10 scale
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").notNull(), // user ID
});

// Initiatives/Projects linked to key results
export const initiatives = pgTable("initiatives", {
  id: serial("id").primaryKey(),
  keyResultId: integer("key_result_id").references(() => keyResults.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("not_started"), // "not_started", "in_progress", "completed", "on_hold"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high"
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").notNull(), // user ID
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
});

export const updateKeyResultProgressSchema = z.object({
  id: z.number(),
  currentValue: z.number(),
  status: z.enum(["on_track", "at_risk", "completed", "in_progress"]).optional(),
});

export const createOKRFromTemplateSchema = z.object({
  cycleId: z.number(),
  templateId: z.number(),
});

export type InsertCycle = z.infer<typeof insertCycleSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertObjective = z.infer<typeof insertObjectiveSchema>;
export type InsertKeyResult = z.infer<typeof insertKeyResultSchema>;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type InsertInitiative = z.infer<typeof insertInitiativeSchema>;
export type UpdateKeyResultProgress = z.infer<typeof updateKeyResultProgressSchema>;
export type CreateOKRFromTemplate = z.infer<typeof createOKRFromTemplateSchema>;

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

export const initiativesRelations = relations(initiatives, ({ one }) => ({
  keyResult: one(keyResults, {
    fields: [initiatives.keyResultId],
    references: [keyResults.id],
  }),
  creator: one(users, {
    fields: [initiatives.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas for new tables
export const insertUserSchema = createInsertSchema(users).omit({
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

// Types
export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type Cycle = typeof cycles.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Objective = typeof objectives.$inferSelect;
export type KeyResult = typeof keyResults.$inferSelect;
export type CheckIn = typeof checkIns.$inferSelect;
export type Initiative = typeof initiatives.$inferSelect;

export type KeyResultWithDetails = KeyResult & {
  checkIns: CheckIn[];
  initiatives: Initiative[];
  progressHistory: { date: string; value: number; notes?: string }[];
};

export type OKRWithKeyResults = Objective & {
  keyResults: KeyResult[];
  overallProgress: number;
};

export type CycleWithOKRs = Cycle & {
  objectives: OKRWithKeyResults[];
  totalObjectives: number;
  completedObjectives: number;
  avgProgress: number;
};
