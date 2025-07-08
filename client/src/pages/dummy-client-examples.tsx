import React from "react";
import { 
  Building2, 
  Users, 
  CreditCard, 
  Package, 
  CheckCircle,
  Calendar,
  DollarSign,
  Mail,
  Phone
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const dummyClients = [
  {
    id: 1,
    organization: {
      name: "CV Digital Kreatif",
      description: "Startup digital marketing dan web development",
      industry: "Digital Marketing",
      teamSize: 4,
      foundedYear: 2025,
      contact: {
        owner: "Sarah Wijaya",
        email: "owner@digitalkreatif.com",
        phone: "+62 812-3456-7890"
      }
    },
    subscription: {
      plan: "Growth",
      planPrice: 299000,
      status: "active",
      startDate: "2025-01-01",
      billingCycle: "monthly"
    },
    addOns: [
      { name: "Penambahan User", quantity: 3, unitPrice: 25000, total: 75000 },
      { name: "Storage Tambahan 10GB", quantity: 1, unitPrice: 15000, total: 15000 },
      { name: "Advanced Analytics", quantity: 1, unitPrice: 50000, total: 50000 }
    ],
    totalMonthly: 439000,
    paymentHistory: [
      { date: "2025-01-01", amount: 439000, status: "paid" },
      { date: "2024-12-01", amount: 439000, status: "paid" },
      { date: "2024-11-01", amount: 439000, status: "paid" }
    ]
  },
  {
    id: 2,
    organization: {
      name: "PT Solusi Tech",
      description: "Perusahaan software development enterprise",
      industry: "Software Development", 
      teamSize: 18,
      foundedYear: 2020,
      contact: {
        owner: "Rizki Nugraha",
        email: "ceo@solusitecht.com",
        phone: "+62 821-7890-1234"
      }
    },
    subscription: {
      plan: "Scale",
      planPrice: 749000,
      status: "active",
      startDate: "2024-11-15",
      billingCycle: "monthly"
    },
    addOns: [
      { name: "Priority Support", quantity: 1, unitPrice: 75000, total: 75000 },
      { name: "API Access Extended", quantity: 1, unitPrice: 35000, total: 35000 },
      { name: "Advanced Analytics", quantity: 1, unitPrice: 50000, total: 50000 }
    ],
    totalMonthly: 909000,
    paymentHistory: [
      { date: "2025-01-01", amount: 909000, status: "paid" },
      { date: "2024-12-01", amount: 909000, status: "paid" },
      { date: "2024-11-01", amount: 909000, status: "paid" }
    ]
  }
];

const getStatusColor = (status: string) => {
  return status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
};

const getPaymentStatusColor = (status: string) => {
  const colors = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800", 
    failed: "bg-red-100 text-red-800"
  };
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

export default function DummyClientExamples() {
  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contoh Data Client dengan Subscription + Add-Ons</h1>
        <p className="text-muted-foreground mt-2">
          Data dummy client yang sudah menggunakan sistem subscription plan + add-on packages
        </p>
      </div>

      {dummyClients.map((client) => (
        <Card key={client.id} className="w-full">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {client.organization.name}
                </CardTitle>
                <CardDescription>{client.organization.description}</CardDescription>
              </div>
              <Badge className={getStatusColor(client.subscription.status)}>
                {client.subscription.status === "active" ? "Aktif" : "Tidak Aktif"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Organization Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Informasi Organisasi
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industri:</span>
                    <span>{client.organization.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ukuran Tim:</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {client.organization.teamSize} orang
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Didirikan:</span>
                    <span>{client.organization.foundedYear}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Kontak
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Owner:</span>
                    <span>{client.organization.contact.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-blue-600">{client.organization.contact.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telepon:</span>
                    <span>{client.organization.contact.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Plan */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Subscription Plan
              </h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{client.subscription.plan} Plan</span>
                  <span className="font-bold text-lg">{formatCurrency(client.subscription.planPrice)}/bulan</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Mulai: {new Date(client.subscription.startDate).toLocaleDateString('id-ID')}
                  </span>
                  <span>Billing: {client.subscription.billingCycle}</span>
                </div>
              </div>
            </div>

            {/* Add-Ons */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" />
                Add-On Packages ({client.addOns.length})
              </h4>
              <div className="space-y-2">
                {client.addOns.map((addOn, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{addOn.name}</span>
                      {addOn.quantity > 1 && (
                        <Badge variant="secondary">x{addOn.quantity}</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(addOn.total)}/bulan</div>
                      {addOn.quantity > 1 && (
                        <div className="text-xs text-gray-500">
                          {formatCurrency(addOn.unitPrice)} x {addOn.quantity}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Billing */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Total Billing Bulanan
                </span>
                <span className="text-2xl font-bold text-orange-600">
                  {formatCurrency(client.totalMonthly)}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Plan: {formatCurrency(client.subscription.planPrice)} + 
                Add-ons: {formatCurrency(client.totalMonthly - client.subscription.planPrice)}
              </div>
            </div>

            {/* Payment History */}
            <div className="space-y-3">
              <h4 className="font-semibold">Riwayat Pembayaran (3 bulan terakhir)</h4>
              <div className="space-y-2">
                {client.paymentHistory.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(payment.date).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      <Badge className={getPaymentStatusColor(payment.status)}>
                        {payment.status === "paid" ? "Lunas" : payment.status === "pending" ? "Pending" : "Gagal"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Contoh Data</CardTitle>
          <CardDescription>
            Karakteristik client yang menggunakan sistem subscription + add-on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">CV Digital Kreatif (Startup)</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Tim kecil (4 orang) dengan budget terbatas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Pilih Growth plan untuk fitur menengah
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Add-on storage dan analytics sesuai kebutuhan
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Total: Rp 439.000/bulan (terjangkau)
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">PT Solusi Tech (Enterprise)</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Tim besar (18 orang) dengan kebutuhan enterprise
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Scale plan untuk kapasitas tinggi
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Priority support dan API access untuk operasional
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Total: Rp 909.000/bulan (value for enterprise)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}