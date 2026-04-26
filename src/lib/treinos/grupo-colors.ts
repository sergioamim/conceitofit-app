/**
 * Paleta canônica de cores por grupo muscular — usada em chips,
 * thumbs e barras laterais nos editores e listagens de treino.
 *
 * Hex retornado direto (não via classes Tailwind) pra evitar safelist
 * e permitir interpolação em backgrounds compostos.
 */

const GRUPO_COLORS: Record<string, string> = {
  Peito: "#c8f135",
  Costas: "#3de8a0",
  Pernas: "#38bdf8",
  Ombro: "#f472b6",
  Bíceps: "#ffb347",
  Biceps: "#ffb347",
  Tríceps: "#a78bfa",
  Triceps: "#a78bfa",
  Core: "#fb923c",
  Glúteo: "#fda4af",
  Gluteo: "#fda4af",
  Panturrilha: "#94a3b8",
  Cardio: "#ff5c5c",
};

const FALLBACK_PALETTE = [
  "#c8f135",
  "#3de8a0",
  "#38bdf8",
  "#f472b6",
  "#ffb347",
  "#a78bfa",
  "#fb923c",
  "#fda4af",
  "#94a3b8",
  "#ff5c5c",
] as const;

/**
 * Hex stable por nome. Fallback determinístico via hash quando o grupo
 * não está no mapa canônico.
 */
export function grupoColorByName(nome?: string | null): string {
  if (!nome) return "#5a5f6e";
  const hit = GRUPO_COLORS[nome];
  if (hit) return hit;
  let hash = 0;
  for (let i = 0; i < nome.length; i += 1) {
    hash = (hash * 31 + nome.charCodeAt(i)) | 0;
  }
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length] ?? FALLBACK_PALETTE[0];
}
