/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { EditarAgregadorVinculoModal } from "@/components/shared/editar-agregador-vinculo-modal";
import { editarAgregadorVinculoSchema } from "@/components/shared/editar-agregador-vinculo-modal.schema";

const toastMock = vi.fn();
const putAgregadorVinculoMock = vi.fn();

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/api/agregadores-vinculos", () => ({
  putAgregadorVinculo: (...args: unknown[]) => putAgregadorVinculoMock(...args),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select
      data-testid="select-status"
      value={value ?? ""}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
}));

const vinculoBase = {
  id: "vinc-1",
  tenantId: "tenant-1",
  alunoId: "aluno-1",
  agregador: "WELLHUB" as const,
  usuarioExternoId: "WHB-1234",
  customCode: "COD-1",
  status: "ATIVO" as const,
  dataInicio: "2026-04-20",
  dataFim: null,
};

function renderModal(overrides: Partial<React.ComponentProps<typeof EditarAgregadorVinculoModal>> = {}) {
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();
  const utils = render(
    <EditarAgregadorVinculoModal
      open
      onOpenChange={onOpenChange}
      tenantId="tenant-1"
      vinculo={vinculoBase}
      onSuccess={onSuccess}
      {...overrides}
    />,
  );
  return { ...utils, onOpenChange, onSuccess };
}

describe("editarAgregadorVinculoSchema", () => {
  it("exige dataFim quando status não é ativo", () => {
    const result = editarAgregadorVinculoSchema.safeParse({
      usuarioExternoId: "WHB-1234",
      customCode: "",
      status: "INATIVO",
      dataInicio: "2026-04-20",
      dataFim: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("EditarAgregadorVinculoModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submete atualização ativa com sucesso", async () => {
    putAgregadorVinculoMock.mockResolvedValueOnce({
      ...vinculoBase,
      usuarioExternoId: "WHB-9999",
    });
    const { onOpenChange, onSuccess } = renderModal();

    fireEvent.change(screen.getByLabelText(/id externo do usuário/i), {
      target: { value: "WHB-9999" },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar vínculo/i }));

    await waitFor(() => expect(putAgregadorVinculoMock).toHaveBeenCalledTimes(1));
    expect(putAgregadorVinculoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        vinculoId: "vinc-1",
        usuarioExternoId: "WHB-9999",
        status: "ATIVO",
        dataFim: undefined,
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("permite inativar vínculo quando a data de fim é informada", async () => {
    putAgregadorVinculoMock.mockResolvedValueOnce({
      ...vinculoBase,
      status: "INATIVO",
      dataFim: "2026-04-30",
    });
    renderModal();

    fireEvent.change(screen.getByTestId("select-status"), {
      target: { value: "INATIVO" },
    });
    fireEvent.change(screen.getByLabelText(/data de fim/i), {
      target: { value: "2026-04-30" },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar vínculo/i }));

    await waitFor(() => expect(putAgregadorVinculoMock).toHaveBeenCalledTimes(1));
    expect(putAgregadorVinculoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "INATIVO",
        dataFim: "2026-04-30",
      }),
    );
  });

  it("não envia quando status é inativo e dataFim está vazia", async () => {
    renderModal();

    fireEvent.change(screen.getByTestId("select-status"), {
      target: { value: "INATIVO" },
    });
    fireEvent.change(screen.getByLabelText(/data de fim/i), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar vínculo/i }));

    await waitFor(() => {
      expect(putAgregadorVinculoMock).not.toHaveBeenCalled();
    });
    expect(screen.getByRole("button", { name: /salvar vínculo/i })).toBeDisabled();
  });
});
