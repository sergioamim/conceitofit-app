import { describe, expect, it } from "vitest";
import {
  crmTarefaFormSchema,
  EMPTY_CRM_TAREFA_FORM_VALUES,
} from "@/app/(portal)/crm/tarefas/tarefas-form-schema";

describe("crm tarefas form schema", () => {
  it("rejeita tarefa sem titulo e sem vencimento", () => {
    const result = crmTarefaFormSchema.safeParse({
      ...EMPTY_CRM_TAREFA_FORM_VALUES,
      titulo: "   ",
      vencimentoData: "",
      vencimentoHora: "",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("schema deveria falhar");
    }

    const flattened = result.error.flatten((issue) => issue.message);
    expect(flattened.fieldErrors.titulo).toContain("Título obrigatório");
    expect(flattened.fieldErrors.vencimentoData).toContain("Data de vencimento obrigatória");
    expect(flattened.fieldErrors.vencimentoHora).toContain("Hora inválida");
  });

  it("aceita tarefa válida com responsável opcional", () => {
    const result = crmTarefaFormSchema.safeParse({
      ...EMPTY_CRM_TAREFA_FORM_VALUES,
      titulo: "Retornar lead da campanha",
      prioridade: "ALTA",
      status: "EM_ANDAMENTO",
      vencimentoData: "2026-04-28",
      vencimentoHora: "14:30",
    });

    expect(result.success).toBe(true);
  });
});
