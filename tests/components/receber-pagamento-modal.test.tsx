import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReceberPagamentoModal } from "@/components/shared/receber-pagamento-modal";
import type { Pagamento, FormaPagamento } from "@/lib/types";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select">{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
}));

vi.mock("@/lib/business-date", () => ({
  getBusinessTodayIso: () => "2024-06-15",
}));

const basePagamento = {
  id: "p1",
  tenantId: "t1",
  matriculaId: "m1",
  alunoId: "a1",
  tipo: "MENSALIDADE" as const,
  descricao: "Mensalidade Junho",
  valor: 150,
  desconto: 0,
  valorFinal: 150,
  status: "PENDENTE" as const,
  dataVencimento: "2024-06-20",
  formaPagamento: "PIX" as const,
  dataCriacao: "2024-06-01T00:00:00",
} as Pagamento;

const formasPagamento = [
  { id: "fp1", tipo: "PIX" as const, nome: "PIX", ativo: true },
  { id: "fp2", tipo: "CARTAO_CREDITO" as const, nome: "Cartão de crédito", ativo: true },
  { id: "fp3", tipo: "DINHEIRO" as const, nome: "Dinheiro", ativo: false },
] as FormaPagamento[];

describe("ReceberPagamentoModal", () => {
  const defaultProps = {
    pagamento: basePagamento,
    formasPagamento: formasPagamento,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  it("renders the modal title", () => {
    render(<ReceberPagamentoModal {...defaultProps} />);
    expect(screen.getByText("Receber pagamento")).toBeInTheDocument();
  });

  it("displays payment description and value", () => {
    render(<ReceberPagamentoModal {...defaultProps} />);
    expect(screen.getByText("Mensalidade Junho")).toBeInTheDocument();
  });

  it("shows convenio info when provided", () => {
    render(
      <ReceberPagamentoModal
        {...defaultProps}
        convenio={{ nome: "Empresa X", descontoPercentual: 10 }}
      />,
    );
    expect(screen.getByText("Empresa X")).toBeInTheDocument();
  });

  it("renders date and payment fields", () => {
    render(<ReceberPagamentoModal {...defaultProps} />);
    expect(screen.getByText("Data do pagamento *")).toBeInTheDocument();
    expect(screen.getByText("Forma de pagamento *")).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", () => {
    render(<ReceberPagamentoModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders observations field", () => {
    render(<ReceberPagamentoModal {...defaultProps} />);
    expect(screen.getByText("Observações")).toBeInTheDocument();
  });

  it("only shows active payment methods", () => {
    render(<ReceberPagamentoModal {...defaultProps} />);
    expect(screen.getByText("PIX")).toBeInTheDocument();
    expect(screen.getByText("Cartão de crédito")).toBeInTheDocument();
    expect(screen.queryByText("Dinheiro")).not.toBeInTheDocument();
  });
});
