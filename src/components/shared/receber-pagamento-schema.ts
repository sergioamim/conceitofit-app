import { z } from "zod";
import type { TipoFormaPagamento } from "@/lib/types";

const FORMAS_PAGAMENTO: [TipoFormaPagamento, ...TipoFormaPagamento[]] = [
  "DINHEIRO",
  "PIX",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "BOLETO",
  "RECORRENTE",
];

export const receberPagamentoSchema = z.object({
  dataPagamento: z.string().min(1, "Informe a data do pagamento."),
  formaPagamento: z.enum(FORMAS_PAGAMENTO, {
    errorMap: () => ({ message: "Selecione a forma de pagamento." }),
  }),
  observacoes: z.string().trim().optional().default(""),
});

export type ReceberPagamentoFormValues = z.infer<typeof receberPagamentoSchema>;
