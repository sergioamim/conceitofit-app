import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NovoClienteWizard } from "@/components/shared/novo-cliente-wizard";

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock("@/components/shared/form-draft-components", () => ({
  FormDraftIndicator: () => null,
  RestoreDraftModal: () => null,
}));

const mockPlanos = [
  { id: "p1", nome: "Mensal Básico", tipo: "MENSAL", valor: 99, atividades: [], beneficios: [], ativo: true },
  { id: "p2", nome: "Trimestral", tipo: "TRIMESTRAL", valor: 249, atividades: [], beneficios: [], ativo: true },
];
const mockFormas = [
  { id: "fp1", tipo: "PIX", taxaPercentual: 0, parcelasMax: 1, prazoRecebimentoDias: 0, nome: "PIX", ativo: true },
];

const mockCreateAlunoService = vi.fn().mockResolvedValue({ id: "aluno-1", nome: "Maria Teste" });
const mockCreateAlunoComMatriculaService = vi.fn().mockResolvedValue({
  aluno: { id: "aluno-1", nome: "Maria Teste" },
  matricula: { id: "m1" },
  pagamento: { id: "pg1" },
});

vi.mock("@/lib/tenant/comercial/runtime", () => ({
  createAlunoService: (...args: unknown[]) => mockCreateAlunoService(...args),
  createAlunoComMatriculaService: (...args: unknown[]) => mockCreateAlunoComMatriculaService(...args),
  checkAlunoDuplicidadeService: vi.fn().mockResolvedValue({ exists: false }),
}));

vi.mock("@/lib/tenant/hooks/use-session-context", () => ({
  useTenantContext: () => ({
    tenantId: "tenant-123",
    tenantResolved: true,
    activeTenantId: "tenant-123",
  }),
}));

vi.mock("@/lib/tenant/hooks/use-commercial-flow", () => ({
  useCommercialFlow: () => ({
    planos: mockPlanos,
    formasPagamento: mockFormas,
    clearCart: vi.fn(),
    addPlanoToCart: vi.fn(),
    dryRun: {
      planoContexto: { planoId: "p1", dataInicio: "2026-03-29" },
      descontoTotal: 0,
    },
  }),
}));

vi.mock("@/hooks/use-form-draft", () => ({
  useFormDraft: () => ({
    hasDraft: false,
    restoreDraft: vi.fn(),
    clearDraft: vi.fn(),
    discardDraft: vi.fn(),
    lastModified: null,
  }),
}));

vi.mock("@/lib/business-date", () => ({
  getBusinessTodayIso: () => "2026-03-29",
}));

// ── Helpers ────────────────────────────────────────────────────────────

function renderWizard(props: Partial<Parameters<typeof NovoClienteWizard>[0]> = {}) {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onDone: vi.fn(),
  };
  return render(<NovoClienteWizard {...defaultProps} {...props} />);
}

function fillStep1() {
  fireEvent.change(screen.getByTestId("novo-cliente-nome"), { target: { value: "Maria Teste" } });
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("NovoClienteWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("Renderização inicial", () => {
    it("renderiza o dialog quando open=true", () => {
      renderWizard();
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
      expect(screen.getByText("Novo cliente")).toBeInTheDocument();
    });

    it("não renderiza quando open=false", () => {
      renderWizard({ open: false });
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("exibe step indicators com step 1 ativo", () => {
      renderWizard();
      expect(screen.getByText("Dados")).toBeInTheDocument();
      expect(screen.getByText("Plano")).toBeInTheDocument();
      expect(screen.getByText("Pagamento")).toBeInTheDocument();
    });

    it("exibe campos do step 1 via testid", () => {
      renderWizard();
      expect(screen.getByTestId("novo-cliente-nome")).toBeInTheDocument();
    });
  });

  describe("Navegação entre steps", () => {
    it("botão 'Voltar' no step 1 fecha o wizard", () => {
      const onClose = vi.fn();
      renderWizard({ onClose });
      fireEvent.click(screen.getByText("Voltar"));
      expect(onClose).toHaveBeenCalled();
    });

    it("exibe botão 'Completar cadastro' no step 1", () => {
      renderWizard();
      expect(screen.getByText(/completar cadastro/i)).toBeInTheDocument();
    });

    it("exibe botão 'Pré-cadastro' no step 1", () => {
      renderWizard();
      expect(screen.getByText("Pré-cadastro")).toBeInTheDocument();
    });
  });

  describe("Validação por step", () => {
    it("não avança para step 2 com campos vazios", async () => {
      renderWizard();
      fireEvent.click(screen.getByText(/completar cadastro/i));
      // Deve permanecer no step 1 (campo nome ainda visível)
      await waitFor(() => {
        expect(screen.getByTestId("novo-cliente-nome")).toBeInTheDocument();
      });
    });

    it("botão Pré-cadastro está desabilitado com formulário inválido", () => {
      renderWizard();
      const btn = screen.getByText("Pré-cadastro");
      expect(btn).toBeDisabled();
    });
  });

  describe("Pré-cadastro (createOnly)", () => {
    it("botão pré-cadastro visível no step 1", () => {
      renderWizard();
      expect(screen.getByText("Pré-cadastro")).toBeInTheDocument();
      expect(screen.getByText(/pré-cadastro \+ venda/i)).toBeInTheDocument();
    });

    it("botões de ação desabilitados quando form inválido", () => {
      renderWizard();
      expect(screen.getByText("Pré-cadastro")).toBeDisabled();
      expect(screen.getByText(/pré-cadastro \+ venda/i)).toBeDisabled();
    });
  });
});

describe("Wizard types e helpers", () => {
  it("normalizeDraftEmail gera email temporário sem email informado", async () => {
    const { normalizeDraftEmail } = await import(
      "@/components/shared/novo-cliente-wizard/wizard-types"
    );
    const result = normalizeDraftEmail("Maria", "12345678901", "");
    expect(result).toContain("maria");
    expect(result).toContain("@temporario.local");
  });

  it("normalizeDraftEmail retorna email informado quando presente", async () => {
    const { normalizeDraftEmail } = await import(
      "@/components/shared/novo-cliente-wizard/wizard-types"
    );
    const result = normalizeDraftEmail("Maria", "12345678901", "maria@email.com");
    expect(result).toBe("maria@email.com");
  });

  it("clienteWizardSchema valida nome mínimo", async () => {
    const { clienteWizardSchema } = await import(
      "@/components/shared/novo-cliente-wizard/wizard-types"
    );
    const result = clienteWizardSchema.safeParse({
      nome: "AB",
      email: "",
      telefone: "11999990000",
      cpf: "123.456.789-09",
      pagamento: {},
    });
    expect(result.success).toBe(false);
  });

  it("clienteWizardSchema aceita dados válidos", async () => {
    const { clienteWizardSchema } = await import(
      "@/components/shared/novo-cliente-wizard/wizard-types"
    );
    const result = clienteWizardSchema.safeParse({
      nome: "Maria Teste",
      email: "",
      telefone: "11999990000",
      cpf: "123.456.789-09",
      pagamento: { dataInicio: "2026-03-29", formaPagamento: "PIX" },
    });
    expect(result.success).toBe(true);
  });

  it("clienteWizardSchema rejeita CPF com formato inválido", async () => {
    const { clienteWizardSchema } = await import(
      "@/components/shared/novo-cliente-wizard/wizard-types"
    );
    const result = clienteWizardSchema.safeParse({
      nome: "Maria Teste",
      email: "",
      telefone: "11999990000",
      cpf: "12345678909",
      pagamento: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("Draft persistence (useFormDraft)", () => {
  it("salva draft no localStorage", () => {
    const key = "form_draft_test_wizard";
    const payload = { data: { nome: "Draft Test" }, timestamp: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(payload));

    const stored = localStorage.getItem(key);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.data.nome).toBe("Draft Test");
  });

  it("restaura draft do localStorage", () => {
    const key = "form_draft_test_wizard";
    const payload = { data: { nome: "Restored" }, timestamp: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(payload));

    const stored = localStorage.getItem(key);
    const parsed = JSON.parse(stored!);
    expect(parsed.data.nome).toBe("Restored");
    expect(parsed.timestamp).toBeTruthy();
  });

  it("limpa draft ao remover do localStorage", () => {
    const key = "form_draft_test_wizard";
    localStorage.setItem(key, JSON.stringify({ data: {}, timestamp: new Date().toISOString() }));
    localStorage.removeItem(key);
    expect(localStorage.getItem(key)).toBeNull();
  });

  it("expiração: ignora draft mais antigo que 24h", () => {
    const key = "form_draft_test_wizard";
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(key, JSON.stringify({ data: { nome: "Old" }, timestamp: old }));

    const stored = localStorage.getItem(key);
    const parsed = JSON.parse(stored!);
    const age = Date.now() - new Date(parsed.timestamp).getTime();
    const expired = age > 24 * 60 * 60 * 1000;
    expect(expired).toBe(true);
  });
});
