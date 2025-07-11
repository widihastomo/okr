import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SelectedPackage } from "@/pages/client-registration";
import { Check, Package, Plus } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  userLimit: number;
  features: string[];
  isPopular: boolean;
  billingPeriods: {
    id: string;
    durationMonths: number;
    discountPercentage: number;
    price: number;
  }[];
}

interface AddonPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  billingType: string;
  slug: string;
  isActive: boolean;
}

interface PackageSelectionProps {
  onSelect: (data: SelectedPackage) => void;
  selectedPackage?: SelectedPackage | null;
  isLoading?: boolean;
}

export function PackageSelection({ onSelect, selectedPackage, isLoading }: PackageSelectionProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(selectedPackage?.planId || "");
  const [selectedBillingPeriodId, setSelectedBillingPeriodId] = useState<string>(selectedPackage?.billingPeriodId || "");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(selectedPackage?.addonIds || []);

  const { data: subscriptionPlans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans-with-periods"],
  });

  const { data: addonPackages, isLoading: addonsLoading } = useQuery<AddonPackage[]>({
    queryKey: ["/api/admin/addon-packages"],
  });

  const selectedPlan = subscriptionPlans?.find(plan => plan.id === selectedPlanId);
  const selectedBillingPeriod = selectedPlan?.billingPeriods.find(period => period.id === selectedBillingPeriodId);
  const selectedAddons = addonPackages?.filter(addon => selectedAddonIds.includes(addon.id)) || [];

  const calculateTotal = () => {
    const planPrice = selectedBillingPeriod?.price || 0;
    const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return planPrice + addonsPrice;
  };

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddonIds(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleSubmit = () => {
    if (!selectedPlanId || !selectedBillingPeriodId) return;
    
    onSelect({
      planId: selectedPlanId,
      billingPeriodId: selectedBillingPeriodId,
      addonIds: selectedAddonIds,
    });
  };

  const getBillingPeriodLabel = (durationMonths: number) => {
    if (durationMonths === 1) return "Bulanan";
    if (durationMonths === 3) return "Triwulan";
    if (durationMonths === 6) return "Semesteran";
    if (durationMonths === 12) return "Tahunan";
    return `${durationMonths} bulan`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (plansLoading || addonsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Subscription Plans */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Pilih Paket Berlangganan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptionPlans?.map((plan) => (
            <Card 
              key={plan.id} 
              className={`cursor-pointer transition-all ${
                selectedPlanId === plan.id ? 'border-orange-500 bg-orange-50' : 'hover:border-gray-300'
              } ${plan.isPopular ? 'ring-2 ring-orange-200' : ''}`}
              onClick={() => {
                setSelectedPlanId(plan.id);
                setSelectedBillingPeriodId(plan.billingPeriods[0]?.id || "");
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.isPopular && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Popular
                    </Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {formatPrice(plan.monthlyPrice)}
                  <span className="text-sm font-normal text-gray-600">/bulan</span>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Hingga {plan.userLimit} pengguna
                </div>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing Period Selection */}
      {selectedPlan && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Pilih Periode Billing</h3>
          <RadioGroup value={selectedBillingPeriodId} onValueChange={setSelectedBillingPeriodId}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedPlan.billingPeriods.map((period) => (
                <div key={period.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={period.id} id={period.id} />
                  <Label 
                    htmlFor={period.id} 
                    className="flex-1 cursor-pointer p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{getBillingPeriodLabel(period.durationMonths)}</div>
                        <div className="text-sm text-gray-600">
                          {formatPrice(period.price)}
                        </div>
                      </div>
                      {period.discountPercentage > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Hemat {period.discountPercentage}%
                        </Badge>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Addon Packages */}
      {addonPackages && addonPackages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Paket Add-on (Opsional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addonPackages.map((addon) => (
              <Card key={addon.id} className="cursor-pointer hover:border-gray-300">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={addon.id}
                        checked={selectedAddonIds.includes(addon.id)}
                        onCheckedChange={() => handleAddonToggle(addon.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={addon.id} className="cursor-pointer">
                          <div className="font-medium">{addon.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {addon.description}
                          </div>
                        </Label>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-orange-600">
                        {formatPrice(addon.price)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {addon.billingType === 'monthly' ? '/bulan' : 
                         addon.billingType === 'per_user' ? '/pengguna' : 
                         'sekali bayar'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Order Summary */}
      {selectedPlan && selectedBillingPeriod && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>{selectedPlan.name}</span>
                <span>{formatPrice(selectedBillingPeriod.price)}</span>
              </div>
              
              {selectedAddons.map((addon) => (
                <div key={addon.id} className="flex justify-between">
                  <span>{addon.name}</span>
                  <span>{formatPrice(addon.price)}</span>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-orange-600">{formatPrice(calculateTotal())}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button 
        onClick={handleSubmit}
        disabled={!selectedPlanId || !selectedBillingPeriodId || isLoading}
        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
      >
        {isLoading ? "Membuat Invoice..." : "Buat Invoice & Lanjutkan"}
      </Button>
    </div>
  );
}