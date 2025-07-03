import React, { useState } from "react";
import { Check, ChevronsUpDown, User, Users } from "lucide-react";
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

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
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
}: SearchableUserSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedUser = users.find((user) => user.id === value);
  const displayValue = selectedUser 
    ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email
    : value === "unassigned" 
    ? "Belum Ditugaskan"
    : value === "all"
    ? "Semua User"
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="truncate">
              {displayValue || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Cari user..." />
          <div 
            className="max-h-[250px] overflow-y-auto overscroll-contain"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E0 #F7FAFC'
            }}
          >
            <CommandList>
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
                      "flex items-center py-2",
                      value === "all" 
                        ? "bg-green-50 border-l-2 border-green-500" 
                        : "hover:bg-gray-50"
                    )}
                  >
                    <Users className={cn(
                      "mr-3 h-4 w-4 flex-shrink-0",
                      value === "all" ? "text-green-600" : "text-gray-400"
                    )} />
                    <span className={cn(
                      "font-medium",
                      value === "all" ? "text-green-900" : "text-gray-900"
                    )}>
                      Semua User
                    </span>
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
                      "flex items-center py-2",
                      value === "unassigned" 
                        ? "bg-gray-50 border-l-2 border-gray-500" 
                        : "hover:bg-gray-50"
                    )}
                  >
                    <User className={cn(
                      "mr-3 h-4 w-4 flex-shrink-0",
                      value === "unassigned" ? "text-gray-600" : "text-gray-400"
                    )} />
                    <span className={cn(
                      "font-medium",
                      value === "unassigned" ? "text-gray-900" : "text-gray-900"
                    )}>
                      Belum Ditugaskan
                    </span>
                  </CommandItem>
                )}
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.firstName || ''} ${user.lastName || ''} ${user.email}`}
                    onSelect={() => {
                      onValueChange(user.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center py-2",
                      value === user.id 
                        ? "bg-blue-50 border-l-2 border-blue-500" 
                        : "hover:bg-gray-50"
                    )}
                  >
                    <User className={cn(
                      "mr-3 h-4 w-4 flex-shrink-0",
                      value === user.id ? "text-blue-600" : "text-gray-400"
                    )} />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className={cn(
                        "font-medium truncate",
                        value === user.id ? "text-blue-900" : "text-gray-900"
                      )}>
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                      </span>
                      <span className={cn(
                        "text-sm truncate",
                        value === user.id ? "text-blue-600" : "text-gray-500"
                      )}>
                        {user.email}
                      </span>
                    </div>
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