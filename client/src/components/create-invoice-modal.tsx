import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const invoiceSchema = z.object({
  organizationId: z.string().min(1, "Organisasi harus dipilih"),
  subscriptionPlanId: z.string().optional(),
  billingPeriodId: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.date({
    required_error: "Tanggal jatuh tempo harus diisi",
  }),
  lineItems: z.array(z.object({
    description: z.string().min(1, "Deskripsi item harus diisi"),
    quantity: z.coerce.number().min(1, "Kuantitas minimal 1"),
    unitPrice: z.coerce.number().min(0, "Harga tidak boleh negatif"),
    discountAmount: z.coerce.number().min(0, "Diskon tidak boleh negatif").optional()
  })).min(1, "Minimal satu item harus ditambahkan")
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceModal({ open, onOpenChange }: CreateInvoiceModalProps) {
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      lineItems: [{ description: "", quantity: 1, unitPrice: 0, discountAmount: 0 }]
    },
  });

  // Fetch organizations
  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/admin/organizations"],
  });

  // Fetch subscription plans
  const { data: subscriptionPlans = [] } = useQuery({
    queryKey: ["/api/admin/subscription-plans-with-periods"],
  });

  // Fetch billing periods for selected plan
  const { data: billingPeriods = [] } = useQuery({
    queryKey: ["/api/admin/billing-periods", selectedPlan],
    enabled: !!selectedPlan,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      await apiRequest("POST", "/api/invoices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Berhasil",
        description: "Invoice berhasil dibuat",
      });
      onOpenChange(false);
      form.reset();
      setSelectedOrganization("");
      setSelectedPlan("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  const addLineItem = () => {
    const currentItems = form.getValues("lineItems");
    form.setValue("lineItems", [...currentItems, { description: "", quantity: 1, unitPrice: 0, discountAmount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    const currentItems = form.getValues("lineItems");
    if (currentItems.length > 1) {
      const newItems = currentItems.filter((_, i) => i !== index);
      form.setValue("lineItems", newItems);
    }
  };

  const calculateTotal = () => {
    const lineItems = form.watch("lineItems");
    return lineItems.reduce((total, item) => {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const discount = item.discountAmount || 0;
      return total + subtotal - discount;
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Invoice Baru</DialogTitle>
          <DialogDescription>
            Buat invoice untuk organisasi dan konfigurasikan item pembayaran
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organization Selection */}
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisasi</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedOrganization(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih organisasi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizations.map((org: any) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Jatuh Tempo</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: id })
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subscription Plan (Optional) */}
              <FormField
                control={form.control}
                name="subscriptionPlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paket Langganan (Opsional)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedPlan(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih paket (opsional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subscriptionPlans.map((plan: any) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - Rp {parseInt(plan.price).toLocaleString('id-ID')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Billing Period (Optional) */}
              {selectedPlan && (
                <FormField
                  control={form.control}
                  name="billingPeriodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Periode Billing (Opsional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih periode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {billingPeriods.map((period: any) => (
                            <SelectItem key={period.id} value={period.id}>
                              {period.periodMonths} bulan - {period.discountPercentage}% diskon
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deskripsi invoice..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Item Invoice</h3>
                <Button type="button" onClick={addLineItem} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Item
                </Button>
              </div>

              {form.watch("lineItems").map((_, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end border p-4 rounded-lg">
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deskripsi</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama item..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Harga</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.discountAmount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diskon</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <Button 
                      type="button" 
                      onClick={() => removeLineItem(index)}
                      size="sm" 
                      variant="ghost"
                      disabled={form.watch("lineItems").length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold">
                    Rp {calculateTotal().toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={createInvoiceMutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                {createInvoiceMutation.isPending ? "Membuat..." : "Buat Invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}