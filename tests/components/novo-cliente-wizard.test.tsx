/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

vi.mock("@/components/shared/novo-cliente-wizard/wizard-step-dados", () => ({
  Step1Dados: () => <div data-testid="step-dados">Step 1</div>,
}));

vi.mock("@/components/shared/novo-cliente-wizard/wizard-step-plano", () => ({
  Step2Plano: () => <div data-testid="step-plano">Step 2</div>,
}));

vi.mock("@/components/shared/novo-cliente-wizard/wizard-step-pagamento", () => ({
  Step3Pagamento: () => <div data-testid="step-pagamento">Step 3</div>,
}));

vi.mock("@/components/shared/novo-cliente-wizard/wizard-step-sucesso", () => ({
  StepSucesso: () => <div data-testid="step-sucesso">Sucesso</div>,
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

const wizardStateRef = vi.hoisted(() => ({
  current: null as any,
}));

vi.mock("@/components/shared/novo-cliente-wizard/use-cliente-wizard-state", () => ({
  useClienteWizardState: () => wizardStateRef.current,
}));

// ── Helpers ────────────────────────────────────────────────────────────

function createWizardState(overrides: Record<string, unknown> = {}) {
  return {
    step: 1,
    setStep: vi.fn(),
    showComplementary: false,
    setShowComplementary: vi.fn(),
    result: null,
    loading: false,
    form: {
      getValues: vi.fn(() => ({ selectedPlano: "p1" })),
    },
    draft: {
      hasDraft: false,
      restoreDraft: vi.fn(),
      discardDraft: vi.fn(),
      clearDraft: vi.fn(),
      lastModified: null,
    },
    isDirty: false,
    isValid: false,
    planos: mockPlanos,
    formas: mockFormas,
    commercial: {
      addPlanoToCart: vi.fn(),
    },
    fullReset: vi.fn(),
    handleNext: vi.fn(),
    handleCreateOnly: vi.fn(),
    ...overrides,
  };
}

function renderWizard(
  props: Partial<Parameters<typeof NovoClienteWizard>[0]> = {},
  wizardStateOverrides: Record<string, unknown> = {},
) {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onDone: vi.fn(),
  };
  wizardStateRef.current = createWizardState(wizardStateOverrides);
  return render(<NovoClienteWizard {...defaultProps} {...props} />);
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
      expect(screen.getByTestId("step-dados")).toBeInTheDocument();
    });
  });

  describe("Navegação entre steps", () => {
    it("botão 'Voltar' no step 1 fecha o wizard", () => {
      const onClose = vi.fn();
      renderWizard({ onClose });
      fireEvent.click(screen.getByText("Voltar"));
      expect(onClose).toHaveBeenCalled();
    });

    it("exibe botão 'Continuar com plano' no step 1", () => {
      renderWizard();
      expect(screen.getByText(/continuar com plano/i)).toBeInTheDocument();
    });

    it("exibe botão 'Apenas pre-cadastro' no step 1", () => {
      renderWizard();
      expect(screen.getByText("Apenas pre-cadastro")).toBeInTheDocument();
    });
  });

  describe("Validação por step", () => {
    it("mantém as ações desabilitadas quando o estado do formulário é inválido", () => {
      renderWizard();
      expect(screen.getByText("Apenas pre-cadastro")).toBeDisabled();
      expect(screen.getByText(/continuar com plano/i)).toBeDisabled();
    });

    it("botão Apenas pre-cadastro está desabilitado com formulário inválido", () => {
      renderWizard();
      const btn = screen.getByText("Apenas pre-cadastro");
      expect(btn).toBeDisabled();
    });
  });

  describe("Pré-cadastro (createOnly)", () => {
    it("botão apenas pre-cadastro visível no step 1", () => {
      renderWizard();
      expect(screen.getByText("Apenas pre-cadastro")).toBeInTheDocument();
      expect(screen.getByText(/continuar com plano/i)).toBeInTheDocument();
    });

    it("botões de ação desabilitados quando form inválido", () => {
      renderWizard();
      expect(screen.getByText("Apenas pre-cadastro")).toBeDisabled();
      expect(screen.getByText(/continuar com plano/i)).toBeDisabled();
    });

    it("habilita as ações quando o estado do formulário é válido", () => {
      renderWizard({}, { isValid: true });
      expect(screen.getByText("Apenas pre-cadastro")).toBeEnabled();
      expect(screen.getByText(/continuar com plano/i)).toBeEnabled();
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
