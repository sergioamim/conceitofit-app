import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────
const hookMocks = vi.hoisted(() => ({
  useAgregadoresDashboard: vi.fn(),
  useAdminAcademias: vi.fn(),
  useAdminUnidades: vi.fn(),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
  searchParamsGet: vi.fn(),
}));

vi.mock("@/lib/query/use-agregadores-admin", () => ({
  useAgregadoresDashboard: hookMocks.useAgregadoresDashboard,
}));

vi.mock("@/backoffice/query", () => ({
  useAdminAcademias: hookMocks.useAdminAcademias,
  useAdminUnidades: hookMocks.useAdminUnidades,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: hookMocks.routerPush,
    replace: hookMocks.routerReplace,
  }),
  useSearchParams: () => ({
    get: hookMocks.searchParamsGet,
    toString: () => "",
  }),
}));

import { AgregadoresDashboardView } from "@/app/(backoffice)/admin/integracoes/agregadores/dashboard/agregadores-dashboard-view";
import { DashboardTopClientes } from "@/components/admin/agregadores/dashboard/dashboard-top-clientes";
import { DashboardKpis } from "@/components/admin/agregadores/dashboard/dashboard-kpis";
import { ComparativoDonut } from "@/components/admin/agregadores/dashboard/dashboard-charts";
import type {
  DashboardMesResponse,
  DashboardTopCliente,
} from "@/lib/api/agregadores-admin";

// ── Fixtures ──────────────────────────────────────────────────────────────
const FIXTURE: DashboardMesResponse = {
  tenantId: "tenant-abc",
  ano: 2026,
  mes: 4,
  tipoFiltro: "TODOS",
  kpis: {
    checkinsValidados: 1234,
    clientesUnicosAtivos: 456,
    valorTotal: 12345.67,
    ticketMedioPorCheckin: 10.0,
    ticketMedioPorCliente: 27.07,
    mediaCheckinsPorCliente: 2.7,
    webhooksRecebidos: 1250,
    webhooksComPrevious: 3,
    webhooksAssinaturaInvalida: 0,
    deadLetters: 0,
  },
  porAgregador: [
    {
      agregador: "WELLHUB",
      checkins: 900,
      clientesUnicos: 340,
      valorTotal: 9000,
      ticketMedioPorCheckin: 10,
      ticketMedioPorCliente: 26.47,
      mediaCheckinsPorCliente: 2.64,
    },
    {
      agregador: "TOTALPASS",
      checkins: 334,
      clientesUnicos: 116,
      valorTotal: 3345.67,
      ticketMedioPorCheckin: 10.02,
      ticketMedioPorCliente: 28.84,
      mediaCheckinsPorCliente: 2.88,
    },
  ],
  serieDiaria: [
    { data: "2026-04-01", checkins: 32, valorTotal: 320 },
    { data: "2026-04-02", checkins: 45, valorTotal: 450 },
    { data: "2026-04-03", checkins: 28, valorTotal: 280 },
  ],
  distribuicaoSemana: [
    { diaDaSemana: 1, label: "DOM", checkins: 50, valorTotal: 500 },
    { diaDaSemana: 2, label: "SEG", checkins: 200, valorTotal: 2000 },
    { diaDaSemana: 3, label: "TER", checkins: 180, valorTotal: 1800 },
    { diaDaSemana: 4, label: "QUA", checkins: 220, valorTotal: 2200 },
    { diaDaSemana: 5, label: "QUI", checkins: 210, valorTotal: 2100 },
    { diaDaSemana: 6, label: "SEX", checkins: 190, valorTotal: 1900 },
    { diaDaSemana: 7, label: "SAB", checkins: 184, valorTotal: 1840 },
  ],
  topClientes: [
    {
      alunoId: "aluno-1",
      externalUserId: "ext-001",
      nome: "Alice Santos",
      agregador: "WELLHUB",
      checkins: 18,
      valorTotal: 180,
      ultimaVisita: "2026-04-22T14:30:00",
    },
    {
      alunoId: null,
      externalUserId: "ext-002",
      nome: null,
      agregador: "TOTALPASS",
      checkins: 12,
      valorTotal: 120,
      ultimaVisita: "2026-04-21T09:00:00",
    },
    {
      alunoId: "aluno-3",
      externalUserId: "ext-003",
      nome: "Carlos Pereira",
      agregador: "WELLHUB",
      checkins: 25,
      valorTotal: 250,
      ultimaVisita: "2026-04-20T18:15:00",
    },
  ],
  comparativo: {
    checkinsMesAnterior: 1100,
    valorTotalMesAnterior: 11000,
    variacaoCheckinsPct: 12.18,
    variacaoValorPct: 12.23,
  },
};

function setupDashboard({
  isLoading = false,
  data = FIXTURE,
  error = null,
  tenantId = "tenant-abc" as string | null,
}: Partial<{
  isLoading: boolean;
  data: DashboardMesResponse | undefined;
  error: Error | null;
  tenantId: string | null;
}> = {}) {
  hookMocks.searchParamsGet.mockImplementation((key: string) => {
    if (key === "tenantId") return tenantId;
    return null;
  });
  hookMocks.useAdminAcademias.mockReturnValue({
    data: [{ id: "ac-1", nome: "Academia X" }],
    isLoading: false,
  });
  hookMocks.useAdminUnidades.mockReturnValue({
    data: [
      { id: "tenant-abc", nome: "Unidade A", academiaId: "ac-1" },
      { id: "tenant-xyz", nome: "Unidade B", academiaId: "ac-1" },
    ],
    isLoading: false,
  });
  hookMocks.useAgregadoresDashboard.mockReturnValue({
    data: isLoading ? undefined : data,
    isLoading,
    isFetching: isLoading,
    error,
    refetch: vi.fn(),
  });
}

describe("AG-12 — AgregadoresDashboardView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza skeleton enquanto carrega", () => {
    setupDashboard({ isLoading: true, data: undefined });
    render(<AgregadoresDashboardView />);
    expect(screen.getByTestId("dashboard-skeleton")).toBeInTheDocument();
  });

  it("renderiza tenant picker quando tenantId ausente", () => {
    setupDashboard({ tenantId: null });
    render(<AgregadoresDashboardView />);
    expect(screen.getByTestId("dashboard-tenant-picker")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-kpis")).not.toBeInTheDocument();
  });

  it("renderiza KPIs e tabela quando dashboard carrega", () => {
    setupDashboard();
    render(<AgregadoresDashboardView />);
    expect(screen.getByTestId("dashboard-kpis")).toBeInTheDocument();
    expect(screen.getByTestId("top-clientes-table")).toBeInTheDocument();
    expect(screen.getByTestId("chart-serie-temporal")).toBeInTheDocument();
    expect(screen.getByTestId("chart-comparativo-donut")).toBeInTheDocument();
    expect(screen.getByTestId("chart-distribuicao-semana")).toBeInTheDocument();
  });
});

describe("AG-12 — DashboardKpis", () => {
  it("mostra badge verde (up) para variação positiva", () => {
    render(
      <DashboardKpis
        kpis={FIXTURE.kpis}
        comparativo={FIXTURE.comparativo}
      />,
    );
    const badge = screen.getByTestId("variation-checkins");
    expect(badge.getAttribute("data-tone")).toBe("up");
  });

  it("mostra badge vermelho (down) para variação negativa", () => {
    render(
      <DashboardKpis
        kpis={FIXTURE.kpis}
        comparativo={{
          ...FIXTURE.comparativo,
          variacaoCheckinsPct: -5,
          variacaoValorPct: -3,
        }}
      />,
    );
    const badge = screen.getByTestId("variation-checkins");
    expect(badge.getAttribute("data-tone")).toBe("down");
  });

  it("badge de saúde de webhooks verde quando tudo OK", () => {
    render(
      <DashboardKpis
        kpis={{
          ...FIXTURE.kpis,
          deadLetters: 0,
          webhooksAssinaturaInvalida: 0,
          webhooksComPrevious: 0,
        }}
        comparativo={FIXTURE.comparativo}
      />,
    );
    const badge = screen.getByTestId("webhook-health-badge");
    expect(badge.getAttribute("data-tone")).toBe("teal");
  });

  it("badge de saúde de webhooks vermelho quando há deadLetters", () => {
    render(
      <DashboardKpis
        kpis={{ ...FIXTURE.kpis, deadLetters: 2 }}
        comparativo={FIXTURE.comparativo}
      />,
    );
    const badge = screen.getByTestId("webhook-health-badge");
    expect(badge.getAttribute("data-tone")).toBe("danger");
  });
});

describe("AG-12 — ComparativoDonut", () => {
  it("toggle entre checkins e valor altera aria-pressed", () => {
    render(<ComparativoDonut porAgregador={FIXTURE.porAgregador} />);
    const btnCheckins = screen.getByTestId("donut-toggle-checkins");
    const btnValor = screen.getByTestId("donut-toggle-valor");
    expect(btnCheckins.getAttribute("aria-pressed")).toBe("true");
    expect(btnValor.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(btnValor);
    expect(btnCheckins.getAttribute("aria-pressed")).toBe("false");
    expect(btnValor.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("AG-12 — DashboardTopClientes", () => {
  const clientes: DashboardTopCliente[] = FIXTURE.topClientes;

  it("ordena por check-ins descendente por padrão", () => {
    render(<DashboardTopClientes clientes={clientes} />);
    const rows = screen.getAllByTestId(/^top-cliente-row-/);
    // Carlos (25) vem antes de Alice (18) vem antes de ext-002 (12)
    expect(rows[0]).toHaveAttribute("data-testid", "top-cliente-row-ext-003");
    expect(rows[1]).toHaveAttribute("data-testid", "top-cliente-row-ext-001");
    expect(rows[2]).toHaveAttribute("data-testid", "top-cliente-row-ext-002");
  });

  it("clica em coluna 'Valor total' para ordenar ascendente quando já ordenado desc", () => {
    render(<DashboardTopClientes clientes={clientes} />);
    const sortValor = screen.getByTestId("sort-valor");
    // 1° click: desc por valor (Carlos 250 → Alice 180 → ext-002 120)
    fireEvent.click(sortValor);
    let rows = screen.getAllByTestId(/^top-cliente-row-/);
    expect(rows[0]).toHaveAttribute("data-testid", "top-cliente-row-ext-003");
    // 2° click: inverte para asc (ext-002 120 → Alice 180 → Carlos 250)
    fireEvent.click(sortValor);
    rows = screen.getAllByTestId(/^top-cliente-row-/);
    expect(rows[0]).toHaveAttribute("data-testid", "top-cliente-row-ext-002");
    expect(rows[2]).toHaveAttribute("data-testid", "top-cliente-row-ext-003");
  });

  it("linha sem alunoId não tem atributo de deep link", () => {
    render(<DashboardTopClientes clientes={clientes} />);
    const semAluno = screen.getByTestId("top-cliente-row-ext-002");
    expect(semAluno.getAttribute("data-aluno-id")).toBe("");
  });
});
