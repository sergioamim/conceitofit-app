import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CatalogProdutos } from "@/app/(portal)/vendas/nova/components/catalog-produtos";
import type { Produto } from "@/lib/shared/types/plano";

function makeProduto(overrides: Partial<Produto> = {}): Produto {
  return {
    id: "prod1",
    tenantId: "t1",
    nome: "Whey Protein 900g",
    sku: "WHEY-900",
    unidadeMedida: "UN",
    valorVenda: 149.9,
    controlaEstoque: true,
    estoqueAtual: 10,
    permiteDesconto: false,
    permiteVoucher: false,
    ativo: true,
    ...overrides,
  };
}

describe("CatalogProdutos", () => {
  it("renderiza cada produto com nome e preço em font-mono", () => {
    const produtos = [
      makeProduto({ id: "p1", nome: "Whey Protein 900g", valorVenda: 149.9 }),
      makeProduto({ id: "p2", nome: "Creatina 300g", valorVenda: 89.9, sku: "CREA-300" }),
    ];
    render(<CatalogProdutos produtos={produtos} />);

    expect(screen.getByText("Whey Protein 900g")).toBeInTheDocument();
    expect(screen.getByText("Creatina 300g")).toBeInTheDocument();

    const preco = screen.getByText(/149,90/);
    expect(preco).toBeInTheDocument();
    expect(preco.className).toMatch(/font-mono/);
  });

  it("usa placeholder muted quando não há thumbnail para o produto", () => {
    const produto = makeProduto({ id: "p1" });
    render(<CatalogProdutos produtos={[produto]} />);
    const thumb = screen.getByTestId("catalog-produto-p1-thumb");
    expect(thumb.className).toMatch(/bg-muted/);
  });

  it("renderiza imagem quando thumbnails mapeia o id do produto", () => {
    const produto = makeProduto({ id: "p1", nome: "Whey Protein 900g" });
    render(
      <CatalogProdutos produtos={[produto]} thumbnails={{ p1: "https://cdn.example.com/whey.png" }} />,
    );
    const img = screen.getByRole("img", { name: /whey protein 900g/i }) as HTMLImageElement;
    expect(img.src).toBe("https://cdn.example.com/whey.png");
  });

  it("dispara onAdd ao clicar no botão Adicionar", () => {
    const onAdd = vi.fn();
    const produto = makeProduto({ id: "p1" });
    render(<CatalogProdutos produtos={[produto]} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: /adicionar produto whey protein 900g/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(produto);
  });

  it("exibe estado vazio quando produtos=[]", () => {
    render(<CatalogProdutos produtos={[]} />);
    expect(screen.getByTestId("catalog-produtos-empty")).toBeInTheDocument();
  });
});
