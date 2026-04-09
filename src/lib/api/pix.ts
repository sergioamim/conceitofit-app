import { apiRequest } from "./http";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PixCobranca {
  txId: string;
  status: string;
  pixCopiaECola: string;
  vencimento: string | null;
}

export interface PixDevolucao {
  rtrId: string;
  endToEndId: string;
  valor: number;
  status: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** POST /api/v1/integracoes/pix/cobrancas?tenantId=X */
export async function criarCobrancaPixApi(input: {
  tenantId: string;
  alunoId?: string;
  valor: number;
  descricao?: string;
}): Promise<PixCobranca> {
  return apiRequest<PixCobranca>({
    path: "/api/v1/integracoes/pix/cobrancas",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: {
      alunoId: input.alunoId,
      valor: input.valor,
      descricao: input.descricao,
    },
  });
}

/** GET /api/v1/integracoes/pix/cobrancas/{txId}?tenantId=X */
export async function consultarCobrancaPixApi(input: {
  txId: string;
  tenantId: string;
}): Promise<{ txId: string; status: string }> {
  return apiRequest<{ txId: string; status: string }>({
    path: `/api/v1/integracoes/pix/cobrancas/${input.txId}`,
    method: "GET",
    query: { tenantId: input.tenantId },
  });
}

/** DELETE /api/v1/integracoes/pix/cobrancas/{txId}?tenantId=X */
export async function cancelarCobrancaPixApi(input: {
  txId: string;
  tenantId: string;
}): Promise<{ txId: string; status: string }> {
  return apiRequest<{ txId: string; status: string }>({
    path: `/api/v1/integracoes/pix/cobrancas/${input.txId}`,
    method: "DELETE",
    query: { tenantId: input.tenantId },
  });
}

/** POST /api/v1/integracoes/pix/devolucao?tenantId=X */
export async function devolucaoPixApi(input: {
  tenantId: string;
  endToEndId: string;
  valor: number;
}): Promise<PixDevolucao> {
  return apiRequest<PixDevolucao>({
    path: "/api/v1/integracoes/pix/devolucao",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: {
      endToEndId: input.endToEndId,
      valor: input.valor,
    },
  });
}
