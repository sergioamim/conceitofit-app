import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CatalogServicos } from "@/app/(portal)/vendas/nova/components/catalog-servicos";
import type { Servico } from "@/lib/shared/types/plano";

function makeServico(overrides: Partial<Servico> = {}): Servico {
  return {
    id: "s1",
    tenantId: "t1",
    nome: "Personal 60min",
    valor: 120,
    permiteDesconto: true,
    tipoCobranca: "UNICO",
    agendavel: true,
    permiteAcessoCatraca: false,
    permiteVoucher: false,
    ativo: true,
    ...overrides,
  };
}

describe("CatalogServicos", () => {
  it("renderiza cada serviço com nome, descrição e preço em font-mono", () => {
    const servicos = [
      makeServico({ id: "s1", nome: "Personal 60min", descricao: "Sessão individual", valor: 120 }),
      makeServico({ id: "s2", nome: "Avaliação Física", valor: 80 }),
    ];
    render(<CatalogServicos servicos={servicos} />);

    expect(screen.getByText("Personal 60min")).toBeInTheDocument();
    expect(screen.getByText("Sessão individual")).toBeInTheDocument();
    expect(screen.getByText("Avaliação Física")).toBeInTheDocument();

    const preco = screen.getByText(/120,00/);
    expect(preco).toBeInTheDocument();
    expect(preco.className).toMatch(/font-mono/);
  });

  it("dispara onAdd ao clicar no botão +", () => {
    const onAdd = vi.fn();
    const servico = makeServico({ id: "s1", nome: "Personal 60min" });
    render(<CatalogServicos servicos={[servico]} onAdd={onAdd} />);

    fireEvent.click(screen.getByRole("button", { name: /adicionar serviço personal 60min/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(servico);
  });

  it("não renderiza botão + quando onAdd=undefined", () => {
    render(<CatalogServicos servicos={[makeServico()]} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("exibe estado vazio quando servicos=[]", () => {
    render(<CatalogServicos servicos={[]} />);
    expect(screen.getByTestId("catalog-servicos-empty")).toBeInTheDocument();
  });
});
