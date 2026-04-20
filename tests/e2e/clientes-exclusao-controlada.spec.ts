import { expect, test, type Page, type Request, type Route } from "@playwright/test";
import { seedAuthenticatedSession } from "./support/backend-only-stubs";

const TENANT = {
  id: "tenant-clientes-delete",
  nome: "Unidade Clientes",
  academiaId: "academia-clientes-delete",
  groupId: "academia-clientes-delete",
  ativo: true,
  branding: {
    appName: "Conceito Fit Clientes",
  },
};

const ALUNO = {
  id: "aluno-delete-1",
  tenantId: TENANT.id,
  nome: "Ana Exclusao",
  email: "ana.exclusao@academia.local",
  telefone: "(11) 99999-1000",
  cpf: "12345678900",
  dataNascimento: "1992-04-10",
  sexo: "F",
  status: "ATIVO",
  pendenteComplementacao: false,
  dataCadastro: "2026-03-01T10:00:00",
};

type DeleteResponse =
  | {
      status: 200;
      body: {
        success: true;
        auditId: string;
        eventType: string;
      };
    }
  | {
      status: 403 | 409 | 422;
      body: {
        message: string;
        blockedBy?: Array<{ code: string; message: string }>;
      };
    };

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

function parseBody<T = unknown>(request: Request): T {
  try {
    return JSON.parse(request.postData() ?? "{}") as T;
  } catch {
    return {} as T;
  }
}

async function installClienteDeleteMocks(
  page: Page,
  input: {
    canDeleteClient: boolean;
    deleteResponses?: DeleteResponse[];
  },
) {
  const deleteResponses = [...(input.deleteResponses ?? [])];

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/backend/, "");
    const method = request.method();

    if (path === "/api/v1/app/bootstrap" && method === "GET") {
      await fulfillJson(route, {
        user: {
          id: "user-1",
          nome: "Gestor",
          email: "gestor@academia.local",
          roles: input.canDeleteClient ? ["ALTO"] : ["RECEPCAO"],
          activeTenantId: TENANT.id,
          availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
        },
        tenantContext: {
          currentTenantId: TENANT.id,
          tenantAtual: TENANT,
          unidadesDisponiveis: [TENANT],
        },
        academia: {
          id: TENANT.academiaId,
          nome: "Academia Clientes",
          ativo: true,
          branding: TENANT.branding,
        },
        branding: TENANT.branding,
        capabilities: {
          canAccessElevatedModules: true,
          canDeleteClient: input.canDeleteClient,
        },
      });
      return;
    }

    if (path === "/api/v1/auth/me" && method === "GET") {
      await fulfillJson(route, {
        id: "user-1",
        nome: "Gestor",
        email: "gestor@academia.local",
        roles: input.canDeleteClient ? ["ALTO"] : ["RECEPCAO"],
        activeTenantId: TENANT.id,
        availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      await fulfillJson(route, {
        currentTenantId: TENANT.id,
        tenantAtual: TENANT,
        unidadesDisponiveis: [TENANT],
      });
      return;
    }

    if (/^\/api\/v1\/context\/unidade-ativa\/[^/]+$/.test(path) && method === "PUT") {
      await fulfillJson(route, {
        currentTenantId: TENANT.id,
        tenantAtual: TENANT,
        unidadesDisponiveis: [TENANT],
      });
      return;
    }

    if (path === "/api/v1/academia" && method === "GET") {
      await fulfillJson(route, {
        id: TENANT.academiaId,
        nome: "Academia Clientes",
        ativo: true,
        branding: TENANT.branding,
      });
      return;
    }

    if (path === `/api/v1/comercial/alunos/${ALUNO.id}` && method === "GET") {
      await fulfillJson(route, ALUNO);
      return;
    }

    if (path === `/api/v1/comercial/alunos/${ALUNO.id}` && method === "DELETE") {
      const payload = parseBody<{ justificativa?: string }>(request);
      const next = deleteResponses.shift();
      if (!payload.justificativa?.trim()) {
        await fulfillJson(route, { message: "Justificativa obrigatória" }, 422);
        return;
      }
      if (!next) {
        await fulfillJson(route, {
          success: true,
          auditId: "audit-default",
          eventType: "CLIENT_DELETED",
        });
        return;
      }
      await fulfillJson(route, next.body, next.status);
      return;
    }

    if (path === "/api/v1/comercial/alunos" && method === "GET") {
      await fulfillJson(route, {
        items: [ALUNO],
        page: 0,
        size: 20,
        hasNext: false,
        totaisStatus: {
          total: 1,
          totalAtivo: 1,
          totalSuspenso: 0,
          totalInativo: 0,
          totalCancelado: 0,
        },
      });
      return;
    }

    if (
      (
        path === "/api/v1/comercial/adesoes"
        || path === "/api/v1/comercial/matriculas"
        || path === `/api/v1/comercial/alunos/${ALUNO.id}/adesoes`
        || path === `/api/v1/comercial/alunos/${ALUNO.id}/matriculas`
      )
      && method === "GET"
    ) {
      await fulfillJson(route, []);
      return;
    }

    if (
      path === "/api/v1/comercial/planos"
      || path === "/api/v1/comercial/pagamentos"
      || path === "/api/v1/administrativo/convenios"
      || path === "/api/v1/gerencial/financeiro/formas-pagamento"
      || path === `/api/v1/comercial/alunos/${ALUNO.id}/presencas`
      || path === `/api/v1/comercial/alunos/${ALUNO.id}/cartoes`
      || path === "/api/v1/comercial/bandeiras-cartao"
    ) {
      await fulfillJson(route, []);
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });
}

test.describe("Exclusão controlada de clientes", () => {
  test("exibe ação para perfis autorizados, trata erros e redireciona no sucesso", async ({ page }) => {
    await installClienteDeleteMocks(page, {
      canDeleteClient: true,
      deleteResponses: [
        { status: 422, body: { message: "Justificativa inválida" } },
        {
          status: 409,
          body: {
            message: "Cliente com dependências abertas",
            blockedBy: [{ code: "OPEN_SALES", message: "Existem vendas em aberto." }],
          },
        },
        { status: 403, body: { message: "Sem permissão" } },
        {
          status: 200,
          body: {
            success: true,
            auditId: "audit-123",
            eventType: "CLIENT_DELETED",
          },
        },
      ],
    });
    await seedAuthenticatedSession(page, {
      tenantId: TENANT.id,
      tenantName: TENANT.nome,
      availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
    });

    await page.goto(`/clientes/${ALUNO.id}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: ALUNO.nome })).toBeVisible();

    await page.locator("button.h-9.px-2").click();
    await expect(page.getByRole("button", { name: "Excluir cliente" })).toBeVisible();
    await page.getByRole("button", { name: "Excluir cliente" }).click();

    const modal = page.getByRole("dialog");
    await expect(modal.getByRole("button", { name: "Excluir cliente" })).toBeDisabled();

    await modal.locator("textarea").fill("Justificativa curta");
    await modal.getByRole("button", { name: "Excluir cliente" }).click();
    await expect(modal.getByText("Informe uma justificativa válida para excluir o cliente.")).toBeVisible();

    await modal.locator("textarea").fill("Cliente solicitou remoção e há conflito operacional.");
    await modal.getByRole("button", { name: "Excluir cliente" }).click();
    await expect(modal.getByRole("listitem").filter({ hasText: "Existem vendas em aberto." })).toBeVisible();

    await modal.locator("textarea").fill("Novo motivo auditável.");
    await modal.getByRole("button", { name: "Excluir cliente" }).click();
    await expect(modal.getByText("Seu perfil não possui permissão para excluir clientes.")).toBeVisible();

    await modal.locator("textarea").fill("Cadastro duplicado confirmado pelo financeiro.");
    await modal.getByRole("button", { name: "Excluir cliente" }).click();
    await expect(page).toHaveURL(/\/clientes\?deleted=1$/);
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
  });

  test("não mostra ação de excluir na tela de cartões sem capability", async ({ page }) => {
    await installClienteDeleteMocks(page, {
      canDeleteClient: false,
    });
    await seedAuthenticatedSession(page, {
      tenantId: TENANT.id,
      tenantName: TENANT.nome,
      availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
    });

    // Perfil v3 Wave 4 (AC4.6/4.7): Cartões saiu do TabBar e virou drawer
    // no ActionMenu; `?tab=cartoes` é deep-link que abre o drawer
    // automaticamente. `exact: true` desambigua o heading do painel do
    // SheetTitle sr-only.
    await page.goto(`/clientes/${ALUNO.id}?tab=cartoes`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/clientes/${ALUNO.id}\\?tab=cartoes$`));
    await expect(page.getByRole("heading", { name: "Cartões", exact: true })).toBeVisible();

    // Fecha o drawer de cartões (ESC) para liberar o ActionMenu do header.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Cartões", exact: true })).toBeHidden();

    await page.locator("button.h-9.px-2").click();
    await expect(page.getByRole("button", { name: "Excluir cliente" })).toHaveCount(0);
  });
});
