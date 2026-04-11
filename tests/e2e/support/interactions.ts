import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Clica em um botão e aguarda um dialog abrir. Encapsula o retry da
 * primeira interação pós-navegação para não espalhar `expect.poll` ad-hoc.
 */
export async function clickToOpenDialog(
  page: Page,
  buttonName: string | RegExp,
  options: { scope?: Locator; timeout?: number } = {},
): Promise<Locator> {
  const scope: Page | Locator = options.scope ?? page;
  const button = scope.getByRole("button", { name: buttonName });
  const dialog = page.getByRole("dialog");

  await expect
    .poll(
      async () => {
        await button.click();
        return dialog.isVisible();
      },
      { timeout: options.timeout ?? 10_000, intervals: [500, 1_000] },
    )
    .toBe(true);

  return dialog;
}

/**
 * Navega para uma URL e aguarda o heading esperado visível.
 */
export async function navigateAndWaitForHeading(
  page: Page,
  url: string,
  headingName: string | RegExp,
  options: { timeout?: number } = {},
): Promise<void> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error as Error;
      if (!/ERR_ABORTED|ERR_CONNECTION_REFUSED|frame was detached/i.test(lastError.message) || attempt === 2) {
        throw lastError;
      }
      await page.waitForTimeout(250);
    }
  }

  if (lastError) {
    throw lastError;
  }

  await expect(
    page.getByRole("heading", { name: headingName }).first(),
  ).toBeVisible({ timeout: options.timeout ?? 10_000 });
}

/**
 * Clica em uma tab e aguarda o estado selecionado refletir no DOM.
 */
export async function clickTabAndWaitSelected(tab: Locator): Promise<void> {
  await expect(tab).toBeEnabled();
  await expect
    .poll(
      async () => {
        await tab.click();
        return tab.getAttribute("aria-selected");
      },
      { timeout: 10_000, intervals: [500, 1_000] },
    )
    .toBe("true");
}
