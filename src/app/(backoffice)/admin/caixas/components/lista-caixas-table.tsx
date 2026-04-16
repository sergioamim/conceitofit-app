"use client";

import { useCallback, useMemo, useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState } from "@/components/shared/list-states";
import {
  PaginatedTable,
  type PaginatedTableColumn,
} from "@/components/shared/paginated-table";
import { formatBRL, formatDateTime } from "@/lib/formatters";
import type { CaixaResponse } from "@/lib/api/caixa.types";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";

type StatusValue = WithFilterAll<string>;

const STATUS_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: FILTER_ALL, label: "Todos os status" },
  { value: "ABERTO", label: "Aberto" },
  { value: "FECHADO", label: "Fechado" },
  { value: "FECHADO_COM_DIFERENCA", label: "Fechado c/ diferença" },
];

export interface CaixasFilterValues {
  status: StatusValue;
  operadorId: string;
  from: string;
  to: string;
}

const filtersSchema = z.object({
  status: z.string(),
  operadorId: z.string().trim(),
  from: z.string().trim(),
  to: z.string().trim(),
});

const PAGE_SIZE = 10;

const COLUMNS: PaginatedTableColumn[] = [
  { label: "Operador" },
  { label: "Aberto em", className: "w-[150px]" },
  { label: "Fechado em", className: "w-[150px]" },
  { label: "Valor abertura", className: "w-[130px]" },
  { label: "Valor fechamento", className: "w-[150px]" },
  { label: "Status", className: "w-[180px]" },
  { label: "Ações", className: "w-[120px]" },
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "ABERTO":
      return "border-amber-400/40 bg-amber-500/10 text-amber-200";
    case "FECHADO":
      return "border-gym-teal/30 bg-gym-teal/10 text-gym-teal";
    case "FECHADO_COM_DIFERENCA":
      return "border-gym-danger/30 bg-gym-danger/10 text-gym-danger";
    default:
      return "border-border bg-secondary text-muted-foreground";
  }
}

export interface ListaCaixasTableProps {
  caixas: CaixaResponse[];
  loading?: boolean;
  initialFilters?: Partial<CaixasFilterValues>;
  onFiltersChange: (values: CaixasFilterValues) => void;
  onAjustar?: (caixa: CaixaResponse) => void;
  /**
   * Quando true, exibe o botão "Ajustar" apenas em caixas encerrados
   * (FECHADO / FECHADO_COM_DIFERENCA). BE (CXO-102) valida novamente via
   * @PreAuthorize — este guard FE é defensivo.
   */
  isAdmin?: boolean;
}

const AJUSTAVEIS_STATUS = new Set(["FECHADO", "FECHADO_COM_DIFERENCA"]);

export function ListaCaixasTable({
  caixas,
  loading,
  initialFilters,
  onFiltersChange,
  onAjustar,
  isAdmin,
}: ListaCaixasTableProps) {
  const { toast } = useToast();

  const form = useForm<CaixasFilterValues>({
    resolver: zodResolver(filtersSchema),
    defaultValues: {
      status: initialFilters?.status ?? FILTER_ALL,
      operadorId: initialFilters?.operadorId ?? "",
      from: initialFilters?.from ?? "",
      to: initialFilters?.to ?? "",
    },
  });

  const [page, setPage] = useState(0);

  const handleSubmit = form.handleSubmit((values) => {
    setPage(0);
    onFiltersChange(values);
  });

  const handleReset = useCallback(() => {
    form.reset({ status: FILTER_ALL, operadorId: "", from: "", to: "" });
    setPage(0);
    onFiltersChange({ status: FILTER_ALL, operadorId: "", from: "", to: "" });
  }, [form, onFiltersChange]);

  const pageItems = useMemo(
    () => caixas.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [caixas, page],
  );
  const hasNext = (page + 1) * PAGE_SIZE < caixas.length;

  const renderCells = useCallback(
    (item: CaixaResponse) => (
      <>
        <TableCell className="px-4 py-3 font-medium text-foreground">
          {item.operadorNome || item.operadorId}
        </TableCell>
        <TableCell className="px-4 py-3 text-sm">{formatDateTime(item.abertoEm)}</TableCell>
        <TableCell className="px-4 py-3 text-sm">
          {item.fechadoEm ? formatDateTime(item.fechadoEm) : "—"}
        </TableCell>
        <TableCell className="px-4 py-3 tabular-nums text-sm">
          {formatBRL(item.valorAbertura)}
        </TableCell>
        <TableCell className="px-4 py-3 tabular-nums text-sm">
          {item.valorFechamento != null ? formatBRL(item.valorFechamento) : "—"}
        </TableCell>
        <TableCell className="px-4 py-3">
          <Badge variant="outline" className={statusBadgeClass(item.status)}>
            {item.status.replace(/_/g, " ")}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5"
              onClick={() => {
                toast({
                  title: "Detalhe do caixa",
                  description:
                    "Em breve: tela de detalhe do caixa (movimentos, sangrias, fechamento).",
                });
              }}
              aria-label={`Ver detalhe do caixa de ${item.operadorNome || item.operadorId}`}
            >
              <Eye className="size-3.5" />
              Ver
            </Button>
            {isAdmin && AJUSTAVEIS_STATUS.has(item.status) ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5"
                onClick={() => {
                  if (onAjustar) {
                    onAjustar(item);
                    return;
                  }
                  toast({
                    title: "Ajuste administrativo",
                    description:
                      "Modal de ajuste indisponível no contexto atual.",
                  });
                }}
                aria-label={`Lançar ajuste administrativo no caixa de ${item.operadorNome || item.operadorId}`}
                data-testid={`ajustar-caixa-${item.id}`}
              >
                <Pencil className="size-3.5" />
                Ajustar
              </Button>
            ) : null}
          </div>
        </TableCell>
      </>
    ),
    [isAdmin, onAjustar, toast],
  );

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="caixas-status">Status</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="caixas-status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="caixas-operador">Operador (UUID)</Label>
            <Input
              id="caixas-operador"
              placeholder="ID do operador"
              {...form.register("operadorId")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="caixas-from">De</Label>
            <Input id="caixas-from" type="date" {...form.register("from")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="caixas-to">Até</Label>
            <Input id="caixas-to" type="date" {...form.register("to")} />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="submit" className="gap-2">
            Aplicar filtros
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Limpar
          </Button>
        </div>
      </form>

      {!loading && caixas.length === 0 ? (
        <EmptyState
          variant="search"
          message="Nenhum caixa encontrado para os filtros aplicados."
        />
      ) : (
        <PaginatedTable<CaixaResponse>
          columns={COLUMNS}
          items={pageItems}
          emptyText="Nenhum caixa registrado."
          renderCells={renderCells}
          getRowKey={(item) => item.id}
          page={page}
          pageSize={PAGE_SIZE}
          total={caixas.length}
          hasNext={hasNext}
          onPrevious={() => setPage((current) => Math.max(0, current - 1))}
          onNext={() => setPage((current) => current + 1)}
          isLoading={loading}
          itemLabel="caixas"
          tableAriaLabel="Tabela paginada de caixas operacionais"
        />
      )}
    </div>
  );
}
