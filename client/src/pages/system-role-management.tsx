import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  Shield, 
  UserPlus, 
  Settings, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Power,
  Loader2,
  Crown,
  Building,
  Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  isSystemOwner: boolean;
  organizationId: string | null;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  subscriptionPlan: string;
  createdAt: string;
}

interface Permission {
  id: string;
  permission: string;
  resource: string | null;
}

interface UserWithPermissions extends User {
  permissions: Permission[];
  organization?: Organization;
}

export default function SystemRoleManagement() {
  const { user } = useAuth();
  const userTyped = user as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Check if current user is system owner
  if (!userTyped?.isSystemOwner) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </div>
    );
  }

  // Fetch all users across all organizations
  const { data: users = [], isLoading: loadingUsers } = useQuery<UserWithPermissions[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch all organizations
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Berhasil",
        description: "Role pengguna berhasil diperbarui",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal memperbarui role pengguna",
        variant: "destructive",
      });
    },
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/status`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Berhasil",
        description: "Status pengguna berhasil diperbarui",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal memperbarui status pengguna",
        variant: "destructive",
      });
    },
  });

  // Set system owner mutation
  const setSystemOwnerMutation = useMutation({
    mutationFn: async ({ userId, isSystemOwner }: { userId: string; isSystemOwner: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/system-owner`, { isSystemOwner });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Berhasil",
        description: "Status system owner berhasil diperbarui",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal memperbarui status system owner",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = !statusFilter || statusFilter === "all" || (statusFilter === "active" ? u.isActive : !u.isActive);
    const matchesOrganization = !organizationFilter || organizationFilter === "all" || u.organizationId === organizationFilter;
    
    return matchesSearch && matchesRole && matchesStatus && matchesOrganization;
  });

  // Helper function to get user profile image URL
  const getUserProfileImage = (user: UserWithPermissions): string | undefined => {
    return (user as any).profileImageUrl || undefined;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-red-100 text-red-800";
      case "administrator":
        return "bg-blue-100 text-blue-800";
      case "member":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  const handleUpdateUserRole = (userId: string, role: string) => {
    updateUserRoleMutation.mutate({ userId, role });
  };

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    updateUserStatusMutation.mutate({
      userId,
      isActive: !currentStatus,
    });
  };

  const handleToggleSystemOwner = (userId: string, currentStatus: boolean) => {
    setSystemOwnerMutation.mutate({
      userId,
      isSystemOwner: !currentStatus,
    });
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => 
      checked 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? filteredUsers.map(u => u.id) : []);
  };

  if (loadingUsers) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Role Management</h1>
          <p className="text-gray-600">Kelola pengguna dan role di seluruh platform sistem</p>
        </div>
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-700">System Owner Access</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.isActive).length} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Owners</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.isSystemOwner).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Akses penuh platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organisasi</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground">
              Total organisasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Org Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "organization_admin").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Administrator organisasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari pengguna..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="owner">owner</SelectItem>
                <SelectItem value="administrator">administrator</SelectItem>
                <SelectItem value="member">member</SelectItem>
                <SelectItem value="viewer">viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
            <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter organisasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Organisasi</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna Platform</CardTitle>
          <CardDescription>
            Kelola semua pengguna di seluruh platform sebagai System Owner
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions Header */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedUsers.length === filteredUsers.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedUsers.length > 0 
                    ? `${selectedUsers.length} pengguna dipilih`
                    : "Pilih semua pengguna"
                  }
                </span>
              </div>
            </div>
          )}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Organisasi</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>System Owner</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleUserSelection(user.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getUserProfileImage(user)} alt={user.name || user.email} />
                          <AvatarFallback>
                            {user.name 
                              ? user.name.trim().split(' ').map(n => n[0]).join('').toUpperCase()
                              : user.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.name && user.name.trim() !== '' ? user.name.trim() : user.email?.split('@')[0] || 'User'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.organization ? (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{user.organization.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Tidak ada</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getRoleBadgeColor(user.role)}>
                        {user.role === "organization_admin" ? "Org Admin" : 
                         user.role === "manager" ? "Manager" : 
                         user.role === "member" ? "Member" : "Viewer"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusBadgeColor(user.isActive)}>
                        {user.isActive ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isSystemOwner}
                          onCheckedChange={() => handleToggleSystemOwner(user.id, user.isSystemOwner)}
                          disabled={user.id === user.id} // Prevent self-modification
                        />
                        {user.isSystemOwner && <Crown className="h-4 w-4 text-yellow-600" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, user.isActive)}>
                            <Power className="mr-2 h-4 w-4" />
                            {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateUserRole(user.id, "organization_admin")}>
                            <Shield className="mr-2 h-4 w-4" />
                            Jadikan Org Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateUserRole(user.id, "member")}>
                            <Users className="mr-2 h-4 w-4" />
                            Jadikan Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada pengguna</h3>
              <p className="text-gray-500">Tidak ada pengguna yang cocok dengan filter yang dipilih.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}