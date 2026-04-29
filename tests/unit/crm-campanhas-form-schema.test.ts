import { describe, expect, it } from "vitest";
import {
  campanhaFormSchema,
  createCampanhaFormDefaults,
} from "@/app/(portal)/crm/campanhas/campanha-form-schema";

describe("crm campanhas form schema", () => {
  it("rejeita nome vazio, sem canais e data fim anterior", () => {
    const parsed = campanhaFormSchema.safeParse({
      ...createCampanhaFormDefaults("2026-04-29"),
      nome: "   ",
      canais: [],
      dataFim: "2026-04-01",
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues.some((issue) => issue.path.join(".") === "nome")).toBe(true);
    expect(parsed.error.issues.some((issue) => issue.path.join(".") === "canais")).toBe(true);
    expect(parsed.error.issues.some((issue) => issue.path.join(".") === "dataFim")).toBe(true);
  });

  it("aceita payload válido", () => {
    const parsed = campanhaFormSchema.safeParse({
      ...createCampanhaFormDefaults("2026-04-29"),
      nome: "Campanha de retomada",
      descricao: "Leads em aberto",
      canais: ["WHATSAPP", "EMAIL"],
      dataFim: "2026-05-05",
      status: "ATIVA",
    });

    expect(parsed.success).toBe(true);
  });
});
