import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  setTenant: vi.fn(),
  tenantContext: {
    tenantId: "tenant-1",
    tenantResolved: true,
    tenants: [{ id: "tenant-1", nome: "Unidade 1" }],
    eligibleTenants: [],
    setTenant: vi.fn(),
    canDeleteClient: false,
  },
  getClienteOperationalContextService: vi.fn(),
  listContratosByAlunoService: vi.fn(),
  listPlanosService: vi.fn(),
  listPagamentosService: vi.fn(),
  listPresencasByAlunoService: vi.fn(),
  listFormasPagamentoService: vi.fn(),
  listConveniosService: vi.fn(),
  getNfseConfiguracaoAtualApi: vi.fn(),
  sincronizarFaceClienteApi: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "aluno-1" }),
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/tenant/hooks/use-session-context", () => ({
  useTenantContext: () => mocks.tenantContext,
}));

vi.mock("@/lib/tenant/comercial/runtime", () => ({
  cancelarPagamentoService: vi.fn(),
  createCartaoClienteService: vi.fn(),
  deleteCartaoClienteService: vi.fn(),
  excluirAlunoService: vi.fn(),
  getClienteOperationalContextService: mocks.getClienteOperationalContextService,
  liberarAcessoCatracaService: vi.fn(),
  listBandeirasCartaoService: vi.fn(),
  listCartoesClienteService: vi.fn(),
  listConveniosService: mocks.listConveniosService,
  listFormasPagamentoService: mocks.listFormasPagamentoService,
  listContratosByAlunoService: mocks.listContratosByAlunoService,
  listPagamentosService: mocks.listPagamentosService,
  listPlanosService: mocks.listPlanosService,
  listPresencasByAlunoService: mocks.listPresencasByAlunoService,
  migrarClienteParaUnidadeService: vi.fn(),
  receberPagamentoService: vi.fn(),
  setCartaoPadraoService: vi.fn(),
  updateAlunoService: vi.fn(),
}));

vi.mock("@/lib/api/financeiro-operacional", () => ({
  getNfseConfiguracaoAtualApi: mocks.getNfseConfiguracaoAtualApi,
}));

vi.mock("@/lib/api/catraca", () => ({
  sincronizarFaceClienteApi: mocks.sincronizarFaceClienteApi,
}));

vi.mock("@/lib/feature-flags", () => ({
  isClientMigrationEnabled: () => false,
}));

import { useClienteWorkspace } from "@/app/(portal)/clientes/[id]/use-cliente-workspace";

function createAluno(overrides?: Record<string, unknown>) {
  return {
    id: "aluno-1",
    tenantId: "tenant-1",
    nome: "Cliente Inativo",
    email: "cliente@test.local",
    cpf: "12345678900",
    telefone: "11999999999",
    sexo: "M",
    dataNascimento: "1990-01-01",
    status: "INATIVO",
    dataCadastro: "2026-04-20T10:00:00Z",
    dataAtualizacao: "2026-04-20T10:00:00Z",
    ...overrides,
  };
}

function createContext(alunoOverrides?: Record<string, unknown>) {
  return {
    tenantId: "tenant-1",
    tenantName: "Unidade 1",
    baseTenantId: "tenant-1",
    baseTenantName: "Unidade 1",
    aluno: createAluno(alunoOverrides),
    eligibleTenants: [],
    blockedTenants: [],
    blocked: false,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("useClienteWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listContratosByAlunoService.mockResolvedValue([]);
    mocks.listPlanosService.mockResolvedValue([]);
    mocks.listPagamentosService.mockResolvedValue([]);
    mocks.listPresencasByAlunoService.mockResolvedValue([]);
    mocks.listFormasPagamentoService.mockResolvedValue([]);
    mocks.listConveniosService.mockResolvedValue([]);
  });

  it("promove o status localmente e revalida o contexto em silent sem voltar para loading global", async () => {
    const deferred = createDeferred<ReturnType<typeof createContext>>();

    mocks.getClienteOperationalContextService
      .mockResolvedValueOnce(createContext())
      .mockReturnValueOnce(deferred.promise);

    const { result } = renderHook(() => useClienteWorkspace());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.aluno?.status).toBe("INATIVO");
    expect(result.current.aluno?.nome).toBe("Cliente Inativo");

    act(() => {
      result.current.promoteAlunoStatusToAtivo();
    });

    expect(result.current.aluno?.status).toBe("ATIVO");
    expect(result.current.loading).toBe(false);

    act(() => {
      void result.current.reload({ silent: true });
    });

    expect(result.current.loading).toBe(false);
    expect(mocks.getClienteOperationalContextService).toHaveBeenCalledTimes(2);

    deferred.resolve(createContext({
      status: "ATIVO",
      nome: "Cliente Revalidado",
    }));

    await waitFor(() => expect(result.current.aluno?.nome).toBe("Cliente Revalidado"));
    expect(result.current.aluno?.status).toBe("ATIVO");
    expect(result.current.loading).toBe(false);
  });
});
