import { z } from "zod";
import { validateCPF } from "@/components/shared/cpf-validator";
import {
  optionalTrimmedString,
  requiredTrimmedString,
} from "@/lib/forms/zod-helpers";

/**
 * Schema do mini-form de criação inline de Prospect (VUN-2.4).
 *
 * CPF chega readonly (pré-preenchido pela busca universal); ainda assim é
 * revalidado aqui para garantir que o payload enviado ao backend seja
 * consistente. Reusa o `validateCPF` já existente em `cpf-validator.ts`.
 *
 * Spike T1 confirmou que o backend é `POST /api/v1/academia/prospects` com
 * `ProspectUpsertApiRequest` — exige `telefone` (string min 1). Expandimos
 * o mínimo da story (nome+CPF) para incluir telefone, conforme mitigação
 * prevista no "Risco · Backend exigir mais campos".
 */
export const prospectInlineFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do prospect."),
  telefone: requiredTrimmedString("Informe o telefone."),
  cpf: requiredTrimmedString("Informe o CPF.").refine(
    (value) => validateCPF(value).valid,
    { message: "CPF inválido." }
  ),
  observacoes: optionalTrimmedString(),
});

export type ProspectInlineFormValues = z.infer<typeof prospectInlineFormSchema>;
