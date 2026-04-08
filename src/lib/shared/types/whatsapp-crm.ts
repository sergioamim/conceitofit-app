// ============================================================
// WhatsApp CRM — Tipos TypeScript (Atendimento)
// Mapeados do OpenAPI: openapi-atendimento-whatsapp.yaml
// ============================================================

import type { UUID, LocalDateTime } from "./comum";

// ── Enums ────────────────────────────────────────────────────

export type ConversationStatus =
  | "ABERTA"
  | "PENDENTE"
  | "EM_ATENDIMENTO"
  | "ENCERRADA"
  | "SPAM"
  | "BLOQUEADA";

export type MessageDirection = "INBOUND" | "OUTBOUND";

export type MessageContentType =
  | "TEXTO"
  | "IMAGEM"
  | "AUDIO"
  | "DOCUMENTO"
  | "VIDEO"
  | "LOCALIZACAO"
  | "CONTATO"
  | "TEMPLATE";

export type MessageDeliveryStatus =
  | "PENDENTE"
  | "ENTREGUE"
  | "LIDO"
  | "FALHOU"
  | "NAO_ENTREGUE";

export type WhatsAppOnboardingStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export type WhatsAppOnboardingStep =
  | "CREATED"
  | "PHONE_REGISTERED"
  | "VERIFIED"
  | "TEMPLATES_APPROVED";

export type WhatsAppMode = "UNIT_NUMBER" | "NETWORK_SHARED_NUMBER";

export type TaskPriority = "BAIXA" | "MEDIA" | "ALTA";

export type ProspectStatusStage =
  | "NOVO"
  | "EM_CONTATO"
  | "AGENDOU_VISITA"
  | "VISITOU"
  | "CONVERTIDO"
  | "PERDIDO";

// ── SSE ──────────────────────────────────────────────────────

export type SSEEventType =
  | "connected"
  | "nova_mensagem"
  | "conversa_atualizada"
  | "conversa_encerrada"
  | "heartbeat";

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
}

// ── Conversa ─────────────────────────────────────────────────

export interface ConversaResponse {
  id: UUID;
  tenantId: UUID;
  academiaId: UUID | null;
  unidadeId: UUID | null;
  contactId: UUID;
  prospectId: UUID | null;
  alunoId: UUID | null;
  status: ConversationStatus;
  queue: string | null;
  ownerUserId: UUID | null;
  lastMessagePreview: string | null;
  lastMessageAt: LocalDateTime | null;
  aiSummary: string | null;
  aiIntent: string | null;
  aiIntentConfidence: number | null;
  openedAt: LocalDateTime;
  closedAt: LocalDateTime | null;
  createdAt: LocalDateTime;
  updatedAt: LocalDateTime;
  contatoNome: string;
  contatoTelefone: string;
}

export interface ConversaPageResponse {
  content: ConversaResponse[];
  pageable: Record<string, unknown>;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface CriarConversaRequest {
  tenantId: UUID;
  academiaId?: UUID;
  unidadeId?: UUID;
  contactId: UUID;
  prospectId?: UUID;
  alunoId?: UUID;
  queue?: string;
  ownerUserId?: UUID;
}

export interface ConversaFilters {
  unidadeId?: string;
  status?: ConversationStatus;
  queue?: string;
  ownerUserId?: string;
  periodoInicio?: string;
  periodoFim?: string;
  busca?: string;
  page?: number;
  size?: number;
}

// ── Mensagem ─────────────────────────────────────────────────

export interface MensagemResponse {
  id: UUID;
  conversationId: UUID;
  direction: MessageDirection;
  contentType: MessageContentType;
  content: string | null;
  mediaUrl: string | null;
  deliveryStatus: MessageDeliveryStatus;
  isAutomated: boolean;
  createdAt: LocalDateTime;
}

export interface MensagemPageResponse {
  content: MensagemResponse[];
  pageable: Record<string, unknown>;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface EnviarMensagemRequest {
  content: string;
  contentType?: MessageContentType;
  mediaUrl?: string;
  templateName?: string;
  templateVariables?: string[];
}

// ── Tarefa vinculada à conversa ─────────────────────────────

export interface CriarTarefaConversaRequest {
  tenantId: UUID;
  titulo: string;
  descricao?: string;
  responsavel?: string;
  status?: string;
  prioridade?: TaskPriority;
  prazoEm?: string;
}

// ── WhatsApp Credential ──────────────────────────────────────

export interface WhatsAppCredentialResponse {
  id: UUID;
  tenantId: UUID;
  academiaId: UUID | null;
  unidadeId: UUID | null;
  businessAccountId: string;
  wabaId: string;
  phoneId: string;
  phoneNumber: string;
  mode: WhatsAppMode;
  accessTokenExpiresAt: LocalDateTime;
  webhookVerifyToken: string | null;
  onboardingStatus: WhatsAppOnboardingStatus;
  onboardingStep: WhatsAppOnboardingStep;
  lastHealthCheckAt: LocalDateTime | null;
  createdAt: LocalDateTime;
  updatedAt: LocalDateTime;
  tokenExpiringSoon: boolean;
  tokenExpired: boolean;
}

export interface WhatsAppCredentialRequest {
  tenantId: UUID;
  academiaId?: UUID;
  unidadeId?: UUID;
  businessAccountId: string;
  wabaId: string;
  phoneId: string;
  phoneNumber: string;
  mode: WhatsAppMode;
  accessToken: string;
  accessTokenExpiresAt: string;
  webhookVerifyToken?: string;
  onboardingStatus?: string;
  onboardingStep?: string;
}

export interface CredentialHealthResponse {
  id: UUID;
  phoneNumber: string;
  onboardingStatus: WhatsAppOnboardingStatus;
  tokenExpired: boolean;
  tokenExpiringSoon: boolean;
  expiresAt: string;
  lastHealthCheckAt: string;
}

// ── Contato (contexto embutido na conversa) ─────────────────

export interface ContatoOrigem {
  valor: "WHATSAPP_INBOUND" | "CADASTRO_MANUAL" | "IMPORTACAO" | "FORMULARIO_WEB";
  label: string;
}

export const CONTATO_ORIGEM_LABELS: Record<string, string> = {
  WHATSAPP_INBOUND: "WhatsApp (inbound)",
  CADASTRO_MANUAL: "Cadastro manual",
  IMPORTACAO: "Importação",
  FORMULARIO_WEB: "Formulário web",
};
