import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Zap
} from "lucide-react";

// Onboarding steps following the reference structure
const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Fokus Tim",
    description: "Bagian mana di bisnis Anda yang ingin ditingkatkan?",
    icon: Building,
    mascotMessage: "Halo! Sebelum kita mulai, saya butuh sedikit gambaran. Bagian mana di bisnis Anda yang lagi ingin ditingkatkan? Kita akan fokus di situ supaya hasilnya benar-benar terasa.",
    mascotState: "welcome"
  },
  {
    id: 2,
    title: "Undang Tim",
    description: "Siapa saja yang akan berkolaborasi dengan Anda?",
    icon: UserPlus,
    mascotMessage: "Capai hasil besar nggak harus sendirian. Anda bisa ajak anggota tim untuk bantu jalanin inisiatif bareng.",
    mascotState: "encouraging"
  },
  {
    id: 3,
    title: "Tentukan OKR Cycle",
    description: "Berapa lama Anda ingin goal ini tercapai?",
    icon: Calendar,
    mascotMessage: "Kita perlu tentukan waktu kerja sama dulu. Berapa lama Anda ingin goal ini tercapai? Dengan tahu batas waktunya, kita bisa bantu atur ritme dan evaluasi di akhir.",
    mascotState: "thinking"
  },
  {
    id: 4,
    title: "Buat Objective",
    description: "Tulis satu tujuan yang penting dan bermakna",
    icon: Target,
    mascotMessage: "Sekarang, ayo kita tulis satu tujuan yang penting dan bermakna. Biar kita punya arah yang jelas. Gak perlu rumit — cukup satu kalimat yang bisa jadi kompas kita selama beberapa minggu ke depan.",
    mascotState: "encouraging"
  },
  {
    id: 5,
    title: "Ukuran Keberhasilan",
    description: "Tentukan cara mengukur keberhasilan",
    icon: TrendingUp,
    mascotMessage: "Tujuan tanpa ukuran itu cuma harapan. Yuk kita tentukan, gimana cara Anda tahu kalau Anda berhasil?",
    mascotState: "pointing"
  },
  {
    id: 6,
    title: "Pilih Inisiatif Prioritas",
    description: "Tentukan langkah-langkah strategis untuk mencapai tujuan",
    icon: CheckCircle,
    mascotMessage: "Sekarang, mari kita pilih langkah-langkah konkret yang akan Anda ambil. Saya bantu pilih mana yang paling berdampak dan realistis.",
    mascotState: "pointing"
  },
  {
    id: 7,
    title: "Task untuk Inisiatif",
    description: "Tentukan task-task yang harus dikerjakan",
    icon: BarChart,
    mascotMessage: "Yuk kita mulai! Coba update progres pertama Anda.",
    mascotState: "celebrating"
  },
  {
    id: 8,
    title: "Reminder & Review",
    description: "Atur reminder dan review berkala",
    icon: Zap,
    mascotMessage: "Di akhir periode, kita akan review hasilnya bareng. Kalau butuh penyesuaian, saya bantu reset tujuannya.",
    mascotState: "celebrating"
  },
  {
    id: 9,
    title: "Pilih Cadence",
    description: "Seberapa sering Anda ingin update progress?",
    icon: Clock,
    mascotMessage: "Setiap tim punya ritmenya sendiri. Anda lebih nyaman update harian, mingguan, atau bulanan?",
    mascotState: "thinking"
  },
  {
    id: 10,
    title: "Dashboard Ringkas",
    description: "Lihat semua progress secara ringkas",
    icon: MessageSquare,
    mascotMessage: "Ini tempat Anda bisa lihat semua progres secara ringkas.",
    mascotState: "encouraging"
  }
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

type MascotState = "welcome" | "encouraging" | "celebrating" | "thinking" | "pointing" | "waving" | "excited" | "sleeping";

const MascotCharacter = ({ state, message }: { state: MascotState; message: string }) => {
  const getMascotColor = (state: MascotState) => {
    switch (state) {
      case "welcome": return "from-blue-500 to-purple-500";
      case "encouraging": return "from-green-500 to-blue-500";
      case "celebrating": return "from-yellow-500 to-orange-500";
      case "thinking": return "from-purple-500 to-pink-500";
      case "pointing": return "from-orange-500 to-red-500";
      case "excited": return "from-green-400 to-blue-400";
      default: return "from-blue-500 to-purple-500";
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
      <div className="flex-shrink-0">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getMascotColor(state)} flex items-center justify-center animate-pulse`}>
          <Sparkles className="w-6 h-6 text-white animate-spin" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-orange-800">Orby</span>
          <Badge variant="outline" className="text-xs">Asisten Virtual</Badge>
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
    isCompleted: false
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
    }
  });

  // Complete onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/onboarding/complete", { onboardingData });
    },
    onSuccess: () => {
      toast({
        title: "Selamat!",
        description: "Onboarding berhasil diselesaikan. Objective pertama telah dibuat!",
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
    }
  });

  const currentStepData = ONBOARDING_STEPS.find(step => step.id === onboardingData.currentStep);
  const progressPercentage = (onboardingData.completedSteps.length / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (onboardingData.currentStep < ONBOARDING_STEPS.length) {
      const newCompletedSteps = [...onboardingData.completedSteps, onboardingData.currentStep];
      const newData = {
        ...onboardingData,
        currentStep: onboardingData.currentStep + 1,
        completedSteps: newCompletedSteps
      };
      setOnboardingData(newData);
      saveProgressMutation.mutate(newData);
    }
  };

  const handlePrevious = () => {
    if (onboardingData.currentStep > 1) {
      const newData = {
        ...onboardingData,
        currentStep: onboardingData.currentStep - 1
      };
      setOnboardingData(newData);
      saveProgressMutation.mutate(newData);
    }
  };

  const handleComplete = () => {
    const finalData = {
      ...onboardingData,
      completedSteps: [...onboardingData.completedSteps, onboardingData.currentStep],
      isCompleted: true
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
              onValueChange={(value) => setOnboardingData({...onboardingData, teamFocus: value})}
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
                <RadioGroupItem value="customer_service" id="customer_service" />
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
            <Label htmlFor="team-members">Undang anggota tim (pisahkan dengan koma):</Label>
            <Textarea 
              id="team-members"
              placeholder="Masukkan email anggota tim yang ingin diundang, pisahkan dengan koma"
              value={onboardingData.invitedMembers.join(", ")}
              onChange={(e) => setOnboardingData({...onboardingData, invitedMembers: e.target.value.split(",").map(email => email.trim()).filter(email => email)})}
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
            <Select value={onboardingData.cycleDuration} onValueChange={(value) => setOnboardingData({...onboardingData, cycleDuration: value})}>
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
                    onChange={(e) => setOnboardingData({...onboardingData, cycleStartDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Tanggal Selesai</Label>
                  <Input 
                    id="end-date"
                    type="date" 
                    value={onboardingData.cycleEndDate}
                    onChange={(e) => setOnboardingData({...onboardingData, cycleEndDate: e.target.value})}
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
              "Meningkatkan omzet penjualan sebesar 25% dalam kuartal ini",
              "Menambah 50 pelanggan baru dalam 3 bulan ke depan",
              "Meningkatkan konversi lead menjadi customer sebesar 20%",
              "Memperluas pangsa pasar di 3 wilayah baru",
              "Meningkatkan rata-rata nilai transaksi per customer sebesar 15%"
            ],
            operasional: [
              "Meningkatkan efisiensi operasional sebesar 30% dalam 6 bulan",
              "Mengurangi waktu produksi rata-rata sebesar 20%",
              "Meningkatkan kepuasan karyawan mencapai skor 4.5/5",
              "Mengimplementasi sistem digital untuk otomasi proses",
              "Mengurangi biaya operasional sebesar 15% tanpa mengurangi kualitas"
            ],
            customer_service: [
              "Meningkatkan customer satisfaction score menjadi 4.8/5",
              "Mengurangi response time customer support menjadi maksimal 2 jam",
              "Meningkatkan first-call resolution rate sebesar 40%",
              "Menurunkan tingkat keluhan pelanggan sebesar 30%",
              "Meningkatkan Net Promoter Score (NPS) mencapai 70+"
            ],
            marketing: [
              "Meningkatkan brand awareness sebesar 35% di target market",
              "Menambah 10,000 follower media sosial dalam 3 bulan",
              "Meningkatkan engagement rate di social media sebesar 25%",
              "Menghasilkan 500 qualified leads per bulan",
              "Meningkatkan conversion rate website sebesar 20%"
            ]
          };
          return options[teamFocus] || [];
        };

        const objectiveOptions = getObjectiveOptions(onboardingData.teamFocus);
        
        return (
          <div className="space-y-4">
            {objectiveOptions.length > 0 && (
              <div className="space-y-3">
                <Label>Pilih objective yang sesuai untuk fokus {onboardingData.teamFocus}:</Label>
                <RadioGroup 
                  value={onboardingData.objective} 
                  onValueChange={(value) => setOnboardingData({...onboardingData, objective: value})}
                >
                  {objectiveOptions.map((option, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <RadioGroupItem value={option} id={`objective-${index}`} className="mt-1" />
                      <Label htmlFor={`objective-${index}`} className="flex-1 cursor-pointer leading-relaxed">
                        {option}
                      </Label>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2 pt-2">
                    <RadioGroupItem value="custom" id="custom-objective" />
                    <Label htmlFor="custom-objective">Atau tulis objective sendiri:</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            {(onboardingData.objective === "custom" || objectiveOptions.length === 0) && (
              <div className="space-y-2">
                <Label htmlFor="objective">Tulis objective Anda:</Label>
                <Textarea 
                  id="objective"
                  placeholder="Contoh: Meningkatkan omzet penjualan produk A sebesar 20% dalam bulan Juli"
                  value={onboardingData.objective === "custom" ? "" : onboardingData.objective}
                  onChange={(e) => setOnboardingData({...onboardingData, objective: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>
            )}
            
            {onboardingData.objective && onboardingData.objective !== "custom" && objectiveOptions.includes(onboardingData.objective) && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Objective terpilih:</strong> {onboardingData.objective}
                </p>
              </div>
            )}
          </div>
        );

      case 5: // Ukuran Keberhasilan
        const getKeyResultOptions = (objective: string) => {
          // Key Results untuk objective penjualan
          const salesKeyResults = {
            "Meningkatkan omzet penjualan sebesar 25% dalam kuartal ini": [
              "Mencapai target penjualan Rp 500 juta per bulan",
              "Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta",
              "Menambah 100 transaksi baru setiap bulan"
            ],
            "Menambah 50 pelanggan baru dalam 3 bulan ke depan": [
              "Mendapatkan 20 pelanggan baru setiap bulan",
              "Mencapai conversion rate 15% dari lead ke customer",
              "Meningkatkan customer retention rate menjadi 85%"
            ],
            "Meningkatkan konversi lead menjadi customer sebesar 20%": [
              "Mencapai conversion rate 25% dari total lead",
              "Mengurangi waktu follow-up lead menjadi maksimal 24 jam",
              "Meningkatkan kualitas lead scoring menjadi 80% akurat"
            ],
            "Memperluas pangsa pasar di 3 wilayah baru": [
              "Membuka kantor cabang di 3 kota baru",
              "Mencapai 500 customer baru dari wilayah ekspansi",
              "Meraih market share 10% di setiap wilayah baru"
            ],
            "Meningkatkan rata-rata nilai transaksi per customer sebesar 15%": [
              "Mencapai average order value Rp 1.5 juta",
              "Meningkatkan cross-selling success rate menjadi 30%",
              "Mencapai upselling rate 25% dari existing customer"
            ]
          };

          // Key Results untuk objective operasional
          const operationalKeyResults = {
            "Meningkatkan efisiensi operasional sebesar 30% dalam 6 bulan": [
              "Mengurangi waktu proses produksi menjadi 4 jam per unit",
              "Meningkatkan utilitas mesin menjadi 85%",
              "Mengurangi waste produksi menjadi maksimal 5%"
            ],
            "Mengurangi waktu produksi rata-rata sebesar 20%": [
              "Mencapai cycle time 3 jam per produk",
              "Meningkatkan throughput menjadi 50 unit per hari",
              "Mengurangi downtime mesin menjadi maksimal 2%"
            ],
            "Meningkatkan kepuasan karyawan mencapai skor 4.5/5": [
              "Mencapai employee satisfaction score 4.5/5",
              "Mengurangi turnover rate menjadi di bawah 10%",
              "Meningkatkan employee engagement score menjadi 80%"
            ],
            "Mengimplementasi sistem digital untuk otomasi proses": [
              "Mendigitalisasi 5 proses manual utama",
              "Mencapai automation rate 70% untuk proses rutin",
              "Mengurangi human error menjadi di bawah 2%"
            ],
            "Mengurangi biaya operasional sebesar 15% tanpa mengurangi kualitas": [
              "Menurunkan cost per unit menjadi Rp 50,000",
              "Meningkatkan efficiency ratio menjadi 90%",
              "Mengurangi overhead cost sebesar 20%"
            ]
          };

          // Key Results untuk objective customer service
          const customerServiceKeyResults = {
            "Meningkatkan customer satisfaction score menjadi 4.8/5": [
              "Mencapai CSAT score 4.8/5 dalam survey bulanan",
              "Meningkatkan customer retention rate menjadi 95%",
              "Mengurangi complaint rate menjadi di bawah 1%"
            ],
            "Mengurangi response time customer support menjadi maksimal 2 jam": [
              "Mencapai average response time 1 jam",
              "Meningkatkan first response rate menjadi 95%",
              "Mencapai resolution time maksimal 24 jam"
            ],
            "Meningkatkan first-call resolution rate sebesar 40%": [
              "Mencapai FCR rate 80% untuk semua inquiry",
              "Mengurangi escalation rate menjadi di bawah 10%",
              "Meningkatkan agent knowledge score menjadi 90%"
            ],
            "Menurunkan tingkat keluhan pelanggan sebesar 30%": [
              "Mengurangi complaint volume menjadi maksimal 20 per bulan",
              "Meningkatkan complaint resolution rate menjadi 98%",
              "Mencapai zero repeat complaint rate"
            ],
            "Meningkatkan Net Promoter Score (NPS) mencapai 70+": [
              "Mencapai NPS score 70+ dalam quarterly survey",
              "Meningkatkan customer advocacy rate menjadi 40%",
              "Mencapai customer recommendation rate 80%"
            ]
          };

          // Key Results untuk objective marketing
          const marketingKeyResults = {
            "Meningkatkan brand awareness sebesar 35% di target market": [
              "Mencapai brand recall 60% dalam market research",
              "Meningkatkan social media reach menjadi 100,000 per post",
              "Mencapai top-of-mind awareness 25% di kategori produk"
            ],
            "Menambah 10,000 follower media sosial dalam 3 bulan": [
              "Mencapai 10,000 new followers di Instagram",
              "Meningkatkan follower growth rate 15% per bulan",
              "Mencapai engagement rate 8% di semua platform"
            ],
            "Meningkatkan engagement rate di social media sebesar 25%": [
              "Mencapai engagement rate 10% di Instagram",
              "Meningkatkan comment rate menjadi 3% per post",
              "Mencapai share rate 5% untuk konten video"
            ],
            "Menghasilkan 500 qualified leads per bulan": [
              "Generate 500 MQL (Marketing Qualified Leads) per bulan",
              "Mencapai lead quality score 80% dari total leads",
              "Meningkatkan lead-to-customer conversion rate 20%"
            ],
            "Meningkatkan conversion rate website sebesar 20%": [
              "Mencapai website conversion rate 5%",
              "Meningkatkan landing page conversion rate menjadi 8%",
              "Mengurangi bounce rate website menjadi di bawah 40%"
            ]
          };

          // Gabungkan semua key results
          const allKeyResults = {
            ...salesKeyResults,
            ...operationalKeyResults,
            ...customerServiceKeyResults,
            ...marketingKeyResults
          };

          return allKeyResults[objective] || [];
        };

        const keyResultOptions = getKeyResultOptions(onboardingData.objective);
        const selectedKeyResults = onboardingData.keyResults.filter(kr => kr && kr !== "custom");
        
        return (
          <div className="space-y-4">
            {keyResultOptions.length > 0 && (
              <div className="space-y-3">
                <Label>Pilih Key Results untuk objective: "{onboardingData.objective}"</Label>
                <div className="space-y-2">
                  {keyResultOptions.map((option, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <Checkbox 
                        id={`keyresult-${index}`}
                        checked={selectedKeyResults.includes(option)}
                        onCheckedChange={(checked) => {
                          let newKeyResults = [...onboardingData.keyResults];
                          if (checked) {
                            newKeyResults.push(option);
                          } else {
                            newKeyResults = newKeyResults.filter(kr => kr !== option);
                          }
                          setOnboardingData({...onboardingData, keyResults: newKeyResults});
                        }}
                      />
                      <Label htmlFor={`keyresult-${index}`} className="flex-1 cursor-pointer leading-relaxed">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="custom-keyresult"
                    checked={onboardingData.keyResults.includes("custom")}
                    onCheckedChange={(checked) => {
                      let newKeyResults = [...onboardingData.keyResults];
                      if (checked) {
                        newKeyResults.push("custom");
                      } else {
                        newKeyResults = newKeyResults.filter(kr => kr !== "custom");
                      }
                      setOnboardingData({...onboardingData, keyResults: newKeyResults});
                    }}
                  />
                  <Label htmlFor="custom-keyresult">Atau tambah Key Result sendiri:</Label>
                </div>
              </div>
            )}
            
            {(onboardingData.keyResults.includes("custom") || keyResultOptions.length === 0) && (
              <div className="space-y-2">
                <Label>Tambahkan Key Results custom:</Label>
                <div className="space-y-2">
                  {onboardingData.keyResults.filter(kr => kr !== "custom" && !keyResultOptions.includes(kr)).map((kr, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input 
                        placeholder={`Key Result ${index + 1}`}
                        value={kr}
                        onChange={(e) => {
                          const newKeyResults = [...onboardingData.keyResults];
                          const customIndex = newKeyResults.findIndex(k => k === kr);
                          if (customIndex !== -1) {
                            newKeyResults[customIndex] = e.target.value;
                          }
                          setOnboardingData({...onboardingData, keyResults: newKeyResults});
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newKeyResults = onboardingData.keyResults.filter(k => k !== kr);
                          setOnboardingData({...onboardingData, keyResults: newKeyResults});
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    onClick={() => setOnboardingData({...onboardingData, keyResults: [...onboardingData.keyResults, ""]})}
                  >
                    Tambah Key Result
                  </Button>
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
              onValueChange={(value) => setOnboardingData({...onboardingData, cadence: value})}
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
                  onChange={(e) => setOnboardingData({...onboardingData, reminderTime: e.target.value})}
                />
              </div>
            )}
          </div>
        );

      case 6: // Pilih Inisiatif Prioritas
        const getInitiativeOptions = (keyResults: string[]) => {
          const initiativeMapping = {
            // Penjualan - Omzet
            "Mencapai target penjualan Rp 500 juta per bulan": [
              "Kampanye promosi bulanan dengan diskon 20%",
              "Training sales team untuk closing technique",
              "Implementasi CRM untuk follow-up lead"
            ],
            "Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta": [
              "Program bundling produk dengan harga spesial",
              "Pelatihan upselling untuk tim sales",
              "Strategi cross-selling kepada existing customer"
            ],
            "Menambah 100 transaksi baru setiap bulan": [
              "Digital marketing campaign di social media",
              "Referral program dengan reward menarik",
              "Partnership dengan marketplace online"
            ],
            
            // Penjualan - Pelanggan Baru
            "Mendapatkan 20 pelanggan baru setiap bulan": [
              "Content marketing strategy di blog dan sosmed",
              "Event networking dan product demo",
              "Program trial gratis untuk prospek"
            ],
            "Mencapai conversion rate 15% dari lead ke customer": [
              "Optimasi landing page untuk konversi",
              "Follow-up sequence email marketing",
              "Telemarketing campaign yang lebih personal"
            ],
            "Meningkatkan customer retention rate menjadi 85%": [
              "Program loyalty dengan point reward",
              "Customer success manager untuk onboarding",
              "Survey kepuasan dan improvement action"
            ],
            
            // Penjualan - Konversi Lead
            "Mencapai conversion rate 25% dari total lead": [
              "Lead scoring system untuk prioritas",
              "Personalisasi approach berdasarkan lead profile",
              "A/B testing untuk sales pitch"
            ],
            "Mengurangi waktu follow-up lead menjadi maksimal 24 jam": [
              "Automated lead notification system",
              "Dedicated lead response team",
              "Mobile app untuk quick response"
            ],
            "Meningkatkan kualitas lead scoring menjadi 80% akurat": [
              "Machine learning untuk lead analysis",
              "Feedback loop dari sales ke marketing",
              "Regular review dan update criteria"
            ],
            
            // Operasional - Efisiensi
            "Mengurangi waktu proses produksi menjadi 4 jam per unit": [
              "Implementasi lean manufacturing principles",
              "Automated production line setup",
              "Time and motion study untuk bottleneck"
            ],
            "Meningkatkan utilitas mesin menjadi 85%": [
              "Preventive maintenance schedule",
              "Operator training untuk efisiensi maksimal",
              "Real-time monitoring system"
            ],
            "Mengurangi waste produksi menjadi maksimal 5%": [
              "Quality control di setiap stage produksi",
              "Recycling program untuk material waste",
              "Supplier evaluation untuk kualitas raw material"
            ],
            
            // Customer Service - Satisfaction
            "Mencapai CSAT score 4.8/5 dalam survey bulanan": [
              "Training customer service excellence",
              "Implementasi feedback system yang real-time",
              "Reward program untuk high performing agent"
            ],
            "Meningkatkan customer retention rate menjadi 95%": [
              "Proactive customer outreach program",
              "Personalized customer journey mapping",
              "Churn prediction dan prevention strategy"
            ],
            "Mengurangi complaint rate menjadi di bawah 1%": [
              "Root cause analysis untuk recurring issues",
              "Preventive quality assurance program",
              "Customer education dan self-service portal"
            ],
            
            // Marketing - Brand Awareness
            "Mencapai brand recall 60% dalam market research": [
              "Integrated marketing campaign di multiple channel",
              "Influencer partnership program",
              "Brand activation event di target market"
            ],
            "Meningkatkan social media reach menjadi 100,000 per post": [
              "Content calendar dengan viral potential",
              "Paid social media advertising campaign",
              "Community building dan engagement program"
            ],
            "Mencapai top-of-mind awareness 25% di kategori produk": [
              "Consistent brand messaging across all touchpoint",
              "Thought leadership content strategy",
              "Strategic partnership dengan industry leader"
            ]
          };
          
          let allInitiatives = [];
          keyResults.forEach(kr => {
            if (initiativeMapping[kr]) {
              allInitiatives.push(...initiativeMapping[kr]);
            }
          });
          
          // Remove duplicates
          return [...new Set(allInitiatives)];
        };

        const selectedKeyResultsForInitiatives = onboardingData.keyResults.filter(kr => kr && kr !== "custom");
        const initiativeOptions = getInitiativeOptions(selectedKeyResultsForInitiatives);
        const selectedInitiatives = onboardingData.initiatives.filter(init => init && init !== "custom");
        
        return (
          <div className="space-y-4">
            {initiativeOptions.length > 0 && (
              <div className="space-y-3">
                <Label>Pilih inisiatif yang sesuai dengan Key Results Anda:</Label>
                <div className="space-y-2">
                  {initiativeOptions.map((option, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <Checkbox 
                        id={`initiative-${index}`}
                        checked={selectedInitiatives.includes(option)}
                        onCheckedChange={(checked) => {
                          let newInitiatives = [...onboardingData.initiatives];
                          if (checked) {
                            newInitiatives.push(option);
                          } else {
                            newInitiatives = newInitiatives.filter(init => init !== option);
                          }
                          setOnboardingData({...onboardingData, initiatives: newInitiatives});
                        }}
                      />
                      <Label htmlFor={`initiative-${index}`} className="flex-1 cursor-pointer leading-relaxed">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="custom-initiative"
                    checked={onboardingData.initiatives.includes("custom")}
                    onCheckedChange={(checked) => {
                      let newInitiatives = [...onboardingData.initiatives];
                      if (checked) {
                        newInitiatives.push("custom");
                      } else {
                        newInitiatives = newInitiatives.filter(init => init !== "custom");
                      }
                      setOnboardingData({...onboardingData, initiatives: newInitiatives});
                    }}
                  />
                  <Label htmlFor="custom-initiative">Atau tambah inisiatif sendiri:</Label>
                </div>
              </div>
            )}
            
            {(onboardingData.initiatives.includes("custom") || initiativeOptions.length === 0) && (
              <div className="space-y-2">
                <Label>Tambahkan inisiatif custom:</Label>
                <div className="space-y-2">
                  {onboardingData.initiatives.filter(init => init !== "custom" && !initiativeOptions.includes(init)).map((init, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input 
                        placeholder={`Inisiatif ${index + 1}`}
                        value={init}
                        onChange={(e) => {
                          const newInitiatives = [...onboardingData.initiatives];
                          const customIndex = newInitiatives.findIndex(i => i === init);
                          if (customIndex !== -1) {
                            newInitiatives[customIndex] = e.target.value;
                          }
                          setOnboardingData({...onboardingData, initiatives: newInitiatives});
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newInitiatives = onboardingData.initiatives.filter(i => i !== init);
                          setOnboardingData({...onboardingData, initiatives: newInitiatives});
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    onClick={() => setOnboardingData({...onboardingData, initiatives: [...onboardingData.initiatives, ""]})}
                  >
                    Tambah Inisiatif
                  </Button>
                </div>
              </div>
            )}
            
            {selectedInitiatives.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 mb-2">
                  <strong>Inisiatif terpilih:</strong>
                </p>
                <ul className="text-sm text-green-700 space-y-1">
                  {selectedInitiatives.map((init, index) => (
                    <li key={index}>• {init}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 7: // Task untuk Inisiatif
        const getTaskOptions = (initiatives: string[]) => {
          const taskMapping = {
            // Penjualan & Marketing Tasks
            "Kampanye promosi bulanan dengan diskon 20%": [
              "Buat creative design untuk promosi diskon",
              "Setup campaign di Facebook Ads dan Google Ads",
              "Siapkan landing page untuk campaign"
            ],
            "Training sales team untuk closing technique": [
              "Buat materi training closing technique",
              "Jadwalkan session training dengan sales team",
              "Evaluasi dan feedback setelah training"
            ],
            "Implementasi CRM untuk follow-up lead": [
              "Pilih dan setup CRM software",
              "Import database lead ke CRM",
              "Training tim untuk menggunakan CRM"
            ],
            "Program bundling produk dengan harga spesial": [
              "Analisis produk yang cocok untuk bundling",
              "Tentukan harga bundling yang kompetitif",
              "Buat marketing material untuk bundling"
            ],
            "Digital marketing campaign di social media": [
              "Buat content calendar untuk social media",
              "Design konten visual untuk campaign",
              "Schedule posting di multiple platform"
            ],
            "Content marketing strategy di blog dan sosmed": [
              "Riset keyword untuk content strategy",
              "Buat content calendar bulanan",
              "Tulis dan publish artikel blog"
            ],
            "Event networking dan product demo": [
              "Cari dan daftar event networking yang relevan",
              "Siapkan booth material dan product demo",
              "Follow up dengan kontak dari event"
            ],
            
            // Operasional Tasks
            "Implementasi lean manufacturing principles": [
              "Analisis current process dan identifikasi waste",
              "Training karyawan tentang lean principles",
              "Implementasi 5S di area produksi"
            ],
            "Automated production line setup": [
              "Evaluasi kebutuhan automation equipment",
              "Install dan setup automated system",
              "Training operator untuk automated system"
            ],
            "Preventive maintenance schedule": [
              "Buat schedule maintenance untuk semua mesin",
              "Siapkan checklist maintenance routine",
              "Training teknisi untuk preventive maintenance"
            ],
            "Quality control di setiap stage produksi": [
              "Buat SOP quality control untuk setiap stage",
              "Setup quality checkpoint di production line",
              "Training quality control inspector"
            ],
            
            // Customer Service Tasks
            "Training customer service excellence": [
              "Buat modul training customer service",
              "Conduct training session untuk CS team",
              "Evaluasi performance setelah training"
            ],
            "Implementasi feedback system yang real-time": [
              "Setup feedback system di website",
              "Buat dashboard untuk monitoring feedback",
              "Training tim untuk respond feedback"
            ],
            "Proactive customer outreach program": [
              "Buat database customer untuk outreach",
              "Buat script untuk customer outreach",
              "Schedule regular customer check-in"
            ],
            "Root cause analysis untuk recurring issues": [
              "Analisis data complaint untuk pattern",
              "Buat action plan untuk fix root cause",
              "Implementasi solution dan monitoring"
            ],
            
            // Marketing & Branding Tasks
            "Integrated marketing campaign di multiple channel": [
              "Buat campaign strategy untuk multiple channel",
              "Coordinate campaign launch across channel",
              "Monitor dan optimize campaign performance"
            ],
            "Content calendar dengan viral potential": [
              "Riset trending topic untuk content inspiration",
              "Buat content calendar dengan viral angle",
              "Analyze performance dan optimize content"
            ],
            "Influencer partnership program": [
              "Identifikasi influencer yang sesuai dengan brand",
              "Nego collaboration terms dengan influencer",
              "Monitor campaign performance dari influencer"
            ],
            "Brand activation event di target market": [
              "Plan concept dan venue untuk brand activation",
              "Execute brand activation event",
              "Follow up dengan participant setelah event"
            ]
          };
          
          let allTasks = [];
          initiatives.forEach(init => {
            if (taskMapping[init]) {
              allTasks.push(...taskMapping[init]);
            }
          });
          
          // Remove duplicates
          return [...new Set(allTasks)];
        };

        const selectedInitiativesForTasks = onboardingData.initiatives.filter(init => init && init !== "custom");
        const taskOptions = getTaskOptions(selectedInitiativesForTasks);
        
        if (!onboardingData.tasks) {
          onboardingData.tasks = [];
        }
        
        const selectedTasks = onboardingData.tasks.filter(task => task && task !== "custom");
        
        return (
          <div className="space-y-4">
            {taskOptions.length > 0 && (
              <div className="space-y-3">
                <Label>Pilih task untuk inisiatif yang sudah dipilih:</Label>
                <div className="space-y-2">
                  {taskOptions.map((option, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <Checkbox 
                        id={`task-${index}`}
                        checked={selectedTasks.includes(option)}
                        onCheckedChange={(checked) => {
                          let newTasks = [...(onboardingData.tasks || [])];
                          if (checked) {
                            newTasks.push(option);
                          } else {
                            newTasks = newTasks.filter(task => task !== option);
                          }
                          setOnboardingData({...onboardingData, tasks: newTasks});
                        }}
                      />
                      <Label htmlFor={`task-${index}`} className="flex-1 cursor-pointer leading-relaxed">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="custom-task"
                    checked={onboardingData.tasks && onboardingData.tasks.includes("custom")}
                    onCheckedChange={(checked) => {
                      let newTasks = [...(onboardingData.tasks || [])];
                      if (checked) {
                        newTasks.push("custom");
                      } else {
                        newTasks = newTasks.filter(task => task !== "custom");
                      }
                      setOnboardingData({...onboardingData, tasks: newTasks});
                    }}
                  />
                  <Label htmlFor="custom-task">Atau tambah task sendiri:</Label>
                </div>
              </div>
            )}
            
            {((onboardingData.tasks && onboardingData.tasks.includes("custom")) || taskOptions.length === 0) && (
              <div className="space-y-2">
                <Label>Tambahkan task custom:</Label>
                <div className="space-y-2">
                  {onboardingData.tasks && onboardingData.tasks.filter(task => task !== "custom" && !taskOptions.includes(task)).map((task, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input 
                        placeholder={`Task ${index + 1}`}
                        value={task}
                        onChange={(e) => {
                          const newTasks = [...(onboardingData.tasks || [])];
                          const customIndex = newTasks.findIndex(t => t === task);
                          if (customIndex !== -1) {
                            newTasks[customIndex] = e.target.value;
                          }
                          setOnboardingData({...onboardingData, tasks: newTasks});
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newTasks = (onboardingData.tasks || []).filter(t => t !== task);
                          setOnboardingData({...onboardingData, tasks: newTasks});
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    onClick={() => setOnboardingData({...onboardingData, tasks: [...(onboardingData.tasks || []), ""]})}
                  >
                    Tambah Task
                  </Button>
                </div>
              </div>
            )}
            
            {selectedTasks.length > 0 && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-800 mb-2">
                  <strong>Task terpilih:</strong>
                </p>
                <ul className="text-sm text-purple-700 space-y-1">
                  {selectedTasks.map((task, index) => (
                    <li key={index}>• {task}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 10: // Dashboard Ringkas
        return (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-4 text-blue-900">📊 Rekap Data Onboarding Anda</h3>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-blue-600">{onboardingData.keyResults.length}</div>
                  <div className="text-sm text-gray-600">Key Results</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-green-600">{onboardingData.initiatives.length}</div>
                  <div className="text-sm text-gray-600">Inisiatif</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-purple-600">{onboardingData.tasks ? onboardingData.tasks.length : 0}</div>
                  <div className="text-sm text-gray-600">Task</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-orange-600">{onboardingData.invitedMembers.length}</div>
                  <div className="text-sm text-gray-600">Anggota Tim</div>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-blue-800 mb-2">🎯 Objective Utama</h4>
                  <p className="text-gray-700">{onboardingData.objective || "Belum diisi"}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {onboardingData.teamFocus || "General"}
                    </span>
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded ml-2">
                      {onboardingData.cadence || "Belum dipilih"}
                    </span>
                  </div>
                </div>

                {onboardingData.keyResults.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-green-800 mb-2">📏 Key Results yang Dipilih</h4>
                    <div className="space-y-2">
                      {onboardingData.keyResults.filter(kr => kr && kr !== "custom").map((kr, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{kr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {onboardingData.initiatives.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-purple-800 mb-2">🧩 Inisiatif yang Akan Dijalankan</h4>
                    <div className="space-y-2">
                      {onboardingData.initiatives.filter(init => init && init !== "custom").map((init, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{init}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {onboardingData.tasks && onboardingData.tasks.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-orange-800 mb-2">✅ Task yang Akan Dikerjakan</h4>
                    <div className="space-y-2">
                      {onboardingData.tasks.filter(task => task && task !== "custom").map((task, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {onboardingData.invitedMembers.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-blue-800 mb-2">👥 Anggota Tim yang Diundang</h4>
                    <div className="space-y-2">
                      {onboardingData.invitedMembers.map((member, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{member}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">📅 Pengaturan Siklus</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Durasi Siklus:</strong> {onboardingData.cycleDuration || "Belum dipilih"}</p>
                    <p><strong>Tanggal Mulai:</strong> {onboardingData.cycleStartDate || "Belum diatur"}</p>
                    <p><strong>Tanggal Selesai:</strong> {onboardingData.cycleEndDate || "Belum diatur"}</p>
                    <p><strong>Cadence Review:</strong> {onboardingData.cadence || "Belum dipilih"}</p>
                    <p><strong>Waktu Reminder:</strong> {onboardingData.reminderTime || "Belum diatur"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">💡 Yang Akan Terjadi Selanjutnya</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Objective pertama akan dibuat otomatis di sistem</li>
                <li>• Key results akan diatur sebagai target yang dapat diukur</li>
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
                Anda telah menyelesaikan semua langkah onboarding. Sistem akan membantu Anda dengan:
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
                Langkah {onboardingData.currentStep} dari {ONBOARDING_STEPS.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progressPercentage)}% selesai
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                        <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                        <CardDescription>{currentStepData.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderStepContent()}
                  </CardContent>
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
                    {completeOnboardingMutation.isPending ? "Menyelesaikan..." : "Selesai"}
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