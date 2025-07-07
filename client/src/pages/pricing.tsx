import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { SubscriptionPlan, BillingPeriod, Organization, OrganizationSubscription } from "@shared/schema";

export default function Pricing() {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<"monthly" | "quarterly" | "annual">("monthly");

  // Fetch subscription plans with billing periods
  const { data: plans = [], isLoading: plansLoading } = useQuery<(SubscriptionPlan & { billingPeriods: BillingPeriod[] })[]>({
    queryKey: ["/api/subscription-plans"],
  });

  // Fetch user's organization
  const { data: userOrg } = useQuery<{
    organization: Organization;
    subscription: OrganizationSubscription & { plan: SubscriptionPlan };
  }>({
    queryKey: ["/api/my-organization"],
    enabled: !!user,
  });

  const currentPlanSlug = userOrg?.subscription?.plan?.slug;

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!user) {
      // Redirect to login
      window.location.href = "/login?redirect=/pricing";
      return;
    }

    if (plan.slug === "enterprise") {
      // Contact sales for enterprise
      window.location.href = "mailto:sales@okr-app.id?subject=Enterprise Plan Inquiry";
      return;
    }

    setLoadingPlan(plan.slug);
    try {
      // This will be implemented later with Stripe integration
      console.log("Selected plan:", plan);
      // TODO: Redirect to checkout
    } catch (error) {
      console.error("Error selecting plan:", error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pilih Paket yang Tepat untuk Tim Anda
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Mulai gratis dengan trial 14 hari. Tidak perlu kartu kredit.
          </p>
          
          {/* Billing Period Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg flex space-x-1">
              <button
                onClick={() => setSelectedBillingPeriod("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedBillingPeriod === "monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Bulanan
              </button>
              <button
                onClick={() => setSelectedBillingPeriod("quarterly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                  selectedBillingPeriod === "quarterly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                3 Bulanan
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 rounded">
                  5% OFF
                </span>
              </button>
              <button
                onClick={() => setSelectedBillingPeriod("annual")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                  selectedBillingPeriod === "annual"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Tahunan
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 rounded">
                  15% OFF
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const features = plan.features as string[];
            const isCurrentPlan = plan.slug === currentPlanSlug;
            const isEnterprise = plan.slug === "enterprise";
            
            // Get current billing period pricing
            const currentPeriod = plan.billingPeriods?.find(bp => bp.periodType === selectedBillingPeriod);
            const currentPrice = currentPeriod?.price || plan.price;
            const discountPercentage = currentPeriod?.discountPercentage || 0;
            const periodMonths = currentPeriod?.periodMonths || 1;

            // Calculate monthly price for display
            const monthlyPrice = parseFloat(currentPrice) / periodMonths;
            const originalMonthlyPrice = parseFloat(plan.price);

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.slug === "growth"
                    ? "border-blue-500 shadow-xl scale-105"
                    : "border-gray-200"
                }`}
              >
                {plan.slug === "growth" && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1">
                      Paling Populer
                    </Badge>
                  </div>
                )}

                {discountPercentage > 0 && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-green-500 text-white">
                      {discountPercentage}% OFF
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.maxUsers
                      ? plan.slug === "starter"
                        ? "1-3 user"
                        : `Hingga ${plan.maxUsers} user`
                      : ">25 user"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow">
                  <div className="mb-6">
                    {isEnterprise ? (
                      <div className="text-3xl font-bold text-gray-900">Negosiasi</div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold text-gray-900">
                            {formatPrice(monthlyPrice.toString())}
                          </span>
                          <span className="ml-2 text-gray-600">/bulan</span>
                        </div>
                        
                        {discountPercentage > 0 && (
                          <div className="text-sm text-gray-500">
                            <span className="line-through">
                              {formatPrice(originalMonthlyPrice.toString())}/bulan
                            </span>
                            <span className="ml-2 text-green-600 font-medium">
                              Hemat {discountPercentage}%
                            </span>
                          </div>
                        )}
                        
                        <div className="text-sm text-blue-600 font-medium">
                          Total: {formatPrice(currentPrice)} / {
                            selectedBillingPeriod === "monthly" ? "bulan" :
                            selectedBillingPeriod === "quarterly" ? "3 bulan" : "tahun"
                          }
                        </div>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan || loadingPlan === plan.slug}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {loadingPlan === plan.slug ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      "Paket Saat Ini"
                    ) : isEnterprise ? (
                      "Hubungi Sales"
                    ) : (
                      "Pilih Paket"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Punya pertanyaan? Hubungi tim sales kami di{" "}
            <a href="mailto:sales@okr-app.id" className="text-blue-600 hover:underline">
              sales@okr-app.id
            </a>
          </p>
          {user && (
            <Link to="/dashboard">
              <Button variant="outline">Kembali ke Dashboard</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}