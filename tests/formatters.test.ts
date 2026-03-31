import { describe, expect, it } from "vitest";
import {
  formatBRL,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercent,
} from "@/lib/shared/formatters";

describe("formatCurrency", () => {
  it("formats positive values as BRL", () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain("1.234,50");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0,00");
  });

  it("handles NaN gracefully by returning 0", () => {
    const result = formatCurrency(NaN);
    expect(result).toContain("0,00");
  });

  it("handles Infinity by returning 0", () => {
    const result = formatCurrency(Infinity);
    expect(result).toContain("0,00");
  });

  it("supports custom currency", () => {
    const result = formatCurrency(100, "USD");
    expect(result).toContain("100,00");
  });
});

describe("formatBRL", () => {
  it("is a shortcut for formatCurrency with BRL", () => {
    expect(formatBRL(99.9)).toBe(formatCurrency(99.9));
  });
});

describe("formatDate", () => {
  it("converts YYYY-MM-DD to dd/mm/yyyy", () => {
    expect(formatDate("2026-03-28")).toBe("28/03/2026");
  });

  it("returns original value for invalid format", () => {
    expect(formatDate("invalid")).toBe("invalid");
  });

  it("returns original value for empty string", () => {
    expect(formatDate("")).toBe("");
  });

  it("handles single-digit month and day", () => {
    expect(formatDate("2026-01-05")).toBe("05/01/2026");
  });
});

describe("formatDateTime", () => {
  it("formats ISO datetime to pt-BR", () => {
    const result = formatDateTime("2026-03-28T14:30:00Z");
    expect(result).toMatch(/28\/03\/2026/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe("formatPercent", () => {
  it("formats number as percentage with 1 decimal", () => {
    const result = formatPercent(12.5);
    expect(result).toContain("12,5%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toContain("0,0%");
  });

  it("formats whole numbers with .0", () => {
    const result = formatPercent(100);
    expect(result).toContain("100,0%");
  });
});
