import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatNumberWithSeparator, handleNumberInputChange, getNumberValueForSubmission } from "@/lib/number-utils";
import type { KeyResult } from "@shared/schema";

const updateProgressSchema = z.object({
  currentValue: z.string().min(1, "Current value is required"),
  status: z.enum(["on_track", "at_risk", "completed", "in_progress"]),
});

type UpdateProgressFormData = z.infer<typeof updateProgressSchema>;

interface EditProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyResult?: KeyResult;
  onSuccess: () => void;
}

export default function EditProgressModal({
  open,
  onOpenChange,
  keyResult,
  onSuccess,
}: EditProgressModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UpdateProgressFormData>({
    resolver: zodResolver(updateProgressSchema),
    values: keyResult ? {
      currentValue: keyResult.currentValue,
      status: keyResult.status as any,
    } : undefined,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: UpdateProgressFormData) => {
      if (!keyResult) throw new Error("Key result not found");
      
      const response = await apiRequest(
        "PATCH",
        `/api/key-results/${keyResult.id}/progress`,
        {
          currentValue: parseFloat(data.currentValue),
          status: data.status,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Progress updated successfully",
      });
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateProgressFormData) => {
    // Convert formatted value to numeric before submitting
    const processedData = {
      ...data,
      currentValue: data.currentValue ? getNumberValueForSubmission(data.currentValue) : "",
    };
    
    updateProgressMutation.mutate(processedData);
  };

  const calculateProgress = (current: string, target: string, keyResultType: string, baseValue?: string | null): number => {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target || "1");
    
    switch (keyResultType) {
      case "increase_to":
        // Formula: (Current - Base) / (Target - Base) * 100%
        const baseNum = baseValue ? parseFloat(baseValue) : 0;
        if (targetNum <= baseNum) return 0; // Invalid configuration
        return Math.min(100, Math.max(0, ((currentNum - baseNum) / (targetNum - baseNum)) * 100));
        
      case "decrease_to":
        // Progress = ((Base Value - Current) / (Base Value - Target)) * 100%
        const decreaseBaseNum = baseValue && baseValue !== null ? parseFloat(baseValue) : targetNum * 2; // Default base value if not provided
        if (decreaseBaseNum <= targetNum) return currentNum <= targetNum ? 100 : 0; // Invalid base value case
        const decreaseProgress = ((decreaseBaseNum - currentNum) / (decreaseBaseNum - targetNum)) * 100;
        return Math.min(100, Math.max(0, decreaseProgress));
        
      case "should_stay_above":
        // Binary: 100% if current >= target (staying above threshold), 0% otherwise
        return currentNum >= targetNum ? 100 : 0;
        
      case "should_stay_below":
        // Binary: 100% if current <= target (staying below threshold), 0% otherwise
        return currentNum <= targetNum ? 100 : 0;
        
      case "achieve_or_not":
        // Binary: 100% if current >= target, 0% otherwise
        return currentNum >= targetNum ? 100 : 0;
        
      default:
        return 0;
    }
  };

  const currentProgress = keyResult 
    ? calculateProgress(form.watch("currentValue") || keyResult.currentValue, keyResult.targetValue, keyResult.keyResultType, keyResult.baseValue)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Progress</DialogTitle>
          <DialogDescription>
            Update nilai progress dan status untuk key result ini.
          </DialogDescription>
        </DialogHeader>

        {keyResult && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-gray-900">{keyResult.title}</h3>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    {keyResult.keyResultType === "increase_to" && "↗ Increase to"}
                    {keyResult.keyResultType === "decrease_to" && "↘ Decrease to"}
                    {keyResult.keyResultType === "achieve_or_not" && "✓ Achieve"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{keyResult.description}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(currentProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, currentProgress)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Target: {keyResult.targetValue}</span>
                  <span>{keyResult.unit}</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter current value"
                        value={field.value || ""}
                        onChange={(e) => {
                          handleNumberInputChange(e.target.value, (formattedValue) => {
                            field.onChange(formattedValue); // Store formatted value directly
                          });
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProgressMutation.isPending}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                >
                  {updateProgressMutation.isPending ? "Updating..." : "Update Progress"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
