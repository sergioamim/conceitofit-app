import { apiRequest } from "./http";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DunningDashboard {
  totalAguardandoIntervencao: number;
  totalInadimplente: number;
  valorTotalPendente: number;
  matriculasEmRisco7Dias: number;
  matriculasParaSuspensao: number;
  diasToleranciaConfigurado: number;
}

export interface DunningIntervencaoItem {
  alunoId: string;
  matriculaId: string;
  contaReceberId: string;
  valor: number;
  vencimento: string;
  numeroDeFalhas: number;
  ultimoMotivo: string | null;
  dataPrevistaSuspensao: string | null;
  gatewaysDisponiveis: string[];
}

export interface DunningTemplate {
  id: string;
  evento: string;
  canal: string;
  assunto: string;
  corpo: string;
  ativo: boolean;
}

export interface GerarLinkPagamentoResponse {
  sucesso: boolean;
  link: string;
  externalId: string;
}

export interface RegularizarResponse {
  status: "regularizado";
}

export interface SuspenderResponse {
  status: "suspensa";
  motivo: string;
}

export interface TentarOutroGatewayResponse {
  sucesso: boolean;
  mensagem: string;
  externalId: string;
}

export interface RegularizarEmLoteResponse {
  regularizadas: number;
  total: number;
}

export type FormaPagamentoDunning = "PIX" | "BOLETO" | "CARTAO_CREDITO";

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function getDunningDashboardApi(input: {
  tenantId: string;
}): Promise<DunningDashboard> {
  return apiRequest<DunningDashboard>({
    path: "/api/v1/financeiro/dunning/dashboard",
    query: { tenantId: input.tenantId },
  });
}

export async function listDunningIntervencoesApi(input: {
  tenantId: string;
  page?: number;
  size?: number;
  dataVencimentoDe?: string;
  dataVencimentoAte?: string;
  valorMinimo?: number;
  busca?: string;
}): Promise<DunningIntervencaoItem[]> {
  return apiRequest<DunningIntervencaoItem[]>({
    path: "/api/v1/financeiro/dunning/intervencao",
    query: {
      tenantId: input.tenantId,
      page: input.page,
      size: input.size,
      dataVencimentoDe: input.dataVencimentoDe,
      dataVencimentoAte: input.dataVencimentoAte,
      valorMinimo: input.valorMinimo,
      busca: input.busca,
    },
  });
}

export async function gerarLinkPagamentoDunningApi(input: {
  tenantId: string;
  contaReceberId: string;
  formaPagamento: FormaPagamentoDunning;
}): Promise<GerarLinkPagamentoResponse> {
  return apiRequest<GerarLinkPagamentoResponse>({
    path: `/api/v1/financeiro/dunning/intervencao/${input.contaReceberId}/gerar-link-pagamento`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: { formaPagamento: input.formaPagamento },
  });
}

export async function regularizarDunningApi(input: {
  tenantId: string;
  contaReceberId: string;
}): Promise<RegularizarResponse> {
  return apiRequest<RegularizarResponse>({
    path: `/api/v1/financeiro/dunning/intervencao/${input.contaReceberId}/regularizar`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

export async function suspenderDunningApi(input: {
  tenantId: string;
  contaReceberId: string;
}): Promise<SuspenderResponse> {
  return apiRequest<SuspenderResponse>({
    path: `/api/v1/financeiro/dunning/intervencao/${input.contaReceberId}/suspender`,
    method: "POST",
    query: { tenantId: input.tenantId },
  });
}

export async function tentarOutroGatewayDunningApi(input: {
  tenantId: string;
  contaReceberId: string;
  gatewayId: string;
}): Promise<TentarOutroGatewayResponse> {
  return apiRequest<TentarOutroGatewayResponse>({
    path: `/api/v1/financeiro/dunning/intervencao/${input.contaReceberId}/tentar-outro-gateway`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: { gatewayId: input.gatewayId },
  });
}

export async function regularizarEmLoteDunningApi(input: {
  tenantId: string;
  contaReceberIds: string[];
}): Promise<RegularizarEmLoteResponse> {
  return apiRequest<RegularizarEmLoteResponse>({
    path: "/api/v1/financeiro/dunning/intervencao/lote/regularizar",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: { contaReceberIds: input.contaReceberIds },
  });
}

export async function listDunningTemplatesApi(input: {
  tenantId: string;
}): Promise<DunningTemplate[]> {
  return apiRequest<DunningTemplate[]>({
    path: "/api/v1/financeiro/dunning/templates",
    query: { tenantId: input.tenantId },
  });
}

export async function updateDunningTemplateApi(input: {
  tenantId: string;
  evento: string;
  canal: string;
  data: { assunto?: string; corpo?: string; ativo?: boolean };
}): Promise<DunningTemplate> {
  return apiRequest<DunningTemplate>({
    path: `/api/v1/financeiro/dunning/templates/${input.evento}/${input.canal}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}
