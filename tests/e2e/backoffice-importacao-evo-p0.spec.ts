import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";
import { createBrowserErrorGuard } from "./support/browser-errors";
import { openBackofficeWaveCPage } from "./support/stubs/backoffice-wave-c";

test.describe("Backoffice importação EVO P0", () => {
  test("carrega o wizard, faz upload do pacote, revisa a prévia e confirma a importação", async ({ page }) => {
    const browserErrors = createBrowserErrorGuard(page);

    await openBackofficeWaveCPage(
      page,
      "/admin/importacao-evo-p0?tenantId=tenant-barra",
      /Gestor de Importação/i,
    );
    await expect(page.getByText("Etapa 1: Analisar pacote ZIP")).toBeVisible();

    await page.locator("#pacoteArquivo").setInputFiles({
      name: "backup-evo.zip",
      mimeType: "application/zip",
      buffer: Buffer.from("conteudo-wave-c"),
    });
    await page.getByRole("button", { name: "Analisar pacote" }).click();

    await expect(page.getByText("Upload ID:")).toBeVisible();
    await expect(page.getByText("Clientes", { exact: true })).toBeVisible();
    await expect(page.getByText("Contratos", { exact: true })).toBeVisible();
    await expect(page.getByText("Funções exercidas", { exact: true })).toBeVisible();
    await expect(page.getByText(/Selecionados:\s+\d+\s+de\s+\d+\s+disponíveis/i)).toBeVisible();

    await page.getByLabel("Nome de identificação deste lote").fill("Carga Wave C");
    await page.getByRole("button", { name: "Criar Job" }).click();

    await expect(page.getByRole("heading", { name: "Diagnóstico do Lote" })).toBeVisible();
    await expect(page.getByText("Carga Wave C")).toBeVisible();
    await expect(page.getByText("Job de importação")).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir rejeições" })).toBeVisible();
    await browserErrors.assertNoUnexpectedErrors("Happy path da importação EVO P0 emitiu erro no browser");
  });
});
