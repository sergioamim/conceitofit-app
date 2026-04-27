import { z } from "zod";

const motivoSchema = z
  .string()
  .trim()
  .min(20, "Informe um motivo com pelo menos 20 caracteres.")
  .max(500, "O motivo deve ter no máximo 500 caracteres.");

export const emitirCreditoDiasFormSchema = z.object({
  dias: z
    .number()
    .refine((value) => Number.isFinite(value), "Informe a quantidade de dias.")
    .int("A quantidade de dias deve ser inteira.")
    .min(1, "Informe entre 1 e 30 dias.")
    .max(30, "Informe entre 1 e 30 dias."),
  motivo: motivoSchema,
});

export const estornarCreditoDiasFormSchema = z.object({
  motivo: motivoSchema,
});

export const editarContratoFormSchema = z.object({
  dataInicio: z
    .string()
    .trim()
    .min(1, "Informe a nova data de início.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  motivo: motivoSchema,
});

export type EmitirCreditoDiasForm = z.input<typeof emitirCreditoDiasFormSchema>;
export type EstornarCreditoDiasForm = z.input<typeof estornarCreditoDiasFormSchema>;
export type EditarContratoForm = z.input<typeof editarContratoFormSchema>;
