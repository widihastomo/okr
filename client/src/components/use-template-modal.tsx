import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { createOKRFromTemplateSchema } from "@shared/schema";
import type { Template, Cycle } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

const useTemplateFormSchema = createOKRFromTemplateSchema;

type UseTemplateFormData = z.infer<typeof useTemplateFormSchema>;

interface UseTemplateModalProps {
  open: boolean;
  template?: Template;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function UseTemplateModal({ open, template, onOpenChange, onSuccess }: UseTemplateModalProps) {
  const { toast } = useToast();
  
  const form = useForm<UseTemplateFormData>({
    resolver: zodResolver(useTemplateFormSchema),
    defaultValues: {
      templateId: template?.id || 0,
      cycleId: 0,
    },
  });

  const { data: cycles = [] } = useQuery<Cycle[]>({
    queryKey: ["/api/cycles"],
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async (data: UseTemplateFormData) => {
      const response = await apiRequest('POST', '/api/templates/use', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "OKRs created from template successfully",
      });
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create OKRs from template",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UseTemplateFormData) => {
    mutation.mutate({
      ...data,
      templateId: template?.id || 0,
    });
  };

  if (!template) return null;

  let objectives = [];
  try {
    objectives = JSON.parse(template.objectives);
  } catch (e) {
    objectives = [];
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Use Template: {template.name}</DialogTitle>
          <DialogDescription>
            Select a cycle to create OKRs from this template
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Template Preview:</h4>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Type:</strong> {template.type}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Objectives:</strong> {objectives.length}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Key Results:</strong> {objectives.reduce((total: number, obj: any) => 
                  total + (obj.keyResults?.length || 0), 0
                )}
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cycleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Cycle</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cycles.map((cycle: Cycle) => (
                          <SelectItem key={cycle.id} value={cycle.id.toString()}>
                            {cycle.name} ({cycle.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  {mutation.isPending ? "Creating..." : "Create OKRs"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}