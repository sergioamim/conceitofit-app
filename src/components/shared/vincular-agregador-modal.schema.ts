/**
 * Schema zod para o modal "Vincular Agregador" (VUN-5.2).
 *
 * Campos:
 * - agregador: tipo do agregador B2B (Wellhub/TotalPass/Outro).
 * - usuarioExternoId: identificador do usuário no agregador (1..120 chars).
 * - dataInicio: data de início do vínculo (YYYY-MM-DD).
 */
import { z } from "zod";

export const AGREGADOR_TIPO_VALUES = ["WELLHUB", "TOTALPASS", "OUTRO"] as const;

export const AGREGADOR_TIPO_LABEL: Record<(typeof AGREGADOR_TIPO_VALUES)[number], string> = {
  WELLHUB: "Wellhub (Gympass)",
  TOTALPASS: "TotalPass",
  OUTRO: "Outro",
};

export const vincularAgregadorSchema = z.object({
  agregador: z.enum(AGREGADOR_TIPO_VALUES, {
    message: "Selecione o tipo de agregador",
  }),
  usuarioExternoId: z
    .string()
    .trim()
    .min(1, "Informe o ID externo do usuário")
    .max(120, "ID externo deve ter no máximo 120 caracteres"),
  dataInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início inválida (YYYY-MM-DD)"),
});

export type VincularAgregadorForm = z.infer<typeof vincularAgregadorSchema>;
