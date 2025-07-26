import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GoalWithKeyResults } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Clock, 
  Target, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  Star, 
  Calendar,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Timer,
  Brain,
  Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HabitPreferences {
  timeAvailable: string;
  difficulty: 'easy' | 'medium' | 'hard';
  categories: string[];
  focusAreas: string[];
}

interface HabitSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'monthly';
  difficulty: 'easy' | 'medium' | 'hard';
  impactScore: number;
  alignedObjectives: string[];
  timeCommitment: string;
  frequency: string;
  examples: string[];
}

interface HabitAlignmentWizardProps {
  trigger?: React.ReactNode;
}

export default function HabitAlignmentWizard({ trigger }: HabitAlignmentWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<HabitPreferences>({
    timeAvailable: "30",
    difficulty: "medium",
    categories: [],
    focusAreas: []
  });
  const [suggestions, setSuggestions] = useState<HabitSuggestion[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [isOneClickMode, setIsOneClickMode] = useState(false);

  // Fetch user's objectives
  const { data: objectives = [], isLoading: objectivesLoading } = useQuery<GoalWithKeyResults[]>({
    queryKey: ["/api/goals"],
    enabled: isOpen,
  });

  // Generate habit suggestions mutation
  const generateHabitsMutation = useMutation({
    mutationFn: async (data: {
      objectiveIds: string[];
      preferences: HabitPreferences;
    }) => {
      const selectedGoals = objectives.filter(obj => data.objectiveIds.includes(obj.id));
      const response = await apiRequest("POST", "/api/habits/generate", {
        objectiveIds: data.objectiveIds,
        objectives: selectedGoals,
        preferences: data.preferences,
        userId: (user as any)?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
      setCurrentStep(3);
      toast({
        title: "Berhasil",
        description: "Rekomendasi kebiasaan berhasil dibuat!",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal membuat rekomendasi kebiasaan",
        variant: "destructive",
      });
    },
  });

  // One-click habit generation mutation
  const oneClickGenerateMutation = useMutation({
    mutationFn: async () => {
      // Auto-select active objectives with < 80% progress
      const autoSelectedObjectives = objectives
        .filter(obj => 
          obj.status === 'on_track' || 
          obj.status === 'at_risk' || 
          obj.status === 'behind' ||
          (obj.overallProgress && obj.overallProgress < 80)
        )
        .slice(0, 3) // Limit to top 3 objectives
        .map(obj => obj.id);

      if (autoSelectedObjectives.length === 0) {
        throw new Error("Tidak ada goals aktif yang memerlukan percepatan");
      }

      // Smart preferences based on user profile
      const smartPreferences: HabitPreferences = {
        timeAvailable: "30", // Default 30 minutes
        difficulty: "medium", // Balanced approach
        categories: [],
        focusAreas: determineAutoFocusAreas(objectives.filter(obj => autoSelectedObjectives.includes(obj.id)))
      };

      const selectedGoals = objectives.filter(obj => autoSelectedObjectives.includes(obj.id));
      const response = await apiRequest("POST", "/api/habits/generate", {
        objectiveIds: autoSelectedObjectives,
        objectives: selectedGoals,
        preferences: smartPreferences,
        userId: (user as any)?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
      // Auto-select top 3 suggestions based on impact score
      const topSuggestions = (data.suggestions || [])
        .sort((a: HabitSuggestion, b: HabitSuggestion) => b.impactScore - a.impactScore)
        .slice(0, 3)
        .map((s: HabitSuggestion) => s.id);
      setSelectedHabits(topSuggestions);
      setCurrentStep(3);
      setIsOneClickMode(true);
      toast({
        title: "One-Click Setup Berhasil!",
        description: `${data.suggestions?.length || 0} kebiasaan optimal telah dipilih untuk Anda`,
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "One-Click Setup Gagal",
        description: error.message || "Gagal membuat rekomendasi otomatis",
        variant: "destructive",
      });
    },
  });

  // Determine focus areas based on objectives
  const determineAutoFocusAreas = (objectives: any[]): string[] => {
    const focusAreas: string[] = [];
    const objText = objectives.map(obj => `${obj.title} ${obj.description}`.toLowerCase()).join(' ');
    
    if (objText.includes('penjualan') || objText.includes('sales') || objText.includes('revenue')) {
      focusAreas.push('Penjualan');
    }
    if (objText.includes('produktivitas') || objText.includes('efficiency')) {
      focusAreas.push('Produktivitas');
    }
    if (objText.includes('customer') || objText.includes('pelanggan')) {
      focusAreas.push('Customer Service');
    }
    if (objText.includes('learning') || objText.includes('skill') || objText.includes('training')) {
      focusAreas.push('Pembelajaran');
    }
    if (objText.includes('leadership') || objText.includes('manage')) {
      focusAreas.push('Leadership');
    }
    
    return focusAreas.slice(0, 3); // Limit to 3 focus areas
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'daily': return Calendar;
      case 'weekly': return BarChart3;
      case 'monthly': return Trophy;
      default: return Target;
    }
  };

  const handleObjectiveToggle = (objectiveId: string) => {
    setSelectedObjectives(prev => 
      prev.includes(objectiveId)
        ? prev.filter(id => id !== objectiveId)
        : [...prev, objectiveId]
    );
  };

  const handleGenerateHabits = () => {
    if (selectedObjectives.length === 0) {
      toast({
        title: "Pilih Goals",
        description: "Silakan pilih minimal satu goal terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    generateHabitsMutation.mutate({
      objectiveIds: selectedObjectives,
      preferences,
    });
  };

  const handleHabitToggle = (habitId: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitId)
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  const handleFinishWizard = () => {
    if (selectedHabits.length === 0) {
      toast({
        title: "Pilih Kebiasaan",
        description: "Silakan pilih minimal satu kebiasaan untuk diimplementasikan",
        variant: "destructive",
      });
      return;
    }

    // Here you could save the selected habits to user preferences or tracking system
    const successMessage = isOneClickMode 
      ? `One-Click Setup selesai! ${selectedHabits.length} kebiasaan optimal siap dijalankan`
      : `${selectedHabits.length} kebiasaan berhasil ditambahkan ke rencana Anda`;
      
    toast({
      title: isOneClickMode ? "One-Click Setup Berhasil!" : "Kebiasaan Tersimpan!",
      description: successMessage,
      className: "border-green-200 bg-green-50 text-green-800",
    });
    
    setIsOpen(false);
    resetWizard();
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedObjectives([]);
    setPreferences({
      timeAvailable: "30",
      difficulty: "medium",
      categories: [],
      focusAreas: []
    });
    setSuggestions([]);
    setSelectedHabits([]);
    setIsOneClickMode(false);
  };

  const stepProgress = (currentStep / 3) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Habit Alignment Wizard
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>Habit Alignment Wizard</span>
          </DialogTitle>
          <DialogDescription>
            Dapatkan rekomendasi kebiasaan yang diselaraskan dengan goals Anda untuk mempercepat pencapaian target
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Langkah {currentStep} dari 3</span>
              <span className="text-gray-600">{Math.round(stepProgress)}%</span>
            </div>
            <Progress value={stepProgress} className="w-full" />
          </div>

          {/* One-Click vs Manual Choice */}
          {currentStep === 1 && !isOneClickMode && (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Pilih Mode Setup</h2>
                <p className="text-gray-600">Bagaimana Anda ingin membuat habit alignment?</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* One-Click Option */}
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">One-Click Setup</h3>
                      <p className="text-sm text-gray-600 mt-2">
                        AI otomatis memilih goals yang perlu dipercepat dan membuat kebiasaan optimal untuk Anda
                      </p>
                    </div>
                    <Button
                      onClick={() => oneClickGenerateMutation.mutate()}
                      disabled={oneClickGenerateMutation.isPending || objectives.length === 0}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {oneClickGenerateMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Membuat Setup...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Mulai One-Click Setup
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Manual Option */}
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-200">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Manual Setup</h3>
                      <p className="text-sm text-gray-600 mt-2">
                        Pilih goals secara manual dan atur preferensi detail sesuai kebutuhan Anda
                      </p>
                    </div>
                    <Button
                      onClick={() => setCurrentStep(2)}
                      variant="outline"
                      className="w-full"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Pilih Manual Setup
                    </Button>
                  </div>
                </Card>
              </div>

              {objectives.length === 0 && (
                <div className="text-center py-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>Perhatian:</strong> Anda belum memiliki goals aktif. Buat goals terlebih dahulu untuk menggunakan Habit Alignment Wizard.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Tabs value={currentStep.toString()} className={`w-full ${currentStep === 1 && !isOneClickMode ? 'hidden' : ''}`}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1" disabled={currentStep < 1} className="text-base px-4 py-3">
                <Target className="w-5 h-5 mr-2" />
                Pilih Goals
              </TabsTrigger>
              <TabsTrigger value="2" disabled={currentStep < 2} className="text-base px-4 py-3">
                <Timer className="w-5 h-5 mr-2" />
                Preferensi
              </TabsTrigger>
              <TabsTrigger value="3" disabled={currentStep < 3} className="text-base px-4 py-3">
                <Lightbulb className="w-5 h-5 mr-2" />
                Rekomendasi
              </TabsTrigger>
            </TabsList>

            {/* Step 1: Select Objectives (Manual Mode) */}
            <TabsContent value="1" className="space-y-4">
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold mb-2">Pilih Goals yang Ingin Difokuskan</h3>
                <p className="text-gray-600">Pilih satu atau lebih goals yang ingin Anda percepat pencapaiannya</p>
              </div>

              {objectivesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : objectives.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada Goals</h3>
                  <p className="text-gray-500">Buat goals terlebih dahulu untuk menggunakan fitur ini</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {objectives.map((objective) => (
                    <Card 
                      key={objective.id}
                      className={`cursor-pointer transition-all ${
                        selectedObjectives.includes(objective.id)
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleObjectiveToggle(objective.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={selectedObjectives.includes(objective.id)}
                            onChange={() => {}} // Handled by card click
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{objective.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-gray-600">
                                  {objective.overallProgress?.toFixed(0) || 0}% progress
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {objective.keyResults?.length || 0} angka target
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => {
                  setCurrentStep(1);
                  setIsOneClickMode(false);
                }}>
                  Kembali ke Mode
                </Button>
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={selectedObjectives.length === 0}
                >
                  Lanjut ke Preferensi
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>

            {/* Step 2: Preferences */}
            <TabsContent value="2" className="space-y-6">
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold mb-2">Atur Preferensi Kebiasaan</h3>
                <p className="text-gray-600">Sesuaikan rekomendasi dengan jadwal dan preferensi Anda</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timeAvailable">Waktu Tersedia per Hari</Label>
                  <Select 
                    value={preferences.timeAvailable} 
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, timeAvailable: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih waktu tersedia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 menit</SelectItem>
                      <SelectItem value="30">30 menit</SelectItem>
                      <SelectItem value="45">45 menit</SelectItem>
                      <SelectItem value="60">1 jam</SelectItem>
                      <SelectItem value="90">1.5 jam</SelectItem>
                      <SelectItem value="120">2 jam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Tingkat Kesulitan</Label>
                  <Select 
                    value={preferences.difficulty} 
                    onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                      setPreferences(prev => ({ ...prev, difficulty: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tingkat kesulitan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Mudah - Kebiasaan sederhana</SelectItem>
                      <SelectItem value="medium">Sedang - Kebiasaan moderat</SelectItem>
                      <SelectItem value="hard">Sulit - Kebiasaan menantang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Area Fokus (Opsional)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    'Penjualan', 'Produktivitas', 'Pembelajaran', 'Networking', 
                    'Customer Service', 'Leadership', 'Kualitas', 'Inovasi'
                  ].map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={area}
                        checked={preferences.focusAreas.includes(area)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPreferences(prev => ({
                              ...prev,
                              focusAreas: [...prev.focusAreas, area]
                            }));
                          } else {
                            setPreferences(prev => ({
                              ...prev,
                              focusAreas: prev.focusAreas.filter(f => f !== area)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={area} className="text-sm">{area}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Kembali
                </Button>
                <Button
                  onClick={handleGenerateHabits}
                  disabled={generateHabitsMutation.isPending}
                >
                  {generateHabitsMutation.isPending ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Membuat Rekomendasi...
                    </>
                  ) : (
                    <>
                      Buat Rekomendasi
                      <Zap className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Step 3: Recommendations */}
            <TabsContent value="3" className="space-y-4">
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
                  {isOneClickMode && <Zap className="h-5 w-5 text-purple-600" />}
                  {isOneClickMode ? "One-Click Setup Berhasil!" : "Rekomendasi Kebiasaan Teraligned"}
                </h3>
                <p className="text-gray-600">
                  {isOneClickMode 
                    ? "AI telah memilih kebiasaan terbaik untuk goals Anda. Review dan konfirmasi pilihan Anda."
                    : "Pilih kebiasaan yang ingin Anda implementasikan"
                  }
                </p>
                {isOneClickMode && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-purple-800">
                      <strong>Smart Selection:</strong> Sistem telah otomatis memilih {selectedHabits.length} kebiasaan berimpact tinggi untuk goals Anda
                    </p>
                  </div>
                )}
              </div>

              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada rekomendasi</h3>
                  <p className="text-gray-500">Klik tombol "Buat Rekomendasi" untuk mendapatkan saran kebiasaan</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {suggestions.map((habit) => {
                    const CategoryIcon = getCategoryIcon(habit.category);
                    return (
                      <Card 
                        key={habit.id}
                        className={`cursor-pointer transition-all ${
                          selectedHabits.includes(habit.id)
                            ? 'ring-2 ring-green-500 bg-green-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleHabitToggle(habit.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={selectedHabits.includes(habit.id)}
                              onChange={() => {}} // Handled by card click
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <CategoryIcon className="h-4 w-4 text-blue-600" />
                                <h4 className="font-semibold text-gray-900">{habit.title}</h4>
                                <Badge className={getDifficultyColor(habit.difficulty)}>
                                  {habit.difficulty === 'easy' ? 'Mudah' : 
                                   habit.difficulty === 'medium' ? 'Sedang' : 'Sulit'}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3">{habit.description}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3 text-gray-500" />
                                  <span>{habit.timeCommitment}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3 text-gray-500" />
                                  <span>{habit.frequency}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  <span>{habit.impactScore}/100 impact</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Target className="h-3 w-3 text-blue-500" />
                                  <span>{habit.alignedObjectives.length} goals</span>
                                </div>
                              </div>

                              {habit.examples.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Contoh aktivitas:</p>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {habit.examples.slice(0, 3).map((example, index) => (
                                      <li key={index} className="flex items-center space-x-1">
                                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                        <span>{example}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between pt-4">
                {isOneClickMode ? (
                  <Button variant="outline" onClick={() => {
                    setIsOpen(false);
                    resetWizard();
                  }}>
                    Tutup
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Kembali
                  </Button>
                )}
                
                {isOneClickMode ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedHabits([]);
                        setIsOneClickMode(false);
                        setCurrentStep(1);
                      }}
                    >
                      Customize Manual
                    </Button>
                    <Button
                      onClick={handleFinishWizard}
                      disabled={selectedHabits.length === 0}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Aktivasi Instant ({selectedHabits.length})
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleFinishWizard}
                    disabled={selectedHabits.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Implementasikan Kebiasaan ({selectedHabits.length})
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}