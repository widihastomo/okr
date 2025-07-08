import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Gift, Users, TrendingDown, Calendar } from "lucide-react";

interface ReferralAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  codeId: string;
}

interface UsageDetail {
  id: string;
  usedByOrganization: string;
  usedByUser: string;
  usedByEmail: string;
  discountApplied: string;
  status: string;
  appliedAt: string;
  expiresAt: string | null;
}

interface ReferralCode {
  id: string;
  code: string;
  discountType: string;
  discountValue: string;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
  expiresAt: string | null;
  description: string | null;
}

interface Analytics {
  code: ReferralCode;
  totalUsages: number;
  totalDiscountGiven: number;
  remainingUses: number | null;
  usageDetails: UsageDetail[];
}

export function ReferralAnalyticsModal({ isOpen, onClose, codeId }: ReferralAnalyticsModalProps) {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: [`/api/referral-codes/${codeId}/analytics`],
    enabled: isOpen && !!codeId,
  });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied":
        return <Badge variant="default" className="bg-green-500">Diterapkan</Badge>;
      case "expired":
        return <Badge variant="destructive">Kedaluwarsa</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading || !analytics) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Analitik Kode Referral: {analytics.code.code}</span>
          </DialogTitle>
          <DialogDescription>
            Detail penggunaan dan statistik kode referral
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Code Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detail Kode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Kode</p>
                  <p className="font-mono font-semibold">{analytics.code.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipe Diskon</p>
                  <p className="font-semibold">
                    {formatDiscountValue(analytics.code.discountType, analytics.code.discountValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    {analytics.code.isActive ? (
                      <Badge variant="default" className="bg-green-500">Aktif</Badge>
                    ) : (
                      <Badge variant="destructive">Nonaktif</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kedaluwarsa</p>
                  <p className="font-semibold">
                    {analytics.code.expiresAt
                      ? new Date(analytics.code.expiresAt).toLocaleDateString("id-ID")
                      : "Tidak ada"
                    }
                  </p>
                </div>
              </div>
              {analytics.code.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Deskripsi</p>
                  <p className="text-sm">{analytics.code.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Penggunaan</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsages}</div>
                {analytics.code.maxUses && (
                  <p className="text-xs text-muted-foreground">
                    dari {analytics.code.maxUses} maksimal
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Diskon Diberikan</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.code.discountType === "fixed_amount"
                    ? `Rp ${analytics.totalDiscountGiven.toLocaleString("id-ID")}`
                    : analytics.totalDiscountGiven
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sisa Penggunaan</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.remainingUses !== null ? analytics.remainingUses : "∞"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.remainingUses !== null ? "penggunaan tersisa" : "unlimited"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tingkat Penggunaan</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.code.maxUses
                    ? `${Math.round((analytics.totalUsages / analytics.code.maxUses) * 100)}%`
                    : "N/A"
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  dari batas maksimal
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Usage History */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Penggunaan</CardTitle>
              <CardDescription>
                Detail organisasi yang telah menggunakan kode referral ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.usageDetails.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Belum ada penggunaan</h3>
                  <p className="mt-2 text-gray-500">Kode referral ini belum pernah digunakan</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organisasi</TableHead>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Diskon Diterapkan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Digunakan</TableHead>
                      <TableHead>Kedaluwarsa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.usageDetails.map((usage) => (
                      <TableRow key={usage.id}>
                        <TableCell className="font-medium">
                          {usage.usedByOrganization || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{usage.usedByUser || "N/A"}</p>
                            <p className="text-sm text-gray-500">{usage.usedByEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {analytics.code.discountType === "fixed_amount"
                            ? `Rp ${parseFloat(usage.discountApplied || "0").toLocaleString("id-ID")}`
                            : usage.discountApplied || "0"
                          }
                        </TableCell>
                        <TableCell>{getStatusBadge(usage.status)}</TableCell>
                        <TableCell>
                          {new Date(usage.appliedAt).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell>
                          {usage.expiresAt
                            ? new Date(usage.expiresAt).toLocaleDateString("id-ID")
                            : "Tidak ada"
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}