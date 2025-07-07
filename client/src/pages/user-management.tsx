import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings, 
  Activity, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle2,
  UserX,
  UserCheck,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { UserWithPermissions, Permission, RoleTemplate } from "../../../shared/schema";

// Role Edit Form Component
interface RoleEditFormProps {
  user: UserWithPermissions;
  onSave: (data: { role: string; permissions: Permission[] }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function RoleEditForm({ user, onSave, onCancel, isLoading }: RoleEditFormProps) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    user.permissions?.map(p => p.permission as Permission) || []
  );

  const allPermissions: Permission[] = [
    'manage_users',
    'invite_users', 
    'view_users',
    'deactivate_users',
    'create_objectives',
    'edit_objectives',
    'delete_objectives', 
    'view_objectives',
    'create_initiatives',
    'edit_initiatives',
    'delete_initiatives',
    'view_initiatives',
    'view_analytics',
    'export_data',
    'manage_organization',
    'manage_billing',
  ];

  const handlePermissionToggle = (permission: Permission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = () => {
    onSave({
      role: selectedRole,
      permissions: selectedPermissions,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="role">Role</Label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="organization_admin">Administrator</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-3 block">Permission</Label>
        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
          {allPermissions.map((permission) => (
            <div key={permission} className="flex items-center space-x-2">
              <Checkbox
                id={permission}
                checked={selectedPermissions.includes(permission)}
                onCheckedChange={() => handlePermissionToggle(permission)}
              />
              <label
                htmlFor={permission}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {permission.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </label>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Batal
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isLoading}
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan
        </Button>
      </DialogFooter>
    </div>
  );
}

// Role Template Form Component
interface RoleTemplateFormProps {
  onSave: (data: { name: string; description: string; permissions: Permission[] }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function RoleTemplateForm({ onSave, onCancel, isLoading }: RoleTemplateFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);

  const allPermissions: Permission[] = [
    'manage_users',
    'invite_users', 
    'view_users',
    'deactivate_users',
    'create_objectives',
    'edit_objectives',
    'delete_objectives', 
    'view_objectives',
    'create_initiatives',
    'edit_initiatives',
    'delete_initiatives',
    'view_initiatives',
    'view_analytics',
    'export_data',
    'manage_organization',
    'manage_billing',
  ];

  const handlePermissionToggle = (permission: Permission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      permissions: selectedPermissions,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="template-name">Nama Template</Label>
        <Input
          id="template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Sales Manager"
        />
      </div>

      <div>
        <Label htmlFor="template-description">Deskripsi</Label>
        <Textarea
          id="template-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsi role dan tanggung jawab"
          rows={3}
        />
      </div>

      <div>
        <Label className="mb-3 block">Permission</Label>
        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
          {allPermissions.map((permission) => (
            <div key={permission} className="flex items-center space-x-2">
              <Checkbox
                id={`template-${permission}`}
                checked={selectedPermissions.includes(permission)}
                onCheckedChange={() => handlePermissionToggle(permission)}
              />
              <label
                htmlFor={`template-${permission}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {permission.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </label>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Batal
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isLoading || !name.trim()}
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Buat Template
        </Button>
      </DialogFooter>
    </div>
  );
}

// Bulk Role Assign Form Component
interface BulkRoleAssignFormProps {
  userCount: number;
  onSave: (data: { role: string; permissions: Permission[] }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function BulkRoleAssignForm({ userCount, onSave, onCancel, isLoading }: BulkRoleAssignFormProps) {
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);

  const allPermissions: Permission[] = [
    'manage_users',
    'invite_users', 
    'view_users',
    'deactivate_users',
    'create_objectives',
    'edit_objectives',
    'delete_objectives', 
    'view_objectives',
    'create_initiatives',
    'edit_initiatives',
    'delete_initiatives',
    'view_initiatives',
    'view_analytics',
    'export_data',
    'manage_organization',
    'manage_billing',
  ];

  const handlePermissionToggle = (permission: Permission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = () => {
    onSave({
      role: selectedRole,
      permissions: selectedPermissions,
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          Role dan permission akan diterapkan ke {userCount} pengguna terpilih
        </p>
      </div>

      <div>
        <Label htmlFor="bulk-role">Role</Label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="organization_admin">Administrator</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-3 block">Permission</Label>
        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
          {allPermissions.map((permission) => (
            <div key={permission} className="flex items-center space-x-2">
              <Checkbox
                id={`bulk-${permission}`}
                checked={selectedPermissions.includes(permission)}
                onCheckedChange={() => handlePermissionToggle(permission)}
              />
              <label
                htmlFor={`bulk-${permission}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {permission.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </label>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Batal
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isLoading || !selectedRole}
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Terapkan ke {userCount} Pengguna
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRoleTemplateModal, setShowRoleTemplateModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Fetch users with permissions
  const { data: users = [], isLoading: loadingUsers } = useQuery<UserWithPermissions[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!(user as any)?.isSystemOwner,
  });

  // Fetch role templates
  const { data: roleTemplates = [] } = useQuery<RoleTemplate[]>({
    queryKey: ["/api/role-templates"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Berhasil",
        description: "Role pengguna berhasil diperbarui",
      });
      setShowRoleModal(false);
    },
    onError: (error: any) => {
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
      const response = await apiRequest("PATCH", `/api/users/${userId}/status`, {
        isActive,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Berhasil",
        description: "Status pengguna berhasil diperbarui",
      });
    },
    onError: (error: any) => {
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
    onError: (error: any) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Berhasil",
        description: `Role berhasil ditetapkan untuk ${selectedUsers.length} pengguna`,
      });
      setShowBulkAssignModal(false);
      setSelectedUsers([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Gagal menetapkan role secara massal",
        variant: "destructive",
      });
    },
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manajemen Pengguna</h1>
          <p className="text-gray-600">Kelola pengguna, role, dan permission di seluruh sistem</p>
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
            <CardTitle className="text-sm font-medium">Administrator</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "organization_admin").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Akses penuh organisasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manager</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "manager").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Akses manajemen terbatas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengguna Aktif</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Dari {users.length} total
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
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            Kelola dan pantau semua pengguna dalam sistem
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
              {selectedUsers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                >
                  Batal Pilih
                </Button>
              )}
            </div>
          )}

          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                  selectedUsers.includes(user.id) ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                  />
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-medium">
                      {user.firstName?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.email
                      }
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.department && (
                      <div className="text-sm text-gray-500">{user.department}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role === "organization_admin" && "Admin"}
                    {user.role === "manager" && "Manager"}
                    {user.role === "member" && "Member"}
                    {user.role === "viewer" && "Viewer"}
                  </Badge>
                  
                  <Badge className={getStatusBadgeColor(user.isActive)}>
                    {user.isActive ? "Aktif" : "Tidak Aktif"}
                  </Badge>

                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowRoleModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                      disabled={updateUserStatusMutation.isPending}
                    >
                      {user.isActive ? (
                        <UserX className="h-4 w-4 text-red-600" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Tidak ada pengguna yang ditemukan
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengguna</DialogTitle>
            <DialogDescription>
              Informasi lengkap pengguna dan permission
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nama Lengkap</Label>
                  <p className="text-sm">
                    {selectedUser.firstName && selectedUser.lastName 
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : "Tidak tersedia"
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <Badge className={getRoleBadgeColor(selectedUser.role)}>
                    {selectedUser.role}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusBadgeColor(selectedUser.isActive)}>
                    {selectedUser.isActive ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
                {selectedUser.department && (
                  <div>
                    <Label className="text-sm font-medium">Departemen</Label>
                    <p className="text-sm">{selectedUser.department}</p>
                  </div>
                )}
                {selectedUser.jobTitle && (
                  <div>
                    <Label className="text-sm font-medium">Jabatan</Label>
                    <p className="text-sm">{selectedUser.jobTitle}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Permission</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedUser.permissions?.length > 0 ? (
                    selectedUser.permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">{permission.permission}</span>
                        {permission.expiresAt && (
                          <span className="text-xs text-gray-500">
                            Berakhir: {new Date(permission.expiresAt).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Tidak ada permission khusus</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role Pengguna</DialogTitle>
            <DialogDescription>
              Ubah role dan permission pengguna
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
              Buat template role dengan permission yang dapat digunakan untuk multiple pengguna
            </DialogDescription>
          </DialogHeader>
          
          <RoleTemplateForm 
            onSave={handleCreateRoleTemplate}
            onCancel={() => setShowRoleTemplateModal(false)}
            isLoading={createRoleTemplateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Role Modal */}
      <Dialog open={showBulkAssignModal} onOpenChange={setShowBulkAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur Role Massal</DialogTitle>
            <DialogDescription>
              Tetapkan role dan permission untuk {selectedUsers.length} pengguna terpilih
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

