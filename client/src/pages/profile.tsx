import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, Save, Mail, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LogoutButton } from "@/components/logout-button";
import Sidebar from "@/components/sidebar";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: (user as any)?.firstName || "",
    lastName: (user as any)?.lastName || "",
    email: (user as any)?.email || "",
    role: (user as any)?.role || "member"
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/users/${(user as any)?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profil Berhasil Diperbarui",
        description: "Perubahan profil Anda telah disimpan.",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Gagal Memperbarui Profil",
        description: "Terjadi kesalahan saat menyimpan perubahan.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/auth/change-password`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Berhasil Diubah",
        description: "Password Anda telah berhasil diperbarui.",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal Mengubah Password",
        description: "Password saat ini tidak valid atau terjadi kesalahan.",
        variant: "destructive",
      });
    },
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Tidak Cocok",
        description: "Password baru dan konfirmasi password tidak sama.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password Terlalu Pendek",
        description: "Password baru minimal harus 6 karakter.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };



  const getUserInitials = () => {
    const firstName = (user as any)?.firstName || "";
    const lastName = (user as any)?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "manager":
        return "Manager";
      default:
        return "Member";
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
              <p className="text-gray-600 mt-2">
                Kelola informasi profil dan pengaturan akun Anda
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={(user as any)?.profileImageUrl} />
                        <AvatarFallback className="text-xl bg-primary text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <CardTitle className="text-xl">
                      {(user as any)?.firstName && (user as any)?.lastName
                        ? `${(user as any).firstName} ${(user as any).lastName}`
                        : (user as any)?.email || "User"
                      }
                    </CardTitle>
                    <CardDescription className="flex items-center justify-center gap-2">
                      <Badge className={getRoleBadgeColor((user as any)?.role || "member")}>
                        <Shield className="w-3 h-3 mr-1" />
                        {getRoleLabel((user as any)?.role || "member")}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
                      <Mail className="w-4 h-4" />
                      {(user as any)?.email}
                    </div>
                    <LogoutButton
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Keluar
                    </LogoutButton>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Statistik</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total OKR</span>
                        <span className="font-medium">8</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">On Track</span>
                        <span className="font-medium text-green-600">5</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">At Risk</span>
                        <span className="font-medium text-yellow-600">2</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completed</span>
                        <span className="font-medium text-blue-600">1</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Settings */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Informasi Profil
                      </CardTitle>
                      <CardDescription>
                        Perbarui informasi profil dan pengaturan akun Anda
                      </CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} variant="outline">
                        <User className="w-4 h-4 mr-2" />
                        Edit Profil
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setIsEditing(false)}
                          variant="outline"
                          size="sm"
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          size="sm"
                          disabled={updateProfileMutation.isPending}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan"}
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Nama Depan</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            disabled={!isEditing}
                            placeholder="Masukkan nama depan"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Nama Belakang</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            disabled={!isEditing}
                            placeholder="Masukkan nama belakang"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled={true}
                          className="bg-gray-50"
                          placeholder="Email tidak dapat diubah"
                        />
                        <p className="text-xs text-gray-500">
                          Email tidak dapat diubah karena terhubung dengan sistem autentikasi
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={formData.role} disabled={true}>
                          <SelectTrigger className="bg-gray-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                          Role diatur oleh administrator sistem
                        </p>
                      </div>

                      <Separator />

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">Informasi Akun</h3>
                        <div className="space-y-2 text-sm text-blue-800">
                          <div className="flex justify-between">
                            <span>User ID:</span>
                            <span className="font-mono">{(user as any)?.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bergabung sejak:</span>
                            <span>
                              {(user as any)?.createdAt 
                                ? new Date((user as any).createdAt).toLocaleDateString('id-ID')
                                : 'N/A'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Terakhir diperbarui:</span>
                            <span>
                              {(user as any)?.updatedAt 
                                ? new Date((user as any).updatedAt).toLocaleDateString('id-ID')
                                : 'N/A'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Change Password */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Ganti Password</CardTitle>
                    <CardDescription>
                      Perbarui password untuk keamanan akun Anda
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Password Saat Ini</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          placeholder="Masukkan password saat ini"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({...prev, currentPassword: e.target.value}))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Password Baru</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Masukkan password baru"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Konfirmasi password baru"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? "Memperbarui..." : "Perbarui Password"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}