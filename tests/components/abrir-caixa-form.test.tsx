import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AbrirCaixaForm } from "@/app/(portal)/caixa/components/abrir-caixa-form";

const mocks = vi.hoisted(() => ({
  abrirCaixa: vi.fn(),
  getCaixaAtivo: vi.fn(),
  toast: vi.fn(),
  fecharModalProps: vi.fn(),
}));

vi.mock("@/lib/api/caixa", () => ({
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

describe("AbrirCaixaForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza form simples sem select de catalogo", async () => {
    render(<AbrirCaixaForm onSuccess={vi.fn()} onCaixaJaAberto={vi.fn()} />);

    expect(screen.getByLabelText(/valor de abertura/i)).toBeInTheDocument();
    // Wave: select de catálogo removido — não deve mais aparecer.
    expect(screen.queryByText(/Nenhum caixa configurado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Selecione o caixa/i)).not.toBeInTheDocument();
  });

  it("abre modal de caixa de dia anterior e reabre após fechamento", async () => {
    const onSuccess = vi.fn();

    mocks.abrirCaixa
      .mockRejectedValueOnce({
        code: "CAIXA_DIA_ANTERIOR",
        caixaAtivoId: "cx-antigo",
        abertoEm: "2026-04-20T00:12:29.016792",
        acaoSugerida: "FECHAR_E_REABRIR",
      })
      .mockResolvedValueOnce({
        id: "cx-novo",
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

    render(<AbrirCaixaForm onSuccess={onSuccess} onCaixaJaAberto={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/valor de abertura/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /abrir caixa/i }));

    expect(await screen.findByTestId("fechar-caixa-modal")).toBeInTheDocument();
    expect(screen.getByText("Caixa aberto em dia anterior")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /encerrar caixa anterior/i }),
    );

    await waitFor(() => {
      expect(mocks.abrirCaixa).toHaveBeenCalledTimes(2);
    });

    expect(mocks.abrirCaixa).toHaveBeenNthCalledWith(1, {
      valorAbertura: 100,
      observacoes: null,
    });
    expect(mocks.abrirCaixa).toHaveBeenNthCalledWith(2, {
      valorAbertura: 100,
      observacoes: null,
    });
  });
});
