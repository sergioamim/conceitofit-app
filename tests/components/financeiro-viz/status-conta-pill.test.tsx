import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusContaPill } from "@/components/shared/financeiro-viz/status-conta-pill";

describe("StatusContaPill", () => {
  it("status visual direto renderiza label correto", () => {
    render(<StatusContaPill status="pago" />);
    expect(screen.getByText("Pago")).toBeInTheDocument();
  });

  it("deriva status do backend + dataVencimento + today", () => {
    render(<StatusContaPill status="PENDENTE" dataVencimento="2026-04-23" today="2026-04-23" />);
    expect(screen.getByText("Vence hoje")).toBeInTheDocument();
  });

  it("status backend PAGA vira 'Pago' mesmo com vencimento passado", () => {
    render(
      <StatusContaPill status="PAGA" dataVencimento="2026-04-10" today="2026-04-23" />,
    );
    expect(screen.getByText("Pago")).toBeInTheDocument();
  });

  it("vencido com atraso mostra dias no label", () => {
    render(<StatusContaPill status="vencido" atraso={-7} />);
    expect(screen.getByText("Vencido · 7d")).toBeInTheDocument();
  });

  it("sem today + status backend, cai em agendado (fallback defensivo)", () => {
    render(<StatusContaPill status="PENDENTE" />);
    expect(screen.getByText("Agendado")).toBeInTheDocument();
  });

  it("labelOverride substitui label default", () => {
    render(<StatusContaPill status="pago" labelOverride="Quitado" />);
    expect(screen.getByText("Quitado")).toBeInTheDocument();
    expect(screen.queryByText("Pago")).not.toBeInTheDocument();
  });
});
