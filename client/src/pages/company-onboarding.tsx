import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import refokusLogo from "@assets/refokus_1751810711179.png";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Target,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  UserPlus,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Building,
  BarChart,
  MessageSquare,
  Zap,
  CalendarIcon,
  Loader2,
  DollarSign,
  Settings,
  HeartHandshake,
  Megaphone,
  FileCheck,
  ListTodo,
  PlayCircle,
  BellRing,
  Award,
  Rocket,
  Star,
  Globe,
  Lightbulb,
  TrendingDown,
} from "lucide-react";
import { ReminderSettings } from "@/components/ReminderSettings";
import { SimpleSelect } from "@/components/SimpleSelect";
import { type CompanyOnboardingData } from "@shared/schema";
import { useTour } from "@/hooks/useTour";

// Onboarding steps following the reference structure
const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Perkenalan",
    description: "Mari kenali profil perusahaan Anda terlebih dahulu",
    icon: Building,
  },
  {
    id: 2,
    title: "Fokus",
    description: "Bagian mana di bisnis Anda yang ingin ditingkatkan?",
    icon: Target,
  },
  {
    id: 3,
    title: "Buat Goal",
    description:
      "Pilih satu tujuan yang paling penting dan bermakna. Anda dapat merubahnya setelah onboarding selesai",
    icon: Lightbulb,
  },
  {
    id: 4,
    title: "Angka Target",
    description: "Bagaimana Anda tahu bahwa tujuan tadi benar-benar tercapai?",
    icon: TrendingUp,
  },
  {
    id: 5,
    title: "Pilih Inisiatif Prioritas",
    description:
      "Tentukan langkah-langkah strategis untuk mencapai angka target",
    icon: CheckCircle,
  },
  {
    id: 6,
    title: "Tugas untuk Inisiatif",
    description: "Tentukan tugas-tugas yang harus dikerjakan",
    icon: BarChart,
  },
  {
    id: 7,
    title: "Pilih Ritme",
    description: "Seberapa sering Anda ingin update progress?",
    icon: Clock,
  },
  {
    id: 8,
    title: "Ringkasan",
    description:
      "Lihat ringkasan dari goal dan strategi eksekusi yang sudah anda buat",
    icon: MessageSquare,
  },
];

interface OnboardingData extends CompanyOnboardingData {
  // All fields are already defined in CompanyOnboardingData schema
}

// Custom hook for typing effect
const useTypingEffect = (text: string, speed: number = 30) => {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typewriterRef.current) {
      clearTimeout(typewriterRef.current);
    }

    setDisplayText("");
    setIsTyping(true);

    let currentIndex = 0;
    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
        typewriterRef.current = setTimeout(typeNextChar, speed);
      } else {
        setIsTyping(false);
      }
    };

    // Start typing after a brief delay
    typewriterRef.current = setTimeout(typeNextChar, 100);

    return () => {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
    };
  }, [text, speed]);

  return { displayText, isTyping };
};

export default function CompanyOnboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { startTour } = useTour();

  // Fetch organization data for company details
  const { data: organizationData } = useQuery({
    queryKey: ["/api/my-organization-with-role"],
    enabled: !!user,
  });
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    currentStep: 0, // Start at welcome screen
    completedSteps: [],
    companyName: "",
    companyAddress: "",
    province: "",
    city: "",
    industryType: "",
    companySize: "",
    position: "",
    referralSource: "",
    teamFocus: "",
    cycleDuration: "",
    cycleStartDate: "",
    cycleEndDate: "",
    objective: "",
    keyResults: [],
    cadence: "",
    reminderTime: "",
    reminderDay: "",
    reminderDate: "",
    invitedMembers: [],
    initiatives: [],
    tasks: [],
    firstCheckIn: "",
    isCompleted: false,
  });

  // Options for searchable select boxes
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
    Aceh: [
      "Banda Aceh",
      "Sabang",
      "Langsa",
      "Lhokseumawe",
      "Subulussalam",
      "Aceh Besar",
      "Aceh Jaya",
      "Aceh Selatan",
      "Aceh Singkil",
      "Aceh Tamiang",
      "Aceh Tengah",
      "Aceh Tenggara",
      "Aceh Timur",
      "Aceh Utara",
      "Bener Meriah",
      "Bireuen",
      "Gayo Lues",
      "Nagan Raya",
      "Pidie",
      "Pidie Jaya",
      "Simeulue",
    ],
    "DKI Jakarta": [
      "Kota Jakarta Barat",
      "Kota Jakarta Pusat", 
      "Kota Jakarta Selatan",
      "Kota Jakarta Timur",
      "Kota Jakarta Utara",
      "Kabupaten Kepulauan Seribu",
    ],
    "Jawa Barat": [
      "Kota Bandung",
      "Kabupaten Bandung",
      "Kabupaten Bandung Barat",
      "Kota Bekasi",
      "Kabupaten Bekasi",
      "Kota Bogor",
      "Kabupaten Bogor",
      "Kota Cirebon",
      "Kabupaten Cirebon",
      "Kota Depok",
      "Kabupaten Sukabumi",
      "Kota Sukabumi",
      "Kota Tasikmalaya",
      "Kabupaten Tasikmalaya",
      "Kabupaten Karawang",
      "Kabupaten Purwakarta",
      "Kabupaten Subang",
      "Kabupaten Sumedang",
      "Kabupaten Indramayu",
      "Kabupaten Majalengka",
      "Kabupaten Kuningan",
      "Kabupaten Ciamis",
      "Kabupaten Pangandaran",
      "Kabupaten Garut",
      "Kabupaten Cianjur",
      "Kota Banjar",
    ],
    "Jawa Tengah": [
      "Kota Semarang",
      "Kabupaten Semarang",
      "Kota Surakarta",
      "Kota Magelang",
      "Kabupaten Magelang",
      "Kota Salatiga",
      "Kota Pekalongan",
      "Kabupaten Pekalongan",
      "Kota Tegal",
      "Kabupaten Tegal",
      "Kabupaten Kudus",
      "Kabupaten Purworejo",
      "Kabupaten Kebumen",
      "Kabupaten Cilacap",
      "Kabupaten Banyumas",
      "Kabupaten Purbalingga",
      "Kabupaten Banjarnegara",
      "Kabupaten Wonosobo",
      "Kabupaten Temanggung",
      "Kabupaten Kendal",
      "Kabupaten Demak",
      "Kabupaten Grobogan",
      "Kabupaten Blora",
      "Kabupaten Rembang",
      "Kabupaten Pati",
      "Kabupaten Jepara",
      "Kabupaten Boyolali",
      "Kabupaten Klaten",
      "Kabupaten Sukoharjo",
      "Kabupaten Karanganyar",
      "Kabupaten Sragen",
      "Kabupaten Wonogiri",
      "Kabupaten Brebes",
      "Kabupaten Batang",
      "Kabupaten Pemalang",
    ],
    "Jawa Timur": [
      "Kota Surabaya",
      "Kota Malang",
      "Kabupaten Malang",
      "Kota Kediri",
      "Kabupaten Kediri",
      "Kota Blitar",
      "Kabupaten Blitar",
      "Kota Madiun",
      "Kabupaten Madiun",
      "Kota Pasuruan",
      "Kabupaten Pasuruan",
      "Kota Probolinggo",
      "Kabupaten Probolinggo",
      "Kota Mojokerto",
      "Kabupaten Mojokerto",
      "Kota Batu",
      "Kabupaten Sidoarjo",
      "Kabupaten Gresik",
      "Kabupaten Lamongan",
      "Kabupaten Bojonegoro",
      "Kabupaten Tuban",
      "Kabupaten Jombang",
      "Kabupaten Nganjuk",
      "Kabupaten Magetan",
      "Kabupaten Ngawi",
      "Kabupaten Pacitan",
      "Kabupaten Ponorogo",
      "Kabupaten Trenggalek",
      "Kabupaten Tulungagung",
      "Kabupaten Lumajang",
      "Kabupaten Jember",
      "Kabupaten Bondowoso",
      "Kabupaten Situbondo",
      "Kabupaten Banyuwangi",
      "Kabupaten Sumenep",
      "Kabupaten Pamekasan",
      "Kabupaten Sampang",
      "Kabupaten Bangkalan",
    ],
    Banten: [
      "Kota Tangerang",
      "Kota Tangerang Selatan",
      "Kota Serang",
      "Kota Cilegon",
      "Kabupaten Tangerang",
      "Kabupaten Serang",
      "Kabupaten Lebak",
      "Kabupaten Pandeglang",
    ],
    Bali: [
      "Kota Denpasar",
      "Kabupaten Badung",
      "Kabupaten Gianyar",
      "Kabupaten Tabanan",
      "Kabupaten Klungkung",
      "Kabupaten Bangli",
      "Kabupaten Karangasem",
      "Kabupaten Buleleng",
      "Kabupaten Jembrana",
    ],
    "Sumatera Utara": [
      "Medan",
      "Binjai",
      "Tebing Tinggi",
      "Pematang Siantar",
      "Tanjung Balai",
      "Sibolga",
      "Padang Sidempuan",
    ],
    "Sumatera Barat": [
      "Padang",
      "Bukittinggi",
      "Padang Panjang",
      "Payakumbuh",
      "Sawahlunto",
      "Solok",
      "Pariaman",
    ],
    "Sumatera Selatan": [
      "Palembang",
      "Prabumulih",
      "Pagar Alam",
      "Lubuk Linggau",
      "Lahat",
      "Muara Enim",
    ],
    Lampung: [
      "Bandar Lampung",
      "Metro",
      "Lampung Selatan",
      "Lampung Tengah",
      "Lampung Utara",
      "Lampung Timur",
    ],
    "Kalimantan Timur": [
      "Samarinda",
      "Balikpapan",
      "Bontang",
      "Kutai Kartanegara",
      "Berau",
      "Kutai Barat",
    ],
    "Kalimantan Selatan": [
      "Banjarmasin",
      "Banjarbaru",
      "Kotabaru",
      "Banjar",
      "Barito Kuala",
      "Tapin",
    ],
    "Sulawesi Selatan": [
      "Makassar",
      "Palopo",
      "Parepare",
      "Gowa",
      "Takalar",
      "Jeneponto",
      "Bantaeng",
    ],

    Riau: [
      "Pekanbaru",
      "Dumai",
      "Kampar",
      "Rokan Hulu",
      "Rokan Hilir",
      "Siak",
      "Kuantan Singingi",
      "Indragiri Hulu",
      "Indragiri Hilir",
      "Pelalawan",
      "Bengkalis",
    ],
    "Kepulauan Riau": [
      "Batam",
      "Tanjung Pinang",
      "Bintan",
      "Karimun",
      "Lingga",
      "Natuna",
      "Kepulauan Anambas",
    ],
    Jambi: [
      "Jambi",
      "Sungai Penuh",
      "Batanghari",
      "Muaro Jambi",
      "Tanjung Jabung Timur",
      "Tanjung Jabung Barat",
      "Tebo",
      "Bungo",
      "Sarolangun",
      "Merangin",
      "Kerinci",
    ],
    Bengkulu: [
      "Bengkulu",
      "Bengkulu Selatan",
      "Rejang Lebong",
      "Bengkulu Utara",
      "Kaur",
      "Seluma",
      "Mukomuko",
      "Lebong",
      "Kepahiang",
      "Bengkulu Tengah",
    ],
    "Bangka Belitung": [
      "Pangkal Pinang",
      "Bangka",
      "Belitung",
      "Bangka Barat",
      "Bangka Tengah",
      "Bangka Selatan",
      "Belitung Timur",
    ],
    "DI Yogyakarta": [
      "Yogyakarta",
      "Bantul",
      "Gunung Kidul",
      "Kulon Progo",
      "Sleman",
    ],
    "Nusa Tenggara Barat": [
      "Mataram",
      "Bima",
      "Lombok Barat",
      "Lombok Tengah",
      "Lombok Timur",
      "Sumbawa",
      "Dompu",
      "Lombok Utara",
      "Sumbawa Barat",
    ],
    "Nusa Tenggara Timur": [
      "Kupang",
      "Ende",
      "Manggarai",
      "Timor Tengah Selatan",
      "Timor Tengah Utara",
      "Belu",
      "Alor",
      "Lembata",
      "Flores Timur",
      "Sikka",
      "Nagekeo",
      "Manggarai Barat",
      "Rote Ndao",
      "Manggarai Timur",
      "Sumba Timur",
      "Sumba Barat",
      "Sumba Tengah",
      "Sumba Barat Daya",
      "Malaka",
    ],
    "Kalimantan Barat": [
      "Pontianak",
      "Singkawang",
      "Sambas",
      "Bengkayang",
      "Landak",
      "Sanggau",
      "Ketapang",
      "Sintang",
      "Kapuas Hulu",
      "Sekadau",
      "Melawi",
      "Kayong Utara",
      "Kubu Raya",
    ],
    "Kalimantan Tengah": [
      "Palangka Raya",
      "Kotawaringin Barat",
      "Kotawaringin Timur",
      "Kapuas",
      "Barito Selatan",
      "Barito Utara",
      "Sukamara",
      "Lamandau",
      "Seruyan",
      "Katingan",
      "Pulang Pisau",
      "Gunung Mas",
      "Barito Timur",
      "Murung Raya",
    ],
    "Kalimantan Utara": [
      "Tarakan",
      "Bulungan",
      "Malinau",
      "Nunukan",
      "Tana Tidung",
    ],
    "Sulawesi Utara": [
      "Manado",
      "Bitung",
      "Tomohon",
      "Kotamobagu",
      "Bolaang Mongondow",
      "Minahasa",
      "Kepulauan Sangihe",
      "Kepulauan Talaud",
      "Minahasa Selatan",
      "Minahasa Utara",
      "Bolaang Mongondow Utara",
      "Siau Tagulandang Biaro",
      "Minahasa Tenggara",
      "Bolaang Mongondow Selatan",
      "Bolaang Mongondow Timur",
    ],
    Gorontalo: [
      "Gorontalo",
      "Boalemo",
      "Gorontalo Utara",
      "Bone Bolango",
      "Pohuwato"
    ],
    "Sulawesi Tengah": [
      "Palu",
      "Banggai",
      "Banggai Kepulauan",
      "Morowali",
      "Poso",
      "Donggala",
      "Toli-Toli",
      "Buol",
      "Parimo",
      "Tojo Una-Una",
      "Sigi",
      "Banggai Laut",
      "Morowali Utara",
    ],
    "Sulawesi Barat": [
      "Mamuju",
      "Polewali Mandar",
      "Mamasa",
      "Majene",
      "Mamuju Utara",
      "Mamuju Tengah",
    ],
    "Sulawesi Tenggara": [
      "Kendari",
      "Bau-Bau",
      "Konawe",
      "Kolaka",
      "Konawe Selatan",
      "Bombana",
      "Wakatobi",
      "Kolaka Utara",
      "Buton Utara",
      "Konawe Utara",
      "Kolaka Timur",
      "Konawe Kepulauan",
      "Muna",
      "Buton",
      "Muna Barat",
      "Buton Tengah",
      "Buton Selatan",
    ],
    Maluku: [
      "Ambon",
      "Tual",
      "Maluku Tengah",
      "Buru",
      "Kepulauan Aru",
      "Seram Bagian Barat",
      "Seram Bagian Timur",
      "Maluku Tenggara",
      "Maluku Tenggara Barat",
      "Buru Selatan",
    ],
    "Maluku Utara": [
      "Ternate",
      "Tidore Kepulauan",
      "Halmahera Barat",
      "Halmahera Tengah",
      "Kepulauan Sula",
      "Halmahera Selatan",
      "Halmahera Utara",
      "Halmahera Timur",
      "Pulau Morotai",
      "Pulau Taliabu",
    ],
    "Papua Barat": [
      "Sorong",
      "Fak-Fak",
      "Manokwari",
      "Sorong Selatan",
      "Raja Ampat",
      "Tambrauw",
      "Maybrat",
      "Manokwari Selatan",
      "Pegunungan Arfak",
      "Teluk Bintuni",
      "Teluk Wondama",
      "Kaimana",
    ],
    Papua: [
      "Jayapura",
      "Biak Numfor",
      "Nabire",
      "Puncak Jaya",
      "Paniai",
      "Mimika",
      "Merauke",
      "Mappi",
      "Asmat",
      "Yahukimo",
      "Pegunungan Bintang",
      "Tolikara",
      "Sarmi",
      "Keerom",
      "Waropen",
      "Supiori",
      "Mamberamo Raya",
      "Nduga",
      "Lanny Jaya",
      "Mamberamo Tengah",
      "Yalimo",
      "Puncak",
      "Dogiyai",
      "Intan Jaya",
      "Deiyai",
    ],
    "Papua Tengah": [
      "Nabire",
      "Paniai",
      "Puncak Jaya", 
      "Puncak",
      "Dogiyai",
      "Intan Jaya",
      "Deiyai",
      "Mimika",
    ],
    "Papua Selatan": [
      "Merauke",
      "Boven Digoel",
      "Mappi",
      "Asmat",
    ],
    "Papua Pegunungan": [
      "Jayawijaya",
      "Lanny Jaya",
      "Nduga",
      "Tolikara",
      "Yahukimo",
      "Pegunungan Bintang",
      "Yalimo",
      "Mamberamo Tengah",
    ],
    "Papua Barat Daya": [
      "Sorong",
      "Sorong Selatan",
      "Raja Ampat",
      "Tambrauw",
      "Maybrat",
    ]
  };

  const provinceOptions = provinces.map(province => ({
    value: province,
    label: province
  }));

  const getCityOptions = (selectedProvince: string) => {
    if (!selectedProvince || !citiesByProvince[selectedProvince]) {
      return [];
    }
    return citiesByProvince[selectedProvince].map(city => ({
      value: city,
      label: city
    }));
  };

  const cityOptions = getCityOptions(onboardingData.province || "");

  const industryOptions = [
    { value: "Teknologi Informasi", label: "Teknologi Informasi" },
    { value: "E-commerce", label: "E-commerce" },
    { value: "Fintech", label: "Fintech" },
    { value: "Pendidikan", label: "Pendidikan" },
    { value: "Kesehatan", label: "Kesehatan" },
    { value: "Manufaktur", label: "Manufaktur" },
    { value: "Retail", label: "Retail" },
    { value: "F&B", label: "F&B" },
    { value: "Properti", label: "Properti" },
    { value: "Otomotif", label: "Otomotif" },
    { value: "Media & Kreatif", label: "Media & Kreatif" },
    { value: "Konsultan", label: "Konsultan" },
    { value: "Perbankan", label: "Perbankan" },
    { value: "Asuransi", label: "Asuransi" },
    { value: "Lainnya", label: "Lainnya" },
  ];

  const companySizeOptions = [
    { value: "Solo (hanya saya)", label: "Solo (hanya saya)" },
    { value: "Tim kecil (2-10 orang)", label: "Tim kecil (2-10 orang)" },
    { value: "Tim menengah (11-50 orang)", label: "Tim menengah (11-50 orang)" },
    { value: "Perusahaan besar (50+ orang)", label: "Perusahaan besar (50+ orang)" },
  ];

  const positionOptions = [
    { value: "CEO/Founder", label: "CEO/Founder" },
    { value: "CTO/VP Engineering", label: "CTO/VP Engineering" },
    { value: "CMO/VP Marketing", label: "CMO/VP Marketing" },
    { value: "COO/VP Operations", label: "COO/VP Operations" },
    { value: "Manager", label: "Manager" },
    { value: "Team Lead", label: "Team Lead" },
    { value: "Senior Staff", label: "Senior Staff" },
    { value: "Staff", label: "Staff" },
    { value: "Konsultan", label: "Konsultan" },
    { value: "Freelancer", label: "Freelancer" },
    { value: "Lainnya", label: "Lainnya" },
  ];

  const referralOptions = [
    { value: "Google Search", label: "Google Search" },
    { value: "Media Sosial", label: "Media Sosial (Instagram, LinkedIn)" },
    { value: "Rekomendasi Teman", label: "Rekomendasi Teman/Kolega" },
    { value: "Event/Webinar", label: "Event/Webinar" },
    { value: "YouTube", label: "YouTube" },
    { value: "Blog/Artikel", label: "Blog/Artikel" },
    { value: "Iklan Online", label: "Iklan Online" },
    { value: "Word of Mouth", label: "Word of Mouth" },
    { value: "Partnership", label: "Partnership/Kemitraan" },
    { value: "Cold Email", label: "Cold Email/Sales" },
    { value: "Lainnya", label: "Lainnya" },
  ];

  // Error handling for ResizeObserver and other common errors
  useEffect(() => {
    const handleGlobalError = (e: ErrorEvent) => {
      if (e.message && typeof e.message === "string") {
        if (
          e.message.includes(
            "ResizeObserver loop completed with undelivered notifications",
          )
        ) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        if (e.message.includes("Non-Error promise rejection captured")) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        if (
          e.message.includes(
            "Cannot read properties of undefined (reading 'frame')",
          )
        ) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      if (e.reason && String(e.reason).includes("ResizeObserver")) {
        e.preventDefault();
        return false;
      }
    };

    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      const message = String(args[0] || "");
      if (
        message.includes(
          "ResizeObserver loop completed with undelivered notifications",
        ) ||
        message.includes("Non-Error promise rejection captured") ||
        message.includes(
          "Cannot read properties of undefined (reading 'frame')",
        )
      ) {
        return;
      }
      // Log important errors for debugging
      if (
        message.includes("completeOnboardingMutation") ||
        (message.includes("TypeError") && !message.includes("frame")) ||
        message.includes("ReferenceError")
      ) {
        console.log("🔍 Important error caught:", args);
      }
      originalConsoleError(...args);
    };

    console.warn = (...args) => {
      const message = String(args[0] || "");
      if (
        message.includes(
          "ResizeObserver loop completed with undelivered notifications",
        ) ||
        message.includes(
          "Cannot read properties of undefined (reading 'frame')",
        )
      ) {
        return;
      }
      originalConsoleWarn(...args);
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Fetch onboarding progress with optimized caching
  const { data: progress } = useQuery({
    queryKey: ["/api/onboarding/progress"],
    retry: false,
    staleTime: 30 * 1000, // 30 seconds cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchInterval: false, // Don't auto-refetch
  });

  // Update local state when progress data is loaded
  useEffect(() => {
    if (progress) {
      setOnboardingData((prevData) => ({
        ...prevData,
        ...progress,
        currentStep: progress.currentStep || 0, // Ensure it starts at 0 if no progress
      }));
    }
  }, [progress]);

  // Validation function for each step
  const validateStep = (
    step: number,
    data: OnboardingData,
  ): { isValid: boolean; message?: string } => {
    switch (step) {
      case 1:
        // Step 1 is now company profile form - validate all required fields
        if (!data.companyName?.trim()) {
          return {
            isValid: false,
            message: "Silakan isi nama perusahaan",
          };
        }
        if (!data.companyAddress?.trim()) {
          return {
            isValid: false,
            message: "Silakan isi alamat perusahaan",
          };
        }
        if (!data.province?.trim()) {
          return {
            isValid: false,
            message: "Silakan isi provinsi",
          };
        }
        if (!data.city?.trim()) {
          return {
            isValid: false,
            message: "Silakan isi kota",
          };
        }
        if (!data.industryType?.trim()) {
          return {
            isValid: false,
            message: "Silakan isi jenis industri",
          };
        }
        if (!data.companySize?.trim()) {
          return {
            isValid: false,
            message: "Silakan isi ukuran perusahaan",
          };
        }
        if (!data.position?.trim()) {
          return {
            isValid: false,
            message: "Silakan isi posisi Anda",
          };
        }
        if (!data.referralSource?.trim()) {
          return {
            isValid: false,
            message: "Silakan isi dari mana Anda tahu Refokus",
          };
        }
        break;
      case 2:
        if (!data.teamFocus) {
          return {
            isValid: false,
            message: "Silakan pilih fokus bisnis terlebih dahulu",
          };
        }
        break;
      case 3:
        if (!data.objective?.trim()) {
          return {
            isValid: false,
            message: "Silakan pilih atau tulis goal yang ingin dicapai",
          };
        }
        break;
      case 4:
        if (data.keyResults.length === 0) {
          return {
            isValid: false,
            message: "Silakan pilih minimal 1 angka target",
          };
        }
        break;
      case 5:
        if (data.initiatives.length === 0) {
          return {
            isValid: false,
            message: "Silakan pilih minimal 1 inisiatif prioritas",
          };
        }
        break;
      case 6:
        if (data.tasks.length === 0) {
          return {
            isValid: false,
            message: "Silakan pilih minimal 1 tugas untuk inisiatif",
          };
        }
        break;
      case 7:
        if (!data.cadence) {
          return { isValid: false, message: "Silakan pilih ritme check-in" };
        }
        if (!data.reminderTime) {
          return { isValid: false, message: "Silakan pilih waktu reminder" };
        }
        // Additional validation based on cadence type
        if (data.cadence === "mingguan" && !data.reminderDay) {
          return {
            isValid: false,
            message: "Silakan pilih hari reminder untuk check-in mingguan",
          };
        }
        if (data.cadence === "bulanan" && !data.reminderDate) {
          return {
            isValid: false,
            message: "Silakan pilih tanggal reminder untuk check-in bulanan",
          };
        }
        break;
      default:
        break;
    }
    return { isValid: true };
  };

  // Save onboarding progress
  const saveProgressMutation = useMutation({
    mutationFn: async (data: Partial<OnboardingData>) => {
      return apiRequest("PUT", "/api/onboarding/progress", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
    },
    onError: (error) => {
      console.error("Frontend mutation error:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan progress onboarding",
        variant: "destructive",
      });
    },
  });

  // Complete onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      console.log("🔄 Sending onboarding completion with data:", {
        cadence: onboardingData.cadence,
        reminderTime: onboardingData.reminderTime,
        reminderDay: onboardingData.reminderDay,
        reminderDate: onboardingData.reminderDate,
        teamFocus: onboardingData.teamFocus,
        fullData: onboardingData,
      });
      return apiRequest("POST", "/api/onboarding/complete", { onboardingData });
    },
    onSuccess: () => {
      // Set redirecting state first to prevent double clicks
      setIsRedirecting(true);

      toast({
        title: "Selamat!",
        description:
          "Onboarding berhasil diselesaikan. Goal pertama telah dibuat!",
        variant: "success",
      });

      // Immediate cache invalidation
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });

      // Redirect using wouter
      console.log("🔄 Redirecting to dashboard using wouter...");
      navigate("/");
      console.log("✅ Wouter navigation completed successfully");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal menyelesaikan onboarding",
        variant: "destructive",
      });
    },
  });

  const currentStepData = ONBOARDING_STEPS.find(
    (step) => step.id === onboardingData.currentStep,
  );

  // Welcome screen data
  const welcomeScreenData = {
    title: "",
    description:
      "Tim hebat bukan hanya tentang kerja keras, tapi tentang kerja yang selaras dan terarah. Refokus hadir untuk menyelaraskan tujuan, waktu, dan tindakan tim agar benar-benar bergerak menuju tujuan.",
    icon: Sparkles,
  };

  const progressPercentage =
    onboardingData.currentStep === 0
      ? 0
      : onboardingData.currentStep === 8
        ? 100 // Show 100% when at the final step (step 8)
        : (onboardingData.currentStep / ONBOARDING_STEPS.length) * 100;

  // Dynamic color system based on progress
  const getProgressColor = () => {
    if (progressPercentage === 0) return "from-gray-400 to-gray-500"; // Start - Gray
    if (progressPercentage <= 25) return "from-red-400 to-red-500"; // 0-25% - Red
    if (progressPercentage <= 50) return "from-orange-400 to-orange-500"; // 25-50% - Orange
    if (progressPercentage <= 75) return "from-yellow-400 to-yellow-500"; // 50-75% - Yellow
    if (progressPercentage < 100) return "from-blue-400 to-blue-500"; // 75-99% - Blue
    return "from-green-400 to-green-500"; // 100% - Green
  };

  const getContainerBackgroundColor = () => {
    if (progressPercentage === 0)
      return "from-gray-50 to-gray-100 border-gray-200"; // Start - Gray
    if (progressPercentage <= 25)
      return "from-red-50 to-pink-50 border-red-200"; // 0-25% - Red
    if (progressPercentage <= 50)
      return "from-orange-50 to-yellow-50 border-orange-200"; // 25-50% - Orange
    if (progressPercentage <= 75)
      return "from-yellow-50 to-amber-50 border-yellow-200"; // 50-75% - Yellow
    if (progressPercentage < 100)
      return "from-blue-50 to-indigo-50 border-blue-200"; // 75-99% - Blue
    return "from-green-50 to-emerald-50 border-green-200"; // 100% - Green
  };

  const handleNext = () => {
    // Validate current step before proceeding (skip validation for welcome screen)
    if (onboardingData.currentStep > 0) {
      const validation = validateStep(
        onboardingData.currentStep,
        onboardingData,
      );
      if (!validation.isValid) {
        toast({
          title: "Input tidak lengkap",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }
    }

    if (onboardingData.currentStep < 8) {
      // Create proper completedSteps array based on currentStep (fixes corruption)
      const newCurrentStep = onboardingData.currentStep + 1;
      const newCompletedSteps = newCurrentStep === 1 
        ? [] // Welcome screen (step 0) doesn't count as completed
        : Array.from({length: newCurrentStep - 1}, (_, i) => i + 1); // Steps 1 through currentStep-1

      const newData = {
        ...onboardingData,
        currentStep: newCurrentStep,
        completedSteps: newCompletedSteps,
      };
      setOnboardingData(newData);
      
      // Only save progress if we're past the welcome screen
      if (onboardingData.currentStep > 0) {
        console.log("Saving progress data:", newData);
        saveProgressMutation.mutate(newData);
      }

      // Scroll to top to show virtual assistant
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handlePrevious = () => {
    if (onboardingData.currentStep > 0) {
      const newData = {
        ...onboardingData,
        currentStep: onboardingData.currentStep - 1,
      };
      setOnboardingData(newData);
      if (onboardingData.currentStep > 1) {
        saveProgressMutation.mutate(newData);
      }

      // Scroll to top to show virtual assistant
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleComplete = async () => {
    // Prevent double clicks
    if (completeOnboardingMutation.isPending || isRedirecting) {
      return;
    }

    const finalData = {
      ...onboardingData,
      completedSteps: Array.from(new Set([
        ...onboardingData.completedSteps,
        onboardingData.currentStep,
      ])),
      isCompleted: true,
    };
    
    setOnboardingData(finalData);
    
    try {
      // Complete the onboarding process
      await completeOnboardingMutation.mutateAsync();
      
      // Set onboarding completed flag to trigger welcome screen flow
      localStorage.setItem('onboarding-completed', 'true');
      
      // Start the tour system (which will show welcome screen first)
      startTour();
      
      // Navigate to dashboard
      setTimeout(() => {
        setIsRedirecting(true);
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }, 500);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  const renderStepContent = () => {
    switch (onboardingData.currentStep) {
      case 0: // Welcome Screen
        return <div className="space-y-6"></div>;
      case 1: // Perkenalan - Company Profile Form
        return (
          <div className="space-y-6">
            

            {/* Nama Perusahaan - full width row */}
            <div className="space-y-1">
              <Label htmlFor="companyName">Nama Perusahaan</Label>
              <Input
                id="companyName"
                value={onboardingData.companyName || organizationData?.organization?.name || ""}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    companyName: e.target.value,
                  })
                }
                placeholder="Masukkan nama perusahaan"
              />
            </div>

            {/* Alamat Perusahaan - full width row */}
            <div className="space-y-1">
              <Label htmlFor="companyAddress">Alamat Perusahaan</Label>
              <Input
                id="companyAddress"
                value={onboardingData.companyAddress || ""}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    companyAddress: e.target.value,
                  })
                }
                placeholder="Alamat lengkap perusahaan"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Provinsi */}
              <div className="space-y-1">
                <Label>Provinsi</Label>
                <SimpleSelect
                  options={provinceOptions}
                  value={onboardingData.province || ""}
                  placeholder="Pilih provinsi"
                  searchPlaceholder="Cari provinsi..."
                  onSelect={(value) =>
                    setOnboardingData({
                      ...onboardingData,
                      province: value,
                      city: "", // Reset city when province changes
                    })
                  }
                />
              </div>

              {/* Kota */}
              <div className="space-y-1">
                <Label>Kota</Label>
                <SimpleSelect
                  options={cityOptions}
                  value={onboardingData.city || ""}
                  placeholder={
                    onboardingData.province
                      ? "Pilih kota"
                      : "Pilih provinsi terlebih dahulu"
                  }
                  searchPlaceholder="Cari kota..."
                  disabled={!onboardingData.province}
                  onSelect={(value) =>
                    setOnboardingData({
                      ...onboardingData,
                      city: value,
                    })
                  }
                />
              </div>

              {/* Industri */}
              <div className="space-y-1">
                <Label>Jenis Industri</Label>
                <SimpleSelect
                  options={industryOptions}
                  value={onboardingData.industryType || ""}
                  placeholder="Pilih jenis industri"
                  searchPlaceholder="Cari industri..."
                  onSelect={(value) =>
                    setOnboardingData({
                      ...onboardingData,
                      industryType: value,
                    })
                  }
                />
              </div>

              {/* Ukuran Perusahaan */}
              <div className="space-y-1">
                <Label>Ukuran Perusahaan</Label>
                <SimpleSelect
                  options={companySizeOptions}
                  value={onboardingData.companySize || ""}
                  placeholder="Pilih ukuran perusahaan"
                  searchPlaceholder="Cari ukuran..."
                  onSelect={(value) =>
                    setOnboardingData({
                      ...onboardingData,
                      companySize: value,
                    })
                  }
                />
              </div>

              {/* Posisi */}
              <div className="space-y-1">
                <Label>Posisi Anda</Label>
                <SimpleSelect
                  options={positionOptions}
                  value={onboardingData.position || ""}
                  placeholder="Pilih posisi Anda"
                  searchPlaceholder="Cari posisi..."
                  onSelect={(value) =>
                    setOnboardingData({
                      ...onboardingData,
                      position: value,
                    })
                  }
                />
              </div>

              {/* Sumber Referral */}
              <div className="space-y-1">
                <Label>Tahu Refokus dari</Label>
                <SimpleSelect
                  options={referralOptions}
                  value={onboardingData.referralSource || ""}
                  placeholder="Pilih sumber referral"
                  searchPlaceholder="Cari sumber..."
                  onSelect={(value) =>
                    setOnboardingData({
                      ...onboardingData,
                      referralSource: value,
                    })
                  }
                />
              </div>
            </div>

            {/* Validation Message */}
            {(onboardingData.companyName &&
              onboardingData.companyAddress && 
              onboardingData.province && 
              onboardingData.city && 
              onboardingData.industryType &&
              onboardingData.companySize &&
              onboardingData.position &&
              onboardingData.referralSource) && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 mt-4">
                <p className="text-sm text-green-800 font-medium">
                  ✓ Profil perusahaan sudah lengkap! Lanjutkan ke fokus bisnis.
                </p>
              </div>
            )}
          </div>
        );

      case 2: // Fokus Tim
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                Pilih fokus bisnis Anda:
              </Label>
              <p className="text-sm text-gray-600">
                Pilih area yang paling ingin Anda tingkatkan dalam 1 - 3 bulan
                kedepan.
              </p>
            </div>
            <RadioGroup
              value={onboardingData.teamFocus}
              onValueChange={(value) =>
                setOnboardingData({ ...onboardingData, teamFocus: value })
              }
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.teamFocus === "penjualan"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({
                    ...onboardingData,
                    teamFocus: "penjualan",
                  })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value="penjualan"
                    id="penjualan"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <Label
                        htmlFor="penjualan"
                        className="font-medium cursor-pointer"
                      >
                        Tingkatkan Pendapatan
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Fokus pada peningkatan omzet dan penjualan
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.teamFocus === "operasional"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({
                    ...onboardingData,
                    teamFocus: "operasional",
                  })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value="operasional"
                    id="operasional"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Settings className="w-5 h-5 text-blue-600" />
                      <Label
                        htmlFor="operasional"
                        className="font-medium cursor-pointer"
                      >
                        Rapikan Operasional
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Optimalisasi proses, dan produktivitas
                      operasional
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.teamFocus === "customer_service"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({
                    ...onboardingData,
                    teamFocus: "customer_service",
                  })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value="customer_service"
                    id="customer_service"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <HeartHandshake className="w-5 h-5 text-purple-600" />
                      <Label
                        htmlFor="customer_service"
                        className="font-medium cursor-pointer"
                      >
                        Kembangkan Tim
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Peningkatan Kapasitas dan kinerja tim
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.teamFocus === "marketing"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({
                    ...onboardingData,
                    teamFocus: "marketing",
                  })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value="marketing"
                    id="marketing"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Rocket className="w-5 h-5 text-red-600" />
                      <Label
                        htmlFor="marketing"
                        className="font-medium cursor-pointer"
                      >
                        Ekspansi Bisnis
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Perluas pasar dan pengembangan produk
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>

            {onboardingData.teamFocus && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                  <p className="text-sm text-orange-800">
                    <strong>Fokus terpilih:</strong>{" "}
                    {onboardingData.teamFocus === "penjualan"
                      ? "Penjualan"
                      : onboardingData.teamFocus === "operasional"
                        ? "Operasional"
                        : onboardingData.teamFocus === "customer_service"
                          ? "Customer Service"
                          : onboardingData.teamFocus === "marketing"
                            ? "Marketing"
                            : ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 3: // Buat Objective
        const getObjectiveOptions = (teamFocus: string) => {
          const options: Record<string, string[]> = {
            penjualan: [
              "Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan",
              "Membangun basis pelanggan yang kuat dan loyal",
              "Mengoptimalkan konversi prospek menjadi pelanggan",
            ],
            operasional: [
              "Mencapai efisiensi operasional yang optimal dan berkelanjutan",
              "Mempercepat proses produksi dengan kualitas terjaga",
              "Mengoptimalkan biaya operasional tanpa mengurangi kualitas",
            ],
            customer_service: [
              "Mencapai kepuasan pelanggan yang luar biasa dan berkelanjutan",
              "Memberikan respon pelanggan yang cepat dan efektif",
              "Membangun loyalitas pelanggan dan advokasi yang tinggi",
            ],
            marketing: [
              "Meningkatkan kesadaran merek di pasar target",
              "Membangun komunitas yang aktif dan engaged di media sosial",
              "Menghasilkan lead berkualitas tinggi secara konsisten",
            ],
          };
          return options[teamFocus] || [];
        };

        const objectiveOptions = getObjectiveOptions(onboardingData.teamFocus || "");

        return (
          <div className="space-y-4">
            {objectiveOptions.length > 0 && (
              <div className="space-y-3">
                <Label>
                  Dari beberapa goal yang bisa dipilih, mana yang bisa anda
                  fokuskan supaya terjadi peningkatan {onboardingData.teamFocus}
                  :
                </Label>
                <RadioGroup
                  value={onboardingData.objective}
                  onValueChange={(value) =>
                    setOnboardingData({ ...onboardingData, objective: value })
                  }
                >
                  {objectiveOptions.map((option: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <RadioGroupItem
                        value={option}
                        id={`objective-${index}`}
                        className="mt-1"
                      />
                      <div className="flex items-start space-x-2 flex-1">
                        <Target className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <Label
                          htmlFor={`objective-${index}`}
                          className="cursor-pointer leading-relaxed"
                        >
                          {option}
                        </Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {onboardingData.objective &&
              objectiveOptions.includes(onboardingData.objective) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Goal terpilih:</strong> {onboardingData.objective}
                  </p>
                </div>
              )}
          </div>
        );

      case 4: // Ukuran Keberhasilan
        const getKeyResultOptions = (objective: string | undefined) => {
          if (!objective) return [];
          // Key Results untuk objective penjualan
          const salesKeyResults: Record<string, string[]> = {
            "Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan":
              [
                "Mencapai target penjualan Rp 500 juta per bulan",
                "Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta",
                "Menambah 100 transaksi baru setiap bulan",
              ],
            "Membangun basis pelanggan yang kuat dan loyal": [
              "Mendapatkan 100 pelanggan baru setiap bulan",
              "Mencapai conversion rate 15% dari lead ke customer",
              "Meningkatkan customer retention rate menjadi 85%",
            ],
            "Mengoptimalkan konversi prospek menjadi pelanggan": [
              "Mencapai conversion rate 25% dari total lead",
              "Mengurangi waktu follow-up lead menjadi maksimal 24 jam",
              "Meningkatkan kualitas lead scoring menjadi 80% akurat",
            ],
          };

          // Key Results untuk objective operasional
          const operationalKeyResults: Record<string, string[]> = {
            "Mencapai efisiensi operasional yang optimal dan berkelanjutan": [
              "Mengurangi waktu proses produksi menjadi 4 jam per unit",
              "Meningkatkan utilitas mesin menjadi 85%",
              "Mengurangi waste produksi menjadi maksimal 5%",
            ],
            "Mempercepat proses produksi dengan kualitas terjaga": [
              "Mencapai waktu siklus 3 jam per produk",
              "Meningkatkan throughput menjadi 50 unit per hari",
              "Mengurangi downtime mesin menjadi maksimal 2%",
            ],
            "Mengoptimalkan biaya operasional tanpa mengurangi kualitas": [
              "Menurunkan biaya per unit menjadi Rp 50,000",
              "Meningkatkan rasio efisiensi menjadi 90%",
              "Mengurangi biaya overhead sebesar 20%",
            ],
          };

          // Key Results untuk objective customer service
          const customerServiceKeyResults: Record<string, string[]> = {
            "Mencapai kepuasan pelanggan yang luar biasa dan berkelanjutan": [
              "Mencapai CSAT score 4.8/5 dalam survey bulanan",
              "Meningkatkan customer retention rate menjadi 95%",
              "Mengurangi complaint rate menjadi di bawah 1%",
            ],
            "Memberikan respon pelanggan yang cepat dan efektif": [
              "Mencapai rata-rata waktu respons 1 jam",
              "Meningkatkan tingkat respons pertama menjadi 95%",
              "Mencapai waktu penyelesaian maksimal 24 jam",
            ],
            "Membangun loyalitas pelanggan dan advokasi yang tinggi": [
              "Mencapai skor NPS 70+ dalam survei triwulanan",
              "Meningkatkan tingkat advokasi pelanggan menjadi 40%",
              "Mencapai tingkat rekomendasi pelanggan 80%",
            ],
          };

          // Key Results untuk objective marketing
          const marketingKeyResults: Record<string, string[]> = {
            "Meningkatkan kesadaran merek di pasar target": [
              "Mencapai brand recall 60% dalam market research",
              "Meningkatkan social media reach menjadi 100,000 per post",
              "Mencapai top-of-mind awareness 25% di kategori produk",
            ],
            "Membangun komunitas yang aktif dan engaged di media sosial": [
              "Mencapai 10,000 pengikut baru di Instagram",
              "Meningkatkan tingkat pertumbuhan pengikut 15% per bulan",
              "Mencapai tingkat engagement 8% di semua platform",
            ],
            "Menghasilkan lead berkualitas tinggi secara konsisten": [
              "Mencapai 500 qualified leads per bulan",
              "Meningkatkan lead quality score menjadi 85%",
              "Mencapai cost per lead di bawah Rp 100,000",
            ],
          };

          // Gabungkan semua key results
          const allKeyResults: Record<string, string[]> = {
            ...salesKeyResults,
            ...operationalKeyResults,
            ...customerServiceKeyResults,
            ...marketingKeyResults,
          };

          return allKeyResults[objective] || [];
        };

        const keyResultOptions = getKeyResultOptions(onboardingData.objective);
        const selectedKeyResults = onboardingData.keyResults.filter(
          (kr) => kr && kr.trim() !== "",
        );

        return (
          <div className="space-y-4">
            {keyResultOptions.length > 0 && (
              <div className="space-y-3">
                <Label>
                  Pilih Angka Target (Alat ukur kuantitatif) untuk mengetahui
                  kemajual Goal : "{onboardingData.objective}"
                </Label>
                <div className="space-y-2">
                  {keyResultOptions.map((option: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`keyresult-${index}`}
                        checked={selectedKeyResults.includes(option)}
                        onCheckedChange={(checked) => {
                          let newKeyResults = [...onboardingData.keyResults];
                          if (checked) {
                            newKeyResults.push(option);
                          } else {
                            newKeyResults = newKeyResults.filter(
                              (kr) => kr !== option,
                            );
                          }
                          setOnboardingData({
                            ...onboardingData,
                            keyResults: newKeyResults,
                          });
                        }}
                      />
                      <div className="flex items-start space-x-2 flex-1">
                        <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <Label
                          htmlFor={`keyresult-${index}`}
                          className="cursor-pointer leading-relaxed"
                        >
                          {option}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedKeyResults.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-800 font-medium">
                    Angka target terpilih:
                  </p>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  {selectedKeyResults.map((kr: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Star className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                      <span>{kr}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 7: // Pilih Cadence
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                Pilih frekuensi check-in progress:
              </Label>
              <p className="text-sm text-gray-600">
                Seberapa sering Anda ingin menerima reminder dan melakukan
                update progress goal?
              </p>
            </div>
            <RadioGroup
              value={onboardingData.cadence}
              onValueChange={(value) =>
                setOnboardingData({ ...onboardingData, cadence: value })
              }
              className="space-y-4"
            >
              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.cadence === "harian"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({ ...onboardingData, cadence: "harian" })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="harian" id="harian" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <BellRing className="w-5 h-5 text-red-600" />
                      <Label
                        htmlFor="harian"
                        className="font-medium cursor-pointer"
                      >
                        Setiap Hari
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Cocok untuk goal yang memerlukan perhatian harian dan
                      monitoring ketat
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.cadence === "mingguan"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({ ...onboardingData, cadence: "mingguan" })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value="mingguan"
                    id="mingguan"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <Label
                        htmlFor="mingguan"
                        className="font-medium cursor-pointer"
                      >
                        Setiap Minggu
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Ideal untuk goal jangka menengah dengan review progress
                      mingguan
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.cadence === "bulanan"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() =>
                  setOnboardingData({ ...onboardingData, cadence: "bulanan" })
                }
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value="bulanan"
                    id="bulanan"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CalendarIcon className="w-5 h-5 text-green-600" />
                      <Label
                        htmlFor="bulanan"
                        className="font-medium cursor-pointer"
                      >
                        Setiap Bulan
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Tepat untuk goal strategis dengan evaluasi bulanan yang
                      komprehensif
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
            {onboardingData.cadence && (
              <div className="space-y-3">
                {/* Harian - Waktu reminder */}
                {onboardingData.cadence === "harian" && (
                  <div className="space-y-3">
                    <Label htmlFor="reminder-time">
                      Waktu reminder harian:
                    </Label>
                    <div className="space-y-3">
                      {/* Common time options */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {[
                          { value: "08:00", label: "08:00 - Pagi" },
                          { value: "12:00", label: "12:00 - Siang" },
                          { value: "17:00", label: "17:00 - Sore" },
                          { value: "09:00", label: "09:00 - Pagi" },
                          { value: "15:00", label: "15:00 - Siang" },
                          { value: "19:00", label: "19:00 - Malam" },
                        ].map((timeOption) => (
                          <Button
                            key={timeOption.value}
                            variant={
                              onboardingData.reminderTime === timeOption.value
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setOnboardingData({
                                ...onboardingData,
                                reminderTime: timeOption.value,
                              })
                            }
                            className={
                              onboardingData.reminderTime === timeOption.value
                                ? "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white transition-all duration-300 transform hover:scale-105 shadow-md"
                                : "hover:bg-orange-50 hover:border-orange-300 text-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                            }
                          >
                            {timeOption.label}
                          </Button>
                        ))}
                      </div>

                      {/* Custom time input */}
                      <div className="space-y-3">
                        <Label className="text-sm text-gray-600">
                          Atau pilih waktu custom:
                        </Label>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          <div className="flex items-center space-x-2">
                            <Input
                              id="custom-time"
                              type="time"
                              value={onboardingData.reminderTime}
                              onChange={(e) =>
                                setOnboardingData({
                                  ...onboardingData,
                                  reminderTime: e.target.value,
                                })
                              }
                              className="w-32 cursor-pointer focus:ring-2 focus:ring-orange-500 transition-all duration-300 hover:shadow-md focus:shadow-lg focus:scale-[1.02]"
                              placeholder="HH:MM"
                              step="60"
                              min="00:00"
                              max="23:59"
                            />
                            <span className="text-sm text-gray-500">
                              Format: HH:MM
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mingguan - Hari dan waktu reminder */}
                {onboardingData.cadence === "mingguan" && (
                  <div className="space-y-4">
                    <Label>Pengaturan reminder mingguan:</Label>

                    {/* Pilih hari */}
                    <div className="space-y-3">
                      <Label className="text-sm text-gray-600">
                        Pilih hari reminder:
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                        {[
                          { value: "senin", label: "Senin" },
                          { value: "selasa", label: "Selasa" },
                          { value: "rabu", label: "Rabu" },
                          { value: "kamis", label: "Kamis" },
                          { value: "jumat", label: "Jumat" },
                          { value: "sabtu", label: "Sabtu" },
                          { value: "minggu", label: "Minggu" },
                        ].map((dayOption) => (
                          <Button
                            key={dayOption.value}
                            variant={
                              onboardingData.reminderDay === dayOption.value
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setOnboardingData({
                                ...onboardingData,
                                reminderDay: dayOption.value,
                              })
                            }
                            className={
                              onboardingData.reminderDay === dayOption.value
                                ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white transition-all duration-300 transform hover:scale-105 shadow-md"
                                : "hover:bg-blue-50 hover:border-blue-300 text-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                            }
                          >
                            {dayOption.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Pilih waktu */}
                    <div className="space-y-3">
                      <Label className="text-sm text-gray-600">
                        Pilih waktu reminder:
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {[
                          { value: "08:00", label: "08:00 - Pagi" },
                          { value: "12:00", label: "12:00 - Siang" },
                          { value: "17:00", label: "17:00 - Sore" },
                          { value: "09:00", label: "09:00 - Pagi" },
                          { value: "15:00", label: "15:00 - Siang" },
                          { value: "19:00", label: "19:00 - Malam" },
                        ].map((timeOption) => (
                          <Button
                            key={timeOption.value}
                            variant={
                              onboardingData.reminderTime === timeOption.value
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setOnboardingData({
                                ...onboardingData,
                                reminderTime: timeOption.value,
                              })
                            }
                            className={
                              onboardingData.reminderTime === timeOption.value
                                ? "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white transition-all duration-300 transform hover:scale-105 shadow-md"
                                : "hover:bg-orange-50 hover:border-orange-300 text-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                            }
                          >
                            {timeOption.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bulanan - Tanggal dan waktu reminder */}
                {onboardingData.cadence === "bulanan" && (
                  <div className="space-y-4">
                    <Label>Pengaturan reminder bulanan:</Label>

                    {/* Pilih tanggal */}
                    <div className="space-y-3">
                      <Label className="text-sm text-gray-600">
                        Pilih tanggal reminder setiap bulan:
                      </Label>
                      <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(
                          (date) => (
                            <Button
                              key={date}
                              variant={
                                onboardingData.reminderDate === date.toString()
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setOnboardingData({
                                  ...onboardingData,
                                  reminderDate: date.toString(),
                                })
                              }
                              className={
                                onboardingData.reminderDate === date.toString()
                                  ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white transition-all duration-300 transform hover:scale-105 shadow-md"
                                  : "hover:bg-purple-50 hover:border-purple-300 text-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                              }
                            >
                              {date}
                            </Button>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Pilih waktu */}
                    <div className="space-y-3">
                      <Label className="text-sm text-gray-600">
                        Pilih waktu reminder:
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {[
                          { value: "08:00", label: "08:00 - Pagi" },
                          { value: "12:00", label: "12:00 - Siang" },
                          { value: "17:00", label: "17:00 - Sore" },
                          { value: "09:00", label: "09:00 - Pagi" },
                          { value: "15:00", label: "15:00 - Siang" },
                          { value: "19:00", label: "19:00 - Malam" },
                        ].map((timeOption) => (
                          <Button
                            key={timeOption.value}
                            variant={
                              onboardingData.reminderTime === timeOption.value
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setOnboardingData({
                                ...onboardingData,
                                reminderTime: timeOption.value,
                              })
                            }
                            className={
                              onboardingData.reminderTime === timeOption.value
                                ? "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white transition-all duration-300 transform hover:scale-105 shadow-md"
                                : "hover:bg-orange-50 hover:border-orange-300 text-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                            }
                          >
                            {timeOption.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected reminder display */}
                {onboardingData.reminderTime && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2">
                      <BellRing className="w-4 h-4 text-orange-600" />
                      <p className="text-sm text-orange-800">
                        <strong>Pengaturan reminder:</strong>{" "}
                        {onboardingData.cadence === "harian" && (
                          <span className="font-mono bg-orange-100 px-2 py-1 rounded">
                            Setiap hari jam {onboardingData.reminderTime}
                          </span>
                        )}
                        {onboardingData.cadence === "mingguan" && (
                          <span className="font-mono bg-orange-100 px-2 py-1 rounded">
                            Setiap {onboardingData.reminderDay} jam{" "}
                            {onboardingData.reminderTime}
                          </span>
                        )}
                        {onboardingData.cadence === "bulanan" && (
                          <span className="font-mono bg-orange-100 px-2 py-1 rounded">
                            Setiap tanggal {onboardingData.reminderDate} jam{" "}
                            {onboardingData.reminderTime}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 5: // Pilih Inisiatif Prioritas
        const initiativeMapping = {
          // Penjualan - Omzet
          "Mencapai target penjualan Rp 500 juta per bulan": [
            "Menjalankan kampanye promosi bulanan dengan diskon 20%",
            "Melatih sales team untuk closing technique",
            "Mengimplementasikan CRM untuk follow-up lead",
          ],
          "Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta": [
            "Membuat program bundling produk dengan harga spesial",
            "Melatih tim sales untuk upselling",
            "Mengembangkan strategi cross-selling kepada existing customer",
          ],
          "Menambah 100 transaksi baru setiap bulan": [
            "Menjalankan digital marketing campaign di social media",
            "Membuat referral program dengan reward menarik",
            "Membangun partnership dengan marketplace online",
          ],

          // Penjualan - Pelanggan Baru
          "Mendapatkan 100 pelanggan baru setiap bulan": [
            "Mengembangkan content marketing strategy di blog dan sosmed",
            "Mengadakan event networking dan product demo",
            "Menyediakan program trial gratis untuk prospek",
          ],
          "Mencapai conversion rate 15% dari lead ke customer": [
            "Mengoptimalkan landing page untuk konversi",
            "Membuat follow-up sequence email marketing",
            "Menjalankan telemarketing campaign yang lebih personal",
          ],
          "Meningkatkan customer retention rate menjadi 85%": [
            "Membuat program loyalty dengan point reward",
            "Menugaskan customer success manager untuk onboarding",
            "Melakukan survey kepuasan dan improvement action",
          ],

          // Penjualan - Konversi Lead
          "Mencapai conversion rate 25% dari total lead": [
            "Mengembangkan lead scoring system untuk prioritas",
            "Mempersonalisasi approach berdasarkan lead profile",
            "Menjalankan A/B testing untuk sales pitch",
          ],
          "Mengurangi waktu follow-up lead menjadi maksimal 24 jam": [
            "Mengotomatisasi lead notification system",
            "Menugaskan dedicated lead response team",
            "Mengembangkan mobile app untuk quick response",
          ],
          "Meningkatkan kualitas lead scoring menjadi 80% akurat": [
            "Menerapkan machine learning untuk lead analysis",
            "Membangun feedback loop dari sales ke marketing",
            "Melakukan regular review dan update criteria",
          ],

          // Operasional - Efisiensi
          "Mengurangi waktu proses produksi menjadi 4 jam per unit": [
            "Mengimplementasikan lean manufacturing principles",
            "Mengotomatisasi production line setup",
            "Melakukan time and motion study untuk bottleneck",
          ],
          "Meningkatkan utilitas mesin menjadi 85%": [
            "Menjadwalkan preventive maintenance",
            "Melatih operator untuk efisiensi maksimal",
            "Mengimplementasikan real-time monitoring system",
          ],
          "Mengurangi waste produksi menjadi maksimal 5%": [
            "Menerapkan quality control di setiap stage produksi",
            "Membuat recycling program untuk material waste",
            "Mengevaluasi supplier untuk kualitas raw material",
          ],

          // Customer Service - Satisfaction
          "Mencapai CSAT score 4.8/5 dalam survey bulanan": [
            "Melatih customer service excellence",
            "Mengimplementasikan feedback system yang real-time",
            "Membuat reward program untuk high performing agent",
          ],
          "Meningkatkan customer retention rate menjadi 95%": [
            "Menjalankan proactive customer outreach program",
            "Mempersonalisasi customer journey mapping",
            "Mengembangkan churn prediction dan prevention strategy",
          ],
          "Mengurangi complaint rate menjadi di bawah 1%": [
            "Melakukan root cause analysis untuk recurring issues",
            "Mengimplementasikan preventive quality assurance program",
            "Membuat customer education dan self-service portal",
          ],

          // Marketing - Brand Awareness
          "Mencapai brand recall 60% dalam market research": [
            "Menjalankan integrated marketing campaign di multiple channel",
            "Membangun influencer partnership program",
            "Mengadakan brand activation event di target market",
          ],
          "Meningkatkan social media reach menjadi 100,000 per post": [
            "Kalender konten dengan potensi viral",
            "Kampanye iklan berbayar di media sosial",
            "Program membangun komunitas dan engagement",
          ],
          "Mencapai 500 qualified leads per bulan": [
            "Optimisasi SEO untuk organic traffic",
            "Lead magnet dan landing page optimization",
            "Content marketing dan thought leadership",
          ],

          // Marketing - Social Media
          "Mencapai 10,000 pengikut baru di Instagram": [
            "Kampanye iklan berbayar di media sosial",
            "Program membangun komunitas dan engagement",
            "Program kemitraan dengan influencer",
          ],
          "Meningkatkan tingkat pertumbuhan pengikut 15% per bulan": [
            "Kalender konten dengan potensi viral",
            "Kampanye konten buatan pengguna",
            "Kontes dan hadiah di media sosial",
          ],
          "Mencapai tingkat engagement 8% di semua platform": [
            "Strategi konten interaktif",
            "Program manajemen komunitas",
            "Optimisasi social listening dan respon",
          ],

          // Customer Service - Response Time
          "Mencapai rata-rata waktu respons 1 jam": [
            "Implementasi chatbot untuk respons instan",
            "Tim dukungan pelanggan khusus",
            "Sistem routing tiket otomatis",
          ],
          "Meningkatkan tingkat respons pertama menjadi 95%": [
            "Sistem dukungan pelanggan 24/7",
            "Integrasi live chat di website",
            "Aplikasi mobile untuk layanan pelanggan",
          ],
          "Mencapai waktu penyelesaian maksimal 24 jam": [
            "Proses eskalasi yang efisien",
            "Optimisasi basis pengetahuan",
            "Integrasi CRM lanjutan",
          ],

          // Customer Service - Loyalty
          "Mencapai skor NPS 70+ dalam survei triwulanan": [
            "Sistem feedback loop pelanggan",
            "Program pengalaman pelanggan yang dipersonalisasi",
            "Program rewards loyalitas",
          ],
          "Meningkatkan tingkat advokasi pelanggan menjadi 40%": [
            "Program referral dengan insentif",
            "Kampanye kisah sukses pelanggan",
            "Program membangun komunitas",
          ],
          "Mencapai tingkat rekomendasi pelanggan 80%": [
            "Strategi pemasaran dari mulut ke mulut",
            "Program testimoni pelanggan",
            "Program duta merek",
          ],

          // Operational - Production Speed
          "Mencapai waktu siklus 3 jam per produk": [
            "Optimisasi dan otomasi alur kerja",
            "Pelatihan tim untuk efisiensi",
            "Penyederhanaan kontrol kualitas",
          ],
          "Meningkatkan throughput menjadi 50 unit per hari": [
            "Peningkatan kapasitas produksi",
            "Program upgrade peralatan",
            "Optimisasi penjadwalan staff",
          ],
          "Mengurangi downtime mesin menjadi maksimal 2%": [
            "Program maintenance preventif",
            "Sistem monitoring peralatan",
            "Implementasi sistem backup",
          ],

          // Operational - Cost Efficiency
          "Menurunkan cost per unit menjadi Rp 50,000": [
            "Supplier negotiation program",
            "Process optimization initiative",
            "Material waste reduction program",
          ],
          "Meningkatkan efficiency ratio menjadi 90%": [
            "Performance monitoring system",
            "Employee productivity training",
            "Resource allocation optimization",
          ],
          "Mengurangi overhead cost sebesar 20%": [
            "Cost analysis dan reduction program",
            "Administrative process automation",
            "Energy efficiency program",
          ],
        };

        const getInitiativeOptions = (keyResults: string[]) => {
          let allInitiatives = [];
          keyResults.forEach((kr) => {
            if (initiativeMapping[kr]) {
              allInitiatives.push(...initiativeMapping[kr]);
            }
          });

          // Remove duplicates
          return [...new Set(allInitiatives)];
        };

        const selectedKeyResultsForInitiatives =
          onboardingData.keyResults.filter((kr) => kr && kr.trim() !== "");
        const initiativeOptions = getInitiativeOptions(
          selectedKeyResultsForInitiatives,
        );
        const selectedInitiatives = onboardingData.initiatives.filter(
          (init) => init && init.trim() !== "",
        );

        // Use the same mapping as the one defined above
        const initiativeKeyResultMapping = initiativeMapping;

        // Group initiatives by their corresponding key results
        const getInitiativesByKeyResult = (keyResults: string[]) => {
          const initiativesByKR: { [key: string]: string[] } = {};

          keyResults.forEach((keyResult) => {
            const relatedInitiatives =
              initiativeKeyResultMapping[keyResult] || [];
            if (relatedInitiatives.length > 0) {
              initiativesByKR[keyResult] = relatedInitiatives;
            }
          });

          return initiativesByKR;
        };

        const initiativesByKeyResult = getInitiativesByKeyResult(
          selectedKeyResultsForInitiatives,
        );

        return (
          <div className="space-y-6">
            {Object.keys(initiativesByKeyResult).length > 0 && (
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Pilih inisiatif untuk setiap Angka Target yang sudah
                  ditentukan:
                </Label>

                {Object.entries(initiativesByKeyResult).map(
                  ([keyResult, initiatives], groupIndex) => (
                    <div
                      key={groupIndex}
                      className="border border-blue-200 rounded-lg p-4 space-y-3 bg-blue-50"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="font-semibold text-blue-800">
                          {keyResult}
                        </h4>
                      </div>

                      <div className="space-y-2 ml-4">
                        {initiatives.map((initiative, initIndex) => (
                          <div
                            key={initIndex}
                            className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-white bg-white"
                          >
                            <Checkbox
                              id={`initiative-${groupIndex}-${initIndex}`}
                              checked={selectedInitiatives.includes(initiative)}
                              onCheckedChange={(checked) => {
                                let newInitiatives = [
                                  ...onboardingData.initiatives,
                                ];
                                if (checked) {
                                  newInitiatives.push(initiative);
                                } else {
                                  newInitiatives = newInitiatives.filter(
                                    (init) => init !== initiative,
                                  );
                                }
                                setOnboardingData({
                                  ...onboardingData,
                                  initiatives: newInitiatives,
                                });
                              }}
                            />
                            <Label
                              htmlFor={`initiative-${groupIndex}-${initIndex}`}
                              className="flex-1 cursor-pointer leading-relaxed text-sm"
                            >
                              {initiative}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            {selectedInitiatives.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3">
                  🎯 Inisiatif yang Dipilih ({selectedInitiatives.length})
                </h4>
                <div className="space-y-2">
                  {Object.entries(initiativesByKeyResult).map(
                    ([keyResult, initiatives]) => {
                      const selectedInThisKR = initiatives.filter((init) =>
                        selectedInitiatives.includes(init),
                      );
                      if (selectedInThisKR.length === 0) return null;

                      return (
                        <div key={keyResult} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-700">
                              {keyResult}
                            </span>
                          </div>
                          <div className="ml-4 space-y-1">
                            {selectedInThisKR.map((init, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-gray-700">
                                  {init}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
                <p className="text-sm text-green-700 mt-3">
                  <strong>
                    Total: {selectedInitiatives.length} inisiatif terpilih
                  </strong>
                </p>
              </div>
            )}
          </div>
        );

        // Define taskMapping outside functions so it can be reused
        const taskMapping = {
          // Penjualan & Marketing Tasks
          "Menjalankan kampanye promosi bulanan dengan diskon 20%": [
            "Buat creative design untuk promosi diskon",
            "Setup campaign di Facebook Ads dan Google Ads",
            "Siapkan landing page untuk campaign",
          ],
          "Melatih sales team untuk closing technique": [
            "Buat materi training closing technique",
            "Jadwalkan session training dengan sales team",
            "Evaluasi dan feedback setelah training",
          ],
          "Mengimplementasikan CRM untuk follow-up lead": [
            "Pilih dan setup CRM software",
            "Import database lead ke CRM",
            "Training tim untuk menggunakan CRM",
          ],
          "Mempersonalisasi approach berdasarkan lead profile": [
            "Buat database profil lengkap untuk setiap lead",
            "Develop template komunikasi untuk setiap persona",
            "Training sales team untuk personalisasi approach",
          ],
          "Mengotomatisasi lead notification system": [
            "Setup real-time notification untuk lead baru",
            "Konfigurasi assignment rule untuk sales team",
            "Implementasi lead routing berdasarkan criteria",
          ],
          "Membuat program bundling produk dengan harga spesial": [
            "Analisis produk yang cocok untuk bundling",
            "Tentukan harga bundling yang kompetitif",
            "Buat marketing material untuk bundling",
          ],
          "Menjalankan digital marketing campaign di social media": [
            "Buat content calendar untuk social media",
            "Design konten visual untuk campaign",
            "Schedule posting di multiple platform",
          ],
          "Mengembangkan content marketing strategy di blog dan sosmed": [
            "Riset keyword untuk content strategy",
            "Buat content calendar bulanan",
            "Tulis dan publish artikel blog",
          ],
          "Mengadakan event networking dan product demo": [
            "Cari dan daftar event networking yang relevan",
            "Siapkan booth material dan product demo",
            "Follow up dengan kontak dari event",
          ],
          "Mengembangkan strategi cross-selling kepada existing customer": [
            "Analisis purchase history existing customer",
            "Buat cross-selling recommendation engine",
            "Training sales team untuk cross-selling technique",
          ],
          "Melatih tim sales untuk upselling": [
            "Buat materi training upselling technique",
            "Lakukan roleplay session untuk upselling",
            "Monitor dan evaluasi upselling performance",
          ],
          "Membuat referral program dengan reward menarik": [
            "Design struktur referral program dan reward",
            "Buat sistem tracking untuk referral",
            "Launch program dan monitor customer engagement",
          ],
          "Membangun partnership dengan marketplace online": [
            "Riset marketplace yang sesuai dengan produk",
            "Negosiasi partnership terms dengan marketplace",
            "Setup produk di marketplace dan monitor performance",
          ],

          // Operasional Tasks
          "Mengimplementasikan lean manufacturing principles": [
            "Analisis current process dan identifikasi waste",
            "Training karyawan tentang lean principles",
            "Implementasi 5S di area produksi",
          ],
          "Mengotomatisasi production line setup": [
            "Evaluasi kebutuhan automation equipment",
            "Install dan setup automated system",
            "Training operator untuk automated system",
          ],
          "Melakukan time and motion study untuk bottleneck": [
            "Identifikasi bottleneck di production line",
            "Lakukan time and motion study detail",
            "Buat action plan untuk eliminate bottleneck",
          ],
          "Menjadwalkan preventive maintenance": [
            "Buat schedule maintenance untuk semua mesin",
            "Siapkan checklist maintenance routine",
            "Training teknisi untuk preventive maintenance",
          ],
          "Menerapkan quality control di setiap stage produksi": [
            "Buat SOP quality control untuk setiap stage",
            "Setup quality checkpoint di production line",
            "Training quality control inspector",
          ],
          "Melatih operator untuk efisiensi maksimal": [
            "Buat program training untuk operator",
            "Lakukan assessment skill operator",
            "Implementasi best practices untuk efisiensi",
          ],
          "Mengimplementasikan real-time monitoring system": [
            "Setup monitoring equipment di production line",
            "Buat dashboard untuk real-time monitoring",
            "Training tim untuk menggunakan monitoring system",
          ],
          "Sistem monitoring kinerja": [
            "Setup performance monitoring tools",
            "Buat dashboard untuk tracking performance",
            "Training tim untuk menggunakan monitoring system",
          ],
          "Pelatihan produktivitas karyawan": [
            "Buat program training untuk karyawan",
            "Lakukan assessment skill karyawan",
            "Implementasi best practices untuk produktivitas",
          ],
          "Optimisasi alokasi sumber daya": [
            "Analisis current resource allocation",
            "Buat model optimization untuk resource",
            "Implementasi resource allocation yang optimal",
          ],
          "Program efisiensi energi": [
            "Audit energy consumption di semua area",
            "Implementasi energy saving measures",
            "Monitor energy efficiency improvement",
          ],
          "Inisiatif optimisasi proses": [
            "Analisis current process dan identifikasi waste",
            "Design optimized process workflow",
            "Implementasi process improvement dan monitoring",
          ],
          "Optimisasi dan otomasi alur kerja": [
            "Analisis current workflow dan identifikasi bottleneck",
            "Design automated workflow system",
            "Implementasi automation dan monitoring efficiency",
          ],
          "Pelatihan tim untuk efisiensi": [
            "Buat program training untuk meningkatkan skill tim",
            "Lakukan assessment competency dan gap analysis",
            "Implementasi training program dan evaluasi hasil",
          ],
          "Penyederhanaan kontrol kualitas": [
            "Analisis current quality control process",
            "Design streamlined quality control system",
            "Implementasi quality control baru dan monitoring",
          ],
          "Program upgrade peralatan": [
            "Evaluasi equipment lama dan kebutuhan upgrade",
            "Procurement dan instalasi equipment baru",
            "Training operator dan maintenance equipment",
          ],
          "Peningkatan kapasitas produksi": [
            "Analisis current production capacity dan demand",
            "Design scaling strategy untuk production",
            "Implementasi capacity expansion dan monitoring",
          ],
          "Optimisasi penjadwalan staff": [
            "Analisis current staff scheduling pattern",
            "Design optimal scheduling system",
            "Implementasi scheduling optimization dan monitoring",
          ],
          "Implementasi sistem backup": [
            "Design backup system untuk critical process",
            "Implementasi backup system dan testing",
            "Monitor backup system performance dan reliability",
          ],
          "Sistem monitoring peralatan": [
            "Setup monitoring equipment untuk production line",
            "Buat dashboard untuk real-time monitoring",
            "Training tim untuk menggunakan monitoring system",
          ],
          "Program maintenance preventif": [
            "Buat schedule maintenance untuk semua equipment",
            "Siapkan checklist maintenance routine",
            "Training teknisi untuk preventive maintenance",
          ],
          "Program negosiasi supplier": [
            "Analisis supplier performance dan pricing",
            "Negosiasi contract terms dengan supplier",
            "Monitor supplier performance dan relationship",
          ],
          "Program pengurangan limbah material": [
            "Analisis waste material di production process",
            "Implementasi waste reduction techniques",
            "Monitor dan tracking waste reduction progress",
          ],
          "Program analisis dan pengurangan biaya": [
            "Analisis detail structure cost operasional",
            "Identifikasi area untuk cost reduction",
            "Implementasi cost reduction measures dan monitoring",
          ],
          "Otomatisasi proses administratif": [
            "Analisis administrative process yang manual",
            "Design automation system untuk admin tasks",
            "Implementasi automation dan training staff",
          ],

          // Landing Page & Conversion Optimization Tasks
          "Mengoptimalkan landing page untuk konversi": [
            "Analisis current landing page performance",
            "A/B testing untuk element optimization",
            "Implementasi conversion rate optimization",
          ],
          "Membuat recycling program untuk material waste": [
            "Analisis jenis dan volume material waste",
            "Setup recycling system dan partnership",
            "Monitor recycling program effectiveness",
          ],
          "Mengevaluasi supplier untuk kualitas raw material": [
            "Audit supplier quality dan delivery performance",
            "Buat supplier scorecard dan evaluation criteria",
            "Implementasi supplier improvement program",
          ],
          "Membuat reward program untuk high performing agent": [
            "Design reward structure berdasarkan KPI",
            "Setup tracking system untuk performance metrics",
            "Launch reward program dan monitor engagement",
          ],
          "Menjalankan proactive customer outreach program": [
            "Buat database customer untuk segmentasi",
            "Design outreach strategy dan messaging",
            "Implementasi outreach campaign dan follow-up",
          ],
          "Mempersonalisasi customer journey mapping": [
            "Analisis customer behavior dan touchpoints",
            "Design personalized journey untuk setiap segment",
            "Implementasi personalized experience program",
          ],
          "Mengembangkan churn prediction dan prevention strategy": [
            "Analisis data customer untuk churn indicators",
            "Develop predictive model untuk churn risk",
            "Implementasi prevention strategy dan monitoring",
          ],
          "Mengimplementasikan preventive quality assurance program": [
            "Design quality assurance checklist dan SOP",
            "Training tim untuk preventive QA process",
            "Monitor quality metrics dan improvement",
          ],
          "Membuat customer education dan self-service portal": [
            "Buat knowledge base dan FAQ system",
            "Design self-service portal untuk customer",
            "Launch portal dan monitor usage analytics",
          ],
          "Program membangun komunitas dan engagement": [
            "Buat platform komunitas untuk customer engagement",
            "Desain aktivitas engagement dan konten",
            "Monitor pertumbuhan komunitas dan aktivitas",
          ],
          "Optimisasi SEO untuk traffic organik": [
            "Audit SEO current website dan competitor",
            "Implementasi on-page dan off-page SEO",
            "Monitor organic traffic growth dan ranking",
          ],
          "Lead magnet dan optimisasi landing page": [
            "Buat lead magnet yang valuable untuk target audience",
            "Design landing page untuk lead capture",
            "A/B testing dan optimization untuk conversion",
          ],
          "Pemasaran konten dan thought leadership": [
            "Buat content strategy untuk thought leadership",
            "Develop high-quality content secara konsisten",
            "Monitor content performance dan engagement",
          ],
          "Kampanye konten buatan pengguna": [
            "Desain kampanye untuk mendorong UGC",
            "Setup sistem tracking dan insentif",
            "Monitor performa kampanye dan engagement",
          ],
          "Kontes dan hadiah di media sosial": [
            "Rencanakan tema kontes dan hadiah menarik",
            "Setup mekanisme kontes dan aturan",
            "Jalankan kontes dan monitor partisipasi",
          ],
          "Strategi konten interaktif": [
            "Kembangkan format konten interaktif (quiz, poll, dll)",
            "Buat konten interaktif yang menarik",
            "Monitor engagement dan metrics konversi",
          ],
          "Program manajemen komunitas": [
            "Setup guidelines komunitas dan moderasi",
            "Kembangkan strategi engagement komunitas",
            "Monitor kesehatan dan aktivitas komunitas",
          ],
          "Optimisasi social listening dan respon": [
            "Setup tools social listening untuk monitoring",
            "Kembangkan strategi respon untuk berbagai skenario",
            "Monitor brand sentiment dan efektivitas respon",
          ],
          "Implementasi chatbot untuk instant response": [
            "Design chatbot flow untuk common queries",
            "Setup chatbot platform dan integration",
            "Monitor chatbot performance dan optimization",
          ],
          "Tim dukungan pelanggan khusus": [
            "Recruit dan training dedicated support team",
            "Setup support workflow dan escalation process",
            "Monitor team performance dan customer satisfaction",
          ],
          "Sistem routing tiket otomatis": [
            "Setup ticket routing berdasarkan category",
            "Implement automation untuk ticket assignment",
            "Monitor routing effectiveness dan response time",
          ],
          "Sistem dukungan pelanggan 24/7": [
            "Setup 24/7 support coverage dengan shift system",
            "Implement support tools untuk multi-channel",
            "Monitor support availability dan response metrics",
          ],
          "Integrasi live chat di website": [
            "Setup live chat platform di website",
            "Training tim untuk live chat handling",
            "Monitor chat performance dan customer satisfaction",
          ],
          "Aplikasi mobile untuk layanan pelanggan": [
            "Develop mobile app untuk customer service",
            "Integrate app dengan customer database",
            "Monitor app usage dan customer feedback",
          ],
          "Proses eskalasi yang efisien": [
            "Design escalation workflow untuk complex issues",
            "Setup escalation criteria dan SLA",
            "Monitor escalation effectiveness dan resolution time",
          ],
          "Optimisasi basis pengetahuan": [
            "Audit current knowledge base content",
            "Optimize knowledge base untuk searchability",
            "Monitor knowledge base usage dan effectiveness",
          ],
          "Integrasi CRM lanjutan": [
            "Setup advanced CRM dengan full integration",
            "Training tim untuk CRM utilization",
            "Monitor CRM effectiveness dan customer insights",
          ],
          "Sistem feedback loop pelanggan": [
            "Setup feedback collection pada multiple touchpoints",
            "Develop feedback analysis dan action plan",
            "Monitor feedback trends dan improvement metrics",
          ],
          "Program pengalaman pelanggan yang dipersonalisasi": [
            "Design personalization berdasarkan customer data",
            "Implement personalized experience across touchpoints",
            "Monitor personalization effectiveness dan engagement",
          ],
          "Loyalty rewards program": [
            "Design loyalty program structure dan rewards",
            "Setup tracking system untuk loyalty points",
            "Monitor program adoption dan customer retention",
          ],
          "Referral program dengan incentive": [
            "Design referral program dengan attractive incentive",
            "Setup referral tracking dan reward system",
            "Monitor referral program performance dan adoption",
          ],
          "Customer success story campaign": [
            "Collect customer success stories dan testimonials",
            "Create campaign materials dari success stories",
            "Monitor campaign reach dan impact",
          ],
          "Community building program": [
            "Build customer community platform",
            "Develop community engagement activities",
            "Monitor community growth dan engagement",
          ],
          "Word-of-mouth marketing strategy": [
            "Develop strategy untuk encourage word-of-mouth",
            "Create shareable content dan experiences",
            "Monitor word-of-mouth impact dan reach",
          ],
          "Customer testimonial program": [
            "Setup system untuk collect customer testimonials",
            "Create testimonial content untuk marketing",
            "Monitor testimonial effectiveness dan conversion",
          ],
          "Brand ambassador program": [
            "Recruit dan training brand ambassadors",
            "Setup ambassador program structure dan rewards",
            "Monitor ambassador performance dan brand impact",
          ],

          // Customer Service Tasks
          "Melatih customer service excellence": [
            "Buat modul training customer service",
            "Conduct training session untuk CS team",
            "Evaluasi performance setelah training",
          ],
          "Implementasi feedback system yang real-time": [
            "Setup feedback system di website",
            "Buat dashboard untuk monitoring feedback",
            "Training tim untuk respond feedback",
          ],
          "Proactive customer outreach program": [
            "Buat database customer untuk outreach",
            "Buat script untuk customer outreach",
            "Schedule regular customer check-in",
          ],
          "Root cause analysis untuk recurring issues": [
            "Analisis data complaint untuk pattern",
            "Buat action plan untuk fix root cause",
            "Implementasi solution dan monitoring",
          ],

          // Marketing & Branding Tasks
          "Menjalankan integrated marketing campaign di multiple channel": [
            "Buat campaign strategy untuk multiple channel",
            "Coordinate campaign launch across channel",
            "Monitor dan optimize campaign performance",
          ],
          "Kalender konten dengan potensi viral": [
            "Riset trending topic untuk inspirasi konten",
            "Buat kalender konten dengan sudut viral",
            "Analisis performa dan optimasi konten",
          ],
          "Kampanye iklan berbayar di media sosial": [
            "Setup kampanye Facebook Ads dan Instagram Ads",
            "Buat iklan kreatif dengan A/B testing",
            "Monitor dan optimasi performa kampanye",
          ],
          "Program kemitraan dengan influencer": [
            "Identifikasi influencer yang sesuai dengan brand",
            "Nego collaboration terms dengan influencer",
            "Monitor campaign performance dari influencer",
          ],
          "Event aktivasi brand di target market": [
            "Plan concept dan venue untuk brand activation",
            "Execute brand activation event",
            "Follow up dengan participant setelah event",
          ],

          "Menyediakan program trial gratis untuk prospek": [
            "Buat struktur program trial dengan time limit",
            "Setup sistem aktivasi dan monitoring trial",
            "Follow up trial user untuk conversion",
          ],
          "Membuat follow-up sequence email marketing": [
            "Buat email sequence untuk nurturing lead",
            "Setup automated email campaign",
            "Monitor open rate dan click-through rate",
          ],
          "Menjalankan telemarketing campaign yang lebih personal": [
            "Buat script telemarketing yang personal",
            "Training tim telemarketing untuk approach",
            "Monitor conversion rate dari telemarketing",
          ],
          "Membuat program loyalty dengan point reward": [
            "Design struktur point reward system",
            "Develop sistem tracking untuk point",
            "Launch program dan monitor customer engagement",
          ],
          "Menugaskan customer success manager untuk onboarding": [
            "Rekrut dan training customer success manager",
            "Buat SOP untuk customer onboarding process",
            "Monitor customer retention dan satisfaction",
          ],
          "Melakukan survey kepuasan dan improvement action": [
            "Buat questionnaire untuk customer satisfaction",
            "Distribute survey dan collect feedback",
            "Analisis hasil dan implementasi improvement",
          ],
          "Mengembangkan lead scoring system untuk prioritas": [
            "Setup lead scoring criteria berdasarkan behavior",
            "Konfigurasi automated scoring dalam CRM",
            "Training sales team untuk interpretasi score",
          ],
          "Menjalankan A/B testing untuk sales pitch": [
            "Buat 2 versi sales pitch yang berbeda",
            "Setup sistem tracking untuk setiap pitch",
            "Analisis hasil dan implementasi pitch terbaik",
          ],
          "Menugaskan dedicated lead response team": [
            "Rekrut dan training specialized lead response team",
            "Setup SOP untuk response time maksimal 1 jam",
            "Implementasi escalation protocol untuk urgent leads",
          ],
          "Mengembangkan mobile app untuk quick response": [
            "Develop mobile app untuk notifikasi lead",
            "Integrasikan dengan CRM untuk data sync",
            "Training team untuk menggunakan mobile app",
          ],
          "Menerapkan machine learning untuk lead analysis": [
            "Collect historical data untuk training ML model",
            "Develop predictive model untuk lead quality",
            "Integrasikan ML model dengan existing system",
          ],
          "Membangun feedback loop dari sales ke marketing": [
            "Setup sistem feedback dari sales ke marketing",
            "Buat regular meeting untuk sharing insights",
            "Monitor lead quality improvement",
          ],
          "Melakukan regular review dan update criteria": [
            "Schedule regular review untuk criteria evaluation",
            "Collect performance data untuk analysis",
            "Update criteria berdasarkan performance data",
          ],
        };

        const getTaskOptions = (initiatives: string[]) => {
          let allTasks = [];
          initiatives.forEach((init) => {
            if (taskMapping[init]) {
              allTasks.push(...taskMapping[init]);
            }
          });

          // Remove duplicates
          return [...new Set(allTasks)];
        };

        const selectedInitiativesForTasks = onboardingData.initiatives.filter(
          (init) => init && init.trim() !== "",
        );

        // Create task groups by initiative using the same mapping as above
        const getTaskGroupsByInitiative = (initiatives: string[]) => {
          const tasksByInitiative: { [key: string]: string[] } = {};

          initiatives.forEach((initiative) => {
            if (taskMapping[initiative]) {
              tasksByInitiative[initiative] = taskMapping[initiative];
            }
          });

          return tasksByInitiative;
        };

        const tasksByInitiative = getTaskGroupsByInitiative(
          selectedInitiativesForTasks,
        );

        if (!onboardingData.tasks) {
          onboardingData.tasks = [];
        }

        const selectedTasks = onboardingData.tasks.filter(
          (task) => task && task.trim() !== "",
        );

        return (
          <div className="space-y-6">
            {selectedInitiativesForTasks.length > 0 && (
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Pilih task untuk setiap inisiatif yang sudah dipilih:
                </Label>

                {Object.entries(tasksByInitiative).map(
                  ([initiative, tasks], groupIndex) => (
                    <div
                      key={groupIndex}
                      className="border border-purple-200 rounded-lg p-4 space-y-3 bg-purple-50"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <h4 className="font-semibold text-purple-800">
                          {initiative}
                        </h4>
                      </div>

                      <div className="space-y-2 ml-4">
                        {tasks.map((task, taskIndex) => (
                          <div
                            key={taskIndex}
                            className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-white bg-white"
                          >
                            <Checkbox
                              id={`task-${groupIndex}-${taskIndex}`}
                              checked={selectedTasks.includes(task)}
                              onCheckedChange={(checked) => {
                                let newTasks = [
                                  ...(onboardingData.tasks || []),
                                ];
                                if (checked) {
                                  newTasks.push(task);
                                } else {
                                  newTasks = newTasks.filter((t) => t !== task);
                                }
                                setOnboardingData({
                                  ...onboardingData,
                                  tasks: newTasks,
                                });
                              }}
                            />
                            <Label
                              htmlFor={`task-${groupIndex}-${taskIndex}`}
                              className="flex-1 cursor-pointer leading-relaxed text-sm"
                            >
                              {task}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            {selectedTasks.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3">
                  📋 Task yang Dipilih ({selectedTasks.length})
                </h4>
                <div className="space-y-2">
                  {Object.entries(tasksByInitiative).map(
                    ([initiative, tasks]) => {
                      const initiativeTasks = tasks.filter((task) =>
                        selectedTasks.includes(task),
                      );
                      if (initiativeTasks.length === 0) return null;

                      return (
                        <div key={initiative} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            <span className="text-sm font-medium text-purple-700">
                              {initiative}
                            </span>
                          </div>
                          <div className="ml-4 space-y-1">
                            {initiativeTasks.map((task, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                                <span className="text-sm text-gray-700">
                                  {task}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
                <p className="text-sm text-green-700 mt-3">
                  <strong>Total: {selectedTasks.length} task terpilih</strong>
                </p>
              </div>
            )}
          </div>
        );

      case 8: // Dashboard Ringkas
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="w-6 h-6 text-blue-900" />
                <h3 className="font-semibold text-lg text-blue-900">
                  Rekap Data Onboarding Anda
                </h3>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <div className="flex justify-center mb-2">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">1</div>
                  <div className="text-sm text-gray-600">Goal</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <div className="flex justify-center mb-2">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {onboardingData.keyResults.length}
                  </div>
                  <div className="text-sm text-gray-600">Angka Target</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <div className="flex justify-center mb-2">
                    <Lightbulb className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {onboardingData.initiatives.length}
                  </div>
                  <div className="text-sm text-gray-600">Inisiatif</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <div className="flex justify-center mb-2">
                    <ListTodo className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {onboardingData.tasks ? onboardingData.tasks.length : 0}
                  </div>
                  <div className="text-sm text-gray-600">Task</div>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    🎯 Goal Utama
                  </h4>
                  <p className="text-gray-700">
                    {onboardingData.objective || "Belum diisi"}
                  </p>
                </div>

                {onboardingData.keyResults.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-green-800 mb-3">
                      Angka Target & Rencana Eksekusi
                    </h4>
                    <div className="space-y-4">
                      {onboardingData.keyResults
                        .filter((kr) => kr && kr !== "custom")
                        .map((kr, krIndex) => {
                          // Get initiatives related to this key result (simplified: divide initiatives equally)
                          const initiativesPerKR = Math.ceil(
                            onboardingData.initiatives.filter(
                              (init) => init && init !== "custom",
                            ).length /
                              onboardingData.keyResults.filter(
                                (kr) => kr && kr !== "custom",
                              ).length,
                          );
                          const relatedInitiatives = onboardingData.initiatives
                            .filter((init) => init && init !== "custom")
                            .slice(
                              krIndex * initiativesPerKR,
                              (krIndex + 1) * initiativesPerKR,
                            );

                          return (
                            <div
                              key={krIndex}
                              className="border-l-2 border-green-200 pl-4 space-y-3"
                            >
                              {/* Key Result */}
                              <div className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                                <div>
                                  <span className="text-sm font-semibold text-green-800">
                                    Angka Target {krIndex + 1}
                                  </span>
                                  <p className="text-sm text-gray-700">{kr}</p>
                                </div>
                              </div>

                              {/* Initiatives for this Key Result */}
                              {relatedInitiatives.map((init, initIndex) => {
                                // Get tasks related to this specific initiative using the mapping
                                const taskGroups = {
                                  // Sales initiatives
                                  "Lead scoring system untuk prioritas": [
                                    "Setup lead scoring criteria berdasarkan behavior",
                                    "Konfigurasi automated scoring dalam CRM",
                                    "Training sales team untuk interpretasi score",
                                    "Monitor dan adjust scoring algorithm",
                                  ],
                                  "Mempersonalisasi approach berdasarkan lead profile":
                                    [
                                      "Buat database profil lengkap untuk setiap lead",
                                      "Develop template komunikasi untuk setiap persona",
                                      "Training sales team untuk personalisasi approach",
                                      "Track conversion rate per persona",
                                    ],
                                  "A/B testing untuk sales pitch": [
                                    "Buat 2 versi sales pitch yang berbeda",
                                    "Setup sistem tracking untuk setiap pitch",
                                    "Eksekusi A/B test dengan sample lead",
                                    "Analisis hasil dan implementasi pitch terbaik",
                                  ],
                                  "Mengotomatisasi lead notification system": [
                                    "Setup real-time notification untuk lead baru",
                                    "Konfigurasi assignment rule untuk sales team",
                                    "Implementasi lead routing berdasarkan criteria",
                                    "Monitor response time dan follow-up rate",
                                  ],
                                  "Dedicated lead response team": [
                                    "Rekrut dan training specialized lead response team",
                                    "Setup SOP untuk response time maksimal 1 jam",
                                    "Buat dashboard monitoring untuk response metrics",
                                    "Implementasi escalation protocol untuk urgent leads",
                                  ],
                                  "Mobile app untuk quick response": [
                                    "Develop mobile app untuk notifikasi lead",
                                    "Integrasikan dengan CRM untuk data sync",
                                    "Training team untuk menggunakan mobile app",
                                    "Monitor response time improvement",
                                  ],
                                  "Machine learning untuk lead analysis": [
                                    "Collect historical data untuk training ML model",
                                    "Develop predictive model untuk lead quality",
                                    "Integrasikan ML model dengan existing system",
                                    "Monitor akurasi dan continuous improvement",
                                  ],

                                  // Operational initiatives
                                  "Implementasi lean manufacturing principles":
                                    [
                                      "Analisis current process dan identifikasi waste",
                                      "Training karyawan tentang lean principles",
                                      "Implementasi 5S di area produksi",
                                      "Monitor improvement metrics",
                                    ],
                                  "Automated production line setup": [
                                    "Evaluasi kebutuhan automation equipment",
                                    "Install dan setup automated system",
                                    "Training operator untuk automated system",
                                    "Monitor produktivitas improvement",
                                  ],
                                  "Time and motion study untuk bottleneck": [
                                    "Lakukan time study untuk setiap production step",
                                    "Identifikasi bottleneck dalam production line",
                                    "Buat action plan untuk eliminate bottleneck",
                                    "Implementasi solution dan monitor hasil",
                                  ],
                                  "Preventive maintenance schedule": [
                                    "Buat schedule maintenance untuk semua mesin",
                                    "Siapkan checklist maintenance routine",
                                    "Training teknisi untuk preventive maintenance",
                                    "Monitor downtime reduction",
                                  ],
                                  "Real-time monitoring system": [
                                    "Install sensor untuk real-time monitoring",
                                    "Setup dashboard untuk production metrics",
                                    "Training team untuk respond alert",
                                    "Monitor overall equipment effectiveness",
                                  ],
                                  "Quality control di setiap stage produksi": [
                                    "Buat SOP quality control untuk setiap stage",
                                    "Setup quality checkpoint di production line",
                                    "Training quality control inspector",
                                    "Monitor quality metrics dan defect rate",
                                  ],

                                  // Customer service initiatives
                                  "Training customer service excellence": [
                                    "Buat modul training customer service",
                                    "Conduct training session untuk CS team",
                                    "Evaluasi performance setelah training",
                                    "Monitor customer satisfaction improvement",
                                  ],
                                  "Implementasi feedback system yang real-time":
                                    [
                                      "Setup feedback system di website",
                                      "Buat dashboard untuk monitoring feedback",
                                      "Training tim untuk respond feedback",
                                      "Monitor response time dan resolution rate",
                                    ],
                                  "Reward program untuk high performing agent":
                                    [
                                      "Buat criteria untuk high performing agent",
                                      "Design reward system yang motivating",
                                      "Implementasi recognition program",
                                      "Monitor agent performance improvement",
                                    ],
                                  "Proactive customer outreach program": [
                                    "Buat database customer untuk outreach",
                                    "Buat script untuk customer outreach",
                                    "Schedule regular customer check-in",
                                    "Monitor customer retention rate",
                                  ],
                                  "Root cause analysis untuk recurring issues":
                                    [
                                      "Analisis data complaint untuk pattern",
                                      "Buat action plan untuk fix root cause",
                                      "Implementasi solution dan monitoring",
                                      "Monitor complaint reduction rate",
                                    ],
                                };

                                // Get all tasks for this initiative from the mapping
                                const relatedTasks = taskGroups[init] || [];

                                // Get tasks that match the predefined mapping
                                let selectedTasksForThisInit =
                                  relatedTasks.filter((task) =>
                                    onboardingData.tasks?.includes(task),
                                  );

                                // If no tasks are mapped to this initiative,
                                // distribute remaining tasks evenly among initiatives
                                if (
                                  selectedTasksForThisInit.length === 0 &&
                                  onboardingData.tasks?.length > 0
                                ) {
                                  const tasksPerInitiative = Math.ceil(
                                    onboardingData.tasks.length /
                                      relatedInitiatives.length,
                                  );
                                  const startIndex =
                                    initIndex * tasksPerInitiative;
                                  const endIndex =
                                    startIndex + tasksPerInitiative;
                                  selectedTasksForThisInit =
                                    onboardingData.tasks.slice(
                                      startIndex,
                                      endIndex,
                                    );
                                }

                                return (
                                  <div
                                    key={initIndex}
                                    className="ml-4 border-l-2 border-purple-200 pl-4 space-y-2"
                                  >
                                    <div className="flex items-start space-x-2">
                                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></div>
                                      <div>
                                        <span className="text-xs font-medium text-purple-600">
                                          Inisiatif {initIndex + 1}
                                        </span>
                                        <p className="text-sm text-purple-700">
                                          {init}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Tasks for this Initiative */}
                                    {selectedTasksForThisInit.map(
                                      (task, taskIndex) => (
                                        <div
                                          key={taskIndex}
                                          className="ml-4 flex items-start space-x-2"
                                        >
                                          <div className="w-1 h-1 bg-orange-500 rounded-full mt-2"></div>
                                          <div>
                                            <span className="text-xs font-medium text-orange-600">
                                              Task {taskIndex + 1}
                                            </span>
                                            <p className="text-xs text-orange-700">
                                              {task}
                                            </p>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {onboardingData.invitedMembers.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      👥 Anggota Tim yang Diundang
                    </h4>
                    <div className="space-y-2">
                      {onboardingData.invitedMembers.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">
                            {member}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    📅 Ritme Update Capaian
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="space-y-2">
                      <p>
                        <strong>Frekuensi Check-in:</strong>{" "}
                        <span className="inline-block bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                          {onboardingData.cadence === "harian"
                            ? "Setiap Hari"
                            : onboardingData.cadence === "mingguan"
                              ? "Setiap Minggu"
                              : onboardingData.cadence === "bulanan"
                                ? "Setiap Bulan"
                                : "Belum dipilih"}
                        </span>
                      </p>
                      <p>
                        <strong>Waktu Reminder:</strong>{" "}
                        <span className="text-gray-900 font-mono">
                          {onboardingData.reminderTime || "Belum diatur"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    💡 <strong>Info:</strong> Sistem akan mengirim reminder
                    sesuai jadwal yang dipilih untuk membantu Anda melacak
                    progress goal secara konsisten.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">
                💡 Yang Akan Terjadi Selanjutnya
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>
                  • Goal pertama akan dibuat otomatis di sistem berdasarkan
                  pilihan anda
                </li>
                <li>• Anggota tim akan diundang untuk berkolaborasi</li>
                <li>
                  • Reminder otomatis akan dimulai sesuai ketentuan yang sudah
                  dimasukkan
                </li>
                <li>
                  • Anda dapat menambah / merubah konfigurasi setelah onboarding
                  selesai
                </li>
              </ul>
            </div>
          </div>
        );

        return null;
    }
  };

  // Get virtual assistant message based on current step
  const getVirtualAssistantMessage = () => {
    const companyName = onboardingData.companyName || (user as any)?.organization?.name || "perusahaan Anda";
    const selectedFocus = onboardingData.teamFocus;
    const selectedObjective = onboardingData.objective;
    const hasKeyResults = onboardingData.keyResults && onboardingData.keyResults.length > 0;
    const hasInitiatives = onboardingData.initiatives && onboardingData.initiatives.length > 0;
    const hasTasks = onboardingData.tasks && onboardingData.tasks.length > 0;
    
    // Step 0: Welcome screen
    if (onboardingData.currentStep === 0) {
      return "Halo! Saya Orby, asisten virtual yang akan membantu menyusun goal yang tepat dan terukur. Mari mulai dengan mengenal profil perusahaan Anda terlebih dahulu.";
    }

    // Message should explain the CURRENT step content, not guide to next step
    const stepMessages: Record<number, string> = {
      // Step 1: Company Profile Introduction - Explain what this step is about
      1: `Halaman ini menampilkan profil perusahaan ${companyName} yang sudah Anda isi sebelumnya. Anda dapat melihat dan mengedit informasi seperti nama perusahaan, alamat, provinsi, kota, jenis industri, ukuran perusahaan, posisi, dan sumber referral. Data ini akan digunakan untuk rekomendasi goal yang sesuai dengan profil bisnis Anda.`,
      
      // Step 2: Business Focus Selection - Explain what this step is about  
      2: `Halaman ini untuk memilih fokus utama bisnis ${companyName}. Ada 5 area bisnis yang bisa dipilih: Marketing, Sales, Operasional, Customer Service, dan Pengembangan Produk. Setiap area memiliki template goal yang berbeda dan sesuai dengan kebutuhan bisnis. Pilih satu area yang paling berdampak dan mendesak untuk ditingkatkan.`,
      
      // Step 3: Objective Creation - Explain what this step is about
      3: selectedFocus 
        ? `Halaman ini untuk membuat tujuan utama berdasarkan fokus ${selectedFocus} yang sudah dipilih. Anda akan merumuskan goal yang spesifik dan terukur untuk ${companyName}. Goal ini akan menjadi arah utama yang ingin dicapai dalam periode tertentu. Sistem akan memberikan rekomendasi goal yang sesuai dengan profil perusahaan.`
        : "Halaman ini untuk membuat tujuan utama berdasarkan fokus bisnis yang sudah dipilih. Anda akan merumuskan goal yang spesifik dan terukur untuk perusahaan. Goal ini akan menjadi arah utama yang ingin dicapai dalam periode tertentu.",
      
      // Step 4: Key Results Definition - Explain what this step is about
      4: selectedObjective
        ? `Halaman ini untuk menentukan Key Results dari tujuan "${selectedObjective}". Key Results adalah metrik konkret yang mengukur keberhasilan goal Anda. Setiap Key Result memiliki angka target yang spesifik dan terukur untuk ${companyName}. Sistem memberikan rekomendasi target berdasarkan fokus bisnis yang dipilih.`
        : "Halaman ini untuk menentukan Key Results dari tujuan yang sudah dibuat. Key Results adalah metrik konkret yang mengukur keberhasilan goal Anda. Setiap Key Result memiliki angka target yang spesifik dan terukur.",
      
      // Step 5: Initiatives Selection - Explain what this step is about
      5: selectedObjective
        ? `Halaman ini untuk memilih inisiatif strategis yang akan membantu mencapai "${selectedObjective}". Inisiatif adalah langkah-langkah besar atau proyek yang akan dilakukan untuk mencapai target ${selectedFocus} di ${companyName}. Anda bisa memilih beberapa inisiatif yang paling efektif dari rekomendasi sistem.`
        : "Halaman ini untuk memilih inisiatif strategis yang akan membantu mencapai tujuan yang sudah ditetapkan. Inisiatif adalah langkah-langkah besar atau proyek yang akan dilakukan untuk mencapai target bisnis. Anda bisa memilih beberapa inisiatif yang paling efektif.",
      
      // Step 6: Tasks Breakdown - Explain what this step is about
      6: hasInitiatives
        ? `Halaman ini untuk membuat tugas-tugas konkret dari inisiatif yang sudah dipilih. Setiap inisiatif akan dipecah menjadi action items yang dapat dikerjakan tim ${companyName}. Tugas-tugas ini akan memiliki deadline dan person in charge yang jelas.`
        : "Halaman ini untuk membuat tugas-tugas konkret dari inisiatif yang sudah dipilih. Setiap inisiatif akan dipecah menjadi action items yang dapat dikerjakan tim. Tugas-tugas ini akan memiliki deadline dan person in charge yang jelas.",
      
      // Step 7: Progress Cadence - Explain what this step is about
      7: `Halaman ini untuk mengatur ritme check-in progress untuk ${companyName}. Anda akan menentukan seberapa sering tim melaporkan kemajuan (harian, mingguan, bulanan) dan waktu reminder otomatis. Setting ini penting untuk menjaga momentum dan accountability tim.`,
      
      // Step 8: Summary Review - Explain what this step is about
      8: `Halaman ini menampilkan ringkasan lengkap setup OKR yang sudah dibuat untuk ${companyName}. Anda bisa melihat semua goal, key results, inisiatif, tugas, dan setting reminder yang telah dikonfigurasi. Ini adalah review terakhir sebelum sistem mulai berjalan dan klik "Mulai Tur" untuk melihat dashboard.`,
    };

    return (
      stepMessages[onboardingData.currentStep] ||
      "Terus semangat! Kita hampir selesai dengan pengaturan onboarding."
    );
  };

  // Use fade-up effect for virtual assistant message
  const assistantMessage = getVirtualAssistantMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Loading overlay for redirect */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-orange-600 animate-bounce" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Menuju Dashboard...
            </h3>
            <p className="text-gray-600">
              Onboarding selesai! Mempersiapkan dashboard untuk Anda.
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src={refokusLogo}
                alt="Refokus Logo"
                className="h-12 w-auto"
              />
            </div>

            {/* Welcome Screen Visual - Only show on step 0 */}
            {onboardingData.currentStep === 0 && (
              <div className="mt-8 mb-6">
                <div className="relative mx-auto max-w-md">
                  {/* Animated gradient circles */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full animate-pulse opacity-20"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-24 h-24 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full animate-pulse opacity-30"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full animate-pulse opacity-40"
                      style={{ animationDelay: "1s" }}
                    ></div>
                  </div>

                  {/* Central icon */}
                  <div className="relative flex items-center justify-center h-32">
                    <div className="p-4 bg-white rounded-full shadow-lg border border-orange-100">
                      <Target className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Connecting lines with icons */}
                <div className="mt-6 flex justify-center items-center space-x-4 sm:space-x-8">
                  <div className="flex flex-col items-center min-w-0">
                    <div className="p-2 bg-blue-100 rounded-full mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-600 text-center whitespace-nowrap">
                      Tujuan
                    </span>
                  </div>

                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent min-w-[20px]"></div>

                  <div className="flex flex-col items-center min-w-0">
                    <div className="p-2 bg-green-100 rounded-full mb-2">
                      <Zap className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs text-gray-600 text-center whitespace-nowrap">
                      Eksekusi
                    </span>
                  </div>

                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent min-w-[20px]"></div>

                  <div className="flex flex-col items-center min-w-0">
                    <div className="p-2 bg-purple-100 rounded-full mb-2">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs text-gray-600 text-center whitespace-nowrap">
                      Hasil
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Virtual Assistant - Show on all steps */}
          <div className="mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div
              className={`bg-gradient-to-r ${getContainerBackgroundColor()} rounded-lg p-4 shadow-sm transition-all duration-500 hover:shadow-md hover:scale-[1.02] animate-pulse-gentle`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${getProgressColor()} rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 animate-bounce-gentle`}
                  >
                    <Sparkles className="w-5 h-5 text-white transition-all duration-300 hover:rotate-12 animate-sparkle" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1 transition-all duration-300 animate-slide-in">
                    Asisten Virtual
                  </h4>
                  <p
                    key={`assistant-message-${onboardingData.currentStep}`}
                    className="text-sm text-gray-700 leading-relaxed transition-all duration-700 animate-in fade-in slide-in-from-bottom-4"
                  >
                    {assistantMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {onboardingData.currentStep > 0 && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 transition-all duration-300">
                  Langkah {onboardingData.currentStep} dari{" "}
                  {ONBOARDING_STEPS.length}
                </span>
                <span className="text-sm text-gray-600 transition-all duration-300">
                  {Math.round(progressPercentage)}% selesai
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className="h-2 transition-all duration-700 ease-out"
              />
            </div>
          )}

          <div className="space-y-8">
            {/* Step Content */}
            <div className="space-y-6">
              {onboardingData.currentStep === 0 ? (
                <Card
                  key="welcome"
                  className="shadow-lg transition-all duration-500 ease-in-out transform hover:shadow-xl animate-in fade-in slide-in-from-bottom-4"
                >
                  <CardHeader className="transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg transition-all duration-300 hover:bg-orange-200">
                        <welcomeScreenData.icon className="w-5 h-5 text-orange-600 transition-all duration-300" />
                      </div>
                      <div>
                        <CardTitle className="text-lg transition-all duration-300">
                          {welcomeScreenData.title}
                        </CardTitle>
                        <CardDescription className="transition-all duration-300">
                          {welcomeScreenData.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="transition-all duration-300">
                    {renderStepContent()}
                  </CardContent>
                </Card>
              ) : (
                currentStepData && (
                  <Card
                    key={`step-${onboardingData.currentStep}`}
                    className="shadow-lg transition-all duration-500 ease-in-out transform hover:shadow-xl animate-in fade-in slide-in-from-bottom-4"
                  >
                    <CardHeader className="transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg transition-all duration-300 hover:bg-orange-200 hover:scale-105">
                          <currentStepData.icon className="w-5 h-5 text-orange-600 transition-all duration-300" />
                        </div>
                        <div>
                          <CardTitle className="text-lg transition-all duration-300">
                            {currentStepData.title}
                          </CardTitle>
                          <CardDescription className="transition-all duration-300">
                            {currentStepData.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="transition-all duration-300">
                      {renderStepContent()}
                    </CardContent>
                  </Card>
                )
              )}

              {/* Navigation */}
              <div
                className={
                  onboardingData.currentStep === 0
                    ? "flex justify-center"
                    : "flex justify-between"
                }
              >
                {onboardingData.currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                  >
                    Sebelumnya
                  </Button>
                )}

                {onboardingData.currentStep === 8 ? (
                  <Button
                    onClick={handleComplete}
                    disabled={
                      completeOnboardingMutation.isPending || isRedirecting
                    }
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none disabled:opacity-70 min-w-[140px] relative overflow-hidden"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {(completeOnboardingMutation.isPending || isRedirecting) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <PlayCircle className="w-4 h-4" />
                      )}
                      <span className="transition-all duration-300">
                        {completeOnboardingMutation.isPending
                          ? "Menyimpan..."
                          : isRedirecting
                          ? "Menuju Dashboard..."
                          : "Mulai Tur"}
                      </span>
                    </div>
                    {/* Animated background overlay during loading */}
                    {(completeOnboardingMutation.isPending || isRedirecting) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-700 to-orange-600 animate-pulse" />
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className={`bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                      onboardingData.currentStep === 0 ? "w-full sm:w-auto" : ""
                    }`}
                  >
                    {onboardingData.currentStep === 0
                      ? "Mulai Onboarding"
                      : "Selanjutnya"}
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
