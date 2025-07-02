import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { KeyResult } from "@shared/schema";

const editKeyResultSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  currentValue: z.string().min(1, "Current value is required"),
  targetValue: z.string().min(1, "Target value is required"),
  baseValue: z.string().optional(),
  unit: z.string().optional(),
  keyResultType: z.enum(["increase_to", "decrease_to", "achieve_or_not", "should_stay_above", "should_stay_below"]),
  status: z.enum(["on_track", "at_risk", "behind", "completed", "in_progress"]),

});

type EditKeyResultFormData = z.infer<typeof editKeyResultSchema>;

interface EditKeyResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyResult?: KeyResult;
}

export default function EditKeyResultModal({
  open,
  onOpenChange,
  keyResult,
}: EditKeyResultModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditKeyResultFormData>({
    resolver: zodResolver(editKeyResultSchema),
    values: keyResult ? {
      title: keyResult.title,
      description: keyResult.description || "",
      currentValue: keyResult.currentValue,
      targetValue: keyResult.targetValue,
      baseValue: keyResult.baseValue || "",
      unit: keyResult.unit || "",
      keyResultType: keyResult.keyResultType as "increase_to" | "decrease_to" | "achieve_or_not" | "should_stay_above" | "should_stay_below",
      status: keyResult.status as "on_track" | "at_risk" | "behind" | "completed" | "in_progress",

    } : undefined,
  });

  const updateKeyResultMutation = useMutation({
    mutationFn: async (data: EditKeyResultFormData) => {
      if (!keyResult) throw new Error("Key result not found");
      
      const response = await apiRequest(
        "PATCH",
        `/api/key-results/${keyResult.id}`,
        {
          ...data,
          baseValue: data.baseValue || null,
          unit: data.unit || null,
          description: data.description || null,

        }
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Ukuran Keberhasilan berhasil diperbarui",
        description: "Perubahan telah disimpan.",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui Ukuran Keberhasilan",
        description: error.message || "Terjadi kesalahan saat memperbarui Ukuran Keberhasilan.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditKeyResultFormData) => {
    updateKeyResultMutation.mutate(data);
  };

  const formatNumberInput = (value: string) => {
    const number = parseFloat(value.replace(/[.,]/g, ''));
    if (isNaN(number)) return value;
    return new Intl.NumberFormat('id-ID').format(number);
  };

  const parseNumberInput = (value: string) => {
    return value.replace(/[.,]/g, '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Ukuran Keberhasilan</DialogTitle>
          <DialogDescription>
            Ubah detail Ukuran Keberhasilan termasuk target, status, dan informasi lainnya.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Ukuran Keberhasilan</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Contoh: Meningkatkan pendapatan bulanan"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Deskripsi detail tentang Ukuran Keberhasilan ini..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipe Ukuran Keberhasilan dan Nilai */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="keyResultType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Ukuran Keberhasilan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="increase_to">Naik ke (Increase To)</SelectItem>
                        <SelectItem value="decrease_to">Turun ke (Decrease To)</SelectItem>
                        <SelectItem value="should_stay_above">Harus tetap di atas (Stay Above)</SelectItem>
                        <SelectItem value="should_stay_below">Harus tetap di bawah (Stay Below)</SelectItem>
                        <SelectItem value="achieve_or_not">Ya/Tidak (Achieve or Not)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit (Opsional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Contoh: Rp, %, buah, orang"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Conditional Value Fields */}
            {(() => {
              const keyResultType = form.watch("keyResultType");
              
              if (keyResultType === "achieve_or_not") {
                return null; // Don't show any value fields
              }
              
              if (keyResultType === "should_stay_above" || keyResultType === "should_stay_below") {
                return (
                  <div className="grid grid-cols-1 gap-4">
                    {/* Target Value Only */}
                    <FormField
                      control={form.control}
                      name="targetValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="100"
                              required
                              value={formatNumberInput(field.value)}
                              onChange={(e) => field.onChange(parseNumberInput(e.target.value))}
                              step="0.1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                );
              }
              
              // For increase_to and decrease_to types
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="baseValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nilai Awal</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0"
                            value={field.value ? formatNumberInput(field.value) : ''}
                            onChange={(e) => field.onChange(parseNumberInput(e.target.value))}
                            step="0.1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="100"
                            required
                            value={formatNumberInput(field.value)}
                            onChange={(e) => field.onChange(parseNumberInput(e.target.value))}
                            step="0.1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nilai Saat Ini</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="50"
                            required
                            value={formatNumberInput(field.value)}
                            onChange={(e) => field.onChange(parseNumberInput(e.target.value))}
                            step="0.1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })()}

            

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateKeyResultMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={updateKeyResultMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateKeyResultMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}