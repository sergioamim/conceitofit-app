import { z } from "zod";

// ── Enviar Mensagem ─────────────────────────────────────────

export const enviarMensagemSchema = z.object({
  content: z.string().trim().min(1, "Mensagem não pode estar vazia.").max(4096),
  contentType: z
    .enum(["TEXTO", "IMAGEM", "AUDIO", "DOCUMENTO", "VIDEO", "LOCALIZACAO", "CONTATO", "TEMPLATE"])
    .default("TEXTO"),
  mediaUrl: z.url().optional(),
  templateName: z.string().trim().optional(),
  templateVariables: z.array(z.string()).optional(),
});

export type EnviarMensagemFormValues = z.infer<typeof enviarMensagemSchema>;

// ── Criar Tarefa ────────────────────────────────────────────

export const criarTarefaSchema = z.object({
  titulo: z.string().trim().min(1, "Informe o título.").max(160),
  descricao: z.string().trim().max(1000).optional(),
  responsavel: z.uuid().optional(),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA"]).default("MEDIA"),
  prazoEm: z.string().datetime().optional(),
});

export type CriarTarefaFormValues = z.infer<typeof criarTarefaSchema>;

// ── Criar Conversa ──────────────────────────────────────────

export const criarConversaSchema = z.object({
  contactId: z.uuid("Contato é obrigatório."),
  tenantId: z.uuid(),
  academiaId: z.uuid().optional(),
  unidadeId: z.uuid().optional(),
  prospectId: z.uuid().optional(),
  alunoId: z.uuid().optional(),
  queue: z.string().trim().optional(),
  ownerUserId: z.uuid().optional(),
});

type CriarConversaFormValues = z.infer<typeof criarConversaSchema>;

// ── Filtros de Conversa ─────────────────────────────────────

export const conversaFiltersSchema = z.object({
  busca: z.string().trim().optional(),
  status: z
    .enum(["ABERTA", "PENDENTE", "EM_ATENDIMENTO", "ENCERRADA", "SPAM", "BLOQUEADA"])
    .optional(),
  queue: z.string().trim().optional(),
  ownerUserId: z.uuid().optional(),
  unidadeId: z.uuid().optional(),
  periodoInicio: z.string().datetime().optional(),
  periodoFim: z.string().datetime().optional(),
});

type ConversaFiltersFormValues = z.infer<typeof conversaFiltersSchema>;

// ── WhatsApp Credential ─────────────────────────────────────

export const whatsappCredentialSchema = z.object({
  businessAccountId: z.string().trim().min(1, "Informe o Business Account ID."),
  wabaId: z.string().trim().min(1, "Informe o WABA ID."),
  phoneId: z.string().trim().min(1, "Informe o Phone ID."),
  phoneNumber: z.string().trim().min(8, "Número deve ter no mínimo 8 caracteres."),
  mode: z.enum(["UNIT_NUMBER", "NETWORK_SHARED_NUMBER"]),
  accessToken: z.string().trim().min(1, "Informe o Access Token."),
  accessTokenExpiresAt: z.string().datetime("Data de expiração inválida."),
  tenantId: z.uuid(),
  academiaId: z.uuid().optional(),
  unidadeId: z.uuid().optional(),
  webhookVerifyToken: z.string().trim().optional(),
});

export type WhatsAppCredentialFormValues = z.infer<typeof whatsappCredentialSchema>;
