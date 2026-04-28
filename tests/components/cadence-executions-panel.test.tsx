import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CadenceExecutionsPanel } from "@/app/(portal)/crm/cadence-executions-panel";

const mocks = vi.hoisted(() => {
  let confirmCallback: null | (() => void | Promise<void>) = null;

  return {
    listExecutions: vi.fn(),
    processOverdue: vi.fn(),
    cancelExecution: vi.fn(),
    toast: vi.fn(),
    confirm: vi.fn((message: string, onConfirm: () => void | Promise<void>) => {
      void message;
      confirmCallback = onConfirm;
    }),
    runConfirm: async () => {
      if (confirmCallback) {
        await confirmCallback();
      }
    },
    resetConfirm: () => {
      confirmCallback = null;
    },
  };
});

vi.mock("@/lib/api/crm-cadencias", () => ({
  listCrmCadenceExecutionsApi: mocks.listExecutions,
  processOverdueCadenceTasksApi: mocks.processOverdue,
  cancelCrmCadenceExecutionApi: mocks.cancelExecution,
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/hooks/use-confirm-dialog", () => ({
  useConfirmDialog: () => ({
    confirm: mocks.confirm,
    ConfirmDialog: null,
  }),
}));

describe("CadenceExecutionsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resetConfirm();
    mocks.listExecutions.mockResolvedValue([
      {
        id: "exec-1",
        prospectId: "prospect-1",
        prospectNome: "Maria Prospect",
        cadenciaNome: "Boas-vindas",
        status: "EM_ANDAMENTO",
        iniciadoEm: "2026-04-28T10:00:00Z",
        passos: [{ status: "EXECUTADO" }, { status: "PENDENTE" }],
      },
    ]);
  });

  it("mostra toast de sucesso ao processar vencidas", async () => {
    mocks.processOverdue.mockResolvedValue({ processed: 3, escalated: 1 });

    render(<CadenceExecutionsPanel tenantId="tenant-1" />);

    await screen.findByText("Cadências em execução");
    fireEvent.click(screen.getByRole("button", { name: "Processar vencidas" }));

    await waitFor(() => {
      expect(mocks.processOverdue).toHaveBeenCalledWith({ tenantId: "tenant-1" });
    });
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Tarefas vencidas processadas",
        description: "Processado: 3 tarefa(s), 1 escalação(ões).",
      })
    );
  });

  it("mostra toast destrutivo ao falhar o processamento", async () => {
    mocks.processOverdue.mockRejectedValueOnce(new Error("backend indisponível"));

    render(<CadenceExecutionsPanel tenantId="tenant-1" />);

    await screen.findByText("Cadências em execução");
    fireEvent.click(screen.getByRole("button", { name: "Processar vencidas" }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Falha ao processar vencidas",
          description: "backend indisponível",
          variant: "destructive",
        })
      );
    });
  });

  it("confirma o cancelamento e mostra toast de sucesso", async () => {
    mocks.cancelExecution.mockResolvedValue(undefined);

    render(<CadenceExecutionsPanel tenantId="tenant-1" />);

    await screen.findByText(/Maria Prospect/);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(mocks.confirm).toHaveBeenCalled();
    await mocks.runConfirm();

    await waitFor(() => {
      expect(mocks.cancelExecution).toHaveBeenCalledWith({
        tenantId: "tenant-1",
        id: "exec-1",
      });
    });
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Execução cancelada",
      })
    );
  });
});
