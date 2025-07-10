#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates a complete SQL backup of the current database
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function createDatabaseBackup() {
  try {
    console.log('🔄 Starting database backup...');
    
    // Get database connection details from environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable not found');
    }
    
    // Parse DATABASE_URL
    const url = new URL(dbUrl);
    const dbConfig = {
      host: url.hostname,
      port: url.port || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      username: url.username,
      password: url.password,
    };
    
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`🌐 Host: ${dbConfig.host}`);
    console.log(`📡 Port: ${dbConfig.port}`);
    
    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFilename = `database-backup-${timestamp}.sql`;
    const backupPath = path.join(process.cwd(), backupFilename);
    
    console.log(`📁 Backup file: ${backupFilename}`);
    
    // Set PGPASSWORD environment variable for authentication
    const env = { 
      ...process.env, 
      PGPASSWORD: dbConfig.password 
    };
    
    // Create pg_dump command
    const pgDumpCommand = [
      'pg_dump',
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--username=${dbConfig.username}`,
      `--dbname=${dbConfig.database}`,
      '--verbose',
      '--clean',
      '--no-owner',
      '--no-privileges',
      '--format=plain',
      '--encoding=UTF8',
      `--file=${backupPath}`
    ].join(' ');
    
    console.log('⚡ Executing backup command...');
    console.log(`Command: ${pgDumpCommand.replace(/--password=[^\s]+/, '--password=***')}`);
    
    // Execute backup
    const { stdout, stderr } = await execAsync(pgDumpCommand, { 
      env,
      maxBuffer: 1024 * 1024 * 50 // 50MB buffer
    });
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('⚠️ Backup warnings:', stderr);
    }
    
    // Check if backup file was created
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log('✅ Database backup completed successfully!');
      console.log(`📁 Backup file: ${backupFilename}`);
      console.log(`📊 File size: ${fileSizeMB} MB`);
      console.log(`📅 Created: ${new Date().toLocaleString()}`);
      
      // Show backup file contents preview
      const preview = fs.readFileSync(backupPath, 'utf8').slice(0, 500);
      console.log('\n📝 Backup file preview:');
      console.log('─'.repeat(50));
      console.log(preview + '...');
      console.log('─'.repeat(50));
      
      return backupFilename;
    } else {
      throw new Error('Backup file was not created');
    }
    
  } catch (error) {
    console.error('❌ Database backup failed:', error.message);
    
    if (error.message.includes('pg_dump')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure PostgreSQL client tools are installed');
      console.log('2. Check if DATABASE_URL is correct');
      console.log('3. Verify database connectivity');
      console.log('4. Ensure sufficient disk space');
    }
    
    throw error;
  }
}

// Alternative backup using node-postgres if pg_dump is not available
async function createBackupWithNodePostgres() {
  try {
    console.log('🔄 Creating backup using Node.js PostgreSQL client...');
    
    const { Client } = await import('pg');
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
    console.log(`📊 Found ${tables.length} tables: ${tables.join(', ')}`);
    
    // Create backup content
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFilename = `database-backup-simple-${timestamp}.sql`;
    
    let sqlContent = '';
    sqlContent += `-- Database Backup Created: ${new Date().toISOString()}\n`;
    sqlContent += `-- Tables: ${tables.join(', ')}\n\n`;
    
    // Export each table
    for (const table of tables) {
      console.log(`📤 Exporting table: ${table}`);
      
      // Get table structure
      const structureResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table]);
      
      sqlContent += `-- Table: ${table}\n`;
      sqlContent += `-- Columns: ${structureResult.rows.map(r => `${r.column_name} (${r.data_type})`).join(', ')}\n`;
      
      // Get table data
      const dataResult = await client.query(`SELECT * FROM ${table}`);
      
      if (dataResult.rows.length > 0) {
        const columns = Object.keys(dataResult.rows[0]);
        sqlContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n`;
        
        const values = dataResult.rows.map(row => {
          const rowValues = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return val;
          });
          return `(${rowValues.join(', ')})`;
        });
        
        sqlContent += values.join(',\n') + ';\n\n';
      } else {
        sqlContent += `-- No data in table ${table}\n\n`;
      }
    }
    
    // Write backup file
    fs.writeFileSync(backupFilename, sqlContent, 'utf8');
    await client.end();
    
    const stats = fs.statSync(backupFilename);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Simple backup completed successfully!');
    console.log(`📁 Backup file: ${backupFilename}`);
    console.log(`📊 File size: ${fileSizeMB} MB`);
    console.log(`📊 Tables exported: ${tables.length}`);
    
    return backupFilename;
    
  } catch (error) {
    console.error('❌ Simple backup failed:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Try pg_dump first, fall back to Node.js method
    try {
      await createDatabaseBackup();
    } catch (error) {
      if (error.message.includes('pg_dump') || error.code === 'ENOENT') {
        console.log('⚠️ pg_dump not available, using alternative method...');
        await createBackupWithNodePostgres();
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ All backup methods failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createDatabaseBackup, createBackupWithNodePostgres };