import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Users, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreateCycleModal from "./create-cycle-modal";
import Sidebar from "./sidebar";
import type { Cycle, CycleWithOKRs } from "@shared/schema";

export default function CyclesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["/api/cycles"],
    queryFn: () => apiRequest("GET", "/api/cycles").then(res => res.json() as Promise<Cycle[]>)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cycles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      toast({
        title: "Success",
        description: "Cycle deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete cycle",
        variant: "destructive"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "planning": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "quarterly" ? Calendar : Target;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OKR Cycles</h1>
          <p className="text-gray-600 mt-2">Manage quarterly and annual OKR cycles</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-primary hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Cycle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cycles.map((cycle) => {
          const TypeIcon = getTypeIcon(cycle.type);
          const startDate = new Date(cycle.startDate).toLocaleDateString();
          const endDate = new Date(cycle.endDate).toLocaleDateString();
          
          return (
            <Card key={cycle.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TypeIcon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{cycle.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(cycle.status)}>
                    {cycle.status}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {cycle.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Duration:</span>
                    <span>{startDate} - {endDate}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Type:</span>
                    <span className="capitalize">{cycle.type}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `/cycles/${cycle.id}`}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteMutation.mutate(cycle.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {cycles.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cycles yet</h3>
          <p className="text-gray-500 mb-4">Create your first OKR cycle to get started</p>
          <Button onClick={() => setCreateModalOpen(true)} className="bg-primary hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Cycle
          </Button>
        </div>
      )}

      <CreateCycleModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          setCreateModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
        }}
      />
        </div>
      </div>
    </div>
  );
}