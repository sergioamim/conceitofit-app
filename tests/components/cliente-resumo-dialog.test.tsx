import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClienteResumoDialog } from "@/app/(portal)/clientes/components/cliente-resumo-dialog";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    span: ({ children, className, role, "aria-label": ariaLabel }: Record<string, unknown>) => (
      <span className={className as string} role={role as string} aria-label={ariaLabel as string}>{children as React.ReactNode}</span>
    ),
  },
  useReducedMotion: () => false,
}));

vi.mock("@/components/shared/cliente-thumbnail", () => ({
  ClienteThumbnail: ({ nome }: any) => <div data-testid="thumbnail">{nome}</div>,
}));

vi.mock("@/lib/formatters", () => ({
  formatDate: (v: string) => v,
}));

const mockAluno = {
  id: "a1",
  tenantId: "t1",
  nome: "João Silva",
  email: "joao@teste.com",
  telefone: "(11) 99999-0000",
  cpf: "123.456.789-00",
  dataNascimento: "1990-01-01",
  sexo: "M" as const,
  status: "ATIVO" as const,
  dataCriacao: "2024-01-01T00:00:00",
};

describe("ClienteResumoDialog", () => {
  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    clienteResumo: mockAluno,
    clienteResumoPlano: { nome: "Plano Mensal", dataFim: "2024-12-31" },
    clienteResumoBaseHref: "/clientes",
    liberandoSuspensao: false,
    onLiberarSuspensao: vi.fn(),
    onVerPerfil: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders dialog title", () => {
    render(<ClienteResumoDialog {...defaultProps} />);
    expect(screen.getByText("Resumo do Cliente")).toBeInTheDocument();
  });

  it("displays client name and email", () => {
    render(<ClienteResumoDialog {...defaultProps} />);
    expect(screen.getAllByText("João Silva").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("joao@teste.com")).toBeInTheDocument();
  });

  it("displays CPF and phone", () => {
    render(<ClienteResumoDialog {...defaultProps} />);
    expect(screen.getByText("123.456.789-00")).toBeInTheDocument();
    expect(screen.getByText("(11) 99999-0000")).toBeInTheDocument();
  });

  it("displays plan name", () => {
    render(<ClienteResumoDialog {...defaultProps} />);
    expect(screen.getByText("Plano Mensal")).toBeInTheDocument();
  });

  it("shows 'Sem plano ativo' when no plan", () => {
    render(<ClienteResumoDialog {...defaultProps} clienteResumoPlano={null} />);
    expect(screen.getByText("Sem plano ativo")).toBeInTheDocument();
  });

  it("does not render content when clienteResumo is null", () => {
    render(<ClienteResumoDialog {...defaultProps} clienteResumo={null} />);
    expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<ClienteResumoDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Resumo do Cliente")).not.toBeInTheDocument();
  });

  it("calls onClose when Fechar is clicked", () => {
    render(<ClienteResumoDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Fechar"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onVerPerfil when Ver perfil is clicked", () => {
    render(<ClienteResumoDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Ver perfil completo"));
    expect(defaultProps.onVerPerfil).toHaveBeenCalled();
  });

  it("shows suspend button for SUSPENSO clients", () => {
    render(
      <ClienteResumoDialog
        {...defaultProps}
        clienteResumo={{ ...mockAluno, status: "SUSPENSO" }}
      />,
    );
    expect(screen.getByText("Liberar suspensão")).toBeInTheDocument();
  });

  it("does not show suspend button for ATIVO clients", () => {
    render(<ClienteResumoDialog {...defaultProps} />);
    expect(screen.queryByText("Liberar suspensão")).not.toBeInTheDocument();
  });

  it("calls onLiberarSuspensao when button is clicked", () => {
    render(
      <ClienteResumoDialog
        {...defaultProps}
        clienteResumo={{ ...mockAluno, status: "SUSPENSO" }}
      />,
    );
    fireEvent.click(screen.getByText("Liberar suspensão"));
    expect(defaultProps.onLiberarSuspensao).toHaveBeenCalled();
  });

  it("disables suspend button when liberandoSuspensao is true", () => {
    render(
      <ClienteResumoDialog
        {...defaultProps}
        clienteResumo={{ ...mockAluno, status: "SUSPENSO" }}
        liberandoSuspensao={true}
      />,
    );
    expect(screen.getByText("Liberando...")).toBeDisabled();
  });
});
