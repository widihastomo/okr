#!/usr/bin/env tsx

/**
 * Cleanup Users Table - Remove Migrated Columns
 * 
 * This script removes columns from the users table that have been migrated
 * to the organizations table as part of the schema migration.
 * 
 * Columns to be removed:
 * - Company details: companyAddress, province, city, industryType, position, referralSource
 * - Onboarding progress: onboardingRegistered, onboardingEmailConfirmed, onboardingCompanyDetailsCompleted, 
 *   onboardingMissionsCompleted, onboardingPackageUpgraded, onboardingCompleted, onboardingCompletedAt, onboardingData
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Setup database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const columnsToRemove = [
  // Company details (moved to organizations table)
  'company_address',
  'province', 
  'city',
  'industry_type',
  'position',
  'referral_source',
  // Onboarding progress (moved to organizations table) 
  'onboarding_registered',
  'onboarding_email_confirmed',
  'onboarding_company_details_completed',
  'onboarding_missions_completed', 
  'onboarding_package_upgraded',
  'onboarding_completed',
  'onboarding_completed_at',
  'onboarding_data'
];

async function cleanupUsersTable() {
  console.log('🧹 Starting cleanup of users table...');
  console.log(`📋 Columns to remove: ${columnsToRemove.length}`);
  
  try {
    // Check which columns actually exist in the users table
    console.log('🔍 Checking existing columns in users table...');
    const checkColumnsResult = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY column_name;
    `);
    
    const existingColumns = Array.from(checkColumnsResult).map((row: any) => row.column_name);
    console.log(`✅ Found ${existingColumns.length} existing columns in users table`);
    
    // Filter to only columns that actually exist
    const columnsToActuallyRemove = columnsToRemove.filter(col => existingColumns.includes(col));
    const columnsAlreadyMissing = columnsToRemove.filter(col => !existingColumns.includes(col));
    
    if (columnsAlreadyMissing.length > 0) {
      console.log(`ℹ️  Columns already removed: ${columnsAlreadyMissing.join(', ')}`);
    }
    
    if (columnsToActuallyRemove.length === 0) {
      console.log('✅ All target columns have already been removed from users table');
      return;
    }
    
    console.log(`🗑️  Will remove ${columnsToActuallyRemove.length} columns: ${columnsToActuallyRemove.join(', ')}`);
    
    // Remove each column individually for better error handling
    for (const columnName of columnsToActuallyRemove) {
      console.log(`🔄 Removing column: ${columnName}`);
      
      try {
        await db.execute(`ALTER TABLE users DROP COLUMN IF EXISTS ${columnName};`);
        console.log(`✅ Removed column: ${columnName}`);
      } catch (error) {
        console.error(`❌ Error removing column ${columnName}:`, error);
        // Continue with other columns even if one fails
      }
    }
    
    console.log('🎉 Users table cleanup completed successfully!');
    
    // Verify the cleanup by checking remaining columns
    console.log('🔍 Verifying cleanup - checking remaining columns...');
    const finalColumnsResult = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY column_name;
    `);
    
    const remainingColumns = Array.from(finalColumnsResult).map((row: any) => row.column_name);
    const stillExisting = columnsToRemove.filter(col => remainingColumns.includes(col));
    
    if (stillExisting.length > 0) {
      console.log(`⚠️  Some columns still exist: ${stillExisting.join(', ')}`);
    } else {
      console.log('✅ All target columns successfully removed from users table');
    }
    
    console.log(`📊 Final users table has ${remainingColumns.length} columns`);
    
  } catch (error) {
    console.error('❌ Error during users table cleanup:', error);
    throw error;
  } finally {
    // Clean up database connection
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupUsersTable()
    .then(() => {
      console.log('✅ Users table cleanup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Users table cleanup script failed:', error);
      process.exit(1);
    });
}

export { cleanupUsersTable };