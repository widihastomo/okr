import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Mail, Trash2, Edit, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface MemberInvitation {
  id: string;
  email: string;
  role: string;
  department?: string;
  jobTitle?: string;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
  expiresAt?: string;
  invitedBy: string;
  invitationToken: string;
}

export default function MemberInvitations() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    role: "member",
    department: "",
    jobTitle: "",
  });

  // Fetch invitations
  const { data: invitations, isLoading } = useQuery<MemberInvitation[]>({
    queryKey: ["/api/member-invitations"],
    retry: false,
  });

  // Create invitation mutation
  const createInvitation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/member-invitations", data),
    onSuccess: () => {
      toast({
        title: "Undangan Berhasil Dikirim",
        description: "Undangan member baru telah dikirim ke email yang ditentukan.",
      });
      setIsCreateOpen(false);
      setFormData({ email: "", role: "member", department: "", jobTitle: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/member-invitations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Mengirim Undangan",
        description: error.message || "Terjadi kesalahan saat mengirim undangan.",
        variant: "destructive",
      });
    },
  });

  // Delete invitation mutation
  const deleteInvitation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/member-invitations/${id}`),
    onSuccess: () => {
      toast({
        title: "Undangan Dihapus",
        description: "Undangan member berhasil dihapus.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/member-invitations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Menghapus Undangan",
        description: error.message || "Terjadi kesalahan saat menghapus undangan.",
        variant: "destructive",
      });
    },
  });

  const handleCreateInvitation = () => {
    if (!formData.email || !formData.role) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Email dan role harus diisi.",
        variant: "destructive",
      });
      return;
    }

    createInvitation.mutate(formData);
  };

  const getStatusBadge = (status: string, expiresAt?: string) => {
    const isExpired = expiresAt && new Date() > new Date(expiresAt);
    
    if (isExpired) {
      return <Badge variant="destructive">Kedaluwarsa</Badge>;
    }
    
    switch (status) {
      case "pending":
        return <Badge variant="outline">Menunggu</Badge>;
      case "accepted":
        return <Badge variant="secondary">Diterima</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="default">Admin</Badge>;
      case "manager":
        return <Badge variant="secondary">Manager</Badge>;
      case "member":
        return <Badge variant="outline">Member</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Undangan Member</h1>
                <p className="text-sm text-gray-600">
                  Kelola undangan member untuk bergabung dengan organisasi
                </p>
              </div>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Undang Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Undang Member Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Departemen (Opsional)</Label>
                    <Input
                      id="department"
                      placeholder="Engineering, Marketing, dll"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Jabatan (Opsional)</Label>
                    <Input
                      id="jobTitle"
                      placeholder="Software Engineer, Product Manager, dll"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={createInvitation.isPending}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleCreateInvitation}
                    disabled={createInvitation.isPending}
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  >
                    {createInvitation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Kirim Undangan
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Invitations List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Undangan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              </div>
            ) : invitations && invitations.length > 0 ? (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{invitation.email}</span>
                        {getRoleBadge(invitation.role)}
                        {getStatusBadge(invitation.status, invitation.expiresAt)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {invitation.department && (
                          <span>Departemen: {invitation.department}</span>
                        )}
                        {invitation.jobTitle && (
                          <span>Jabatan: {invitation.jobTitle}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Dikirim {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true, locale: id })}
                        {invitation.expiresAt && (
                          <span className="ml-2">
                            • Kedaluwarsa {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true, locale: id })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInvitation.mutate(invitation.id)}
                        disabled={deleteInvitation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Belum Ada Undangan</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Mulai dengan mengundang member baru untuk bergabung dengan organisasi.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}