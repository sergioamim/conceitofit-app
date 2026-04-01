import { expect, test, type Page } from "@playwright/test";
import { installPublicJourneyApiMocks } from "./support/backend-only-stubs";

type CreateVendaResponse = {
  id?: string;
};

type PublicApiRequest = {
  method: string;
  path: string;
};

async function abrirRota(page: Page, url: string, matcher: RegExp) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("ERR_ABORTED")) {
      throw error;
    }
  }
  await page.waitForURL(matcher, { timeout: 30_000 });
}

async function aguardarJornadaPublica(page: Page) {
  await expect(page.getByText("Carregando jornada pública...")).not.toBeVisible({ timeout: 30_000 });
}

function capturarRequestsPublicos(page: Page): PublicApiRequest[] {
  const requests: PublicApiRequest[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!url.pathname.includes("/api/v1/")) return;
    requests.push({
      method: request.method(),
      path: url.pathname.replace(/^\/backend/, ""),
    });
  });
  return requests;
}

function expectRequestRegistrada(
  requests: PublicApiRequest[],
  method: string,
  matcher: RegExp,
) {
  expect(
    requests.some((entry) => entry.method === method && matcher.test(entry.path)),
    `Esperava request ${method} ${matcher}.\nRecebidas: ${requests.map((entry) => `${entry.method} ${entry.path}`).join("\n")}`,
  ).toBe(true);
}

test.describe("Jornada pública de adesão", () => {
  test.beforeEach(async ({ page }) => {
    await installPublicJourneyApiMocks(page);
  });

  test("capta trial e segue para o cadastro da unidade", async ({ page }) => {
    test.slow();
    const requests = capturarRequestsPublicos(page);
    await abrirRota(page, "/adesao/trial?tenant=pechincha-s3", /\/adesao\/trial/);
    await aguardarJornadaPublica(page);

    await expect(page.getByRole("heading", { name: "Agende um trial antes de fechar" })).toBeVisible({ timeout: 30_000 });

    await page.getByLabel("Nome completo").fill("Julia Monteiro");
    await page.getByLabel("E-mail").fill("julia.monteiro@email.com");
    await page.getByLabel("Telefone").fill("(21) 98888-7766");
    await page.getByLabel("Objetivo do aluno").fill("Quero testar as aulas coletivas da unidade.");
    await page.getByRole("button", { name: "Registrar trial" }).click();

    await expect(page.getByText(/Trial registrado\./)).toBeVisible();
    const continuarHref = await page.getByRole("link", { name: "Continuar para cadastro" }).getAttribute("href");
    expect(continuarHref).toBeTruthy();
    await abrirRota(page, continuarHref!, /\/adesao\/cadastro/);
    await aguardarJornadaPublica(page);

    await expect(page).toHaveURL(/\/adesao\/cadastro/);
    await expect(page.getByRole("heading", { name: "Complete o pré-cadastro" })).toBeVisible({ timeout: 30_000 });
    expectRequestRegistrada(requests, "GET", /^\/api\/v1\/unidades$/);
    expectRequestRegistrada(requests, "GET", /^\/api\/v1\/context\/unidade-ativa$/);
    expectRequestRegistrada(requests, "GET", /^\/api\/v1\/academia$/);
    expectRequestRegistrada(requests, "GET", /^\/api\/v1\/comercial\/planos$/);
    expectRequestRegistrada(requests, "GET", /^\/api\/v1\/gerencial\/financeiro\/formas-pagamento$/);
    expectRequestRegistrada(requests, "POST", /^\/api\/v1\/publico\/adesao\/trials$/);
  });

  test("fecha adesão pública, cai em pendência contratual e conclui assinatura", async ({ page }) => {
    test.slow();
    const requests = capturarRequestsPublicos(page);
    await abrirRota(
      page,
      "/adesao/cadastro?tenant=mananciais-s1&plan=plano-mananciais-premium",
      /\/adesao\/cadastro/
    );
    await aguardarJornadaPublica(page);

    await expect(page).toHaveURL(/\/adesao\/cadastro/);
    await page.getByLabel("Nome completo").fill("Mariana Costa");
    await page.getByLabel("E-mail").fill("mariana.costa@email.com");
    await page.getByLabel("Telefone").fill("(11) 97777-6655");
    await page.getByLabel("CPF").fill("123.456.789-00");
    await page.getByLabel("Data de nascimento").fill("1993-02-10");
    await page.getByLabel("Cidade").fill("São Paulo");
    await page.getByLabel("Objetivo / observações").fill("Foco em musculação e spinning no período da manhã.");
    await page.getByRole("button", { name: "Ir para checkout" }).click();

    await abrirRota(page, "/adesao/checkout?tenant=mananciais-s1&plan=plano-mananciais-premium", /\/adesao\/checkout/);
    await aguardarJornadaPublica(page);
    const signNow = page.getByLabel(/Assinar contrato agora/);
    await signNow.uncheck();
    await page.getByLabel(/Aceito os termos da adesão e da cobrança/).check();
    const checkoutResponsePromise = page.waitForResponse((response) =>
      response.request().method() === "POST"
      && /\/api\/v1\/publico\/adesao\/[^/]+\/checkout(?:\?|$)/.test(response.url())
    );
    await page.getByRole("button", { name: "Concluir adesão" }).click();
    const checkoutResponse = await checkoutResponsePromise;
    const venda = (await checkoutResponse.json()) as CreateVendaResponse;
    expect(venda.id ?? "").not.toBe("");

    await abrirRota(
      page,
      `/adesao/pendencias?tenant=mananciais-s1&plan=plano-mananciais-premium&checkout=${encodeURIComponent(venda.id!)}`,
      /\/adesao\/pendencias/
    );
    await aguardarJornadaPublica(page);

    await expect(page).toHaveURL(/\/adesao\/pendencias/);
    await expect(page.getByText("PENDENTE", { exact: true })).toBeVisible();
    await expect(page.getByText("PENDENTE_ASSINATURA", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Assinar contrato agora" }).click();
    await expect(page.getByText("ASSINADO", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Marcar pagamento como recebido" }).click();
    await expect(page.getByText("PAGO", { exact: true })).toBeVisible();
    await expect(page.getByText("ASSINADO", { exact: true })).toBeVisible();
    await expect(page.getByText("Contratação concluída.")).toBeVisible();
    expectRequestRegistrada(requests, "POST", /^\/api\/v1\/publico\/adesao\/cadastros$/);
    expectRequestRegistrada(requests, "POST", /^\/api\/v1\/publico\/adesao\/[^/]+\/checkout$/);
    expectRequestRegistrada(requests, "GET", /^\/api\/v1\/publico\/adesao\/[^/]+$/);
    expectRequestRegistrada(requests, "POST", /^\/api\/v1\/publico\/adesao\/[^/]+\/contrato\/otp$/);
    expectRequestRegistrada(requests, "POST", /^\/api\/v1\/publico\/adesao\/[^/]+\/contrato\/assinaturas$/);
    expectRequestRegistrada(requests, "POST", /^\/api\/v1\/publico\/adesao\/[^/]+\/pagamento\/confirmacao$/);
  });
});
