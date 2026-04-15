import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardCard } from "@/app/(backoffice)/admin/caixas/components/dashboard-card";
import type { DashboardDiarioResponse } from "@/lib/api/caixa.types";

function mockDashboard(
  overrides: Partial<DashboardDiarioResponse> = {},
): DashboardDiarioResponse {
  return {
    data: "2026-04-15",
    caixasAbertos: [],
    caixasFechados: [],
    totalMovimentado: {
      caixaId: "agg",
      total: 4520,
      porFormaPagamento: {
        DINHEIRO: 1200,
        CARTAO: 2800,
        PIX: 520,
      },
      movimentosCount: 0,
    },
    alertasDiferencaCount: 0,
    ...overrides,
  };
}

describe("DashboardCard (CXO-203)", () => {
  it("renderiza skeleton em loading", () => {
    render(<DashboardCard dashboard={null} loading />);
    expect(screen.getByTestId("caixas-dashboard-skeleton")).toBeInTheDocument();
  });

  it("mostra contagens de abertos/fechados e total movimentado", () => {
    render(
      <DashboardCard
        dashboard={mockDashboard({
          caixasAbertos: [
            // shape parcial — apenas length é usado
            { id: "c1" } as never,
            { id: "c2" } as never,
            { id: "c3" } as never,
          ],
          caixasFechados: Array.from({ length: 12 }, (_, i) => ({ id: `f${i}` }) as never),
        })}
      />,
    );

    expect(screen.getByText("Caixas abertos")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Caixas fechados")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Total movimentado")).toBeInTheDocument();
  });

  it("renderiza breakdown por forma de pagamento com percentuais", () => {
    render(<DashboardCard dashboard={mockDashboard()} />);
    expect(screen.getByText(/dinheiro/i)).toBeInTheDocument();
    expect(screen.getByText(/cartao|cartão/i)).toBeInTheDocument();
    expect(screen.getByText(/pix/i)).toBeInTheDocument();
    // 2800 / 4520 ≈ 62%
    expect(screen.getByText(/62%/)).toBeInTheDocument();
  });

  it("dispara onVerDiferencas ao clicar no CTA", () => {
    const handler = vi.fn();
    render(
      <DashboardCard
        dashboard={mockDashboard({ alertasDiferencaCount: 3 })}
        onVerDiferencas={handler}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /ver diferenças/i }));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/3 diferenças detectadas hoje/i)).toBeInTheDocument();
  });

  it("renderiza fallback quando dashboard é null", () => {
    render(<DashboardCard dashboard={null} />);
    expect(screen.getByText(/Sem dados para o dia/i)).toBeInTheDocument();
  });
});
