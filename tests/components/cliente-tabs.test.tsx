
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClienteTabs, type ClienteTabKey } from "@/components/shared/cliente-tabs";

describe("ClienteTabs", () => {
  const defaultProps = {
    current: "resumo" as ClienteTabKey,
    baseHref: "/clientes/1",
    onSelect: vi.fn(),
  };

  it("renders all default tabs", () => {
    // Perfil v3 Wave 4: conjunto final de 10 abas (AC4.1/4.4-4.6).
    // "Cartões" e "Edição" saíram do TabBar; "Dashboard" virou "Resumo";
    // "Atividades" foi dissolvida em Frequência/Treinos/Avaliações.
    render(<ClienteTabs {...defaultProps} />);
    expect(screen.getByText("Resumo")).toBeInTheDocument();
    expect(screen.getByText("Relacionamento")).toBeInTheDocument();
    expect(screen.getByText("Contratos")).toBeInTheDocument();
    expect(screen.getByText("Financeiro")).toBeInTheDocument();
    expect(screen.getByText("NFS-e")).toBeInTheDocument();
    expect(screen.getByText("Frequência")).toBeInTheDocument();
    expect(screen.getByText("Treinos")).toBeInTheDocument();
    expect(screen.getByText("Avaliações")).toBeInTheDocument();
    expect(screen.getByText("Fidelidade")).toBeInTheDocument();
    expect(screen.getByText("Documentos")).toBeInTheDocument();
    expect(screen.queryByText("Cartões")).not.toBeInTheDocument();
    expect(screen.queryByText("Edição")).not.toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("ignores showEditTab (deprecated in Wave 4)", () => {
    render(<ClienteTabs {...defaultProps} showEditTab={true} />);
    // AC4.5: aba "Edição" foi removida; a prop ficou apenas por retrocompat.
    expect(screen.queryByText("Edição")).not.toBeInTheDocument();
  });

  it("calls onSelect when a tab is clicked", () => {
    render(<ClienteTabs {...defaultProps} />);
    fireEvent.click(screen.getByText("Contratos"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith("matriculas");
  });

  it("highlights the current active tab", () => {
    render(<ClienteTabs {...defaultProps} current="matriculas" />);
    const activeTab = screen.getByText("Contratos").closest("button");
    expect(activeTab?.className).toContain("border-gym-accent");
    expect(activeTab?.className).toContain("text-gym-accent");
  });

  it("shows warning icon on financeiro tab when pendenteFinanceiro is true", () => {
    const { container } = render(<ClienteTabs {...defaultProps} pendenteFinanceiro={true} />);
    // AlertTriangle has a specific class size-3.5 and text-gym-warning
    // It's inside the financeiro button
    const financeiroBtn = screen.getByText("Financeiro").closest("button");
    const warningIcon = financeiroBtn?.querySelector(".text-gym-warning");
    expect(warningIcon).toBeInTheDocument();
  });

  it("renders as links when onSelect is not provided", () => {
    render(<ClienteTabs current="resumo" baseHref="/test" />);
    expect(screen.getByText("Resumo").closest("a")).toHaveAttribute("href", "/test");
  });
});
