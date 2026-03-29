import { z } from "zod";
import type { OrigemProspect } from "@/lib/types";

const ORIGENS: [OrigemProspect, ...OrigemProspect[]] = [
  "VISITA_PRESENCIAL",
  "WHATSAPP",
  "INSTAGRAM",
  "FACEBOOK",
  "INDICACAO",
  "SITE",
  "OUTROS",
];

export const prospectSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  telefone: z.string().trim().min(1, "Informe o telefone."),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  cpf: z.string().trim().optional().default(""),
  origem: z.enum(ORIGENS).default("INSTAGRAM"),
  observacoes: z.string().trim().optional().default(""),
  responsavelId: z.string().optional().default(""),
});

export type ProspectFormValues = z.infer<typeof prospectSchema>;
