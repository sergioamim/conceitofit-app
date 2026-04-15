import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { FecharCaixaModal } from "@/app/(portal)/caixa/components/fechar-caixa-modal";
import type { SaldoParcialResponse } from "@/lib/api/caixa.types";

vi.mock("@/lib/api/caixa", () => ({
  fecharCaixa: vi.fn().mockResolvedValue({}),
}));

const saldo: SaldoParcialResponse = {
  caixaId: "c1",
  total: 1000,
  porFormaPagamento: { DINHEIRO: 1000 },
  movimentosCount: 0,
};

describe("FecharCaixaModal", () => {
  afterEach(() => vi.clearAllMocks());

  it("preview de diferença = verde quando |valorInformado - total| <= 0,50", () => {
    render(
      <FecharCaixaModal
        open
        onOpenChange={() => {}}
        caixaId="c1"
        saldoAtual={saldo}
        onSuccess={() => {}}
      />,
    );
    const input = screen.getByLabelText(/valor conferido/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1000.30" } });
    const preview = screen.getByTestId("fechar-caixa-preview");
    expect(preview.getAttribute("data-diff-ok")).toBe("true");
  });

  it("preview de diferença = vermelho quando ultrapassa tolerância", () => {
    render(
      <FecharCaixaModal
        open
        onOpenChange={() => {}}
        caixaId="c1"
        saldoAtual={saldo}
        onSuccess={() => {}}
      />,
    );
    const input = screen.getByLabelText(/valor conferido/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "950" } });
    const preview = screen.getByTestId("fechar-caixa-preview");
    expect(preview.getAttribute("data-diff-ok")).toBe("false");
  });
});
