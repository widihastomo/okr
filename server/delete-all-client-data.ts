import { db } from "./db";
import { sql } from "drizzle-orm";

async function deleteAllClientData() {
  try {
    console.log("🗑️  Menghapus semua data client...");
    
    // Delete data in proper order to respect foreign key constraints
    
    // Delete in proper order to avoid foreign key constraint issues
    const tables = [
      // User activity and progress data
      'task_comments',
      'activity_logs',
      'user_activity_log',
      'user_achievements',
      'user_stats',
      'trial_achievements',
      'user_trial_achievements',
      'user_onboarding_progress',
      'trial_progress',
      'notifications',
      'daily_reflections',
      'emoji_reactions',
      
      // OKR related data
      'check_ins',
      'success_metric_updates',
      'initiative_success_metrics',
      'initiative_members',
      'initiative_notes',
      'initiative_documents',
      'tasks',
      'initiatives',
      'key_results',
      'objectives',
      'cycles',
      'templates',
      
      // Team and organizational data
      'team_members',
      'teams',
      'organization_subscriptions',
      'organization_add_on_subscriptions',
      'subscription_add_ons',
      'invoices',
      'invoice_line_items',
      'billing_periods',
      'subscription_plans',
      'user_permissions',
      'role_templates',
      'level_rewards',
      'achievements',
      
      // User and organization data
      'users',
      'organizations',
      
      // Sessions (user sessions)
      'sessions'
    ];
    
    let deletedCount = 0;
    
    for (const table of tables) {
      try {
        // Check if table exists before attempting to delete
        const tableExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = ${table}
          );
        `);
        
        if (tableExists[0]?.exists) {
          const result = await db.execute(sql`DELETE FROM ${sql.identifier(table)};`);
          const count = result.rowCount || 0;
          if (count > 0) {
            console.log(`✅ Dihapus ${count} record dari tabel ${table}`);
            deletedCount += count;
          }
        } else {
          console.log(`⚠️  Tabel ${table} tidak ditemukan, dilewati`);
        }
      } catch (error) {
        console.log(`⚠️  Error menghapus tabel ${table}: ${error.message}`);
      }
    }
    
    // Data deletion completed
    
    // Reset sequences for tables that use auto-increment
    const sequenceResets = [
      'ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS organizations_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS teams_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS objectives_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS key_results_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS initiatives_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS tasks_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS cycles_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1'
    ];
    
    for (const resetQuery of sequenceResets) {
      try {
        await db.execute(sql.raw(resetQuery));
      } catch (error) {
        // Ignore errors for sequences that don't exist
      }
    }
    
    console.log(`🎉 Berhasil menghapus ${deletedCount} total record dari database`);
    console.log("✅ Semua data client telah dihapus");
    console.log("📋 Data yang dipertahankan: application_settings, sistem konfigurasi");
    
  } catch (error) {
    console.error("❌ Error menghapus data client:", error);
    throw error;
  }
}

// Fungsi untuk menghapus data spesifik berdasarkan kategori
async function deleteDataByCategory(category: string) {
  try {
    console.log(`🗑️  Menghapus data kategori: ${category}`);
    
    switch (category) {
      case 'users':
        await deleteUserData();
        break;
      case 'organizations':
        await deleteOrganizationData();
        break;
      case 'okrs':
        await deleteOKRData();
        break;
      case 'billing':
        await deleteBillingData();
        break;
      default:
        console.log("❌ Kategori tidak dikenal");
        return;
    }
    
    console.log(`✅ Data kategori ${category} berhasil dihapus`);
    
  } catch (error) {
    console.error(`❌ Error menghapus data kategori ${category}:`, error);
    throw error;
  }
}

async function deleteUserData() {
  const userTables = [
    'user_achievements',
    'user_stats', 
    'notifications',
    'sessions',
    'users'
  ];
  
  for (const table of userTables) {
    await db.execute(sql`DELETE FROM ${sql.identifier(table)};`);
  }
}

async function deleteOrganizationData() {
  const orgTables = [
    'team_members',
    'teams',
    'organization_subscriptions',
    'organization_addons',
    'organizations'
  ];
  
  for (const table of orgTables) {
    await db.execute(sql`DELETE FROM ${sql.identifier(table)};`);
  }
}

async function deleteOKRData() {
  const okrTables = [
    'check_ins',
    'success_metric_updates',
    'initiative_success_metrics',
    'initiative_members',
    'tasks',
    'initiatives', 
    'key_results',
    'objectives',
    'cycles',
    'templates'
  ];
  
  for (const table of okrTables) {
    await db.execute(sql`DELETE FROM ${sql.identifier(table)};`);
  }
}

async function deleteBillingData() {
  const billingTables = [
    'invoice_line_items',
    'invoices',
    'organization_subscriptions',
    'organization_addons',
    'billing_periods',
    'subscription_plans',
    'addon_packages'
  ];
  
  for (const table of billingTables) {
    await db.execute(sql`DELETE FROM ${sql.identifier(table)};`);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const category = process.argv[2]; // Optional category parameter
  
  if (category) {
    deleteDataByCategory(category)
      .then(() => {
        console.log(`🎉 Penghapusan data kategori ${category} selesai!`);
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Fatal error:", error);
        process.exit(1);
      });
  } else {
    deleteAllClientData()
      .then(() => {
        console.log("🎉 Penghapusan semua data client selesai!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Fatal error:", error);
        process.exit(1);
      });
  }
}

export { deleteAllClientData, deleteDataByCategory };