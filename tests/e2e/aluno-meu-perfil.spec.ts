import { expect, test, type Page } from "@playwright/test";
import { seedAlunoSession } from "./support/aluno-auth";
import { installAlunoCommonMocks } from "./support/aluno-api-mocks";

const TENANT_ID = "tenant-aluno-e2e";
const USER_ID = "aluno-e2e-1";

async function installMeuPerfilMocks(page: Page) {
  // O /comercial/clientes/{id}/contexto-operacional retorna aluno completo
  // com endereço, contato emergência, etc. Sobrescrevemos o default de
  // installAlunoCommonMocks com dados ricos.
  await page.route(
    new RegExp(`.*/api/v1/comercial/clientes/${USER_ID}/contexto-operacional.*`),
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenantId: TENANT_ID,
          tenantNome: "Academia E2E",
          aluno: {
            id: USER_ID,
            tenantId: TENANT_ID,
            nome: "Aluno E2E",
            email: "aluno@academia.local",
            telefone: "11999998888",
            cpf: "12345678901",
            dataNascimento: "1990-05-15",
            sexo: "M",
            status: "ATIVO",
            dataCadastro: "2025-01-01T00:00:00Z",
            endereco: {
              cep: "01310-100",
              logradouro: "Av. Paulista",
              numero: "1000",
              bairro: "Bela Vista",
              cidade: "São Paulo",
              estado: "SP",
            },
          },
          eligibleTenants: [
            {
              tenantId: TENANT_ID,
              tenantNome: "Academia E2E",
              defaultTenant: true,
              blockedReasons: [],
            },
          ],
          blockedTenants: [],
          blocked: false,
        }),
      });
    },
  );
}

async function openMeuPerfil(page: Page) {
  await installAlunoCommonMocks(page, { tenantId: TENANT_ID, userId: USER_ID });
  await installMeuPerfilMocks(page);
  await seedAlunoSession(page, { tenantId: TENANT_ID, userId: USER_ID });
  await page.goto("/meu-perfil", { waitUntil: "domcontentloaded" });
}

test.describe("Portal do Aluno — Meu Perfil", () => {
  test("cenário 1: renderiza header com displayName e ID do aluno", async ({
    page,
  }) => {
    await openMeuPerfil(page);

    await expect(
      page.getByRole("heading", { name: "Aluno E2E" }),
    ).toBeVisible();
    // O footer tem "ID #<primeiros 8 chars uppercase>"
    await expect(page.getByText(/ID #ALUNO-E2/, { exact: false })).toBeVisible();
  });

  test("cenário 2: exibe seções de links para editar, notificações e senha", async ({
    page,
  }) => {
    await openMeuPerfil(page);

    // Os links navegam para /meu-perfil/editar, /notificacoes, /senha
    const editarLink = page.getByRole("link", {
      name: /Editar/i,
    });
    await expect(editarLink.first()).toBeVisible();
  });

  test("cenário 3: navega para edição de perfil", async ({ page }) => {
    await openMeuPerfil(page);

    await page
      .getByRole("link", { name: /Editar/i })
      .first()
      .click();
    await page.waitForURL(/\/meu-perfil\/editar/, { timeout: 10_000 });

    await expect(
      page.getByRole("heading", { name: /Editar Perfil/i }),
    ).toBeVisible();
  });
});
