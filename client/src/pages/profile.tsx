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
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if ((user as any)?.email) {
      return (user as any).email[0].toUpperCase();
    }
    return "U";
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-red-100 text-red-800 border-red-200";
      case "administrator":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "member":
        return "bg-green-100 text-green-800 border-green-200";
      case "viewer":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Owner";
      case "administrator":
        return "Administrator";
      case "member":
        return "Member";
      case "viewer":
        return "Viewer";
      default:
        return "Member";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profil Saya</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Kelola informasi profil dan pengaturan akun Anda
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Profile Information Card */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <User className="w-5 h-5 text-blue-600" />
                    Informasi Profil
                  </CardTitle>
                  <CardDescription className="mt-2 text-gray-600">
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
                        className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan"}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nama Depan</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          disabled={!isEditing}
                          placeholder="Masukkan nama depan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nama Belakang</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Masukkan email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})} disabled={!isEditing}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="administrator">Administrator</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Informasi Tambahan</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Dibuat pada:</span>
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
            </div>

            {/* Profile Card Sidebar */}
            <div className="lg:col-span-1">
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-20 w-20 ring-4 ring-blue-100">
                      <AvatarImage src={(user as any)?.profileImageUrl} />
                      <AvatarFallback className="text-lg bg-blue-600 text-white font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {(user as any)?.firstName && (user as any)?.lastName
                      ? `${(user as any).firstName} ${(user as any).lastName}`
                      : (user as any)?.email || "User"
                    }
                  </CardTitle>
                  <CardDescription className="flex items-center justify-center gap-2 mt-3">
                    <Badge className={`${getRoleBadgeColor((user as any)?.role || "member")} font-medium`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {getRoleLabel((user as any)?.role || "member")}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0 pb-6">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate font-medium">{(user as any)?.email}</span>
                  </div>
                  <LogoutButton
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 h-10 font-medium"
                  >
                    Keluar dari Akun
                  </LogoutButton>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Change Password Section */}
          <Card className="shadow-sm border-0 bg-white mt-6">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                <Shield className="w-5 h-5 text-blue-600" />
                Ganti Password
              </CardTitle>
              <CardDescription className="mt-2 text-gray-600">
                Perbarui password untuk keamanan akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Password Saat Ini</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Masukkan password saat ini"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({...prev, currentPassword: e.target.value}))}
                      required
                      className="h-11"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Password Baru</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Masukkan password baru"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                        required
                        className="h-11"
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
                        className="h-11"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 h-11 px-8"
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? "Memperbarui..." : "Perbarui Password"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}