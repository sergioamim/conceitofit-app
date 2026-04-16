import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  AjusteAdminSchema,
  AjusteModal,
} from "@/app/(backoffice)/admin/caixas/components/ajuste-modal";
import { ApiRequestError } from "@/lib/api/http";

const toastMock = vi.fn();
const ajusteAdminMock = vi.fn();
const routerPushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock, replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/api/caixa", () => ({
  ajusteAdmin: (...args: unknown[]) => ajusteAdminMock(...args),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: toastMock, toasts: [], dismiss: vi.fn() }),
}));

function renderModal(onSuccess = vi.fn()) {
  const onOpenChange = vi.fn();
  const utils = render(
    <AjusteModal
      open
      onOpenChange={onOpenChange}
      caixaId="c-123"
      caixaLabel="Operador X — 14/04/2026"
      onSuccess={onSuccess}
    />,
  );
  return { ...utils, onOpenChange, onSuccess };
}

describe("AjusteAdminSchema (CXO-302)", () => {
  it("rejeita motivo com menos de 10 caracteres", () => {
    const result = AjusteAdminSchema.safeParse({
      tipo: "AJUSTE_SAIDA",
      valor: 50,
      motivo: "curto",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(
        /mínimo 10 caracteres/i,
      );
    }
  });

  it("rejeita valor <= 0", () => {
    const result = AjusteAdminSchema.safeParse({
      tipo: "AJUSTE_ENTRADA",
      valor: 0,
      motivo: "Texto suficientemente longo",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/maior que zero/i);
    }
  });

  it("aceita payload válido (coerce de string pra number)", () => {
    const result = AjusteAdminSchema.safeParse({
      tipo: "AJUSTE_ENTRADA",
      valor: "25.50",
      motivo: "Texto suficientemente longo para passar",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.valor).toBe(25.5);
    }
  });
});

describe("AjusteModal (CXO-302)", () => {
  beforeEach(() => {
    ajusteAdminMock.mockReset();
    toastMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("exibe contador do motivo e bloqueia submit quando motivo < 10 chars", async () => {
    renderModal();

    const motivo = screen.getByLabelText(/motivo/i) as HTMLTextAreaElement;
    const valor = screen.getByLabelText(/valor/i) as HTMLInputElement;

    fireEvent.change(valor, { target: { value: "50" } });
    fireEvent.change(motivo, { target: { value: "curto" } });

    // Contador visível (5/10)
    expect(screen.getByTestId("ajuste-motivo-counter").textContent).toMatch(
      /5\/10/,
    );

    // Submeter o form dispara validação; confirmação NUNCA deve abrir
    fireEvent.click(screen.getByRole("button", { name: /confirmar ajuste/i }));

    // Aguarda tempo suficiente para resolver/rerender do RHF
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(
      screen.queryByRole("button", { name: /^Confirmar$/ }),
    ).not.toBeInTheDocument();
    expect(ajusteAdminMock).not.toHaveBeenCalled();
  });

  it("valida que valor deve ser maior que zero", async () => {
    renderModal();

    const valor = screen.getByLabelText(/valor/i) as HTMLInputElement;
    fireEvent.change(valor, { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText(/motivo/i), {
      target: { value: "Motivo suficientemente longo para passar" },
    });

    fireEvent.click(screen.getByRole("button", { name: /confirmar ajuste/i }));

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(
      screen.queryByRole("button", { name: /^Confirmar$/ }),
    ).not.toBeInTheDocument();
    expect(ajusteAdminMock).not.toHaveBeenCalled();
  });

  it("submete OK: abre confirmação, chama API e dispara onSuccess", async () => {
    ajusteAdminMock.mockResolvedValueOnce({
      id: "m1",
      tipo: "AJUSTE_SAIDA",
      valor: 50,
      formaPagamento: null,
      dataMovimento: "2026-04-15T10:00:00",
    });

    const { onSuccess } = renderModal();

    fireEvent.change(screen.getByLabelText(/valor/i), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText(/motivo/i), {
      target: { value: "Recontagem manual após divergência" },
    });

    fireEvent.click(screen.getByRole("button", { name: /confirmar ajuste/i }));

    // AlertDialog de confirmação aparece
    const confirmButton = await screen.findByRole("button", {
      name: /^Confirmar$/,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(ajusteAdminMock).toHaveBeenCalledTimes(1);
      expect(ajusteAdminMock).toHaveBeenCalledWith(
        "c-123",
        expect.objectContaining({
          tipo: "AJUSTE_SAIDA",
          valor: 50,
          motivo: "Recontagem manual após divergência",
          formaPagamento: null,
        }),
      );
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Ajuste registrado" }),
      );
    });
  });

  it("mostra toast de 'Sem permissão' em 403", async () => {
    ajusteAdminMock.mockRejectedValueOnce(
      new ApiRequestError({
        status: 403,
        error: "Forbidden",
        message: "Forbidden",
        path: "/api/caixas/c-123/movimentos/ajuste-admin",
        responseBody: "",
      }),
    );

    renderModal();

    fireEvent.change(screen.getByLabelText(/valor/i), {
      target: { value: "25" },
    });
    fireEvent.change(screen.getByLabelText(/motivo/i), {
      target: { value: "Motivo de teste com texto suficiente" },
    });

    fireEvent.click(screen.getByRole("button", { name: /confirmar ajuste/i }));

    const confirmButton = await screen.findByRole("button", {
      name: /^Confirmar$/,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Sem permissão",
        }),
      );
    });
  });
});
