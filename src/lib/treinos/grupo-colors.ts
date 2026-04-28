/**
 * Paleta canônica de cores por grupo muscular — usada em chips,
 * thumbs e barras laterais nos editores e listagens de treino.
 *
 * Hex retornado direto (não via classes Tailwind) pra evitar safelist
 * e permitir interpolação em backgrounds compostos.
 */

// Cores canônicas alinhadas com os 15 grupos da seed
// V202604271500__grupos_exercicio_canonicos.sql.
const GRUPO_COLORS: Record<string, string> = {
  Peito: "#c8f135",
  Costas: "#3de8a0",
  Ombro: "#f472b6",
  Trapezio: "#fbbf24",
  Trapézio: "#fbbf24",
  Pescoco: "#cbd5e1",
  Pescoço: "#cbd5e1",
  Biceps: "#ffb347",
  Bíceps: "#ffb347",
  Triceps: "#a78bfa",
  Tríceps: "#a78bfa",
  Antebraco: "#d8b4fe",
  Antebraço: "#d8b4fe",
  Core: "#fb923c",
  Pernas: "#38bdf8",
  Panturrilha: "#94a3b8",
  Gluteo: "#fda4af",
  Glúteo: "#fda4af",
  Adutores: "#67e8f9",
  Abdutores: "#7dd3fc",
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
