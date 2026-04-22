import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CartItems } from "@/app/(portal)/vendas/nova/components/cart-items";
import type { VendaWorkspace } from "@/app/(portal)/vendas/nova/hooks/use-venda-workspace";

/**
 * CartItems — VUN Onda 4 follow-up (2026-04-22).
 * Stepper +/- em produtos. Plano mantém qty=1 sem stepper.
 */

function makeWorkspace(overrides: Partial<VendaWorkspace> = {}): VendaWorkspace {
  return {
    cart: [],
    removeCartItem: vi.fn(),
    setCartItemQuantidade: vi.fn(),
    ...overrides,
  } as unknown as VendaWorkspace;
}

describe("CartItems — qty stepper", () => {
  it("renderiza stepper +/- para item PRODUTO", () => {
    const workspace = makeWorkspace({
      cart: [
        {
          tipo: "PRODUTO",
          referenciaId: "p1",
          descricao: "Garrafa 500ml",
          quantidade: 2,
          valorUnitario: 15,
          desconto: 0,
        },
      ],
    });
    render(<CartItems workspace={workspace} />);

    expect(screen.getByTestId("cart-item-qty-stepper-0")).toBeInTheDocument();
    expect(screen.getByTestId("cart-item-qty-0").textContent).toBe("2");
  });

  it("não renderiza stepper para item PLANO", () => {
    const workspace = makeWorkspace({
      cart: [
        {
          tipo: "PLANO",
          referenciaId: "plano-1",
          descricao: "Plano Mensal",
          quantidade: 1,
          valorUnitario: 200,
          desconto: 0,
        },
      ],
    });
    render(<CartItems workspace={workspace} />);

    expect(screen.queryByTestId("cart-item-qty-stepper-0")).not.toBeInTheDocument();
  });

  it("botão + chama setCartItemQuantidade com qty+1", () => {
    const setCartItemQuantidade = vi.fn();
    const workspace = makeWorkspace({
      cart: [
        {
          tipo: "PRODUTO",
          referenciaId: "p1",
          descricao: "Toalha",
          quantidade: 3,
          valorUnitario: 20,
          desconto: 0,
        },
      ],
      setCartItemQuantidade,
    });
    render(<CartItems workspace={workspace} />);

    fireEvent.click(screen.getByLabelText("Aumentar quantidade"));
    expect(setCartItemQuantidade).toHaveBeenCalledWith(0, 4);
  });

  it("botão - chama setCartItemQuantidade com qty-1 e desabilita em qty=1", () => {
    const setCartItemQuantidade = vi.fn();
    const workspace = makeWorkspace({
      cart: [
        {
          tipo: "PRODUTO",
          referenciaId: "p1",
          descricao: "Luva",
          quantidade: 1,
          valorUnitario: 50,
          desconto: 0,
        },
      ],
      setCartItemQuantidade,
    });
    render(<CartItems workspace={workspace} />);

    const minusBtn = screen.getByLabelText("Diminuir quantidade");
    expect(minusBtn).toBeDisabled();
    fireEvent.click(minusBtn);
    expect(setCartItemQuantidade).not.toHaveBeenCalled();
  });

  it("exibe total do item (qty × valorUnitario) para PRODUTO", () => {
    const workspace = makeWorkspace({
      cart: [
        {
          tipo: "PRODUTO",
          referenciaId: "p1",
          descricao: "Shake",
          quantidade: 3,
          valorUnitario: 40,
          desconto: 0,
        },
      ],
    });
    render(<CartItems workspace={workspace} />);

    // 3 × 40 = 120
    expect(screen.getByText(/120,00/)).toBeInTheDocument();
  });
});
