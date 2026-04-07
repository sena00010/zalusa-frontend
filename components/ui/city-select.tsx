"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, ChevronDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { cityService, stateService, type ApiCity, type ApiState } from "@/lib/services/shipmentService";

interface CitySelectProps {
  countryCode: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CitySelect({
  countryCode,
  value,
  onChange,
  placeholder = "Şehir seçiniz",
  className,
  disabled,
}: CitySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cities, setCities] = useState<ApiCity[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);

  // States for Turkey (from states table)
  const [statesList, setStatesList] = useState<ApiState[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // TR olduğunda states, diğer ülkelerde cities kullan
  const isTurkey = countryCode === "TR";

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

  // ── Türkiye: states tablosundan şehirleri çek ──
  const fetchStates = useCallback(async () => {
    if (!countryCode || !isTurkey) return;
    setStatesLoading(true);
    try {
      const res = await stateService.list(countryCode);
      setStatesList(res.states || []);
    } catch {
      // ignore
    } finally {
      setStatesLoading(false);
    }
  }, [countryCode, isTurkey]);

  // ── Diğer ülkeler: cities tablosundan çek ──
  const fetchCities = useCallback(
    async (searchTerm: string, pageNum: number, append: boolean) => {
      if (!countryCode || isTurkey) return;
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await cityService.list({
          country: countryCode,
          search: searchTerm || undefined,
          page: pageNum,
          limit: 20,
        });
        if (append) {
          setCities((prev) => [...prev, ...res.cities]);
        } else {
          setCities(res.cities);
        }
        setHasMore(res.hasMore);
        setTotal(res.total);
        setPage(pageNum);
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [countryCode, isTurkey]
  );

  // Load on open or country change
  useEffect(() => {
    if (isOpen && countryCode) {
      if (isTurkey) {
        if (statesList.length === 0) fetchStates();
      } else {
        setCities([]);
        setPage(1);
        setSearch("");
        fetchCities("", 1, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, countryCode]);

  // Debounced search (only for non-TR)
  useEffect(() => {
    if (!isOpen || isTurkey) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCities([]);
      setPage(1);
      fetchCities(search, 1, false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Infinite scroll (only for non-TR)
  const handleScroll = useCallback(() => {
    if (isTurkey) return;
    if (!listRef.current || !hasMore || loadingMore) return;
    const el = listRef.current;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      fetchCities(search, page + 1, true);
    }
  }, [isTurkey, hasMore, loadingMore, search, page, fetchCities]);

  // Auto-focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // ── TR için filtrelenmiş liste ──
  const filteredStates = isTurkey
    ? statesList.filter(s => s.stateName.toLowerCase().includes(search.toLowerCase()))
    : [];

  // Hangi veri kümesini kullanıyoruz?
  const isLoading = isTurkey ? statesLoading : loading;
  const items = isTurkey ? filteredStates : cities;
  const itemCount = isTurkey ? filteredStates.length : total;

  return (
    <div className={cn("relative w-full")} ref={containerRef}>
      <button
        type="button"
        disabled={disabled || !countryCode}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl bg-surface px-4 text-sm text-foreground ring-1 ring-border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/35 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span className={value ? "text-foreground truncate" : "text-muted truncate"}>
          {value || placeholder}
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
              placeholder="Şehir ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted min-w-0"
            />
            {itemCount > 0 && (
              <span className="text-[10px] text-muted shrink-0">
                {isTurkey ? `${filteredStates.length} şehir` : `${total} şehir`}
              </span>
            )}
          </div>

          {/* List */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto p-1 text-left"
            onScroll={handleScroll}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Yükleniyor...
              </div>
            ) : items.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted">
                {search ? "Sonuç bulunamadı." : "Şehir bulunamadı."}
              </div>
            ) : isTurkey ? (
              /* ── TR: states listesi ── */
              <>
                {filteredStates.map((state) => (
                  <button
                    key={state.id}
                    type="button"
                    onClick={() => {
                      onChange(state.stateName);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-surface-2",
                      value === state.stateName &&
                        "bg-brand-50 text-brand-900 font-medium hover:bg-brand-50"
                    )}
                  >
                    <span className="truncate">{state.stateName}</span>
                    {value === state.stateName && (
                      <Check className="h-4 w-4 shrink-0 text-brand-600" />
                    )}
                  </button>
                ))}
              </>
            ) : (
              /* ── Diğer ülkeler: cities listesi ── */
              <>
                {cities.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      onChange(city.cityName);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-surface-2",
                      value === city.cityName &&
                        "bg-brand-50 text-brand-900 font-medium hover:bg-brand-50"
                    )}
                  >
                    <span className="truncate">{city.cityName}</span>
                    {value === city.cityName && (
                      <Check className="h-4 w-4 shrink-0 text-brand-600" />
                    )}
                  </button>
                ))}
                {loadingMore && (
                  <div className="flex items-center justify-center gap-2 p-2 text-xs text-muted">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Daha fazla yükleniyor...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
