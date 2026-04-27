import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExcluirCobrancaModal } from "@/components/shared/excluir-cobranca-modal";
import type { Pagamento } from "@/lib/types";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({ value, onChange, placeholder }: any) => (
    <textarea value={value} onChange={onChange} placeholder={placeholder} />
  ),
}));

const pagamentoBase = {
  id: "p1",
  tenantId: "t1",
  alunoId: "a1",
  tipo: "MENSALIDADE" as const,
  descricao: "Mensalidade Abril",
  valor: 150,
  desconto: 0,
  valorFinal: 150,
  status: "VENCIDO" as const,
  dataVencimento: "2026-04-10",
  dataCriacao: "2026-04-01T00:00:00",
} as Pagamento;

describe("ExcluirCobrancaModal", () => {
  it("renderiza título e contexto da cobrança", () => {
    render(
      <ExcluirCobrancaModal
        pagamento={pagamentoBase}
        justificativa=""
        setJustificativa={vi.fn()}
        loading={false}
        error=""
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("Excluir cobrança?")).toBeInTheDocument();
    expect(screen.getByText("Mensalidade Abril")).toBeInTheDocument();
    expect(screen.getByText(/O histórico será mantido para auditoria/)).toBeInTheDocument();
  });

  it("propaga mudança da justificativa", () => {
    const setJustificativa = vi.fn();
    render(
      <ExcluirCobrancaModal
        pagamento={pagamentoBase}
        justificativa=""
        setJustificativa={setJustificativa}
        loading={false}
        error=""
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Explique por que a cobrança deve ser excluída..."), {
      target: { value: "Duplicidade" },
    });
    expect(setJustificativa).toHaveBeenCalledWith("Duplicidade");
  });

  it("chama onConfirm quando confirma", () => {
    const onConfirm = vi.fn();
    render(
      <ExcluirCobrancaModal
        pagamento={pagamentoBase}
        justificativa="Cobrança em duplicidade"
        setJustificativa={vi.fn()}
        loading={false}
        error=""
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByText("Excluir cobrança"));
    expect(onConfirm).toHaveBeenCalled();
  });
});
