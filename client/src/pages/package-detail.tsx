import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { 
  ArrowLeft,
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Percent,
  Package,
  DollarSign,
  Users,
  Badge as BadgeIcon,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SubscriptionPlan, BillingPeriod } from "@shared/schema";
import { BillingPeriodFormModal } from "../components/billing-period-form-modal";

export default function PackageDetail() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/package-detail/:id");
  const packageId = params?.id;

  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<BillingPeriod | null>(null);
  const [showBillingPeriodModal, setShowBillingPeriodModal] = useState(false);
  const [deleteBillingPeriodId, setDeleteBillingPeriodId] = useState<string | null>(null);

  // Fetch package with billing periods
  const { data: pkg, isLoading, error } = useQuery<SubscriptionPlan & { billingPeriods: BillingPeriod[] }>({
    queryKey: [`/api/admin/subscription-plans/${packageId}/with-periods`],
    enabled: !!packageId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const handleCreateBillingPeriod = () => {
    setSelectedBillingPeriod(null);
    setShowBillingPeriodModal(true);
  };

  const handleEditBillingPeriod = (period: BillingPeriod) => {
    setSelectedBillingPeriod(period);
    setShowBillingPeriodModal(true);
  };

  const closeBillingPeriodModal = () => {
    setSelectedBillingPeriod(null);
    setShowBillingPeriodModal(false);
  };

  const deleteBillingPeriodMutation = useMutation({
    mutationFn: async (billingPeriodId: string) => {
      await apiRequest("DELETE", `/api/admin/billing-periods/${billingPeriodId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/subscription-plans/${packageId}/with-periods`] });
      toast({
        title: "Berhasil",
        description: "Periode billing berhasil dihapus",
      });
      setDeleteBillingPeriodId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal menghapus periode billing",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div>
            <div className="w-64 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="w-96 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Package Info Skeleton */}
        <div className="border rounded-lg p-6">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Periods Skeleton */}
        <div className="border rounded-lg p-6">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error memuat paket</h3>
          <p className="text-gray-500 mb-4">
            {error.message.includes('404') ? 'Paket tidak ditemukan' : 'Gagal memuat detail paket'}
          </p>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Coba Lagi
            </Button>
            <Button onClick={() => window.location.href = '/subscription-packages'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Daftar Paket
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Paket tidak ditemukan</h3>
          <p className="text-gray-500 mb-4">Paket yang Anda cari tidak tersedia.</p>
          <Button onClick={() => window.location.href = '/subscription-packages'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Paket
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/subscription-packages'}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detail Paket: {pkg.name}</h1>
          <p className="text-gray-600">Kelola informasi paket dan periode billing</p>
        </div>
      </div>

      {/* Package Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informasi Paket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BadgeIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-500">Nama & Slug</span>
              </div>
              <div className="font-medium">{pkg.name}</div>
              <div className="text-sm text-gray-500">{pkg.slug}</div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-500">Harga Dasar</span>
              </div>
              <div className="font-medium">
                {parseFloat(pkg.price) === 0 
                  ? <Badge variant="outline">Custom</Badge>
                  : formatPrice(pkg.price)
                }
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-500">Max Users</span>
              </div>
              <div className="font-medium">
                {pkg.maxUsers 
                  ? `${pkg.maxUsers} users` 
                  : <Badge variant="secondary">Unlimited</Badge>
                }
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-500">Status</span>
              </div>
              <Badge variant={pkg.isActive ? "default" : "secondary"}>
                {pkg.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-500">Fitur</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(pkg.features as string[]).map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Periods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Periode Billing
              </CardTitle>
              <CardDescription>
                Kelola periode billing dan harga untuk paket ini
              </CardDescription>
            </div>
            <Button onClick={handleCreateBillingPeriod}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Periode
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pkg.billingPeriods && pkg.billingPeriods.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipe Periode</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Diskon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pkg.billingPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {period.periodType === 'monthly' && 'Bulanan'}
                        {period.periodType === 'quarterly' && 'Triwulan'}
                        {period.periodType === 'semiannual' && 'Semester'}
                        {period.periodType === 'annual' && 'Tahunan'}
                        {period.periodType === 'custom' && 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {period.periodMonths} bulan
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatPrice(period.price)}</span>
                    </TableCell>
                    <TableCell>
                      {period.discountPercentage > 0 ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Percent className="h-3 w-3" />
                          {period.discountPercentage}%
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={period.isActive ? "default" : "secondary"}>
                        {period.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditBillingPeriod(period)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDeleteBillingPeriodId(period.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada periode billing
              </h3>
              <p className="text-gray-500 mb-4">
                Mulai dengan menambahkan periode billing pertama untuk paket ini.
              </p>
              <Button onClick={handleCreateBillingPeriod}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Periode Billing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Period Form Modal */}
      <BillingPeriodFormModal
        billingPeriod={selectedBillingPeriod}
        planId={packageId || null}
        isOpen={showBillingPeriodModal}
        onClose={closeBillingPeriodModal}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deleteBillingPeriodId} 
        onOpenChange={() => setDeleteBillingPeriodId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Periode Billing</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus periode billing ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBillingPeriodId && deleteBillingPeriodMutation.mutate(deleteBillingPeriodId)}
              disabled={deleteBillingPeriodMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}