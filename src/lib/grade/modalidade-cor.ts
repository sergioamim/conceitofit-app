import type { Atividade, CategoriaAtividade } from "@/lib/types";

/**
 * Paleta padrão por categoria de atividade.
 * Espelha as cores usadas no design canvas e nos tokens do tema (chart-1..5).
 */
const PALETTE_BY_CATEGORIA: Record<CategoriaAtividade, string> = {
  COLETIVA: "#6b8c1a",
  CARDIO: "#dc3545",
  LUTA: "#e09020",
  AQUATICA: "#0891b2",
  MUSCULACAO: "#475569",
  OUTRA: "#7c5cbf",
};

const FALLBACK = "#6b8c1a";

export interface ModalidadeCor {
  /** Cor sólida — usada em borda esquerda do card e dot do filtro. */
  cor: string;
  /** Background pastel do card (mistura com branco). Usar como `style.background`. */
  bg: string;
  /** Cor de texto contrastante (mistura com preto). Usar como `style.color`. */
  text: string;
}

/**
 * Resolve a paleta de uma atividade. Se `atividade.cor` estiver preenchida, ela vence;
 * senão usa a paleta padrão por `categoria`. Sempre retorna valores compatíveis com
 * `style={{ background, color }}` (usa `color-mix` em oklch para os derivados).
 */
export function getModalidadeCor(
  atividade: Pick<Atividade, "cor" | "categoria">,
): ModalidadeCor {
  const cor = (atividade.cor ?? "").trim() || PALETTE_BY_CATEGORIA[atividade.categoria] || FALLBACK;
  return {
    cor,
    bg: `color-mix(in oklch, ${cor} 18%, white)`,
    text: `color-mix(in oklch, ${cor} 75%, black)`,
  };
}
