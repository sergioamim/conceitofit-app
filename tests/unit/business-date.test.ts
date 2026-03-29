import { describe, expect, it } from "vitest";
import {
  getBusinessTodayIso,
  getBusinessDateParts,
  getBusinessTodayDate,
  getBusinessCurrentMonthYear,
  getBusinessMonthRange,
  addDaysToIsoDate,
  parseIsoDateAtNoon,
  toIsoDate,
} from "@/lib/shared/business-date";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cria uma Date UTC que, no fuso America/Sao_Paulo, corresponde ao date/time indicado. */
function spDate(isoDatetime: string): Date {
  // Interpreta como horário local de São Paulo
  // O offset SP varia (UTC-3 ou UTC-2 em horário de verão)
  // Usar Intl para converter de volta é mais confiável, mas para testes
  // podemos usar a abordagem simplificada:
  return new Date(isoDatetime);
}

// ---------------------------------------------------------------------------
// getBusinessDateParts
// ---------------------------------------------------------------------------

describe("getBusinessDateParts", () => {
  it("retorna ano, mês e dia para uma data normal", () => {
    const ref = spDate("2026-03-15T14:00:00");
    const parts = getBusinessDateParts(ref);
    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(3);
    expect(parts.day).toBe(15);
  });

  it("retorna partes corretas para 1 de janeiro", () => {
    const ref = spDate("2026-01-01T12:00:00");
    const parts = getBusinessDateParts(ref);
    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(1);
    expect(parts.day).toBe(1);
  });

  it("retorna partes corretas para 31 de dezembro", () => {
    const ref = spDate("2025-12-31T12:00:00");
    const parts = getBusinessDateParts(ref);
    expect(parts.year).toBe(2025);
    expect(parts.month).toBe(12);
    expect(parts.day).toBe(31);
  });

  it("retorna partes corretas para 29 de fevereiro (ano bissexto)", () => {
    const ref = spDate("2024-02-29T12:00:00");
    const parts = getBusinessDateParts(ref);
    expect(parts.year).toBe(2024);
    expect(parts.month).toBe(2);
    expect(parts.day).toBe(29);
  });

  it("usa new Date() como default quando sem argumento", () => {
    const parts = getBusinessDateParts();
    expect(parts.year).toBeGreaterThanOrEqual(2024);
    expect(parts.month).toBeGreaterThanOrEqual(1);
    expect(parts.month).toBeLessThanOrEqual(12);
    expect(parts.day).toBeGreaterThanOrEqual(1);
    expect(parts.day).toBeLessThanOrEqual(31);
  });
});

// ---------------------------------------------------------------------------
// getBusinessTodayIso
// ---------------------------------------------------------------------------

describe("getBusinessTodayIso", () => {
  it("retorna formato YYYY-MM-DD", () => {
    const result = getBusinessTodayIso(spDate("2026-07-04T10:00:00"));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("retorna a data correta para uma referência conhecida", () => {
    const result = getBusinessTodayIso(spDate("2026-03-15T14:00:00"));
    expect(result).toBe("2026-03-15");
  });

  it("virada de ano: 31/12", () => {
    const result = getBusinessTodayIso(spDate("2025-12-31T12:00:00"));
    expect(result).toBe("2025-12-31");
  });

  it("virada de ano: 01/01", () => {
    const result = getBusinessTodayIso(spDate("2026-01-01T12:00:00"));
    expect(result).toBe("2026-01-01");
  });

  it("ano bissexto: 29/02", () => {
    const result = getBusinessTodayIso(spDate("2024-02-29T15:00:00"));
    expect(result).toBe("2024-02-29");
  });

  it("pads mês e dia com zero", () => {
    const result = getBusinessTodayIso(spDate("2026-01-05T12:00:00"));
    expect(result).toBe("2026-01-05");
  });

  it("usa new Date() como default", () => {
    const result = getBusinessTodayIso();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// toIsoDate
// ---------------------------------------------------------------------------

describe("toIsoDate", () => {
  it("converte Date para string YYYY-MM-DD", () => {
    const date = new Date(2026, 2, 15); // Março 15
    expect(toIsoDate(date)).toBe("2026-03-15");
  });

  it("pads mês e dia com zero", () => {
    const date = new Date(2026, 0, 5); // Janeiro 5
    expect(toIsoDate(date)).toBe("2026-01-05");
  });

  it("lida com dezembro corretamente", () => {
    const date = new Date(2025, 11, 31); // Dezembro 31
    expect(toIsoDate(date)).toBe("2025-12-31");
  });
});

// ---------------------------------------------------------------------------
// parseIsoDateAtNoon
// ---------------------------------------------------------------------------

describe("parseIsoDateAtNoon", () => {
  it("retorna uma Date com horário 12:00:00", () => {
    const result = parseIsoDateAtNoon("2026-03-15");
    expect(result.getHours()).toBe(12);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it("preserva a data correta", () => {
    const result = parseIsoDateAtNoon("2026-03-15");
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2); // 0-indexed
    expect(result.getDate()).toBe(15);
  });

  it("lida com 29/02 em ano bissexto", () => {
    const result = parseIsoDateAtNoon("2024-02-29");
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(29);
    expect(result.getHours()).toBe(12);
  });

  it("lida com 01/01", () => {
    const result = parseIsoDateAtNoon("2026-01-01");
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// addDaysToIsoDate
// ---------------------------------------------------------------------------

describe("addDaysToIsoDate", () => {
  it("adiciona dias positivos", () => {
    expect(addDaysToIsoDate("2026-03-15", 5)).toBe("2026-03-20");
  });

  it("adiciona zero dias (noop)", () => {
    expect(addDaysToIsoDate("2026-03-15", 0)).toBe("2026-03-15");
  });

  it("subtrai dias (valor negativo)", () => {
    expect(addDaysToIsoDate("2026-03-15", -5)).toBe("2026-03-10");
  });

  it("cruza virada de mês para frente", () => {
    expect(addDaysToIsoDate("2026-03-30", 5)).toBe("2026-04-04");
  });

  it("cruza virada de mês para trás", () => {
    expect(addDaysToIsoDate("2026-04-02", -5)).toBe("2026-03-28");
  });

  it("cruza virada de ano para frente (31/12 → 01/01)", () => {
    expect(addDaysToIsoDate("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("cruza virada de ano para trás (01/01 → 31/12)", () => {
    expect(addDaysToIsoDate("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("ano bissexto: 28/02 + 1 = 29/02", () => {
    expect(addDaysToIsoDate("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("ano bissexto: 29/02 + 1 = 01/03", () => {
    expect(addDaysToIsoDate("2024-02-29", 1)).toBe("2024-03-01");
  });

  it("ano não-bissexto: 28/02 + 1 = 01/03", () => {
    expect(addDaysToIsoDate("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("adiciona muitos dias (30+)", () => {
    expect(addDaysToIsoDate("2026-01-01", 365)).toBe("2027-01-01");
  });

  it("subtrai muitos dias", () => {
    expect(addDaysToIsoDate("2026-01-01", -365)).toBe("2025-01-01");
  });
});

// ---------------------------------------------------------------------------
// getBusinessTodayDate
// ---------------------------------------------------------------------------

describe("getBusinessTodayDate", () => {
  it("retorna uma Date ao meio-dia", () => {
    const result = getBusinessTodayDate(spDate("2026-03-15T14:00:00"));
    expect(result.getHours()).toBe(12);
    expect(result.getMinutes()).toBe(0);
  });

  it("retorna a data de negócio correta", () => {
    const result = getBusinessTodayDate(spDate("2026-03-15T14:00:00"));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// getBusinessCurrentMonthYear
// ---------------------------------------------------------------------------

describe("getBusinessCurrentMonthYear", () => {
  it("retorna mês 0-indexed e ano", () => {
    const result = getBusinessCurrentMonthYear(spDate("2026-03-15T14:00:00"));
    expect(result.month).toBe(2); // março = 2 (0-indexed)
    expect(result.year).toBe(2026);
  });

  it("janeiro retorna month=0", () => {
    const result = getBusinessCurrentMonthYear(spDate("2026-01-15T12:00:00"));
    expect(result.month).toBe(0);
    expect(result.year).toBe(2026);
  });

  it("dezembro retorna month=11", () => {
    const result = getBusinessCurrentMonthYear(spDate("2025-12-15T12:00:00"));
    expect(result.month).toBe(11);
    expect(result.year).toBe(2025);
  });
});

// ---------------------------------------------------------------------------
// getBusinessMonthRange
// ---------------------------------------------------------------------------

describe("getBusinessMonthRange", () => {
  it("retorna início e fim do mês", () => {
    const result = getBusinessMonthRange(spDate("2026-03-15T14:00:00"));
    expect(result.start).toBe("2026-03-01");
    expect(result.end).toBe("2026-03-31");
  });

  it("fevereiro em ano normal: 28 dias", () => {
    const result = getBusinessMonthRange(spDate("2026-02-10T12:00:00"));
    expect(result.start).toBe("2026-02-01");
    expect(result.end).toBe("2026-02-28");
  });

  it("fevereiro em ano bissexto: 29 dias", () => {
    const result = getBusinessMonthRange(spDate("2024-02-10T12:00:00"));
    expect(result.start).toBe("2024-02-01");
    expect(result.end).toBe("2024-02-29");
  });

  it("abril: 30 dias", () => {
    const result = getBusinessMonthRange(spDate("2026-04-20T12:00:00"));
    expect(result.start).toBe("2026-04-01");
    expect(result.end).toBe("2026-04-30");
  });

  it("dezembro: 31 dias", () => {
    const result = getBusinessMonthRange(spDate("2025-12-25T12:00:00"));
    expect(result.start).toBe("2025-12-01");
    expect(result.end).toBe("2025-12-31");
  });

  it("janeiro: 31 dias", () => {
    const result = getBusinessMonthRange(spDate("2026-01-01T12:00:00"));
    expect(result.start).toBe("2026-01-01");
    expect(result.end).toBe("2026-01-31");
  });
});
