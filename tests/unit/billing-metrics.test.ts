import { describe, expect, it } from "vitest";
import {
  calculateBillingMetrics,
  normalizeValorMensal,
} from "@/lib/tenant/billing/metrics";
import type { Assinatura } from "@/lib/types";

function makeAssinatura(overrides: Partial<Assinatura>): Assinatura {
  return {
    id: "a1",
    tenantId: "t1",
    alunoId: "al1",
    planoId: "p1",
    status: "ATIVA",
    valor: 100,
    ciclo: "MENSAL",
    dataInicio: "2026-01-01",
    ...overrides,
  } as Assinatura;
}

describe("billing/metrics", () => {
  describe("normalizeValorMensal", () => {
    it("MENSAL retorna valor cru", () => {
      expect(normalizeValorMensal(100, "MENSAL")).toBe(100);
    });

    it("TRIMESTRAL divide por 3", () => {
      expect(normalizeValorMensal(300, "TRIMESTRAL")).toBe(100);
    });

    it("SEMESTRAL divide por 6", () => {
      expect(normalizeValorMensal(600, "SEMESTRAL")).toBe(100);
    });

    it("ANUAL divide por 12", () => {
      expect(normalizeValorMensal(1200, "ANUAL")).toBe(100);
    });

    it("valor inválido → 0", () => {
      expect(normalizeValorMensal(NaN, "MENSAL")).toBe(0);
      expect(normalizeValorMensal(-10, "MENSAL")).toBe(0);
    });
  });

  describe("calculateBillingMetrics", () => {
    it("lista vazia → zeros", () => {
      const result = calculateBillingMetrics([]);
      expect(result.mrr).toBe(0);
      expect(result.arr).toBe(0);
      expect(result.ticketMedio).toBe(0);
      expect(result.churnRate).toBe(0);
      expect(result.inadimplenciaRate).toBe(0);
      expect(result.valorEmRisco).toBe(0);
      expect(result.total).toBe(0);
      expect(result.counts.ATIVA).toBe(0);
    });

    it("MRR soma apenas assinaturas ATIVA normalizadas", () => {
      const result = calculateBillingMetrics([
        makeAssinatura({ status: "ATIVA", valor: 100, ciclo: "MENSAL" }),
        makeAssinatura({ status: "ATIVA", valor: 300, ciclo: "TRIMESTRAL" }),
        makeAssinatura({ status: "CANCELADA", valor: 100, ciclo: "MENSAL" }),
      ]);
      // 100 (mensal) + 100 (300/3 trimestral) = 200
      expect(result.mrr).toBe(200);
      expect(result.arr).toBe(2400);
    });

    it("ticket médio = MRR / count ATIVA", () => {
      const result = calculateBillingMetrics([
        makeAssinatura({ status: "ATIVA", valor: 150 }),
        makeAssinatura({ status: "ATIVA", valor: 250 }),
      ]);
      expect(result.ticketMedio).toBe(200);
    });

    it("churn rate = CANCELADA / (CANCELADA + ATIVA + SUSPENSA)", () => {
      const result = calculateBillingMetrics([
        makeAssinatura({ status: "ATIVA" }),
        makeAssinatura({ status: "ATIVA" }),
        makeAssinatura({ status: "ATIVA" }),
        makeAssinatura({ status: "CANCELADA" }),
      ]);
      // 1 / (1 + 3 + 0) = 25%
      expect(result.churnRate).toBe(25);
    });

    it("churn considera SUSPENSA na base", () => {
      const result = calculateBillingMetrics([
        makeAssinatura({ status: "ATIVA" }),
        makeAssinatura({ status: "SUSPENSA" }),
        makeAssinatura({ status: "CANCELADA" }),
      ]);
      // 1 / 3 ≈ 33.33
      expect(result.churnRate).toBeCloseTo(33.33, 1);
    });

    it("inadimplencia rate = VENCIDA / (VENCIDA + ATIVA)", () => {
      const result = calculateBillingMetrics([
        makeAssinatura({ status: "ATIVA" }),
        makeAssinatura({ status: "ATIVA" }),
        makeAssinatura({ status: "ATIVA" }),
        makeAssinatura({ status: "VENCIDA" }),
      ]);
      // 1 / (1 + 3) = 25%
      expect(result.inadimplenciaRate).toBe(25);
    });

    it("valorEmRisco soma VENCIDA + SUSPENSA normalizadas", () => {
      const result = calculateBillingMetrics([
        makeAssinatura({ status: "VENCIDA", valor: 200, ciclo: "MENSAL" }),
        makeAssinatura({ status: "SUSPENSA", valor: 600, ciclo: "SEMESTRAL" }),
        makeAssinatura({ status: "ATIVA", valor: 999 }),
      ]);
      // 200 (mensal) + 100 (600/6 semestral) = 300
      expect(result.valorEmRisco).toBe(300);
    });

    it("counts por status", () => {
      const result = calculateBillingMetrics([
        makeAssinatura({ status: "ATIVA" }),
        makeAssinatura({ status: "ATIVA" }),
        makeAssinatura({ status: "PENDENTE" }),
        makeAssinatura({ status: "CANCELADA" }),
        makeAssinatura({ status: "VENCIDA" }),
        makeAssinatura({ status: "SUSPENSA" }),
      ]);
      expect(result.counts).toEqual({
        ATIVA: 2,
        PENDENTE: 1,
        CANCELADA: 1,
        SUSPENSA: 1,
        VENCIDA: 1,
      });
      expect(result.total).toBe(6);
    });

    it("sem ATIVA → ticket médio = 0 (sem divisão por zero)", () => {
      const result = calculateBillingMetrics([
        makeAssinatura({ status: "CANCELADA" }),
      ]);
      expect(result.ticketMedio).toBe(0);
      expect(result.mrr).toBe(0);
    });

    it("sem base churn → churnRate = 0", () => {
      const result = calculateBillingMetrics([
        makeAssinatura({ status: "PENDENTE" }),
        makeAssinatura({ status: "VENCIDA" }),
      ]);
      expect(result.churnRate).toBe(0);
    });

    it("ANUAL é normalizada (valor/12)", () => {
      const result = calculateBillingMetrics([
        makeAssinatura({ status: "ATIVA", valor: 1200, ciclo: "ANUAL" }),
      ]);
      expect(result.mrr).toBe(100);
      expect(result.arr).toBe(1200);
    });
  });
});
