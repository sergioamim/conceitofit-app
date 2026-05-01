"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Info, Lock, LogIn, RefreshCw, Trophy } from "lucide-react";
import type {
  CatracaAcesso,
  CatracaAcessosRankingItem,
  CatracaAcessosResumo,
  CatracaAcessosSerieDiaria,
} from "@/lib/api/catraca";
import { extractAlunosFromListResponse, listAlunosApi } from "@/lib/api/alunos";
import { getBusinessTodayIso } from "@/lib/business-date";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { useCatracaAcessos } from "@/lib/query/use-catraca-acessos";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { ClienteThumbnail } from "@/components/shared/cliente-thumbnail";
import { SuggestionInput, type SuggestionOption } from "@/components/shared/suggestion-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";

type TipoLiberacaoFiltro = WithFilterAll<"MANUAL" | "AUTOMATICA">;
type StatusFiltro = WithFilterAll<"LIBERADO" | "BLOQUEADO">;
type TipoLiberacaoNormalizado = "MANUAL" | "AUTOMATICA" | "INDEFINIDA";

function getTodayDate(): string {
  return getBusinessTodayIso();
}

function parseDateTime(value?: string): {
  year: string;
  month: string;
  day: string;
  hour?: string;
  minute?: string;
  second?: string;
} | null {
  if (!value) return null;
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (!match) return null;
  return {
    year: match[1],
    month: match[2],
    day: match[3],
    hour: match[4],
    minute: match[5],
    second: match[6],
  };
}

function formatDay(value?: string): string {
  const parsed = parseDateTime(value);
  if (!parsed) return "—";
  return `${parsed.day}/${parsed.month}/${parsed.year}`;
}

function formatTime(value?: string): string {
  const parsed = parseDateTime(value);
  if (!parsed?.hour || !parsed.minute) return "—";
  return `${parsed.hour}:${parsed.minute}:${parsed.second ?? "00"}`;
}

function formatMonthDay(value?: string): string {
  const parsed = parseDateTime(value);
  if (!parsed) return "—";
  return `${parsed.day}/${parsed.month}`;
}

function formatText(value?: string): string {
  const normalized = value?.trim();
  return normalized ? normalized : "—";
}

function normalizeStatus(value?: string): string {
  const normalized = value?.trim();
  if (!normalized) return "—";
  return normalized.toUpperCase();
}

function resolveTipoLiberacao(value?: string, issuedBy?: string): TipoLiberacaoNormalizado {
  const normalized = value?.trim().toUpperCase();
  if (normalized) {
    if (/(MANUAL|OPERADOR|OPERATOR|HUMAN)/.test(normalized)) {
      return "MANUAL";
    }
    if (/(AUTO|AUTOMAT|SISTEM|SYSTEM|RULE|POLICY)/.test(normalized)) {
      return "AUTOMATICA";
    }
  }

  const actor = issuedBy?.trim().toLowerCase();
  if (!actor) return "INDEFINIDA";
  if (/(sistema|system|auto|automat|policy|rule|motor)/.test(actor)) {
    return "AUTOMATICA";
  }
  return "MANUAL";
}

function isBlockedStatus(value?: string): boolean {
  const status = normalizeStatus(value);
  return /(BLOQUEADO|NEGADO|DENIED|RECUSADO|ERRO|FAIL)/.test(status);
}

function resolveOrigemDisplay(systemName?: string): { label: string; className: string } | null {
  const normalized = systemName?.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === "AGREGADOR_WELLHUB") {
    return { label: "Wellhub", className: "border-gym-accent/30 bg-gym-accent/10 text-gym-accent" };
  }
  if (normalized === "AGREGADOR_TOTALPASS") {
    return { label: "TotalPass", className: "border-gym-accent/30 bg-gym-accent/10 text-gym-accent" };
  }
  if (normalized === "VISITANTE_APP") {
    return { label: "Visitante", className: "border-gym-warning/30 bg-gym-warning/10 text-gym-warning" };
  }
  if (normalized === "MANUAL_OPERADOR") {
    return { label: "Operador", className: "border-gym-warning/30 bg-gym-warning/10 text-gym-warning" };
  }
  return { label: normalized, className: "border-border bg-secondary text-muted-foreground" };
}

function resolveTipoExibicao(item: Pick<CatracaAcesso, "releaseType" | "issuedBy" | "status">): {
  label: "Manual" | "Liberado" | "Bloqueado";
  className: string;
} {
  const tipoLiberacao = resolveTipoLiberacao(item.releaseType, item.issuedBy);
  if (tipoLiberacao === "MANUAL") {
    return {
      label: "Manual",
      className: "border-gym-warning/30 bg-gym-warning/10 text-gym-warning",
    };
  }

  if (isBlockedStatus(item.status)) {
    return {
      label: "Bloqueado",
      className: "border-gym-danger/25 bg-gym-danger/10 text-gym-danger",
    };
  }

  return {
    label: "Liberado",
    className: "border-gym-teal/25 bg-gym-teal/10 text-gym-teal",
  };
}

function getStatusClass(value?: string): string {
  const status = normalizeStatus(value);
  if (/(NEGADO|BLOQUEADO|DENIED|ERRO|FAIL|RECUSADO)/.test(status)) {
    return "border-gym-danger/25 bg-gym-danger/10 text-gym-danger";
  }
  if (/(LIBERADO|PERMITIDO|ALLOW|ALLOWED|SUCESSO|SUCCESS|OK)/.test(status)) {
    return "border-gym-teal/25 bg-gym-teal/10 text-gym-teal";
  }
  return "border-border bg-secondary text-muted-foreground";
}

function buildSearchText(item: CatracaAcesso): string {
  return [
    item.memberNome,
    item.memberEmail,
    item.memberDocumento,
    item.memberId,
    item.agentId,
    item.gate,
    item.status,
    item.direction,
    item.issuedBy,
    item.reason,
    item.releaseType,
    item.statusCliente,
    item.tenantId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function toTimestamp(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function estimateTotal(input: {
  total?: number;
  page: number;
  size: number;
  itemsLength: number;
  hasNext: boolean;
}): number {
  if (typeof input.total === "number") return input.total;
  if (input.hasNext) return (input.page + 2) * input.size;
  return input.page * input.size + input.itemsLength;
}

type RankingRow = {
  id: string;
  nome: string;
  contrato: string;
  status: string;
  frequencia: number;
  foto?: string;
};

type DashboardViewData = {
  entradas: number;
  manuais: number;
  bloqueados: number;
  frequenciaMedia: number;
  series: Array<{ date: string; entrada: number; manual: number; bloqueado: number }>;
  maxDia: number;
  ranking: RankingRow[];
};

export default function CatracaAcessosPage() {
  const { tenantId, tenantResolved } = useTenantContext();
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "ACESSOS">("DASHBOARD");
  const [page, setPage] = useState(0);
  const size = 20;

  const [periodStartDraft, setPeriodStartDraft] = useState("");
  const [periodEndDraft, setPeriodEndDraft] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<SuggestionOption | null>(null);
  const [clienteOptions, setClienteOptions] = useState<SuggestionOption[]>([]);
  const [clienteCatalogoById, setClienteCatalogoById] = useState<Record<string, {
    nome: string;
    email?: string;
    cpf?: string;
    foto?: string;
  }>>({});
  const [clienteOptionsLoadedTenant, setClienteOptionsLoadedTenant] = useState("");
  const [loadingClienteOptions, setLoadingClienteOptions] = useState(false);
  const [erroClienteOptions, setErroClienteOptions] = useState("");

  const [tipoLiberacaoFiltro, setTipoLiberacaoFiltro] = useState<TipoLiberacaoFiltro>(FILTER_ALL);
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>(FILTER_ALL);
  const filtersReady = Boolean(periodStart) && Boolean(periodEnd);

  useEffect(() => {
    const today = getTodayDate();
    setPeriodStartDraft(today);
    setPeriodEndDraft(today);
    setPeriodStart(today);
    setPeriodEnd(today);
  }, []);

  // Server state via TanStack Query
  const { data: response, isLoading: loading, error: queryError, refetch } = useCatracaAcessos({
    tenantId: tenantId ?? undefined,
    tenantResolved: tenantResolved && filtersReady,
    page,
    size,
    startDate: periodStart,
    endDate: periodEnd,
    tipoLiberacao: tipoLiberacaoFiltro,
    status: statusFiltro,
  });

  const items = useMemo(() => {
    if (!response?.items) return [];
    return [...response.items].sort(
      (first, second) =>
        toTimestamp(second.occurredAt ?? second.createdAt) - toTimestamp(first.occurredAt ?? first.createdAt),
    );
  }, [response?.items]);

  const hasNext = response?.hasNext ?? false;
  const dashboardResumoApi = response?.resumo ?? null;
  const dashboardSerieApi = response?.serieDiaria ?? null;
  const dashboardRankingApi = response?.rankingFrequencia ?? null;
  const total = estimateTotal({
    total: response?.total ?? 0,
    page: response?.page ?? 0,
    size: response?.size ?? size,
    itemsLength: items.length,
    hasNext,
  });
  const error = queryError ? normalizeErrorMessage(queryError) : "";

  useEffect(() => {
    setPage(0);
    setClienteSelecionado(null);
    setClienteQuery("");
    setClienteOptions([]);
    setClienteCatalogoById({});
    setClienteOptionsLoadedTenant("");
    setErroClienteOptions("");
  }, [tenantId]);

  const loadClienteOptions = useCallback(async () => {
    if (!tenantId) return;
    if (loadingClienteOptions) return;
    if (clienteOptionsLoadedTenant === tenantId && clienteOptions.length > 0) return;

    setLoadingClienteOptions(true);
    setErroClienteOptions("");
    try {
      const unique = new Map<string, SuggestionOption>();
      const catalog: Record<string, { nome: string; email?: string; cpf?: string; foto?: string }> = {};
      let currentPage = 0;
      let hasNextLoop = true;
      let iterations = 0;

      while (hasNextLoop) {
        iterations += 1;
        if (iterations > 10000) {
          throw new Error("Limite de paginação excedido ao carregar clientes.");
        }

        const result = await listAlunosApi({
          tenantId,
          page: currentPage,
          size: 200,
        });
        const alunos = extractAlunosFromListResponse(result);

        for (const aluno of alunos) {
          if (!aluno.id || unique.has(aluno.id)) continue;
          catalog[aluno.id] = {
            nome: aluno.nome,
            email: aluno.email,
            cpf: aluno.cpf,
            foto: aluno.foto,
          };
          unique.set(aluno.id, {
            id: aluno.id,
            label: aluno.cpf ? `${aluno.nome} • ${aluno.cpf}` : aluno.nome,
            searchText: [aluno.nome, aluno.cpf, aluno.email, aluno.telefone].filter(Boolean).join(" "),
          });
        }

        hasNextLoop = Array.isArray(result) ? false : Boolean(result.hasNext);
        if (!hasNextLoop || alunos.length === 0) break;
        currentPage = (Array.isArray(result) ? currentPage : (result.page ?? currentPage)) + 1;
      }

      setClienteOptions(Array.from(unique.values()));
      setClienteCatalogoById(catalog);
      setClienteOptionsLoadedTenant(tenantId);
    } catch (loadError) {
      setClienteOptions([]);
      setClienteCatalogoById({});
      setClienteOptionsLoadedTenant("");
      setErroClienteOptions(normalizeErrorMessage(loadError));
    } finally {
      setLoadingClienteOptions(false);
    }
  }, [tenantId, loadingClienteOptions, clienteOptionsLoadedTenant, clienteOptions.length]);

  const globallyFilteredItems = useMemo(() => {
    let scoped = items;

    if (statusFiltro !== FILTER_ALL) {
      scoped = scoped.filter((item) => {
        const blocked = isBlockedStatus(item.status);
        return statusFiltro === "BLOQUEADO" ? blocked : !blocked;
      });
    }

    if (tipoLiberacaoFiltro !== FILTER_ALL) {
      scoped = scoped.filter((item) => resolveTipoLiberacao(item.releaseType, item.issuedBy) === tipoLiberacaoFiltro);
    }

    return scoped;
  }, [items, tipoLiberacaoFiltro, statusFiltro]);

  const filteredItems = useMemo(() => {
    let scoped = globallyFilteredItems;

    if (clienteSelecionado) {
      const selectedTerm = (clienteSelecionado.searchText ?? clienteSelecionado.label).toLowerCase();
      const selectedId = clienteSelecionado.id;
      scoped = scoped.filter((item) => {
        if (item.memberId && item.memberId === selectedId) return true;
        return buildSearchText(item).includes(selectedTerm);
      });
    }

    return scoped;
  }, [globallyFilteredItems, clienteSelecionado]);

  const dashboard = useMemo<DashboardViewData | null>(() => {
    if (!dashboardResumoApi || !dashboardSerieApi || !dashboardRankingApi) {
      return null;
    }

    const rankingApi: RankingRow[] = dashboardRankingApi.map((entry, index) => ({
      id: entry.memberId || `${index}`,
      nome: entry.nome,
      contrato: entry.contrato || "Plano ativo",
      status: entry.statusCliente || "Ativo",
      frequencia: entry.frequencia,
      foto: entry.fotoUrl,
    }));

    const series = dashboardSerieApi.map((entry) => ({
      date: entry.date,
      entrada: entry.entradas,
      manual: entry.manuais,
      bloqueado: entry.bloqueados,
    }));
    const maxDia = Math.max(1, ...series.map((item) => item.entrada + item.manual + item.bloqueado));

    return {
      entradas: dashboardResumoApi.entradas,
      manuais: dashboardResumoApi.entradasManuais,
      bloqueados: dashboardResumoApi.bloqueados,
      frequenciaMedia: dashboardResumoApi.frequenciaMediaPorCliente,
      series,
      maxDia,
      ranking: rankingApi,
    };
  }, [dashboardResumoApi, dashboardSerieApi, dashboardRankingApi]);

  const showSuggestionHint = clienteQuery.trim().length > 0 && clienteQuery.trim().length < 3;

  function applyPeriodFilter() {
    if (!periodStartDraft || !periodEndDraft) return;
    if (periodStartDraft > periodEndDraft) return;
    setPage(0);
    setPeriodStart(periodStartDraft);
    setPeriodEnd(periodEndDraft);
  }

  function resetTodayPeriod() {
    const today = getTodayDate();
    setPage(0);
    setPeriodStartDraft(today);
    setPeriodEndDraft(today);
    setPeriodStart(today);
    setPeriodEnd(today);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gerencial</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Acessos na Catraca</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize indicadores e eventos de acesso da unidade com filtros globais.
          </p>
        </div>
        <Button type="button" onClick={() => void refetch()} disabled={loading || !filtersReady}>
          <RefreshCw className="mr-2 size-4" />
          {loading ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("DASHBOARD")}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "DASHBOARD"
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ACESSOS")}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "ACESSOS"
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            Acessos
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[170px_170px_180px_180px_auto_auto]">
          <Select
            value={tipoLiberacaoFiltro}
            onValueChange={(value) => {
              setTipoLiberacaoFiltro(value as TipoLiberacaoFiltro);
              setPage(0);
            }}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Tipo de liberação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Todos os tipos</SelectItem>
              <SelectItem value="AUTOMATICA">Automática</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFiltro}
            onValueChange={(value) => {
              setStatusFiltro(value as StatusFiltro);
              setPage(0);
            }}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Todos os status</SelectItem>
              <SelectItem value="LIBERADO">Liberados</SelectItem>
              <SelectItem value="BLOQUEADO">Bloqueados</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={periodStartDraft}
            onChange={(event) => setPeriodStartDraft(event.target.value)}
            className="bg-secondary border-border"
          />
          <Input
            type="date"
            value={periodEndDraft}
            onChange={(event) => setPeriodEndDraft(event.target.value)}
            className="bg-secondary border-border"
          />
          <Button
            type="button"
            variant="outline"
            className="border-border"
            disabled={!periodStartDraft || !periodEndDraft || periodStartDraft > periodEndDraft}
            onClick={applyPeriodFilter}
          >
            Aplicar período
          </Button>
          <Button type="button" variant="outline" className="border-border" disabled={!filtersReady} onClick={resetTodayPeriod}>
            Hoje
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Período ativo: <span className="font-semibold text-foreground">{periodStart || "—"}</span> até{" "}
          <span className="font-semibold text-foreground">{periodEnd || "—"}</span>
        </p>

        {error ? <p className="text-sm text-gym-danger">{error}</p> : null}
      </div>

      {activeTab === "DASHBOARD" ? (
        <>
          {!dashboard ? (
            <div className="rounded-xl border border-gym-warning/30 bg-gym-warning/10 p-4 text-sm text-gym-warning">
              O backend não retornou dados completos do dashboard (resumo, série e ranking) para os filtros atuais.
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-4 inline-flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              Considera acessos únicos com janela de 2 horas por cliente e tipo de liberação.{" "}
              <strong>Entradas</strong> = automáticas (política/totem); <strong>Manuais</strong> = operador/backoffice;{" "}
              os totais não se sobrepõem.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-gym-teal/25 bg-gym-teal/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gym-teal">Entradas automáticas</p>
                  <LogIn className="size-4 text-gym-teal" />
                </div>
                <p className="mt-3 font-display text-4xl font-bold leading-none text-gym-teal">{dashboard?.entradas ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gym-warning/25 bg-gym-warning/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gym-warning">Entradas Manuais</p>
                  <AlertTriangle className="size-4 text-gym-warning" />
                </div>
                <p className="mt-3 font-display text-4xl font-bold leading-none text-gym-warning">{dashboard?.manuais ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gym-danger/25 bg-gym-danger/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gym-danger">Bloqueados</p>
                  <Lock className="size-4 text-gym-danger" />
                </div>
                <p className="mt-3 font-display text-4xl font-bold leading-none text-gym-danger">{dashboard?.bloqueados ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <BarChart3 className="size-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Frequência Média por Cliente</h2>
                </div>
                <p className="font-display text-3xl font-bold text-foreground">{(dashboard?.frequenciaMedia ?? 0).toFixed(2)}</p>
              </div>
              {!dashboard || dashboard.series.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados no período para exibir tendência.</p>
              ) : (
                <div className="space-y-2">
                  {dashboard.series.map((ponto) => {
                    const totalDia = ponto.entrada + ponto.manual + ponto.bloqueado;
                    const width = Math.max(6, Math.round((totalDia / dashboard.maxDia) * 100));
                    return (
                      <div key={ponto.date} className="grid grid-cols-[78px_1fr_54px] items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatMonthDay(ponto.date)}
                        </span>
                        <div className="h-2 rounded-full bg-secondary">
                          <div className="h-2 rounded-full bg-gym-teal" style={{ width: `${width}%` }} />
                        </div>
                        <span className="text-right text-xs font-semibold text-foreground">{totalDia}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 inline-flex items-center gap-2">
                <Trophy className="size-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Ranking de Frequência</h2>
              </div>
              {!dashboard || dashboard.ranking.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem frequência de entrada para montar ranking.</p>
              ) : (
                <div className="space-y-2">
                  {dashboard.ranking.map((entry, index) => (
                    <div key={entry.id} className="grid grid-cols-[34px_1fr_90px_80px] items-center gap-2 rounded-lg border border-border px-3 py-2">
                      <span className="text-sm font-semibold text-muted-foreground">{index + 1}º</span>
                      <div className="flex items-center gap-2">
                        <ClienteThumbnail nome={entry.nome} foto={entry.foto} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{entry.nome}</p>
                          <p className="truncate text-xs text-muted-foreground">{entry.contrato}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{entry.status}</span>
                      <span className="text-right font-semibold text-foreground">{entry.frequencia}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <SuggestionInput
                value={clienteQuery}
                onValueChange={(value) => {
                  setClienteQuery(value);
                  setClienteSelecionado(null);
                  setPage(0);
                }}
                onSelect={(option) => {
                  setClienteSelecionado(option);
                  setClienteQuery(option.label);
                  setPage(0);
                }}
                onFocusOpen={loadClienteOptions}
                options={clienteOptions}
                placeholder="Cliente (mín. 3 letras)"
                emptyText={
                  loadingClienteOptions
                    ? "Carregando base de clientes..."
                    : "Nenhum cliente encontrado"
                }
                minCharsToSearch={3}
              />
              <Input
                value={`Página ${page + 1} · ${filteredItems.length} registros na lista`}
                readOnly
                disabled
                className="bg-secondary border-border text-sm text-muted-foreground"
              />
            </div>

            {showSuggestionHint ? (
              <p className="text-xs text-muted-foreground">
                Digite pelo menos 3 caracteres para pesquisar cliente.
              </p>
            ) : null}
            {erroClienteOptions ? <p className="text-xs text-gym-danger">{erroClienteOptions}</p> : null}
          </div>

          <PaginatedTable<CatracaAcesso>
            columns={[
              { label: "Cliente", className: "w-[260px]" },
              { label: "Status do cliente", className: "w-[140px]" },
              { label: "Dia", className: "w-[130px]" },
              { label: "Horário", className: "w-[120px]" },
              { label: "Tipo de liberação", className: "w-[180px]" },
              { label: "Quem liberou", className: "w-[200px]" },
              { label: "Motivo", className: "min-w-[200px]" },
            ]}
            items={filteredItems}
            emptyText={loading ? "Carregando acessos..." : "Nenhum acesso encontrado para os filtros informados."}
            getRowKey={(item) => `${item.id}-${item.occurredAt ?? item.createdAt ?? ""}-${item.memberId ?? ""}`}
            rowClassName={() => "hover:bg-secondary/30"}
            renderCells={(item) => {
              const tipoExibicao = resolveTipoExibicao(item);
              const tipoLiberacao = resolveTipoLiberacao(item.releaseType, item.issuedBy);
              const whoReleased = tipoLiberacao === "MANUAL" ? formatText(item.issuedBy ?? item.createdBy) : "—";
              const accessDateTime = item.occurredAt ?? item.createdAt;
              const catalog = item.memberId ? clienteCatalogoById[item.memberId] : undefined;
              const memberNome = item.memberNome?.trim() || catalog?.nome?.trim();
              const memberEmail = item.memberEmail?.trim() || catalog?.email?.trim();
              const memberDocumento = item.memberDocumento ?? catalog?.cpf;
              const memberFoto = item.memberFoto ?? catalog?.foto;
              return (
                <>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ClienteThumbnail nome={memberNome} foto={memberFoto} size="md" />
                      <div>
                        <p className="font-medium text-foreground">{formatText(memberNome)}</p>
                        <p className="text-xs text-muted-foreground break-all">
                          {formatText(memberEmail ?? memberDocumento)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{formatText(item.statusCliente)}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDay(accessDateTime)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs font-medium text-foreground">
                    {formatTime(accessDateTime)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {/* tipoExibicao ja comunica Liberado/Manual/Bloqueado — o badge
                        de status (LIBERADO/BLOQUEADO) era redundante e duplicava
                        a informação no mesmo card. Mantemos apenas o badge de
                        origem (Wellhub/Operador/Visitante/etc) quando aplicável. */}
                    <div className="space-y-1">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${tipoExibicao.className}`}
                      >
                        {tipoExibicao.label}
                      </span>
                      {(() => {
                        const origem = resolveOrigemDisplay(item.systemName);
                        if (!origem) return null;
                        return (
                          <p className={`text-[11px] ${origem.className} inline-flex rounded-full border px-2 py-0.5`}>
                            {origem.label}
                          </p>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">{whoReleased}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    {formatText(item.reason)}
                  </TableCell>
                </>
              );
            }}
            page={page}
            pageSize={size}
            total={total}
            hasNext={hasNext}
            onPrevious={() => setPage((current) => Math.max(0, current - 1))}
            onNext={() => setPage((current) => current + 1)}
            disablePrevious={loading || page === 0}
            disableNext={loading || !hasNext}
            itemLabel="acessos"
          />
        </>
      )}
    </div>
  );
}
