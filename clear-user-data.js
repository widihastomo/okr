import { neon } from '@neondatabase/serverless';

async function clearUserData() {
  console.log('🧹 Starting user data cleanup...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Get the specific user's organization ID
    const userId = '0bed6ad6-1eef-4395-9bbd-63064293fe47';
    const orgId = 'c9c215ce-bec5-434d-b2a7-b76482825cbe';
    
    console.log(`🎯 Clearing data for user: ${userId}`);
    console.log(`🏢 Organization: ${orgId}`);
    
    // Delete in proper order to avoid foreign key constraints
    
    // 1. Delete timeline updates
    console.log('📝 Deleting timeline updates...');
    await sql`DELETE FROM timeline_updates WHERE organization_id = ${orgId}`;
    
    // 2. Delete check-ins
    console.log('✅ Deleting check-ins...');
    await sql`DELETE FROM check_ins WHERE organization_id = ${orgId}`;
    
    // 3. Delete tasks
    console.log('📋 Deleting tasks...');
    await sql`DELETE FROM tasks WHERE organization_id = ${orgId}`;
    
    // 4. Delete definition of done items
    console.log('🎯 Deleting definition of done items...');
    await sql`DELETE FROM definition_of_done_items WHERE organization_id = ${orgId}`;
    
    // 5. Delete initiative success metrics first
    console.log('📊 Deleting initiative success metrics...');
    try {
      await sql`DELETE FROM initiative_success_metrics WHERE organization_id = ${orgId}`;
    } catch (e) {
      console.log('ℹ️  Initiative success metrics table not found, skipping...');
    }
    
    // 6. Delete initiatives
    console.log('🚀 Deleting initiatives...');
    await sql`DELETE FROM initiatives WHERE organization_id = ${orgId}`;
    
    // 7. Delete key results
    console.log('🔑 Deleting key results...');
    await sql`DELETE FROM key_results WHERE organization_id = ${orgId}`;
    
    // 8. Delete objectives
    console.log('🎯 Deleting objectives...');
    await sql`DELETE FROM objectives WHERE organization_id = ${orgId}`;
    
    // 9. Delete team members (but keep teams)
    console.log('👥 Clearing team members...');
    await sql`DELETE FROM team_members WHERE user_id = ${userId}`;
    
    console.log('✅ User data cleanup completed successfully!');
    console.log('🎉 User can now generate fresh dummy data');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

clearUserData();