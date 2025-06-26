import { objectives, keyResults, type Objective, type KeyResult, type InsertObjective, type InsertKeyResult, type OKRWithKeyResults, type UpdateKeyResultProgress } from "@shared/schema";

export interface IStorage {
  // Objectives
  getObjectives(): Promise<Objective[]>;
  getObjective(id: number): Promise<Objective | undefined>;
  createObjective(objective: InsertObjective): Promise<Objective>;
  updateObjective(id: number, objective: Partial<InsertObjective>): Promise<Objective | undefined>;
  deleteObjective(id: number): Promise<boolean>;
  
  // Key Results
  getKeyResults(): Promise<KeyResult[]>;
  getKeyResultsByObjectiveId(objectiveId: number): Promise<KeyResult[]>;
  getKeyResult(id: number): Promise<KeyResult | undefined>;
  createKeyResult(keyResult: InsertKeyResult): Promise<KeyResult>;
  updateKeyResult(id: number, keyResult: Partial<InsertKeyResult>): Promise<KeyResult | undefined>;
  updateKeyResultProgress(update: UpdateKeyResultProgress): Promise<KeyResult | undefined>;
  deleteKeyResult(id: number): Promise<boolean>;
  
  // Combined
  getOKRsWithKeyResults(): Promise<OKRWithKeyResults[]>;
  getOKRWithKeyResults(id: number): Promise<OKRWithKeyResults | undefined>;
}

export class MemStorage implements IStorage {
  private objectives: Map<number, Objective>;
  private keyResults: Map<number, KeyResult>;
  private currentObjectiveId: number;
  private currentKeyResultId: number;

  constructor() {
    this.objectives = new Map();
    this.keyResults = new Map();
    this.currentObjectiveId = 1;
    this.currentKeyResultId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample Objective 1
    const obj1: Objective = {
      id: 1,
      title: "Increase Product Adoption and User Engagement",
      description: "Drive user acquisition and improve engagement metrics to establish stronger market presence",
      timeframe: "Q4 2024",
      owner: "John Doe",
      status: "on_track"
    };
    this.objectives.set(1, obj1);

    // Sample Key Results for Objective 1
    const kr1: KeyResult = {
      id: 1,
      objectiveId: 1,
      title: "Increase monthly active users to 50,000",
      description: "Current: 39,200 users | Target: 50,000 users",
      currentValue: "39200",
      targetValue: "50000",
      unit: "number",
      keyResultType: "increase_to",
      status: "on_track"
    };
    
    const kr2: KeyResult = {
      id: 2,
      objectiveId: 1,
      title: "Achieve 4.5+ app store rating",
      description: "Current: 4.2 rating | Target: 4.5 rating",
      currentValue: "4.2",
      targetValue: "4.5",
      unit: "number",
      keyResultType: "increase_to",
      status: "at_risk"
    };
    
    const kr3: KeyResult = {
      id: 3,
      objectiveId: 1,
      title: "Reduce customer churn rate to under 5%",
      description: "Current: 3.2% | Target: <5%",
      currentValue: "3.2",
      targetValue: "5",
      unit: "percentage",
      keyResultType: "decrease_to",
      status: "completed"
    };

    this.keyResults.set(1, kr1);
    this.keyResults.set(2, kr2);
    this.keyResults.set(3, kr3);

    // Sample Objective 2
    const obj2: Objective = {
      id: 2,
      title: "Strengthen Team Performance and Culture",
      description: "Build a high-performing team culture with improved collaboration and skill development",
      timeframe: "Q4 2024",
      owner: "Sarah Johnson",
      status: "at_risk"
    };
    this.objectives.set(2, obj2);

    // Sample Key Results for Objective 2
    const kr4: KeyResult = {
      id: 4,
      objectiveId: 2,
      title: "Achieve 90% employee satisfaction score",
      description: "Current: 78% | Target: 90%",
      currentValue: "78",
      targetValue: "90",
      unit: "percentage",
      keyResultType: "increase_to",
      status: "at_risk"
    };
    
    const kr5: KeyResult = {
      id: 5,
      objectiveId: 2,
      title: "Complete skills development for 100% of team",
      description: "Current: 6/12 members | Target: 12/12 members",
      currentValue: "6",
      targetValue: "12",
      unit: "number",
      keyResultType: "achieve_or_not",
      status: "in_progress"
    };

    this.keyResults.set(4, kr4);
    this.keyResults.set(5, kr5);

    this.currentObjectiveId = 3;
    this.currentKeyResultId = 6;
  }

  private calculateProgress(current: string, target: string, keyResultType: string): number {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    
    switch (keyResultType) {
      case "increase_to":
        // Progress = (current / target) * 100, capped at 100%
        if (targetNum === 0) return 0;
        return Math.min(100, Math.max(0, (currentNum / targetNum) * 100));
        
      case "decrease_to":
        // Progress = 100% when current <= target, decreasing as current exceeds target
        if (currentNum <= targetNum) return 100;
        // Calculate how much we've exceeded the target and reduce progress
        const excessRatio = (currentNum - targetNum) / targetNum;
        return Math.max(0, 100 - (excessRatio * 100));
        
      case "achieve_or_not":
        // Binary: 100% if current >= target, 0% otherwise
        return currentNum >= targetNum ? 100 : 0;
        
      default:
        return 0;
    }
  }

  private calculateOverallProgress(keyResults: KeyResult[]): number {
    if (keyResults.length === 0) return 0;
    const totalProgress = keyResults.reduce((sum, kr) => 
      sum + this.calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType), 0);
    return Math.round(totalProgress / keyResults.length);
  }

  async getObjectives(): Promise<Objective[]> {
    return Array.from(this.objectives.values());
  }

  async getObjective(id: number): Promise<Objective | undefined> {
    return this.objectives.get(id);
  }

  async createObjective(insertObjective: InsertObjective): Promise<Objective> {
    const id = this.currentObjectiveId++;
    const objective: Objective = { 
      ...insertObjective, 
      id,
      description: insertObjective.description || null,
      status: insertObjective.status || "in_progress"
    };
    this.objectives.set(id, objective);
    return objective;
  }

  async updateObjective(id: number, updateData: Partial<InsertObjective>): Promise<Objective | undefined> {
    const existing = this.objectives.get(id);
    if (!existing) return undefined;
    
    const updated: Objective = { 
      ...existing, 
      ...updateData,
      description: updateData.description !== undefined ? updateData.description : existing.description,
      status: updateData.status || existing.status
    };
    this.objectives.set(id, updated);
    return updated;
  }

  async deleteObjective(id: number): Promise<boolean> {
    // Also delete associated key results
    const keyResults = await this.getKeyResultsByObjectiveId(id);
    keyResults.forEach(kr => this.keyResults.delete(kr.id));
    
    return this.objectives.delete(id);
  }

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
    const id = this.currentKeyResultId++;
    const keyResult: KeyResult = { 
      ...insertKeyResult, 
      id,
      description: insertKeyResult.description || null,
      status: insertKeyResult.status || "in_progress",
      currentValue: insertKeyResult.currentValue || "0",
      unit: insertKeyResult.unit || "number",
      keyResultType: insertKeyResult.keyResultType || "increase_to"
    };
    this.keyResults.set(id, keyResult);
    return keyResult;
  }

  async updateKeyResult(id: number, updateData: Partial<InsertKeyResult>): Promise<KeyResult | undefined> {
    const existing = this.keyResults.get(id);
    if (!existing) return undefined;
    
    const updated: KeyResult = { 
      ...existing, 
      ...updateData,
      description: updateData.description !== undefined ? updateData.description : existing.description,
      status: updateData.status || existing.status,
      currentValue: updateData.currentValue || existing.currentValue,
      unit: updateData.unit || existing.unit,
      keyResultType: updateData.keyResultType || existing.keyResultType
    };
    this.keyResults.set(id, updated);
    return updated;
  }

  async updateKeyResultProgress(update: UpdateKeyResultProgress): Promise<KeyResult | undefined> {
    const existing = this.keyResults.get(update.id);
    if (!existing) return undefined;
    
    const updated: KeyResult = { 
      ...existing, 
      currentValue: update.currentValue.toString(),
      ...(update.status && { status: update.status })
    };
    this.keyResults.set(update.id, updated);
    return updated;
  }

  async deleteKeyResult(id: number): Promise<boolean> {
    return this.keyResults.delete(id);
  }

  async getOKRsWithKeyResults(): Promise<OKRWithKeyResults[]> {
    const objectives = await this.getObjectives();
    const result: OKRWithKeyResults[] = [];
    
    for (const objective of objectives) {
      const keyResults = await this.getKeyResultsByObjectiveId(objective.id);
      const overallProgress = this.calculateOverallProgress(keyResults);
      result.push({ ...objective, keyResults, overallProgress });
    }
    
    return result;
  }

  async getOKRWithKeyResults(id: number): Promise<OKRWithKeyResults | undefined> {
    const objective = await this.getObjective(id);
    if (!objective) return undefined;
    
    const keyResults = await this.getKeyResultsByObjectiveId(id);
    const overallProgress = this.calculateOverallProgress(keyResults);
    return { ...objective, keyResults, overallProgress };
  }
}

export const storage = new MemStorage();
