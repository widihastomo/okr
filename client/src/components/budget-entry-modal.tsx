import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertBudgetEntrySchema, type InsertBudgetEntry } from "@shared/schema";
import { Plus } from "lucide-react";

interface BudgetEntryModalProps {
  initiativeId: string;
  trigger?: React.ReactNode;
}

const budgetCategories = [
  { value: "personnel", label: "SDM" },
  { value: "equipment", label: "Peralatan" },
  { value: "software", label: "Software" },
  { value: "marketing", label: "Marketing" },
  { value: "training", label: "Pelatihan" },
  { value: "travel", label: "Perjalanan" },
  { value: "consulting", label: "Konsultasi" },
  { value: "other", label: "Lainnya" }
];

const budgetEntryFormSchema = insertBudgetEntrySchema.omit({
  id: true,
  initiativeId: true,
  createdBy: true,
  createdAt: true
});

export function BudgetEntryModal({ initiativeId, trigger }: BudgetEntryModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<Omit<InsertBudgetEntry, 'id' | 'initiativeId' | 'createdBy' | 'createdAt'>>({
    resolver: zodResolver(budgetEntryFormSchema),
    defaultValues: {
      category: "other",
      plannedAmount: "",
      actualAmount: "",
      description: "",
      notes: ""
    }
  });

  const createBudgetEntryMutation = useMutation({
    mutationFn: (data: Omit<InsertBudgetEntry, 'id' | 'createdBy' | 'createdAt'>) =>
      apiRequest(`/api/initiatives/${initiativeId}/budget-entries`, {
        method: "POST",
        body: data
      }),
    onSuccess: () => {
      toast({
        title: "Sukses",
        description: "Entri anggaran berhasil ditambahkan",
        className: "border-green-200 bg-green-50 text-green-800"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives", initiativeId, "budget-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives", initiativeId, "analysis"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      console.error("Error creating budget entry:", error);
      toast({
        title: "Error",
        description: "Gagal menambahkan entri anggaran",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: Omit<InsertBudgetEntry, 'id' | 'initiativeId' | 'createdBy' | 'createdAt'>) => {
    createBudgetEntryMutation.mutate({
      ...data,
      initiativeId
    });
  };

  const formatCurrency = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Parse to number and format with thousand separators
    const num = parseFloat(numericValue);
    if (isNaN(num)) return "";
    
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const parseCurrency = (value: string) => {
    // Remove thousand separators and convert to plain number string
    return value.replace(/\./g, '');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Anggaran
        </Button>
      )}

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Entri Anggaran</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {budgetCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plannedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anggaran Direncanakan (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="0"
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value);
                          field.onChange(parseCurrency(formatted));
                          e.target.value = formatted;
                        }}
                        onBlur={(e) => {
                          const formatted = formatCurrency(field.value || "");
                          e.target.value = formatted;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="actualAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anggaran Aktual (Rp) - Opsional</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="0"
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value);
                          field.onChange(parseCurrency(formatted) || null);
                          e.target.value = formatted;
                        }}
                        onBlur={(e) => {
                          const formatted = formatCurrency(field.value || "");
                          e.target.value = formatted;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Anggaran aktual bisa diisi kemudian saat pengeluaran terjadi
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Jelaskan detail anggaran ini..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan - Opsional</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Catatan tambahan..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createBudgetEntryMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createBudgetEntryMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createBudgetEntryMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}