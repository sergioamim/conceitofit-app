"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SuggestionInput,
  type SuggestionOption,
} from "@/components/shared/suggestion-input";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Tipos de filtro suportados
 * --------------------------------------------------------------------------- */

export type TextFilterConfig = {
  type: "text";
  key: string;
  label: string;
  placeholder?: string;
  /** Debounce em ms (padrão: 300) */
  debounceMs?: number;
};

export type SuggestionFilterConfig = {
  type: "suggestion";
  key: string;
  label: string;
  placeholder?: string;
  options: SuggestionOption[];
  onFocusOpen?: () => void;
  minCharsToSearch?: number;
  preloadOnFocus?: boolean;
};

export type SelectFilterConfig = {
  type: "select";
  key: string;
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
};

export type DateRangeFilterConfig = {
  type: "date-range";
  key: string;
  label: string;
  placeholderStart?: string;
  placeholderEnd?: string;
};

export type StatusBadgeFilterConfig = {
  type: "status-badge";
  key: string;
  label: string;
  options: { value: string; label: string; className?: string }[];
};

export type FilterConfig =
  | TextFilterConfig
  | SuggestionFilterConfig
  | SelectFilterConfig
  | DateRangeFilterConfig
  | StatusBadgeFilterConfig;

/* ---------------------------------------------------------------------------
 * Props do componente
 * --------------------------------------------------------------------------- */

export type ActiveFilters = Record<string, string>;

export interface TableFiltersProps {
  filters: FilterConfig[];
  /** Callback quando os filtros mudam. Recebe apenas os filtros com valor. */
  onFiltersChange?: (active: ActiveFilters) => void;
  className?: string;
}

/* ---------------------------------------------------------------------------
 * Helpers internos
 * --------------------------------------------------------------------------- */

/** Monta URL search params string apenas com os valores preenchidos */
function buildSearchString(
  pathname: string,
  params: URLSearchParams,
): string {
  const str = params.toString();
  return str ? `${pathname}?${str}` : pathname;
}

/** Retorna as chaves de filtro definidas (exceto paginação) */
function getFilterKeys(filters: FilterConfig[]): string[] {
  const keys: string[] = [];
  for (const f of filters) {
    if (f.type === "date-range") {
      keys.push(`${f.key}_start`, `${f.key}_end`);
    } else {
      keys.push(f.key);
    }
  }
  return keys;
}

/* ---------------------------------------------------------------------------
 * Componente principal
 * --------------------------------------------------------------------------- */

export function TableFilters({
  filters,
  onFiltersChange,
  className,
}: TableFiltersProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQs = searchParams.toString();

  // Lê valores atuais dos search params (SSR-safe: vêm do URL)
  const readValues = useCallback((): ActiveFilters => {
    const values: ActiveFilters = {};
    for (const key of getFilterKeys(filters)) {
      const v = searchParams.get(key);
      if (v) values[key] = v;
    }
    return values;
  }, [filters, searchParams]);

  const activeFilters = readValues();
  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  // Sincroniza URL search params
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(currentQs);
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      // Reset página ao filtrar
      params.delete("page");
      const url = buildSearchString(pathname, params);
      window.history.pushState(null, "", url);
    },
    [currentQs, pathname],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(currentQs);
    for (const key of getFilterKeys(filters)) {
      params.delete(key);
    }
    params.delete("page");
    const url = buildSearchString(pathname, params);
    window.history.pushState(null, "", url);
  }, [currentQs, filters, pathname]);

  // Emite onFiltersChange quando os filtros mudam
  const prevFiltersRef = useRef<string>("");
  useEffect(() => {
    const serialized = JSON.stringify(activeFilters);
    if (serialized !== prevFiltersRef.current) {
      prevFiltersRef.current = serialized;
      onFiltersChange?.(activeFilters);
    }
  }, [activeFilters, onFiltersChange]);

  return (
    <div
      data-slot="table-filters"
      className={cn(
        "flex flex-wrap items-end gap-3",
        className,
      )}
      role="search"
      aria-label="Filtros da tabela"
    >
      {filters.map((filter) => (
        <FilterField
          key={filter.type === "date-range" ? `${filter.key}_range` : filter.key}
          config={filter}
          searchParams={searchParams}
          setParam={setParam}
        />
      ))}

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
          aria-label="Limpar todos os filtros"
        >
          <X className="size-3.5" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Renderizador de cada tipo de filtro
 * --------------------------------------------------------------------------- */

function FilterField({
  config,
  searchParams,
  setParam,
}: {
  config: FilterConfig;
  searchParams: ReturnType<typeof useSearchParams>;
  setParam: (key: string, value: string | null) => void;
}) {
  switch (config.type) {
    case "text":
      return (
        <TextFilter
          config={config}
          value={searchParams.get(config.key) ?? ""}
          onChange={(v) => setParam(config.key, v || null)}
        />
      );
    case "suggestion":
      return (
        <SuggestionFilter
          config={config}
          value={searchParams.get(config.key) ?? ""}
          onChange={(v) => setParam(config.key, v || null)}
        />
      );
    case "select":
      return (
        <SelectFilter
          config={config}
          value={searchParams.get(config.key) ?? ""}
          onChange={(v) => setParam(config.key, v || null)}
        />
      );
    case "date-range":
      return (
        <DateRangeFilter
          config={config}
          startValue={searchParams.get(`${config.key}_start`) ?? ""}
          endValue={searchParams.get(`${config.key}_end`) ?? ""}
          onStartChange={(v) => setParam(`${config.key}_start`, v || null)}
          onEndChange={(v) => setParam(`${config.key}_end`, v || null)}
        />
      );
    case "status-badge":
      return (
        <StatusBadgeFilter
          config={config}
          value={searchParams.get(config.key) ?? ""}
          onChange={(v) => setParam(config.key, v || null)}
        />
      );
  }
}

/* ---------------------------------------------------------------------------
 * Filtro de texto com debounce
 * --------------------------------------------------------------------------- */

function TextFilter({
  config,
  value,
  onChange,
}: {
  config: TextFilterConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const debounceMs = config.debounceMs ?? 300;
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza valor externo -> local (quando URL muda externamente)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (nextValue: string) => {
      setLocalValue(nextValue);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange(nextValue);
      }, debounceMs);
    },
    [debounceMs, onChange],
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {config.label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={config.placeholder ?? "Buscar..."}
          className="h-9 bg-secondary border-border pl-8 pr-3"
          aria-label={config.label}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Filtro de sugestão (SuggestionInput)
 * --------------------------------------------------------------------------- */

function SuggestionFilter({
  config,
  value,
  onChange,
}: {
  config: SuggestionFilterConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const [inputText, setInputText] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");

  // Resolve label do valor inicial (quando vem da URL)
  useEffect(() => {
    if (value && !selectedLabel) {
      const option = config.options.find((o) => o.id === value);
      if (option) {
        setSelectedLabel(option.label);
        setInputText(option.label);
      }
    }
    if (!value) {
      setSelectedLabel("");
      setInputText("");
    }
  }, [value, config.options, selectedLabel]);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {config.label}
      </span>
      <SuggestionInput
        value={inputText}
        onValueChange={(v) => {
          setInputText(v);
          // Se limpar o texto, limpa o filtro
          if (!v.trim()) {
            setSelectedLabel("");
            onChange("");
          }
        }}
        onSelect={(option) => {
          setInputText(option.label);
          setSelectedLabel(option.label);
          onChange(option.id);
        }}
        options={config.options}
        placeholder={config.placeholder ?? "Buscar..."}
        onFocusOpen={config.onFocusOpen}
        minCharsToSearch={config.minCharsToSearch}
        preloadOnFocus={config.preloadOnFocus}
        className="w-48"
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Filtro select (enum fixo)
 * --------------------------------------------------------------------------- */

function SelectFilter({
  config,
  value,
  onChange,
}: {
  config: SelectFilterConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {config.label}
      </span>
      <Select
        value={value || undefined}
        onValueChange={(v) => onChange(v === "__clear__" ? "" : v)}
      >
        <SelectTrigger
          className="h-9 min-w-[140px] border-border bg-secondary"
          aria-label={config.label}
        >
          <SelectValue placeholder={config.placeholder ?? "Todos"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__clear__">
            {config.placeholder ?? "Todos"}
          </SelectItem>
          {config.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Filtro date-range (dois inputs type="date")
 * --------------------------------------------------------------------------- */

function DateRangeFilter({
  config,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: {
  config: DateRangeFilterConfig;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  const startId = useId();
  const endId = useId();

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {config.label}
      </span>
      <div className="flex items-center gap-2">
        <Input
          id={startId}
          type="date"
          value={startValue}
          onChange={(e) => onStartChange(e.target.value)}
          className="h-9 w-[140px] bg-secondary border-border"
          aria-label={config.placeholderStart ?? `${config.label} - início`}
        />
        <span className="text-xs text-muted-foreground">até</span>
        <Input
          id={endId}
          type="date"
          value={endValue}
          onChange={(e) => onEndChange(e.target.value)}
          className="h-9 w-[140px] bg-secondary border-border"
          aria-label={config.placeholderEnd ?? `${config.label} - fim`}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Filtro status-badge (badges clicáveis)
 * --------------------------------------------------------------------------- */

function StatusBadgeFilter({
  config,
  value,
  onChange,
}: {
  config: StatusBadgeFilterConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {config.label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={config.label}>
        <button
          type="button"
          role="radio"
          aria-checked={!value}
          onClick={() => onChange("")}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
        >
          <Badge
            variant={!value ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors",
              !value
                ? "bg-gym-accent/15 text-gym-accent border-gym-accent/30"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Todos
          </Badge>
        </button>
        {config.options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(isActive ? "" : opt.value)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            >
              <Badge
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  isActive
                    ? opt.className ?? "bg-gym-accent/15 text-gym-accent border-gym-accent/30"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
