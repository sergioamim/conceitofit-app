import { expect, test, type Page, type Route } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";

const TENANT_ID = "tenant-gerencial-e2e";

type StatusProspect =
  | "NOVO"
  | "EM_CONTATO"
  | "AGENDOU_VISITA"
  | "VISITOU"
  | "CONVERTIDO"
  | "PERDIDO";

type ProspectMock = {
  id: string;
  tenantId: string;
  nome: string;
  telefone: string;
  email?: string;
  origem: string;
  status: StatusProspect;
  dataCriacao: string;
  responsavelId?: string;
};

function buildProspect(overrides: Partial<ProspectMock> = {}): ProspectMock {
  return {
    id: "prospect-1",
    tenantId: TENANT_ID,
    nome: "João da Silva",
    telefone: "11999990001",
    email: "joao@example.com",
    origem: "SITE",
    status: "NOVO",
    dataCriacao: "2026-04-01T10:00:00Z",
    ...overrides,
  };
}

type KanbanMocksOptions = {
  prospects: ProspectMock[];
  onStatusChange?: (route: Route) => Promise<void>;
  onMarkLost?: (route: Route) => Promise<void>;
};

async function installKanbanMocks(page: Page, options: KanbanMocksOptions) {
  // Mutable state: React Query invalida e refetcha após cada mutation
  const store = new Map(options.prospects.map((p) => [p.id, { ...p }]));

  // GET /api/v1/academia/prospects
  await page.route(
    /\/api\/v1\/academia\/prospects(\?|$)/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(Array.from(store.values())),
      });
    },
  );

  // PATCH /api/v1/academia/prospects/{id}/status?status=X
  await page.route(
    /\/api\/v1\/academia\/prospects\/[^/?]+\/status/,
    async (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      if (options.onStatusChange) return options.onStatusChange(route);

      const url = new URL(route.request().url());
      const segments = url.pathname.split("/");
      const id = segments[segments.length - 2];
      const status = url.searchParams.get("status") as StatusProspect | null;
      const current = store.get(id);
      if (!current || !status) {
        return route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "prospect not found" }),
        });
      }
      const updated = {
        ...current,
        status,
        dataUltimoContato: new Date().toISOString().slice(0, 19),
      };
      store.set(id, updated);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(updated),
      });
    },
  );

  // POST /api/v1/academia/prospects/{id}/perdido
  await page.route(
    /\/api\/v1\/academia\/prospects\/[^/?]+\/perdido/,
    async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      if (options.onMarkLost) return options.onMarkLost(route);

      const url = new URL(route.request().url());
      const segments = url.pathname.split("/");
      const id = segments[segments.length - 2];
      const current = store.get(id);
      if (!current) {
        return route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "prospect not found" }),
        });
      }
      const updated = { ...current, status: "PERDIDO" as StatusProspect };
      store.set(id, updated);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(updated),
      });
    },
  );

  // Rotas auxiliares (funcionários + tasks CRM) — retornam vazio
  await page.route(/\/api\/v1\/administrativo\/funcionarios/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(/\/api\/v1\/crm\/tarefas/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}

/**
 * Simula drag-and-drop HTML5 via dispatch manual de eventos.
 * O Playwright `dragTo()` não dispara os handlers HTML5 dataTransfer
 * usados pelo kanban — precisamos emitir os eventos manualmente com um
 * DataTransfer compartilhado entre source e target.
 */
async function dragCardToColumn(
  page: Page,
  cardTestId: string,
  columnTestId: string,
) {
  await page.evaluate(
    ({ cardId, colId }) => {
      const card = document.querySelector(`[data-testid="${cardId}"]`);
      const column = document.querySelector(`[data-testid="${colId}"]`);
      if (!card || !column) {
        throw new Error(
          `Missing element(s): card=${Boolean(card)} column=${Boolean(column)}`,
        );
      }

      const dataTransfer = new DataTransfer();
      card.dispatchEvent(
        new DragEvent("dragstart", { bubbles: true, dataTransfer }),
      );
      column.dispatchEvent(
        new DragEvent("dragover", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
      column.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
      card.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer }));
    },
    { cardId: cardTestId, colId: columnTestId },
  );
}

async function setupKanban(page: Page, options: KanbanMocksOptions) {
  // Ordem importa: common mocks primeiro (rota genérica /academia**),
  // depois os específicos do kanban (LIFO garante prioridade).
  await installGerencialCommonMocks(page, { tenantId: TENANT_ID });
  await installKanbanMocks(page, options);
  await seedGerencialSession(page, { tenantId: TENANT_ID });
  await page.goto("/crm/prospects-kanban", { waitUntil: "domcontentloaded" });
}

test.describe("CRM — Funil de Vendas (Kanban)", () => {
  test("cenário 1: renderiza as 6 colunas do funil", async ({ page }) => {
    // Precisa de ao menos 1 prospect — senão o componente mostra o
    // empty state ao invés do kanban interativo.
    await setupKanban(page, {
      prospects: [buildProspect({ id: "p0", status: "NOVO" })],
    });

    await expect(
      page.getByRole("heading", { name: /Funil de Vendas/ }),
    ).toBeVisible();

    // Colunas: NOVO, EM_CONTATO, AGENDOU_VISITA, VISITOU, CONVERTIDO, PERDIDO
    for (const status of [
      "NOVO",
      "EM_CONTATO",
      "AGENDOU_VISITA",
      "VISITOU",
      "CONVERTIDO",
      "PERDIDO",
    ] as const) {
      await expect(
        page.locator(`[data-testid="kanban-column-${status}"]`),
      ).toBeVisible();
    }
  });

  test("cenário 2: card aparece na coluna correta baseado no status", async ({
    page,
  }) => {
    await setupKanban(page, {
      prospects: [
        buildProspect({ id: "p-novo", nome: "Ana Novo", status: "NOVO" }),
        buildProspect({
          id: "p-contato",
          nome: "Beto Contato",
          status: "EM_CONTATO",
          telefone: "11999990002",
        }),
        buildProspect({
          id: "p-visitou",
          nome: "Carla Visitou",
          status: "VISITOU",
          telefone: "11999990003",
        }),
      ],
    });

    const colNovo = page.locator('[data-testid="kanban-column-NOVO"]');
    const colContato = page.locator('[data-testid="kanban-column-EM_CONTATO"]');
    const colVisitou = page.locator('[data-testid="kanban-column-VISITOU"]');

    await expect(colNovo.getByText("Ana Novo")).toBeVisible();
    await expect(colContato.getByText("Beto Contato")).toBeVisible();
    await expect(colVisitou.getByText("Carla Visitou")).toBeVisible();
  });

  test("cenário 3: move NOVO → EM_CONTATO (próxima etapa válida)", async ({
    page,
  }) => {
    let patchChamada = false;
    let statusRecebido: string | null = null;
    await setupKanban(page, {
      prospects: [buildProspect({ id: "p1", status: "NOVO" })],
      onStatusChange: async (route) => {
        patchChamada = true;
        const url = new URL(route.request().url());
        statusRecebido = url.searchParams.get("status");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "p1",
            tenantId: TENANT_ID,
            nome: "João da Silva",
            telefone: "11999990001",
            origem: "SITE",
            status: "EM_CONTATO",
            dataCriacao: "2026-04-01T10:00:00Z",
          }),
        });
      },
    });

    await expect(page.getByText("João da Silva")).toBeVisible();

    await dragCardToColumn(page, "kanban-card-p1", "kanban-column-EM_CONTATO");

    await expect.poll(() => patchChamada, { timeout: 5_000 }).toBe(true);
    expect(statusRecebido).toBe("EM_CONTATO");

    // Sem banner de erro
    await expect(
      page.locator('[data-testid="kanban-error"]'),
    ).toHaveCount(0);
  });

  test("cenário 4: move EM_CONTATO → AGENDOU_VISITA (próxima etapa válida)", async ({
    page,
  }) => {
    let statusRecebido: string | null = null;
    await setupKanban(page, {
      prospects: [
        buildProspect({
          id: "p2",
          nome: "Maria Contato",
          status: "EM_CONTATO",
        }),
      ],
      onStatusChange: async (route) => {
        const url = new URL(route.request().url());
        statusRecebido = url.searchParams.get("status");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "p2",
            tenantId: TENANT_ID,
            nome: "Maria Contato",
            telefone: "11999990001",
            origem: "SITE",
            status: "AGENDOU_VISITA",
            dataCriacao: "2026-04-01T10:00:00Z",
          }),
        });
      },
    });

    await expect(page.getByText("Maria Contato")).toBeVisible();

    await dragCardToColumn(
      page,
      "kanban-card-p2",
      "kanban-column-AGENDOU_VISITA",
    );

    await expect
      .poll(() => statusRecebido, { timeout: 5_000 })
      .toBe("AGENDOU_VISITA");
  });

  test("cenário 5: bloqueia NOVO → VISITOU (pula etapas) e mostra erro útil", async ({
    page,
  }) => {
    let patchChamada = false;
    await setupKanban(page, {
      prospects: [buildProspect({ id: "p3", status: "NOVO" })],
      onStatusChange: async (route) => {
        patchChamada = true;
        await route.fulfill({ status: 200, body: "{}" });
      },
    });

    await expect(
      page.locator('[data-testid="kanban-card-p3"]'),
    ).toBeVisible();

    await dragCardToColumn(page, "kanban-card-p3", "kanban-column-VISITOU");

    // Banner de erro aparece com a sugestão da próxima etapa válida
    const errorBanner = page.locator('[data-testid="kanban-error"]');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/Não é possível mover/);
    await expect(errorBanner).toContainText(/Em contato/);

    // Nenhuma mutation foi disparada
    await page.waitForTimeout(500);
    expect(patchChamada).toBe(false);
  });

  test("cenário 6: move qualquer status ativo → PERDIDO", async ({ page }) => {
    let marcouPerdido = false;
    await setupKanban(page, {
      prospects: [
        buildProspect({ id: "p4", nome: "Pedro Ativo", status: "AGENDOU_VISITA" }),
      ],
      onMarkLost: async (route) => {
        marcouPerdido = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "p4",
            tenantId: TENANT_ID,
            nome: "Pedro Ativo",
            telefone: "11999990001",
            origem: "SITE",
            status: "PERDIDO",
            dataCriacao: "2026-04-01T10:00:00Z",
          }),
        });
      },
    });

    // O prompt() é nativo — precisa aceitar antes de disparar
    page.on("dialog", (dialog) => {
      void dialog.accept("Não interessado");
    });

    await expect(
      page.locator('[data-testid="kanban-card-p4"]'),
    ).toBeVisible();

    await dragCardToColumn(page, "kanban-card-p4", "kanban-column-PERDIDO");

    await expect.poll(() => marcouPerdido, { timeout: 5_000 }).toBe(true);
  });

  test("cenário 7: soltar card no mesmo lugar não dispara mutation nem erro", async ({
    page,
  }) => {
    let patchChamada = false;
    await setupKanban(page, {
      prospects: [buildProspect({ id: "p5", status: "EM_CONTATO" })],
      onStatusChange: async (route) => {
        patchChamada = true;
        await route.fulfill({ status: 200, body: "{}" });
      },
    });

    await expect(
      page.locator('[data-testid="kanban-card-p5"]'),
    ).toBeVisible();

    // Drop na mesma coluna onde já está
    await dragCardToColumn(
      page,
      "kanban-card-p5",
      "kanban-column-EM_CONTATO",
    );

    // Nenhuma mutation, nenhum erro
    await page.waitForTimeout(500);
    expect(patchChamada).toBe(false);
    await expect(
      page.locator('[data-testid="kanban-error"]'),
    ).toHaveCount(0);
  });

  test("cenário 8: depois de erro, movimento válido limpa o banner de erro", async ({
    page,
  }) => {
    await setupKanban(page, {
      prospects: [buildProspect({ id: "p6", status: "NOVO" })],
    });

    await expect(
      page.locator('[data-testid="kanban-card-p6"]'),
    ).toBeVisible();

    // 1. Tenta movimento inválido → erro
    await dragCardToColumn(
      page,
      "kanban-card-p6",
      "kanban-column-AGENDOU_VISITA",
    );
    await expect(
      page.locator('[data-testid="kanban-error"]'),
    ).toBeVisible();

    // 2. Movimento válido → erro some
    await dragCardToColumn(page, "kanban-card-p6", "kanban-column-EM_CONTATO");
    await expect(
      page.locator('[data-testid="kanban-error"]'),
    ).toHaveCount(0);
  });
});
