import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import refokusLogo from "@assets/refokus_1751810711179.png";
import strategyMappingImage from "@assets/strategy-mapping-refokus_1753287904335.png";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  CheckSquare,
  ArrowRight,
  ArrowDown,
  Sparkles,
  Building,
  Building2,
  BarChart,
  BarChart3,
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
  TrendingDown,
  Target as TargetIcon,
  Minus,
  Plus,
  Award,
  Rocket,
  Star,
  Globe,
  Lightbulb,
  Info,
  User,
  Edit,
  Trophy,
} from "lucide-react";
import { ReminderSettings } from "@/components/ReminderSettings";
import { SimpleSelect } from "@/components/SimpleSelect";
import { type CompanyOnboardingData } from "@shared/schema";

// Type definitions for complex objects
import { useTour } from "@/hooks/useTour";
import { KeyResultModal } from "@/components/goal-form-modal";
import EditCycleModal from "@/components/edit-cycle-modal";
import TourCompletionModal from "@/components/TourCompletionModal";

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
    title: "Memahami Struktur Untuk Merubah Strategi Jadi Aksi",
    description:
      "Sebelum membuat goal, mari pahami bagaimana sistem ini bekerja secara hierarkis untuk membantu Anda mencapai tujuan bisnis.",
    icon: Star,
  },
  {
    id: 4,
    title: "Buat Goal",
    description:
      "Pilih satu tujuan yang paling penting dan bermakna. Anda dapat merubahnya setelah onboarding selesai",
    icon: Lightbulb,
  },
  {
    id: 5,
    title: "Pilihan Inisiatif",
    description:
      "Pilih inisiatif strategis yang akan membantu mencapai tujuan Anda",
    icon: Lightbulb,
  },
  {
    id: 6,
    title: "Frekuensi Update Goal",
    description: "Seberapa sering Anda ingin memperbarui progress goal?",
    icon: Clock,
  },
  {
    id: 7,
    title: "Pilih Inisiatif Prioritas",
    description:
      "Tentukan langkah-langkah strategis untuk mencapai angka target",
    icon: CheckCircle,
  },
  {
    id: 8,
    title: "Tugas untuk Inisiatif",
    description: "Tentukan tugas-tugas yang harus dikerjakan",
    icon: BarChart,
  },
  {
    id: 9,
    title: "Pilih Ritme",
    description: "Seberapa sering Anda ingin update progress?",
    icon: Clock,
  },
  {
    id: 10,
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGoalModal, setEditGoalModal] = useState(false);
  const [editKeyResultModal, setEditKeyResultModal] = useState<{
    open: boolean;
    index: number;
    keyResult: any;
  }>({ open: false, index: -1, keyResult: null });
  const [editCycleModal, setEditCycleModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Separate states for individual editing
  const [editObjectiveModal, setEditObjectiveModal] = useState(false);
  const [editIndividualKeyResultModal, setEditIndividualKeyResultModal] =
    useState<{
      open: boolean;
      index: number;
      keyResult: any;
      originalText: string;
    }>({ open: false, index: -1, keyResult: null, originalText: "" });

  // Temporary editing values
  const [tempObjectiveTitle, setTempObjectiveTitle] = useState("");
  const [tempObjectiveDescription, setTempObjectiveDescription] = useState("");
  const [tempKeyResultText, setTempKeyResultText] = useState("");

  // Track originally selected template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  // Track edited key results to override template display
  const [editedKeyResults, setEditedKeyResults] = useState<Record<number, any>>(
    {},
  );

  // Track edited objective for the selected template
  const [editedObjective, setEditedObjective] = useState<string | null>(null);
  const { startTour } = useTour();

  // Initialize state first
  const [onboardingData, setOnboardingData] = useState<any>({
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

  // Track local changes to prevent server override
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // Fetch organization data for company details
  const { data: organizationData } = useQuery({
    queryKey: ["/api/my-organization-with-role"],
    enabled: !!user,
  });

  // Fetch goal templates based on selected focus area
  const { data: goalTemplates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: [`/api/goal-templates/${onboardingData.teamFocus}`],
    enabled: !!onboardingData.teamFocus,
  });

  // Fetch all goal templates for step 5 (initiative selection needs access to all templates)
  const { data: allGoalTemplates, isLoading: isLoadingAllTemplates } = useQuery(
    {
      queryKey: ["/api/goal-templates/all"],
      enabled: !!user,
    },
  );

  // Fetch users for key result assignment
  const { data: users } = useQuery({
    queryKey: ["/api/my-team-users"],
    enabled: !!user,
  });

  // Combined loading state
  const isLoading = isLoadingTemplates || isLoadingAllTemplates;

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
      "Pohuwato",
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
    "Papua Selatan": ["Merauke", "Boven Digoel", "Mappi", "Asmat"],
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
    ],
  };

  const provinceOptions = provinces.map((province) => ({
    value: province,
    label: province,
  }));

  const getCityOptions = (selectedProvince: string) => {
    if (!selectedProvince || !citiesByProvince[selectedProvince]) {
      return [];
    }
    return citiesByProvince[selectedProvince].map((city) => ({
      value: city,
      label: city,
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
    {
      value: "Tim menengah (11-50 orang)",
      label: "Tim menengah (11-50 orang)",
    },
    {
      value: "Perusahaan besar (50+ orang)",
      label: "Perusahaan besar (50+ orang)",
    },
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

  // Update local state when progress data is loaded, but respect local changes
  useEffect(() => {
    console.log(
      "🔄 Server data useEffect - hasLocalChanges:",
      hasLocalChanges,
      "progress.teamFocus:",
      (progress as any)?.teamFocus,
    );
    if (progress && !hasLocalChanges) {
      console.log(
        "📥 Updating from server data, teamFocus will be:",
        (progress as any).teamFocus,
      );
      setOnboardingData((prevData) => ({
        ...prevData,
        ...(progress as any),
        currentStep: (progress as any).currentStep || 0, // Ensure it starts at 0 if no progress
      }));

      // Initialize selectedTemplateId if objective exists but no template is selected
      if ((progress as any).objective && !selectedTemplateId) {
        // Find template that matches the objective
        const matchingTemplate = (goalTemplates as any)?.find(
          (template: any) => template.title === (progress as any).objective,
        );
        if (matchingTemplate) {
          setSelectedTemplateId(matchingTemplate.id);
        }
      }
    } else if (hasLocalChanges) {
      console.log("🚫 Skipping server data update due to local changes");
    }
  }, [progress, goalTemplates, selectedTemplateId, hasLocalChanges]);

  // Debug teamFocus changes
  useEffect(() => {
    console.log("🎯 TeamFocus changed to:", onboardingData.teamFocus);
  }, [onboardingData.teamFocus]);

  // Validation function for each step
  const validateStep = (
    step: number,
    data: any,
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
        // Step 3 is now "Konsep Hirarki" - no validation needed as it's explanatory
        break;
      case 4:
        if (!data.objective?.trim()) {
          return {
            isValid: false,
            message: "Silakan pilih atau tulis goal yang ingin dicapai",
          };
        }
        if (!data.cycleDuration?.trim()) {
          return {
            isValid: false,
            message: "Silakan pilih durasi periode waktu untuk goal",
          };
        }
        break;
      case 5:
        // Allow skipping initiatives selection - no validation required
        // Users can add initiatives later through goal settings
        break;
      case 6:
        if (!data.updateFrequency) {
          return {
            isValid: false,
            message: "Silakan pilih frekuensi update goal",
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
      // Set onboarding completed flag to trigger welcome screen flow
      localStorage.setItem("onboarding-completed", "true");

      // Immediate cache invalidation
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });

      // Show completion modal instead of immediate navigation
      setShowCompletionModal(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal menyelesaikan onboarding",
        variant: "destructive",
      });
    },
  });

  // Handler for edit cycle modal
  const handleEditCycle = (data: {
    periodName: string;
    startDate: string;
    endDate: string;
  }) => {
    const newData = {
      ...onboardingData,
      cycleDuration: data.periodName,
      cycleStartDate: data.startDate,
      cycleEndDate: data.endDate,
    };
    setOnboardingData(newData);
    setHasLocalChanges(true);
    setEditCycleModal(false);

    toast({
      title: "Berhasil!",
      description: "Informasi periode telah diperbarui",
      variant: "success",
    });
  };

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
      : onboardingData.currentStep === 6
        ? 100 // Show 100% when at the final step (step 6)
        : (onboardingData.currentStep / 6) * 100;

  // Dynamic color system based on progress
  const getProgressColor = () => {
    if (progressPercentage === 0) return "from-gray-400 to-gray-500"; // Start - Gray
    if (progressPercentage <= 25) return "from-red-400 to-red-500"; // 0-25% - Red
    if (progressPercentage <= 50) return "from-orange-400 to-orange-500"; // 25-50% - Orange
    if (progressPercentage <= 75) return "from-yellow-400 to-yellow-500"; // 50-75% - Yellow
    if (progressPercentage < 100) return "from-blue-400 to-blue-500"; // 75-99% - Blue
    return "from-green-400 to-green-500"; // 100% - Green
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

    if (onboardingData.currentStep < 6) {
      // Create proper completedSteps array based on currentStep (fixes corruption)
      const newCurrentStep = onboardingData.currentStep + 1;
      const newCompletedSteps =
        newCurrentStep === 1
          ? [] // Welcome screen (step 0) doesn't count as completed
          : Array.from({ length: newCurrentStep - 1 }, (_, i) => i + 1); // Steps 1 through currentStep-1

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
    } else {
      // Final step (step 6) - Complete the onboarding
      const finalData = {
        ...onboardingData,
        completedSteps: Array.from(
          new Set([...onboardingData.completedSteps, onboardingData.currentStep]),
        ),
        isCompleted: true,
      };

      setOnboardingData(finalData);

      // Trigger completion
      completeOnboardingMutation.mutate();
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
      completedSteps: Array.from(
        new Set([...onboardingData.completedSteps, onboardingData.currentStep]),
      ),
      isCompleted: true,
    };

    setOnboardingData(finalData);

    try {
      // Complete the onboarding process
      await completeOnboardingMutation.mutateAsync();

      // Set onboarding completed flag to trigger welcome screen flow
      localStorage.setItem("onboarding-completed", "true");

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
                value={
                  onboardingData.companyName ||
                  (organizationData as any)?.organization?.name ||
                  ""
                }
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
            {onboardingData.companyName &&
              onboardingData.companyAddress &&
              onboardingData.province &&
              onboardingData.city &&
              onboardingData.industryType &&
              onboardingData.companySize &&
              onboardingData.position &&
              onboardingData.referralSource && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 mt-4">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Profil perusahaan sudah lengkap! Lanjutkan ke fokus
                    bisnis.
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
                Pilih area yang paling ingin Anda tingkatkan dalam 3 bulan
                kedepan.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => {
                  console.log(
                    "Clicking penjualan - current teamFocus:",
                    onboardingData.teamFocus,
                  );
                  setHasLocalChanges(true);
                  setOnboardingData((prev) => {
                    const newData = { ...prev, teamFocus: "penjualan" };
                    console.log("Setting new teamFocus to:", newData.teamFocus);
                    return newData;
                  });
                }}
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.teamFocus === "penjualan"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Tingkatkan Pendapatan</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Fokus pada peningkatan omzet dan penjualan
                    </p>
                    {onboardingData.teamFocus === "penjualan" && (
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHasLocalChanges(true);
                            setOnboardingData({
                              ...onboardingData,
                              teamFocus: "",
                              objective: "",
                              keyResults: [],
                              initiatives: [],
                              tasks: [],
                            });
                            setSelectedTemplateId("");
                          }}
                          className="h-6 w-full text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100 border border-orange-200"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Ubah Fokus
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                onClick={() => {
                  console.log(
                    "Clicking operasional - current teamFocus:",
                    onboardingData.teamFocus,
                  );
                  setHasLocalChanges(true);
                  setOnboardingData((prev) => {
                    const newData = { ...prev, teamFocus: "operasional" };
                    console.log("Setting new teamFocus to:", newData.teamFocus);
                    return newData;
                  });
                }}
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.teamFocus === "operasional"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Settings className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Rapikan Operasional</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Optimalisasi proses, dan produktivitas operasional
                    </p>
                    {onboardingData.teamFocus === "operasional" && (
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHasLocalChanges(true);
                            setOnboardingData({
                              ...onboardingData,
                              teamFocus: "",
                              objective: "",
                              keyResults: [],
                              initiatives: [],
                              tasks: [],
                            });
                            setSelectedTemplateId("");
                          }}
                          className="h-6 w-full text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100 border border-orange-200"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Ubah Fokus
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                onClick={() => {
                  console.log(
                    "Clicking customer_service - current teamFocus:",
                    onboardingData.teamFocus,
                  );
                  setHasLocalChanges(true);
                  setOnboardingData((prev) => {
                    const newData = { ...prev, teamFocus: "customer_service" };
                    console.log("Setting new teamFocus to:", newData.teamFocus);
                    return newData;
                  });
                }}
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.teamFocus === "customer_service"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <HeartHandshake className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">Kembangkan Tim</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Peningkatan Kapasitas dan kinerja tim
                    </p>
                    {onboardingData.teamFocus === "customer_service" && (
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHasLocalChanges(true);
                            setOnboardingData({
                              ...onboardingData,
                              teamFocus: "",
                              objective: "",
                              keyResults: [],
                              initiatives: [],
                              tasks: [],
                            });
                            setSelectedTemplateId("");
                          }}
                          className="h-6 w-full text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100 border border-orange-200"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Ubah Fokus
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                onClick={() => {
                  console.log(
                    "Clicking marketing - current teamFocus:",
                    onboardingData.teamFocus,
                  );
                  setHasLocalChanges(true);
                  setOnboardingData((prev) => {
                    const newData = { ...prev, teamFocus: "marketing" };
                    console.log("Setting new teamFocus to:", newData.teamFocus);
                    return newData;
                  });
                }}
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.teamFocus === "marketing"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Rocket className="w-5 h-5 text-red-600" />
                      <span className="font-medium">Ekspansi Bisnis</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Perluas pasar dan pengembangan produk
                    </p>
                    {onboardingData.teamFocus === "marketing" && (
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHasLocalChanges(true);
                            setOnboardingData({
                              ...onboardingData,
                              teamFocus: "",
                              objective: "",
                              keyResults: [],
                              initiatives: [],
                              tasks: [],
                            });
                            setSelectedTemplateId("");
                          }}
                          className="h-6 w-full text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100 border border-orange-200"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Ubah Fokus
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Pengenalan Konsep Hirarki
        return (
          <div className="space-y-6">
            {/* Mobile-Optimized OKR Explanation */}
            <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-xl md:rounded-2xl shadow-xl border-2 border-gray-700 p-3 md:p-6 relative overflow-hidden">
              {/* Subtle background decoration - smaller on mobile */}
              <div className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32 bg-blue-400 rounded-full -translate-y-8 translate-x-8 md:-translate-y-16 md:translate-x-16 opacity-10"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 md:w-24 md:h-24 bg-purple-400 rounded-full translate-y-6 -translate-x-6 md:translate-y-12 md:-translate-x-12 opacity-10"></div>

              {/* Header */}
              <div className="text-center mb-4 md:mb-6 relative">
                <p className="text-gray-200 text-base md:text-lg px-2">
                  4 langkah sederhana yang terbukti efektif untuk mencapai
                  tujuan besar
                </p>
              </div>

              {/* Enhanced Steps - Mobile Optimized */}
              <div className="space-y-4 md:space-y-6 relative">
                {/* Step 1: Goal */}
                <div className="group">
                  <div className="flex items-start space-x-3 md:space-x-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base shadow-xl group-hover:shadow-2xl transition-all duration-300">
                        1
                      </div>
                      <div className="hidden md:block absolute -inset-2 bg-orange-200 rounded-2xl -z-10 opacity-0 group-hover:opacity-30 transition-all duration-300"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg md:text-xl font-bold text-white">
                          GOAL / Tujuan
                        </h4>
                        <div className="px-2 py-1 md:px-3 md:py-1 bg-orange-500 text-white rounded-full text-xs font-bold">
                          VISI BESAR
                        </div>
                      </div>
                      <p className="text-gray-300 mb-2 md:mb-3 text-base md:text-lg">
                        Apa yang ingin dicapai dalam 3-12 bulan ke depan
                      </p>
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg md:rounded-xl p-2 md:p-3 border-l-4 border-orange-400 shadow-md">
                        <div className="flex items-center space-x-2 mb-2">
                          <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-orange-700">
                            Contoh Real: "Meningkatkan penjualan produk secara
                            signifikan"
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connecting line */}
                  <div className="flex justify-center my-2 md:my-3">
                    <div className="w-1 h-3 md:h-4 bg-gradient-to-b from-orange-400 to-blue-400 opacity-60"></div>
                  </div>
                </div>

                {/* Step 2: Key Results */}
                <div className="group">
                  <div className="flex items-start space-x-3 md:space-x-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base shadow-xl group-hover:shadow-2xl transition-all duration-300">
                        2
                      </div>
                      <div className="hidden md:block absolute -inset-2 bg-blue-200 rounded-2xl -z-10 opacity-0 group-hover:opacity-30 transition-all duration-300"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg md:text-xl font-bold text-white">
                          ANGKA TARGET
                        </h4>
                        <div className="px-2 py-1 md:px-3 md:py-1 bg-blue-500 text-white rounded-full text-xs font-bold">
                          UKURAN
                        </div>
                      </div>
                      <p className="text-gray-300 mb-2 md:mb-3 text-base md:text-lg">
                        Angka spesifik yang mengukur pencapaian tujuan
                      </p>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg md:rounded-xl p-2 md:p-3 border-l-4 border-blue-400 shadow-md">
                        <div className="flex items-center space-x-2 mb-3">
                          <BarChart3 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-blue-700">
                            Target Konkret:
                          </span>
                          <span className="text-gray-800 text-sm md:text-base">
                            Penjualan naik 50% dari bulan lalu
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connecting line */}
                  <div className="flex justify-center my-2 md:my-3">
                    <div className="w-1 h-3 md:h-4 bg-gradient-to-b from-blue-400 to-green-400 opacity-60"></div>
                  </div>
                </div>

                {/* Step 3: Initiatives */}
                <div className="group">
                  <div className="flex items-start space-x-3 md:space-x-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base shadow-xl group-hover:shadow-2xl transition-all duration-300">
                        3
                      </div>
                      <div className="hidden md:block absolute -inset-2 bg-green-200 rounded-2xl -z-10 opacity-0 group-hover:opacity-30 transition-all duration-300"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg md:text-xl font-bold text-white">
                          INIISIATIF / Strategi
                        </h4>
                        <div className="px-2 py-1 md:px-3 md:py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                          PROGRAM
                        </div>
                      </div>
                      <p className="text-gray-300 mb-2 md:mb-3 text-base md:text-lg">
                        Program spesifik yang dilakukan untuk mencapai target
                      </p>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg md:rounded-xl p-2 md:p-3 border-l-4 border-green-400 shadow-md">
                        <div className="flex items-center space-x-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-green-700">
                            Rencana Strategis:
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-800 text-sm md:text-base">
                              Kampanye marketing di media sosial
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connecting line */}
                  <div className="flex justify-center my-2 md:my-3">
                    <div className="w-1 h-3 md:h-4 bg-gradient-to-b from-green-400 to-purple-400 opacity-60"></div>
                  </div>
                </div>

                {/* Step 4: Tasks */}
                <div className="group">
                  <div className="flex items-start space-x-3 md:space-x-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base shadow-xl group-hover:shadow-2xl transition-all duration-300">
                        4
                      </div>
                      <div className="hidden md:block absolute -inset-2 bg-purple-200 rounded-2xl -z-10 opacity-0 group-hover:opacity-30 transition-all duration-300"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg md:text-xl font-bold text-white">
                          TASK / Tugas Harian
                        </h4>
                        <div className="px-2 py-1 md:px-3 md:py-1 bg-purple-500 text-white rounded-full text-xs font-bold">
                          EKSEKUSI
                        </div>
                      </div>
                      <p className="text-gray-300 mb-1 md:mb-2 text-base md:text-lg">
                        Aktivitas konkret yang dikerjakan setiap hari
                      </p>
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg md:rounded-xl p-2 md:p-3 border-l-4 border-purple-400 shadow-md">
                        <div className="flex items-center space-x-2 mb-3">
                          <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-purple-700">
                            Action Items:
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-800 text-sm md:text-base">
                              Membuat perencanaan kampanye marketing
                            </span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-800 text-sm md:text-base">
                              Menelpon 10 calon pelanggan
                            </span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-800 text-sm md:text-base">
                              Update website dengan produk baru
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile-Optimized Summary */}
              <div className="mt-6 md:mt-8 bg-gradient-to-r from-slate-700 to-gray-800 rounded-lg md:rounded-xl p-3 md:p-4 shadow-xl relative overflow-hidden border border-gray-600">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
                <div className="relative">
                  <div className="flex items-center justify-center space-x-2 mb-3 md:mb-4">
                    <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    <h4 className="text-lg md:text-xl font-bold text-white">
                      Formula Sukses :
                    </h4>
                  </div>

                  {/* Mobile: Stack vertically, Desktop: Horizontal */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-3 mb-3 md:mb-4">
                    <span className="px-3 py-2 md:px-4 md:py-2 bg-orange-500/80 backdrop-blur-sm text-white rounded-full font-bold text-xs md:text-sm shadow-lg text-center border border-orange-400/50">
                      🎯 Tujuan
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300 self-center hidden sm:block" />
                    <ArrowDown className="w-4 h-4 text-gray-300 self-center sm:hidden" />
                    <span className="px-3 py-2 md:px-4 md:py-2 bg-blue-500/80 backdrop-blur-sm text-white rounded-full font-bold text-xs md:text-sm shadow-lg text-center border border-blue-400/50">
                      📊 Target
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300 self-center hidden sm:block" />
                    <ArrowDown className="w-4 h-4 text-gray-300 self-center sm:hidden" />
                    <span className="px-3 py-2 md:px-4 md:py-2 bg-green-500/80 backdrop-blur-sm text-white rounded-full font-bold text-xs md:text-sm shadow-lg text-center border border-green-400/50">
                      🚀 Strategi
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300 self-center hidden sm:block" />
                    <ArrowDown className="w-4 h-4 text-gray-300 self-center sm:hidden" />
                    <span className="px-3 py-2 md:px-4 md:py-2 bg-purple-500/80 backdrop-blur-sm text-white rounded-full font-bold text-xs md:text-sm shadow-lg text-center border border-purple-400/50">
                      ✅ Eksekusi
                    </span>
                  </div>

                  <p className="text-white/90 text-center leading-relaxed text-sm md:text-base px-2">
                    <strong>Kunci keberhasilan:</strong> Setiap tugas harian
                    mendukung strategi → strategi mencapai target → target
                    mewujudkan tujuan besar
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Selanjutnya, kita akan membuat goal berdasarkan fokus bisnis
                yang sudah Anda pilih:
                <span className="font-medium text-orange-600">
                  {" "}
                  {onboardingData.teamFocus === "penjualan"
                    ? "Tingkatkan Pendapatan"
                    : onboardingData.teamFocus === "operasional"
                      ? "Rapikan Operasional"
                      : onboardingData.teamFocus === "customer_service"
                        ? "Kembangkan Tim"
                        : onboardingData.teamFocus === "marketing"
                          ? "Ekspansi Bisnis"
                          : ""}
                </span>
              </p>
            </div>
          </div>
        );

      case 4: // Buat Objective
        return (
          <div className="space-y-4">
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-3 text-gray-600">
                  Memuat template goal...
                </span>
              </div>
            ) : goalTemplates && goalTemplates.length > 0 ? (
              <div className="space-y-3">
                <Label>
                  Pilih goal template yang sesuai dengan fokus bisnis Anda (
                  {onboardingData.teamFocus === "penjualan"
                    ? "Tingkatkan Pendapatan"
                    : onboardingData.teamFocus === "operasional"
                      ? "Rapikan Operasional"
                      : onboardingData.teamFocus === "customer_service"
                        ? "Kembangkan Tim"
                        : onboardingData.teamFocus === "marketing"
                          ? "Ekspansi Bisnis"
                          : ""}
                  ):
                </Label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {goalTemplates.map((template: any, index: number) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        // Set default 1-month cycle when selecting a goal
                        const startDate = new Date();
                        const endDate = new Date();
                        endDate.setMonth(startDate.getMonth() + 1);

                        // Track the selected template ID
                        setSelectedTemplateId(template.id);

                        // Clear edited data when switching templates
                        setEditedKeyResults({});
                        setEditedObjective(null);

                        setOnboardingData({
                          ...onboardingData,
                          objective: template.title,
                          objectiveDescription: template.description, // Add description from template
                          // Set default 1-month cycle
                          cycleDuration: "1bulan",
                          cycleStartDate: startDate.toISOString().split("T")[0],
                          cycleEndDate: endDate.toISOString().split("T")[0],
                        });
                      }}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] h-fit ${
                        selectedTemplateId === template.id
                          ? "border-orange-500 bg-orange-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="leading-relaxed font-semibold text-base flex-1">
                            {selectedTemplateId === template.id &&
                            editedObjective
                              ? editedObjective
                              : template.title}
                          </h3>
                          {selectedTemplateId === template.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const selectedTemplate = goalTemplates?.find(
                                  (t) => t.title === onboardingData.objective,
                                );
                                setTempObjectiveTitle(onboardingData.objective);
                                setTempObjectiveDescription(
                                  onboardingData.objectiveDescription ||
                                    selectedTemplate?.description ||
                                    "",
                                );
                                setEditObjectiveModal(true);
                              }}
                              className="ml-2 text-xs px-2 py-1 h-7 border-orange-300 text-orange-700 hover:bg-orange-50"
                            >
                              Edit Goal
                            </Button>
                          )}
                        </div>
                        {(() => {
                          const displayDescription =
                            selectedTemplateId === template.id &&
                            onboardingData.objectiveDescription
                              ? onboardingData.objectiveDescription
                              : template.description;

                          // Debug logging
                          if (selectedTemplateId === template.id) {
                            console.log("🔍 Debug template description:", {
                              templateId: template.id,
                              selectedTemplateId,
                              objectiveDescription:
                                onboardingData.objectiveDescription,
                              templateDescription: template.description,
                              displayDescription,
                            });
                          }

                          return displayDescription ? (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {displayDescription}
                            </p>
                          ) : null;
                        })()}

                        {/* Display Angka Target */}
                        {template.keyResults &&
                          template.keyResults.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                                  Angka Target:
                                </p>
                              </div>
                              <div className="space-y-1">
                                {template.keyResults
                                  .slice(0, 3)
                                  .map((keyResult: any, krIndex: number) => {
                                    // Use edited data only if this template is selected and has edits, otherwise use original template data
                                    const displayKeyResult =
                                      selectedTemplateId === template.id &&
                                      editedKeyResults[krIndex]
                                        ? editedKeyResults[krIndex]
                                        : keyResult;

                                    return (
                                      <div
                                        key={krIndex}
                                        className="flex items-center justify-between group"
                                      >
                                        <div className="flex items-center space-x-2 flex-1">
                                          {(() => {
                                            // Type-specific icons based on keyResultType
                                            const getKeyResultIcon = (
                                              type: string,
                                            ) => {
                                              switch (type) {
                                                case "increase_to":
                                                  return (
                                                    <TrendingUp className="w-3 h-3 text-green-600 flex-shrink-0" />
                                                  );
                                                case "decrease_to":
                                                  return (
                                                    <TrendingDown className="w-3 h-3 text-red-600 flex-shrink-0" />
                                                  );
                                                case "achieve_or_not":
                                                  return (
                                                    <TargetIcon className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                                  );
                                                case "should_stay_above":
                                                  return (
                                                    <Plus className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                                  );
                                                case "should_stay_below":
                                                  return (
                                                    <Minus className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                                  );
                                                default:
                                                  return (
                                                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0"></div>
                                                  );
                                              }
                                            };
                                            return getKeyResultIcon(
                                              displayKeyResult.keyResultType ||
                                                "default",
                                            );
                                          })()}
                                          <span className="text-xs text-gray-600 flex-1">
                                            {displayKeyResult.title}
                                            {displayKeyResult.targetValue &&
                                              displayKeyResult.unit && (
                                                <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                                                  {displayKeyResult.targetValue}{" "}
                                                  {displayKeyResult.unit}
                                                </span>
                                              )}
                                          </span>
                                        </div>
                                        {selectedTemplateId === template.id && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const originalText =
                                                keyResult.targetValue &&
                                                keyResult.unit
                                                  ? `${keyResult.title} (Target: ${keyResult.targetValue} ${keyResult.unit})`
                                                  : keyResult.title;
                                              setTempKeyResultText(
                                                originalText,
                                              );
                                              setEditIndividualKeyResultModal({
                                                open: true,
                                                index: krIndex,
                                                keyResult: {
                                                  ...keyResult,
                                                  // Ensure we use the actual template data
                                                  title: keyResult.title,
                                                  description:
                                                    keyResult.description || "",
                                                  keyResultType:
                                                    keyResult.keyResultType ||
                                                    "increase_to",
                                                  baseValue:
                                                    keyResult.baseValue || "0",
                                                  targetValue:
                                                    keyResult.targetValue ||
                                                    "0",
                                                  currentValue:
                                                    keyResult.currentValue ||
                                                    "0",
                                                  unit: keyResult.unit || "",
                                                },
                                                originalText: originalText,
                                              });
                                            }}
                                            className="h-5 w-5 p-0 hover:bg-orange-50"
                                          >
                                            <Edit className="w-3 h-3 text-orange-600" />
                                          </Button>
                                        )}
                                      </div>
                                    );
                                  })}
                                {template.keyResults.length > 3 && (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full flex-shrink-0"></div>
                                    <span className="text-xs text-gray-500">
                                      +{template.keyResults.length - 3} angka
                                      target lainnya
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Tidak ada template goal untuk fokus area yang dipilih.</p>
              </div>
            )}

            {/* Cycle Selection */}
            {selectedTemplateId && onboardingData.objective && (
              <div className="mt-6 space-y-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                  <Label className="text-lg font-semibold text-purple-800">
                    Periode Waktu Goal
                  </Label>
                </div>
                <p className="text-sm text-purple-700 mb-4">
                  Pilih durasi waktu untuk mencapai goal "
                  {onboardingData.objective}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      value: "1bulan",
                      label: "1 Bulan",
                      description: "Sprint intensif jangka pendek",
                      icon: "🚀",
                      color: "from-green-500 to-emerald-500",
                    },
                    {
                      value: "3bulan",
                      label: "3 Bulan",
                      description: "Kuartal strategis",
                      icon: "📈",
                      color: "from-blue-500 to-cyan-500",
                    },
                    {
                      value: "1tahun",
                      label: "1 Tahun",
                      description: "Rencana strategis tahunan",
                      icon: "🎯",
                      color: "from-purple-500 to-violet-500",
                    },
                  ].map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        const startDate = new Date();
                        const endDate = new Date();

                        if (option.value === "1bulan") {
                          endDate.setMonth(startDate.getMonth() + 1);
                        } else if (option.value === "3bulan") {
                          endDate.setMonth(startDate.getMonth() + 3);
                        } else if (option.value === "1tahun") {
                          endDate.setFullYear(startDate.getFullYear() + 1);
                        }

                        setOnboardingData({
                          ...onboardingData,
                          cycleDuration: option.value,
                          cycleStartDate: startDate.toISOString().split("T")[0],
                          cycleEndDate: endDate.toISOString().split("T")[0],
                        });
                      }}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                        onboardingData.cycleDuration === option.value
                          ? "border-purple-500 bg-white shadow-md ring-2 ring-purple-200"
                          : "border-gray-200 bg-white hover:border-purple-300"
                      }`}
                    >
                      <div className="text-center space-y-2">
                        <div
                          className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${option.color} flex items-center justify-center text-white text-xl shadow-lg`}
                        >
                          {option.icon}
                        </div>
                        <h4 className="font-semibold text-gray-800">
                          {option.label}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {option.description}
                        </p>
                        {onboardingData.cycleDuration === option.value &&
                          onboardingData.cycleStartDate &&
                          onboardingData.cycleEndDate && (
                            <div className="mt-2 space-y-2">
                              <div className="p-2 bg-purple-50 rounded text-xs text-purple-700">
                                <div className="font-medium">Periode:</div>
                                <div>
                                  {new Date(
                                    onboardingData.cycleStartDate,
                                  ).toLocaleDateString("id-ID")}{" "}
                                  -{" "}
                                  {new Date(
                                    onboardingData.cycleEndDate,
                                  ).toLocaleDateString("id-ID")}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditCycleModal(true);
                                }}
                                className="h-6 w-full text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-100 border border-purple-200"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Ubah Periode
                              </Button>
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tips section when cycle is active */}
                {onboardingData.cycleDuration && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Edit className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Tips Kustomisasi:
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Anda dapat menyesuaikan goal dan ukuran target dengan
                      mengklik tombol <strong>"Edit Goal"</strong> dan{" "}
                      <strong>ikon edit</strong> di samping setiap angka target
                      untuk personalisasi yang lebih detail.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 5: // Pilihan Inisiatif Strategis
        // Get selected template based on objective from all templates (not just current focus area)
        const selectedTemplate = allGoalTemplates?.find(
          (template) => template.title === onboardingData.objective,
        );

        // Debug logging
        console.log("🔍 Step 5 Debug:", {
          objective: onboardingData.objective,
          isLoadingAllTemplates,
          allTemplateCount: allGoalTemplates?.length || 0,
          allTemplateTitles: allGoalTemplates?.map((t) => t.title) || [],
          selectedTemplate: selectedTemplate
            ? selectedTemplate.title
            : "NOT FOUND",
          selectedTemplateInitiatives:
            selectedTemplate?.initiatives || "NO INITIATIVES",
          selectedTemplateTasks: selectedTemplate?.tasks || "NO TASKS",
          currentStep: onboardingData.currentStep,
          user: !!user,
        });

        // Additional debug for tasks
        if (selectedTemplate?.tasks) {
          console.log("🔍 Tasks Debug:", {
            totalTasks: selectedTemplate.tasks.length,
            taskStructure: selectedTemplate.tasks,
            initiativeIds: selectedTemplate.tasks.map(
              (t: any) => t.initiativeId,
            ),
          });
        }

        // Get initiatives from selected template
        const getTemplateInitiatives = () => {
          if (!selectedTemplate || !selectedTemplate.initiatives) {
            console.log("❌ No template or initiatives found:", {
              hasTemplate: !!selectedTemplate,
              hasInitiatives: selectedTemplate?.initiatives?.length || 0,
            });
            return [];
          }
          return selectedTemplate.initiatives.map((initiative: any) => ({
            title: initiative.title,
            description: initiative.description,
          }));
        };

        const availableInitiatives = getTemplateInitiatives();
        const selectedInitiatives = onboardingData.initiatives || [];

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Pilih Inisiatif Strategis
              </h3>
              <p className="text-sm text-gray-600">
                Pilih inisiatif yang paling sesuai untuk mencapai goal:{" "}
                <span className="font-medium text-indigo-600">
                  "{onboardingData.objective}"
                </span>
              </p>
            </div>

            {availableInitiatives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableInitiatives.map((initiative: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 h-fit ${
                      selectedInitiatives.includes(initiative.title)
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      const newInitiatives = selectedInitiatives.includes(
                        initiative.title,
                      )
                        ? selectedInitiatives.filter(
                            (init) => init !== initiative.title,
                          )
                        : [...selectedInitiatives, initiative.title];

                      setOnboardingData({
                        ...onboardingData,
                        initiatives: newInitiatives,
                      });
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedInitiatives.includes(initiative.title)}
                        onChange={() => {}} // Handled by parent div onClick
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {initiative.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {initiative.description}
                        </p>

                        {/* Display tasks for this initiative */}
                        {selectedTemplate?.tasks &&
                          selectedTemplate.tasks.filter(
                            (task: any) =>
                              task.initiativeId === index.toString(),
                          ).length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-xs font-medium text-gray-700 flex items-center mb-2">
                                <ListTodo className="w-3 h-3 mr-1" />
                                Tugas yang terkait:
                              </p>
                              <div className="space-y-2">
                                {selectedTemplate.tasks
                                  .filter(
                                    (task: any) =>
                                      task.initiativeId === index.toString(),
                                  )
                                  .map((task: any, taskIndex: number) => (
                                    <div
                                      key={taskIndex}
                                      className="flex items-start space-x-2 text-xs"
                                    >
                                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                          <span className="text-gray-800 leading-relaxed font-medium">
                                            {task.title}
                                          </span>
                                          {task.priority && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs ml-2 flex-shrink-0"
                                            >
                                              {task.priority === "high"
                                                ? "🔴 Tinggi"
                                                : task.priority === "medium"
                                                  ? "🟡 Sedang"
                                                  : "🟢 Rendah"}
                                            </Badge>
                                          )}
                                        </div>
                                        {task.description && (
                                          <p className="text-gray-600 mt-1 text-xs leading-relaxed">
                                            {task.description}
                                          </p>
                                        )}
                                        {task.dueDate && (
                                          <div className="flex items-center mt-1 text-xs text-gray-500">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Target: {task.dueDate}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Tidak ada inisiatif tersedia untuk goal ini.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Silakan pilih goal yang berbeda di step sebelumnya.
                </p>
              </div>
            )}

            {selectedInitiatives.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ {selectedInitiatives.length} inisiatif dipilih
                </p>
              </div>
            )}

            {/* Skip option */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Belum siap memilih inisiatif?
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Anda dapat melewati langkah ini dan menambahkan inisiatif
                    strategis nanti melalui pengaturan goal.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOnboardingData({
                        ...onboardingData,
                        initiatives: [],
                      });
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Lewati & Lanjutkan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 6: // Frekuensi Update Goal
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Pilih frekuensi update goal:
              </Label>
              <p className="text-sm text-gray-600">
                Seberapa sering Anda ingin memperbarui progress goal? Setting
                ini akan menentukan ritme monitoring dan evaluasi pencapaian
                Anda.
              </p>
            </div>

            <RadioGroup
              value={onboardingData.updateFrequency}
              onValueChange={(value) =>
                setOnboardingData({ ...onboardingData, updateFrequency: value })
              }
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div
                className={`relative p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.updateFrequency === "harian"
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
                onClick={() =>
                  setOnboardingData({
                    ...onboardingData,
                    updateFrequency: "harian",
                  })
                }
              >
                <div className="flex items-start space-x-4">
                  <RadioGroupItem
                    value="harian"
                    id="freq-harian"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-red-600" />
                      <Label
                        htmlFor="freq-harian"
                        className="font-semibold text-lg cursor-pointer"
                      >
                        Update Harian
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Pembaruan progress setiap hari untuk monitoring ketat dan
                      progress yang cepat.
                    </p>
                    <div className="text-xs text-gray-500">
                      <strong>Cocok untuk:</strong> Goal dengan target jangka
                      pendek, perlu monitoring ketat, atau dalam fase kritis
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.updateFrequency === "mingguan"
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
                onClick={() =>
                  setOnboardingData({
                    ...onboardingData,
                    updateFrequency: "mingguan",
                  })
                }
              >
                <div className="flex items-start space-x-4">
                  <RadioGroupItem
                    value="mingguan"
                    id="freq-mingguan"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-5 h-5 text-yellow-600" />
                      <Label
                        htmlFor="freq-mingguan"
                        className="font-semibold text-lg cursor-pointer"
                      >
                        Update Mingguan
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Pembaruan progress setiap minggu untuk keseimbangan antara
                      monitoring dan fokus eksekusi.
                    </p>
                    <div className="text-xs text-gray-500">
                      <strong>Cocok untuk:</strong> Goal menengah, tim yang
                      sudah terbiasa, atau fokus strategis reguler
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  onboardingData.updateFrequency === "bulanan"
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
                onClick={() =>
                  setOnboardingData({
                    ...onboardingData,
                    updateFrequency: "bulanan",
                  })
                }
              >
                <div className="flex items-start space-x-4">
                  <RadioGroupItem
                    value="bulanan"
                    id="freq-bulanan"
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <Label
                        htmlFor="freq-bulanan"
                        className="font-semibold text-lg cursor-pointer"
                      >
                        Update Bulanan
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Pembaruan progress setiap bulan untuk goal jangka panjang
                      dan evaluasi strategis.
                    </p>
                    <div className="text-xs text-gray-500">
                      <strong>Cocok untuk:</strong> Goal strategis jangka
                      panjang, eksekutif level, atau review berkala
                    </div>
                  </div>
                </div>
              </div>
            </RadioGroup>

            {onboardingData.updateFrequency && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <strong>Pilihan Anda:</strong> Update{" "}
                    {onboardingData.updateFrequency} akan menentukan frekuensi
                    reminder dan monitoring progress goal Anda. Anda dapat
                    mengubah setting ini kapan saja di pengaturan goal.
                  </div>
                </div>
              </div>
            )}
          </div>
        );

        return null;

      default:
        return <div>Step not implemented yet</div>;
    }
  };

  // Get virtual assistant message based on current step
  const getVirtualAssistantMessage = () => {
    // Only show virtual assistant on welcome screen (step 0)
    if (onboardingData.currentStep !== 0) {
      return null;
    }

    const stepMessages = {
      0: `Selamat datang di Refokus! Platform ini dirancang khusus untuk menyelaraskan visi, strategi, dan eksekusi tim Anda dengan pendekatan OKR (Objectives and Key Results). Mari kita mulai perjalanan transformasi bisnis Anda bersama-sama. 🚀`,
    };

    return stepMessages[0] || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Memuat onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Logo Header */}
        <div className="flex items-center justify-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <img
            src={refokusLogo}
            alt="Refokus Logo"
            className="h-12 transition-all duration-300 hover:scale-105"
          />
        </div>

        {/* Virtual Assistant - Only on welcome screen */}
        {onboardingData.currentStep === 0 && getVirtualAssistantMessage() && (
          <div className="mb-8 animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
            <div className="bg-white/80 backdrop-blur-sm border border-orange-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-100">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {getVirtualAssistantMessage()}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-xs text-orange-600">
                    <User className="w-3 h-3 mr-1" />
                    <span className="font-medium">Orby - Virtual Assistant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {onboardingData.currentStep > 0 && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 transition-all duration-300">
                Langkah {onboardingData.currentStep} dari 6
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

              {onboardingData.currentStep === 6 ? (
                <Button
                  onClick={handleComplete}
                  disabled={
                    completeOnboardingMutation.isPending || isRedirecting
                  }
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none disabled:opacity-70 min-w-[140px] relative overflow-hidden"
                >
                  <div className="flex items-center justify-center gap-2">
                    {completeOnboardingMutation.isPending || isRedirecting ? (
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
                  {(completeOnboardingMutation.isPending ||
                    isRedirecting) && (
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

      {/* Edit Goal Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-orange-600" />
              <span>Edit Goal & Angka Target</span>
            </DialogTitle>
            <DialogDescription>
              Sesuaikan goal dan angka target sesuai kebutuhan spesifik
              perusahaan Anda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Edit Goal Section */}
            <div className="space-y-3">
              <Label
                htmlFor="modal-objective"
                className="text-sm font-medium text-gray-800"
              >
                Edit Goal:
              </Label>
              <Textarea
                id="modal-objective"
                value={onboardingData.objective}
                onChange={(e) =>
                  setOnboardingData({
                    ...onboardingData,
                    objective: e.target.value,
                  })
                }
                placeholder="Sesuaikan goal sesuai kebutuhan perusahaan Anda..."
                className="min-h-[80px] text-sm leading-relaxed"
              />
            </div>

            {/* Edit Angka Target Section */}
            {(() => {
              const selectedTemplate = goalTemplates?.find(
                (t: any) => t.title === onboardingData.objective,
              );
              if (
                !selectedTemplate ||
                !selectedTemplate.keyResults ||
                selectedTemplate.keyResults.length === 0
              ) {
                return null;
              }

              // Initialize structured key results from template if not already set
              const currentKeyResults =
                onboardingData.keyResults.length > 0
                  ? onboardingData.keyResults.map((kr: any) => {
                      if (typeof kr === "string") {
                        return {
                          title: kr,
                          keyResultType: "increase_to",
                          targetValue: "",
                          currentValue: "0",
                          baseValue: "0",
                          unit: "number",
                        };
                      }
                      return kr;
                    })
                  : selectedTemplate.keyResults.map((kr: any) => ({
                      title: kr.title || "",
                      keyResultType: kr.keyResultType || "increase_to",
                      targetValue: kr.targetValue || "",
                      currentValue: kr.currentValue || "0",
                      baseValue: kr.baseValue || "0",
                      unit: kr.unit || "number",
                    }));

              return (
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    Edit Angka Target:
                  </Label>

                  <div className="border border-blue-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-blue-50 border-b border-blue-200">
                          <tr>
                            <th className="text-left p-3 font-medium text-gray-700 min-w-[200px]">
                              Judul Angka Target
                            </th>
                            <th className="text-left p-3 font-medium text-gray-700 min-w-[140px]">
                              Tipe
                            </th>
                            <th className="text-left p-3 font-medium text-gray-700 w-20">
                              Awal
                            </th>
                            <th className="text-left p-3 font-medium text-gray-700 w-20">
                              Saat Ini
                            </th>
                            <th className="text-left p-3 font-medium text-gray-700 w-20">
                              Target
                            </th>
                            <th className="text-left p-3 font-medium text-gray-700 min-w-[120px]">
                              Satuan
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentKeyResults.map(
                            (keyResult: any, index: number) => (
                              <tr
                                key={index}
                                className="border-b border-gray-200 hover:bg-gray-50"
                              >
                                {/* Title */}
                                <td className="p-3">
                                  <Input
                                    value={keyResult.title}
                                    onChange={(e) => {
                                      const updatedKeyResults = [
                                        ...currentKeyResults,
                                      ];
                                      updatedKeyResults[index] = {
                                        ...updatedKeyResults[index],
                                        title: e.target.value,
                                      };
                                      setOnboardingData({
                                        ...onboardingData,
                                        keyResults: updatedKeyResults,
                                      });
                                    }}
                                    placeholder="Masukkan judul..."
                                    className="text-xs border-gray-300 focus:border-blue-400"
                                  />
                                </td>

                                {/* Type */}
                                <td className="p-3">
                                  <Select
                                    value={keyResult.keyResultType}
                                    onValueChange={(value) => {
                                      const updatedKeyResults = [
                                        ...currentKeyResults,
                                      ];
                                      updatedKeyResults[index] = {
                                        ...updatedKeyResults[index],
                                        keyResultType: value,
                                      };
                                      setOnboardingData({
                                        ...onboardingData,
                                        keyResults: updatedKeyResults,
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="text-xs h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="increase_to">
                                        Tingkatkan
                                      </SelectItem>
                                      <SelectItem value="decrease_to">
                                        Turunkan
                                      </SelectItem>
                                      <SelectItem value="achieve_or_not">
                                        Capai/Tidak
                                      </SelectItem>
                                      <SelectItem value="should_stay_above">
                                        Tetap &gt;
                                      </SelectItem>
                                      <SelectItem value="should_stay_below">
                                        Tetap &lt;
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>

                                {/* Base Value */}
                                <td className="p-3">
                                  {keyResult.keyResultType !==
                                  "achieve_or_not" ? (
                                    <Input
                                      type="number"
                                      value={keyResult.baseValue}
                                      onChange={(e) => {
                                        const updatedKeyResults = [
                                          ...currentKeyResults,
                                        ];
                                        updatedKeyResults[index] = {
                                          ...updatedKeyResults[index],
                                          baseValue: e.target.value,
                                        };
                                        setOnboardingData({
                                          ...onboardingData,
                                          keyResults: updatedKeyResults,
                                        });
                                      }}
                                      placeholder="0"
                                      className="text-xs h-8 border-gray-300"
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-xs">
                                      -
                                    </span>
                                  )}
                                </td>

                                {/* Current Value */}
                                <td className="p-3">
                                  {keyResult.keyResultType !==
                                  "achieve_or_not" ? (
                                    <Input
                                      type="number"
                                      value={keyResult.currentValue}
                                      onChange={(e) => {
                                        const updatedKeyResults = [
                                          ...currentKeyResults,
                                        ];
                                        updatedKeyResults[index] = {
                                          ...updatedKeyResults[index],
                                          currentValue: e.target.value,
                                        };
                                        setOnboardingData({
                                          ...onboardingData,
                                          keyResults: updatedKeyResults,
                                        });
                                      }}
                                      placeholder="0"
                                      className="text-xs h-8 border-gray-300"
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-xs">
                                      -
                                    </span>
                                  )}
                                </td>

                                {/* Target Value */}
                                <td className="p-3">
                                  {keyResult.keyResultType !==
                                  "achieve_or_not" ? (
                                    <Input
                                      type="number"
                                      value={keyResult.targetValue}
                                      onChange={(e) => {
                                        const updatedKeyResults = [
                                          ...currentKeyResults,
                                        ];
                                        updatedKeyResults[index] = {
                                          ...updatedKeyResults[index],
                                          targetValue: e.target.value,
                                        };
                                        setOnboardingData({
                                          ...onboardingData,
                                          keyResults: updatedKeyResults,
                                        });
                                      }}
                                      placeholder="100"
                                      className="text-xs h-8 border-gray-300"
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-xs">
                                      -
                                    </span>
                                  )}
                                </td>

                                {/* Unit */}
                                <td className="p-3">
                                  {keyResult.keyResultType !==
                                  "achieve_or_not" ? (
                                    <Select
                                      value={keyResult.unit}
                                      onValueChange={(value) => {
                                        const updatedKeyResults = [
                                          ...currentKeyResults,
                                        ];
                                        updatedKeyResults[index] = {
                                          ...updatedKeyResults[index],
                                          unit: value,
                                        };
                                        setOnboardingData({
                                          ...onboardingData,
                                          keyResults: updatedKeyResults,
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="text-xs h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="number">
                                          Angka
                                        </SelectItem>
                                        <SelectItem value="percentage">
                                          %
                                        </SelectItem>
                                        <SelectItem value="currency">
                                          Rp
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <span className="text-gray-400 text-xs">
                                      -
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg">
                    💡 <strong>Tips:</strong> Format tabel memudahkan editing
                    multiple angka target dengan struktur database lengkap
                  </p>
                </div>
              );
            })()}
          </div>

          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setShowEditModal(false);
                toast({
                  title: "Perubahan Disimpan",
                  description:
                    "Goal dan angka target telah berhasil diperbarui",
                  variant: "default",
                });
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Modal */}
      <Dialog open={editGoalModal} onOpenChange={setEditGoalModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-blue-600" />
              <span>Edit Goal Utama</span>
            </DialogTitle>
            <DialogDescription>
              Sesuaikan goal utama sesuai kebutuhan spesifik perusahaan Anda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Label
              htmlFor="goal-edit"
              className="text-sm font-medium text-blue-800"
            >
              Goal Utama:
            </Label>
            <Textarea
              id="goal-edit"
              value={onboardingData.objective}
              onChange={(e) =>
                setOnboardingData({
                  ...onboardingData,
                  objective: e.target.value,
                })
              }
              placeholder="Masukkan goal utama perusahaan Anda..."
              className="min-h-[100px] text-sm leading-relaxed bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setEditGoalModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              onClick={() => setEditGoalModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Angka Target Modal */}
      <Dialog
        open={editKeyResultModal.open}
        onOpenChange={(open) =>
          setEditKeyResultModal({ open, index: -1, keyResult: null })
        }
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-green-600" />
              <span>Edit Angka Target {editKeyResultModal.index + 1}</span>
            </DialogTitle>
            <DialogDescription>
              Sesuaikan angka target sesuai kondisi spesifik perusahaan Anda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Label
              htmlFor="kr-edit"
              className="text-sm font-medium text-green-800"
            >
              Angka Target:
            </Label>
            <Textarea
              id="kr-edit"
              value={editKeyResultModal.keyResult || ""}
              onChange={(e) => {
                // Update the key result in onboardingData
                const newKeyResults = [...onboardingData.keyResults];
                newKeyResults[editKeyResultModal.index] = e.target.value;
                setOnboardingData({
                  ...onboardingData,
                  keyResults: newKeyResults,
                });

                // Update modal state
                setEditKeyResultModal({
                  ...editKeyResultModal,
                  keyResult: e.target.value,
                });
              }}
              placeholder="Masukkan angka target yang spesifik dan terukur..."
              className="min-h-[100px] text-sm leading-relaxed bg-white border-green-200 focus:border-green-400 focus:ring-green-400"
            />
            <p className="text-xs text-green-600">
              💡 Tip: Pastikan target bersifat SMART (Specific, Measurable,
              Achievable, Relevant, Time-bound)
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() =>
                setEditKeyResultModal({
                  open: false,
                  index: -1,
                  keyResult: null,
                })
              }
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              onClick={() =>
                setEditKeyResultModal({
                  open: false,
                  index: -1,
                  keyResult: null,
                })
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Objective Edit Modal */}
      <Dialog open={editObjectiveModal} onOpenChange={setEditObjectiveModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-600" />
              <span>Edit Nama Goal dan Deskripsi</span>
            </DialogTitle>
            <DialogDescription>
              Edit nama goal dan deskripsi sesuai kebutuhan perusahaan Anda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="objective-title"
                className="text-sm font-medium text-orange-800"
              >
                Nama Goal:
              </Label>
              <Input
                id="objective-title"
                value={tempObjectiveTitle}
                onChange={(e) => setTempObjectiveTitle(e.target.value)}
                placeholder="Masukkan nama goal..."
                className="text-sm bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="objective-description"
                className="text-sm font-medium text-orange-800"
              >
                Deskripsi Goal:
              </Label>
              <Textarea
                id="objective-description"
                value={tempObjectiveDescription}
                onChange={(e) => setTempObjectiveDescription(e.target.value)}
                placeholder="Masukkan deskripsi goal..."
                className="min-h-[100px] text-sm leading-relaxed bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setEditObjectiveModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              onClick={async () => {
                console.log("🔍 Saving objective data:", {
                  tempObjectiveTitle,
                  tempObjectiveDescription,
                  currentOnboardingData: onboardingData,
                });

                const updatedData = {
                  ...onboardingData,
                  objective: tempObjectiveTitle,
                  objectiveDescription: tempObjectiveDescription,
                };

                // Update local state
                setOnboardingData(updatedData);
                setEditedObjective(tempObjectiveTitle);

                // Save to backend
                try {
                  const response = await fetch("/api/onboarding/progress", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedData),
                  });

                  if (!response.ok) {
                    throw new Error("Failed to save");
                  }

                  console.log("✅ Objective description saved to backend");
                } catch (error) {
                  console.error(
                    "❌ Error saving objective description:",
                    error,
                  );
                }

                setEditObjectiveModal(false);
                toast({
                  title: "Goal Berhasil Diperbarui",
                  description:
                    "Nama dan deskripsi goal telah diperbarui sesuai kebutuhan Anda.",
                  variant: "default",
                });
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Key Result Edit Modal - Using Comprehensive Form */}
      <KeyResultModal
        open={editIndividualKeyResultModal.open}
        onOpenChange={(open) =>
          setEditIndividualKeyResultModal({
            open,
            index: -1,
            keyResult: null,
            originalText: "",
          })
        }
        onSubmit={(keyResultData) => {
          // Convert the comprehensive key result data back to simple text for onboarding
          const formattedText =
            keyResultData.targetValue &&
            keyResultData.unit &&
            keyResultData.keyResultType !== "achieve_or_not"
              ? `${keyResultData.title} (Target: ${keyResultData.targetValue} ${keyResultData.unit})`
              : keyResultData.title;

          // Update the specific key result in onboardingData
          const newKeyResults = [...onboardingData.keyResults];
          if (
            editIndividualKeyResultModal.index >= 0 &&
            editIndividualKeyResultModal.index < newKeyResults.length
          ) {
            newKeyResults[editIndividualKeyResultModal.index] = formattedText;
            setOnboardingData({ ...onboardingData, keyResults: newKeyResults });
          }

          // Store the edited key result data for display override
          if (editIndividualKeyResultModal.index >= 0) {
            setEditedKeyResults((prev) => ({
              ...prev,
              [editIndividualKeyResultModal.index]: {
                title: keyResultData.title,
                description: keyResultData.description,
                keyResultType: keyResultData.keyResultType,
                baseValue: keyResultData.baseValue,
                targetValue: keyResultData.targetValue,
                currentValue: keyResultData.currentValue,
                unit: keyResultData.unit,
              },
            }));
          }

          setEditIndividualKeyResultModal({
            open: false,
            index: -1,
            keyResult: null,
            originalText: "",
          });
          toast({
            title: "Key Result Berhasil Diperbarui",
            description: "Key result telah diperbarui dengan form lengkap.",
            variant: "default",
          });
        }}
        editingKeyResult={
          editIndividualKeyResultModal.keyResult
            ? {
                title: editIndividualKeyResultModal.keyResult.title || "",
                description:
                  editIndividualKeyResultModal.keyResult.description || "",
                keyResultType:
                  editIndividualKeyResultModal.keyResult.keyResultType ||
                  "increase_to",
                baseValue:
                  editIndividualKeyResultModal.keyResult.baseValue || "0",
                targetValue:
                  editIndividualKeyResultModal.keyResult.targetValue || "0",
                currentValue:
                  editIndividualKeyResultModal.keyResult.currentValue || "0",
                unit: editIndividualKeyResultModal.keyResult.unit || "",
                status: "in_progress",
                assignedTo: (user as any)?.id || "",
              }
            : undefined
        }
        isEditing={editIndividualKeyResultModal.open}
        users={(users as any) || []}
      />

      {/* Edit Cycle Modal */}
      <EditCycleModal
        isOpen={editCycleModal}
        onClose={() => setEditCycleModal(false)}
        onSave={handleEditCycle}
        initialData={{
          periodName: onboardingData.cycleDuration,
          startDate: onboardingData.cycleStartDate,
          endDate: onboardingData.cycleEndDate,
        }}
      />

      {/* Tour Completion Modal */}
      <TourCompletionModal
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          // Start the tour system after closing completion modal
          startTour();
          // Navigate to dashboard
          setTimeout(() => {
            setIsRedirecting(true);
            setTimeout(() => {
              navigate("/");
            }, 1000);
          }, 500);
        }}
      />
    </div>
  );
}
