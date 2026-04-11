import { expect, test, type Page } from "@playwright/test";
import { seedAlunoSession } from "./support/aluno-auth";
import { installAlunoCommonMocks } from "./support/aluno-api-mocks";

const TENANT_ID = "tenant-aluno-e2e";
const USER_ID = "aluno-e2e-1";

type PresencaMock = {
  id: string;
  alunoId: string;
  data: string;
  horario: string;
  origem: "CHECKIN" | "AULA" | "ACESSO";
  atividade?: string;
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildPresenca(overrides: Partial<PresencaMock> = {}): PresencaMock {
  return {
    id: "presenca-1",
    alunoId: USER_ID,
    data: todayIso(),
    horario: "08:15",
    origem: "CHECKIN",
    ...overrides,
  };
}

async function installCheckInMocks(
  page: Page,
  options: {
    presencas: PresencaMock[];
    contextOverride?: Record<string, unknown>;
  },
) {
  // GET /api/v1/comercial/alunos/{id}/presencas
  await page.route(
    /\/api\/v1\/comercial\/alunos\/[^/]+\/presencas/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.presencas),
      });
    },
  );

  // O contexto operacional precisa override pois define o bloqueio do QR.
  // installAlunoCommonMocks já declara uma rota default; aqui sobrescrevemos
  // quando o teste quer testar o caminho "bloqueado".
  if (options.contextOverride) {
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
              status: "ATIVO",
              dataCadastro: "2025-01-01T00:00:00Z",
              ...(options.contextOverride?.aluno as Record<string, unknown> | undefined),
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
            ...options.contextOverride,
          }),
        });
      },
    );
  }
}

async function setupCheckInPage(
  page: Page,
  options: {
    presencas: PresencaMock[];
    contextOverride?: Record<string, unknown>;
  },
) {
  // Ordem importa: registramos primeiro os mocks comuns (default) e depois
  // os específicos. Como Playwright usa LIFO, os específicos têm prioridade.
  await installAlunoCommonMocks(page, { tenantId: TENANT_ID, userId: USER_ID });
  await installCheckInMocks(page, options);
  await seedAlunoSession(page, { tenantId: TENANT_ID, userId: USER_ID });
  await page.goto("/check-in", { waitUntil: "domcontentloaded" });
}

test.describe("Portal do Aluno — Check-in", () => {
  test("cenário 1: renderiza QR code quando aluno está ativo", async ({
    page,
  }) => {
    await setupCheckInPage(page, { presencas: [] });

    await expect(
      page.getByRole("heading", { name: "Meu Check-in" }),
    ).toBeVisible();

    // QR code é um SVG dentro do QrCodeCard quando isActive=true
    const qr = page.locator("svg").first();
    await expect(qr).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Histórico recente" }),
    ).toBeVisible();
  });

  test("cenário 2: lista histórico de presenças recentes", async ({ page }) => {
    await setupCheckInPage(page, {
      presencas: [
        buildPresenca({ id: "p1", horario: "07:30", data: todayIso() }),
        buildPresenca({
          id: "p2",
          horario: "18:45",
          origem: "AULA",
          atividade: "Spinning",
        }),
        buildPresenca({ id: "p3", origem: "ACESSO", horario: "10:00" }),
      ],
    });

    await expect(page.getByText("07:30").first()).toBeVisible();
    await expect(page.getByText("18:45").first()).toBeVisible();
    await expect(page.getByText(/Spinning/).first()).toBeVisible();
  });

  test("cenário 3: botão sincronizar dispara refetch", async ({ page }) => {
    let callCount = 0;
    await installAlunoCommonMocks(page, {
      tenantId: TENANT_ID,
      userId: USER_ID,
    });
    // Override da rota de presenças para contar chamadas
    await page.route(
      /\/api\/v1\/comercial\/alunos\/[^/]+\/presencas/,
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        callCount += 1;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([buildPresenca()]),
        });
      },
    );
    await seedAlunoSession(page, { tenantId: TENANT_ID, userId: USER_ID });
    await page.goto("/check-in", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("08:15").first()).toBeVisible();
    const initial = callCount;

    await page.getByRole("button", { name: /Sincronizar/ }).click();

    await expect.poll(() => callCount, { timeout: 5_000 }).toBeGreaterThan(initial);
  });

  test("cenário 4: empty state quando não há presenças", async ({ page }) => {
    await setupCheckInPage(page, { presencas: [] });

    await expect(
      page.getByRole("heading", { name: "Histórico recente" }),
    ).toBeVisible();
    // O componente mostra uma mensagem quando presencas é [] (não loading)
    await expect(page.getByText(/Sincronizar/)).toBeVisible();
  });

  test("cenário 5: bloqueia QR quando aluno inativo/bloqueado", async ({
    page,
  }) => {
    await setupCheckInPage(page, {
      presencas: [],
      contextOverride: {
        blocked: true,
        aluno: {
          id: USER_ID,
          tenantId: TENANT_ID,
          nome: "Aluno E2E",
          status: "INATIVO",
          dataCadastro: "2025-01-01T00:00:00Z",
        },
      },
    });

    await expect(
      page.getByRole("heading", { name: /Acesso Bloqueado/ }),
    ).toBeVisible();
    await expect(
      page.getByText(/matrícula não está ativa/, { exact: false }),
    ).toBeVisible();
  });
});
