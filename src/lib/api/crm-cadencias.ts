/**
 * ⚠️ MÓDULO FANTASMA CONSCIENTE — CRM cadências (execuções, escalation, trigger)
 *
 * Todos os endpoints `/api/v1/crm/cadencias/*` **ainda não existem no backend
 * Java** em 2026-04-10. Este arquivo **já foi projetado** para tolerar a
 * ausência: cada chamada está envolta em `mapUnavailableCapability` que
 * converte 404/405/501 em mensagem amigável ("Backend ainda não expõe ...
 * neste ambiente"). Graceful degradation já é o default.
 *
 * Status formalizado em ADR-001: **manter sem alterações** — o tratamento de
 * indisponibilidade já está adequado. Task #545 (CRM cadências - low) espera
 * o BE e está com `depends_on=#551` no task-master.
 *
 * A tela `/crm/cadencias` pode ser escondida proativamente via flag
 * `NEXT_PUBLIC_CRM_CADENCIAS_ENABLED` se preferir UX de "em preparação"
 * em vez de mostrar a mensagem de erro amigável.
 *
 * @see docs/adr/ADR-001-modulos-fe-fantasma.md
 * @see docs/API_AUDIT_BACKEND_VS_FRONTEND.md seção A (P0)
 */
import type {
  CrmCadenceExecution,
  CrmCadenceExecutionStatus,
  CrmEscalationRule,
} from "@/lib/types";
import { ApiRequestError, apiRequest } from "./http";

type GenericListResponse<T> =
  | T[]
  | { items?: T[]; content?: T[]; data?: T[] };

function extractListItems<T>(response: GenericListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.content ?? response.data ?? [];
}

function mapUnavailableCapability(error: unknown, message: string): never {
  if (error instanceof ApiRequestError && [404, 405, 501].includes(error.status)) {
    throw new Error(message);
  }
  throw error;
}

// --- Execuções de cadências ---

export async function listCrmCadenceExecutionsApi(input: {
  tenantId: string;
  status?: CrmCadenceExecutionStatus;
  cadenciaId?: string;
  prospectId?: string;
}): Promise<CrmCadenceExecution[]> {
  try {
    const response = await apiRequest<GenericListResponse<CrmCadenceExecution>>({
      path: "/api/v1/crm/cadencias/execucoes",
      query: {
        tenantId: input.tenantId,
        status: input.status,
        cadenciaId: input.cadenciaId,
        prospectId: input.prospectId,
      },
    });
    return extractListItems(response);
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe execuções de cadências CRM neste ambiente.");
  }
}

async function getCrmCadenceExecutionApi(input: {
  tenantId: string;
  id: string;
}): Promise<CrmCadenceExecution> {
  try {
    return await apiRequest<CrmCadenceExecution>({
      path: `/api/v1/crm/cadencias/execucoes/${input.id}`,
      query: { tenantId: input.tenantId },
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe detalhes de execução de cadência CRM neste ambiente.");
  }
}

export async function triggerCrmCadenceApi(input: {
  tenantId: string;
  cadenciaId: string;
  prospectId: string;
}): Promise<CrmCadenceExecution> {
  try {
    return await apiRequest<CrmCadenceExecution>({
      path: "/api/v1/crm/cadencias/trigger",
      method: "POST",
      query: { tenantId: input.tenantId },
      body: {
        cadenciaId: input.cadenciaId,
        prospectId: input.prospectId,
      },
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe trigger de cadências CRM neste ambiente.");
  }
}

export async function cancelCrmCadenceExecutionApi(input: {
  tenantId: string;
  id: string;
}): Promise<CrmCadenceExecution> {
  try {
    return await apiRequest<CrmCadenceExecution>({
      path: `/api/v1/crm/cadencias/execucoes/${input.id}/cancelar`,
      method: "POST",
      query: { tenantId: input.tenantId },
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe cancelamento de execução de cadência CRM neste ambiente.");
  }
}

// --- Regras de escalação ---

export async function listCrmEscalationRulesApi(input: {
  tenantId: string;
  cadenciaId?: string;
}): Promise<CrmEscalationRule[]> {
  try {
    const response = await apiRequest<GenericListResponse<CrmEscalationRule>>({
      path: "/api/v1/crm/cadencias/escalation-rules",
      query: {
        tenantId: input.tenantId,
        cadenciaId: input.cadenciaId,
      },
    });
    return extractListItems(response);
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe regras de escalação CRM neste ambiente.");
  }
}

async function createCrmEscalationRuleApi(input: {
  tenantId: string;
  data: Omit<CrmEscalationRule, "id" | "tenantId">;
}): Promise<CrmEscalationRule> {
  try {
    return await apiRequest<CrmEscalationRule>({
      path: "/api/v1/crm/cadencias/escalation-rules",
      method: "POST",
      query: { tenantId: input.tenantId },
      body: input.data,
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe criação de regras de escalação CRM neste ambiente.");
  }
}

async function updateCrmEscalationRuleApi(input: {
  tenantId: string;
  id: string;
  data: Partial<Omit<CrmEscalationRule, "id" | "tenantId">>;
}): Promise<CrmEscalationRule> {
  try {
    return await apiRequest<CrmEscalationRule>({
      path: `/api/v1/crm/cadencias/escalation-rules/${input.id}`,
      method: "PUT",
      query: { tenantId: input.tenantId },
      body: input.data,
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe atualização de regras de escalação CRM neste ambiente.");
  }
}

async function deleteCrmEscalationRuleApi(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  try {
    await apiRequest<void>({
      path: `/api/v1/crm/cadencias/escalation-rules/${input.id}`,
      method: "DELETE",
      query: { tenantId: input.tenantId },
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe remoção de regras de escalação CRM neste ambiente.");
  }
}

// --- Processamento de cadências (scheduler) ---

export async function processOverdueCadenceTasksApi(input: {
  tenantId: string;
}): Promise<{ processed: number; escalated: number }> {
  try {
    return await apiRequest<{ processed: number; escalated: number }>({
      path: "/api/v1/crm/cadencias/process-overdue",
      method: "POST",
      query: { tenantId: input.tenantId },
    });
  } catch (error) {
    mapUnavailableCapability(error, "Backend ainda não expõe processamento de cadências vencidas CRM neste ambiente.");
  }
}
