import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertCycleSchema } from "@shared/schema";

const createCycleFormSchema = insertCycleSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type CreateCycleFormData = z.infer<typeof createCycleFormSchema>;

interface CreateCycleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateCycleModal({ open, onOpenChange, onSuccess }: CreateCycleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateCycleFormData>({
    resolver: zodResolver(createCycleFormSchema),
    defaultValues: {
      name: "",
      type: "quarterly",
      startDate: "",
      endDate: "",
      status: "planning",
      description: "",
    },
  });

  const createCycleMutation = useMutation({
    mutationFn: async (data: CreateCycleFormData) => {
      const response = await apiRequest("POST", "/api/cycles", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Cycle created successfully"
      });
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create cycle",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CreateCycleFormData) => {
    createCycleMutation.mutate(data);
  };

  const getQuarterDates = (quarter: string, year: string) => {
    const y = parseInt(year);
    switch (quarter) {
      case "Q1":
        return { start: `${y}-01-01`, end: `${y}-03-31` };
      case "Q2":
        return { start: `${y}-04-01`, end: `${y}-06-30` };
      case "Q3":
        return { start: `${y}-07-01`, end: `${y}-09-30` };
      case "Q4":
        return { start: `${y}-10-01`, end: `${y}-12-31` };
      default:
        return { start: "", end: "" };
    }
  };

  const handleQuickFill = (type: string) => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    if (type === "quarterly") {
      const currentMonth = new Date().getMonth();
      let quarter = "Q1";
      let year = nextYear;
      
      if (currentMonth < 3) quarter = "Q2";
      else if (currentMonth < 6) quarter = "Q3";
      else if (currentMonth < 9) quarter = "Q4";
      else {
        quarter = "Q1";
        year = nextYear;
      }
      
      const dates = getQuarterDates(quarter, year.toString());
      form.setValue("name", `${quarter} ${year}`);
      form.setValue("startDate", dates.start);
      form.setValue("endDate", dates.end);
      form.setValue("description", `${quarter} objectives for ${year}`);
    } else {
      form.setValue("name", `Annual ${nextYear}`);
      form.setValue("startDate", `${nextYear}-01-01`);
      form.setValue("endDate", `${nextYear}-12-31`);
      form.setValue("description", `Annual strategic objectives for ${nextYear}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Cycle</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cycle Type</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleQuickFill(value);
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
                  <FormLabel>Cycle Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Q1 2025" {...field} />
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the focus and goals for this cycle..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCycleMutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                {createCycleMutation.isPending ? "Creating..." : "Create Cycle"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}