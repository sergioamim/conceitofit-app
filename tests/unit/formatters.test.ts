import { describe, expect, it } from "vitest";
import {
  formatBRL,
  formatCpf,
  formatCurrency,
  formatDate,
  formatDateBR,
  formatDateTime,
  formatDateTimeBR,
  formatPercent,
  formatPhone,
  formatRelativeTime,
} from "@/lib/formatters";

describe("formatters", () => {
  describe("formatCurrency / formatBRL", () => {
    it("formata número em BRL com prefixo R$", () => {
      expect(formatCurrency(1234.5)).toMatch(/R\$\s*1\.234,50/);
      expect(formatBRL(99.9)).toMatch(/R\$\s*99,90/);
    });

    it("trata zero e valores negativos", () => {
      expect(formatCurrency(0)).toMatch(/R\$\s*0,00/);
      // pt-BR formata negativos como "-R$ 150,00" (sinal antes do simbolo)
      expect(formatCurrency(-150)).toMatch(/-R\$\s*150,00/);
    });

    it("retorna R$ 0,00 para valores não finitos", () => {
      expect(formatCurrency(Number.NaN)).toMatch(/R\$\s*0,00/);
      expect(formatCurrency(Number.POSITIVE_INFINITY)).toMatch(/R\$\s*0,00/);
    });

    it("aceita outras moedas", () => {
      expect(formatCurrency(100, "USD")).toContain("US$");
    });
  });

  describe("formatDate", () => {
    it("converte YYYY-MM-DD para dd/mm/yyyy", () => {
      expect(formatDate("2026-04-10")).toBe("10/04/2026");
      expect(formatDate("2024-01-01")).toBe("01/01/2024");
    });

    it("retorna string vazia para null/undefined/vazio", () => {
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
      expect(formatDate("")).toBe("");
      expect(formatDate("   ")).toBe("");
    });

    it("retorna o valor original se formato inválido", () => {
      expect(formatDate("invalido")).toBe("invalido");
      expect(formatDate("2026/04/10")).toBe("2026/04/10");
    });

    it("ignora valores não-string", () => {
      // @ts-expect-error — testando defensivo
      expect(formatDate(12345)).toBe("");
    });
  });

  describe("formatDateTime", () => {
    it("formata ISO datetime para dd/mm/yyyy HH:mm", () => {
      const result = formatDateTime("2026-04-10T14:30:00Z");
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}.*\d{2}:\d{2}/);
    });

    it("retorna string vazia para null/undefined", () => {
      expect(formatDateTime(null)).toBe("");
      expect(formatDateTime(undefined)).toBe("");
      expect(formatDateTime("")).toBe("");
    });

    it("retorna valor original para data inválida", () => {
      expect(formatDateTime("not-a-date")).toBe("not-a-date");
    });
  });

  describe("formatCpf", () => {
    it("formata CPF com 11 dígitos", () => {
      expect(formatCpf("12345678901")).toBe("123.456.789-01");
    });

    it("remove caracteres não numéricos antes de formatar", () => {
      expect(formatCpf("123.456.789-01")).toBe("123.456.789-01");
    });

    it("retorna o valor original se não tiver 11 dígitos", () => {
      expect(formatCpf("123")).toBe("123");
      expect(formatCpf("")).toBe("");
    });
  });

  describe("formatPhone", () => {
    it("formata celular (11 dígitos) com DDD", () => {
      expect(formatPhone("11999990000")).toBe("(11) 99999-0000");
    });

    it("formata fixo (10 dígitos) com DDD", () => {
      expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
    });

    it("retorna o valor original se não tiver 10 ou 11 dígitos", () => {
      expect(formatPhone("999")).toBe("999");
    });

    it("retorna string vazia para null/undefined", () => {
      expect(formatPhone(null)).toBe("");
      expect(formatPhone(undefined)).toBe("");
    });
  });

  describe("formatPercent", () => {
    it("formata número com 1 casa decimal e sufixo %", () => {
      expect(formatPercent(12.5)).toBe("12,5%");
      expect(formatPercent(0)).toBe("0,0%");
      expect(formatPercent(100)).toBe("100,0%");
    });

    it("arredonda para 1 casa", () => {
      expect(formatPercent(12.56)).toBe("12,6%");
    });
  });

  describe("formatDateBR", () => {
    it("formata Date em dd/mm/yyyy", () => {
      const date = new Date(2026, 3, 10); // 10 abril 2026 (mês 0-indexed)
      expect(formatDateBR(date)).toBe("10/04/2026");
    });

    it("aceita string ISO", () => {
      expect(formatDateBR("2026-04-10T00:00:00")).toMatch(/\d{2}\/\d{2}\/2026/);
    });

    it("aceita timestamp number", () => {
      const ts = new Date(2026, 0, 15).getTime();
      expect(formatDateBR(ts)).toBe("15/01/2026");
    });

    it('retorna "—" para null/undefined/inválido', () => {
      expect(formatDateBR(null)).toBe("—");
      expect(formatDateBR(undefined)).toBe("—");
      expect(formatDateBR("invalid")).toBe("—");
    });
  });

  describe("formatDateTimeBR", () => {
    it("formata Date em dd/mm/yyyy HH:mm", () => {
      const date = new Date(2026, 3, 10, 14, 30);
      expect(formatDateTimeBR(date)).toBe("10/04/2026 14:30");
    });

    it('retorna "—" para null/inválido', () => {
      expect(formatDateTimeBR(null)).toBe("—");
      expect(formatDateTimeBR("not-date")).toBe("—");
    });

    it("padda zeros em horas/minutos single-digit", () => {
      const date = new Date(2026, 0, 1, 5, 9);
      expect(formatDateTimeBR(date)).toBe("01/01/2026 05:09");
    });
  });

  describe("formatRelativeTime", () => {
    it("retorna string não vazia para Date recente", () => {
      const result = formatRelativeTime(new Date());
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("aceita string ISO", () => {
      const result = formatRelativeTime("2020-01-01T00:00:00Z");
      expect(result).toBeTruthy();
    });
  });
});
