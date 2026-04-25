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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CadenciasListTab } from "./cadencias-list-tab";
import {
  ExecucoesListTab,
  type ExecucoesStatusFilter,
} from "./execucoes-list-tab";
import { EscalationListTab } from "./escalation-list-tab";
import type {
  CrmCadencia,
  CrmCadenceExecution,
  CrmEscalationRule,
} from "@/lib/types";

export type CadenciasActiveTab = "cadencias" | "execucoes" | "escalacao";

type CadenciasShellProps = {
  cadencias: CrmCadencia[];
  executions: CrmCadenceExecution[];
  escalationRules: CrmEscalationRule[];
  loading: boolean;
  processing: boolean;
  statusFilter: ExecucoesStatusFilter;
  onStatusFilterChange: (next: ExecucoesStatusFilter) => void;
  activeTab: CadenciasActiveTab;
  onActiveTabChange: (next: CadenciasActiveTab) => void;
  onRefresh: () => void;
  onProcessOverdue: () => void;
  onCreateCadencia: () => void;
  onEditCadencia: (cadencia: CrmCadencia) => void;
  onTriggerCadencia: (cadencia: CrmCadencia) => void;
  onToggleCadencia: (cadencia: CrmCadencia) => void;
  onCancelExecution: (executionId: string) => void;
  onCreateEscalation: () => void;
  onEditEscalation: (rule: CrmEscalationRule) => void;
  onRequestDeleteEscalation: (rule: CrmEscalationRule) => void;
};

export function CadenciasShell({
  cadencias,
  executions,
  escalationRules,
  loading,
  processing,
  statusFilter,
  onStatusFilterChange,
  activeTab,
  onActiveTabChange,
  onRefresh,
  onProcessOverdue,
  onCreateCadencia,
  onEditCadencia,
  onTriggerCadencia,
  onToggleCadencia,
  onCancelExecution,
  onCreateEscalation,
  onEditEscalation,
  onRequestDeleteEscalation,
}: CadenciasShellProps) {
  return (
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
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCcw className="mr-2 size-4" />
              Atualizar
            </Button>
            <Button onClick={onProcessOverdue} disabled={processing || loading}>
              {processing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Zap className="mr-2 size-4" />
              )}
              Processar vencidas
            </Button>
            <Button
              onClick={onCreateCadencia}
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
          onValueChange={(v) => onActiveTabChange(v as CadenciasActiveTab)}
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
              onEdit={onEditCadencia}
              onTrigger={onTriggerCadencia}
              onToggle={onToggleCadencia}
            />
          </TabsContent>

          <TabsContent value="execucoes" className="space-y-4">
            <ExecucoesListTab
              executions={executions}
              loading={loading}
              statusFilter={statusFilter}
              onStatusFilterChange={onStatusFilterChange}
              onCancel={onCancelExecution}
            />
          </TabsContent>

          <TabsContent value="escalacao" className="space-y-4">
            <EscalationListTab
              cadencias={cadencias}
              escalationRules={escalationRules}
              loading={loading}
              onCreate={onCreateEscalation}
              onEdit={onEditEscalation}
              onRequestDelete={onRequestDeleteEscalation}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
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
