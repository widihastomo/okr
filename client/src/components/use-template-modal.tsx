import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { createOKRFromTemplateSchema } from "@shared/schema";
import type { Template, Cycle } from "@shared/schema";

const useTemplateFormSchema = createOKRFromTemplateSchema.extend({
  cycleId: z.number().min(1, "Please select a cycle"),
});

type UseTemplateFormData = z.infer<typeof useTemplateFormSchema>;

interface UseTemplateModalProps {
  open: boolean;
  template?: Template;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function UseTemplateModal({ open, template, onOpenChange, onSuccess }: UseTemplateModalProps) {
  const { toast } = useToast();

  const { data: cycles = [] } = useQuery({
    queryKey: ["/api/cycles"],
    queryFn: () => apiRequest("GET", "/api/cycles").then(res => res.json() as Promise<Cycle[]>),
    enabled: open
  });

  const form = useForm<UseTemplateFormData>({
    resolver: zodResolver(useTemplateFormSchema),
    defaultValues: {
      cycleId: 0,
      templateId: template?.id || 0,
    },
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: async (data: UseTemplateFormData) => {
      const response = await apiRequest("POST", `/api/templates/${data.templateId}/create-okr`, {
        cycleId: data.cycleId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "OKRs created from template successfully"
      });
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create OKRs from template",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: UseTemplateFormData) => {
    createFromTemplateMutation.mutate(data);
  };

  if (!template) return null;

  let objectives = [];
  try {
    objectives = JSON.parse(template.objectives);
  } catch (e) {
    objectives = [];
  }

  const availableCycles = cycles.filter(cycle => 
    cycle.type === template.type && cycle.status !== "completed"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Use Template: {template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Preview</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {template.type}
                </div>
                <div>
                  <span className="font-medium">Objectives:</span> {objectives.length}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Objectives to be created:</h4>
                {objectives.map((obj: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="font-medium text-sm">{obj.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Owner: {obj.owner} • {obj.keyResults?.length || 0} key results
                    </div>
                    {obj.description && (
                      <div className="text-xs text-gray-500 mt-1">{obj.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cycle Selection */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cycleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Target Cycle</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a cycle to create OKRs in" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCycles.map((cycle) => (
                          <SelectItem key={cycle.id} value={cycle.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{cycle.name}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({cycle.status})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {availableCycles.length === 0 && (
                      <div className="text-sm text-amber-600">
                        No available {template.type} cycles found. Create a new cycle first.
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createFromTemplateMutation.isPending || availableCycles.length === 0}
                  className="bg-primary hover:bg-blue-700"
                >
                  {createFromTemplateMutation.isPending ? "Creating..." : "Create OKRs"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}