"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { maskCPF, maskPhone } from "@/lib/utils";
import type { StatusAluno } from "@/lib/types";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";
import {
  clienteListFiltersToFormValues,
  type ClienteListFilters,
} from "@/lib/tenant/comercial/clientes-filters";
import {
  CLIENTE_LIST_VIEW_VALUES,
  getClienteListViewLabel,
  type ClienteListView,
} from "@/lib/tenant/comercial/clientes-list-view";

import { ClientesAdvancedFiltersSheet } from "./clientes-advanced-filters-sheet";

const STATUS_FILTERS: { value: WithFilterAll<StatusAluno>; label: string }[] = [
  { value: FILTER_ALL, label: "Todos" },
  { value: "ATIVO", label: "Ativos" },
  { value: "SUSPENSO", label: "Suspensos" },
  { value: "INATIVO", label: "Inativos" },
];

interface ClientesFilterBarProps {
  filtro: WithFilterAll<StatusAluno>;
  statusTotals: Record<string, number>;
  buscaInput: string;
  onBuscaChange: (value: string) => void;
  pageSize: number;
  sortBy: "cadastro" | "nome";
  onSortChange: (sort: "cadastro" | "nome") => void;
  onFilterChange: (params: Record<string, string | number | null>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  advancedFilters: ClienteListFilters;
  advancedFilterCount: number;
  view: ClienteListView;
  onViewChange: (view: ClienteListView) => void;
}

export function ClientesFilterBar({
  filtro,
  statusTotals,
  buscaInput,
  onBuscaChange,
  pageSize,
  sortBy,
  onSortChange,
  onFilterChange,
  onClear,
  hasActiveFilters,
  advancedFilters,
  advancedFilterCount,
  view,
  onViewChange,
}: ClientesFilterBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() =>
              onFilterChange({ status: s.value === FILTER_ALL ? null : s.value })
            }
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filtro === s.value
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {s.label}
            {(s.value === FILTER_ALL ||
              s.value === "ATIVO" ||
              s.value === "SUSPENSO" ||
              s.value === "INATIVO") && (
              <span className="ml-1.5 text-muted-foreground">
                ({statusTotals[s.value] ?? 0})
              </span>
            )}
          </button>
        ))}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="ml-2 h-8 border border-transparent text-xs hover:bg-muted"
          >
            <X className="mr-1 size-3.5" />
            Limpar
          </Button>
        )}
      </div>

      <div className="relative ml-auto">
        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF, telefone ou e-mail..."
          value={buscaInput}
          onChange={(e) => {
            const raw = e.target.value;
            const hasLetters = /[a-zA-Z@]/.test(raw);
            if (hasLetters) {
              onBuscaChange(raw);
              return;
            }
            const digits = raw.replace(/\D/g, "");
            if (digits.length >= 11) {
              onBuscaChange(maskCPF(raw));
            } else {
              onBuscaChange(maskPhone(raw));
            }
          }}
          className="w-72 border-border bg-secondary pl-8 text-sm"
        />
      </div>

      <ClientesAdvancedFiltersSheet
        values={clienteListFiltersToFormValues(advancedFilters)}
        activeCount={advancedFilterCount}
        onApply={onFilterChange}
      />

      <div className="w-40">
        <Select value={view} onValueChange={(value) => onViewChange(value as ClienteListView)}>
          <SelectTrigger className="w-full border-border bg-secondary text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            {CLIENTE_LIST_VIEW_VALUES.map((item) => (
              <SelectItem key={item} value={item}>
                {getClienteListViewLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-40">
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as "cadastro" | "nome")}>
          <SelectTrigger className="w-full border-border bg-secondary text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            <SelectItem value="cadastro">Mais recentes</SelectItem>
            <SelectItem value="nome">Nome A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-36">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onFilterChange({ size: v })}
        >
          <SelectTrigger className="w-full border-border bg-secondary text-xs">
            <SelectValue placeholder="Itens por página" />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            <SelectItem value="20">20 por pag.</SelectItem>
            <SelectItem value="50">50 por pag.</SelectItem>
            <SelectItem value="100">100 por pag.</SelectItem>
            <SelectItem value="200">200 por pag.</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
