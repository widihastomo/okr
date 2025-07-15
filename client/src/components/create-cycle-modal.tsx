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
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCycleSchema } from "@shared/schema";
import { HelpCircle, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const createCycleFormSchema = insertCycleSchema.omit({ type: true, description: true }).extend({
  startDate: z.date({ required_error: "Tanggal mulai diperlukan" }),
  endDate: z.date({ required_error: "Tanggal berakhir diperlukan" }),
});

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
      startDate: undefined,
      endDate: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateCycleFormData) => {
      // Convert dates to local date format to prevent timezone issues
      const formatDateToLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const formattedData = {
        ...data,
        startDate: formatDateToLocal(data.startDate),
        endDate: formatDateToLocal(data.endDate),
        type: "monthly"
      };
      return apiRequest('POST', '/api/cycles', formattedData);
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
                        <button 
                          type="button" 
                          className="inline-flex items-center justify-center"
                        >
                          <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="right" className="max-w-xs">
                        <p className="text-sm">
                          Berikan nama yang jelas dan deskriptif untuk siklus ini.
                          <br /><br />
                          <strong>Contoh:</strong> "Juli 2025" (bulanan), "Q3 2025" (kuartalan), "Tahun 2025" (tahunan)
                        </p>
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
                          <button 
                            type="button" 
                            className="inline-flex items-center justify-center"
                          >
                            <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="max-w-xs">
                          <p className="text-sm">
                            Pilih tanggal dimulainya siklus ini.
                            <br /><br />
                            <strong>Biasanya:</strong> Siklus bulanan (tanggal 1), kuartalan (awal kuartal), tahunan (1 Januari)
                          </p>
                        </PopoverContent>
                      </Popover>
                    </FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal focus:ring-orange-500 focus:border-orange-500"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {field.value ? format(field.value, "PPP", { locale: id }) : "Tanggal mulai"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                          <button 
                            type="button" 
                            className="inline-flex items-center justify-center"
                          >
                            <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="max-w-xs">
                          <p className="text-sm">
                            Pilih tanggal berakhirnya siklus ini.
                            <br /><br />
                            <strong>Biasanya:</strong> Siklus bulanan (akhir bulan), kuartalan (akhir kuartal), tahunan (31 Desember)
                          </p>
                        </PopoverContent>
                      </Popover>
                    </FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal focus:ring-orange-500 focus:border-orange-500"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {field.value ? format(field.value, "PPP", { locale: id }) : "Tanggal berakhir"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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