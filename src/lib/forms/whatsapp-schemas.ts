import { z } from "zod";

export const whatsAppTemplateFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  tipo: z.enum(["WELCOME", "COBRANCA", "VENCIMENTO_MATRICULA", "FOLLOWUP_PROSPECT", "CUSTOM"]),
  conteudo: z.string().min(1, "Conteúdo é obrigatório"),
  variables: z.string(),
  ativo: z.boolean(),
});

export type WhatsAppTemplateFormValues = z.infer<typeof whatsAppTemplateFormSchema>;
