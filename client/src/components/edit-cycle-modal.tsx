import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Save, X } from "lucide-react";

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
  const [periodName, setPeriodName] = useState(initialData.periodName);
  const [startDate, setStartDate] = useState(initialData.startDate);
  const [endDate, setEndDate] = useState(initialData.endDate);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setPeriodName(initialData.periodName);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate);
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

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      newErrors.endDate = "Tanggal selesai harus lebih besar dari tanggal mulai";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        periodName: periodName.trim(),
        startDate,
        endDate,
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
            <Label htmlFor="start-date">Tanggal Mulai</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`focus:ring-2 focus:ring-purple-500 ${
                errors.startDate ? "border-red-500" : ""
              }`}
            />
            {errors.startDate && (
              <p className="text-xs text-red-600">{errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="end-date">Tanggal Selesai</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`focus:ring-2 focus:ring-purple-500 ${
                errors.endDate ? "border-red-500" : ""
              }`}
            />
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
                {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}
              </div>
              {(() => {
                const start = new Date(startDate);
                const end = new Date(endDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
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