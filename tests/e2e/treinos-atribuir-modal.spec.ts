/**
 * E2E Wave J.3 — Modal "Atribuir treino" 3 passos.
 *
 * Cobre:
 * - Botão "Atribuir treino" na page de atribuídos abre dialog
 * - Passo 1: busca de aluno + seleção
 * - Passo 2: lista de templates (desabilitada até aluno selecionado)
 * - Confirmar navega pra /treinos/{templateId}?assign=1&alunoId=...
 *   (delegando configuração de período/frequência ao fluxo legado)
 */

import { expect, test, type Page } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

const TENANT_ID = "tn-1";

const alunos = [
  {
    id: "al-ana",
    tenantId: TENANT_ID,
    nome: "Ana Paula Silva",
    email: "ana@academia.local",
    cpf: "11111111111",
    status: "ATIVO",
  },
  {
    id: "al-bruno",
    tenantId: TENANT_ID,
    nome: "Bruno Costa",
    email: "bruno@academia.local",
    cpf: "22222222222",
    status: "ATIVO",
  },
];

const templates = [
  {
    id: "tpl-hipertrofia",
    nome: "Hipertrofia ABC",
    professorNome: "Paula Lima",
    status: "PUBLICADO",
    frequenciaSemanal: 3,
    totalSemanas: 8,
    perfilIndicacao: "HIPERTROFIA",
    precisaRevisao: false,
    pendenciasAbertas: 0,
    atualizadoEm: "2026-04-25T10:00:00.000Z",
    totalAtribuicoes: 8,
  },
  {
    id: "tpl-emagrecimento",
    nome: "Emagrecimento HIIT",
    professorNome: "João Silva",
    status: "PUBLICADO",
    frequenciaSemanal: 5,
    totalSemanas: 6,
    perfilIndicacao: "EMAGRECIMENTO",
    precisaRevisao: false,
    pendenciasAbertas: 0,
    atualizadoEm: "2026-04-20T10:00:00.000Z",
    totalAtribuicoes: 5,
  },
];

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
      { id: TENANT_ID, nome: "Unidade Centro", academiaId: "acd-1", groupId: "acd-1", ativo: true },
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
    if (url.includes("/templates")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: templates,
          page: 0,
          size: 100,
          total: templates.length,
          hasNext: false,
          totais: {
            totalTemplates: templates.length,
            publicados: templates.length,
            emRevisao: 0,
            comPendencias: 0,
          },
        }),
      });
      return;
    }
    if (url.includes("tipoTreino=CUSTOMIZADO")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], page: 0, size: 200, total: 0, hasNext: false }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], total: 0 }),
    });
  });
  // Listagem de alunos via /comercial/clientes
  await page.route("**/backend/api/v1/comercial/clientes**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: alunos,
        page: 0,
        size: 8,
        total: alunos.length,
        hasNext: false,
      }),
    });
  });
  await page.route("**/backend/api/v1/comercial/alunos**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: alunos,
        page: 0,
        size: 8,
        total: alunos.length,
        hasNext: false,
      }),
    });
  });
}

test.describe("Atribuir treino — modal de 3 passos (Wave J.3)", () => {
  test("abre modal, escolhe aluno + template, confirma e navega", async ({
    page,
  }) => {
    await seed(page);
    await installStubs(page);
    await page.goto("/treinos/atribuidos", { waitUntil: "domcontentloaded" });

    // Aguarda hydration (button onClick precisa estar anexado)
    await page.waitForTimeout(1500);

    await page.getByRole("button", { name: "Atribuir treino" }).click();
    await expect(page.getByText("Atribuir treino a um aluno")).toBeVisible();
    await expect(page.getByText("Escolha o aluno", { exact: true })).toBeVisible();
    await expect(page.getByText("Escolha o template", { exact: true })).toBeVisible();

    // Passo 1: aluno aparece na lista (default search vazio mostra todos)
    const cardAna = page
      .getByRole("dialog")
      .getByRole("button", { name: /Ana Paula Silva/ });
    await expect(cardAna).toBeVisible();
    await cardAna.click();

    // Passo 2: agora templates ficam habilitados
    const cardTemplate = page
      .getByRole("dialog")
      .getByRole("button", { name: /Hipertrofia ABC/ });
    await expect(cardTemplate).toBeEnabled();
    await cardTemplate.click();

    // Confirma — botão "Continuar" agora habilitado
    const confirmar = page.getByRole("button", { name: /Continuar/ });
    await expect(confirmar).toBeEnabled();
    await confirmar.click();

    // Navega pro template com query params do assign + aluno pré-selecionado
    await page.waitForURL(/\/treinos\/tpl-hipertrofia\?/, { timeout: 5000 });
    const url = page.url();
    expect(url).toContain("/treinos/tpl-hipertrofia");
    expect(url).toContain("assign=1");
    expect(url).toContain("alunoId=al-ana");
    // URLSearchParams encoda espaço como "+", encodeURIComponent como "%20"
    expect(url).toMatch(/alunoNome=Ana(\+|%20)Paula(\+|%20)Silva/);
  });

  test("templates ficam desabilitados até aluno ser escolhido", async ({
    page,
  }) => {
    await seed(page);
    await installStubs(page);
    await page.goto("/treinos/atribuidos", { waitUntil: "domcontentloaded" });

    // Aguarda hydration completar antes de clicar
    await page.waitForTimeout(1500);

    await page.getByRole("button", { name: "Atribuir treino" }).click();

    await expect(page.getByText("Atribuir treino a um aluno")).toBeVisible();

    // Antes de aluno: cards de template existem mas estão disabled
    const cardTemplate = page
      .getByRole("dialog")
      .getByRole("button", { name: /Hipertrofia ABC/ });
    await expect(cardTemplate).toBeDisabled();

    // Confirmar também disabled
    await expect(page.getByRole("button", { name: /Continuar/ })).toBeDisabled();
  });
});
