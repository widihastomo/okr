import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, CreditCard, Settings, Database, Activity, Loader2, UserPlus, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import SubscriptionAssignmentModal from "@/components/subscription-assignment-modal";
import type { Organization } from "@shared/schema";

export default function SystemAdmin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  
  // Check if user is system owner
  if (!user || !(user as any).isSystemOwner) {
    setLocation("/dashboard");
    return null;
  }

  // Fetch organizations data
  const { data: organizations, isLoading: loadingOrgs } = useQuery<any[]>({
    queryKey: ["/api/admin/organizations"],
  });

  // Fetch all users data
  const { data: allUsers, isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch system stats
  const { data: stats, isLoading: loadingStats } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
  });

  if (loadingOrgs || loadingUsers || loadingStats) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Memuat data sistem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Admin Dashboard</h1>
          <p className="text-gray-600">Kelola seluruh sistem SaaS Goal</p>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organisasi</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.newOrgsThisMonth || 0} baru bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bulanan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {(stats?.monthlyRevenue || 0).toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats?.revenueGrowth || 0}% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistem Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="default" className="bg-green-600">Aktif</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {stats?.uptime || "99.9%"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="organizations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="organizations">
            <Building2 className="h-4 w-4 mr-2" />
            Organisasi
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Pengguna
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <CreditCard className="h-4 w-4 mr-2" />
            Langganan
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="h-4 w-4 mr-2" />
            Sistem
          </TabsTrigger>
        </TabsList>

        {/* Organizations Tab */}
        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Organisasi</CardTitle>
              <CardDescription>
                Kelola semua organisasi yang terdaftar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Kelola Organisasi</h3>
                <p className="text-gray-600 mb-4">
                  Gunakan halaman khusus untuk mengelola organisasi dengan fitur lengkap
                </p>
                <Button 
                  onClick={() => setLocation("/system-admin/organizations")}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Kelola Organisasi
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengguna</CardTitle>
              <CardDescription>
                Kelola semua pengguna sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-600">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Fitur manajemen pengguna akan segera tersedia</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Langganan</CardTitle>
              <CardDescription>
                Kelola paket dan langganan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Kelola Paket Berlangganan</h3>
                <p className="text-gray-600 mb-4">Buat dan kelola paket berlangganan untuk organisasi</p>
                <Button 
                  onClick={() => setLocation("/subscription-packages")}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Kelola Paket
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Sistem</CardTitle>
              <CardDescription>
                Konfigurasi dan maintenance sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Backup Database
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Konfigurasi Email
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <Activity className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subscription Assignment Modal */}
      {selectedOrganization && (
        <SubscriptionAssignmentModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => {
            setIsSubscriptionModalOpen(false);
            setSelectedOrganization(null);
          }}
          organization={selectedOrganization}
        />
      )}
    </div>
  );
}