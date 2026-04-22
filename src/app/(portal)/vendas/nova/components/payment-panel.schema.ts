import { z } from "zod";

/**
 * Schema do formulário do PaymentPanel (VUN-3.2).
 *
 * Regras:
 * - formaPagamento: restrito aos cinco métodos suportados pelo painel (PRD §8.1).
 * - parcelas: 1–12, obrigatório apenas quando relevante.
 * - autorizacao (código de autorização da transação): opcional em qualquer método.
 *   Campo aparece para CARTAO_CREDITO/CARTAO_DEBITO, mas preenchimento é livre.
 *
 * Observação: mantemos os valores canônicos do projeto (`CARTAO_CREDITO`,
 * `CARTAO_DEBITO`) ao invés de `CREDITO`/`DEBITO` citados na story, para
 * compatibilidade direta com `TipoFormaPagamento` em `src/lib/shared/types/pagamento.ts`.
 */
// RECORRENTE não é forma de pagamento — é uma característica do plano
// (tipoCobranca="RECORRENTE"). Removido do painel em 2026-04-22.
export const PAYMENT_PANEL_METODOS = [
  "DINHEIRO",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "PIX",
] as const;

export type PaymentPanelMetodo = (typeof PAYMENT_PANEL_METODOS)[number];

/**
 * Padrão histórico de NSU (min 4 dígitos numéricos). Hoje o campo é opcional
 * e o schema não usa esse regex pra bloquear submit, mas ele segue exportado
 * porque utilitários legados (ex.: highlight visual do input, normalização de
 * fallback em tests) ainda fazem sanity-check de formato quando um valor é
 * informado.
 */
export const NSU_REGEX = /^\d{4,}$/;

export const paymentPanelSchema = z
  .object({
    formaPagamento: z.enum(PAYMENT_PANEL_METODOS),
    parcelas: z
      .number()
      .int("Parcelas deve ser inteiro")
      .min(1, "Mínimo 1 parcela")
      .max(12, "Máximo 12 parcelas"),
    autorizacao: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.formaPagamento !== "CARTAO_CREDITO" && data.parcelas !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["parcelas"],
        message: "Parcelamento disponível apenas para cartão de crédito.",
      });
    }
  });

export type PaymentPanelFormValues = z.infer<typeof paymentPanelSchema>;
