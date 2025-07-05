import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Target, MoveUp, MoveDown, Activity, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumberInput, parseFormattedNumber } from "@/lib/number-utils";
import type { SuccessMetricWithUpdates } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const metricUpdateSchema = z.object({
  value: z.string().min(1, "Nilai wajib diisi"),
  notes: z.string().optional(),
  confidence: z.number().min(1).max(10).default(5),
});

type MetricUpdateFormData = z.infer<typeof metricUpdateSchema>;

interface MetricUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { metricId: string; value: string; notes?: string; confidence: number }) => void;
  metric: SuccessMetricWithUpdates | null;
  isLoading?: boolean;
}

export function MetricUpdateModal({
  isOpen,
  onClose,
  onSubmit,
  metric,
  isLoading = false
}: MetricUpdateModalProps) {
  const form = useForm<MetricUpdateFormData>({
    resolver: zodResolver(metricUpdateSchema),
    defaultValues: {
      value: "",
      notes: "",
      confidence: 5,
    },
  });

  const getMetricTypeIcon = (type: string) => {
    switch (type) {
      case "increase_to":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "decrease_to":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "achieve_or_not":
        return <Target className="w-4 h-4 text-blue-600" />;
      case "should_stay_above":
        return <MoveUp className="w-4 h-4 text-orange-600" />;
      case "should_stay_below":
        return <MoveDown className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case "increase_to":
        return "Nilai harus naik menuju target";
      case "decrease_to":
        return "Nilai harus turun menuju target";
      case "achieve_or_not":
        return "Tercapai atau tidak tercapai";
      case "should_stay_above":
        return "Nilai harus tetap di atas ambang batas";
      case "should_stay_below":
        return "Nilai harus tetap di bawah ambang batas";
      default:
        return "Metrik umum";
    }
  };

  const formatValue = (value: string | number, unit: string): string => {
    const numValue = Number(value);
    if (unit === "currency") {
      return `Rp ${formatNumberInput(numValue.toString())}`;
    }
    if (unit === "percentage") {
      return `${numValue}%`;
    }
    return formatNumberInput(numValue.toString());
  };

  const calculateNewProgress = (newValue: string): number => {
    if (!metric) return 0;
    
    const current = parseFormattedNumber(newValue);
    const target = Number(metric.targetValue) || 0;
    const base = Number(metric.baseValue) || 0;

    if (metric.type === "achieve_or_not") {
      return current >= target ? 100 : 0;
    }

    if (metric.type === "increase_to" && target > base) {
      return Math.min(Math.max(((current - base) / (target - base)) * 100, 0), 100);
    }

    if (metric.type === "decrease_to" && base > target) {
      return Math.min(Math.max(((base - current) / (base - target)) * 100, 0), 100);
    }

    if (metric.type === "should_stay_above") {
      return current >= target ? 100 : 0;
    }

    if (metric.type === "should_stay_below") {
      return current <= target ? 100 : 0;
    }

    return 0;
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence <= 3) return "Rendah";
    if (confidence <= 7) return "Sedang";
    return "Tinggi";
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence <= 3) return "text-red-600";
    if (confidence <= 7) return "text-yellow-600";
    return "text-green-600";
  };

  const handleSubmit = (data: MetricUpdateFormData) => {
    if (!metric) return;

    const numericValue = parseFormattedNumber(data.value);
    onSubmit({
      metricId: metric.id,
      value: numericValue.toString(),
      notes: data.notes || undefined,
      confidence: data.confidence,
    });

    form.reset();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const watchedValue = form.watch("value");
  const watchedConfidence = form.watch("confidence");
  const newProgress = watchedValue ? calculateNewProgress(watchedValue) : 0;

  if (!metric) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getMetricTypeIcon(metric.type)}
            Update Metrik: {metric.title}
          </DialogTitle>
          <DialogDescription>
            {getTypeDescription(metric.type)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Metric Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Informasi Metrik Saat Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {metric.baseValue !== null && (
                  <div>
                    <div className="text-gray-600">Nilai Awal</div>
                    <div className="font-medium">{formatValue(metric.baseValue || 0, metric.unit)}</div>
                  </div>
                )}
                <div>
                  <div className="text-gray-600">Nilai Saat Ini</div>
                  <div className="font-medium text-blue-600">{formatValue(metric.currentValue || 0, metric.unit)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Target</div>
                  <div className="font-medium text-green-600">{formatValue(metric.targetValue, metric.unit)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Value Input */}
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nilai Baru</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type="text"
                          placeholder={`Masukkan nilai baru...`}
                          onChange={(e) => {
                            const formattedValue = formatNumberInput(e.target.value);
                            field.onChange(formattedValue);
                          }}
                        />
                        {metric.unit === "currency" && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">Rp</span>
                          </div>
                        )}
                        {metric.unit === "percentage" && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">%</span>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Progress Preview */}
              {watchedValue && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-blue-700 font-medium">Preview Progress</span>
                      <span className="text-blue-900 font-bold">{newProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(newProgress, 100)}%` }}
                      />
                    </div>
                    {newProgress >= 100 && (
                      <div className="flex items-center gap-1 mt-2 text-green-700 text-sm">
                        <Target className="w-4 h-4" />
                        <span className="font-medium">Target tercapai!</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Confidence Level */}
              <FormField
                control={form.control}
                name="confidence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>Tingkat Keyakinan</span>
                      <Badge variant="outline" className={getConfidenceColor(watchedConfidence)}>
                        {getConfidenceLabel(watchedConfidence)} ({watchedConfidence}/10)
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <div className="px-3">
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          min={1}
                          max={10}
                          step={1}
                          className="py-4"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1 - Sangat Rendah</span>
                          <span>5 - Sedang</span>
                          <span>10 - Sangat Tinggi</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tambahkan konteks, penjelasan, atau observasi tentang update ini..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Menyimpan..." : "Simpan Update"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}