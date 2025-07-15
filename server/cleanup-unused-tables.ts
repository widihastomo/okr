import { config } from 'dotenv';
import { db } from './db';
import { sql } from 'drizzle-orm';

// Load environment variables
config();

/**
 * Script to clean up unused database tables
 * This script removes tables that are not actively used in the application
 */
async function cleanupUnusedTables() {
  console.log('🧹 Starting database cleanup for unused tables...');
  
  // List of tables identified as unused or minimally used
  const unusedTables = [
    'emoji_reactions', // Only in delete-all-client-data.ts, not used in main app
    'user_activity_log', // Only in schema, not used in storage or routes
    'role_templates', // Only in schema, not used in storage or routes
    'system_settings', // Only mentioned in replit.md, not used in code
    'user_permissions', // Only in schema, not used in storage or routes
    'trial_achievements', // Legacy trial system, replaced by user_trial_achievements
    'trial_progress', // Legacy trial system, not used in current implementation
    'level_rewards', // Gamification feature not fully implemented
    'activity_logs', // Redundant with audit_trail system
    'achievements', // Gamification feature not fully implemented
    'user_achievements', // Gamification feature not fully implemented
    'user_stats', // Gamification feature not fully implemented
    'initiative_documents', // Feature not implemented in UI
    'initiative_members', // Feature not implemented in UI
    'notification_preferences', // Replaced by user reminder config
  ];

  console.log('📋 Tables to be removed:', unusedTables);

  try {
    // Check if tables exist before dropping
    const existingTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('emoji_reactions', 'user_activity_log', 'role_templates', 'system_settings', 'user_permissions', 'trial_achievements', 'trial_progress', 'level_rewards', 'activity_logs', 'achievements', 'user_achievements', 'user_stats', 'initiative_documents', 'initiative_members', 'notification_preferences')
    `);

    const tablesToDrop = existingTables.rows.map((row: any) => row.table_name);
    
    if (tablesToDrop.length === 0) {
      console.log('✅ No unused tables found to drop');
      return;
    }

    console.log(`🗑️  Found ${tablesToDrop.length} tables to drop:`, tablesToDrop);

    // Drop tables in safe order (considering foreign key constraints)
    for (const tableName of tablesToDrop) {
      try {
        console.log(`🔄 Dropping table: ${tableName}...`);
        await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`));
        console.log(`✅ Successfully dropped table: ${tableName}`);
      } catch (error) {
        console.error(`❌ Failed to drop table ${tableName}:`, error);
      }
    }

    // Clean up any orphaned sequences
    console.log('🔄 Cleaning up orphaned sequences...');
    await db.execute(sql`
      DO $$ 
      DECLARE 
        seq_name TEXT;
      BEGIN 
        FOR seq_name IN 
          SELECT sequence_name 
          FROM information_schema.sequences 
          WHERE sequence_schema = 'public' 
          AND sequence_name LIKE '%_id_seq'
          AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND column_default LIKE '%' || sequence_name || '%'
          )
        LOOP 
          EXECUTE 'DROP SEQUENCE IF EXISTS ' || seq_name || ' CASCADE';
        END LOOP;
      END $$;
    `);

    console.log('✅ Database cleanup completed successfully!');
    
    // Show remaining tables
    const remainingTables = await db.execute(sql`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📊 Remaining tables after cleanup:');
    remainingTables.rows.forEach((row: any) => {
      console.log(`  - ${row.table_name} (${row.column_count} columns)`);
    });

  } catch (error) {
    console.error('💥 Database cleanup failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
cleanupUnusedTables();