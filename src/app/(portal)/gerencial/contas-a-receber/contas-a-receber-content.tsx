"use client";

/**
 * Contas a Receber gerencial — F3 redesign (2026-04-23).
 *
 * Arquitetura server-side: a tela consome `useContasReceberPage` +
 * `useSumarioOperacionalContaReceber`. Filtros (status/período/busca por
 * CPF) são empurrados ao backend; tabela é paginada real (PAGE_SIZE=50);
 * cards de dashboard lêem sumário agregado via GROUP BY no DB.
 *
 * O card hero (4 KPIs), a linha do tempo de 14 dias e o breakdown por
 * categoria + previsão 30 dias vêm da biblioteca `financeiro-viz/`
 * introduzida em F2.
 */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Clock, TrendingUp, Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  getBusinessMonthRange,
  getBusinessTodayIso,
} from "@/lib/business-date";
import {
  useContasReceberPage,
  useSumarioOperacionalContaReceber,
} from "@/lib/query/use-contas-receber";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import {
  TimelineVencimentos,
  CategoriaBreakdown,
  PrevisaoMini,
  StatusContaPill,
  type TimelineConta,
} from "@/components/shared/financeiro-viz";
import { CATEGORIAS_RECEBER, statusContaDe, diasPara } from "@/lib/finance/contas-status";
import { ExportMenu, type ExportColumn, type ServerExportAction } from "@/components/shared/export-menu";
import { exportarContasReceberApi } from "@/lib/api/exportacao";
import { formatBRL, formatDate } from "@/lib/formatters";
import type { StatusPagamento } from "@/lib/types";
import type { PagamentoComAluno } from "@/lib/tenant/financeiro/recebimentos";

const PAGE_SIZE = 50;
const subscribeNoop = () => () => {};

type StatusFiltro = "TODOS" | "EM_ABERTO" | StatusPagamento;

function initialRange() {
  // Computado uma vez no módulo (fora de render), safe pra SSR.
  return getBusinessMonthRange();
}

export function ContasAReceberContent() {
  const { tenantId, tenantResolved } = useTenantContext();
  const defaultRange = useMemo(() => initialRange(), []);

  // Hydration-safe today: inicia com string estável no SSR, atualiza após
  // mount via useSyncExternalStore (subscribe noop — só o getSnapshot pro cliente).
  const today = useSyncExternalStore(
    subscribeNoop,
    () => getBusinessTodayIso(),
    () => defaultRange.start, // fallback SSR
  );

  const [status, setStatus] = useState<StatusFiltro>("EM_ABERTO");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [page, setPage] = useState(0);

  // Debounce busca (CPF) antes de mandar ao backend
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search.replace(/\D/g, ""));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset de página quando filtros mudam
  useEffect(() => {
    setPage(0);
  }, [status, startDate, endDate, searchDebounced]);

  // Status → backend param (EM_ABERTO = sem filtro; frontend soma PENDENTE + VENCIDO depois)
  const backendStatus: StatusPagamento | undefined =
    status === "TODOS" || status === "EM_ABERTO" ? undefined : status;

  const { data: pageResult, isFetching } = useContasReceberPage({
    tenantId,
    status: backendStatus,
    startDate,
    endDate,
    documentoCliente: searchDebounced || undefined,
    page,
    size: PAGE_SIZE,
    enabled: tenantResolved,
  });

  const { data: sumario } = useSumarioOperacionalContaReceber({
    tenantId,
    startDate,
    endDate,
    documentoCliente: searchDebounced || undefined,
    enabled: tenantResolved,
  });

  const items = pageResult?.items ?? [];
  const total = pageResult?.total ?? 0;
  const hasNext = pageResult?.hasNext ?? false;

  // KPIs do dashboard (todos derivados do sumário server-side)
  const totalAberto = (sumario?.totalPendente ?? 0) + (sumario?.totalVencido ?? 0);
  const totalVencido = sumario?.totalVencido ?? 0;
  const totalRecebido = sumario?.totalRecebido ?? 0;
  const countAberto = (sumario?.countPendente ?? 0) + (sumario?.countVencido ?? 0);
  const countVencido = sumario?.countVencido ?? 0;

  // "Vence hoje" derivado da página atual (limitação assumida do plano §4) —
  // soma + count só dos itens carregados cuja data é hoje e não estão pagos.
  const venceHojeStats = useMemo(() => {
    const due = items.filter(
      (p) => p.dataVencimento === today && p.status !== "PAGO" && p.status !== "CANCELADO",
    );
    return {
      total: due.reduce((s, p) => s + p.valorFinal, 0),
      count: due.length,
    };
  }, [items, today]);

  // Contas adaptadas para TimelineVencimentos (usa qualquer item da página)
  const timelineContas: TimelineConta[] = useMemo(
    () =>
      items.map((p) => ({
        id: p.id,
        dataVencimento: p.dataVencimento,
        valor: p.valorFinal,
        pago: p.status === "PAGO" || p.status === "CANCELADO",
      })),
    [items],
  );

  // CategoriaBreakdown + PrevisaoMini consomem o mesmo shape com `categoria`
  const breakdownContas = useMemo(
    () =>
      items.map((p) => ({
        categoria: String(p.tipo ?? "AVULSO").toUpperCase(),
        valor: p.valorFinal,
        pago: p.status === "PAGO" || p.status === "CANCELADO",
        dataVencimento: p.dataVencimento,
      })),
    [items],
  );

  // ExportMenu — server-side usa filtros atuais; client-side exporta a página corrente
  const serverExportActions = useMemo<ServerExportAction[]>(() => {
    const statusParam = backendStatus;
    return [
      {
        label: "Servidor CSV",
        onClick: () =>
          exportarContasReceberApi({
            tenantId: tenantId!,
            formato: "csv",
            status: statusParam,
            dataInicio: startDate,
            dataFim: endDate,
          }),
      },
      {
        label: "Servidor XLSX",
        onClick: () =>
          exportarContasReceberApi({
            tenantId: tenantId!,
            formato: "xlsx",
            status: statusParam,
            dataInicio: startDate,
            dataFim: endDate,
          }),
      },
    ];
  }, [tenantId, backendStatus, startDate, endDate]);

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
          <p className="text-[12px] font-semibold text-gym-accent">
            Financeiro · Contas a receber
          </p>
          <h1 className="mt-1 font-display text-[26px] font-bold tracking-tight leading-tight">
            Contas a receber
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Acompanhe mensalidades, avulsos e pacotes — com dashboard, linha do tempo e filtros
            combinados que rodam no servidor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/gerencial/contas-a-pagar"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowDown size={13} strokeWidth={2.5} />
            Ver contas a pagar
          </Link>
          <ExportMenu
            data={items}
            columns={[
              { label: "Vencimento", accessor: (r) => formatDate(r.dataVencimento ?? "") },
              { label: "Cliente", accessor: (r) => r.aluno?.nome ?? "—" },
              { label: "Descrição", accessor: (r) => r.descricao ?? "" },
              { label: "Tipo", accessor: (r) => r.tipo ?? "" },
              { label: "Valor", accessor: (r) => formatBRL(Number(r.valorFinal ?? 0)) },
              { label: "Status", accessor: "status" },
            ] satisfies ExportColumn<PagamentoComAluno>[]}
            filename="contas-a-receber"
            title="Contas a Receber"
            serverActions={serverExportActions}
          />
        </div>
      </div>

      {/* Dashboard — 4 KPIs */}
      <div className="flex flex-wrap gap-4">
        <BiMetricCard
          label="A receber em aberto"
          value={formatBRL(totalAberto)}
          description={`${countAberto} conta${countAberto === 1 ? "" : "s"} pendentes`}
          tone="accent"
          icon={ArrowUp}
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
          description={`${venceHojeStats.count} ${venceHojeStats.count === 1 ? "conta" : "contas"} para receber hoje`}
          tone="warning"
          icon={Clock}
        />
        <BiMetricCard
          label="Recebido neste mês"
          value={formatBRL(totalRecebido)}
          description={`${sumario?.countRecebido ?? 0} baixas registradas`}
          tone="teal"
          icon={CheckCircle2}
        />
      </div>

      {/* Linha do tempo */}
      <TimelineVencimentos
        contas={timelineContas}
        mode="receber"
        today={today}
        onDayClick={(iso) => {
          setStartDate(iso);
          setEndDate(iso);
        }}
      />

      {/* Breakdown + Previsão */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoriaBreakdown contas={breakdownContas} categorias={CATEGORIAS_RECEBER} />
        <PrevisaoMini contas={breakdownContas} mode="receber" today={today} />
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
              placeholder="Buscar por CPF do cliente..."
              className="pl-9 bg-secondary border-border"
              aria-label="Buscar por CPF do cliente"
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
            <SelectTrigger className="w-full bg-secondary border-border" aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="EM_ABERTO">Em aberto</SelectItem>
              <SelectItem value="TODOS">Todos os status</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="VENCIDO">Vencido</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
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
                Cliente
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
            {isFetching && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted-foreground">
                  Nenhum lançamento encontrado para o filtro.
                </td>
              </tr>
            ) : (
              items.map((item) => {
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
                      <p className="font-medium">{item.aluno?.nome ?? "Não identificado"}</p>
                      {item.aluno?.cpf ? (
                        <p className="text-xs text-muted-foreground">{item.aluno.cpf}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.descricao}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold tabular-nums ${
                          visual === "pago" ? "text-muted-foreground line-through" : "text-gym-accent"
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

        {/* Rodapé / paginação */}
        {total > PAGE_SIZE || page > 0 ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <p className="text-xs text-muted-foreground">
              Exibindo{" "}
              <span className="font-semibold text-foreground">
                {items.length === 0 ? 0 : page * PAGE_SIZE + 1}-{page * PAGE_SIZE + items.length}
              </span>{" "}
              de <span className="font-semibold text-foreground">{total.toLocaleString("pt-BR")}</span>{" "}
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

      {/* Rodapé informativo sobre tendência do mês */}
      {sumario && sumario.countTotal > 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp size={12} aria-hidden="true" />
          Total agregado no período: {sumario.countTotal} lançamento
          {sumario.countTotal === 1 ? "" : "s"} ·{" "}
          {formatBRL(totalAberto + totalRecebido)} movimentados.
        </div>
      ) : null}
    </div>
  );
}
