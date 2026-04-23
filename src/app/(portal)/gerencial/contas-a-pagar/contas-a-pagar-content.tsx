"use client";

/**
 * Contas a Pagar gerencial — F4 redesign (2026-04-23).
 *
 * Espelho de F3 (contas-a-receber) com toque visual warning/laranja pro
 * contexto de desembolso. Arquitetura idêntica:
 * - `useContasPagarPage` + `useSumarioOperacionalContaPagar` via backend
 *   server-side (endpoint F1 /contas-pagar/sumario-operacional).
 * - Dashboard 4 KPIs: A pagar em aberto, Vencidas, Vence hoje, Pago no mês.
 * - TimelineVencimentos -3 a +14 dias.
 * - CategoriaBreakdown + PrevisaoMini com `CATEGORIAS_PAGAR`.
 * - Filtros backend (status, período, busca por CPF/CNPJ do fornecedor).
 * - Tabela paginada (PAGE_SIZE=50) com StatusContaPill.
 */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  getBusinessMonthRange,
  getBusinessTodayIso,
} from "@/lib/business-date";
import {
  useContasPagarPage,
  useSumarioOperacionalContaPagar,
} from "@/lib/query/use-contas-pagar";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import {
  TimelineVencimentos,
  CategoriaBreakdown,
  PrevisaoMini,
  StatusContaPill,
  type TimelineConta,
} from "@/components/shared/financeiro-viz";
import {
  CATEGORIAS_PAGAR,
  statusContaDe,
  diasPara,
} from "@/lib/finance/contas-status";
import { formatBRL, formatDate } from "@/lib/formatters";
import type { StatusContaPagar } from "@/lib/types";

const PAGE_SIZE = 50;
const subscribeNoop = () => () => {};

type StatusFiltro = "TODOS" | "EM_ABERTO" | StatusContaPagar;

function initialRange() {
  return getBusinessMonthRange();
}

export function ContasPagarPageContent() {
  const { tenantId, tenantResolved } = useTenantContext();
  const defaultRange = useMemo(() => initialRange(), []);

  const today = useSyncExternalStore(
    subscribeNoop,
    () => getBusinessTodayIso(),
    () => defaultRange.start,
  );

  const [status, setStatus] = useState<StatusFiltro>("EM_ABERTO");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search.replace(/\D/g, ""));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [status, startDate, endDate, searchDebounced]);

  const backendStatus: StatusContaPagar | undefined =
    status === "TODOS" || status === "EM_ABERTO" ? undefined : status;

  const { data: pageResult, isFetching } = useContasPagarPage({
    tenantId,
    status: backendStatus,
    startDate,
    endDate,
    documentoFornecedor: searchDebounced || undefined,
    page,
    size: PAGE_SIZE,
    enabled: tenantResolved,
  });

  const { data: sumario } = useSumarioOperacionalContaPagar({
    tenantId,
    startDate,
    endDate,
    documentoFornecedor: searchDebounced || undefined,
    enabled: tenantResolved,
  });

  const items = pageResult?.items ?? [];
  const total = pageResult?.total ?? 0;
  const hasNext = pageResult?.hasNext ?? false;

  const totalAberto = (sumario?.totalPendente ?? 0) + (sumario?.totalVencido ?? 0);
  const totalVencido = sumario?.totalVencido ?? 0;
  const totalPago = sumario?.totalPago ?? 0;
  const countAberto = (sumario?.countPendente ?? 0) + (sumario?.countVencido ?? 0);
  const countVencido = sumario?.countVencido ?? 0;

  // Normaliza valorFinal pra tabela + viz (espelha semântica backend:
  // valorPago quando baixado; senão valorOriginal - desconto + jurosMulta).
  const itemsComValor = useMemo(
    () =>
      items.map((p) => ({
        ...p,
        valorFinal: Math.max(
          0,
          p.valorPago != null
            ? p.valorPago
            : (p.valorOriginal ?? 0) - (p.desconto ?? 0) + (p.jurosMulta ?? 0),
        ),
      })),
    [items],
  );

  // "Vence hoje" derivado da página — limitação documentada no plano §4.
  const venceHojeStats = useMemo(() => {
    const due = itemsComValor.filter(
      (p) =>
        p.dataVencimento === today &&
        p.status !== "PAGA" &&
        p.status !== "CANCELADA",
    );
    return {
      total: due.reduce((s, p) => s + p.valorFinal, 0),
      count: due.length,
    };
  }, [itemsComValor, today]);

  const timelineContas: TimelineConta[] = useMemo(
    () =>
      itemsComValor.map((p) => ({
        id: p.id,
        dataVencimento: p.dataVencimento,
        valor: p.valorFinal,
        pago: p.status === "PAGA" || p.status === "CANCELADA",
      })),
    [itemsComValor],
  );

  const breakdownContas = useMemo(
    () =>
      itemsComValor.map((p) => ({
        categoria: String(p.categoria).toUpperCase(),
        valor: p.valorFinal,
        pago: p.status === "PAGA" || p.status === "CANCELADA",
        dataVencimento: p.dataVencimento,
      })),
    [itemsComValor],
  );

  const resetFiltros = () => {
    const r = initialRange();
    setStatus("EM_ABERTO");
    setSearch("");
    setStartDate(r.start);
    setEndDate(r.end);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[12px] font-semibold text-gym-warning">
            Financeiro · Contas a pagar
          </p>
          <h1 className="mt-1 font-display text-[26px] font-bold tracking-tight leading-tight">
            Contas a pagar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Acompanhe vencimentos, recorrências e baixas — dashboard, linha do tempo
            e filtros combinados rodam no servidor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/gerencial/contas-a-receber"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowUp size={13} strokeWidth={2.5} />
            Ver contas a receber
          </Link>
        </div>
      </div>

      {/* Dashboard — 4 KPIs */}
      <div className="flex flex-wrap gap-4">
        <BiMetricCard
          label="A pagar em aberto"
          value={formatBRL(totalAberto)}
          description={`${countAberto} ${countAberto === 1 ? "conta pendente" : "contas pendentes"}`}
          tone="warning"
          icon={ArrowDown}
        />
        <BiMetricCard
          label="Vencidas"
          value={formatBRL(totalVencido)}
          description={`${countVencido} ${countVencido === 1 ? "conta" : "contas"} em atraso`}
          tone="danger"
          icon={AlertTriangle}
        />
        <BiMetricCard
          label="Vence hoje"
          value={formatBRL(venceHojeStats.total)}
          description={`${venceHojeStats.count} ${venceHojeStats.count === 1 ? "conta" : "contas"} para pagar hoje`}
          tone="warning"
          icon={Clock}
        />
        <BiMetricCard
          label="Pago neste mês"
          value={formatBRL(totalPago)}
          description={`${sumario?.countPago ?? 0} baixas registradas`}
          tone="teal"
          icon={CheckCircle2}
        />
      </div>

      {/* Linha do tempo */}
      <TimelineVencimentos
        contas={timelineContas}
        mode="pagar"
        today={today}
        onDayClick={(iso) => {
          setStartDate(iso);
          setEndDate(iso);
        }}
      />

      {/* Breakdown + Previsão */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoriaBreakdown contas={breakdownContas} categorias={CATEGORIAS_PAGAR} />
        <PrevisaoMini contas={breakdownContas} mode="pagar" today={today} />
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_170px_170px_180px]">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por CPF/CNPJ do fornecedor..."
              className="pl-9 bg-secondary border-border"
              aria-label="Buscar por CPF/CNPJ do fornecedor"
            />
          </div>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-secondary border-border"
            aria-label="Data inicial"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-secondary border-border"
            aria-label="Data final"
          />
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFiltro)}>
            <SelectTrigger
              className="w-full bg-secondary border-border"
              aria-label="Filtrar por status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="EM_ABERTO">Em aberto</SelectItem>
              <SelectItem value="TODOS">Todos os status</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="VENCIDA">Vencida</SelectItem>
              <SelectItem value="PAGA">Paga</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="outline" className="border-border" onClick={resetFiltros}>
            Resetar filtros
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Vencimento
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Fornecedor
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Descrição
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Valor
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isFetching && itemsComValor.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : itemsComValor.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted-foreground">
                  Nenhum lançamento encontrado para o filtro.
                </td>
              </tr>
            ) : (
              itemsComValor.map((item) => {
                const atraso = diasPara(item.dataVencimento, today);
                const visual = statusContaDe(
                  { status: item.status, dataVencimento: item.dataVencimento },
                  today,
                );
                return (
                  <tr key={item.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="tabular-nums">{formatDate(item.dataVencimento)}</div>
                      {visual !== "pago" && atraso !== 0 ? (
                        <div
                          className={`text-[11px] tabular-nums ${
                            atraso < 0 ? "text-gym-danger" : "text-muted-foreground"
                          }`}
                        >
                          {atraso < 0
                            ? `há ${Math.abs(atraso)} dia${Math.abs(atraso) > 1 ? "s" : ""}`
                            : `em ${atraso} dia${atraso > 1 ? "s" : ""}`}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.fornecedor || "Não identificado"}</p>
                      {item.documentoFornecedor ? (
                        <p className="text-xs text-muted-foreground">
                          {item.documentoFornecedor}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.descricao}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold tabular-nums ${
                          visual === "pago"
                            ? "text-muted-foreground line-through"
                            : "text-gym-warning"
                        }`}
                      >
                        {formatBRL(item.valorFinal)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusContaPill
                        status={visual}
                        atraso={visual === "vencido" ? atraso : undefined}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Paginação */}
        {total > PAGE_SIZE || page > 0 ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <p className="text-xs text-muted-foreground">
              Exibindo{" "}
              <span className="font-semibold text-foreground">
                {itemsComValor.length === 0 ? 0 : page * PAGE_SIZE + 1}-
                {page * PAGE_SIZE + itemsComValor.length}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-foreground">
                {total.toLocaleString("pt-BR")}
              </span>{" "}
              lançamentos
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={page === 0 || isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft size={16} className="mr-1" />
                Anterior
              </Button>
              <span className="px-3 text-xs font-semibold">Página {page + 1}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={!hasNext || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Rodapé */}
      {sumario && sumario.countTotal > 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp size={12} aria-hidden="true" />
          Total agregado no período: {sumario.countTotal} lançamento
          {sumario.countTotal === 1 ? "" : "s"} ·{" "}
          {formatBRL(totalAberto + totalPago)} movimentados.
        </div>
      ) : null}
    </div>
  );
}
