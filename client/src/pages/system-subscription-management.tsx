import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreVertical, CreditCard, Users, TrendingUp, AlertTriangle, Edit, Trash2, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  expiringSoon: number;
  monthlyRevenue: string;
  planDistribution: Array<{
    planName: string;
    planSlug: string;
    subscriptionCount: number;
    revenue: string;
  }>;
}

interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  plan: {
    id: string;
    name: string;
    slug: string;
    price: string;
    billingCycle: string;
  };
  organization: {
    id: string;
    name: string;
    email: string;
  };
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: string;
  billingCycle: string;
}

export default function SystemSubscriptionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPlanId, setEditPlanId] = useState("");

  // Fetch subscription statistics
  const { data: stats, isLoading: statsLoading } = useQuery<SubscriptionStats>({
    queryKey: ["/api/admin/subscription-stats"],
  });

  // Fetch all subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/admin/subscriptions"],
  });

  // Fetch all plans for editing
  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["/api/admin/subscription-plans"],
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/subscriptions/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-stats"] });
      toast({
        title: "Berhasil",
        description: "Status subscription berhasil diperbarui",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui status subscription",
        variant: "destructive",
      });
    },
  });

  // Plan update mutation
  const planMutation = useMutation({
    mutationFn: async ({ id, planId }: { id: string; planId: string }) => {
      return apiRequest("PUT", `/api/admin/subscriptions/${id}/plan`, { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-stats"] });
      setIsEditModalOpen(false);
      setSelectedSubscription(null);
      toast({
        title: "Berhasil",
        description: "Plan subscription berhasil diperbarui",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui plan subscription",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/subscriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-stats"] });
      toast({
        title: "Berhasil",
        description: "Subscription berhasil dihapus",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus subscription",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      expired: "destructive",
      cancelled: "outline"
    };
    
    const labels: Record<string, string> = {
      active: "Aktif",
      trial: "Trial",
      expired: "Kedaluwarsa",
      cancelled: "Dibatalkan"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleEditPlan = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setEditPlanId(subscription.planId);
    setIsEditModalOpen(true);
  };

  const handleSavePlan = () => {
    if (selectedSubscription && editPlanId) {
      planMutation.mutate({ id: selectedSubscription.id, planId: editPlanId });
    }
  };

  if (statsLoading || subscriptionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kelola Subscription</h1>
            <p className="text-muted-foreground">
              Kelola semua subscription organisasi dan monitor statistik
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kelola Subscription</h1>
          <p className="text-muted-foreground">
            Kelola semua subscription organisasi dan monitor statistik
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscription</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Semua subscription
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sedang berjalan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Bulanan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(parseFloat(stats?.monthlyRevenue || "0"))}</div>
            <p className="text-xs text-muted-foreground">
              MRR (Monthly Recurring Revenue)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Akan Berakhir</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.expiringSoon || 0}</div>
            <p className="text-xs text-muted-foreground">
              Dalam 30 hari ke depan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      {stats?.planDistribution && stats.planDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Plan</CardTitle>
            <CardDescription>
              Jumlah subscription per plan dan revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.planDistribution.map((plan) => (
                <div key={plan.planSlug} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{plan.planName}</p>
                    <p className="text-sm text-muted-foreground">{plan.subscriptionCount} subscription</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(parseFloat(plan.revenue))}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Semua Subscription</CardTitle>
          <CardDescription>
            Kelola dan monitor status subscription organisasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisasi</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Berakhir</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.organization?.name}</div>
                      <div className="text-sm text-muted-foreground">{subscription.organization?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.plan?.name}</div>
                      <div className="text-sm text-muted-foreground">{subscription.plan?.billingCycle}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(subscription.status)}
                  </TableCell>
                  <TableCell>
                    {formatDate(subscription.currentPeriodStart)}
                  </TableCell>
                  <TableCell>
                    <div className={`${new Date(subscription.currentPeriodEnd) < new Date() ? 'text-red-600' : ''}`}>
                      {formatDate(subscription.currentPeriodEnd)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(parseFloat(subscription.plan?.price || "0"))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPlan(subscription)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => statusMutation.mutate({ id: subscription.id, status: subscription.status === 'active' ? 'cancelled' : 'active' })}>
                          <Package className="mr-2 h-4 w-4" />
                          {subscription.status === 'active' ? 'Batalkan' : 'Aktifkan'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setSelectedSubscription(subscription)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>


                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!selectedSubscription && !isEditModalOpen} onOpenChange={() => setSelectedSubscription(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus subscription untuk {selectedSubscription?.organization?.name}? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSubscription(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedSubscription) {
                  deleteMutation.mutate(selectedSubscription.id);
                  setSelectedSubscription(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Plan Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan Subscription</DialogTitle>
            <DialogDescription>
              Ubah plan subscription untuk {selectedSubscription?.organization?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Plan Baru</Label>
              <Select value={editPlanId} onValueChange={setEditPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih plan baru" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(parseFloat(plan.price))} ({plan.billingCycle})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSavePlan}
              disabled={planMutation.isPending || !editPlanId}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              {planMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}