import { db } from "./db";
import { sql } from "drizzle-orm";

async function populateApplicationSettings() {
  try {
    console.log("🔧 Populating application settings...");

    const defaultSettings = [
      {
        key: "app_name",
        value: "OKR Management System",
        category: "general",
        description: "Nama aplikasi yang ditampilkan di header dan title",
        is_public: true,
      },
      {
        key: "app_description",
        value: "Platform manajemen OKR untuk pencapaian tujuan organisasi",
        category: "general",
        description: "Deskripsi singkat aplikasi",
        is_public: true,
      },
      {
        key: "app_version",
        value: "1.0.0",
        category: "general",
        description: "Versi aplikasi saat ini",
        is_public: true,
      },
      {
        key: "company_name",
        value: "Your Company",
        category: "general",
        description: "Nama perusahaan yang mengoperasikan platform",
        is_public: true,
      },
      {
        key: "contact_email",
        value: "admin@yourcompany.com",
        category: "general",
        description: "Email kontak untuk support dan pertanyaan",
        is_public: true,
      },
      {
        key: "support_phone",
        value: "+62-21-12345678",
        category: "general",
        description: "Nomor telepon support",
        is_public: true,
      },
      {
        key: "primary_color",
        value: "#f97316",
        category: "appearance",
        description: "Warna utama aplikasi (orange)",
        is_public: true,
      },
      {
        key: "secondary_color",
        value: "#dc2626",
        category: "appearance",
        description: "Warna sekunder aplikasi (red)",
        is_public: true,
      },
      {
        key: "logo_url",
        value: "/assets/logo.png",
        category: "appearance",
        description: "URL logo aplikasi",
        is_public: true,
      },
      {
        key: "favicon_url",
        value: "/assets/favicon.ico",
        category: "appearance",
        description: "URL favicon aplikasi",
        is_public: true,
      },
      {
        key: "max_login_attempts",
        value: "5",
        category: "security",
        description: "Maksimal percobaan login sebelum akun dikunci",
        is_public: false,
      },
      {
        key: "session_timeout",
        value: "86400",
        category: "security",
        description: "Durasi session timeout dalam detik (24 jam)",
        is_public: false,
      },
      {
        key: "password_min_length",
        value: "8",
        category: "security",
        description: "Panjang minimum password",
        is_public: false,
      },
      {
        key: "enable_registration",
        value: "true",
        category: "feature",
        description: "Mengizinkan registrasi pengguna baru",
        is_public: true,
      },

      {
        key: "smtp_host",
        value: "smtp.gmail.com",
        category: "email",
        description: "SMTP server host untuk email",
        is_public: false,
      },
      {
        key: "smtp_port",
        value: "587",
        category: "email",
        description: "SMTP server port",
        is_public: false,
      },
      {
        key: "smtp_username",
        value: "",
        category: "email",
        description: "Username SMTP untuk autentikasi",
        is_public: false,
      },
      {
        key: "from_email",
        value: "noreply@yourcompany.com",
        category: "email",
        description: "Email pengirim untuk notifikasi sistem",
        is_public: false,
      },
      {
        key: "from_name",
        value: "OKR Management System",
        category: "email",
        description: "Nama pengirim email",
        is_public: false,
      },
      {
        key: "enable_push_notifications",
        value: "true",
        category: "notification",
        description: "Mengaktifkan push notifications",
        is_public: true,
      },
      {
        key: "enable_email_notifications",
        value: "true",
        category: "notification",
        description: "Mengaktifkan email notifications",
        is_public: true,
      },
      {
        key: "notification_check_interval",
        value: "60",
        category: "notification",
        description: "Interval pengecekan notifikasi dalam detik",
        is_public: false,
      },
      {
        key: "maintenance_mode",
        value: "false",
        category: "general",
        description: "Mode maintenance untuk aplikasi",
        is_public: false,
      },
      {
        key: "maintenance_message",
        value: "Sistem sedang dalam maintenance. Silakan coba lagi nanti.",
        category: "general",
        description: "Pesan yang ditampilkan saat maintenance mode",
        is_public: false,
      },
      {
        key: "max_file_upload_size",
        value: "10485760",
        category: "general",
        description: "Maksimal ukuran file upload dalam bytes (10MB)",
        is_public: false,
      },
      {
        key: "allowed_file_types",
        value: "jpg,jpeg,png,pdf,doc,docx,xls,xlsx,ppt,pptx",
        category: "general",
        description: "Jenis file yang diizinkan untuk upload",
        is_public: false,
      },
      {
        key: "backup_enabled",
        value: "true",
        category: "security",
        description: "Mengaktifkan backup otomatis database",
        is_public: false,
      },
      {
        key: "backup_frequency",
        value: "daily",
        category: "security",
        description: "Frekuensi backup otomatis (daily, weekly, monthly)",
        is_public: false,
      },
    ];

    // Insert default settings if they don't exist
    for (const setting of defaultSettings) {
      await db.execute(sql`
        INSERT INTO application_settings (key, value, category, description, is_public)
        VALUES (${setting.key}, ${setting.value}, ${setting.category}, ${setting.description}, ${setting.is_public})
        ON CONFLICT (key) DO NOTHING
      `);
    }

    console.log("✅ Application settings populated successfully");
    console.log(`📊 Total settings: ${defaultSettings.length}`);
    console.log(`📈 Categories: ${Array.from(new Set(defaultSettings.map(s => s.category))).join(', ')}`);
    
  } catch (error) {
    console.error("❌ Error populating application settings:", error);
    throw error;
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateApplicationSettings()
    .then(() => {
      console.log("🎉 Application settings population completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fatal error:", error);
      process.exit(1);
    });
}

export { populateApplicationSettings };