import { Page } from "@playwright/test";

/**
 * Navegação resiliente que retenta em caso de net::ERR_ABORTED.
 * Útil quando o dev server Next.js ainda está compilando a rota.
 */
export async function safeGoto(
  page: Page,
  url: string,
  options?: { timeout?: number; maxRetries?: number }
) {
  const { timeout = 30_000, maxRetries = 2 } = options ?? {};
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout });
      return;
    } catch (err) {
      lastError = err as Error;
      const isAborted =
        lastError.message.includes("ERR_ABORTED") ||
        lastError.message.includes("ERR_CONNECTION_REFUSED");
      if (!isAborted || attempt === maxRetries) throw lastError;
      await page.waitForTimeout(2_000);
    }
  }
}
