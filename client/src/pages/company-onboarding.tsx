import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";

// Onboarding steps following the reference structure
const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Fokus Tim",
    description: "Bagian mana di bisnis Anda yang ingin ditingkatkan?",
    icon: Building,
    mascotMessage:
      "Setiap bisnis pasti punya tantangan. Ada yang tertinggal omsetnya, ada yang timnya belum sinkron. Tapi semua perubahan dimulai dari fokus. Sekarang, mari tentukan satu area yang paling penting untuk Anda perbaiki dulu. Kita tidak perlu sempurna di semua hal, cukup jadi luar biasa di satu hal.",
    mascotState: "welcome",
  },
  {
    id: 2,
    title: "Undang Tim",
    description: "Siapa saja yang akan berkolaborasi dengan Anda?",
    icon: UserPlus,
    mascotMessage:
      "Tidak ada tim hebat yang dibangun oleh satu orang. Saat Anda mengundang tim, Anda sedang menanamkan rasa tanggung jawab bersama. Bayangkan jika semua anggota tahu tujuan tim, tahu perannya — komunikasi lebih jernih, hasil lebih cepat terlihat.",
    mascotState: "encouraging",
  },
  {
    id: 3,
    title: "Tentukan Siklus Goal",
    description: "Berapa lama Anda ingin goal ini tercapai?",
    icon: Calendar,
    mascotMessage:
      "Bayangkan Anda sedang membangun jembatan. Tanpa batas waktu, pekerjaan bisa meluas tak tentu arah. Dengan siklus Goal, Anda tahu kapan harus mulai, mengevaluasi, dan menyesuaikan. Kita tidak sedang maraton tanpa garis akhir — kita sedang sprint kecil yang terarah.",
    mascotState: "thinking",
  },
  {
    id: 4,
    title: "Buat Goal",
    description: "Pilih satu tujuan yang penting dan bermakna",
    icon: Target,
    mascotMessage:
      "Banyak pemilik usaha terseret ke rutinitas harian dan kehilangan arah. Goal adalah titik utara — kompas yang menjaga Anda tetap di jalur. Mari tuliskan tujuan yang benar-benar Anda pedulikan. Bukan sekadar target, tapi alasan kenapa Anda bangun tiap pagi dan tetap berjuang.",
    mascotState: "encouraging",
  },
  {
    id: 5,
    title: "Angka Target",
    description: "Tentukan cara mengukur keberhasilan",
    icon: TrendingUp,
    mascotMessage:
      "Pernah merasa sudah sibuk setiap hari tapi tak yakin ada hasilnya? Di sinilah pentingnya angka target. Kita ubah tujuan jadi angka, agar Anda tahu persis kapan Anda berhasil, dan kapan perlu ganti cara. Ukuran ini bukan soal angka — tapi bukti bahwa kerja Anda bermakna.",
    mascotState: "pointing",
  },
  {
    id: 6,
    title: "Pilih Inisiatif Prioritas",
    description: "Tentukan langkah-langkah strategis untuk mencapai angka target",
    icon: CheckCircle,
    mascotMessage:
      "Kebanyakan strategi gagal bukan karena kurang ide, tapi karena terlalu banyak dan tak tahu mana yang penting. Inisiatif adalah langkah nyata. Kita pilih yang sederhana, bisa langsung dikerjakan, dan berdampak besar. Fokus pada satu tembakan yang paling kena sasaran.",
    mascotState: "pointing",
  },
  {
    id: 7,
    title: "Tugas untuk Inisiatif",
    description: "Tentukan tugas-tugas yang harus dikerjakan",
    icon: BarChart,
    mascotMessage:
      "Banyak tim punya strategi bagus tapi mandek di eksekusi. Kenapa? Karena rencana besar sering terasa abstrak. Di sinilah pentingnya tugas / task — langkah-langkah kecil yang bisa Anda jalankan hari ini juga.",
    mascotState: "celebrating",
  },
  {
    id: 8,
    title: "Reminder & Review",
    description: "Atur reminder dan review berkala",
    icon: Zap,
    mascotMessage:
      "Di akhir periode, kita akan review hasilnya bareng. Kalau butuh penyesuaian, saya bantu reset tujuannya.",
    mascotState: "celebrating",
  },
  {
    id: 9,
    title: "Pilih Ritme",
    description: "Seberapa sering Anda ingin update progress?",
    icon: Clock,
    mascotMessage:
      "Ritme adalah kunci konsistensi. Seperti olahraga, lebih baik dilakukan rutin meski ringan. Dengan cadence yang pas, Anda tidak akan kehilangan momentum. Bayangkan sistem ini seperti partner yang selalu mengingatkan, bukan menghakimi.",
    mascotState: "thinking",
  },
  {
    id: 10,
    title: "Dashboard Ringkas",
    description: "Lihat semua progress secara ringkas",
    icon: MessageSquare,
    mascotMessage: "Ini tempat Anda bisa lihat semua progres secara ringkas.",
    mascotState: "encouraging",
  },
];

interface OnboardingData {
  currentStep: number;
  completedSteps: number[];
  teamFocus: string;
  cycleDuration: string;
  cycleStartDate: string;
  cycleEndDate: string;
  objective: string;
  keyResults: string[];
  cadence: string;
  reminderTime: string;
  invitedMembers: string[];
  initiatives: string[];
  tasks: string[];
  firstCheckIn: string;
  isCompleted: boolean;
}

type MascotState =
  | "welcome"
  | "encouraging"
  | "celebrating"
  | "thinking"
  | "pointing"
  | "waving"
  | "excited"
  | "sleeping";

const MascotCharacter = ({
  state,
  message,
}: {
  state: MascotState;
  message: string;
}) => {
  const getMascotColor = (state: MascotState) => {
    switch (state) {
      case "welcome":
        return "from-blue-500 to-purple-500";
      case "encouraging":
        return "from-green-500 to-blue-500";
      case "celebrating":
        return "from-yellow-500 to-orange-500";
      case "thinking":
        return "from-purple-500 to-pink-500";
      case "pointing":
        return "from-orange-500 to-red-500";
      case "excited":
        return "from-green-400 to-blue-400";
      default:
        return "from-blue-500 to-purple-500";
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
      <div className="flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${getMascotColor(state)} flex items-center justify-center animate-pulse`}
        >
          <Sparkles className="w-6 h-6 text-white animate-spin" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-orange-800">Orby</span>
          <Badge variant="outline" className="text-xs">
            Asisten Virtual
          </Badge>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

export default function CompanyOnboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    currentStep: 1,
    completedSteps: [],
    teamFocus: "",
    cycleDuration: "",
    cycleStartDate: "",
    cycleEndDate: "",
    objective: "",
    keyResults: [],
    cadence: "",
    reminderTime: "",
    invitedMembers: [],
    initiatives: [],
    tasks: [],
    firstCheckIn: "",
    isCompleted: false,
  });

  // Fetch onboarding progress
  const { data: progress } = useQuery({
    queryKey: ["/api/onboarding/progress"],
    retry: false,
  });

  // Save onboarding progress
  const saveProgressMutation = useMutation({
    mutationFn: async (data: Partial<OnboardingData>) => {
      return apiRequest("PUT", "/api/onboarding/progress", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
    },
    onError: (error) => {
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
      return apiRequest("POST", "/api/onboarding/complete", { onboardingData });
    },
    onSuccess: () => {
      toast({
        title: "Selamat!",
        description:
          "Onboarding berhasil diselesaikan. Objective pertama telah dibuat!",
      });
      // Redirect to main dashboard
      window.location.href = "/";
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
  const progressPercentage =
    (onboardingData.completedSteps.length / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (onboardingData.currentStep < ONBOARDING_STEPS.length) {
      const newCompletedSteps = [
        ...onboardingData.completedSteps,
        onboardingData.currentStep,
      ];
      const newData = {
        ...onboardingData,
        currentStep: onboardingData.currentStep + 1,
        completedSteps: newCompletedSteps,
      };
      setOnboardingData(newData);
      saveProgressMutation.mutate(newData);
    }
  };

  const handlePrevious = () => {
    if (onboardingData.currentStep > 1) {
      const newData = {
        ...onboardingData,
        currentStep: onboardingData.currentStep - 1,
      };
      setOnboardingData(newData);
      saveProgressMutation.mutate(newData);
    }
  };

  const handleComplete = () => {
    const finalData = {
      ...onboardingData,
      completedSteps: [
        ...onboardingData.completedSteps,
        onboardingData.currentStep,
      ],
      isCompleted: true,
    };
    setOnboardingData(finalData);
    completeOnboardingMutation.mutate();
  };

  const renderStepContent = () => {
    switch (onboardingData.currentStep) {
      case 1: // Fokus Tim
        return (
          <div className="space-y-4">
            <Label htmlFor="team-focus">Pilih fokus bisnis Anda:</Label>
            <RadioGroup
              value={onboardingData.teamFocus}
              onValueChange={(value) =>
                setOnboardingData({ ...onboardingData, teamFocus: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="penjualan" id="penjualan" />
                <Label htmlFor="penjualan">Penjualan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="operasional" id="operasional" />
                <Label htmlFor="operasional">Operasional</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="customer_service"
                  id="customer_service"
                />
                <Label htmlFor="customer_service">Customer Service</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="marketing" id="marketing" />
                <Label htmlFor="marketing">Marketing</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 2: // Undang Tim
        return (
          <div className="space-y-4">
            <Label htmlFor="team-members">
              Undang anggota tim (pisahkan dengan koma):
            </Label>
            <Textarea
              id="team-members"
              placeholder="Masukkan email anggota tim yang ingin diundang, pisahkan dengan koma"
              value={onboardingData.invitedMembers.join(", ")}
              onChange={(e) =>
                setOnboardingData({
                  ...onboardingData,
                  invitedMembers: e.target.value
                    .split(",")
                    .map((email) => email.trim())
                    .filter((email) => email),
                })
              }
              className="min-h-[100px]"
            />
            <div className="text-sm text-gray-500">
              Contoh: john@example.com, jane@example.com
            </div>
          </div>
        );

      case 3: // Tentukan OKR Cycle
        return (
          <div className="space-y-4">
            <Label htmlFor="cycle-duration">Pilih durasi cycle:</Label>
            <Select
              value={onboardingData.cycleDuration}
              onValueChange={(value) =>
                setOnboardingData({ ...onboardingData, cycleDuration: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih durasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1_bulan">1 Bulan</SelectItem>
                <SelectItem value="3_bulan">3 Bulan (Quarterly)</SelectItem>
                <SelectItem value="6_bulan">6 Bulan</SelectItem>
                <SelectItem value="1_tahun">1 Tahun</SelectItem>
              </SelectContent>
            </Select>
            {onboardingData.cycleDuration && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Tanggal Mulai</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={onboardingData.cycleStartDate}
                    onChange={(e) =>
                      setOnboardingData({
                        ...onboardingData,
                        cycleStartDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Tanggal Selesai</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={onboardingData.cycleEndDate}
                    onChange={(e) =>
                      setOnboardingData({
                        ...onboardingData,
                        cycleEndDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 4: // Buat Objective
        const getObjectiveOptions = (teamFocus: string) => {
          const options = {
            penjualan: [
              "Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan",
              "Membangun basis pelanggan yang kuat dan loyal",
              "Mengoptimalkan konversi prospek menjadi pelanggan",
              "Memperluas jangkauan pasar ke wilayah baru",
              "Meningkatkan nilai transaksi rata-rata pelanggan",
            ],
            operasional: [
              "Mencapai efisiensi operasional yang optimal dan berkelanjutan",
              "Mempercepat proses produksi dengan kualitas terjaga",
              "Menciptakan lingkungan kerja yang produktif dan memuaskan",
              "Mengimplementasi transformasi digital untuk otomasi proses",
              "Mengoptimalkan biaya operasional tanpa mengurangi kualitas",
            ],
            customer_service: [
              "Mencapai kepuasan pelanggan yang luar biasa dan berkelanjutan",
              "Memberikan respon pelanggan yang cepat dan efektif",
              "Meningkatkan kemampuan penyelesaian masalah dengan sekali kontak",
              "Mengurangi keluhan pelanggan secara signifikan",
              "Membangun loyalitas pelanggan dan advokasi yang tinggi",
            ],
            marketing: [
              "Meningkatkan kesadaran merek di pasar target",
              "Membangun komunitas yang aktif dan engaged di media sosial",
              "Meningkatkan engagement yang berkualitas dengan audiens",
              "Menghasilkan lead berkualitas tinggi secara konsisten",
              "Meningkatkan konversi website yang efektif",
            ],
          };
          return options[teamFocus] || [];
        };

        const objectiveOptions = getObjectiveOptions(onboardingData.teamFocus);

        return (
          <div className="space-y-4">
            {objectiveOptions.length > 0 && (
              <div className="space-y-3">
                <Label>
                  Pilih Goal yang sesuai untuk fokus {onboardingData.teamFocus}:
                </Label>
                <RadioGroup
                  value={onboardingData.objective}
                  onValueChange={(value) =>
                    setOnboardingData({ ...onboardingData, objective: value })
                  }
                >
                  {objectiveOptions.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <RadioGroupItem
                        value={option}
                        id={`objective-${index}`}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={`objective-${index}`}
                        className="flex-1 cursor-pointer leading-relaxed"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {onboardingData.objective &&
              objectiveOptions.includes(onboardingData.objective) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Objective terpilih:</strong>{" "}
                    {onboardingData.objective}
                  </p>
                </div>
              )}
          </div>
        );

      case 5: // Ukuran Keberhasilan
        const getKeyResultOptions = (objective: string) => {
          // Key Results untuk objective penjualan
          const salesKeyResults = {
            "Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan":
              [
                "Mencapai target penjualan Rp 500 juta per bulan",
                "Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta",
                "Menambah 100 transaksi baru setiap bulan",
              ],
            "Membangun basis pelanggan yang kuat dan loyal": [
              "Mendapatkan 20 pelanggan baru setiap bulan",
              "Mencapai conversion rate 15% dari lead ke customer",
              "Meningkatkan customer retention rate menjadi 85%",
            ],
            "Mengoptimalkan konversi prospek menjadi pelanggan": [
              "Mencapai conversion rate 25% dari total lead",
              "Mengurangi waktu follow-up lead menjadi maksimal 24 jam",
              "Meningkatkan kualitas lead scoring menjadi 80% akurat",
            ],
            "Memperluas jangkauan pasar ke wilayah baru": [
              "Membuka kantor cabang di 3 kota baru",
              "Mencapai 500 customer baru dari wilayah ekspansi",
              "Meraih market share 10% di setiap wilayah baru",
            ],
            "Meningkatkan nilai transaksi rata-rata pelanggan": [
              "Mencapai average order value Rp 1.5 juta",
              "Meningkatkan cross-selling success rate menjadi 30%",
              "Mencapai upselling rate 25% dari existing customer",
            ],
          };

          // Key Results untuk objective operasional
          const operationalKeyResults = {
            "Mencapai efisiensi operasional yang optimal dan berkelanjutan": [
              "Mengurangi waktu proses produksi menjadi 4 jam per unit",
              "Meningkatkan utilitas mesin menjadi 85%",
              "Mengurangi waste produksi menjadi maksimal 5%",
            ],
            "Mempercepat proses produksi dengan kualitas terjaga": [
              "Mencapai cycle time 3 jam per produk",
              "Meningkatkan throughput menjadi 50 unit per hari",
              "Mengurangi downtime mesin menjadi maksimal 2%",
            ],
            "Menciptakan lingkungan kerja yang produktif dan memuaskan": [
              "Mencapai employee satisfaction score 4.5/5",
              "Mengurangi turnover rate menjadi di bawah 10%",
              "Meningkatkan employee engagement score menjadi 80%",
            ],
            "Mengimplementasi transformasi digital untuk otomasi proses": [
              "Mendigitalisasi 5 proses manual utama",
              "Mencapai automation rate 70% untuk proses rutin",
              "Mengurangi human error menjadi di bawah 2%",
            ],
            "Mengoptimalkan biaya operasional tanpa mengurangi kualitas": [
              "Menurunkan cost per unit menjadi Rp 50,000",
              "Meningkatkan efficiency ratio menjadi 90%",
              "Mengurangi overhead cost sebesar 20%",
            ],
          };

          // Key Results untuk objective customer service
          const customerServiceKeyResults = {
            "Mencapai kepuasan pelanggan yang luar biasa dan berkelanjutan": [
              "Mencapai CSAT score 4.8/5 dalam survey bulanan",
              "Meningkatkan customer retention rate menjadi 95%",
              "Mengurangi complaint rate menjadi di bawah 1%",
            ],
            "Memberikan respon pelanggan yang cepat dan efektif": [
              "Mencapai average response time 1 jam",
              "Meningkatkan first response rate menjadi 95%",
              "Mencapai resolution time maksimal 24 jam",
            ],
            "Meningkatkan kemampuan penyelesaian masalah dengan sekali kontak":
              [
                "Mencapai FCR rate 80% untuk semua inquiry",
                "Mengurangi escalation rate menjadi di bawah 10%",
                "Meningkatkan agent knowledge score menjadi 90%",
              ],
            "Mengurangi keluhan pelanggan secara signifikan": [
              "Mengurangi complaint volume menjadi maksimal 20 per bulan",
              "Meningkatkan complaint resolution rate menjadi 98%",
              "Mencapai zero repeat complaint rate",
            ],
            "Membangun loyalitas pelanggan dan advokasi yang tinggi": [
              "Mencapai NPS score 70+ dalam quarterly survey",
              "Meningkatkan customer advocacy rate menjadi 40%",
              "Mencapai customer recommendation rate 80%",
            ],
          };

          // Key Results untuk objective marketing
          const marketingKeyResults = {
            "Meningkatkan kesadaran merek di pasar target": [
              "Mencapai brand recall 60% dalam market research",
              "Meningkatkan social media reach menjadi 100,000 per post",
              "Mencapai top-of-mind awareness 25% di kategori produk",
            ],
            "Membangun komunitas yang aktif dan engaged di media sosial": [
              "Mencapai 10,000 new followers di Instagram",
              "Meningkatkan follower growth rate 15% per bulan",
              "Mencapai engagement rate 8% di semua platform",
            ],
            "Meningkatkan engagement yang berkualitas dengan audiens": [
              "Mencapai engagement rate 10% di Instagram",
              "Meningkatkan comment rate menjadi 3% per post",
              "Mencapai share rate 5% untuk konten video",
            ],
            "Menghasilkan lead berkualitas tinggi secara konsisten": [
              "Generate 500 MQL (Marketing Qualified Leads) per bulan",
              "Mencapai lead quality score 80% dari total leads",
              "Meningkatkan lead-to-customer conversion rate 20%",
            ],
            "Meningkatkan konversi website yang efektif": [
              "Mencapai website conversion rate 5%",
              "Meningkatkan landing page conversion rate menjadi 8%",
              "Mengurangi bounce rate website menjadi di bawah 40%",
            ],
          };

          // Gabungkan semua key results
          const allKeyResults = {
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
                  Pilih Angka Target untuk Goal: "{onboardingData.objective}"
                </Label>
                <div className="space-y-2">
                  {keyResultOptions.map((option, index) => (
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
                      <Label
                        htmlFor={`keyresult-${index}`}
                        className="flex-1 cursor-pointer leading-relaxed"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedKeyResults.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Key Results terpilih:</strong>
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  {selectedKeyResults.map((kr, index) => (
                    <li key={index}>• {kr}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 9: // Pilih Cadence
        return (
          <div className="space-y-4">
            <Label>Pilih ritme check-in:</Label>
            <RadioGroup
              value={onboardingData.cadence}
              onValueChange={(value) =>
                setOnboardingData({ ...onboardingData, cadence: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="harian" id="harian" />
                <Label htmlFor="harian">Harian</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mingguan" id="mingguan" />
                <Label htmlFor="mingguan">Mingguan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bulanan" id="bulanan" />
                <Label htmlFor="bulanan">Bulanan</Label>
              </div>
            </RadioGroup>
            {onboardingData.cadence && (
              <div>
                <Label htmlFor="reminder-time">Waktu reminder:</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={onboardingData.reminderTime}
                  onChange={(e) =>
                    setOnboardingData({
                      ...onboardingData,
                      reminderTime: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>
        );

      case 6: // Pilih Inisiatif Prioritas
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
          "Mendapatkan 20 pelanggan baru setiap bulan": [
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
            "Content calendar dengan viral potential",
            "Paid social media advertising campaign",
            "Community building dan engagement program",
          ],
          "Mencapai top-of-mind awareness 25% di kategori produk": [
            "Consistent brand messaging across all touchpoint",
            "Thought leadership content strategy",
            "Strategic partnership dengan industry leader",
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
                  Pilih inisiatif untuk setiap Key Result yang sudah dipilih:
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

      case 7: // Task untuk Inisiatif
        const getTaskOptions = (initiatives: string[]) => {
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

            // Customer Service Tasks
            "Training customer service excellence": [
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
            "Integrated marketing campaign di multiple channel": [
              "Buat campaign strategy untuk multiple channel",
              "Coordinate campaign launch across channel",
              "Monitor dan optimize campaign performance",
            ],
            "Content calendar dengan viral potential": [
              "Riset trending topic untuk content inspiration",
              "Buat content calendar dengan viral angle",
              "Analyze performance dan optimize content",
            ],
            "Influencer partnership program": [
              "Identifikasi influencer yang sesuai dengan brand",
              "Nego collaboration terms dengan influencer",
              "Monitor campaign performance dari influencer",
            ],
            "Brand activation event di target market": [
              "Plan concept dan venue untuk brand activation",
              "Execute brand activation event",
              "Follow up dengan participant setelah event",
            ],
          };

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

        // Create task groups by initiative
        const getTaskGroupsByInitiative = (initiatives: string[]) => {
          const taskGroups: { [key: string]: string[] } = {
            // Sales & Marketing initiatives
            "Mengoptimalkan landing page untuk konversi": [
              "Analisis current landing page performance",
              "Buat wireframe design untuk landing page baru",
              "Implementasi A/B testing untuk conversion rate",
              "Optimasi loading speed dan mobile responsiveness",
              "Setup tracking dan analytics untuk monitoring",
            ],
            "Membuat program loyalty dengan point reward": [
              "Design struktur point reward system",
              "Develop backend system untuk point tracking",
              "Buat UI/UX untuk loyalty program dashboard",
              "Integrasikan dengan payment system",
              "Launch campaign dan monitor adoption rate",
            ],
            "Menjalankan kampanye promosi bulanan dengan diskon 20%": [
              "Buat creative design untuk promosi diskon",
              "Setup campaign di Facebook Ads dan Google Ads",
              "Siapkan landing page untuk campaign",
              "Monitor dan optimize campaign performance",
              "Analisis ROI dan customer acquisition cost",
            ],
            "Melatih sales team untuk closing technique": [
              "Buat materi training closing technique",
              "Jadwalkan session training dengan sales team",
              "Evaluasi dan feedback setelah training",
              "Setup roleplay session untuk practice",
              "Monitor improvement dalam conversion rate",
            ],
            "Mengimplementasikan CRM untuk follow-up lead": [
              "Pilih dan setup CRM software",
              "Import database lead ke CRM",
              "Training tim untuk menggunakan CRM",
              "Setup automated follow-up sequence",
              "Monitor lead conversion improvement",
            ],
            "Membuat program bundling produk dengan harga spesial": [
              "Analisis produk yang cocok untuk bundling",
              "Tentukan harga bundling yang kompetitif",
              "Buat marketing material untuk bundling",
              "Launch bundling campaign",
              "Monitor sales performance bundling",
            ],
            "Melatih tim sales untuk upselling": [
              "Buat materi training upselling technique",
              "Identifikasi opportunity upselling per customer",
              "Setup reward system untuk upselling success",
              "Monitor average transaction value improvement",
              "Analisis customer satisfaction dari upselling",
            ],
            "Mengembangkan strategi cross-selling kepada existing customer": [
              "Analisis customer behavior dan purchase pattern",
              "Buat recommendation system untuk cross-selling",
              "Training sales team untuk cross-selling approach",
              "Setup automated cross-selling email campaign",
              "Monitor cross-selling conversion rate",
            ],
            "Lead scoring system untuk prioritas": [
              "Setup lead scoring criteria berdasarkan behavior",
              "Konfigurasi automated scoring dalam CRM",
              "Training sales team untuk interpretasi score",
              "Monitor dan adjust scoring algorithm",
            ],
            "Mempersonalisasi approach berdasarkan lead profile": [
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
            "Implementasi lean manufacturing principles": [
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
            "Implementasi feedback system yang real-time": [
              "Setup feedback system di website",
              "Buat dashboard untuk monitoring feedback",
              "Training tim untuk respond feedback",
              "Monitor response time dan resolution rate",
            ],
            "Reward program untuk high performing agent": [
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
            "Root cause analysis untuk recurring issues": [
              "Analisis data complaint untuk pattern",
              "Buat action plan untuk fix root cause",
              "Implementasi solution dan monitoring",
              "Monitor complaint reduction rate",
            ],
          };

          const selectedTaskGroups: { [key: string]: string[] } = {};
          initiatives.forEach((initiative) => {
            if (taskGroups[initiative]) {
              selectedTaskGroups[initiative] = taskGroups[initiative];
            }
          });

          return selectedTaskGroups;
        };

        const taskGroups = getTaskGroupsByInitiative(
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

                {Object.entries(taskGroups).map(
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
                  {Object.entries(taskGroups).map(([initiative, tasks]) => {
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
                  })}
                </div>
                <p className="text-sm text-green-700 mt-3">
                  <strong>Total: {selectedTasks.length} task terpilih</strong>
                </p>
              </div>
            )}
          </div>
        );

      case 10: // Dashboard Ringkas
        return (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-4 text-blue-900">
                📊 Rekap Data Onboarding Anda
              </h3>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-blue-600">1</div>
                  <div className="text-sm text-gray-600">Objective</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {onboardingData.keyResults.length}
                  </div>
                  <div className="text-sm text-gray-600">Key Results</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {onboardingData.initiatives.length}
                  </div>
                  <div className="text-sm text-gray-600">Inisiatif</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
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
                    🎯 Objective Utama
                  </h4>
                  <p className="text-gray-700">
                    {onboardingData.objective || "Belum diisi"}
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {onboardingData.teamFocus || "General"}
                    </span>
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded ml-2">
                      {onboardingData.cadence || "Belum dipilih"}
                    </span>
                    <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded ml-2">
                      {onboardingData.cycleDuration || "Belum dipilih"}
                    </span>
                  </div>
                </div>

                {onboardingData.keyResults.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-green-800 mb-3">
                      📏 Key Results & Hierarki Pelaksanaan
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
                                    Key Result {krIndex + 1}
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

                                const relatedTasks = taskGroups[init] || [];
                                const selectedTasksForThisInit =
                                  relatedTasks.filter((task) =>
                                    onboardingData.tasks?.includes(task),
                                  );

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
                  <h4 className="font-semibold text-gray-800 mb-2">
                    📅 Pengaturan Siklus
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <strong>Durasi Siklus:</strong>{" "}
                      {onboardingData.cycleDuration || "Belum dipilih"}
                    </p>
                    <p>
                      <strong>Tanggal Mulai:</strong>{" "}
                      {onboardingData.cycleStartDate || "Belum diatur"}
                    </p>
                    <p>
                      <strong>Tanggal Selesai:</strong>{" "}
                      {onboardingData.cycleEndDate || "Belum diatur"}
                    </p>
                    <p>
                      <strong>Cadence Review:</strong>{" "}
                      {onboardingData.cadence || "Belum dipilih"}
                    </p>
                    <p>
                      <strong>Waktu Reminder:</strong>{" "}
                      {onboardingData.reminderTime || "Belum diatur"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">
                💡 Yang Akan Terjadi Selanjutnya
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Objective pertama akan dibuat otomatis di sistem</li>
                <li>
                  • Key results akan diatur sebagai target yang dapat diukur
                </li>
                <li>• Inisiatif akan dihubungkan dengan key results</li>
                <li>• Task akan diatur sebagai langkah-langkah konkret</li>
                <li>• Anggota tim akan diundang untuk berkolaborasi</li>
                <li>• Reminder otomatis akan dimulai sesuai cadence</li>
              </ul>
            </div>
          </div>
        );

      case 8: // Reminder & Review
        return (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">🎉 Selamat!</h3>
              <p className="text-sm text-green-700 mb-3">
                Anda telah menyelesaikan semua langkah onboarding. Sistem akan
                membantu Anda dengan:
              </p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Reminder otomatis sesuai cadence yang dipilih</li>
                <li>• Dashboard ringkas untuk tracking progress</li>
                <li>• Review berkala di akhir periode</li>
                <li>• Rekomendasi penyesuaian jika diperlukan</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Selamat Datang di Platform OKR
            </h1>
            <p className="text-gray-600">
              Mari setup sistem manajemen tujuan untuk perusahaan Anda
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                Langkah {onboardingData.currentStep} dari{" "}
                {ONBOARDING_STEPS.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progressPercentage)}% selesai
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="space-y-8">
            {/* Mascot Assistant */}
            <div className="space-y-4">
              {currentStepData && (
                <MascotCharacter
                  state={currentStepData.mascotState as MascotState}
                  message={currentStepData.mascotMessage}
                />
              )}
            </div>

            {/* Step Content */}
            <div className="space-y-6">
              {currentStepData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <currentStepData.icon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {currentStepData.title}
                        </CardTitle>
                        <CardDescription>
                          {currentStepData.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>{renderStepContent()}</CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={onboardingData.currentStep === 1}
                >
                  Sebelumnya
                </Button>

                {onboardingData.currentStep === ONBOARDING_STEPS.length ? (
                  <Button
                    onClick={handleComplete}
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                    disabled={completeOnboardingMutation.isPending}
                  >
                    {completeOnboardingMutation.isPending
                      ? "Menyelesaikan..."
                      : "Selesai"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  >
                    Selanjutnya
                    <ArrowRight className="w-4 h-4 ml-2" />
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
