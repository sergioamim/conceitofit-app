import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AbrirCaixaForm } from "@/app/(portal)/caixa/components/abrir-caixa-form";

const mocks = vi.hoisted(() => ({
  listCaixaCatalogos: vi.fn(),
  abrirCaixa: vi.fn(),
  getCaixaAtivo: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/lib/api/caixa", () => ({
  listCaixaCatalogos: (...args: unknown[]) => mocks.listCaixaCatalogos(...args),
  abrirCaixa: (...args: unknown[]) => mocks.abrirCaixa(...args),
  getCaixaAtivo: (...args: unknown[]) => mocks.getCaixaAtivo(...args),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
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
});
