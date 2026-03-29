import type { UUID, LocalDateTime } from "./comum";

export type WhatsAppTemplateType =
  | "WELCOME"
  | "COBRANCA"
  | "VENCIMENTO_MATRICULA"
  | "FOLLOWUP_PROSPECT"
  | "CUSTOM";

export type WhatsAppMessageStatus =
  | "ENVIADA"
  | "ENTREGUE"
  | "LIDA"
  | "FALHA";

export interface WhatsAppTemplate {
  id: UUID;
  slug: string;
  nome: string;
  tipo: WhatsAppTemplateType;
  conteudo: string;
  variables: string[];
  ativo: boolean;
  createdAt?: LocalDateTime;
  updatedAt?: LocalDateTime;
}

export interface WhatsAppMessageLog {
  id: UUID;
  templateId: UUID;
  templateNome: string;
  destinatario: string;
  destinatarioNome: string;
  conteudoRenderizado: string;
  status: WhatsAppMessageStatus;
  erro?: string;
  enviadoEm: LocalDateTime;
}

export interface WhatsAppConfig {
  provider: "EVOLUTION_API" | "WHATSAPP_BUSINESS" | "MOCK";
  apiUrl?: string;
  apiKey?: string;
  instanceName?: string;
  ativo: boolean;
  updatedAt?: LocalDateTime;
}
