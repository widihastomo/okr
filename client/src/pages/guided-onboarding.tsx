import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Target, 
  Wand2, 
  Eye, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  Building2,
  TrendingUp,
  Settings,
  Users,
  Zap,
  BarChart3,
  Search,
  Briefcase,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const industryTypes = [
  "Teknologi Informasi",
  "Manufaktur",
  "Perdagangan",
  "Jasa Keuangan",
  "Pendidikan",
  "Kesehatan",
  "Konstruksi",
  "Transportasi",
  "Perhotelan & Pariwisata",
  "Media & Komunikasi",
  "Energi & Pertambangan",
  "Pertanian",
  "Real Estate",
  "Konsultan",
  "Pemerintahan",
  "Non-Profit",
  "E-commerce",
  "Startup",
  "FMCG",
  "Otomotif",
  "Farmasi",
  "Telekomunikasi",
  "Logistik",
  "Perbankan",
  "Asuransi",
  "Lainnya",
];

const provinces = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Bengkulu",
  "Sumatera Selatan",
  "Bangka Belitung",
  "Lampung",
  "DKI Jakarta",
  "Jawa Barat",
  "Banten",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua Barat",
  "Papua",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Selatan",
  "Papua Barat Daya",
];

const citiesByProvince: Record<string, string[]> = {
  "Aceh": [
    "Kota Banda Aceh",
    "Kota Sabang",
    "Kota Langsa",
    "Kota Lhokseumawe",
    "Kota Subulussalam",
    "Kabupaten Aceh Barat",
    "Kabupaten Aceh Barat Daya",
    "Kabupaten Aceh Besar",
    "Kabupaten Aceh Jaya",
    "Kabupaten Aceh Selatan",
    "Kabupaten Aceh Singkil",
    "Kabupaten Aceh Tamiang",
    "Kabupaten Aceh Tengah",
    "Kabupaten Aceh Tenggara",
    "Kabupaten Aceh Timur",
    "Kabupaten Aceh Utara",
    "Kabupaten Bener Meriah",
    "Kabupaten Bireuen",
    "Kabupaten Gayo Lues",
    "Kabupaten Nagan Raya",
    "Kabupaten Pidie",
    "Kabupaten Pidie Jaya",
    "Kabupaten Simeulue"
  ],
  "DKI Jakarta": [
    "Kota Jakarta Pusat",
    "Kota Jakarta Utara",
    "Kota Jakarta Barat",
    "Kota Jakarta Selatan",
    "Kota Jakarta Timur",
    "Kabupaten Kepulauan Seribu"
  ],
  "Jawa Barat": [
    "Kota Bandung",
    "Kota Bogor",
    "Kota Sukabumi",
    "Kota Cirebon",
    "Kota Bekasi",
    "Kota Depok",
    "Kota Cimahi",
    "Kota Tasikmalaya",
    "Kota Banjar",
    "Kabupaten Bogor",
    "Kabupaten Sukabumi",
    "Kabupaten Cianjur",
    "Kabupaten Bandung",
    "Kabupaten Garut",
    "Kabupaten Tasikmalaya",
    "Kabupaten Ciamis",
    "Kabupaten Kuningan",
    "Kabupaten Cirebon",
    "Kabupaten Majalengka",
    "Kabupaten Sumedang",
    "Kabupaten Indramayu",
    "Kabupaten Subang",
    "Kabupaten Purwakarta",
    "Kabupaten Karawang",
    "Kabupaten Bekasi",
    "Kabupaten Bandung Barat",
    "Kabupaten Pangandaran"
  ],
  "Jawa Tengah": [
    "Kota Semarang",
    "Kota Surakarta",
    "Kota Salatiga",
    "Kota Pekalongan",
    "Kota Tegal",
    "Kota Magelang",
    "Kabupaten Cilacap",
    "Kabupaten Banyumas",
    "Kabupaten Purbalingga",
    "Kabupaten Banjarnegara",
    "Kabupaten Kebumen",
    "Kabupaten Purworejo",
    "Kabupaten Wonosobo",
    "Kabupaten Magelang",
    "Kabupaten Boyolali",
    "Kabupaten Klaten",
    "Kabupaten Sukoharjo",
    "Kabupaten Wonogiri",
    "Kabupaten Karanganyar",
    "Kabupaten Sragen",
    "Kabupaten Grobogan",
    "Kabupaten Blora",
    "Kabupaten Rembang",
    "Kabupaten Pati",
    "Kabupaten Kudus",
    "Kabupaten Jepara",
    "Kabupaten Demak",
    "Kabupaten Semarang",
    "Kabupaten Temanggung",
    "Kabupaten Kendal",
    "Kabupaten Batang",
    "Kabupaten Pekalongan",
    "Kabupaten Pemalang",
    "Kabupaten Tegal",
    "Kabupaten Brebes"
  ]
};

const positionOptions = [
  "CEO/Founder",
  "Direktur",
  "Manager",
  "Team Lead",
  "Supervisor",
  "Staff",
  "Konsultan",
  "Freelancer",
  "Lainnya",
];

const referralSources = [
  "Google Search",
  "Media Sosial (Instagram, LinkedIn, Facebook)",
  "Rekomendasi Teman/Kolega",
  "Event/Webinar",
  "YouTube",
  "Blog/Artikel",
  "Iklan Online",
  "Word of Mouth",
  "Partnership/Kemitraan",
  "Cold Email/Sales",
  "Lainnya",
];

const companySizes = [
  "1-5 karyawan",
  "6-10 karyawan",
  "11-25 karyawan",
  "26-50 karyawan",
  "51-100 karyawan",
  "101-250 karyawan",
  "251-500 karyawan",
  "500+ karyawan",
];

const goalAreas = [
  {
    id: "revenue",
    title: "Tingkatkan Pendapatan",
    description: "Fokus pada peningkatan omzet dan penjualan",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "text-green-600"
  },
  {
    id: "operations", 
    title: "Rapikan Operasional",
    description: "Efisiensi proses dan sistem kerja",
    icon: <Settings className="h-6 w-6" />,
    color: "text-blue-600"
  },
  {
    id: "team",
    title: "Kembangkan Tim",
    description: "Peningkatan kapasitas dan kinerja tim",
    icon: <Users className="h-6 w-6" />,
    color: "text-purple-600"
  },
  {
    id: "growth",
    title: "Ekspansi Bisnis",
    description: "Perluasan pasar dan pengembangan produk",
    icon: <Zap className="h-6 w-6" />,
    color: "text-orange-600"
  },
  {
    id: "performance",
    title: "Ukur Performa",
    description: "Tracking dan analisis kinerja bisnis",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "text-indigo-600"
  }
];

// Enhanced OKR Templates dengan variations berdasarkan company profile
const okrTemplates = {
  revenue: {
    startup: {
      objective: "Mencapai Product-Market Fit dan Pertumbuhan Revenue",
      keyResults: [
        "Mencapai MRR (Monthly Recurring Revenue) Rp 50 juta",
        "Mendapatkan 500 paying customers dengan churn rate < 5%",
        "Mencapai Net Revenue Retention rate 110%"
      ]
    },
    small: {
      objective: "Meningkatkan Pendapatan Bisnis 40%",
      keyResults: [
        "Mencapai target penjualan Rp 200 juta per bulan",
        "Meningkatkan jumlah customer aktif menjadi 500 orang",
        "Meningkatkan rata-rata nilai transaksi menjadi Rp 400rb"
      ]
    },
    medium: {
      objective: "Ekspansi Revenue dan Market Share",
      keyResults: [
        "Mencapai target penjualan Rp 1 miliar per bulan",
        "Meningkatkan market share menjadi 15% di kategori",
        "Meluncurkan 2 revenue stream baru"
      ]
    },
    large: {
      objective: "Optimasi Revenue dan Margin",
      keyResults: [
        "Mencapai target revenue Rp 10 miliar per kuartal",
        "Meningkatkan gross margin menjadi 45%",
        "Mengakuisisi 2 perusahaan strategic"
      ]
    }
  },
  operations: {
    startup: {
      objective: "Membangun Fondasi Operasional yang Scalable",
      keyResults: [
        "Implementasi SOP untuk 5 proses core business",
        "Mencapai customer satisfaction score 4.2/5",
        "Mengurangi manual process sebesar 60%"
      ]
    },
    small: {
      objective: "Mengoptimalkan Efisiensi Operasional",
      keyResults: [
        "Mengurangi waktu proses order menjadi maksimal 2 hari",
        "Mencapai tingkat kepuasan customer 95%",
        "Menurunkan biaya operasional sebesar 20%"
      ]
    },
    medium: {
      objective: "Standardisasi dan Otomasi Operasi",
      keyResults: [
        "Mengotomasi 80% proses repetitive",
        "Mencapai operational efficiency ratio 75%",
        "Implementasi quality management system ISO"
      ]
    },
    large: {
      objective: "Excellence in Operational Performance",
      keyResults: [
        "Mencapai Six Sigma level dalam quality control",
        "Mengurangi operational cost per unit sebesar 15%",
        "Implementasi AI-driven predictive maintenance"
      ]
    }
  },
  team: {
    startup: {
      objective: "Membangun Tim Inti yang Solid",
      keyResults: [
        "Rekrut 5 key talents untuk posisi critical",
        "Mencapai employee engagement score 4.0/5",
        "Membuat program onboarding 2 minggu"
      ]
    },
    small: {
      objective: "Mengembangkan Kapasitas dan Budaya Tim",
      keyResults: [
        "Menyelesaikan program pelatihan untuk 100% tim",
        "Mencapai employee satisfaction score 4.3/5",
        "Menurunkan tingkat turnover menjadi di bawah 15%"
      ]
    },
    medium: {
      objective: "Skalakan Organisasi dan Leadership",
      keyResults: [
        "Mengembangkan 10 future leaders melalui program mentoring",
        "Mencapai employee Net Promoter Score 70+",
        "Implementasi performance management system"
      ]
    },
    large: {
      objective: "Transform to High-Performance Organization",
      keyResults: [
        "Mencapai Top Employer certification",
        "Mengimplementasi succession planning untuk 100% key positions",
        "Mencapai productivity growth 20% year-over-year"
      ]
    }
  },
  growth: {
    startup: {
      objective: "Validasi dan Ekspansi Product-Market Fit",
      keyResults: [
        "Meluncurkan MVP di 2 market segment baru",
        "Mencapai 1000 active users dengan retention rate 40%",
        "Mendapatkan funding Series A min Rp 10 miliar"
      ]
    },
    small: {
      objective: "Memperluas Jangkauan Pasar dan Produk",
      keyResults: [
        "Meluncurkan 2 produk/layanan baru",
        "Membuka 3 channel penjualan baru",
        "Mencapai 40% customer dari luar kota asal"
      ]
    },
    medium: {
      objective: "Diversifikasi dan Market Leadership",
      keyResults: [
        "Ekspansi ke 3 kota besar baru",
        "Meluncurkan business line baru dengan target revenue Rp 500jt",
        "Mencapai market leadership di 1 kategori produk"
      ]
    },
    large: {
      objective: "Strategic Growth dan Market Dominance",
      keyResults: [
        "Ekspansi internasional ke 2 negara ASEAN",
        "Mengakuisisi 3 perusahaan strategic senilai Rp 100 miliar",
        "Mencapai kategori unicorn dengan valuasi $1 miliar"
      ]
    }
  },
  performance: {
    startup: {
      objective: "Setup Measurement dan Analytics Foundation",
      keyResults: [
        "Implementasi analytics tracking untuk 10 key metrics",
        "Membuat weekly dashboard untuk founders",
        "Mencapai data-driven decision making 80%"
      ]
    },
    small: {
      objective: "Membangun Sistem Monitoring Kinerja",
      keyResults: [
        "Implementasi dashboard real-time untuk semua KPI",
        "Mencapai 85% akurasi dalam forecasting",
        "Mengurangi waktu reporting mingguan menjadi 3 jam"
      ]
    },
    medium: {
      objective: "Advanced Analytics dan Intelligence",
      keyResults: [
        "Implementasi predictive analytics untuk 5 business areas",
        "Mencapai 95% akurasi dalam quarterly forecasting",
        "Membuat automated reporting system"
      ]
    },
    large: {
      objective: "AI-Powered Business Intelligence",
      keyResults: [
        "Implementasi AI/ML untuk business optimization",
        "Mencapai real-time decision making capability",
        "Membuat competitive intelligence system"
      ]
    }
  }
};

export default function GuidedOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 1: Mini Profiling
  const [profileData, setProfileData] = useState({
    companyName: "",
    companyAddress: "",
    province: "",
    city: "",
    industry: "",
    role: "",
    companySize: "",
    referralSource: "",
    mainGoal: ""
  });
  
  // Step 2: Goal Areas
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  
  // Step 3: Goal Builder
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customizedGoal, setCustomizedGoal] = useState({
    objective: "",
    keyResults: ["", "", ""]
  });

  // Enhanced Recommendation Logic
  const getCompanySizeCategory = (companySize: string): string => {
    if (companySize === "1-5 karyawan" || companySize === "6-10 karyawan") return "startup";
    if (companySize === "11-25 karyawan" || companySize === "26-50 karyawan") return "small";
    if (companySize === "51-100 karyawan" || companySize === "101-250 karyawan") return "medium";
    return "large";
  };

  const getIntelligentRecommendation = () => {
    if (selectedAreas.length === 0 || !profileData.companySize) {
      return null;
    }

    const companySizeCategory = getCompanySizeCategory(profileData.companySize);
    const primaryArea = selectedAreas[0];
    
    // Get base template from primary area
    const baseTemplate = (okrTemplates as any)[primaryArea]?.[companySizeCategory];
    if (!baseTemplate) return null;

    // Enhance recommendations based on additional selected areas
    if (selectedAreas.length > 1) {
      const enhancedKeyResults = [...baseTemplate.keyResults];
      
      // Add complementary key results from other selected areas
      selectedAreas.slice(1).forEach((area) => {
        const additionalTemplate = (okrTemplates as any)[area]?.[companySizeCategory];
        if (additionalTemplate && additionalTemplate.keyResults[0]) {
          // Take the first key result from additional areas as complementary
          enhancedKeyResults.push(additionalTemplate.keyResults[0]);
        }
      });

      // Combine areas in objective title for multi-focus goals
      const areaNames = selectedAreas.map(areaId => {
        const area = goalAreas.find(a => a.id === areaId);
        return area?.title || areaId;
      });
      
      const combinedObjective = selectedAreas.length === 2 
        ? `${baseTemplate.objective} dengan Fokus ${areaNames[1]}`
        : `Transformasi Holistik: ${areaNames.join(" + ")}`;

      return {
        objective: combinedObjective,
        keyResults: enhancedKeyResults.slice(0, 4), // Limit to 4 key results max
        areas: selectedAreas,
        companySize: companySizeCategory
      };
    }

    return {
      ...baseTemplate,
      areas: [primaryArea],
      companySize: companySizeCategory
    };
  };

  const getRecommendationInsights = () => {
    const recommendation = getIntelligentRecommendation();
    if (!recommendation) return "";

    const companySizeCategory = getCompanySizeCategory(profileData.companySize);
    const insights = [];

    // Company size insights
    if (companySizeCategory === "startup") {
      insights.push("💡 Sebagai startup, fokus pada validasi dan foundation building");
    } else if (companySizeCategory === "small") {
      insights.push("💡 Fase growth: saatnya optimasi dan skalabilitas");
    } else if (companySizeCategory === "medium") {
      insights.push("💡 Prioritas: standardisasi dan leadership development");
    } else {
      insights.push("💡 Fokus enterprise: innovation dan market dominance");
    }

    // Multi-area insights
    if (selectedAreas.length > 1) {
      insights.push(`🎯 Kombinasi ${selectedAreas.length} area fokus akan menciptakan sinergi optimal`);
    }

    // Industry-specific insights
    if (profileData.industry) {
      insights.push(`🏭 Template disesuaikan dengan karakteristik industri ${profileData.industry}`);
    }

    return insights.join("\n");
  };

  const getAlternativeRecommendations = () => {
    if (selectedAreas.length === 0 || !profileData.companySize) {
      return [];
    }

    const companySizeCategory = getCompanySizeCategory(profileData.companySize);
    const alternatives = [];

    // Generate alternative recommendations for each selected area
    selectedAreas.forEach((areaId) => {
      const template = (okrTemplates as any)[areaId]?.[companySizeCategory];
      if (template) {
        const area = goalAreas.find(a => a.id === areaId);
        alternatives.push({
          areaId,
          areaTitle: area?.title || areaId,
          ...template
        });
      }
    });

    return alternatives;
  };
  
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteOnboarding = async () => {
    setIsLoading(true);
    
    try {
      // Save onboarding data and create initial goals
      const onboardingData = {
        profileData,
        selectedAreas,
        goalTemplate: selectedTemplate,
        customizedGoal
      };
      
      const response = await fetch('/api/auth/complete-guided-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(onboardingData)
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      toast({
        variant: "default",
        title: "Selamat!",
        description: "Onboarding berhasil diselesaikan. Goal pertama Anda sudah dibuat!"
      });

      // Navigate to main app
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyelesaikan onboarding. Silakan coba lagi."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isStep1Valid = profileData.companyName && profileData.companyAddress && profileData.province && profileData.city && profileData.industry && profileData.role && profileData.companySize && profileData.referralSource;
  const isStep2Valid = selectedAreas.length > 0;
  const isStep3Valid = selectedTemplate && customizedGoal.objective;

  const renderStep1 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <User className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">Mini Profiling</CardTitle>
        <CardDescription>
          Bantu kami memahami konteks bisnis Anda untuk memberikan pengalaman yang lebih personal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="companyName" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Nama Perusahaan *
          </Label>
          <Input
            id="companyName"
            placeholder="Masukkan nama perusahaan..."
            value={profileData.companyName}
            onChange={(e) => setProfileData({...profileData, companyName: e.target.value})}
            className="bg-gray-50 border-gray-300"
          />
        </div>

        {/* Company Address */}
        <div className="space-y-2">
          <Label htmlFor="companyAddress" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Alamat Perusahaan *
          </Label>
          <Input
            id="companyAddress"
            placeholder="Masukkan alamat lengkap perusahaan..."
            value={profileData.companyAddress}
            onChange={(e) => setProfileData({...profileData, companyAddress: e.target.value})}
            className="bg-gray-50 border-gray-300"
          />
        </div>

        {/* Province and City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Province */}
          <div className="space-y-2">
            <Label htmlFor="province" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Provinsi *
            </Label>
            <Select
              value={profileData.province}
              onValueChange={(value) => {
                setProfileData({
                  ...profileData, 
                  province: value,
                  city: "" // Reset city when province changes
                });
              }}
            >
              <SelectTrigger className="bg-gray-50 border-gray-300">
                <SelectValue placeholder="Pilih provinsi..." />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Kota/Kabupaten *
            </Label>
            <Select
              value={profileData.city}
              onValueChange={(value) => setProfileData({...profileData, city: value})}
              disabled={!profileData.province}
            >
              <SelectTrigger className="bg-gray-50 border-gray-300">
                <SelectValue placeholder={profileData.province ? "Pilih kota/kabupaten..." : "Pilih provinsi terlebih dahulu"} />
              </SelectTrigger>
              <SelectContent>
                {profileData.province && citiesByProvince[profileData.province]?.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Industry Type */}
        <div className="space-y-2">
          <Label htmlFor="industryType" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Jenis Industri *
          </Label>
          <Select
            value={profileData.industry}
            onValueChange={(value) => setProfileData({...profileData, industry: value})}
          >
            <SelectTrigger className="bg-gray-50 border-gray-300">
              <SelectValue placeholder="Pilih jenis industri" />
            </SelectTrigger>
            <SelectContent>
              {industryTypes.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company Size */}
        <div className="space-y-2">
          <Label htmlFor="companySize" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Ukuran Perusahaan *
          </Label>
          <Select
            value={profileData.companySize}
            onValueChange={(value) => setProfileData({...profileData, companySize: value})}
          >
            <SelectTrigger className="bg-gray-50 border-gray-300">
              <SelectValue placeholder="Pilih ukuran perusahaan" />
            </SelectTrigger>
            <SelectContent>
              {companySizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label htmlFor="position" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Posisi/Jabatan *
          </Label>
          <Select
            value={profileData.role}
            onValueChange={(value) => setProfileData({...profileData, role: value})}
          >
            <SelectTrigger className="bg-gray-50 border-gray-300">
              <SelectValue placeholder="Pilih posisi Anda" />
            </SelectTrigger>
            <SelectContent>
              {positionOptions.map((position) => (
                <SelectItem key={position} value={position}>
                  {position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Referral Source */}
        <div className="space-y-2">
          <Label htmlFor="referralSource" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Dari mana Anda mengetahui kami? *
          </Label>
          <Select
            value={profileData.referralSource}
            onValueChange={(value) => setProfileData({...profileData, referralSource: value})}
          >
            <SelectTrigger className="bg-gray-50 border-gray-300">
              <SelectValue placeholder="Pilih sumber referral" />
            </SelectTrigger>
            <SelectContent>
              {referralSources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main Goal */}
        <div className="space-y-2">
          <Label htmlFor="mainGoal" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Apa tujuan utama Anda dalam 6 bulan ke depan?
          </Label>
          <Textarea
            id="mainGoal"
            value={profileData.mainGoal}
            onChange={(e) => setProfileData({...profileData, mainGoal: e.target.value})}
            placeholder="Misalnya: Meningkatkan penjualan 50%, mengoptimalkan operasional, membangun tim yang solid..."
            className="mt-2 bg-gray-50 border-gray-300"
            rows={3}
          />
          <p className="text-sm text-gray-500">
            Tips: Deskripsikan tujuan spesifik yang ingin dicapai untuk membantu kami memberikan rekomendasi yang tepat
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Target className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">Pilih Area Fokus</CardTitle>
        <CardDescription>
          Fokus pada pain point utama yang ingin Anda selesaikan. Pilih 1-3 area yang paling prioritas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goalAreas.map((area) => (
            <Card 
              key={area.id}
              className={`cursor-pointer transition-all ${
                selectedAreas.includes(area.id) 
                  ? 'ring-2 ring-orange-500 bg-orange-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                if (selectedAreas.includes(area.id)) {
                  setSelectedAreas(selectedAreas.filter(id => id !== area.id));
                } else if (selectedAreas.length < 3) {
                  setSelectedAreas([...selectedAreas, area.id]);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={area.color}>
                    {area.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{area.title}</h3>
                      {selectedAreas.includes(area.id) && (
                        <Check className="h-5 w-5 text-orange-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{area.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {selectedAreas.length > 0 && (
          <div className="mt-6 p-4 bg-orange-50 rounded-lg">
            <h4 className="font-medium text-orange-800 mb-2">Area yang dipilih:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedAreas.map((areaId) => {
                const area = goalAreas.find(a => a.id === areaId);
                return (
                  <Badge key={areaId} variant="secondary" className="bg-orange-100 text-orange-800">
                    {area?.title}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep3 = () => {
    const intelligentRecommendation = getIntelligentRecommendation();
    const insights = getRecommendationInsights();
    
    // Auto-populate with intelligent recommendation if not already set
    if (intelligentRecommendation && !customizedGoal.objective) {
      setCustomizedGoal({
        objective: intelligentRecommendation.objective,
        keyResults: [...intelligentRecommendation.keyResults]
      });
    }

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Wand2 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Goal Builder</CardTitle>
          <CardDescription>
            Kami sudah menyiapkan template goal berdasarkan pilihan Anda. Silakan sesuaikan dengan kebutuhan spesifik.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Intelligent Recommendation Display */}
          {intelligentRecommendation && (
            <div className="space-y-4">
              {/* Main Recommendation */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Wand2 className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Rekomendasi Cerdas untuk Anda:</h4>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-blue-900">{intelligentRecommendation.objective}</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {intelligentRecommendation.keyResults.map((kr, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{kr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Insights and Context */}
              {insights && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    <h4 className="font-medium text-orange-800">Mengapa Rekomendasi Ini Cocok?</h4>
                  </div>
                  <div className="text-sm text-orange-700 whitespace-pre-line">
                    {insights}
                  </div>
                </div>
              )}

              {/* Alternative Templates */}
              {selectedAreas.length > 1 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Eye className="h-5 w-5 text-gray-600" />
                    <h4 className="font-medium text-gray-800">Template Alternatif per Area:</h4>
                  </div>
                  <div className="space-y-3">
                    {getAlternativeRecommendations().map((alt, index) => (
                      <div key={alt.areaId} className="bg-white p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-800">{alt.areaTitle}</h5>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCustomizedGoal({
                                objective: alt.objective,
                                keyResults: [...alt.keyResults]
                              });
                            }}
                          >
                            Gunakan Template
                          </Button>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">{alt.objective}</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {alt.keyResults.slice(0, 2).map((kr, krIndex) => (
                            <li key={krIndex}>• {kr}</li>
                          ))}
                          {alt.keyResults.length > 2 && (
                            <li className="text-gray-500">... +{alt.keyResults.length - 2} lainnya</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objective" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objective (Tujuan Utama) *
              </Label>
              <Input
                id="objective"
                value={customizedGoal.objective}
                onChange={(e) => setCustomizedGoal({...customizedGoal, objective: e.target.value})}
                placeholder="Masukkan tujuan utama Anda..."
                className="bg-gray-50 border-gray-300"
              />
              <p className="text-sm text-gray-500">
                Tips: Gunakan kata kerja yang jelas dan angka target yang spesifik
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Key Results (Hasil Kunci)
              </Label>
              <div className="space-y-3">
                {customizedGoal.keyResults.map((kr, index) => (
                  <div key={index}>
                    <Input
                      value={kr}
                      onChange={(e) => {
                        const newKRs = [...customizedGoal.keyResults];
                        newKRs[index] = e.target.value;
                        setCustomizedGoal({...customizedGoal, keyResults: newKRs});
                      }}
                      placeholder={`Key Result ${index + 1}...`}
                      className="bg-gray-50 border-gray-300"
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Key Results harus terukur dan spesifik. Contoh: "Meningkatkan penjualan menjadi Rp 100 juta per bulan"
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Pertanyaan Pemandu:</h4>
            <p className="text-sm text-gray-600">
              "Apa hasil konkret yang ingin Anda capai dalam 3 bulan ke depan? 
              Bagaimana Anda akan tahu bahwa goal ini berhasil tercapai?"
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStep4 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <Eye className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">Preview & Simulasi</CardTitle>
        <CardDescription>
          Lihat bagaimana goal Anda akan tampil dalam sistem dan simulasi progress 7 hari ke depan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goal Preview */}
        <div className="border rounded-lg p-4 bg-gradient-to-r from-orange-50 to-orange-100">
          <h3 className="font-bold text-lg text-orange-800 mb-3">
            {customizedGoal.objective || "Objective Anda"}
          </h3>
          <div className="space-y-2">
            {customizedGoal.keyResults.map((kr, index) => (
              kr && (
                <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">{kr}</span>
                  <div className="ml-auto bg-orange-200 px-2 py-1 rounded text-xs">
                    0% → 100%
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* 7-Day Progress Simulation */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-3">Simulasi Progress 7 Hari ke Depan:</h4>
          <div className="space-y-3">
            {[
              { day: "Hari 1", progress: 10, activity: "Setup awal dan planning" },
              { day: "Hari 2", progress: 20, activity: "Implementasi fase pertama" },
              { day: "Hari 3", progress: 35, activity: "Review dan optimasi" },
              { day: "Hari 4", progress: 50, activity: "Milestone pertama tercapai" },
              { day: "Hari 5", progress: 65, activity: "Akselerasi implementasi" },
              { day: "Hari 6", progress: 80, activity: "Fine-tuning dan testing" },
              { day: "Hari 7", progress: 90, activity: "Evaluasi mingguan" }
            ].map((item) => (
              <div key={item.day} className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-blue-700">
                  {item.day}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Progress value={item.progress} className="flex-1" />
                    <span className="text-sm font-medium w-10">{item.progress}%</span>
                  </div>
                  <p className="text-xs text-gray-600">{item.activity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Yang Akan Anda Dapatkan:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>✓ Dashboard real-time untuk tracking progress</li>
            <li>✓ Notifikasi dan reminder otomatis</li>
            <li>✓ Report mingguan dan bulanan</li>
            <li>✓ Kolaborasi tim yang terstruktur</li>
            <li>✓ Analytics untuk pengambilan keputusan</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header with Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Goal Setup - Guided</h1>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Step {currentStep} of {totalSteps}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span className={currentStep >= 1 ? "text-orange-600 font-medium" : ""}>
              Mini Profiling
            </span>
            <span className={currentStep >= 2 ? "text-orange-600 font-medium" : ""}>
              Pilih Area
            </span>
            <span className={currentStep >= 3 ? "text-orange-600 font-medium" : ""}>
              Goal Builder
            </span>
            <span className={currentStep >= 4 ? "text-orange-600 font-medium" : ""}>
              Preview
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="min-w-[120px] border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Sebelumnya
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !isStep1Valid) ||
                (currentStep === 2 && !isStep2Valid) ||
                (currentStep === 3 && !isStep3Valid)
              }
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white min-w-[120px]"
            >
              Selanjutnya
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCompleteOnboarding}
              disabled={isLoading || !isStep3Valid}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Selesai
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}