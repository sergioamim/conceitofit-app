import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ClienteEditarContratoModal } from "@/app/(portal)/clientes/[id]/cliente-editar-contrato-modal";
import { editarContratoFormSchema } from "@/app/(portal)/clientes/[id]/cliente-credito-dias-modal.schema";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

describe("editarContratoFormSchema", () => {
  it("aceita payload válido", () => {
    const result = editarContratoFormSchema.safeParse({
      dataInicio: "2026-05-01",
      motivo: "Correção operacional da data inicial após conferência do contrato.",
    });
    expect(result.success).toBe(true);
  });
});

describe("ClienteEditarContratoModal", () => {
  it("renderiza preview do novo vencimento a partir da nova data de início", () => {
    render(
      <ClienteEditarContratoModal
        open
        dataInicioAtual="2026-04-01"
        dataFimAtual="2026-04-30"
        loading={false}
        error=""
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/Início atual/i)).toBeInTheDocument();
    expect(screen.getAllByText(/30\/04\/2026/)).toHaveLength(2);

    fireEvent.change(screen.getByLabelText(/Nova data de início/i), {
      target: { value: "2026-04-10" },
    });

    expect(screen.getByText(/09\/05\/2026/)).toBeInTheDocument();
  });

  it("submete payload válido", async () => {
    const onSubmit = vi.fn();

    render(
      <ClienteEditarContratoModal
        open
        dataInicioAtual="2026-04-01"
        dataFimAtual="2026-04-30"
        loading={false}
        error=""
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Nova data de início/i), {
      target: { value: "2026-04-05" },
    });
    fireEvent.change(screen.getByLabelText(/^Motivo/i), {
      target: {
        value: "Correção operacional da data inicial após revisão do contrato assinado.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar edição/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit.mock.calls[0]?.[0]).toEqual({
        dataInicio: "2026-04-05",
        motivo: "Correção operacional da data inicial após revisão do contrato assinado.",
      });
    });
  });
});
