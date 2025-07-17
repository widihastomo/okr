import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Settings, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ApplicationSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationSettingsFormData {
  key: string;
  value: string;
  category: string;
  description: string;
  isPublic: boolean;
}

export default function ApplicationSettingsPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ApplicationSettingsFormData>({
    key: '',
    value: '',
    category: 'general',
    description: '',
    isPublic: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<ApplicationSetting[]>({
    queryKey: ['/api/admin/application-settings'],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ApplicationSettingsFormData) => {
      return await apiRequest('POST', '/api/admin/application-settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/application-settings'] });
      toast({
        title: "Berhasil",
        description: "Pengaturan aplikasi berhasil dibuat",
      });
      setIsCreateDialogOpen(false);
      setFormData({
        key: '',
        value: '',
        category: 'general',
        description: '',
        isPublic: false
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat pengaturan aplikasi",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, data }: { key: string; data: Partial<ApplicationSettingsFormData> }) => {
      return await apiRequest('PUT', `/api/admin/application-settings/${key}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/application-settings'] });
      toast({
        title: "Berhasil",
        description: "Pengaturan aplikasi berhasil diperbarui",
      });
      setEditingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui pengaturan aplikasi",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      return await apiRequest('DELETE', `/api/admin/application-settings/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/application-settings'] });
      toast({
        title: "Berhasil",
        description: "Pengaturan aplikasi berhasil dihapus",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus pengaturan aplikasi",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ key: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (setting: ApplicationSetting) => {
    setEditingId(setting.key);
    setFormData({
      key: setting.key,
      value: setting.value,
      category: setting.category,
      description: setting.description || '',
      isPublic: setting.isPublic
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (key: string) => {
    deleteMutation.mutate(key);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      key: '',
      value: '',
      category: 'general',
      description: '',
      isPublic: false
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return '🔧';
      case 'appearance': return '🎨';
      case 'security': return '🔒';
      case 'email': return '📧';
      case 'notification': return '🔔';
      case 'feature': return '✨';
      default: return '⚙️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'bg-blue-100 text-blue-800';
      case 'appearance': return 'bg-purple-100 text-purple-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'email': return 'bg-green-100 text-green-800';
      case 'notification': return 'bg-yellow-100 text-yellow-800';
      case 'feature': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Pengaturan Aplikasi
              </h1>
              <p className="text-gray-600">Kelola pengaturan sistem aplikasi</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const groupedSettings = settings?.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, ApplicationSetting[]>) || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Pengaturan Aplikasi
          </h1>
          <p className="text-gray-600">Kelola pengaturan sistem aplikasi</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              onClick={resetForm}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pengaturan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Pengaturan' : 'Tambah Pengaturan Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="app_name"
                  disabled={!!editingId}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="My Application"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="appearance">Appearance</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi pengaturan ini..."
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
                <Label htmlFor="isPublic">Pengaturan Publik</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {editingId ? 'Perbarui' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(groupedSettings).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Belum ada pengaturan
            </h3>
            <p className="text-gray-500 mb-4">
              Mulai dengan menambahkan pengaturan aplikasi pertama
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedSettings).map(([category, categorySettings]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getCategoryIcon(category)}</span>
              <h2 className="text-xl font-semibold text-gray-800 capitalize">{category}</h2>
              <Badge variant="secondary" className={getCategoryColor(category)}>
                {categorySettings.length} pengaturan
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="cycles-table">
              {categorySettings.map((setting) => (
                <Card key={setting.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-800">
                        {setting.key}
                      </CardTitle>
                      <div className="flex items-center space-x-1">
                        {setting.isPublic ? (
                          <Eye className="w-4 h-4 text-green-500" title="Publik" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" title="Privat" />
                        )}
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(setting)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Pengaturan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus pengaturan "{setting.key}"? 
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(setting.key)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border break-words">
                        {setting.value}
                      </div>
                      {setting.description && (
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Dibuat: {new Date(setting.createdAt).toLocaleDateString('id-ID')}</span>
                        <Badge variant="outline" className={getCategoryColor(setting.category)}>
                          {setting.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}