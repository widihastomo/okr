import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QuickUpdateButtonProps {
  metric: {
    id: string;
    name: string;
    achievement: string;
    target: string;
    unit: string;
    type: string;
  };
  onUpdateSuccess: () => void;
}

export function QuickUpdateButton({ metric, onUpdateSuccess }: QuickUpdateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [achievement, setAchievement] = useState(metric.achievement || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (achievement: string) => {
      return apiRequest("PATCH", `/api/success-metrics/${metric.id}`, {
        achievement
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives`] });
      toast({
        title: "Berhasil",
        description: "Pencapaian berhasil diupdate",
        variant: "success",
      });
      setIsOpen(false);
      onUpdateSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal mengupdate pencapaian",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(achievement);
  };

  const formatValue = (value: string) => {
    const numValue = Number(value);
    if (metric.unit === "currency") {
      return `Rp ${numValue.toLocaleString()}`;
    }
    if (metric.unit === "percentage") {
      return `${numValue}%`;
    }
    return numValue.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-orange-600 border-orange-200 hover:bg-orange-50"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Pencapaian</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="metric-name">Metrik</Label>
            <Input
              id="metric-name"
              value={metric.name}
              disabled
              className="bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="target">Target</Label>
            <Input
              id="target"
              value={metric.target}
              disabled
              className="bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="achievement">Pencapaian Saat Ini</Label>
            <Input
              id="achievement"
              type="number"
              step="0.01"
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              placeholder="Masukkan pencapaian saat ini..."
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Mengupdate...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Update
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}