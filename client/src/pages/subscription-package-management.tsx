import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  Eye,
  MoreHorizontal
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SubscriptionPlan, BillingPeriod } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface PackageFormData {
  name: string;
  slug: string;
  maxUsers: number | null;
  features: string[];
  isActive: boolean;
  isTrial: boolean;
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
  package?: SubscriptionPlan & { billingPeriods?: BillingPeriod[] }; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<PackageFormData>({
    name: "",
    slug: "",
    maxUsers: null,
    features: [],
    isActive: true,
    isTrial: false,
    billingPeriods: [],
  });
  const [newFeature, setNewFeature] = useState("");

  // Reset form data when package prop changes
  React.useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name || "",
        slug: pkg.slug || "",
        maxUsers: pkg.maxUsers || null,
        features: pkg.features as string[] || [],
        isActive: pkg.isActive ?? true,
        isTrial: (pkg as any).isTrial ?? false,
        billingPeriods: (pkg as any).billingPeriods || [],
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        maxUsers: null,
        features: [],
        isActive: true,
        isTrial: false,
        billingPeriods: [],
      });
    }
  }, [pkg, isOpen]);
  
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
      const response = await apiRequest(method, endpoint, {
        ...data,
        features: JSON.stringify(data.features),
      });
      const planResponse = await response.json();
      
      // Handle billing periods for both create and update
      if (data.billingPeriods.length > 0) {
        const planId = pkg ? pkg.id : planResponse.id;
        
        if (!planId) {
          throw new Error("Plan ID not found in response - cannot create billing periods");
        }
        
        // If editing, delete existing billing periods first
        if (pkg && (pkg as any).billingPeriods) {
          for (const existingPeriod of (pkg as any).billingPeriods) {
            await apiRequest("DELETE", `/api/admin/billing-periods/${existingPeriod.id}`);
          }
        }
        
        // Create new billing periods
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
      console.error("Package creation/update error:", error);
      let errorMessage = error.message;
      
      // Handle specific error cases
      if (error.message.includes("Slug sudah digunakan")) {
        errorMessage = "Slug sudah digunakan. Sistem akan membuat slug unik otomatis.";
      } else if (error.message.includes("validation")) {
        errorMessage = "Data tidak valid. Periksa kembali input Anda.";
      } else if (error.message.includes("billing-periods")) {
        errorMessage = "Gagal membuat periode billing. Periksa data periode billing.";
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "Gagal terhubung ke server. Coba lagi dalam beberapa saat.";
      }
      
      toast({
        title: "Gagal menyimpan paket",
        description: (
          <div className="space-y-2">
            <div>{errorMessage}</div>
            {error.details && (
              <div className="text-sm opacity-75">
                Detail: {typeof error.details === 'string' ? error.details : JSON.stringify(error.details)}
              </div>
            )}
          </div>
        ),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation with specific field error messages
    let missingFields: string[] = [];
    let billingErrors: string[] = [];
    
    // Check required basic fields
    if (!formData.name || formData.name.trim() === "") {
      missingFields.push("Nama paket");
    }
    if (!formData.slug || formData.slug.trim() === "") {
      missingFields.push("Slug paket");
    }
    if (formData.features.length === 0) {
      missingFields.push("Minimal 1 fitur paket");
    }
    
    // Validate billing periods for new packages
    if (!pkg && formData.billingPeriods.length === 0) {
      billingErrors.push("Minimal 1 periode billing harus ditambahkan");
    }
    
    // Validate each billing period
    formData.billingPeriods.forEach((period, index) => {
      if (!period.price || period.price.toString().trim() === "" || parseFloat(period.price.toString()) < 0) {
        billingErrors.push(`Periode ${index + 1}: Harga tidak valid`);
      }
      if (period.periodMonths <= 0 || period.periodMonths > 60) {
        billingErrors.push(`Periode ${index + 1}: Jumlah bulan harus antara 1-60`);
      }
      if (period.discountPercentage < 0 || period.discountPercentage > 100) {
        billingErrors.push(`Periode ${index + 1}: Diskon harus antara 0-100%`);
      }
    });
    
    // Show specific error messages
    if (missingFields.length > 0 || billingErrors.length > 0) {
      const allErrors = [...missingFields, ...billingErrors];
      toast({
        title: "Validasi Error",
        description: (
          <div className="space-y-1">
            <div className="font-medium">Field yang bermasalah:</div>
            <ul className="list-disc list-inside text-sm">
              {allErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        ),
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

          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <Switch
              id="isTrial"
              checked={formData.isTrial}
              onCheckedChange={(checked) => setFormData({ ...formData, isTrial: checked })}
            />
            <div>
              <Label htmlFor="isTrial" className="text-sm font-medium">Paket Free Trial</Label>
              <p className="text-xs text-gray-500">
                Centang untuk menjadikan paket ini sebagai paket standar free trial. 
                Paket free trial tidak memerlukan konfigurasi periode billing.
              </p>
            </div>
          </div>

          {/* Information for Free Trial packages */}
          {formData.isTrial && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800">Paket Free Trial</span>
              </div>
              <p className="text-sm text-blue-700">
                Paket ini ditandai sebagai free trial dan tidak memerlukan konfigurasi periode billing. 
                Sistem akan otomatis menangani durasi trial berdasarkan pengaturan aplikasi.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Fitur Paket</Label>
              <p className="text-xs text-gray-500 mb-3">Daftar fitur yang akan ditampilkan pada paket ini</p>
              
              <div className="flex space-x-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Contoh: Hingga 10 pengguna, Goal Unlimited, Email Support"
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

          {/* Billing Periods Section - Hidden for Free Trial packages */}
          {!formData.isTrial && (
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
          )}

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
              disabled={mutation.isPending || !formData.name || !formData.slug || formData.features.length === 0}
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
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<(SubscriptionPlan & { billingPeriods?: BillingPeriod[] }) | undefined>();
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans-with-periods"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans-with-periods"] });
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

  // Set default package mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/admin/subscription-plans/${id}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans-with-periods"] });
      toast({
        title: "Default package berhasil diubah",
        description: "Package default untuk pengguna baru telah diperbarui.",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal mengubah default package",
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

  const handleEdit = (pkg: SubscriptionPlan & { billingPeriods: BillingPeriod[] }) => {
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
                <TableHead>Default</TableHead>
                <TableHead>Free Trial</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.map((pkg) => (
                <TableRow key={pkg.id}>
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
                    <div className="flex items-center gap-2">
                      {pkg.isDefault ? (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          <Crown className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultMutation.mutate(pkg.id)}
                          disabled={setDefaultMutation.isPending}
                          className="text-xs"
                        >
                          Set Default
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={(pkg as any).isTrial ? "default" : "secondary"}>
                      {(pkg as any).isTrial ? "Ya" : "Tidak"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLocation(`/package-detail/${pkg.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(pkg)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Paket
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleStatusMutation.mutate(pkg.id)}
                          disabled={toggleStatusMutation.isPending}
                        >
                          {pkg.isActive ? (
                            <>
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              Nonaktifkan
                            </>
                          ) : (
                            <>
                              <ToggleRight className="mr-2 h-4 w-4" />
                              Aktifkan
                            </>
                          )}
                        </DropdownMenuItem>
                        {/* Only show delete option for non-default packages */}
                        {!['free-trial', 'starter', 'growth', 'enterprise'].includes(pkg.slug) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeletePackageId(pkg.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus Paket
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
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