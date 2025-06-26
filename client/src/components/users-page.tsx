import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Team, TeamMember } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Edit, Trash2, UserPlus, Shield, User as UserIcon, Search } from "lucide-react";
import Sidebar from "./sidebar";
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
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { id: string; email: string; firstName: string; lastName: string; role: string }) => {
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
    mutationFn: async (data: { name: string; description: string; ownerId: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "Team created successfully",
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

  if (usersLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
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
                    <Button>
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
                      createUserMutation.mutate({
                        id: Math.random().toString(36).substr(2, 9),
                        email: formData.get('email') as string,
                        firstName: formData.get('firstName') as string,
                        lastName: formData.get('lastName') as string,
                        role: formData.get('role') as string,
                      });
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
                          className="w-full"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUsers.map((user: User) => {
                    const RoleIcon = getRoleIcon(user.role);
                    return (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {user.firstName} {user.lastName}
                            </CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={`${getRoleBadge(user.role)} flex items-center gap-1`}>
                            <RoleIcon className="h-3 w-3" />
                            {user.role}
                          </Badge>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingUser(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit User</DialogTitle>
                                  <DialogDescription>
                                    Update user information for {user.firstName} {user.lastName}
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.currentTarget);
                                  updateUserMutation.mutate({
                                    id: user.id,
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
                                        defaultValue={user.email || ''} 
                                        required 
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="firstName">First Name</Label>
                                      <Input 
                                        name="firstName" 
                                        defaultValue={user.firstName || ''} 
                                        required 
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="lastName">Last Name</Label>
                                      <Input 
                                        name="lastName" 
                                        defaultValue={user.lastName || ''} 
                                        required 
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="role">Role</Label>
                                      <Select name="role" defaultValue={user.role} required>
                                        <SelectTrigger>
                                          <SelectValue />
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
                                      className="w-full"
                                      disabled={updateUserMutation.isPending}
                                    >
                                      {updateUserMutation.isPending ? "Updating..." : "Update User"}
                                    </Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(user.createdAt || '').toLocaleDateString()}
                        </div>
                        
                        {/* View User Details */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full mt-2">
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>User Details</DialogTitle>
                              <DialogDescription>
                                Complete information for {user.firstName} {user.lastName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={user.profileImageUrl || undefined} />
                                  <AvatarFallback className="text-lg">
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-lg font-semibold">{user.firstName} {user.lastName}</h3>
                                  <p className="text-gray-600">{user.email}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Role:</strong>
                                  <Badge className={`ml-2 ${getRoleBadge(user.role)}`}>
                                    {user.role}
                                  </Badge>
                                </div>
                                <div>
                                  <strong>User ID:</strong>
                                  <span className="ml-2 font-mono text-xs">{user.id}</span>
                                </div>
                                <div>
                                  <strong>Joined:</strong>
                                  <span className="ml-2">{new Date(user.createdAt || '').toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <strong>Last Updated:</strong>
                                  <span className="ml-2">{new Date(user.updatedAt || '').toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="teams" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Teams</h2>
                <Dialog open={newTeamDialog.open} onOpenChange={(open) => setNewTeamDialog({ open })}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Team</DialogTitle>
                      <DialogDescription>
                        Create a new team and assign an owner
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
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={createTeamMutation.isPending}
                        >
                          {createTeamMutation.isPending ? "Creating..." : "Create Team"}
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
                <div className="text-center py-8">
                  <div className="text-gray-500">No teams found</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.map((team: Team) => (
                    <Card key={team.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {team.name}
                        </CardTitle>
                        <CardDescription>{team.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-500">
                          Created {new Date(team.createdAt || '').toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}