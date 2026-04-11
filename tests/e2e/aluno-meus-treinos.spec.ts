import { expect, test, type Page, type Route } from "@playwright/test";
import { seedAlunoSession } from "./support/aluno-auth";
import { installAlunoCommonMocks } from "./support/aluno-api-mocks";

const TENANT_ID = "tenant-aluno-e2e";
const USER_ID = "aluno-e2e-1";

function buildTreino(overrides: Record<string, unknown> = {}) {
  // 3 execuções concluídas / quantidadePrevista = 4 → decorateTreino calcula 75%
  const execucoes = [
    { id: "exec-1", treinoId: "treino-a", data: "2026-03-01", status: "CONCLUIDA" },
    { id: "exec-2", treinoId: "treino-a", data: "2026-03-05", status: "CONCLUIDA" },
    { id: "exec-3", treinoId: "treino-a", data: "2026-03-08", status: "CONCLUIDA" },
  ];
  return {
    id: "treino-a",
    tenantId: TENANT_ID,
    clienteId: USER_ID,
    alunoId: USER_ID,
    nome: "Treino A — Peito e Tríceps",
    objetivo: "Hipertrofia",
    observacoes: "Foque na execução, controle a descida.",
    divisao: "A",
    status: "ATIVO",
    tipoTreino: "CUSTOMIZADO",
    ativo: true,
    dataInicio: "2026-01-01",
    dataFim: "2026-06-30",
    quantidadePrevista: 4,
    frequenciaPlanejada: 4,
    execucoes,
    statusValidade: "ATIVO",
    statusCiclo: "EM_DIA",
    professorNome: "Prof. Carlos",
    itens: [
      {
        id: "item-1",
        treinoId: "treino-a",
        exercicioId: "ex-1",
        exercicioNomeSnapshot: "Supino Reto",
        grupoMuscularId: "gm-1",
        grupoMuscularNome: "Peito",
        ordem: 1,
        series: 4,
        repeticoes: 12,
        carga: 40,
        intervaloSegundos: 60,
        observacao: "Pegada média",
      },
      {
        id: "item-2",
        treinoId: "treino-a",
        exercicioId: "ex-2",
        exercicioNomeSnapshot: "Tríceps Pulley",
        grupoMuscularId: "gm-2",
        grupoMuscularNome: "Tríceps",
        ordem: 2,
        series: 3,
        repeticoes: 15,
        carga: 25,
        intervaloSegundos: 45,
      },
    ],
    ...overrides,
  };
}

async function installMeusTreinosMocks(
  page: Page,
  treinos: ReturnType<typeof buildTreino>[],
  opts: { onExecucao?: (route: Route) => Promise<void> } = {},
) {
  // Listagem: GET /api/v1/treinos?tenantId=...&clienteId=...&tipoTreino=CUSTOMIZADO&status=ATIVO
  await page.route(/\/api\/v1\/treinos(\?|$)/, async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: treinos,
        page: 0,
        size: treinos.length || 1,
        total: treinos.length,
        hasNext: false,
      }),
    });
  });

  // Detalhe: GET /api/v1/treinos/{id}
  await page.route(/\/api\/v1\/treinos\/[^/?]+(\?|$)/, async (route) => {
    const request = route.request();
    if (request.method() !== "GET") return route.continue();
    const url = new URL(request.url());
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];
    const treino = treinos.find((t) => t.id === id) ?? treinos[0];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(treino),
    });
  });

  // Execução: POST /api/v1/treinos/{id}/execucoes
  await page.route(/\/api\/v1\/treinos\/[^/]+\/execucoes/, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    if (opts.onExecucao) {
      await opts.onExecucao(route);
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...treinos[0],
        execucoesConcluidas: (treinos[0].execucoesConcluidas ?? 0) + 1,
      }),
    });
  });
}

async function openMeusTreinos(page: Page) {
  await installAlunoCommonMocks(page, { tenantId: TENANT_ID, userId: USER_ID });
  await seedAlunoSession(page, { tenantId: TENANT_ID, userId: USER_ID });
  await page.goto("/meus-treinos", { waitUntil: "domcontentloaded" });
}

test.describe("Portal do Aluno — Meus Treinos", () => {
  test("cenário 1: lista treinos ativos com aderência e dados do professor", async ({
    page,
  }) => {
    await installMeusTreinosMocks(page, [buildTreino()]);
    await openMeusTreinos(page);

    await expect(
      page.getByRole("heading", { name: "Meus Treinos" }),
    ).toBeVisible();
    await expect(page.getByText("75%", { exact: false }).first()).toBeVisible();
    await expect(
      page.getByText(/Treino A — Peito e Tríceps/),
    ).toBeVisible();
    await expect(page.getByText("Prof. Carlos", { exact: false })).toBeVisible();
    await expect(page.getByText("Supino Reto")).toBeVisible();
    await expect(page.getByText("Tríceps Pulley")).toBeVisible();
  });

  test("cenário 2: exibe badges de séries, repetições e carga", async ({
    page,
  }) => {
    await installMeusTreinosMocks(page, [buildTreino()]);
    await openMeusTreinos(page);

    await expect(page.getByText("4 séries").first()).toBeVisible();
    await expect(page.getByText("12 reps").first()).toBeVisible();
    await expect(page.getByText("40kg").first()).toBeVisible();
  });

  test("cenário 3: marcar treino como concluído dispara a mutation", async ({
    page,
  }) => {
    let execucaoChamada = false;
    let bodyRecebido: unknown = null;

    await installMeusTreinosMocks(page, [buildTreino()], {
      onExecucao: async (route) => {
        execucaoChamada = true;
        bodyRecebido = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...buildTreino(), execucoesConcluidas: 19 }),
        });
      },
    });
    await openMeusTreinos(page);

    // O botão só aparece quando o treino carregou
    const botaoConcluir = page.getByRole("button", { name: /Concluir Treino/i });
    await expect(botaoConcluir).toBeVisible();
    await botaoConcluir.click();

    // ConfirmDialog customizado — confirma e espera mutation
    await page.getByRole("button", { name: /^Confirmar$/ }).click();

    await expect.poll(() => execucaoChamada, { timeout: 5_000 }).toBe(true);
    expect(bodyRecebido).toMatchObject({ status: "CONCLUIDA" });
  });

  test("cenário 4: alterna entre treinos quando há múltiplas divisões", async ({
    page,
  }) => {
    const treinoA = buildTreino({ id: "treino-a", divisao: "A" });
    const treinoB = buildTreino({
      id: "treino-b",
      divisao: "B",
      nome: "Treino B — Costas e Bíceps",
      itens: [
        {
          id: "item-3",
          treinoId: "treino-b",
          exercicioId: "ex-3",
          exercicioNomeSnapshot: "Remada Curvada",
          grupoMuscularId: "gm-3",
          grupoMuscularNome: "Costas",
          ordem: 1,
          series: 4,
          repeticoes: 10,
          carga: 30,
          intervaloSegundos: 90,
        },
      ],
    });
    await installMeusTreinosMocks(page, [treinoA, treinoB]);
    await openMeusTreinos(page);

    await expect(page.getByText("Treino A — Peito e Tríceps")).toBeVisible();

    // Clica no seletor do treino B
    await page.getByRole("button", { name: /Treino B/ }).click();
    await expect(page.getByText("Treino B — Costas e Bíceps")).toBeVisible();
    await expect(page.getByText("Remada Curvada")).toBeVisible();
  });

  test("cenário 5: empty state quando aluno sem treinos atribuídos", async ({
    page,
  }) => {
    await installMeusTreinosMocks(page, []);
    await openMeusTreinos(page);

    await expect(
      page.getByRole("heading", { name: "Nenhum treino ativo" }),
    ).toBeVisible();
    await expect(
      page.getByText(/Fale com seu professor para montar sua ficha/),
    ).toBeVisible();
  });
});
