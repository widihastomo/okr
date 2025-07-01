import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Target, Building, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTemplateSchema } from "@shared/schema";

const keyResultSchema = z.object({
  title: z.string().min(1, "Key result title is required"),
  type: z.enum(["increase_to", "decrease_to", "achieve_or_not"]),
  unit: z.enum(["number", "percentage", "currency"]),
  targetValue: z.string().min(1, "Target value is required"),
  baseValue: z.string().optional(),
});

const objectiveSchema = z.object({
  title: z.string().min(1, "Objective title is required"),
  description: z.string().optional(),
  keyResults: z.array(keyResultSchema).min(1, "At least one key result is required"),
});

const createTemplateFormSchema = insertTemplateSchema.extend({
  type: z.enum(["monthly", "quarterly", "annual"]),
  objectives: z.array(objectiveSchema).min(1, "At least one objective is required"),
});

type CreateTemplateFormData = z.infer<typeof createTemplateFormSchema>;

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateTemplateModal({ open, onOpenChange, onSuccess }: CreateTemplateModalProps) {
  const { toast } = useToast();
  
  const form = useForm<CreateTemplateFormData>({
    resolver: zodResolver(createTemplateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "monthly",
      isDefault: false,
      objectives: [{
        title: "",
        description: "",
        keyResults: [{
          title: "",
          type: "increase_to",
          unit: "number",
          targetValue: "",
          baseValue: "",
        }]
      }]
    },
  });

  const { fields: objectives, append: addObjective, remove: removeObjective } = useFieldArray({
    control: form.control,
    name: "objectives"
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateTemplateFormData) => {
      const templateData = {
        ...data,
        objectives: JSON.stringify(data.objectives)
      };
      
      const response = await apiRequest('POST', '/api/templates', templateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTemplateFormData) => {
    mutation.mutate(data);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "company": return Building;
      case "team": return Users;
      case "individual": return Target;
      default: return Target;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Create New Template</DialogTitle>
          <DialogDescription className="text-sm">
            Create a reusable OKR template for your organization
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Product Growth Template" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of this template"
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

            <Separator />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Objectives</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addObjective({
                    title: "",
                    description: "",
                    keyResults: [{
                      title: "",
                      type: "increase_to",
                      unit: "number",
                      targetValue: "",
                      baseValue: "",
                    }]
                  })}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Objective
                </Button>
              </div>

              {objectives.map((objective, objIndex) => (
                <ObjectiveTemplate
                  key={objective.id}
                  objIndex={objIndex}
                  form={form}
                  onRemove={() => removeObjective(objIndex)}
                  canRemove={objectives.length > 1}
                />
              ))}
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
                {mutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ObjectiveTemplate({ objIndex, form, onRemove, canRemove }: {
  objIndex: number;
  form: any;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { fields: keyResults, append: addKeyResult, remove: removeKeyResult } = useFieldArray({
    control: form.control,
    name: `objectives.${objIndex}.keyResults`
  });

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Objective {objIndex + 1}</CardTitle>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name={`objectives.${objIndex}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objective Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Increase Product Adoption" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`objectives.${objIndex}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional context for this objective"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Key Results</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addKeyResult({
                title: "",
                type: "increase_to",
                unit: "number",
                targetValue: "",
                baseValue: "",
              })}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Key Result
            </Button>
          </div>

          {keyResults.map((keyResult, krIndex) => (
            <div key={keyResult.id} className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ukuran Keberhasilan {krIndex + 1}</span>
                {keyResults.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKeyResult(krIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name={`objectives.${objIndex}.keyResults.${krIndex}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Increase monthly active users" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name={`objectives.${objIndex}.keyResults.${krIndex}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="increase_to">Increase To</SelectItem>
                          <SelectItem value="decrease_to">Decrease To</SelectItem>
                          <SelectItem value="achieve_or_not">Achieve or Not</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`objectives.${objIndex}.keyResults.${krIndex}.unit`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="currency">Currency</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`objectives.${objIndex}.keyResults.${krIndex}.targetValue`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Value</FormLabel>
                      <FormControl>
                        <Input placeholder="1000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`objectives.${objIndex}.keyResults.${krIndex}.baseValue`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Value (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Starting value" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}