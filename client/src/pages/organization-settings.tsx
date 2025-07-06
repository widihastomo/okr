import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Team, TeamMember } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, Users, CreditCard, Building2, Loader2, Plus, Edit, Trash2, UserPlus, Shield, User as UserIcon, Search, UserCheck, UserX, MoreHorizontal, MoreVertical, Eye, EyeOff, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserWithTeams = User & {
  teams?: (TeamMember & { team: Team })[];
};

export default function OrganizationSettings() {
  const { user } = useAuth();
  const { organization, subscription, isOwner, isLoading } = useOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  
  // User management states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingPassword, setEditingPassword] = useState<User | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Team management states
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamSearchTerm, setTeamSearchTerm] = useState("");

  // Fetch users for organization
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch teams for organization
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Fetch team members for selected team (for modal)
  const { data: teamMembers = [], isLoading: teamMembersLoading } = useQuery<Array<TeamMember & { user: User }>>({
    queryKey: ["/api/teams", selectedTeam?.id, "members"],
    enabled: !!selectedTeam,
  });

  // Fetch all team members for all teams (for card display)
  const { data: allTeamMembers = [] } = useQuery<Array<TeamMember & { user: User }>>({
    queryKey: ["/api/team-members"],
    queryFn: async () => {
      const memberPromises = teams.map(team => 
        fetch(`/api/teams/${team.id}/members`).then(res => res.json())
      );
      const results = await Promise.all(memberPromises);
      return results.flat();
    },
    enabled: teams.length > 0,
  });

  // Filtered users based on search and role filter
  const filteredUsers = users.filter(u => {
    const matchesSearch = searchTerm === "" || 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; firstName: string; lastName: string; role: string; password: string }) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Berhasil",
        description: "User berhasil dibuat",
        variant: "success",
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

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; email: string; firstName: string; lastName: string; role: string }) => {
      const response = await fetch(`/api/users/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({
        title: "Berhasil",
        description: "User berhasil diperbarui",
        variant: "success",
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

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Berhasil",
        description: "User berhasil dihapus",
        variant: "success",
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

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { id: string; password: string }) => {
      const response = await fetch(`/api/users/${data.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.password }),
      });
      if (!response.ok) throw new Error('Failed to change password');
      return response.json();
    },
    onSuccess: () => {
      setEditingPassword(null);
      setShowNewPassword(false);
      toast({
        title: "Berhasil",
        description: "Password berhasil diubah",
        variant: "success",
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

  // Role styling functions
  const getRoleBadge = (role: string) => {
    const roleStyles = {
      lead: "bg-blue-100 text-blue-800",
      member: "bg-green-100 text-green-800",
      contributor: "bg-purple-100 text-purple-800",
      reviewer: "bg-orange-100 text-orange-800",
    };
    return roleStyles[role as keyof typeof roleStyles] || "bg-gray-100 text-gray-800";
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "lead": return UserPlus;
      case "member": return UserIcon;
      case "contributor": return Users;
      case "reviewer": return Shield;
      default: return UserIcon;
    }
  };

  // Team mutations
  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; ownerId: string; memberIds: string[] }) => {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({
        title: "Berhasil",
        description: "Tim berhasil dibuat",
        variant: "success",
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

  const updateTeamMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description: string; ownerId: string; memberIds: string[] }) => {
      const response = await fetch(`/api/teams/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      setEditingTeam(null);
      toast({
        title: "Berhasil",
        description: "Tim berhasil diperbarui",
        variant: "success",
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

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to delete team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({
        title: "Berhasil",
        description: "Tim berhasil dihapus",
        variant: "success",
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

  // Filtered teams
  const filteredTeams = teams.filter(team => {
    return teamSearchTerm === "" || 
      team.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(teamSearchTerm.toLowerCase());
  });

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
        <TabsList className="grid w-full grid-cols-5 max-w-3xl">
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
          <TabsTrigger value="teams">
            <Users className="h-4 w-4 mr-2" />
            Tim
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
                Kelola anggota dalam organisasi Anda ({filteredUsers.length} anggota)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add User and Search Controls */}
              <div className="flex justify-between items-center mb-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Tambah Anggota
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Anggota Baru</DialogTitle>
                      <DialogDescription>
                        Buat akun anggota baru untuk organisasi
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const userData = {
                        email: formData.get('email') as string,
                        firstName: formData.get('firstName') as string,
                        lastName: formData.get('lastName') as string,
                        role: formData.get('role') as string,
                        password: formData.get('password') as string,
                      };
                      createUserMutation.mutate(userData);
                    }}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input name="email" type="email" placeholder="Masukkan email" required />
                        </div>
                        <div>
                          <Label htmlFor="firstName">Nama Depan</Label>
                          <Input name="firstName" placeholder="Masukkan nama depan" required />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Nama Belakang</Label>
                          <Input name="lastName" placeholder="Masukkan nama belakang" required />
                        </div>
                        <div>
                          <Label htmlFor="password">Password Default</Label>
                          <div className="relative">
                            <Input 
                              name="password" 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Masukkan password default" 
                              required 
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select name="role" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="lead">Lead</SelectItem>
                              <SelectItem value="contributor">Contributor</SelectItem>
                              <SelectItem value="reviewer">Reviewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          disabled={createUserMutation.isPending}
                        >
                          {createUserMutation.isPending ? "Membuat..." : "Buat Anggota"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search and Filter Controls */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari anggota berdasarkan nama, email, atau ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter berdasarkan role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Role</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Anggota</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => {
                        const RoleIcon = getRoleIcon(user.role);
                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                                  <AvatarFallback>
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {user.id.substring(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-900">{user.email}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getRoleBadge(user.role)} flex items-center gap-1 w-fit`}>
                                <RoleIcon className="h-3 w-3" />
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                Aktif
                              </Badge>
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
                                  <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Ubah anggota
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setEditingPassword(user)}>
                                    <Key className="mr-2 h-4 w-4" />
                                    Ubah Password
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Hapus anggota
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tindakan ini tidak dapat dibatalkan. Ini akan menghapus anggota 
                                          "{user.firstName} {user.lastName}" secara permanen dan menghapus semua data terkait.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteUserMutation.mutate(user.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Hapus
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Edit User Dialog */}
              {editingUser && (
                <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ubah Anggota</DialogTitle>
                      <DialogDescription>
                        Perbarui informasi anggota untuk {editingUser.firstName} {editingUser.lastName}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      updateUserMutation.mutate({
                        id: editingUser.id,
                        email: formData.get('email') as string,
                        firstName: formData.get('firstName') as string,
                        lastName: formData.get('lastName') as string,
                        role: formData.get('role') as string,
                      });
                    }}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            name="email" 
                            type="email" 
                            defaultValue={editingUser.email || ''} 
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="firstName">Nama Depan</Label>
                          <Input 
                            name="firstName" 
                            defaultValue={editingUser.firstName || ''} 
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Nama Belakang</Label>
                          <Input 
                            name="lastName" 
                            defaultValue={editingUser.lastName || ''} 
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select name="role" defaultValue={editingUser.role} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="lead">Lead</SelectItem>
                              <SelectItem value="contributor">Contributor</SelectItem>
                              <SelectItem value="reviewer">Reviewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          disabled={updateUserMutation.isPending}
                        >
                          {updateUserMutation.isPending ? "Memperbarui..." : "Perbarui Anggota"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              {/* Change Password Dialog */}
              {editingPassword && (
                <Dialog open={!!editingPassword} onOpenChange={() => {
                  setEditingPassword(null);
                  setShowNewPassword(false);
                }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ubah Password</DialogTitle>
                      <DialogDescription>
                        Atur password baru untuk {editingPassword.firstName} {editingPassword.lastName}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      changePasswordMutation.mutate({
                        id: editingPassword.id,
                        password: formData.get('password') as string,
                      });
                    }}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="password">Password Baru</Label>
                          <div className="relative">
                            <Input 
                              name="password" 
                              type={showNewPassword ? "text" : "password"} 
                              placeholder="Masukkan password baru" 
                              required 
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? "Mengubah..." : "Ubah Password"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
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
                    Kelola tim dalam organisasi Anda
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
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
                      const memberIds = Array.from(formData.getAll('members')) as string[];
                      createTeamMutation.mutate({
                        name: formData.get('name') as string,
                        description: formData.get('description') as string,
                        ownerId: formData.get('ownerId') as string,
                        memberIds,
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
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {users.map((user) => (
                              <div key={user.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`member-${user.id}`}
                                  name="members"
                                  value={user.id}
                                  className="rounded border-gray-300"
                                />
                                <label htmlFor={`member-${user.id}`} className="text-sm">
                                  {user.firstName} {user.lastName}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline">Batal</Button>
                          </DialogTrigger>
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
                <Input
                  placeholder="Cari tim..."
                  value={teamSearchTerm}
                  onChange={(e) => setTeamSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
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
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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

              {/* Edit Team Dialog */}
              {editingTeam && (
                <Dialog open={!!editingTeam} onOpenChange={() => setEditingTeam(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Tim</DialogTitle>
                      <DialogDescription>
                        Perbarui informasi tim {editingTeam.name}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const memberIds = Array.from(formData.getAll('members')) as string[];
                      updateTeamMutation.mutate({
                        id: editingTeam.id,
                        name: formData.get('name') as string,
                        description: formData.get('description') as string,
                        ownerId: formData.get('ownerId') as string,
                        memberIds,
                      });
                    }}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nama Tim</Label>
                          <Input 
                            name="name" 
                            defaultValue={editingTeam.name} 
                            placeholder="Nama tim" 
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Deskripsi</Label>
                          <Input 
                            name="description" 
                            defaultValue={editingTeam.description || ''} 
                            placeholder="Deskripsi tim" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="ownerId">Pimpinan Tim</Label>
                          <Select name="ownerId" defaultValue={editingTeam.ownerId} required>
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
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {users.map((user) => {
                              const isCurrentMember = teamMembers.some(tm => tm.userId === user.id);
                              return (
                                <div key={user.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`edit-member-${user.id}`}
                                    name="members"
                                    value={user.id}
                                    defaultChecked={isCurrentMember}
                                    className="rounded border-gray-300"
                                  />
                                  <label htmlFor={`edit-member-${user.id}`} className="text-sm">
                                    {user.firstName} {user.lastName}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setEditingTeam(null)}
                          >
                            Batal
                          </Button>
                          <Button type="submit" disabled={updateTeamMutation.isPending}>
                            {updateTeamMutation.isPending ? "Memperbarui..." : "Perbarui Tim"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
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