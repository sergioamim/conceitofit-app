import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CockpitShell } from "@/app/(portal)/vendas/nova/components/cockpit-shell";

describe("CockpitShell (VUN-1.2)", () => {
  it("renderiza os 6 slots (3 header + 3 colunas) preservando o conteúdo", () => {
    render(
      <CockpitShell
        headerLeft={<span>HL</span>}
        headerCenter={<span>HC</span>}
        headerRight={<span>HR</span>}
        columnLeft={<span>CL</span>}
        columnCenter={<span>CC</span>}
        columnRight={<span>CR</span>}
      />,
    );

    expect(screen.getByTestId("cockpit-shell-header-left")).toHaveTextContent(
      "HL",
    );
    expect(screen.getByTestId("cockpit-shell-header-center")).toHaveTextContent(
      "HC",
    );
    expect(screen.getByTestId("cockpit-shell-header-right")).toHaveTextContent(
      "HR",
    );
    expect(screen.getByTestId("cockpit-shell-column-left")).toHaveTextContent(
      "CL",
    );
    expect(screen.getByTestId("cockpit-shell-column-center")).toHaveTextContent(
      "CC",
    );
    expect(screen.getByTestId("cockpit-shell-column-right")).toHaveTextContent(
      "CR",
    );
  });

  it("tolera ausência dos slots de header (opcionais) mas exige os 3 de coluna", () => {
    render(
      <CockpitShell
        columnLeft={<div data-testid="col-left-inner">esquerda</div>}
        columnCenter={<div data-testid="col-center-inner">centro</div>}
        columnRight={<div data-testid="col-right-inner">direita</div>}
      />,
    );

    expect(screen.getByTestId("col-left-inner")).toBeInTheDocument();
    expect(screen.getByTestId("col-center-inner")).toBeInTheDocument();
    expect(screen.getByTestId("col-right-inner")).toBeInTheDocument();

    // Slots de header são renderizados vazios (divs estáveis para SSR/hydration).
    expect(screen.getByTestId("cockpit-shell-header-left")).toBeEmptyDOMElement();
    expect(screen.getByTestId("cockpit-shell-header-center")).toBeEmptyDOMElement();
    expect(screen.getByTestId("cockpit-shell-header-right")).toBeEmptyDOMElement();
  });

  it("aplica o header com altura fixa 56px (h-14) e fundo --ink", () => {
    render(
      <CockpitShell
        columnLeft={null}
        columnCenter={null}
        columnRight={null}
      />,
    );

    const header = screen.getByTestId("cockpit-shell-header");
    expect(header.className).toContain("h-14");
    expect(header.className).toContain("bg-ink");
  });

  it("corpo é um grid 3 colunas com larguras do PRD quando columnLeft presente", () => {
    render(
      <CockpitShell
        columnLeft={<div />}
        columnCenter={null}
        columnRight={null}
      />,
    );

    const body = screen.getByTestId("cockpit-shell-body");
    expect(body.className).toContain("grid");
    expect(body.className).toContain(
      "grid-cols-[320px_minmax(0,1fr)_380px]",
    );
    expect(body.className).toContain(
      "min-[1440px]:grid-cols-[360px_minmax(0,1fr)_400px]",
    );
  });

  it("VUN-Onda-4: colapsa pra 2 colunas quando columnLeft é null/omitido", () => {
    render(
      <CockpitShell
        columnLeft={null}
        columnCenter={null}
        columnRight={null}
      />,
    );

    const body = screen.getByTestId("cockpit-shell-body");
    expect(body.className).toContain("grid");
    expect(body.className).toContain("grid-cols-[minmax(0,1fr)_380px]");
    expect(body.className).toContain(
      "min-[1440px]:grid-cols-[minmax(0,1fr)_400px]",
    );
    // Sem columnLeft renderizada
    expect(
      screen.queryByTestId("cockpit-shell-column-left"),
    ).not.toBeInTheDocument();
  });

  it("colunas esquerda e central têm separador por border-right; a direita não", () => {
    render(
      <CockpitShell
        columnLeft={<div />}
        columnCenter={null}
        columnRight={null}
      />,
    );

    const left = screen.getByTestId("cockpit-shell-column-left");
    const center = screen.getByTestId("cockpit-shell-column-center");
    const right = screen.getByTestId("cockpit-shell-column-right");

    expect(left.className).toContain("border-r");
    expect(center.className).toContain("border-r");
    expect(right.className).not.toContain("border-r");
  });

  it("cada coluna é independentemente rolável (overflow-y-auto)", () => {
    render(
      <CockpitShell
        columnLeft={<div />}
        columnCenter={null}
        columnRight={null}
      />,
    );

    for (const id of [
      "cockpit-shell-column-left",
      "cockpit-shell-column-center",
      "cockpit-shell-column-right",
    ]) {
      expect(screen.getByTestId(id).className).toContain("overflow-y-auto");
    }
  });
});
