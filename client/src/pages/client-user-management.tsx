import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  UserPlus, 
  Settings, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Power,
  Loader2,
  Building,
  UserCheck,
  Mail,
  Calendar,
  Trash2,
  Building2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  organizationId: string | null;
  createdAt: string;
  invitationStatus: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  user: User;
}

export default function ClientUserManagement() {
  const { user } = useAuth();
  const { isOwner, organization } = useOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  
  // Team management states
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);

  // Reset team form
  const resetTeamForm = () => {
    setSelectedMembers([]);
    setShowCreateTeamModal(false);
  };

  // Check if current user can manage users in their organization
  if (!isOwner) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Users className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Hanya pemilik organisasi yang dapat mengelola pengguna.</p>
        </div>
      </div>
    );
  }

  // Fetch users in the current organization only
  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/organization/users"],
  });

  // Fetch teams in the current organization
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Fetch team members
  const { data: allTeamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const response = await apiRequest("POST", "/api/organization/invite", { email, role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users"] });
      toast({
        title: "Berhasil",
        description: "Undangan telah dikirim ke pengguna",
        variant: "default",
      });
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("member");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal mengirim undangan",
        variant: "destructive",
      });
    },
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/organization/users/${userId}/status`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users"] });
      toast({
        title: "Berhasil",
        description: "Status pengguna berhasil diperbarui",
        variant: "default",
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

  // Remove user from organization mutation
  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/organization/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users"] });
      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus dari organisasi",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menghapus pengguna",
        variant: "destructive",
      });
    },
  });

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/organization/users/${userId}/resend-invitation`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/users"] });
      toast({
        title: "Berhasil",
        description: "Undangan berhasil dikirim ulang",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal mengirim ulang undangan",
        variant: "destructive",
      });
    },
  });

  // Team management mutations
  const createTeamMutation = useMutation({
    mutationFn: async ({ name, description, ownerId, memberIds }: 
      { name: string; description: string; ownerId: string; memberIds: string[] }) => {
      const response = await apiRequest("POST", "/api/teams", {
        name,
        description,
        ownerId,
        memberIds,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      resetTeamForm(); // Reset form and close modal
      toast({
        title: "Berhasil",
        description: "Tim berhasil dibuat"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal membuat tim",
        variant: "destructive"
      });
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await apiRequest("DELETE", `/api/teams/${teamId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({
        title: "Berhasil",
        description: "Tim berhasil dihapus"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menghapus tim",
        variant: "destructive"
      });
    }
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.isActive) ||
                         (statusFilter === "inactive" && !user.isActive) ||
                         (statusFilter === "pending" && user.invitationStatus === "pending");
    return matchesSearch && matchesStatus;
  });

  // Filter teams
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(teamSearchTerm.toLowerCase())
  );

  const handleInviteUser = () => {
    if (inviteEmail.trim()) {
      inviteUserMutation.mutate({ 
        email: inviteEmail.trim(), 
        role: inviteRole 
      });
    }
  };

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    updateUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const handleRemoveUser = (userId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus pengguna ini dari organisasi?")) {
      removeUserMutation.mutate(userId);
    }
  };

  const handleResendInvitation = (userId: string) => {
    resendInvitationMutation.mutate(userId);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      owner: { label: "owner", color: "bg-red-100 text-red-800" },
      administrator: { label: "administrator", color: "bg-blue-100 text-blue-800" },
      member: { label: "member", color: "bg-green-100 text-green-800" },
      viewer: { label: "viewer", color: "bg-gray-100 text-gray-800" },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, color: "bg-gray-100 text-gray-800" };
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengguna & Tim</h1>
          <p className="text-gray-600 mt-1">
            Kelola pengguna dan tim dalam organisasi {organization?.name}
          </p>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pengguna</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pengguna Aktif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Undangan Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.invitationStatus === "pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tim</p>
                <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="teams">Tim</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Pengguna Organisasi</CardTitle>
                  <CardDescription>
                    Kelola pengguna dalam organisasi Anda ({filteredUsers.length} pengguna)
                  </CardDescription>
                </div>
                <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Undang Pengguna
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Undang Pengguna Baru</DialogTitle>
                      <DialogDescription>
                        Kirim undangan kepada pengguna untuk bergabung dengan organisasi Anda.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="nama@perusahaan.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="administrator">Administrator</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowInviteModal(false)}
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={handleInviteUser}
                          disabled={inviteUserMutation.isPending}
                        >
                          {inviteUserMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Mengirim...
                            </>
                          ) : (
                            "Kirim Undangan"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari berdasarkan nama atau email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Undangan</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-gray-500">Memuat pengguna...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Tidak ada pengguna ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : user.email
                              }
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.isActive ? "default" : "secondary"}
                          className={user.isActive 
                            ? "bg-green-100 text-green-800 border-0" 
                            : "bg-red-100 text-red-800 border-0"
                          }
                        >
                          {user.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.invitationStatus === "pending" ? "secondary" : "default"}
                          className={user.invitationStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800 border-0"
                            : user.invitationStatus === "accepted"
                            ? "bg-green-100 text-green-800 border-0"
                            : "bg-gray-100 text-gray-800 border-0"
                          }
                        >
                          {user.invitationStatus === "pending" ? "Menunggu" : 
                           user.invitationStatus === "accepted" ? "Diterima" : 
                           user.invitationStatus === "registered" ? "Terdaftar" : 
                           user.invitationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(user.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.invitationStatus === "pending" && (
                              <DropdownMenuItem 
                                onClick={() => handleResendInvitation(user.id)}
                                disabled={resendInvitationMutation.isPending}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Kirim Ulang Undangan
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRemoveUser(user.id)}
                              className="text-red-600"
                            >
                              <Users className="mr-2 h-4 w-4" />
                              Hapus dari Organisasi
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manajemen Tim</CardTitle>
                  <CardDescription>
                    Kelola tim dalam organisasi Anda ({filteredTeams.length} tim)
                  </CardDescription>
                </div>
                <Dialog open={showCreateTeamModal} onOpenChange={setShowCreateTeamModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Tambah Tim
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Buat Tim Baru</DialogTitle>
                      <DialogDescription>
                        Buat tim baru dan tentukan anggotanya
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      createTeamMutation.mutate({
                        name: formData.get('name') as string,
                        description: formData.get('description') as string,
                        ownerId: formData.get('ownerId') as string,
                        memberIds: selectedMembers,
                      });
                    }}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nama Tim</Label>
                          <Input name="name" placeholder="Nama tim" required />
                        </div>
                        <div>
                          <Label htmlFor="description">Deskripsi</Label>
                          <Input name="description" placeholder="Deskripsi tim" />
                        </div>
                        <div>
                          <Label htmlFor="ownerId">Pimpinan Tim</Label>
                          <Select name="ownerId" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih pimpinan tim" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Anggota Tim</Label>
                          <div className="space-y-2">
                            <div className="relative">
                              <select
                                multiple
                                name="members"
                                value={selectedMembers}
                                onChange={(e) => {
                                  const values = Array.from(e.target.selectedOptions, option => option.value);
                                  setSelectedMembers(values);
                                }}
                                className="w-full min-h-[120px] p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                size={6}
                              >
                                {users.map((user) => (
                                  <option 
                                    key={user.id} 
                                    value={user.id} 
                                    className="py-1 px-2 hover:bg-orange-50 cursor-pointer"
                                  >
                                    {user.firstName} {user.lastName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-500">
                                Tahan Ctrl (Windows) atau Cmd (Mac) untuk memilih beberapa anggota
                              </p>
                              <span className="text-xs text-orange-600 font-medium">
                                {selectedMembers.length} dipilih
                              </span>
                            </div>
                            {selectedMembers.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {selectedMembers.map((memberId) => {
                                  const member = users.find(u => u.id === memberId);
                                  if (!member) return null;
                                  return (
                                    <Badge key={memberId} variant="secondary" className="text-xs">
                                      {member.firstName} {member.lastName}
                                      <button
                                        type="button"
                                        onClick={() => setSelectedMembers(prev => prev.filter(id => id !== memberId))}
                                        className="ml-1 text-gray-500 hover:text-red-500"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={resetTeamForm}>
                            Batal
                          </Button>
                          <Button type="submit" disabled={createTeamMutation.isPending}>
                            {createTeamMutation.isPending ? "Membuat..." : "Buat Tim"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari tim..."
                    value={teamSearchTerm}
                    onChange={(e) => setTeamSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Teams Grid */}
              {teamsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada tim</h3>
                  <p className="text-gray-500">Buat tim pertama untuk memulai kolaborasi</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTeams.map((team) => {
                    const teamMembersForTeam = allTeamMembers.filter(tm => tm.teamId === team.id);
                    const owner = users.find(u => u.id === team.ownerId);
                    
                    return (
                      <Card key={team.id}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{team.name}</CardTitle>
                              <CardDescription>{team.description}</CardDescription>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setEditingTeam(team)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Tim
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem 
                                      className="text-red-600 focus:text-red-600"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Hapus Tim
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus Tim</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus tim "{team.name}"? 
                                        Tindakan ini tidak dapat dibatalkan.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteTeamMutation.mutate(team.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* Owner */}
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Pimpinan
                              </Badge>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {owner ? `${owner.firstName?.[0]}${owner.lastName?.[0]}` : '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                  {owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Members */}
                            <div>
                              <p className="text-sm text-gray-600 mb-2">
                                Anggota ({teamMembersForTeam.length})
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {teamMembersForTeam.slice(0, 3).map((member) => (
                                  <Avatar key={member.id} className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {`${member.user.firstName?.[0]}${member.user.lastName?.[0]}`}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {teamMembersForTeam.length > 3 && (
                                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-xs text-gray-600">
                                      +{teamMembersForTeam.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}