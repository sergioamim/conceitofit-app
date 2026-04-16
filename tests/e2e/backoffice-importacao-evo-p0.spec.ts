import { Buffer } from "node:buffer";
import { expect, test } from "./support/test";
import { openBackofficeWaveCPage } from "./support/stubs/backoffice-wave-c";

test.describe("Backoffice importação EVO P0", () => {
  test("reutiliza o lote anterior e abre o diagnostico do novo job", async ({ page, browserErrors }) => {
    browserErrors.allowConsoleErrors(/401 \(Unauthorized\)/);
    const diagnosticoDialog = page.getByRole("dialog");

    await openBackofficeWaveCPage(
      page,
      "/admin/importacao-evo-p0?tenantId=tenant-barra",
      /Gestor de Importação/i,
    );

    await expect(page.getByText("Reutilizar lote anterior")).toBeVisible();
    await expect(page.getByText("Pacote · BARRA · 13/03, 10:00")).toBeVisible();

    const fromSourcePromise = page.waitForRequest((request) => {
      return (
        request.method() === "POST" &&
        new URL(request.url()).pathname.endsWith("/api/v1/admin/integracoes/importacao-terceiros/jobs/from-source")
      );
    });

    await page.getByRole("button", { name: "Reutilizar esses arquivos" }).click();

    const fromSourceRequest = await fromSourcePromise;
    expect(fromSourceRequest.postDataJSON()).toMatchObject({
      sourceJobId: "job-pacote-barra-001",
    });

    await expect(page.getByRole("heading", { name: "Diagnóstico do Lote" })).toBeVisible();
    await expect(diagnosticoDialog.getByText("Job de importação")).toBeVisible();
    await expect(
      diagnosticoDialog.locator(".text-sm.font-semibold.text-foreground").filter({
        hasText: "Pacote · BARRA · 13/03, 10:00 (reprocess)",
      }),
    ).toBeVisible();
    await expect(
      diagnosticoDialog.getByText("Selecione uma importação no painel lateral para visualizar os diagnósticos detalhados."),
    ).not.toBeVisible();
  });

  test("carrega o wizard, faz upload do pacote, revisa a prévia e cria o job sem reenviar evoUnidadeId", async ({ page, browserErrors }) => {
    browserErrors.allowConsoleErrors(/401 \(Unauthorized\)/);
    const diagnosticoDialog = page.getByRole("dialog");

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
    const analyzeRequestPromise = page.waitForRequest((request) => {
      return (
        request.method() === "POST" &&
        new URL(request.url()).pathname.endsWith("/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote")
      );
    });
    await page.getByRole("button", { name: "Analisar pacote" }).click();
    const analyzeRequest = await analyzeRequestPromise;
    const analyzeBody = analyzeRequest.postDataBuffer()?.toString("utf8") ?? "";
    expect(analyzeBody).not.toContain('name="evoUnidadeId"');

    await expect(page.getByText("Upload ID:")).toBeVisible();
    await expect(page.getByText("Clientes", { exact: true })).toBeVisible();
    await expect(page.getByText("Contratos", { exact: true })).toBeVisible();
    await expect(page.getByText("Funções exercidas", { exact: true })).toBeVisible();
    await expect(page.getByText(/Selecionados:\s+\d+\s+de\s+\d+\s+disponíveis/i)).toBeVisible();

    await page.getByLabel("Nome de identificação deste lote").fill("Carga Wave C");
    const jobRequestPromise = page.waitForRequest((request) => {
      return (
        request.method() === "POST" &&
        /\/admin\/integracoes\/importacao-terceiros\/evo\/p0\/pacote\/[^/]+\/job$/.test(
          new URL(request.url()).pathname,
        )
      );
    });
    await page.getByRole("button", { name: /^Criar job$/ }).click();
    const jobRequest = await jobRequestPromise;
    expect(jobRequest.postDataJSON()).not.toHaveProperty("evoUnidadeId");

    await expect(page.getByRole("heading", { name: "Diagnóstico do Lote" })).toBeVisible();
    await expect(diagnosticoDialog.getByText("Job de importação")).toBeVisible();
    await expect(
      diagnosticoDialog.locator(".text-sm.font-semibold.text-foreground").filter({
        hasText: "Carga Wave C",
      }),
    ).toBeVisible();
    await expect(diagnosticoDialog.getByRole("button", { name: "Abrir rejeições" })).toBeVisible();
  });

  test("limpa EVO Unidade manual e a analise anterior ao trocar o pacote ZIP", async ({ page, browserErrors }) => {
    browserErrors.allowConsoleErrors(/401 \(Unauthorized\)/);

    await openBackofficeWaveCPage(
      page,
      "/admin/importacao-evo-p0?tenantId=tenant-barra",
      /Gestor de Importação/i,
    );

    await page.locator("#pacoteArquivo").setInputFiles({
      name: "backup-s3.zip",
      mimeType: "application/zip",
      buffer: Buffer.from("conteudo-wave-c-s3"),
    });
    await page.getByRole("button", { name: "Analisar pacote" }).click();

    await expect(page.getByText("Upload ID:")).toBeVisible();
    await page.getByLabel("EVO Unidade").fill("3");
    await expect(page.getByLabel("EVO Unidade")).toHaveValue("3");

    await page.locator("#pacoteArquivo").setInputFiles({
      name: "backup-s6.zip",
      mimeType: "application/zip",
      buffer: Buffer.from("conteudo-wave-c-s6"),
    });

    await expect(page.getByText("Upload ID:")).not.toBeVisible();

    const analyzeRequestPromise = page.waitForRequest((request) => {
      return (
        request.method() === "POST" &&
        new URL(request.url()).pathname.endsWith("/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote")
      );
    });

    await page.getByRole("button", { name: "Analisar pacote" }).click();

    const analyzeRequest = await analyzeRequestPromise;
    const body = analyzeRequest.postDataBuffer()?.toString("utf8") ?? "";

    expect(body).not.toContain('name="evoUnidadeId"');
  });
});
