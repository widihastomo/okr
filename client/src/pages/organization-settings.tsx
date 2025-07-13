import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Team, TeamMember } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Users, CreditCard, Building2, Loader2, Plus, Edit, Trash2, UserPlus, Shield, User as UserIcon, Search, UserCheck, UserX, MoreHorizontal, MoreVertical, Eye, EyeOff, Key, Bell, Clock, Calendar, AlertCircle, CheckCircle2, FileText, Download, XCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PlanChangeWizard from "@/components/plan-change-wizard";


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

  // Role management states
  const [roles, setRoles] = useState([
    { 
      id: "1", 
      name: "owner", 
      description: "Full access to all features", 
      permissions: ["manage_users", "invite_users", "view_users", "deactivate_users", "create_objectives", "edit_objectives", "delete_objectives", "view_objectives", "create_initiatives", "edit_initiatives", "delete_initiatives", "view_initiatives", "view_analytics", "export_data", "manage_organization", "manage_billing", "system_admin", "audit_logs"]
    },
    { 
      id: "2", 
      name: "administrator", 
      description: "Can manage team and projects", 
      permissions: ["manage_users", "invite_users", "view_users", "create_objectives", "edit_objectives", "delete_objectives", "view_objectives", "create_initiatives", "edit_initiatives", "delete_initiatives", "view_initiatives", "view_analytics", "export_data", "manage_billing"]
    },
    { 
      id: "3", 
      name: "member", 
      description: "Basic access to projects", 
      permissions: ["view_users", "create_objectives", "edit_objectives", "delete_objectives", "view_objectives", "create_initiatives", "edit_initiatives", "delete_initiatives", "view_initiatives", "view_analytics", "export_data"]
    },
    { 
      id: "4", 
      name: "viewer", 
      description: "Read-only access", 
      permissions: ["view_users", "view_objectives", "view_initiatives", "view_analytics"]
    }
  ]);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [selectedRoleForDetails, setSelectedRoleForDetails] = useState<any>(null);
  const [isResettingData, setIsResettingData] = useState(false);

  // Notification/Reminder settings states
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState('17:00');
  const [reminderSettings, setReminderSettings] = useState({
    isEnabled: true,
    cadence: 'harian',
    reminderTime: '17:00',
    reminderDay: 'senin',
    reminderDate: '1',
    enableEmailReminders: true,
    enableNotifications: true,
    autoUpdateTasks: false,
    reminderMessage: 'Saatnya update progress harian Anda!',
    activeDays: ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'], // Default: aktif semua hari kecuali minggu
    notificationTypes: {
      updateOverdue: true,
      taskOverdue: true,
      initiativeOverdue: true,
      chatMention: true,
    }
  });

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

  // Fetch reminder settings
  const { data: apiReminderSettings } = useQuery({
    queryKey: ["/api/reminder-settings"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Initialize reminder settings from API
  useEffect(() => {
    if (apiReminderSettings) {
      const updatedSettings = {
        ...apiReminderSettings,
        activeDays: apiReminderSettings.activeDays || ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'], // Default: semua kecuali minggu
        notificationTypes: {
          updateOverdue: true,
          taskOverdue: true,
          initiativeOverdue: true,
          chatMention: true,
          ...apiReminderSettings.notificationTypes
        }
      };
      
      setReminderSettings(updatedSettings);
      
      // Check if custom time is being used
      const timeOptions = ['08:00', '09:00', '12:00', '15:00', '17:00', '19:00'];
      const isPresetTime = timeOptions.includes(apiReminderSettings.reminderTime);
      if (!isPresetTime && apiReminderSettings.reminderTime) {
        setUseCustomTime(true);
        setCustomTime(apiReminderSettings.reminderTime);
      } else {
        setUseCustomTime(false);
      }
    }
  }, [apiReminderSettings]);

  // Update time settings when reminderSettings.reminderTime changes
  useEffect(() => {
    if (reminderSettings.reminderTime) {
      const timeOptions = ['08:00', '09:00', '12:00', '15:00', '17:00', '19:00'];
      const isPresetTime = timeOptions.includes(reminderSettings.reminderTime);
      if (!isPresetTime) {
        setUseCustomTime(true);
        setCustomTime(reminderSettings.reminderTime);
      } else {
        setUseCustomTime(false);
      }
    }
  }, [reminderSettings.reminderTime]);

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

  // Role styling functions
  const getRoleBadge = (role: string) => {
    const roleStyles = {
      owner: "bg-red-100 text-red-800",
      administrator: "bg-blue-100 text-blue-800",
      member: "bg-green-100 text-green-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return roleStyles[role as keyof typeof roleStyles] || "bg-gray-100 text-gray-800";
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner": return Shield;
      case "administrator": return UserPlus;
      case "member": return UserIcon;
      case "viewer": return Eye;
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
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({
        title: "Berhasil",
        description: "Tim berhasil dihapus",
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

  // Data reset mutation
  const resetDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error('Failed to reset data');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/key-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      setIsResettingData(false);
      toast({
        title: "Data Berhasil Direset",
        description: "Semua objective, key result, initiative, task, dan siklus telah dihapus.",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error) => {
      setIsResettingData(false);
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

  // Role management mutations
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      const newRole = {
        id: Date.now().toString(),
        ...roleData
      };
      setRoles(prev => [...prev, newRole]);
      return newRole;
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Role baru telah dibuat"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...roleData }: any) => {
      setRoles(prev => prev.map(role => 
        role.id === id ? { ...role, ...roleData } : role
      ));
      return { id, ...roleData };
    },
    onSuccess: () => {
      setEditingRole(null);
      toast({
        title: "Berhasil",
        description: "Role telah diperbarui"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      setRoles(prev => prev.filter(role => role.id !== roleId));
      return roleId;
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Role telah dihapus"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter roles based on search
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(roleSearchTerm.toLowerCase())
  );

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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Pengaturan Organisasi</h1>
        <p className="text-sm sm:text-base text-gray-600">Kelola pengaturan dan informasi organisasi Anda</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6" onValueChange={(value) => {
        // Reset notification settings when switching to notifications tab
        if (value === 'notifications' && apiReminderSettings) {
          const updatedSettings = {
            ...apiReminderSettings,
            activeDays: apiReminderSettings.activeDays || ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'], // Default: semua kecuali minggu
            notificationTypes: {
              updateOverdue: true,
              taskOverdue: true,
              initiativeOverdue: true,
              chatMention: true,
              ...apiReminderSettings.notificationTypes
            }
          };
          
          setReminderSettings(updatedSettings);
          
          // Check if custom time is being used and update accordingly
          const timeOptions = ['08:00', '09:00', '12:00', '15:00', '17:00', '19:00'];
          const isPresetTime = timeOptions.includes(apiReminderSettings.reminderTime);
          if (!isPresetTime && apiReminderSettings.reminderTime) {
            setUseCustomTime(true);
            setCustomTime(apiReminderSettings.reminderTime);
          } else {
            setUseCustomTime(false);
          }
        }
      }}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 max-w-5xl gap-1 h-auto">
          <TabsTrigger value="general" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Building2 className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Umum</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Langganan</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Users className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Anggota</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Users className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Tim</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Shield className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Bell className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Notifikasi</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
            <Settings className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Lanjutan</span>
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
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
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
                }} className="w-full sm:w-auto">
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          {/* Current Subscription Info */}
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
                    <PlanChangeWizard 
                      currentPlan={subscription.plan}
                      onPlanChanged={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/my-organization-with-role"] });
                      }}
                    />
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Batalkan Langganan
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Management Section */}
          <InvoiceManagementSection />
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
                    <Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
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
                              <SelectItem value="administrator">Administrator</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
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
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
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
                              <SelectItem value="administrator">Administrator</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
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
                          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
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

        {/* Roles Tab */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Sistem Roles & Permissions</CardTitle>
              <CardDescription>
                Tampilan informasi roles dan hak akses yang tersedia dalam organisasi ({filteredRoles.length} roles)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Controls */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari role berdasarkan nama atau deskripsi..."
                    value={roleSearchTerm}
                    onChange={(e) => setRoleSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Roles Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Role</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Hak Akses Utama</TableHead>
                      <TableHead className="text-right">Level Akses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.map((role) => {
                      const getPermissionLabels = (permissions: string[]) => {
                        const permissionMap: { [key: string]: string } = {
                          'read': 'Baca',
                          'write': 'Tulis',
                          'delete': 'Hapus',
                          'admin': 'Admin',
                          'manage_team': 'Kelola Tim',
                          'manage_users': 'Kelola User',
                          'manage_organization': 'Kelola Organisasi',
                          'manage_billing': 'Kelola Tagihan',
                          'view_analytics': 'Lihat Analitik',
                          'system_admin': 'Admin Sistem'
                        };
                        return permissions.map(p => permissionMap[p] || p.replace('_', ' '));
                      };

                      const getAccessLevel = (permissions: string[]) => {
                        const count = permissions.length;
                        if (count >= 8) return { label: 'Penuh', color: 'bg-red-100 text-red-800' };
                        if (count >= 6) return { label: 'Tinggi', color: 'bg-orange-100 text-orange-800' };
                        if (count >= 3) return { label: 'Sedang', color: 'bg-yellow-100 text-yellow-800' };
                        return { label: 'Terbatas', color: 'bg-gray-100 text-gray-800' };
                      };

                      const permissionLabels = getPermissionLabels(role.permissions);
                      const accessLevel = getAccessLevel(role.permissions);

                      return (
                        <TableRow key={role.id}>
                          <TableCell>
                            <div className="font-medium text-gray-900">{role.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">{role.description}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {permissionLabels.slice(0, 3).map((permission, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {permission}
                                </Badge>
                              ))}
                              {permissionLabels.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{permissionLabels.length - 3} lainnya
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Badge className={`text-xs ${accessLevel.color}`}>
                                {accessLevel.label}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                ({role.permissions.length} hak akses)
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRoleForDetails(role)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Role Details Modal */}
              {selectedRoleForDetails && (
                <Dialog open={!!selectedRoleForDetails} onOpenChange={() => setSelectedRoleForDetails(null)}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Detail Akses Role: {selectedRoleForDetails.name}
                      </DialogTitle>
                      <DialogDescription>
                        Informasi lengkap tentang hak akses dan permission untuk role ini
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Role Summary */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">Ringkasan Role</h3>
                          <Badge className={`text-xs ${(() => {
                            const count = selectedRoleForDetails.permissions.length;
                            if (count >= 8) return 'bg-red-100 text-red-800';
                            if (count >= 6) return 'bg-orange-100 text-orange-800';
                            if (count >= 3) return 'bg-yellow-100 text-yellow-800';
                            return 'bg-gray-100 text-gray-800';
                          })()}`}>
                            {(() => {
                              const count = selectedRoleForDetails.permissions.length;
                              if (count >= 8) return 'Penuh';
                              if (count >= 6) return 'Tinggi';
                              if (count >= 3) return 'Sedang';
                              return 'Terbatas';
                            })()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{selectedRoleForDetails.description}</p>
                        <p className="text-sm text-gray-500">
                          Total {selectedRoleForDetails.permissions.length} hak akses
                        </p>
                      </div>

                      {/* All Permissions */}
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-900">Semua Hak Akses</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(() => {
                            const permissionMap: { [key: string]: { label: string; description: string; category: string } } = {
                              'manage_users': { label: 'Kelola User', description: 'Menambah, mengedit, dan menghapus user', category: 'User Management' },
                              'invite_users': { label: 'Undang User', description: 'Mengundang user baru ke organisasi', category: 'User Management' },
                              'view_users': { label: 'Lihat User', description: 'Melihat daftar dan detail user', category: 'User Management' },
                              'deactivate_users': { label: 'Nonaktifkan User', description: 'Menonaktifkan akun user', category: 'User Management' },
                              'create_objectives': { label: 'Buat Objective', description: 'Membuat objective baru', category: 'OKR Management' },
                              'edit_objectives': { label: 'Edit Objective', description: 'Mengedit objective yang ada', category: 'OKR Management' },
                              'delete_objectives': { label: 'Hapus Objective', description: 'Menghapus objective', category: 'OKR Management' },
                              'view_objectives': { label: 'Lihat Objective', description: 'Melihat daftar dan detail objective', category: 'OKR Management' },
                              'create_initiatives': { label: 'Buat Inisiatif', description: 'Membuat inisiatif baru', category: 'OKR Management' },
                              'edit_initiatives': { label: 'Edit Inisiatif', description: 'Mengedit inisiatif yang ada', category: 'OKR Management' },
                              'delete_initiatives': { label: 'Hapus Inisiatif', description: 'Menghapus inisiatif', category: 'OKR Management' },
                              'view_initiatives': { label: 'Lihat Inisiatif', description: 'Melihat daftar dan detail inisiatif', category: 'OKR Management' },
                              'view_analytics': { label: 'Lihat Analitik', description: 'Mengakses dashboard analitik', category: 'Analytics' },
                              'export_data': { label: 'Export Data', description: 'Mengekspor data ke file', category: 'Analytics' },
                              'manage_organization': { label: 'Kelola Organisasi', description: 'Mengelola pengaturan organisasi', category: 'Organization' },
                              'manage_billing': { label: 'Kelola Tagihan', description: 'Mengelola billing dan subscription', category: 'Organization' },
                              'system_admin': { label: 'Admin Sistem', description: 'Akses penuh ke sistem administrasi', category: 'System' },
                              'audit_logs': { label: 'Log Audit', description: 'Melihat log aktivitas sistem', category: 'System' }
                            };
                            
                            return selectedRoleForDetails.permissions.map((permission: string) => {
                              const perm = permissionMap[permission] || { 
                                label: permission.replace('_', ' '), 
                                description: `Akses untuk ${permission.replace('_', ' ')}`,
                                category: 'Other'
                              };
                              return (
                                <div key={permission} className="flex items-start space-x-3 p-3 border rounded-lg">
                                  <div className="flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-900">{perm.label}</p>
                                      <Badge variant="outline" className="text-xs">
                                        {perm.category}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{perm.description}</p>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedRoleForDetails(null)}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        Tutup
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" key={`notifications-${apiReminderSettings?.reminderTime || 'default'}`}>
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi & Reminder</CardTitle>
              <CardDescription>
                Kelola notifikasi dan reminder untuk semua anggota organisasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reminder Enable/Disable */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    Aktifkan Reminder
                  </Label>
                  <p className="text-sm text-gray-600">
                    Mengaktifkan sistem reminder untuk semua anggota
                  </p>
                </div>
                <Switch
                  checked={reminderSettings.isEnabled}
                  onCheckedChange={(checked) =>
                    setReminderSettings({ ...reminderSettings, isEnabled: checked })
                  }
                />
              </div>

              {/* Reminder Frequency */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Frekuensi Reminder
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Button
                    variant={reminderSettings.cadence === 'harian' ? 'default' : 'outline'}
                    onClick={() => setReminderSettings({ ...reminderSettings, cadence: 'harian' })}
                    className={reminderSettings.cadence === 'harian' 
                      ? "justify-start bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                      : "justify-start border-orange-300 text-orange-700 hover:bg-orange-50"
                    }
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Harian
                  </Button>
                  <Button
                    variant={reminderSettings.cadence === 'mingguan' ? 'default' : 'outline'}
                    onClick={() => setReminderSettings({ ...reminderSettings, cadence: 'mingguan' })}
                    className={reminderSettings.cadence === 'mingguan' 
                      ? "justify-start bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                      : "justify-start border-orange-300 text-orange-700 hover:bg-orange-50"
                    }
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Mingguan
                  </Button>
                  <Button
                    variant={reminderSettings.cadence === 'bulanan' ? 'default' : 'outline'}
                    onClick={() => setReminderSettings({ ...reminderSettings, cadence: 'bulanan' })}
                    className={reminderSettings.cadence === 'bulanan' 
                      ? "justify-start bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                      : "justify-start border-orange-300 text-orange-700 hover:bg-orange-50"
                    }
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Bulanan
                  </Button>
                </div>
              </div>

              {/* Conditional inputs based on cadence */}
              {reminderSettings.cadence === 'harian' && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Hari Aktif
                  </Label>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Pilih hari-hari ketika reminder akan aktif
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {[
                        { key: 'senin', label: 'Sen' },
                        { key: 'selasa', label: 'Sel' },
                        { key: 'rabu', label: 'Rab' },
                        { key: 'kamis', label: 'Kam' },
                        { key: 'jumat', label: 'Jum' },
                        { key: 'sabtu', label: 'Sab' },
                        { key: 'minggu', label: 'Min' }
                      ].map((day) => (
                        <Button
                          key={day.key}
                          variant={reminderSettings.activeDays?.includes(day.key) ? 'default' : 'outline'}
                          onClick={() => {
                            const currentDays = reminderSettings.activeDays || [];
                            const updatedDays = currentDays.includes(day.key)
                              ? currentDays.filter(d => d !== day.key)
                              : [...currentDays, day.key];
                            setReminderSettings({ ...reminderSettings, activeDays: updatedDays });
                          }}
                          className={reminderSettings.activeDays?.includes(day.key)
                            ? "justify-center text-xs p-2 h-8 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                            : "justify-center text-xs p-2 h-8 border-orange-300 text-orange-700 hover:bg-orange-50"
                          }
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReminderSettings({ 
                          ...reminderSettings, 
                          activeDays: ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'] 
                        })}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        Semua Kecuali Minggu
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReminderSettings({ 
                          ...reminderSettings, 
                          activeDays: ['senin', 'selasa', 'rabu', 'kamis', 'jumat'] 
                        })}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        Hari Kerja
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReminderSettings({ 
                          ...reminderSettings, 
                          activeDays: ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'] 
                        })}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        Semua Hari
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {reminderSettings.cadence === 'mingguan' && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Pilih Hari
                  </Label>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Pilih hari dalam seminggu untuk reminder mingguan
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      {[
                        { key: '1', label: 'Senin' },
                        { key: '2', label: 'Selasa' },
                        { key: '3', label: 'Rabu' },
                        { key: '4', label: 'Kamis' },
                        { key: '5', label: 'Jumat' },
                        { key: '6', label: 'Sabtu' },
                        { key: '7', label: 'Minggu' }
                      ].map((day) => (
                        <Button
                          key={day.key}
                          variant={reminderSettings.reminderDay === day.key ? 'default' : 'outline'}
                          onClick={() => setReminderSettings({ ...reminderSettings, reminderDay: day.key })}
                          className={reminderSettings.reminderDay === day.key
                            ? "justify-center text-xs p-2 h-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                            : "justify-center text-xs p-2 h-auto border-orange-300 text-orange-700 hover:bg-orange-50"
                          }
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {reminderSettings.cadence === 'bulanan' && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Pilih Tanggal
                  </Label>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Pilih tanggal dalam bulan untuk reminder bulanan
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5, 10, 15, 20, 25, 28].map((date) => (
                        <Button
                          key={date}
                          variant={reminderSettings.reminderDate === date.toString() ? 'default' : 'outline'}
                          onClick={() => setReminderSettings({ ...reminderSettings, reminderDate: date.toString() })}
                          className={reminderSettings.reminderDate === date.toString()
                            ? "justify-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                            : "justify-center border-orange-300 text-orange-700 hover:bg-orange-50"
                          }
                        >
                          {date}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Tanggal Kustom:</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={reminderSettings.reminderDate || ''}
                        onChange={(e) => setReminderSettings({ ...reminderSettings, reminderDate: e.target.value })}
                        className="w-20"
                        placeholder="1-31"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Reminder Time */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Waktu Reminder
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!useCustomTime}
                      onCheckedChange={(checked) => setUseCustomTime(!checked)}
                    />
                    <Label className="text-sm font-medium">
                      Gunakan waktu preset
                    </Label>
                  </div>
                  
                  {!useCustomTime ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['08:00', '09:00', '12:00', '15:00', '17:00', '19:00'].map((time) => (
                        <Button
                          key={time}
                          variant={reminderSettings.reminderTime === time ? 'default' : 'outline'}
                          onClick={() => setReminderSettings({ ...reminderSettings, reminderTime: time })}
                          className={reminderSettings.reminderTime === time
                            ? "justify-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                            : "justify-center border-orange-300 text-orange-700 hover:bg-orange-50"
                          }
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm">
                        Waktu Kustom (Format: HH:MM)
                      </Label>
                      <Input
                        type="time"
                        value={customTime}
                        onChange={(e) => {
                          setCustomTime(e.target.value);
                          setReminderSettings({ ...reminderSettings, reminderTime: e.target.value });
                        }}
                        className="w-32"
                      />
                      <p className="text-xs text-gray-500">
                        Gunakan format 24 jam (contoh: 17:00)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Jenis Notifikasi
                </Label>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        Update Overdue
                      </Label>
                      <p className="text-sm text-gray-600">
                        Notifikasi ketika user belum melakukan daily update
                      </p>
                    </div>
                    <Switch
                      checked={reminderSettings.notificationTypes?.updateOverdue || false}
                      onCheckedChange={(checked) =>
                        setReminderSettings({
                          ...reminderSettings,
                          notificationTypes: {
                            ...reminderSettings.notificationTypes,
                            updateOverdue: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        Task Overdue
                      </Label>
                      <p className="text-sm text-gray-600">
                        Notifikasi ketika deadline task terlewat
                      </p>
                    </div>
                    <Switch
                      checked={reminderSettings.notificationTypes?.taskOverdue || false}
                      onCheckedChange={(checked) =>
                        setReminderSettings({
                          ...reminderSettings,
                          notificationTypes: {
                            ...reminderSettings.notificationTypes,
                            taskOverdue: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        Initiative Overdue
                      </Label>
                      <p className="text-sm text-gray-600">
                        Notifikasi ketika deadline inisiatif terlewat dan belum ditutup
                      </p>
                    </div>
                    <Switch
                      checked={reminderSettings.notificationTypes?.initiativeOverdue || false}
                      onCheckedChange={(checked) =>
                        setReminderSettings({
                          ...reminderSettings,
                          notificationTypes: {
                            ...reminderSettings.notificationTypes,
                            initiativeOverdue: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        Chat Mention
                      </Label>
                      <p className="text-sm text-gray-600">
                        Notifikasi ketika di-mention oleh user lain dalam chat
                      </p>
                    </div>
                    <Switch
                      checked={reminderSettings.notificationTypes?.chatMention || false}
                      onCheckedChange={(checked) =>
                        setReminderSettings({
                          ...reminderSettings,
                          notificationTypes: {
                            ...reminderSettings.notificationTypes,
                            chatMention: checked
                          }
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Email & In-App Notifications */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Channel Notifikasi
                </Label>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-gray-600">
                        Kirim notifikasi melalui email
                      </p>
                    </div>
                    <Switch
                      checked={reminderSettings.enableEmailReminders}
                      onCheckedChange={(checked) =>
                        setReminderSettings({ ...reminderSettings, enableEmailReminders: checked })
                      }
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">
                        In-App Notifications
                      </Label>
                      <p className="text-sm text-gray-600">
                        Tampilkan notifikasi dalam aplikasi
                      </p>
                    </div>
                    <Switch
                      checked={reminderSettings.enableNotifications}
                      onCheckedChange={(checked) =>
                        setReminderSettings({ ...reminderSettings, enableNotifications: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Reminder Message */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Pesan Reminder
                </Label>
                <Textarea
                  value={reminderSettings.reminderMessage}
                  onChange={(e) =>
                    setReminderSettings({ ...reminderSettings, reminderMessage: e.target.value })
                  }
                  placeholder="Masukkan pesan reminder yang akan dikirim..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Save Button */}
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await apiRequest('POST', '/api/reminder-settings/test');
                      toast({
                        title: "Test Reminder Berhasil!",
                        description: "Cek email dan notifikasi Anda.",
                        variant: "success"
                      });
                    } catch (error: any) {
                      toast({
                        title: "Test Gagal",
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  }}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 w-full sm:w-auto"
                >
                  Test Reminder
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await apiRequest('POST', '/api/reminder-settings', reminderSettings);
                      toast({
                        title: "Pengaturan Tersimpan!",
                        description: "Pengaturan reminder telah diperbarui.",
                        variant: "success"
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/reminder-settings'] });
                    } catch (error: any) {
                      toast({
                        title: "Gagal Menyimpan",
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  }}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white w-full sm:w-auto"
                >
                  Simpan Pengaturan
                </Button>
              </div>
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
              <div className="space-y-6">
                {/* Data Reset Section */}
                <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                  <h4 className="font-semibold text-orange-900 mb-2">Reset Data</h4>
                  <p className="text-sm text-orange-700 mb-4">
                    Hapus semua goal, angka target, initiative, task, dan siklus dari organisasi ini. 
                    Data anggota dan tim akan tetap tersimpan.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                        disabled={resetDataMutation.isPending}
                      >
                        {resetDataMutation.isPending ? "Mereset..." : "Reset Data"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Reset Data</AlertDialogTitle>
                        <AlertDialogDescription>
                          <div className="space-y-4">
                            <p>Apakah Anda yakin ingin mereset semua data Goal (Goal, Angka Target, Initiative, Task, dan Siklus)? 
                            Tindakan ini tidak dapat dibatalkan.</p>
                            
                            <div>
                              <strong>Data yang akan dihapus:</strong>
                              <ul className="list-disc ml-6 mt-2">
                                <li>Semua goal dan angka target</li>
                                <li>Semua initiative dan task</li>
                                <li>Semua siklus</li>
                              </ul>
                            </div>
                            
                            <div>
                              <strong>Data yang tetap tersimpan:</strong>
                              <ul className="list-disc ml-6 mt-2">
                                <li>Anggota dan tim</li>
                                <li>Pengaturan organisasi</li>
                                <li>Riwayat invoice</li>
                              </ul>
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            setIsResettingData(true);
                            resetDataMutation.mutate();
                          }}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Ya, Reset Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Danger Zone */}
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

// Invoice Management Section Component
function InvoiceManagementSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  interface InvoiceData {
    invoice: {
      id: string;
      invoiceNumber: string;
      amount: string;
      currency: string;
      status: string;
      issueDate: string;
      dueDate: string;
      paidDate: string | null;
      description: string | null;
    };
    organization: {
      id: string;
      name: string;
    };
    subscriptionPlan?: {
      id: string;
      name: string;
    };
    billingPeriod?: {
      id: string;
      periodType: string;
      periodMonths: number;
    };
  }

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });



  const payWithMidtransMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/pay`);
      return response.json();
    },
    onSuccess: (data) => {
      window.open(data.redirectUrl, '_blank');
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Pembayaran Dimulai",
        description: "Anda akan diarahkan ke halaman pembayaran Midtrans",
        variant: "success"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Pembayaran",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices.filter((item: InvoiceData) => {
    const matchesSearch = 
      item.invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.invoice.description && item.invoice.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || item.invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handlePayWithMidtrans = (invoiceId: string) => {
    payWithMidtransMutation.mutate(invoiceId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Invoice</CardTitle>
        <CardDescription>
          Kelola invoice langganan dan pembayaran organisasi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header - hanya info untuk client */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Berikut adalah riwayat invoice dan pembayaran untuk organisasi Anda
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Invoice</p>
                  <p className="text-xl font-bold text-gray-900">{invoices.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tertunda</p>
                  <p className="text-xl font-bold text-gray-900">
                    {invoices.filter((item: InvoiceData) => item.invoice.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Dibayar</p>
                  <p className="text-xl font-bold text-gray-900">
                    {invoices.filter((item: InvoiceData) => item.invoice.status === 'paid').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-xl font-bold text-gray-900">
                    {invoices.filter((item: InvoiceData) => item.invoice.status === 'overdue').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Cari invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Tertunda</SelectItem>
              <SelectItem value="paid">Dibayar</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoice Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">No. Invoice</TableHead>
                  <TableHead>Organisasi</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">Memuat data...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Tidak ada invoice ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((item: InvoiceData) => (
                    <TableRow key={item.invoice.id}>
                      <TableCell className="font-medium">
                        {item.invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{item.organization.name}</TableCell>
                      <TableCell>
                        {item.invoice.currency} {parseInt(item.invoice.amount).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          item.invoice.status === 'paid' ? 'default' : 
                          item.invoice.status === 'pending' ? 'secondary' : 
                          'destructive'
                        }>
                          {item.invoice.status === 'paid' ? 'Dibayar' : 
                           item.invoice.status === 'pending' ? 'Tertunda' : 
                           'Overdue'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(item.invoice.issueDate).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Unduh PDF
                            </DropdownMenuItem>
                            {item.invoice.status === 'pending' && (
                              <DropdownMenuItem 
                                onClick={() => handlePayWithMidtrans(item.invoice.id)}
                                className="text-blue-600"
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Bayar dengan Midtrans
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}