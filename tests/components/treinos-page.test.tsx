import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  createTemplateDraft: vi.fn(),
  useV3UI: true,
  workspaceOverrides: {} as Record<string, unknown>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/lib/feature-flags", () => ({
  isTreinoEditorV3Enabled: () => mocks.useV3UI,
}));

vi.mock("@/app/(portal)/treinos/templates-grid-v3", () => ({
  TemplatesGridV3: () => <div data-testid="templates-grid-v3" />,
}));

vi.mock("@/components/shared/paginated-table", () => ({
  PaginatedTable: ({ items, renderCells }: any) => (
    <table>
      <tbody>
        {items.map((item: any) => (
          <tr key={item.id}>{renderCells(item)}</tr>
        ))}
      </tbody>
    </table>
  ),
}));

vi.mock("@/app/(portal)/treinos/treinos-dialogs", () => ({
  AssignmentDialog: () => null,
  ArchiveDialog: () => null,
}));

vi.mock("@/app/(portal)/treinos/use-treinos-workspace", () => ({
  useTreinosWorkspace: () => ({
    tenantName: "Unidade Centro",
    tenantResolved: true,
    DEFAULT_ACTIVE_TENANT_LABEL: "Unidade ativa",
    templates: [],
    templateTotals: {
      totalTemplates: 1,
      publicados: 1,
      emRevisao: 0,
      comPendencias: 0,
    },
    templatesTotal: 1,
    templatesHasNext: false,
    templatesSize: 12,
    exercicios: [],
    alunoOptions: [],
    search: "",
    setSearch: vi.fn(),
    page: 0,
    setPage: vi.fn(),
    reviewOnly: false,
    setReviewOnly: vi.fn(),
    showInfo: false,
    setShowInfo: vi.fn(),
    archiveTemplate: null,
    setArchiveTemplate: vi.fn(),
    assignmentDialogOpen: false,
    setAssignmentDialogOpen: vi.fn(),
    assignmentTemplate: null,
    setAssignmentTemplate: vi.fn(),
    assignmentForm: null,
    setAssignmentForm: vi.fn(),
    latestAssigned: null,
    loading: false,
    error: null,
    assigning: false,
    archiving: false,
    creatingTemplate: false,
    actionTemplateId: null,
    permissions: {
      canCreateTemplate: true,
      canEditOwnTemplate: true,
      canAssignIndividual: true,
      canArchiveTemplate: true,
    },
    loadData: vi.fn(),
    createTemplateDraft: mocks.createTemplateDraft,
    openAssignmentDialog: vi.fn(),
    openArchiveDialog: vi.fn(),
    handleAssignTemplate: vi.fn(),
    handleArchiveTemplate: vi.fn(),
    emptyText: "Nenhum treino padrão encontrado",
    ...mocks.workspaceOverrides,
  }),
  resolveTemplateStatusBadgeVariant: () => "secondary",
  getTemplateDisplayName: (template: { nome?: string | null; templateNome?: string | null }) =>
    template.templateNome ?? template.nome ?? "Template sem nome",
}));

import TreinosPage from "@/app/(portal)/treinos/page";

describe("TreinosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useV3UI = true;
    mocks.workspaceOverrides = {};
  });

  it("cria rascunho e navega para o editor completo do treino padrão", async () => {
    mocks.createTemplateDraft.mockResolvedValueOnce({ id: "tpl-novo" });

    render(<TreinosPage />);

    fireEvent.click(screen.getByRole("button", { name: /criar treino padrão/i }));

    await waitFor(() => {
      expect(mocks.createTemplateDraft).toHaveBeenCalled();
    });
    expect(mocks.push).toHaveBeenCalledWith("/treinos/tpl-novo");
  });

  it("usa o editor de detalhe na listagem operacional em vez do botão antigo de montagem", () => {
    mocks.useV3UI = false;
    mocks.workspaceOverrides = {
      templates: [
        {
          id: "tpl-1",
          nome: "Template Base",
          templateNome: "Template Base",
          status: "PUBLICADO",
          precisaRevisao: false,
          pendenciasAbertas: 0,
          frequenciaSemanal: 3,
          totalSemanas: 4,
          professorNome: "Paula Lima",
          atualizadoEm: "2026-04-27T12:00:00.000Z",
        },
      ],
    };

    render(<TreinosPage />);

    const link = screen.getByRole("link", { name: /editar treino/i });
    expect(link).toHaveAttribute("href", "/treinos/tpl-1");
    expect(screen.queryByText("Abrir montagem")).not.toBeInTheDocument();
  });
});
