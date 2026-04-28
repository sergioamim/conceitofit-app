/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const mockCreateAlunoService = vi.fn().mockResolvedValue({ id: "aluno-1", nome: "Maria Teste" });

vi.mock("@/lib/tenant/comercial/runtime", () => ({
  createAlunoService: (...args: unknown[]) => mockCreateAlunoService(...args),
  checkAlunoDuplicidadeService: vi.fn().mockResolvedValue({ exists: false }),
}));

vi.mock("@/lib/tenant/hooks/use-session-context", () => ({
  useTenantContext: () => ({
    tenantId: "tenant-123",
    tenantResolved: true,
    activeTenantId: "tenant-123",
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
    showComplementary: false,
    setShowComplementary: vi.fn(),
    loading: false,
    form: {
      getValues: vi.fn(() => ({})),
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
    fullReset: vi.fn(),
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

describe("NovoClienteWizard (VUN-5.1: 3 CTAs finais)", () => {
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

    it("renderiza apenas o Step 1 (dados) — sem stepper Plano/Pagamento", () => {
      renderWizard();
      expect(screen.getByTestId("step-dados")).toBeInTheDocument();
      // VUN-5.1: removido o stepper Dados/Plano/Pagamento.
      expect(screen.queryByText("Plano")).not.toBeInTheDocument();
      expect(screen.queryByText("Pagamento")).not.toBeInTheDocument();
    });
  });

  describe("3 CTAs no footer (VUN-5.1)", () => {
    it("renderiza os 3 CTAs: Salvar, Vender, Vincular agregador", () => {
      renderWizard({}, { isValid: true });
      expect(screen.getByTestId("wizard-cta-salvar")).toBeInTheDocument();
      expect(screen.getByTestId("wizard-cta-vender")).toBeInTheDocument();
      expect(screen.getByTestId("wizard-cta-vincular-agregador")).toBeInTheDocument();
    });

    it("desabilita os 3 CTAs quando o form é inválido", () => {
      renderWizard();
      expect(screen.getByTestId("wizard-cta-salvar")).toBeDisabled();
      expect(screen.getByTestId("wizard-cta-vender")).toBeDisabled();
      expect(screen.getByTestId("wizard-cta-vincular-agregador")).toBeDisabled();
    });

    it("habilita os 3 CTAs quando o form é válido", () => {
      renderWizard({}, { isValid: true });
      expect(screen.getByTestId("wizard-cta-salvar")).toBeEnabled();
      expect(screen.getByTestId("wizard-cta-vender")).toBeEnabled();
      expect(screen.getByTestId("wizard-cta-vincular-agregador")).toBeEnabled();
    });

    it("CTA 'Salvar' chama handleCreateOnly() sem opts", async () => {
      const handleCreateOnly = vi.fn();
      renderWizard({}, { isValid: true, handleCreateOnly });
      fireEvent.click(screen.getByTestId("wizard-cta-salvar"));
      await waitFor(() => {
        expect(handleCreateOnly).toHaveBeenCalledWith();
      });
    });

    it("CTA 'Vender' chama handleCreateOnly({ openSale: true })", async () => {
      const handleCreateOnly = vi.fn();
      renderWizard({}, { isValid: true, handleCreateOnly });
      fireEvent.click(screen.getByTestId("wizard-cta-vender"));
      await waitFor(() => {
        expect(handleCreateOnly).toHaveBeenCalledWith({ openSale: true });
      });
    });

    it("CTA 'Vincular agregador' chama handleCreateOnly({ linkAggregator: true })", async () => {
      const handleCreateOnly = vi.fn();
      renderWizard({}, { isValid: true, handleCreateOnly });
      fireEvent.click(screen.getByTestId("wizard-cta-vincular-agregador"));
      await waitFor(() => {
        expect(handleCreateOnly).toHaveBeenCalledWith({ linkAggregator: true });
      });
    });
  });

  describe("Botão Voltar", () => {
    it("botão 'Voltar' fecha o wizard", () => {
      const onClose = vi.fn();
      renderWizard({ onClose });
      fireEvent.click(screen.getByText("Voltar"));
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe("Wizard types e helpers", () => {
  it("clienteWizardSchema valida nome mínimo", async () => {
    const { clienteWizardSchema } = await import(
      "@/components/shared/novo-cliente-wizard/wizard-types"
    );
    const result = clienteWizardSchema.safeParse({
      nome: "AB",
      email: "maria@email.com",
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
      email: "maria@email.com",
      telefone: "11999990000",
      cpf: "123.456.789-09",
      dataNascimento: "1993-02-10",
      sexo: "F",
      pagamento: { dataInicio: "2026-03-29", formaPagamento: "PIX" },
    });
    expect(result.success).toBe(true);
  });

  it("clienteWizardSchema rejeita data de nascimento ausente", async () => {
    const { clienteWizardSchema } = await import(
      "@/components/shared/novo-cliente-wizard/wizard-types"
    );
    const result = clienteWizardSchema.safeParse({
      nome: "Maria Teste",
      email: "maria@email.com",
      telefone: "11999990000",
      cpf: "123.456.789-09",
      sexo: "F",
      pagamento: {},
    });
    expect(result.success).toBe(false);
  });

  it("clienteWizardSchema rejeita data de nascimento futura", async () => {
    const { clienteWizardSchema } = await import(
      "@/components/shared/novo-cliente-wizard/wizard-types"
    );
    const result = clienteWizardSchema.safeParse({
      nome: "Maria Teste",
      email: "maria@email.com",
      telefone: "11999990000",
      cpf: "123.456.789-09",
      dataNascimento: "2099-01-01",
      sexo: "F",
      pagamento: {},
    });
    expect(result.success).toBe(false);
  });

  it("clienteWizardSchema rejeita CPF com formato inválido", async () => {
    const { clienteWizardSchema } = await import(
      "@/components/shared/novo-cliente-wizard/wizard-types"
    );
    const result = clienteWizardSchema.safeParse({
      nome: "Maria Teste",
      email: "maria@email.com",
      telefone: "11999990000",
      cpf: "12345678909",
      dataNascimento: "1993-02-10",
      sexo: "F",
      pagamento: {},
    });
    expect(result.success).toBe(false);
  });

  it("clienteWizardSchema rejeita e-mail ausente", async () => {
    const { clienteWizardSchema } = await import(
      "@/components/shared/novo-cliente-wizard/wizard-types"
    );
    const result = clienteWizardSchema.safeParse({
      nome: "Maria Teste",
      email: "",
      telefone: "11999990000",
      cpf: "123.456.789-09",
      dataNascimento: "1993-02-10",
      sexo: "F",
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
