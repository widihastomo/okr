import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { SubscriptionPlan, Organization, OrganizationSubscription } from "@shared/schema";

export default function Pricing() {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
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
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Mulai gratis dengan trial 14 hari. Tidak perlu kartu kredit.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const features = plan.features as string[];
            const isCurrentPlan = plan.slug === currentPlanSlug;
            const isEnterprise = plan.slug === "enterprise";

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
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-gray-900">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="ml-2 text-gray-600">/bulan</span>
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