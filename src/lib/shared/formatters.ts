/**
 * Formatadores compartilhados para moeda, data e percentual.
 * Centraliza as funções duplicadas em 10+ páginas.
 */

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatCurrency(value: number, currency = "BRL"): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency });
}

export function formatBRL(value: number): string {
  return formatCurrency(value);
}

/** Converte "YYYY-MM-DD" → "dd/mm/yyyy". Retorna string vazia para null/undefined e o valor original em caso de formato inválido. */
export function formatDate(value?: string | null): string {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";

  const [year, month, day] = normalized.split("-");
  if (!year || !month || !day) return normalized;
  return `${day}/${month}/${year}`;
}

/** Formata um datetime ISO para "dd/mm/yyyy HH:mm". */
export function formatDateTime(value?: string | null): string {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized;

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formata CPF: 12345678901 → 123.456.789-01 */
export function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Formata telefone: 11999990000 → (11) 99999-0000 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

/** Formata um número como percentual com 1 casa decimal. Ex: 12.5 → "12,5%" */
export function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

/**
 * Formata Date/string/number em "DD/MM/AAAA" — determinístico para SSR.
 * Diferente de `formatDate` (que aceita só string "YYYY-MM-DD"), aceita objetos Date.
 */
export function formatDateBR(value: string | number | Date | null | undefined): string {
  if (value == null) return "—";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formata Date/string/number em "DD/MM/AAAA HH:mm" — determinístico para SSR.
 * Diferente de `formatDateTime` (que usa toLocaleString), usa cálculo manual.
 */
export function formatDateTimeBR(value: string | number | Date | null | undefined): string {
  if (value == null) return "—";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/** Formata distância relativa: "há 5 minutos", "há 2 dias", etc. */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}
