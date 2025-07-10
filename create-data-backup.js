#!/usr/bin/env node

/**
 * Create database backup with data using Node.js PostgreSQL client
 */

import { Client } from 'pg';
import fs from 'fs';

async function createDataBackup() {
  try {
    console.log('🔄 Creating database backup with data...');
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    await client.connect();
    console.log('✅ Connected to database');
    
    // Get all table names
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`📊 Found ${tables.length} tables`);
    
    // Create backup content
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFilename = `database-with-data-${timestamp}.sql`;
    
    let sqlContent = '';
    sqlContent += `-- Database Backup with Data Created: ${new Date().toISOString()}\n`;
    sqlContent += `-- PostgreSQL Database Dump\n`;
    sqlContent += `-- Tables: ${tables.length}\n\n`;
    sqlContent += `SET statement_timeout = 0;\n`;
    sqlContent += `SET lock_timeout = 0;\n`;
    sqlContent += `SET client_encoding = 'UTF8';\n`;
    sqlContent += `SET standard_conforming_strings = on;\n`;
    sqlContent += `SET check_function_bodies = false;\n`;
    sqlContent += `SET xmloption = content;\n`;
    sqlContent += `SET client_min_messages = warning;\n\n`;
    
    let totalRecords = 0;
    
    // Export each table
    for (const table of tables) {
      console.log(`📤 Exporting table: ${table}`);
      
      try {
        // Get table data count
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const recordCount = parseInt(countResult.rows[0].count);
        
        if (recordCount > 0) {
          console.log(`  └─ ${recordCount} records found`);
          totalRecords += recordCount;
          
          // Get table data
          const dataResult = await client.query(`SELECT * FROM ${table}`);
          
          if (dataResult.rows.length > 0) {
            const columns = Object.keys(dataResult.rows[0]);
            sqlContent += `--\n-- Data for table: ${table} (${recordCount} records)\n--\n\n`;
            
            // Create INSERT statements
            for (const row of dataResult.rows) {
              const values = columns.map(col => {
                const val = row[col];
                if (val === null) return 'NULL';
                if (typeof val === 'string') {
                  // Escape single quotes
                  return `'${val.replace(/'/g, "''")}'`;
                }
                if (val instanceof Date) return `'${val.toISOString()}'`;
                if (typeof val === 'boolean') return val ? 'true' : 'false';
                if (Array.isArray(val)) return `'${JSON.stringify(val)}'`;
                if (typeof val === 'object') return `'${JSON.stringify(val)}'`;
                return val;
              });
              
              sqlContent += `INSERT INTO ${table} (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
            }
            sqlContent += '\n';
          }
        } else {
          console.log(`  └─ No data in table ${table}`);
          sqlContent += `-- No data in table ${table}\n\n`;
        }
      } catch (error) {
        console.error(`  ❌ Error exporting table ${table}:`, error.message);
        sqlContent += `-- Error exporting table ${table}: ${error.message}\n\n`;
      }
    }
    
    // Write backup file
    fs.writeFileSync(backupFilename, sqlContent, 'utf8');
    await client.end();
    
    const stats = fs.statSync(backupFilename);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Backup with data completed successfully!');
    console.log(`📁 Backup file: ${backupFilename}`);
    console.log(`📊 File size: ${fileSizeMB} MB`);
    console.log(`📊 Tables exported: ${tables.length}`);
    console.log(`📊 Total records: ${totalRecords.toLocaleString()}`);
    
    // Show preview of backup content
    const preview = sqlContent.split('\n').slice(0, 30).join('\n');
    console.log('\n📝 Backup file preview:');
    console.log('─'.repeat(50));
    console.log(preview);
    console.log('─'.repeat(50));
    
    return backupFilename;
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

// Run the backup
createDataBackup().catch(console.error);