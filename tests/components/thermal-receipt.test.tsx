import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ThermalReceipt,
  type ThermalReceiptItem,
} from "@/components/shared/thermal-receipt";

const ITEMS_3: ThermalReceiptItem[] = [
  { id: "1", nome: "Plano Mensal", qtd: 1, valorUnit: 180, valorTotal: 180 },
  { id: "2", nome: "Taxa matrícula", qtd: 1, valorUnit: 50, valorTotal: 50 },
  {
    id: "3",
    nome: "Avaliação física",
    qtd: 2,
    valorUnit: 40,
    valorTotal: 80,
  },
];

const CABECALHO = {
  academiaNome: "Conceito Fit Centro",
  cnpj: "12.345.678/0001-99",
  endereco: "Rua A, 100",
};

/** Espera o próximo tick para deixar o `useEffect` rodar e formatador de BRL hidratar. */
async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("ThermalReceipt (VUN-3.1)", () => {
  it("renderiza 3 itens com nome, qtd × unit e total formatado em BRL", async () => {
    render(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={310}
        cabecalho={CABECALHO}
        variant="carrinho"
      />,
    );
    await flushEffects();

    expect(screen.getByText("Plano Mensal")).toBeInTheDocument();
    expect(screen.getByText("Taxa matrícula")).toBeInTheDocument();
    expect(screen.getByText("Avaliação física")).toBeInTheDocument();

    const renderedItems = screen.getAllByTestId("thermal-receipt-item");
    expect(renderedItems).toHaveLength(3);

    // Primeiro item: 1 × R$ 180,00 | Total R$ 180,00
    const first = renderedItems[0];
    expect(first.textContent).toMatch(/1\s+×/);
    expect(first.textContent).toMatch(/180,00/);

    // Terceiro item: 2 × R$ 40,00 = R$ 80,00
    const third = renderedItems[2];
    expect(third.textContent).toMatch(/2\s+×/);
    expect(third.textContent).toMatch(/80,00/);
  });

  it("exibe subtotal e total no formato BRL após hidratação", async () => {
    render(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={310}
        cabecalho={CABECALHO}
        variant="carrinho"
      />,
    );
    await flushEffects();

    const subtotal = screen.getByTestId("thermal-receipt-subtotal");
    expect(subtotal.textContent).toMatch(/Subtotal/);
    expect(subtotal.textContent).toMatch(/310,00/);

    const total = screen.getByTestId("thermal-receipt-total");
    expect(total.textContent).toMatch(/TOTAL/);
    expect(total.textContent).toMatch(/310,00/);
  });

  it("SSR safety: render estático (renderToString) mostra placeholder `R$ —`, não valores formatados", async () => {
    // O risco de hydration mismatch vem de Intl.NumberFormat produzir strings
    // diferentes entre SSR (Node) e client. Para blindar, o formatador é
    // criado dentro de um useEffect — portanto, o output de SSR (renderToString)
    // NÃO deve conter valores formatados em BRL.
    const { renderToString } = await import("react-dom/server");
    const html = renderToString(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={310}
        desconto={10}
        cabecalho={CABECALHO}
        variant="carrinho"
      />,
    );
    expect(html).toContain("R$ —");
    // Valores com formatação BRL NÃO devem aparecer no HTML de SSR.
    expect(html).not.toMatch(/R\$&nbsp;310,00/);
    expect(html).not.toMatch(/310,00/);
  });

  it("variant `modal` aplica altura fixa 820×560", () => {
    render(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={310}
        cabecalho={CABECALHO}
        variant="modal"
      />,
    );
    const region = screen.getByTestId("thermal-receipt");
    expect(region.className).toContain("h-[560px]");
    expect(region.className).toContain("w-[820px]");
    expect(region.getAttribute("data-variant")).toBe("modal");
  });

  it("variant `carrinho` usa altura flexível (h-full)", () => {
    render(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={310}
        cabecalho={CABECALHO}
        variant="carrinho"
      />,
    );
    const region = screen.getByTestId("thermal-receipt");
    expect(region.className).toContain("h-full");
    expect(region.className).not.toContain("h-[560px]");
    expect(region.getAttribute("data-variant")).toBe("carrinho");
  });

  it("exibe parcelamento condicionalmente (apenas quando a prop existe)", async () => {
    const { rerender } = render(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={310}
        cabecalho={CABECALHO}
        variant="carrinho"
      />,
    );
    await flushEffects();
    expect(screen.queryByTestId("thermal-receipt-parcelamento")).toBeNull();

    rerender(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={310}
        cabecalho={CABECALHO}
        variant="carrinho"
        parcelamento={{ n: 3, valorParcela: 103.33 }}
        metodoPagamento="CREDITO"
      />,
    );
    await flushEffects();

    const parcelas = screen.getByTestId("thermal-receipt-parcelamento");
    expect(parcelas.textContent).toMatch(/3x/);
    expect(parcelas.textContent).toMatch(/103,33/);

    const metodo = screen.getByTestId("thermal-receipt-metodo");
    expect(metodo.textContent).toMatch(/Crédito/);
  });

  it("exibe cupom e convênio quando fornecidos", async () => {
    render(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={279}
        desconto={31}
        cabecalho={CABECALHO}
        cupomAplicado="BLACKFIT10"
        convenio="Gympass"
        variant="carrinho"
      />,
    );
    await flushEffects();

    expect(screen.getByTestId("thermal-receipt-cupom").textContent).toMatch(
      /BLACKFIT10/,
    );
    expect(screen.getByTestId("thermal-receipt-convenio").textContent).toMatch(
      /Gympass/,
    );
    expect(screen.getByTestId("thermal-receipt-desconto").textContent).toMatch(
      /31,00/,
    );
  });

  it("esconde desconto quando valor é zero ou ausente", async () => {
    render(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={310}
        desconto={0}
        cabecalho={CABECALHO}
        variant="carrinho"
      />,
    );
    await flushEffects();
    expect(screen.queryByTestId("thermal-receipt-desconto")).toBeNull();
  });

  it("renderiza cabeçalho com nome da academia, CNPJ e endereço", () => {
    render(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={310}
        cabecalho={CABECALHO}
        variant="carrinho"
      />,
    );
    const header = screen.getByTestId("thermal-receipt-header");
    expect(within(header).getByText("Conceito Fit Centro")).toBeInTheDocument();
    expect(header.textContent).toMatch(/12\.345\.678\/0001-99/);
    expect(header.textContent).toMatch(/Rua A, 100/);
  });

  it("renderiza rodapé opcional", () => {
    render(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={310}
        cabecalho={CABECALHO}
        rodape="Obrigado pela preferência!"
        variant="carrinho"
      />,
    );
    expect(screen.getByTestId("thermal-receipt-footer").textContent).toMatch(
      /Obrigado pela preferência!/,
    );
  });

  it("a11y: expõe role=region com aria-label 'Recibo da venda'", () => {
    render(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={310}
        cabecalho={CABECALHO}
        variant="carrinho"
      />,
    );
    const region = screen.getByRole("region", { name: "Recibo da venda" });
    expect(region).toBeInTheDocument();
  });

  it("aplica background `bg-receipt-paper` e bordas picotadas (top + bottom)", () => {
    render(
      <ThermalReceipt
        items={ITEMS_3}
        subtotal={310}
        total={310}
        cabecalho={CABECALHO}
        variant="modal"
      />,
    );
    const region = screen.getByTestId("thermal-receipt");
    expect(region.className).toContain("bg-receipt-paper");
    expect(screen.getByTestId("thermal-receipt-tear-top")).toBeInTheDocument();
    expect(
      screen.getByTestId("thermal-receipt-tear-bottom"),
    ).toBeInTheDocument();
  });
});
