import { expect, test, type Page } from "@playwright/test";
import { buildTreinoV2Observacoes, parseTreinoV2Metadata } from "../../src/lib/tenant/treinos/v2-runtime";

type StubTreino = {
  id: string;
  tenantId: string;
  nome: string;
  templateNome: string;
  professorNome: string;
  alunoId: string;
  alunoNome: string;
  treinoBaseId?: string;
  status: string;
  tipoTreino: string;
  ativo: boolean;
  dataInicio: string;
  dataFim: string;
  observacoes: string;
  itens: Array<{ id: string; treinoId: string; exercicioId: string; ordem: number; series: number }>;
  createdAt: string;
  updatedAt: string;
};

function seedSession(page: Page) {
  return page.addInitScript(() => {
    window.localStorage.setItem("academia-auth-token", "token-treinos-atribuidos");
    window.localStorage.setItem("academia-auth-refresh-token", "refresh-treinos-atribuidos");
    window.localStorage.setItem("academia-auth-token-type", "Bearer");
    window.localStorage.setItem("academia-auth-active-tenant-id", "tn-1");
    window.localStorage.setItem("academia-auth-preferred-tenant-id", "tn-1");
    window.localStorage.setItem(
      "academia-auth-available-tenants",
      JSON.stringify([{ tenantId: "tn-1", defaultTenant: true }]),
    );
  });
}

function json(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

async function installTreinosAtribuidosStubs(page: Page) {
  let sequence = 40;
  const now = () => new Date(2026, 2, 14, 11, 0, sequence++).toISOString();
  const snapshotAlpha = {
    id: "snapshot-tpl-alpha-v3",
    templateId: "tpl-alpha",
    templateVersion: 3,
    templateNome: "Template Base",
    publishedAt: "2026-03-14T09:00:00.000Z",
    frequenciaSemanal: 3,
    totalSemanas: 4,
    categoria: "Hipertrofia",
    blocos: [{ id: "bloco-1", nome: "A", ordem: 1, itens: [] }],
    validationIssues: [],
  };
  const snapshotBeta = {
    id: "snapshot-tpl-beta-v2",
    templateId: "tpl-beta",
    templateVersion: 2,
    templateNome: "Template Força",
    publishedAt: "2026-03-13T09:00:00.000Z",
    frequenciaSemanal: 4,
    totalSemanas: 5,
    categoria: "Força",
    blocos: [{ id: "bloco-1", nome: "B", ordem: 1, itens: [] }],
    validationIssues: [],
  };

  const treinos: StubTreino[] = [
    {
      id: "tr-1",
      tenantId: "tn-1",
      nome: "Treino Ana",
      templateNome: "Template Base",
      professorNome: "Paula Lima",
      alunoId: "al-1",
      alunoNome: "Ana Paula",
      treinoBaseId: "tpl-alpha",
      status: "ATIVO",
      tipoTreino: "CUSTOMIZADO",
      ativo: true,
      dataInicio: "2026-03-10",
      dataFim: "2026-04-07",
      observacoes: buildTreinoV2Observacoes({
        observacoes: "Treino corrente da carteira.",
        assigned: {
          status: "ATIVO",
          origem: "TEMPLATE",
          snapshot: snapshotAlpha,
          customizadoLocalmente: false,
          assignmentJobId: "job-1",
          conflictPolicy: "MANTER_ATUAL",
          resolution: "CRIAR",
        },
      }),
      itens: [{ id: "item-1", treinoId: "tr-1", exercicioId: "ex-1", ordem: 1, series: 3 }],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "tr-2",
      tenantId: "tn-1",
      nome: "Treino Bruno",
      templateNome: "Template Base",
      professorNome: "Paula Lima",
      alunoId: "al-2",
      alunoNome: "Bruno Costa",
      treinoBaseId: "tpl-alpha",
      status: "ATIVO",
      tipoTreino: "CUSTOMIZADO",
      ativo: true,
      dataInicio: "2026-03-20",
      dataFim: "2026-04-17",
      observacoes: buildTreinoV2Observacoes({
        observacoes: "Treino agendado em lote.",
        assigned: {
          status: "AGENDADO",
          origem: "MASSA",
          snapshot: snapshotAlpha,
          customizadoLocalmente: false,
          assignmentJobId: "job-2",
          conflictPolicy: "SUBSTITUIR_ATUAL",
          resolution: "CRIAR",
        },
      }),
      itens: [{ id: "item-2", treinoId: "tr-2", exercicioId: "ex-1", ordem: 1, series: 4 }],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "tr-3",
      tenantId: "tn-1",
      nome: "Treino Carla",
      templateNome: "Template Força",
      professorNome: "Caio Costa",
      alunoId: "al-3",
      alunoNome: "Carla Dias",
      treinoBaseId: "tpl-beta",
      status: "ATIVO",
      tipoTreino: "CUSTOMIZADO",
      ativo: true,
      dataInicio: "2026-03-12",
      dataFim: "2026-04-02",
      observacoes: buildTreinoV2Observacoes({
        observacoes: "Treino já customizado na unidade.",
        assigned: {
          status: "ATIVO",
          origem: "RENOVACAO",
          snapshot: snapshotBeta,
          customizadoLocalmente: true,
          assignmentJobId: "job-3",
          conflictPolicy: "AGENDAR_NOVO",
          resolution: "CRIAR",
        },
      }),
      itens: [{ id: "item-3", treinoId: "tr-3", exercicioId: "ex-2", ordem: 1, series: 5 }],
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  await Promise.all([
    page.route("**/backend/api/v1/auth/me", async (route) => {
      await route.fulfill(
        json({
          id: "user-1",
          nome: "Admin Treinos",
          email: "admin@academia.local",
          roles: ["ADMIN"],
          activeTenantId: "tn-1",
          availableTenants: [{ tenantId: "tn-1", defaultTenant: true }],
        }),
      );
    }),
    page.route("**/backend/api/v1/context/unidade-ativa", async (route) => {
      await route.fulfill(
        json({
          currentTenantId: "tn-1",
          tenantAtual: { id: "tn-1", academiaId: "acd-1", nome: "Unidade Centro", ativo: true },
          unidadesDisponiveis: [{ id: "tn-1", academiaId: "acd-1", nome: "Unidade Centro", ativo: true }],
        }),
      );
    }),
    page.route("**/backend/api/v1/treinos**", async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;
      const method = route.request().method();

      if (pathname.endsWith("/encerrar-ciclo") && method === "POST") {
        const id = pathname.split("/").slice(-2)[0] ?? "";
        const current = treinos.find((item) => item.id === id);
        if (!current) {
          await route.fulfill(json({ message: "Not found" }, 404));
          return;
        }

        const parsed = parseTreinoV2Metadata(current.observacoes);
        const updated: StubTreino = {
          ...current,
          ativo: false,
          status: "CANCELADO",
          observacoes: buildTreinoV2Observacoes({
            observacoes: parsed.observacoes,
            assigned: {
              status: "ENCERRADO",
              origem: parsed.metadata?.assigned?.origem ?? "TEMPLATE",
              snapshot: parsed.metadata?.assigned?.snapshot,
              customizadoLocalmente: parsed.metadata?.assigned?.customizadoLocalmente ?? false,
              assignmentJobId: parsed.metadata?.assigned?.assignmentJobId,
              conflictPolicy: parsed.metadata?.assigned?.conflictPolicy,
              resolution: parsed.metadata?.assigned?.resolution,
            },
          }),
          updatedAt: now(),
        };
        const index = treinos.findIndex((item) => item.id === id);
        treinos.splice(index, 1, updated);
        await route.fulfill(json(updated));
        return;
      }

      if (pathname.endsWith("/treinos") && method === "POST") {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        const created: StubTreino = {
          id: `tr-${sequence}`,
          tenantId: "tn-1",
          nome: String(body.nome ?? "Treino duplicado"),
          templateNome: body.templateNome ? String(body.templateNome) : String(body.nome ?? "Treino duplicado"),
          professorNome: body.professorId ? "Paula Lima" : String(body.professorNome ?? "Paula Lima"),
          alunoId: String(body.clienteId ?? body.alunoId ?? "al-1"),
          alunoNome: String(body.alunoNome ?? "Aluno da cópia"),
          treinoBaseId: body.treinoBaseId ? String(body.treinoBaseId) : undefined,
          status: String(body.status ?? "ATIVO"),
          tipoTreino: "CUSTOMIZADO",
          ativo: body.ativo !== false,
          dataInicio: String(body.dataInicio ?? "2026-03-14"),
          dataFim: String(body.dataFim ?? "2026-04-11"),
          observacoes: String(body.observacoes ?? ""),
          itens: Array.isArray(body.itens)
            ? body.itens.map((item, index) => ({
                id: `item-${sequence}-${index + 1}`,
                treinoId: `tr-${sequence}`,
                exercicioId: String((item as Record<string, unknown>).exercicioId ?? "ex-1"),
                ordem: Number((item as Record<string, unknown>).ordem ?? index + 1),
                series: Number((item as Record<string, unknown>).series ?? 3),
              }))
            : [],
          createdAt: now(),
          updatedAt: now(),
        };
        treinos.unshift(created);
        await route.fulfill(json(created, 201));
        return;
      }

      if (pathname.endsWith("/treinos") && method === "GET") {
        if (url.searchParams.get("tipoTreino") !== "CUSTOMIZADO") {
          await route.continue();
          return;
        }

        const search = (url.searchParams.get("search") ?? "").toLowerCase();
        const items = treinos.filter((item) =>
          !search
            ? true
            : [item.nome, item.templateNome, item.professorNome, item.alunoNome].join(" ").toLowerCase().includes(search),
        );

        await route.fulfill(
          json({
            items,
            page: Number(url.searchParams.get("page") ?? 0),
            size: Number(url.searchParams.get("size") ?? 200),
            total: items.length,
            hasNext: false,
          }),
        );
        return;
      }

      await route.continue();
    }),
  ]);
}

test.describe("treinos atribuídos", () => {
  test("lista rastreabilidade e permite encerrar e duplicar treinos", async ({ page }) => {
    await seedSession(page);
    await installTreinosAtribuidosStubs(page);
    await page.goto("/treinos/atribuidos");

    await expect(page.getByRole("heading", { name: "Treinos atribuídos" })).toBeVisible();
    await expect(page.getByText("Template Base").first()).toBeVisible();
    await expect(page.getByText("TEMPLATE · v3 · snapshot-tpl-alpha-v3")).toBeVisible();
    await expect(page.getByRole("link", { name: "Reatribuir" }).first()).toBeVisible();

    await page.getByLabel("Buscar treino atribuído").fill("Bruno");
    await expect(page.getByRole("row").filter({ hasText: "Bruno Costa" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Ana Paula" })).toBeHidden();

    await page.getByLabel("Buscar treino atribuído").fill("");
    await page.getByRole("button", { name: "Encerrar" }).first().click();
    await expect(page.getByRole("row").filter({ hasText: "Ana Paula" })).toContainText("ENCERRADO");

    await page.getByRole("row").filter({ hasText: "Bruno Costa" }).getByRole("button", { name: "Duplicar" }).click();
    await expect(page.getByText("Template Base cópia")).toBeVisible();
  });
});
