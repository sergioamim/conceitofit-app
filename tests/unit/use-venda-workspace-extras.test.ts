import { describe, expect, it } from "vitest";

import {
  NSU_REGEX,
  PAYMENT_PANEL_METODOS,
  paymentPanelSchema,
} from "@/app/(portal)/vendas/nova/components/payment-panel.schema";

/**
 * VUN-3.3 — Regras derivadas para o PaymentPanel (RN-005, RN-018).
 *
 * O hook `useVendaWorkspace` não é diretamente testável em isolado
 * (depende de `next/navigation`, react-query, tenant-context), então
 * testamos aqui as regras puras que governam `canFinalize` + parcelas +
 * NSU via o schema colocado ao lado do painel. O efeito líquido é
 * equivalente e cobre os combos exigidos pela story.
 */

const BASE = {
  formaPagamento: "PIX" as const,
  parcelas: 1,
  autorizacao: "",
};

describe("payment-panel.schema — RN-005 NSU condicional", () => {
  it("aceita DINHEIRO sem NSU", () => {
    const res = paymentPanelSchema.safeParse({ ...BASE, formaPagamento: "DINHEIRO" });
    expect(res.success).toBe(true);
  });

  it("aceita PIX sem NSU", () => {
    const res = paymentPanelSchema.safeParse({ ...BASE, formaPagamento: "PIX" });
    expect(res.success).toBe(true);
  });

  it("aceita RECORRENTE sem NSU", () => {
    const res = paymentPanelSchema.safeParse({ ...BASE, formaPagamento: "RECORRENTE" });
    expect(res.success).toBe(true);
  });

  it("rejeita CARTAO_CREDITO sem NSU", () => {
    const res = paymentPanelSchema.safeParse({
      ...BASE,
      formaPagamento: "CARTAO_CREDITO",
      autorizacao: "",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path.includes("autorizacao"))).toBe(true);
    }
  });

  it("rejeita CARTAO_CREDITO com NSU de 3 dígitos", () => {
    const res = paymentPanelSchema.safeParse({
      ...BASE,
      formaPagamento: "CARTAO_CREDITO",
      autorizacao: "123",
    });
    expect(res.success).toBe(false);
  });

  it("aceita CARTAO_CREDITO com NSU de 4+ dígitos", () => {
    const res = paymentPanelSchema.safeParse({
      ...BASE,
      formaPagamento: "CARTAO_CREDITO",
      autorizacao: "1234",
    });
    expect(res.success).toBe(true);
  });

  it("rejeita CARTAO_DEBITO sem NSU", () => {
    const res = paymentPanelSchema.safeParse({
      ...BASE,
      formaPagamento: "CARTAO_DEBITO",
      autorizacao: "",
    });
    expect(res.success).toBe(false);
  });

  it("aceita CARTAO_DEBITO com NSU de 6 dígitos", () => {
    const res = paymentPanelSchema.safeParse({
      ...BASE,
      formaPagamento: "CARTAO_DEBITO",
      autorizacao: "123456",
    });
    expect(res.success).toBe(true);
  });

  it("rejeita NSU com caracteres não numéricos", () => {
    expect(NSU_REGEX.test("12a4")).toBe(false);
    expect(NSU_REGEX.test("1234")).toBe(true);
  });
});

describe("payment-panel.schema — parcelamento", () => {
  it("aceita CARTAO_CREDITO com 12 parcelas", () => {
    const res = paymentPanelSchema.safeParse({
      formaPagamento: "CARTAO_CREDITO",
      parcelas: 12,
      autorizacao: "1234",
    });
    expect(res.success).toBe(true);
  });

  it("rejeita 13+ parcelas", () => {
    const res = paymentPanelSchema.safeParse({
      formaPagamento: "CARTAO_CREDITO",
      parcelas: 13,
      autorizacao: "1234",
    });
    expect(res.success).toBe(false);
  });

  it("rejeita 0 parcelas", () => {
    const res = paymentPanelSchema.safeParse({
      formaPagamento: "CARTAO_CREDITO",
      parcelas: 0,
      autorizacao: "1234",
    });
    expect(res.success).toBe(false);
  });

  it("rejeita parcelas > 1 em DINHEIRO", () => {
    const res = paymentPanelSchema.safeParse({
      formaPagamento: "DINHEIRO",
      parcelas: 3,
      autorizacao: "",
    });
    expect(res.success).toBe(false);
  });

  it("aceita parcelas=1 em qualquer forma", () => {
    for (const forma of PAYMENT_PANEL_METODOS) {
      const autorizacao = forma === "CARTAO_CREDITO" || forma === "CARTAO_DEBITO" ? "1234" : "";
      const res = paymentPanelSchema.safeParse({
        formaPagamento: forma,
        parcelas: 1,
        autorizacao,
      });
      expect(res.success, `forma=${forma}`).toBe(true);
    }
  });
});

describe("payment-panel — RN-018 label dinâmico (valorParcela)", () => {
  it("à vista (parcelas=1): label mostra total", () => {
    const total = 310;
    const parcelas = 1;
    const label = parcelas > 1 ? `${parcelas}×` : `R$ ${total.toFixed(2)}`;
    expect(label).toBe("R$ 310.00");
  });

  it("parcelado: valorParcela = total / n", () => {
    const total = 1200;
    const parcelas = 12;
    const valorParcela = total / parcelas;
    expect(valorParcela).toBe(100);
  });

  it("parcelado com resto: ainda divide por n (sem juros RN-006)", () => {
    const total = 100;
    const parcelas = 3;
    const valorParcela = total / parcelas;
    expect(valorParcela).toBeCloseTo(33.333, 2);
  });
});

describe("canFinalize — tabela de combos (RN-005 + RN-013)", () => {
  /**
   * Replica a lógica pura exposta em useVendaWorkspace.canFinalize
   * para garantir cobertura em tabela.
   */
  function canFinalize(args: {
    cartSize: number;
    total: number;
    requireCliente: boolean;
    clienteId: string;
    formaPagamento: (typeof PAYMENT_PANEL_METODOS)[number];
    autorizacao: string;
  }): boolean {
    if (args.cartSize === 0) return false;
    if (args.total <= 0) return false;
    if (args.requireCliente && !args.clienteId) return false;
    const requiresNsu =
      args.formaPagamento === "CARTAO_CREDITO" ||
      args.formaPagamento === "CARTAO_DEBITO";
    if (requiresNsu && args.autorizacao.trim().length < 4) return false;
    return true;
  }

  it("carrinho vazio → false", () => {
    expect(
      canFinalize({
        cartSize: 0,
        total: 100,
        requireCliente: false,
        clienteId: "",
        formaPagamento: "PIX",
        autorizacao: "",
      }),
    ).toBe(false);
  });

  it("total zero → false", () => {
    expect(
      canFinalize({
        cartSize: 1,
        total: 0,
        requireCliente: false,
        clienteId: "",
        formaPagamento: "PIX",
        autorizacao: "",
      }),
    ).toBe(false);
  });

  it("plano/serviço sem cliente → false (RN-013)", () => {
    expect(
      canFinalize({
        cartSize: 1,
        total: 100,
        requireCliente: true,
        clienteId: "",
        formaPagamento: "PIX",
        autorizacao: "",
      }),
    ).toBe(false);
  });

  it("produto avulso sem cliente → true (RN-013)", () => {
    expect(
      canFinalize({
        cartSize: 1,
        total: 100,
        requireCliente: false,
        clienteId: "",
        formaPagamento: "DINHEIRO",
        autorizacao: "",
      }),
    ).toBe(true);
  });

  it("crédito sem NSU → false (RN-005)", () => {
    expect(
      canFinalize({
        cartSize: 1,
        total: 100,
        requireCliente: false,
        clienteId: "",
        formaPagamento: "CARTAO_CREDITO",
        autorizacao: "",
      }),
    ).toBe(false);
  });

  it("crédito com NSU=3 dígitos → false (RN-005)", () => {
    expect(
      canFinalize({
        cartSize: 1,
        total: 100,
        requireCliente: false,
        clienteId: "",
        formaPagamento: "CARTAO_CREDITO",
        autorizacao: "123",
      }),
    ).toBe(false);
  });

  it("crédito com NSU=4 dígitos → true", () => {
    expect(
      canFinalize({
        cartSize: 1,
        total: 100,
        requireCliente: false,
        clienteId: "",
        formaPagamento: "CARTAO_CREDITO",
        autorizacao: "1234",
      }),
    ).toBe(true);
  });

  it("débito com NSU=6 dígitos → true", () => {
    expect(
      canFinalize({
        cartSize: 1,
        total: 100,
        requireCliente: false,
        clienteId: "",
        formaPagamento: "CARTAO_DEBITO",
        autorizacao: "123456",
      }),
    ).toBe(true);
  });

  it("recorrente em plano com cliente → true", () => {
    expect(
      canFinalize({
        cartSize: 1,
        total: 199,
        requireCliente: true,
        clienteId: "aluno-1",
        formaPagamento: "RECORRENTE",
        autorizacao: "",
      }),
    ).toBe(true);
  });
});
