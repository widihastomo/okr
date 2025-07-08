import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign, 
  Users, 
  HardDrive,
  Zap,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  TrendingUp,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface AddOn {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  type: string;
  stripePriceId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subscriptionCount?: number;
  totalRevenue?: string;
}

interface AddOnStats {
  totalAddOns: number;
  activeAddOns: number;
  totalSubscriptions: number;
  monthlyRevenue: string;
  topAddOns: Array<{
    name: string;
    subscriptionCount: number;
    revenue: string;
  }>;
}

const AddOnIcon = ({ slug }: { slug: string }) => {
  switch (slug) {
    case 'additional-user':
      return <Users className="w-5 h-5" />;
    case 'extra-storage-10gb':
      return <HardDrive className="w-5 h-5" />;
    case 'advanced-analytics':
      return <Zap className="w-5 h-5" />;
    case 'priority-support':
      return <Shield className="w-5 h-5" />;
    case 'api-access-extended':
      return <Zap className="w-5 h-5" />;
    default:
      return <Package className="w-5 h-5" />;
  }
};

const formatPrice = (price: string) => {
  const numPrice = parseFloat(price);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numPrice);
};

export default function SystemAddonManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    type: 'monthly',
  });

  // Check if user is system owner
  if (!user || !(user as any).isSystemOwner) {
    setLocation("/dashboard");
    return null;
  }

  // Get addon statistics
  const { data: stats } = useQuery<AddOnStats>({
    queryKey: ["/api/admin/addon-stats"],
  });

  // Get all addons with subscription counts
  const { data: addOns = [], isLoading } = useQuery<AddOn[]>({
    queryKey: ["/api/admin/add-ons"],
  });

  // Create addon mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/admin/add-ons", data);
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Add-on berhasil dibuat",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/add-ons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/addon-stats"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update addon mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PUT", `/api/admin/add-ons/${selectedAddOn?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Add-on berhasil diperbarui",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/add-ons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/addon-stats"] });
      setIsEditDialogOpen(false);
      setSelectedAddOn(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete addon mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/add-ons/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Add-on berhasil dihapus",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/add-ons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/addon-stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle addon status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/add-ons/${id}/status`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Status add-on berhasil diperbarui",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/add-ons"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      type: 'monthly',
    });
  };

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
    resetForm();
  };

  const handleEdit = (addOn: AddOn) => {
    setSelectedAddOn(addOn);
    setFormData({
      name: addOn.name,
      slug: addOn.slug,
      description: addOn.description || '',
      price: addOn.price,
      type: addOn.type,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitCreate = () => {
    if (!formData.name || !formData.slug || !formData.price) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = () => {
    if (!formData.name || !formData.slug || !formData.price) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleToggleStatus = (addOn: AddOn) => {
    toggleStatusMutation.mutate({
      id: addOn.id,
      isActive: !addOn.isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Memuat data add-ons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Add-On Management</h1>
            <p className="text-gray-600 mt-2">
              Kelola semua add-on packages dan monitor penggunaan di seluruh platform
            </p>
          </div>
          <Button onClick={handleCreate} className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Add-On
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Add-Ons</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAddOns}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeAddOns} aktif
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                Aktif saat ini
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Per bulan
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Add-On</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.topAddOns[0]?.subscriptionCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.topAddOns[0]?.name || 'Belum ada'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add-Ons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Semua Add-Ons</CardTitle>
          <CardDescription>
            Kelola add-on packages yang tersedia untuk organisasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Add-On</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Subscriptions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addOns.map((addOn) => (
                <TableRow key={addOn.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <AddOnIcon slug={addOn.slug} />
                      <div>
                        <div className="font-medium">{addOn.name}</div>
                        <div className="text-sm text-gray-500">{addOn.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {addOn.type === 'per_user' ? 'Per User' : 
                       addOn.type === 'one_time' ? 'One Time' : 'Monthly'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(addOn.price)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{addOn.subscriptionCount || 0}</span>
                      {addOn.totalRevenue && (
                        <span className="text-sm text-gray-500">
                          ({formatPrice(addOn.totalRevenue)})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={addOn.isActive ? "default" : "secondary"}>
                      {addOn.isActive ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Nonaktif
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(addOn)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(addOn)}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {addOn.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Add-On</AlertDialogTitle>
                            <AlertDialogDescription>
                              Yakin ingin menghapus add-on "{addOn.name}"? 
                              Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi semua subscription yang aktif.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(addOn.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Add-On Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Add-On Baru</DialogTitle>
            <DialogDescription>
              Buat add-on package baru untuk ditawarkan kepada organisasi
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Add-On *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="contoh: Penambahan User"
              />
            </div>
            
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="contoh: additional-user"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi singkat tentang add-on ini"
              />
            </div>
            
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_user">Per User</SelectItem>
                  <SelectItem value="one_time">One Time</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="price">Harga (IDR) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="25000"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmitCreate}
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Buat Add-On
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Add-On Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Add-On</DialogTitle>
            <DialogDescription>
              Perbarui informasi add-on package
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nama Add-On *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="contoh: Penambahan User"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="contoh: additional-user"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi singkat tentang add-on ini"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_user">Per User</SelectItem>
                  <SelectItem value="one_time">One Time</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-price">Harga (IDR) *</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="25000"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmitEdit}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Add-On
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}