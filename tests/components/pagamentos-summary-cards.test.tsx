import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PagamentosSummaryCards } from "@/app/(portal)/pagamentos/components/summary-cards/pagamentos-summary-cards";

describe("PagamentosSummaryCards", () => {
  it("renderiza os três cards com valores corretos", () => {
    render(
      <PagamentosSummaryCards
        totalRecebido={1500}
        totalPendente={800}
        totalCount={12}
      />,
    );

    expect(screen.getByText("Recebido no mês")).toBeInTheDocument();
    expect(screen.getByText("Em aberto")).toBeInTheDocument();
    expect(screen.getByText("Total de cobranças")).toBeInTheDocument();
    // formatBRL renders with locale, so check for the numeric part
    expect(screen.getByText(/1\.500/)).toBeInTheDocument();
    expect(screen.getByText(/800/)).toBeInTheDocument();
  });

  it("renderiza valores zerados quando não há dados", () => {
    render(
      <PagamentosSummaryCards
        totalRecebido={0}
        totalPendente={0}
        totalCount={0}
      />,
    );

    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
