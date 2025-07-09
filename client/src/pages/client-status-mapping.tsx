import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Calendar,
  Phone,
  Mail,
  Building,
  Target,
  Award,
  CreditCard,
  RefreshCw
} from "lucide-react";
import { SkeletonLoading } from "@/components/ui/skeleton-loading";

interface ClientStatusData {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  registrationDate: string;
  daysSinceRegistration: number;
  ownerEmail: string;
  ownerName: string;
  ownerPhone: string;
  ownerLastLogin: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string;
  completedMissions: number;
  totalMissions: number;
  missionCompletionPercentage: number;
  achievementsUnlocked: Array<{
    name: string;
    category: string;
    unlockedAt: string;
  }>;
  subscriptionStatus: string;
  subscriptionPlan: string;
  subscriptionPlanSlug: string;
  subscriptionPrice: string;
  subscriptionMaxUsers: number;
  subscriptionTrialStart: string;
  subscriptionTrialEnd: string;
  subscriptionDaysRemaining: number;
  subscriptionCurrentPeriodStart: string;
  subscriptionCurrentPeriodEnd: string;
  clientStatus: string;
  statusLabel: string;
  statusColor: string;
  nextAction: string;
  progressPercentage: number;
}

interface ClientStatusResponse {
  success: boolean;
  data: {
    clients: ClientStatusData[];
    summary: {
      totalClients: number;
      statusCounts: {
        registered_email_not_verified: number;
        registered_incomplete_onboarding: number;
        onboarding_complete_missions_incomplete: number;
        missions_complete_no_upgrade: number;
        upgraded_active_subscription: number;
      };
      conversionRate: number;
      lastUpdated: string;
    };
  };
}

const statusConfig = {
  registered_email_not_verified: {
    label: "Sudah Daftar - Email Belum Diverifikasi",
    color: "gray",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
    icon: Mail,
  },
  registered_incomplete_onboarding: {
    label: "Terdaftar - Onboarding Belum Selesai",
    color: "red",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    icon: Clock,
  },
  onboarding_complete_missions_incomplete: {
    label: "Onboarding Selesai - Misi Adaptasi Belum Selesai",
    color: "orange",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    icon: Target,
  },
  missions_complete_no_upgrade: {
    label: "Misi Selesai - Belum Upgrade Paket",
    color: "yellow",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
    icon: Award,
  },
  upgraded_active_subscription: {
    label: "Upgrade Selesai - Langganan Aktif",
    color: "green",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    icon: CheckCircle,
  },
};

export default function ClientStatusMapping() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("registrationDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading, error, refetch } = useQuery<ClientStatusResponse>({
    queryKey: ["/api/admin/client-status-mapping"],
    retry: false,
  });

  // Check if user is system owner
  const isSystemOwner = user && typeof user === "object" && "isSystemOwner" in user && user.isSystemOwner;

  if (!isSystemOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Akses Ditolak</CardTitle>
            <CardDescription>
              Halaman ini hanya dapat diakses oleh System Owner
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <SkeletonLoading shape="text" className="h-8 w-64 mb-2" />
            <SkeletonLoading shape="text" className="h-4 w-96" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLoading key={i} shape="card" className="h-32" />
            ))}
          </div>
          
          <SkeletonLoading shape="card" className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Gagal memuat data status client. Silakan coba lagi.
            </CardDescription>
            <Button onClick={() => refetch()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { clients, summary } = data?.data || { clients: [], summary: null };

  // Filter and sort clients
  const filteredAndSortedClients = clients
    .filter(client => {
      const matchesSearch = client.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || client.clientStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof ClientStatusData];
      let bValue = b[sortBy as keyof ClientStatusData];
      
      if (sortBy === "registrationDate") {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (sortBy === "daysSinceRegistration" || sortBy === "missionCompletionPercentage") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pemetaan Status Client</h1>
              <p className="text-gray-600 mt-1">
                Pantau progres client melalui 5 tahap: registrasi, verifikasi email, onboarding, misi adaptasi, dan upgrade paket
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Client</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalClients}</div>
                <p className="text-xs text-muted-foreground">
                  Organisasi terdaftar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Belum Verified</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.statusCounts.registered_email_not_verified}</div>
                <p className="text-xs text-muted-foreground">
                  Perlu verifikasi email
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Client yang upgrade
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Langganan Aktif</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.statusCounts.upgraded_active_subscription}</div>
                <p className="text-xs text-muted-foreground">
                  Client berbayar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Onboarding Selesai</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.statusCounts.onboarding_complete_missions_incomplete + 
                   summary.statusCounts.missions_complete_no_upgrade + 
                   summary.statusCounts.upgraded_active_subscription}
                </div>
                <p className="text-xs text-muted-foreground">
                  Client yang menyelesaikan setup
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari organisasi, nama, atau email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-64">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="registered_email_not_verified">Email Belum Diverifikasi</SelectItem>
                  <SelectItem value="registered_incomplete_onboarding">Onboarding Belum Selesai</SelectItem>
                  <SelectItem value="onboarding_complete_missions_incomplete">Misi Belum Selesai</SelectItem>
                  <SelectItem value="missions_complete_no_upgrade">Belum Upgrade</SelectItem>
                  <SelectItem value="upgraded_active_subscription">Langganan Aktif</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Urutkan berdasarkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registrationDate">Tanggal Registrasi</SelectItem>
                  <SelectItem value="daysSinceRegistration">Hari Sejak Registrasi</SelectItem>
                  <SelectItem value="missionCompletionPercentage">Progress Misi</SelectItem>
                  <SelectItem value="organizationName">Nama Organisasi</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="w-full lg:w-auto"
              >
                {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Client Status Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Status Client ({filteredAndSortedClients.length} dari {clients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAndSortedClients.map((client) => {
                const config = statusConfig[client.clientStatus as keyof typeof statusConfig];
                const Icon = config.icon;
                
                return (
                  <div key={client.organizationId} className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`h-5 w-5 ${config.textColor}`} />
                          <h3 className="font-semibold text-gray-900">{client.organizationName}</h3>
                          <Badge variant="secondary" className={`${config.bgColor} ${config.textColor}`}>
                            {config.label}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{client.ownerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building className="h-4 w-4" />
                            <span>{client.ownerEmail}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{client.daysSinceRegistration} hari yang lalu</span>
                          </div>
                          {client.ownerPhone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{client.ownerPhone}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Progress Misi</span>
                              <span className="text-sm text-gray-600">{client.missionCompletionPercentage}%</span>
                            </div>
                            <Progress value={client.missionCompletionPercentage} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                              <span className="text-sm text-gray-600">{client.progressPercentage}%</span>
                            </div>
                            <Progress value={client.progressPercentage} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {client.onboardingCompleted && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              ✓ Onboarding Selesai
                            </Badge>
                          )}
                          {client.subscriptionStatus && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {client.subscriptionPlan || client.subscriptionStatus}
                            </Badge>
                          )}
                          {client.subscriptionDaysRemaining && client.subscriptionDaysRemaining > 0 && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              {client.subscriptionDaysRemaining} hari trial tersisa
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Langkah selanjutnya:</span> {client.nextAction}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredAndSortedClients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Tidak ada client yang sesuai dengan filter yang dipilih</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}