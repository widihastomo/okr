import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CheckInModal({ 
  keyResultId, 
  keyResultTitle, 
  currentValue, 
  targetValue, 
  unit,
  keyResultType,
  open,
  onOpenChange
}: CheckInModalProps) {
  // Internal state for standalone mode
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const modalOpen = isControlled ? open : internalOpen;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled && onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const [value, setValue] = useState(currentValue);
  const [achieved, setAchieved] = useState(parseFloat(currentValue) >= parseFloat(targetValue));
  const [notes, setNotes] = useState("");

  const [showNumberWarning, setShowNumberWarning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sync local value state with updated currentValue prop
  useEffect(() => {
    setValue(currentValue);
  }, [currentValue]);

  const checkInMutation = useMutation({
    mutationFn: async (data: { value: string; notes: string }) => {
      return await apiRequest("POST", `/api/key-results/${keyResultId}/check-ins`, data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Update berhasil",
        description: "Progress telah diperbarui secara otomatis",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      
      // Invalidate general lists first
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      
      // Invalidate specific key result data
      queryClient.invalidateQueries({
        queryKey: [`/api/key-results/${keyResultId}`],
      });
      
      // If we have objectiveId from response, invalidate all related queries
      if (response?.objectiveId) {
        // Invalidate the main objective detail query (most important)
        queryClient.invalidateQueries({ 
          queryKey: [`/api/okrs/${response.objectiveId}`] 
        });
        
        // Invalidate activity log
        queryClient.invalidateQueries({ 
          queryKey: [`/api/objectives/${response.objectiveId}/activity-log`] 
        });
        
        // Invalidate initiatives and tasks for this objective
        queryClient.invalidateQueries({ 
          queryKey: [`/api/initiatives/objective/${response.objectiveId}`] 
        });
        queryClient.invalidateQueries({ 
          queryKey: [`/api/tasks/objective/${response.objectiveId}`] 
        });
      }
      
      // Force refetch all OKR-related queries with invalidateQueries using refetchType: 'active'
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes('/api/okrs/') || 
                 queryKey?.includes('/api/objectives/');
        },
        refetchType: 'active'
      });
      
      handleOpenChange(false);
      setValue(currentValue);
      setAchieved(parseFloat(currentValue) >= parseFloat(targetValue));
      setNotes("");
    },
    onError: (error: any) => {
      console.error("Check-in error:", error);
      console.error("Error details:", error);
      toast({
        title: "Gagal melakukan update",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui progress",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let submitValue = value;
    
    // Handle different key result types
    if (keyResultType === "achieve_or_not") {
      // For binary type, use 1 if achieved, otherwise 0
      submitValue = achieved ? "1" : "0";
    } else if (keyResultType === "should_stay_above" || keyResultType === "should_stay_below") {
      // For threshold types, use current value from input
      submitValue = value;
    }
    
    // Clean value only for numeric inputs, not for binary types
    const cleanValue = (keyResultType === "achieve_or_not") 
      ? submitValue 
      : submitValue.replace(/[.,]/g, '');
    
    console.log('Check-in data:', { 
      keyResultId,
      keyResultType, 
      achieved, 
      submitValue, 
      cleanValue,
      notes 
    });
    
    checkInMutation.mutate({
      value: cleanValue,
      notes,
    });
  };

  const getUnitDisplay = (unit: string) => {
    switch (unit.toLowerCase()) {
      case "percentage":
      case "persen":
        return "%";
      case "currency":
      case "rupiah":
      case "rp":
        return "Rp";
      case "number":
      case "angka":
      default:
        return "";
    }
  };

  const isCurrencyUnit = (unit: string) => {
    return ["currency", "rupiah", "rp"].includes(unit.toLowerCase());
  };

  const isPercentageUnit = (unit: string) => {
    return ["percentage", "persen"].includes(unit.toLowerCase());
  };

  const getProgressHint = () => {
    const current = parseFloat(value);
    const target = parseFloat(targetValue);
    const base = parseFloat(currentValue);
    
    switch (keyResultType) {
      case "increase_to":
        if (current >= target) {
          return "✅ Target tercapai! Nilai sudah mencapai atau melebihi target";
        } else if (current > base) {
          return "📈 Progress baik, terus tingkatkan untuk mencapai target";
        } else {
          return "⚠️ Perlu usaha lebih untuk meningkatkan nilai dari baseline";
        }
        
      case "decrease_to":
        if (current <= target) {
          return "✅ Target tercapai! Nilai sudah turun sesuai atau lebih baik dari target";
        } else if (current < base) {
          return "📈 Progress baik, terus turunkan untuk mencapai target";
        } else {
          return "⚠️ Perlu usaha lebih untuk menurunkan nilai dari baseline";
        }
        
      case "should_stay_above":
        if (achieved) {
          return "✅ Berhasil mempertahankan nilai di atas ambang batas target";
        } else {
          return "⚠️ Nilai berada di bawah ambang batas - perlu perbaikan segera";
        }
        
      case "should_stay_below":
        if (achieved) {
          return "✅ Berhasil mempertahankan nilai di bawah ambang batas target";
        } else {
          return "⚠️ Nilai melebihi ambang batas - perlu optimasi segera";
        }
        
      case "achieve_or_not":
        if (achieved) {
          return "✅ Target berhasil dicapai - milestone tercapai!";
        } else {
          return "📋 Belum tercapai - lanjutkan usaha untuk mencapai milestone";
        }
        
      default:
        return "📊 Update progress untuk melacak perkembangan";
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      {/* Show trigger button only in standalone mode */}
      {!isControlled && (
        <DialogTrigger asChild>
          <Button 
            variant="default" 
            size="sm" 
            className="text-white"
            style={{ 
              backgroundColor: '#2095F4',
              borderColor: '#2095F4'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1976D2';
              e.currentTarget.style.borderColor = '#1976D2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2095F4';
              e.currentTarget.style.borderColor = '#2095F4';
            }}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="sm:hidden">Update</span>
            <span className="hidden sm:inline">Update</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Update Progress
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-left">
            Update nilai progress untuk angka target ini dan tambahkan catatan jika diperlukan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Angka Target
            </Label>
            <p className="text-sm text-gray-600 mt-1">{keyResultTitle}</p>
          </div>

          {/* Conditional Input Based on Key Result Type */}
          {(keyResultType === "increase_to" || keyResultType === "decrease_to") && (
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
                Target: {isCurrencyUnit(unit) ? `Rp ${formatNumberWithCommas(targetValue)}` : 
                         isPercentageUnit(unit) ? `${formatNumberWithCommas(targetValue)}%` :
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
          )}

          {(keyResultType === "should_stay_above" || keyResultType === "should_stay_below") && (
            <div>
              <Label className="text-sm font-medium">
                Status Target
              </Label>
              <div className="flex items-center space-x-3 mt-2">
                <Switch
                  checked={achieved}
                  onCheckedChange={setAchieved}
                />
                <span className="text-sm">
                  {achieved ? "✅ Target tercapai" : "❌ Target belum tercapai"}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Target: {keyResultType === "should_stay_above" ? "Tetap di atas" : "Tetap di bawah"} {" "}
                {isCurrencyUnit(unit) ? `Rp ${formatNumberWithCommas(targetValue)}` : 
                 isPercentageUnit(unit) ? `${formatNumberWithCommas(targetValue)}%` :
                 `${formatNumberWithCommas(targetValue)} ${getUnitDisplay(unit)}`}
              </div>
            </div>
          )}

          {keyResultType === "achieve_or_not" && (
            <div>
              <Label className="text-sm font-medium">
                Status Pencapaian
              </Label>
              <div className="flex items-center space-x-3 mt-2">
                <Switch
                  checked={achieved}
                  onCheckedChange={setAchieved}
                />
                <span className="text-sm">
                  {achieved ? "✅ Tercapai" : "❌ Belum tercapai"}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Target: {keyResultTitle}
              </div>
            </div>
          )}



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
              onClick={() => handleOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={checkInMutation.isPending}>
              {checkInMutation.isPending ? "Menyimpan..." : "Simpan Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}