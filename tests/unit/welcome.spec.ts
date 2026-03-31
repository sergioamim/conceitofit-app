import { expect, test } from "@playwright/test";
import { extractWelcomeFlags, shouldShowWelcome } from "../../src/lib/welcome";

test.describe("welcome helpers", () => {
  test("mostra boas-vindas quando primeiro acesso está pendente", () => {
    expect(shouldShowWelcome({ firstAccessPending: true })).toBe(true);
    expect(shouldShowWelcome({ isFirstLogin: true })).toBe(true);
    expect(shouldShowWelcome({ firstAccessCompleted: false })).toBe(true);
  });

  test("oculta quando já viu ou completou o fluxo", () => {
    expect(shouldShowWelcome({ hasSeenWelcomePage: true })).toBe(false);
    expect(shouldShowWelcome({ firstAccessCompleted: true })).toBe(false);
  });

  test("respeita o fallback local de visualização", () => {
    expect(shouldShowWelcome({ isFirstLogin: true }, { localSeen: true })).toBe(false);
  });

  test("extrai flags a partir do usuário autenticado", () => {
    const flags = extractWelcomeFlags({
      id: "user-1",
      availableTenants: [],
      isFirstLogin: true,
      hasSeenWelcomePage: false,
      firstAccessCompleted: false,
      firstAccessPending: true,
    });
    expect(flags).toEqual({
      hasSeenWelcomePage: false,
      isFirstLogin: true,
      firstAccessCompleted: false,
      firstAccessPending: true,
    });
  });
});
