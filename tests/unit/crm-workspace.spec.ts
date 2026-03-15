import { expect, test } from "@playwright/test";
import {
  buildDefaultCrmPipelineStages,
  getEffectiveCrmTaskStatus,
  getCrmStageName,
  isCrmTaskOverdue,
} from "../../src/lib/crm/workspace";
import {
  buildCrmWorkspaceSnapshotRuntime,
  enrichCrmTasksRuntime,
  normalizeProspectRuntime,
} from "../../src/lib/crm/runtime";

test.describe("crm workspace helpers", () => {
  test("buildDefaultCrmPipelineStages cria as etapas base em ordem", async () => {
    const stages = buildDefaultCrmPipelineStages("tenant-demo-001");
    expect(stages.map((stage) => stage.status)).toEqual([
      "NOVO",
      "EM_CONTATO",
      "AGENDOU_VISITA",
      "VISITOU",
      "CONVERTIDO",
      "PERDIDO",
    ]);
    expect(stages[0]?.id).toContain("novo");
    expect(stages[0]?.tenantId).toBe("tenant-demo-001");
  });

  test("getCrmStageName resolve labels amigáveis", async () => {
    expect(getCrmStageName("NOVO")).toBe("Novo");
    expect(getCrmStageName("VISITOU")).toBe("Visitou");
  });

  test("tarefas em aberto vencidas são marcadas como atrasadas", async () => {
    const reference = new Date("2026-03-11T10:00:00");
    const overdueTask = {
      status: "PENDENTE" as const,
      vencimentoEm: "2000-03-10T18:00:00",
    };
    const doneTask = {
      status: "CONCLUIDA" as const,
      vencimentoEm: "2000-03-10T18:00:00",
    };

    expect(isCrmTaskOverdue(overdueTask, reference)).toBeTruthy();
    expect(isCrmTaskOverdue(doneTask, reference)).toBeFalsy();
    expect(getEffectiveCrmTaskStatus(overdueTask)).toBe("ATRASADA");
  });

  test("normalizeProspectRuntime cria histórico mínimo e acumula mudança de etapa", async () => {
    const created = normalizeProspectRuntime({
      id: "prospect-1",
      tenantId: "tenant-1",
      nome: "Clara Matos",
      telefone: "(11) 99999-0000",
      origem: "INSTAGRAM",
      status: "NOVO",
      dataCriacao: "2026-03-11T09:00:00",
    });
    const moved = normalizeProspectRuntime(
      {
        ...created,
        status: "EM_CONTATO",
        dataUltimoContato: "2026-03-11T10:00:00",
      },
      created
    );

    expect(created.statusLog).toEqual([{ status: "NOVO", data: "2026-03-11T09:00:00" }]);
    expect(moved.statusLog).toEqual([
      { status: "NOVO", data: "2026-03-11T09:00:00" },
      { status: "EM_CONTATO", data: "2026-03-11T10:00:00" },
    ]);
  });

  test("runtime de CRM enriquece tarefas e consolida snapshot sem store local", async () => {
    const prospect = normalizeProspectRuntime({
      id: "prospect-1",
      tenantId: "tenant-1",
      responsavelId: "func-1",
      nome: "Clara Matos",
      telefone: "(11) 99999-0000",
      origem: "INSTAGRAM",
      status: "EM_CONTATO",
      dataCriacao: "2026-03-11T09:00:00",
      dataUltimoContato: "2026-03-11T10:00:00",
    });
    const tasks = enrichCrmTasksRuntime({
      tasks: [
        {
          id: "task-1",
          tenantId: "tenant-1",
          prospectId: "prospect-1",
          titulo: "Retornar WhatsApp",
          tipo: "FOLLOW_UP",
          prioridade: "ALTA",
          status: "PENDENTE",
          responsavelId: "func-1",
          origem: "MANUAL",
          vencimentoEm: "2000-03-12T09:00:00",
          dataCriacao: "2026-03-11T09:30:00",
        },
      ],
      prospects: [prospect],
      funcionarios: [
        {
          id: "func-1",
          nome: "Diego Paes",
          cargo: "Consultor",
          podeMinistrarAulas: false,
          ativo: true,
        },
      ],
    });
    const snapshot = buildCrmWorkspaceSnapshotRuntime({
      tenantId: "tenant-1",
      prospects: [prospect],
      tasks,
      automations: [],
    });

    expect(tasks[0]?.responsavelNome).toBe("Diego Paes");
    expect(tasks[0]?.prospectNome).toBe("Clara Matos");
    expect(tasks[0]?.status).toBe("ATRASADA");
    expect(snapshot.totalProspectsAbertos).toBe(1);
    expect(snapshot.totalTarefasAbertas).toBe(1);
    expect(snapshot.totalTarefasAtrasadas).toBe(1);
    expect(snapshot.estagios.find((stage) => stage.stageStatus === "EM_CONTATO")?.totalProspects).toBe(1);
    expect(snapshot.atividadesRecentes.length).toBeGreaterThan(0);
  });
});
