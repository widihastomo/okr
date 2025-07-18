import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronsUpDown, Check, HelpCircle, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { KeyResult } from "@shared/schema";
import { SearchableUserSelect } from "@/components/ui/searchable-user-select";


// Unit options for Key Results
const unitOptions = [
  "Rp", // Rupiah (currency)
  "%", // Percentage
  "orang", // People
  "hari", // Days
  "bulan", // Months
  "unit", // Generic units
  "buah", // Pieces
  "rating", // Rating
  "skor", // Score
  "ton", // Tons
  "kg", // Kilograms
  "meter", // Meters
  "jam", // Hours
  "minggu", // Weeks
  "tahun", // Years
];

const editKeyResultSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  currentValue: z.string().optional(), // Optional since achieve_or_not doesn't need this
  targetValue: z.string().optional(), // Optional since achieve_or_not doesn't need this  
  baseValue: z.string().optional(),
  unit: z.string().optional(),
  keyResultType: z.enum(["increase_to", "decrease_to", "achieve_or_not", "should_stay_above", "should_stay_below"]),
  status: z.enum(["on_track", "at_risk", "behind", "completed", "in_progress", "ahead", "not_started"]),
  assignedTo: z.string().optional(),
}).refine((data) => {
  // Dynamic validation based on key result type
  if (data.keyResultType === "achieve_or_not") {
    return true; // No value fields required for binary type
  }
  
  if (data.keyResultType === "should_stay_above" || data.keyResultType === "should_stay_below") {
    return data.targetValue && data.targetValue.length > 0; // Only target required for threshold types
  }
  
  // For increase_to and decrease_to, target and current are required
  return data.targetValue && data.targetValue.length > 0 && 
         data.currentValue && data.currentValue.length > 0;
}, {
  message: "Required fields are missing based on key result type",
  path: ["targetValue"] // Point to targetValue as the main field
}).refine((data) => {
  // Logical validation for different key result types
  if (data.keyResultType === "achieve_or_not") {
    return true; // No numerical validation needed for binary type
  }

  // Skip validation for should_stay types  
  if (data.keyResultType === "should_stay_above" || data.keyResultType === "should_stay_below") {
    return true;
  }

  // Only validate if both base and target values exist and are not empty
  if (!data.baseValue || !data.targetValue || data.baseValue.trim() === '' || data.targetValue.trim() === '') {
    return true; // Skip validation if values are missing
  }

  // Parse numbers after removing thousand separators
  const base = parseFloat(data.baseValue.replace(/[.,]/g, ''));
  const target = parseFloat(data.targetValue.replace(/[.,]/g, ''));

  // Skip validation if parsing fails
  if (isNaN(base) || isNaN(target)) {
    return true;
  }

  if (data.keyResultType === "increase_to") {
    // For increase_to: base < target (we want to increase from base to target)
    if (base >= target) {
      return false; // Base should be less than target for increase
    }
  }

  if (data.keyResultType === "decrease_to") {
    // For decrease_to: base > target (we want to decrease from base to target)
    if (base <= target) {
      return false; // Base should be greater than target for decrease
    }
  }

  return true;
}, {
  message: "Nilai tidak logis: untuk 'Naik ke Target' nilai awal harus lebih kecil dari target, untuk 'Turun ke Target' nilai awal harus lebih besar dari target",
  path: ["baseValue"]
});

type EditKeyResultFormData = z.infer<typeof editKeyResultSchema>;

interface EditKeyResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyResult?: KeyResult;
  objectiveId?: string;
  onSuccess?: () => void;
}

export default function EditKeyResultModal({
  open,
  onOpenChange,
  keyResult,
  objectiveId,
  onSuccess,
}: EditKeyResultModalProps) {

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get users for assignee selection
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return response.json();
    },
  });

  // Get check-in count for this key result
  const { data: checkInData } = useQuery({
    queryKey: ["/api/key-results", keyResult?.id, "check-ins", "count"],
    queryFn: async () => {
      if (!keyResult?.id) return { count: 0 };
      const response = await apiRequest("GET", `/api/key-results/${keyResult.id}/check-ins/count`);
      return response.json();
    },
    enabled: !!keyResult?.id,
  });

  const form = useForm<EditKeyResultFormData>({
    resolver: zodResolver(editKeyResultSchema),
    values: keyResult ? {
      title: keyResult.title,
      description: keyResult.description || "",
      currentValue: keyResult.currentValue ? new Intl.NumberFormat('id-ID').format(parseFloat(keyResult.currentValue)) : "",
      targetValue: keyResult.targetValue ? new Intl.NumberFormat('id-ID').format(parseFloat(keyResult.targetValue)) : "",
      baseValue: keyResult.baseValue ? new Intl.NumberFormat('id-ID').format(parseFloat(keyResult.baseValue)) : "",
      unit: keyResult.unit || "",
      keyResultType: keyResult.keyResultType as "increase_to" | "decrease_to" | "achieve_or_not" | "should_stay_above" | "should_stay_below",
      status: keyResult.status as "on_track" | "at_risk" | "behind" | "completed" | "in_progress",
      assignedTo: keyResult.assignedTo || undefined,

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
        title: "Angka Target berhasil diperbarui",
        description: "Perubahan telah disimpan.",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      
      // Invalidate specific key result query
      if (keyResult?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/key-results", keyResult.id] });
      }
      
      // If we have objective ID, invalidate the specific Goal detail query
      const targetObjectiveId = keyResult?.objectiveId || objectiveId;
      if (targetObjectiveId) {
        queryClient.invalidateQueries({ queryKey: ["/api/goals", targetObjectiveId] });
        queryClient.invalidateQueries({ queryKey: ["/api/objectives", targetObjectiveId, "activity-log"] });
        queryClient.invalidateQueries({ queryKey: [`/api/goals/${targetObjectiveId}`] });
      }
      
      // Force refetch with active type
      queryClient.invalidateQueries({ 
        queryKey: ["/api/goals"], 
        refetchType: 'active' 
      });
      
      onOpenChange(false);
      form.reset();
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui Angka Target",
        description: error.message || "Terjadi kesalahan saat memperbarui Angka Target.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditKeyResultFormData) => {
    // Parse numeric values properly before submission
    const parsedData = {
      ...data,
      baseValue: data.baseValue ? data.baseValue.replace(/[.,]/g, '') : undefined,
      targetValue: data.targetValue ? data.targetValue.replace(/[.,]/g, '') : undefined,
      currentValue: data.currentValue ? data.currentValue.replace(/[.,]/g, '') : undefined,
    };
    
    console.log("Submitting edit key result data:", JSON.stringify(parsedData, null, 2));
    updateKeyResultMutation.mutate(parsedData);
  };

  // Watch for key result type changes and clear validation errors
  const watchedKeyResultType = form.watch("keyResultType");
  useEffect(() => {
    // Clear validation errors when type changes
    form.clearErrors("baseValue");
    form.clearErrors("targetValue");
    form.clearErrors("currentValue");
  }, [watchedKeyResultType, form]);

  const formatNumberInput = (value: string | undefined) => {
    if (!value) return '';
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
          <DialogTitle>Edit Angka Target</DialogTitle>
          <DialogDescription>
            Ubah detail Angka Target termasuk target, status, dan informasi lainnya.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Informasi Angka Target */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 mb-2">
                          Judul Angka Target
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="inline-flex">
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" side="right" align="start" sideOffset={10}>
                              <div className="text-sm">
                                <p className="font-medium mb-2">Judul Angka Target</p>
                                <p>Buat judul yang spesifik dan terukur. Contoh: "Meningkatkan pendapatan bulanan menjadi 100 juta", "Menurunkan biaya operasional ke 50 juta", "Mencapai 90% kepuasan pelanggan".</p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
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
                        <FormLabel className="flex items-center gap-2 mb-2">
                          Deskripsi (Opsional)
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="inline-flex">
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" side="right" align="start" sideOffset={10}>
                              <div className="text-sm">
                                <p className="font-medium mb-2">Deskripsi Angka Target</p>
                                <p>Jelaskan konteks dan detail penting tentang ukuran keberhasilan ini. Apa yang akan diukur, bagaimana cara mengukurnya, dan mengapa ini penting untuk mencapai goal.</p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Deskripsi detail tentang Angka Target ini..."
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Penanggung Jawab */}
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 mb-2">
                          Penanggung Jawab (Opsional)
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="inline-flex">
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" side="right" align="start" sideOffset={10}>
                              <div className="text-sm">
                                <p className="font-medium mb-2">Penanggung Jawab</p>
                                <p>Pilih orang yang bertanggung jawab untuk mencapai Angka Target ini. Penanggung jawab akan menerima notifikasi dan update terkait progress.</p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <SearchableUserSelect
                          users={users?.filter(user => user.isActive === true) || []}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Pilih penanggung jawab"
                          allowUnassigned={true}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tipe Angka Target dan Nilai */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="keyResultType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 mb-2">
                            Tipe Angka Target
                            <Popover>
                              <PopoverTrigger asChild>
                                <button type="button" className="inline-flex">
                                  <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" side="right" align="start" sideOffset={10}>
                                <div className="text-sm">
                                  <p className="font-medium mb-2">Tipe Angka Target</p>
                                  <p className="mb-2">Pilih tipe sesuai cara pengukuran:</p>
                                  <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li><strong>Naik ke Target:</strong> Nilai meningkat dari baseline ke target</li>
                                    <li><strong>Turun ke Target:</strong> Nilai menurun dari baseline ke target</li>
                                    <li><strong>Tetap Di Atas:</strong> Nilai harus selalu di atas threshold</li>
                                    <li><strong>Tetap Di Bawah:</strong> Nilai harus selalu di bawah threshold</li>
                                    <li><strong>Ya/Tidak:</strong> Target tercapai atau tidak (binary)</li>
                                  </ul>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </FormLabel>
                          {(checkInData?.count || 0) > 0 ? (
                            <div className="space-y-2">
                              <Input
                                value={
                                  field.value === "increase_to" ? "Naik ke (Increase To)" :
                                  field.value === "decrease_to" ? "Turun ke (Decrease To)" :
                                  field.value === "should_stay_above" ? "Harus tetap di atas (Stay Above)" :
                                  field.value === "should_stay_below" ? "Harus tetap di bawah (Stay Below)" :
                                  field.value === "achieve_or_not" ? "Ya/Tidak (Achieve or Not)" :
                                  field.value
                                }
                                disabled
                                className="bg-gray-100 text-gray-500"
                              />
                              <p className="text-xs text-gray-500">
                                Tipe tidak dapat diubah karena sudah ada {checkInData.count} check-in yang tercatat.
                              </p>
                            </div>
                          ) : (
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
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Unit - Hide for achieve_or_not type */}
                    {form.watch("keyResultType") !== "achieve_or_not" && (
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 mb-2">
                              Unit (Opsional)
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button type="button" className="inline-flex">
                                    <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" side="right" align="start" sideOffset={10}>
                                  <div className="text-sm">
                                    <p className="font-medium mb-2">Unit Pengukuran</p>
                                    <p className="mb-2">Pilih unit yang sesuai dengan nilai yang diukur:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                      <li><strong>Rp:</strong> Untuk nilai uang/finansial</li>
                                      <li><strong>%:</strong> Untuk persentase</li>
                                      <li><strong>orang:</strong> Untuk jumlah orang</li>
                                      <li><strong>rating/skor:</strong> Untuk penilaian</li>
                                      <li><strong>unit/buah:</strong> Untuk hitungan item</li>
                                      <li>Atau ketik unit custom lainnya</li>
                                    </ul>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value || "Pilih atau ketik unit..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput 
                                    placeholder="Cari atau ketik unit baru..." 
                                    onValueChange={(value: string) => {
                                      if (value && !unitOptions.includes(value)) {
                                        field.onChange(value);
                                      }
                                    }}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      <Button
                                        variant="ghost"
                                        className="w-full text-left justify-start h-auto p-2"
                                        onClick={() => {
                                          const input = document.querySelector('[placeholder="Cari atau ketik unit baru..."]') as HTMLInputElement;
                                          if (input && input.value) {
                                            field.onChange(input.value);
                                          }
                                        }}
                                      >
                                        Tambah unit baru
                                      </Button>
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {unitOptions.map((unit: string) => (
                                        <CommandItem
                                          value={unit}
                                          key={unit}
                                          onSelect={() => {
                                            field.onChange(unit);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              unit === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          {unit}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
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
                                <FormLabel className="flex items-center gap-2 mb-2">
                                  Target
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button type="button" className="inline-flex">
                                        <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80" side="right" align="start" sideOffset={10}>
                                      <div className="text-sm">
                                        <p className="font-medium mb-2">Target (Threshold)</p>
                                        <p>Nilai ambang batas yang harus dipertahankan. Untuk "tetap di atas", nilai harus selalu ≥ target. Untuk "tetap di bawah", nilai harus selalu ≤ target.</p>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="100"
                                    required
                                    value={formatNumberInput(field.value || '')}
                                    onChange={(e) => field.onChange(parseNumberInput(e.target.value) || '')}
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
                              <FormLabel className="flex items-center gap-2 mb-2">
                                Nilai Awal
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="inline-flex">
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" side="right" align="start" sideOffset={10}>
                              <div className="text-sm">
                                <p className="font-medium mb-2">Nilai Awal (Baseline)</p>
                                <p>Titik awal pengukuran sebelum periode dimulai. Contoh: jika target meningkatkan penjualan dari 50 juta ke 100 juta, maka 50 juta adalah nilai awal.</p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0"
                            value={field.value ? formatNumberInput(field.value) : ''}
                            onChange={(e) => field.onChange(parseNumberInput(e.target.value) || '')}
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
                        <FormLabel className="flex items-center gap-2 mb-2">
                          Target
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="inline-flex">
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" side="right" align="start" sideOffset={10}>
                              <div className="text-sm">
                                <p className="font-medium mb-2">Target</p>
                                <p>Nilai yang ingin dicapai di akhir periode. Harus ambisius namun realistis. Contoh: meningkatkan penjualan ke 100 juta, menurunkan biaya ke 30 juta, atau mencapai 95% kepuasan pelanggan.</p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="100"
                            required
                            value={formatNumberInput(field.value)}
                            onChange={(e) => field.onChange(parseNumberInput(e.target.value) || '')}
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
                        <FormLabel className="flex items-center gap-2 mb-2">
                          Nilai Saat Ini
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="inline-flex">
                                <HelpCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" side="right" align="start" sideOffset={10}>
                              <div className="text-sm">
                                <p className="font-medium mb-2">Nilai Saat Ini</p>
                                <p>Nilai terkini dari pengukuran ini. Akan terus diperbarui melalui check-in berkala untuk melacak kemajuan menuju target.</p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="50"
                            required
                            value={formatNumberInput(field.value)}
                            onChange={(e) => field.onChange(parseNumberInput(e.target.value) || '')}
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

            

                </div>
              </CardContent>
            </Card>

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
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
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