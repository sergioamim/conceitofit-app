import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PlanoForm } from "@/components/planos/plano-form";
import type { Atividade } from "@/lib/types";
import { getDefaultPlanoFormValues, type PlanoFormValues } from "@/lib/tenant/planos/form";

// Mock Radix Dialog (RestoreDraftModal uses it)
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

// Mock Radix Select
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => (
    <div data-testid="select-wrapper">{children}</div>
  ),
  SelectTrigger: ({ children, className }: any) => (
    <button type="button" className={className}>{children}</button>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
}));

// Mock RichTextEditor
vi.mock("@/components/shared/rich-text-editor", () => ({
  RichTextEditor: ({ value, onChange, placeholder }: any) => (
    <textarea
      data-testid="rich-text-editor"
      value={value ?? ""}
      onChange={(e: any) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

// Mock useFormDraft
vi.mock("@/hooks/use-form-draft", () => ({
  useFormDraft: () => ({
    hasDraft: false,
    restoreDraft: vi.fn(),
    discardDraft: vi.fn(),
    clearDraft: vi.fn(),
    lastModified: null,
  }),
}));

// Mock FormDraftIndicator
vi.mock("@/components/shared/form-draft-components", () => ({
  FormDraftIndicator: () => null,
  RestoreDraftModal: () => null,
}));

const MOCK_ATIVIDADES: Atividade[] = [
  {
    id: "at-1",
    tenantId: "t1",
    nome: "Musculacao",
    categoria: "MUSCULACAO",
    permiteCheckin: true,
    checkinObrigatorio: false,
    ativo: true,
  },
  {
    id: "at-2",
    tenantId: "t1",
    nome: "Yoga",
    categoria: "COLETIVA",
    permiteCheckin: true,
    checkinObrigatorio: true,
    ativo: true,
  },
  {
    id: "at-3",
    tenantId: "t1",
    nome: "Natacao",
    categoria: "COLETIVA",
    permiteCheckin: false,
    checkinObrigatorio: false,
    ativo: false,
  },
];

function renderPlanoForm(overrides?: Partial<React.ComponentProps<typeof PlanoForm>>) {
  const defaultProps = {
    atividades: MOCK_ATIVIDADES,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    submitLabel: "Salvar",
    ...overrides,
  };
  return { ...render(<PlanoForm {...defaultProps} />), props: defaultProps };
}

describe("PlanoForm", () => {
  describe("renderizacao inicial", () => {
    it("renderiza os campos basicos na aba Configuracoes", () => {
      renderPlanoForm();

      expect(screen.getByText("Dados do plano")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Ex: Mensal Completo")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Descrição do plano")).toBeInTheDocument();
    });

    it("renderiza as 3 abas", () => {
      renderPlanoForm();

      expect(screen.getByRole("tab", { name: /configurações/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /contrato/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /atividades e benefícios/i })).toBeInTheDocument();
    });

    it("renderiza botoes Cancelar e Salvar", () => {
      renderPlanoForm();

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
      expect(screen.getByText("Salvar")).toBeInTheDocument();
    });

    it("botao submit desabilitado sem campos obrigatorios preenchidos", () => {
      renderPlanoForm();

      const submitBtn = screen.getByText("Salvar");
      expect(submitBtn).toBeDisabled();
    });
  });

  describe("validacao de campos", () => {
    it("habilita submit quando nome, valor e duracao preenchidos", async () => {
      renderPlanoForm();

      fireEvent.change(screen.getByPlaceholderText("Ex: Mensal Completo"), {
        target: { value: "Plano Mensal" },
      });

      // spinbuttons: duracaoDias, valor, valorMatricula, valorAnuidade, parcelasMaxAnuidade, diaCobranca, ordem
      const spinbuttons = screen.getAllByRole("spinbutton");
      fireEvent.change(spinbuttons[0], { target: { value: "30" } });
      fireEvent.change(spinbuttons[1], { target: { value: "99.90" } });

      await waitFor(() => {
        expect(screen.getByText("Salvar")).not.toBeDisabled();
      });
    });

    it("submit desabilitado com nome curto (< 2 chars)", async () => {
      renderPlanoForm();

      const nomeInput = screen.getByPlaceholderText("Ex: Mensal Completo");
      fireEvent.change(nomeInput, { target: { value: "A" } });

      const spinbuttons = screen.getAllByRole("spinbutton");
      fireEvent.change(spinbuttons[0], { target: { value: "30" } });
      fireEvent.change(spinbuttons[1], { target: { value: "100" } });

      await waitFor(() => {
        expect(screen.getByText("Salvar")).toBeDisabled();
      });
    });

    it("submit desabilitado com valor zero", async () => {
      renderPlanoForm();

      fireEvent.change(screen.getByPlaceholderText("Ex: Mensal Completo"), {
        target: { value: "Plano Test" },
      });

      const spinbuttons = screen.getAllByRole("spinbutton");
      fireEvent.change(spinbuttons[0], { target: { value: "30" } });
      fireEvent.change(spinbuttons[1], { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByText("Salvar")).toBeDisabled();
      });
    });

    it("submit desabilitado com duracao zero", async () => {
      renderPlanoForm();

      fireEvent.change(screen.getByPlaceholderText("Ex: Mensal Completo"), {
        target: { value: "Plano Test" },
      });

      const spinbuttons = screen.getAllByRole("spinbutton");
      fireEvent.change(spinbuttons[0], { target: { value: "0" } });
      fireEvent.change(spinbuttons[1], { target: { value: "100" } });

      await waitFor(() => {
        expect(screen.getByText("Salvar")).toBeDisabled();
      });
    });

    it("mostra erro para dia de cobranca fora do contrato", async () => {
      renderPlanoForm();

      fireEvent.click(screen.getByLabelText(/permite cobrança recorrente/i));
      fireEvent.change(screen.getByPlaceholderText("Ex: 5"), {
        target: { value: "5, 10" },
      });

      await waitFor(() => {
        expect(screen.getByText("Informe um único dia entre 1 e 28.")).toBeInTheDocument();
      });
    });
  });

  describe("navegacao entre abas", () => {
    it("troca para aba Contrato ao clicar", () => {
      renderPlanoForm();

      fireEvent.click(screen.getByRole("tab", { name: /contrato/i }));

      expect(screen.getByText("Contrato do plano")).toBeInTheDocument();
    });

    it("troca para aba Atividades e beneficios ao clicar", () => {
      renderPlanoForm();

      fireEvent.click(screen.getByRole("tab", { name: /atividades e benefícios/i }));

      expect(screen.getByText("Atividades incluídas")).toBeInTheDocument();
    });
  });

  describe("atividades", () => {
    it("renderiza todas as atividades como botoes", () => {
      renderPlanoForm();

      fireEvent.click(screen.getByRole("tab", { name: /atividades e benefícios/i }));

      expect(screen.getByText("Musculacao")).toBeInTheDocument();
      expect(screen.getByText("Yoga")).toBeInTheDocument();
      expect(screen.getByText("Natacao")).toBeInTheDocument();
    });

    it("mostra estado do checkin para cada atividade", () => {
      renderPlanoForm();

      fireEvent.click(screen.getByRole("tab", { name: /atividades e benefícios/i }));

      expect(screen.getByText("Check-in opcional")).toBeInTheDocument();
      expect(screen.getByText("Check-in obrigatório")).toBeInTheDocument();
      expect(screen.getByText("Inativa")).toBeInTheDocument();
    });

    it("seleciona atividade ao clicar no botao", () => {
      renderPlanoForm();

      fireEvent.click(screen.getByRole("tab", { name: /atividades e benefícios/i }));

      const musculacaoBtn = screen.getByText("Musculacao").closest("button")!;
      fireEvent.click(musculacaoBtn);

      // Verificar que a classe muda (atividade selecionada tem border-gym-accent)
      expect(musculacaoBtn.className).toContain("border-gym-accent");
    });

    it("desseleciona atividade ao clicar novamente", async () => {
      renderPlanoForm();

      fireEvent.click(screen.getByRole("tab", { name: /atividades e benefícios/i }));

      const musculacaoBtn = screen.getByText("Musculacao").closest("button")!;
      fireEvent.click(musculacaoBtn);
      fireEvent.click(musculacaoBtn);

      await waitFor(() => {
        expect(musculacaoBtn.className).not.toContain("border-gym-accent");
      });
    });

    it("seleciona todas as atividades ao clicar na ação em massa", async () => {
      renderPlanoForm();

      fireEvent.click(screen.getByRole("tab", { name: /atividades e benefícios/i }));
      fireEvent.click(screen.getByRole("button", { name: /selecionar todas/i }));

      await waitFor(() => {
        expect(screen.getByText("Musculacao").closest("button")?.className).toContain("border-gym-accent");
        expect(screen.getByText("Yoga").closest("button")?.className).toContain("border-gym-accent");
        expect(screen.getByText("Natacao").closest("button")?.className).toContain("border-gym-accent");
      });
    });

    it("limpa todas as atividades selecionadas ao clicar em limpar", async () => {
      renderPlanoForm();

      fireEvent.click(screen.getByRole("tab", { name: /atividades e benefícios/i }));
      fireEvent.click(screen.getByRole("button", { name: /selecionar todas/i }));
      fireEvent.click(screen.getByRole("button", { name: /limpar/i }));

      await waitFor(() => {
        expect(screen.getByText("Musculacao").closest("button")?.className).not.toContain("border-gym-accent");
        expect(screen.getByText("Yoga").closest("button")?.className).not.toContain("border-gym-accent");
        expect(screen.getByText("Natacao").closest("button")?.className).not.toContain("border-gym-accent");
      });
    });
  });

  describe("beneficios", () => {
    it("adiciona beneficio ao clicar no botao Adicionar", () => {
      renderPlanoForm();

      fireEvent.click(screen.getByRole("tab", { name: /atividades e benefícios/i }));

      const input = screen.getByPlaceholderText("Adicionar benefício");
      fireEvent.change(input, { target: { value: "Estacionamento gratis" } });
      fireEvent.click(screen.getByText("Adicionar"));

      expect(screen.getByText("Estacionamento gratis")).toBeInTheDocument();
    });

    it("nao adiciona beneficio vazio", () => {
      renderPlanoForm();

      fireEvent.click(screen.getByRole("tab", { name: /atividades e benefícios/i }));

      fireEvent.click(screen.getByText("Adicionar"));

      // Nenhum badge de beneficio deveria aparecer
      const badges = screen.queryAllByText("x");
      expect(badges).toHaveLength(0);
    });

    it("remove beneficio ao clicar no x", () => {
      renderPlanoForm();

      fireEvent.click(screen.getByRole("tab", { name: /atividades e benefícios/i }));

      const input = screen.getByPlaceholderText("Adicionar benefício");
      fireEvent.change(input, { target: { value: "Toalha" } });
      fireEvent.click(screen.getByText("Adicionar"));

      expect(screen.getByText("Toalha")).toBeInTheDocument();

      fireEvent.click(screen.getByText("x"));

      expect(screen.queryByText("Toalha")).not.toBeInTheDocument();
    });
  });

  describe("regras financeiras", () => {
    it("checkbox anuidade habilita campos de valor e parcelas", () => {
      renderPlanoForm();

      const anuidadeCheckbox = screen.getByLabelText(/cobrar anuidade/i);
      expect(anuidadeCheckbox).not.toBeChecked();

      fireEvent.click(anuidadeCheckbox);

      expect(anuidadeCheckbox).toBeChecked();
    });

    it("checkbox renovacao automatica disponivel", () => {
      renderPlanoForm();

      const checkbox = screen.getByLabelText(/permite renovação automática/i);
      expect(checkbox).toBeInTheDocument();
    });

    it("checkbox destaque disponivel", () => {
      renderPlanoForm();

      const checkbox = screen.getByLabelText(/exibir plano como destaque/i);
      expect(checkbox).toBeInTheDocument();
    });

    it("checkbox venda online disponivel e habilitado por padrao", () => {
      renderPlanoForm();

      const checkbox = screen.getByLabelText(/permitir venda online na storefront/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });
  });

  describe("acoes", () => {
    it("chama onCancel ao clicar Cancelar", () => {
      const { props } = renderPlanoForm();

      fireEvent.click(screen.getByText("Cancelar"));

      expect(props.onCancel).toHaveBeenCalled();
    });

    it("habilita submit com valores iniciais validos", async () => {
      const initial = {
        ...getDefaultPlanoFormValues(),
        nome: "Plano Premium",
        valor: "199.90",
        duracaoDias: "30",
      };
      renderPlanoForm({ initial });

      await waitFor(() => {
        expect(screen.getByText("Salvar")).not.toBeDisabled();
      });
    });

    it("nao chama onSubmit quando submitting=true", () => {
      renderPlanoForm({ submitting: true });

      const submitBtn = screen.getByText("Salvar");
      expect(submitBtn).toBeDisabled();
    });

  });

  describe("valores iniciais", () => {
    it("preenche campos com valores iniciais quando fornecidos", () => {
      const initial: PlanoFormValues = {
        ...getDefaultPlanoFormValues(),
        nome: "Plano Existente",
        descricao: "Descricao existente",
        valor: "150",
        duracaoDias: "60",
      };

      renderPlanoForm({ initial });

      expect(screen.getByDisplayValue("Plano Existente")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Descricao existente")).toBeInTheDocument();
      expect(screen.getByDisplayValue("150")).toBeInTheDocument();
      expect(screen.getByDisplayValue("60")).toBeInTheDocument();
    });

    it("renderiza label customizado do submit", () => {
      renderPlanoForm({ submitLabel: "Atualizar plano" });

      expect(screen.getByText("Atualizar plano")).toBeInTheDocument();
    });
  });
});
