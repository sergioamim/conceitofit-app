import { z } from "zod";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";

export const integrationStatusFilterSchema = z.enum(["TODAS", "ONLINE", "DEGRADED", "OFFLINE", "MAINTENANCE"]);

export const globalConfigEmailTemplateSchema = z.object({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  nome: requiredTrimmedString("Informe o nome do template."),
  assunto: requiredTrimmedString("Informe o assunto do template."),
  canal: z.enum(["EMAIL", "WHATSAPP", "SMS"]),
  ativo: z.boolean(),
  bodyHtml: requiredTrimmedString("Informe o corpo do template."),
  variables: z.array(z.string().trim()).default([]),
});

export const globalConfigFormSchema = z.object({
  emailTemplates: z.array(globalConfigEmailTemplateSchema).min(1, "Mantenha ao menos um template global."),
  termsOfUseHtml: requiredTrimmedString("Informe o conteúdo dos termos de uso."),
  termsVersion: requiredTrimmedString("Informe a versão dos termos."),
  apiLimits: z.object({
    requestsPerMinute: z.coerce.number().finite().int().min(1, "Informe um limite válido."),
    burstLimit: z.coerce.number().finite().int().min(1, "Informe um burst válido."),
    webhookRequestsPerMinute: z.coerce.number().finite().int().min(1, "Informe um limite de webhook válido."),
    adminRequestsPerMinute: z.coerce.number().finite().int().min(1, "Informe um limite administrativo válido."),
  }),
});

export type GlobalConfigFormValues = z.infer<typeof globalConfigFormSchema>;
