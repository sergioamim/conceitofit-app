"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, RefreshCw, Siren, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listIntegracoesOperacionaisApi,
  reprocessarIntegracaoOperacionalApi,
} from "@/lib/api/financeiro-operacional";
import { INTEGRACAO_STATUS_LABEL, summarizeIntegracoesOperacionais } from "@/lib/domain/financeiro";
import { useAuthAccess, useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { IntegracaoOperacional, IntegracaoOperacionalStatus } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatDateTime } from "@/lib/formatters";
import { PageError } from "@/components/shared/page-error";
import { useAdminCrud } from "@/lib/query/use-admin-crud";

type StatusFiltro = IntegracaoOperacionalStatus | "TODAS";

function getStatusClass(status: IntegracaoOperacionalStatus) {
  if (status === "SAUDAVEL") return "bg-gym-teal/15 text-gym-teal border-gym-teal/25";
  if (status === "FALHA") return "bg-gym-danger/10 text-gym-danger border-gym-danger/25";
  if (status === "CONFIGURACAO_PENDENTE") return "bg-muted text-muted-foreground border-border";
  return "bg-gym-warning/10 text-gym-warning border-gym-warning/25";
}

function getSeverityClass(severity: "INFO" | "WARN" | "ERROR") {
  if (severity === "ERROR") return "text-gym-danger";
  if (severity === "WARN") return "text-gym-warning";
  return "text-gym-teal";
}

export function IntegracoesContent() {
  const access = useAuthAccess();
  const { tenantId, tenantName, tenantResolved } = useTenantContext();
  const {
    items: integracoes,
    isLoading: loading,
    error: queryError,
    refetch: load,
  } = useAdminCrud<IntegracaoOperacional>({
    domain: "integracoes",
    tenantId,
    enabled: tenantResolved && !access.loading && access.canAccessElevatedModules,
    listFn: (tid) => listIntegracoesOperacionaisApi({ tenantId: tid }),
  });
  const loadError = queryError ? normalizeErrorMessage(queryError) : null;
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFiltro>("TODAS");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return integracoes.filter((item) => {
      if (status !== "TODAS" && item.status !== status) return false;
      if (!term) return true;
      return [item.nome, item.fornecedor, item.tipo, item.ultimoErro ?? ""].join(" ").toLowerCase().includes(term);
    });
  }, [integracoes, search, status]);

  const resumo = useMemo(() => summarizeIntegracoesOperacionais(filtered), [filtered]);

  async function handleReprocess(id: string) {
    if (!tenantId) return;
    setActionLoadingId(id);
    setError(null);
    setSuccess(null);
    try {
      await reprocessarIntegracaoOperacionalApi({ tenantId, id });
      setSuccess("Integração reprocessada com sucesso.");
      void load();
    } catch (actionError) {
      setError(normalizeErrorMessage(actionError));
    } finally {
      setActionLoadingId(null);
    }
  }

  const accessDenied = !access.loading && !access.canAccessElevatedModules;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Administrativo</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Monitoramento de integrações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saúde operacional da unidade ativa:{" "}
            <span className="font-medium text-foreground">{tenantResolved ? tenantName : "Carregando..."}</span>
          </p>
        </div>
        <Button variant="outline" className="border-border" onClick={() => void load()} disabled={loading || accessDenied}>
          <RefreshCw className="mr-2 size-4" />
          Atualizar
        </Button>
      </div>

      {accessDenied ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 p-4 text-sm text-gym-danger">
          Apenas usuários com permissão elevada podem acompanhar o monitoramento operacional.
        </div>
      ) : null}

      <PageError error={loadError} onRetry={load} />

      {(error || success) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error
              ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
              : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
          }`}
        >
          {error ?? success}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saudáveis</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">{resumo.saudavel}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Atenção</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">{resumo.atencao}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Falhas</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-danger">{resumo.falha}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Configuração pendente</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-foreground">{resumo.configuracaoPendente}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fila pendente</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">{resumo.filaPendente}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, tipo, fornecedor ou erro..."
            className="border-border bg-secondary"
          />
          <Select value={status} onValueChange={(value) => setStatus(value as StatusFiltro)}>
            <SelectTrigger className="w-full border-border bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value="TODAS">Todas</SelectItem>
              <SelectItem value="SAUDAVEL">Saudável</SelectItem>
              <SelectItem value="ATENCAO">Atenção</SelectItem>
              <SelectItem value="FALHA">Falha</SelectItem>
              <SelectItem value="CONFIGURACAO_PENDENTE">Configuração pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground xl:col-span-2">
            {loading ? "Carregando integrações..." : "Nenhuma integração encontrada para os filtros atuais."}
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="size-4 text-gym-accent" />
                    <h2 className="font-display text-lg font-bold">{item.nome}</h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.fornecedor} · {item.tipo}
                  </p>
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(item.status)}`}>
                  {INTEGRACAO_STATUS_LABEL[item.status]}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Última execução</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{item.ultimaExecucaoEm ? formatDateTime(item.ultimaExecucaoEm) : "Sem execução"}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Último sucesso</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{item.ultimaSucessoEm ? formatDateTime(item.ultimaSucessoEm) : "Sem execução"}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Fila pendente</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{item.filaPendente}</p>
                </div>
              </div>

              {item.ultimoErro ? (
                <div className="mt-4 rounded-lg border border-gym-danger/25 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
                  {item.ultimoErro}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="border-border"
                  onClick={() => void handleReprocess(item.id)}
                  disabled={actionLoadingId === item.id}
                >
                  {actionLoadingId === item.id ? "Reprocessando..." : "Reprocessar"}
                </Button>
                {item.linkDestino ? (
                  <Button asChild variant="outline" className="border-border">
                    <Link href={item.linkDestino}>Abrir módulo</Link>
                  </Button>
                ) : null}
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Siren className="size-3.5" />
                  Últimas ocorrências
                </div>
                {item.ocorrencias.length === 0 ? (
                  <div className="rounded-lg border border-border px-3 py-3 text-sm text-muted-foreground">
                    Sem ocorrências recentes.
                  </div>
                ) : (
                  item.ocorrencias.slice(0, 3).map((occurrence) => (
                    <div key={occurrence.id} className="rounded-lg border border-border px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-sm font-medium ${getSeverityClass(occurrence.severidade)}`}>
                          {occurrence.mensagem}
                        </p>
                        {occurrence.severidade === "ERROR" ? (
                          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-gym-danger" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(occurrence.dataCriacao)}
                        {occurrence.codigo ? ` · ${occurrence.codigo}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
