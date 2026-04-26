import type { Page, Route } from "@playwright/test";
import { test, expect } from "./support/test";
import { installE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

/**
 * Smoke E2E do RBAC v2 (release 0.6.3).
 *
 * Cobre as 11 telas do feature module em PLATAFORMA (/admin/gestao-acessos)
 * e ACADEMIA (/gestao-acessos), validando wire-up dos clients HTTP +
 * ausência de erros de browser. Não exercita interações de mutação — esse
 * nível fica para próximas waves.
 */

const TENANT_ID = "tn-1";
const ACADEMIA_ID = "acd-1";
const USER_ID = 42;
const USER_NOME = "Ana Operadora";
const PERFIL_ID = "perfil-admin";
const PERFIL_NOME = "Admin";

function json(body: unknown, status = 200) {
  return { status, contentType: "application/json", body: JSON.stringify(body) };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill(json(body, status));
}

async function installRbacBackendStubs(page: Page) {
  await page.route("**/api/v1/auth/gestao-acessos/stats**", (route) =>
    fulfillJson(route, {
      usuariosAtivos: 24,
      usuariosAtivosDelta7d: 3,
      convitesPendentes: 2,
      convitesExpiramEm48h: 1,
      papeisConfigurados: 8,
      papeisCustom: 2,
      capacidadesCriticas: 12,
      distribuicaoPorPapel: [
        { papelId: PERFIL_ID, papelNome: PERFIL_NOME, papelCor: "#6b8c1a", usuarios: 5 },
        { papelId: "perfil-gerente", papelNome: "Gerente", papelCor: "#7c5cbf", usuarios: 12 },
      ],
      atividadeRecente: [
        {
          id: "evt-1",
          autorEmail: "ops@conceito.fit",
          acao: "perfil.atualizar",
          alvo: PERFIL_ID,
          categoria: "papel",
          critico: false,
          createdAt: new Date("2026-04-25T10:00:00Z").toISOString(),
        },
      ],
    }),
  );

  await page.route("**/api/v1/auth/gestao-acessos/usuarios?**", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return fulfillJson(route, {
      content: [
        {
          id: USER_ID,
          nome: USER_NOME,
          email: "ana@conceito.fit",
          userKind: "COLABORADOR",
          papel: { id: PERFIL_ID, nome: PERFIL_NOME, cor: "#6b8c1a", tipo: "PADRAO" },
          status: "ativo",
          ultimoAcessoAt: new Date("2026-04-24T08:30:00Z").toISOString(),
        },
      ],
      totalElements: 1,
      page: 0,
      size: 20,
    });
  });

  await page.route(`**/api/v1/auth/gestao-acessos/usuarios/${USER_ID}**`, (route) => {
    const url = route.request().url();
    if (url.includes("/resetar-senha")) {
      return fulfillJson(route, { senhaTemporaria: "tmp123!" });
    }
    if (url.includes("/status")) {
      return fulfillJson(route, {
        id: USER_ID,
        nome: USER_NOME,
        email: "ana@conceito.fit",
        userKind: "COLABORADOR",
        enabled: true,
        inviteStatus: null,
        status: "ativo",
        tenantId: TENANT_ID,
        papel: { id: PERFIL_ID, nome: PERFIL_NOME, cor: "#6b8c1a", tipo: "PADRAO" },
        createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
        firstLoginAt: new Date("2026-01-02T08:00:00Z").toISOString(),
      });
    }
    return fulfillJson(route, {
      id: USER_ID,
      nome: USER_NOME,
      email: "ana@conceito.fit",
      userKind: "COLABORADOR",
      enabled: true,
      inviteStatus: null,
      status: "ativo",
      tenantId: TENANT_ID,
      papel: { id: PERFIL_ID, nome: PERFIL_NOME, cor: "#6b8c1a", tipo: "PADRAO" },
      createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
      firstLoginAt: new Date("2026-01-02T08:00:00Z").toISOString(),
    });
  });

  await page.route("**/api/v1/auth/gestao-acessos/auditoria**", (route) =>
    fulfillJson(route, {
      content: [
        {
          id: "evt-1",
          tenantId: TENANT_ID,
          autorEmail: "ops@conceito.fit",
          autorUserId: 1,
          action: "perfil.criar",
          resourceType: "perfil_acesso",
          resourceKey: PERFIL_ID,
          categoria: "papel",
          critico: false,
          beforeState: null,
          afterState: '{"nome":"Admin"}',
          details: null,
          createdAt: new Date("2026-04-25T10:00:00Z").toISOString(),
        },
      ],
      totalElements: 1,
      page: 0,
      size: 20,
    }),
  );

  await page.route("**/api/v1/auth/gestao-acessos/politica-seguranca**", (route) =>
    fulfillJson(route, {
      id: "pol-1",
      dominio: "ACADEMIA",
      tenantId: TENANT_ID,
      senhaMinCaracteres: 8,
      senhaExpiraEmDias: 90,
      senhaExigirMaiuscula: true,
      senhaExigirNumero: true,
      senhaExigirSimbolo: false,
      senhaBloquearReuso5: true,
      senhaBloquearComuns: true,
      sessaoExpiraInatividadeMin: 30,
      sessaoLimite3Simultaneas: false,
      sessaoRestricaoIp: false,
      sessaoAlertaNovoDispositivo: true,
      pisoCamposBloqueados: null,
    }),
  );

  // /perfis legacy: list, templates, detalhe
  await page.route("**/api/v1/auth/gestao-acessos/perfis?**", (route) =>
    fulfillJson(route, [
      {
        id: PERFIL_ID,
        nome: PERFIL_NOME,
        descricao: "Acesso total",
        dominio: "ACADEMIA",
        tipo: "PADRAO",
        cor: "#6b8c1a",
        ativo: true,
        tenantId: TENANT_ID,
      },
    ]),
  );

  await page.route("**/api/v1/auth/gestao-acessos/perfis/templates**", (route) =>
    fulfillJson(route, [
      {
        id: "tpl-admin",
        nome: "Admin (template)",
        descricao: "Template padrão",
        dominio: "PLATAFORMA",
        tipo: "PADRAO",
        cor: "#6b8c1a",
        ativo: true,
        tenantId: null,
      },
    ]),
  );

  await page.route(`**/api/v1/auth/gestao-acessos/perfis/${PERFIL_ID}**`, (route) =>
    fulfillJson(route, {
      id: PERFIL_ID,
      nome: PERFIL_NOME,
      descricao: "Acesso total",
      dominio: "ACADEMIA",
      tipo: "PADRAO",
      cor: "#6b8c1a",
      ativo: true,
      tenantId: TENANT_ID,
      capacidades: ["aluno.financeiro.editar", "config.academia"],
    }),
  );

  await page.route("**/api/v1/auth/gestao-acessos/capacidades?**", (route) =>
    fulfillJson(route, {
      "Alunos": [
        {
          key: "aluno.financeiro.editar",
          dominio: "ACADEMIA",
          modulo: "alunos",
          nome: "Editar financeiro do aluno",
          descricao: "Permite alterar pagamentos do aluno",
          grupo: "Alunos",
          ordem: 10,
          critica: true,
        },
      ],
      "Configurações": [
        {
          key: "config.academia",
          dominio: "ACADEMIA",
          modulo: "config",
          nome: "Editar academia",
          descricao: "Permite alterar dados da academia",
          grupo: "Configurações",
          ordem: 20,
          critica: false,
        },
      ],
    }),
  );

  await page.route(
    "**/api/v1/auth/gestao-acessos/capacidades/papeis-por-capacidade**",
    (route) =>
      fulfillJson(route, {
        "aluno.financeiro.editar": [
          { id: PERFIL_ID, nome: PERFIL_NOME, cor: "#6b8c1a", tipo: "PADRAO" },
        ],
      }),
  );

  await page.route(`**/api/v1/auth/gestao-acessos/usuarios-perfil/${USER_ID}`, (route) =>
    fulfillJson(route, [
      { tenantId: TENANT_ID, perfilId: PERFIL_ID, perfilNome: PERFIL_NOME, tenantNome: "Centro" },
    ]),
  );

  await page.route(
    `**/api/v1/auth/gestao-acessos/usuarios-perfil/${USER_ID}/tenant/**`,
    (route) => {
      const url = route.request().url();
      if (url.endsWith("/capacidades")) {
        return fulfillJson(route, ["aluno.financeiro.editar", "config.academia"]);
      }
      return fulfillJson(route, {
        userId: USER_ID,
        tenantId: TENANT_ID,
        perfilId: PERFIL_ID,
        perfilNome: PERFIL_NOME,
        overrides: [],
      });
    },
  );

  await page.route("**/api/v1/auth/gestao-acessos/convites", (route) =>
    fulfillJson(route, { criados: [], conflitos: [] }),
  );
}

interface ScreenAssertion {
  path: string;
  /** Locator usado quando a tela tem `<h1>` real. */
  heading?: RegExp;
  /** Fallback para telas que renderizam o título em outro elemento. */
  text?: string | RegExp;
}

const BACKOFFICE_SCREENS: ScreenAssertion[] = [
  { path: "/admin/gestao-acessos", heading: /Gest[ãa]o de Acesso/i },
  { path: "/admin/gestao-acessos/usuarios", heading: /^Usu[áa]rios$/i },
  { path: `/admin/gestao-acessos/usuarios/${USER_ID}`, text: USER_NOME },
  { path: "/admin/gestao-acessos/usuarios/convidar", heading: /Convidar pessoas/i },
  { path: "/admin/gestao-acessos/papeis", heading: /^Pap[ée]is$/i },
  { path: "/admin/gestao-acessos/papeis/novo", heading: /Novo papel customizado/i },
  { path: "/admin/gestao-acessos/papeis/comparar", heading: /Comparador de pap[ée]is/i },
  { path: `/admin/gestao-acessos/papeis/${PERFIL_ID}`, heading: new RegExp(`^${PERFIL_NOME}$`) },
  { path: "/admin/gestao-acessos/permissoes", heading: /Cat[áa]logo de permiss[õo]es/i },
  { path: "/admin/gestao-acessos/auditoria", heading: /^Auditoria$/i },
  { path: "/admin/gestao-acessos/seguranca", heading: /Pol[íi]tica de seguran[çc]a/i },
];

const PORTAL_SCREENS: ScreenAssertion[] = BACKOFFICE_SCREENS.map((s) => ({
  ...s,
  path: s.path.replace("/admin/gestao-acessos", "/gestao-acessos"),
}));

async function seedBackofficeSession(page: Page) {
  await installE2EAuthSession(page, {
    activeTenantId: TENANT_ID,
    baseTenantId: TENANT_ID,
    availableTenants: [{ tenantId: TENANT_ID, defaultTenant: true }],
    userId: "user-platform",
    userKind: "PLATAFORMA",
    displayName: "SaaS Admin",
    roles: ["SUPER_ADMIN"],
    availableScopes: ["GLOBAL"],
    broadAccess: true,
  });
  await installOperationalAppShellMocks(page, {
    currentTenantId: TENANT_ID,
    tenants: [
      { id: TENANT_ID, nome: "Unidade Centro", academiaId: ACADEMIA_ID, groupId: ACADEMIA_ID, ativo: true },
    ],
    user: {
      id: "user-platform",
      userId: "user-platform",
      nome: "SaaS Admin",
      displayName: "SaaS Admin",
      email: "saas@conceito.fit",
      roles: ["SUPER_ADMIN"],
      userKind: "PLATAFORMA",
      activeTenantId: TENANT_ID,
      tenantBaseId: TENANT_ID,
      availableTenants: [{ tenantId: TENANT_ID, defaultTenant: true }],
      availableScopes: ["GLOBAL"],
      broadAccess: true,
      redeId: ACADEMIA_ID,
      redeNome: "Conceito Fit",
      redeSlug: "conceito-fit",
    },
    academia: { id: ACADEMIA_ID, nome: "Conceito Fit", ativo: true },
  });
  await installRbacBackendStubs(page);
}

async function seedPortalSession(page: Page) {
  await installE2EAuthSession(page, {
    activeTenantId: TENANT_ID,
    baseTenantId: TENANT_ID,
    availableTenants: [{ tenantId: TENANT_ID, defaultTenant: true }],
    userId: "user-operador",
    userKind: "COLABORADOR",
    displayName: "Admin Operador",
    roles: ["ADMIN"],
    availableScopes: ["UNIDADE"],
  });
  await installOperationalAppShellMocks(page, {
    currentTenantId: TENANT_ID,
    tenants: [
      { id: TENANT_ID, nome: "Unidade Centro", academiaId: ACADEMIA_ID, groupId: ACADEMIA_ID, ativo: true },
    ],
    user: {
      id: "user-operador",
      userId: "user-operador",
      nome: "Admin Operador",
      displayName: "Admin Operador",
      email: "operador@academia.local",
      roles: ["ADMIN"],
      userKind: "COLABORADOR",
      activeTenantId: TENANT_ID,
      tenantBaseId: TENANT_ID,
      availableTenants: [{ tenantId: TENANT_ID, defaultTenant: true }],
      availableScopes: ["UNIDADE"],
      broadAccess: false,
      redeId: ACADEMIA_ID,
      redeNome: "Academia Centro",
      redeSlug: "academia-centro",
    },
    academia: { id: ACADEMIA_ID, nome: "Academia Centro", ativo: true },
  });
  await installRbacBackendStubs(page);
}

async function visitAndAssert(page: Page, screen: ScreenAssertion) {
  await page.goto(screen.path);
  if (screen.heading) {
    await expect(
      page.getByRole("heading", { name: screen.heading }).first(),
    ).toBeVisible({ timeout: 10_000 });
  } else if (screen.text) {
    await expect(page.getByText(screen.text).first()).toBeVisible({ timeout: 10_000 });
  }
}

test.describe("RBAC v2 — backoffice (PLATAFORMA)", () => {
  test("smoke das 11 telas de gestão de acesso", async ({ page, browserErrors }) => {
    browserErrors.allowConsoleErrors(
      /AbortError/i,
      /aborted/i,
      // Smoke aceita 500s de side requests fora do escopo RBAC v2 (shell/métricas).
      /Failed to load resource.*500/i,
    );
    await seedBackofficeSession(page);
    for (const screen of BACKOFFICE_SCREENS) {
      await visitAndAssert(page, screen);
    }
  });
});

test.describe("RBAC v2 — portal (ACADEMIA / OPERADOR)", () => {
  test("smoke das 11 telas de gestão de acesso", async ({ page, browserErrors }) => {
    browserErrors.allowConsoleErrors(
      /AbortError/i,
      /aborted/i,
      // Smoke aceita 500s de side requests fora do escopo RBAC v2 (shell/métricas).
      /Failed to load resource.*500/i,
    );
    await seedPortalSession(page);
    for (const screen of PORTAL_SCREENS) {
      await visitAndAssert(page, screen);
    }
  });
});
