import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Team, User, TeamMember } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Edit, Trash2, MoreHorizontal, UserPlus, Shield, User as UserIcon, UserX } from "lucide-react";

export default function TeamsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<Array<TeamMember & { user: User }>>({
    queryKey: ["/api/teams", selectedTeam?.id, "members"],
    enabled: !!selectedTeam,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: { name: string; description?: string; ownerId: string }) => {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamData),
      });
      if (!response.ok) throw new Error('Failed to create team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setCreateDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Team berhasil dibuat",
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

  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; description?: string; ownerId: string }) => {
      const response = await fetch(`/api/teams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setEditingTeam(null);
      toast({
        title: "Berhasil",
        description: "Team berhasil diupdate",
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
      setDeleteTeamId(null);
      toast({
        title: "Berhasil",
        description: "Team berhasil dihapus",
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

  const addTeamMemberMutation = useMutation({
    mutationFn: async (data: { teamId: string; userId: string; role: string }) => {
      const response = await fetch(`/api/teams/${data.teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.userId, role: data.role }),
      });
      if (!response.ok) throw new Error('Failed to add team member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam?.id, "members"] });
      setAddMemberDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Member berhasil ditambahkan",
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

  const removeTeamMemberMutation = useMutation({
    mutationFn: async (data: { teamId: string; userId: string }) => {
      const response = await fetch(`/api/teams/${data.teamId}/members/${data.userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to remove team member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam?.id, "members"] });
      toast({
        title: "Berhasil",
        description: "Member berhasil dihapus",
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

  const updateMemberRoleMutation = useMutation({
    mutationFn: async (data: { teamId: string; userId: string; role: string }) => {
      const response = await fetch(`/api/teams/${data.teamId}/members/${data.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: data.role }),
      });
      if (!response.ok) throw new Error('Failed to update member role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam?.id, "members"] });
      toast({
        title: "Berhasil",
        description: "Role member berhasil diupdate",
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

  const getRoleBadge = (role: string) => {
    const roleStyles = {
      admin: "bg-red-100 text-red-800",
      manager: "bg-blue-100 text-blue-800",
      member: "bg-green-100 text-green-800",
    };
    return roleStyles[role as keyof typeof roleStyles] || "bg-gray-100 text-gray-800";
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return Shield;
      case "manager": return UserPlus;
      case "member": return UserIcon;
      default: return UserIcon;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-gray-600 mt-1">Kelola team dan anggota dalam organisasi</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Buat Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Team Baru</DialogTitle>
              <DialogDescription>
                Buat team baru dan tentukan pemiliknya
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createTeamMutation.mutate({
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                ownerId: formData.get('ownerId') as string,
              });
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Team</Label>
                  <Input name="name" placeholder="Masukkan nama team" required />
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Input name="description" placeholder="Masukkan deskripsi team" />
                </div>
                <div>
                  <Label htmlFor="ownerId">Pemilik Team</Label>
                  <Select name="ownerId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pemilik team" />
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
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={createTeamMutation.isPending}
                >
                  {createTeamMutation.isPending ? "Membuat..." : "Buat Team"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {teamsLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading teams...</div>
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada team</h3>
            <p className="text-gray-600 mb-4">Mulai dengan membuat team pertama Anda</p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Team Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription className="mt-1">{team.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedTeam(team);
                        setMembersDialogOpen(true);
                      }}>
                        <Users className="h-4 w-4 mr-2" />
                        Kelola Anggota
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingTeam(team)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Team
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => setDeleteTeamId(team.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus Team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Team ID: {team.id.slice(0, 8)}...</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Team Dialog */}
      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update informasi team
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!editingTeam) return;
            const formData = new FormData(e.currentTarget);
            updateTeamMutation.mutate({
              id: editingTeam.id,
              name: formData.get('name') as string,
              description: formData.get('description') as string,
              ownerId: formData.get('ownerId') as string,
            });
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Team</Label>
                <Input 
                  name="name" 
                  defaultValue={editingTeam?.name} 
                  placeholder="Masukkan nama team" 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Input 
                  name="description" 
                  defaultValue={editingTeam?.description || ''} 
                  placeholder="Masukkan deskripsi team" 
                />
              </div>
              <div>
                <Label htmlFor="ownerId">Pemilik Team</Label>
                <Select name="ownerId" defaultValue={editingTeam?.ownerId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pemilik team" />
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
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={updateTeamMutation.isPending}
              >
                {updateTeamMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Team Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Anggota Team - {selectedTeam?.name}</DialogTitle>
            <DialogDescription>
              Kelola anggota dan role dalam team ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setAddMemberDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah Anggota
              </Button>
            </div>
            {membersLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Belum ada anggota dalam team ini
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => {
                    const Icon = getRoleIcon(member.role);
                    return (
                      <TableRow key={member.userId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {member.user?.firstName?.charAt(0) || 'U'}{member.user?.lastName?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <span>{member.user?.firstName || 'Unknown'} {member.user?.lastName || 'User'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{member.user?.email || 'No email'}</TableCell>
                        <TableCell>
                          <Select
                            value={member.role}
                            onValueChange={(value) => {
                              updateMemberRoleMutation.mutate({
                                teamId: selectedTeam!.id,
                                userId: member.userId,
                                role: value,
                              });
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              removeTeamMemberMutation.mutate({
                                teamId: selectedTeam!.id,
                                userId: member.userId,
                              });
                            }}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Anggota Team</DialogTitle>
            <DialogDescription>
              Pilih user untuk ditambahkan ke team
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!selectedTeam) return;
            const formData = new FormData(e.currentTarget);
            addTeamMemberMutation.mutate({
              teamId: selectedTeam.id,
              userId: formData.get('userId') as string,
              role: formData.get('role') as string,
            });
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="userId">User</Label>
                <Select name="userId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(user => !teamMembers.some(m => m.userId === user.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="member" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={addTeamMemberMutation.isPending}
              >
                {addTeamMemberMutation.isPending ? "Menambahkan..." : "Tambah Anggota"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation */}
      <AlertDialog open={!!deleteTeamId} onOpenChange={(open) => !open && setDeleteTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Team</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus team ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTeamId) {
                  deleteTeamMutation.mutate(deleteTeamId);
                }
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}