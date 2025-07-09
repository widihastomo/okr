import { db } from "./db";
import { applicationSettings } from "@shared/schema";

async function populateApplicationSettings() {
  try {
    console.log("🔧 Populating application settings...");

    const defaultSettings = [
      {
        key: "app_name",
        value: "OKR Management System",
        category: "general",
        description: "Nama aplikasi yang ditampilkan di header dan title",
        isPublic: true,
      },
      {
        key: "app_description",
        value: "Platform manajemen OKR untuk pencapaian tujuan organisasi",
        category: "general",
        description: "Deskripsi singkat aplikasi",
        isPublic: true,
      },
      {
        key: "app_version",
        value: "1.0.0",
        category: "general",
        description: "Versi aplikasi saat ini",
        isPublic: true,
      },
      {
        key: "company_name",
        value: "Your Company",
        category: "general",
        description: "Nama perusahaan yang mengoperasikan platform",
        isPublic: true,
      },
      {
        key: "contact_email",
        value: "admin@yourcompany.com",
        category: "general",
        description: "Email kontak untuk support dan pertanyaan",
        isPublic: true,
      },
      {
        key: "support_phone",
        value: "+62-21-12345678",
        category: "general",
        description: "Nomor telepon support",
        isPublic: true,
      },
      {
        key: "primary_color",
        value: "#f97316",
        category: "appearance",
        description: "Warna utama aplikasi (orange)",
        isPublic: true,
      },
      {
        key: "secondary_color",
        value: "#dc2626",
        category: "appearance",
        description: "Warna sekunder aplikasi (red)",
        isPublic: true,
      },
      {
        key: "logo_url",
        value: "/assets/logo.png",
        category: "appearance",
        description: "URL logo aplikasi",
        isPublic: true,
      },
      {
        key: "favicon_url",
        value: "/assets/favicon.ico",
        category: "appearance",
        description: "URL favicon aplikasi",
        isPublic: true,
      },
      {
        key: "max_login_attempts",
        value: "5",
        category: "security",
        description: "Maksimal percobaan login sebelum akun dikunci",
        isPublic: false,
      },
      {
        key: "session_timeout",
        value: "86400",
        category: "security",
        description: "Durasi session timeout dalam detik (24 jam)",
        isPublic: false,
      },
      {
        key: "password_min_length",
        value: "8",
        category: "security",
        description: "Panjang minimum password",
        isPublic: false,
      },
      {
        key: "enable_registration",
        value: "true",
        category: "feature",
        description: "Mengizinkan registrasi pengguna baru",
        isPublic: true,
      },
      {
        key: "enable_trial",
        value: "true",
        category: "feature",
        description: "Mengaktifkan fitur free trial",
        isPublic: true,
      },
      {
        key: "trial_duration_days",
        value: "7",
        category: "feature",
        description: "Durasi free trial dalam hari",
        isPublic: true,
      },
      {
        key: "max_users_per_trial",
        value: "3",
        category: "feature",
        description: "Maksimal pengguna per organisasi trial",
        isPublic: true,
      },
      {
        key: "smtp_host",
        value: "smtp.gmail.com",
        category: "email",
        description: "SMTP server host untuk email",
        isPublic: false,
      },
      {
        key: "smtp_port",
        value: "587",
        category: "email",
        description: "SMTP server port",
        isPublic: false,
      },
      {
        key: "smtp_username",
        value: "",
        category: "email",
        description: "Username SMTP untuk autentikasi",
        isPublic: false,
      },
      {
        key: "from_email",
        value: "noreply@yourcompany.com",
        category: "email",
        description: "Email pengirim untuk notifikasi sistem",
        isPublic: false,
      },
      {
        key: "from_name",
        value: "OKR Management System",
        category: "email",
        description: "Nama pengirim email",
        isPublic: false,
      },
      {
        key: "enable_push_notifications",
        value: "true",
        category: "notification",
        description: "Mengaktifkan push notifications",
        isPublic: true,
      },
      {
        key: "enable_email_notifications",
        value: "true",
        category: "notification",
        description: "Mengaktifkan email notifications",
        isPublic: true,
      },
      {
        key: "notification_check_interval",
        value: "60",
        category: "notification",
        description: "Interval pengecekan notifikasi dalam detik",
        isPublic: false,
      },
      {
        key: "maintenance_mode",
        value: "false",
        category: "general",
        description: "Mode maintenance untuk aplikasi",
        isPublic: false,
      },
      {
        key: "maintenance_message",
        value: "Sistem sedang dalam maintenance. Silakan coba lagi nanti.",
        category: "general",
        description: "Pesan yang ditampilkan saat maintenance mode",
        isPublic: false,
      },
      {
        key: "max_file_upload_size",
        value: "10485760",
        category: "general",
        description: "Maksimal ukuran file upload dalam bytes (10MB)",
        isPublic: false,
      },
      {
        key: "allowed_file_types",
        value: "jpg,jpeg,png,pdf,doc,docx,xls,xlsx,ppt,pptx",
        category: "general",
        description: "Jenis file yang diizinkan untuk upload",
        isPublic: false,
      },
      {
        key: "backup_enabled",
        value: "true",
        category: "security",
        description: "Mengaktifkan backup otomatis database",
        isPublic: false,
      },
      {
        key: "backup_frequency",
        value: "daily",
        category: "security",
        description: "Frekuensi backup otomatis (daily, weekly, monthly)",
        isPublic: false,
      },
    ];

    // Insert default settings if they don't exist
    for (const setting of defaultSettings) {
      await db.insert(applicationSettings)
        .values({
          ...setting,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
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