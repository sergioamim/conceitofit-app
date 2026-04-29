"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  deleteCrmCadenciaApi,
  listCrmCadenciasApi,
  updateCrmCadenciaApi,
} from "@/lib/api/crm";
import { ApiRequestError } from "@/lib/api/http";
import {
  cancelCrmCadenceExecutionApi,
  deleteCrmEscalationRuleApi,
  listCrmCadenceExecutionsApi,
  listCrmEscalationRulesApi,
  processOverdueCadenceTasksApi,
} from "@/lib/api/crm-cadencias";
import type {
  CrmCadencia,
  CrmCadenceExecution,
  CrmEscalationRule,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { ExecucoesStatusFilter } from "./execucoes-list-tab";

export type UseCrmCadenciasWorkspace = ReturnType<
  typeof useCrmCadenciasWorkspace
>;

export function useCrmCadenciasWorkspace(tenantId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cadencias, setCadencias] = useState<CrmCadencia[]>([]);
  const [executions, setExecutions] = useState<CrmCadenceExecution[]>([]);
  const [escalationRules, setEscalationRules] = useState<CrmEscalationRule[]>([]);
  const [statusFilter, setStatusFilter] =
    useState<ExecucoesStatusFilter>("TODAS");

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

  const handleToggleCadencia = useCallback(
    async (cadencia: CrmCadencia) => {
      try {
        await updateCrmCadenciaApi({
          tenantId,
          id: cadencia.id,
          data: {
            nome: cadencia.nome,
            objetivo: cadencia.objetivo,
            stageStatus: cadencia.stageStatus,
            gatilho: cadencia.gatilho,
            ativo: !cadencia.ativo,
            passos: cadencia.passos.map((passo) => ({
              id: passo.id,
              titulo: passo.titulo,
              acao: passo.acao,
              delayDias: passo.delayDias,
              template: passo.template,
              automatica: passo.automatica,
            })),
          },
        });
        toast({
          title: cadencia.ativo ? "Cadência desativada" : "Cadência ativada",
        });
        void loadData();
      } catch (error) {
        toast({
          title: "Erro",
          description: normalizeErrorMessage(error),
          variant: "destructive",
        });
      }
    },
    [tenantId, toast, loadData]
  );

  const handleDeleteCadencia = useCallback(
    async (cadencia: CrmCadencia) => {
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
    },
    [tenantId, toast, queryClient, loadData]
  );

  const handleCancelExecution = useCallback(
    async (executionId: string) => {
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
    },
    [tenantId, toast, loadData]
  );

  const handleDeleteEscalation = useCallback(
    async (ruleId: string) => {
      await deleteCrmEscalationRuleApi({ tenantId, id: ruleId });
      void loadData();
    },
    [tenantId, loadData]
  );

  const handleProcessOverdue = useCallback(async () => {
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
  }, [tenantId, toast, loadData]);

  return {
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
  };
}
