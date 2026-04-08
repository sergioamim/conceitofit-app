import type { UUID, LocalDateTime } from "./comum";

export type WhatsAppTemplateEvent =
  | "WELCOME"
  | "MATRICULA_VENCENDO"
  | "COBRANCA_PENDENTE"
  | "COBRANCA_VENCIDA"
  | "PROSPECT_FOLLOWUP"
  | "ANIVERSARIO"
  | "CUSTOM";

export type WhatsAppMessageStatus = "ENVIADA" | "ENTREGUE" | "LIDA" | "FALHA";

export interface WhatsAppConfig {
  id: UUID;
  tenantId: UUID;
  provedor: "EVOLUTION_API" | "WHATSAPP_BUSINESS" | "OUTRO";
  apiUrl?: string;
  apiKey?: string;
  instanciaId?: string;
  numeroRemetente?: string;
  ativo: boolean;
  updatedAt?: LocalDateTime;
}

type WhatsAppTemplateType = WhatsAppTemplateEvent;

export interface WhatsAppTemplate {
  id: UUID;
  tenantId?: UUID;
  evento: WhatsAppTemplateEvent;
  nome: string;
  slug?: string;
  tipo?: WhatsAppTemplateEvent;
  conteudo: string;
  ativo: boolean;
  variaveis: string[];
  variables?: string[];
  criadoEm?: LocalDateTime;
  atualizadoEm?: LocalDateTime;
}

export interface WhatsAppMessageLog {
  id: UUID;
  tenantId?: UUID;
  templateId?: UUID;
  templateNome?: string;
  evento: WhatsAppTemplateEvent;
  destinatario: string;
  destinatarioNome?: string;
  conteudo: string;
  status: WhatsAppMessageStatus;
  erroMensagem?: string;
  enviadoEm: LocalDateTime;
}
