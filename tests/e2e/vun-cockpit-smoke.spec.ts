import { expect, test, type Page } from "@playwright/test";
import {
  installPublicJourneyApiMocks,
  seedAuthenticatedSession,
} from "./support/backend-only-stubs";

/**
 * E2E smoke do programa VUN — Unificação de Vendas (cockpit).
 *
 * Cobertura mínima dos ACs visuais/UX que os testes unit não pegam:
 * - VUN-1.2/1.3: cockpit shell renderiza com header escuro e grid 3 colunas
 * - VUN-2.1 AC2: atalho ⌘K abre busca universal
 * - VUN-4.2 AC4 (integrado via VUN-focus-event): custom event
 *   `FOCUS_UNIVERSAL_SEARCH_EVENT` abre o palette e foca o input
 *
 * Cenários de combo livre (RN-011), prospect inline (VUN-2.4) e finalizar
 * venda parcelada (VUN-3.2) já são cobertos por `comercial-fluxo.spec.ts` e
 * `comercial-smoke-real.spec.ts` — não replicados aqui para não duplicar.
 */

const VENDAS_NOVA_URL = "/vendas/nova";

async function abrirCockpit(page: Page) {
  await installPublicJourneyApiMocks(page);
  await seedAuthenticatedSession(page, {
    tenantId: "tenant-mananciais-s1",
    tenantName: "MANANCIAIS - S1",
    availableTenants: [
      { tenantId: "tenant-mananciais-s1", defaultTenant: true },
    ],
  });
  await page.goto(VENDAS_NOVA_URL, { waitUntil: "domcontentloaded" });
  // Cockpit shell aparece assim que o page.tsx hidrata.
  await expect(page.getByTestId("cockpit-shell")).toBeVisible({
    timeout: 30_000,
  });
}

test.describe("VUN cockpit — smoke E2E", () => {
  test("layout 3 colunas + header escuro renderiza em /vendas/nova (VUN-1.2 + 1.3)", async ({
    page,
  }) => {
    await abrirCockpit(page);

    // Header do cockpit — h-14 bg-ink
    const header = page.getByTestId("cockpit-shell-header");
    await expect(header).toBeVisible();
    await expect(
      page.getByTestId("cockpit-shell-header-left"),
    ).toContainText(/Nova Venda/i);

    // Corpo com 3 colunas (left, center, right) — todas presentes
    await expect(
      page.getByTestId("cockpit-shell-column-left"),
    ).toBeVisible();
    await expect(
      page.getByTestId("cockpit-shell-column-center"),
    ).toBeVisible();
    await expect(
      page.getByTestId("cockpit-shell-column-right"),
    ).toBeVisible();
  });

  test("atalho ⌘K abre busca universal (VUN-2.1 AC2)", async ({ page }) => {
    await abrirCockpit(page);

    const openShortcut = process.platform === "darwin" ? "Meta+k" : "Control+k";
    await page.keyboard.press(openShortcut);

    await expect(
      page.getByTestId("universal-search-dialog"),
    ).toBeVisible({ timeout: 5_000 });
    await expect(page.getByLabel("Termo de busca")).toBeFocused();
  });

  test("custom event FOCUS_UNIVERSAL_SEARCH_EVENT abre e foca a busca (VUN-4.2 + loop)", async ({
    page,
  }) => {
    await abrirCockpit(page);

    // Simula o que o modal de recibo faz no handler "Nova venda".
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("focus-universal-search"));
    });

    await expect(
      page.getByTestId("universal-search-dialog"),
    ).toBeVisible({ timeout: 5_000 });
    await expect(page.getByLabel("Termo de busca")).toBeFocused();
  });
});
