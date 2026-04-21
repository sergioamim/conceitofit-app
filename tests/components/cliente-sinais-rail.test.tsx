import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClienteSinaisRail, type Sinal } from "@/app/(portal)/clientes/[id]/cliente-sinais-rail";

describe("ClienteSinaisRail", () => {
  it("não renderiza nada quando a lista de sinais está vazia", () => {
    const { container } = render(<ClienteSinaisRail sinais={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza cada sinal com label, valor e hint", () => {
    const sinais: Sinal[] = [
      { key: "contrato", label: "Contrato", valor: "20 dias", hint: "Anual Black", tom: "ok" },
      { key: "pendencia", label: "Pendência", valor: "R$ 159,90", hint: "1 boleto", tom: "critico" },
    ];
    render(<ClienteSinaisRail sinais={sinais} />);
    expect(screen.getByText("Contrato")).toBeInTheDocument();
    expect(screen.getByText("20 dias")).toBeInTheDocument();
    expect(screen.getByText("Anual Black")).toBeInTheDocument();
    expect(screen.getByText("Pendência")).toBeInTheDocument();
    expect(screen.getByText("R$ 159,90")).toBeInTheDocument();
  });

  it("marca sinais desabilitados com data-disabled e pointer-events-none", () => {
    const sinais: Sinal[] = [
      { key: "ativo", label: "Contrato", valor: "OK", tom: "ok" },
      { key: "em-breve", label: "Avaliação", valor: "Em breve", tom: "vazio", disabled: true },
    ];
    render(<ClienteSinaisRail sinais={sinais} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);

    const ativo = items.find((el) => el.dataset.disabled === undefined);
    const desativado = items.find((el) => el.dataset.disabled === "true");
    expect(ativo).toBeDefined();
    expect(desativado).toBeDefined();
    expect(desativado?.className).toContain("pointer-events-none");
    expect(desativado?.className).toContain("opacity-50");
    expect(desativado).toHaveAttribute("title", "Em breve");
  });

  it("exibe aria-label da lista para leitores de tela", () => {
    const sinais: Sinal[] = [{ key: "x", label: "Contrato", valor: "OK" }];
    render(<ClienteSinaisRail sinais={sinais} />);
    expect(
      screen.getByRole("list", { name: /sinais de saúde do cliente/i })
    ).toBeInTheDocument();
  });
});
