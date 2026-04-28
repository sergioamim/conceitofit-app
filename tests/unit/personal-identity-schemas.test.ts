import { describe, expect, it, vi } from "vitest";
import { hasValidPersonalName, requiredPastDateString, requiredPersonalName } from "@/lib/forms/personal-identity-schemas";

vi.mock("@/lib/business-date", () => ({
  getBusinessTodayIso: () => "2026-04-27",
}));

describe("personal-identity-schemas", () => {
  it("aceita nome pessoal com letras e separadores válidos", () => {
    expect(hasValidPersonalName("Ana Maria")).toBe(true);
    expect(hasValidPersonalName("D'Avila")).toBe(true);
    expect(hasValidPersonalName("João-Pedro")).toBe(true);
  });

  it("rejeita nome pessoal com dígitos ou símbolos indevidos", () => {
    expect(hasValidPersonalName("Jo3o")).toBe(false);
    expect(hasValidPersonalName("@@@")).toBe(false);
    expect(hasValidPersonalName(" A ")).toBe(false);
  });

  it("requiredPersonalName rejeita nome inválido", () => {
    const schema = requiredPersonalName("Informe o nome.");
    const result = schema.safeParse("1234");
    expect(result.success).toBe(false);
  });

  it("requiredPastDateString rejeita hoje ou futuro", () => {
    const schema = requiredPastDateString("Informe a data de nascimento.");
    expect(schema.safeParse("2026-04-27").success).toBe(false);
    expect(schema.safeParse("2026-04-28").success).toBe(false);
  });

  it("requiredPastDateString aceita data anterior válida", () => {
    const schema = requiredPastDateString("Informe a data de nascimento.");
    expect(schema.safeParse("1990-05-10").success).toBe(true);
  });
});
