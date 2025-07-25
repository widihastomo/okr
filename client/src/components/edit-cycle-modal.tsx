import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EditCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { periodName: string; startDate: string; endDate: string }) => void;
  initialData: {
    periodName: string;
    startDate: string;
    endDate: string;
  };
}

const EditCycleModal: React.FC<EditCycleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  // Convert cycleDuration to proper period name for display
  const getCyclePeriodName = (duration: string) => {
    switch (duration) {
      case "1bulan":
        return "1 Bulan";
      case "3bulan":
        return "3 Bulan";
      case "1tahun":
        return "1 Tahun";
      default:
        return duration;
    }
  };

  const [periodName, setPeriodName] = useState(getCyclePeriodName(initialData?.periodName || ""));
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.startDate ? new Date(initialData.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.endDate ? new Date(initialData.endDate) : undefined
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && initialData) {
      setPeriodName(getCyclePeriodName(initialData.periodName || ""));
      setStartDate(initialData.startDate ? new Date(initialData.startDate) : undefined);
      setEndDate(initialData.endDate ? new Date(initialData.endDate) : undefined);
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!periodName.trim()) {
      newErrors.periodName = "Nama periode harus diisi";
    }

    if (!startDate) {
      newErrors.startDate = "Tanggal mulai harus diisi";
    }

    if (!endDate) {
      newErrors.endDate = "Tanggal selesai harus diisi";
    }

    if (startDate && endDate && startDate >= endDate) {
      newErrors.endDate = "Tanggal selesai harus lebih besar dari tanggal mulai";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        periodName: periodName.trim(),
        startDate: startDate ? startDate.toISOString().split('T')[0] : "",
        endDate: endDate ? endDate.toISOString().split('T')[0] : "",
      });
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-purple-600" />
            <span>Edit Periode Siklus</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Period Name */}
          <div className="space-y-2">
            <Label htmlFor="period-name">Nama Periode</Label>
            <Input
              id="period-name"
              type="text"
              value={periodName}
              onChange={(e) => setPeriodName(e.target.value)}
              placeholder="Contoh: Kuartal 1 2025"
              className={`focus:ring-2 focus:ring-purple-500 ${
                errors.periodName ? "border-red-500" : ""
              }`}
            />
            {errors.periodName && (
              <p className="text-xs text-red-600">{errors.periodName}</p>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Tanggal Mulai</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal focus:ring-2 focus:ring-purple-500",
                    !startDate && "text-muted-foreground",
                    errors.startDate ? "border-red-500" : ""
                  )}
                >
                  {startDate ? (
                    format(startDate, "PPP", { locale: id })
                  ) : (
                    <span>Pilih tanggal mulai</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.startDate && (
              <p className="text-xs text-red-600">{errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>Tanggal Selesai</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal focus:ring-2 focus:ring-purple-500",
                    !endDate && "text-muted-foreground",
                    errors.endDate ? "border-red-500" : ""
                  )}
                >
                  {endDate ? (
                    format(endDate, "PPP", { locale: id })
                  ) : (
                    <span>Pilih tanggal selesai</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.endDate && (
              <p className="text-xs text-red-600">{errors.endDate}</p>
            )}
          </div>

          {/* Period Preview */}
          {startDate && endDate && !errors.endDate && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-800">
                <strong>Pratinjau Periode:</strong>
              </div>
              <div className="text-sm text-purple-700">
                {startDate.toLocaleDateString('id-ID')} - {endDate.toLocaleDateString('id-ID')}
              </div>
              {(() => {
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return (
                  <div className="text-xs text-purple-600 mt-1">
                    Durasi: {diffDays} hari
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex items-center space-x-1">
            <X className="w-4 h-4" />
            <span>Batal</span>
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-1"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Tip: Tekan Ctrl+Enter untuk menyimpan
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCycleModal;
export { EditCycleModal };