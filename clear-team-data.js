import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearTeamData() {
  const client = await pool.connect();
  
  try {
    console.log("🧹 Starting team data cleanup...");
    
    // Get current user info
    const userResult = await client.query(`
      SELECT id, "organizationId" 
      FROM users 
      WHERE email = 'itdevjujura@gmail.com'
      LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      console.log("❌ User not found");
      return;
    }
    
    const { id: userId, organizationId } = userResult.rows[0];
    console.log(`🎯 Clearing team data for user: ${userId}`);
    console.log(`🏢 Organization: ${organizationId}`);
    
    // 1. Clear team members
    console.log("👥 Clearing team members...");
    await client.query(`
      DELETE FROM team_members 
      WHERE "teamId" IN (
        SELECT id FROM teams WHERE "organizationId" = $1
      )
    `, [organizationId]);
    
    // 2. Delete timeline updates
    console.log("📝 Deleting timeline updates...");
    await client.query(`
      DELETE FROM timeline_updates 
      WHERE "organizationId" = $1
    `, [organizationId]);
    
    // 3. Delete check-ins
    console.log("✅ Deleting check-ins...");
    await client.query(`
      DELETE FROM check_ins 
      WHERE "keyResultId" IN (
        SELECT kr.id FROM key_results kr
        JOIN objectives obj ON kr."objectiveId" = obj.id
        WHERE obj."organizationId" = $1
      )
    `, [organizationId]);
    
    // 4. Delete tasks
    console.log("📋 Deleting tasks...");
    await client.query(`
      DELETE FROM tasks 
      WHERE "organizationId" = $1
    `, [organizationId]);
    
    // 5. Delete definition of done items
    console.log("🎯 Deleting definition of done items...");
    await client.query(`
      DELETE FROM definition_of_done_items 
      WHERE "organizationId" = $1
    `, [organizationId]);
    
    // 6. Delete initiative success metrics
    console.log("📊 Deleting initiative success metrics...");
    await client.query(`
      DELETE FROM initiative_success_metrics 
      WHERE "organizationId" = $1
    `, [organizationId]);
    
    // 7. Delete initiatives
    console.log("🚀 Deleting initiatives...");
    await client.query(`
      DELETE FROM initiatives 
      WHERE "organizationId" = $1
    `, [organizationId]);
    
    // 8. Delete key results
    console.log("🔑 Deleting key results...");
    await client.query(`
      DELETE FROM key_results 
      WHERE "objectiveId" IN (
        SELECT id FROM objectives WHERE "organizationId" = $1
      )
    `, [organizationId]);
    
    // 9. Delete objectives
    console.log("🎯 Deleting objectives...");
    await client.query(`
      DELETE FROM objectives 
      WHERE "organizationId" = $1
    `, [organizationId]);
    
    // 10. Delete teams
    console.log("🏢 Deleting teams...");
    await client.query(`
      DELETE FROM teams 
      WHERE "organizationId" = $1
    `, [organizationId]);
    
    console.log("✅ Goals and team data cleanup completed successfully!");
    console.log("🎉 User can now generate fresh dummy data");
    
  } catch (error) {
    console.error("❌ Error during team cleanup:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

clearTeamData();