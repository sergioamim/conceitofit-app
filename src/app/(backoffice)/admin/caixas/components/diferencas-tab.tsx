"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState, ListErrorState } from "@/components/shared/list-states";
import {
  PaginatedTable,
  type PaginatedTableColumn,
} from "@/components/shared/paginated-table";
import { formatBRL, formatDateTime } from "@/lib/formatters";
import { getDiferencas } from "@/lib/api/caixa";
import type { DiferencaItemResponse } from "@/lib/api/caixa.types";
import { ApiRequestError } from "@/lib/api/http";

const PAGE_SIZE = 10;

const COLUMNS: PaginatedTableColumn[] = [
  { label: "Operador" },
  { label: "Data fechamento", className: "w-[180px]" },
  { label: "Diferença", className: "w-[160px]" },
];

export interface DiferencasFilterValues {
  operadorId: string;
  from: string;
  to: string;
}

const filtersSchema = z.object({
  operadorId: z.string().trim(),
  from: z.string().trim(),
  to: z.string().trim(),
});

/**
 * Calcula intervalo padrão (últimos 7 dias). Resolve apenas no client (após
 * mount) para preservar hidratação determinística.
 */
function defaultLast7Days(): { from: string; to: string } {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 7);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(past), to: fmt(now) };
}

export interface DiferencasTabProps {
  /** Permite ao container externo injetar um operador inicial (opcional). */
  initialOperadorId?: string;
}

export function DiferencasTab({ initialOperadorId = "" }: DiferencasTabProps) {
  const { toast } = useToast();

  const form = useForm<DiferencasFilterValues>({
    resolver: zodResolver(filtersSchema),
    defaultValues: { operadorId: initialOperadorId, from: "", to: "" },
  });

  const [items, setItems] = useState<DiferencaItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [activeFilters, setActiveFilters] = useState<DiferencasFilterValues>({
    operadorId: initialOperadorId,
    from: "",
    to: "",
  });

  // Hidratação client-only para evitar mismatch SSR/client em dates.
  useEffect(() => {
    setHydrated(true);
    const range = defaultLast7Days();
    form.reset({ operadorId: initialOperadorId, from: range.from, to: range.to });
    setActiveFilters({ operadorId: initialOperadorId, from: range.from, to: range.to });
  }, [form, initialOperadorId]);

  const fetchItems = useCallback(
    async (filters: DiferencasFilterValues) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDiferencas({
          operadorId: filters.operadorId || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
        });
        setItems(data);
      } catch (err) {
        if (err instanceof ApiRequestError) {
          if (err.status === 403) {
            const message =
              "Acesso restrito: somente perfis gerente ou administrativo podem consultar diferenças.";
            setError(message);
            toast({
              title: "Sem permissão",
              description: message,
              variant: "destructive",
            });
            return;
          }
        }
        const message =
          err instanceof Error ? err.message : "Falha ao carregar diferenças.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (!hydrated) return;
    void fetchItems(activeFilters);
  }, [activeFilters, fetchItems, hydrated]);

  const handleSubmit = form.handleSubmit((values) => {
    setPage(0);
    setActiveFilters(values);
  });

  const pageItems = useMemo(
    () => items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [items, page],
  );
  const hasNext = (page + 1) * PAGE_SIZE < items.length;

  const renderCells = useCallback(
    (item: DiferencaItemResponse) => {
      const isNegative = item.diferenca < 0;
      const tone = isNegative ? "text-gym-danger" : "text-gym-warning";
      return (
        <>
          <TableCell className="px-4 py-3 font-medium text-foreground">
            {item.operadorNome || item.operadorId}
          </TableCell>
          <TableCell className="px-4 py-3 text-sm">
            {formatDateTime(item.dataFechamento)}
          </TableCell>
          <TableCell className={`px-4 py-3 tabular-nums text-sm font-semibold ${tone}`}>
            {formatBRL(item.diferenca)}
          </TableCell>
        </>
      );
    },
    [],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diferenças nos fechamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4"
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dif-operador">Operador (UUID)</Label>
              <Input
                id="dif-operador"
                placeholder="Filtrar por operador"
                {...form.register("operadorId")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dif-from">De</Label>
              <Controller
                control={form.control}
                name="from"
                render={({ field }) => (
                  <Input
                    id="dif-from"
                    type="date"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dif-to">Até</Label>
              <Controller
                control={form.control}
                name="to"
                render={({ field }) => (
                  <Input
                    id="dif-to"
                    type="date"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="sm:col-span-4">
              <Button type="submit" className="gap-2">
                Aplicar filtros
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <ListErrorState error={error} onRetry={() => void fetchItems(activeFilters)} />
      ) : !loading && items.length === 0 ? (
        <EmptyState
          variant="list"
          message="Nenhuma diferença encontrada no período selecionado."
        />
      ) : (
        <PaginatedTable<DiferencaItemResponse>
          columns={COLUMNS}
          items={pageItems}
          emptyText="Nenhuma diferença encontrada."
          renderCells={renderCells}
          getRowKey={(item) => item.caixaId}
          page={page}
          pageSize={PAGE_SIZE}
          total={items.length}
          hasNext={hasNext}
          onPrevious={() => setPage((current) => Math.max(0, current - 1))}
          onNext={() => setPage((current) => current + 1)}
          isLoading={loading}
          itemLabel="diferenças"
          tableAriaLabel="Tabela de diferenças de fechamento de caixa"
        />
      )}
    </div>
  );
}
