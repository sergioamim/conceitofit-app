"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getBusinessTodayIso } from "@/lib/business-date";
import { resolveVendaFluxoStatusFromApi } from "@/lib/tenant/comercial/runtime";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { TipoFormaPagamento, Venda } from "@/lib/types";
import { STATUS_FLUXO_COMERCIAL_LABEL } from "@/lib/tenant/comercial/plano-flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { TableCell } from "@/components/ui/table";
import { formatBRL, formatDateTime } from "@/lib/formatters";
import { ExportMenu, type ExportColumn } from "@/components/shared/export-menu";
import { ListErrorState } from "@/components/shared/list-states";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { useVendas } from "@/lib/query/use-vendas";

const TIPO_LABEL: Record<Venda["tipo"], string> = {
  PLANO: "Contrato",
  SERVICO: "Serviço",
  PRODUTO: "Produto",
};

const FORMA_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão crédito",
  CARTAO_DEBITO: "Cartão débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

function resolveFormaPagamento(venda: Venda): TipoFormaPagamento | null {
  const forma = (venda as { pagamento?: { formaPagamento?: unknown } }).pagamento?.formaPagamento;
  return typeof forma === "string" && forma in FORMA_LABEL ? (forma as TipoFormaPagamento) : null;
}

function formatItensResumo(venda: Venda): string {
  if (!venda.itens.length) {
    return "Sem item";
  }

  const itens = venda.itens.map((item) => {
    const descricaoBruta = item.descricao ?? "";
    const descricaoSemTipo = descricaoBruta
      .replace(/^(plano|servi[cç]o|produto)\s*:\s*/i, "")
      .replace(/^contrato\s*-\s*/i, "")
      .replace(/\s*[-–—]?\s*In[ií]cio\s+em:\s*\d{2}[\/-]\d{2}[\/-]\d{4}.*$/i, "")
      .trim();

    return descricaoSemTipo || "Sem item";
  });

  return itens.join(" | ");
}

function getFluxoBadgeClass(value: string | undefined) {
  if (value === "ATIVO") return "bg-gym-teal/15 text-gym-teal";
  if (value === "AGUARDANDO_ASSINATURA") return "bg-amber-500/15 text-amber-400";
  if (value === "AGUARDANDO_PAGAMENTO") return "bg-gym-warning/15 text-gym-warning";
  if (value === "CANCELADO") return "bg-gym-danger/15 text-gym-danger";
  if (value === "VENCIDO") return "bg-muted text-muted-foreground";
  return "bg-gym-teal/15 text-gym-teal";
}

type TipoFiltro = WithFilterAll<Venda["tipo"]>;
type FormaPagamentoFiltro = WithFilterAll<TipoFormaPagamento>;
const MIN_FILTER_YEAR = 2000;

function todayIso() {
  return getBusinessTodayIso();
}

const PAGE_SIZE = 20;

function isValidFilterDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  if (!Number.isFinite(year) || year < MIN_FILTER_YEAR) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

export default function VendasPage() {
  const { tenantId, tenantResolved } = useTenantContext();
  const today = todayIso();

  // UI state (filtros e paginação)
  const [page, setPage] = useState(0);
  const [periodoInicio, setPeriodoInicio] = useState(today);
  const [periodoFim, setPeriodoFim] = useState(today);
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>(FILTER_ALL);
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState<FormaPagamentoFiltro>(FILTER_ALL);

  const [inicioNormalizado, fimNormalizado] = useMemo(() => {
    if (!periodoInicio || !periodoFim) return ["", ""];
    if (!isValidFilterDate(periodoInicio) || !isValidFilterDate(periodoFim)) return ["", ""];
    return periodoInicio <= periodoFim ? [periodoInicio, periodoFim] : [periodoFim, periodoInicio];
  }, [periodoInicio, periodoFim]);

  // Server state via TanStack Query
  const { data: response, isLoading: loading, error: queryError, refetch } = useVendas({
    tenantId: tenantId ?? undefined,
    tenantResolved,
    page,
    size: PAGE_SIZE,
    dataInicio: inicioNormalizado || undefined,
    dataFim: fimNormalizado || undefined,
    tipoVenda: filtroTipo === FILTER_ALL ? undefined : filtroTipo,
    formaPagamento: filtroFormaPagamento === FILTER_ALL ? undefined : filtroFormaPagamento,
  });

  const vendas = response?.items ?? [];
  const hasNext = response?.hasNext ?? false;
  const totalRegistros = response?.total;
  const totalGeralPeriodo = response?.totalGeral;
  const totaisPorFormaPagamento = response?.totaisPorFormaPagamento ?? {};
  const error = queryError ? normalizeErrorMessage(queryError) : null;

  const totalPaginas = useMemo(() => {
    if (typeof totalRegistros === "number" && totalRegistros > 0) {
      return Math.max(1, Math.ceil(totalRegistros / PAGE_SIZE));
    }
    if (typeof totalRegistros === "number" && totalRegistros === 0) return 1;
    if (hasNext) return page + 2;
    return page + 1;
  }, [hasNext, page, totalRegistros]);

  const totalFiltrado = useMemo(() => {
    if (typeof totalGeralPeriodo === "number") return totalGeralPeriodo;
    return vendas.reduce((sum, venda) => sum + venda.total, 0);
  }, [totalGeralPeriodo, vendas]);

  const totaisPorFormaLocal = useMemo(() => {
    const base: Record<TipoFormaPagamento, number> = {
      DINHEIRO: 0,
      PIX: 0,
      CARTAO_CREDITO: 0,
      CARTAO_DEBITO: 0,
      BOLETO: 0,
      RECORRENTE: 0,
    };
    for (const venda of vendas) {
      const forma = resolveFormaPagamento(venda);
      if (!forma) continue;
      base[forma] += venda.total;
    }
    return base;
  }, [vendas]);

  const resumoFormas = useMemo(
    () => (Object.keys(FORMA_LABEL) as TipoFormaPagamento[]).map((forma) => ({
      forma,
      label: FORMA_LABEL[forma],
      total: totaisPorFormaPagamento[forma] ?? totaisPorFormaLocal[forma],
    })),
    [totaisPorFormaLocal, totaisPorFormaPagamento]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Vendas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vendas da unidade ativa com filtros por período, tipo e forma de pagamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            data={vendas}
            columns={[
              { label: "Data", accessor: (v) => formatDateTime(v.dataCriacao) },
              { label: "Cliente", accessor: (v) => v.clienteNome ?? "Consumidor não identificado" },
              { label: "Tipo", accessor: (v) => TIPO_LABEL[v.tipo] },
              { label: "Pagamento", accessor: (v) => { const f = resolveFormaPagamento(v); return f ? FORMA_LABEL[f] : "Não informado"; } },
              { label: "Total", accessor: (v) => formatBRL(v.total) },
              { label: "Status", accessor: (v) => { const s = resolveVendaFluxoStatusFromApi(v); return s ? STATUS_FLUXO_COMERCIAL_LABEL[s] : v.status; } },
            ] satisfies ExportColumn<Venda>[]}
            filename="vendas"
            title="Vendas"
          />
          <Link href="/vendas/nova">
            <Button>
              <Plus className="size-4" />
              Nova venda
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1">
            <label htmlFor="filtro-data-inicio" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data inicial
            </label>
            <Input
              id="filtro-data-inicio"
              type="date"
              min={`${MIN_FILTER_YEAR}-01-01`}
              max={today}
              value={periodoInicio}
              onChange={(e) => {
                setPeriodoInicio(e.target.value);
                setPage(0);
              }}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="filtro-data-fim" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data final
            </label>
            <Input
              id="filtro-data-fim"
              type="date"
              min={`${MIN_FILTER_YEAR}-01-01`}
              max={today}
              value={periodoFim}
              onChange={(e) => {
                setPeriodoFim(e.target.value);
                setPage(0);
              }}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de venda</label>
            <Select
              value={filtroTipo}
              onValueChange={(v) => {
                setFiltroTipo(v as TipoFiltro);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                <SelectItem value="PLANO">Contrato</SelectItem>
                <SelectItem value="SERVICO">Serviço</SelectItem>
                <SelectItem value="PRODUTO">Produto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forma de pagamento</label>
            <Select
              value={filtroFormaPagamento}
              onValueChange={(v) => {
                setFiltroFormaPagamento(v as FormaPagamentoFiltro);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                {Object.keys(FORMA_LABEL).map((forma) => (
                  <SelectItem key={forma} value={forma}>
                    {FORMA_LABEL[forma as TipoFormaPagamento]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total filtrado</p>
          <p className="mt-1 font-display text-2xl font-bold text-gym-accent">{formatBRL(totalFiltrado)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{totalRegistros ?? vendas.length} venda(s)</p>
        </div>
        {resumoFormas.map((item) => (
          <div key={item.forma} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
            <p className="mt-1 font-display text-xl font-bold text-gym-teal">{formatBRL(item.total)}</p>
            <p className="mt-1 text-xs text-muted-foreground">no período selecionado</p>
          </div>
        ))}
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void refetch()} /> : null}

      <PaginatedTable<Venda>
        columns={[
          { label: "Data" },
          { label: "Cliente" },
          { label: "Tipo" },
          { label: "Itens" },
          { label: "Pagamento" },
          { label: "Total" },
          { label: "Status" },
        ]}
        items={vendas}
        emptyText={loading ? "Carregando vendas..." : "Nenhuma venda encontrada para os filtros informados"}
        getRowKey={(venda) => venda.id}
        renderCells={(venda) => {
          const forma = resolveFormaPagamento(venda);
          const fluxoStatus = resolveVendaFluxoStatusFromApi(venda);
          return (
            <>
              <TableCell className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(venda.dataCriacao)}</TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {venda.clienteId && venda.clienteNome ? (
                  <Link
                    href={`/clientes/${venda.clienteId}`}
                    className="font-medium text-foreground underline-offset-2 hover:underline hover:text-gym-accent"
                  >
                    {venda.clienteNome}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">
                    {venda.clienteNome ?? "Consumidor não identificado"}
                  </span>
                )}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-muted-foreground">{TIPO_LABEL[venda.tipo]}</TableCell>
              <TableCell className="max-w-[280px] px-4 py-3 text-sm text-muted-foreground" title={formatItensResumo(venda)}>
                {formatItensResumo(venda)}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                {forma ? FORMA_LABEL[forma] : "Não informado"}
              </TableCell>
              <TableCell className="px-4 py-3 text-right font-semibold text-gym-accent">
                {formatBRL(venda.total)}
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="space-y-1">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getFluxoBadgeClass(fluxoStatus)}`}>
                    {fluxoStatus ? STATUS_FLUXO_COMERCIAL_LABEL[fluxoStatus] : venda.status}
                  </span>
                  {fluxoStatus ? (
                    <p className="text-[11px] text-muted-foreground">
                      {venda.tipo === "PLANO" ? "Contrato" : "Venda"} {venda.status.toLowerCase()}
                    </p>
                  ) : null}
                </div>
              </TableCell>
            </>
          );
        }}
        page={page}
        pageSize={PAGE_SIZE}
        total={totalRegistros}
        itemLabel="vendas"
        hasNext={hasNext}
        totalPages={totalPaginas}
        onPrevious={() => setPage((current) => Math.max(0, current - 1))}
        onNext={() => setPage((current) => Math.min(totalPaginas - 1, current + 1))}
      />
    </div>
  );
}
