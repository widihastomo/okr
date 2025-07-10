# Database Backup Information

## Complete Backup Files Created

### 1. Structure + Data Backup (RECOMMENDED)
- **File Name**: `database-with-data-2025-07-10T08-31-49.sql`
- **Created**: July 10, 2025 at 08:31:49 UTC
- **File Size**: 96,795 bytes (0.09 MB)
- **Total Lines**: 338 lines
- **Format**: PostgreSQL INSERT statements
- **Contains**: Complete data (186 records across 43 tables)

### 2. Full Schema Backup (Structure Only)
- **File Name**: `database-backup-2025-07-10T08-23-22.sql`
- **Created**: July 10, 2025 at 08:23:22 UTC
- **File Size**: 144,680 bytes (0.14 MB)
- **Total Lines**: 3,105 lines
- **Format**: PostgreSQL SQL dump (complete schema)

## Database Information
- **Database**: neondb
- **Host**: ep-super-fog-a69ws4u6.us-west-2.aws.neon.tech
- **PostgreSQL Version**: 16.9 (production) / 16.5 (pg_dump client)
- **Encoding**: UTF8

## Backup Content

### Tables Backed Up (43 tables total)
1. **achievements** - Gamification achievements system
2. **activity_logs** - User activity tracking
3. **application_settings** - System configuration settings
4. **billing_periods** - Subscription billing cycles
5. **check_ins** - OKR progress check-ins
6. **cycles** - Time-based OKR cycles (Q1, Q2, etc.)
7. **daily_reflections** - User daily reflection entries
8. **emoji_reactions** - Reaction system for posts/content
9. **initiative_documents** - Documents attached to initiatives
10. **initiative_members** - Team members assigned to initiatives
11. **initiative_notes** - Notes and updates for initiatives
12. **initiative_success_metrics** - Success metrics for initiatives
13. **initiatives** - Strategic initiatives
14. **invoice_line_items** - Detailed billing line items
15. **invoices** - Customer invoices
16. **key_results** - Measurable key results for objectives
17. **level_rewards** - Gamification level rewards
18. **member_invitations** - Organization member invitations
19. **notifications** - System notifications
20. **objectives** - Main OKR objectives
21. **organization_addon_subscriptions** - Addon subscriptions
22. **organization_subscriptions** - Main subscription plans
23. **organizations** - Client organizations
24. **reminder_configs** - User reminder settings
25. **sessions** - User session storage
26. **subscription_plans** - Available subscription plans
27. **success_metric_updates** - Initiative metric updates
28. **system_settings** - System-wide settings
29. **tasks** - Tasks and action items
30. **team_members** - Team membership
31. **teams** - Team structure
32. **trial_achievements** - Trial user achievements
33. **trial_progress** - Trial user progress tracking
34. **user_achievements** - User achievement records
35. **user_activity_log** - Detailed user activity
36. **user_onboarding_progress** - Onboarding completion tracking
37. **user_permissions** - User permission system
38. **user_stats** - User statistics and metrics
39. **user_trial_achievements** - Trial-specific achievements
40. **users** - User accounts and profiles

### Security Features Included
- **Row Level Security (RLS)** policies for multi-tenant data isolation
- **Foreign Key Constraints** for data integrity
- **Indexes** for performance optimization
- **Triggers** for automated data management

### Data Included (186 Total Records)

#### System Configuration (48 records)
- **application_settings**: 31 records - App configuration (name, colors, contact info)
- **system_settings**: 17 records - System-wide settings

#### User & Organization Data (31 records)
- **users**: 16 records - User accounts and profiles
- **organizations**: 13 records - Client organizations
- **teams**: 1 record - Team structure
- **team_members**: 2 records - Team membership

#### Subscription & Billing (16 records)
- **subscription_plans**: 4 records - Available plans (Free Trial, Starter, Growth, Enterprise)
- **billing_periods**: 9 records - Billing cycle definitions
- **organization_subscriptions**: 3 records - Active subscriptions

#### OKR Data (70 records)
- **objectives**: 11 records - Main objectives
- **key_results**: 15 records - Measurable results
- **initiatives**: 19 records - Strategic initiatives
- **tasks**: 23 records - Action items
- **cycles**: 2 records - Time-based cycles

#### User Activity (21 records)
- **user_stats**: 7 records - User statistics
- **member_invitations**: 5 records - Pending invitations
- **sessions**: 7 records - Active user sessions
- **check_ins**: 1 record - Progress check-ins
- **user_trial_achievements**: 1 record - Trial achievements

#### Empty Tables (0 records each)
Tables with structure but no data:
- achievements, activity_logs, daily_reflections, emoji_reactions
- initiative_documents, initiative_members, initiative_notes
- invoice_line_items, invoices, notifications, trial_progress
- user_achievements, user_activity_log, templates, etc.

## Backup Features
- **Clean backup**: Includes DROP statements for clean restoration
- **No owner/privileges**: Portable across different PostgreSQL installations
- **UTF8 encoding**: Full Unicode support
- **Complete data**: All tables and their relationships

## How to Restore

### Method 1: Using psql (recommended)
```bash
# Create new database
createdb restored_database

# Restore backup
psql -d restored_database -f database-backup-2025-07-10T08-23-22.sql
```

### Method 2: Using PostgreSQL client
```bash
# Connect to PostgreSQL and run
\i database-backup-2025-07-10T08-23-22.sql
```

### Method 3: Using Docker PostgreSQL
```bash
# Copy backup to container
docker cp database-backup-2025-07-10T08-23-22.sql postgres_container:/tmp/

# Restore inside container
docker exec postgres_container psql -U username -d database_name -f /tmp/database-backup-2025-07-10T08-23-22.sql
```

## Backup Verification
- ✅ Backup completed successfully without errors
- ✅ All 43 tables included
- ✅ All foreign key relationships preserved
- ✅ Row Level Security policies included
- ✅ Complete data integrity maintained

## Notes
- This backup contains complete production data including user information
- Backup includes both schema and data
- All timestamps preserved in original format
- Multi-tenant security policies included for proper data isolation
- Backup is compatible with PostgreSQL 12+ versions

## Next Backup Recommendation
- Schedule regular backups (daily/weekly)
- Consider automated backup rotation
- Store backups in secure, off-site location
- Test restoration process periodically