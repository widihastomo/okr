import { db } from "./db";
import { objectives } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

async function fixTeamOKRs() {
  try {
    console.log("Fixing team-owned OKRs...");
    
    // Get all objectives where ownerType is 'team' but teamId is null
    const teamObjectives = await db
      .select()
      .from(objectives)
      .where(
        and(
          eq(objectives.ownerType, 'team'),
          isNull(objectives.teamId)
        )
      );
    
    console.log(`Found ${teamObjectives.length} team objectives with missing teamId`);
    
    // Update each objective to set teamId = ownerId
    for (const objective of teamObjectives) {
      await db
        .update(objectives)
        .set({ teamId: objective.ownerId })
        .where(eq(objectives.id, objective.id));
      
      console.log(`Updated objective ${objective.id}: set teamId to ${objective.ownerId}`);
    }
    
    console.log("Team OKRs fixed successfully!");
  } catch (error) {
    console.error("Error fixing team OKRs:", error);
  } finally {
    process.exit();
  }
}

fixTeamOKRs();