import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface Option {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  options: Option[];
  value?: string;
  placeholder?: string;
  onSelect: (value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export function SimpleSelect({
  options,
  value,
  placeholder = "Pilih opsi...",
  onSelect,
  searchPlaceholder = "Cari...",
  emptyMessage = "Tidak ditemukan.",
  disabled = false
}: SimpleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 200 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        dropdownContentRef.current && !dropdownContentRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current!.getBoundingClientRect();
        const dropdownHeight = 280; // Max dropdown height (search + max-h-[200px] + padding)
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Position dropdown above if not enough space below
        const shouldPositionAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        
        // Ensure dropdown doesn't go outside viewport horizontally
        let leftPosition = rect.left;
        if (leftPosition + rect.width > viewportWidth) {
          leftPosition = viewportWidth - rect.width - 10;
        }
        if (leftPosition < 10) {
          leftPosition = 10;
        }
        
        // Calculate available space for dropdown content
        const availableHeight = shouldPositionAbove 
          ? Math.min(200, spaceAbove - 80) // Leave some margin from top
          : Math.min(200, spaceBelow - 80); // Leave some margin from bottom
        
        setDropdownPosition({
          top: shouldPositionAbove ? Math.max(10, rect.top - dropdownHeight - 4) : rect.bottom + 4,
          left: leftPosition,
          width: Math.min(rect.width, viewportWidth - 20),
          maxHeight: Math.max(150, availableHeight) // Minimum 150px height
        });
      };
      
      updatePosition();
      
      // Update position on scroll and resize
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative z-10" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className={cn(!selectedOption && "text-muted-foreground")}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownContentRef}
          className="fixed z-[99999] rounded-md border bg-white shadow-xl"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 99999
          }}
        >
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          
          <div 
            className="overflow-y-auto p-1"
            style={{ 
              maxHeight: `${dropdownPosition.maxHeight}px`,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgb(203 213 225) transparent'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}