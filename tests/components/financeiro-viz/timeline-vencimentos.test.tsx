import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineVencimentos } from "@/components/shared/financeiro-viz/timeline-vencimentos";

const TODAY = "2026-04-23";

describe("TimelineVencimentos", () => {
  it("renderiza range default (-3 a +14 = 18 dias)", () => {
    const { container } = render(<TimelineVencimentos contas={[]} mode="pagar" today={TODAY} />);
    const botoesDia = container.querySelectorAll("button");
    // 18 dias + 0 contas com todos os botoes desabilitados
    expect(botoesDia.length).toBe(18);
  });

  it("agrupa contas do mesmo dia e soma valores", () => {
    const contas = [
      { id: "a", dataVencimento: "2026-04-25", valor: 100, pago: false },
      { id: "b", dataVencimento: "2026-04-25", valor: 50, pago: false },
      { id: "c", dataVencimento: "2026-04-25", valor: 25, pago: true }, // pago nao entra
      { id: "d", dataVencimento: "2026-04-26", valor: 30, pago: false },
    ];
    const { container } = render(
      <TimelineVencimentos contas={contas} mode="pagar" today={TODAY} />,
    );
    // o dia 25 agrupa 2 contas (nao-pagas) — mostra badge de "2"
    expect(container.textContent).toContain("2");
    // soma formatada: R$ 150,00 (sem R$)
    expect(container.textContent).toContain("150,00");
  });

  it("contas pagas sao excluidas do agrupamento", () => {
    const contas = [
      { id: "p1", dataVencimento: "2026-04-25", valor: 500, pago: true },
    ];
    const { container } = render(
      <TimelineVencimentos contas={contas} mode="pagar" today={TODAY} />,
    );
    // nao deve ter "500"
    expect(container.textContent).not.toContain("500,00");
  });

  it("onDayClick recebe iso e items quando ha contas", () => {
    const contas = [{ id: "a", dataVencimento: "2026-04-25", valor: 100, pago: false }];
    const onDayClick = vi.fn();
    render(
      <TimelineVencimentos contas={contas} mode="pagar" today={TODAY} onDayClick={onDayClick} />,
    );
    // 2026-04-25 e sabado — e o unico dia com contas (habilitado)
    const botao = screen.getByRole("button", {
      name: /SÁB 25/i,
    });
    fireEvent.click(botao);
    expect(onDayClick).toHaveBeenCalledWith("2026-04-25", [contas[0]]);
  });

  it("botoes de dias sem contas ficam desabilitados", () => {
    const onDayClick = vi.fn();
    const { container } = render(
      <TimelineVencimentos contas={[]} mode="pagar" today={TODAY} onDayClick={onDayClick} />,
    );
    const botoes = container.querySelectorAll("button:disabled");
    expect(botoes.length).toBe(18);
  });

  it("mode=pagar usa subtitulo 'Valores a desembolsar'", () => {
    render(<TimelineVencimentos contas={[]} mode="pagar" today={TODAY} />);
    expect(screen.getByText(/Valores a desembolsar/)).toBeInTheDocument();
  });

  it("mode=receber usa subtitulo 'Valores esperados'", () => {
    render(<TimelineVencimentos contas={[]} mode="receber" today={TODAY} />);
    expect(screen.getByText(/Valores esperados/)).toBeInTheDocument();
  });
});
