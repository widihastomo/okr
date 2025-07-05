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
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Cari angka target..." className="h-9" />
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
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{keyResult.title}</span>
                    {keyResult.description && (
                      <span className="text-sm text-gray-500 truncate">
                        {keyResult.description}
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === keyResult.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}