import { z } from "zod";

// ---------------------------------------------------------------------------
// Template form (admin CRUD)
// ---------------------------------------------------------------------------

export const whatsAppTemplateFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  tipo: z.enum(["WELCOME", "COBRANCA", "COBRANCA_PENDENTE", "COBRANCA_VENCIDA", "MATRICULA_VENCENDO", "VENCIMENTO_MATRICULA", "FOLLOWUP_PROSPECT", "PROSPECT_FOLLOWUP", "ANIVERSARIO", "CUSTOM"]),
  conteudo: z.string().min(1, "Conteúdo é obrigatório"),
  variables: z.string(),
  ativo: z.boolean(),
});

export type WhatsAppTemplateFormValues = z.infer<typeof whatsAppTemplateFormSchema>;

// ---------------------------------------------------------------------------
// Send message (API request/response)
// ---------------------------------------------------------------------------

export const whatsAppSendMessageSchema = z.object({
  templateId: z.string().uuid().optional(),
  evento: z.string().min(1, "Evento é obrigatório"),
  destinatario: z.string().min(8, "Número do destinatário é obrigatório"),
  destinatarioNome: z.string().optional(),
  variaveis: z.record(z.string()).optional(),
});

type WhatsAppSendMessageInput = z.infer<typeof whatsAppSendMessageSchema>;

export const whatsAppMessageStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["ENVIADA", "ENTREGUE", "LIDA", "FALHA"]),
  enviadoEm: z.string(),
  entregueEm: z.string().optional(),
  lidoEm: z.string().optional(),
  erroMensagem: z.string().optional(),
});

type WhatsAppMessageStatusResponse = z.infer<typeof whatsAppMessageStatusSchema>;

// ---------------------------------------------------------------------------
// Provider config form (admin setup)
// ---------------------------------------------------------------------------

export const whatsAppProviderConfigSchema = z.object({
  provedor: z.enum(["EVOLUTION_API", "WHATSAPP_BUSINESS", "OUTRO"]),
  apiUrl: z.string().url("URL da API inválida").optional().or(z.literal("")),
  apiKey: z.string().optional(),
  instanciaId: z.string().optional(),
  numeroRemetente: z.string().optional(),
  ativo: z.boolean(),
});

export type WhatsAppProviderConfigValues = z.infer<typeof whatsAppProviderConfigSchema>;

// ---------------------------------------------------------------------------
// Webhook payload (inbound from provider)
// ---------------------------------------------------------------------------

export const whatsAppWebhookPayloadSchema = z.object({
  messageId: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.enum(["text", "image", "document", "status_update"]),
  status: z.enum(["sent", "delivered", "read", "failed"]).optional(),
  text: z.string().optional(),
  error: z.string().optional(),
});
