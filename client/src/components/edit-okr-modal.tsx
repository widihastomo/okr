import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OKRWithKeyResults, Cycle, User, Objective, Team, KeyResult } from "@shared/schema";

const editOKRSchema = z.object({
  objective: z.object({
    title: z.string().min(1, "Objective title is required"),
    description: z.string().optional(),
    timeframe: z.string().min(1, "Timeframe is required"),
    owner: z.string().min(1, "Owner is required"),
    ownerType: z.enum(["user", "team"]).default("user"),
    ownerId: z.string().min(1, "Owner is required"),
    status: z.string().default("in_progress"),
    cycleId: z.string().optional(),
    teamId: z.string().optional(),
    parentId: z.string().optional(),
  }),
  keyResults: z.array(z.object({
    id: z.string().optional(),
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

type EditOKRFormData = z.infer<typeof editOKRSchema>;

interface EditOKRModalProps {
  okr: OKRWithKeyResults;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditOKRModal({ okr, open, onOpenChange }: EditOKRModalProps) {
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

  // Fetch existing objectives for parent selection
  const { data: objectives = [], isLoading: objectivesLoading } = useQuery<Objective[]>({
    queryKey: ['/api/objectives'],
  });

  // Fetch teams for owner selection
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  const form = useForm<EditOKRFormData>({
    resolver: zodResolver(editOKRSchema),
    defaultValues: {
      objective: {
        title: okr.title,
        description: okr.description || "",
        timeframe: okr.timeframe,
        owner: okr.owner,
        ownerType: okr.ownerType as "user" | "team",
        ownerId: okr.ownerId,
        status: okr.status,
        cycleId: okr.cycleId || undefined,
        teamId: okr.teamId || undefined,
        parentId: okr.parentId || undefined,
      },
      keyResults: okr.keyResults.map(kr => ({
        id: kr.id,
        title: kr.title,
        description: kr.description || "",
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
        baseValue: kr.baseValue || "",
        unit: kr.unit,
        keyResultType: kr.keyResultType,
        status: kr.status,
        assignedTo: kr.assignedTo || "",
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "keyResults",
  });

  const updateOKRMutation = useMutation({
    mutationFn: async (data: EditOKRFormData) => {
      return await apiRequest(`/api/okrs/${okr.id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "OKR updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update OKR",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditOKRFormData) => {
    // Set owner name based on ownerType and ownerId
    let ownerName = "";
    if (data.objective.ownerType === "team") {
      const selectedTeam = teams.find(team => team.id.toString() === data.objective.ownerId);
      ownerName = selectedTeam ? selectedTeam.name : "";
    } else {
      const selectedUser = users.find(user => user.id.toString() === data.objective.ownerId);
      ownerName = selectedUser 
        ? (selectedUser.firstName && selectedUser.lastName 
            ? `${selectedUser.firstName} ${selectedUser.lastName}` 
            : selectedUser.email || selectedUser.id.toString())
        : "";
    }
    
    updateOKRMutation.mutate({
      ...data,
      objective: {
        ...data.objective,
        owner: ownerName,
      }
    });
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
      assignedTo: "",
    });
  };

  const ownerType = form.watch("objective.ownerType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit OKR</DialogTitle>
          <DialogDescription>
            Edit objective with key results. You can organize objectives in a hierarchy by selecting a parent objective.
          </DialogDescription>
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
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Also set the cycleId when timeframe changes
                            const selectedCycle = cycles.find(cycle => cycle.name === value);
                            if (selectedCycle) {
                              form.setValue('objective.cycleId', selectedCycle.id);
                            }
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cyclesLoading ? (
                              <SelectItem value="loading" disabled>Loading cycles...</SelectItem>
                            ) : cycles.length === 0 ? (
                              <SelectItem value="no-cycles" disabled>No cycles available</SelectItem>
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
                    name="objective.parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Objective (Optional)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent objective" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No parent objective</SelectItem>
                            {objectivesLoading ? (
                              <SelectItem value="loading" disabled>Loading objectives...</SelectItem>
                            ) : objectives.length === 0 ? (
                              <SelectItem value="no-objectives" disabled>No objectives available</SelectItem>
                            ) : (
                              objectives
                                .filter(obj => obj.id !== okr.id)
                                .map((objective) => (
                                  <SelectItem key={objective.id} value={objective.id}>
                                    {objective.title}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="objective.ownerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe Owner</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="team">Tim</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="objective.ownerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih owner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ownerType === "team" ? (
                              teamsLoading ? (
                                <SelectItem value="loading" disabled>Loading teams...</SelectItem>
                              ) : teams.length === 0 ? (
                                <SelectItem value="no-teams" disabled>Tidak ada tim tersedia</SelectItem>
                              ) : (
                                teams.map((team) => (
                                  <SelectItem key={team.id} value={team.id.toString()}>
                                    {team.name}
                                  </SelectItem>
                                ))
                              )
                            ) : (
                              usersLoading ? (
                                <SelectItem value="loading" disabled>Loading users...</SelectItem>
                              ) : users.length === 0 ? (
                                <SelectItem value="no-users" disabled>Tidak ada user tersedia</SelectItem>
                              ) : (
                                users.map((user) => (
                                  <SelectItem key={user.id.toString()} value={user.id.toString()}>
                                    {user.firstName && user.lastName 
                                      ? `${user.firstName} ${user.lastName}` 
                                      : user.email || user.id.toString()}
                                  </SelectItem>
                                ))
                              )
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {ownerType === "user" && (
                  <FormField
                    control={form.control}
                    name="objective.teamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team (Optional)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No team</SelectItem>
                            {teamsLoading ? (
                              <SelectItem value="loading" disabled>Loading teams...</SelectItem>
                            ) : teams.length === 0 ? (
                              <SelectItem value="no-teams" disabled>Tidak ada tim tersedia</SelectItem>
                            ) : (
                              teams.map((team) => (
                                <SelectItem key={team.id} value={team.id.toString()}>
                                  {team.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Key Results Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Key Results
                  <Button 
                    type="button" 
                    onClick={addKeyResult} 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Key Result
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-gray-700">Key Result {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter key result title..." {...field} />
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
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the key result..."
                              className="min-h-16"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`keyResults.${index}.keyResultType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
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
                        name={`keyResults.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="currency">Currency</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="hours">Hours</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`keyResults.${index}.assignedTo`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assigned To</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {usersLoading ? (
                                  <SelectItem value="loading" disabled>Loading users...</SelectItem>
                                ) : users.length === 0 ? (
                                  <SelectItem value="no-users" disabled>No users available</SelectItem>
                                ) : (
                                  users.map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                      {user.firstName && user.lastName 
                                        ? `${user.firstName} ${user.lastName}` 
                                        : user.email || user.id.toString()}
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

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`keyResults.${index}.baseValue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`keyResults.${index}.currentValue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                              />
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
                            <FormLabel>Target Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="100"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={updateOKRMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateOKRMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {updateOKRMutation.isPending ? "Updating..." : "Update OKR"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Export edit button component
export function EditOKRButton({ okr }: { okr: OKRWithKeyResults }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-gray-600 hover:text-blue-600"
      >
        <Edit className="w-4 h-4" />
      </Button>
      <EditOKRModal
        okr={okr}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}