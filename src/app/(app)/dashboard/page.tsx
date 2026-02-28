"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  HandCoins,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  getDashboard,
  listAlunosPage,
  listMatriculas,
  listPagamentos,
  listProspectsPage,
} from "@/lib/mock/services";
import { isRealApiEnabled } from "@/lib/api/http";
import { StatusBadge } from "@/components/shared/status-badge";
import type {
  Aluno,
  DashboardData,
  Matricula,
  Pagamento,
  Prospect,
  StatusAluno,
} from "@/lib/types";
import { Input } from "@/components/ui/input";

type DashboardTab = "CLIENTES" | "VENDAS" | "FINANCEIRO";
const PROSPECTS_PAGE_SIZE = 10;

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function monthPrefix(month: number, year: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function previousMonth(month: number, year: number) {
  if (month === 0) return { month: 11, year: year - 1 };
  return { month: month - 1, year };
}

function daysDiffFromReference(isoDateTime: string | undefined, referenceDateIso: string) {
  if (!isoDateTime) return 999;
  const now = new Date(`${referenceDateIso}T23:59:59`).getTime();
  const past = new Date(isoDateTime).getTime();
  return Math.floor((now - past) / (1000 * 60 * 60 * 24));
}

function deltaLabel(current: number, prev: number) {
  const diff = current - prev;
  const up = diff >= 0;
  return {
    up,
    text: `${up ? "+" : ""}${diff.toLocaleString("pt-BR")}`,
  };
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
  delta,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  tone: "accent" | "teal" | "warning" | "danger";
  delta?: { up: boolean; text: string; label: string };
}) {
  const toneClass = {
    accent: "text-gym-accent border-gym-accent/20",
    teal: "text-gym-teal border-gym-teal/20",
    warning: "text-gym-warning border-gym-warning/20",
    danger: "text-gym-danger border-gym-danger/20",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <Icon className={`size-4 ${toneClass.split(" ")[0]}`} />
      </div>
      <p className={`mt-2 font-display text-3xl font-bold leading-none ${toneClass.split(" ")[0]}`}>{value}</p>
      {subtitle && <p className="mt-1.5 text-xs text-muted-foreground">{subtitle}</p>}
      {delta && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          {delta.up ? <ArrowUpRight className="size-3.5 text-gym-teal" /> : <ArrowDownRight className="size-3.5 text-gym-danger" />}
          <span className="font-semibold">{delta.text}</span>
          <span>{delta.label}</span>
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [showAllProspects, setShowAllProspects] = useState(false);
  const [prospectsPage, setProspectsPage] = useState<Prospect[]>([]);
  const [prospectsPageNumber, setProspectsPageNumber] = useState(1);
  const [prospectsPageHasNext, setProspectsPageHasNext] = useState(false);
  const [prospectsPageLoading, setProspectsPageLoading] = useState(false);
  const [pagamentos, setPagamentos] = useState<(Pagamento & { aluno?: Aluno })[]>([]);
  const [matriculas, setMatriculas] = useState<(Matricula & { aluno?: Aluno })[]>([]);
  const [statusAlunoCount, setStatusAlunoCount] = useState<Record<StatusAluno, number>>({
    ATIVO: 0,
    INATIVO: 0,
    SUSPENSO: 0,
    CANCELADO: 0,
  });
  const [todayIso, setTodayIso] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [tab, setTab] = useState<DashboardTab>("CLIENTES");
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);
  const financialLoadedDateRef = useRef<string | null>(null);

  const loadProspectsPageData = useCallback(async (page: number) => {
    setProspectsPageLoading(true);
    try {
      const result = await listProspectsPage({ page, size: PROSPECTS_PAGE_SIZE });
      setProspectsPage(result.items);
      setProspectsPageNumber(result.page);
      setProspectsPageHasNext(result.hasNext);
    } catch {
      setProspectsPage([]);
      setProspectsPageHasNext(false);
    } finally {
      setProspectsPageLoading(false);
    }
  }, []);

  const load = useCallback(async (referenceDate: string, includeFinancial = false) => {
    if (!referenceDate) return;
    loadingRef.current = true;
    setLoading(true);
    const ref = new Date(`${referenceDate}T00:00:00`);
    const month = ref.getMonth();
    const year = ref.getFullYear();
    try {
      const [dash, alunosPage] = await Promise.all([
        getDashboard({ month, year }),
        listAlunosPage({ page: 0, size: 20 }),
      ]);
      const totais = alunosPage.totaisStatus;
      setData(dash);
      setProspects((dash.prospectsRecentes ?? []).slice(0, 5));
      setStatusAlunoCount({
        ATIVO: totais?.totalAtivo ?? 0,
        INATIVO: totais?.totalInativo ?? 0,
        SUSPENSO: totais?.totalSuspenso ?? 0,
        CANCELADO: totais?.totalCancelado ?? totais?.cancelados ?? 0,
      });
      if (includeFinancial) {
        const [pags, mats] = await Promise.all([listPagamentos(), listMatriculas()]);
        setPagamentos(pags);
        setMatriculas(mats);
        financialLoadedDateRef.current = referenceDate;
      } else if (financialLoadedDateRef.current && financialLoadedDateRef.current !== referenceDate) {
        setPagamentos([]);
        setMatriculas([]);
        financialLoadedDateRef.current = null;
      }
    } catch {
      // Mantem o ultimo snapshot valido em caso de falha temporaria.
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setShowAllProspects(false);
    setProspectsPage([]);
    setProspectsPageNumber(1);
    setProspectsPageHasNext(false);
  }, [selectedDate]);

  useEffect(() => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setTodayIso(iso);
    setSelectedDate(iso);
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const shouldLoadFinancial = tab !== "CLIENTES";
    if (shouldLoadFinancial && financialLoadedDateRef.current === selectedDate) return;
    void load(selectedDate, shouldLoadFinancial);
  }, [load, selectedDate, tab]);

  useEffect(() => {
    if (!selectedDate) return;
    if (isRealApiEnabled()) return;
    function handleUpdate() {
      if (loadingRef.current) return;
      void load(selectedDate, tab !== "CLIENTES");
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("academia-store-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [load, selectedDate, tab]);

  const metrics = useMemo(() => {
    if (!data || !selectedDate) return null;

    const ref = new Date(`${selectedDate}T00:00:00`);
    const mes = ref.getMonth();
    const ano = ref.getFullYear();
    const currentPrefix = monthPrefix(mes, ano);
    const prevRef = previousMonth(mes, ano);
    const prevPrefix = monthPrefix(prevRef.month, prevRef.year);

    let emAbertoCount = 0;
    let followupPendente = 0;
    let visitsWaiting = 0;
    let convertedCurrent = 0;
    let convertedPrev = 0;
    let prospectsCurrent = 0;
    let prospectsPrev = 0;

    for (const prospect of prospects) {
      const isAberto = prospect.status !== "CONVERTIDO" && prospect.status !== "PERDIDO";
      if (isAberto) {
        emAbertoCount += 1;
        if (daysDiffFromReference(prospect.dataUltimoContato || prospect.dataCriacao, selectedDate) >= 2) {
          followupPendente += 1;
        }
      }
      if (prospect.status === "VISITOU") {
        visitsWaiting += 1;
      }
      if (prospect.dataCriacao.startsWith(currentPrefix)) {
        prospectsCurrent += 1;
      }
      if (prospect.dataCriacao.startsWith(prevPrefix)) {
        prospectsPrev += 1;
      }
      const logs = prospect.statusLog ?? [];
      let convertedInCurrent = false;
      let convertedInPrev = false;
      for (const log of logs) {
        if (log.status !== "CONVERTIDO") continue;
        if (!convertedInCurrent && log.data.startsWith(currentPrefix)) convertedInCurrent = true;
        if (!convertedInPrev && log.data.startsWith(prevPrefix)) convertedInPrev = true;
        if (convertedInCurrent && convertedInPrev) break;
      }
      if (convertedInCurrent) convertedCurrent += 1;
      if (convertedInPrev) convertedPrev += 1;
    }

    let receitaCurrent = 0;
    let receitaPrev = 0;
    let pagosCurrentCount = 0;
    let pagosPrevCount = 0;
    let inadimplenciaValor = 0;
    let receberValor = 0;
    let vendasMensalidade = 0;
    let vendasNovas = 0;

    for (const pagamento of pagamentos) {
      if (pagamento.status === "VENCIDO") {
        inadimplenciaValor += pagamento.valorFinal;
      }
      if (pagamento.status === "PENDENTE") {
        receberValor += pagamento.valorFinal;
      }
      if (pagamento.status === "PAGO" && pagamento.dataPagamento) {
        if (pagamento.dataPagamento.startsWith(currentPrefix)) {
          receitaCurrent += pagamento.valorFinal;
          pagosCurrentCount += 1;
          if (pagamento.tipo === "MENSALIDADE") vendasMensalidade += pagamento.valorFinal;
          if (pagamento.tipo === "MATRICULA") vendasNovas += pagamento.valorFinal;
        }
        if (pagamento.dataPagamento.startsWith(prevPrefix)) {
          receitaPrev += pagamento.valorFinal;
          pagosPrevCount += 1;
        }
      }
    }

    let matriculasCurrent = 0;
    let matriculasPrev = 0;
    let valorVendasCurrent = 0;
    let valorVendasPrev = 0;

    for (const matricula of matriculas) {
      if (matricula.dataCriacao.startsWith(currentPrefix)) {
        matriculasCurrent += 1;
        valorVendasCurrent += matricula.valorPago;
      }
      if (matricula.dataCriacao.startsWith(prevPrefix)) {
        matriculasPrev += 1;
        valorVendasPrev += matricula.valorPago;
      }
    }

    const ticketCurrent = pagosCurrentCount ? receitaCurrent / pagosCurrentCount : 0;
    const ticketPrev = pagosPrevCount ? receitaPrev / pagosPrevCount : 0;

    return {
      emAbertoCount,
      followupPendente,
      visitsWaiting,
      prospectsCurrent,
      prospectsPrev,
      convertedCurrent,
      convertedPrev,
      receitaCurrent,
      receitaPrev,
      ticketCurrent,
      ticketPrev,
      inadimplenciaValor,
      receberValor,
      valorVendasCurrent,
      valorVendasPrev,
      matriculasCurrent,
      matriculasPrev,
      vendasMensalidade,
      vendasNovas,
      statusAlunoCount,
    };
  }, [data, prospects, pagamentos, matriculas, selectedDate, statusAlunoCount]);

  if (!data || !metrics) {
    return (
      <div className="text-sm text-muted-foreground">
        {loading ? "Carregando dashboard..." : "Sem dados para o dashboard."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Painel operacional com foco em decisão rápida</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-[170px]">
            <Input
              type="date"
              value={selectedDate}
              max={todayIso}
              onChange={(e) => {
                const nextDate = e.target.value;
                if (!nextDate) return;
                setSelectedDate(nextDate);
              }}
              className="bg-secondary border-border text-sm"
            />
          </div>
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {([
          ["CLIENTES", "Clientes"],
          ["VENDAS", "Vendas"],
          ["FINANCEIRO", "Financeiro"],
        ] as [DashboardTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-gym-accent/10 text-gym-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "CLIENTES" && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <MetricCard
              title="Clientes ativos"
              value={String(metrics.statusAlunoCount.ATIVO)}
              subtitle={`${metrics.statusAlunoCount.SUSPENSO} suspensos · ${metrics.statusAlunoCount.INATIVO} inativos`}
              icon={Users}
              tone="teal"
            />
            <MetricCard
              title="Novos prospects"
              value={String(metrics.prospectsCurrent)}
              subtitle="entradas no mês"
              icon={UserPlus}
              tone="accent"
              delta={{ ...deltaLabel(metrics.prospectsCurrent, metrics.prospectsPrev), label: "vs mês anterior" }}
            />
            <MetricCard
              title="Visitas aguardando contato"
              value={String(metrics.visitsWaiting)}
              subtitle="prioridade comercial"
              icon={CalendarClock}
              tone="warning"
            />
            <MetricCard
              title="Follow-up pendente (48h+)"
              value={String(metrics.followupPendente)}
              subtitle="prospects sem contato recente"
              icon={AlertTriangle}
              tone="danger"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-base font-bold">Prospects recentes</h2>
                {showAllProspects ? (
                  <button
                    type="button"
                    onClick={() => setShowAllProspects(false)}
                    className="text-xs text-gym-accent hover:underline"
                  >
                    Ver recentes
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAllProspects(true);
                      if (prospectsPage.length === 0) {
                        void loadProspectsPageData(1);
                      }
                    }}
                    className="text-xs text-gym-accent hover:underline"
                  >
                    Ver todos
                  </button>
                )}
              </div>
              {showAllProspects ? (
                prospectsPageLoading ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Carregando prospects...</p>
                ) : prospectsPage.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nenhum prospect ativo</p>
                ) : (
                  <div className="space-y-3">
                    {prospectsPage.map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">{p.telefone}</p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    ))}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={prospectsPageLoading || prospectsPageNumber <= 1}
                        onClick={() => void loadProspectsPageData(prospectsPageNumber - 1)}
                        className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <span className="text-xs text-muted-foreground">Página {prospectsPageNumber}</span>
                      <button
                        type="button"
                        disabled={prospectsPageLoading || !prospectsPageHasNext}
                        onClick={() => void loadProspectsPageData(prospectsPageNumber + 1)}
                        className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )
              ) : (
                prospects.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nenhum prospect ativo</p>
                ) : (
                <div className="space-y-3">
                  {prospects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.telefone}</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
                )
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-base font-bold">Matrículas vencendo em 7 dias</h2>
                <Link href="/matriculas" className="text-xs text-gym-accent hover:underline">Ver todas</Link>
              </div>
              {data.matriculasVencendo.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma matrícula vencendo</p>
              ) : (
                <div className="divide-y divide-border">
                  {data.matriculasVencendo.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{m.aluno?.nome ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{m.plano?.nome} · vence {formatDate(m.dataFim)}</p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "VENDAS" && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <MetricCard
              title="Contratos vendidos"
              value={String(metrics.matriculasCurrent)}
              subtitle="matrículas criadas no mês"
              icon={BarChart3}
              tone="accent"
              delta={{ ...deltaLabel(metrics.matriculasCurrent, metrics.matriculasPrev), label: "vs mês anterior" }}
            />
            <MetricCard
              title="Valor total vendido"
              value={formatBRL(metrics.valorVendasCurrent)}
              subtitle="somatório dos contratos"
              icon={CircleDollarSign}
              tone="teal"
              delta={{ ...deltaLabel(metrics.valorVendasCurrent, metrics.valorVendasPrev), label: "vs mês anterior" }}
            />
            <MetricCard
              title="Média por contrato"
              value={formatBRL(metrics.matriculasCurrent ? metrics.valorVendasCurrent / metrics.matriculasCurrent : 0)}
              subtitle="ticket médio de contrato"
              icon={TrendingUp}
              tone="teal"
            />
            <MetricCard
              title="Taxa de conversão"
              value={`${metrics.prospectsCurrent ? ((metrics.convertedCurrent / metrics.prospectsCurrent) * 100).toFixed(1) : "0.0"}%`}
              subtitle="conversões sobre novos prospects do mês"
              icon={UserCheck}
              tone="accent"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 font-display text-base font-bold">Mix de vendas no mês</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Novas matrículas</p>
                  <p className="mt-1 font-display text-2xl font-bold text-gym-accent">{formatBRL(metrics.vendasNovas)}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recorrente (mensalidades)</p>
                  <p className="mt-1 font-display text-2xl font-bold text-gym-teal">{formatBRL(metrics.vendasMensalidade)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 font-display text-base font-bold">Risco comercial</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                  <span className="text-sm text-muted-foreground">Prospects em aberto</span>
                  <span className="font-bold">{metrics.emAbertoCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                  <span className="text-sm text-muted-foreground">Sem contato recente</span>
                  <span className="font-bold text-gym-warning">{metrics.followupPendente}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                  <span className="text-sm text-muted-foreground">Visitaram e aguardam retorno</span>
                  <span className="font-bold text-gym-accent">{metrics.visitsWaiting}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "FINANCEIRO" && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <MetricCard
              title="Recebimentos do mês"
              value={formatBRL(metrics.receitaCurrent)}
              subtitle="pagamentos efetivamente recebidos"
              icon={Banknote}
              tone="teal"
              delta={{ ...deltaLabel(metrics.receitaCurrent, metrics.receitaPrev), label: "vs mês anterior" }}
            />
            <MetricCard
              title="Ticket médio"
              value={formatBRL(metrics.ticketCurrent)}
              subtitle="por pagamento recebido"
              icon={CreditCard}
              tone="accent"
              delta={{ ...deltaLabel(metrics.ticketCurrent, metrics.ticketPrev), label: "vs mês anterior" }}
            />
            <MetricCard
              title="Inadimplência (vencidos)"
              value={formatBRL(metrics.inadimplenciaValor)}
              subtitle="valor vencido não recebido"
              icon={TrendingDown}
              tone="danger"
            />
            <MetricCard
              title="A receber (pendente)"
              value={formatBRL(metrics.receberValor)}
              subtitle="pagamentos ainda em aberto"
              icon={HandCoins}
              tone="warning"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Pagamentos pendentes e vencidos</h2>
              <Link href="/pagamentos" className="text-xs text-gym-accent hover:underline">Ver todos</Link>
            </div>
            {data.pagamentosPendentes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum pagamento pendente</p>
            ) : (
              <div className="space-y-3">
                {data.pagamentosPendentes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-3">
                    <div>
                      <p className="text-sm font-medium">{p.aluno?.nome ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">Vence {formatDate(p.dataVencimento)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gym-accent">{formatBRL(p.valorFinal)}</p>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
