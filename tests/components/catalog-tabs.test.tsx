import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CatalogTabs } from "@/app/(portal)/vendas/nova/components/catalog-tabs";
import type { Plano, Produto, Servico } from "@/lib/shared/types/plano";
import type { VendaWorkspace } from "@/app/(portal)/vendas/nova/hooks/use-venda-workspace";

// PlanoDetails acessa muitos campos do workspace. Neutralizamos para focar no
// comportamento de tabs + callbacks. Reteste isolada em plano-details.test.tsx.
vi.mock("@/app/(portal)/vendas/nova/components/plano-details", () => ({
  PlanoDetails: () => <div data-testid="plano-details-stub" />,
}));

function makePlano(overrides: Partial<Plano> = {}): Plano {
  return {
    id: "plano-1",
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
    permiteVendaOnline: true,
    ativo: true,
    ...overrides,
  };
}

function makeServico(overrides: Partial<Servico> = {}): Servico {
  return {
    id: "serv-1",
    tenantId: "t1",
    nome: "Avaliação Física",
    valor: 50,
    permiteDesconto: true,
    tipoCobranca: "UNICO",
    agendavel: false,
    permiteAcessoCatraca: false,
    permiteVoucher: true,
    ativo: true,
    ...overrides,
  };
}

function makeProduto(overrides: Partial<Produto> = {}): Produto {
  return {
    id: "prod-1",
    tenantId: "t1",
    nome: "Whey Protein",
    sku: "WH-001",
    unidadeMedida: "UN",
    valorVenda: 120,
    controlaEstoque: true,
    estoqueAtual: 10,
    permiteDesconto: true,
    permiteVoucher: false,
    ativo: true,
    ...overrides,
  };
}

function makeWorkspace(overrides: Partial<VendaWorkspace> = {}): VendaWorkspace {
  return {
    tipoVenda: "PLANO",
    setTipoVenda: vi.fn(),
    planos: [makePlano()],
    servicos: [makeServico()],
    produtos: [makeProduto()],
    selectedPlanoId: "",
    handleAddPlano: vi.fn(),
    addItemToCart: vi.fn(),
    ...overrides,
  } as unknown as VendaWorkspace;
}

describe("CatalogTabs", () => {
  it("renderiza 3 tabs (PLANO default, SERVICO, PRODUTO) e mostra o catálogo da tab ativa", () => {
    render(<CatalogTabs workspace={makeWorkspace()} />);

    expect(screen.getByTestId("catalog-tab-PLANO")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-tab-SERVICO")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-tab-PRODUTO")).toBeInTheDocument();

    // tab PLANO ativa por padrão → catálogo de planos visível
    expect(screen.getByTestId("catalog-plano-plano-1")).toBeInTheDocument();
    // e PlanoDetails (stub) também
    expect(screen.getByTestId("plano-details-stub")).toBeInTheDocument();
  });

  it("ao trocar pra tab SERVICO, chama setTipoVenda('SERVICO')", () => {
    const setTipoVenda = vi.fn();
    render(<CatalogTabs workspace={makeWorkspace({ setTipoVenda })} />);

    const trigger = screen.getByTestId("catalog-tab-SERVICO");
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    fireEvent.mouseDown(trigger, { button: 0, ctrlKey: false });
    fireEvent.click(trigger);
    expect(setTipoVenda).toHaveBeenCalledWith("SERVICO");
  });

  it("ao trocar pra tab PRODUTO, chama setTipoVenda('PRODUTO')", () => {
    const setTipoVenda = vi.fn();
    render(<CatalogTabs workspace={makeWorkspace({ setTipoVenda })} />);

    const trigger = screen.getByTestId("catalog-tab-PRODUTO");
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    fireEvent.mouseDown(trigger, { button: 0, ctrlKey: false });
    fireEvent.click(trigger);
    expect(setTipoVenda).toHaveBeenCalledWith("PRODUTO");
  });

  it("onAdd do catálogo Planos → workspace.handleAddPlano(plano)", () => {
    const handleAddPlano = vi.fn();
    const plano = makePlano({ id: "plano-42", nome: "Anual" });
    render(
      <CatalogTabs
        workspace={makeWorkspace({ planos: [plano], handleAddPlano })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /adicionar plano anual/i }));
    expect(handleAddPlano).toHaveBeenCalledTimes(1);
    expect(handleAddPlano).toHaveBeenCalledWith(plano);
  });

  it("onAdd do catálogo Serviços → addItemToCart com tipo=SERVICO e valor mapeado", () => {
    const addItemToCart = vi.fn();
    const servico = makeServico({ id: "s-42", nome: "Personal", valor: 99.5 });
    render(
      <CatalogTabs
        workspace={makeWorkspace({
          tipoVenda: "SERVICO",
          servicos: [servico],
          addItemToCart,
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /adicionar serviço personal/i }));
    expect(addItemToCart).toHaveBeenCalledWith({
      tipo: "SERVICO",
      referenciaId: "s-42",
      descricao: "Personal",
      quantidade: 1,
      valorUnitario: 99.5,
      desconto: 0,
    });
  });

  it("onAdd do catálogo Produtos → addItemToCart com tipo=PRODUTO e valorVenda mapeado", () => {
    const addItemToCart = vi.fn();
    const produto = makeProduto({ id: "p-42", nome: "Shake", valorVenda: 18 });
    render(
      <CatalogTabs
        workspace={makeWorkspace({
          tipoVenda: "PRODUTO",
          produtos: [produto],
          addItemToCart,
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /adicionar produto shake/i }));
    expect(addItemToCart).toHaveBeenCalledWith({
      tipo: "PRODUTO",
      referenciaId: "p-42",
      descricao: "Shake",
      quantidade: 1,
      valorUnitario: 18,
      desconto: 0,
    });
  });
});
