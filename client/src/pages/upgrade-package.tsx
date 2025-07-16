import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Check, Crown, Users, Zap, Shield, Star, CreditCard, Clock, ArrowRight, X, Sparkles, Plus, Minus, Settings, BarChart, Database, Headphones, AlertCircle } from "lucide-react";

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
  daysRemaining?: number;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: React.ReactNode;
  category: string;
  allowQuantity?: boolean;
  maxQuantity?: number;
  minQuantity?: number;
}

export default function UpgradePackage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Role-based access control for members
  if (user?.role === "member") {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-orange-100 rounded-full">
                  <AlertCircle className="w-12 h-12 text-orange-600" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Akses Terbatas
                </h1>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                  Hanya Administrator dan Pemilik organisasi yang dapat mengakses halaman upgrade paket berlangganan.
                </p>
                <div className="bg-white rounded-lg p-6 border border-orange-200">
                  <p className="text-gray-600 mb-4">
                    Untuk melakukan upgrade paket berlangganan, silakan hubungi:
                  </p>
                  <ul className="text-left space-y-2 text-gray-700">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span><strong>Administrator</strong> organisasi Anda</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span><strong>Pemilik</strong> organisasi Anda</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => window.location.assign('/')}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Kembali ke Beranda
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedBillingPeriodId, setSelectedBillingPeriodId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({});
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  // Check for payment success parameters on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const transactionStatus = urlParams.get('transaction_status');
    const orderId = urlParams.get('order_id');
    const statusCode = urlParams.get('status_code');

    console.log('URL Parameters:', { status, transactionStatus, orderId, statusCode });

    if (status === 'success' && transactionStatus === 'settlement' && orderId) {
      console.log('Payment success detected, setting state...');
      setPaymentSuccess(true);
      setPaymentData({
        orderId,
        status,
        transactionStatus,
        statusCode
      });
      
      // Show success message
      toast({
        title: "Pembayaran Berhasil!",
        description: "Paket berlangganan Anda telah berhasil diupgrade. Selamat menikmati fitur-fitur baru!",
        variant: "default",
      });

      // Refresh subscription data
      queryClient.invalidateQueries({ queryKey: ['/api/organization/subscription'] });
      
      // Clear URL parameters after a short delay to ensure state is set
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 1000);
    } else if (status === 'pending' && orderId) {
      toast({
        title: "Pembayaran Pending",
        description: "Pembayaran sedang diproses. Kami akan memberitahu Anda setelah pembayaran selesai.",
        variant: "default",
      });
      
      // Clear URL parameters
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 1000);
    } else if (status === 'error' && orderId) {
      toast({
        title: "Pembayaran Gagal",
        description: "Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.",
        variant: "destructive",
      });
      
      // Clear URL parameters
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 1000);
    }
  }, [toast, queryClient]);

  // Fetch subscription plans
  const { data: plans, isLoading: isLoadingPlans, error: plansError } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/subscription-plans');
        const data = await response.json();
        
        // Handle the response properly
        if (Array.isArray(data)) {
          return data;
        }
        
        return [];
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
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching current subscription:', error);
        return null;
      }
    },
  });

  // Create upgrade payment mutation
  const createUpgradePayment = useMutation({
    mutationFn: async (data: { planId: string; billingPeriodId: string; addOns?: any[] }) => {
      const response = await apiRequest('POST', '/api/upgrade/create-payment', data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Payment API response:', data);
      setIsProcessing(false);
      if (data.snapToken) {
        console.log('Received snapToken:', data.snapToken);
        
        // Check if Midtrans script is loaded
        console.log('Checking window.snap:', typeof (window as any).snap);
        
        // Handle Midtrans Snap payment with timeout to ensure script is loaded
        const initPayment = () => {
          if (typeof window !== 'undefined' && (window as any).snap) {
            console.log('Initializing Midtrans payment...');
            try {
              (window as any).snap.pay(data.snapToken, {
                onSuccess: async function(result: any) {
                  console.log('Payment successful:', result);
                  
                  // Set payment success state immediately
                  setPaymentSuccess(true);
                  setPaymentData({
                    orderId: result.order_id,
                    status: 'success',
                    transactionStatus: result.transaction_status,
                    statusCode: result.status_code
                  });
                  
                  // Process the payment success on backend
                  try {
                    const response = await fetch('/api/upgrade/process-payment-success', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        orderId: result.order_id,
                        planId: selectedPlan?.id,
                        billingPeriodId: selectedBillingPeriod?.id
                      }),
                    });
                    
                    if (response.ok) {
                      const data = await response.json();
                      console.log("Subscription updated successfully:", data);
                      
                      toast({
                        title: "Upgrade Berhasil!",
                        description: `Paket berlangganan berhasil diupgrade ke ${data.planName}`,
                        variant: "default",
                      });
                    } else {
                      console.error("Failed to process payment success:", response.statusText);
                      toast({
                        title: "Upgrade Gagal",
                        description: "Terjadi kesalahan saat memproses upgrade. Silakan hubungi support.",
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    console.error("Error processing payment success:", error);
                    toast({
                      title: "Upgrade Gagal",
                      description: "Terjadi kesalahan saat memproses upgrade. Silakan hubungi support.",
                      variant: "destructive",
                    });
                  }
                  
                  setShowPaymentModal(false);
                  setIsProcessing(false);
                  
                  // Refresh subscription data
                  queryClient.invalidateQueries({ queryKey: ['/api/organization/subscription'] });
                },
                onPending: function(result: any) {
                  console.log('Payment pending:', result);
                  toast({
                    title: "Pembayaran Pending",
                    description: "Pembayaran sedang diproses. Kami akan memberitahu Anda setelah selesai.",
                    variant: "default",
                  });
                  setShowPaymentModal(false);
                },
                onError: function(result: any) {
                  console.log('Payment error:', result);
                  toast({
                    title: "Pembayaran Gagal",
                    description: "Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.",
                    variant: "destructive",
                  });
                  setIsProcessing(false);
                },
                onClose: function() {
                  console.log('Payment modal closed');
                  setIsProcessing(false);
                }
              });
            } catch (error) {
              console.error('Error calling snap.pay:', error);
              toast({
                title: "Error",
                description: "Terjadi kesalahan saat membuka modal pembayaran. Silakan coba lagi.",
                variant: "destructive",
              });
              setIsProcessing(false);
            }
          } else {
            console.log('Midtrans snap not available, retrying...');
            setTimeout(initPayment, 1000);
          }
        };
        
        // Try to initialize payment immediately, then retry if needed
        initPayment();
        
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
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

  // Available Add-ons
  const availableAddOns: AddOn[] = [
    {
      id: "additional-users",
      name: "Additional Users",
      description: "Tambahan pengguna aktif untuk melebihi batas paket langganan",
      price: "15000",
      icon: <Users className="w-5 h-5" />,
      category: "Users",
      allowQuantity: true,
      maxQuantity: 50,
      minQuantity: 1
    },
    {
      id: "advanced-analytics",
      name: "Advanced Analytics",
      description: "Dashboard analitik mendalam dengan insights dan reporting otomatis",
      price: "50000",
      icon: <BarChart className="w-5 h-5" />,
      category: "Analytics"
    },
    {
      id: "priority-support",
      name: "Priority Support",
      description: "Dukungan prioritas 24/7 dengan response time maksimal 2 jam",
      price: "75000",
      icon: <Headphones className="w-5 h-5" />,
      category: "Support"
    },
    {
      id: "extra-storage",
      name: "Extra Storage",
      description: "Tambahan 100GB storage untuk file dan dokumen tim",
      price: "25000",
      icon: <Database className="w-5 h-5" />,
      category: "Storage"
    },
    {
      id: "advanced-customization",
      name: "Advanced Customization",
      description: "Kustomisasi workflow dan template sesuai kebutuhan bisnis",
      price: "100000",
      icon: <Settings className="w-5 h-5" />,
      category: "Customization"
    }
  ];

  const toggleAddOn = (addOnId: string) => {
    const newSelection = new Set(selectedAddOns);
    const addOn = availableAddOns.find(a => a.id === addOnId);
    
    if (newSelection.has(addOnId)) {
      newSelection.delete(addOnId);
      // Remove quantity when deselecting
      const newQuantities = { ...addOnQuantities };
      delete newQuantities[addOnId];
      setAddOnQuantities(newQuantities);
    } else {
      newSelection.add(addOnId);
      // Set default quantity for add-ons that allow quantity
      if (addOn?.allowQuantity) {
        setAddOnQuantities(prev => ({
          ...prev,
          [addOnId]: addOn.minQuantity || 1
        }));
      }
    }
    setSelectedAddOns(newSelection);
  };

  const updateAddOnQuantity = (addOnId: string, quantity: number) => {
    const addOn = availableAddOns.find(a => a.id === addOnId);
    if (addOn?.allowQuantity) {
      const clampedQuantity = Math.max(
        addOn.minQuantity || 1,
        Math.min(addOn.maxQuantity || 50, quantity)
      );
      setAddOnQuantities(prev => ({
        ...prev,
        [addOnId]: clampedQuantity
      }));
    }
  };

  const getSelectedAddOnsTotal = () => {
    return Array.from(selectedAddOns).reduce((total, addOnId) => {
      const addOn = availableAddOns.find(a => a.id === addOnId);
      if (!addOn) return total;
      
      const quantity = addOn.allowQuantity ? (addOnQuantities[addOnId] || 1) : 1;
      return total + (parseFloat(addOn.price) * quantity);
    }, 0);
  };

  const getTotalPrice = () => {
    const basePrice = selectedBillingPeriod ? parseFloat(selectedBillingPeriod.price) : 0;
    const addOnsTotal = getSelectedAddOnsTotal();
    return basePrice + addOnsTotal;
  };

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
    const selectedAddOnsList = Array.from(selectedAddOns).map(addOnId => {
      const addOn = availableAddOns.find(a => a.id === addOnId);
      if (!addOn) return null;
      
      const quantity = addOn.allowQuantity ? (addOnQuantities[addOnId] || 1) : 1;
      return { 
        id: addOn.id, 
        name: addOn.name, 
        price: addOn.price,
        quantity: quantity
      };
    }).filter(Boolean);

    createUpgradePayment.mutate({
      planId: selectedPlanId,
      billingPeriodId: selectedBillingPeriodId,
      addOns: selectedAddOnsList,
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



  if (!plans || plans.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Upgrade Paket Berlangganan</h1>
          <p className="text-lg text-gray-600">
            Tidak ada paket berlangganan tersedia saat ini.
          </p>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('Render state:', { paymentSuccess, paymentData });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Upgrade Paket Berlangganan</h1>
        <p className="text-lg text-gray-600">
          Tingkatkan paket Anda untuk mendapatkan fitur lebih lengkap dan batas pengguna yang lebih besar
        </p>
        
        {/* Payment Success Card */}
        {paymentSuccess && paymentData && (
          <Card className="max-w-2xl mx-auto border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-green-900">Pembayaran Berhasil!</h2>
                  <p className="text-green-700">
                    Selamat! Paket berlangganan Anda telah berhasil diupgrade.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Order ID:</p>
                      <p className="text-gray-600">{paymentData.orderId}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Status:</p>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {paymentData.transactionStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Kembali ke Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setPaymentSuccess(false)}
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Lihat Paket Lainnya
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Current Plan Status */}
        {currentSubscription && !paymentSuccess && (
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
                    {currentSubscription.isTrialActive && currentSubscription.daysRemaining !== undefined && (
                      <p className="text-xs text-orange-600 font-medium">
                        {currentSubscription.daysRemaining} hari tersisa
                      </p>
                    )}
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
      {!paymentSuccess && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Pilih Paket Berlangganan</h2>
            <p className="text-sm text-gray-600">Upgrade paket untuk mendapatkan fitur unlimited</p>
          </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <Card 
              key={plan.id}
              className={`cursor-pointer transition-all border-2 relative ${
                selectedPlanId === plan.id 
                  ? 'border-orange-500 bg-orange-50 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              } ${plan.slug === 'growth' ? 'ring-2 ring-orange-200' : ''}`}
              onClick={() => {
                setSelectedPlanId(plan.id);
                setSelectedBillingPeriodId(plan.billingPeriods[0]?.id || "");
              }}
            >
              {plan.slug === 'growth' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">
                    🔥 Paling Populer
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getPlanIcon(plan.slug)}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  {selectedPlanId === plan.id && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Dipilih
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
                  <p className="text-sm font-medium text-gray-900">Fitur Utama:</p>
                  <ul className="space-y-1 text-sm">
                    {plan.features.slice(0, 4).map((feature: string, index: number) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-gray-500 text-xs font-medium">+{plan.features.length - 4} fitur lainnya</li>
                    )}
                  </ul>
                </div>
                
                <div className="pt-2">
                  <Button 
                    variant="default"
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanId(plan.id);
                      setSelectedBillingPeriodId(plan.billingPeriods[0]?.id || "");
                      setSelectedAddOns(new Set());
                      setAddOnQuantities({});
                      setShowPaymentModal(true);
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Pilih Paket
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      )}

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3 text-2xl">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
              <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Pilih Paket Pembayaran
              </span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Pilih periode pembayaran yang sesuai dengan kebutuhan Anda
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-6">
              {/* Selected Plan Info */}
              <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-orange-100 rounded-full">
                        {getPlanIcon(selectedPlan.slug)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{selectedPlan.name}</h3>
                        <p className="text-gray-600">
                          {selectedPlan.maxUsers ? `Hingga ${selectedPlan.maxUsers} pengguna` : 'Unlimited pengguna'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatPrice(selectedPlan.price)}
                        <span className="text-sm font-normal text-gray-600">/bulan</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Period Selection */}
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
                          <Card className={`p-4 transition-all border-2 ${
                            selectedBillingPeriodId === period.id 
                              ? 'border-orange-500 bg-orange-50 shadow-lg' 
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-gray-900">
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

              {/* Add-ons Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-orange-500" />
                  <span>Pilih Add-on (Opsional)</span>
                </h3>
                <p className="text-sm text-gray-600">
                  Tingkatkan pengalaman Anda dengan fitur-fitur tambahan
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableAddOns.map((addOn) => (
                    <Card 
                      key={addOn.id} 
                      className={`cursor-pointer transition-all border-2 ${
                        selectedAddOns.has(addOn.id) 
                          ? 'border-orange-500 bg-orange-50 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => toggleAddOn(addOn.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`p-2 rounded-full ${
                              selectedAddOns.has(addOn.id) 
                                ? 'bg-orange-200 text-orange-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {addOn.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{addOn.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {addOn.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{addOn.description}</p>
                              <div className="mt-2 text-lg font-semibold text-orange-600">
                                +{formatPrice(addOn.price)}{addOn.allowQuantity ? "/pengguna" : ""}/bulan
                              </div>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedAddOns.has(addOn.id) 
                              ? 'border-orange-500 bg-orange-500' 
                              : 'border-gray-300'
                          }`}>
                            {selectedAddOns.has(addOn.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls for Additional Users */}
                        {selectedAddOns.has(addOn.id) && addOn.allowQuantity && (
                          <div className="mt-4 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Jumlah:</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => updateAddOnQuantity(addOn.id, (addOnQuantities[addOn.id] || 1) - 1)}
                                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                                  disabled={(addOnQuantities[addOn.id] || 1) <= (addOn.minQuantity || 1)}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-medium">
                                  {addOnQuantities[addOn.id] || 1}
                                </span>
                                <button
                                  onClick={() => updateAddOnQuantity(addOn.id, (addOnQuantities[addOn.id] || 1) + 1)}
                                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                                  disabled={(addOnQuantities[addOn.id] || 1) >= (addOn.maxQuantity || 50)}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              Subtotal: {formatPrice((parseFloat(addOn.price) * (addOnQuantities[addOn.id] || 1)).toString())}/bulan
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {selectedAddOns.size > 0 && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-900 mb-2">Add-on Terpilih:</h4>
                    <div className="space-y-2">
                      {Array.from(selectedAddOns).map(addOnId => {
                        const addOn = availableAddOns.find(a => a.id === addOnId);
                        if (!addOn) return null;
                        
                        const quantity = addOn.allowQuantity ? (addOnQuantities[addOnId] || 1) : 1;
                        const subtotal = parseFloat(addOn.price) * quantity;
                        
                        return (
                          <div key={addOn.id} className="flex items-center justify-between">
                            <span className="text-sm text-orange-800">
                              {addOn.name}
                              {addOn.allowQuantity && ` (${quantity}x)`}
                            </span>
                            <span className="text-sm font-medium text-orange-600">
                              +{formatPrice(subtotal.toString())}/bulan
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              {selectedBillingPeriod && (
                <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-orange-900">
                      <Sparkles className="w-5 h-5" />
                      <span>Ringkasan Pesanan</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Paket:</span>
                        <span className="font-medium text-gray-900">{selectedPlan.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Periode:</span>
                        <span className="font-medium text-gray-900">
                          {getBillingPeriodLabel(selectedBillingPeriod.periodMonths, selectedBillingPeriod.periodType)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Pengguna:</span>
                        <span className="font-medium text-gray-900">
                          {selectedPlan.maxUsers ? `Hingga ${selectedPlan.maxUsers}` : 'Unlimited'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Harga Paket:</span>
                        <span className="font-medium text-gray-900">{formatPrice(selectedBillingPeriod.price)}</span>
                      </div>
                      {selectedAddOns.size > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">Add-on yang dipilih:</div>
                          {Array.from(selectedAddOns).map(addOnId => {
                            const addOn = availableAddOns.find(a => a.id === addOnId);
                            return addOn ? (
                              <div key={addOn.id} className="flex justify-between items-center pl-4">
                                <span className="text-sm text-gray-600">{addOn.name}</span>
                                <span className="text-sm font-medium text-gray-900">+{formatPrice(addOn.price)}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xl font-semibold">
                        <span className="text-gray-900">Total:</span>
                        <span className="text-orange-600">{formatPrice(getTotalPrice().toString())}</span>
                      </div>
                      {selectedBillingPeriod.discountPercentage > 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          🎉 Hemat {selectedBillingPeriod.discountPercentage}% dari harga bulanan
                        </div>
                      )}
                      {selectedAddOns.size > 0 && (
                        <div className="text-sm text-orange-600 font-medium">
                          ⚡ Termasuk {selectedAddOns.size} add-on premium
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowPaymentModal(false);
                          setSelectedPlanId("");
                          setSelectedBillingPeriodId("");
                          setSelectedAddOns(new Set());
                          setAddOnQuantities({});
                          setIsProcessing(false);
                        }}
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Batal
                      </Button>
                      <Button 
                        onClick={handleUpgrade}
                        disabled={isProcessing || createUpgradePayment.isPending}
                        className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg"
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
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center pt-2">
                      🔒 Pembayaran aman dan terenkripsi melalui Midtrans
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}