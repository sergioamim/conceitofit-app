import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EditarVoucherModal } from "@/components/shared/editar-voucher-modal";
import { ApiRequestError } from "@/lib/api/http";
import type { Voucher } from "@/lib/types";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select data-testid="mock-select" value={value} onChange={(event) => onValueChange?.(event.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

const updateVoucherApi = vi.fn();

vi.mock("@/lib/api/beneficios", () => ({
  updateVoucherApi: (...args: any[]) => updateVoucherApi(...args),
}));

vi.mock("@/lib/api/comercial-catalogo", () => ({
  listPlanosApi: vi.fn().mockResolvedValue([]),
}));

const VOUCHER: Voucher = {
  id: "voucher-1",
  tenantId: "tenant-1",
  escopo: "UNIDADE",
  tipo: "DESCONTO",
  nome: "Voucher verão",
  groupId: undefined,
  periodoInicio: "2026-04-28",
  periodoFim: undefined,
  prazoDeterminado: false,
  quantidade: 10,
  ilimitado: false,
  codigoTipo: "UNICO",
  usarNaVenda: true,
  planoIds: [],
  umaVezPorCliente: false,
  aplicarEm: ["CONTRATO"],
  ativo: true,
};

describe("EditarVoucherModal", () => {
  it("aplica erro de backend inline no campo nome", async () => {
    updateVoucherApi.mockRejectedValueOnce(
      new ApiRequestError({
        status: 400,
        message: "validation failed",
        fieldErrors: {
          nome: "Nome já existe.",
        },
      }),
    );

    render(
      <EditarVoucherModal
        voucher={VOUCHER}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("Voucher verão"), {
      target: { value: "Voucher verão" },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => {
      expect(updateVoucherApi).toHaveBeenCalled();
      expect(screen.getByText("Nome já existe.")).toBeInTheDocument();
    });
  });
});
