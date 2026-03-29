"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Eye, MonitorCheck, TrendingUp } from "lucide-react";
import { ListErrorState } from "@/components/shared/list-states";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  listTransacoesSuspeitasApi,
  listPadroesIncomunsApi,
  listAltaFrequenciaApi,
} from "@/lib/api/financial";
import type { TransacaoSuspeita, PadraoIncomum, AltaFrequencia } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/formatters";

const SEVERITY_CLASS: Record<string, string> = {
  INFO: "bg-secondary text-muted-foreground",
  WARNING: "bg-gym-warning/15 text-gym-warning",
  CRITICAL: "bg-gym-danger/15 text-gym-danger",
};

export default function MonitoramentoPage() {
  const tenantContext = useTenantContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suspeitas, setSuspeitas] = useState<TransacaoSuspeita[]>([]);
  const [padroes, setPadroes] = useState<PadraoIncomum[]>([]);
  const [altaFreq, setAltaFreq] = useState<AltaFrequencia[]>([]);

  const load = useCallback(async () => {
    if (!tenantContext.tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [s, p, a] = await Promise.all([
        listTransacoesSuspeitasApi({ tenantId: tenantContext.tenantId }),
        listPadroesIncomunsApi({ tenantId: tenantContext.tenantId }),
        listAltaFrequenciaApi({ tenantId: tenantContext.tenantId }),
      ]);
      setSuspeitas(s);
      setPadroes(p);
      setAltaFreq(a);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tenantContext.tenantId]);

  useEffect(() => {
    if (tenantContext.tenantResolved && tenantContext.tenantId) void load();
  }, [load, tenantContext.tenantId, tenantContext.tenantResolved]);

  const suspeitasNaoRevisadas = suspeitas.filter((s) => !s.revisada).length;
  const padroesNaoResolvidos = padroes.filter((p) => !p.resolvido).length;
  const alertasTotal = suspeitasNaoRevisadas + padroesNaoResolvidos + altaFreq.length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contabilidade</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">Monitoramento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Transacoes suspeitas, padroes incomuns e alertas de alta frequencia.
        </p>
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void load()} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
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
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">{altaFreq.length}</p>
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
                {suspeitas.length}
              </span>
            </div>
            {suspeitas.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma transacao suspeita detectada.</p>
            ) : (
              <div className="space-y-2">
                {suspeitas.map((s) => (
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
                {padroes.length}
              </span>
            </div>
            {padroes.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum padrao incomum detectado.</p>
            ) : (
              <div className="space-y-2">
                {padroes.map((p) => (
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
                {altaFreq.length}
              </span>
            </div>
            {altaFreq.length === 0 ? (
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
                    {altaFreq.map((a) => (
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
        </>
      )}
    </div>
  );
}
