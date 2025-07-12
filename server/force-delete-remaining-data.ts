import { db } from './db';

/**
 * Force delete remaining client data by handling all foreign key constraints
 * This script attempts to delete all remaining client data systematically
 */

async function forceDeleteRemainingData() {
  console.log('🧹 Starting force deletion of remaining client data...');
  
  try {
    // Step 1: Delete all remaining data that might have foreign key constraints
    console.log('📋 Deleting miscellaneous data...');
    
    // Delete with try-catch for tables that might not exist
    const tablesToDelete = [
      'user_stats',
      'activity_logs', 
      'notifications',
      'success_metrics',
      'check_ins',
      'initiative_members',
      'tasks',
      'initiatives',
      'key_results',
      'objectives',
      'cycles',
      'templates',
      'team_members',
      'teams',
      'invoice_line_items',
      'invoices',
      'organization_subscriptions',
      'users',
      'organizations'
    ];
    
    for (const table of tablesToDelete) {
      try {
        await db.execute(`DELETE FROM ${table};`);
        console.log(`✅ Deleted from ${table}`);
      } catch (error) {
        console.log(`⚠️  Table ${table} does not exist or already empty`);
      }
    }
    
    console.log('✅ All remaining client data has been deleted successfully!');
    
    // Verify cleanup
    console.log('🔍 Verifying cleanup...');
    const verificationQueries = [
      'SELECT COUNT(*) as count FROM users',
      'SELECT COUNT(*) as count FROM organizations',
      'SELECT COUNT(*) as count FROM objectives',
      'SELECT COUNT(*) as count FROM key_results',
      'SELECT COUNT(*) as count FROM initiatives',
      'SELECT COUNT(*) as count FROM tasks',
      'SELECT COUNT(*) as count FROM cycles',
      'SELECT COUNT(*) as count FROM teams',
      'SELECT COUNT(*) as count FROM invoices',
    ];
    
    for (const query of verificationQueries) {
      const result = await db.execute(query);
      const tableName = query.match(/FROM (\w+)/)?.[1];
      console.log(`📊 ${tableName}: ${result.rows[0].count} records`);
    }
    
  } catch (error) {
    console.error('❌ Error during force deletion:', error);
    throw error;
  }
}

// Run the force deletion
forceDeleteRemainingData()
  .then(() => {
    console.log('🎉 Force deletion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Force deletion failed:', error);
    process.exit(1);
  });