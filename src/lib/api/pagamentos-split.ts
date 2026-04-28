/**
 * API client para Pagamento Split (multi-forma).
 * PRD: docs/PRD_PAGAMENTO_SPLIT.md
 */
import { apiRequest } from "./http";

export type FormaPagamentoSplit =
  | "DINHEIRO"
  | "PIX"
  | "CARTAO_CREDITO"
  | "CARTAO_DEBITO"
  | "BOLETO"
  | "CREDITO_INTERNO";

export type StatusParcela = "PENDENTE" | "CONFIRMADO" | "FALHOU";

export type OrigemParcela = "MANUAL_OFFLINE" | "TEF" | "ONLINE";

export interface ParcelaInputDto {
  forma: FormaPagamentoSplit;
  valor: number;
  numeroParcelas?: number;
  bandeira?: string;
  codigoAutorizacao?: string;
  observacao?: string;
}

export interface CriarPagamentoSplitInput {
  alunoId?: string;
  matriculaId?: string;
  operadorId?: string;
  tipo?: "MATRICULA" | "MENSALIDADE" | "TAXA" | "PRODUTO" | "AVULSO";
  descricao?: string;
  valor: number;
  desconto?: number;
  dataVencimento?: string;
  observacoes?: string;
  parcelas: ParcelaInputDto[];
}

export interface ParcelaResponseDto {
  id: string;
  pagamentoId: string;
  ordem: number;
  forma: FormaPagamentoSplit;
  valor: number;
  numeroParcelas: number;
  bandeira: string | null;
  codigoAutorizacao: string | null;
  status: StatusParcela;
  origem: OrigemParcela;
  confirmadoEm: string | null;
  confirmadoPor: string | null;
  estornadoEm: string | null;
  estornadoPor: string | null;
  motivoEstorno: string | null;
  observacao: string | null;
}

export interface PagamentoSplitResponseDto {
  id: string;
  tenantId: string;
  alunoId: string | null;
  matriculaId: string | null;
  tipo: string | null;
  descricao: string | null;
  valor: number;
  desconto: number;
  valorFinal: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO";
  dataCriacao: string;
  parcelas: ParcelaResponseDto[];
}

const toNumber = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

function normalizeParcela(p: ParcelaResponseDto): ParcelaResponseDto {
  return {
    ...p,
    valor: toNumber(p.valor),
    numeroParcelas: toNumber(p.numeroParcelas, 1),
  };
}

function normalize(r: PagamentoSplitResponseDto): PagamentoSplitResponseDto {
  return {
    ...r,
    valor: toNumber(r.valor),
    desconto: toNumber(r.desconto),
    valorFinal: toNumber(r.valorFinal),
    parcelas: (r.parcelas ?? []).map(normalizeParcela),
  };
}

export async function criarPagamentoSplitApi(
  tenantId: string,
  input: CriarPagamentoSplitInput,
): Promise<PagamentoSplitResponseDto> {
  const data = await apiRequest<PagamentoSplitResponseDto>({
    path: "/api/v1/comercial/pagamentos/split",
    method: "POST",
    query: { tenantId },
    body: input,
  });
  return normalize(data);
}

export async function quitarComSplitApi(
  tenantId: string,
  pagamentoId: string,
  input: { operadorId?: string; parcelas: ParcelaInputDto[] },
): Promise<PagamentoSplitResponseDto> {
  const data = await apiRequest<PagamentoSplitResponseDto>({
    path: `/api/v1/comercial/pagamentos/${pagamentoId}/quitar-com-split`,
    method: "POST",
    query: { tenantId },
    body: input,
  });
  return normalize(data);
}

export async function listarParcelasApi(
  tenantId: string,
  pagamentoId: string,
): Promise<ParcelaResponseDto[]> {
  const data = await apiRequest<ParcelaResponseDto[]>({
    path: `/api/v1/comercial/pagamentos/${pagamentoId}/parcelas`,
    method: "GET",
    query: { tenantId },
  });
  return (data ?? []).map(normalizeParcela);
}

export async function confirmarParcelaApi(
  tenantId: string,
  pagamentoId: string,
  parcelaId: string,
  input: { operadorId?: string; codigoAutorizacao?: string; observacao?: string },
): Promise<ParcelaResponseDto> {
  const data = await apiRequest<ParcelaResponseDto>({
    path: `/api/v1/comercial/pagamentos/${pagamentoId}/parcelas/${parcelaId}/confirmar`,
    method: "PATCH",
    query: { tenantId },
    body: input,
  });
  return normalizeParcela(data);
}

export async function estornarParcelaApi(
  tenantId: string,
  pagamentoId: string,
  parcelaId: string,
  input: { operadorId?: string; motivo: string },
): Promise<ParcelaResponseDto> {
  const data = await apiRequest<ParcelaResponseDto>({
    path: `/api/v1/comercial/pagamentos/${pagamentoId}/parcelas/${parcelaId}`,
    method: "DELETE",
    query: { tenantId },
    body: input,
  });
  return normalizeParcela(data);
}

// =========================================================================
// Relatorio caixa diario (W6)
// =========================================================================

export interface LinhaReconciliacaoDto {
  parcelaId: string;
  valor: number;
  codigoAutorizacao: string;
  bandeira: string | null;
  numeroParcelas: number;
  confirmadoEm: string;
}

export interface FormaTotalDto {
  forma: FormaPagamentoSplit;
  total: number;
  qtd: number;
  reconciliacao: LinhaReconciliacaoDto[];
}

export interface RelatorioCaixaDiarioDto {
  tenantId: string;
  data: string;
  totalGeral: number;
  qtdParcelasConfirmadas: number;
  formas: FormaTotalDto[];
}

export async function obterRelatorioCaixaDiarioApi(
  tenantId: string,
  data?: string,
): Promise<RelatorioCaixaDiarioDto> {
  const result = await apiRequest<RelatorioCaixaDiarioDto>({
    path: "/api/v1/comercial/pagamentos/relatorio-caixa-diario",
    method: "GET",
    query: { tenantId, ...(data ? { data } : {}) },
  });
  return {
    ...result,
    totalGeral: toNumber(result.totalGeral),
    formas: (result.formas ?? []).map((f) => ({
      ...f,
      total: toNumber(f.total),
      reconciliacao: (f.reconciliacao ?? []).map((r) => ({
        ...r,
        valor: toNumber(r.valor),
        numeroParcelas: toNumber(r.numeroParcelas, 1),
      })),
    })),
  };
}

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamentoSplit, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
  BOLETO: "Boleto",
  CREDITO_INTERNO: "Crédito Interno",
};
