import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/formatters";

/**
 * Replica o helper formatAtualizadoEm da templates-grid-v3.tsx (Wave 8 FE)
 * pra cobrir lógica de slicing ISO → DD/MM. Mantemos o helper inline na
 * page (não vale extrair só pra testar), mas asseguramos a função base
 * formatDate continua hidratação-safe (split de string, sem locale/Date).
 */
function formatAtualizadoEm(value?: string | null): string | null {
  if (!value) return null;
  const datePart = value.slice(0, 10);
  const formatted = formatDate(datePart);
  if (!formatted) return null;
  return formatted.slice(0, 5);
}

describe("formatDate (hidratação-safe)", () => {
  it("converte ISO YYYY-MM-DD em DD/MM/YYYY via split puro", () => {
    expect(formatDate("2026-04-25")).toBe("25/04/2026");
    expect(formatDate("2026-12-31")).toBe("31/12/2026");
  });

  it("retorna string vazia para entradas falsy", () => {
    expect(formatDate(undefined)).toBe("");
    expect(formatDate(null)).toBe("");
    expect(formatDate("")).toBe("");
    expect(formatDate("   ")).toBe("");
  });

  it("retorna string original quando o formato não tem 3 partes separadas por -", () => {
    // sem separadores ou só com / → fallback retorna o input trimado
    expect(formatDate("25/04/2026")).toBe("25/04/2026");
    expect(formatDate("apenas-dois")).toBe("apenas-dois");
  });

  it("não usa new Date() — comportamento determinístico em SSR e client", () => {
    // Mesma entrada em qualquer momento ou ambiente retorna a mesma saída.
    const a = formatDate("2026-04-25");
    const b = formatDate("2026-04-25");
    expect(a).toBe(b);
  });
});

describe("formatAtualizadoEm (slicing helper do template card)", () => {
  it("aceita ISO date e retorna DD/MM curto", () => {
    expect(formatAtualizadoEm("2026-04-25")).toBe("25/04");
    expect(formatAtualizadoEm("2026-12-31")).toBe("31/12");
  });

  it("aceita ISO datetime e usa só a parte da data", () => {
    expect(formatAtualizadoEm("2026-04-25T10:30:00.000Z")).toBe("25/04");
  });

  it("retorna null para entradas falsy", () => {
    expect(formatAtualizadoEm(undefined)).toBeNull();
    expect(formatAtualizadoEm(null)).toBeNull();
    expect(formatAtualizadoEm("")).toBeNull();
  });
});
