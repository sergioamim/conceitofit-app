"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  RefreshCcw,
  Settings2,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  listCrmCadenciasApi,
  updateCrmCadenciaApi,
} from "@/lib/api/crm";
import {
  listCrmCadenceExecutionsApi,
  listCrmEscalationRulesApi,
  triggerCrmCadenceApi,
  cancelCrmCadenceExecutionApi,
  processOverdueCadenceTasksApi,
} from "@/lib/api/crm-cadencias";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import type {
  CrmCadencia,
  CrmCadenceExecution,
  CrmCadenceExecutionStatus,
  CrmEscalationRule,
} from "@/lib/types";
import {
  CRM_CADENCIA_ACTION_LABEL,
  CRM_CADENCIA_TRIGGER_LABEL,
  CRM_CADENCE_EXECUTION_STATUS_LABEL,
  CRM_CADENCE_STEP_STATUS_LABEL,
  CRM_ESCALATION_ACTION_LABEL,
} from "@/lib/tenant/crm/workspace";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { getCrmStageName } from "@/lib/tenant/crm/workspace";

const EXECUTION_STATUS_COLORS: Record<CrmCadenceExecutionStatus, string> = {
  EM_ANDAMENTO: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  CONCLUIDA: "border-gym-teal/30 bg-gym-teal/10 text-gym-teal",
  CANCELADA: "border-border bg-secondary/50 text-muted-foreground",
  ESCALADA: "border-gym-warning/30 bg-gym-warning/10 text-gym-warning",
};

const STEP_STATUS_COLORS: Record<string, string> = {
  PENDENTE: "border-border bg-secondary/50 text-muted-foreground",
  EXECUTADO: "border-gym-teal/30 bg-gym-teal/10 text-gym-teal",
  PULADO: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  FALHA: "border-gym-danger/30 bg-gym-danger/10 text-gym-danger",
};

function formatDateTime(value?: string) {
  if (!value) return "—";
  return value.slice(0, 16).replace("T", " ");
}

export default function CrmCadenciasPage() {
  const { toast } = useToast();
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";

  const [loading, setLoading] = useState(true);
  const [cadencias, setCadencias] = useState<CrmCadencia[]>([]);
  const [executions, setExecutions] = useState<CrmCadenceExecution[]>([]);
  const [escalationRules, setEscalationRules] = useState<CrmEscalationRule[]>([]);
  const [statusFilter, setStatusFilter] = useState<"TODAS" | CrmCadenceExecutionStatus>("TODAS");
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [cadResult, execResult, rulesResult] = await Promise.allSettled([
        listCrmCadenciasApi({ tenantId }),
        listCrmCadenceExecutionsApi({ tenantId }),
        listCrmEscalationRulesApi({ tenantId }),
      ]);
      if (cadResult.status === "fulfilled") setCadencias(cadResult.value);
      if (execResult.status === "fulfilled") setExecutions(execResult.value);
      if (rulesResult.status === "fulfilled") setEscalationRules(rulesResult.value);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleToggleCadencia(cadencia: CrmCadencia) {
    try {
      await updateCrmCadenciaApi({
        tenantId,
        id: cadencia.id,
        data: { ativo: !cadencia.ativo },
      });
      toast({ title: cadencia.ativo ? "Cadência desativada" : "Cadência ativada" });
      void loadData();
    } catch (error) {
      toast({ title: "Erro", description: normalizeErrorMessage(error), variant: "destructive" });
    }
  }

  async function handleCancelExecution(executionId: string) {
    try {
      await cancelCrmCadenceExecutionApi({ tenantId, id: executionId });
      toast({ title: "Execução cancelada" });
      void loadData();
    } catch (error) {
      toast({ title: "Erro", description: normalizeErrorMessage(error), variant: "destructive" });
    }
  }

  async function handleProcessOverdue() {
    setProcessing(true);
    try {
      const result = await processOverdueCadenceTasksApi({ tenantId });
      toast({
        title: "Processamento concluído",
        description: `${result.processed} processadas, ${result.escalated} escaladas.`,
      });
      void loadData();
    } catch (error) {
      toast({ title: "Erro", description: normalizeErrorMessage(error), variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }

  const filteredExecutions =
    statusFilter === "TODAS"
      ? executions
      : executions.filter((e) => e.status === statusFilter);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-border bg-card">
        <div className="relative overflow-hidden border-b border-border px-6 py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,241,53,0.12),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(61,232,160,0.12),transparent_42%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                CRM Automação
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  Cadências
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Configure cadências automáticas, monitore execuções e gerencie
                  regras de escalação para o pipeline comercial.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-border"
                onClick={() => void loadData()}
                disabled={loading}
              >
                <RefreshCcw className="mr-2 size-4" />
                Atualizar
              </Button>
              <Button onClick={handleProcessOverdue} disabled={processing || loading}>
                {processing ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 size-4" />
                )}
                Processar vencidas
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b border-border px-6 py-5 md:grid-cols-4">
          <StatCard
            label="Cadências"
            value={loading ? "…" : String(cadencias.length)}
            helper="Total configuradas"
          />
          <StatCard
            label="Ativas"
            value={loading ? "…" : String(cadencias.filter((c) => c.ativo).length)}
            helper="Prontas para disparo"
          />
          <StatCard
            label="Execuções em andamento"
            value={
              loading
                ? "…"
                : String(executions.filter((e) => e.status === "EM_ANDAMENTO").length)
            }
            helper="Prospects com cadência ativa"
          />
          <StatCard
            label="Escalações"
            value={
              loading
                ? "…"
                : String(executions.filter((e) => e.status === "ESCALADA").length)
            }
            helper="Precisam de atenção"
          />
        </div>

        <div className="px-6 py-6">
          <Tabs defaultValue="cadencias" className="space-y-6">
            <TabsList className="grid h-auto grid-cols-3 gap-1 rounded-2xl bg-secondary/50 p-1">
              <TabsTrigger value="cadencias" className="rounded-xl">
                <Settings2 className="mr-2 size-4" />
                Cadências
              </TabsTrigger>
              <TabsTrigger value="execucoes" className="rounded-xl">
                <Play className="mr-2 size-4" />
                Execuções
              </TabsTrigger>
              <TabsTrigger value="escalacao" className="rounded-xl">
                <TrendingUp className="mr-2 size-4" />
                Escalação
              </TabsTrigger>
            </TabsList>

            {/* --- Tab Cadências --- */}
            <TabsContent value="cadencias" className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-2">
                {cadencias.map((cadencia) => (
                  <Card key={cadencia.id} className="border-border/80 bg-card/70">
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{cadencia.nome}</CardTitle>
                          <p className="text-sm text-muted-foreground">{cadencia.objetivo}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              cadencia.ativo
                                ? "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
                                : "border-border bg-secondary/50 text-muted-foreground"
                            }
                          >
                            {cadencia.ativo ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {CRM_CADENCIA_TRIGGER_LABEL[cadencia.gatilho]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getCrmStageName(cadencia.stageStatus)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {cadencia.passos.length} passo(s)
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {cadencia.passos.map((passo, index) => (
                          <div
                            key={passo.id}
                            className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/30 px-4 py-2.5"
                          >
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{passo.titulo}</p>
                              <p className="text-xs text-muted-foreground">
                                {CRM_CADENCIA_ACTION_LABEL[passo.acao]} · D+{passo.delayDias}
                                {passo.automatica ? " · Automático" : " · Manual"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">
                          Última execução: {formatDateTime(cadencia.ultimaExecucao)}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleToggleCadencia(cadencia)}
                        >
                          {cadencia.ativo ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {!loading && cadencias.length === 0 && (
                <div className="rounded-2xl border border-border bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma cadência configurada. Crie cadências no CRM para automatizar o pipeline.
                </div>
              )}
            </TabsContent>

            {/* --- Tab Execuções --- */}
            <TabsContent value="execucoes" className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="w-full max-w-xs space-y-2">
                  <Label>Filtrar por status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">Todas</SelectItem>
                      <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                      <SelectItem value="CONCLUIDA">Concluídas</SelectItem>
                      <SelectItem value="ESCALADA">Escaladas</SelectItem>
                      <SelectItem value="CANCELADA">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredExecutions.map((exec) => (
                  <Card key={exec.id} className="border-border/80 bg-card/70">
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{exec.cadenciaNome}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Prospect: <span className="font-medium text-foreground">{exec.prospectNome}</span>
                            {" · "}
                            {getCrmStageName(exec.stageStatus)}
                          </p>
                        </div>
                        <Badge className={EXECUTION_STATUS_COLORS[exec.status]}>
                          {exec.status === "EM_ANDAMENTO" && <Clock className="mr-1 size-3" />}
                          {exec.status === "CONCLUIDA" && <CheckCircle2 className="mr-1 size-3" />}
                          {exec.status === "ESCALADA" && <AlertTriangle className="mr-1 size-3" />}
                          {exec.status === "CANCELADA" && <XCircle className="mr-1 size-3" />}
                          {CRM_CADENCE_EXECUTION_STATUS_LABEL[exec.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="overflow-hidden rounded-xl border border-border">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border bg-secondary/40">
                              <TableHead className="w-10">#</TableHead>
                              <TableHead>Passo</TableHead>
                              <TableHead>Ação</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Agendado</TableHead>
                              <TableHead>Executado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {exec.passos.map((passo, index) => (
                              <TableRow key={passo.id} className="border-border">
                                <TableCell className="text-xs text-muted-foreground">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  {passo.stepTitulo}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {CRM_CADENCIA_ACTION_LABEL[passo.acao]}
                                </TableCell>
                                <TableCell>
                                  <Badge className={STEP_STATUS_COLORS[passo.status] ?? ""}>
                                    {CRM_CADENCE_STEP_STATUS_LABEL[passo.status]}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {formatDateTime(passo.agendadoPara)}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {formatDateTime(passo.executadoEm)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Início: {formatDateTime(exec.iniciadoEm)}</span>
                          {exec.concluidoEm && (
                            <span>Concluído: {formatDateTime(exec.concluidoEm)}</span>
                          )}
                          {exec.escaladoEm && (
                            <span className="text-gym-warning">
                              Escalado: {formatDateTime(exec.escaladoEm)}
                              {exec.escalacaoMotivo && ` — ${exec.escalacaoMotivo}`}
                            </span>
                          )}
                        </div>
                        {exec.status === "EM_ANDAMENTO" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gym-danger hover:text-gym-danger"
                            onClick={() => void handleCancelExecution(exec.id)}
                          >
                            <XCircle className="mr-1 size-3.5" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {!loading && filteredExecutions.length === 0 && (
                <div className="rounded-2xl border border-border bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma execução encontrada com o filtro selecionado.
                </div>
              )}
            </TabsContent>

            {/* --- Tab Escalação --- */}
            <TabsContent value="escalacao" className="space-y-4">
              <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                <p className="text-sm font-medium text-foreground">Regras de escalação</p>
                <p className="text-sm text-muted-foreground">
                  Definem o que acontece quando uma tarefa de cadência vence sem ação ou
                  o prospect fica sem resposta após o ciclo completo.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-secondary/40">
                      <TableHead>Regra</TableHead>
                      <TableHead>Condição</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {escalationRules.map((rule) => (
                      <TableRow key={rule.id} className="border-border">
                        <TableCell className="font-medium">{rule.nome}</TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline" className="text-xs">
                            {rule.condicao === "TAREFA_VENCIDA" && "Tarefa vencida"}
                            {rule.condicao === "SEM_RESPOSTA_APOS_CADENCIA" && "Sem resposta após cadência"}
                            {rule.condicao === "SLA_EXCEDIDO" && "SLA excedido"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {CRM_ESCALATION_ACTION_LABEL[rule.acao]}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              rule.ativo
                                ? "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
                                : "border-border bg-secondary/50 text-muted-foreground"
                            }
                          >
                            {rule.ativo ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && escalationRules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                          Nenhuma regra de escalação configurada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-bold leading-none text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}
