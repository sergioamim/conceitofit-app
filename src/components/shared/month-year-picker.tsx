"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export function MonthYearPicker({
  month,
  year,
  onChange,
  yearsBack = 3,
}: {
  month: number;
  year: number;
  onChange: (next: { month: number; year: number }) => void;
  yearsBack?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const canGoNext =
    year < currentYear || (year === currentYear && month < currentMonth);

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        onClick={() => {
          const prev = new Date(year, month, 1);
          prev.setMonth(prev.getMonth() - 1);
          onChange({ month: prev.getMonth(), year: prev.getFullYear() });
        }}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground hover:text-foreground"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-2 inline-flex h-9 items-center gap-2 rounded-md border border-border bg-secondary px-3 text-sm text-muted-foreground hover:text-foreground"
      >
        {MONTHS[month]} {year}
        <ChevronDown className="size-3.5" />
      </button>
      {canGoNext && (
        <button
          onClick={() => {
            const next = new Date(year, month, 1);
            next.setMonth(next.getMonth() + 1);
            onChange({ month: next.getMonth(), year: next.getFullYear() });
          }}
          className="ml-2 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground hover:text-foreground"
          aria-label="Mês seguinte"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-card p-3 shadow-xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mês / Ano
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {MONTHS.map((m, idx) => {
              const disabled = year === currentYear && idx > currentMonth;
              return (
                <button
                  key={m}
                  onClick={() => {
                    if (disabled) return;
                    onChange({ month: idx, year });
                    setOpen(false);
                  }}
                  disabled={disabled}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs",
                    month === idx
                      ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                      : "border-border text-muted-foreground hover:text-foreground",
                    disabled &&
                      "cursor-not-allowed opacity-40 hover:text-muted-foreground"
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
          <div className="mt-3">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ano
            </label>
            <select
              value={year}
              onChange={(e) => onChange({ month, year: parseInt(e.target.value, 10) })}
              className="mt-1 w-full rounded-md border border-border bg-secondary px-2 py-1 text-sm text-foreground"
            >
              {Array.from({ length: yearsBack + 1 }).map((_, i) => {
                const y = currentYear - yearsBack + i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
