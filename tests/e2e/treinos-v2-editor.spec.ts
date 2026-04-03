import { expect, test, type Page } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

type StubExercise = {
  id: string;
  tenantId: string;
  nome: string;
  grupoMuscularId?: string;
  grupoMuscularNome?: string;
  unidade?: string;
  descricao?: string;
  aparelho?: string;
  videoUrl?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

type StubTreinoItem = {
  id: string;
  treinoId: string;
  exercicioId?: string;
  exercicioNomeSnapshot?: string;
  grupoMuscularId?: string;
  grupoMuscularNome?: string;
  ordem: number;
  series: number;
  repeticoes?: number;
  repeticoesMin?: number;
  repeticoesMax?: number;
  carga?: number;
  cargaSugerida?: number;
  intervaloSegundos?: number;
  observacao?: string;
};

type StubTreino = {
  id: string;
  tenantId: string;
  nome: string;
  templateNome: string;
  objetivo: string;
  divisao: string;
  metaSessoesSemana: number;
  frequenciaPlanejada: number;
  quantidadePrevista: number;
  dataInicio: string;
  dataFim: string;
  observacoes: string;
  professorId?: string;
  professorNome?: string;
  status: string;
  tipoTreino: string;
  ativo: boolean;
  treinoBaseId?: string;
  alunoId?: string;
  alunoNome?: string;
  clienteId?: string;
  clienteNome?: string;
  itens: StubTreinoItem[];
  revisoes: Array<Record<string, unknown>>;
  execucoes: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
};

function seedSession(page: Page) {
  return installE2EAuthSession(page, {
    activeTenantId: "tn-1",
    baseTenantId: "tn-1",
    availableTenants: [{ tenantId: "tn-1", defaultTenant: true }],
    userId: "user-1",
    userKind: "COLABORADOR",
    displayName: "Admin Treinos",
    roles: ["ADMIN"],
    availableScopes: ["UNIDADE"],
  });
}

function json(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

async function installTreinosV2Stubs(page: Page) {
  let sequence = 30;
  const now = () => new Date(2026, 2, 14, 10, 0, sequence++).toISOString();

  const alunos = [
    { id: "al-1", tenantId: "tn-1", nome: "Ana Paula", email: "ana@academia.local", cpf: "11111111111", status: "ATIVO" },
    { id: "al-2", tenantId: "tn-1", nome: "Bruno Costa", email: "bruno@academia.local", cpf: "22222222222", status: "ATIVO" },
    { id: "al-3", tenantId: "tn-1", nome: "Carla Dias", email: "carla@academia.local", cpf: "33333333333", status: "ATIVO" },
  ];

  const exercicios: StubExercise[] = [
    {
      id: "ex-1",
      tenantId: "tn-1",
      nome: "Agachamento",
      grupoMuscularId: "gm-1",
      grupoMuscularNome: "Quadríceps",
      unidade: "kg",
      descricao: "Base do catálogo.",
      ativo: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "ex-2",
      tenantId: "tn-1",
      nome: "Supino reto",
      grupoMuscularId: "gm-2",
      grupoMuscularNome: "Peitoral",
      unidade: "kg",
      descricao: "Peitoral com barra.",
      ativo: true,
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  const treinos: StubTreino[] = [
    {
      id: "tpl-1",
      tenantId: "tn-1",
      nome: "Template Base",
      templateNome: "Template Base",
      objetivo: "Hipertrofia",
      divisao: "A",
      metaSessoesSemana: 3,
      frequenciaPlanejada: 3,
      quantidadePrevista: 12,
      dataInicio: "2026-03-10",
      dataFim: "2026-04-06",
      observacoes: "Template original do stub",
      professorId: "prof-1",
      professorNome: "Paula Lima",
      status: "RASCUNHO",
      tipoTreino: "PRE_MONTADO",
      ativo: true,
      itens: [
        {
          id: "item-1",
          treinoId: "tpl-1",
          exercicioId: "ex-1",
          exercicioNomeSnapshot: "Agachamento",
          grupoMuscularId: "gm-1",
          grupoMuscularNome: "Quadríceps",
          ordem: 1,
          series: 4,
          repeticoesMin: 8,
          repeticoesMax: 10,
        },
      ],
      revisoes: [],
      execucoes: [],
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  await installOperationalAppShellMocks(page, {
    currentTenantId: "tn-1",
    tenants: [
      {
        id: "tn-1",
        nome: "Unidade Centro",
        ativo: true,
        academiaId: "acd-1",
        groupId: "acd-1",
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
      activeTenantId: "tn-1",
      tenantBaseId: "tn-1",
      availableScopes: ["UNIDADE"],
      broadAccess: false,
    },
    academia: {
      id: "acd-1",
      nome: "Academia Treinos",
      ativo: true,
    },
    capabilities: {
      canAccessElevatedModules: true,
      canDeleteClient: false,
    },
  });

  await Promise.all([
    page.route("**/backend/api/v1/comercial/alunos**", async (route) => {
      await route.fulfill(
        json({
          items: alunos,
          page: 0,
          size: 200,
          total: alunos.length,
          hasNext: false,
        }),
      );
    }),
    page.route("**/backend/api/v1/exercicios**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill(json(exercicios));
        return;
      }

      const body = route.request().postDataJSON() as Record<string, unknown>;
      if (route.request().method() === "POST") {
        const created = {
          id: `ex-${sequence}`,
          tenantId: "tn-1",
          nome: String(body.nome ?? "Novo exercício"),
          grupoMuscularId: body.grupoMuscularId ? String(body.grupoMuscularId) : undefined,
          grupoMuscularNome:
            exercicios.find((item) => item.grupoMuscularId === body.grupoMuscularId)?.grupoMuscularNome ?? "Funcional",
          unidade: body.unidade ? String(body.unidade) : undefined,
          descricao: body.descricao ? String(body.descricao) : undefined,
          aparelho: body.aparelho ? String(body.aparelho) : undefined,
          videoUrl: body.videoUrl ? String(body.videoUrl) : undefined,
          ativo: true,
          createdAt: now(),
          updatedAt: now(),
        };
        exercicios.unshift(created);
        await route.fulfill(json(created, 201));
        return;
      }

      const id = route.request().url().split("/").pop() ?? "";
      const current = exercicios.find((item) => item.id === id);
      if (!current) {
        await route.fulfill(json({ message: "Not found" }, 404));
        return;
      }

      const updated = {
        ...current,
        ...body,
        updatedAt: now(),
      };
      const index = exercicios.findIndex((item) => item.id === id);
      exercicios.splice(index, 1, updated);
      await route.fulfill(json(updated));
    }),
    page.route("**/backend/api/v1/treinos**", async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;
      const method = route.request().method();

      if (pathname.endsWith("/atribuir") && method === "POST") {
        const templateId = pathname.split("/").slice(-2)[0];
        const template = treinos.find((item) => item.id === templateId);
        const body = route.request().postDataJSON() as Record<string, unknown>;
        const aluno = alunos.find((item) => item.id === String(body.clienteId));

        if (!template || !aluno) {
          await route.fulfill(json({ message: "Template/aluno inválido" }, 404));
          return;
        }

        const assigned: StubTreino = {
          ...template,
          id: `tr-${sequence}`,
          nome: template.templateNome,
          alunoId: aluno.id,
          alunoNome: aluno.nome,
          clienteId: aluno.id,
          clienteNome: aluno.nome,
          tipoTreino: "CUSTOMIZADO",
          treinoBaseId: template.id,
          templateNome: template.templateNome,
          dataInicio: String(body.dataInicio ?? "2026-03-14"),
          dataFim: String(body.dataFim ?? "2026-04-11"),
          observacoes: String(body.observacoes ?? ""),
          status: "ATIVO",
          ativo: true,
          createdAt: now(),
          updatedAt: now(),
          itens: (template.itens ?? []).map((item, index) => ({
            ...item,
            id: `item-${sequence}-${index + 1}`,
            treinoId: `tr-${sequence}`,
          })),
        };
        treinos.push(assigned);
        await route.fulfill(json(assigned, 201));
        return;
      }

      const treinosBasePath = pathname.endsWith("/treinos");
      const maybeId = pathname.split("/").pop() ?? "";
      const isDetailPath = pathname.includes("/api/v1/treinos/") && !pathname.endsWith("/treinos");

      if (treinosBasePath && method === "GET") {
        const tipoTreino = url.searchParams.get("tipoTreino");
        const clienteId = url.searchParams.get("clienteId");
        const search = (url.searchParams.get("search") ?? "").toLowerCase();

        const items = treinos.filter((item) => {
          const sameType = !tipoTreino || item.tipoTreino === tipoTreino;
          const sameAluno = !clienteId || item.alunoId === clienteId || item.clienteId === clienteId;
          const matchesSearch =
            !search ||
            [item.nome, item.templateNome, item.professorNome, item.alunoNome]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(search);
          return sameType && sameAluno && matchesSearch;
        });

        await route.fulfill(
          json({
            items,
            page: Number(url.searchParams.get("page") ?? 0),
            size: Number(url.searchParams.get("size") ?? (items.length || 1)),
            total: items.length,
            hasNext: false,
          }),
        );
        return;
      }

      if (isDetailPath && method === "GET") {
        const found = treinos.find((item) => item.id === maybeId);
        if (!found) {
          await route.fulfill(json({ message: "Not found" }, 404));
          return;
        }
        await route.fulfill(json(found));
        return;
      }

      if (isDetailPath && method === "PUT") {
        const current = treinos.find((item) => item.id === maybeId);
        const body = route.request().postDataJSON() as Record<string, unknown>;
        if (!current) {
          await route.fulfill(json({ message: "Not found" }, 404));
          return;
        }
        const updated: StubTreino = {
          ...current,
          ...body,
          templateNome: body.templateNome ? String(body.templateNome) : current.templateNome,
          nome: body.nome ? String(body.nome) : current.nome,
          objetivo: body.objetivo ? String(body.objetivo) : current.objetivo,
          observacoes: body.observacoes ? String(body.observacoes) : current.observacoes,
          professorNome: body.professorId ? "Paula Lima" : current.professorNome,
          updatedAt: now(),
          itens: Array.isArray(body.itens)
            ? (body.itens as Array<Record<string, unknown>>).map((item, index) => ({
                id: item.id ? String(item.id) : `${maybeId}-item-${index + 1}`,
                treinoId: current.id,
                exercicioId: String(item.exercicioId),
                ordem: Number(item.ordem ?? index + 1),
                series: Number(item.series ?? 1),
                repeticoes: item.repeticoes ? Number(item.repeticoes) : undefined,
                repeticoesMin: item.repeticoesMin ? Number(item.repeticoesMin) : undefined,
                repeticoesMax: item.repeticoesMax ? Number(item.repeticoesMax) : undefined,
                carga: item.carga ? Number(item.carga) : undefined,
                cargaSugerida: item.cargaSugerida ? Number(item.cargaSugerida) : undefined,
                intervaloSegundos: item.intervaloSegundos ? Number(item.intervaloSegundos) : undefined,
                observacao: item.observacao ? String(item.observacao) : undefined,
              }))
            : current.itens,
        };
        const index = treinos.findIndex((item) => item.id === maybeId);
        treinos.splice(index, 1, updated);
        await route.fulfill(json(updated));
      }
    }),
  ]);
}

test.describe("treinos v2 editor", () => {
  test("opera editor unificado, biblioteca e publicação", async ({ page }) => {
    await seedSession(page);
    await installTreinosV2Stubs(page);
    await page.goto("/treinos/tpl-1", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Template Base" })).toBeVisible();
    await page.getByLabel("Repetições 1").first().fill("10");
    await page.getByRole("button", { name: "Novo bloco" }).click();
    await page.getByLabel("Nome do bloco").last().fill("B");
    await page.getByRole("button", { name: "Linha manual" }).click();
    await page.getByLabel("Exercício 1").last().selectOption("ex-2");
    await page.getByLabel("Séries 1").last().fill("5");
    await page.getByRole("button", { name: "Drop-set" }).last().click();

    await page.getByRole("button", { name: "Novo exercício" }).click();
    const drawer = page.getByRole("dialog");
    await drawer.getByLabel("Nome *").fill("Afundo búlgaro");
    await drawer.getByLabel("Código").fill("AFD-9");
    await drawer.getByLabel("Grupo de exercícios").fill("Unilateral");
    await drawer.getByLabel("Unidade de carga").fill("kg");
    await drawer.getByLabel("Descrição").fill("Novo exercício criado no drawer.");
    await drawer.getByRole("button", { name: "Criar exercício" }).click();

    await expect(page.getByText("Afundo búlgaro", { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: "+" }).last().click();

    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(page.getByText("RASCUNHO", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Enviar revisão" }).click();
    await expect(page.getByText("EM_REVISAO", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByText("PUBLICADO", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("v2").first()).toBeVisible();
  });

  test("executa atribuição individual e em massa com resumo operacional", async ({ page }) => {
    await seedSession(page);
    await installTreinosV2Stubs(page);
    await page.goto("/treinos/tpl-1?assign=1", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Atribuir treino padrão" })).toBeVisible();
    await page.locator("#assignment-aluno").selectOption("al-1");
    await page.getByRole("button", { name: "Atribuir cliente" }).click();

    await expect(page.getByText("Histórico de atribuições")).toBeVisible();
    await expect(page.getByText("1 atribuído(s)")).toBeVisible();
    await expect(page.getByText("Ana Paula", { exact: true }).last()).toBeVisible();

    await page.getByRole("button", { name: "Atribuir treino" }).click();
    await page.getByRole("tab", { name: "Lote" }).click();
    await page.getByPlaceholder("Filtrar clientes por nome, CPF ou e-mail").fill("Bruno");
    await page.getByRole("button", { name: "Selecionar filtrados" }).click();
    await page.getByPlaceholder("Filtrar clientes por nome, CPF ou e-mail").fill("Carla");
    await page.getByRole("button", { name: "Selecionar filtrados" }).click();
    await page.getByRole("button", { name: "Executar lote" }).click();

    await expect(page.getByText("2 atribuído(s)")).toBeVisible();
    await expect(page.getByText("Bruno Costa", { exact: true }).last()).toBeVisible();
    await expect(page.getByText("Carla Dias", { exact: true }).last()).toBeVisible();
  });
});
