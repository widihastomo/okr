import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Save, RotateCcw } from "lucide-react";

interface TrialConfiguration {
  id: string;
  name: string;
  description: string;
  maxUsers: number;
  trialDurationDays: number;
  isActive: boolean;
  features: {
    fullAccess: boolean;
    analyticsEnabled: boolean;
    supportEnabled: boolean;
    exportEnabled: boolean;
  };
}

export default function TrialSettingsPage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<TrialConfiguration | null>(null);

  // Fetch current trial configuration
  const { data: trialConfig, isLoading, error } = useQuery({
    queryKey: ["/api/admin/trial-configuration"],
  });

  // Update formData when trialConfig changes
  useEffect(() => {
    if (trialConfig) {
      setFormData(trialConfig);
    }
  }, [trialConfig]);

  // Update trial configuration mutation
  const updateTrialMutation = useMutation({
    mutationFn: async (config: TrialConfiguration) => {
      const response = await apiRequest("PUT", "/api/admin/trial-configuration", config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trial-configuration"] });
      toast({
        title: "Konfigurasi trial berhasil diperbarui",
        description: "Pengaturan free trial telah disimpan",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal memperbarui konfigurasi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData) return;
    updateTrialMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData(trialConfig);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold">Pengaturan Free Trial</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!trialConfig || !formData) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold">Pengaturan Free Trial</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Konfigurasi trial tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold">Pengaturan Free Trial</h1>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={updateTrialMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateTrialMutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateTrialMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Konfigurasi
            </Button>
          )}
        </div>
      </div>

      {/* Trial Configuration Form */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Paket Trial</CardTitle>
            <CardDescription>
              Pengaturan dasar untuk paket free trial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nama Paket</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="trialDurationDays">Durasi Trial (Hari)</Label>
                <Input
                  id="trialDurationDays"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.trialDurationDays}
                  onChange={(e) => setFormData({ ...formData, trialDurationDays: parseInt(e.target.value) || 7 })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxUsers">Maksimal Pengguna</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 3 })}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={!isEditing}
                />
                <Label htmlFor="isActive">Aktifkan Free Trial</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!isEditing}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fitur yang Diaktifkan</CardTitle>
            <CardDescription>
              Tentukan fitur mana yang tersedia dalam paket trial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="fullAccess"
                  checked={formData.features.fullAccess}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    features: { ...formData.features, fullAccess: checked }
                  })}
                  disabled={!isEditing}
                />
                <Label htmlFor="fullAccess">Akses Penuh ke Semua Fitur</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="analyticsEnabled"
                  checked={formData.features.analyticsEnabled}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    features: { ...formData.features, analyticsEnabled: checked }
                  })}
                  disabled={!isEditing}
                />
                <Label htmlFor="analyticsEnabled">Analitik dan Laporan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="supportEnabled"
                  checked={formData.features.supportEnabled}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    features: { ...formData.features, supportEnabled: checked }
                  })}
                  disabled={!isEditing}
                />
                <Label htmlFor="supportEnabled">Dukungan Teknis</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="exportEnabled"
                  checked={formData.features.exportEnabled}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    features: { ...formData.features, exportEnabled: checked }
                  })}
                  disabled={!isEditing}
                />
                <Label htmlFor="exportEnabled">Export Data</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Settings Summary */}
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-700">Ringkasan Pengaturan Saat Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 ${formData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <div>
                <span className="font-medium">Durasi:</span> 
                <span className="ml-2">{formData.trialDurationDays} hari</span>
              </div>
              <div>
                <span className="font-medium">Maksimal User:</span> 
                <span className="ml-2">{formData.maxUsers} pengguna</span>
              </div>
              <div>
                <span className="font-medium">Fitur Aktif:</span> 
                <span className="ml-2">
                  {Object.values(formData.features).filter(Boolean).length} dari {Object.keys(formData.features).length} fitur
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}