"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SuggestionOption {
  id: string;
  label: string;
  searchText?: string;
}

export function SuggestionInput({
  inputId,
  inputAriaLabel,
  value,
  onValueChange,
  onSelect,
  options,
  onFocusOpen,
  placeholder,
  emptyText = "Nenhum resultado",
  className,
  minCharsToSearch = 0,
  preloadOnFocus = false,
}: {
  inputId?: string;
  inputAriaLabel?: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (option: SuggestionOption) => void;
  onFocusOpen?: () => void;
  options: SuggestionOption[];
  placeholder?: string;
  emptyText?: string;
  className?: string;
  minCharsToSearch?: number;
  preloadOnFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filtered = useMemo(() => {
    const term = value.trim().toLowerCase();
    if (term.length < minCharsToSearch) return [];
    if (!term) return options.slice(0, 10);
    return options
      .filter((option) => {
        const hay = `${option.label} ${option.searchText ?? ""}`.toLowerCase();
        return hay.includes(term);
      })
      .slice(0, 12);
  }, [minCharsToSearch, options, value]);

  const normalizedActiveIndex =
    open && filtered.length > 0
      ? activeIndex >= 0 && activeIndex < filtered.length
        ? activeIndex
        : 0
      : -1;

  function selectOption(option: SuggestionOption) {
    onSelect(option);
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        id={inputId}
        aria-label={inputAriaLabel}
        value={value}
        onFocus={() => {
          const shouldOpen = value.trim().length >= minCharsToSearch;
          if (shouldOpen && preloadOnFocus && onFocusOpen) onFocusOpen();
          setOpen(shouldOpen);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          const nextValue = e.target.value;
          onValueChange(nextValue);
          const shouldOpen = nextValue.trim().length >= minCharsToSearch;
          if (shouldOpen && onFocusOpen) onFocusOpen();
          setOpen(shouldOpen);
        }}
        onKeyDown={(e) => {
          if (
            !open &&
            (e.key === "ArrowDown" || e.key === "ArrowUp") &&
            value.trim().length >= minCharsToSearch
          ) {
            setOpen(true);
          }
          if (!open || filtered.length === 0) return;

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((normalizedActiveIndex + 1) % filtered.length);
            return;
          }

          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(normalizedActiveIndex <= 0 ? filtered.length - 1 : normalizedActiveIndex - 1);
            return;
          }

          if (e.key === "Enter") {
            e.preventDefault();
            const option = filtered[normalizedActiveIndex] ?? filtered[0];
            if (option) selectOption(option);
            return;
          }

          if (e.key === "Tab") {
            const option = filtered[normalizedActiveIndex] ?? filtered[0];
            if (option) selectOption(option);
          }
        }}
        placeholder={placeholder}
        className="bg-secondary border-border"
      />

      {open && (
        <div className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-card shadow-lg">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">{emptyText}</p>
          )}
          {filtered.map((option) => (
            <button
              key={option.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(filtered.findIndex((f) => f.id === option.id))}
              onClick={() => selectOption(option)}
              className={cn(
                "w-full cursor-pointer border-b border-border/60 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-secondary/70",
                normalizedActiveIndex >= 0 && filtered[normalizedActiveIndex]?.id === option.id && "bg-secondary/70"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
