import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, CreditCard, Settings, Database, Activity, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function SystemAdmin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
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

  // Debug loading states
  console.log('Loading states:', { loadingOrgs, loadingUsers, loadingStats });
  console.log('Data:', { organizations, allUsers, stats });

  if (loadingOrgs || loadingUsers || loadingStats) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Memuat data sistem...</p>
          <p className="text-xs text-gray-400 mt-2">
            Orgs: {loadingOrgs ? 'loading' : 'loaded'}, 
            Users: {loadingUsers ? 'loading' : 'loaded'}, 
            Stats: {loadingStats ? 'loading' : 'loaded'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Admin Dashboard</h1>
        <p className="text-gray-600">Kelola seluruh sistem SaaS OKR</p>
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
              <div className="space-y-4">
                {organizations?.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{org.name}</h3>
                      <p className="text-sm text-gray-600">
                        {org.userCount || 0} pengguna • {org.plan?.name || "No Plan"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={org.subscription?.status === "active" ? "default" : "secondary"}>
                        {org.subscription?.status || "Inactive"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Kelola
                      </Button>
                    </div>
                  </div>
                ))}
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
              <div className="text-center py-8 text-gray-600">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Fitur manajemen langganan akan segera tersedia</p>
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
    </div>
  );
}