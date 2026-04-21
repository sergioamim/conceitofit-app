import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PaymentPanel } from "@/app/(portal)/vendas/nova/components/payment-panel";
import type { VendaWorkspace } from "@/app/(portal)/vendas/nova/hooks/use-venda-workspace";

/**
 * VUN-3.2 — PaymentPanel.
 *
 * Testes focados no contrato público do painel:
 *  - renderiza ThermalReceipt no topo
 *  - seções colapsáveis (Convênio, Cupom)
 *  - total destacado (28px mono)
 *  - grid de 12 parcelas visível só para CARTAO_CREDITO
 *  - input NSU obrigatório ≥ 4 dígitos (RN-005)
 *  - label dinâmico do botão Finalizar (RN-018)
 *  - botão desabilitado quando !canFinalize
 */

function makeWorkspace(overrides: Partial<VendaWorkspace> = {}): VendaWorkspace {
  const cart = overrides.cart ?? [
    {
      tipo: "PLANO",
      referenciaId: "plano-1",
      descricao: "Plano Mensal",
      quantidade: 1,
      valorUnitario: 310,
      desconto: 0,
    },
  ];
  const total = overrides.total ?? 310;
  const parcelas = overrides.parcelas ?? 1;

  return {
    cart,
    subtotal: overrides.subtotal ?? 310,
    total,
    descontoTotal: overrides.descontoTotal ?? 0,
    tenant: overrides.tenant ?? {
      id: "t1",
      nome: "Conceito Fit Centro",
      documento: "12.345.678/0001-99",
    },
    cupomCode: "",
    setCupomCode: vi.fn(),
    applyCupom: vi.fn(),
    cupomAppliedCode: "",
    cupomPercent: 0,
    cupomError: "",
    selectedConvenio: null,
    conveniosPlano: [],
    convenioPlanoId: "__SEM_CONVENIO__",
    setConvenioPlanoId: vi.fn(),
    saving: false,
    canFinalize: overrides.canFinalize ?? true,
    formaPagamento: overrides.formaPagamento ?? "PIX",
    setFormaPagamento: overrides.setFormaPagamento ?? vi.fn(),
    parcelas,
    setParcelas: overrides.setParcelas ?? vi.fn(),
    autorizacao: overrides.autorizacao ?? "",
    setAutorizacao: overrides.setAutorizacao ?? vi.fn(),
    valorParcela: overrides.valorParcela ?? total / Math.max(1, parcelas),
    selectedPlano: overrides.selectedPlano ?? null,
    ...overrides,
  } as unknown as VendaWorkspace;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("PaymentPanel (VUN-3.2)", () => {
  it("renderiza ThermalReceipt no topo, total destacado e forma de pagamento radio", async () => {
    render(
      <PaymentPanel
        workspace={makeWorkspace()}
        handleConfirmPayment={vi.fn()}
      />,
    );
    await flush();

    expect(screen.getByTestId("thermal-receipt")).toBeInTheDocument();
    expect(screen.getByTestId("payment-panel-total")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: /forma de pagamento/i })).toBeInTheDocument();
    expect(screen.getByTestId("payment-panel-forma-DINHEIRO")).toBeInTheDocument();
    expect(screen.getByTestId("payment-panel-forma-CARTAO_CREDITO")).toBeInTheDocument();
    expect(screen.getByTestId("payment-panel-forma-CARTAO_DEBITO")).toBeInTheDocument();
    expect(screen.getByTestId("payment-panel-forma-PIX")).toBeInTheDocument();
    expect(screen.getByTestId("payment-panel-forma-RECORRENTE")).toBeInTheDocument();
  });

  it("total destacado usa fonte mono e valor 28px (estilo PRD)", async () => {
    render(
      <PaymentPanel
        workspace={makeWorkspace({ total: 310 })}
        handleConfirmPayment={vi.fn()}
      />,
    );
    await flush();
    const value = screen.getByTestId("payment-panel-total-value");
    expect(value.className).toContain("font-mono");
    expect(value.className).toContain("text-[28px]");
  });

  it("grid de 12 parcelas só aparece quando forma = CARTAO_CREDITO", async () => {
    const { rerender } = render(
      <PaymentPanel
        workspace={makeWorkspace({ formaPagamento: "PIX" })}
        handleConfirmPayment={vi.fn()}
      />,
    );
    await flush();
    expect(screen.queryByTestId("payment-panel-parcelas-grid")).not.toBeInTheDocument();

    rerender(
      <PaymentPanel
        workspace={makeWorkspace({ formaPagamento: "CARTAO_CREDITO", autorizacao: "1234" })}
        handleConfirmPayment={vi.fn()}
      />,
    );
    await flush();
    expect(screen.getByTestId("payment-panel-parcelas-grid")).toBeInTheDocument();
    for (let n = 1; n <= 12; n++) {
      expect(screen.getByTestId(`payment-panel-parcela-${n}`)).toBeInTheDocument();
    }
  });

  it("input NSU aparece só em crédito/débito e bloqueia submit com <4 dígitos (RN-005)", async () => {
    // PIX não mostra NSU
    const { rerender } = render(
      <PaymentPanel
        workspace={makeWorkspace({ formaPagamento: "PIX" })}
        handleConfirmPayment={vi.fn()}
      />,
    );
    await flush();
    expect(screen.queryByTestId("payment-panel-nsu")).not.toBeInTheDocument();

    // Débito com NSU curto → submit bloqueado (handleConfirmPayment não é chamado)
    const handleConfirmPayment = vi.fn().mockResolvedValue(undefined);
    rerender(
      <PaymentPanel
        workspace={makeWorkspace({
          formaPagamento: "CARTAO_DEBITO",
          autorizacao: "",
          canFinalize: true,
        })}
        handleConfirmPayment={handleConfirmPayment}
      />,
    );
    await flush();
    const nsu = screen.getByTestId("payment-panel-nsu") as HTMLInputElement;
    expect(nsu).toBeInTheDocument();

    fireEvent.change(nsu, { target: { value: "12" } });
    await flush();
    const form = screen.getByTestId("payment-panel");
    await act(async () => {
      fireEvent.submit(form);
    });
    await flush();
    // Schema bloqueia: handleConfirmPayment NÃO deve ser chamado.
    expect(handleConfirmPayment).not.toHaveBeenCalled();

    // Agora com ≥4 dígitos → passa
    fireEvent.change(nsu, { target: { value: "1234" } });
    await flush();
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(handleConfirmPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          formaPagamento: "CARTAO_DEBITO",
          codigoTransacao: "1234",
        }),
      );
    });
  });

  it("label do botão é 'Finalizar · R$ total' à vista (RN-018)", async () => {
    render(
      <PaymentPanel
        workspace={makeWorkspace({ total: 310, formaPagamento: "PIX", parcelas: 1 })}
        handleConfirmPayment={vi.fn()}
      />,
    );
    await flush();
    const btn = screen.getByTestId("payment-panel-finalizar");
    expect(btn.textContent).toMatch(/Finalizar ·/);
    expect(btn.textContent).toMatch(/310/);
  });

  it("label do botão é 'Finalizar · N× R$ valorParcela' parcelado (RN-018)", async () => {
    render(
      <PaymentPanel
        workspace={makeWorkspace({
          total: 1200,
          formaPagamento: "CARTAO_CREDITO",
          parcelas: 12,
          valorParcela: 100,
          autorizacao: "1234",
        })}
        handleConfirmPayment={vi.fn()}
      />,
    );
    await flush();
    const btn = screen.getByTestId("payment-panel-finalizar");
    expect(btn.textContent).toMatch(/12×/);
    expect(btn.textContent).toMatch(/100/);
  });

  it("botão Finalizar desabilitado quando canFinalize=false", async () => {
    render(
      <PaymentPanel
        workspace={makeWorkspace({ canFinalize: false })}
        handleConfirmPayment={vi.fn()}
      />,
    );
    await flush();
    const btn = screen.getByTestId("payment-panel-finalizar");
    expect(btn).toBeDisabled();
  });

  it("clicar em parcela=6 sincroniza estado do workspace via setParcelas", async () => {
    const setParcelas = vi.fn();
    render(
      <PaymentPanel
        workspace={makeWorkspace({
          formaPagamento: "CARTAO_CREDITO",
          autorizacao: "1234",
          setParcelas,
        })}
        handleConfirmPayment={vi.fn()}
      />,
    );
    await flush();
    const p6 = screen.getByTestId("payment-panel-parcela-6");
    await act(async () => {
      fireEvent.click(p6);
    });
    await flush();
    expect(setParcelas).toHaveBeenCalledWith(6);
  });

  it("submit bem-sucedido chama handleConfirmPayment com PagamentoVenda", async () => {
    const handleConfirmPayment = vi.fn().mockResolvedValue(undefined);
    render(
      <PaymentPanel
        workspace={makeWorkspace({
          total: 310,
          formaPagamento: "PIX",
          parcelas: 1,
          canFinalize: true,
        })}
        handleConfirmPayment={handleConfirmPayment}
      />,
    );
    await flush();

    const form = screen.getByTestId("payment-panel");
    await act(async () => {
      fireEvent.submit(form);
    });
    await waitFor(() => {
      expect(handleConfirmPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          formaPagamento: "PIX",
          valorPago: 310,
        }),
      );
    });
  });
});
