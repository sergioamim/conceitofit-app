"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";
import type { StatusPagamento, Aluno } from "@/lib/types";

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
  mes: number;
  ano: number;
  onMesAnoChange: (next: { month: number; year: number }) => void;
  clientes: Aluno[];
}

export function PagamentosFilters({
  filtro,
  onFiltroChange,
  clienteFiltro,
  onClienteFiltroChange,
  mes,
  ano,
  onMesAnoChange,
  clientes,
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
        <Select value={clienteFiltro} onValueChange={onClienteFiltroChange}>
          <SelectTrigger className="w-52 bg-secondary border-border text-xs">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value={FILTER_ALL}>Todos clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <MonthYearPicker
          month={mes}
          year={ano}
          onChange={onMesAnoChange}
        />
      </div>
    </div>
  );
}
