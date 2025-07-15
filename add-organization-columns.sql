-- Add organizationId columns to objectives, keyResults, initiatives, and tasks tables

-- Add organizationId to objectives table
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE objectives SET organization_id = (
  SELECT c.organization_id 
  FROM cycles c 
  WHERE c.id = objectives.cycle_id
) WHERE organization_id IS NULL;
ALTER TABLE objectives ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE objectives ADD CONSTRAINT fk_objectives_organization_id 
  FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Add organizationId to key_results table
ALTER TABLE key_results ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE key_results SET organization_id = (
  SELECT o.organization_id 
  FROM objectives o 
  WHERE o.id = key_results.objective_id
) WHERE organization_id IS NULL;
ALTER TABLE key_results ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE key_results ADD CONSTRAINT fk_key_results_organization_id 
  FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Add organizationId to initiatives table
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE initiatives SET organization_id = (
  SELECT kr.organization_id 
  FROM key_results kr 
  WHERE kr.id = initiatives.key_result_id
) WHERE organization_id IS NULL;
ALTER TABLE initiatives ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE initiatives ADD CONSTRAINT fk_initiatives_organization_id 
  FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Add organizationId to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE tasks SET organization_id = (
  SELECT i.organization_id 
  FROM initiatives i 
  WHERE i.id = tasks.initiative_id
) WHERE organization_id IS NULL AND initiative_id IS NOT NULL;

-- For standalone tasks without initiatives, set organization_id from the creator's organization
UPDATE tasks SET organization_id = (
  SELECT tm.organization_id 
  FROM team_members tm 
  WHERE tm.user_id = tasks.created_by
  LIMIT 1
) WHERE organization_id IS NULL;

ALTER TABLE tasks ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_organization_id 
  FOREIGN KEY (organization_id) REFERENCES organizations(id);