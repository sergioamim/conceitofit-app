import { expect, test } from "@playwright/test";
import {
  buildQuickCreateColaboradorPayload,
  filterColaboradores,
  normalizeFuncionarioRecord,
} from "../../src/lib/administrativo-colaboradores";
import { buildFuncionarioProfileFormSchema } from "../../src/lib/forms/administrativo-schemas";
import { listFuncionariosApi } from "../../src/lib/api/administrativo";
import { clearAuthSession, saveAuthSession } from "../../src/lib/api/session";
import { createFuncionarioFormDefaults, funcionarioToFormValues } from "../../src/components/administrativo/funcionarios/shared";
import { installMockBrowser, mockFetchWithSequence } from "./support/test-runtime";

let browser: ReturnType<typeof installMockBrowser> | undefined;

test.beforeEach(() => {
  browser = installMockBrowser();
  clearAuthSession();
  saveAuthSession({
    token: "token-admin",
    refreshToken: "refresh-admin",
    activeTenantId: "tenant-centro",
    availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
  });
  process.env.NEXT_PUBLIC_API_BASE_URL = "";
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
});

test.afterEach(() => {
  clearAuthSession();
  browser?.restore();
});

test.describe("administrativo colaboradores", () => {
  test("normaliza colaborador com memberships e contratação sensível", () => {
    const colaborador = normalizeFuncionarioRecord({
      id: "funcionario-1",
      tenantId: "tenant-centro",
      nome: "Lúcia Souza",
      emailProfissional: "lucia@academia.local",
      podeMinistrarAulas: false,
      ativo: true,
      statusOperacional: "ATIVO",
      statusAcesso: "ATIVO",
      possuiAcessoSistema: true,
      tenantBaseId: "tenant-centro",
      tenantBaseNome: "Unidade Centro",
      memberships: [
        {
          tenantId: "tenant-centro",
          tenantNome: "Unidade Centro",
          roleDisplayName: "Administrador",
          defaultTenant: true,
        },
        {
          tenantId: "tenant-barra",
          tenantNome: "Unidade Barra",
          roleDisplayName: "Gerente",
        },
      ],
      contratacao: {
        tipo: "CLT",
        salarioAtual: 3200,
      },
    });

    expect(colaborador.nome).toBe("Lúcia Souza");
    expect(colaborador.memberships).toHaveLength(2);
    expect(colaborador.contratacao?.tipo).toBe("CLT");
    expect(colaborador.contratacao?.salarioAtual).toBe(3200);
    expect(colaborador.statusAcesso).toBe("ATIVO");
  });

  test("filtra por acesso, cargo e flag operacional", () => {
    const filtered = filterColaboradores(
      [
        normalizeFuncionarioRecord({
          id: "1",
          nome: "Ana Coordenação",
          cargoId: "cargo-1",
          cargo: "Coordenação",
          ativo: true,
          podeMinistrarAulas: false,
          possuiAcessoSistema: true,
          statusOperacional: "ATIVO",
          statusAcesso: "ATIVO",
          coordenador: true,
        }),
        normalizeFuncionarioRecord({
          id: "2",
          nome: "Bruno Aula",
          cargoId: "cargo-2",
          cargo: "Professor",
          ativo: true,
          podeMinistrarAulas: true,
          possuiAcessoSistema: false,
          statusOperacional: "ATIVO",
          statusAcesso: "SEM_ACESSO",
        }),
      ],
      {
        query: "ana",
        statusOperacional: "ATIVO",
        statusAcesso: "ATIVO",
        cargoId: "cargo-1",
        unidadeId: "",
        flag: "COORDENADOR",
      }
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.nome).toBe("Ana Coordenação");
  });

  test("monta payload do cadastro rápido com acesso opcional e memberships", () => {
    const payload = buildQuickCreateColaboradorPayload({
      draft: {
        nome: "Carla Operações",
        emailProfissional: "carla@academia.local",
        celular: "(21) 98888-7766",
        cargoId: "cargo-recepcao",
        cargo: "",
        podeMinistrarAulas: false,
        permiteCatraca: true,
        permiteForaHorario: false,
        utilizaTecladoAcesso: false,
        coordenador: false,
        criarAcessoSistema: true,
        provisionamentoAcesso: "CONVITE",
        tenantIds: ["tenant-centro", "tenant-barra"],
        tenantBaseId: "tenant-centro",
        perfilAcessoInicialId: "perfil-admin",
        observacoes: "Início imediato",
      },
      cargos: [{ id: "cargo-recepcao", tenantId: "tenant-centro", nome: "Recepção", ativo: true }],
      perfis: [{ id: "perfil-admin", tenantId: "tenant-centro", roleName: "ADMIN", displayName: "Administrador", active: true }],
      availableTenants: [
        { id: "tenant-centro", nome: "Unidade Centro", ativo: true },
        { id: "tenant-barra", nome: "Unidade Barra", ativo: true },
      ],
      currentTenantId: "tenant-centro",
    });

    expect(payload.nome).toBe("Carla Operações");
    expect(payload.statusAcesso).toBe("CONVITE_PENDENTE");
    expect(payload.memberships).toHaveLength(2);
    expect(payload.tenantBaseNome).toBe("Unidade Centro");
  });

  test("schema da ficha exige dados mínimos de acesso no onboarding dedicado", () => {
    const schema = buildFuncionarioProfileFormSchema("create");
    const parsed = schema.safeParse({
      ...createFuncionarioFormDefaults("tenant-centro"),
      nome: "Carla Operações",
      criarAcessoSistema: true,
      tenantIds: ["tenant-centro"],
      tenantBaseId: "tenant-centro",
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues.some((issue) => issue.path.join(".") === "emailProfissional")).toBe(true);
    expect(parsed.error.issues.some((issue) => issue.path.join(".") === "perfilAcessoInicialId")).toBe(true);
  });

  test("converte colaborador existente para valores da ficha por rota", () => {
    const values = funcionarioToFormValues(
      normalizeFuncionarioRecord({
        id: "funcionario-42",
        tenantId: "tenant-centro",
        nome: "Marina Souza",
        emailProfissional: "marina@academia.local",
        tenantBaseId: "tenant-centro",
        tenantBaseNome: "Unidade Centro",
        memberships: [
          {
            tenantId: "tenant-centro",
            tenantNome: "Unidade Centro",
            roleDisplayName: "Administrador",
            defaultTenant: true,
          },
        ],
        horarios: [{ diaSemana: "SEG", horaInicio: "08:00", horaFim: "17:00", ativo: true }],
        possuiAcessoSistema: true,
        ativo: true,
        podeMinistrarAulas: false,
      })
    );

    expect(values.nome).toBe("Marina Souza");
    expect(values.tenantIds).toEqual(["tenant-centro"]);
    expect(values.horarios[0]?.horaInicio).toBe("08:00");
  });

  test("listFuncionariosApi normaliza envelopes ricos do backend novo", async () => {
    const { restore } = mockFetchWithSequence([
      {
        body: {
          items: [
            {
              id: "funcionario-1",
              tenantId: "tenant-centro",
              nome: "Lúcia Souza",
              statusOperacional: "ATIVO",
              statusAcesso: "ATIVO",
              possuiAcessoSistema: true,
              memberships: [
                {
                  tenantId: "tenant-centro",
                  tenantNome: "Unidade Centro",
                  roleDisplayName: "Administrador",
                  defaultTenant: true,
                },
              ],
            },
          ],
        },
      },
    ]);

    try {
      const response = await listFuncionariosApi(false);
      expect(response).toHaveLength(1);
      expect(response[0]?.memberships?.[0]?.tenantNome).toBe("Unidade Centro");
      expect(response[0]?.statusAcesso).toBe("ATIVO");
    } finally {
      restore();
    }
  });
});
