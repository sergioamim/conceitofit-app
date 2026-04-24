/**
 * Tipos do inbox de notificações globais (Epic 4 — Wave 4).
 *
 * Schema espelha `NotificacaoInboxEntity` do BE
 * (academia-java/modulo-notificacoes/.../domain).
 */

export type NotificacaoSeveridade = "INFO" | "AVISO" | "URGENTE";

export interface NotificacaoInboxItem {
  id: string;
  eventoId: string;
  tenantId: string | null;
  redeId: string | null;
  /** BIGINT do BE — número, não string. */
  userId: number;
  titulo: string;
  mensagem: string;
  severidade: NotificacaoSeveridade;
  acaoUrl: string | null;
  acaoLabel: string | null;
  requerAcao: boolean;
  /** LocalDateTime ISO. */
  criadaEm: string;
  expiraEm: string;
  lidaEm: string | null;
  acaoExecutadaEm: string | null;
}

export interface NotificacaoInboxListResponse {
  items: NotificacaoInboxItem[];
  nextCursor: string | null;
  totalNaoLidas: number;
}

export interface NotificacaoInboxContadores {
  naoLidas: number;
  urgentesNaoLidas: number;
}

// ---------------------------------------------------------------------------
// Epic 4 — Wave 5: Admin SaaS (emissão manual + histórico)
// ---------------------------------------------------------------------------

export type NotificacaoAudienceTipo =
  | "GLOBAL"
  | "REDE"
  | "TENANT"
  | "ROLE"
  | "USUARIO";

export type NotificacaoRoleAudience =
  | "ADMIN"
  | "SUPER_ADMIN"
  | "GERENTE"
  | "FINANCEIRO"
  | "INSTRUTOR"
  | "RECEPCAO"
  | "CUSTOMER"
  | "VIEWER";

export interface EmitirNotificacaoPayload {
  titulo: string;
  mensagem: string;
  severidade: NotificacaoSeveridade;
  audienceTipo: NotificacaoAudienceTipo;
  redeId?: string;
  tenantId?: string;
  role?: NotificacaoRoleAudience;
  /** BIGINT do BE — mapeia para userId numérico. */
  userId?: number;
  acaoUrl?: string;
  acaoLabel?: string;
  requerAcao?: boolean;
  ttlDias?: number;
}

export interface EmitirNotificacaoResponse {
  eventoId: string;
}

export interface HistoricoNotificacaoItem {
  eventoId: string;
  /** Tipo do evento ex.: "GLOBAL_AVISO_SISTEMA". */
  evento: string;
  titulo: string;
  mensagem: string;
  severidade: NotificacaoSeveridade;
  audienceTipo: NotificacaoAudienceTipo;
  /** LocalDateTime ISO. */
  criadoEm: string;
  emitidoPorEmail: string | null;
  destinatariosAtingidos: number;
}

export interface HistoricoNotificacoesResponse {
  items: HistoricoNotificacaoItem[];
  nextCursor: string | null;
}
