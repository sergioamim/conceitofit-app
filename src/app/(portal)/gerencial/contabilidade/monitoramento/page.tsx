"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, DollarSign, Eye, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListErrorState } from "@/components/shared/list-states";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  listTransacoesSuspeitasApi,
  listPadroesIncomunsApi,
  listAltaFrequenciaApi,
  listAltoValorApi,
} from "@/lib/api/financial";
import type {
  TransacaoSuspeita,
  PadraoIncomum,
  AltaFrequencia,
  AltoValor,
  MonitorAlertSeverity,
} from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/formatters";

const SEVERITY_CLASS: Record<string, string> = {
  INFO: "bg-secondary text-muted-foreground",
  WARNING: "bg-gym-warning/15 text-gym-warning",
  CRITICAL: "bg-gym-danger/15 text-gym-danger",
};

// Polling de 30s para simular "tempo real" sem WebSocket (Task #549)
const REFETCH_INTERVAL_MS = 30_000;

type MonitoramentoData = {
  suspeitas: TransacaoSuspeita[];
  padroes: PadraoIncomum[];
  altaFrequencia: AltaFrequencia[];
  altoValor: AltoValor[];
};

function severityMatches(selected: string, value: MonitorAlertSeverity): boolean {
  return selected === FILTER_ALL || selected === value;
}

export default function MonitoramentoPage() {
  const tenantContext = useTenantContext();
  const [severityFilter, setSeverityFilter] = useState<string>(FILTER_ALL);

  const { data, isLoading: loading, error: loadError, refetch, isFetching, dataUpdatedAt } =
    useQuery<MonitoramentoData>({
      queryKey: ["gerencial", "monitoramento", tenantContext.tenantId],
      queryFn: async () => {
        const [suspeitas, padroes, altaFrequencia, altoValor] = await Promise.all([
          listTransacoesSuspeitasApi({ tenantId: tenantContext.tenantId }),
          listPadroesIncomunsApi({ tenantId: tenantContext.tenantId }),
          listAltaFrequenciaApi({ tenantId: tenantContext.tenantId }),
          listAltoValorApi({ tenantId: tenantContext.tenantId }),
        ]);
        return { suspeitas, padroes, altaFrequencia, altoValor };
      },
      enabled: tenantContext.tenantResolved,
      refetchInterval: REFETCH_INTERVAL_MS,
      refetchIntervalInBackground: false,
      staleTime: REFETCH_INTERVAL_MS / 2,
    });

  const { suspeitas, padroes, altaFrequencia: altaFreq, altoValor } = data ?? {
    suspeitas: [],
    padroes: [],
    altaFrequencia: [],
    altoValor: [],
  };
  const error = loadError instanceof Error ? loadError.message : null;

  // Filtro por severidade
  const suspeitasFiltradas = useMemo(
    () => suspeitas.filter((s) => severityMatches(severityFilter, s.severidade)),
    [suspeitas, severityFilter],
  );
  const padroesFiltrados = useMemo(
    () => padroes.filter((p) => severityMatches(severityFilter, p.severidade)),
    [padroes, severityFilter],
  );
  const altaFreqFiltrada = useMemo(
    () => altaFreq.filter((a) => severityMatches(severityFilter, a.severidade)),
    [altaFreq, severityFilter],
  );
  const altoValorFiltrado = useMemo(
    () => altoValor.filter((a) => severityMatches(severityFilter, a.severidade)),
    [altoValor, severityFilter],
  );

  const suspeitasNaoRevisadas = suspeitasFiltradas.filter((s) => !s.revisada).length;
  const padroesNaoResolvidos = padroesFiltrados.filter((p) => !p.resolvido).length;
  const alertasTotal =
    suspeitasNaoRevisadas +
    padroesNaoResolvidos +
    altaFreqFiltrada.length +
    altoValorFiltrado.length;

  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contabilidade</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Monitoramento</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Painel anti-fraude: transacoes suspeitas, padroes incomuns, alta frequencia e alto valor.
            {lastUpdate ? (
              <span className="ml-2 text-xs">
                (atualizado {lastUpdate.toLocaleTimeString("pt-BR")}, auto-refresh {REFETCH_INTERVAL_MS / 1000}s)
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-44 border-border bg-secondary">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value={FILTER_ALL}>Todas as severidades</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="WARNING">WARNING</SelectItem>
              <SelectItem value="CRITICAL">CRITICAL</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void refetch()} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Alertas</p>
          <p className={`mt-2 font-display text-2xl font-extrabold ${alertasTotal > 0 ? "text-gym-danger" : "text-gym-teal"}`}>
            {alertasTotal}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Suspeitas Pendentes</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">{suspeitasNaoRevisadas}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Padroes Incomuns</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">{padroesNaoResolvidos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Alta Frequencia</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">{altaFreqFiltrada.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Alto Valor</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">{altoValorFiltrado.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card/60" />)}
        </div>
      ) : (
        <>
          {/* Transações suspeitas */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="size-4 text-gym-danger" />
              <h2 className="font-display text-lg font-bold">Transacoes Suspeitas</h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {suspeitasFiltradas.length}
              </span>
            </div>
            {suspeitasFiltradas.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma transacao suspeita detectada.</p>
            ) : (
              <div className="space-y-2">
                {suspeitasFiltradas.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_CLASS[s.severidade] ?? SEVERITY_CLASS.INFO}`}>
                          {s.severidade}
                        </span>
                        <p className="text-sm font-medium">{s.descricao}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{s.motivo} — {formatBRL(s.valor)} em {formatDate(s.data)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.revisada ? (
                        <span className="rounded-full bg-gym-teal/15 px-2 py-0.5 text-[11px] font-semibold text-gym-teal">Revisada</span>
                      ) : (
                        <span className="rounded-full bg-gym-warning/15 px-2 py-0.5 text-[11px] font-semibold text-gym-warning">Pendente</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Padrões incomuns */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Eye className="size-4 text-gym-warning" />
              <h2 className="font-display text-lg font-bold">Padroes Incomuns</h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {padroesFiltrados.length}
              </span>
            </div>
            {padroesFiltrados.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum padrao incomum detectado.</p>
            ) : (
              <div className="space-y-2">
                {padroesFiltrados.map((p) => (
                  <div key={p.id} className="rounded-lg border border-border px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_CLASS[p.severidade] ?? SEVERITY_CLASS.INFO}`}>
                        {p.severidade}
                      </span>
                      <p className="text-sm font-medium">{p.descricao}</p>
                      {p.resolvido ? (
                        <span className="rounded-full bg-gym-teal/15 px-2 py-0.5 text-[11px] font-semibold text-gym-teal">Resolvido</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.detalhes} — Detectado em {formatDate(p.detectadoEm)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alta frequência */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-gym-accent" />
              <h2 className="font-display text-lg font-bold">Alta Frequencia</h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {altaFreqFiltrada.length}
              </span>
            </div>
            {altaFreqFiltrada.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum alerta de alta frequencia.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="px-3 py-2 text-left font-semibold">Conta</th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold">Transacoes</th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold">Valor Total</th>
                      <th scope="col" className="px-3 py-2 text-left font-semibold">Periodo</th>
                      <th scope="col" className="px-3 py-2 text-center font-semibold">Severidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {altaFreqFiltrada.map((a) => (
                      <tr key={a.contaId} className="hover:bg-secondary/30">
                        <td className="px-3 py-2">
                          <span className="font-mono text-xs">{a.contaCodigo}</span> {a.contaNome}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{a.quantidadeTransacoes}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatBRL(a.valorTotal)}</td>
                        <td className="px-3 py-2">{a.periodo}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_CLASS[a.severidade] ?? SEVERITY_CLASS.INFO}`}>
                            {a.severidade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Alto Valor (Task #549) */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <DollarSign className="size-4 text-gym-accent" />
              <h2 className="font-display text-lg font-bold">Alto Valor</h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {altoValorFiltrado.length}
              </span>
            </div>
            {altoValorFiltrado.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma transacao de alto valor detectada.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="px-3 py-2 text-left font-semibold">Descricao</th>
                      <th scope="col" className="px-3 py-2 text-left font-semibold">Conta</th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold">Valor</th>
                      <th scope="col" className="px-3 py-2 text-left font-semibold">Data</th>
                      <th scope="col" className="px-3 py-2 text-center font-semibold">Severidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {altoValorFiltrado.map((a) => (
                      <tr key={a.id} className="hover:bg-secondary/30">
                        <td className="px-3 py-2 font-medium">{a.descricao}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {a.contaCodigo ? <span className="font-mono">{a.contaCodigo}</span> : "—"}{" "}
                          {a.contaNome ?? ""}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">{formatBRL(a.valor)}</td>
                        <td className="px-3 py-2">{formatDate(a.data)}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_CLASS[a.severidade] ?? SEVERITY_CLASS.INFO}`}>
                            {a.severidade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
