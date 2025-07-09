import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Building, User, Mail, Rocket } from "lucide-react";
import { UserRegistrationForm } from "@/components/registration/user-registration-form";
import { EmailVerificationForm } from "@/components/registration/email-verification-form";
import { ClientOnboardingForm } from "@/components/registration/client-onboarding-form";
import { useToast } from "@/hooks/use-toast";

export type UserRegistrationData = {
  userName: string;
  businessName: string;
  whatsappNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type EmailVerificationData = {
  verificationCode: string;
  email: string;
};

export type OnboardingData = {
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
};

const steps = [
  { id: 1, title: "Data Pengguna", icon: User, description: "Informasi dasar pengguna dan usaha" },
  { id: 2, title: "Verifikasi Email", icon: Mail, description: "Konfirmasi alamat email" },
  { id: 3, title: "Onboarding", icon: Rocket, description: "Setup awal platform" },
];

export default function ClientRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userRegistrationData, setUserRegistrationData] = useState<UserRegistrationData | null>(null);
  const [emailVerificationData, setEmailVerificationData] = useState<EmailVerificationData | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUserRegistrationSubmit = async (data: UserRegistrationData) => {
    setIsLoading(true);
    try {
      // Send registration request and email verification
      const response = await fetch('/api/registration/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification email');
      }

      setUserRegistrationData(data);
      toast({
        title: "Kode Verifikasi Dikirim",
        description: `Kode verifikasi telah dikirim ke ${data.email}. Silakan cek email Anda.`,
      });
      handleNext();
    } catch (error: any) {
      toast({
        title: "Gagal Mengirim Verifikasi",
        description: error.message || "Terjadi kesalahan saat mengirim kode verifikasi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerificationSubmit = async (data: EmailVerificationData) => {
    setIsLoading(true);
    try {
      // Verify email and create user account
      const response = await fetch('/api/registration/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userRegistrationData,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      setEmailVerificationData(data);
      toast({
        title: "Email Terverifikasi",
        description: "Email berhasil diverifikasi. Silakan lanjutkan dengan onboarding.",
      });
      handleNext();
    } catch (error: any) {
      toast({
        title: "Kode Verifikasi Salah",
        description: error.message || "Kode verifikasi tidak valid atau sudah kedaluwarsa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingSubmit = async (data: OnboardingData) => {
    setIsLoading(true);
    try {
      // Complete registration and onboarding
      const response = await fetch('/api/registration/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRegistrationData,
          emailVerificationData,
          onboardingData: data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete registration');
      }

      const result = await response.json();
      
      toast({
        title: "Registrasi Berhasil",
        description: "Akun Anda berhasil dibuat. Selamat datang di platform kami!",
      });

      // Redirect to login or dashboard
      window.location.href = '/login';
    } catch (error: any) {
      toast({
        title: "Gagal Menyelesaikan Registrasi",
        description: error.message || "Terjadi kesalahan saat menyelesaikan registrasi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <UserRegistrationForm 
            onSubmit={handleUserRegistrationSubmit}
            initialData={userRegistrationData}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <EmailVerificationForm 
            onSubmit={handleEmailVerificationSubmit}
            email={userRegistrationData?.email || ''}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <ClientOnboardingForm 
            onSubmit={handleOnboardingSubmit}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pendaftaran Client Baru
          </h1>
          <p className="text-gray-600">
            Ikuti langkah-langkah berikut untuk mendaftar sebagai client
          </p>
        </div>

        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2
                    ${isActive ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white' : 
                      isCompleted ? 'bg-green-500 text-white' : 
                      'bg-gray-200 text-gray-400'}
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className={`font-medium text-sm ${isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </div>
                  </div>
                  {step.id < steps.length && (
                    <div className={`hidden md:block w-full h-0.5 mt-6 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = steps[currentStep - 1].icon;
                return <StepIcon className="w-5 h-5" />;
              })()}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isLoading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Sebelumnya
          </Button>
          
          <div className="text-sm text-gray-500">
            Langkah {currentStep} dari {steps.length}
          </div>
          
          {currentStep < steps.length && (
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}