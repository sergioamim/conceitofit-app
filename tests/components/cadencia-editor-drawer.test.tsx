import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CadenciaEditorDrawer } from "@/app/(portal)/crm/cadencias/cadencia-editor-drawer";
import { ApiRequestError } from "@/lib/api/http";

const mocks = vi.hoisted(() => ({
  createCadencia: vi.fn(),
  updateCadencia: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/lib/api/crm", () => ({
  createCrmCadenciaApi: mocks.createCadencia,
  updateCrmCadenciaApi: mocks.updateCadencia,
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
  SheetDescription: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, disabled }: any) => (
    <input
      aria-label="mock-select"
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

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange, id }: any) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
    />
  ),
}));

vi.mock("@/app/(portal)/crm/cadencias/cadencia-passo-fields", () => ({
  CadenciaPassoFields: ({ index, register, errors }: any) => (
    <div>
      <input aria-label={`Passo ${index + 1} título`} {...register(`passos.${index}.titulo`)} />
      {errors?.titulo?.message ? <p>{errors.titulo.message}</p> : null}
    </div>
  ),
}));

function renderDrawer() {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <CadenciaEditorDrawer
        open
        tenantId="tenant-1"
        cadencia={{
          id: "cad-1",
          tenantId: "tenant-1",
          nome: "Follow-up pós-visita",
          objetivo: "Retomar leads após visita",
          gatilho: "NOVO_PROSPECT",
          stageStatus: "NOVO",
          ativo: true,
          passos: [
            {
              id: "passo-1",
              titulo: "Primeiro contato",
              acao: "WHATSAPP",
              delayDias: 0,
              template: "Olá",
              automatica: false,
            },
          ],
          dataCriacao: "2026-04-29T10:00:00Z",
        }}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

describe("CadenciaEditorDrawer", () => {
  it("mapeia fieldErrors aninhados do backend inline", async () => {
    mocks.updateCadencia.mockRejectedValueOnce(
      new ApiRequestError({
        status: 400,
        message: "validation failed",
        fieldErrors: {
          "passos[0].titulo": "Título do passo inválido.",
        },
      }),
    );

    renderDrawer();

    const submit = await screen.findByRole("button", { name: /salvar/i });
    await waitFor(() => expect(submit).not.toBeDisabled());
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mocks.updateCadencia).toHaveBeenCalled();
      expect(screen.getByText("Título do passo inválido.")).toBeInTheDocument();
    });
  });
});
