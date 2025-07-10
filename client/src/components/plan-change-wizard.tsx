import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, Star, Users, Shield, Zap, Crown, Loader2, ChevronRight, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SubscriptionPlan, BillingPeriod, Organization, OrganizationSubscription } from "@shared/schema";

interface PlanChangeWizardProps {
  currentPlan?: SubscriptionPlan;
  onPlanChanged?: () => void;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export default function PlanChangeWizard({ currentPlan, onPlanChanged }: PlanChangeWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<BillingPeriod | null>(null);
  const [tourProgress, setTourProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<(SubscriptionPlan & { billingPeriods: BillingPeriod[] })[]>({
    queryKey: ["/api/subscription-plans"],
  });

  // Filter out current plan and show upgrades only
  const availablePlans = plans.filter(plan => 
    plan.slug !== currentPlan?.slug && 
    parseFloat(plan.price) > parseFloat(currentPlan?.price || "0")
  );

  const wizardSteps: WizardStep[] = [
    {
      id: 1,
      title: "Pilih Paket Baru",
      description: "Pilih paket yang sesuai dengan kebutuhan tim Anda",
      completed: currentStep > 1 || !!selectedPlan
    },
    {
      id: 2,
      title: "Pilih Periode Billing",
      description: "Tentukan periode pembayaran yang diinginkan",
      completed: currentStep > 2 || !!selectedBilling
    },
    {
      id: 3,
      title: "Konfirmasi Perubahan",
      description: "Review dan konfirmasi perubahan paket langganan",
      completed: currentStep > 3
    }
  ];

  // Plan change mutation
  const changePlanMutation = useMutation({
    mutationFn: async (data: { planId: string; billingPeriodId: string }) => {
      return await apiRequest("POST", "/api/subscription/change-plan", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-organization-with-role"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-organization"] });
      toast({
        title: "Berhasil!",
        description: "Paket berlangganan berhasil diubah",
        variant: "success",
      });
      setIsOpen(false);
      onPlanChanged?.();
      setCurrentStep(1);
      setSelectedPlan(null);
      setSelectedBilling(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah paket",
        variant: "destructive",
      });
    },
  });

  // Calculate tour progress
  useEffect(() => {
    const completedSteps = wizardSteps.filter(step => step.completed).length;
    setTourProgress((completedSteps / wizardSteps.length) * 100);
  }, [currentStep, selectedPlan, selectedBilling]);

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case "starter": return <Zap className="h-5 w-5" />;
      case "growth": return <Star className="h-5 w-5" />;
      case "scale": return <Crown className="h-5 w-5" />;
      case "enterprise": return <Shield className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan & { billingPeriods: BillingPeriod[] }) => {
    setSelectedPlan(plan);
    setCurrentStep(2);
  };

  const handleBillingSelect = (billing: BillingPeriod) => {
    setSelectedBilling(billing);
    setCurrentStep(3);
  };

  const handleConfirmChange = () => {
    if (selectedPlan && selectedBilling) {
      changePlanMutation.mutate({
        planId: selectedPlan.id,
        billingPeriodId: selectedBilling.id
      });
    }
  };

  const calculateSavings = (billing: BillingPeriod, basePrice: string) => {
    const monthlyPrice = parseFloat(basePrice);
    const totalPrice = parseFloat(billing.price);
    const normalPrice = monthlyPrice * parseInt(billing.durationMonths);
    const savings = normalPrice - totalPrice;
    const savingsPercentage = (savings / normalPrice) * 100;
    
    return {
      savings,
      savingsPercentage: Math.round(savingsPercentage)
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 border-blue-600">
          <ArrowRight className="h-4 w-4 mr-2" />
          Ubah Paket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowRight className="h-5 w-5 text-blue-600" />
            </div>
            Wizard Ubah Paket Langganan
          </DialogTitle>
          <DialogDescription>
            Ikuti panduan ini untuk mengubah paket langganan Anda dengan mudah
          </DialogDescription>
        </DialogHeader>

        {/* Progress Header */}
        <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-blue-700">
              Progress: {Math.round(tourProgress)}%
            </span>
            <span className="text-xs text-blue-600">
              Langkah {currentStep} dari {wizardSteps.length}
            </span>
          </div>
          <Progress value={tourProgress} className="h-2 bg-blue-100" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {wizardSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${
                  step.completed ? 'text-green-600' : 
                  currentStep === step.id ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                    step.completed ? 'bg-green-100 border-green-500' :
                    currentStep === step.id ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-300'
                  }`}>
                    {step.completed ? <CheckCircle className="h-4 w-4" /> : step.id}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                </div>
                {index < wizardSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Plan Info */}
        {currentPlan && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-orange-800">Paket Saat Ini</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getPlanIcon(currentPlan.slug)}
                  <div>
                    <h3 className="font-semibold text-orange-900">{currentPlan.name}</h3>
                    <p className="text-sm text-orange-700">{formatPrice(currentPlan.price)}/bulan</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                  Aktif
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Plan Selection */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Pilih Paket Upgrade</h3>
              <p className="text-sm text-gray-600">Pilih paket yang lebih tinggi untuk mendapatkan fitur tambahan</p>
            </div>
            
            {plansLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {availablePlans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                      selectedPlan?.id === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {getPlanIcon(plan.slug)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatPrice(plan.price)}
                              <span className="text-sm text-gray-500">/bulan</span>
                            </p>
                          </div>
                        </div>
                        {plan.slug === "growth" && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                            Popular
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Hingga {plan.maxUsers} pengguna</span>
                        </div>
                        <div className="space-y-1">
                          {plan.features.slice(0, 4).map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Billing Selection */}
        {currentStep === 2 && selectedPlan && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Pilih Periode Billing</h3>
              <p className="text-sm text-gray-600">Dapatkan diskon dengan periode billing yang lebih panjang</p>
            </div>

            <div className="grid gap-4">
              {selectedPlan.billingPeriods.map((billing) => {
                const { savings, savingsPercentage } = calculateSavings(billing, selectedPlan.price);
                
                return (
                  <Card 
                    key={billing.id}
                    className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                      selectedBilling?.id === billing.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleBillingSelect(billing)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                              {formatPrice(billing.price)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Total untuk {billing.durationMonths} bulan
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{billing.name}</h4>
                            <p className="text-sm text-gray-600">{billing.description}</p>
                            {savingsPercentage > 0 && (
                              <p className="text-sm text-green-600 font-medium">
                                Hemat {savingsPercentage}% ({formatPrice(savings.toString())})
                              </p>
                            )}
                          </div>
                        </div>
                        {savingsPercentage > 0 && (
                          <Badge className="bg-gradient-to-r from-green-400 to-green-500 text-white">
                            Hemat {savingsPercentage}%
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(1)}
              className="w-full"
            >
              Kembali ke Pilihan Paket
            </Button>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && selectedPlan && selectedBilling && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Konfirmasi Perubahan</h3>
              <p className="text-sm text-gray-600">Review detail perubahan paket sebelum melanjutkan</p>
            </div>

            <div className="space-y-4">
              {/* Change Summary */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-sm text-blue-800">Ringkasan Perubahan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Dari:</span>
                      <span className="font-medium">{currentPlan?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ke:</span>
                      <span className="font-medium text-blue-600">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Periode:</span>
                      <span className="font-medium">{selectedBilling.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {formatPrice(selectedBilling.price)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Keuntungan yang Anda Dapatkan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Kapasitas meningkat dari {currentPlan?.maxUsers} ke {selectedPlan.maxUsers} pengguna
                      </span>
                    </div>
                    {selectedPlan.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Important Notice */}
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 mb-1">Informasi Penting</p>
                      <p className="text-xs text-yellow-700">
                        Perubahan paket akan efektif segera setelah konfirmasi. Billing cycle akan dimulai dari hari ini.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button 
                onClick={handleConfirmChange}
                disabled={changePlanMutation.isPending}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                {changePlanMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Konfirmasi Perubahan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}