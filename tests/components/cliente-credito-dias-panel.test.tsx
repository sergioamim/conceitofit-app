import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ClienteCreditoDiasPanel } from "@/app/(portal)/clientes/[id]/cliente-credito-dias-panel";

const useToastMock = vi.fn();
const useHasCapacidadeMock = vi.fn();
const useTenantContextMock = vi.fn();
const useContratoCreditosDiasMock = vi.fn();
const useEmitirContratoCreditoDiasMock = vi.fn();
const useEstornarContratoCreditoDiasMock = vi.fn();
const invalidateQueriesMock = vi.fn();

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
  };
});

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => useToastMock(),
}));

vi.mock("@/features/rbac/hooks/use-has-capacidade", () => ({
  useHasCapacidade: (...args: unknown[]) => useHasCapacidadeMock(...args),
}));

vi.mock("@/lib/tenant/hooks/use-session-context", () => ({
  useTenantContext: () => useTenantContextMock(),
}));

vi.mock("@/lib/query/use-contrato-creditos-dias", () => ({
  useContratoCreditosDias: (...args: unknown[]) => useContratoCreditosDiasMock(...args),
  useEmitirContratoCreditoDias: () => useEmitirContratoCreditoDiasMock(),
  useEstornarContratoCreditoDias: () => useEstornarContratoCreditoDiasMock(),
}));

vi.mock("@/app/(portal)/clientes/[id]/cliente-emitir-credito-dias-modal", () => ({
  ClienteEmitirCreditoDiasModal: ({ open }: any) => (open ? <div data-testid="emitir-modal" /> : null),
}));

vi.mock("@/app/(portal)/clientes/[id]/cliente-estornar-credito-dias-modal", () => ({
  ClienteEstornarCreditoDiasModal: ({ open }: any) => (open ? <div data-testid="estornar-modal" /> : null),
}));

vi.mock("@/app/(portal)/clientes/[id]/cliente-editar-contrato-modal", () => ({
  ClienteEditarContratoModal: ({ open }: any) => (open ? <div data-testid="editar-modal" /> : null),
}));

const contratoAtivo = {
  id: "contrato-1",
  tenantId: "tenant-1",
  alunoId: "aluno-1",
  planoId: "plano-1",
  dataInicio: "2026-04-01",
  dataFim: "2026-05-10",
  valorPago: 199.9,
  valorMatricula: 0,
  desconto: 0,
  formaPagamento: "PIX",
  status: "ATIVA",
  renovacaoAutomatica: false,
  dataCriacao: "2026-04-01T00:00:00",
} as const;

describe("ClienteCreditoDiasPanel", () => {
  beforeEach(() => {
    useToastMock.mockReturnValue({ toast: vi.fn() });
    useTenantContextMock.mockReturnValue({ userId: "42" });
    useEmitirContratoCreditoDiasMock.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    });
    useEstornarContratoCreditoDiasMock.mockReturnValue({
      isPending: false,
      variables: undefined,
      mutateAsync: vi.fn(),
    });
    useContratoCreditosDiasMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: [],
      refetch: vi.fn(),
    });
    invalidateQueriesMock.mockResolvedValue(undefined);
  });

  it("renderiza empty state quando não há contrato ativo", () => {
    useHasCapacidadeMock.mockReturnValue({
      hasCapacidade: vi.fn().mockReturnValue(false),
      isLoading: false,
    });

    render(
      <ClienteCreditoDiasPanel
        contratoAtivo={null}
        planoNome={null}
        onReload={vi.fn()}
      />,
    );

    expect(screen.getByText(/não possui contrato ativo/i)).toBeInTheDocument();
  });

  it("exibe CTA e histórico quando o operador possui capacidade", () => {
    useHasCapacidadeMock.mockReturnValue({
      hasCapacidade: (key: string) => key === "matricula.credito-dias",
      isLoading: false,
    });
    useContratoCreditosDiasMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: [
        {
          id: "credito-1",
          tenantId: "tenant-1",
          contratoId: "contrato-1",
          alunoId: "aluno-1",
          dias: 5,
          motivo: "Compensação operacional por fechamento emergencial da unidade.",
          origem: "INDIVIDUAL",
          autorizadoPorUsuarioId: 42,
          autorizadoPorNome: "Operador Crédito",
          autorizadoPorPapel: "GERENTE",
          emitidoEm: "2026-05-01T10:00:00",
          notificarCliente: false,
          dataFimAnterior: "2026-05-10",
          dataFimPosterior: "2026-05-15",
          estornado: false,
        },
      ],
      refetch: vi.fn(),
    });

    render(
      <ClienteCreditoDiasPanel
        contratoAtivo={contratoAtivo as any}
        planoNome="Plano Black"
        onReload={vi.fn()}
      />,
    );

    expect(screen.getByText("Creditar dias")).toBeInTheDocument();
    expect(screen.getByText("+5 dia(s)")).toBeInTheDocument();
    expect(screen.getByText(/Adicionado por Operador Crédito/i)).toBeInTheDocument();
    expect(screen.getByText("Estornar")).toBeInTheDocument();
  });

  it("abre modal de emissão ao clicar no CTA", () => {
    useHasCapacidadeMock.mockReturnValue({
      hasCapacidade: () => true,
      isLoading: false,
    });

    render(
      <ClienteCreditoDiasPanel
        contratoAtivo={contratoAtivo as any}
        planoNome="Plano Black"
        onReload={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Creditar dias"));
    expect(screen.getByTestId("emitir-modal")).toBeInTheDocument();
  });

  it("abre modal de edição quando o operador possui a capability de editar contrato", () => {
    useHasCapacidadeMock.mockReturnValue({
      hasCapacidade: (key: string) => key === "matricula.editar-contrato",
      isLoading: false,
    });

    render(
      <ClienteCreditoDiasPanel
        contratoAtivo={contratoAtivo as any}
        planoNome="Plano Black"
        onReload={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Editar contrato"));
    expect(screen.getByTestId("editar-modal")).toBeInTheDocument();
  });

  it("exibe quem estornou quando o crédito já foi revertido", () => {
    useHasCapacidadeMock.mockReturnValue({
      hasCapacidade: (key: string) => key === "matricula.credito-dias",
      isLoading: false,
    });
    useContratoCreditosDiasMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: [
        {
          id: "credito-2",
          tenantId: "tenant-1",
          contratoId: "contrato-1",
          alunoId: "aluno-1",
          dias: 3,
          motivo: "Ajuste operacional após indisponibilidade de acesso na unidade.",
          origem: "INDIVIDUAL",
          autorizadoPorUsuarioId: 42,
          autorizadoPorNome: "Operador Crédito",
          autorizadoPorPapel: "GERENTE",
          emitidoEm: "2026-05-01T10:00:00",
          notificarCliente: false,
          dataFimAnterior: "2026-05-10",
          dataFimPosterior: "2026-05-13",
          estornado: true,
          estornadoEm: "2026-05-02T11:00:00",
          estornadoPorUsuarioId: 77,
          estornadoPorNome: "Gerente Revisão",
          estornoMotivo: "Lançamento corrigido após conferência com a unidade.",
        },
      ],
      refetch: vi.fn(),
    });

    render(
      <ClienteCreditoDiasPanel
        contratoAtivo={contratoAtivo as any}
        planoNome="Plano Black"
        onReload={vi.fn()}
      />,
    );

    expect(screen.getByText(/Estornado por Gerente Revisão/i)).toBeInTheDocument();
  });
});
