import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Cycle, Objective } from "@shared/schema";

interface CycleDeletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle: Cycle | null;
  onSuccess: () => void;
}

interface CycleDependencies {
  cycleId: string;
  hasObjectives: boolean;
  objectives: Objective[];
  objectiveCount: number;
}

export default function CycleDeletionModal({ open, onOpenChange, cycle, onSuccess }: CycleDeletionModalProps) {
  const [deleteOption, setDeleteOption] = useState<"force" | "transfer">("force");
  const [selectedTargetCycle, setSelectedTargetCycle] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cycle dependencies
  const { data: dependencies, isLoading: isDependenciesLoading } = useQuery({
    queryKey: ["/api/cycles", cycle?.id, "dependencies"],
    queryFn: () => apiRequest("GET", `/api/cycles/${cycle?.id}/dependencies`).then(res => res.json() as Promise<CycleDependencies>),
    enabled: !!cycle?.id && open,
  });

  // Fetch all other cycles for transfer option
  const { data: allCycles = [] } = useQuery({
    queryKey: ["/api/cycles"],
    queryFn: () => apiRequest("GET", "/api/cycles").then(res => res.json() as Promise<Cycle[]>),
    enabled: open,
  });

  // Filter out the current cycle being deleted
  const availableCycles = allCycles.filter(c => c.id !== cycle?.id);

  const deleteMutation = useMutation({
    mutationFn: async (data: { cycleId: string; transferToCycleId?: string }) => {
      return apiRequest("DELETE", `/api/cycles/${data.cycleId}`, { 
        transferToCycleId: data.transferToCycleId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      
      const successMessage = deleteOption === "transfer" 
        ? `Siklus dihapus dan ${dependencies?.objectiveCount || 0} goal berhasil dipindahkan`
        : "Siklus berhasil dihapus";
      
      toast({
        title: "Berhasil",
        description: successMessage,
        className: "border-green-200 bg-green-50 text-green-800",
      });
      
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus siklus",
        variant: "destructive",
      });
    },
  });

  const handleConfirmDelete = () => {
    if (!cycle) return;

    if (deleteOption === "transfer" && !selectedTargetCycle) {
      toast({
        title: "Error",
        description: "Pilih siklus tujuan untuk memindahkan goal",
        variant: "destructive",
      });
      return;
    }

    deleteMutation.mutate({
      cycleId: cycle.id,
      transferToCycleId: deleteOption === "transfer" ? selectedTargetCycle : undefined,
    });
  };

  const handleClose = () => {
    setDeleteOption("force");
    setSelectedTargetCycle("");
    onOpenChange(false);
  };

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setDeleteOption("force");
      setSelectedTargetCycle("");
    }
  }, [open]);

  if (!cycle) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Konfirmasi Hapus Siklus
          </DialogTitle>
          <DialogDescription>
            Anda akan menghapus siklus "{cycle.name}". Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isDependenciesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Dependencies Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Informasi Siklus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Nama Siklus:</span>
                      <span className="font-medium">{cycle.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Periode:</span>
                      <span className="text-sm">
                        {new Date(cycle.startDate).toLocaleDateString('id-ID')} - {new Date(cycle.endDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Jumlah Goal:</span>
                      <Badge variant={dependencies?.hasObjectives ? "destructive" : "secondary"}>
                        {dependencies?.objectiveCount || 0} goal
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Objectives Warning */}
              {dependencies?.hasObjectives && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Peringatan Goal Terkait
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-orange-700 mb-3">
                      Siklus ini memiliki <strong>{dependencies.objectiveCount} goal</strong> yang terkait. 
                      Pilih tindakan yang akan dilakukan:
                    </p>
                    
                    <RadioGroup value={deleteOption} onValueChange={(value) => setDeleteOption(value as "force" | "transfer")}>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="force" id="force" />
                          <Label htmlFor="force" className="text-sm">
                            Hapus siklus dan semua goal (permanen)
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                                <HelpCircle className="h-4 w-4 text-blue-500" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" side="right">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Hapus Permanen</p>
                                <p className="text-sm text-gray-600">
                                  Semua goal dalam siklus ini akan dihapus secara permanen beserta 
                                  key results, initiatives, dan data terkait lainnya.
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="transfer" id="transfer" />
                          <Label htmlFor="transfer" className="text-sm">
                            Pindahkan goal ke siklus lain
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                                <HelpCircle className="h-4 w-4 text-blue-500" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" side="right">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Pindahkan Goal</p>
                                <p className="text-sm text-gray-600">
                                  Semua goal akan dipindahkan ke siklus yang dipilih. 
                                  Data goal, key results, dan initiatives akan tetap utuh.
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </RadioGroup>

                    {deleteOption === "transfer" && (
                      <div className="mt-4">
                        <Label htmlFor="target-cycle" className="text-sm font-medium">
                          Pilih Siklus Tujuan
                        </Label>
                        <Select value={selectedTargetCycle} onValueChange={setSelectedTargetCycle}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Pilih siklus untuk memindahkan goal" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCycles.map((targetCycle) => (
                              <SelectItem key={targetCycle.id} value={targetCycle.id}>
                                {targetCycle.name} 
                                <span className="text-xs text-gray-500 ml-2">
                                  ({new Date(targetCycle.startDate).toLocaleDateString('id-ID')} - {new Date(targetCycle.endDate).toLocaleDateString('id-ID')})
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* List of objectives that will be affected */}
              {dependencies?.hasObjectives && dependencies.objectives.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Goal yang Akan Terpengaruh</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {dependencies.objectives.map((objective) => (
                        <div key={objective.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{objective.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {objective.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending || (deleteOption === "transfer" && !selectedTargetCycle)}
          >
            {deleteMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Menghapus...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                {deleteOption === "transfer" ? "Pindahkan & Hapus" : "Hapus Siklus"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}