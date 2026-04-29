import { z } from "zod";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";
import type { CampanhaCRM, CampanhaCanal, CampanhaPublicoAlvo, CampanhaStatus } from "@/lib/types";

export const campanhaFormSchema = z
  .object({
    nome: requiredTrimmedString("Informe o nome da campanha.").max(120, "O nome deve ter no máximo 120 caracteres."),
    descricao: z.string().max(500, "A descrição deve ter no máximo 500 caracteres."),
    publicoAlvo: z.enum(["EVADIDOS_ULTIMOS_3_MESES", "PROSPECTS_EM_ABERTO", "ALUNOS_INATIVOS"] satisfies [CampanhaPublicoAlvo, ...CampanhaPublicoAlvo[]]),
    canais: z
      .array(z.enum(["WHATSAPP", "EMAIL", "SMS", "LIGACAO"] satisfies [CampanhaCanal, ...CampanhaCanal[]]))
      .min(1, "Selecione ao menos um canal."),
    voucherId: z.string(),
    dataInicio: requiredTrimmedString("Informe a data de início."),
    dataFim: z.string(),
    status: z.enum(["RASCUNHO", "ATIVA", "ENCERRADA"] satisfies [CampanhaStatus, ...CampanhaStatus[]]),
  })
  .superRefine((values, ctx) => {
    if (values.dataFim.trim() && values.dataInicio.trim() && values.dataFim < values.dataInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dataFim"],
        message: "A data de fim deve ser igual ou posterior à data de início.",
      });
    }
  });

export type CampanhaFormValues = z.infer<typeof campanhaFormSchema>;

export function createCampanhaFormDefaults(todayIso: string): CampanhaFormValues {
  return {
    nome: "",
    descricao: "",
    publicoAlvo: "EVADIDOS_ULTIMOS_3_MESES",
    canais: ["WHATSAPP"],
    voucherId: "none",
    dataInicio: todayIso,
    dataFim: "",
    status: "RASCUNHO",
  };
}

export function campanhaToFormValues(campanha: CampanhaCRM): CampanhaFormValues {
  return {
    nome: campanha.nome,
    descricao: campanha.descricao ?? "",
    publicoAlvo: campanha.publicoAlvo,
    canais: campanha.canais,
    voucherId: campanha.voucherId ?? "none",
    dataInicio: campanha.dataInicio,
    dataFim: campanha.dataFim ?? "",
    status: campanha.status,
  };
}
