import { expect, test, type Page } from "@playwright/test";

async function loginWithRedirect(page: Page, targetPath: string) {
  await page.goto(targetPath);
  const loginRegex = new RegExp(`/login\\?next=${encodeURIComponent(targetPath).replace(/\//g, "\\/")}`);
  const targetRegex = new RegExp(`${targetPath.replace(/\//g, "\\/")}$`);
  const navigatedDirectly = await page
    .waitForURL(targetRegex, { timeout: 1500 })
    .then(() => true)
    .catch(() => false);

  if (!navigatedDirectly) {
    await expect(page).toHaveURL(loginRegex);
    await page.locator("#login-username").fill("admin@academia.local");
    const passwordInput = page.locator("#login-password");
    await passwordInput.fill("12345678");
    await passwordInput.press("Enter");

    const redirectedAfterLogin = await page
      .waitForURL(targetRegex, { timeout: 1500 })
      .then(() => true)
      .catch(() => false);

    if (!redirectedAfterLogin) {
      const saveTenantButton = page.getByRole("button", { name: /Salvar e continuar/i });
      await expect(saveTenantButton).toBeVisible();
      await page.getByRole("combobox").click();
      await page.getByRole("option").first().click();
      await saveTenantButton.click();
    }
  }

  await expect(page).toHaveURL(targetRegex);
}

async function waitForClientHydration(page: Page) {
  await page.waitForTimeout(1000);
}

test.describe("treinos web v2", () => {
  test("abre um template existente e renderiza o editor unificado", async ({ page }) => {
    test.setTimeout(120_000);

    await loginWithRedirect(page, "/treinos");
    await expect(page.getByRole("heading", { name: "Treino Padrão" })).toBeVisible();
    await waitForClientHydration(page);

    const templateName = (await page.getByRole("row").nth(1).locator("a").first().innerText()).trim();
    await page.getByRole("link", { name: new RegExp(`Abrir montagem de ${templateName}`) }).first().click();

    await expect(page).toHaveURL(/\/treinos\/.+/);
    await expect(page.getByRole("heading", { name: templateName })).toBeVisible();
    await expect(page.getByText("Shell do editor")).toBeVisible();
    await expect(page.getByText("Blocos e séries")).toBeVisible();
    await expect(page.getByText("Biblioteca lateral", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar rascunho" })).toBeVisible();
  });
});
