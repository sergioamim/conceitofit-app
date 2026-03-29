import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NovaMatriculaModal } from "@/components/shared/nova-matricula-modal";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

vi.mock("@/lib/business-date", () => ({
  getBusinessTodayIso: () => "2024-06-15",
}));

vi.mock("@/hooks/use-form-draft", () => ({
  useFormDraft: () => ({
    draft: null,
    hasDraft: false,
    saveDraft: vi.fn(),
    clearDraft: vi.fn(),
    restoreDraft: vi.fn(),
  }),
}));

vi.mock("@/components/shared/form-draft-components", () => ({
  FormDraftIndicator: () => null,
  RestoreDraftModal: () => null,
}));

vi.mock("@/lib/tenant/hooks/use-commercial-flow", () => ({
  useCommercialFlow: () => ({
    alunos: [{ id: "a1", nome: "Ana Costa", cpf: "123", telefone: "11999" }],
    planos: [{ id: "p1", nome: "Mensal", valor: 100, tipo: "MENSAL", atividades: [], beneficios: [], ativo: true, duracaoMeses: 1 }],
    formasPagamento: [{ id: "fp1", tipo: "PIX", nome: "PIX", ativo: true }],
    loadAlunos: vi.fn(),
    setClienteId: vi.fn(),
    selectedPlano: null,
    conveniosPlano: [],
    setConvenioPlanoId: vi.fn(),
    addPlanoToCart: vi.fn(),
    clearCart: vi.fn(),
    dryRun: null,
    total: 0,
    processSale: vi.fn(),
    saving: false,
  }),
}));

vi.mock("@/lib/tenant/hooks/use-session-context", () => ({
  useTenantContext: () => ({ tenantId: "t1" }),
}));

vi.mock("@/lib/formatters", () => ({
  formatBRL: (v: number) => `R$ ${v.toFixed(2)}`,
}));

describe("NovaMatriculaModal", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onDone: vi.fn(),
    prefillClienteId: undefined,
  };

  it("renders the modal title", () => {
    render(<NovaMatriculaModal {...defaultProps} />);
    expect(screen.getByText("Nova contratação de plano")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<NovaMatriculaModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Nova contratação de plano")).not.toBeInTheDocument();
  });

  it("renders client and plan selection fields", () => {
    render(<NovaMatriculaModal {...defaultProps} />);
    expect(screen.getByText("Cliente *")).toBeInTheDocument();
    expect(screen.getByText("Plano *")).toBeInTheDocument();
  });

  it("renders start date field", () => {
    render(<NovaMatriculaModal {...defaultProps} />);
    expect(screen.getByText("Data de início *")).toBeInTheDocument();
  });

  it("calls onClose when Cancelar is clicked", () => {
    render(<NovaMatriculaModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders payment method field", () => {
    render(<NovaMatriculaModal {...defaultProps} />);
    expect(screen.getByText("Forma de pagamento *")).toBeInTheDocument();
  });
});
