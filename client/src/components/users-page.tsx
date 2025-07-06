import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Team, TeamMember } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Plus, Edit, Trash2, UserPlus, Shield, User as UserIcon, Search, UserCheck, UserX, MoreHorizontal, MoreVertical, Eye, EyeOff, Key } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

type UserWithTeams = User & {
  teams?: (TeamMember & { team: Team })[];
};

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newTeamDialog, setNewTeamDialog] = useState<{ open: boolean; user?: User }>({ open: false });
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingPassword, setEditingPassword] = useState<User | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembersDialog, setTeamMembersDialog] = useState(false);
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [editTeamDialog, setEditTeamDialog] = useState(false);
  const [createTeamDialog, setCreateTeamDialog] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [editFormMembers, setEditFormMembers] = useState<string[]>([]);

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Get current user to check admin status
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

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
        title: "Success",
        description: "User created successfully",
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
    mutationFn: async (data: { id: string; email?: string; firstName?: string; lastName?: string; role?: string }) => {
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
      toast({
        title: "Success",
        description: "User updated successfully",
        variant: "success",
      });
      setEditingUser(null);
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
        title: "Success",
        description: "User deleted successfully",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
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
        title: "Success",
        description: "Password changed successfully",
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

  // Filter users based on search term and role
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; ownerId: string; members: string[] }) => {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, description: data.description, ownerId: data.ownerId }),
      });
      if (!response.ok) throw new Error('Failed to create team');
      const team = await response.json();
      
      // Add members to the team
      if (data.members.length > 0) {
        await Promise.all(data.members.map(userId => 
          fetch(`/api/teams/${team.id}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, role: "member" }),
          })
        ));
      }
      
      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      setSelectedMembers([]);
      toast({
        title: "Success",
        description: "Team created successfully",
        variant: "success",
      });
      setNewTeamDialog({ open: false });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    },
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async (data: { teamId: string; name: string; description: string; ownerId: string; members: string[] }) => {
      const response = await fetch(`/api/teams/${data.teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, description: data.description, ownerId: data.ownerId }),
      });
      if (!response.ok) throw new Error('Failed to update team');
      
      // Update team members by removing all current members and adding new ones
      const currentMembers = allTeamMembers.filter(member => member.teamId === data.teamId);
      
      // Remove current members
      await Promise.all(currentMembers.map(member =>
        fetch(`/api/teams/${data.teamId}/members/${member.userId}`, {
          method: "DELETE",
        })
      ));
      
      // Add new members
      if (data.members.length > 0) {
        await Promise.all(data.members.map(userId =>
          fetch(`/api/teams/${data.teamId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, role: "member" }),
          })
        ));
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      setEditTeamDialog(false);
      setSelectedTeam(null);
      toast({
        title: "Success",
        description: "Team updated successfully",
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

  // Delete team mutation
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
      setTeamToDelete(null);
      toast({
        title: "Success",
        description: "Team deleted successfully",
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

  // Add team member mutation
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
      setAddMemberDialog(false);
      toast({
        title: "Success",
        description: "Team member added successfully",
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

  // Remove team member mutation
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
        title: "Success",
        description: "Team member removed successfully",
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

  // Update team member role mutation
  const updateTeamMemberRoleMutation = useMutation({
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
        title: "Success",
        description: "Member role updated successfully",
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

  if (usersLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users and their permissions</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Users ({filteredUsers.length})</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account
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
                      <Input name="email" type="email" placeholder="Enter email" required />
                    </div>
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input name="firstName" placeholder="Enter first name" required />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input name="lastName" placeholder="Enter last name" required />
                    </div>
                    <div>
                      <Label htmlFor="password">Default Password</Label>
                      <div className="relative">
                        <Input 
                          name="password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter default password" 
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
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? "Creating..." : "Create User"}
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
                placeholder="Search users by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {usersLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading users...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No users found</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => {
                    const RoleIcon = getRoleIcon(user.role);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profileImageUrl || undefined} />
                              <AvatarFallback className="text-sm">
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
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Ubah pengguna
                              </DropdownMenuItem>
                              {currentUser?.role === 'admin' && (
                                <DropdownMenuItem onClick={() => setEditingPassword(user)}>
                                  <Key className="mr-2 h-4 w-4" />
                                  Ubah Password
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus pengguna
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the user 
                                      "{user.firstName} {user.lastName}" and remove all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUserMutation.mutate(user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
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

          {/* Change Password Dialog */}
          {editingPassword && (
            <Dialog open={!!editingPassword} onOpenChange={() => {
              setEditingPassword(null);
              setShowNewPassword(false);
            }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Set a new password for {editingPassword.firstName} {editingPassword.lastName}
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
                      <Label htmlFor="password">New Password</Label>
                      <div className="relative">
                        <Input 
                          name="password" 
                          type={showNewPassword ? "text" : "password"} 
                          placeholder="Enter new password" 
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
                      className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* Edit User Dialog */}
          {editingUser && (
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user information for {editingUser.firstName} {editingUser.lastName}
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
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            name="firstName" 
                            defaultValue={editingUser.firstName || ''} 
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
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
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                          disabled={updateUserMutation.isPending}
                        >
                          {updateUserMutation.isPending ? "Updating..." : "Update User"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </TabsContent>

            <TabsContent value="teams" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Teams ({teams.length})</h2>
                <Dialog open={newTeamDialog.open} onOpenChange={(open) => setNewTeamDialog({ open })}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Team</DialogTitle>
                      <DialogDescription>
                        Create a new team and assign members
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      createTeamMutation.mutate({
                        name: formData.get('name') as string,
                        description: formData.get('description') as string,
                        ownerId: formData.get('ownerId') as string,
                        members: selectedMembers,
                      });
                    }}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Team Name</Label>
                          <Input name="name" placeholder="Enter team name" required />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Input name="description" placeholder="Enter team description" />
                        </div>
                        <div>
                          <Label htmlFor="ownerId">Team Owner</Label>
                          <Select name="ownerId" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team owner" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user: User) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="members">Team Members</Label>
                          <div className="space-y-2">
                            <div className="max-h-40 overflow-y-auto border rounded p-2">
                              {users.map((user: User) => (
                                <label key={user.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedMembers.includes(user.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedMembers([...selectedMembers, user.id]);
                                      } else {
                                        setSelectedMembers(selectedMembers.filter(id => id !== user.id));
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-gray-600 text-white text-xs">
                                      {user.firstName?.[0]}{user.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{user.firstName} {user.lastName}</span>
                                </label>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">Selected: {selectedMembers.length} members</p>
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                          disabled={createTeamMutation.isPending}
                        >
                          {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Edit Team Dialog */}
              <Dialog open={editTeamDialog} onOpenChange={setEditTeamDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Team</DialogTitle>
                    <DialogDescription>
                      Update team information and manage members
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    if (selectedTeam) {
                      updateTeamMutation.mutate({
                        teamId: selectedTeam.id,
                        name: formData.get('name') as string,
                        description: formData.get('description') as string,
                        ownerId: formData.get('ownerId') as string,
                        members: editFormMembers,
                      });
                    }
                  }}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Team Name</Label>
                        <Input name="name" defaultValue={selectedTeam?.name} placeholder="Enter team name" required />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input name="description" defaultValue={selectedTeam?.description || ""} placeholder="Enter team description" />
                      </div>
                      <div>
                        <Label htmlFor="ownerId">Team Owner</Label>
                        <Select name="ownerId" defaultValue={selectedTeam?.ownerId} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team owner" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user: User) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="members">Team Members</Label>
                        <div className="space-y-2">
                          <div className="max-h-40 overflow-y-auto border rounded p-2">
                            {users.map((user: User) => (
                              <label key={user.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  checked={editFormMembers.includes(user.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditFormMembers([...editFormMembers, user.id]);
                                    } else {
                                      setEditFormMembers(editFormMembers.filter(id => id !== user.id));
                                    }
                                  }}
                                  className="rounded"
                                />
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-gray-600 text-white text-xs">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{user.firstName} {user.lastName}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">Selected: {editFormMembers.length} members</p>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                        disabled={updateTeamMutation.isPending}
                      >
                        {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Delete Team Confirmation */}
              <AlertDialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the team "{teamToDelete?.name}" and remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => teamToDelete && deleteTeamMutation.mutate(teamToDelete.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Team
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {teamsLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading teams...</div>
                </div>
              ) : teams.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No teams found</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.map((team: Team) => (
                    <Card key={team.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{team.name}</CardTitle>
                            <CardDescription>{team.description}</CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedTeam(team);
                                  // Get current team members
                                  const currentMembers = allTeamMembers
                                    .filter(member => member.teamId === team.id)
                                    .map(member => member.userId);
                                  setEditFormMembers(currentMembers);
                                  setEditTeamDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Team
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setTeamToDelete(team)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Owner Information */}
                          <div>
                            {(() => {
                              const owner = users.find(user => user.id === team.ownerId);
                              return (
                                <>
                                  <p className="text-sm font-medium text-gray-600 mb-2">Owner</p>
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={owner?.profileImageUrl || undefined} />
                                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                                        {owner?.firstName?.[0]}{owner?.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {owner?.firstName} {owner?.lastName}
                                      </p>
                                      <p className="text-xs text-gray-500">{owner?.email}</p>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          
                          {/* Team Members */}
                          <div>
                            {(() => {
                              const currentTeamMembers = allTeamMembers.filter(member => member.teamId === team.id);
                              return (
                                <>
                                  <p className="text-sm font-medium text-gray-600 mb-2">Members ({currentTeamMembers.length || 0})</p>
                                  <div className="flex -space-x-2 overflow-hidden">
                                    {currentTeamMembers.slice(0, 5).map((member) => (
                                      <Avatar key={member.id} className="h-8 w-8 border-2 border-white">
                                        <AvatarImage src={member.user?.profileImageUrl || undefined} />
                                        <AvatarFallback className="bg-gray-600 text-white text-xs">
                                          {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                    {currentTeamMembers.length > 5 && (
                                      <div className="h-8 w-8 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center">
                                        <span className="text-xs text-gray-600">+{currentTeamMembers.length - 5}</span>
                                      </div>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          
                          
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
    </div>
  );
}