/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { VincularAgregadorModal } from "@/components/shared/vincular-agregador-modal";
import {
  AGREGADOR_TIPO_VALUES,
  vincularAgregadorSchema,
} from "@/components/shared/vincular-agregador-modal.schema";

// ── Mocks ──────────────────────────────────────────────────────────────

const toastMock = vi.fn();
const postAgregadorVinculoMock = vi.fn();

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/api/agregadores-vinculos", () => ({
  postAgregadorVinculo: (...args: unknown[]) => postAgregadorVinculoMock(...args),
}));

vi.mock("@/lib/business-date", () => ({
  getBusinessTodayIso: () => "2026-04-20",
}));

// Simplifica Dialog para evitar Radix portal/animações no happy-dom.
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

// Simplifica Select pra um <select> nativo (Radix Select é assíncrono e
// portalizado, dificulta interação síncrona em happy-dom).
vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select
      data-testid="select-tipo"
      value={value ?? ""}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
}));

// ── Helpers ────────────────────────────────────────────────────────────

function renderModal(overrides: Partial<React.ComponentProps<typeof VincularAgregadorModal>> = {}) {
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();
  const utils = render(
    <VincularAgregadorModal
      open
      onOpenChange={onOpenChange}
      alunoId="aluno-1"
      tenantId="tenant-1"
      onSuccess={onSuccess}
      {...overrides}
    />,
  );
  return { ...utils, onOpenChange, onSuccess };
}

function fillUsuarioExterno(value: string) {
  const input = screen.getByLabelText(/id externo do usuário/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
}

// ── Schema tests ───────────────────────────────────────────────────────

describe("vincularAgregadorSchema", () => {
  it("aceita payload válido", () => {
    const result = vincularAgregadorSchema.safeParse({
      agregador: "WELLHUB",
      usuarioExternoId: "WHB-1234",
      dataInicio: "2026-04-20",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita usuarioExternoId vazio", () => {
    const result = vincularAgregadorSchema.safeParse({
      agregador: "WELLHUB",
      usuarioExternoId: "  ",
      dataInicio: "2026-04-20",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita usuarioExternoId acima de 120 caracteres", () => {
    const result = vincularAgregadorSchema.safeParse({
      agregador: "TOTALPASS",
      usuarioExternoId: "x".repeat(121),
      dataInicio: "2026-04-20",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita data fora do formato YYYY-MM-DD", () => {
    const result = vincularAgregadorSchema.safeParse({
      agregador: "OUTRO",
      usuarioExternoId: "abc",
      dataInicio: "20/04/2026",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita agregador desconhecido", () => {
    const result = vincularAgregadorSchema.safeParse({
      agregador: "INEXISTENTE",
      usuarioExternoId: "abc",
      dataInicio: "2026-04-20",
    });
    expect(result.success).toBe(false);
  });

  it("expõe os 3 tipos canônicos", () => {
    expect(AGREGADOR_TIPO_VALUES).toEqual(["WELLHUB", "TOTALPASS", "OUTRO"]);
  });
});

// ── Component tests ────────────────────────────────────────────────────

describe("VincularAgregadorModal", () => {
  beforeEach(() => {
    postAgregadorVinculoMock.mockReset();
    toastMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("não renderiza quando open=false", () => {
    renderModal({ open: false });
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("renderiza os 3 campos quando aberto", () => {
    renderModal();
    expect(screen.getByLabelText(/id externo do usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data de início/i)).toBeInTheDocument();
    expect(screen.getByTestId("select-tipo")).toBeInTheDocument();
  });

  it("submete com sucesso, dispara onSuccess + toast e fecha o modal", async () => {
    const fakeResponse = {
      id: "vinc-1",
      tenantId: "tenant-1",
      alunoId: "aluno-1",
      agregador: "WELLHUB" as const,
      usuarioExternoId: "WHB-1234",
      status: "ATIVO" as const,
      dataInicio: "2026-04-20",
      dataFim: null,
      cicloExpiraEm: null,
      ultimaVisitaEm: null,
    };
    postAgregadorVinculoMock.mockResolvedValueOnce(fakeResponse);
    const { onOpenChange, onSuccess } = renderModal();

    fillUsuarioExterno("WHB-1234");
    fireEvent.click(screen.getByRole("button", { name: /^Vincular$/i }));

    await waitFor(() => {
      expect(postAgregadorVinculoMock).toHaveBeenCalledTimes(1);
    });
    expect(postAgregadorVinculoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        alunoId: "aluno-1",
        agregador: "WELLHUB",
        usuarioExternoId: "WHB-1234",
        dataInicio: "2026-04-20",
      }),
    );

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(fakeResponse);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Vínculo criado" }),
      );
    });
  });

  it("não chama backend quando o ID externo está vazio (validação zod)", async () => {
    renderModal();
    fillUsuarioExterno("");
    fireEvent.click(screen.getByRole("button", { name: /^Vincular$/i }));
    await waitFor(() => {
      expect(postAgregadorVinculoMock).not.toHaveBeenCalled();
    });
  });

  it("exibe toast destrutivo quando o backend rejeita (409 duplicado)", async () => {
    postAgregadorVinculoMock.mockRejectedValueOnce(
      new Error("Já existe um vínculo ativo para este aluno neste agregador."),
    );
    const { onOpenChange, onSuccess } = renderModal();

    fillUsuarioExterno("WHB-DUP");
    fireEvent.click(screen.getByRole("button", { name: /^Vincular$/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Erro ao vincular agregador",
          description: "Já existe um vínculo ativo para este aluno neste agregador.",
        }),
      );
    });
    expect(onSuccess).not.toHaveBeenCalled();
    // Modal permanece aberto para o usuário corrigir / cancelar.
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("permite trocar o tipo de agregador via select e envia o valor selecionado", async () => {
    postAgregadorVinculoMock.mockResolvedValueOnce({
      id: "vinc-2",
      tenantId: "tenant-1",
      alunoId: "aluno-1",
      agregador: "TOTALPASS",
      usuarioExternoId: "TP-9",
      status: "ATIVO",
      dataInicio: "2026-04-20",
    });
    renderModal();

    fireEvent.change(screen.getByTestId("select-tipo"), {
      target: { value: "TOTALPASS" },
    });
    fillUsuarioExterno("TP-9");
    fireEvent.click(screen.getByRole("button", { name: /^Vincular$/i }));

    await waitFor(() => {
      expect(postAgregadorVinculoMock).toHaveBeenCalledWith(
        expect.objectContaining({ agregador: "TOTALPASS", usuarioExternoId: "TP-9" }),
      );
    });
  });

  it("o botão Cancelar fecha o modal sem chamar o backend", () => {
    const { onOpenChange } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(postAgregadorVinculoMock).not.toHaveBeenCalled();
  });
});
