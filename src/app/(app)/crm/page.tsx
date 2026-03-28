"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  listCrmAutomacoesApi,
  listCrmTasksApi,
  listProspectsApi,
  updateCrmAutomacaoApi,
} from "@/lib/api/crm";
import { listFuncionariosApi } from "@/lib/api/administrativo";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import type { CrmAutomation, CrmWorkspaceSnapshot } from "@/lib/types";
import { buildCrmWorkspaceSnapshotRuntime, enrichCrmTasksRuntime, normalizeProspectRuntime } from "@/lib/tenant/crm/runtime";
import {
  CRM_ACTIVITY_LABEL,
  CRM_AUTOMATION_ACTION_LABEL,
  CRM_AUTOMATION_TRIGGER_LABEL,
} from "@/lib/tenant/crm/workspace";
import { useTenantContext } from "@/hooks/use-session-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatDateTime(value?: string): string {
  if (!value) return "Sem registro";
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function CrmWorkspacePage() {
  const tenantContext = useTenantContext();
  const [snapshot, setSnapshot] = useState<CrmWorkspaceSnapshot | null>(null);
  const [automations, setAutomations] = useState<CrmAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingAutomationId, setSavingAutomationId] = useState<string | null>(null);
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [prospectRows, taskRows, automationRows, funcionarioRows] = await Promise.all([
        listProspectsApi({ tenantId }),
        listCrmTasksApi({ tenantId }),
        listCrmAutomacoesApi({ tenantId }),
        listFuncionariosApi(true),
      ]);
      const prospects = prospectRows.map((prospect) => normalizeProspectRuntime(prospect));
      const tasks = enrichCrmTasksRuntime({
        tasks: taskRows,
        prospects,
        funcionarios: funcionarioRows,
      });
      setSnapshot(
        buildCrmWorkspaceSnapshotRuntime({
          tenantId,
          prospects,
          tasks,
          automations: automationRows,
        })
      );
      setAutomations(automationRows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar workspace de CRM.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggleAutomation(row: CrmAutomation) {
    if (!tenantId) return;
    setSavingAutomationId(row.id);
    try {
      await updateCrmAutomacaoApi({
        tenantId,
        id: row.id,
        data: { ativo: !row.ativo },
      });
      await load();
    } finally {
      setSavingAutomationId(null);
    }
  }

  const summaryCards = snapshot
    ? [
        { label: "Prospects abertos", value: snapshot.totalProspectsAbertos, tone: "text-sky-300" },
        { label: "Tarefas abertas", value: snapshot.totalTarefasAbertas, tone: "text-amber-300" },
        { label: "Tarefas atrasadas", value: snapshot.totalTarefasAtrasadas, tone: "text-rose-300" },
        { label: "Automações ativas", value: snapshot.totalAutomacoesAtivas, tone: "text-emerald-300" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            CRM operacional
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Workspace CRM</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Pipeline, produtividade comercial, automações e histórico da unidade{" "}
            <span className="font-semibold text-foreground">
              {tenantContext.tenantName ?? "atual"}
            </span>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/crm/prospects-kanban">Abrir funil</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/crm/tarefas">Tarefas</Link>
          </Button>
          <Button asChild>
            <Link href="/crm/playbooks">Playbooks e cadências</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-rose-500/40 bg-rose-500/10">
          <CardContent className="px-6 py-5 text-sm text-rose-100">{error}</CardContent>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-border/60 bg-card/60">
              <CardContent className="px-6 py-8">
                <div className="h-4 w-24 rounded bg-secondary" />
                <div className="mt-4 h-8 w-16 rounded bg-secondary" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && snapshot ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.label} className="border-border/70 bg-card/80">
                <CardHeader className="gap-1">
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle className={`font-display text-3xl ${card.tone}`}>{card.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>Visão por etapa</CardTitle>
                <CardDescription>Distribuição do funil com carga operacional por estágio.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {snapshot.estagios.map((stage) => (
                  <div key={stage.stageStatus} className="rounded-xl border border-border/70 bg-secondary/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{stage.stageNome}</p>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                        SLA {stage.slaHoras}h
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Prospects</p>
                        <p className="mt-1 font-display text-2xl text-sky-300">{stage.totalProspects}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Tarefas</p>
                        <p className="mt-1 font-display text-2xl text-amber-300">{stage.totalTarefas}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>Próximas tarefas</CardTitle>
                <CardDescription>Fila curta para execução do operador.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {snapshot.proximasTarefas.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma tarefa em aberto para a unidade atual.
                  </div>
                ) : (
                  snapshot.proximasTarefas.map((task) => (
                    <div key={task.id} className="rounded-xl border border-border/70 bg-secondary/30 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{task.titulo}</p>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                          {task.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {task.prospectNome ?? "Sem prospect"} · {task.responsavelNome ?? "Sem responsável"}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Vence em {formatDateTime(task.vencimentoEm)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>Automações visíveis ao operador</CardTitle>
                <CardDescription>Regras ativas e pausadas com último disparo conhecido.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {automations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma automação configurada para esta unidade.
                  </div>
                ) : (
                  automations.map((automation) => (
                    <div key={automation.id} className="rounded-xl border border-border/70 bg-secondary/30 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{automation.nome}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                automation.ativo
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {automation.ativo ? "Ativa" : "Pausada"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {CRM_AUTOMATION_TRIGGER_LABEL[automation.gatilho]} ·{" "}
                            {CRM_AUTOMATION_ACTION_LABEL[automation.acao]}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {automation.execucoes} execuções · último disparo {formatDateTime(automation.ultimaExecucao)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleToggleAutomation(automation)}
                          disabled={savingAutomationId === automation.id}
                        >
                          {savingAutomationId === automation.id
                            ? "Salvando..."
                            : automation.ativo
                            ? "Pausar"
                            : "Ativar"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>Timeline de follow-up</CardTitle>
                <CardDescription>Eventos recentes de tarefas, contatos e automações.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {snapshot.atividadesRecentes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                    Ainda não há eventos no histórico desta unidade.
                  </div>
                ) : (
                  snapshot.atividadesRecentes.map((activity) => (
                    <div key={activity.id} className="border-l border-border/70 pl-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {CRM_ACTIVITY_LABEL[activity.tipo]}
                      </p>
                      <p className="mt-1 font-semibold">{activity.titulo}</p>
                      {activity.descricao ? (
                        <p className="mt-1 text-sm text-muted-foreground">{activity.descricao}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {activity.prospectNome ? `${activity.prospectNome} · ` : ""}
                        {activity.actorNome} · {formatDateTime(activity.dataCriacao)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
