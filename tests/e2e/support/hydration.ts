import type { Page } from "@playwright/test";

/**
 * Aguarda o React estar hidratado no client. Usa `__NEXT_DATA__` como
 * heurística mínima para reduzir flakiness no primeiro click.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const ready =
        typeof window !== "undefined" &&
        "__NEXT_DATA__" in window &&
        document.readyState !== "loading";
      if (!ready) return false;
      return true;
    },
    undefined,
    { timeout: 15_000 },
  );
}
