"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SuggestionInput,
  type SuggestionOption,
} from "@/components/shared/suggestion-input";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";
import type { StatusPagamento } from "@/lib/types";

const STATUS_FILTERS: { value: WithFilterAll<StatusPagamento>; label: string }[] = [
  { value: FILTER_ALL, label: "Todos" },
  { value: "PENDENTE", label: "Pendentes" },
  { value: "VENCIDO", label: "Vencidos" },
  { value: "PAGO", label: "Pagos" },
  { value: "CANCELADO", label: "Cancelados" },
];

interface PagamentosFiltersProps {
  filtro: WithFilterAll<StatusPagamento>;
  onFiltroChange: (value: WithFilterAll<StatusPagamento>) => void;
  clienteFiltro: string;
  onClienteFiltroChange: (value: string) => void;
  clienteBusca: string;
  onClienteBuscaChange: (value: string) => void;
  onClienteSelect: (option: SuggestionOption) => void;
  onClienteSuggestionOpen: () => void;
  mes: number;
  ano: number;
  onMesAnoChange: (next: { month: number; year: number }) => void;
  clienteOptions: SuggestionOption[];
  clienteLoading?: boolean;
}

export function PagamentosFilters({
  filtro,
  onFiltroChange,
  clienteFiltro,
  onClienteFiltroChange,
  clienteBusca,
  onClienteBuscaChange,
  onClienteSelect,
  onClienteSuggestionOpen,
  mes,
  ano,
  onMesAnoChange,
  clienteOptions,
  clienteLoading = false,
}: PagamentosFiltersProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex gap-1.5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => onFiltroChange(s.value)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filtro === s.value
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Button asChild variant="outline" className="border-border text-xs">
          <Link href="/pagamentos/emitir-em-lote">Emitir NF em lote</Link>
        </Button>
        <div className="flex items-center gap-2">
          <SuggestionInput
            inputAriaLabel="Buscar cliente"
            value={clienteBusca}
            onValueChange={(value) => {
              onClienteBuscaChange(value);
              if (!value.trim() && clienteFiltro !== FILTER_ALL) {
                onClienteFiltroChange(FILTER_ALL);
              }
            }}
            onSelect={onClienteSelect}
            onFocusOpen={onClienteSuggestionOpen}
            options={clienteOptions}
            placeholder="Buscar cliente"
            emptyText={clienteLoading ? "Carregando clientes..." : "Nenhum cliente encontrado"}
            className="w-64"
            minCharsToSearch={0}
            preloadOnFocus
            showAllOnFocus
          />
          {clienteFiltro !== FILTER_ALL ? (
            <Button
              type="button"
              variant="outline"
              className="border-border text-xs"
              onClick={() => {
                onClienteBuscaChange("");
                onClienteFiltroChange(FILTER_ALL);
              }}
            >
              Limpar
            </Button>
          ) : null}
        </div>
        <MonthYearPicker
          month={mes}
          year={ano}
          onChange={onMesAnoChange}
        />
      </div>
    </div>
  );
}
