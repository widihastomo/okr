import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
    updateProgressMutation.mutate(data);
  };

  const calculateProgress = (current: string, target: string, keyResultType: string): number => {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target || "1");
    
    switch (keyResultType) {
      case "increase_to":
        // Progress = (current / target) * 100, capped at 100%
        if (targetNum === 0) return 0;
        return Math.min(100, Math.max(0, (currentNum / targetNum) * 100));
        
      case "decrease_to":
        // Progress = 100% when current <= target, decreasing as current exceeds target
        if (currentNum <= targetNum) return 100;
        // Calculate how much we've exceeded the target and reduce progress
        const excessRatio = (currentNum - targetNum) / targetNum;
        return Math.max(0, 100 - (excessRatio * 100));
        
      case "achieve_or_not":
        // Binary: 100% if current >= target, 0% otherwise
        return currentNum >= targetNum ? 100 : 0;
        
      default:
        return 0;
    }
  };

  const currentProgress = keyResult 
    ? calculateProgress(form.watch("currentValue") || keyResult.currentValue, keyResult.targetValue, keyResult.keyResultType)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Progress</DialogTitle>
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
                        type="number"
                        step="0.01"
                        placeholder="Enter current value"
                        {...field}
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
                  className="bg-primary hover:bg-blue-700"
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
