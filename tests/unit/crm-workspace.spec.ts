import { expect, test } from "@playwright/test";
import {
  buildDefaultCrmPipelineStages,
  getEffectiveCrmTaskStatus,
  getCrmStageName,
  isCrmTaskOverdue,
} from "../../src/lib/crm/workspace";

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
});
