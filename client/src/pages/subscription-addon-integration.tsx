import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  CreditCard, 
  Package, 
  Users, 
  Plus,
  CheckCircle,
  HardDrive,
  BarChart3,
  Shield,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: string;
  maxUsers: number;
  features: string[];
}

interface AddOn {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  type: "per_user" | "monthly" | "one_time";
  isActive: boolean;
}

const AddOnIcon = ({ slug }: { slug: string }) => {
  const iconMap: Record<string, React.ReactNode> = {
    "additional-user": <Users className="w-5 h-5 text-blue-600" />,
    "extra-storage-10gb": <HardDrive className="w-5 h-5 text-green-600" />,
    "advanced-analytics": <BarChart3 className="w-5 h-5 text-purple-600" />,
    "priority-support": <Shield className="w-5 h-5 text-orange-600" />,
    "api-access-extended": <Zap className="w-5 h-5 text-yellow-600" />
  };
  
  return iconMap[slug] || <Package className="w-5 h-5 text-gray-600" />;
};

export default function SubscriptionAddonIntegration() {
  const { data: subscriptionPlans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"]
  });

  const { data: addOns = [] } = useQuery<AddOn[]>({
    queryKey: ["/api/subscription-add-ons"]
  });

  const getTypeLabel = (type: string) => {
    const labels = {
      "per_user": "Per User/Bulan",
      "monthly": "Per Bulan", 
      "one_time": "Sekali Bayar"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      "per_user": "bg-blue-100 text-blue-800",
      "monthly": "bg-green-100 text-green-800",
      "one_time": "bg-purple-100 text-purple-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrasi Subscription + Add-Ons</h1>
        <p className="text-muted-foreground mt-2">
          Sistem lengkap subscription plan + add-on packages untuk fleksibilitas maksimal
        </p>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Cara Kerja Integrasi
          </CardTitle>
          <CardDescription>
            Organisasi memilih subscription plan dasar, kemudian dapat menambahkan add-on sesuai kebutuhan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-1">Pilih Plan Dasar</h3>
              <p className="text-sm text-gray-600">Organisasi memilih subscription plan (Starter, Growth, Scale, Enterprise)</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-1">Tambah Add-Ons</h3>
              <p className="text-sm text-gray-600">Sesuaikan dengan add-on packages untuk fitur tambahan</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-1">Billing Terintegrasi</h3>
              <p className="text-sm text-gray-600">Billing otomatis menggabungkan plan + add-ons dalam satu invoice</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Subscription Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Subscription Plans Tersedia</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subscriptionPlans.map((plan) => (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold">{formatCurrency(parseFloat(plan.price))}</span>
                  <span className="text-sm text-gray-500">/bulan</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    <span>Maksimal {plan.maxUsers} users</span>
                  </div>
                  <div className="space-y-1">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Add-Ons */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Add-On Packages Tersedia</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addOns.map((addOn) => (
            <Card key={addOn.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AddOnIcon slug={addOn.slug} />
                  {addOn.name}
                </CardTitle>
                <CardDescription>{addOn.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">{formatCurrency(parseFloat(addOn.price))}</span>
                    <Badge className={getTypeColor(addOn.type)}>
                      {getTypeLabel(addOn.type)}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {addOn.type === "per_user" && "Harga akan dikalikan jumlah user yang ditambahkan"}
                    {addOn.type === "monthly" && "Biaya tetap per bulan untuk seluruh organisasi"}
                    {addOn.type === "one_time" && "Pembayaran sekali untuk aktivasi permanen"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing Example */}
      <Card>
        <CardHeader>
          <CardTitle>Contoh Perhitungan Billing</CardTitle>
          <CardDescription>
            Simulasi billing untuk organisasi dengan plan Growth + beberapa add-ons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Skenario: PT ABC dengan tim 15 orang</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>• Plan Growth (10 users)</span>
                  <span>Rp 299.000/bulan</span>
                </div>
                <div className="flex justify-between">
                  <span>• Penambahan User: 5 x Rp 25.000</span>
                  <span>Rp 125.000/bulan</span>
                </div>
                <div className="flex justify-between">
                  <span>• Storage Tambahan 10GB</span>
                  <span>Rp 15.000/bulan</span>
                </div>
                <div className="flex justify-between">
                  <span>• Advanced Analytics</span>
                  <span>Rp 50.000/bulan</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Bulanan:</span>
                  <span>Rp 489.000</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              * Billing sistem otomatis menggabungkan semua biaya dalam satu invoice bulanan
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Features */}
      <Card>
        <CardHeader>
          <CardTitle>Fitur Integrasi</CardTitle>
          <CardDescription>
            Kemampuan sistem subscription + add-on yang sudah terintegrasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Untuk Organization Owner:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Subscribe/unsubscribe add-ons langsung dari dashboard
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Adjust quantity untuk per-user add-ons
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Monitor biaya real-time per add-on
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Invoice terpusat (plan + add-ons)
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Untuk System Owner:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Create/manage add-on packages
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Monitor subscription + add-on revenue
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Analytics per add-on performance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Flexible pricing models (per-user, monthly, one-time)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}