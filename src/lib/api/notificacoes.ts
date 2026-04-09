import { apiRequest } from "./http";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificacaoOutbox {
  id: string;
  canal: "EMAIL" | "PUSH" | "SMS" | "WHATSAPP";
  destinatario: string;
  status: string;
  tentativas: number;
  ultimoErro: string | null;
  enviadoEm: string | null;
  proximaTentativaEm: string | null;
}

export interface NotificacaoEvento {
  id: string;
  pessoaId: string;
  evento: string;
  origem: string;
  referenciaId: string;
  status: string;
  createdAt: string;
  processadoEm: string | null;
  outbox: NotificacaoOutbox[];
}

export interface NotificacaoPreferencia {
  id: string;
  tenantId: string;
  pessoaId: string;
  evento: string;
  canal: "EMAIL" | "PUSH" | "SMS" | "WHATSAPP";
  habilitado: boolean;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Canal helpers
// ---------------------------------------------------------------------------

export type CanalNotificacao = NotificacaoPreferencia["canal"];

export const CANAIS_NOTIFICACAO: CanalNotificacao[] = ["EMAIL", "PUSH", "SMS", "WHATSAPP"];

export const CANAL_LABEL: Record<CanalNotificacao, string> = {
  EMAIL: "E-mail",
  PUSH: "Push",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
};

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** GET /api/v1/notificacoes/eventos */
export async function listNotificacaoEventosApi(input: {
  tenantId: string;
  alunoId?: string;
}): Promise<NotificacaoEvento[]> {
  return apiRequest<NotificacaoEvento[]>({
    path: "/api/v1/notificacoes/eventos",
    query: {
      tenantId: input.tenantId,
      alunoId: input.alunoId,
    },
  });
}

/** GET /api/v1/notificacoes/preferencias */
export async function listNotificacaoPreferenciasApi(input: {
  tenantId: string;
  alunoId: string;
}): Promise<NotificacaoPreferencia[]> {
  return apiRequest<NotificacaoPreferencia[]>({
    path: "/api/v1/notificacoes/preferencias",
    query: {
      tenantId: input.tenantId,
      alunoId: input.alunoId,
    },
  });
}

/** PUT /api/v1/notificacoes/preferencias */
export async function updateNotificacaoPreferenciaApi(input: {
  tenantId: string;
  alunoId: string;
  evento: string;
  canal: string;
  habilitado: boolean;
}): Promise<NotificacaoPreferencia> {
  return apiRequest<NotificacaoPreferencia>({
    path: "/api/v1/notificacoes/preferencias",
    method: "PUT",
    body: {
      tenantId: input.tenantId,
      alunoId: input.alunoId,
      evento: input.evento,
      canal: input.canal,
      habilitado: input.habilitado,
    },
  });
}

/** POST /api/v1/notificacoes/outbox/{outboxId}/reenviar */
export async function reenviarNotificacaoApi(input: {
  outboxId: string;
  tenantId: string;
}): Promise<NotificacaoOutbox> {
  return apiRequest<NotificacaoOutbox>({
    path: `/api/v1/notificacoes/outbox/${input.outboxId}/reenviar`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}
