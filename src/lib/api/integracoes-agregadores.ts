/**
 * Integrações com agregadores externos (Wellhub/GymPass, TotalPass).
 * Endpoint base: /api/v1/integracoes/agregadores/{tipo}/*
 *
 * Task #547: publica aulas/slots, valida credenciais e reprocessa webhooks
 * falhos. Consome AgregadoresController do backend Java.
 */
import { apiRequest } from "./http";

export type AgregadorTipo = "WELLHUB" | "GYMPASS" | "TOTALPASS";

export type AgregadorResultStatus = "APROVADO" | "NEGADO" | "ERRO" | "PENDENTE";

export interface AgregadorResult {
  status: AgregadorResultStatus;
  codigo?: string;
  mensagem?: string;
  detalhes?: Record<string, unknown>;
}

/**
 * Valida acesso de um usuário externo no agregador (fluxo catraca/app).
 * POST /api/v1/integracoes/agregadores/{tipo}/validate
 */
export async function validarAcessoAgregadorApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
  externalUserId: string;
  externalGymId?: string;
  trigger?: string;
  customCode?: string;
  atributos?: Record<string, string>;
}): Promise<AgregadorResult> {
  return apiRequest<AgregadorResult>({
    path: `/api/v1/integracoes/agregadores/${input.tipo}/validate`,
    method: "POST",
    body: {
      tenantId: input.tenantId,
      externalUserId: input.externalUserId,
      externalGymId: input.externalGymId,
      trigger: input.trigger,
      customCode: input.customCode,
      atributos: input.atributos,
    },
  });
}

/**
 * Publica uma aula (atividade grade) no Booking API do agregador.
 * POST /api/v1/integracoes/agregadores/{tipo}/booking/classes/publicar
 */
export async function publicarClasseBookingApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
  atividadeGradeId: string;
}): Promise<AgregadorResult> {
  return apiRequest<AgregadorResult>({
    path: `/api/v1/integracoes/agregadores/${input.tipo}/booking/classes/publicar`,
    method: "POST",
    body: {
      tenantId: input.tenantId,
      atividadeGradeId: input.atividadeGradeId,
    },
  });
}

/**
 * Publica slots de horário no Booking API do agregador.
 * POST /api/v1/integracoes/agregadores/{tipo}/booking/slots/publicar
 */
export async function publicarSlotsBookingApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
  atividadeGradeId: string;
  dataInicio: string;
  dataFim: string;
}): Promise<AgregadorResult> {
  return apiRequest<AgregadorResult>({
    path: `/api/v1/integracoes/agregadores/${input.tipo}/booking/slots/publicar`,
    method: "POST",
    body: {
      tenantId: input.tenantId,
      atividadeGradeId: input.atividadeGradeId,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
    },
  });
}

/**
 * Reprocessa webhook previamente persistido do agregador.
 * POST /api/v1/integracoes/agregadores/{tipo}/webhooks/{eventId}/reprocessar
 */
export async function reprocessarWebhookAgregadorApi(input: {
  tipo: AgregadorTipo;
  eventId: string;
  tenantId: string;
}): Promise<AgregadorResult> {
  return apiRequest<AgregadorResult>({
    path: `/api/v1/integracoes/agregadores/${input.tipo}/webhooks/${input.eventId}/reprocessar`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

/**
 * Consulta status/habilitação do agregador para o tenant.
 * GET /api/v1/integracoes/agregadores/{tipo}/status
 */
export async function getStatusAgregadorApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
}): Promise<AgregadorResult> {
  return apiRequest<AgregadorResult>({
    path: `/api/v1/integracoes/agregadores/${input.tipo}/status`,
    query: { tenantId: input.tenantId },
  });
}
