import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ClienteEmitirCreditoDiasModal } from "@/app/(portal)/clientes/[id]/cliente-emitir-credito-dias-modal";
import { emitirCreditoDiasFormSchema } from "@/app/(portal)/clientes/[id]/cliente-credito-dias-modal.schema";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

describe("emitirCreditoDiasFormSchema", () => {
  it("aceita payload válido", () => {
    const result = emitirCreditoDiasFormSchema.safeParse({
      dias: 7,
      motivo: "Academia fechada por manutenção elétrica emergencial no prédio.",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita motivo curto", () => {
    const result = emitirCreditoDiasFormSchema.safeParse({
      dias: 5,
      motivo: "Muito curto",
    });
    expect(result.success).toBe(false);
  });
});

describe("ClienteEmitirCreditoDiasModal", () => {
  it("renderiza preview do novo vencimento a partir da quantidade de dias", () => {
    render(
      <ClienteEmitirCreditoDiasModal
        open
        contratoDataFim="2026-05-10"
        loading={false}
        error=""
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/Vencimento atual/i)).toBeInTheDocument();
    expect(screen.getByText(/10\/05\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/11\/05\/2026/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Dias/i), {
      target: { value: "5" },
    });

    expect(screen.getByText(/15\/05\/2026/)).toBeInTheDocument();
  });

  it("submete payload válido", async () => {
    const onSubmit = vi.fn();

    render(
      <ClienteEmitirCreditoDiasModal
        open
        contratoDataFim="2026-05-10"
        loading={false}
        error=""
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/^Dias/i), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText(/^Motivo/i), {
      target: {
        value: "Compensação operacional por interrupção indevida de acesso na unidade.",
      },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Creditar dias/i }).closest("form")!);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
      expect(onSubmit.mock.calls[0]?.[0]).toEqual({
        dias: 3,
        motivo: "Compensação operacional por interrupção indevida de acesso na unidade.",
      });
    });
  });
});
