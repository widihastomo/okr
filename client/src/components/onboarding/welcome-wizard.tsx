import React, { useState } from "react";
import { useOnboarding } from "@/contexts/onboarding-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Rocket, 
  Target, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Calendar,
  BarChart3,
  Globe
} from "lucide-react";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const wizardSteps: WizardStep[] = [
  {
    id: "welcome",
    title: "Selamat Datang!",
    description: "Mari mulai perjalanan Goal Anda",
    icon: <Rocket className="w-8 h-8 text-orange-600" />,
    content: (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full flex items-center justify-center mx-auto">
          <Rocket className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Selamat Datang di Goal Management!</h2>
          <p className="text-gray-600 mt-2">
            Platform terdepan untuk mengelola Objectives dan Key Results dengan efektif
          </p>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            Dalam beberapa menit, Anda akan mempelajari cara menggunakan semua fitur 
            untuk mencapai tujuan organisasi dengan lebih terstruktur.
          </p>
        </div>
      </div>
    )
  },
  {
    id: "objectives",
    title: "Apa itu Objectives?",
    description: "Pelajari konsep dasar Goal",
    icon: <Target className="w-8 h-8 text-orange-600" />,
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <Target className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Objectives & Key Results</h2>
        </div>
        
        <div className="grid gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Objectives</h3>
            <p className="text-sm text-blue-800">
              Tujuan kualitatif yang jelas, menginspirasi, dan dapat dicapai dalam periode tertentu.
            </p>
            <p className="text-xs text-blue-600 mt-1 italic">
              Contoh: "Meningkatkan kepuasan pelanggan di Q1 2025"
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">🎯 Key Results (Angka Target)</h3>
            <p className="text-sm text-green-800">
              Indikator kuantitatif yang dapat diukur untuk menentukan pencapaian objective.
            </p>
            <p className="text-xs text-green-600 mt-1 italic">
              Contoh: "Tingkatkan NPS dari 7.2 menjadi 8.5"
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "features",
    title: "Fitur-Fitur Utama",
    description: "Jelajahi tools yang tersedia",
    icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
    content: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
          Fitur yang Akan Anda Gunakan
        </h2>
        
        <div className="grid gap-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Dashboard Goals</h3>
              <p className="text-sm text-gray-600">Kelola semua objectives dan progress</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Daily Focus</h3>
              <p className="text-sm text-gray-600">Prioritas dan task harian</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">Analisis performa dan insights</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Kolaborasi Tim</h3>
              <p className="text-sm text-gray-600">Kerja sama antar anggota tim</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "ready",
    title: "Siap Memulai!",
    description: "Mari mulai tour interaktif",
    icon: <CheckCircle className="w-8 h-8 text-green-600" />,
    content: (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Anda Siap Memulai!</h2>
          <p className="text-gray-600 mt-2">
            Sekarang mari kita lakukan tour interaktif untuk mempelajari fitur-fitur secara langsung.
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-900 mb-2">Yang Akan Anda Pelajari:</h3>
          <ul className="text-sm text-orange-800 space-y-1 text-left">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Membuat objective pertama</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Menambahkan key results</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Menggunakan Daily Focus</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Tracking progress harian</span>
            </li>
          </ul>
        </div>
      </div>
    )
  }
];

export const WelcomeWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { startTour, skipTour } = useOnboarding();

  const handleNext = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Start the main welcome tour
      startTour("welcome");
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    skipTour();
  };

  const progress = ((currentStep + 1) / wizardSteps.length) * 100;
  const step = wizardSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              Welcome Wizard
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Lewati
            </Button>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{currentStep + 1} dari {wizardSteps.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step Content */}
          <div className="min-h-[300px]">
            {step.content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1"
            >
              ← Kembali
            </Button>

            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 flex items-center gap-1"
            >
              {currentStep === wizardSteps.length - 1 ? (
                <>
                  Mulai Tour
                  <Rocket className="w-4 h-4" />
                </>
              ) : (
                <>
                  Lanjut
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};