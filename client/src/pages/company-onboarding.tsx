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
    title: "Tentukan OKR Cycle",
    description: "Berapa lama Anda ingin goal ini tercapai?",
    icon: Calendar,
    mascotMessage: "Kita perlu tentukan waktu kerja sama dulu. Berapa lama Anda ingin goal ini tercapai? Dengan tahu batas waktunya, kita bisa bantu atur ritme dan evaluasi di akhir.",
    mascotState: "thinking"
  },
  {
    id: 3,
    title: "Buat Objective",
    description: "Tulis satu tujuan yang penting dan bermakna",
    icon: Target,
    mascotMessage: "Sekarang, ayo kita tulis satu tujuan yang penting dan bermakna. Biar kita punya arah yang jelas. Gak perlu rumit — cukup satu kalimat yang bisa jadi kompas kita selama beberapa minggu ke depan.",
    mascotState: "encouraging"
  },
  {
    id: 4,
    title: "Ukuran Keberhasilan",
    description: "Tentukan cara mengukur keberhasilan",
    icon: TrendingUp,
    mascotMessage: "Tujuan tanpa ukuran itu cuma harapan. Yuk kita tentukan, gimana cara Anda tahu kalau Anda berhasil?",
    mascotState: "pointing"
  },
  {
    id: 5,
    title: "Pilih Cadence",
    description: "Seberapa sering Anda ingin update progress?",
    icon: Clock,
    mascotMessage: "Setiap tim punya ritmenya sendiri. Anda lebih nyaman update harian, mingguan, atau bulanan?",
    mascotState: "thinking"
  },
  {
    id: 6,
    title: "Invite Member",
    description: "Ajak anggota tim untuk bergabung",
    icon: UserPlus,
    mascotMessage: "Capai hasil besar nggak harus sendirian. Anda bisa ajak anggota tim untuk bantu jalanin inisiatif bareng.",
    mascotState: "encouraging"
  },
  {
    id: 7,
    title: "Pilih Inisiatif Prioritas",
    description: "Tentukan langkah konkret yang akan diambil",
    icon: CheckCircle,
    mascotMessage: "Sekarang, mari kita pilih langkah-langkah konkret yang akan Anda ambil. Saya bantu pilih mana yang paling berdampak dan realistis.",
    mascotState: "pointing"
  },
  {
    id: 8,
    title: "Check-in Pertama",
    description: "Mulai dengan update progress pertama",
    icon: BarChart,
    mascotMessage: "Yuk kita mulai! Coba update progres pertama Anda.",
    mascotState: "celebrating"
  },
  {
    id: 9,
    title: "Dashboard Ringkas",
    description: "Lihat semua progress secara ringkas",
    icon: MessageSquare,
    mascotMessage: "Ini tempat Anda bisa lihat semua progres secara ringkas.",
    mascotState: "encouraging"
  },
  {
    id: 10,
    title: "Reminder & Review",
    description: "Atur reminder dan review berkala",
    icon: Zap,
    mascotMessage: "Di akhir periode, kita akan review hasilnya bareng. Kalau butuh penyesuaian, saya bantu reset tujuannya.",
    mascotState: "celebrating"
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
      return apiRequest("POST", "/api/onboarding/complete");
    },
    onSuccess: () => {
      toast({
        title: "Selamat!",
        description: "Onboarding berhasil diselesaikan. Selamat datang di platform!",
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

      case 2: // Tentukan OKR Cycle
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

      case 3: // Buat Objective
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
                </RadioGroup>
                <div className="flex items-center space-x-2 pt-2">
                  <RadioGroupItem value="custom" id="custom-objective" />
                  <Label htmlFor="custom-objective">Atau tulis objective sendiri:</Label>
                </div>
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

      case 4: // Ukuran Keberhasilan
        return (
          <div className="space-y-4">
            <Label>Tambahkan Key Results (ukuran keberhasilan):</Label>
            <div className="space-y-2">
              {onboardingData.keyResults.map((kr, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input 
                    placeholder={`Key Result ${index + 1}`}
                    value={kr}
                    onChange={(e) => {
                      const newKeyResults = [...onboardingData.keyResults];
                      newKeyResults[index] = e.target.value;
                      setOnboardingData({...onboardingData, keyResults: newKeyResults});
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newKeyResults = onboardingData.keyResults.filter((_, i) => i !== index);
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
        );

      case 5: // Pilih Cadence
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

      case 6: // Invite Member
        return (
          <div className="space-y-4">
            <Label>Undang anggota tim:</Label>
            <div className="space-y-2">
              {onboardingData.invitedMembers.map((email, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input 
                    placeholder="Email anggota tim"
                    value={email}
                    onChange={(e) => {
                      const newMembers = [...onboardingData.invitedMembers];
                      newMembers[index] = e.target.value;
                      setOnboardingData({...onboardingData, invitedMembers: newMembers});
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newMembers = onboardingData.invitedMembers.filter((_, i) => i !== index);
                      setOnboardingData({...onboardingData, invitedMembers: newMembers});
                    }}
                  >
                    Hapus
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                onClick={() => setOnboardingData({...onboardingData, invitedMembers: [...onboardingData.invitedMembers, ""]})}
              >
                Tambah Email
              </Button>
            </div>
          </div>
        );

      case 7: // Pilih Inisiatif Prioritas
        return (
          <div className="space-y-4">
            <Label>Tambahkan inisiatif prioritas:</Label>
            <div className="space-y-2">
              {onboardingData.initiatives.map((initiative, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input 
                    placeholder={`Inisiatif ${index + 1}`}
                    value={initiative}
                    onChange={(e) => {
                      const newInitiatives = [...onboardingData.initiatives];
                      newInitiatives[index] = e.target.value;
                      setOnboardingData({...onboardingData, initiatives: newInitiatives});
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newInitiatives = onboardingData.initiatives.filter((_, i) => i !== index);
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
        );

      case 8: // Check-in Pertama
        return (
          <div className="space-y-4">
            <Label htmlFor="first-checkin">Update progress pertama Anda:</Label>
            <Textarea 
              id="first-checkin"
              placeholder="Contoh: Hari ini broadcast dikirim ke 50 kontak lama. Leads masuk: 7 orang"
              value={onboardingData.firstCheckIn}
              onChange={(e) => setOnboardingData({...onboardingData, firstCheckIn: e.target.value})}
              className="min-h-[100px]"
            />
          </div>
        );

      case 9: // Dashboard Ringkas
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Preview Dashboard Anda</h3>
              <div className="space-y-2 text-sm">
                <p><strong>🎯 Objective:</strong> {onboardingData.objective || "Belum diisi"}</p>
                <p><strong>📏 Key Results:</strong> {onboardingData.keyResults.length} target</p>
                <p><strong>📅 Cadence:</strong> {onboardingData.cadence || "Belum dipilih"}</p>
                <p><strong>🧩 Inisiatif:</strong> {onboardingData.initiatives.length} langkah</p>
                <p><strong>👥 Tim:</strong> {onboardingData.invitedMembers.length} anggota</p>
              </div>
            </div>
          </div>
        );

      case 10: // Reminder & Review
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