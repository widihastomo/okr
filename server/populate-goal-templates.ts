import { db } from "./db";
import { goalTemplates } from "@shared/schema";
import { eq } from "drizzle-orm";

const sampleGoalTemplates = [
  // Penjualan Templates
  {
    title: "Meningkatkan penjualan produk skincare sebesar 40%",
    description: "Fokus pada peningkatan revenue melalui strategi penjualan yang lebih efektif dan ekspansi market reach untuk produk skincare premium",
    focusAreaTag: "penjualan",
    keyResults: [
      { title: "Penjualan naik 40% dari bulan sebelumnya", targetValue: "40", unit: "%", keyResultType: "increase_to" },
      { title: "Mendapat 300 pelanggan baru per bulan", targetValue: "300", unit: "orang", keyResultType: "increase_to" },
      { title: "Tingkat konversi mencapai 8%", targetValue: "8", unit: "%", keyResultType: "increase_to" }
    ],
    initiatives: [
      { title: "Program digital marketing intensif", description: "Kampanye terintegrasi di media sosial dan Google Ads" },
      { title: "Training sales team professional", description: "Pelatihan teknik closing dan product knowledge" }
    ],
    tasks: [
      { title: "Buat content calendar bulanan", description: "Rencanakan konten promosi untuk seluruh bulan" },
      { title: "Setup Google Ads campaign", description: "Konfigurasi iklan dengan targeting yang tepat" },
      { title: "Analisis kompetitor pricing", description: "Riset harga pesaing untuk strategi pricing" }
    ]
  },
  {
    title: "Membangun basis pelanggan loyal dengan 500 member baru",
    description: "Menciptakan program membership yang menarik untuk meningkatkan customer retention dan lifetime value pelanggan skincare",
    focusAreaTag: "penjualan",
    keyResults: [
      { title: "500 member baru bergabung", targetValue: "500", unit: "orang", keyResultType: "increase_to" },
      { title: "Tingkat retention member 85%", targetValue: "85", unit: "%", keyResultType: "should_stay_above" },
      { title: "Average order value member naik 25%", targetValue: "25", unit: "%", keyResultType: "increase_to" }
    ],
    initiatives: [
      { title: "Program loyalty rewards", description: "Sistem poin dan hadiah untuk member setia" },
      { title: "Exclusive member benefits", description: "Akses early bird dan diskon khusus member" }
    ],
    tasks: [
      { title: "Design membership card dan benefits", description: "Buat desain kartu member dan daftar keuntungan" },
      { title: "Setup sistem poin digital", description: "Implementasi sistem tracking poin member" },
      { title: "Kampanye recruitment member", description: "Promosi untuk menarik member baru" }
    ]
  },

  // Operasional Templates
  {
    title: "Mengoptimalkan efisiensi produksi skincare hingga 30%",
    description: "Streamline proses produksi dan supply chain untuk mengurangi waste dan meningkatkan output produk berkualitas",
    focusAreaTag: "operasional",
    keyResults: [
      { title: "Efisiensi produksi naik 30%", targetValue: "30", unit: "%", keyResultType: "increase_to" },
      { title: "Reduce waste produksi hingga 15%", targetValue: "15", unit: "%", keyResultType: "decrease_to" },
      { title: "Lead time produksi turun 20%", targetValue: "20", unit: "%", keyResultType: "decrease_to" }
    ],
    initiatives: [
      { title: "Automatisasi proses produksi", description: "Implementasi teknologi untuk mengotomatisasi tahapan produksi" },
      { title: "Optimasi supply chain", description: "Perbaikan sistem pengadaan dan distribusi bahan baku" }
    ],
    tasks: [
      { title: "Audit proses produksi current", description: "Evaluasi menyeluruh proses produksi yang ada" },
      { title: "Implementasi lean manufacturing", description: "Terapkan prinsip lean untuk eliminasi waste" },
      { title: "Training tim produksi", description: "Pelatihan tim untuk prosedur baru" }
    ]
  },
  {
    title: "Mengurangi biaya operasional bulanan sebesar 25%",
    description: "Audit dan optimasi semua aspek operasional untuk mencapai efisiensi biaya tanpa mengorbankan kualitas produk dan service",
    focusAreaTag: "operasional",
    keyResults: [
      { title: "Biaya operasional turun 25%", targetValue: "25", unit: "%", keyResultType: "decrease_to" },
      { title: "Cost per unit produksi turun 20%", targetValue: "20", unit: "%", keyResultType: "decrease_to" },
      { title: "ROI operasional naik 15%", targetValue: "15", unit: "%", keyResultType: "increase_to" }
    ],
    initiatives: [
      { title: "Cost reduction program", description: "Program sistematis untuk mengurangi biaya tanpa mengurangi kualitas" },
      { title: "Vendor negotiation strategy", description: "Negosiasi ulang kontrak dengan supplier untuk harga lebih baik" }
    ],
    tasks: [
      { title: "Analisis detail cost structure", description: "Breakdown semua komponen biaya operasional" },
      { title: "Identifikasi area penghematan", description: "Temukan peluang cost saving potensial" },
      { title: "Implementasi cost control system", description: "Sistem monitoring dan kontrol biaya" }
    ]
  },

  // Customer Service Templates
  {
    title: "Mencapai tingkat kepuasan pelanggan 95%",
    description: "Meningkatkan kualitas layanan pelanggan melalui training tim dan implementasi sistem customer support yang responsif",
    focusAreaTag: "customer_service",
    keyResults: [
      { title: "Customer satisfaction score 95%", targetValue: "95", unit: "%", keyResultType: "should_stay_above" },
      { title: "Response time rata-rata 2 jam", targetValue: "2", unit: "hari", keyResultType: "should_stay_below" },
      { title: "First call resolution 80%", targetValue: "80", unit: "%", keyResultType: "should_stay_above" }
    ],
    initiatives: [
      { title: "Customer service excellence program", description: "Program pelatihan komprehensif untuk tim customer service" },
      { title: "Implementasi ticketing system", description: "Sistem manajemen tiket untuk tracking customer issues" }
    ],
    tasks: [
      { title: "Setup customer feedback system", description: "Implementasi sistem survey kepuasan pelanggan" },
      { title: "Training customer service skills", description: "Pelatihan soft skills dan product knowledge" },
      { title: "Create service standard procedures", description: "Buat SOP untuk handling customer complaints" }
    ]
  },
  {
    title: "Mengurangi waktu respon customer service menjadi maksimal 2 jam",
    description: "Implementasi sistem ticketing dan SOP baru untuk memberikan respon yang lebih cepat dan memuaskan kepada pelanggan",
    focusAreaTag: "customer_service",
    keyResults: [
      { title: "Average response time 2 jam", targetValue: "2", unit: "hari", keyResultType: "should_stay_below" },
      { title: "95% tiket resolved dalam 24 jam", targetValue: "95", unit: "%", keyResultType: "should_stay_above" },
      { title: "Customer complaint rate turun 40%", targetValue: "40", unit: "%", keyResultType: "decrease_to" }
    ],
    initiatives: [
      { title: "Fast response system", description: "Sistem otomatis untuk prioritas dan routing customer queries" },
      { title: "24/7 support coverage", description: "Perluasan jam operasional customer service" }
    ],
    tasks: [
      { title: "Implement ticketing software", description: "Setup dan konfigurasi sistem ticketing" },
      { title: "Create response time SOP", description: "Standar operasional untuk response time" },
      { title: "Monitor dan report response metrics", description: "Tracking performance response time harian" }
    ]
  },

  // Marketing Templates  
  {
    title: "Meningkatkan brand awareness produk skincare sebesar 60%",
    description: "Kampanye marketing digital yang komprehensif untuk meningkatkan visibility dan recognition brand di target market",
    focusAreaTag: "marketing",
    keyResults: [
      { title: "Brand awareness naik 60%", targetValue: "60", unit: "%", keyResultType: "increase_to" },
      { title: "Social media reach 100K per bulan", targetValue: "100000", unit: "orang", keyResultType: "increase_to" },
      { title: "Website traffic naik 80%", targetValue: "80", unit: "%", keyResultType: "increase_to" }
    ],
    initiatives: [
      { title: "Integrated digital marketing campaign", description: "Kampanye terintegrasi di semua channel digital" },
      { title: "Influencer partnership program", description: "Kolaborasi dengan beauty influencers untuk brand exposure" }
    ],
    tasks: [
      { title: "Create brand awareness survey", description: "Survey untuk mengukur tingkat awareness saat ini" },
      { title: "Develop creative campaign concept", description: "Konsep kreatif untuk kampanye brand awareness" },
      { title: "Execute multi-channel campaign", description: "Pelaksanaan kampanye di berbagai platform" }
    ]
  },
  {
    title: "Menghasilkan 1000 qualified leads per bulan",
    description: "Strategi lead generation melalui content marketing, social media, dan digital advertising untuk memperbesar sales funnel",
    focusAreaTag: "marketing",
    keyResults: [
      { title: "1000 qualified leads per bulan", targetValue: "1000", unit: "orang", keyResultType: "increase_to" },
      { title: "Lead conversion rate 12%", targetValue: "12", unit: "%", keyResultType: "should_stay_above" },
      { title: "Cost per lead turun 30%", targetValue: "30", unit: "%", keyResultType: "decrease_to" }
    ],
    initiatives: [
      { title: "Content marketing strategy", description: "Strategi konten untuk menarik dan nurture leads" },
      { title: "Lead magnet optimization", description: "Optimasi lead magnet untuk meningkatkan konversi" }
    ],
    tasks: [
      { title: "Create lead scoring system", description: "Sistem untuk menilai kualitas leads" },
      { title: "Develop content calendar", description: "Kalender konten untuk lead generation" },
      { title: "Setup marketing automation", description: "Otomasi untuk nurturing leads" }
    ]
  }
];

async function populateGoalTemplates() {
  console.log("🎯 Populating goal templates...");

  try {
    for (const template of sampleGoalTemplates) {
      // Check if template already exists
      const existing = await db
        .select()
        .from(goalTemplates)
        .where(eq(goalTemplates.title, template.title))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(goalTemplates).values({
          ...template,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Created template: ${template.title}`);
      } else {
        // Update existing template with new data (including corrected units)
        await db
          .update(goalTemplates)
          .set({
            ...template,
            updatedAt: new Date()
          })
          .where(eq(goalTemplates.title, template.title));
        console.log(`🔄 Updated template: ${template.title}`);
      }
    }

    console.log("🎉 Goal templates population completed!");
  } catch (error) {
    console.error("❌ Error populating goal templates:", error);
    throw error;
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateGoalTemplates()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { populateGoalTemplates };