import { expect, test } from "./support/test";
import { installBackofficeGlobalSession } from "./support/backoffice-global-session";

const TENANT_CENTRO = {
  id: "tenant-centro",
  academiaId: "academia-norte",
  groupId: "academia-norte",
  nome: "Unidade Centro",
  ativo: true,
};

const TENANT_SUL = {
  id: "tenant-sul",
  academiaId: "academia-norte",
  groupId: "academia-norte",
  nome: "Unidade Sul",
  ativo: true,
};

const TENANTS = [TENANT_CENTRO, TENANT_SUL];

test.describe("Backoffice entrar como academia", () => {
  test("super user volta ao backoffice após visualizar uma unidade", async ({ page }) => {
    // Seed sessão de backoffice com dois tenants disponíveis
    await installBackofficeGlobalSession(page, {
      session: {
        activeTenantId: "tenant-centro",
        baseTenantId: "tenant-centro",
        availableTenants: TENANTS.map((t, i) => ({ tenantId: t.id, defaultTenant: i === 0 })),
        userId: "user-root",
        userKind: "COLABORADOR",
        displayName: "Root Admin",
        roles: ["OWNER", "ADMIN"],
        availableScopes: ["GLOBAL"],
        broadAccess: true,
      },
      shell: {
        currentTenantId: "tenant-centro",
        tenants: TENANTS,
        user: {
          id: "user-root",
          userId: "user-root",
          nome: "Root Admin",
          displayName: "Root Admin",
          email: "root@qa.local",
          roles: ["OWNER", "ADMIN"],
          userKind: "COLABORADOR",
          activeTenantId: "tenant-centro",
          tenantBaseId: "tenant-centro",
          availableScopes: ["GLOBAL"],
          broadAccess: true,
          redeId: "academia-norte",
          redeNome: "Rede Norte",
          redeSlug: "rede-norte",
        },
        academia: {
          id: "academia-norte",
          nome: "Rede Norte",
          ativo: true,
        },
        capabilities: {
          canAccessElevatedModules: true,
        },
      },
    });

    // Mock específico para o endpoint de contexto de unidade ativa (payload flat)
    // e para o bootstrap (payload com wrapper tenantContext)
    await page.route("**/api/v1/context/unidade-ativa**", async (route) => {
      if (route.request().method() === "PUT") {
        // PUT para trocar de tenant
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            currentTenantId: "tenant-centro",
            tenantAtual: TENANT_CENTRO,
            unidadesDisponiveis: TENANTS,
          }),
        });
        return;
      }

      // GET - retorna contexto flat (sem wrapper tenantContext)
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          currentTenantId: "tenant-centro",
          tenantAtual: TENANT_CENTRO,
          unidadesDisponiveis: TENANTS,
        }),
      });
    });

    await page.route("**/api/v1/app/bootstrap**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }

      // Bootstrap retorna payload com wrapper tenantContext
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "user-root",
            userId: "user-root",
            nome: "Root Admin",
            displayName: "Root Admin",
            email: "root@qa.local",
            roles: ["OWNER", "ADMIN"],
            userKind: "COLABORADOR",
            redeId: "academia-norte",
            redeNome: "Rede Norte",
            redeSlug: "rede-norte",
            activeTenantId: "tenant-centro",
            tenantBaseId: "tenant-centro",
            availableTenants: TENANTS.map((t, i) => ({ tenantId: t.id, defaultTenant: i === 0 })),
            availableScopes: ["GLOBAL"],
            broadAccess: true,
          },
          tenantContext: {
            currentTenantId: "tenant-centro",
            tenantAtual: TENANT_CENTRO,
            unidadesDisponiveis: TENANTS,
          },
          academia: {
            id: "academia-norte",
            nome: "Rede Norte",
            ativo: true,
          },
          capabilities: {
            canAccessElevatedModules: true,
            canDeleteClient: false,
          },
        }),
      });
    });

    await page.route("**/api/v1/auth/me**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-root",
          nome: "Root Admin",
          email: "root@qa.local",
          roles: ["OWNER", "ADMIN"],
          userKind: "COLABORADOR",
          activeTenantId: "tenant-centro",
          availableTenants: TENANTS.map((t, i) => ({ tenantId: t.id, defaultTenant: i === 0 })),
          capabilities: {
            canAccessElevatedModules: true,
          },
        }),
      });
    });

    // Mock para listagem de academias e unidades (necessário para a página carregar)
    await page.route("**/api/v1/admin/academias**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "academia-norte",
            nome: "Rede Norte",
            ativo: true,
          },
        ]),
      });
    });

    await page.route("**/api/v1/admin/unidades**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          TENANTS.map((t) => ({
            ...t,
            academiaNome: "Rede Norte",
          })),
        ),
      });
    });

    // Navegar para a página "Entrar como academia"
    await page.goto("/admin/entrar-como-academia");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: "Entrar como academia" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Busque a academia e selecione a unidade para acessar a visão operacional.")).toBeVisible();

    // Aguardar botão "Voltar ao backoffice" estar visível antes de clicar
    const voltarButton = page.getByRole("button", { name: "Voltar ao backoffice" });
    await expect(voltarButton).toBeVisible({ timeout: 15_000 });

    // Clicar para voltar ao backoffice
    await voltarButton.click();

    // Sem um snapshot administrativo restaurável, o fluxo precisa pedir novo login em vez de travar.
    await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 15_000 });
    await expect(page.getByText("Restaurando sessão do backoffice...")).toHaveCount(0);
    await expect(page.getByText("Sua sessão administrativa precisa ser autenticada novamente para voltar ao backoffice.")).toBeVisible({
      timeout: 15_000,
    });
  });
});
