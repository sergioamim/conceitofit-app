import { expect, test, type Page, type Route } from "@playwright/test";
import { seedAlunoSession } from "./support/aluno-auth";
import { installAlunoCommonMocks } from "./support/aluno-api-mocks";

const TENANT_ID = "tenant-aluno-e2e";
const USER_ID = "aluno-e2e-1";

type AulaSessaoMock = {
  id: string;
  tenantId: string;
  atividadeGradeId: string;
  atividadeId: string;
  atividadeNome: string;
  data: string;
  diaSemana: "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB" | "DOM";
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  vagasOcupadas: number;
  vagasDisponiveis: number;
  waitlistTotal: number;
  permiteReserva: boolean;
  listaEsperaHabilitada: boolean;
  salaNome?: string;
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildAula(overrides: Partial<AulaSessaoMock> = {}): AulaSessaoMock {
  return {
    id: "sessao-yoga-hoje",
    tenantId: TENANT_ID,
    atividadeGradeId: "grade-yoga",
    atividadeId: "atv-yoga",
    atividadeNome: "Yoga Flow",
    data: todayIso(),
    diaSemana: "QUA",
    horaInicio: "07:00",
    horaFim: "08:00",
    capacidade: 20,
    vagasOcupadas: 12,
    vagasDisponiveis: 8,
    waitlistTotal: 0,
    permiteReserva: true,
    listaEsperaHabilitada: true,
    salaNome: "Sala Zen",
    ...overrides,
  };
}

type MinhasAulasMocksOptions = {
  sessoes: AulaSessaoMock[];
  reservas: Array<{
    id: string;
    sessaoId: string;
    status: "CONFIRMADA" | "LISTA_ESPERA" | "CANCELADA" | "CHECKIN";
    posicaoListaEspera?: number;
  }>;
  onReservar?: (route: Route) => Promise<void>;
  onCancelar?: (route: Route) => Promise<void>;
};

async function installMinhasAulasMocks(
  page: Page,
  options: MinhasAulasMocksOptions,
) {
  // GET /api/v1/agenda/aulas/sessoes
  await page.route(/\/api\/v1\/agenda\/aulas\/sessoes(\?|$)/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options.sessoes),
    });
  });

  // Rota única para /reservas — trata GET e POST (idem /cancelar)
  await page.route(/\/api\/v1\/agenda\/aulas\/reservas/, async (route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();

    // POST /reservas/{id}/cancelar
    if (method === "POST" && /\/reservas\/[^/?]+\/cancelar/.test(url)) {
      if (options.onCancelar) return options.onCancelar(route);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "reserva-cancelada", status: "CANCELADA" }),
      });
    }

    // POST /reservas (criação)
    if (method === "POST") {
      if (options.onReservar) return options.onReservar(route);
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "reserva-nova",
          tenantId: TENANT_ID,
          sessaoId: options.sessoes[0]?.id,
          status: "CONFIRMADA",
          dataCriacao: new Date().toISOString(),
        }),
      });
    }

    // GET /reservas
    if (method === "GET") {
      const reservas = options.reservas.map((r) => {
        const sessao = options.sessoes.find((s) => s.id === r.sessaoId);
        return {
          id: r.id,
          tenantId: TENANT_ID,
          sessaoId: r.sessaoId,
          atividadeGradeId: sessao?.atividadeGradeId,
          atividadeId: sessao?.atividadeId,
          atividadeNome: sessao?.atividadeNome,
          alunoId: USER_ID,
          alunoNome: "Aluno E2E",
          data: sessao?.data ?? todayIso(),
          horaInicio: sessao?.horaInicio ?? "07:00",
          horaFim: sessao?.horaFim ?? "08:00",
          origem: "PORTAL_ALUNO",
          status: r.status,
          posicaoListaEspera: r.posicaoListaEspera,
          dataCriacao: new Date().toISOString(),
        };
      });
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(reservas),
      });
    }

    await route.fallback();
  });
}

async function openMinhasAulas(page: Page) {
  await installAlunoCommonMocks(page, { tenantId: TENANT_ID, userId: USER_ID });
  await seedAlunoSession(page, { tenantId: TENANT_ID, userId: USER_ID });
  await page.goto("/minhas-aulas", { waitUntil: "domcontentloaded" });
}

test.describe("Portal do Aluno — Minhas Aulas", () => {
  test("cenário 1: lista aulas da semana com vagas disponíveis", async ({
    page,
  }) => {
    await installMinhasAulasMocks(page, {
      sessoes: [buildAula()],
      reservas: [],
    });
    await openMinhasAulas(page);

    await expect(
      page.getByRole("heading", { name: "Minhas Aulas" }),
    ).toBeVisible();
    await expect(page.getByText("Yoga Flow").first()).toBeVisible();
    await expect(page.getByText("07:00 - 08:00").first()).toBeVisible();
    await expect(page.getByText("Sala Zen").first()).toBeVisible();
    await expect(page.getByText(/8 vagas livres/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Reservar$/ }).first(),
    ).toBeVisible();
  });

  test("cenário 2: reservar aula dispara POST e confirma no dialog", async ({
    page,
  }) => {
    let reservarChamado = false;
    let bodyRecebido: unknown = null;

    await installMinhasAulasMocks(page, {
      sessoes: [buildAula()],
      reservas: [],
      onReservar: async (route) => {
        reservarChamado = true;
        bodyRecebido = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "reserva-nova",
            tenantId: TENANT_ID,
            sessaoId: "sessao-yoga-hoje",
            status: "CONFIRMADA",
            dataCriacao: new Date().toISOString(),
          }),
        });
      },
    });
    await openMinhasAulas(page);

    await page
      .getByRole("button", { name: /^Reservar$/ })
      .first()
      .click();
    await page.getByRole("button", { name: /^Confirmar$/ }).click();

    await expect
      .poll(() => reservarChamado, { timeout: 5_000 })
      .toBe(true);
    expect(bodyRecebido).toMatchObject({
      atividadeGradeId: "grade-yoga",
      alunoId: USER_ID,
      origem: "PORTAL_ALUNO",
    });
  });

  test("cenário 3: badge 'Confirmada' aparece quando aluno já tem reserva", async ({
    page,
  }) => {
    await installMinhasAulasMocks(page, {
      sessoes: [buildAula()],
      reservas: [
        {
          id: "reserva-1",
          sessaoId: "sessao-yoga-hoje",
          status: "CONFIRMADA",
        },
      ],
    });
    await openMinhasAulas(page);

    // Aguarda a sessão aparecer antes de checar o estado booked
    await expect(page.getByText("Yoga Flow").first()).toBeVisible();

    // Espera o badge "Confirmada" — reservas podem chegar depois das sessoes
    const badgeConfirmada = page
      .locator('[data-slot="badge"]')
      .filter({ hasText: /^Confirmada$/ })
      .first();
    await expect(badgeConfirmada).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByRole("button", { name: /^Cancelar$/ }).first(),
    ).toBeVisible();
  });

  test("cenário 4: cancelar reserva dispara POST /cancelar", async ({
    page,
  }) => {
    let cancelarChamado = false;
    await installMinhasAulasMocks(page, {
      sessoes: [buildAula()],
      reservas: [
        {
          id: "reserva-1",
          sessaoId: "sessao-yoga-hoje",
          status: "CONFIRMADA",
        },
      ],
      onCancelar: async (route) => {
        cancelarChamado = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "reserva-1", status: "CANCELADA" }),
        });
      },
    });
    await openMinhasAulas(page);

    // Aguarda a reserva ser reconhecida antes de tentar cancelar
    const botaoCancelar = page
      .getByRole("button", { name: /^Cancelar$/ })
      .first();
    await expect(botaoCancelar).toBeVisible({ timeout: 10_000 });
    await botaoCancelar.click();
    await page.getByRole("button", { name: /^Confirmar$/ }).click();

    await expect
      .poll(() => cancelarChamado, { timeout: 5_000 })
      .toBe(true);
  });

  test("cenário 5: aula lotada com waitlist habilitada mostra 'Entrar em Espera'", async ({
    page,
  }) => {
    await installMinhasAulasMocks(page, {
      sessoes: [
        buildAula({
          vagasDisponiveis: 0,
          vagasOcupadas: 20,
          waitlistTotal: 3,
          listaEsperaHabilitada: true,
        }),
      ],
      reservas: [],
    });
    await openMinhasAulas(page);

    await expect(page.getByText(/3 em espera/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Entrar em Espera/ }),
    ).toBeVisible();
  });
});
