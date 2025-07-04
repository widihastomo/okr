import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Zap, 
  Target, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Star,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Repeat,
  BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OKRWithKeyResults, User } from "@shared/schema";

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectives: OKRWithKeyResults[];
  userId: string;
}

export function HabitAlignmentWizard({ 
  open, 
  onOpenChange, 
  objectives, 
  userId 
}: HabitAlignmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [habitPreferences, setHabitPreferences] = useState({
    timeAvailable: '30', // minutes per day
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    categories: [] as string[],
    focusAreas: [] as string[]
  });
  const [suggestedHabits, setSuggestedHabits] = useState<HabitSuggestion[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const totalSteps = 4;

  // Generate AI-powered habit suggestions based on objectives
  const generateHabitSuggestions = async () => {
    setIsGenerating(true);
    try {
      const response: any = await apiRequest("POST", "/api/ai/habit-suggestions", {
        objectiveIds: selectedObjectives,
        preferences: habitPreferences,
        userId
      });
      setSuggestedHabits(response?.suggestions || []);
    } catch (error) {
      // Fallback to predefined suggestions if AI fails
      const fallbackSuggestions = generateFallbackSuggestions();
      setSuggestedHabits(fallbackSuggestions);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackSuggestions = (): HabitSuggestion[] => {
    const selectedObjs = objectives.filter(obj => selectedObjectives.includes(obj.id));
    const suggestions: HabitSuggestion[] = [];

    selectedObjs.forEach(objective => {
      // Generate habit suggestions based on objective type and key results
      if (objective.title.toLowerCase().includes('penjualan') || 
          objective.title.toLowerCase().includes('revenue') ||
          objective.keyResults?.some(kr => kr.unit === 'Rp')) {
        suggestions.push({
          id: `sales-${objective.id}`,
          title: "Daily Prospecting",
          description: "Kontak 5 prospek baru setiap hari untuk membangun pipeline penjualan yang konsisten",
          category: 'daily',
          difficulty: 'medium',
          impactScore: 85,
          alignedObjectives: [objective.id],
          timeCommitment: "30 menit",
          frequency: "Setiap hari",
          examples: ["Cold call 3 leads", "Email 2 warm prospects", "LinkedIn outreach"]
        });
      }

      if (objective.title.toLowerCase().includes('produktivitas') ||
          objective.title.toLowerCase().includes('efisiensi')) {
        suggestions.push({
          id: `productivity-${objective.id}`,
          title: "Morning Planning Ritual",
          description: "Mulai hari dengan 15 menit perencanaan untuk fokus pada prioritas tertinggi",
          category: 'daily',
          difficulty: 'easy',
          impactScore: 75,
          alignedObjectives: [objective.id],
          timeCommitment: "15 menit",
          frequency: "Setiap pagi",
          examples: ["Review top 3 priorities", "Time blocking", "Energy management"]
        });
      }

      if (objective.title.toLowerCase().includes('skill') ||
          objective.title.toLowerCase().includes('learning') ||
          objective.title.toLowerCase().includes('development')) {
        suggestions.push({
          id: `learning-${objective.id}`,
          title: "Daily Skill Building",
          description: "Dedikasikan 20 menit setiap hari untuk mempelajari skill baru yang relevan",
          category: 'daily',
          difficulty: 'medium',
          impactScore: 90,
          alignedObjectives: [objective.id],
          timeCommitment: "20 menit",
          frequency: "Setiap hari",
          examples: ["Online course", "Technical reading", "Practice exercises"]
        });
      }
    });

    // Add general productivity habits
    suggestions.push({
      id: 'general-review',
      title: "Weekly OKR Review",
      description: "Review progress mingguan terhadap semua objectives dan adjust strategi",
      category: 'weekly',
      difficulty: 'easy',
      impactScore: 80,
      alignedObjectives: selectedObjectives,
      timeCommitment: "30 menit",
      frequency: "Setiap minggu",
      examples: ["Progress check", "Obstacle identification", "Next week planning"]
    });

    return suggestions;
  };

  // Create habit tracking entries
  const createHabitTrackingMutation = useMutation({
    mutationFn: async (habitData: any) => {
      return await apiRequest("POST", "/api/habits", habitData);
    },
    onSuccess: () => {
      toast({
        title: "Sukses",
        description: `${selectedHabits.length} kebiasaan berhasil ditambahkan ke tracker Anda`,
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      onOpenChange(false);
      resetWizard();
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal membuat habit tracker",
        variant: "destructive",
      });
    },
  });

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedObjectives([]);
    setHabitPreferences({
      timeAvailable: '30',
      difficulty: 'medium',
      categories: [],
      focusAreas: []
    });
    setSuggestedHabits([]);
    setSelectedHabits([]);
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      await generateHabitSuggestions();
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinish = () => {
    const habitsToCreate = suggestedHabits
      .filter(habit => selectedHabits.includes(habit.id))
      .map(habit => ({
        title: habit.title,
        description: habit.description,
        category: habit.category,
        frequency: habit.frequency,
        timeCommitment: habit.timeCommitment,
        alignedObjectives: habit.alignedObjectives,
        userId,
        isActive: true
      }));

    createHabitTrackingMutation.mutate(habitsToCreate);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Zap className="h-12 w-12 text-blue-600 mx-auto" />
              <h3 className="text-lg font-semibold">Pilih Objectives yang Ingin Dipercepat</h3>
              <p className="text-sm text-gray-600">
                Wizard akan membuat kebiasaan harian yang secara langsung mendukung pencapaian goals Anda
              </p>
            </div>
            
            <div className="space-y-3">
              {objectives.map(objective => (
                <Card 
                  key={objective.id}
                  className={`cursor-pointer transition-all ${
                    selectedObjectives.includes(objective.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedObjectives(prev => 
                      prev.includes(objective.id)
                        ? prev.filter(id => id !== objective.id)
                        : [...prev, objective.id]
                    );
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        checked={selectedObjectives.includes(objective.id)}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{objective.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {objective.keyResults?.length || 0} Angka Target
                          </Badge>
                          <div className="text-xs text-gray-500">
                            Progress: {objective.overallProgress?.toFixed(1) || 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Clock className="h-12 w-12 text-blue-600 mx-auto" />
              <h3 className="text-lg font-semibold">Personalisasi Kebiasaan Anda</h3>
              <p className="text-sm text-gray-600">
                Beri tahu kami preferensi Anda untuk mendapatkan saran kebiasaan yang realistis
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Waktu yang Tersedia per Hari</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {['15', '30', '60', '90'].map(time => (
                    <Button
                      key={time}
                      variant={habitPreferences.timeAvailable === time ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHabitPreferences(prev => ({ ...prev, timeAvailable: time }))}
                    >
                      {time} min
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Tingkat Kesulitan</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { key: 'easy', label: 'Mudah', desc: 'Langkah kecil' },
                    { key: 'medium', label: 'Sedang', desc: 'Balanced' },
                    { key: 'hard', label: 'Menantang', desc: 'High impact' }
                  ].map(diff => (
                    <Button
                      key={diff.key}
                      variant={habitPreferences.difficulty === diff.key ? 'default' : 'outline'}
                      size="sm"
                      className="h-auto p-3 flex flex-col"
                      onClick={() => setHabitPreferences(prev => ({ ...prev, difficulty: diff.key as any }))}
                    >
                      <span className="font-medium">{diff.label}</span>
                      <span className="text-xs opacity-75">{diff.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Area Fokus (Opsional)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    'Pagi Hari', 'Sore Hari', 'Produktivitas', 'Learning',
                    'Networking', 'Health', 'Mindfulness', 'Organization'
                  ].map(area => (
                    <Button
                      key={area}
                      variant={habitPreferences.focusAreas.includes(area) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setHabitPreferences(prev => ({
                          ...prev,
                          focusAreas: prev.focusAreas.includes(area)
                            ? prev.focusAreas.filter(a => a !== area)
                            : [...prev.focusAreas, area]
                        }));
                      }}
                    >
                      {area}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Lightbulb className="h-12 w-12 text-blue-600 mx-auto" />
              <h3 className="text-lg font-semibold">Kebiasaan yang Disarankan</h3>
              <p className="text-sm text-gray-600">
                Pilih kebiasaan yang paling sesuai dengan gaya hidup dan tujuan Anda
              </p>
            </div>

            {isGenerating ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-600">Menganalisis objectives dan membuat saran kebiasaan...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestedHabits.map(habit => (
                  <Card 
                    key={habit.id}
                    className={`cursor-pointer transition-all ${
                      selectedHabits.includes(habit.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedHabits(prev => 
                        prev.includes(habit.id)
                          ? prev.filter(id => id !== habit.id)
                          : [...prev, habit.id]
                      );
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          checked={selectedHabits.includes(habit.id)}
                          onChange={() => {}}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{habit.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                Impact: {habit.impactScore}%
                              </Badge>
                              <Badge 
                                variant={habit.difficulty === 'easy' ? 'default' : 
                                        habit.difficulty === 'medium' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {habit.difficulty}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {habit.timeCommitment}
                            </span>
                            <span className="flex items-center">
                              <Repeat className="h-3 w-3 mr-1" />
                              {habit.frequency}
                            </span>
                            <span className="flex items-center">
                              <Target className="h-3 w-3 mr-1" />
                              {habit.alignedObjectives.length} Goal
                            </span>
                          </div>
                          {habit.examples.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Contoh aktivitas:</p>
                              <div className="flex flex-wrap gap-1">
                                {habit.examples.slice(0, 3).map((example, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {example}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="text-lg font-semibold">Review & Konfirmasi</h3>
              <p className="text-sm text-gray-600">
                Kebiasaan ini akan ditambahkan ke habit tracker Anda dan terintegrasi dengan OKR
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ringkasan Habit Alignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Objectives Terpilih</Label>
                  <div className="mt-1 space-y-1">
                    {objectives
                      .filter(obj => selectedObjectives.includes(obj.id))
                      .map(obj => (
                        <div key={obj.id} className="text-sm text-gray-600 flex items-center">
                          <Target className="h-3 w-3 mr-2" />
                          {obj.title}
                        </div>
                      ))
                    }
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">
                    Kebiasaan yang Akan Dibuat ({selectedHabits.length})
                  </Label>
                  <div className="mt-1 space-y-2">
                    {suggestedHabits
                      .filter(habit => selectedHabits.includes(habit.id))
                      .map(habit => (
                        <div key={habit.id} className="text-sm border rounded p-2">
                          <div className="font-medium">{habit.title}</div>
                          <div className="text-gray-600 text-xs mt-1">
                            {habit.frequency} • {habit.timeCommitment} • Impact {habit.impactScore}%
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <Separator />

                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Star className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Estimasi Impact</p>
                      <p className="text-blue-700">
                        Dengan konsistensi, kebiasaan ini dapat meningkatkan progress OKR Anda hingga{' '}
                        <span className="font-semibold">
                          {Math.round(selectedHabits.reduce((acc, id) => {
                            const habit = suggestedHabits.find(h => h.id === id);
                            return acc + (habit?.impactScore || 0);
                          }, 0) / selectedHabits.length)}%
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span>One-Click Habit Alignment Wizard</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep} dari {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && selectedObjectives.length === 0) ||
                  (currentStep === 3 && selectedHabits.length === 0)
                }
                className="flex items-center space-x-2"
              >
                <span>Lanjut</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={selectedHabits.length === 0 || createHabitTrackingMutation.isPending}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                {createHabitTrackingMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Membuat...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Buat Habit Tracker</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}