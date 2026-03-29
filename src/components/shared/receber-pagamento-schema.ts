import { z } from "zod";

export const receberPagamentoSchema = z.object({
  dataPagamento: z.string().min(1, "Informe a data do pagamento."),
  formaPagamento: z.enum(["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "BOLETO", "RECORRENTE"]),
  observacoes: z.string().trim().optional().default(""),
});

export type ReceberPagamentoFormValues = z.infer<typeof receberPagamentoSchema>;
