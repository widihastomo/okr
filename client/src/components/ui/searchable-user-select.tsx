import React, { useState, useRef } from "react";
import { Check, ChevronsUpDown, User, Users, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollProgressIndicator, useScrollProgress } from "@/components/ui/scroll-progress-indicator";

interface User {
  id: string;
  name: string | null;
  email: string;
  profileImageUrl?: string | null;
}

interface SearchableUserSelectProps {
  users: User[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  allowUnassigned?: boolean;
  allowAll?: boolean;
  disabled?: boolean;
  className?: string;
  defaultValue?: string;
  currentUser?: User; // Add currentUser prop
}

export function SearchableUserSelect({
  users,
  value,
  onValueChange,
  placeholder = "Pilih user",
  emptyMessage = "Tidak ada user ditemukan",
  allowUnassigned = false,
  allowAll = false,
  disabled = false,
  className,
  defaultValue,
  currentUser,
}: SearchableUserSelectProps) {
  const [open, setOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollState = useScrollProgress(scrollContainerRef);

  // Use currentUser as default if no value is provided and currentUser is set
  const effectiveValue = value || (currentUser && !defaultValue ? currentUser.id : defaultValue);
  const selectedUser = users.find(user => user.id === effectiveValue);

  const getDisplayText = () => {
    if (effectiveValue === "all") return "Semua User";
    if (effectiveValue === "unassigned") return "Belum Ditugaskan";
    if (selectedUser) {
      return selectedUser.name && selectedUser.name.trim() !== '' 
        ? selectedUser.name.trim() 
        : selectedUser.email.split('@')[0];
    }
    return placeholder;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center">
            {effectiveValue === "all" ? (
              <Users className="mr-2 h-4 w-4 text-green-600" />
            ) : effectiveValue === "unassigned" ? (
              <User className="mr-2 h-4 w-4 text-gray-600" />
            ) : selectedUser ? (
              <div className="mr-2 flex-shrink-0">
                {selectedUser.profileImageUrl ? (
                  <img
                    src={selectedUser.profileImageUrl}
                    alt={selectedUser.name || selectedUser.email}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {selectedUser.name
                      ? selectedUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 1)
                      : selectedUser.email
                          ?.split("@")[0]
                          .slice(0, 1)
                          .toUpperCase() || "U"}
                  </div>
                )}
              </div>
            ) : (
              <User className="mr-2 h-4 w-4 text-gray-400" />
            )}
            {getDisplayText()}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Cari user..." />
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
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {allowAll && (
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        onValueChange("all");
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center py-2 pr-6 cursor-pointer",
                        effectiveValue === "all" 
                          ? "bg-green-50 border-l-2 border-green-500" 
                          : "hover:bg-gray-50"
                      )}
                    >
                      <Users className={cn(
                        "mr-3 h-4 w-4 flex-shrink-0",
                        effectiveValue === "all" ? "text-green-600" : "text-gray-400"
                      )} />
                      <span className={cn(
                        "font-medium",
                        effectiveValue === "all" ? "text-green-900" : "text-gray-900"
                      )}>
                        Semua User
                      </span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          effectiveValue === "all" ? "opacity-100 text-green-600" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  )}
                  {allowUnassigned && (
                    <CommandItem
                      value="unassigned"
                      onSelect={() => {
                        onValueChange("unassigned");
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center py-2 pr-6 cursor-pointer",
                        effectiveValue === "unassigned" 
                          ? "bg-gray-50 border-l-2 border-gray-500" 
                          : "hover:bg-gray-50"
                      )}
                    >
                      <User className={cn(
                        "mr-3 h-4 w-4 flex-shrink-0",
                        effectiveValue === "unassigned" ? "text-gray-600" : "text-gray-400"
                      )} />
                      <span className={cn(
                        "font-medium",
                        effectiveValue === "unassigned" ? "text-gray-900" : "text-gray-900"
                      )}>
                        Belum Ditugaskan
                      </span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          effectiveValue === "unassigned" ? "opacity-100 text-gray-600" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  )}
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={`${user.name || ''} ${user.email}`}
                      onSelect={() => {
                        onValueChange(user.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center py-2 pr-6 cursor-pointer",
                        effectiveValue === user.id 
                          ? "bg-blue-50 border-l-2 border-blue-500" 
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="mr-3 flex-shrink-0">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={user.name || user.email}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white",
                            effectiveValue === user.id ? "bg-blue-500" : "bg-gray-400"
                          )}>
                            {user.name
                              ? user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : user.email
                                  ?.split("@")[0]
                                  .slice(0, 2)
                                  .toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={cn(
                          "font-medium truncate",
                          effectiveValue === user.id ? "text-blue-900" : "text-gray-900"
                        )}>
                          {user.name && user.name.trim() !== '' ? user.name.trim() : user.email.split('@')[0]}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "ml-3 h-4 w-4 flex-shrink-0",
                          effectiveValue === user.id ? "opacity-100 text-blue-600" : "opacity-0"
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