import { describe, expect, it } from "vitest";
import {
  computeRiscoEvasao,
  computeTendenciaRisco,
  RISCO_VERSION,
  type RiscoEvasaoInput,
} from "@/lib/domain/risco-evasao";
import type { Aluno } from "@/lib/shared/types";

const HOJE = new Date(2026, 3, 20); // 2026-04-20 local

function makeAluno(overrides: Partial<Aluno> = {}): Aluno {
  return {
    id: "a-1",
    tenantId: "t-1",
    nome: "X",
    email: "x@x.com",
    telefone: "0",
    cpf: "0",
    dataNascimento: "1990-01-01",
    sexo: "F",
    status: "ATIVO",
    dataCadastro: "2023-01-01T00:00:00",
    ...overrides,
  };
}

function baseInput(overrides: Partial<RiscoEvasaoInput> = {}): RiscoEvasaoInput {
  return {
    aluno: makeAluno(),
    suspenso: false,
    pendenteFinanceiro: false,
    planoAtivo: { dataFim: "2027-04-20" },
    pagamentos: [],
    presencas: [],
    hoje: HOJE,
    ...overrides,
  };
}

describe("computeRiscoEvasao", () => {
  it("retorna versão estável da fórmula", () => {
    expect(computeRiscoEvasao(baseInput()).version).toBe(RISCO_VERSION);
  });

  describe("rótulos por faixa de score", () => {
    it("score < 40 → Baixo", () => {
      // apenas frequência baixa (+30), nenhum outro fator → score 30
      const out = computeRiscoEvasao(baseInput());
      expect(out.score).toBe(30);
      expect(out.label).toBe("Baixo");
    });

    it("score 40-69 → Médio", () => {
      // frequência baixa (30) + sem visita há 15 dias (25) = 55
      const out = computeRiscoEvasao(
        baseInput({ presencas: [{ data: "2026-04-05" }] })
      );
      expect(out.score).toBe(55);
      expect(out.label).toBe("Médio");
    });

    it("score >= 70 → Alto", () => {
      // frequência baixa (30) + sem visita (25) + pendência (20) = 75
      const out = computeRiscoEvasao(
        baseInput({
          presencas: [{ data: "2026-04-05" }],
          pendenteFinanceiro: true,
          pagamentos: [{ status: "VENCIDO", dataVencimento: "2026-04-01", valor: 100 }],
        })
      );
      expect(out.score).toBe(75);
      expect(out.label).toBe("Alto");
    });
  });

  describe("fatores individuais", () => {
    it("cliente suspenso contribui +50", () => {
      const out = computeRiscoEvasao(
        baseInput({
          suspenso: true,
          aluno: makeAluno({ status: "SUSPENSO" }),
          presencas: Array.from({ length: 10 }, (_, i) => ({
            data: `2026-04-${String(10 + i).padStart(2, "0")}`,
          })),
        })
      );
      expect(out.fatores.find((f) => f.key === "suspenso")).toMatchObject({
        peso: 50,
        sinal: "negativo",
      });
    });

    it("contrato vencido contribui +40", () => {
      const out = computeRiscoEvasao(
        baseInput({
          planoAtivo: { dataFim: "2026-04-10" },
          presencas: Array.from({ length: 10 }, (_, i) => ({
            data: `2026-04-${String(10 + i).padStart(2, "0")}`,
          })),
        })
      );
      const f = out.fatores.find((x) => x.key === "contrato-vencido");
      expect(f?.peso).toBe(40);
    });

    it("contrato vence em ≤ 14 dias contribui +10", () => {
      const out = computeRiscoEvasao(
        baseInput({
          planoAtivo: { dataFim: "2026-04-30" },
          presencas: Array.from({ length: 10 }, (_, i) => ({
            data: `2026-04-${String(10 + i).padStart(2, "0")}`,
          })),
        })
      );
      const f = out.fatores.find((x) => x.key === "contrato-vence-logo");
      expect(f?.peso).toBe(10);
    });

    it("pendência financeira contribui +20 e enumera boletos vencidos", () => {
      const out = computeRiscoEvasao(
        baseInput({
          pendenteFinanceiro: true,
          pagamentos: [
            { status: "VENCIDO", dataVencimento: "2026-04-01", valor: 100 },
            { status: "VENCIDO", dataVencimento: "2026-04-10", valor: 150 },
          ],
          presencas: Array.from({ length: 10 }, (_, i) => ({
            data: `2026-04-${String(10 + i).padStart(2, "0")}`,
          })),
        })
      );
      const f = out.fatores.find((x) => x.key === "pendencia");
      expect(f?.peso).toBe(20);
      expect(f?.label).toContain("2 boletos");
    });

    it("frequência mensal < 3 contribui +30", () => {
      const out = computeRiscoEvasao(baseInput({ presencas: [{ data: "2026-04-15" }] }));
      const f = out.fatores.find((x) => x.key === "frequencia-baixa");
      expect(f?.peso).toBe(30);
    });

    it("frequência mensal >= 12 contribui -15 (positivo)", () => {
      const out = computeRiscoEvasao(
        baseInput({
          presencas: Array.from({ length: 12 }, (_, i) => ({
            data: `2026-04-${String(1 + i).padStart(2, "0")}`,
          })),
        })
      );
      const f = out.fatores.find((x) => x.key === "frequencia-alta");
      expect(f).toMatchObject({ peso: 15, sinal: "positivo" });
    });

    it("sem visita há > 10 dias contribui +25", () => {
      const out = computeRiscoEvasao(
        baseInput({
          presencas: [{ data: "2026-04-05" }], // 15 dias atrás
        })
      );
      const f = out.fatores.find((x) => x.key === "sem-visita-recente");
      expect(f?.peso).toBe(25);
      expect(f?.label).toContain("15 dias");
    });
  });

  describe("clamps e estados especiais", () => {
    it("score nunca passa de 100 mesmo acumulando fatores", () => {
      const out = computeRiscoEvasao(
        baseInput({
          suspenso: true, // +50
          aluno: makeAluno({ status: "SUSPENSO" }),
          planoAtivo: { dataFim: "2026-04-10" }, // +40 (vencido)
          pendenteFinanceiro: true, // +20
          pagamentos: [{ status: "VENCIDO", dataVencimento: "2026-04-01", valor: 100 }],
          presencas: [], // +30 (baixa freq)
          // total teórico: 140 → clamp 100
        })
      );
      expect(out.score).toBe(100);
      expect(out.label).toBe("Alto");
    });

    it("frequência alta compensa parcialmente outros negativos", () => {
      const out = computeRiscoEvasao(
        baseInput({
          pendenteFinanceiro: true, // +20
          pagamentos: [{ status: "VENCIDO", dataVencimento: "2026-04-01", valor: 100 }],
          presencas: Array.from({ length: 12 }, (_, i) => ({
            data: `2026-04-${String(1 + i).padStart(2, "0")}`,
          })), // -15
        })
      );
      expect(out.score).toBe(5); // 20 - 15
      expect(out.label).toBe("Baixo");
    });

    it("cliente INATIVO retorna score 0 sem fatores e temDadosSuficientes=false", () => {
      const out = computeRiscoEvasao(
        baseInput({ aluno: makeAluno({ status: "INATIVO" }), suspenso: true })
      );
      expect(out.score).toBe(0);
      expect(out.fatores).toHaveLength(0);
      expect(out.temDadosSuficientes).toBe(false);
    });

    it("cliente CANCELADO retorna score 0 sem fatores", () => {
      const out = computeRiscoEvasao(baseInput({ aluno: makeAluno({ status: "CANCELADO" }) }));
      expect(out.score).toBe(0);
      expect(out.temDadosSuficientes).toBe(false);
    });

    it("menos de 2 fatores avaliados → temDadosSuficientes=false", () => {
      const out = computeRiscoEvasao(
        baseInput({
          presencas: Array.from({ length: 5 }, (_, i) => ({
            data: `2026-04-${String(10 + i).padStart(2, "0")}`,
          })), // apenas frequência não gera fator (nem baixa nem alta), última visita OK
        })
      );
      expect(out.fatores).toHaveLength(0);
      expect(out.temDadosSuficientes).toBe(false);
    });
  });

  describe("ordenação de fatores", () => {
    it("fatores retornados em ordem decrescente de peso", () => {
      const out = computeRiscoEvasao(
        baseInput({
          suspenso: true, // 50
          aluno: makeAluno({ status: "SUSPENSO" }),
          pendenteFinanceiro: true, // 20
          pagamentos: [{ status: "VENCIDO", dataVencimento: "2026-04-01", valor: 100 }],
          presencas: [], // 30 baixa freq
        })
      );
      const pesos = out.fatores.map((f) => f.peso);
      const ordenado = [...pesos].sort((a, b) => b - a);
      expect(pesos).toEqual(ordenado);
    });
  });
});

describe("computeTendenciaRisco", () => {
  it("retorna null quando não há nenhuma presença", () => {
    const r = computeTendenciaRisco({ presencas: [], hoje: HOJE });
    expect(r).toBeNull();
  });

  it("retorna array de 7 elementos com presenças", () => {
    const r = computeTendenciaRisco({
      presencas: [{ data: "2026-04-15" }],
      hoje: HOJE,
    });
    expect(r).toHaveLength(7);
    r?.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(20);
      expect(v).toBeLessThanOrEqual(60);
    });
  });

  it("semanas com mais presenças têm score menor (menor risco)", () => {
    const r = computeTendenciaRisco({
      presencas: [
        // Última semana (hoje 20/04 → janela 14/04–20/04): 3 presenças → score 24
        { data: "2026-04-14" },
        { data: "2026-04-16" },
        { data: "2026-04-18" },
        // Semana anterior (07/04–13/04): 0 presenças → score 60
      ],
      hoje: HOJE,
    })!;
    expect(r[6]).toBeLessThan(r[5]);
  });
});
