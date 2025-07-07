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
  Building,
  UserCheck
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
// Helper components for role management
function RoleEditForm({ user, onSave, onCancel, isLoading }: any) {
  return (
    <div className="space-y-4">
      <p>Role edit form untuk {user.email} akan diimplementasikan di sini.</p>
      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline">Batal</Button>
        <Button onClick={() => onSave({ role: "member", permissions: [] })} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan
        </Button>
      </div>
    </div>
  );
}

function RoleTemplateForm({ onSave, onCancel, isLoading }: any) {
  return (
    <div className="space-y-4">
      <p>Template role form akan diimplementasikan di sini.</p>
      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline">Batal</Button>
        <Button onClick={() => onSave({ name: "Template", description: "Desc", permissions: [] })} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan
        </Button>
      </div>
    </div>
  );
}

function BulkRoleAssignForm({ userCount, onSave, onCancel, isLoading }: any) {
  return (
    <div className="space-y-4">
      <p>Bulk role assign untuk {userCount} pengguna akan diimplementasikan di sini.</p>
      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline">Batal</Button>
        <Button onClick={() => onSave({ role: "member", permissions: [] })} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Terapkan
        </Button>
      </div>
    </div>
  );
}

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

interface Permission {
  id: string;
  permission: string;
  resource: string | null;
}

interface UserWithPermissions extends User {
  permissions: Permission[];
}

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export default function ClientRoleManagement() {
  const { user } = useAuth();
  const { isOwner } = useOrganization();
  const userTyped = user as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRoleTemplateModal, setShowRoleTemplateModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);

  // Check if current user is organization owner or system owner
  const canManageRoles = isOwner || userTyped?.isSystemOwner;
  
  if (!canManageRoles) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki akses untuk mengelola role.</p>
        </div>
      </div>
    );
  }

  // Fetch users in the current organization
  const { data: users = [], isLoading: loadingUsers } = useQuery<UserWithPermissions[]>({
    queryKey: ["/api/users"],
  });

  // Fetch role templates
  const { data: roleTemplates = [] } = useQuery<RoleTemplate[]>({
    queryKey: ["/api/role-templates"],
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role, permissions }: { userId: string; role: string; permissions: Permission[] }) => {
      const response = await apiRequest("PUT", `/api/users/${userId}/role`, {
        role,
        permissions,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Berhasil",
        description: "Role pengguna berhasil diperbarui",
      });
      setShowRoleModal(false);
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
      const response = await apiRequest("PUT", `/api/users/${userId}/status`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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

  // Create role template mutation
  const createRoleTemplateMutation = useMutation({
    mutationFn: async (templateData: { name: string; description: string; permissions: Permission[] }) => {
      const response = await apiRequest("POST", "/api/role-templates", templateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-templates"] });
      toast({
        title: "Berhasil",
        description: "Template role berhasil dibuat",
      });
      setShowRoleTemplateModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal membuat template role",
        variant: "destructive",
      });
    },
  });

  // Bulk assign role mutation
  const bulkAssignRoleMutation = useMutation({
    mutationFn: async ({ userIds, role, permissions }: { userIds: string[]; role: string; permissions: Permission[] }) => {
      await Promise.all(
        userIds.map(userId =>
          apiRequest("PUT", `/api/users/${userId}/role`, { role, permissions })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Berhasil",
        description: `Role berhasil ditetapkan untuk ${selectedUsers.length} pengguna`,
      });
      setShowBulkAssignModal(false);
      setSelectedUsers([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menetapkan role secara massal",
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
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "organization_admin":
        return "bg-purple-100 text-purple-800";
      case "manager":
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

  const handleUpdateUserRole = (roleData: { role: string; permissions: Permission[] }) => {
    if (!selectedUser) return;
    
    updateUserRoleMutation.mutate({
      userId: selectedUser.id,
      role: roleData.role,
      permissions: roleData.permissions,
    });
  };

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    updateUserStatusMutation.mutate({
      userId,
      isActive: !currentStatus,
    });
  };

  const handleCreateRoleTemplate = (templateData: { name: string; description: string; permissions: Permission[] }) => {
    createRoleTemplateMutation.mutate(templateData);
  };

  const handleBulkAssignRole = (roleData: { role: string; permissions: Permission[] }) => {
    bulkAssignRoleMutation.mutate({
      userIds: selectedUsers,
      role: roleData.role,
      permissions: roleData.permissions,
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
          <h1 className="text-3xl font-bold mb-2">Manajemen Role Organisasi</h1>
          <p className="text-gray-600">Kelola pengguna dan role dalam organisasi Anda</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowRoleTemplateModal(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Template Role
          </Button>
          {selectedUsers.length > 0 && (
            <Button
              onClick={() => setShowBulkAssignModal(true)}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Atur Role ({selectedUsers.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Anggota</CardTitle>
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
            <CardTitle className="text-sm font-medium">Administrator</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "organization_admin").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Admin organisasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manager</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "manager").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Akses manajemen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "member").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Anggota reguler
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
                  placeholder="Cari anggota..."
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
                <SelectItem value="organization_admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Anggota Organisasi</CardTitle>
          <CardDescription>
            Kelola dan pantau semua anggota dalam organisasi Anda
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
                    ? `${selectedUsers.length} anggota dipilih`
                    : "Pilih semua anggota"
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
                  <TableHead>Anggota</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissions</TableHead>
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
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                          <AvatarFallback>
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getRoleBadgeColor(user.role)}>
                        {user.role === "organization_admin" ? "Administrator" : 
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
                      <span className="text-sm text-gray-500">
                        {user.permissions ? user.permissions.length : 0} permissions
                      </span>
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
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowRoleModal(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, user.isActive)}>
                            <Power className="mr-2 h-4 w-4" />
                            {user.isActive ? "Nonaktifkan" : "Aktifkan"}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada anggota</h3>
              <p className="text-gray-500">Tidak ada anggota yang cocok dengan filter yang dipilih.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Edit Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role Anggota</DialogTitle>
            <DialogDescription>
              Ubah role dan permissions untuk anggota organisasi
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <RoleEditForm
              user={selectedUser}
              onSave={handleUpdateUserRole}
              onCancel={() => setShowRoleModal(false)}
              isLoading={updateUserRoleMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Role Template Modal */}
      <Dialog open={showRoleTemplateModal} onOpenChange={setShowRoleTemplateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buat Template Role</DialogTitle>
            <DialogDescription>
              Buat template role untuk mempermudah pengaturan role di masa depan
            </DialogDescription>
          </DialogHeader>
          <RoleTemplateForm
            onSave={handleCreateRoleTemplate}
            onCancel={() => setShowRoleTemplateModal(false)}
            isLoading={createRoleTemplateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Modal */}
      <Dialog open={showBulkAssignModal} onOpenChange={setShowBulkAssignModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Atur Role Massal</DialogTitle>
            <DialogDescription>
              Atur role untuk {selectedUsers.length} anggota sekaligus
            </DialogDescription>
          </DialogHeader>
          <BulkRoleAssignForm
            userCount={selectedUsers.length}
            onSave={handleBulkAssignRole}
            onCancel={() => setShowBulkAssignModal(false)}
            isLoading={bulkAssignRoleMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}