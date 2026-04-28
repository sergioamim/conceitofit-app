import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConvenioModal } from "@/components/shared/convenio-modal";
import { ApiRequestError } from "@/lib/api/http";
import type { Plano } from "@/lib/types";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
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

const PLANOS: Plano[] = [
  {
    id: "plano-1",
    tenantId: "tenant-1",
    nome: "Mensal",
    tipo: "MENSAL",
    duracaoDias: 30,
    valor: 99.9,
    valorMatricula: 0,
    cobraAnuidade: false,
    permiteRenovacaoAutomatica: true,
    permiteCobrancaRecorrente: false,
    contratoAssinatura: "AMBAS",
    contratoEnviarAutomaticoEmail: false,
    destaque: false,
    permiteVendaOnline: true,
    ativo: true,
  },
];

describe("ConvenioModal", () => {
  it("aplica erro de backend inline no campo nome", async () => {
    const onSave = vi.fn().mockRejectedValue(
      new ApiRequestError({
        status: 400,
        message: "validation failed",
        fieldErrors: {
          nome: "Nome já existe.",
        },
      }),
    );

    render(
      <ConvenioModal
        open
        onClose={vi.fn()}
        onSave={onSave}
        planos={PLANOS}
      />,
    );

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: "Empresa ACME" },
    });

    const submit = screen.getByRole("button", { name: /criar convênio/i });
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
      expect(screen.getByText("Nome já existe.")).toBeInTheDocument();
    });
  });
});
