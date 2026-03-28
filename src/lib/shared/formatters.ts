/**
 * Formatadores compartilhados para moeda, data e percentual.
 * Centraliza as funções duplicadas em 10+ páginas.
 */

export function formatCurrency(value: number, currency = "BRL"): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency });
}

export function formatBRL(value: number): string {
  return formatCurrency(value);
}

/** Converte "YYYY-MM-DD" → "dd/mm/yyyy". Retorna o valor original em caso de formato inválido. */
export function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

/** Formata um datetime ISO para "dd/mm/yyyy HH:mm". */
export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formata um número como percentual com 1 casa decimal. Ex: 12.5 → "12,5%" */
export function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}
