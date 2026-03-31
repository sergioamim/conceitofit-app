import { z } from "zod";

export const pagarContaSchema = z.object({
  dataPagamento: z.string().min(1, "Informe a data de pagamento."),
  formaPagamento: z.enum(["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "BOLETO", "RECORRENTE"]),
  valorPago: z.string().optional().default(""),
  observacoes: z.string().trim().optional().default(""),
});

export type PagarContaFormValues = z.infer<typeof pagarContaSchema>;
