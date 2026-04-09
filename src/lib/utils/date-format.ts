/**
 * Date formatting utilities — deterministic para evitar hydration mismatch.
 *
 * Evitar `new Date().toLocaleString("pt-BR")` no render path.
 * Usar estas funcoes que produzem output identico entre SSR e cliente.
 */

/**
 * Formata timestamp ISO/string em "DD/MM/AAAA HH:mm" (pt-BR, UTC→local).
 * Deterministica para o mesmo input — safe para SSR + hidratacao.
 */
export function formatDateTimeBR(value: string | number | Date): string {
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formata timestamp em "DD/MM/AAAA" (apenas data).
 */
export function formatDateBR(value: string | number | Date): string {
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
