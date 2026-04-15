/**
 * Códigos de erro do domínio Caixa Operacional.
 *
 * Espelha o enum Java `CaixaErrorCode` em
 * `modulo-financeiro/src/main/java/fit/conceito/financeiro/dto/caixa/CaixaErrorCode.java`.
 *
 * `CaixaApiError` é uma discriminated union por `code` que carrega o
 * payload adicional retornado pelo BE para cada cenário (IDs/flags usados
 * pela UI para decidir a ação sugerida ao usuário).
 */

export const CaixaErrorCode = {
  CAIXA_JA_ABERTO: "CAIXA_JA_ABERTO",
  CAIXA_NAO_ABERTO: "CAIXA_NAO_ABERTO",
  CAIXA_DIA_ANTERIOR: "CAIXA_DIA_ANTERIOR",
  SANGRIA_SEM_AUTORIZACAO: "SANGRIA_SEM_AUTORIZACAO",
  CAIXA_JA_FECHADO: "CAIXA_JA_FECHADO",
} as const;

export type CaixaErrorCode = (typeof CaixaErrorCode)[keyof typeof CaixaErrorCode];

export type CaixaApiError =
  | { code: "CAIXA_JA_ABERTO"; caixaAtivoId: string; abertoEm: string }
  | {
      code: "CAIXA_NAO_ABERTO";
      acaoSugerida: "ABRIR_CAIXA";
      caixaCatalogoSugerido: string | null;
    }
  | {
      code: "CAIXA_DIA_ANTERIOR";
      caixaAtivoId: string;
      abertoEm: string;
      acaoSugerida: "FECHAR_E_REABRIR";
    }
  | { code: "SANGRIA_SEM_AUTORIZACAO" }
  | { code: "CAIXA_JA_FECHADO" };
