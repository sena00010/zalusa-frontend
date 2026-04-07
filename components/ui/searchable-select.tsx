import React, { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Search, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Option {
  label: React.ReactNode;
  value: string;
  searchableText?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  hideSearchAndSort?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seçiniz",
  searchPlaceholder = "Ara...",
  className,
  disabled,
  hideSearchAndSort = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"none" | "asc" | "desc">("none");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAndSortedOptions = useMemo(() => {
    let result = [...options];
    
    // Filter
    if (search) {
      const lowerSearch = search.toLocaleLowerCase("tr");
      result = result.filter(o => 
        (o.searchableText || (typeof o.label === "string" ? o.label : ""))
          .toLocaleLowerCase("tr")
          .includes(lowerSearch)
      );
    }
    
    // Sort
    if (sortOrder === "asc") {
      result.sort((a, b) => 
        (a.searchableText || (typeof a.label === "string" ? a.label : ""))
          .localeCompare(b.searchableText || (typeof b.label === "string" ? b.label : ""), "tr")
      );
    } else if (sortOrder === "desc") {
      result.sort((a, b) => 
        (b.searchableText || (typeof b.label === "string" ? b.label : ""))
          .localeCompare(a.searchableText || (typeof a.label === "string" ? a.label : ""), "tr")
      );
    }
    
    return result;
  }, [options, search, sortOrder]);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl bg-surface px-4 text-sm text-foreground ring-1 ring-border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/35 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className={selectedOption ? "text-foreground truncate" : "text-muted truncate"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-[99] mt-1 w-full rounded-2xl border border-border bg-surface p-1 shadow-md animate-in fade-in-0 zoom-in-95">
          {!hideSearchAndSort && (
            <div className="flex items-center gap-2 border-b border-border p-2">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted min-w-0"
                autoFocus
              />
              <div className="flex gap-1 ml-1 text-muted shrink-0">
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "none" : "asc")}
                  className={cn("p-1 rounded hover:bg-surface-2 transition-colors", sortOrder === "asc" && "bg-brand-50 text-brand-700")}
                  title="A-Z Sırala"
                >
                  <ArrowDownAZ className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === "desc" ? "none" : "desc")}
                  className={cn("p-1 rounded hover:bg-surface-2 transition-colors", sortOrder === "desc" && "bg-brand-50 text-brand-700")}
                  title="Z-A Sırala"
                >
                  <ArrowUpZA className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          <div className="max-h-60 overflow-y-auto p-1 text-left">
            {filteredAndSortedOptions.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted">Sonuç bulunamadı.</div>
            ) : (
              filteredAndSortedOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-2 py-1.5 text-sm transition-colors hover:bg-surface-2",
                    value === option.value && "bg-brand-50 text-brand-900 font-medium hover:bg-brand-50"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
