"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, ChevronDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { stateService, type ApiState } from "@/lib/services/shipmentService";

interface StateSelectProps {
  countryCode: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function StateSelect({
  countryCode,
  value,
  onChange,
  placeholder = "Eyalet / Bölge seçiniz",
  className,
  disabled,
}: StateSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [states, setStates] = useState<ApiState[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasStates, setHasStates] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch states when country changes
  const fetchStates = useCallback(async () => {
    if (!countryCode) {
      setStates([]);
      setHasStates(false);
      return;
    }
    setLoading(true);
    try {
      const res = await stateService.list(countryCode);
      setStates(res.states || []);
      setHasStates((res.states || []).length > 0);
    } catch {
      setStates([]);
      setHasStates(false);
    } finally {
      setLoading(false);
    }
  }, [countryCode]);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  // Auto-focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter by search
  const filtered = states.filter((s) => {
    if (!search) return true;
    return s.stateName.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"));
  });

  // If no states for this country, show a free-text input instead
  if (!hasStates && !loading) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Eyalet veya bölge adı"
        disabled={disabled || !countryCode}
        className={cn(
          "flex h-11 w-full rounded-2xl bg-surface px-4 text-sm text-foreground ring-1 ring-border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/35 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    );
  }

  return (
    <div className={cn("relative w-full")} ref={containerRef}>
      <button
        type="button"
        disabled={disabled || !countryCode || loading}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl bg-surface px-4 text-sm text-foreground ring-1 ring-border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/35 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className={value ? "text-foreground truncate" : "text-muted truncate"}>
          {loading ? (
            <span className="flex items-center gap-2 text-muted">
              <Loader2 className="h-3 w-3 animate-spin" /> Yükleniyor...
            </span>
          ) : (
            value || placeholder
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-[99] mt-1 w-full rounded-2xl border border-border bg-surface p-1 shadow-md animate-in fade-in-0 zoom-in-95">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border p-2">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Eyalet ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted min-w-0"
            />
            {states.length > 0 && (
              <span className="text-[10px] text-muted shrink-0">{states.length} eyalet</span>
            )}
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto p-1 text-left">
            {filtered.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted">
                {search ? "Sonuç bulunamadı." : "Eyalet bulunamadı."}
              </div>
            ) : (
              filtered.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    onChange(st.stateName);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-surface-2",
                    value === st.stateName &&
                      "bg-brand-50 text-brand-900 font-medium hover:bg-brand-50"
                  )}
                >
                  <span className="truncate">{st.stateName}</span>
                  {value === st.stateName && (
                    <Check className="h-4 w-4 shrink-0 text-brand-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
