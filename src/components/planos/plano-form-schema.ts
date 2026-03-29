import { z } from "zod";

export const planoFormSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres."),
  descricao: z.string().trim().optional().default(""),
  tipo: z.enum(["MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL", "AVULSO"]).default("MENSAL"),
  duracaoDias: z.string().refine((v) => parseInt(v, 10) >= 1, "Duração mínima de 1 dia."),
  valor: z.string().refine((v) => parseFloat(v) >= 0.01, "Valor mínimo de R$ 0,01."),
  valorMatricula: z.string().default("0"),
  cobraAnuidade: z.boolean().default(false),
  valorAnuidade: z.string().default("0"),
  parcelasMaxAnuidade: z.string().default("1"),
  permiteRenovacaoAutomatica: z.boolean().default(true),
  permiteCobrancaRecorrente: z.boolean().default(false),
  diaCobrancaPadrao: z.string().optional().default(""),
  contratoTemplateHtml: z.string().optional().default(""),
  contratoAssinatura: z.enum(["DIGITAL", "PRESENCIAL", "AMBAS"]).default("AMBAS"),
  contratoEnviarAutomaticoEmail: z.boolean().default(false),
  atividades: z.array(z.string()).default([]),
  beneficios: z.array(z.object({ value: z.string() })).default([]),
  destaque: z.boolean().default(false),
  ordem: z.string().optional().default(""),
});

export type PlanoFormSchemaValues = z.infer<typeof planoFormSchema>;
