import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Target, TrendingUp, TrendingDown, MoveUp, MoveDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatNumberInput, parseFormattedNumber } from "@/lib/number-utils";
import type { InsertInitiative, InsertSuccessMetric, User } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Schema for step 1 - Initiative info
const initiativeInfoSchema = z.object({
  title: z.string().min(1, "Nama inisiatif harus diisi"),
  description: z.string().min(1, "Tujuan inisiatif harus diisi"),
  targetContribution: z.string().optional(),
  picId: z.string().min(1, "Penanggung jawab harus dipilih"),
  startDate: z.date({ required_error: "Tanggal mulai harus diisi" }),
  dueDate: z.date({ required_error: "Tanggal selesai harus diisi" }),
});

// Schema for step 2 - Success metrics
const successMetricSchema = z.object({
  title: z.string().min(1, "Judul metrik harus diisi"),
  description: z.string().optional(),
  type: z.enum(["increase_to", "decrease_to", "achieve_or_not", "should_stay_above", "should_stay_below"]).default("increase_to"),
  baseValue: z.string().optional(),
  targetValue: z.string().min(1, "Nilai target harus diisi"),
  unit: z.string().default("number"),
  dueDate: z.date().optional(),
});

type InitiativeInfoData = z.infer<typeof initiativeInfoSchema>;
type SuccessMetricData = z.infer<typeof successMetricSchema>;

interface InitiativeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    initiative: Omit<InsertInitiative, 'keyResultId' | 'createdBy'>;
    successMetrics: Omit<InsertSuccessMetric, 'initiativeId'>[];
  }) => void;
  keyResultId: string;
  users: User[];
  isLoading?: boolean;
}

const statusOptions = [
  { value: "not_started", label: "Belum Dimulai" },
  { value: "in_progress", label: "Berlangsung" },
  { value: "completed", label: "Selesai" },
  { value: "on_hold", label: "Ditunda" },
  { value: "cancelled", label: "Dibatalkan" },
];

const priorityOptions = [
  { value: "low", label: "Rendah" },
  { value: "medium", label: "Sedang" },
  { value: "high", label: "Tinggi" },
  { value: "critical", label: "Kritis" },
];

const metricTypeOptions = [
  { value: "increase_to", label: "Naik ke Target", icon: TrendingUp },
  { value: "decrease_to", label: "Turun ke Target", icon: TrendingDown },
  { value: "achieve_or_not", label: "Tercapai atau Tidak", icon: Target },
  { value: "should_stay_above", label: "Tetap Di Atas", icon: MoveUp },
  { value: "should_stay_below", label: "Tetap Di Bawah", icon: MoveDown },
];

const unitOptions = [
  { value: "number", label: "Angka" },
  { value: "percentage", label: "Persentase (%)" },
  { value: "currency", label: "Mata Uang (Rp)" },
  { value: "days", label: "Hari" },
  { value: "hours", label: "Jam" },
  { value: "users", label: "Pengguna" },
  { value: "downloads", label: "Unduhan" },
  { value: "views", label: "Tampilan" },
];

export default function InitiativeFormModal({
  isOpen,
  onClose,
  onSubmit,
  keyResultId,
  users,
  isLoading = false,
}: InitiativeFormModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [initiativeData, setInitiativeData] = useState<InitiativeInfoData | null>(null);
  const [successMetrics, setSuccessMetrics] = useState<SuccessMetricData[]>([]);

  // Form for step 1
  const initiativeForm = useForm<InitiativeInfoData>({
    resolver: zodResolver(initiativeInfoSchema),
    defaultValues: {
      title: "",
      description: "",
      targetContribution: "",
      picId: "",
    },
  });

  // Form for step 2 metric
  const metricForm = useForm<SuccessMetricData>({
    resolver: zodResolver(successMetricSchema),
    defaultValues: {
      type: "increase_to",
      unit: "number",
    },
  });

  const handleStep1Submit = (data: InitiativeInfoData) => {
    setInitiativeData(data);
    setCurrentStep(2);
  };

  const handleAddMetric = (data: SuccessMetricData) => {
    setSuccessMetrics([...successMetrics, data]);
    metricForm.reset({
      type: "increase_to",
      unit: "number",
    });
  };

  const handleRemoveMetric = (index: number) => {
    setSuccessMetrics(successMetrics.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = () => {
    if (!initiativeData) return;

    const processedInitiative = {
      title: initiativeData.title,
      description: initiativeData.description || null,
      status: "not_started",
      priority: "medium",
      picId: initiativeData.picId || null,
      startDate: initiativeData.startDate || null,
      dueDate: initiativeData.dueDate || null,
      budget: initiativeData.targetContribution || null,
      progressPercentage: 0,
      keyResultId,
    };

    const processedMetrics = successMetrics.map(metric => ({
      title: metric.title,
      description: metric.description || null,
      type: metric.type,
      baseValue: metric.baseValue ? parseFormattedNumber(metric.baseValue).toString() : null,
      targetValue: parseFormattedNumber(metric.targetValue).toString(),
      currentValue: "0",
      unit: metric.unit,
      status: "not_started" as const,
      dueDate: metric.dueDate || null,
    }));

    onSubmit({
      initiative: processedInitiative,
      successMetrics: processedMetrics,
    });
  };

  const handleClose = () => {
    setCurrentStep(1);
    setInitiativeData(null);
    setSuccessMetrics([]);
    initiativeForm.reset();
    metricForm.reset();
    onClose();
  };

  const getMetricTypeIcon = (type: string) => {
    const option = metricTypeOptions.find(opt => opt.value === type);
    return option ? option.icon : Target;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Buat Rencana Baru
            <Badge variant="outline" className="ml-auto">
              Langkah {currentStep} dari 2
            </Badge>
          </DialogTitle>
        </DialogHeader>

        

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Inisiatif</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Isi informasi dasar tentang inisiatif yang akan Anda buat.
              </p>
            </CardHeader>
            <CardContent>
              <Form {...initiativeForm}>
                <form onSubmit={initiativeForm.handleSubmit(handleStep1Submit)} className="space-y-4">
                  <FormField
                    control={initiativeForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Inisiatif *</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan nama inisiatif..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={initiativeForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tujuan Inisiatif *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Jelaskan tujuan inisiatif ini..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={initiativeForm.control}
                    name="targetContribution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Kontribusi Ke Angka Target</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Masukkan kontribusi target..."
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value);
                              // Show difference calculation here if needed
                            }}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500 mt-1">
                          Berapa kontribusi inisiatif ini terhadap pencapaian angka target
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={initiativeForm.control}
                    name="picId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Penanggung Jawab *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih penanggung jawab" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={initiativeForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Tanggal Mulai *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Pilih tanggal mulai</span>
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
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={initiativeForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Tanggal Selesai *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Pilih tanggal selesai</span>
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

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleClose}>
                      Batal
                    </Button>
                    <Button type="submit">
                      Lanjut ke Metrik <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Metrik Keberhasilan
                  <Badge variant="outline">
                    {successMetrics.length} metrik ditambahkan
                  </Badge>
                </CardTitle>
                {/* Penjelasan Success Metrics */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                  <h4 className="font-semibold text-green-900 mb-2">📊 Mengapa Perlu Metrik Keberhasilan?</h4>
                  <p className="text-sm text-green-800 mb-2">
                    Metrik keberhasilan adalah cara untuk mengukur apakah rencana Anda benar-benar efektif dalam mencapai tujuan. 
                    Tanpa metrik, Anda tidak akan tahu apakah rencana berhasil atau gagal.
                  </p>
                  <div className="text-sm text-green-700">
                    <strong>Tips:</strong> Buat minimal 1-3 metrik per rencana dengan target yang spesifik dan terukur.
                    <br />
                    <strong>Contoh:</strong> Untuk rencana "Kampanye Media Sosial" → Metrik "Jumlah Engagement" target 10.000
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...metricForm}>
                  <form onSubmit={metricForm.handleSubmit(handleAddMetric)} className="space-y-4">
                    <FormField
                      control={metricForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Judul Metrik *</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: Jumlah Engagement, Jumlah Lead, Tingkat Konversi..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={metricForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deskripsi Metrik</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Deskripsi metrik..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={metricForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipe Metrik</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih tipe metrik" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {metricTypeOptions.map((option) => {
                                  const Icon = option.icon;
                                  return (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4" />
                                        {option.label}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={metricForm.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {unitOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Conditional fields based on metric type */}
                    {metricForm.watch("type") !== "achieve_or_not" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(metricForm.watch("type") === "increase_to" || metricForm.watch("type") === "decrease_to") && (
                          <FormField
                            control={metricForm.control}
                            name="baseValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nilai Awal</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => {
                                      const formatted = formatNumberInput(e.target.value);
                                      field.onChange(formatted);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={metricForm.control}
                          name="targetValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nilai Target *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => {
                                    const formatted = formatNumberInput(e.target.value);
                                    field.onChange(formatted);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <FormField
                      control={metricForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Tanggal Target Metrik</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
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

                    <Button type="submit" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Metrik
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Display added metrics */}
            {successMetrics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metrik yang Ditambahkan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {successMetrics.map((metric, index) => {
                      const Icon = getMetricTypeIcon(metric.type);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <Icon className="w-5 h-5 text-blue-600" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{metric.title}</h4>
                              <p className="text-sm text-gray-600 truncate">
                                {metric.description || "Tidak ada deskripsi"}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {metricTypeOptions.find(opt => opt.value === metric.type)?.label}
                                </Badge>
                                {metric.type !== "achieve_or_not" && (
                                  <span>
                                    Target: {metric.targetValue} {unitOptions.find(u => u.value === metric.unit)?.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMetric(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Kembali
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Batal
                </Button>
                <Button
                  onClick={handleFinalSubmit}
                  disabled={isLoading || !initiativeData}
                >
                  {isLoading ? "Menyimpan..." : "Buat Rencana"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}