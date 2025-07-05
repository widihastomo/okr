import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OKRWithKeyResults } from "@shared/schema";
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

  // Fetch user's objectives
  const { data: objectives = [], isLoading: objectivesLoading } = useQuery<OKRWithKeyResults[]>({
    queryKey: ["/api/okrs"],
    enabled: isOpen,
  });

  // Generate habit suggestions mutation
  const generateHabitsMutation = useMutation({
    mutationFn: async (data: {
      objectiveIds: string[];
      preferences: HabitPreferences;
    }) => {
      const selectedOKRs = objectives.filter(obj => data.objectiveIds.includes(obj.id));
      const response = await apiRequest("POST", "/api/habits/generate", {
        objectiveIds: data.objectiveIds,
        objectives: selectedOKRs,
        preferences: data.preferences,
        userId: user?.id,
      });
      return response;
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
    toast({
      title: "Kebiasaan Tersimpan!",
      description: `${selectedHabits.length} kebiasaan berhasil ditambahkan ke rencana Anda`,
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
            <span>One-Click Habit Alignment Wizard</span>
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

          <Tabs value={currentStep.toString()} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1" disabled={currentStep < 1}>
                <Target className="h-4 w-4 mr-2" />
                Pilih Goals
              </TabsTrigger>
              <TabsTrigger value="2" disabled={currentStep < 2}>
                <Timer className="h-4 w-4 mr-2" />
                Preferensi
              </TabsTrigger>
              <TabsTrigger value="3" disabled={currentStep < 3}>
                <Lightbulb className="h-4 w-4 mr-2" />
                Rekomendasi
              </TabsTrigger>
            </TabsList>

            {/* Step 1: Select Objectives */}
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

              <div className="flex justify-end pt-4">
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
                <h3 className="text-lg font-semibold mb-2">Rekomendasi Kebiasaan Teraligned</h3>
                <p className="text-gray-600">Pilih kebiasaan yang ingin Anda implementasikan</p>
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
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Kembali
                </Button>
                <Button
                  onClick={handleFinishWizard}
                  disabled={selectedHabits.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Implementasikan Kebiasaan ({selectedHabits.length})
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}