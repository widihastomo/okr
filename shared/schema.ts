import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
export type UpdateKeyResultProgress = z.infer<typeof updateKeyResultProgressSchema>;
export type CreateOKRFromTemplate = z.infer<typeof createOKRFromTemplateSchema>;

export type Cycle = typeof cycles.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type Objective = typeof objectives.$inferSelect;
export type KeyResult = typeof keyResults.$inferSelect;

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
