import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, CreditCard, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrganizationSettings() {
  const { user } = useAuth();
  const { organization, subscription, isOwner, isLoading } = useOrganization();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Memuat pengaturan organisasi...</p>
        </div>
      </div>
    );
  }

  const [, setLocation] = useLocation();
  
  // Access control - only owner can access this page
  if (!isOwner) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pengaturan Organisasi</h1>
        <p className="text-gray-600">Kelola pengaturan dan informasi organisasi Anda</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4 mr-2" />
            Umum
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="h-4 w-4 mr-2" />
            Langganan
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Anggota
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Lanjutan
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Organisasi</CardTitle>
              <CardDescription>
                Update informasi dasar organisasi Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Organisasi</Label>
                  <Input
                    id="name"
                    defaultValue={organization?.name}
                    placeholder="Nama organisasi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    defaultValue={organization?.website || ""}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industri</Label>
                  <Input
                    id="industry"
                    defaultValue={organization?.industry || ""}
                    placeholder="Teknologi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Ukuran Perusahaan</Label>
                  <select
                    id="size"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    defaultValue={organization?.size || ""}
                  >
                    <option value="">Pilih ukuran</option>
                    <option value="1-10">1-10 karyawan</option>
                    <option value="11-50">11-50 karyawan</option>
                    <option value="51-200">51-200 karyawan</option>
                    <option value="201-500">201-500 karyawan</option>
                    <option value="500+">500+ karyawan</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => {
                  toast({
                    title: "Berhasil",
                    description: "Informasi organisasi telah diperbarui"
                  });
                }}>
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Langganan Saat Ini</CardTitle>
              <CardDescription>
                Kelola paket langganan organisasi Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold text-lg">{subscription.plan.name}</h3>
                      <p className="text-gray-600">
                        Rp {parseInt(subscription.plan.price).toLocaleString("id-ID")}/bulan
                      </p>
                      <Badge className="mt-2" variant="default">
                        {subscription.status === "active" ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Maksimal pengguna</p>
                      <p className="text-2xl font-bold">
                        {subscription.plan.maxUsers || "Unlimited"}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => window.location.href = "/pricing"}>
                      Ubah Paket
                    </Button>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Batalkan Langganan
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Anggota Organisasi</CardTitle>
              <CardDescription>
                Kelola anggota dalam organisasi Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-600">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Fitur manajemen anggota akan segera tersedia</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Lanjutan</CardTitle>
              <CardDescription>
                Pengaturan keamanan dan konfigurasi lanjutan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h4 className="font-semibold text-red-900 mb-2">Zona Berbahaya</h4>
                  <p className="text-sm text-red-700 mb-4">
                    Tindakan ini tidak dapat dibatalkan. Harap berhati-hati.
                  </p>
                  <Button variant="destructive" size="sm">
                    Hapus Organisasi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}