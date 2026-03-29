import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReceberPagamentoModal } from "@/components/shared/receber-pagamento-modal";
import type { FormaPagamento, Pagamento } from "@/lib/types";

vi.mock("@/lib/business-date", () => ({
  getBusinessTodayIso: () => "2026-03-29",
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => {
  function Select({ children, value, onValueChange }: any) {
    return (
      <div data-testid="select-root" data-value={value}>
        {typeof children === "function"
          ? children({ value, onValueChange })
          : children}
      </div>
    );
  }
  function SelectTrigger({ children, ...props }: any) {
    return <button type="button" {...props}>{children}</button>;
  }
  function SelectValue({ placeholder }: any) {
    return <span>{placeholder}</span>;
  }
  function SelectContent({ children }: any) {
    return <div>{children}</div>;
  }
  function SelectItem({ children, value }: any) {
    return <option value={value}>{children}</option>;
  }
  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

const PAGAMENTO_MOCK: Pagamento = {
  id: "pag-1",
  tenantId: "t-1",
  alunoId: "a-1",
  tipo: "MENSALIDADE",
  descricao: "Mensalidade Março 2026",
  valor: 150,
  desconto: 0,
  valorFinal: 150,
  dataVencimento: "2026-03-15",
  status: "PENDENTE",
  dataCriacao: "2026-03-01T10:00:00",
};

const FORMAS_PAGAMENTO_MOCK: FormaPagamento[] = [
  {
    id: "fp-1",
    tenantId: "t-1",
    nome: "PIX",
    tipo: "PIX",
    taxaPercentual: 0,
    maxParcelas: 1,
    ativo: true,
    emissaoAutomatica: false,
    prazoRecebimentoDias: 0,
    instrucoesRecebimento: "",
  },
  {
    id: "fp-2",
    tenantId: "t-1",
    nome: "Cartão Crédito",
    tipo: "CARTAO_CREDITO",
    taxaPercentual: 2.5,
    maxParcelas: 12,
    ativo: true,
    emissaoAutomatica: false,
    prazoRecebimentoDias: 30,
    instrucoesRecebimento: "",
  },
  {
    id: "fp-3",
    tenantId: "t-1",
    nome: "Boleto (inativo)",
    tipo: "BOLETO",
    taxaPercentual: 1,
    maxParcelas: 1,
    ativo: false,
    emissaoAutomatica: false,
    prazoRecebimentoDias: 3,
    instrucoesRecebimento: "",
  },
];

function renderModal(overrides?: Partial<Parameters<typeof ReceberPagamentoModal>[0]>) {
  const defaultProps = {
    pagamento: PAGAMENTO_MOCK,
    formasPagamento: FORMAS_PAGAMENTO_MOCK,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
  const result = render(<ReceberPagamentoModal {...defaultProps} />);
  return { ...result, props: defaultProps };
}

describe("ReceberPagamentoModal", () => {
  it("renders title and payment description", () => {
    renderModal();
    expect(screen.getByText("Receber pagamento")).toBeInTheDocument();
    expect(screen.getByText("Mensalidade Março 2026")).toBeInTheDocument();
  });

  it("displays payment value formatted as BRL", () => {
    renderModal();
    expect(screen.getByText(/R\$\s*150,00/)).toBeInTheDocument();
  });

  it("renders date input with today as default", () => {
    renderModal();
    const dateInput = screen.getByLabelText(/Data do pagamento/i);
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveValue("2026-03-29");
  });

  it("renders only active payment methods", () => {
    renderModal();
    expect(screen.getByText("PIX")).toBeInTheDocument();
    expect(screen.getByText("Cartão Crédito")).toBeInTheDocument();
    expect(screen.queryByText("Boleto (inativo)")).not.toBeInTheDocument();
  });

  it("renders convenio info when provided", () => {
    renderModal({
      convenio: { nome: "Convênio Empresa X", descontoPercentual: 15 },
    });
    expect(screen.getByText("Convênio Empresa X")).toBeInTheDocument();
    expect(screen.getByText(/15%/)).toBeInTheDocument();
  });

  it("does not render convenio section when not provided", () => {
    renderModal();
    expect(screen.queryByText(/Convênio:/)).not.toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByText("Cancelar"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("renders observations input", () => {
    renderModal();
    const obsInput = screen.getByLabelText(/Observações/i);
    expect(obsInput).toBeInTheDocument();
  });

  it("renders confirm button", () => {
    renderModal();
    expect(screen.getByText("Confirmar")).toBeInTheDocument();
  });

  it("allows changing the payment date", () => {
    renderModal();
    const dateInput = screen.getByLabelText(/Data do pagamento/i);
    fireEvent.change(dateInput, { target: { value: "2026-04-01" } });
    expect(dateInput).toHaveValue("2026-04-01");
  });

  it("allows typing observations", () => {
    renderModal();
    const obsInput = screen.getByLabelText(/Observações/i);
    fireEvent.change(obsInput, { target: { value: "Pago em espécie" } });
    expect(obsInput).toHaveValue("Pago em espécie");
  });
});
