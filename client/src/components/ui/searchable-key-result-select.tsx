import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollProgressIndicator, useScrollProgress } from "@/components/ui/scroll-progress-indicator";
import { Check, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollState = useScrollProgress(scrollContainerRef);

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
          <div className="relative">
            {/* Scroll hint - top */}
            {scrollState.canScroll && !scrollState.isAtTop && (
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent pointer-events-none z-10 flex items-center justify-center">
                <ChevronUp className="w-3 h-3 text-gray-400 animate-pulse" />
              </div>
            )}

            {/* Scrollable container */}
            <div 
              ref={scrollContainerRef}
              className="max-h-[250px] overflow-y-auto overscroll-contain relative"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
              }}
            >
              <CommandList className="py-1">
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
                        "flex items-center py-2 pr-6 cursor-pointer",
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

            {/* Scroll Progress Indicator */}
            <ScrollProgressIndicator 
              containerRef={scrollContainerRef}
              className="z-20"
            />

            {/* Scroll hint - bottom */}
            {scrollState.canScroll && !scrollState.isAtBottom && (
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none z-10 flex items-center justify-center">
                <ChevronDown className="w-3 h-3 text-gray-400 animate-pulse" />
              </div>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}