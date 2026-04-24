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
