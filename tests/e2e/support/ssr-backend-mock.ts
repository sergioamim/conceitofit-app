import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

const DEFAULT_PORT = 0;
const PLAYWRIGHT_TENANT_ID = "tenant-centro";

const DASHBOARD_SSR_RESPONSE = {
  totalAlunosAtivos: 77,
  prospectsNovos: 9,
  matriculasDoMes: 5,
  receitaDoMes: 18750,
  prospectsRecentes: [
    {
      id: "prospect-ssr-1",
      tenantId: PLAYWRIGHT_TENANT_ID,
      nome: "Prospect SSR",
      telefone: "11999990077",
      origem: "SITE",
      status: "NOVO",
      dataCriacao: "2026-04-10T09:00:00",
    },
  ],
  matriculasVencendo: [],
  pagamentosPendentes: [],
  statusAlunoCount: {
    ATIVO: 77,
    INATIVO: 2,
    SUSPENSO: 1,
    CANCELADO: 0,
  },
  prospectsEmAberto: 7,
  followupPendente: 2,
  visitasAguardandoRetorno: 1,
  prospectsNovosAnterior: 6,
  matriculasDoMesAnterior: 3,
  receitaDoMesAnterior: 15000,
  ticketMedio: 3750,
  ticketMedioAnterior: 3200,
  pagamentosRecebidosMes: 16000,
  pagamentosRecebidosMesAnterior: 14200,
  vendasNovas: 8200,
  vendasRecorrentes: 10550,
  inadimplencia: 900,
  aReceber: 2800,
};

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function notFound(response: ServerResponse, path: string) {
  sendJson(response, 404, {
    message: `Stub server-side inexistente para ${path}`,
  });
}

function forbidden(response: ServerResponse, message: string) {
  sendJson(response, 403, { message });
}

function handler(request: IncomingMessage, response: ServerResponse) {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const pathname = url.pathname;

  if (method !== "GET") {
    notFound(response, pathname);
    return;
  }

  if (pathname === "/api/v1/academia/dashboard") {
    const tenantId = url.searchParams.get("tenantId");

    if (tenantId !== PLAYWRIGHT_TENANT_ID) {
      forbidden(response, `tenantId inesperado no SSR stub: ${tenantId ?? "(vazio)"}`);
      return;
    }

    sendJson(response, 200, DASHBOARD_SSR_RESPONSE);
    return;
  }

  notFound(response, pathname);
}

export function resolveSsrBackendMockPort(): number {
  const rawPort = process.env.PLAYWRIGHT_SSR_BACKEND_PORT?.trim();
  if (!rawPort) return DEFAULT_PORT;
  return /^\d+$/.test(rawPort) ? Number(rawPort) : DEFAULT_PORT;
}

export async function startSsrBackendMock(port = DEFAULT_PORT): Promise<Server> {
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

export function resolveSsrBackendMockBaseUrl(server: Server): string {
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Nao foi possivel resolver a porta do SSR backend mock.");
  }

  return `http://127.0.0.1:${address.port}`;
}

export async function stopSsrBackendMock(server: Server): Promise<void> {
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
