import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";

type CreatedProspect = {
  id: string;
  nome: string;
};

type ConvertedArtifacts = {
  aluno: {
    id: string;
    nome: string;
  };
  matricula: {
    id: string;
    status?: string | null;
  };
  pagamento: {
    id: string;
    descricao: string;
    status: string;
    dataVencimento: string;
  };
};

const DIRECT_BACKEND_BASE_URL = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:8080";

test.describe.configure({ mode: "serial" });

function backendUrl(path: string) {
  return `${DIRECT_BACKEND_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function generateValidCpf(seed: string) {
  const baseDigits = seed
    .replace(/\D/g, "")
    .slice(-9)
    .padStart(9, "0")
    .split("")
    .map(Number);

  const computeCheckDigit = (digits: number[], factor: number) => {
    const total = digits.reduce((sum, digit, index) => sum + digit * (factor - index), 0);
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstCheckDigit = computeCheckDigit(baseDigits, 10);
  const secondCheckDigit = computeCheckDigit([...baseDigits, firstCheckDigit], 11);
  const fullDigits = [...baseDigits, firstCheckDigit, secondCheckDigit].join("");

  return `${fullDigits.slice(0, 3)}.${fullDigits.slice(3, 6)}.${fullDigits.slice(6, 9)}-${fullDigits.slice(9, 11)}`;
}

function cpfDigitsOnly(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

function cpfMatch(a: string | null | undefined, b: string): boolean {
  if (!a) return false;
  return cpfDigitsOnly(a) === cpfDigitsOnly(b);
}

function buildUniqueProspect() {
  const stamp = `${Date.now()}`;
  const digits = stamp.slice(-8);

  return {
    nome: `Prospect Smoke ${stamp}`,
    telefone: `(11) 98${digits.slice(0, 3)}-${digits.slice(3, 7)}`,
    email: `prospect.smoke.${stamp}@qa.local`,
    cpf: generateValidCpf(stamp),
    nascimento: "1993-07-15",
  };
}

async function openStable(page: Page, path: string, matcher: RegExp) {
  try {
    await page.goto(path, { waitUntil: "domcontentloaded" });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("ERR_ABORTED")) {
      throw error;
    }
  }
  await page.waitForURL(matcher, { timeout: 30_000 });
}

async function isBackendOnline(request: APIRequestContext) {
  try {
    const response = await request.get(backendUrl("/actuator/health/liveness"), { failOnStatusCode: false });
    return response.status() < 500;
  } catch {
    return false;
  }
}

async function loginAsOperationalUser(page: Page, request: APIRequestContext) {
  console.log("[smoke-real] autenticando operador via API");
  const loginResponse = await request.post(backendUrl("/api/v1/auth/login"), {
    data: {
      email: "admin@conceito.fit",
      password: "Admin@2026",
    },
  });
  expect(loginResponse.ok()).toBe(true);

  const session = (await loginResponse.json()) as {
    token: string;
    refreshToken: string;
    type?: string;
    expiresIn?: number;
    userId?: string;
    userKind?: string;
    displayName?: string;
    redeId?: string;
    redeSubdominio?: string;
    redeSlug?: string;
    redeNome?: string;
    activeTenantId?: string;
    baseTenantId?: string;
    availableTenants?: Array<{ tenantId: string; defaultTenant: boolean }>;
    availableScopes?: string[];
    broadAccess?: boolean;
    forcePasswordChange?: boolean;
  };

  const targetTenantId =
    session.activeTenantId
    ?? session.baseTenantId
    ?? session.availableTenants?.find((item) => item.defaultTenant)?.tenantId
    ?? session.availableTenants?.[0]?.tenantId;
  expect(targetTenantId).toBeTruthy();

  const contextResponse = await request.put(backendUrl(`/api/v1/context/unidade-ativa/${targetTenantId}`), {
    headers: {
      Authorization: `${session.type ?? "Bearer"} ${session.token}`,
    },
  });
  expect(contextResponse.ok()).toBe(true);

  await installE2EAuthSession(page, {
    token: session.token,
    refreshToken: session.refreshToken,
    type: session.type ?? "Bearer",
    expiresIn: session.expiresIn ?? 3600,
    userId: session.userId ?? "",
    userKind: session.userKind ?? "COLABORADOR",
    displayName: session.displayName ?? "Administrador Seed",
    networkId: session.redeId ?? "",
    networkSubdomain: session.redeSubdominio ?? session.redeSlug ?? "",
    networkName: session.redeNome ?? "",
    activeTenantId: targetTenantId,
    baseTenantId: session.baseTenantId ?? targetTenantId,
    preferredTenantId: targetTenantId,
    availableTenants: session.availableTenants ?? [{ tenantId: targetTenantId, defaultTenant: true }],
    availableScopes: session.availableScopes ?? ["UNIDADE"],
    broadAccess: session.broadAccess ?? false,
    forcePasswordChangeRequired: session.forcePasswordChange ?? false,
  });

  console.log("[smoke-real] sessao seeded; abrindo dashboard");
  await openStable(page, "/dashboard", /\/dashboard(?:\?|$)/);
  await page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 30_000 });
  console.log("[smoke-real] dashboard carregado");

  return {
    token: session.token,
    tokenType: session.type ?? "Bearer",
    tenantId: targetTenantId,
  };
}

async function createProspectViaApi(
  request: APIRequestContext,
  session: { token: string; tokenType: string; tenantId: string },
  prospect: ReturnType<typeof buildUniqueProspect>,
) {
  console.log("[smoke-real] criando prospect via API CRM canonica");
  const response = await request.post(backendUrl(`/api/v1/crm/prospects?tenantId=${encodeURIComponent(session.tenantId)}`), {
    headers: {
      Authorization: `${session.tokenType} ${session.token}`,
    },
    data: {
      nome: prospect.nome,
      telefone: prospect.telefone,
      email: prospect.email,
      cpf: prospect.cpf,
      origem: "INSTAGRAM",
      observacoes: "",
    },
  });
  expect(response.ok()).toBe(true);

  const created = (await response.json()) as CreatedProspect;
  console.log("[smoke-real] prospect criado", created.id);
  return {
    id: created.id,
    nome: created.nome,
  };
}

async function advanceProspectForConversion(
  request: APIRequestContext,
  session: { token: string; tokenType: string; tenantId: string },
  createdProspect: CreatedProspect,
) {
  console.log("[smoke-real] promovendo prospect para estado convertivel");
  for (const nextStatus of ["AGENDOU_VISITA", "VISITOU", "EM_CONTATO"] as const) {
    const response = await request.patch(
      backendUrl(
        `/api/v1/crm/prospects/${createdProspect.id}/status?tenantId=${encodeURIComponent(session.tenantId)}&status=${nextStatus}`,
      ),
      {
        headers: {
          Authorization: `${session.tokenType} ${session.token}`,
        },
      },
    );
    expect(response.ok()).toBe(true);
  }
}

async function resolveMensalPlanId(
  request: APIRequestContext,
  session: { token: string; tokenType: string; tenantId: string },
) {
  const response = await request.get(
    backendUrl(`/api/v1/comercial/planos?tenantId=${encodeURIComponent(session.tenantId)}&apenasAtivos=true`),
    {
      headers: {
        Authorization: `${session.tokenType} ${session.token}`,
      },
    },
  );
  expect(response.ok()).toBe(true);

  const planos = (await response.json()) as Array<{ id: string; nome: string }>;
  const mensal = planos.find((item) => /mensal/i.test(item.nome));
  expect(mensal?.id).toBeTruthy();
  return mensal!.id;
}

async function convertProspectToClientViaApi(
  request: APIRequestContext,
  session: { token: string; tokenType: string; tenantId: string },
  createdProspect: CreatedProspect,
  prospect: ReturnType<typeof buildUniqueProspect>,
  planoId: string,
) {
  console.log("[smoke-real] convertendo prospect");
  const conversionResponse = await request.post(
    backendUrl(`/api/v1/crm/prospects/converter?tenantId=${encodeURIComponent(session.tenantId)}`),
    {
      headers: {
        Authorization: `${session.tokenType} ${session.token}`,
      },
      data: {
        prospectId: createdProspect.id,
        cpf: prospect.cpf,
        dataNascimento: prospect.nascimento,
        sexo: "M",
        planoId,
        dataInicio: "2026-04-01",
        formaPagamento: "PIX",
      },
    },
  );

  if (!conversionResponse.ok()) {
    const errorBody = await conversionResponse.text().catch(() => "");
    console.error(`[smoke-real] conversao falhou: ${conversionResponse.status()} ${conversionResponse.statusText()} — ${errorBody}`);
  }
  expect(conversionResponse.ok()).toBe(true);
  console.log("[smoke-real] conversao aceita pelo backend; buscando artefatos criados");
}

function extractArrayFromPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["items", "content", "data", "rows", "result", "itens"]) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

async function tryGetJson<T>(request: APIRequestContext, url: string, headers: Record<string, string>): Promise<T | null> {
  try {
    const response = await request.get(url, { headers, failOnStatusCode: false });
    if (!response.ok()) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function resolveConvertedArtifacts(
  request: APIRequestContext,
  session: { token: string; tokenType: string; tenantId: string },
  prospect: ReturnType<typeof buildUniqueProspect>,
) {
  const authHeaders = { Authorization: `${session.tokenType} ${session.token}` };
  const MAX_ATTEMPTS = 20;
  const POLL_INTERVAL_MS = 2_000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const alunosResponse = await request.get(
      backendUrl(`/api/v1/comercial/alunos?tenantId=${encodeURIComponent(session.tenantId)}&search=${encodeURIComponent(prospect.cpf)}&page=0&size=5&envelope=true`),
      { headers: authHeaders },
    );
    expect(alunosResponse.ok()).toBe(true);

    const alunosPayload = await alunosResponse.json();
    const alunosList = extractArrayFromPayload<{ id: string; nome: string; cpf?: string | null }>(alunosPayload);
    const aluno = alunosList.find((item) => cpfMatch(item.cpf, prospect.cpf));

    if (aluno?.id) {
      // Try /adesoes first, then /matriculas as fallback (mirrors frontend behavior)
      let matriculasPayload = await tryGetJson<unknown>(
        request,
        backendUrl(`/api/v1/comercial/alunos/${aluno.id}/adesoes?tenantId=${encodeURIComponent(session.tenantId)}&page=0&size=10`),
        authHeaders,
      );
      if (!matriculasPayload) {
        matriculasPayload = await tryGetJson<unknown>(
          request,
          backendUrl(`/api/v1/comercial/alunos/${aluno.id}/matriculas?tenantId=${encodeURIComponent(session.tenantId)}&page=0&size=10`),
          authHeaders,
        );
      }

      const pagamentosResponse = await request.get(
        backendUrl(`/api/v1/comercial/pagamentos?tenantId=${encodeURIComponent(session.tenantId)}&alunoId=${encodeURIComponent(aluno.id)}&page=0&size=20`),
        { headers: authHeaders },
      );
      expect(pagamentosResponse.ok()).toBe(true);
      const pagamentosPayload = await pagamentosResponse.json();

      const matriculas = extractArrayFromPayload<{ id: string; status?: string | null }>(matriculasPayload);
      const pagamentos = extractArrayFromPayload<{
        id: string;
        descricao?: string | null;
        status?: string | null;
        dataVencimento?: string | null;
      }>(pagamentosPayload);

      const matricula = matriculas.find((item) => item.id);
      const pagamento = pagamentos.find((item) => item.id && /PENDENTE|ABERTO|VENCIDO/i.test(item.status ?? ""));

      if (matricula?.id && pagamento?.id && pagamento.descricao && pagamento.dataVencimento) {
        console.log("[smoke-real] artefatos confirmados", aluno.id, matricula.id, pagamento.id);
        return {
          aluno: {
            id: aluno.id,
            nome: aluno.nome,
          },
          matricula: {
            id: matricula.id,
            status: matricula.status,
          },
          pagamento: {
            id: pagamento.id,
            descricao: pagamento.descricao,
            status: pagamento.status ?? "PENDENTE",
            dataVencimento: pagamento.dataVencimento,
          },
        } satisfies ConvertedArtifacts;
      }

      console.log(`[smoke-real] tentativa ${attempt + 1}: aluno encontrado (${aluno.id}), mas matricula/pagamento ainda nao disponiveis (matriculas=${matriculas.length}, pagamentos=${pagamentos.length})`);
    } else {
      console.log(`[smoke-real] tentativa ${attempt + 1}: aluno ainda nao encontrado para CPF ${prospect.cpf}`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Conversao concluida, mas aluno/matricula/pagamento nao ficaram legiveis para ${prospect.cpf} apos ${MAX_ATTEMPTS} tentativas.`);
}

async function openClientProfile(page: Page, clienteId: string, clienteNome: string) {
  await openStable(page, `/clientes/${clienteId}`, /\/clientes\/.+$/);
  await expect(page.getByRole("heading", { name: clienteNome })).toBeVisible({ timeout: 30_000 });
}

function resolveExpectedStatusLabel(apiStatus: string): string {
  const map: Record<string, string> = {
    PENDENTE: "Pendente",
    ABERTO: "Aberto",
    VENCIDO: "Vencido",
    AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
    EMITIDO: "Emitido",
    EM_ABERTO: "Em aberto",
  };
  return map[apiStatus.toUpperCase()] ?? apiStatus;
}

async function verifyPaymentInClientFinance(
  page: Page,
  pagamento: ConvertedArtifacts["pagamento"],
  aluno: ConvertedArtifacts["aluno"],
) {
  const statusLabel = resolveExpectedStatusLabel(pagamento.status);
  console.log("[smoke-real] validando pagamento no financeiro do cliente", aluno.id, "status esperado:", statusLabel);
  await page.getByRole("button", { name: "Financeiro", exact: true }).click();

  const paymentCard = page
    .locator("div")
    .filter({ has: page.getByText(pagamento.descricao, { exact: true }) })
    .filter({ has: page.getByText(statusLabel, { exact: true }) })
    .first();
  await expect(paymentCard).toBeVisible({ timeout: 30_000 });
  await expect(paymentCard.getByText(statusLabel, { exact: true })).toBeVisible();
  console.log("[smoke-real] pagamento visivel no financeiro com status", statusLabel);
}

test.describe("Smoke comercial com backend real", () => {
  test("prospect vira cliente com matrícula, gera pagamento pendente e recebe a cobrança", async ({
    page,
    request,
  }) => {
    test.slow();

    const backendAvailable = await isBackendOnline(request);
    test.skip(!backendAvailable, "Backend real indisponível; rode a stack local ou use o job CI com docker-compose.");

    const prospect = buildUniqueProspect();

    const session = await loginAsOperationalUser(page, request);
    const createdProspect = await createProspectViaApi(request, session, prospect);
    await advanceProspectForConversion(request, session, createdProspect);
    const planoId = await resolveMensalPlanId(request, session);
    await convertProspectToClientViaApi(request, session, createdProspect, prospect, planoId);
    const converted = await resolveConvertedArtifacts(request, session, prospect);

    expect(converted.aluno.id).toBeTruthy();
    expect(converted.matricula.id).toBeTruthy();
    expect(converted.pagamento.id).toBeTruthy();
    expect(converted.pagamento.status).toMatch(/PENDENTE|ABERTO|VENCIDO/i);

    await openClientProfile(page, converted.aluno.id, converted.aluno.nome);
    await verifyPaymentInClientFinance(page, converted.pagamento, converted.aluno);
  });
});
