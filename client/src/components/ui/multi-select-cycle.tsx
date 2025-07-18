import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectCycleProps {
  cycles: Array<{ id: string; name: string }>;
  selectedCycles: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelectCycle({
  cycles,
  selectedCycles,
  onSelectionChange,
  placeholder = "Pilih Siklus",
  className
}: MultiSelectCycleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCycleToggle = (cycleId: string) => {
    if (selectedCycles.includes(cycleId)) {
      onSelectionChange(selectedCycles.filter(id => id !== cycleId));
    } else {
      onSelectionChange([...selectedCycles, cycleId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCycles.length === cycles.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(cycles.map(cycle => cycle.id));
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getDisplayText = () => {
    if (selectedCycles.length === 0) {
      return placeholder;
    }
    
    if (selectedCycles.length === 1) {
      const cycle = cycles.find(c => c.id === selectedCycles[0]);
      return cycle?.name || placeholder;
    }
    
    if (selectedCycles.length === cycles.length) {
      return "Semua Siklus";
    }
    
    return `${selectedCycles.length} siklus dipilih`;
  };

  const removeSelection = (cycleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedCycles.filter(id => id !== cycleId));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            "w-full justify-between text-left font-normal",
            selectedCycles.length === 0 && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="truncate">{getDisplayText()}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedCycles.length === cycles.length ? "Hapus Semua" : "Pilih Semua"}
            </button>
            {selectedCycles.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Hapus
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {cycles.map((cycle) => (
              <div
                key={cycle.id}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-sm cursor-pointer"
                onClick={() => handleCycleToggle(cycle.id)}
              >
                <Checkbox
                  id={cycle.id}
                  checked={selectedCycles.includes(cycle.id)}
                  onChange={() => handleCycleToggle(cycle.id)}
                  className="h-4 w-4"
                />
                <label
                  htmlFor={cycle.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {cycle.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}