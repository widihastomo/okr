import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCycleSchema } from "@shared/schema";

const createCycleFormSchema = insertCycleSchema.extend({
  type: z.enum(["quarterly", "annual"]),
});

type CreateCycleFormData = z.infer<typeof createCycleFormSchema>;

interface CreateCycleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateCycleModal({ open, onOpenChange, onSuccess }: CreateCycleModalProps) {
  const { toast } = useToast();
  
  const form = useForm<CreateCycleFormData>({
    resolver: zodResolver(createCycleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "quarterly",
      startDate: "",
      endDate: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateCycleFormData) => {
      const response = await apiRequest('POST', '/api/cycles', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Cycle created successfully",
      });
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create cycle",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCycleFormData) => {
    mutation.mutate(data);
  };

  const handleTypeChange = (type: "quarterly" | "annual") => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    if (type === "quarterly") {
      const quarter = Math.floor(currentMonth / 3) + 1;
      const quarterStart = new Date(currentYear, (quarter - 1) * 3, 1);
      const quarterEnd = new Date(currentYear, quarter * 3, 0);
      
      form.setValue("name", `Q${quarter} ${currentYear}`);
      form.setValue("startDate", quarterStart.toISOString().split('T')[0]);
      form.setValue("endDate", quarterEnd.toISOString().split('T')[0]);
    } else {
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);
      
      form.setValue("name", `Annual ${currentYear}`);
      form.setValue("startDate", yearStart.toISOString().split('T')[0]);
      form.setValue("endDate", yearEnd.toISOString().split('T')[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Create New Cycle</DialogTitle>
          <DialogDescription className="text-sm">
            Create a new OKR cycle for your organization
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleTypeChange(value as "quarterly" | "annual");
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cycle type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Q1 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of this cycle's focus"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
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
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                {mutation.isPending ? "Creating..." : "Create Cycle"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}