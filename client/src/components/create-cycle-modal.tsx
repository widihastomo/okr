import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCycleSchema } from "@shared/schema";
import { HelpCircle } from "lucide-react";

const createCycleFormSchema = insertCycleSchema.omit({ type: true });

type CreateCycleFormData = z.infer<typeof createCycleFormSchema>;

interface CreateCycleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateCycleModal({ open, onOpenChange, onSuccess }: CreateCycleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CreateCycleFormData>({
    resolver: zodResolver(createCycleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: "",
      endDate: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateCycleFormData) => {
      // Set default type as monthly when submitting
      return apiRequest('POST', '/api/cycles', { ...data, type: "monthly" });
    },
    onSuccess: () => {
      // Invalidate cache to refresh the cycles list
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      toast({
        title: "Siklus berhasil dibuat",
        description: "Siklus baru telah berhasil dibuat",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat siklus",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCycleFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Buat Siklus Baru</DialogTitle>
          <DialogDescription className="text-sm">
            Buat siklus tujuan baru untuk organisasi Anda
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Nama Siklus
                    <Popover>
                      <PopoverTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-help" />
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Nama Siklus</h4>
                          <p className="text-sm text-muted-foreground">
                            Berikan nama yang jelas dan deskriptif untuk siklus ini. Contoh:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• "Juli 2025" (untuk siklus bulanan)</li>
                            <li>• "Q3 2025" (untuk siklus kuartalan)</li>
                            <li>• "Tahun 2025" (untuk siklus tahunan)</li>
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="contoh: Juli 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Deskripsi
                    <Popover>
                      <PopoverTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-help" />
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Deskripsi Siklus</h4>
                          <p className="text-sm text-muted-foreground">
                            Jelaskan fokus utama atau tema dari siklus ini. Contoh:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• "Fokus pertumbuhan penjualan dan ekspansi pasar"</li>
                            <li>• "Peningkatan efisiensi operasional dan produktivitas"</li>
                            <li>• "Pengembangan produk dan inovasi teknologi"</li>
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Jelaskan fokus utama siklus ini..."
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Tanggal Mulai
                      <Popover>
                        <PopoverTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-help" />
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">Tanggal Mulai Siklus</h4>
                            <p className="text-sm text-muted-foreground">
                              Pilih tanggal dimulainya siklus ini. Biasanya:
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• Siklus bulanan: tanggal 1 bulan tersebut</li>
                              <li>• Siklus kuartalan: tanggal 1 bulan pertama kuartal</li>
                              <li>• Siklus tahunan: tanggal 1 Januari</li>
                            </ul>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Tanggal Berakhir
                      <Popover>
                        <PopoverTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-help" />
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">Tanggal Berakhir Siklus</h4>
                            <p className="text-sm text-muted-foreground">
                              Pilih tanggal berakhirnya siklus ini. Biasanya:
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• Siklus bulanan: tanggal terakhir bulan tersebut</li>
                              <li>• Siklus kuartalan: tanggal terakhir bulan ketiga kuartal</li>
                              <li>• Siklus tahunan: tanggal 31 Desember</li>
                            </ul>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                {mutation.isPending ? "Membuat..." : "Buat Siklus"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}