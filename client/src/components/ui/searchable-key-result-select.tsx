import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KeyResult } from "@shared/schema";

interface SearchableKeyResultSelectProps {
  keyResults: KeyResult[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableKeyResultSelect({
  keyResults,
  value,
  onValueChange,
  placeholder = "Pilih angka target",
  className
}: SearchableKeyResultSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedKeyResult = keyResults.find(kr => kr.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedKeyResult ? selectedKeyResult.title : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Cari angka target..." />
          <div 
            className="max-h-[250px] overflow-y-auto overscroll-contain"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E0 #F7FAFC'
            }}
          >
            <CommandList>
              <CommandEmpty>Tidak ada angka target ditemukan</CommandEmpty>
              <CommandGroup>
                {keyResults.map((keyResult) => (
                  <CommandItem
                    key={keyResult.id}
                    value={keyResult.title}
                    onSelect={() => {
                      onValueChange(keyResult.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center py-2",
                      value === keyResult.id 
                        ? "bg-blue-50 border-l-2 border-blue-500" 
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className={cn(
                        "font-medium truncate",
                        value === keyResult.id ? "text-blue-900" : "text-gray-900"
                      )}>
                        {keyResult.title}
                      </span>
                      {keyResult.description && (
                        <span className={cn(
                          "text-sm truncate",
                          value === keyResult.id ? "text-blue-600" : "text-gray-500"
                        )}>
                          {keyResult.description}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-3 h-4 w-4 flex-shrink-0",
                        value === keyResult.id ? "opacity-100 text-blue-600" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}