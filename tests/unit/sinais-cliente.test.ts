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
  it("baseline (cliente com plano não-recorrente e sem avaliações/convidados): 3 ativos + Fidelidade placeholder", () => {
    const sinais = buildSinaisCliente(baseInput());
    // 1 Contrato + 2 Frequência + 3 Pendência + 4 Fidelidade (placeholder)
    // Omitidos: Próx. cobrança (sem recorrência), Avaliação (sem histórico),
    // Convidados (plano não permite).
    expect(sinais.map((s) => s.key)).toEqual([
      "contrato",
      "frequencia",
      "pendencia",
      "fidelidade",
    ]);
    const desativados = sinais.filter((s) => s.disabled);
    expect(desativados).toHaveLength(1);
    expect(desativados[0].key).toBe("fidelidade");
  });

  it("Fidelidade permanece como placeholder 'Em breve' (decisão de produto)", () => {
    const s = buildSinaisCliente(baseInput()).find((x) => x.key === "fidelidade")!;
    expect(s.valor).toBe("Em breve");
    expect(s.tom).toBe("vazio");
    expect(s.disabled).toBe(true);
  });

  it("sinal Avaliação aparece quando temAvaliacoes=true", () => {
    const sinais = buildSinaisCliente(baseInput({ temAvaliacoes: true }));
    expect(sinais.some((s) => s.key === "avaliacao")).toBe(true);
  });

  it("sinal Convidados aparece quando planoPermiteConvidados=true", () => {
    const sinais = buildSinaisCliente(baseInput({ planoPermiteConvidados: true }));
    expect(sinais.some((s) => s.key === "convidados")).toBe(true);
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

    it("saldo positivo sem pendência → NÃO mostra 'Crédito' (mostra 'Sem pendência')", () => {
      // Regra (2026-04-25): saldo positivo é resultado de 'pago - aberto', não crédito real.
      // Crédito a favor (refund/sobra) virá em feature dedicada.
      const sinais = buildSinaisCliente(baseInput({ saldo: 50 }));
      const saldoSinal = sinais.find((x) => x.key === "saldo");
      expect(saldoSinal).toBeUndefined();
      const pendencia = sinais.find((x) => x.key === "pendencia")!;
      expect(pendencia.valor).toBe("Sem pendência");
      expect(pendencia.tom).toBe("ok");
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

    it("sem recorrência → sinal omitido (não poluir o rail)", () => {
      const s = buildSinaisCliente(baseInput()).find(
        (x) => x.key === "proxima-cobranca"
      );
      expect(s).toBeUndefined();
    });
  });
});
