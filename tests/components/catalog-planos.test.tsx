import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CatalogPlanos } from "@/app/(portal)/vendas/nova/components/catalog-planos";
import type { Plano } from "@/lib/shared/types/plano";

function makePlano(overrides: Partial<Plano> = {}): Plano {
  return {
    id: "p1",
    tenantId: "t1",
    nome: "Plano Mensal",
    tipo: "MENSAL",
    duracaoDias: 30,
    valor: 129.9,
    valorMatricula: 0,
    cobraAnuidade: false,
    permiteRenovacaoAutomatica: true,
    permiteCobrancaRecorrente: false,
    contratoAssinatura: "AMBAS",
    contratoEnviarAutomaticoEmail: false,
    atividades: [],
    beneficios: [],
    destaque: false,
    ativo: true,
    ...overrides,
  };
}

describe("CatalogPlanos", () => {
  it("renderiza cada plano com nome e preço em font-mono", () => {
    const planos = [
      makePlano({ id: "p1", nome: "Plano Mensal", valor: 129.9 }),
      makePlano({ id: "p2", nome: "Plano Trimestral", valor: 359.9, tipo: "TRIMESTRAL" }),
    ];

    render(<CatalogPlanos planos={planos} />);

    expect(screen.getByText("Plano Mensal")).toBeInTheDocument();
    expect(screen.getByText("Plano Trimestral")).toBeInTheDocument();

    const preco1 = screen.getByText(/129,90/);
    expect(preco1).toBeInTheDocument();
    expect(preco1.className).toMatch(/font-mono/);
  });

  it("mostra ribbon Recomendado apenas no plano indicado por planoRecomendadoId", () => {
    const planos = [
      makePlano({ id: "p1" }),
      makePlano({ id: "p2", nome: "Anual" }),
    ];
    render(<CatalogPlanos planos={planos} planoRecomendadoId="p2" />);

    expect(screen.queryByTestId("catalog-plano-p1-ribbon")).toBeNull();
    const ribbon = screen.getByTestId("catalog-plano-p2-ribbon");
    expect(ribbon).toBeInTheDocument();
    expect(ribbon).toHaveTextContent(/recomendado/i);
    // Usamos amber-400 como fallback do token --gold inexistente.
    expect(ribbon.className).toMatch(/amber-400/);
  });

  it("aplica card invertido quando plano.destaque=true", () => {
    const planos = [makePlano({ id: "p1", destaque: true })];
    render(<CatalogPlanos planos={planos} />);
    const card = screen.getByTestId("catalog-plano-p1");
    expect(card.className).toMatch(/bg-primary/);
    expect(card.className).toMatch(/text-primary-foreground/);
  });

  it("dispara onAdd ao clicar no botão Adicionar", () => {
    const onAdd = vi.fn();
    const plano = makePlano({ id: "p1" });
    render(<CatalogPlanos planos={[plano]} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: /adicionar plano plano mensal/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(plano);
  });

  it("exibe estado vazio quando planos=[]", () => {
    render(<CatalogPlanos planos={[]} />);
    expect(screen.getByTestId("catalog-planos-empty")).toBeInTheDocument();
  });
});
