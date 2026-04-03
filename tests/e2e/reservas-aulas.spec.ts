import { expect, test } from "@playwright/test";
import {
  installReservasApiMocks,
  seedAuthenticatedSession,
} from "./support/backend-only-stubs";

test.describe("Reservas e operação de aulas", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedSession(page, {
      tenantId: "tenant-reservas",
    });
    await installReservasApiMocks(page);
  });

  test("cria waitlist, cancela reserva, promove fila e registra check-in", async ({ page }) => {
    await page.goto("/reservas", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Reservas, vagas e aulas" })).toBeVisible();

    const sessaoLotada = page
      .getByRole("button")
      .filter({ hasText: "Spinning" })
      .filter({ hasText: "2 em espera" })
      .first();

    await expect(sessaoLotada).toBeVisible();
    await sessaoLotada.click();

    await page.getByLabel("Reservar para aluno").selectOption("al-demo-025");
    await page.getByRole("button", { name: "Reservar vaga" }).click();
    await expect(page.getByText("Aluno incluído na lista de espera.")).toBeVisible();
    await expect(page.locator("p.font-semibold", { hasText: "Camila Almeida 25" })).toBeVisible();
    await expect(page.getByText("Posição 3")).toBeVisible();

    const biancaRow = page
      .locator("p.font-semibold", { hasText: "Bianca Rocha" })
      .locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");
    await biancaRow.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByText("Reserva cancelada.")).toBeVisible();

    await page.getByRole("button", { name: "Promover waitlist" }).click();
    await expect(page.getByText("Primeira reserva da waitlist promovida.")).toBeVisible();

    const rafaelRow = page
      .locator("p.font-semibold", { hasText: "Rafael Rodrigues 4" })
      .locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");
    await expect(rafaelRow.getByText("Confirmada")).toBeVisible();
    await rafaelRow.getByRole("button", { name: "Registrar check-in" }).dispatchEvent("click");
    await expect(page.getByText("Check-in registrado.")).toBeVisible();
    await expect(rafaelRow.getByRole("button", { name: "Check-in OK" })).toBeVisible();
  });

  test("reflete sessões sem check-in na operação", async ({ page }) => {
    await page.goto("/reservas", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Reservas, vagas e aulas" })).toBeVisible();

    const sessaoSemCheckin = page
      .getByRole("button")
      .filter({ hasText: "Recovery" })
      .filter({ hasText: "Sem check-in" })
      .first();

    await expect(sessaoSemCheckin).toBeVisible();
    await sessaoSemCheckin.click();

    await page.getByLabel("Reservar para aluno").selectOption("al-demo-025");
    await page.getByRole("button", { name: "Reservar vaga" }).click();
    await expect(page.getByText("Reserva criada com sucesso.")).toBeVisible();

    const camilaRow = page
      .locator("p.font-semibold", { hasText: "Camila Almeida 25" })
      .locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");
    await expect(camilaRow.getByRole("button", { name: "Check-in indisponível" })).toBeDisabled();
  });

  test("destaca ocorrência avulsa vinda de grade sob demanda", async ({ page }) => {
    await page.goto("/reservas", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Reservas, vagas e aulas" })).toBeVisible();

    await expect(page.getByText("1 ocorrência(s) avulsa(s)")).toBeVisible();

    const ocorrencia = page
      .getByRole("button")
      .filter({ hasText: "Recovery" })
      .filter({ hasText: "Ocorrência" })
      .first();

    await expect(ocorrencia).toBeVisible();
    await ocorrencia.click();
    await expect(page.getByText("Sessão criada manualmente a partir de uma grade sob demanda.")).toBeVisible();
  });
});
