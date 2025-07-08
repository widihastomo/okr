import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Building, User, Package, CreditCard } from "lucide-react";
import { CompanyDataForm } from "@/components/registration/company-data-form";
import { AdminDataForm } from "@/components/registration/admin-data-form";
import { PackageSelection } from "@/components/registration/package-selection";
import { PaymentProcess } from "@/components/registration/payment-process";
import { useToast } from "@/hooks/use-toast";

export type CompanyData = {
  name: string;
  industry: string;
  size: string;
  phone: string;
  address: string;
  website?: string;
  description?: string;
};

export type AdminData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  password: string;
  confirmPassword: string;
};

export type SelectedPackage = {
  planId: string;
  billingPeriodId: string;
  addonIds: string[];
};

export type InvoiceData = {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
};

const steps = [
  { id: 1, title: "Data Perusahaan", icon: Building, description: "Informasi dasar perusahaan" },
  { id: 2, title: "Data Administrator", icon: User, description: "Informasi admin utama" },
  { id: 3, title: "Pilih Paket", icon: Package, description: "Pilih paket berlangganan" },
  { id: 4, title: "Pembayaran", icon: CreditCard, description: "Proses pembayaran" },
];

export default function ClientRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<SelectedPackage | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
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

  const handleCompanyDataSubmit = (data: CompanyData) => {
    setCompanyData(data);
    handleNext();
  };

  const handleAdminDataSubmit = (data: AdminData) => {
    setAdminData(data);
    handleNext();
  };

  const handlePackageSelection = async (packageData: SelectedPackage) => {
    setIsLoading(true);
    try {
      setSelectedPackage(packageData);
      
      // Generate invoice
      const response = await fetch('/api/registration/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyData,
          adminData,
          packageData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      const invoice = await response.json();
      setInvoiceData(invoice);
      handleNext();
      
      toast({
        title: "Invoice Generated",
        description: "Invoice berhasil dibuat, silakan lanjutkan ke pembayaran",
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: "Error",
        description: "Gagal membuat invoice, silakan coba lagi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentComplete = () => {
    toast({
      title: "Registration Complete",
      description: "Pendaftaran berhasil! Silakan login dengan akun yang telah dibuat.",
    });
    // Redirect to login page
    window.location.href = '/login';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CompanyDataForm 
            onSubmit={handleCompanyDataSubmit}
            initialData={companyData}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <AdminDataForm 
            onSubmit={handleAdminDataSubmit}
            initialData={adminData}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <PackageSelection 
            onSelect={handlePackageSelection}
            selectedPackage={selectedPackage}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <PaymentProcess 
            invoiceData={invoiceData}
            onPaymentComplete={handlePaymentComplete}
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