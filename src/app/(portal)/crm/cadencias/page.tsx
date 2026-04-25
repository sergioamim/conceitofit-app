"use client";

import {
  Loader2,
  Play,
  Plus,
  RefreshCcw,
  Settings2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  deleteCrmCadenciaApi,
  listCrmCadenciasApi,
  updateCrmCadenciaApi,
} from "@/lib/api/crm";
import { ApiRequestError } from "@/lib/api/http";
import {
  listCrmCadenceExecutionsApi,
  listCrmEscalationRulesApi,
  cancelCrmCadenceExecutionApi,
  deleteCrmEscalationRuleApi,
  processOverdueCadenceTasksApi,
} from "@/lib/api/crm-cadencias";
import { CadenciaEditorDrawer } from "./cadencia-editor-drawer";
import { CadenciasListTab } from "./cadencias-list-tab";
import {
  ExecucoesListTab,
  type ExecucoesStatusFilter,
} from "./execucoes-list-tab";
import { EscalationListTab } from "./escalation-list-tab";
import { EscalationRuleEditorModal } from "./escalation-rule-editor-modal";
import { TriggerCadenciaModal } from "./trigger-cadencia-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import type {
  CrmCadencia,
  CrmCadenceExecution,
  CrmEscalationRule,
} from "@/lib/types";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type ActiveTab = "cadencias" | "execucoes" | "escalacao";

export default function CrmCadenciasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";

  const [loading, setLoading] = useState(true);
  const [cadencias, setCadencias] = useState<CrmCadencia[]>([]);
  const [executions, setExecutions] = useState<CrmCadenceExecution[]>([]);
  const [escalationRules, setEscalationRules] = useState<CrmEscalationRule[]>([]);
  const [statusFilter, setStatusFilter] = useState<ExecucoesStatusFilter>("TODAS");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("cadencias");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCadencia, setEditingCadencia] = useState<CrmCadencia | null>(null);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [triggerCadencia, setTriggerCadencia] = useState<CrmCadencia | null>(null);
  const [escalationEditorOpen, setEscalationEditorOpen] = useState(false);
  const [editingEscalation, setEditingEscalation] =
    useState<CrmEscalationRule | null>(null);
  const [deletingEscalation, setDeletingEscalation] =
    useState<CrmEscalationRule | null>(null);
  const [deletingEscalationLoading, setDeletingEscalationLoading] = useState(false);

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
      toast({
        title: "Erro",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    }
  }

  async function handleDeleteCadencia(cadencia: CrmCadencia) {
    try {
      await deleteCrmCadenciaApi({ tenantId, id: cadencia.id });
      toast({ title: "Cadência deletada" });
      void queryClient.invalidateQueries({
        queryKey: ["crm", "cadencias", tenantId],
      });
      void loadData();
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        toast({
          title: "Não foi possível deletar",
          description:
            "Há execuções em andamento. Desative a cadência primeiro (toggle Ativar/Desativar).",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Erro ao deletar",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    }
  }

  async function handleCancelExecution(executionId: string) {
    try {
      await cancelCrmCadenceExecutionApi({ tenantId, id: executionId });
      toast({ title: "Execução cancelada" });
      void loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    }
  }

  function handleOpenCreate() {
    setEditingCadencia(null);
    setEditorOpen(true);
  }

  function handleOpenEdit(cadencia: CrmCadencia) {
    setEditingCadencia(cadencia);
    setEditorOpen(true);
  }

  function handleOpenTrigger(cadencia: CrmCadencia) {
    setTriggerCadencia(cadencia);
    setTriggerOpen(true);
  }

  function handleOpenCreateEscalation() {
    setEditingEscalation(null);
    setEscalationEditorOpen(true);
  }

  function handleOpenEditEscalation(rule: CrmEscalationRule) {
    setEditingEscalation(rule);
    setEscalationEditorOpen(true);
  }

  async function handleConfirmDeleteEscalation() {
    if (!deletingEscalation) return;
    setDeletingEscalationLoading(true);
    try {
      await deleteCrmEscalationRuleApi({
        tenantId,
        id: deletingEscalation.id,
      });
      toast({ title: "Regra removida" });
      setDeletingEscalation(null);
      void loadData();
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setDeletingEscalationLoading(false);
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
      toast({
        title: "Erro",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }

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
              <Button
                onClick={handleOpenCreate}
                className="bg-gym-accent text-black hover:bg-gym-accent/90"
              >
                <Plus className="mr-2 size-4" />
                Nova cadência
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
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ActiveTab)}
            className="space-y-6"
          >
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

            <TabsContent value="cadencias" className="space-y-4">
              <CadenciasListTab
                cadencias={cadencias}
                loading={loading}
                onEdit={handleOpenEdit}
                onTrigger={handleOpenTrigger}
                onToggle={(c) => void handleToggleCadencia(c)}
                onDelete={(c) => void handleDeleteCadencia(c)}
              />
            </TabsContent>

            <TabsContent value="execucoes" className="space-y-4">
              <ExecucoesListTab
                executions={executions}
                loading={loading}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onCancel={(id) => void handleCancelExecution(id)}
              />
            </TabsContent>

            <TabsContent value="escalacao" className="space-y-4">
              <EscalationListTab
                cadencias={cadencias}
                escalationRules={escalationRules}
                loading={loading}
                onCreate={handleOpenCreateEscalation}
                onEdit={handleOpenEditEscalation}
                onRequestDelete={setDeletingEscalation}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <CadenciaEditorDrawer
        open={editorOpen}
        tenantId={tenantId}
        cadencia={editingCadencia}
        onOpenChange={setEditorOpen}
        onSaved={() => void loadData()}
      />

      <TriggerCadenciaModal
        open={triggerOpen}
        tenantId={tenantId}
        cadencia={triggerCadencia}
        onOpenChange={setTriggerOpen}
        onTriggered={() => {
          setActiveTab("execucoes");
          void loadData();
        }}
      />

      <EscalationRuleEditorModal
        open={escalationEditorOpen}
        tenantId={tenantId}
        cadencias={cadencias}
        rule={editingEscalation}
        onOpenChange={setEscalationEditorOpen}
        onSaved={() => void loadData()}
      />

      <AlertDialog
        open={Boolean(deletingEscalation)}
        onOpenChange={(next) => {
          if (deletingEscalationLoading) return;
          if (!next) setDeletingEscalation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover regra de escalação?</AlertDialogTitle>
            <AlertDialogDescription>
              A regra <span className="font-semibold">{deletingEscalation?.nome}</span>{" "}
              será removida permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingEscalationLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDeleteEscalation();
              }}
              disabled={deletingEscalationLoading}
            >
              {deletingEscalationLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
