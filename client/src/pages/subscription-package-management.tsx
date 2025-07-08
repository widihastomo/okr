import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign, 
  Users, 
  ToggleLeft, 
  ToggleRight, 
  Search,
  Loader2,
  Crown,
  Check,
  X,
  Calendar,
  Percent,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SubscriptionPlan, BillingPeriod } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BillingPeriodFormModal } from "../components/billing-period-form-modal";

interface PackageFormData {
  name: string;
  slug: string;
  price: string;
  maxUsers: number | null;
  features: string[];
  stripeProductId?: string;
  stripePriceId?: string;
  isActive: boolean;
}

function PackageFormModal({ 
  package: pkg, 
  isOpen, 
  onClose 
}: { 
  package?: SubscriptionPlan; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<PackageFormData>({
    name: pkg?.name || "",
    slug: pkg?.slug || "",
    price: pkg?.price || "0",
    maxUsers: pkg?.maxUsers || null,
    features: pkg?.features as string[] || [],
    stripeProductId: pkg?.stripeProductId || "",
    stripePriceId: pkg?.stripePriceId || "",
    isActive: pkg?.isActive ?? true,
  });
  const [newFeature, setNewFeature] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      const endpoint = pkg 
        ? `/api/admin/subscription-plans/${pkg.id}`
        : "/api/admin/subscription-plans";
      const method = pkg ? "PUT" : "POST";
      
      return await apiRequest(method, endpoint, {
        ...data,
        features: JSON.stringify(data.features),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: pkg ? "Paket berhasil diperbarui" : "Paket berhasil dibuat",
        description: pkg 
          ? "Perubahan paket telah disimpan." 
          : "Paket subscription baru telah dibuat.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Gagal menyimpan paket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.price) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon lengkapi semua field yang wajib diisi.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(formData);
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({ 
        ...formData, 
        features: [...formData.features, newFeature.trim()] 
      });
      setNewFeature("");
    }
  };

  const removeFeature = (feature: string) => {
    setFormData({ 
      ...formData, 
      features: formData.features.filter(f => f !== feature) 
    });
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({ 
      ...formData, 
      name,
      slug: pkg ? formData.slug : generateSlug(name)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {pkg ? "Edit Paket Subscription" : "Buat Paket Subscription Baru"}
          </DialogTitle>
          <DialogDescription>
            {pkg 
              ? "Perbarui informasi paket subscription." 
              : "Tambahkan paket subscription baru untuk platform."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nama Paket *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Starter, Growth, Enterprise"
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., starter, growth, enterprise"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Harga per Bulan (IDR) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="99000"
                required
              />
            </div>
            <div>
              <Label htmlFor="maxUsers">Maksimal Pengguna</Label>
              <Input
                id="maxUsers"
                type="number"
                value={formData.maxUsers || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  maxUsers: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Kosongkan untuk unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stripeProductId">Stripe Product ID</Label>
              <Input
                id="stripeProductId"
                value={formData.stripeProductId}
                onChange={(e) => setFormData({ ...formData, stripeProductId: e.target.value })}
                placeholder="prod_xxxxx"
              />
            </div>
            <div>
              <Label htmlFor="stripePriceId">Stripe Price ID</Label>
              <Input
                id="stripePriceId"
                value={formData.stripePriceId}
                onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })}
                placeholder="price_xxxxx"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Paket Aktif</Label>
          </div>

          <div>
            <Label>Fitur Paket</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Tambah fitur baru"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button type="button" onClick={addFeature} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {feature}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFeature(feature)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {pkg ? "Perbarui" : "Buat"} Paket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SubscriptionPackageManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPlan | undefined>();
  const [showFormModal, setShowFormModal] = useState(false);
  const [deletePackageId, setDeletePackageId] = useState<string | null>(null);
  const [showBillingPeriodModal, setShowBillingPeriodModal] = useState(false);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<BillingPeriod | null>(null);
  const [billingPeriodPlanId, setBillingPeriodPlanId] = useState<string | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());

  // Fetch subscription plans with billing periods
  const { data: packages = [], isLoading } = useQuery<(SubscriptionPlan & { billingPeriods: BillingPeriod[] })[]>({
    queryKey: ["/api/admin/subscription-plans-with-periods"],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/subscription-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: "Paket berhasil dihapus",
        description: "Paket subscription telah dihapus dari sistem.",
      });
      setDeletePackageId(null);
    },
    onError: (error) => {
      toast({
        title: "Gagal menghapus paket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/admin/subscription-plans/${id}/toggle-status`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: "Status paket berhasil diubah",
        description: "Status paket telah diperbarui.",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal mengubah status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const handleEdit = (pkg: SubscriptionPlan) => {
    setSelectedPackage(pkg);
    setShowFormModal(true);
  };

  const handleCreate = () => {
    setSelectedPackage(undefined);
    setShowFormModal(true);
  };

  const closeModal = () => {
    setShowFormModal(false);
    setSelectedPackage(undefined);
  };

  const handleCreateBillingPeriod = (planId: string) => {
    setBillingPeriodPlanId(planId);
    setSelectedBillingPeriod(null);
    setShowBillingPeriodModal(true);
  };

  const handleEditBillingPeriod = (period: BillingPeriod) => {
    setSelectedBillingPeriod(period);
    setBillingPeriodPlanId(period.planId);
    setShowBillingPeriodModal(true);
  };

  const closeBillingPeriodModal = () => {
    setSelectedBillingPeriod(null);
    setBillingPeriodPlanId(null);
    setShowBillingPeriodModal(false);
  };

  const togglePackageExpansion = (packageId: string) => {
    const newExpanded = new Set(expandedPackages);
    if (newExpanded.has(packageId)) {
      newExpanded.delete(packageId);
    } else {
      newExpanded.add(packageId);
    }
    setExpandedPackages(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Memuat data paket subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Kelola Paket Subscription</h1>
          <p className="text-gray-600">Kelola paket subscription untuk platform SaaS</p>
        </div>
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-700">System Owner Access</span>
        </div>
      </div>

      {/* Search and Create */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari paket subscription..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={handleCreate}
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Buat Paket Baru
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Paket</p>
                <p className="text-2xl font-bold">{packages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ToggleRight className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paket Aktif</p>
                <p className="text-2xl font-bold">{packages.filter(p => p.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Harga Terendah</p>
                <p className="text-2xl font-bold">
                  {packages.length > 0 
                    ? formatPrice(Math.min(...packages.filter(p => parseFloat(p.price) > 0).map(p => parseFloat(p.price))).toString())
                    : "Rp 0"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Max Users</p>
                <p className="text-2xl font-bold">
                  {Math.max(...packages.filter(p => p.maxUsers).map(p => p.maxUsers!), 0) || "∞"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Paket Subscription</CardTitle>
          <CardDescription>
            Kelola semua paket subscription yang tersedia di platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Paket</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Max Users</TableHead>
                <TableHead>Fitur</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stripe Integration</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.map((pkg) => (
                <React.Fragment key={pkg.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePackageExpansion(pkg.id)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedPackages.has(pkg.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <div className="font-medium">{pkg.name}</div>
                          <div className="text-sm text-gray-500">{pkg.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                  <TableCell>
                    {parseFloat(pkg.price) === 0 
                      ? <Badge variant="outline">Custom</Badge>
                      : formatPrice(pkg.price)
                    }
                  </TableCell>
                  <TableCell>
                    {pkg.maxUsers 
                      ? `${pkg.maxUsers} users` 
                      : <Badge variant="secondary">Unlimited</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(pkg.features as string[]).slice(0, 2).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {(pkg.features as string[]).length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{(pkg.features as string[]).length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={pkg.isActive ? "default" : "secondary"}>
                      {pkg.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {pkg.stripeProductId && (
                        <Badge variant="outline" className="text-xs">Product</Badge>
                      )}
                      {pkg.stripePriceId && (
                        <Badge variant="outline" className="text-xs">Price</Badge>
                      )}
                      {!pkg.stripeProductId && !pkg.stripePriceId && (
                        <span className="text-xs text-gray-400">No integration</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleStatusMutation.mutate(pkg.id)}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {pkg.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(pkg)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDeletePackageId(pkg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Billing Periods Row */}
                {expandedPackages.has(pkg.id) && (
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={7} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-sm">Periode Billing</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateBillingPeriod(pkg.id)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Tambah Periode
                          </Button>
                        </div>
                        
                        {pkg.billingPeriods && pkg.billingPeriods.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {pkg.billingPeriods.map((period) => (
                              <div key={period.id} className="border rounded-lg p-3 bg-white">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {period.periodType === 'monthly' && 'Bulanan'}
                                    {period.periodType === 'quarterly' && 'Triwulan'}
                                    {period.periodType === 'semiannual' && 'Semester'}
                                    {period.periodType === 'annual' && 'Tahunan'}
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditBillingPeriod(period)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-medium">
                                    {formatPrice(period.price)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {period.periodMonths} bulan
                                  </div>
                                  {period.discountPercentage > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                      <Percent className="h-3 w-3" />
                                      {period.discountPercentage}% diskon
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            Belum ada periode billing. Klik "Tambah Periode" untuk menambahkan.
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
              ))}
            </TableBody>
          </Table>

          {filteredPackages.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Tidak ada paket yang ditemukan" : "Belum ada paket subscription"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? "Coba ubah kata kunci pencarian."
                  : "Mulai dengan membuat paket subscription pertama Anda."
                }
              </p>
              {!searchTerm && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Paket Baru
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <PackageFormModal
        package={selectedPackage}
        isOpen={showFormModal}
        onClose={closeModal}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deletePackageId} 
        onOpenChange={() => setDeletePackageId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Paket Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus paket ini? Tindakan ini tidak dapat dibatalkan.
              Paket yang sedang digunakan oleh organisasi tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePackageId && deleteMutation.mutate(deletePackageId)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Billing Period Form Modal */}
      <BillingPeriodFormModal
        billingPeriod={selectedBillingPeriod}
        planId={billingPeriodPlanId}
        isOpen={showBillingPeriodModal}
        onClose={closeBillingPeriodModal}
      />
    </div>
  );
}