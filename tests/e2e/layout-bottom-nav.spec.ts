import { test, expect } from "@playwright/test";

test.describe("Bottom Navigation Mobile", () => {
  // Configura a viewport para testar comportamento mobile
  test.use({ viewport: { width: 375, height: 812 } });

  test("deve exibir a BottomNav em mobile e ocultar em desktop", async ({ page }) => {
    // Acessa uma página não requerendo onboarding profundo
    await page.goto("/dashboard");
    
    // BottomNav localizador
    const bottomNav = page.locator("nav.fixed.bottom-0");
    
    // Verifica visibilidade em mobile
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Dashboard" })).toBeVisible();

    // Muda viewport para Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Devido ao md:hidden, deverá ficar invisível
    await expect(bottomNav).toBeHidden();
  });

  test("deve navegar pelos atalhos críticos da BottomNav", async ({ page }) => {
    // Volta para Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");

    const bottomNav = page.locator("nav.fixed.bottom-0");

    // "Dashboard" deve estar com atributo ativo (aria-current="page" ou estilizado)
    const dashboardLink = bottomNav.getByRole("link", { name: "Dashboard" });
    await expect(dashboardLink).toHaveAttribute("aria-current", "page");

    // Clica em "Clientes"
    const clientesLink = bottomNav.getByRole("link", { name: "Clientes" });
    await expect(clientesLink).toBeVisible();
    await clientesLink.click();

    // Esperar navegação
    await page.waitForURL("**/clientes**");

    // "Clientes" deve estar ativo
    await expect(clientesLink).toHaveAttribute("aria-current", "page");
    // "Dashboard" não deve estar ativo mais
    await expect(dashboardLink).not.toHaveAttribute("aria-current", "page");

    // Clica em "Check-in" (Gerencial/Catraca Acessos)
    const checkinLink = bottomNav.getByRole("link", { name: "Check-in" });
    await expect(checkinLink).toBeVisible();
    await checkinLink.click();
    await page.waitForURL("**/gerencial/catraca-acessos**");
    await expect(checkinLink).toHaveAttribute("aria-current", "page");
  });
});
