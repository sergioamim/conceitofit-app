import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  PlanoSelectorCard,
} from "@/components/shared/plano-selector-card";
import type { Plano } from "@/lib/types";

// Mock getPublicPlanQuote since it depends on plano-flow
vi.mock("@/lib/public/services", () => ({
  getPublicPlanQuote: (plano: Plano) => ({
    items: [
      { id: "mensalidade", descricao: "Mensalidade", valor: plano.valor },
      { id: "matricula", descricao: "Matrícula", valor: plano.valorMatricula },
    ],
    total: plano.valor + plano.valorMatricula,
  }),
}));

const basePlano: Plano = {
  id: "p1",
  tenantId: "t1",
  nome: "Plano Mensal",
  tipo: "MENSAL",
  duracaoDias: 30,
  valor: 129.9,
  valorMatricula: 49.9,
  cobraAnuidade: false,
  permiteRenovacaoAutomatica: true,
  permiteCobrancaRecorrente: false,
  contratoAssinatura: "AMBAS",
  contratoEnviarAutomaticoEmail: false,
  atividades: [],
  beneficios: ["Musculação", "Cardio", "Vestiário"],
  destaque: false,
  ativo: true,
};

describe("PlanoSelectorCard (grid variant)", () => {
  it("renders plan name and type", () => {
    render(<PlanoSelectorCard plano={basePlano} variant="grid" />);
    expect(screen.getByText("Plano Mensal")).toBeInTheDocument();
    expect(screen.getByText("MENSAL")).toBeInTheDocument();
  });

  it("renders plan price", () => {
    render(<PlanoSelectorCard plano={basePlano} variant="grid" />);
    const priceElements = screen.getAllByText(/129,90/);
    expect(priceElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'Mais vendido' badge when destaque=true", () => {
    render(
      <PlanoSelectorCard plano={{ ...basePlano, destaque: true }} variant="grid" />,
    );
    expect(screen.getByText("Mais vendido")).toBeInTheDocument();
  });

  it("does not show 'Mais vendido' when destaque=false", () => {
    render(<PlanoSelectorCard plano={basePlano} variant="grid" />);
    expect(screen.queryByText("Mais vendido")).toBeNull();
  });

  it("renders benefits list", () => {
    render(<PlanoSelectorCard plano={basePlano} variant="grid" />);
    expect(screen.getByText("Musculação")).toBeInTheDocument();
    expect(screen.getByText("Cardio")).toBeInTheDocument();
  });
});

describe("PlanoSelectorCard (compact variant)", () => {
  it("renders plan name and price", () => {
    render(<PlanoSelectorCard plano={basePlano} variant="compact" />);
    expect(screen.getByText("Plano Mensal")).toBeInTheDocument();
    expect(screen.getByText(/129,90/)).toBeInTheDocument();
  });

  it("renders type and duration", () => {
    render(<PlanoSelectorCard plano={basePlano} variant="compact" />);
    expect(screen.getByText(/MENSAL · 30 dias/)).toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(
      <PlanoSelectorCard
        plano={basePlano}
        variant="compact"
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText("Plano Mensal"));
    expect(onSelect).toHaveBeenCalledWith(basePlano);
  });

  it("highlights when selected", () => {
    render(
      <PlanoSelectorCard
        plano={basePlano}
        variant="compact"
        selected={true}
        onSelect={vi.fn()}
      />,
    );
    const card = screen.getByRole("radio");
    expect(card).toHaveAttribute("aria-checked", "true");
  });
});
