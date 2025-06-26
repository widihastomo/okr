import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Cycle, User } from "@shared/schema";

const createOKRSchema = z.object({
  objective: z.object({
    title: z.string().min(1, "Objective title is required"),
    description: z.string().optional(),
    timeframe: z.string().min(1, "Timeframe is required"),
    owner: z.string().min(1, "Owner is required"),
    status: z.string().default("in_progress"),
    level: z.string().default("individual"),
    teamId: z.number().optional(),
    parentId: z.number().optional(),
  }),
  keyResults: z.array(z.object({
    title: z.string().min(1, "Key result title is required"),
    description: z.string().optional(),
    currentValue: z.string().default("0"),
    targetValue: z.string().min(1, "Target value is required"),
    baseValue: z.string().optional(),
    unit: z.string().default("number"),
    keyResultType: z.string().default("increase_to"),
    status: z.string().default("in_progress"),
    assignedTo: z.string().optional(),
  })).min(1, "At least one key result is required"),
});

type CreateOKRFormData = z.infer<typeof createOKRSchema>;

interface CreateOKRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateOKRModal({ open, onOpenChange, onSuccess }: CreateOKRModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cycles from database
  const { data: cycles = [], isLoading: cyclesLoading } = useQuery<Cycle[]>({
    queryKey: ['/api/cycles'],
  });

  // Fetch users from database
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const form = useForm<CreateOKRFormData>({
    resolver: zodResolver(createOKRSchema),
    defaultValues: {
      objective: {
        title: "",
        description: "",
        timeframe: cycles.length > 0 ? cycles[0].name : "",
        owner: users.length > 0 ? users[0].id : "",
        status: "in_progress",
        level: "individual",
        teamId: undefined,
        parentId: undefined,
      },
      keyResults: [{
        title: "",
        description: "",
        currentValue: "0",
        targetValue: "",
        baseValue: "",
        unit: "number",
        keyResultType: "increase_to",
        status: "in_progress",
        assignedTo: users.length > 0 ? users[0].id : "",
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "keyResults",
  });

  const createOKRMutation = useMutation({
    mutationFn: async (data: CreateOKRFormData) => {
      const response = await apiRequest("POST", "/api/okrs", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "OKR created successfully",
      });
      form.reset();
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create OKR",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateOKRFormData) => {
    createOKRMutation.mutate(data);
  };

  const addKeyResult = () => {
    append({
      title: "",
      description: "",
      currentValue: "0",
      targetValue: "",
      baseValue: "",
      unit: "number",
      keyResultType: "increase_to",
      status: "in_progress",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New OKR</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Objective Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Objective</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="objective.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objective Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter objective title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="objective.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the objective..."
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="objective.timeframe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cyclesLoading ? (
                              <SelectItem value="" disabled>Loading cycles...</SelectItem>
                            ) : cycles.length === 0 ? (
                              <SelectItem value="" disabled>No cycles available</SelectItem>
                            ) : (
                              cycles.map((cycle) => (
                                <SelectItem key={cycle.id} value={cycle.name}>
                                  {cycle.name} ({cycle.type})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="objective.owner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select owner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {usersLoading ? (
                              <SelectItem value="" disabled>Loading users...</SelectItem>
                            ) : users.length === 0 ? (
                              <SelectItem value="" disabled>No users available</SelectItem>
                            ) : (
                              users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName && user.lastName 
                                    ? `${user.firstName} ${user.lastName}` 
                                    : user.email || user.id}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="objective.level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OKR Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select OKR level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="company">Company OKR</SelectItem>
                            <SelectItem value="team">Team OKR</SelectItem>
                            <SelectItem value="individual">Individual OKR</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Key Results Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Key Results</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addKeyResult}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Key Result
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Key Result {index + 1}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name={`keyResults.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Key result title..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`keyResults.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  placeholder="Description and target metrics..."
                                  className="min-h-16"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <FormField
                            control={form.control}
                            name={`keyResults.${index}.keyResultType`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Key Result Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="increase_to">Should Increase To</SelectItem>
                                      <SelectItem value="decrease_to">Should Decrease To</SelectItem>
                                      <SelectItem value="achieve_or_not">Achieve or Not</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`keyResults.${index}.unit`}
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

                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`keyResults.${index}.baseValue`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Base value" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`keyResults.${index}.targetValue`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Target value" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`keyResults.${index}.assignedTo`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assigned To</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select assignee" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {usersLoading ? (
                                    <SelectItem value="" disabled>Loading users...</SelectItem>
                                  ) : users.length === 0 ? (
                                    <SelectItem value="" disabled>No users available</SelectItem>
                                  ) : (
                                    users.map((user) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {user.firstName && user.lastName 
                                          ? `${user.firstName} ${user.lastName}` 
                                          : user.email || user.id}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createOKRMutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                {createOKRMutation.isPending ? "Creating..." : "Create OKR"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
