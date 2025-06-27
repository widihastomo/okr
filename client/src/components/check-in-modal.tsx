import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, TrendingUp } from "lucide-react";

// Utility functions for number formatting
const formatNumberWithCommas = (value: string | number): string => {
  if (!value) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const parseNumberFromFormatted = (value: string): string => {
  if (!value) return '';
  // Remove thousand separators (dots) but keep decimal separator (comma)
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleanValue);
  
  // Check for numeric overflow - limit to 999 billion
  if (!isNaN(num) && num > 999999999999.99) {
    return '999999999999.99';
  }
  
  return isNaN(num) ? '' : num.toString();
};

interface CheckInModalProps {
  keyResultId: string;
  keyResultTitle: string;
  currentValue: string;
  targetValue: string;
  unit: string;
  keyResultType: string;
}

export function CheckInModal({ 
  keyResultId, 
  keyResultTitle, 
  currentValue, 
  targetValue, 
  unit,
  keyResultType 
}: CheckInModalProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentValue);
  const [notes, setNotes] = useState("");
  const [confidence, setConfidence] = useState([5]);
  const [showNumberWarning, setShowNumberWarning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sync local value state with updated currentValue prop
  useEffect(() => {
    setValue(currentValue);
  }, [currentValue]);

  const checkInMutation = useMutation({
    mutationFn: async (data: { value: string; notes: string; confidence: number }) => {
      return await apiRequest("POST", `/api/key-results/${keyResultId}/check-ins`, data);
    },
    onSuccess: () => {
      toast({
        title: "Check-in berhasil",
        description: "Progress telah diperbarui secara otomatis",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/key-results/${keyResultId}`],
      });
      setOpen(false);
      setValue(currentValue);
      setNotes("");
      setConfidence([5]);
    },
    onError: (error) => {
      console.error("Check-in error:", error);
      toast({
        title: "Gagal melakukan check-in",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui progress",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkInMutation.mutate({
      value,
      notes,
      confidence: confidence[0],
    });
  };

  const getUnitDisplay = (unit: string) => {
    switch (unit) {
      case "percentage":
        return "%";
      case "currency":
        return "Rp";
      case "number":
      default:
        return "";
    }
  };

  const getProgressHint = () => {
    const current = parseFloat(value);
    const target = parseFloat(targetValue);
    const base = parseFloat(currentValue);
    
    if (keyResultType === "decrease_to") {
      if (current < target) {
        return "✅ Target tercapai!";
      } else if (current < base) {
        return "📈 Progress baik, terus turunkan";
      } else {
        return "⚠️ Perlu usaha lebih untuk menurunkan";
      }
    } else {
      if (current >= target) {
        return "✅ Target tercapai!";
      } else if (current > base) {
        return "📈 Progress baik, terus tingkatkan";
      } else {
        return "⚠️ Perlu usaha lebih untuk meningkatkan";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Check-in
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Update Progress
          </DialogTitle>
          <DialogDescription>
            Update nilai progress untuk key result ini dan tambahkan catatan jika diperlukan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Key Result
            </Label>
            <p className="text-sm text-gray-600 mt-1">{keyResultTitle}</p>
          </div>

          <div>
            <Label htmlFor="value" className="text-sm font-medium">
              Nilai Saat Ini {getUnitDisplay(unit)}
            </Label>
            <Input
              id="value"
              type="text"
              value={formatNumberWithCommas(value)}
              onChange={(e) => {
                const inputValue = e.target.value;
                const cleanValue = inputValue.replace(/\./g, '').replace(',', '.');
                const num = parseFloat(cleanValue);
                
                if (!isNaN(num) && num > 999999999999.99) {
                  setShowNumberWarning(true);
                  setValue('999999999999.99');
                } else {
                  setShowNumberWarning(false);
                  const rawValue = parseNumberFromFormatted(inputValue);
                  setValue(rawValue);
                }
              }}
              className="mt-1"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              Target: {unit === "currency" ? `Rp ${formatNumberWithCommas(targetValue)}` : 
                       unit === "percentage" ? `${formatNumberWithCommas(targetValue)}%` :
                       `${formatNumberWithCommas(targetValue)} ${getUnitDisplay(unit)}`}
            </div>
            {showNumberWarning && (
              <div className="text-xs text-orange-600 mt-1 font-medium">
                ⚠️ Nilai maksimum adalah 999.999.999.999,99 - angka telah disesuaikan
              </div>
            )}
            <div className="text-xs mt-1 font-medium">
              {getProgressHint()}
            </div>
          </div>

          <div>
            <Label htmlFor="confidence" className="text-sm font-medium">
              Tingkat Keyakinan: {confidence[0]}/10
            </Label>
            <Slider
              id="confidence"
              min={1}
              max={10}
              step={1}
              value={confidence}
              onValueChange={setConfidence}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Tidak yakin</span>
              <span>Sangat yakin</span>
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Catatan (opsional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan progress, tantangan, atau rencana selanjutnya..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={checkInMutation.isPending}>
              {checkInMutation.isPending ? "Menyimpan..." : "Simpan Check-in"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}