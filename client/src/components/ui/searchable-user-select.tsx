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
          <div className="max-h-[200px] overflow-y-auto">
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
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Users className="mr-2 h-4 w-4 text-green-600" />
                    Semua User
                  </CommandItem>
                )}
                {allowUnassigned && (
                  <CommandItem
                    value="unassigned"
                    onSelect={() => {
                      onValueChange("unassigned");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === "unassigned" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <User className="mr-2 h-4 w-4 text-gray-400" />
                    Belum Ditugaskan
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
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <User className="mr-2 h-4 w-4 text-blue-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                      </span>
                      <span className="text-sm text-gray-500">
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