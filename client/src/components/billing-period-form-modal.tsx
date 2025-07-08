import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Calendar, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BillingPeriod } from "@shared/schema";

interface BillingPeriodFormData {
  planId: string;
  periodType: string;
  periodMonths: number;
  price: string;
  discountPercentage: number;
  isActive: boolean;
}

interface BillingPeriodFormModalProps {
  billingPeriod?: BillingPeriod | null;
  planId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const getPeriodTypeFromMonths = (months: number): string => {
  if (months === 1) return "monthly";
  if (months === 3) return "quarterly";
  if (months === 6) return "semiannual";
  if (months === 12) return "annual";
  return "custom";
};

export function BillingPeriodFormModal({ 
  billingPeriod, 
  planId, 
  isOpen, 
  onClose 
}: BillingPeriodFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<BillingPeriodFormData>({
    planId: planId || "",
    periodType: "monthly",
    periodMonths: 1,
    price: "",
    discountPercentage: 0,
    isActive: true,
  });

  useEffect(() => {
    if (billingPeriod) {
      setFormData({
        planId: billingPeriod.planId,
        periodType: billingPeriod.periodType,
        periodMonths: billingPeriod.periodMonths,
        price: billingPeriod.price,
        discountPercentage: billingPeriod.discountPercentage || 0,
        isActive: billingPeriod.isActive || true,
      });
    } else if (planId) {
      setFormData({
        planId,
        periodType: "monthly",
        periodMonths: 1,
        price: "",
        discountPercentage: 0,
        isActive: true,
      });
    }
  }, [billingPeriod, planId]);

  const mutation = useMutation({
    mutationFn: async (data: BillingPeriodFormData) => {
      const endpoint = billingPeriod
        ? `/api/admin/billing-periods/${billingPeriod.id}`
        : "/api/admin/billing-periods";
      const method = billingPeriod ? "PUT" : "POST";
      
      return await apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans-with-periods"] });
      toast({
        title: billingPeriod ? "Periode berhasil diperbarui" : "Periode berhasil dibuat",
        description: billingPeriod 
          ? "Perubahan periode billing telah disimpan." 
          : "Periode billing baru telah dibuat.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Gagal menyimpan periode billing",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.planId || !formData.price || formData.periodMonths === 0) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon lengkapi semua field yang wajib diisi.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(formData);
  };

  const handleMonthsChange = (months: number) => {
    setFormData({
      ...formData,
      periodMonths: months,
      periodType: getPeriodTypeFromMonths(months),
    });
  };

  const formatPrice = (price: string) => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numericPrice);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            {billingPeriod ? "Edit Periode Billing" : "Buat Periode Billing Baru"}
          </DialogTitle>
          <DialogDescription>
            {billingPeriod 
              ? "Perbarui informasi periode billing untuk paket ini." 
              : "Tambahkan periode billing dengan durasi dan diskon khusus."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodMonths">Jumlah Bulan *</Label>
              <Input
                id="periodMonths"
                type="number"
                min="1"
                max="60"
                value={formData.periodMonths}
                onChange={(e) => handleMonthsChange(parseInt(e.target.value) || 1)}
                placeholder="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Durasi periode dalam bulan (1-60)</p>
            </div>
            <div>
              <Label htmlFor="price">Harga Total (IDR) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="299000"
                min="0"
                step="1000"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {formatPrice(formData.price)}
              </p>
            </div>
          </div>

          <div>
            <div>
              <Label htmlFor="discountPercentage" className="text-sm font-medium flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Diskon (%)
              </Label>
              <Select
                value={formData.discountPercentage.toString()}
                onValueChange={(value) => setFormData({ ...formData, discountPercentage: parseInt(value) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% - Tanpa Diskon</SelectItem>
                  <SelectItem value="10">10% - Diskon Triwulan</SelectItem>
                  <SelectItem value="15">15% - Diskon Semester</SelectItem>
                  <SelectItem value="20">20% - Diskon Tahunan</SelectItem>
                  <SelectItem value="25">25% - Diskon Khusus</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-blue-600 mt-1 font-medium">
                {formData.discountPercentage > 0 ? `Hemat ${formData.discountPercentage}%` : "Tanpa diskon"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <div>
              <Label htmlFor="isActive" className="text-sm font-medium">Periode Aktif</Label>
              <p className="text-xs text-gray-500">Centang untuk mengaktifkan periode billing ini</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="px-6"
              disabled={mutation.isPending}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending || !formData.periodType || !formData.price}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 px-6"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {billingPeriod ? "Perbarui Periode" : "Buat Periode Baru"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}