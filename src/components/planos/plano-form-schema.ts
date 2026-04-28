import { z } from "zod";

const parseMoney = (value: string) => Number.parseFloat(value);
const parseInteger = (value: string) => Number.parseInt(value, 10);
const diasPattern = /^\s*\d+\s*$/;

export const planoFormSchema = z
  .object({
    nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres."),
    descricao: z.string().trim().optional().default(""),
    tipo: z.enum(["MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL", "AVULSO"]).default("MENSAL"),
    duracaoDias: z.string().refine((v) => parseInteger(v) >= 1, "Duração mínima de 1 dia."),
    valor: z.string().refine((v) => parseMoney(v) >= 0.01, "Valor mínimo de R$ 0,01."),
    valorMatricula: z.string().refine((v) => parseMoney(v) >= 0, "Matrícula não pode ser negativa.").default("0"),
    cobraAnuidade: z.boolean().default(false),
    valorAnuidade: z.string().refine((v) => parseMoney(v) >= 0, "Anuidade não pode ser negativa.").default("0"),
    parcelasMaxAnuidade: z.string().refine((v) => parseInteger(v) >= 1, "Parcele a anuidade em ao menos 1 vez.").default("1"),
    permiteRenovacaoAutomatica: z.boolean().default(true),
    permiteCobrancaRecorrente: z.boolean().default(false),
    diaCobrancaPadrao: z.string().optional().default(""),
    contratoTemplateHtml: z.string().optional().default(""),
    contratoAssinatura: z.enum(["DIGITAL", "PRESENCIAL", "AMBAS"]).default("AMBAS"),
    contratoEnviarAutomaticoEmail: z.boolean().default(false),
    atividades: z.array(z.string()).default([]),
    beneficios: z.array(z.object({ value: z.string() })).default([]),
    destaque: z.boolean().default(false),
    permiteVendaOnline: z.boolean().default(true),
    ordem: z.string().refine((v) => v.trim() === "" || parseInteger(v) >= 0, "Ordem não pode ser negativa.").optional().default(""),
    parcelasMaximasCartao: z.string()
      .refine((v) => v.trim() === "" || (parseInteger(v) >= 1 && parseInteger(v) <= 24),
              "Entre 1 e 24 parcelas (ou vazio para o default 12x).")
      .optional()
      .default(""),
  })
  .superRefine((values, ctx) => {
    if (values.cobraAnuidade && parseMoney(values.valorAnuidade) < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valorAnuidade"],
        message: "Anuidade não pode ser negativa.",
      });
    }

    if (values.cobraAnuidade && parseInteger(values.parcelasMaxAnuidade) < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["parcelasMaxAnuidade"],
        message: "Parcele a anuidade em ao menos 1 vez.",
      });
    }

    if (values.tipo !== "AVULSO" && values.permiteCobrancaRecorrente) {
      const dia = values.diaCobrancaPadrao.trim();
      if (dia.length > 0) {
        if (!diasPattern.test(dia)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["diaCobrancaPadrao"],
            message: "Informe um único dia entre 1 e 28.",
          });
          return;
        }

        const parsedDia = parseInteger(dia);
        if (parsedDia < 1 || parsedDia > 28) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["diaCobrancaPadrao"],
            message: "Informe um único dia entre 1 e 28.",
          });
        }
      }
    }
  });
