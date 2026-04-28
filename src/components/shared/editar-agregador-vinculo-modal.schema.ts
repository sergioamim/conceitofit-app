import { z } from "zod";

export const AGREGADOR_VINCULO_STATUS_VALUES = ["ATIVO", "INATIVO", "SUSPENSO"] as const;

export const AGREGADOR_VINCULO_STATUS_LABEL: Record<(typeof AGREGADOR_VINCULO_STATUS_VALUES)[number], string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  SUSPENSO: "Suspenso",
};

export const editarAgregadorVinculoSchema = z
  .object({
    usuarioExternoId: z
      .string()
      .trim()
      .min(1, "Informe o ID externo do usuário")
      .max(120, "ID externo deve ter no máximo 120 caracteres"),
    customCode: z.string().trim().max(120, "Código customizado deve ter no máximo 120 caracteres").optional(),
    status: z.enum(AGREGADOR_VINCULO_STATUS_VALUES, {
      message: "Selecione o status do vínculo",
    }),
    dataInicio: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início inválida (YYYY-MM-DD)"),
    dataFim: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.dataFim && !/^\d{4}-\d{2}-\d{2}$/.test(values.dataFim)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de fim inválida (YYYY-MM-DD)",
        path: ["dataFim"],
      });
    }
    if (values.status !== "ATIVO" && !values.dataFim?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a data de fim ao inativar ou suspender o vínculo",
        path: ["dataFim"],
      });
    }
  });

export type EditarAgregadorVinculoForm = z.infer<typeof editarAgregadorVinculoSchema>;
