import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { buildSinaisCliente, type BuildSinaisInput } from "@/app/(portal)/clientes/[id]/cliente-sinais-rail";

const HOJE = new Date(2026, 3, 20); // 2026-04-20 local

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(HOJE);
});

afterEach(() => {
  vi.useRealTimers();
});

function baseInput(overrides: Partial<BuildSinaisInput> = {}): BuildSinaisInput {
  return {
    planoAtivo: { dataFim: "2027-04-20" },
    planoAtivoInfo: { nome: "Anual Black" },
    presencas: [],
    pagamentos: [],
    saldo: 0,
    recorrente: null,
    ...overrides,
  };
}

describe("buildSinaisCliente", () => {
  it("retorna sempre 7 sinais: 4 ativos + 3 placeholders desabilitados", () => {
    const sinais = buildSinaisCliente(baseInput());
    expect(sinais).toHaveLength(7);

    const ativos = sinais.filter((s) => !s.disabled);
    const desativados = sinais.filter((s) => s.disabled);
    expect(ativos).toHaveLength(4);
    expect(desativados).toHaveLength(3);
  });

  it("slots desabilitados são Avaliação, Fidelidade e Convidados", () => {
    const sinais = buildSinaisCliente(baseInput());
    const desativados = sinais.filter((s) => s.disabled).map((s) => s.key);
    expect(desativados).toEqual(["avaliacao", "fidelidade", "convidados"]);
    for (const s of sinais.filter((s) => s.disabled)) {
      expect(s.valor).toBe("Em breve");
      expect(s.tom).toBe("vazio");
    }
  });

  describe("sinal de contrato", () => {
    it("contrato com 365 dias restantes → tom ok e valor em dias", () => {
      const s = buildSinaisCliente(baseInput()).find((x) => x.key === "contrato")!;
      expect(s.tom).toBe("ok");
      expect(s.valor).toMatch(/dia/);
      expect(s.hint).toBe("Anual Black");
    });

    it("contrato vence em 10 dias → tom atencao", () => {
      const s = buildSinaisCliente(
        baseInput({ planoAtivo: { dataFim: "2026-04-30" } })
      ).find((x) => x.key === "contrato")!;
      expect(s.tom).toBe("atencao");
      expect(s.valor).toBe("10 dias");
    });

    it("contrato vence hoje → valor 'Vence hoje'", () => {
      const s = buildSinaisCliente(
        baseInput({ planoAtivo: { dataFim: "2026-04-20" } })
      ).find((x) => x.key === "contrato")!;
      expect(s.valor).toBe("Vence hoje");
    });

    it("contrato vencido há 8 dias → tom critico", () => {
      const s = buildSinaisCliente(
        baseInput({ planoAtivo: { dataFim: "2026-04-12" } })
      ).find((x) => x.key === "contrato")!;
      expect(s.tom).toBe("critico");
      expect(s.valor).toBe("Venceu há 8d");
    });

    it("sem contrato → tom atencao, valor 'Sem contrato'", () => {
      const s = buildSinaisCliente(baseInput({ planoAtivo: null })).find(
        (x) => x.key === "contrato"
      )!;
      expect(s.tom).toBe("atencao");
      expect(s.valor).toBe("Sem contrato");
    });
  });

  describe("sinal de frequência", () => {
    it("zero treinos no mês corrente → tom critico", () => {
      const s = buildSinaisCliente(baseInput()).find((x) => x.key === "frequencia")!;
      expect(s.tom).toBe("critico");
      expect(s.valor).toBe("0 treinos");
      expect(s.hint).toBe("sem histórico");
    });

    it("2 treinos no mês → tom atencao", () => {
      const s = buildSinaisCliente(
        baseInput({ presencas: [{ data: "2026-04-10" }, { data: "2026-04-15" }] })
      ).find((x) => x.key === "frequencia")!;
      expect(s.tom).toBe("atencao");
      expect(s.valor).toBe("2 treinos");
      expect(s.hint).toContain("5d");
    });

    it(">= 4 treinos no mês → tom ok", () => {
      const s = buildSinaisCliente(
        baseInput({
          presencas: Array.from({ length: 5 }, (_, i) => ({
            data: `2026-04-${String(10 + i).padStart(2, "0")}`,
          })),
        })
      ).find((x) => x.key === "frequencia")!;
      expect(s.tom).toBe("ok");
      expect(s.valor).toBe("5 treinos");
    });

    it("última visita hoje exibe 'última visita hoje'", () => {
      const s = buildSinaisCliente(
        baseInput({
          presencas: [
            { data: "2026-04-10" },
            { data: "2026-04-15" },
            { data: "2026-04-20" },
            { data: "2026-04-20" },
          ],
        })
      ).find((x) => x.key === "frequencia")!;
      expect(s.hint).toBe("última visita hoje");
    });

    it("presenças em meses anteriores não contam para o mês corrente", () => {
      const s = buildSinaisCliente(
        baseInput({
          presencas: [
            { data: "2026-03-05" },
            { data: "2026-03-15" },
            { data: "2026-04-20" },
          ],
        })
      ).find((x) => x.key === "frequencia")!;
      expect(s.valor).toBe("1 treino");
    });
  });

  describe("sinal de pendência/saldo", () => {
    it("pagamentos vencidos com valores → pendência em R$ e tom critico", () => {
      const s = buildSinaisCliente(
        baseInput({
          pagamentos: [
            { status: "VENCIDO", dataVencimento: "2026-04-01", valor: 159.9 },
            { status: "VENCIDO", dataVencimento: "2026-04-10", valor: 159.9 },
          ],
        })
      ).find((x) => x.key === "pendencia")!;
      expect(s.tom).toBe("critico");
      expect(s.valor).toMatch(/R\$/);
      expect(s.hint).toContain("2 boletos");
    });

    it("saldo positivo sem pendência → mostra 'Crédito' com tom ok", () => {
      const s = buildSinaisCliente(baseInput({ saldo: 50 })).find(
        (x) => x.key === "saldo"
      )!;
      expect(s.label).toBe("Crédito");
      expect(s.tom).toBe("ok");
    });

    it("saldo negativo sem pendência → mostra 'Saldo devedor' com tom atencao", () => {
      const s = buildSinaisCliente(baseInput({ saldo: -50 })).find(
        (x) => x.key === "saldo"
      )!;
      expect(s.label).toBe("Saldo devedor");
      expect(s.tom).toBe("atencao");
    });

    it("sem pendência e saldo zero → mostra 'Sem pendência' com tom ok", () => {
      const s = buildSinaisCliente(baseInput()).find((x) => x.key === "pendencia")!;
      expect(s.valor).toBe("Sem pendência");
      expect(s.tom).toBe("ok");
    });
  });

  describe("sinal de próxima cobrança", () => {
    it("com recorrência → mostra data formatada e hint com valor BRL", () => {
      const s = buildSinaisCliente(
        baseInput({
          recorrente: {
            data: "2026-05-15",
            plano: { nome: "Mensal" },
            valor: 159.9,
          },
        })
      ).find((x) => x.key === "proxima-cobranca")!;
      expect(s.valor).toBe("15/05");
      expect(s.hint).toMatch(/R\$\s?159,90/);
      expect(s.tom).toBe("neutro");
    });

    it("sem recorrência → placeholder vazio", () => {
      const s = buildSinaisCliente(baseInput()).find(
        (x) => x.key === "proxima-cobranca"
      )!;
      expect(s.valor).toBe("—");
      expect(s.tom).toBe("vazio");
    });
  });
});
