import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertTemplateSchema } from "@shared/schema";

const keyResultTemplateSchema = z.object({
  title: z.string().min(1, "Key result title is required"),
  description: z.string().optional(),
  unit: z.string().default("number"),
  keyResultType: z.string().default("increase_to"),
});

const objectiveTemplateSchema = z.object({
  title: z.string().min(1, "Objective title is required"),
  description: z.string().optional(),
  owner: z.string().min(1, "Owner is required"),
  keyResults: z.array(keyResultTemplateSchema).min(1, "At least one key result is required"),
});

const createTemplateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  type: z.string().min(1, "Template type is required"),
  isDefault: z.boolean().default(false),
  objectives: z.array(objectiveTemplateSchema).min(1, "At least one objective is required"),
});

type CreateTemplateFormData = z.infer<typeof createTemplateFormSchema>;

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateTemplateModal({ open, onOpenChange, onSuccess }: CreateTemplateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateTemplateFormData>({
    resolver: zodResolver(createTemplateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "quarterly",
      isDefault: false,
      objectives: [{
        title: "",
        description: "",
        owner: "",
        keyResults: [{
          title: "",
          description: "",
          unit: "number",
          keyResultType: "increase_to",
        }]
      }],
    },
  });

  const { fields: objectiveFields, append: appendObjective, remove: removeObjective } = useFieldArray({
    control: form.control,
    name: "objectives",
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: CreateTemplateFormData) => {
      const templateData = {
        name: data.name,
        description: data.description || null,
        type: data.type,
        isDefault: data.isDefault,
        objectives: JSON.stringify(data.objectives)
      };
      const response = await apiRequest("POST", "/api/templates", templateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template created successfully"
      });
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CreateTemplateFormData) => {
    createTemplateMutation.mutate(data);
  };

  const addObjective = () => {
    appendObjective({
      title: "",
      description: "",
      owner: "",
      keyResults: [{
        title: "",
        description: "",
        unit: "number",
        keyResultType: "increase_to",
      }]
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Product Growth Template" {...field} />
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
                              <SelectValue placeholder="Select type" />
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
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this template is used for..."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Default Template</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Mark this as a default template for this type
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Objectives */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Objectives</CardTitle>
                  <Button type="button" onClick={addObjective} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Objective
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {objectiveFields.map((objective, objIndex) => (
                  <ObjectiveTemplate
                    key={objective.id}
                    objIndex={objIndex}
                    form={form}
                    onRemove={() => removeObjective(objIndex)}
                    canRemove={objectiveFields.length > 1}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTemplateMutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
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
  const { fields: keyResultFields, append: appendKeyResult, remove: removeKeyResult } = useFieldArray({
    control: form.control,
    name: `objectives.${objIndex}.keyResults`,
  });

  const addKeyResult = () => {
    appendKeyResult({
      title: "",
      description: "",
      unit: "number",
      keyResultType: "increase_to",
    });
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Objective {objIndex + 1}</CardTitle>
          {canRemove && (
            <Button type="button" onClick={onRemove} variant="destructive" size="sm">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`objectives.${objIndex}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objective Title</FormLabel>
                <FormControl>
                  <Input placeholder="Increase Product Adoption" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`objectives.${objIndex}.owner`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner</FormLabel>
                <FormControl>
                  <Input placeholder="Product Team" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name={`objectives.${objIndex}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Objective description..."
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Key Results</h4>
            <Button type="button" onClick={addKeyResult} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Key Result
            </Button>
          </div>

          {keyResultFields.map((keyResult, krIndex) => (
            <Card key={keyResult.id} className="bg-gray-50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium">Key Result {krIndex + 1}</h5>
                  {keyResultFields.length > 1 && (
                    <Button 
                      type="button" 
                      onClick={() => removeKeyResult(krIndex)}
                      variant="ghost" 
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`objectives.${objIndex}.keyResults.${krIndex}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Key result title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`objectives.${objIndex}.keyResults.${krIndex}.keyResultType`}
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="increase_to">Should Increase To</SelectItem>
                            <SelectItem value="decrease_to">Should Decrease To</SelectItem>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unit" />
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
                </div>

                <FormField
                  control={form.control}
                  name={`objectives.${objIndex}.keyResults.${krIndex}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Key result description (optional)"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}