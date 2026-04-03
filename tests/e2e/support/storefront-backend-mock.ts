import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

const DEFAULT_PORT = 8080;
const DEFAULT_SLUG = "academia-demo";
const DEFAULT_TENANT_ID = "tenant-demo";
const PUBLIC_TENANTS = [
  {
    id: "tenant-pechincha-s3",
    academiaId: "academia-publica-demo",
    groupId: "academia-publica-demo",
    nome: "PECHINCHA - S3",
    razaoSocial: "Academia Pública Pechincha",
    documento: "12.345.678/0001-90",
    subdomain: "pechincha-s3",
    email: "pechincha@academia.local",
    telefone: "(21) 3000-2003",
    ativo: true,
    branding: {
      appName: "Conceito.Fit Pechincha",
      useCustomColors: true,
      colors: {
        primary: "#14213d",
        accent: "#fca311",
        border: "#22355a",
        background: "#0b1020",
        foreground: "#f9fafb",
      },
    },
  },
];

const PUBLIC_PLANOS = {
  "tenant-pechincha-s3": [
    {
      id: "plano-pechincha-smart",
      tenantId: "tenant-pechincha-s3",
      nome: "Plano Smart",
      descricao: "Entrada ideal para aulas coletivas.",
      tipo: "MENSAL",
      duracaoDias: 30,
      valor: 149.9,
      valorMatricula: 29.9,
      destaque: true,
      ativo: true,
      ordem: 1,
      beneficios: ["Aulas coletivas", "Musculação", "App do aluno"],
      permiteRenovacaoAutomatica: true,
      contratoAssinatura: "DIGITAL",
    },
  ],
} satisfies Record<string, unknown[]>;

const PUBLIC_PAYMENT_METHODS = {
  "tenant-pechincha-s3": [
    {
      id: "fp-boleto-pechincha",
      tenantId: "tenant-pechincha-s3",
      nome: "Boleto",
      tipo: "BOLETO",
      ativo: true,
      parcelasMax: 1,
    },
  ],
} satisfies Record<string, unknown[]>;

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function notFound(response: ServerResponse) {
  sendJson(response, 404, {
    status: 404,
    error: "Not Found",
    message: "Recurso não encontrado no mock do storefront.",
  });
}

function buildOverview(slug: string, tenantId: string) {
  return {
    academiaId: "academia-demo",
    academiaSlug: slug,
    nome: "Academia Demo",
    descricao: "Storefront de demonstração para smoke da taxonomia de rotas.",
    unidades: [
      {
        tenantId,
        nome: "Unidade Centro",
        telefone: "(11) 4000-1000",
        endereco: {
          logradouro: "Rua do Teste",
          numero: "100",
          bairro: "Centro",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01000-000",
        },
      },
    ],
    modalidades: [],
    storefrontTheme: {
      id: "theme-demo",
      academiaId: "academia-demo",
      logoUrl: null,
      faviconUrl: null,
      corPrimaria: "#FF6B00",
      corSecundaria: "#101828",
      corFundo: "#FFFFFF",
      corTexto: "#101828",
      titulo: "Academia Demo",
      subtitulo: "Seu treino começa aqui.",
      descricao: "Tema mockado para validar subdomínio e storefront por slug.",
      bannerUrl: null,
      galeriaUrls: [],
      redesSociais: {},
      customCssVars: {},
      ativo: true,
      dataCriacao: "2026-04-03T10:00:00.000Z",
      dataAtualizacao: "2026-04-03T10:00:00.000Z",
    },
  };
}

function buildSeo(slug: string) {
  return {
    title: `Academia Demo | ${slug}`,
    description: "Storefront mockada para smoke E2E da taxonomia de rotas.",
    ogImage: "",
    jsonLd: "{}",
  };
}

function handler(request: IncomingMessage, response: ServerResponse) {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const pathname = url.pathname;

  if (method !== "GET") {
    notFound(response);
    return;
  }

  if (pathname === "/api/v1/unidades") {
    sendJson(response, 200, PUBLIC_TENANTS);
    return;
  }

  if (pathname.startsWith("/api/v1/context/unidade-ativa/")) {
    const tenantId = pathname.split("/").at(-1) ?? "";
    const tenant =
      PUBLIC_TENANTS.find((item) => item.id === tenantId) ?? PUBLIC_TENANTS[0];
    sendJson(response, 200, {
      currentTenantId: tenant.id,
      tenantAtual: tenant,
      unidadesDisponiveis: PUBLIC_TENANTS,
    });
    return;
  }

  if (pathname === "/api/v1/academia") {
    sendJson(response, 200, {
      id: "academia-publica-demo",
      nome: "Academia Pública Demo",
      documento: "12.345.678/0001-90",
      ativo: true,
    });
    return;
  }

  if (pathname === "/api/v1/comercial/planos") {
    const tenantId = url.searchParams.get("tenantId") ?? PUBLIC_TENANTS[0]?.id ?? "";
    sendJson(response, 200, PUBLIC_PLANOS[tenantId as keyof typeof PUBLIC_PLANOS] ?? []);
    return;
  }

  if (pathname === "/api/v1/gerencial/financeiro/formas-pagamento") {
    const tenantId = url.searchParams.get("tenantId") ?? PUBLIC_TENANTS[0]?.id ?? "";
    sendJson(
      response,
      200,
      PUBLIC_PAYMENT_METHODS[tenantId as keyof typeof PUBLIC_PAYMENT_METHODS] ?? [],
    );
    return;
  }

  if (pathname === "/api/v1/publico/storefront/resolve") {
    const subdomain = url.searchParams.get("subdomain");
    if (subdomain !== DEFAULT_SLUG) {
      notFound(response);
      return;
    }

    sendJson(response, 200, {
      tenantId: DEFAULT_TENANT_ID,
      slug: DEFAULT_SLUG,
      academiaSlug: DEFAULT_SLUG,
    });
    return;
  }

  if (pathname === `/api/v1/publico/storefront/${DEFAULT_SLUG}`) {
    sendJson(response, 200, buildOverview(DEFAULT_SLUG, DEFAULT_TENANT_ID));
    return;
  }

  if (pathname === `/api/v1/publico/storefront/${DEFAULT_SLUG}/theme`) {
    sendJson(response, 200, buildOverview(DEFAULT_SLUG, DEFAULT_TENANT_ID).storefrontTheme);
    return;
  }

  if (pathname === `/api/v1/publico/storefront/${DEFAULT_SLUG}/seo`) {
    sendJson(response, 200, buildSeo(DEFAULT_SLUG));
    return;
  }

  notFound(response);
}

export async function startStorefrontBackendMock(port = DEFAULT_PORT): Promise<Server> {
  const server = createServer(handler);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  return server;
}

export function resolveStorefrontBackendMockPort(): number {
  const configured =
    process.env.ROUTE_TAXONOMY_MOCK_BACKEND_PORT
    ?? process.env.PLAYWRIGHT_BACKEND_PROXY_TARGET;

  if (!configured) return DEFAULT_PORT;

  if (/^\d+$/.test(configured.trim())) {
    return Number(configured.trim());
  }

  try {
    return Number(new URL(configured).port || DEFAULT_PORT);
  } catch {
    return DEFAULT_PORT;
  }
}

export async function stopStorefrontBackendMock(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
