import { z } from "zod";

export const leadB2bFormSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("Informe um e-mail valido."),
  telefone: z
    .string()
    .trim()
    .min(10, "Informe um telefone valido.")
    .max(20, "Telefone muito longo."),
  nomeAcademia: z.string().trim().optional(),
  quantidadeAlunos: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val == null || val === "") return undefined;
      const n = typeof val === "string" ? parseInt(val, 10) : val;
      return Number.isNaN(n) ? undefined : n;
    }),
  cidade: z.string().trim().optional(),
  estado: z.string().trim().max(2).optional(),
  origem: z.string().default("LANDING_PAGE"),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export type LeadB2bFormValues = z.infer<typeof leadB2bFormSchema>;
