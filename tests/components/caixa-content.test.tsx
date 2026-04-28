import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { CaixaContent } from "@/app/(portal)/caixa/components/caixa-content";
import type {
  CaixaResponse,
  SaldoParcialResponse,
} from "@/lib/api/caixa.types";

vi.mock("@/lib/api/caixa", () => ({
  getCaixaAtivo: vi.fn().mockResolvedValue(null),
  listCaixaCatalogos: vi.fn().mockResolvedValue([
    { id: "cat1", nome: "Caixa Principal", descricao: null },
  ]),
  abrirCaixa: vi.fn(),
  fecharCaixa: vi.fn(),
  criarSangria: vi.fn(),
}));

function mockCaixa(overrides: Partial<CaixaResponse> = {}): CaixaResponse {
  return {
    id: "c1",
    status: "ABERTO",
    abertoEm: "2026-04-15T08:00:00",
    fechadoEm: null,
    valorAbertura: 100,
    valorFechamento: null,
    valorInformado: null,
    operadorId: "op1",
    operadorNome: "Operador",
    ...overrides,
  };
}

function mockSaldo(overrides: Partial<SaldoParcialResponse> = {}): SaldoParcialResponse {
  return {
    caixaId: "c1",
    total: 1500,
    porFormaPagamento: { DINHEIRO: 500, PIX: 1000 },
    movimentosCount: 4,
    ...overrides,
  };
}

describe("CaixaContent", () => {
  beforeEach(() => {
    // Fake timers cobrem `Date` mas NÃO setInterval (toFake explícito).
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-04-15T10:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("mostra CTA de abrir caixa quando initial é null", () => {
    render(<CaixaContent initial={null} />);
    expect(screen.getByTestId("caixa-sem-caixa")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /abrir caixa/i })).toBeInTheDocument();
  });

  it("mostra saldo + tabela quando há caixa ativo do dia", () => {
    render(
      <CaixaContent
        initial={{ caixa: mockCaixa(), saldo: mockSaldo(), movimentos: [] }}
      />,
    );
    expect(screen.getByTestId("caixa-com-caixa")).toBeInTheDocument();
    expect(screen.getByTestId("saldo-parcial-card")).toBeInTheDocument();
    expect(screen.getByTestId("movimentos-table")).toBeInTheDocument();
    expect(screen.queryByTestId("dia-anterior-banner")).not.toBeInTheDocument();
  });

  it("mostra banner de dia anterior quando abertura é anterior a hoje", async () => {
    render(
      <CaixaContent
        initial={{
          caixa: mockCaixa({ abertoEm: "2026-04-14T08:00:00" }),
          saldo: mockSaldo(),
          movimentos: [],
        }}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("dia-anterior-banner")).toBeInTheDocument(),
    );
  });
});
