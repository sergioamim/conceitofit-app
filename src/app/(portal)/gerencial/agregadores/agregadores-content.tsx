"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AGREGADOR_REPASSE_LABEL, summarizeAgregadorTransacoes } from "@/lib/domain/financeiro";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { AgregadorRepasseStatus } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";
import { formatBRL, formatDate, formatDateTime } from "@/lib/formatters";
import { useAgregadores, useReprocessarAgregador } from "@/lib/query/use-agregadores";

type RepasseFiltro = WithFilterAll<AgregadorRepasseStatus>;

function getRepasseClass(status: AgregadorRepasseStatus) {
  if (status === "LIQUIDADO") return "bg-gym-teal/15 text-gym-teal";
  if (status === "DIVERGENTE") return "bg-gym-danger/10 text-gym-danger";
  if (status === "EM_TRANSITO") return "bg-gym-warning/10 text-gym-warning";
  return "bg-muted text-muted-foreground";
}

export function AgregadoresContent() {
  const { tenantId, tenantName, tenantResolved } = useTenantContext();

  // Server state via TanStack Query
  const { data: rows = [], isLoading: loading, error: queryError, refetch } = useAgregadores({
    tenantId: tenantId ?? undefined,
    tenantResolved,
  });
  const reprocessMutation = useReprocessarAgregador(tenantId ?? undefined);

  // UI state
  const [search, setSearch] = useState("");
  const [repasse, setRepasse] = useState<RepasseFiltro>(FILTER_ALL);
  const [success, setSuccess] = useState<string | null>(null);
  const error = queryError ? normalizeErrorMessage(queryError) : reprocessMutation.error ? normalizeErrorMessage(reprocessMutation.error) : null;
  const actionId = reprocessMutation.isPending ? (reprocessMutation.variables as string) : null;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((item) => {
      if (repasse !== FILTER_ALL && item.statusRepasse !== repasse) return false;
      if (!term) return true;
      return [
        item.clienteNome,
        item.descricao,
        item.adquirente,
        item.nsu,
        item.maquininhaNome ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [repasse, rows, search]);

  const resumo = useMemo(() => summarizeAgregadorTransacoes(filtered), [filtered]);

  async function handleReprocess(item: { id: string; nsu?: string }) {
    if (!tenantId) return;
    setSuccess(null);
    try {
      await reprocessMutation.mutateAsync(item.id);
      setSuccess(`Transação ${item.nsu ?? item.id} reprocessada.`);
    } catch {
      // error handled by mutation state
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gerencial</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Agregadores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operação de adquirentes e repasses da unidade ativa:{" "}
            <span className="font-medium text-foreground">{tenantResolved ? tenantName : "Carregando..."}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border" onClick={() => void refetch()} disabled={loading}>
            <RefreshCw className="mr-2 size-4" />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/administrativo/conciliacao-bancaria">Abrir conciliação</Link>
          </Button>
        </div>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bruto no filtro</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">{formatBRL(resumo.totalBruto)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Líquido esperado</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-foreground">{formatBRL(resumo.totalLiquido)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Liquidado</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">{formatBRL(resumo.totalLiquidado)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Divergências</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-danger">{resumo.divergencias}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por cliente, NSU, maquininha ou adquirente..."
            className="border-border bg-secondary"
          />
          <Select value={repasse} onValueChange={(value) => setRepasse(value as RepasseFiltro)}>
            <SelectTrigger className="w-full border-border bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value={FILTER_ALL}>Todos os repasses</SelectItem>
              <SelectItem value="PREVISTO">Previsto</SelectItem>
              <SelectItem value="EM_TRANSITO">Em trânsito</SelectItem>
              <SelectItem value="LIQUIDADO">Liquidado</SelectItem>
              <SelectItem value="DIVERGENTE">Divergente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-4 py-3 text-left font-semibold">Transação</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Cliente</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Captura</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Repasse</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Valor líquido</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Carregando transações...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhuma transação encontrada para os filtros atuais.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <CreditCard className="mt-0.5 size-4 text-gym-accent" />
                      <div>
                        <p className="font-medium text-foreground">{item.nsu}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.adquirente} · {item.bandeira} · {item.maquininhaNome ?? "Sem terminal"}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.descricao}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{item.clienteNome}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.dataTransacao)}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p>{item.meioCaptura}</p>
                    <p className="text-xs">Taxa {formatBRL(item.taxa)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRepasseClass(item.statusRepasse)}`}>
                      {AGREGADOR_REPASSE_LABEL[item.statusRepasse]}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Previsto: {formatDate(item.dataPrevistaRepasse)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{formatBRL(item.valorLiquido)}</p>
                    <p className="text-xs text-muted-foreground">Bruto {formatBRL(item.valorBruto)}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {item.statusRepasse !== "LIQUIDADO" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border"
                          onClick={() => void handleReprocess(item)}
                          disabled={actionId === item.id}
                        >
                          {actionId === item.id ? "Processando..." : "Reprocessar"}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
