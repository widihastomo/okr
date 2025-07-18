import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Objective, Cycle, Team, User } from "@shared/schema";
import { Edit } from "lucide-react";

const editObjectiveSchema = z.object({
  title: z.string().min(1, "Judul objective harus diisi"),
  description: z.string().optional(),
  timeframe: z.string().min(1, "Timeframe harus dipilih"),
  owner: z.string().min(1, "Owner harus dipilih"),
  ownerType: z.enum(["user", "team"]).default("user"),
  ownerId: z.string().min(1, "Owner harus dipilih"),
  cycleId: z.string().min(1, "Cycle harus dipilih"),
  teamId: z.string().optional(),
  parentId: z.string().optional(),
});

type EditObjectiveFormData = z.infer<typeof editObjectiveSchema>;

// Function to find the closest cycle to today's date
function findClosestCycle(cycles: Cycle[]): string {
  if (!cycles || cycles.length === 0) return "";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison
  
  let closestCycle = cycles[0];
  let smallestDifference = Infinity;
  
  for (const cycle of cycles) {
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.endDate);
    
    // Check if today is within the cycle
    if (today >= startDate && today <= endDate) {
      return cycle.id; // Return immediately if today is within a cycle
    }
    
    // Calculate the minimum distance to the cycle (either to start or end)
    const distanceToStart = Math.abs(today.getTime() - startDate.getTime());
    const distanceToEnd = Math.abs(today.getTime() - endDate.getTime());
    const minDistance = Math.min(distanceToStart, distanceToEnd);
    
    if (minDistance < smallestDifference) {
      smallestDifference = minDistance;
      closestCycle = cycle;
    }
  }
  
  return closestCycle.id;
}

interface EditObjectiveFormModalProps {
  objective: Objective;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditObjectiveFormModal({
  objective,
  open,
  onOpenChange,
}: EditObjectiveFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cycles from database
  const { data: cycles = [] } = useQuery<Cycle[]>({
    queryKey: ["/api/cycles"],
  });

  // Fetch users from database
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch teams for owner selection
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Fetch existing objectives for parent selection
  const { data: objectives = [] } = useQuery<Objective[]>({
    queryKey: ["/api/objectives"],
  });

  const form = useForm<EditObjectiveFormData>({
    resolver: zodResolver(editObjectiveSchema),
    defaultValues: {
      title: objective.title,
      description: objective.description || "",
      owner: objective.owner,
      ownerType: objective.ownerType as "user" | "team",
      ownerId: objective.ownerId,
      cycleId: objective.cycleId || "",
      teamId: objective.teamId || undefined,
      parentId: objective.parentId || undefined,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditObjectiveFormData) => {
      return await apiRequest(`/api/objectives/${objective.id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      // Invalidate specific objective data
      if (objective?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/goals/${objective.id}`] });
      }
      // Invalidate cycle data if cycleId exists
      if (objective?.cycleId) {
        queryClient.invalidateQueries({ queryKey: [`/api/cycles/${objective.cycleId}`] });
      }
      // Invalidate owner data if ownerId exists
      if (objective?.ownerId && objective?.ownerType) {
        const ownerEndpoint = objective.ownerType === "user" || objective.ownerType === "individual" 
          ? `/api/users/${objective.ownerId}` 
          : `/api/teams/${objective.ownerId}`;
        queryClient.invalidateQueries({ queryKey: [ownerEndpoint] });
      }
      // Invalidate parent objective if parentId exists
      if (objective?.parentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/goals/${objective.parentId}`] });
      }
      toast({
        title: "Berhasil",
        description: "Objective berhasil diperbarui",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui objective",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditObjectiveFormData) => {
    // Set owner name based on ownerType and ownerId
    let ownerName = "";
    if (data.ownerType === "team") {
      const selectedTeam = teams.find((team) => team.id === data.ownerId);
      ownerName = selectedTeam ? selectedTeam.name : "";
    } else {
      const selectedUser = users.find((user) => user.id === data.ownerId);
      ownerName = selectedUser
        ? selectedUser.firstName && selectedUser.lastName
          ? `${selectedUser.firstName} ${selectedUser.lastName}`
          : selectedUser.email || selectedUser.id
        : "";
    }

    updateMutation.mutate({
      ...data,
      owner: ownerName,
      teamId: data.teamId === "none" ? undefined : data.teamId,
      parentId: data.parentId === "none" ? undefined : data.parentId,
    });
  };

  const ownerType = form.watch("ownerType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Objective</DialogTitle>
          <DialogDescription>
            Edit objective details. Update the title, description, owner, and other properties.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Objective Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Objective Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Objective *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan judul objective"
                          {...field}
                        />
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
                      <FormLabel>Deskripsi (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Deskripsi objective"
                          className="resize-none"
                          rows={3}
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
                    name="cycleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cycle *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih cycle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cycles.map((cycle) => (
                              <SelectItem key={cycle.id} value={cycle.id}>
                                {cycle.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Objective (Opsional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih parent objective" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Tidak ada parent</SelectItem>
                            {objectives
                              .filter((obj) => obj.id !== objective.id)
                              .map((obj) => (
                                <SelectItem key={obj.id} value={obj.id}>
                                  {obj.title}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Owner Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Owner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ownerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe Owner *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe owner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">Individual</SelectItem>
                            <SelectItem value="team">Team</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih owner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ownerType === "team"
                              ? teams.map((team) => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))
                              : users.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} ({user.email})
                                  </SelectItem>
                                ))}
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
                    name="teamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team (Opsional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Tidak ada team</SelectItem>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg transition-colors"
              >
                {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Export edit button component
export function EditObjectiveButton({ objective }: { objective: Objective }) {
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
      <EditObjectiveFormModal
        objective={objective}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}