import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

function isPlaywrightRuntimeEnabled(): boolean {
  const raw = process.env.PLAYWRIGHT_TEST?.trim().toLowerCase();
  return raw === "1" || raw === "true";
}

function notFound(path: string) {
  return NextResponse.json(
    { message: `Stub server-side inexistente para ${path}` },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}

function forbidden(message: string) {
  return NextResponse.json(
    { message },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!isPlaywrightRuntimeEnabled()) {
    return notFound("playwright-disabled");
  }

  const { path } = await context.params;
  const joinedPath = `/${path.join("/")}`;

  if (joinedPath === "/api/v1/academia/dashboard") {
    const tenantId = request.nextUrl.searchParams.get("tenantId");

    if (tenantId !== PLAYWRIGHT_TENANT_ID) {
      return forbidden(`tenantId inesperado no SSR stub: ${tenantId ?? "(vazio)"}`);
    }

    return NextResponse.json(DASHBOARD_SSR_RESPONSE, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return notFound(joinedPath);
}
