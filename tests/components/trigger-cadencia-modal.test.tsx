import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TriggerCadenciaModal } from "@/app/(portal)/crm/cadencias/trigger-cadencia-modal";
import { ApiRequestError } from "@/lib/api/http";

const mocks = vi.hoisted(() => ({
  listProspects: vi.fn(),
  triggerCadencia: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/lib/api/crm", () => ({
  listProspectsApi: mocks.listProspects,
}));

vi.mock("@/lib/api/crm-cadencias", () => ({
  triggerCrmCadenceApi: mocks.triggerCadencia,
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, disabled }: any) => (
    <input
      aria-label="prospect-select"
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onValueChange?.(event.target.value)}
    />
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: () => null,
  SelectItem: () => null,
}));

function renderModal() {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <TriggerCadenciaModal
        open
        tenantId="tenant-1"
        cadencia={{
          id: "cad-1",
          tenantId: "tenant-1",
          nome: "Boas-vindas",
          objetivo: "Primeiro contato",
          gatilho: "NOVO_PROSPECT",
          stageStatus: "NOVO",
          ativo: true,
          passos: [],
          dataCriacao: "2026-04-29T10:00:00Z",
        }}
        onOpenChange={vi.fn()}
        onTriggered={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

describe("TriggerCadenciaModal", () => {
  it("mapeia fieldErrors do backend inline no select de prospect", async () => {
    mocks.listProspects.mockResolvedValueOnce([
      { id: "prospect-1", nome: "Maria Prospect", telefone: "11999990000" },
    ]);
    mocks.triggerCadencia.mockRejectedValueOnce(
      new ApiRequestError({
        status: 400,
        message: "validation failed",
        fieldErrors: {
          prospectId: "Selecione um prospect válido.",
        },
      }),
    );

    renderModal();

    fireEvent.change(await screen.findByLabelText("prospect-select"), {
      target: { value: "prospect-1" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /disparar/i }).closest("form")!);

    await waitFor(() => {
      expect(mocks.triggerCadencia).toHaveBeenCalled();
      expect(screen.getByText("Selecione um prospect válido.")).toBeInTheDocument();
    });

    expect(mocks.toast).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Erro ao disparar cadência",
      }),
    );
  });
});
