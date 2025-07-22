import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Target, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  UserPlus,
  Clock,
  BarChart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import refokusLogo from "@assets/refokus_1751810711179.png";

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Selamat Datang!",
    description: "Mari kenali fitur-fitur utama sistem OKR Refokus",
    icon: Building2,
    content: "welcome"
  },
  {
    id: 2, 
    title: "Buat Tujuan Pertama",
    description: "Tentukan objective pertama untuk organisasi Anda",
    icon: Target,
    content: "objectives"
  },
  {
    id: 3,
    title: "Undang Tim",
    description: "Ajak anggota tim untuk berkolaborasi",
    icon: Users,
    content: "team"
  },
  {
    id: 4,
    title: "Mulai Tracking",
    description: "Siap memulai perjalanan pencapaian target!",
    icon: TrendingUp,
    content: "complete"
  }
];

export default function CompanyOnboardingFunctional() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  
  const progressPercentage = (currentStep / ONBOARDING_STEPS.length) * 100;

  // Handle next step
  const handleNextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Complete onboarding
  const handleCompleteOnboarding = () => {
    localStorage.setItem("onboarding-completed", "true");
    localStorage.removeItem("welcome-screen-shown");
    
    toast({
      title: "Onboarding Selesai!",
      description: "Selamat datang di Refokus. Mari mulai mencapai target bersama!",
      variant: "success",
    });
    
    navigate("/");
  };

  // Skip onboarding
  const handleSkipOnboarding = () => {
    localStorage.setItem("onboarding-completed", "true");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const currentStepData = ONBOARDING_STEPS[currentStep - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src={refokusLogo} alt="Refokus Logo" className="h-8 w-auto" />
              <span className="ml-3 text-xl font-bold text-gray-900">
                Setup Organisasi
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={handleSkipOnboarding}
              className="text-gray-500 hover:text-gray-700"
            >
              Lewati Tour
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-medium text-gray-600">
              Progress Setup ({currentStep} dari {ONBOARDING_STEPS.length})
            </h2>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}% selesai
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {ONBOARDING_STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 ${
                  step.id === currentStep
                    ? "text-orange-600"
                    : step.id < currentStep
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id === currentStep
                      ? "bg-orange-100 text-orange-600"
                      : step.id < currentStep
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <currentStepData.icon className="h-12 w-12 text-orange-500" />
            </div>
            <CardTitle className="text-2xl">
              {currentStepData.title}
            </CardTitle>
            <CardDescription className="text-lg">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {/* Step Content */}
            {currentStepData.content === "welcome" && (
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed">
                  Selamat datang di Refokus! Sistem ini akan membantu Anda dan tim 
                  untuk mencapai target dengan metodologi OKR (Objectives and Key Results).
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
                    <Target className="h-8 w-8 text-orange-500" />
                    <div className="text-left">
                      <h4 className="font-semibold">Buat Target</h4>
                      <p className="text-sm text-gray-600">Tetapkan objective yang terukur</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                    <BarChart className="h-8 w-8 text-blue-500" />
                    <div className="text-left">
                      <h4 className="font-semibold">Track Progress</h4>
                      <p className="text-sm text-gray-600">Monitor pencapaian real-time</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStepData.content === "objectives" && (
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed">
                  Objective adalah tujuan kualitatif yang ingin Anda capai. 
                  Setelah onboarding selesai, Anda dapat membuat objective pertama di halaman utama.
                </p>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">Tips:</h4>
                  <ul className="text-sm text-orange-700 space-y-1 text-left">
                    <li>• Buat objective yang spesifik dan dapat diukur</li>
                    <li>• Tetapkan deadline yang realistis</li>
                    <li>• Assign key results untuk tracking progress</li>
                  </ul>
                </div>
              </div>
            )}

            {currentStepData.content === "team" && (
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed">
                  Undang anggota tim untuk berkolaborasi dalam mencapai target bersama. 
                  Anda dapat mengelola tim di halaman "Pengguna & Tim".
                </p>
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <UserPlus className="h-8 w-8 text-blue-500" />
                  <div className="text-left">
                    <h4 className="font-semibold">Manajemen Tim</h4>
                    <p className="text-sm text-gray-600">Kelola member, role, dan permissions</p>
                  </div>
                </div>
              </div>
            )}

            {currentStepData.content === "complete" && (
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed">
                  Selamat! Setup awal telah selesai. Anda siap menggunakan Refokus 
                  untuk mengelola OKR organisasi dan mencapai target bersama tim.
                </p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Langkah Selanjutnya:</h4>
                  <ul className="text-sm text-green-700 space-y-1 text-left">
                    <li>• Buat objective dan key results pertama</li>
                    <li>• Undang anggota tim</li>
                    <li>• Mulai tracking progress harian</li>
                    <li>• Gunakan fitur analytics untuk insights</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            <span>Sebelumnya</span>
          </Button>
          
          <Button
            onClick={handleNextStep}
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center space-x-2"
          >
            <span>
              {currentStep === ONBOARDING_STEPS.length ? "Mulai Menggunakan" : "Selanjutnya"}
            </span>
            {currentStep < ONBOARDING_STEPS.length && (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}