const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

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
    
    // 2. Update objectives to remove team connections
    console.log("🎯 Removing team connections from objectives...");
    await client.query(`
      UPDATE objectives 
      SET "teamId" = NULL, "ownerId" = $1, owner = 'Personal'
      WHERE "organizationId" = $2 AND "teamId" IS NOT NULL
    `, [userId, organizationId]);
    
    // 3. Delete teams
    console.log("🏢 Deleting teams...");
    await client.query(`
      DELETE FROM teams 
      WHERE "organizationId" = $1
    `, [organizationId]);
    
    console.log("✅ Team data cleanup completed successfully!");
    console.log("🎉 User can now generate fresh team data");
    
  } catch (error) {
    console.error("❌ Error during team cleanup:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

clearTeamData();