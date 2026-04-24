import { apiRequest } from "./http";
import type {
  EmitirNotificacaoPayload,
  EmitirNotificacaoResponse,
  HistoricoNotificacoesResponse,
  NotificacaoAudienceTipo,
  NotificacaoInboxContadores,
  NotificacaoInboxListResponse,
} from "@/lib/shared/types/notificacao-inbox";

// ---------------------------------------------------------------------------
// API functions — /api/v1/notificacoes/inbox
// ---------------------------------------------------------------------------

/** GET /api/v1/notificacoes/inbox */
export async function listInboxApi(input: {
  tenantId: string;
  limit?: number;
  cursor?: string | null;
  apenasNaoLidas?: boolean;
}): Promise<NotificacaoInboxListResponse> {
  return apiRequest<NotificacaoInboxListResponse>({
    path: "/api/v1/notificacoes/inbox",
    query: {
      tenantId: input.tenantId,
      limit: input.limit,
      cursor: input.cursor ?? undefined,
      apenasNaoLidas: input.apenasNaoLidas,
    },
  });
}

/** POST /api/v1/notificacoes/inbox/{id}/marcar-lida */
export async function marcarLidaApi(input: {
  notificacaoId: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/notificacoes/inbox/${input.notificacaoId}/marcar-lida`,
    method: "POST",
  });
}

/** POST /api/v1/notificacoes/inbox/{id}/acao */
export async function registrarAcaoApi(input: {
  notificacaoId: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/notificacoes/inbox/${input.notificacaoId}/acao`,
    method: "POST",
  });
}

/** POST /api/v1/notificacoes/inbox/marcar-todas-lidas */
export async function marcarTodasLidasApi(input: {
  tenantId: string;
}): Promise<{ atualizadas: number }> {
  return apiRequest<{ atualizadas: number }>({
    path: "/api/v1/notificacoes/inbox/marcar-todas-lidas",
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

/** GET /api/v1/notificacoes/inbox/contadores */
export async function getContadoresApi(input: {
  tenantId: string;
}): Promise<NotificacaoInboxContadores> {
  return apiRequest<NotificacaoInboxContadores>({
    path: "/api/v1/notificacoes/inbox/contadores",
    query: { tenantId: input.tenantId },
  });
}

// ---------------------------------------------------------------------------
// Admin (Wave 5) — /api/v1/notificacoes/admin/*
// ---------------------------------------------------------------------------

/** POST /api/v1/notificacoes/admin/emitir — autorizado a PLATAFORMA. */
export async function emitirNotificacaoApi(
  payload: EmitirNotificacaoPayload,
): Promise<EmitirNotificacaoResponse> {
  return apiRequest<EmitirNotificacaoResponse>({
    path: "/api/v1/notificacoes/admin/emitir",
    method: "POST",
    body: payload,
  });
}

/** GET /api/v1/notificacoes/admin/historico — lista paginada de emissões. */
export async function listHistoricoNotificacoesApi(input: {
  limit?: number;
  cursor?: string | null;
  audienceTipo?: NotificacaoAudienceTipo;
}): Promise<HistoricoNotificacoesResponse> {
  return apiRequest<HistoricoNotificacoesResponse>({
    path: "/api/v1/notificacoes/admin/historico",
    query: {
      limit: input.limit,
      cursor: input.cursor ?? undefined,
      audienceTipo: input.audienceTipo,
    },
  });
}
