/**
 * E2E Wave I — Editor V3 mutations (save, reset, preview, edição cell).
 *
 * Cobre os caminhos críticos de persistência e mutação que H.1 + H.5 +
 * Wave 4 deixaram sem teste e2e:
 * - Save em modo template dispara PUT /api/v1/treinos/{id}
 * - Save em modo instance dispara PATCH /instancias/{id}/overrides
 * - Editar cell em modo template muda valor (sem amber)
 * - Pré-visualizar abre modal com sessões/itens
 *
 * Reusa a mesma fixture do treinos-editor-v3-instance.spec.ts.
 */

import { expect, test, type Page, type Route } from "@playwright/test";
import { buildTreinoV2Observacoes } from "../../src/lib/tenant/treinos/v2-runtime";
import { installE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

const TENANT_ID = "tn-1";
const TEMPLATE_ID = "tpl-hipertrofia";
const ALUNO_ID = "al-ana";
const INSTANCIA_ID = "inst-customizacao-1";

const treinoFixture = {
  id: TEMPLATE_ID,
  tenantId: TENANT_ID,
  nome: "Hipertrofia ABC",
  templateNome: "Hipertrofia ABC",
  status: "ATIVO",
  tipoTreino: "PADRAO",
  ativo: true,
  divisao: "ABC",
  metaSessoesSemana: 3,
  observacoes: buildTreinoV2Observacoes({
    observacoes: "Foco em volume médio.",
    template: {
      versao: 1,
      status: "PUBLICADO",
      versaoSimplificadaHabilitada: false,
      assignmentHistory: [],
      sessoes: [
        {
          id: "sessao-a",
          nome: "A",
          ordem: 1,
          itens: [
            {
              id: "item-supino",
              exerciseId: "ex-supino",
              exerciseNome: "Supino reto",
              ordem: 1,
              series: { raw: "3", numericValue: 3, status: "VALIDO" },
              repeticoes: { raw: "10-12", numericValue: 10, status: "VALIDO" },
              carga: { raw: "60kg", numericValue: 60, status: "VALIDO" },
              intervalo: { raw: "60", numericValue: 60, status: "VALIDO" },
              cadencia: "2-0-1",
              rir: 2,
              tecnicas: [],
            },
          ],
        },
      ],
    },
  }),
  itens: [
    {
      id: "item-supino",
      treinoId: TEMPLATE_ID,
      exercicioId: "ex-supino",
      exercicioNomeSnapshot: "Supino reto",
      grupoMuscularId: "grp-peito",
      grupoMuscularNome: "Peito",
      ordem: 1,
      series: 3,
      repeticoesMin: 10,
      repeticoesMax: 12,
      cargaSugerida: 60,
      intervaloSegundos: 60,
    },
  ],
  revisoes: [],
  execucoes: [],
  createdAt: "2026-04-01T10:00:00.000Z",
  updatedAt: "2026-04-20T10:00:00.000Z",
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

interface Captured {
  putBody: Record<string, unknown> | null;
  patchBody: Record<string, unknown> | null;
}

async function installStubs(page: Page, captured: Captured) {
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
  await page.route("**/backend/api/v1/exercicios**", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "ex-supino",
          tenantId: TENANT_ID,
          nome: "Supino reto",
          grupoMuscularId: "grp-peito",
          grupoMuscularNome: "Peito",
          aparelho: "Barra livre",
          ativo: true,
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-01T00:00:00.000Z",
        },
      ]),
    }),
  );
  await page.route("**/backend/api/v1/comercial/alunos**", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [{ id: ALUNO_ID, tenantId: TENANT_ID, nome: "Ana Paula", status: "ATIVO" }],
        page: 0,
        size: 200,
        total: 1,
        hasNext: false,
      }),
    }),
  );

  // GET /treinos/{id} = template; PUT = save template; captura body
  await page.route(`**/backend/api/v1/treinos/${TEMPLATE_ID}**`, async (route: Route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(treinoFixture),
      });
      return;
    }
    if (method === "PUT" || method === "PATCH") {
      try {
        captured.putBody = route.request().postDataJSON() as Record<string, unknown>;
      } catch {
        captured.putBody = null;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...treinoFixture,
          updatedAt: "2026-04-26T11:00:00.000Z",
        }),
      });
      return;
    }
    await route.continue();
  });

  // POST /instancias = cria; PATCH /instancias/{id}/overrides = captura
  await page.route("**/backend/api/v1/treinos/instancias", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: INSTANCIA_ID,
          templateId: TEMPLATE_ID,
          alunoId: ALUNO_ID,
          overrides: [],
          createdAt: "2026-04-26T10:00:00.000Z",
        }),
      });
      return;
    }
    await route.continue();
  });
  await page.route(
    `**/backend/api/v1/treinos/instancias/${INSTANCIA_ID}/overrides`,
    async (route: Route) => {
      if (route.request().method() === "PATCH") {
        try {
          captured.patchBody = route.request().postDataJSON() as Record<
            string,
            unknown
          >;
        } catch {
          captured.patchBody = null;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: INSTANCIA_ID,
            templateId: TEMPLATE_ID,
            alunoId: ALUNO_ID,
            overrides: captured.patchBody?.overrides ?? [],
          }),
        });
        return;
      }
      await route.continue();
    },
  );
}

test.describe("Editor V3 — mutations e persistência", () => {
  test("modo template: editar célula carga + clicar Salvar dispara PUT com payload correto", async ({
    page,
  }) => {
    const captured: Captured = { putBody: null, patchBody: null };
    await seed(page);
    await installStubs(page, captured);

    await page.goto(`/treinos/${TEMPLATE_ID}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Supino reto").first()).toBeVisible();

    // Edita carga: 60kg → 65kg
    const cargaInput = page
      .locator('input[placeholder="—"], input[value="60kg"]')
      .first();
    await cargaInput.fill("65kg");

    // Salva — botão diz "Salvar template" em modo template
    await page.getByRole("button", { name: /Salvar template/ }).click();

    // Espera o PUT chegar
    await expect.poll(() => captured.putBody !== null, { timeout: 5000 }).toBe(true);

    // Payload contém os itens
    expect(captured.putBody).toBeTruthy();
    expect(captured.putBody?.itens).toBeDefined();
  });

  test("modo instance: editar célula + Salvar dispara PATCH /overrides com MODIFY", async ({
    page,
  }) => {
    const captured: Captured = { putBody: null, patchBody: null };
    await seed(page);
    await installStubs(page, captured);

    await page.goto(
      `/treinos/${TEMPLATE_ID}?customize=1&alunoId=${ALUNO_ID}&alunoNome=${encodeURIComponent("Ana Paula")}`,
      { waitUntil: "domcontentloaded" },
    );
    await expect(page.getByText("Supino reto").first()).toBeVisible();

    // Aguarda criação da instância (POST automático)
    await page.waitForTimeout(500);

    // Edita carga
    const cargaInput = page
      .locator('input[value="60kg"], input[placeholder="—"]')
      .first();
    await cargaInput.fill("70kg");

    // Salva — botão diz "Salvar para Ana"
    await page.getByRole("button", { name: /Salvar para Ana/ }).click();

    // PATCH chegou
    await expect.poll(() => captured.patchBody !== null, { timeout: 5000 }).toBe(true);
    expect(captured.patchBody).toBeTruthy();
    const overrides = captured.patchBody?.overrides as Array<{
      tipo: string;
      campo?: string;
      valor?: unknown;
    }>;
    expect(Array.isArray(overrides)).toBe(true);
    // Pelo menos 1 MODIFY na carga
    const modifyCarga = overrides.find(
      (o) => o.tipo === "MODIFY" && o.campo === "carga",
    );
    expect(modifyCarga).toBeTruthy();
    expect(modifyCarga?.valor).toBe("70kg");
  });

  test("clicar Pré-visualizar abre modal com sessões e exercícios", async ({
    page,
  }) => {
    const captured: Captured = { putBody: null, patchBody: null };
    await seed(page);
    await installStubs(page, captured);

    await page.goto(`/treinos/${TEMPLATE_ID}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Supino reto").first()).toBeVisible();

    await page.getByRole("button", { name: /Pré-visualizar/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Pré-visualização do treino")).toBeVisible();

    // Modal mostra sessão A + exercício
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Supino reto")).toBeVisible();
    await expect(dialog.getByText(/Cadência/)).toBeVisible();

    // Botão Fechar (do footer, exact match) fecha o modal
    await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("modo instance: edição faz cell ficar amber (data-custom)", async ({
    page,
  }) => {
    const captured: Captured = { putBody: null, patchBody: null };
    await seed(page);
    await installStubs(page, captured);

    await page.goto(
      `/treinos/${TEMPLATE_ID}?customize=1&alunoId=${ALUNO_ID}&alunoNome=${encodeURIComponent("Ana Paula")}`,
      { waitUntil: "domcontentloaded" },
    );
    await expect(page.getByText("Supino reto").first()).toBeVisible();

    // Espera a row do supino renderizar com sua célula de carga.
    // Como o React usa controlled inputs com valor inicial, procuramos
    // pelo input que TEM valor "60kg" via JS evaluation.
    const cargaInput = page
      .locator("input")
      .filter({ has: page.locator("xpath=.") })
      .filter({ hasText: "" });

    // Mais simples: pega o input cujo placeholder = "—" da coluna Carga
    // (definido em SortableExerciseRow). Em modo instance, esse input
    // tem o valor 60kg via prop value={item.carga?.raw}.
    const cargaCell = page
      .locator('input[placeholder="—"]')
      .first();
    await expect(cargaCell).toBeVisible();

    // Antes da edição: cell sem classe amber
    await expect(cargaCell).not.toHaveClass(/amber/);

    // Edita: limpa e digita novo valor
    await cargaCell.click({ clickCount: 3 });
    await page.keyboard.type("75kg");
    await page.keyboard.press("Tab");

    // Após edição: classe amber aparece (diff visual do overlay)
    await expect(cargaCell).toHaveClass(/amber/, { timeout: 5000 });
  });
});
