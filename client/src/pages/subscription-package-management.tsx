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
  Eye
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


interface PackageFormData {
  name: string;
  slug: string;
  maxUsers: number | null;
  features: string[];
  stripeProductId?: string;
  stripePriceId?: string;
  isActive: boolean;
  billingPeriods: BillingPeriodData[];
}

interface BillingPeriodData {
  periodType: string;
  periodMonths: number;
  price: string;
  discountPercentage: number;
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
    maxUsers: pkg?.maxUsers || null,
    features: pkg?.features as string[] || [],
    stripeProductId: pkg?.stripeProductId || "",
    stripePriceId: pkg?.stripePriceId || "",
    isActive: pkg?.isActive ?? true,
    billingPeriods: [],
  });
  const [newFeature, setNewFeature] = useState("");
  
  const getPeriodTypeFromMonths = (months: number): string => {
    if (months === 1) return "monthly";
    if (months === 3) return "quarterly";
    if (months === 6) return "semiannual";
    if (months === 12) return "annual";
    return "custom";
  };

  const mutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      const endpoint = pkg 
        ? `/api/admin/subscription-plans/${pkg.id}`
        : "/api/admin/subscription-plans";
      const method = pkg ? "PUT" : "POST";
      
      // First, create or update the subscription plan
      const planResponse = await apiRequest(method, endpoint, {
        ...data,
        features: JSON.stringify(data.features),
      });
      
      // Then, create billing periods if this is a new plan
      if (!pkg && data.billingPeriods.length > 0) {
        const planId = planResponse.id;
        
        // Create each billing period
        for (const period of data.billingPeriods) {
          await apiRequest("POST", "/api/admin/billing-periods", {
            planId: planId,
            periodType: period.periodType,
            periodMonths: period.periodMonths,
            price: period.price.toString(),
            discountPercentage: period.discountPercentage || 0,
            isActive: period.isActive !== false
          });
        }
      }
      
      return planResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans-with-periods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing-periods"] });
      toast({
        title: pkg ? "Paket berhasil diperbarui" : "Paket berhasil dibuat",
        description: pkg 
          ? "Perubahan paket telah disimpan." 
          : "Paket subscription dan periode billing telah berhasil dibuat.",
      });
      onClose();
    },
    onError: (error: any) => {
      let errorMessage = error.message;
      
      // Handle specific error cases
      if (error.message.includes("Slug sudah digunakan")) {
        errorMessage = "Slug sudah digunakan. Sistem akan membuat slug unik otomatis.";
      }
      
      toast({
        title: "Gagal menyimpan paket",
        description: errorMessage,
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
  
  const addBillingPeriod = () => {
    const newPeriod: BillingPeriodData = {
      periodType: "monthly",
      periodMonths: 1,
      price: "",
      discountPercentage: 0,
      isActive: true,
    };
    setFormData({ 
      ...formData, 
      billingPeriods: [...formData.billingPeriods, newPeriod] 
    });
  };

  const removeBillingPeriod = (index: number) => {
    setFormData({ 
      ...formData, 
      billingPeriods: formData.billingPeriods.filter((_, i) => i !== index) 
    });
  };

  const updateBillingPeriod = (index: number, updatedPeriod: BillingPeriodData) => {
    const updatedPeriods = [...formData.billingPeriods];
    updatedPeriods[index] = updatedPeriod;
    setFormData({ ...formData, billingPeriods: updatedPeriods });
  };

  const generateSlug = (name: string) => {
    const baseSlug = name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Add timestamp suffix to ensure uniqueness
    const timestamp = Date.now().toString().slice(-4);
    return `${baseSlug}-${timestamp}`;
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">Nama Paket *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Contoh: Starter, Growth, Enterprise"
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Nama paket yang akan ditampilkan kepada pengguna</p>
            </div>
            
            <div>
              <Label htmlFor="slug" className="text-sm font-medium">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Contoh: starter, growth, enterprise"
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Identifier unik untuk paket (otomatis dibuat dari nama)</p>
            </div>

            <div>
              <Label htmlFor="maxUsers" className="text-sm font-medium">Maksimal Pengguna</Label>
              <Input
                id="maxUsers"
                type="number"
                value={formData.maxUsers || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  maxUsers: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Kosongkan untuk unlimited"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Batas maksimal pengguna (kosongkan untuk unlimited)</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Integrasi Stripe (Opsional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stripeProductId" className="text-sm font-medium">Stripe Product ID</Label>
                  <Input
                    id="stripeProductId"
                    value={formData.stripeProductId}
                    onChange={(e) => setFormData({ ...formData, stripeProductId: e.target.value })}
                    placeholder="prod_xxxxx"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="stripePriceId" className="text-sm font-medium">Stripe Price ID</Label>
                  <Input
                    id="stripePriceId"
                    value={formData.stripePriceId}
                    onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })}
                    placeholder="price_xxxxx"
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">ID produk dan harga dari Stripe untuk integrasi pembayaran</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <div>
              <Label htmlFor="isActive" className="text-sm font-medium">Paket Aktif</Label>
              <p className="text-xs text-gray-500">Centang untuk mengaktifkan paket ini di sistem</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Fitur Paket</Label>
              <p className="text-xs text-gray-500 mb-3">Daftar fitur yang akan ditampilkan pada paket ini</p>
              
              <div className="flex space-x-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Contoh: Hingga 10 pengguna, OKR Unlimited, Email Support"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={addFeature} 
                  variant="outline"
                  className="px-3"
                  disabled={!newFeature.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {formData.features.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Fitur yang sudah ditambahkan:</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-2 py-1 px-3">
                      <span>{feature}</span>
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-600" 
                        onClick={() => removeFeature(feature)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Billing Periods Section */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Periode Billing
                </Label>
                <p className="text-xs text-gray-500 mt-1">Atur opsi periode dan harga untuk paket ini</p>
              </div>
              <Button
                type="button"
                onClick={addBillingPeriod}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Tambah Periode
              </Button>
            </div>

            {formData.billingPeriods.length > 0 && (
              <div className="space-y-3">
                {formData.billingPeriods.map((period, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-gray-600">Jumlah Bulan</Label>
                        <Input
                          type="number"
                          min="1"
                          max="60"
                          value={period.periodMonths}
                          onChange={(e) => {
                            const months = parseInt(e.target.value) || 1;
                            updateBillingPeriod(index, {
                              ...period,
                              periodMonths: months,
                              periodType: getPeriodTypeFromMonths(months)
                            });
                          }}
                          placeholder="1"
                          className="h-8 text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-600">Harga (IDR)</Label>
                        <Input
                          type="number"
                          value={period.price || "0"}
                          onChange={(e) => updateBillingPeriod(index, { ...period, price: e.target.value || "0" })}
                          placeholder="0"
                          className="h-8 text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-600">Diskon (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={period.discountPercentage}
                          onChange={(e) => updateBillingPeriod(index, { 
                            ...period, 
                            discountPercentage: parseInt(e.target.value) || 0 
                          })}
                          placeholder="0"
                          className="h-8 text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={period.isActive}
                            onCheckedChange={(checked) => updateBillingPeriod(index, { 
                              ...period, 
                              isActive: checked 
                            })}
                          />
                          <Label className="text-xs text-gray-600">Aktif</Label>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeBillingPeriod(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="px-6"
              disabled={mutation.isPending}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending || !formData.name || !formData.slug}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 px-6"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {pkg ? "Perbarui Paket" : `Buat Paket${formData.billingPeriods.length > 0 ? ` & ${formData.billingPeriods.length} Periode` : ""}`}
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
                <>
                  <TableRow key={`${pkg.id}-row`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pkg.name}</div>
                        <div className="text-sm text-gray-500">{pkg.slug}</div>
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
                        onClick={() => window.location.href = `/package-detail/${pkg.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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

                </>
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


    </div>
  );
}