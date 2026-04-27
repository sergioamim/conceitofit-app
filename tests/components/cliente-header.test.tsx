
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClienteHeader } from "@/components/shared/cliente-header";
import type { Aluno } from "@/lib/types";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, className }: any) => <img src={src} alt={alt} className={className} />,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }: any) => <div className={className}>{children}</div>,
    span: ({ children, className }: any) => <span className={className}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));

const mockAluno: Aluno = {
  id: "1",
  nome: "João Silva",
  email: "joao@example.com",
  cpf: "123.456.789-00",
  telefone: "(11) 99999-9999",
  sexo: "M",
  dataNascimento: "1990-01-01",
  endereco: {
    logradouro: "Rua A",
    numero: "123",
    bairro: "Centro",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01001-000",
  },
  status: "ATIVO",
  dataCadastro: "2023-01-01T00:00:00Z",
  dataAtualizacao: "2023-01-01T00:00:00Z",
  tenantId: "tenant-1",
};

describe("ClienteHeader", () => {
  const defaultProps = {
    aluno: mockAluno,
    suspenso: false,
    onCartoes: vi.fn(),
    onNovaVenda: vi.fn(),
    onSuspender: vi.fn(),
    onReativar: vi.fn(),
    onLiberarAcesso: vi.fn(),
    onVincularAgregador: vi.fn(),
    onEdit: vi.fn(),
  };

  it("renders basic client information", () => {
    render(<ClienteHeader {...defaultProps} />);
    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("renders actions for active client", () => {
    render(<ClienteHeader {...defaultProps} />);
    // "Nova contratacao" foi renomeado pra "Venda" em 0be7df5 (2026-04-23),
    // parte do refactor que moveu "Nova Venda" do menu pro header/topbar.
    expect(screen.getByText("Venda")).toBeInTheDocument();
    expect(screen.queryByText("Vincular agregador")).not.toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    const menuBtn = buttons.find(b => b.querySelector(".lucide-ellipsis-vertical"));
    if (menuBtn) fireEvent.click(menuBtn);
    expect(screen.getByText("Suspender")).toBeInTheDocument();
    expect(screen.queryByText("Vincular agregador")).not.toBeInTheDocument();
  });

  it("renders reativar action when client is suspended", () => {
    render(<ClienteHeader {...defaultProps} suspenso={true} />);
    
    // Open menu to see Reativar
    const buttons = screen.getAllByRole("button");
    const menuBtn = buttons.find(b => b.querySelector(".lucide-ellipsis-vertical"));
    if (menuBtn) fireEvent.click(menuBtn);
    expect(screen.getByText("Reativar")).toBeInTheDocument();
    expect(screen.queryByText("Suspender")).not.toBeInTheDocument();
  });

  it("calls onSuspender when suspend button is clicked", () => {
    render(<ClienteHeader {...defaultProps} />);
    
    // Open menu
    const buttons = screen.getAllByRole("button");
    const menuBtn = buttons.find(b => b.querySelector(".lucide-ellipsis-vertical"));
    if (menuBtn) fireEvent.click(menuBtn);
    
    const suspendButton = screen.getByText("Suspender");
    fireEvent.click(suspendButton);
    expect(defaultProps.onSuspender).toHaveBeenCalled();
  });

  it("onEdit é prop herdada mas não há botão Editar no header atual", () => {
    // Desde Perfil v2 Wave 2 a edição vive no `ClienteEditDrawer` acionado
    // externamente (menu do page.tsx), não mais em um botão do header.
    // Mantemos a prop por retrocompat mas ela não dispara clique interno.
    render(<ClienteHeader {...defaultProps} />);
    expect(defaultProps.onEdit).not.toHaveBeenCalled();
  });

  it("does not render contract summary in the top header even when a plan exists", () => {
    render(
      <ClienteHeader
        {...defaultProps}
        planoAtivo={{ dataFim: "2024-12-31" }}
        planoAtivoInfo={{ id: "p1", nome: "Plano Black", valor: 100, periodo: "mensal" } as any}
      />
    );
    expect(screen.queryByText(/Plano Black/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Contrato ativo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sem contrato/i)).not.toBeInTheDocument();
  });

  it("calls onVincularAgregador from the overflow menu for inactive client", () => {
    render(
      <ClienteHeader
        {...defaultProps}
        aluno={{ ...mockAluno, status: "INATIVO" }}
      />
    );
    const buttons = screen.getAllByRole("button");
    const menuBtn = buttons.find(b => b.querySelector(".lucide-ellipsis-vertical"));
    if (menuBtn) fireEvent.click(menuBtn);
    fireEvent.click(screen.getByText("Vincular agregador"));
    expect(defaultProps.onVincularAgregador).toHaveBeenCalled();
  });
});
