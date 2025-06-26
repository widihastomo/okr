import { 
  cycles, templates, objectives, keyResults, 
  type Cycle, type Template, type Objective, type KeyResult, 
  type InsertCycle, type InsertTemplate, type InsertObjective, type InsertKeyResult, 
  type OKRWithKeyResults, type CycleWithOKRs, type UpdateKeyResultProgress, type CreateOKRFromTemplate 
} from "@shared/schema";

export interface IStorage {
  // Cycles
  getCycles(): Promise<Cycle[]>;
  getCycle(id: number): Promise<Cycle | undefined>;
  createCycle(cycle: InsertCycle): Promise<Cycle>;
  updateCycle(id: number, cycle: Partial<InsertCycle>): Promise<Cycle | undefined>;
  deleteCycle(id: number): Promise<boolean>;
  getCycleWithOKRs(id: number): Promise<CycleWithOKRs | undefined>;
  
  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  createOKRFromTemplate(data: CreateOKRFromTemplate): Promise<OKRWithKeyResults[]>;
  
  // Objectives
  getObjectives(): Promise<Objective[]>;
  getObjective(id: number): Promise<Objective | undefined>;
  createObjective(objective: InsertObjective): Promise<Objective>;
  updateObjective(id: number, objective: Partial<InsertObjective>): Promise<Objective | undefined>;
  deleteObjective(id: number): Promise<boolean>;
  getObjectivesByCycleId(cycleId: number): Promise<Objective[]>;
  
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
  private cycles: Map<number, Cycle>;
  private templates: Map<number, Template>;
  private objectives: Map<number, Objective>;
  private keyResults: Map<number, KeyResult>;
  private currentCycleId: number;
  private currentTemplateId: number;
  private currentObjectiveId: number;
  private currentKeyResultId: number;

  constructor() {
    this.cycles = new Map();
    this.templates = new Map();
    this.objectives = new Map();
    this.keyResults = new Map();
    this.currentCycleId = 4;
    this.currentTemplateId = 1;
    this.currentObjectiveId = 1;
    this.currentKeyResultId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample Cycles
    const cycle1: Cycle = {
      id: 1,
      name: "January 2025",
      type: "monthly",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      status: "active",
      description: "January monthly objectives for 2025"
    };
    
    const cycle2: Cycle = {
      id: 2,
      name: "Q1 2025",
      type: "quarterly",
      startDate: "2025-01-01",
      endDate: "2025-03-31",
      status: "planning",
      description: "First quarter of 2025 focused on growth and engagement"
    };
    
    const cycle3: Cycle = {
      id: 3,
      name: "Annual 2025",
      type: "annual",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "planning",
      description: "Annual strategic objectives for 2025"
    };
    
    this.cycles.set(1, cycle1);
    this.cycles.set(2, cycle2);
    this.cycles.set(3, cycle3);
    
    // Sample Templates
    const template1: Template = {
      id: 1,
      name: "Product Growth Template",
      description: "Standard template for product growth objectives",
      type: "quarterly",
      isDefault: true,
      objectives: JSON.stringify([
        {
          title: "Increase Product Adoption",
          description: "Drive user acquisition and engagement",
          owner: "Product Team",
          keyResults: [
            {
              title: "Increase monthly active users",
              description: "Focus on user acquisition",
              unit: "number",
              keyResultType: "increase_to"
            },
            {
              title: "Improve app store rating",
              description: "Enhance user satisfaction",
              unit: "number",
              keyResultType: "increase_to"
            }
          ]
        }
      ])
    };
    
    this.templates.set(1, template1);
    
    // Sample Objective 1
    const obj1: Objective = {
      id: 1,
      cycleId: 1,
      title: "Increase Product Adoption and User Engagement",
      description: "Drive user acquisition and improve engagement metrics to establish stronger market presence",
      timeframe: "Q1 2025",
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
      baseValue: null,
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
      baseValue: null,
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
      baseValue: "8.5",
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
      cycleId: 1,
      title: "Strengthen Team Performance and Culture",
      description: "Build a high-performing team culture with improved collaboration and skill development",
      timeframe: "Q1 2025",
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
      baseValue: null,
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
      baseValue: null,
      unit: "number",
      keyResultType: "achieve_or_not",
      status: "in_progress"
    };

    this.keyResults.set(4, kr4);
    this.keyResults.set(5, kr5);

    this.currentCycleId = 3;
    this.currentTemplateId = 2;
    this.currentObjectiveId = 3;
    this.currentKeyResultId = 6;
  }

  private calculateProgress(current: string, target: string, keyResultType: string, baseValue?: string | null): number {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    
    switch (keyResultType) {
      case "increase_to":
        // Progress = (current / target) * 100, capped at 100%
        if (targetNum === 0) return 0;
        return Math.min(100, Math.max(0, (currentNum / targetNum) * 100));
        
      case "decrease_to":
        // Progress = ((Base Value - Current) / (Base Value - Target)) * 100%
        const baseNum = baseValue && baseValue !== null ? parseFloat(baseValue) : targetNum * 2; // Default base value if not provided
        if (baseNum <= targetNum) return currentNum <= targetNum ? 100 : 0; // Invalid base value case
        const decreaseProgress = ((baseNum - currentNum) / (baseNum - targetNum)) * 100;
        return Math.min(100, Math.max(0, decreaseProgress));
        
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
      sum + this.calculateProgress(kr.currentValue, kr.targetValue, kr.keyResultType, kr.baseValue), 0);
    return Math.round(totalProgress / keyResults.length);
  }

  // Cycles
  async getCycles(): Promise<Cycle[]> {
    return Array.from(this.cycles.values());
  }

  async getCycle(id: number): Promise<Cycle | undefined> {
    return this.cycles.get(id);
  }

  async createCycle(insertCycle: InsertCycle): Promise<Cycle> {
    const id = this.currentCycleId++;
    const cycle: Cycle = { 
      ...insertCycle, 
      id,
      description: insertCycle.description || null,
      status: insertCycle.status || "planning"
    };
    this.cycles.set(id, cycle);
    return cycle;
  }

  async updateCycle(id: number, updateData: Partial<InsertCycle>): Promise<Cycle | undefined> {
    const existing = this.cycles.get(id);
    if (!existing) return undefined;
    
    const updated: Cycle = { 
      ...existing, 
      ...updateData,
      description: updateData.description !== undefined ? updateData.description : existing.description,
      status: updateData.status || existing.status
    };
    this.cycles.set(id, updated);
    return updated;
  }

  async deleteCycle(id: number): Promise<boolean> {
    // Also delete associated objectives and key results
    const objectives = Array.from(this.objectives.values()).filter(obj => obj.cycleId === id);
    for (const obj of objectives) {
      await this.deleteObjective(obj.id);
    }
    return this.cycles.delete(id);
  }

  async getCycleWithOKRs(id: number): Promise<CycleWithOKRs | undefined> {
    const cycle = this.cycles.get(id);
    if (!cycle) return undefined;

    const objectives = await this.getObjectivesByCycleId(id);
    const okrsWithKeyResults: OKRWithKeyResults[] = [];

    for (const obj of objectives) {
      const keyResults = await this.getKeyResultsByObjectiveId(obj.id);
      const overallProgress = this.calculateOverallProgress(keyResults);
      okrsWithKeyResults.push({
        ...obj,
        keyResults,
        overallProgress
      });
    }

    const totalObjectives = objectives.length;
    const completedObjectives = objectives.filter(obj => obj.status === "completed").length;
    const avgProgress = okrsWithKeyResults.length > 0 
      ? Math.round(okrsWithKeyResults.reduce((sum, okr) => sum + okr.overallProgress, 0) / okrsWithKeyResults.length)
      : 0;

    return {
      ...cycle,
      objectives: okrsWithKeyResults,
      totalObjectives,
      completedObjectives,
      avgProgress
    };
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.currentTemplateId++;
    const template: Template = { 
      ...insertTemplate, 
      id,
      description: insertTemplate.description || null,
      isDefault: insertTemplate.isDefault || false
    };
    this.templates.set(id, template);
    return template;
  }

  async updateTemplate(id: number, updateData: Partial<InsertTemplate>): Promise<Template | undefined> {
    const existing = this.templates.get(id);
    if (!existing) return undefined;
    
    const updated: Template = { 
      ...existing, 
      ...updateData,
      description: updateData.description !== undefined ? updateData.description : existing.description,
      isDefault: updateData.isDefault !== undefined ? updateData.isDefault : existing.isDefault
    };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }

  async createOKRFromTemplate(data: CreateOKRFromTemplate): Promise<OKRWithKeyResults[]> {
    const template = this.templates.get(data.templateId);
    const cycle = this.cycles.get(data.cycleId);
    
    if (!template || !cycle) {
      throw new Error("Template or cycle not found");
    }

    const templateObjectives = JSON.parse(template.objectives);
    const createdOKRs: OKRWithKeyResults[] = [];

    for (const templateObj of templateObjectives) {
      // Create objective
      const objective = await this.createObjective({
        cycleId: data.cycleId,
        title: templateObj.title,
        description: templateObj.description,
        timeframe: cycle.name,
        owner: templateObj.owner,
        status: "in_progress"
      });

      // Create key results
      const keyResults: KeyResult[] = [];
      for (const templateKr of templateObj.keyResults) {
        const keyResult = await this.createKeyResult({
          objectiveId: objective.id,
          title: templateKr.title,
          description: templateKr.description,
          currentValue: "0",
          targetValue: "0", // To be set by user
          baseValue: null,
          unit: templateKr.unit,
          keyResultType: templateKr.keyResultType,
          status: "in_progress"
        });
        keyResults.push(keyResult);
      }

      const overallProgress = this.calculateOverallProgress(keyResults);
      createdOKRs.push({
        ...objective,
        keyResults,
        overallProgress
      });
    }

    return createdOKRs;
  }

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
    const id = this.currentObjectiveId++;
    const objective: Objective = { 
      ...insertObjective, 
      id,
      description: insertObjective.description || null,
      status: insertObjective.status || "in_progress",
      cycleId: insertObjective.cycleId || null
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
      keyResultType: insertKeyResult.keyResultType || "increase_to",
      baseValue: insertKeyResult.baseValue || null
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
