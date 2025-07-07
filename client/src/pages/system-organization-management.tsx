
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  User,
  Calendar,
  Globe,
  Users,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization } from "@shared/schema";

interface OrganizationWithDetails extends Organization {
  userCount?: number;
  subscription?: {
    status: string;
    plan: {
      name: string;
      price: string;
    };
  };
  owner?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function SystemOrganizationManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationWithDetails | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Check if user is system owner
  if (!user || !(user as any).isSystemOwner) {
    setLocation("/dashboard");
    return null;
  }

  // Fetch organizations
  const { data: organizations = [], isLoading: loadingOrgs, error, refetch } = useQuery<OrganizationWithDetails[]>({
    queryKey: ["/api/admin/organizations-detailed"],
    queryFn: async () => {
      console.log("🔄 Fetching organizations from client...");
      const response = await fetch("/api/admin/organizations-detailed");
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to fetch organizations:", response.status, errorText);
        throw new Error(`Failed to fetch organizations: ${response.status}`);
      }
      const data = await response.json();
      console.log("✅ Received organizations data:", data.length, "organizations");
      return data;
    },
  });

  // Filter organizations
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = searchTerm === "" || 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || org.registrationStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Approve organization mutation
  const approveOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await fetch(`/api/admin/organizations/${organizationId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error('Failed to approve organization');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations-detailed"] });
      toast({
        title: "Berhasil",
        description: "Organisasi berhasil disetujui",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject organization mutation
  const rejectOrganizationMutation = useMutation({
    mutationFn: async ({ organizationId, reason }: { organizationId: string; reason: string }) => {
      const response = await fetch(`/api/admin/organizations/${organizationId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject organization');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations-detailed"] });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedOrganization(null);
      toast({
        title: "Berhasil",
        description: "Organisasi berhasil ditolak",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Suspend organization mutation
  const suspendOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await fetch(`/api/admin/organizations/${organizationId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error('Failed to suspend organization');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations-detailed"] });
      toast({
        title: "Berhasil",
        description: "Organisasi berhasil disuspend",
        className: "border-orange-200 bg-orange-50 text-orange-800",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reactivate organization mutation
  const reactivateOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const response = await fetch(`/api/admin/organizations/${organizationId}/reactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error('Failed to reactivate organization');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations-detailed"] });
      toast({
        title: "Berhasil",
        description: "Organisasi berhasil diaktifkan kembali",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "suspended":
        return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleReject = (org: OrganizationWithDetails) => {
    setSelectedOrganization(org);
    setIsRejectDialogOpen(true);
  };

  if (loadingOrgs) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Memuat data organisasi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">Gagal memuat data organisasi</p>
          <Button onClick={() => refetch()} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  const pendingCount = organizations.filter(org => org.registrationStatus === "pending").length;
  const approvedCount = organizations.filter(org => org.registrationStatus === "approved").length;
  const rejectedCount = organizations.filter(org => org.registrationStatus === "rejected").length;
  const suspendedCount = organizations.filter(org => org.registrationStatus === "suspended").length;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Kelola Organisasi</h1>
        <p className="text-gray-600">Kelola pendaftaran dan status organisasi dalam platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Menunggu persetujuan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Organisasi aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Ditolak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{suspendedCount}</div>
            <p className="text-xs text-muted-foreground">Disuspend</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Organisasi</CardTitle>
          <CardDescription>
            Kelola semua organisasi yang terdaftar dalam platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari organisasi berdasarkan nama, slug, atau industri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter berdasarkan status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Organizations Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisasi</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Industri</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={org.logo || undefined} />
                          <AvatarFallback>
                            <Building2 className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{org.name}</div>
                          <div className="text-sm text-gray-500">@{org.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.owner ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {org.owner.firstName} {org.owner.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{org.owner.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{org.industry || "-"}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(org.registrationStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{org.userCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(org.createdAt).toLocaleDateString("id-ID")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Buka menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          
                          {org.registrationStatus === "pending" && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => approveOrganizationMutation.mutate(org.id)}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Setujui
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleReject(org)}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Tolak
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {org.registrationStatus === "approved" && (
                            <DropdownMenuItem 
                              onClick={() => suspendOrganizationMutation.mutate(org.id)}
                              className="text-orange-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          
                          {org.registrationStatus === "suspended" && (
                            <DropdownMenuItem 
                              onClick={() => reactivateOrganizationMutation.mutate(org.id)}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Aktifkan Kembali
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Organisasi
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOrganizations.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada organisasi</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all" 
                  ? "Tidak ada organisasi yang sesuai dengan filter"
                  : "Belum ada organisasi yang terdaftar"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Organization Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Organisasi</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk organisasi "{selectedOrganization?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Alasan Penolakan</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Masukkan alasan mengapa organisasi ini ditolak..."
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setRejectionReason("");
                  setSelectedOrganization(null);
                }}
              >
                Batal
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (selectedOrganization && rejectionReason.trim()) {
                    rejectOrganizationMutation.mutate({
                      organizationId: selectedOrganization.id,
                      reason: rejectionReason.trim()
                    });
                  }
                }}
                disabled={!rejectionReason.trim() || rejectOrganizationMutation.isPending}
              >
                {rejectOrganizationMutation.isPending ? "Menolak..." : "Tolak Organisasi"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
