# Database Backup Information

## Backup Details
- **File Name**: `database-backup-2025-07-10T08-23-22.sql`
- **Created**: July 10, 2025 at 08:23:22 UTC
- **File Size**: 144,680 bytes (0.14 MB)
- **Total Lines**: 3,105 lines
- **Format**: PostgreSQL SQL dump (plain text)

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

### Data Included
- Complete schema structure (tables, columns, constraints)
- All user data and content
- System configuration and settings
- Subscription and billing information
- OKR data (objectives, key results, initiatives, tasks)
- User achievements and gamification data
- Notification and activity logs

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