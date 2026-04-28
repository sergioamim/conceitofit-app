import { describe, expect, it } from "vitest";
import {
  cadenciaFormSchema,
  EMPTY_CADENCIA_FORM_VALUES,
  EMPTY_PLAYBOOK_FORM_VALUES,
  playbookFormSchema,
} from "@/app/(portal)/crm/playbooks/playbooks-form-schema";

describe("crm playbooks form schemas", () => {
  it("rejeita playbook sem nome e sem etapas", () => {
    const result = playbookFormSchema.safeParse({
      ...EMPTY_PLAYBOOK_FORM_VALUES,
      nome: "   ",
      etapas: [],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("schema deveria falhar");
    }

    const flattened = result.error.flatten((issue) => issue.message);
    expect(flattened.fieldErrors.nome).toContain("Nome obrigatório");
    expect(flattened.fieldErrors.etapas).toContain("Playbook deve ter pelo menos 1 etapa");
  });

  it("aceita cadencia valida com passo preenchido", () => {
    const result = cadenciaFormSchema.safeParse({
      ...EMPTY_CADENCIA_FORM_VALUES,
      nome: "Reativação D+2",
      objetivo: "Retomar contato com prospect sem resposta",
      passos: [
        {
          titulo: "Enviar WhatsApp",
          acao: "WHATSAPP",
          delayDias: 2,
          template: "reativacao-2d",
          automatica: true,
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
