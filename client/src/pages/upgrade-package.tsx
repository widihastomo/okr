import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, Crown, Users, Zap, Shield, Star, CreditCard, Clock, ArrowRight } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: string;
  maxUsers: number | null;
  features: string[];
  isActive: boolean;
  billingPeriods: {
    id: string;
    periodType: string;
    periodMonths: number;
    price: string;
    discountPercentage: number;
  }[];
}

interface OrganizationSubscription {
  id: string;
  planId: string;
  planName: string;
  status: string;
  currentPeriodEnd: string;
  isTrialActive: boolean;
  trialEndsAt: string;
}

export default function UpgradePackage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedBillingPeriodId, setSelectedBillingPeriodId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch subscription plans
  const { data: plans, isLoading: isLoadingPlans, error: plansError } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/subscription-plans');
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        return [];
      }
    },
  });

  // Fetch current organization subscription
  const { data: currentSubscription } = useQuery<OrganizationSubscription>({
    queryKey: ['/api/organization/subscription'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/organization/subscription');
        return response;
      } catch (error) {
        console.error('Error fetching current subscription:', error);
        return null;
      }
    },
  });

  // Create upgrade payment mutation
  const createUpgradePayment = useMutation({
    mutationFn: async (data: { planId: string; billingPeriodId: string }) => {
      return apiRequest('POST', '/api/upgrade/create-payment', data);
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat pembayaran upgrade",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const getBillingPeriodLabel = (months: number, periodType: string) => {
    if (periodType === 'monthly') return 'Bulanan';
    if (periodType === 'quarterly') return 'Triwulan (3 bulan)';
    if (periodType === 'annual') return 'Tahunan (12 bulan)';
    return `${months} bulan`;
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'starter':
        return <Zap className="w-5 h-5 text-blue-500" />;
      case 'growth':
        return <Users className="w-5 h-5 text-green-500" />;
      case 'scale':
        return <Star className="w-5 h-5 text-purple-500" />;
      case 'enterprise':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      default:
        return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const selectedPlan = plans?.find(plan => plan.id === selectedPlanId);
  const selectedBillingPeriod = selectedPlan?.billingPeriods.find(period => period.id === selectedBillingPeriodId);

  const handleUpgrade = async () => {
    if (!selectedPlanId || !selectedBillingPeriodId) {
      toast({
        title: "Error",
        description: "Silakan pilih paket dan periode billing",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    createUpgradePayment.mutate({
      planId: selectedPlanId,
      billingPeriodId: selectedBillingPeriodId,
    });
  };

  if (isLoadingPlans) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Upgrade Paket Berlangganan</h1>
        <p className="text-lg text-gray-600">
          Tingkatkan paket Anda untuk mendapatkan fitur lebih lengkap dan batas pengguna yang lebih besar
        </p>
        
        {/* Current Plan Status */}
        {currentSubscription && (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Paket Saat Ini</p>
                    <p className="text-sm text-gray-600">{currentSubscription.planName}</p>
                  </div>
                </div>
                {currentSubscription.isTrialActive && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Trial Active
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Subscription Plans */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Pilih Paket Berlangganan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <Card 
              key={plan.id}
              className={`cursor-pointer transition-all border-2 ${
                selectedPlanId === plan.id 
                  ? 'border-orange-500 bg-orange-50 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              } ${plan.slug === 'growth' ? 'ring-2 ring-orange-200' : ''}`}
              onClick={() => {
                setSelectedPlanId(plan.id);
                setSelectedBillingPeriodId(plan.billingPeriods[0]?.id || "");
              }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getPlanIcon(plan.slug)}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  {plan.slug === 'growth' && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Populer
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatPrice(plan.price)}
                    <span className="text-sm font-normal text-gray-600">/bulan</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {plan.maxUsers ? `Hingga ${plan.maxUsers} pengguna` : 'Unlimited pengguna'}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">Fitur:</p>
                  <ul className="space-y-1 text-sm">
                    {JSON.parse(plan.features as any).slice(0, 4).map((feature: string, index: number) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {JSON.parse(plan.features as any).length > 4 && (
                      <li className="text-gray-500 text-xs">+{JSON.parse(plan.features as any).length - 4} fitur lainnya</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing Period Selection */}
      {selectedPlan && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pilih Periode Pembayaran</h3>
          
          <RadioGroup value={selectedBillingPeriodId} onValueChange={setSelectedBillingPeriodId}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedPlan.billingPeriods.map((period) => (
                <div key={period.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={period.id} id={period.id} />
                  <Label 
                    htmlFor={period.id} 
                    className="flex-1 cursor-pointer"
                  >
                    <Card className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {getBillingPeriodLabel(period.periodMonths, period.periodType)}
                          </div>
                          <div className="text-lg font-bold text-orange-600">
                            {formatPrice(period.price)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatPrice((parseFloat(period.price) / period.periodMonths).toString())}/bulan
                          </div>
                        </div>
                        {period.discountPercentage > 0 && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Hemat {period.discountPercentage}%
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Order Summary */}
      {selectedPlan && selectedBillingPeriod && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Ringkasan Pesanan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Paket:</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Periode:</span>
                <span className="font-medium">
                  {getBillingPeriodLabel(selectedBillingPeriod.periodMonths, selectedBillingPeriod.periodType)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pengguna:</span>
                <span className="font-medium">
                  {selectedPlan.maxUsers ? `Hingga ${selectedPlan.maxUsers}` : 'Unlimited'}
                </span>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-orange-600">{formatPrice(selectedBillingPeriod.price)}</span>
              </div>
              {selectedBillingPeriod.discountPercentage > 0 && (
                <div className="text-sm text-green-600">
                  Hemat {selectedBillingPeriod.discountPercentage}% dari harga bulanan
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleUpgrade}
              disabled={isProcessing || createUpgradePayment.isPending}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              {isProcessing || createUpgradePayment.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Upgrade Sekarang
                </>
              )}
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              Pembayaran aman melalui Midtrans
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}