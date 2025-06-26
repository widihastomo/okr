import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const objectives = pgTable("objectives", {
  id: serial("id").primaryKey(),
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
  unit: text("unit").notNull().default("number"), // "number", "percentage", "currency"
  keyResultType: text("key_result_type").notNull().default("increase_to"), // "increase_to", "decrease_to", "achieve_or_not"
  status: text("status").notNull().default("in_progress"), // "on_track", "at_risk", "completed", "in_progress"
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

export type InsertObjective = z.infer<typeof insertObjectiveSchema>;
export type InsertKeyResult = z.infer<typeof insertKeyResultSchema>;
export type UpdateKeyResultProgress = z.infer<typeof updateKeyResultProgressSchema>;
export type Objective = typeof objectives.$inferSelect;
export type KeyResult = typeof keyResults.$inferSelect;

export type OKRWithKeyResults = Objective & {
  keyResults: KeyResult[];
  overallProgress: number;
};
