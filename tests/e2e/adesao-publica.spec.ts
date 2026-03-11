import { expect, test } from "@playwright/test";

test.describe("Jornada pública de adesão", () => {
  test("capta trial e segue para o cadastro da unidade", async ({ page }) => {
    await page.goto("/adesao/trial?tenant=pechincha-s3");

    await expect(page.getByRole("heading", { name: "Agende um trial antes de fechar" })).toBeVisible();

    await page.getByLabel("Nome completo").fill("Julia Monteiro");
    await page.getByLabel("E-mail").fill("julia.monteiro@email.com");
    await page.getByLabel("Telefone").fill("(21) 98888-7766");
    await page.getByLabel("Objetivo do aluno").fill("Quero testar as aulas coletivas da unidade.");
    await page.getByRole("button", { name: "Registrar trial" }).click();

    await expect(page.getByText("Trial registrado.")).toBeVisible();
    await page.getByRole("link", { name: "Continuar para cadastro" }).click();

    await expect(page).toHaveURL(/\/adesao\/cadastro/);
    await expect(page.getByRole("heading", { name: "Complete o pré-cadastro" })).toBeVisible();
  });

  test("fecha adesão pública, cai em pendência contratual e conclui assinatura", async ({ page }) => {
    await page.goto("/adesao?tenant=mananciais-s1");

    await expect(page.getByRole("heading", { name: "Escolha seu plano e comece hoje" })).toBeVisible();
    await page.getByRole("link", { name: "Assinar agora" }).click();

    await expect(page).toHaveURL(/\/adesao\/cadastro/);
    await page.getByLabel("Nome completo").fill("Mariana Costa");
    await page.getByLabel("E-mail").fill("mariana.costa@email.com");
    await page.getByLabel("Telefone").fill("(11) 97777-6655");
    await page.getByLabel("CPF").fill("123.456.789-00");
    await page.getByLabel("Data de nascimento").fill("1993-02-10");
    await page.getByLabel("Cidade").fill("São Paulo");
    await page.getByLabel("Objetivo / observações").fill("Foco em musculação e spinning no período da manhã.");
    await page.getByRole("button", { name: "Ir para checkout" }).click();

    await expect(page).toHaveURL(/\/adesao\/checkout/);
    const signNow = page.getByLabel(/Assinar contrato agora/);
    await signNow.uncheck();
    await page.getByLabel(/Aceito os termos da adesão e da cobrança/).check();
    await page.getByRole("button", { name: "Concluir adesão" }).click();

    await expect(page).toHaveURL(/\/adesao\/pendencias/);
    await expect(page.getByText("PENDENTE", { exact: true })).toBeVisible();
    await expect(page.getByText("PENDENTE_ASSINATURA", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Assinar contrato agora" }).click();
    await expect(page.getByText("ASSINADO", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Marcar pagamento como recebido" }).click();
    await expect(page.getByText("PAGO", { exact: true })).toBeVisible();
    await expect(page.getByText("ASSINADO", { exact: true })).toBeVisible();
    await expect(page.getByText("Contratação concluída.")).toBeVisible();
  });
});
