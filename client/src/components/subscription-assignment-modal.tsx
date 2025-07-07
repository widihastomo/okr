import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, X } from "lucide-react";
import type { SubscriptionPlan, Organization } from "@shared/schema";

interface SubscriptionAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
}

export default function SubscriptionAssignmentModal({
  isOpen,
  onClose,
  organization,
}: SubscriptionAssignmentModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
    enabled: isOpen,
  });

  // Fetch current organization subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/admin/organizations", organization.id, "subscription"],
    enabled: isOpen,
  });

  // Assign subscription mutation
  const assignMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("POST", `/api/admin/organizations/${organization.id}/subscription`, {
        planId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Paket berlangganan berhasil ditetapkan",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", organization.id, "subscription"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal menetapkan paket berlangganan",
        variant: "destructive",
      });
    },
  });

  // Remove subscription mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/admin/organizations/${organization.id}/subscription`);
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Paket berlangganan berhasil dihapus",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", organization.id, "subscription"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal menghapus paket berlangganan",
        variant: "destructive",
      });
    },
  });

  const handleAssign = () => {
    if (!selectedPlanId) {
      toast({
        title: "Peringatan",
        description: "Pilih paket berlangganan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }
    assignMutation.mutate(selectedPlanId);
  };

  const handleRemove = () => {
    removeMutation.mutate();
  };

  const activePlans = plans.filter((plan: SubscriptionPlan) => plan.isActive);
  const currentPlan = currentSubscription?.plan;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Kelola Paket Berlangganan
          </DialogTitle>
          <DialogDescription>
            Tetapkan atau ubah paket berlangganan untuk {organization.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Subscription */}
          <div className="space-y-2">
            <Label>Paket Saat Ini</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              {subscriptionLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Memuat...</span>
                </div>
              ) : currentPlan ? (
                <div className="space-y-1">
                  <p className="font-medium">{currentPlan.name}</p>
                  <p className="text-sm text-gray-600">{currentPlan.description}</p>
                  <p className="text-sm font-medium text-blue-600">
                    Rp {currentPlan.price.toLocaleString("id-ID")}/bulan
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Tidak ada paket berlangganan aktif</p>
              )}
            </div>
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label htmlFor="plan-select">Pilih Paket Baru</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih paket berlangganan" />
              </SelectTrigger>
              <SelectContent>
                {plansLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : activePlans.length > 0 ? (
                  activePlans.map((plan: SubscriptionPlan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{plan.name}</span>
                        <span className="text-sm text-gray-600">
                          Rp {plan.price.toLocaleString("id-ID")}/bulan
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Tidak ada paket berlangganan aktif
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div>
              {currentPlan && (
                <Button
                  variant="outline"
                  onClick={handleRemove}
                  disabled={removeMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  {removeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Hapus Paket
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button
                onClick={handleAssign}
                disabled={assignMutation.isPending || !selectedPlanId}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                {assignMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Package className="w-4 h-4 mr-2" />
                )}
                {currentPlan ? "Ubah Paket" : "Tetapkan Paket"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}