"use client";

import {
  type ClienteListEnvelopeResponse,
  createAlunoApi,
  createAlunoComMatriculaApi,
  extractAlunosFromListResponse,
  extractAlunosTotais,
  getAlunoApi,
  listAlunosApi,
  updateAlunoApi,
} from "@/lib/api/alunos";
import { listConveniosApi, listVoucherCodigosApi, listVouchersApi } from "@/lib/api/beneficios";
import {
  listPlanosApi,
  listProdutosApi,
  listServicosApi,
  togglePlanoAtivoApi,
  togglePlanoDestaqueApi,
} from "@/lib/api/comercial-catalogo";
import { listFormasPagamentoApi } from "@/lib/api/formas-pagamento";
import {
  cancelarMatriculaApi,
  createMatriculaApi,
  listMatriculasApi,
  listMatriculasByAlunoApi,
  listMatriculasPageApi,
  renovarMatriculaApi,
} from "@/lib/api/matriculas";
import { emitirNfsePagamentoApi, listPagamentosApi, receberPagamentoApi } from "@/lib/api/pagamentos";
import { listPresencasByAlunoApi } from "@/lib/api/presencas";
import { createVendaApi, listVendasApi, type ListVendasApiEnvelopeResult } from "@/lib/api/vendas";
import {
  createCartaoClienteApi,
  deleteCartaoClienteApi,
  listBandeirasCartaoApi,
  listCartoesClienteApi,
  setCartaoPadraoApi,
} from "@/lib/api/cartoes";
import { liberarAcessoCatracaApi, obterCatracaWsStatusPorTenantApi } from "@/lib/api/catraca";
import { ApiRequestError } from "@/lib/api/http";
import type {
  Aluno,
  AlunoTotaisStatus,
  BandeiraCartao,
  CartaoCliente,
  Convenio,
  FormaPagamento,
  Pagamento,
  PagamentoVenda,
  Plano,
  Presenca,
  Produto,
  Servico,
  StatusAluno,
  StatusFluxoComercial,
  StatusPagamento,
  TipoFormaPagamento,
  TipoPlano,
  TipoVenda,
  Venda,
  Voucher,
  VoucherCodigo,
} from "@/lib/types";

export type ListAlunosPageServiceResult = {
  items: Aluno[];
  total?: number;
  page: number;
  size: number;
  hasNext: boolean;
  totaisStatus?: AlunoTotaisStatus;
};

function extractPageMeta(response: ClienteListEnvelopeResponse, fallbackPage: number, fallbackSize: number) {
  return {
    page: typeof response.page === "number" ? response.page : fallbackPage,
    size: typeof response.size === "number" ? response.size : fallbackSize,
    hasNext: Boolean(response.hasNext),
  };
}

export async function listAlunosPageService(input: {
  tenantId: string;
  status?: StatusAluno;
  page?: number;
  size?: number;
}): Promise<ListAlunosPageServiceResult> {
  const response = await listAlunosApi({
    tenantId: input.tenantId,
    status: input.status,
    page: input.page,
    size: input.size,
  });
  const items = extractAlunosFromListResponse(response);
  const totaisStatus = extractAlunosTotais(response);
  if (Array.isArray(response)) {
    return {
      items,
      page: input.page ?? 0,
      size: input.size ?? items.length,
      total: items.length,
      hasNext: false,
    };
  }

  const meta = extractPageMeta(response, input.page ?? 0, input.size ?? items.length);
  return {
    items,
    page: meta.page,
    size: meta.size,
    total: totaisStatus?.total,
    hasNext: meta.hasNext,
    totaisStatus,
  };
}

export async function listAlunosService(input: {
  tenantId: string;
  status?: StatusAluno;
  size?: number;
}): Promise<Aluno[]> {
  const response = await listAlunosApi({
    tenantId: input.tenantId,
    status: input.status,
    page: 0,
    size: input.size ?? 500,
  });
  return extractAlunosFromListResponse(response);
}

export async function createAlunoService(input: {
  tenantId: string;
  data: Parameters<typeof createAlunoApi>[0]["data"];
}): Promise<Aluno> {
  return createAlunoApi(input);
}

export async function createAlunoComMatriculaService(input: {
  tenantId: string;
  data: Parameters<typeof createAlunoComMatriculaApi>[0]["data"];
}) {
  return createAlunoComMatriculaApi(input);
}

export async function updateAlunoService(input: {
  tenantId: string;
  id: string;
  data: Parameters<typeof updateAlunoApi>[0]["data"];
}) {
  return updateAlunoApi(input);
}

export async function resolveAlunoTenantService(input: {
  alunoId: string;
  tenantId?: string;
  tenantIds?: string[];
}): Promise<{ tenantId: string; aluno: Aluno } | null> {
  const seen = new Set<string>();
  const tenantIds = [input.tenantId, ...(input.tenantIds ?? [])]
    .map((tenantId) => tenantId?.trim() ?? "")
    .filter((tenantId) => tenantId && !seen.has(tenantId) && seen.add(tenantId));

  for (const tenantId of tenantIds) {
    try {
      const aluno = await getAlunoApi({
        tenantId,
        id: input.alunoId,
        // Descoberta multiunidade precisa consultar tenants candidatos antes de trocar o contexto ativo.
        includeContextHeader: false,
      });
      if (aluno?.id) {
        return {
          tenantId,
          aluno,
        };
      }
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        continue;
      }
      throw error;
    }
  }

  return null;
}

export async function listPlanosService(input: {
  tenantId: string;
  apenasAtivos?: boolean;
  tipo?: TipoPlano;
}): Promise<Plano[]> {
  return listPlanosApi(input);
}

export async function listFormasPagamentoService(input: {
  tenantId: string;
  apenasAtivas?: boolean;
}): Promise<FormaPagamento[]> {
  return listFormasPagamentoApi(input);
}

export async function listConveniosService(apenasAtivos?: boolean): Promise<Convenio[]> {
  return listConveniosApi(apenasAtivos);
}

export async function listPagamentosService(input: {
  tenantId: string;
  status?: StatusPagamento;
  alunoId?: string;
  page?: number;
  size?: number;
}): Promise<Pagamento[]> {
  return listPagamentosApi(input);
}

export async function receberPagamentoService(input: {
  tenantId: string;
  id: string;
  data: Parameters<typeof receberPagamentoApi>[0]["data"];
}): Promise<Pagamento> {
  return receberPagamentoApi(input);
}

export async function emitirNfsePagamentoService(input: {
  tenantId: string;
  id: string;
}): Promise<Pagamento> {
  return emitirNfsePagamentoApi(input);
}

export async function listPresencasByAlunoService(input: {
  tenantId: string;
  alunoId: string;
}): Promise<Presenca[]> {
  return listPresencasByAlunoApi(input);
}

export async function listMatriculasService(input: {
  tenantId: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  return listMatriculasApi(input);
}

export async function listMatriculasPageService(input: {
  tenantId: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  return listMatriculasPageApi(input);
}

export async function listMatriculasByAlunoService(input: {
  tenantId: string;
  alunoId: string;
  page?: number;
  size?: number;
}) {
  return listMatriculasByAlunoApi(input);
}

export async function createMatriculaService(input: {
  tenantId: string;
  data: Parameters<typeof createMatriculaApi>[0]["data"];
}) {
  return createMatriculaApi(input);
}

export async function cancelarMatriculaService(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  return cancelarMatriculaApi(input);
}

export async function renovarMatriculaService(input: {
  tenantId: string;
  id: string;
  planoId?: string;
}): Promise<void> {
  return renovarMatriculaApi(input);
}

export async function listVendasPageService(input: {
  tenantId: string;
  page?: number;
  size?: number;
  dataInicio?: string;
  dataFim?: string;
  tipoVenda?: TipoVenda;
  formaPagamento?: TipoFormaPagamento;
}): Promise<ListVendasApiEnvelopeResult> {
  const response = await listVendasApi({
    ...input,
    envelope: true,
  });
  if ("items" in response) return response;

  return {
    items: response,
    page: input.page ?? 0,
    size: input.size ?? response.length,
    total: response.length,
    hasNext: false,
  };
}

export async function createVendaService(input: {
  tenantId: string;
  data: {
    tipo: TipoVenda;
    clienteId?: string;
    convenioId?: string;
    voucherCodigo?: string;
    itens: Array<{
      tipo: TipoVenda;
      referenciaId: string;
      descricao: string;
      quantidade: number;
      valorUnitario: number;
      desconto?: number;
    }>;
    descontoTotal?: number;
    acrescimoTotal?: number;
    pagamento: PagamentoVenda;
    planoContexto?: {
      planoId: string;
      dataInicio: string;
      descontoPlano?: number;
      motivoDesconto?: string;
      renovacaoAutomatica?: boolean;
      convenioId?: string;
    };
  };
}): Promise<Venda> {
  return createVendaApi(input);
}

export async function listServicosService(apenasAtivos?: boolean): Promise<Servico[]> {
  return listServicosApi(apenasAtivos);
}

export async function listProdutosService(apenasAtivos?: boolean): Promise<Produto[]> {
  return listProdutosApi(apenasAtivos);
}

export async function listVouchersService(): Promise<Voucher[]> {
  return listVouchersApi();
}

export async function listVoucherCodigosService(voucherId: string): Promise<VoucherCodigo[]> {
  return listVoucherCodigosApi(voucherId);
}

export async function togglePlanoAtivoService(input: {
  tenantId: string;
  id: string;
}): Promise<Plano> {
  return togglePlanoAtivoApi(input);
}

export async function togglePlanoDestaqueService(input: {
  tenantId: string;
  id: string;
}): Promise<Plano> {
  return togglePlanoDestaqueApi(input);
}

export async function listBandeirasCartaoService(input?: {
  apenasAtivas?: boolean;
}): Promise<BandeiraCartao[]> {
  return listBandeirasCartaoApi(input);
}

export async function listCartoesClienteService(input: {
  tenantId: string;
  alunoId: string;
}): Promise<CartaoCliente[]> {
  return listCartoesClienteApi(input);
}

export async function createCartaoClienteService(input: {
  tenantId: string;
  alunoId: string;
  data: Parameters<typeof createCartaoClienteApi>[0]["data"];
}): Promise<CartaoCliente> {
  return createCartaoClienteApi(input);
}

export async function setCartaoPadraoService(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  return setCartaoPadraoApi(input);
}

export async function deleteCartaoClienteService(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  return deleteCartaoClienteApi(input);
}

function resolveOnlineAgentId(status: Awaited<ReturnType<typeof obterCatracaWsStatusPorTenantApi>>) {
  const tenantStatus = status.tenants[0];
  if (!tenantStatus) return undefined;
  return tenantStatus.agents?.[0]?.agentId;
}

export async function liberarAcessoCatracaService(input: {
  tenantId: string;
  alunoId: string;
  justificativa: string;
  issuedBy?: string;
}): Promise<string> {
  const reason = input.justificativa.trim();
  if (!reason) {
    throw new Error("A justificativa é obrigatória.");
  }

  const status = await obterCatracaWsStatusPorTenantApi({
    tenantId: input.tenantId,
  });
  const agentId = resolveOnlineAgentId(status);
  if (!agentId) {
    throw new Error("Nenhum agente da catraca conectado para este tenant.");
  }

  const response = await liberarAcessoCatracaApi({
    agentId,
    memberId: input.alunoId,
    reason,
    issuedBy: input.issuedBy ?? "frontend",
  });
  return response.requestId;
}

export function resolveVendaFluxoStatusFromApi(venda: Venda): StatusFluxoComercial | undefined {
  if (venda.status === "CANCELADA") return "CANCELADO";
  if (venda.pagamento.status === "PENDENTE" || Number(venda.pagamento.valorPago ?? 0) <= 0) {
    return "AGUARDANDO_PAGAMENTO";
  }
  if (venda.contratoStatus === "PENDENTE_ASSINATURA") {
    return "AGUARDANDO_ASSINATURA";
  }
  if (venda.tipo === "PLANO") return "ATIVO";
  return undefined;
}
