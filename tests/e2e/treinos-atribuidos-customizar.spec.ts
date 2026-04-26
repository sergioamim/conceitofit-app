/**
 * E2E Wave G — Spec 3: Atribuídos fluxo Customizar.
 *
 * Cobre Wave D do design "Montagem de Treino":
 * - Avatar do aluno + nome em link
 * - Badge "customizado" amber aparece quando customizadoLocalmente=true
 * - Botão "Customizar" navega pra editor com query
 *   ?customize=1&alunoId=X&alunoNome=Y (modo instance)
 * - Botão "Progresso" navega pra /treinos/progresso/{alunoId}
 * - Ações secundárias (Encerrar/Reatribuir/Duplicar) ficam em
 *   DropdownMenu de overflow
 */

import { expect, test, type Page } from "@playwright/test";
import { buildTreinoV2Observacoes } from "../../src/lib/tenant/treinos/v2-runtime";
import { installE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

const TENANT_ID = "tn-1";

const SNAPSHOT_HIPERTROFIA = {
  id: "snap-hipertrofia-v3",
  templateId: "tpl-hipertrofia",
  templateVersion: 3,
  templateNome: "Hipertrofia ABC",
  publishedAt: "2026-04-01T00:00:00.000Z",
  frequenciaSemanal: 3,
  totalSemanas: 8,
  categoria: "Hipertrofia",
  sessoes: [{ id: "bloco-1", nome: "A", ordem: 1, itens: [] }],
  validationIssues: [],
};

const SNAPSHOT_FULLBODY = {
  id: "snap-fullbody-v1",
  templateId: "tpl-fullbody",
  templateVersion: 1,
  templateNome: "Full Body 3x",
  publishedAt: "2026-03-15T00:00:00.000Z",
  frequenciaSemanal: 3,
  totalSemanas: 4,
  categoria: "Condicionamento",
  sessoes: [{ id: "bloco-1", nome: "A", ordem: 1, itens: [] }],
  validationIssues: [],
};

const treinoCustomizado = {
  id: "treino-customizado-1",
  tenantId: TENANT_ID,
  nome: "Hipertrofia ABC — Ana Paula",
  templateNome: "Hipertrofia ABC",
  professorNome: "Paula Lima",
  alunoId: "al-ana",
  alunoNome: "Ana Paula",
  treinoBaseId: "tpl-hipertrofia",
  status: "ATIVO",
  tipoTreino: "CUSTOMIZADO",
  ativo: true,
  dataInicio: "2026-04-01",
  dataFim: "2026-06-01",
  // Metadata com customizadoLocalmente=true → badge amber aparece
  observacoes: buildTreinoV2Observacoes({
    observacoes: "Treino da Ana — customizado",
    assigned: {
      status: "ATIVO",
      snapshot: SNAPSHOT_HIPERTROFIA,
      customizadoLocalmente: true,
      origem: "TEMPLATE",
    },
  }),
  itens: [],
  createdAt: "2026-04-01T10:00:00.000Z",
  updatedAt: "2026-04-20T10:00:00.000Z",
};

const treinoSemCustom = {
  id: "treino-sem-custom-1",
  tenantId: TENANT_ID,
  nome: "Full Body — Carlos",
  templateNome: "Full Body 3x",
  professorNome: "Paula Lima",
  alunoId: "al-carlos",
  alunoNome: "Carlos Eduardo",
  treinoBaseId: "tpl-fullbody",
  status: "ATIVO",
  tipoTreino: "CUSTOMIZADO",
  ativo: true,
  dataInicio: "2026-04-15",
  dataFim: "2026-06-15",
  observacoes: buildTreinoV2Observacoes({
    observacoes: "Treino do Carlos — direto do template",
    assigned: {
      status: "ATIVO",
      snapshot: SNAPSHOT_FULLBODY,
      customizadoLocalmente: false,
      origem: "TEMPLATE",
    },
  }),
  itens: [],
  createdAt: "2026-04-15T10:00:00.000Z",
  updatedAt: "2026-04-15T10:00:00.000Z",
};

async function seed(page: Page) {
  await installE2EAuthSession(page, {
    activeTenantId: TENANT_ID,
    baseTenantId: TENANT_ID,
    availableTenants: [{ tenantId: TENANT_ID, defaultTenant: true }],
    userId: "user-1",
    userKind: "COLABORADOR",
    displayName: "Admin Treinos",
    roles: ["ADMIN"],
    availableScopes: ["UNIDADE"],
  });
  await installOperationalAppShellMocks(page, {
    currentTenantId: TENANT_ID,
    tenants: [
      {
        id: TENANT_ID,
        nome: "Unidade Centro",
        academiaId: "acd-1",
        groupId: "acd-1",
        ativo: true,
      },
    ],
    user: {
      id: "user-1",
      userId: "user-1",
      nome: "Admin Treinos",
      displayName: "Admin Treinos",
      email: "admin@academia.local",
      roles: ["ADMIN"],
      userKind: "COLABORADOR",
      activeTenantId: TENANT_ID,
      tenantBaseId: TENANT_ID,
      availableTenants: [{ tenantId: TENANT_ID, defaultTenant: true }],
      availableScopes: ["UNIDADE"],
      broadAccess: false,
      redeId: "acd-1",
      redeNome: "Academia Treinos",
      redeSlug: "academia-treinos",
    },
    academia: { id: "acd-1", nome: "Academia Treinos", ativo: true },
    routes: { authRefresh: true, onboardingStatus: true },
  });
}

async function installStubs(page: Page) {
  await page.route("**/backend/api/v1/auth/me", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-1",
        nome: "Admin Treinos",
        email: "admin@academia.local",
        roles: ["ADMIN"],
        activeTenantId: TENANT_ID,
        availableTenants: [{ tenantId: TENANT_ID, defaultTenant: true }],
      }),
    }),
  );
  await page.route("**/backend/api/v1/context/unidade-ativa", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        currentTenantId: TENANT_ID,
        tenantAtual: { id: TENANT_ID, academiaId: "acd-1", nome: "Unidade Centro", ativo: true },
        unidadesDisponiveis: [
          { id: TENANT_ID, academiaId: "acd-1", nome: "Unidade Centro", ativo: true },
        ],
      }),
    }),
  );
  await page.route("**/backend/api/v1/treinos**", async (route) => {
    const url = route.request().url();
    // Lista de treinos atribuídos
    if (url.includes("tipoTreino=CUSTOMIZADO")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [treinoCustomizado, treinoSemCustom],
          page: 0,
          size: 200,
          total: 2,
          hasNext: false,
        }),
      });
      return;
    }
    // Default: passa direto
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], total: 0 }),
    });
  });
}

test.describe("Atribuídos — fluxo Customizar (Wave D)", () => {
  test("renderiza avatar do aluno + nome em link + badge customizado quando overlay diverge", async ({
    page,
  }) => {
    await seed(page);
    await installStubs(page);
    await page.goto("/treinos/atribuidos", { waitUntil: "domcontentloaded" });

    // Linhas dos 2 alunos visíveis
    await expect(page.getByText("Ana Paula").first()).toBeVisible();
    await expect(page.getByText("Carlos Eduardo").first()).toBeVisible();

    // Badge "customizado" em amber só aparece pra quem tem
    // customizadoLocalmente=true (Ana, não Carlos)
    const linhaAna = page.getByRole("row").filter({ hasText: "Ana Paula" });
    const linhaCarlos = page.getByRole("row").filter({ hasText: "Carlos Eduardo" });

    await expect(linhaAna.getByText("customizado")).toBeVisible();
    await expect(linhaCarlos.getByText("usando template original")).toBeVisible();
  });

  test("clicar Customizar navega pra editor com query mode=instance + alunoId + alunoNome", async ({
    page,
  }) => {
    await seed(page);
    await installStubs(page);
    await page.goto("/treinos/atribuidos", { waitUntil: "domcontentloaded" });

    const linhaAna = page.getByRole("row").filter({ hasText: "Ana Paula" });
    await expect(linhaAna).toBeVisible();

    const customizar = linhaAna.getByRole("link", { name: /Customizar/ });
    await expect(customizar).toBeVisible();
    await customizar.click();

    // URL deve conter os 3 query params essenciais do modo instance
    await page.waitForURL(/customize=1/, { timeout: 5000 });
    const url = page.url();
    expect(url).toContain("/treinos/tpl-hipertrofia");
    expect(url).toContain("customize=1");
    expect(url).toContain("alunoId=al-ana");
    expect(url).toContain("alunoNome=Ana");
  });

  test("clicar Progresso navega pra /treinos/progresso/{alunoId}", async ({ page }) => {
    await seed(page);
    await installStubs(page);
    await page.goto("/treinos/atribuidos", { waitUntil: "domcontentloaded" });

    const linhaAna = page.getByRole("row").filter({ hasText: "Ana Paula" });
    const progresso = linhaAna.getByRole("link", { name: /Progresso/ });
    await expect(progresso).toBeVisible();
    await progresso.click();

    await page.waitForURL("**/treinos/progresso/al-ana", { timeout: 5000 });
    expect(page.url()).toContain("/treinos/progresso/al-ana");
  });

  test("ações secundárias (Reatribuir/Duplicar/Encerrar) estão em overflow menu", async ({
    page,
  }) => {
    await seed(page);
    await installStubs(page);
    await page.goto("/treinos/atribuidos", { waitUntil: "domcontentloaded" });

    const linhaAna = page.getByRole("row").filter({ hasText: "Ana Paula" });
    // Por default essas opções NÃO aparecem visíveis na linha
    await expect(linhaAna.getByRole("link", { name: /Reatribuir template/ })).toBeHidden();
    await expect(linhaAna.getByRole("menuitem", { name: /Encerrar treino/ })).toBeHidden();

    // Abrir overflow → opções aparecem como menuitems
    const overflow = linhaAna.getByRole("button", { name: "Mais ações" });
    await expect(overflow).toBeVisible();
    await overflow.click();

    await expect(page.getByRole("menuitem", { name: /Abrir treino/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Reatribuir template/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Duplicar/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Encerrar treino/ })).toBeVisible();
  });
});
