import { describe, expect, it } from "vitest";
import {
  diasPara,
  statusContaDe,
  findCategoria,
  CATEGORIAS_PAGAR,
  CATEGORIAS_RECEBER,
} from "@/lib/finance/contas-status";

describe("diasPara", () => {
  it("data futura devolve delta positivo", () => {
    expect(diasPara("2026-04-25", "2026-04-23")).toBe(2);
  });

  it("data passada devolve delta negativo", () => {
    expect(diasPara("2026-04-20", "2026-04-23")).toBe(-3);
  });

  it("mesma data devolve 0", () => {
    expect(diasPara("2026-04-23", "2026-04-23")).toBe(0);
  });

  it("atravessa mes sem off-by-one", () => {
    expect(diasPara("2026-05-01", "2026-04-28")).toBe(3);
  });

  it("atravessa ano sem off-by-one", () => {
    expect(diasPara("2027-01-01", "2026-12-31")).toBe(1);
  });

  it("ignora DST (ancorado em UTC)", () => {
    // No Brasil 2026 nao ha DST, mas o helper deve ser robusto
    // se alguem mudar o timezone do SO.
    expect(diasPara("2026-10-20", "2026-10-19")).toBe(1);
    expect(diasPara("2026-11-02", "2026-11-01")).toBe(1);
  });
});

describe("statusContaDe", () => {
  const TODAY = "2026-04-23";

  it("backend PAGA mapeia direto pra pago (independente da data)", () => {
    const r = statusContaDe({ status: "PAGA", dataVencimento: "2026-04-10" }, TODAY);
    expect(r).toBe("pago");
  });

  it("backend RECEBIDA (contas a receber) tambem vira pago", () => {
    const r = statusContaDe({ status: "RECEBIDA", dataVencimento: "2026-04-10" }, TODAY);
    expect(r).toBe("pago");
  });

  it("backend CANCELADA vira agendado (ignora data)", () => {
    const r = statusContaDe({ status: "CANCELADA", dataVencimento: "2026-04-10" }, TODAY);
    expect(r).toBe("agendado");
  });

  it("vencimento no passado e status PENDENTE -> vencido", () => {
    const r = statusContaDe({ status: "PENDENTE", dataVencimento: "2026-04-20" }, TODAY);
    expect(r).toBe("vencido");
  });

  it("vencimento hoje -> hoje", () => {
    const r = statusContaDe({ status: "PENDENTE", dataVencimento: TODAY }, TODAY);
    expect(r).toBe("hoje");
  });

  it("vencimento em 1 dia -> proximo", () => {
    const r = statusContaDe({ status: "PENDENTE", dataVencimento: "2026-04-24" }, TODAY);
    expect(r).toBe("proximo");
  });

  it("vencimento em 3 dias (limite inclusivo) -> proximo", () => {
    const r = statusContaDe({ status: "PENDENTE", dataVencimento: "2026-04-26" }, TODAY);
    expect(r).toBe("proximo");
  });

  it("vencimento em 4 dias -> agendado", () => {
    const r = statusContaDe({ status: "PENDENTE", dataVencimento: "2026-04-27" }, TODAY);
    expect(r).toBe("agendado");
  });

  it("case-insensitive no status backend", () => {
    const r = statusContaDe({ status: "paga", dataVencimento: "2026-04-10" }, TODAY);
    expect(r).toBe("pago");
  });
});

describe("CATEGORIAS e findCategoria", () => {
  it("CATEGORIAS_PAGAR expoe os 9 ids esperados", () => {
    expect(CATEGORIAS_PAGAR.map((c) => c.id)).toEqual([
      "ALUGUEL",
      "UTILIDADES",
      "FOLHA",
      "EQUIPAMENTOS",
      "MARKETING",
      "FORNECEDORES",
      "IMPOSTOS",
      "MANUTENCAO",
      "OUTROS",
    ]);
  });

  it("CATEGORIAS_RECEBER usa os 5 ids do backend", () => {
    expect(CATEGORIAS_RECEBER.map((c) => c.id)).toEqual([
      "MENSALIDADE",
      "MATRICULA",
      "SERVICO",
      "PRODUTO",
      "AVULSO",
    ]);
  });

  it("toda categoria tem cor hexadecimal valida", () => {
    for (const c of [...CATEGORIAS_PAGAR, ...CATEGORIAS_RECEBER]) {
      expect(c.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("findCategoria retorna undefined pra id desconhecido", () => {
    expect(findCategoria(CATEGORIAS_PAGAR, "INEXISTENTE")).toBeUndefined();
  });

  it("findCategoria retorna entrada correta", () => {
    expect(findCategoria(CATEGORIAS_PAGAR, "FOLHA")?.nome).toBe("Folha de pagamento");
  });
});
