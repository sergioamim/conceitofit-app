/**
 * Helper de apresentação de erros do domínio Caixa Operacional.
 *
 * Mapeia `CaixaApiError` (discriminated union por `code`) para um objeto
 * user-friendly com `titulo`, `mensagem` e uma ação sugerida opcional
 * (href para navegação ou action para handlers locais na UI).
 *
 * A formatação de data é propositalmente simples aqui — componentes
 * podem re-formatar `abertoEm` com o locale/timezone do usuário antes de
 * renderizar, se desejarem algo mais sofisticado.
 */

import type { CaixaApiError } from "./caixa-errors";

export interface CaixaErrorPresentation {
  titulo: string;
  mensagem: string;
  acaoSugerida?: {
    label: string;
    href?: string;
    action?: "ABRIR_CAIXA" | "FECHAR_E_REABRIR";
  };
}

/**
 * Type guard para identificar um `CaixaApiError` em blocos `catch` (onde o
 * erro chega como `unknown`). Verifica apenas a presença do campo `code`
 * como string — a narrowing subsequente acontece via `switch` em `mapCaixaError`.
 */
export function isCaixaApiError(err: unknown): err is CaixaApiError {
  if (typeof err !== "object" || err === null) return false;
  if (!("code" in err)) return false;
  const code = (err as { code: unknown }).code;
  if (typeof code !== "string") return false;
  switch (code) {
    case "CAIXA_JA_ABERTO":
    case "CAIXA_NAO_ABERTO":
    case "CAIXA_DIA_ANTERIOR":
    case "SANGRIA_SEM_AUTORIZACAO":
    case "CAIXA_JA_FECHADO":
      return true;
    default:
      return false;
  }
}

/** Formata um ISO datetime para exibição simples (YYYY-MM-DD HH:mm). */
function formatAbertoEm(iso: string): string {
  // Mantém pt-BR friendly: "14/04/2026 09:30"
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

/**
 * Mapeia um `CaixaApiError` para a apresentação exibível na UI
 * (toast, modal, banner).
 */
export function mapCaixaError(err: CaixaApiError): CaixaErrorPresentation {
  switch (err.code) {
    case "CAIXA_JA_ABERTO":
      return {
        titulo: "Caixa já aberto",
        mensagem: `Você já tem um caixa aberto desde ${formatAbertoEm(
          err.abertoEm,
        )}.`,
        acaoSugerida: { label: "Ver caixa ativo", href: "/caixa" },
      };
    case "CAIXA_NAO_ABERTO":
      return {
        titulo: "Sem caixa aberto",
        mensagem: "Você precisa abrir um caixa antes de continuar.",
        acaoSugerida: { label: "Abrir caixa", action: "ABRIR_CAIXA" },
      };
    case "CAIXA_DIA_ANTERIOR":
      return {
        titulo: "Caixa de dia anterior",
        mensagem: `Seu caixa aberto em ${formatAbertoEm(
          err.abertoEm,
        )} precisa ser encerrado antes de continuar.`,
        acaoSugerida: {
          label: "Encerrar e abrir novo",
          action: "FECHAR_E_REABRIR",
        },
      };
    case "SANGRIA_SEM_AUTORIZACAO":
      return {
        titulo: "Sangria não autorizada",
        mensagem:
          "Selecione um gerente válido para autorizar a sangria.",
      };
    case "CAIXA_JA_FECHADO":
      return {
        titulo: "Caixa já fechado",
        mensagem: "Este caixa não aceita mais alterações.",
      };
  }
}
