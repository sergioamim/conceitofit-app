"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContasPagarWorkspace, CATEGORIA_LABEL, StatusFiltro, CategoriaFiltro, OrigemFiltro } from "../hooks/use-contas-pagar-workspace";
import { FILTER_ALL } from "@/lib/shared/constants/filters";

interface ContasPagarFiltersProps {
  workspace: ContasPagarWorkspace;
}

export function ContasPagarFilters({ workspace }: ContasPagarFiltersProps) {
  const {
    search,
    setSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    status,
    setStatus,
    categoria,
    setCategoria,
    tipoContaFiltro,
    setTipoContaFiltro,
    origemFiltro,
    setOrigemFiltro,
    tiposConta,
  } = workspace;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar fornecedor, descrição, doc ou tipo..."
          className="bg-secondary border-border md:col-span-2"
        />

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Vencimento de
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Vencimento até
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </label>
          <Select value={status} onValueChange={(value) => setStatus(value as StatusFiltro)}>
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="EM_ABERTO">Em aberto</SelectItem>
              <SelectItem value={FILTER_ALL}>Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="VENCIDA">Vencida</SelectItem>
              <SelectItem value="PAGA">Paga</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categoria
          </label>
          <Select value={categoria} onValueChange={(value) => setCategoria(value as CategoriaFiltro)}>
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="TODAS">Todas</SelectItem>
              {Object.entries(CATEGORIA_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo de conta
          </label>
          <Select value={tipoContaFiltro} onValueChange={(value) => setTipoContaFiltro(value)}>
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value={FILTER_ALL}>Todos</SelectItem>
              {tiposConta.map((tipo) => (
                <SelectItem key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Origem
          </label>
          <Select value={origemFiltro} onValueChange={(value) => setOrigemFiltro(value as OrigemFiltro)}>
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="TODAS">Todas</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
              <SelectItem value="RECORRENTE">Recorrente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
