"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { CadenciaEditorDrawer } from "./cadencia-editor-drawer";
import {
  CadenciasShell,
  type CadenciasActiveTab,
} from "./cadencias-shell";
import { EscalationRuleEditorModal } from "./escalation-rule-editor-modal";
import { TriggerCadenciaModal } from "./trigger-cadencia-modal";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import type { CrmCadencia, CrmEscalationRule } from "@/lib/types";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { useCrmCadenciasWorkspace } from "./use-crm-cadencias-workspace";

export default function CrmCadenciasPage() {
  const { toast } = useToast();
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";

  const {
    cadencias,
    executions,
    escalationRules,
    loading,
    processing,
    statusFilter,
    setStatusFilter,
    loadData,
    handleToggleCadencia,
    handleDeleteCadencia,
    handleCancelExecution,
    handleDeleteEscalation,
    handleProcessOverdue,
  } = useCrmCadenciasWorkspace(tenantId);

  const [activeTab, setActiveTab] = useState<CadenciasActiveTab>("cadencias");
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
      await handleDeleteEscalation(deletingEscalation.id);
      toast({ title: "Regra removida" });
      setDeletingEscalation(null);
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

  return (
    <div className="space-y-6">
      <CadenciasShell
        cadencias={cadencias}
        executions={executions}
        escalationRules={escalationRules}
        loading={loading}
        processing={processing}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        onRefresh={() => void loadData()}
        onProcessOverdue={handleProcessOverdue}
        onCreateCadencia={handleOpenCreate}
        onEditCadencia={handleOpenEdit}
        onTriggerCadencia={handleOpenTrigger}
        onToggleCadencia={(c) => void handleToggleCadencia(c)}
        onDeleteCadencia={(c) => void handleDeleteCadencia(c)}
        onCancelExecution={(id) => void handleCancelExecution(id)}
        onCreateEscalation={handleOpenCreateEscalation}
        onEditEscalation={handleOpenEditEscalation}
        onRequestDeleteEscalation={setDeletingEscalation}
      />

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
