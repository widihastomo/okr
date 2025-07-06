import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, RotateCcw, Upload } from "lucide-react";

// Form schema for closing initiative
const closureSchema = z.object({
  finalResult: z.enum(['berhasil', 'tidak_berhasil', 'ulangi'], {
    required_error: "Hasil akhir wajib dipilih"
  }),
  learningInsights: z.string().min(10, "Minimal 10 karakter untuk catatan pembelajaran"),
  closureNotes: z.string().min(5, "Minimal 5 karakter untuk catatan penutupan"),
  budgetUsed: z.string().optional(),
  finalMetrics: z.array(z.object({
    metricId: z.string(),
    finalAchievement: z.string().min(1, "Capaian akhir wajib diisi")
  }))
});

type ClosureFormData = z.infer<typeof closureSchema>;

interface InitiativeClosureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
  initiativeTitle: string;
}

export default function InitiativeClosureModal({
  open,
  onOpenChange,
  initiativeId,
  initiativeTitle
}: InitiativeClosureModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attachmentFiles, setAttachmentFiles] = useState<FileList | null>(null);

  // Get initiative details and success metrics
  const { data: initiative } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}`],
    enabled: open
  });

  const { data: successMetrics = [] } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}/success-metrics`],
    enabled: open
  });

  const form = useForm<ClosureFormData>({
    resolver: zodResolver(closureSchema),
    defaultValues: {
      finalResult: undefined,
      learningInsights: "",
      closureNotes: "",
      budgetUsed: "",
      finalMetrics: []
    }
  });

  // Initialize final metrics when success metrics are loaded
  useEffect(() => {
    if (successMetrics.length > 0) {
      const initialMetrics = successMetrics.map((metric: any) => ({
        metricId: metric.id,
        finalAchievement: metric.achievement || "0"
      }));
      form.setValue('finalMetrics', initialMetrics);
    }
  }, [successMetrics, form]);

  const closeMutation = useMutation({
    mutationFn: async (data: ClosureFormData) => {
      // First handle file uploads if any
      let attachmentUrls: string[] = [];
      if (attachmentFiles && attachmentFiles.length > 0) {
        // In a real app, you'd upload files to a storage service
        // For now, we'll simulate this
        attachmentUrls = Array.from(attachmentFiles).map(file => 
          `uploads/${initiativeId}/${file.name}`
        );
      }

      const closureData = {
        ...data,
        budgetUsed: data.budgetUsed ? parseFloat(data.budgetUsed.replace(/\./g, '').replace(',', '.')) : undefined,
        attachmentUrls
      };

      return apiRequest("POST", `/api/initiatives/${initiativeId}/close`, closureData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      toast({
        title: "Berhasil",
        description: "Inisiatif berhasil ditutup",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menutup inisiatif",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClosureFormData) => {
    closeMutation.mutate(data);
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'berhasil':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'tidak_berhasil':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'ulangi':
        return <RotateCcw className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentFiles(event.target.files);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tutup Inisiatif: {initiativeTitle}</DialogTitle>
          <DialogDescription>
            Lengkapi informasi penutupan inisiatif termasuk hasil akhir, capaian metrik, dan pembelajaran
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Hasil Akhir */}
            <FormField
              control={form.control}
              name="finalResult"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasil Akhir Inisiatif</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hasil akhir inisiatif" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="berhasil">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Berhasil
                        </div>
                      </SelectItem>
                      <SelectItem value="tidak_berhasil">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Tidak Berhasil
                        </div>
                      </SelectItem>
                      <SelectItem value="ulangi">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="h-4 w-4 text-orange-600" />
                          Perlu Diulangi
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Final Success Metrics */}
            {successMetrics.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Capaian Akhir Metrik Keberhasilan</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Metrik</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Target</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Capaian Sebelumnya</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Capaian Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {successMetrics.map((metric: any, index: number) => (
                        <tr key={metric.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{metric.name}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {metric.target}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {metric.achievement || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <FormField
                              control={form.control}
                              name={`finalMetrics.${index}.finalAchievement`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="Masukkan capaian akhir"
                                      className="w-full"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Budget Used */}
            <FormField
              control={form.control}
              name="budgetUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Terpakai (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: 250.000.000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Learning Insights */}
            <FormField
              control={form.control}
              name="learningInsights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan Pembelajaran & Insight</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tuliskan pembelajaran penting, insight, dan hal-hal yang bisa diperbaiki di masa depan..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Closure Notes */}
            <FormField
              control={form.control}
              name="closureNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan Penutupan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ringkasan akhir, kondisi inisiatif saat ditutup, dan informasi penting lainnya..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Attachments */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Lampiran (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload dokumen, gambar, atau file pendukung lainnya
                  </p>
                </div>
              </div>
              {attachmentFiles && attachmentFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">File yang akan diupload:</p>
                  {Array.from(attachmentFiles).map((file, index) => (
                    <Badge key={index} variant="secondary" className="mr-1 mb-1">
                      {file.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={closeMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={closeMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {closeMutation.isPending ? "Menutup..." : "Tutup Inisiatif"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}