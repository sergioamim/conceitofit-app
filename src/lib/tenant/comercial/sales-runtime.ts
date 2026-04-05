"use client";

import { listConveniosApi, listVoucherCodigosApi, listVouchersApi, validarVoucherCodigoApi } from "@/lib/api/beneficios";
import {
  listPlanosApi,
  listProdutosApi,
  listServicosApi,
  togglePlanoAtivoApi,
  togglePlanoDestaqueApi,
} from "@/lib/api/comercial-catalogo";
import { listFormasPagamentoApi } from "@/lib/api/formas-pagamento";
import { emitirNfsePagamentoApi, listPagamentosApi, receberPagamentoApi } from "@/lib/api/pagamentos";
import { createVendaApi, listVendasApi, type ListVendasApiEnvelopeResult } from "@/lib/api/vendas";
import { trackNfseEmitted, trackPagamentoReceived } from "@/lib/shared/analytics";
import type {
  Convenio,
  FormaPagamento,
  Pagamento,
  PagamentoVenda,
  Plano,
  Produto,
  Servico,
  StatusFluxoComercial,
  StatusPagamento,
  TipoFormaPagamento,
  TipoPlano,
  TipoVenda,
  Venda,
  Voucher,
  VoucherCodigo,
  VoucherValidacaoResult,
} from "@/lib/types";

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
  const result = await receberPagamentoApi(input);
  trackPagamentoReceived(input.tenantId, result.id, result.valorFinal);
  return result;
}

export async function emitirNfsePagamentoService(input: {
  tenantId: string;
  id: string;
}): Promise<Pagamento> {
  const result = await emitirNfsePagamentoApi(input);
  trackNfseEmitted(input.tenantId, result.id);
  return result;
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

export async function validarVoucherCodigoService(input: {
  codigo: string;
  tenantId?: string;
  clienteId?: string;
  planoId?: string;
}): Promise<VoucherValidacaoResult> {
  return validarVoucherCodigoApi(input);
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

/**
 * Resolve o status de fluxo comercial de uma venda.
 */
export function resolveVendaFluxoStatusFromApi(venda: Venda): StatusFluxoComercial | undefined {
  if (venda.status === "CANCELADA") return "CANCELADO";
  const pagamentoPendente =
    venda.pagamento.status === "PENDENTE" || Number(venda.pagamento.valorPago ?? 0) <= 0;
  if (pagamentoPendente) return "AGUARDANDO_PAGAMENTO";
  const contratoStatus = venda.contratoStatus ?? "SEM_CONTRATO";
  if (contratoStatus === "PENDENTE_ASSINATURA") return "AGUARDANDO_ASSINATURA";
  if (venda.tipo === "PLANO") return "ATIVO";
  return undefined;
}
