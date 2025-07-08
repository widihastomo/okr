import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const referralCodeSchema = z.object({
  code: z.string().min(3, "Kode minimal 3 karakter").max(20, "Kode maksimal 20 karakter"),
  discountType: z.enum(["percentage", "fixed_amount", "free_months"]),
  discountValue: z.string().min(1, "Nilai diskon wajib diisi"),
  maxUses: z.string().optional(),
  expiresAt: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ReferralCodeFormData = z.infer<typeof referralCodeSchema>;

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
}

interface ReferralCodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCode?: ReferralCode | null;
}

export function ReferralCodeFormModal({ isOpen, onClose, onSuccess, editingCode }: ReferralCodeFormModalProps) {
  const { toast } = useToast();
  const isEditing = !!editingCode;

  const form = useForm<ReferralCodeFormData>({
    resolver: zodResolver(referralCodeSchema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: "",
      maxUses: "",
      expiresAt: "",
      description: "",
      isActive: true,
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (editingCode) {
      form.reset({
        code: editingCode.code,
        discountType: editingCode.discountType,
        discountValue: editingCode.discountValue,
        maxUses: editingCode.maxUses?.toString() || "",
        expiresAt: editingCode.expiresAt ? editingCode.expiresAt.split('T')[0] : "",
        description: editingCode.description || "",
        isActive: editingCode.isActive,
      });
    } else {
      form.reset({
        code: "",
        discountType: "percentage",
        discountValue: "",
        maxUses: "",
        expiresAt: "",
        description: "",
        isActive: true,
      });
    }
  }, [editingCode, form]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/referral-codes", data),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Kode referral berhasil dibuat",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat kode referral",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/referral-codes/${editingCode?.id}`, data),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Kode referral berhasil diperbarui",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui kode referral",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReferralCodeFormData) => {
    const payload = {
      ...data,
      maxUses: data.maxUses ? parseInt(data.maxUses) : null,
      expiresAt: data.expiresAt || null,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const getDiscountValueLabel = (discountType: string) => {
    switch (discountType) {
      case "percentage":
        return "Persentase Diskon (%)";
      case "fixed_amount":
        return "Jumlah Diskon (Rp)";
      case "free_months":
        return "Jumlah Bulan Gratis";
      default:
        return "Nilai Diskon";
    }
  };

  const getDiscountValuePlaceholder = (discountType: string) => {
    switch (discountType) {
      case "percentage":
        return "Contoh: 10 (untuk 10%)";
      case "fixed_amount":
        return "Contoh: 50000 (untuk Rp 50.000)";
      case "free_months":
        return "Contoh: 3 (untuk 3 bulan gratis)";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Kode Referral" : "Buat Kode Referral Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Perbarui informasi kode referral"
              : "Buat kode referral baru untuk menarik klien dengan diskon atau promo"
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode Referral</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Contoh: WELCOME20" 
                      {...field}
                      disabled={isEditing} // Prevent editing code after creation
                    />
                  </FormControl>
                  <FormDescription>
                    Kode unik yang akan digunakan oleh klien (3-20 karakter)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Diskon</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe diskon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">Persentase</SelectItem>
                      <SelectItem value="fixed_amount">Jumlah Tetap</SelectItem>
                      <SelectItem value="free_months">Bulan Gratis</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getDiscountValueLabel(form.watch("discountType"))}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={getDiscountValuePlaceholder(form.watch("discountType"))}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxUses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maksimal Penggunaan (Opsional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="Contoh: 100 (kosongkan untuk unlimited)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Batas maksimal berapa kali kode ini dapat digunakan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Kedaluwarsa (Opsional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Tanggal setelah kode tidak dapat digunakan lagi
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Deskripsi singkat tentang kode referral ini"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Status Aktif</FormLabel>
                    <FormDescription>
                      Kode referral dapat digunakan oleh klien
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Menyimpan..."
                  : isEditing
                  ? "Perbarui"
                  : "Buat Kode"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}