/**
 * Schemas Zod para os formulários da tela "Meu Caixa" (CXO-202).
 *
 * Espelham as validações Bean Validation aplicadas no backend
 * (`AbrirCaixaRequest`, `FecharCaixaRequest`, `SangriaRequest`).
 *
 * Tipos inferidos via `z.infer` — não duplicar interfaces manuais.
 */

import * as z from "zod";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Schema do formulário "Abrir caixa". */
export const AbrirCaixaSchema = z.object({
  caixaCatalogoId: z
    .string()
    .min(1, "Selecione o caixa do catálogo")
    .regex(UUID_REGEX, "Catálogo inválido (esperado UUID)"),
  valorAbertura: z.coerce
    .number({ error: "Informe um valor numérico" })
    .min(0, "Valor de abertura não pode ser negativo"),
  observacoes: z
    .string()
    .max(500, "Máx. 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type AbrirCaixaFormData = z.infer<typeof AbrirCaixaSchema>;

/** Schema do formulário "Fechar caixa". */
export const FecharCaixaSchema = z.object({
  valorInformado: z.coerce
    .number({ error: "Informe um valor numérico" })
    .min(0, "Valor informado não pode ser negativo"),
  observacoes: z
    .string()
    .max(500, "Máx. 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type FecharCaixaFormData = z.infer<typeof FecharCaixaSchema>;

/** Schema do formulário "Sangria". */
export const SangriaSchema = z.object({
  valor: z.coerce
    .number({ error: "Informe um valor numérico" })
    .gt(0, "Sangria deve ter valor maior que zero"),
  motivo: z
    .string()
    .min(5, "Motivo precisa ter ao menos 5 caracteres")
    .max(500, "Máx. 500 caracteres"),
  autorizadoPor: z
    .string()
    .min(1, "Informe o gerente que autorizou")
    .regex(UUID_REGEX, "Autorizador inválido (esperado UUID)"),
});

export type SangriaFormData = z.infer<typeof SangriaSchema>;
