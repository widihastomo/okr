import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Gift, Plus, Pencil, Trash2, Eye, BarChart3, ExternalLink, Copy, Check, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ReferralCodeFormModal } from "@/components/referral-code-form-modal";
import { ReferralAnalyticsModal } from "@/components/referral-analytics-modal";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReferralCode {
  id: string;
  code: string;
  discountType: "percentage" | "fixed_amount" | "free_months";
  discountValue: string;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
  expiresAt: string | null;
  description: string | null;
  createdAt: string;
  createdBy: string | null;
  createdByEmail: string | null;
}

export default function ReferralCodes() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<ReferralCode | null>(null);
  const [analyticsCodeId, setAnalyticsCodeId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Check if user is system admin
  useEffect(() => {
    if (!isAuthLoading && (!user || !user.isSystemOwner)) {
      toast({
        title: "Akses Ditolak",
        description: "Halaman ini hanya bisa diakses oleh admin sistem.",
        variant: "destructive",
      });
      // Redirect to home
      window.location.href = "/";
    }
  }, [user, isAuthLoading, toast]);

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show access denied if not system admin
  if (!user || !user.isSystemOwner) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Akses Ditolak</CardTitle>
            <CardDescription>
              Halaman ini hanya bisa diakses oleh admin sistem.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/">Kembali ke Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch referral codes
  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["/api/referral-codes"],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/referral-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-codes"] });
      toast({
        title: "Berhasil",
        description: "Kode referral berhasil dihapus",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menghapus kode referral",
        variant: "destructive",
      });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (data: { id: string; isActive: boolean }) =>
      apiRequest("PUT", `/api/referral-codes/${data.id}`, { isActive: data.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-codes"] });
      toast({
        title: "Berhasil",
        description: "Status kode referral berhasil diubah",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal mengubah status kode referral",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Berhasil",
        description: "Kode referral berhasil disalin",
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Gagal menyalin kode referral",
        variant: "destructive",
      });
    }
  };

  const formatDiscountValue = (type: string, value: string) => {
    switch (type) {
      case "percentage":
        return `${value}%`;
      case "fixed_amount":
        return `Rp ${parseInt(value).toLocaleString("id-ID")}`;
      case "free_months":
        return `${value} bulan gratis`;
      default:
        return value;
    }
  };

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case "percentage":
        return "Persentase";
      case "fixed_amount":
        return "Jumlah Tetap";
      case "free_months":
        return "Bulan Gratis";
      default:
        return type;
    }
  };

  const getStatusBadge = (code: ReferralCode) => {
    if (!code.isActive) {
      return <Badge variant="destructive">Nonaktif</Badge>;
    }
    
    if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
      return <Badge variant="destructive">Kedaluwarsa</Badge>;
    }
    
    if (code.maxUses && code.currentUses >= code.maxUses) {
      return <Badge variant="destructive">Limit Terpakai</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-500">Aktif</Badge>;
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kode Referral (Admin Sistem)</h1>
          <p className="text-gray-600">Kelola kode referral sistem untuk menarik klien baru dengan diskon dan promo</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Buat Kode Referral
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kode</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{codes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kode Aktif</CardTitle>
            <Gift className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {codes.filter((code: ReferralCode) => code.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penggunaan</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {codes.reduce((sum: number, code: ReferralCode) => sum + code.currentUses, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kode Kedaluwarsa</CardTitle>
            <Gift className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {codes.filter((code: ReferralCode) => 
                code.expiresAt && new Date(code.expiresAt) < new Date()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kode Referral</CardTitle>
          <CardDescription>
            Kelola semua kode referral yang telah dibuat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Belum ada kode referral</h3>
              <p className="mt-2 text-gray-500">Mulai dengan membuat kode referral pertama Anda</p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Kode Referral
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Tipe Diskon</TableHead>
                  <TableHead>Nilai Diskon</TableHead>
                  <TableHead>Penggunaan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kedaluwarsa</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code: ReferralCode) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-semibold">{code.code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedCode === code.code ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getDiscountTypeLabel(code.discountType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatDiscountValue(code.discountType, code.discountValue)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {code.currentUses}
                        {code.maxUses && ` / ${code.maxUses}`}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(code)}</TableCell>
                    <TableCell>
                      {code.expiresAt
                        ? new Date(code.expiresAt).toLocaleDateString("id-ID")
                        : "Tidak ada"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingCode(code)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAnalyticsCodeId(code.id)}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Lihat Analitik
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: code.id,
                                isActive: !code.isActive,
                              })
                            }
                          >
                            {code.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-red-600"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus kode referral "{code.code}"?
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(code.id)}
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ReferralCodeFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["/api/referral-codes"] });
        }}
      />

      {editingCode && (
        <ReferralCodeFormModal
          isOpen={true}
          onClose={() => setEditingCode(null)}
          editingCode={editingCode}
          onSuccess={() => {
            setEditingCode(null);
            queryClient.invalidateQueries({ queryKey: ["/api/referral-codes"] });
          }}
        />
      )}

      {analyticsCodeId && (
        <ReferralAnalyticsModal
          isOpen={true}
          onClose={() => setAnalyticsCodeId(null)}
          codeId={analyticsCodeId}
        />
      )}
    </div>
  );
}