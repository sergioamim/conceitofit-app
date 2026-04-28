import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AbrirCaixaForm } from "@/app/(portal)/caixa/components/abrir-caixa-form";

const mocks = vi.hoisted(() => ({
  listCaixaCatalogos: vi.fn(),
  abrirCaixa: vi.fn(),
  getCaixaAtivo: vi.fn(),
  toast: vi.fn(),
  fecharModalProps: vi.fn(),
}));

vi.mock("@/lib/api/caixa", () => ({
  listCaixaCatalogos: (...args: unknown[]) => mocks.listCaixaCatalogos(...args),
  abrirCaixa: (...args: unknown[]) => mocks.abrirCaixa(...args),
  getCaixaAtivo: (...args: unknown[]) => mocks.getCaixaAtivo(...args),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/app/(portal)/caixa/components/fechar-caixa-modal", () => ({
  FecharCaixaModal: (props: any) => {
    mocks.fecharModalProps(props);
    return props.open ? (
      <div data-testid="fechar-caixa-modal">
        <span>{props.title}</span>
        <span>{props.description}</span>
        <button type="button" onClick={() => props.onSuccess()}>
          {props.submitLabel}
        </button>
      </div>
    ) : null;
  },
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children, id }: any) => <button id={id}>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
}));

describe("AbrirCaixaForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza seleção amigável sem expor UUID manual", async () => {
    mocks.listCaixaCatalogos.mockResolvedValueOnce([
      { id: "123e4567-e89b-12d3-a456-426614174000", nome: "Caixa Recepção", descricao: null },
    ]);

    render(
      <AbrirCaixaForm
        onSuccess={vi.fn()}
        onCaixaJaAberto={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mocks.listCaixaCatalogos).toHaveBeenCalled();
    });

    expect(screen.getByText("Caixa")).toBeInTheDocument();
    expect(screen.queryByText(/UUID/i)).not.toBeInTheDocument();
    expect(screen.getByText("Caixa Recepção")).toBeInTheDocument();
  });

  it("abre modal de caixa de dia anterior e reabre após fechamento", async () => {
    const onSuccess = vi.fn();
    const catalogoId = "123e4567-e89b-12d3-a456-426614174111";

    mocks.listCaixaCatalogos.mockResolvedValueOnce([
      { id: catalogoId, nome: "Caixa Recepção", descricao: null },
    ]);
    mocks.abrirCaixa
      .mockRejectedValueOnce({
        code: "CAIXA_DIA_ANTERIOR",
        caixaAtivoId: "cx-antigo",
        abertoEm: "2026-04-20T00:12:29.016792",
        acaoSugerida: "FECHAR_E_REABRIR",
      })
      .mockResolvedValueOnce({
        id: "cx-novo",
        caixaCatalogoId: catalogoId,
        operadorId: "op-1",
        status: "ABERTO",
        abertoEm: "2026-04-27T09:00:00",
        valorAbertura: 100,
        observacoes: null,
      });
    mocks.getCaixaAtivo
      .mockResolvedValueOnce({
        caixa: {
          id: "cx-antigo",
          caixaCatalogoId: catalogoId,
          operadorId: "op-1",
          status: "ABERTO",
          abertoEm: "2026-04-20T00:12:29.016792",
          valorAbertura: 80,
          observacoes: null,
        },
        saldo: {
          caixaId: "cx-antigo",
          total: 80,
          porFormaPagamento: { DINHEIRO: 80 },
          movimentosCount: 2,
        },
      })
      .mockResolvedValueOnce({
        caixa: {
          id: "cx-novo",
          caixaCatalogoId: catalogoId,
          operadorId: "op-1",
          status: "ABERTO",
          abertoEm: "2026-04-27T09:00:00",
          valorAbertura: 100,
          observacoes: null,
        },
        saldo: {
          caixaId: "cx-novo",
          total: 100,
          porFormaPagamento: { DINHEIRO: 100 },
          movimentosCount: 0,
        },
      });

    render(
      <AbrirCaixaForm
        onSuccess={onSuccess}
        onCaixaJaAberto={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mocks.listCaixaCatalogos).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText(/valor de abertura/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /abrir caixa/i }));

    expect(await screen.findByTestId("fechar-caixa-modal")).toBeInTheDocument();
    expect(screen.getByText("Caixa aberto em dia anterior")).toBeInTheDocument();
    expect(
      screen.getByText(/encerre o caixa anterior para continuar a abertura/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /encerrar caixa anterior/i }),
    );

    await waitFor(() => {
      expect(mocks.abrirCaixa).toHaveBeenCalledTimes(2);
    });

    expect(mocks.abrirCaixa).toHaveBeenNthCalledWith(1, {
      caixaCatalogoId: catalogoId,
      valorAbertura: 100,
      observacoes: null,
    });
    expect(mocks.abrirCaixa).toHaveBeenNthCalledWith(2, {
      caixaCatalogoId: catalogoId,
      valorAbertura: 100,
      observacoes: null,
    });
    expect(onSuccess).toHaveBeenCalledWith({
      caixa: {
        id: "cx-novo",
        caixaCatalogoId: catalogoId,
        operadorId: "op-1",
        status: "ABERTO",
        abertoEm: "2026-04-27T09:00:00",
        valorAbertura: 100,
        observacoes: null,
      },
      saldo: {
        caixaId: "cx-novo",
        total: 100,
        porFormaPagamento: { DINHEIRO: 100 },
        movimentosCount: 0,
      },
    });
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Caixa anterior encerrado",
      }),
    );
  });
});
