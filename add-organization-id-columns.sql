-- Add organizationId column to transactional tables for multi-tenant security
-- This migration adds organizationId field to all transactional tables that were missing it

-- Add organizationId to templates table
ALTER TABLE templates ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- Add organizationId to checkIns table
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to userPermissions table
ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Make organizationId required in roleTemplates table
ALTER TABLE role_templates ALTER COLUMN organization_id SET NOT NULL;

-- Add organizationId to userActivityLog table
ALTER TABLE user_activity_log ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to userOnboardingProgress table
ALTER TABLE user_onboarding_progress ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to teamMembers table
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to initiativeMembers table
ALTER TABLE initiative_members ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to initiativeDocuments table
ALTER TABLE initiative_documents ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to initiativeSuccessMetrics table
ALTER TABLE initiative_success_metrics ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to successMetricUpdates table
ALTER TABLE success_metric_updates ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to initiativeNotes table
ALTER TABLE initiative_notes ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to initiativeComments table
ALTER TABLE initiative_comments ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to taskComments table
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to taskAuditTrail table
ALTER TABLE task_audit_trail ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to userAchievements table
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to userStats table
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Add organizationId to activityLogs table
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id);

-- Update existing data with organizationId from related tables
-- For checkIns - get organizationId from keyResults
UPDATE check_ins 
SET organization_id = (
    SELECT kr.organization_id 
    FROM key_results kr 
    WHERE kr.id = check_ins.key_result_id
)
WHERE organization_id IS NULL;

-- For userPermissions - get organizationId from user's organization
UPDATE user_permissions 
SET organization_id = (
    SELECT u.organization_id 
    FROM users u 
    WHERE u.id = user_permissions.user_id
)
WHERE organization_id IS NULL;

-- For userActivityLog - get organizationId from user's organization
UPDATE user_activity_log 
SET organization_id = (
    SELECT u.organization_id 
    FROM users u 
    WHERE u.id = user_activity_log.user_id
)
WHERE organization_id IS NULL;

-- For userOnboardingProgress - get organizationId from user's organization
UPDATE user_onboarding_progress 
SET organization_id = (
    SELECT u.organization_id 
    FROM users u 
    WHERE u.id = user_onboarding_progress.user_id
)
WHERE organization_id IS NULL;

-- For teamMembers - get organizationId from team's organization
UPDATE team_members 
SET organization_id = (
    SELECT t.organization_id 
    FROM teams t 
    WHERE t.id = team_members.team_id
)
WHERE organization_id IS NULL;

-- For initiativeMembers - get organizationId from initiative's organization
UPDATE initiative_members 
SET organization_id = (
    SELECT i.organization_id 
    FROM initiatives i 
    WHERE i.id = initiative_members.initiative_id
)
WHERE organization_id IS NULL;

-- For initiativeDocuments - get organizationId from initiative's organization
UPDATE initiative_documents 
SET organization_id = (
    SELECT i.organization_id 
    FROM initiatives i 
    WHERE i.id = initiative_documents.initiative_id
)
WHERE organization_id IS NULL;

-- For initiativeSuccessMetrics - get organizationId from initiative's organization
UPDATE initiative_success_metrics 
SET organization_id = (
    SELECT i.organization_id 
    FROM initiatives i 
    WHERE i.id = initiative_success_metrics.initiative_id
)
WHERE organization_id IS NULL;

-- For successMetricUpdates - get organizationId from metrics' organization
UPDATE success_metric_updates 
SET organization_id = (
    SELECT ism.organization_id 
    FROM initiative_success_metrics ism 
    WHERE ism.id = success_metric_updates.metric_id
)
WHERE organization_id IS NULL;

-- For initiativeNotes - get organizationId from initiative's organization
UPDATE initiative_notes 
SET organization_id = (
    SELECT i.organization_id 
    FROM initiatives i 
    WHERE i.id = initiative_notes.initiative_id
)
WHERE organization_id IS NULL;

-- For initiativeComments - get organizationId from initiative's organization
UPDATE initiative_comments 
SET organization_id = (
    SELECT i.organization_id 
    FROM initiatives i 
    WHERE i.id = initiative_comments.initiative_id
)
WHERE organization_id IS NULL;

-- For taskComments - get organizationId from task's organization
UPDATE task_comments 
SET organization_id = (
    SELECT t.organization_id 
    FROM tasks t 
    WHERE t.id = task_comments.task_id
)
WHERE organization_id IS NULL;

-- For taskAuditTrail - get organizationId from task's organization
UPDATE task_audit_trail 
SET organization_id = (
    SELECT t.organization_id 
    FROM tasks t 
    WHERE t.id = task_audit_trail.task_id
)
WHERE organization_id IS NULL;

-- For userAchievements - get organizationId from user's organization
UPDATE user_achievements 
SET organization_id = (
    SELECT u.organization_id 
    FROM users u 
    WHERE u.id = user_achievements.user_id
)
WHERE organization_id IS NULL;

-- For userStats - get organizationId from user's organization
UPDATE user_stats 
SET organization_id = (
    SELECT u.organization_id 
    FROM users u 
    WHERE u.id = user_stats.user_id
)
WHERE organization_id IS NULL;

-- For activityLogs - get organizationId from user's organization
UPDATE activity_logs 
SET organization_id = (
    SELECT u.organization_id 
    FROM users u 
    WHERE u.id = activity_logs.user_id
)
WHERE organization_id IS NULL;

-- For templates - get organizationId from user's organization who created it
UPDATE templates 
SET organization_id = (
    SELECT u.organization_id 
    FROM users u 
    WHERE u.id = templates.last_update_by
)
WHERE organization_id IS NULL;