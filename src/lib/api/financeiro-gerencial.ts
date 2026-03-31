import type {
  CategoriaContaPagar,
  ContaPagar,
  DREProjecao,
  DREGerencial,
  DreProjectionScenario,
  GrupoDre,
  RecorrenciaContaPagar,
  RegraRecorrenciaContaPagar,
  StatusContaPagar,
  StatusRegraRecorrenciaContaPagar,
  TerminoRecorrenciaContaPagar,
  TipoFormaPagamento,
} from "@/lib/types";
import { apiRequest } from "./http";

type ListContasPagarApiInput = {
  tenantId: string;
  status?: StatusContaPagar;
  categoria?: CategoriaContaPagar;
  tipoContaId?: string;
  grupoDre?: GrupoDre;
  origem?: ContaPagar["origemLancamento"];
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
};

type CreateContaPagarApiInput = {
  tipoContaId?: string;
  fornecedor: string;
  documentoFornecedor?: string;
  descricao: string;
  categoria?: CategoriaContaPagar;
  grupoDre?: GrupoDre;
  centroCusto?: string;
  regime?: ContaPagar["regime"];
  competencia: string;
  dataEmissao?: string;
  dataVencimento: string;
  valorOriginal: number;
  desconto?: number;
  jurosMulta?: number;
  observacoes?: string;
  recorrencia?: {
    tipo: RecorrenciaContaPagar;
    intervaloDias?: number;
    diaDoMes?: number;
    dataInicial: string;
    termino: TerminoRecorrenciaContaPagar;
    dataFim?: string;
    numeroOcorrencias?: number;
    criarLancamentoInicial: boolean;
    timezone?: string;
  };
};

type UpdateContaPagarApiInput = Partial<Omit<ContaPagar, "id" | "tenantId" | "dataCriacao">>;

type PagarContaPagarApiInput = {
  dataPagamento: string;
  formaPagamento: TipoFormaPagamento;
  valorPago?: number;
  observacoes?: string;
};

type RegraRecorrenciaStatusApiFilter = StatusRegraRecorrenciaContaPagar | "TODAS";

type RegraRecorrenciaApiResponse = {
  id: string;
  tenantId: string;
  tipoContaId: string;
  fornecedor: string;
  documentoFornecedor?: string | null;
  descricao: string;
  categoriaOperacional: CategoriaContaPagar;
  grupoDre: GrupoDre;
  centroCusto?: string | null;
  valorOriginal: number;
  desconto: number;
  jurosMulta: number;
  recorrencia: RecorrenciaContaPagar;
  intervaloDias?: number | null;
  diaDoMes?: number | null;
  dataInicial: string;
  termino: TerminoRecorrenciaContaPagar;
  dataFim?: string | null;
  numeroOcorrencias?: number | null;
  criarLancamentoInicial: boolean;
  timezone?: string | null;
  status: StatusRegraRecorrenciaContaPagar;
  ultimaGeracaoEm?: string | null;
  dataCriacao: string;
  dataAtualizacao?: string | null;
};

type ContaPagarApiResponse = {
  id: string;
  tenantId: string;
  tipoContaId?: string | null;
  regraRecorrenciaId?: string | null;
  fornecedor: string;
  documentoFornecedor?: string | null;
  descricao: string;
  categoria: CategoriaContaPagar;
  grupoDre?: GrupoDre | null;
  centroCusto?: string | null;
  regime: ContaPagar["regime"];
  competencia: string;
  dataEmissao?: string | null;
  dataVencimento: string;
  dataPagamento?: string | null;
  valorOriginal: number;
  desconto: number;
  jurosMulta: number;
  valorPago?: number | null;
  formaPagamento?: TipoFormaPagamento | null;
  status: StatusContaPagar;
  geradaAutomaticamente: boolean;
  origemLancamento?: "MANUAL" | "RECORRENTE" | null;
  observacoes?: string | null;
  dataCriacao: string;
  dataAtualizacao?: string | null;
};

type DreApiResponse = {
  periodoInicio: string;
  periodoFim: string;
  receitaBruta: number;
  deducoesReceita: number;
  receitaLiquida: number;
  custosVariaveis: number;
  margemContribuicao: number;
  despesasOperacionais: number;
  ebitda: number;
  resultadoLiquido: number;
  ticketMedio: number;
  inadimplencia: number;
  contasReceberEmAberto: number;
  contasPagarEmAberto: number;
  despesasPorGrupo: Array<{ grupo: GrupoDre; valor: number }>;
  despesasPorCategoria: Array<{ categoria: CategoriaContaPagar; valor: number }>;
  despesasSemTipoCount: number;
  despesasSemTipoValor: number;
};

type DreProjecaoApiResponse = {
  periodoInicio: string;
  periodoFim: string;
  cenario: DreProjectionScenario;
  realizado: {
    receitas: number;
    despesas: number;
    resultado: number;
    custosVariaveis: number;
    despesasOperacionais: number;
    despesasFinanceiras: number;
    impostos: number;
  };
  projetado: {
    receitas: number;
    despesas: number;
    resultado: number;
    custosVariaveis: number;
    despesasOperacionais: number;
    despesasFinanceiras: number;
    impostos: number;
  };
  consolidado: {
    receitas: number;
    despesas: number;
    resultado: number;
    custosVariaveis: number;
    despesasOperacionais: number;
    despesasFinanceiras: number;
    impostos: number;
  };
  linhas: Array<{
    grupo: string;
    natureza: "RECEITA" | "DESPESA";
    realizado: number;
    projetado: number;
    consolidado: number;
  }>;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function normalizeRegraRecorrencia(input: RegraRecorrenciaApiResponse): RegraRecorrenciaContaPagar {
  return {
    id: input.id,
    tenantId: input.tenantId,
    tipoContaId: input.tipoContaId,
    fornecedor: input.fornecedor,
    documentoFornecedor: input.documentoFornecedor ?? undefined,
    descricao: input.descricao,
    categoriaOperacional: input.categoriaOperacional,
    grupoDre: input.grupoDre,
    centroCusto: input.centroCusto ?? undefined,
    valorOriginal: toNumber(input.valorOriginal),
    desconto: toNumber(input.desconto),
    jurosMulta: toNumber(input.jurosMulta),
    recorrencia: input.recorrencia,
    intervaloDias: input.intervaloDias == null ? undefined : Math.max(1, Number(input.intervaloDias)),
    diaDoMes: input.diaDoMes == null ? undefined : Math.max(1, Number(input.diaDoMes)),
    dataInicial: input.dataInicial,
    termino: input.termino,
    dataFim: input.dataFim ?? undefined,
    numeroOcorrencias: input.numeroOcorrencias == null ? undefined : Math.max(1, Number(input.numeroOcorrencias)),
    criarLancamentoInicial: Boolean(input.criarLancamentoInicial),
    timezone: input.timezone ?? undefined,
    status: input.status,
    ultimaGeracaoEm: input.ultimaGeracaoEm ?? undefined,
    dataCriacao: input.dataCriacao,
    dataAtualizacao: input.dataAtualizacao ?? undefined,
  };
}

function normalizeContaPagar(input: ContaPagarApiResponse): ContaPagar {
  return {
    id: input.id,
    tenantId: input.tenantId,
    tipoContaId: input.tipoContaId ?? undefined,
    regraRecorrenciaId: input.regraRecorrenciaId ?? undefined,
    fornecedor: input.fornecedor,
    documentoFornecedor: input.documentoFornecedor ?? undefined,
    descricao: input.descricao,
    categoria: input.categoria,
    grupoDre: input.grupoDre ?? undefined,
    centroCusto: input.centroCusto ?? undefined,
    regime: input.regime,
    competencia: input.competencia,
    dataEmissao: input.dataEmissao ?? undefined,
    dataVencimento: input.dataVencimento,
    dataPagamento: input.dataPagamento ?? undefined,
    valorOriginal: toNumber(input.valorOriginal),
    desconto: toNumber(input.desconto),
    jurosMulta: toNumber(input.jurosMulta),
    valorPago: input.valorPago == null ? undefined : toNumber(input.valorPago),
    formaPagamento: input.formaPagamento ?? undefined,
    status: input.status,
    geradaAutomaticamente: Boolean(input.geradaAutomaticamente),
    origemLancamento: input.origemLancamento ?? undefined,
    observacoes: input.observacoes ?? undefined,
    dataCriacao: input.dataCriacao,
    dataAtualizacao: input.dataAtualizacao ?? undefined,
  };
}

function normalizeDre(input: DreApiResponse): DREGerencial {
  return {
    periodoInicio: input.periodoInicio,
    periodoFim: input.periodoFim,
    receitaBruta: toNumber(input.receitaBruta),
    deducoesReceita: toNumber(input.deducoesReceita),
    receitaLiquida: toNumber(input.receitaLiquida),
    custosVariaveis: toNumber(input.custosVariaveis),
    margemContribuicao: toNumber(input.margemContribuicao),
    despesasOperacionais: toNumber(input.despesasOperacionais),
    ebitda: toNumber(input.ebitda),
    resultadoLiquido: toNumber(input.resultadoLiquido),
    ticketMedio: toNumber(input.ticketMedio),
    inadimplencia: toNumber(input.inadimplencia),
    contasReceberEmAberto: toNumber(input.contasReceberEmAberto),
    contasPagarEmAberto: toNumber(input.contasPagarEmAberto),
    despesasPorGrupo: (input.despesasPorGrupo ?? []).map((item) => ({
      grupo: item.grupo,
      valor: toNumber(item.valor),
    })),
    despesasPorCategoria: (input.despesasPorCategoria ?? []).map((item) => ({
      categoria: item.categoria,
      valor: toNumber(item.valor),
    })),
    despesasSemTipoCount: Math.max(0, Number(input.despesasSemTipoCount ?? 0)),
    despesasSemTipoValor: toNumber(input.despesasSemTipoValor),
  };
}

function normalizeDreProjecao(input: DreProjecaoApiResponse): DREProjecao {
  return {
    periodoInicio: input.periodoInicio,
    periodoFim: input.periodoFim,
    cenario: input.cenario,
    realizado: {
      receitas: toNumber(input.realizado.receitas),
      despesas: toNumber(input.realizado.despesas),
      resultado: toNumber(input.realizado.resultado),
      custosVariaveis: toNumber(input.realizado.custosVariaveis),
      despesasOperacionais: toNumber(input.realizado.despesasOperacionais),
      despesasFinanceiras: toNumber(input.realizado.despesasFinanceiras),
      impostos: toNumber(input.realizado.impostos),
    },
    projetado: {
      receitas: toNumber(input.projetado.receitas),
      despesas: toNumber(input.projetado.despesas),
      resultado: toNumber(input.projetado.resultado),
      custosVariaveis: toNumber(input.projetado.custosVariaveis),
      despesasOperacionais: toNumber(input.projetado.despesasOperacionais),
      despesasFinanceiras: toNumber(input.projetado.despesasFinanceiras),
      impostos: toNumber(input.projetado.impostos),
    },
    consolidado: {
      receitas: toNumber(input.consolidado.receitas),
      despesas: toNumber(input.consolidado.despesas),
      resultado: toNumber(input.consolidado.resultado),
      custosVariaveis: toNumber(input.consolidado.custosVariaveis),
      despesasOperacionais: toNumber(input.consolidado.despesasOperacionais),
      despesasFinanceiras: toNumber(input.consolidado.despesasFinanceiras),
      impostos: toNumber(input.consolidado.impostos),
    },
    linhas: (input.linhas ?? []).map((item) => ({
      grupo: item.grupo,
      natureza: item.natureza,
      realizado: toNumber(item.realizado),
      projetado: toNumber(item.projetado),
      consolidado: toNumber(item.consolidado),
    })),
  };
}

export async function listRegrasRecorrenciaContaPagarApi(input: {
  tenantId: string;
  status?: RegraRecorrenciaStatusApiFilter;
  page?: number;
  size?: number;
}): Promise<RegraRecorrenciaContaPagar[]> {
  const response = await apiRequest<RegraRecorrenciaApiResponse[]>({
    path: "/api/v1/gerencial/financeiro/regras-recorrencia",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      page: input.page,
      size: input.size,
    },
  });
  return response.map(normalizeRegraRecorrencia);
}

export async function pauseRegraRecorrenciaApi(input: {
  tenantId: string;
  id: string;
}): Promise<RegraRecorrenciaContaPagar> {
  const response = await apiRequest<RegraRecorrenciaApiResponse>({
    path: `/api/v1/gerencial/financeiro/regras-recorrencia/${input.id}/pausar`,
    method: "PATCH",
    query: { tenantId: input.tenantId },
  });
  return normalizeRegraRecorrencia(response);
}

export async function resumeRegraRecorrenciaApi(input: {
  tenantId: string;
  id: string;
}): Promise<RegraRecorrenciaContaPagar> {
  const response = await apiRequest<RegraRecorrenciaApiResponse>({
    path: `/api/v1/gerencial/financeiro/regras-recorrencia/${input.id}/retomar`,
    method: "PATCH",
    query: { tenantId: input.tenantId },
  });
  return normalizeRegraRecorrencia(response);
}

export async function cancelRegraRecorrenciaApi(input: {
  tenantId: string;
  id: string;
}): Promise<RegraRecorrenciaContaPagar> {
  const response = await apiRequest<RegraRecorrenciaApiResponse>({
    path: `/api/v1/gerencial/financeiro/regras-recorrencia/${input.id}/cancelar`,
    method: "PATCH",
    query: { tenantId: input.tenantId },
  });
  return normalizeRegraRecorrencia(response);
}

export async function triggerGeracaoContasRecorrentesApi(input: {
  tenantId: string;
  untilDate?: string;
}): Promise<number> {
  const response = await apiRequest<{ generatedCount: number }>({
    path: "/api/v1/gerencial/financeiro/contas-pagar/recorrencia/gerar",
    method: "POST",
    query: {
      tenantId: input.tenantId,
      untilDate: input.untilDate,
    },
  });
  return Math.max(0, Number(response.generatedCount ?? 0));
}

export async function listContasPagarApi(input: ListContasPagarApiInput): Promise<ContaPagar[]> {
  const response = await apiRequest<ContaPagarApiResponse[]>({
    path: "/api/v1/gerencial/financeiro/contas-pagar",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      categoria: input.categoria,
      tipoContaId: input.tipoContaId,
      grupoDre: input.grupoDre,
      origem: input.origem,
      startDate: input.startDate,
      endDate: input.endDate,
      page: input.page,
      size: input.size,
    },
  });
  return response.map(normalizeContaPagar);
}

export async function createContaPagarApi(input: {
  tenantId: string;
  data: CreateContaPagarApiInput;
}): Promise<ContaPagar | null> {
  const response = await apiRequest<ContaPagarApiResponse | null>({
    path: "/api/v1/gerencial/financeiro/contas-pagar",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
  return response ? normalizeContaPagar(response) : null;
}

export async function updateContaPagarApi(input: {
  tenantId: string;
  id: string;
  data: UpdateContaPagarApiInput;
}): Promise<ContaPagar> {
  const response = await apiRequest<ContaPagarApiResponse>({
    path: `/api/v1/gerencial/financeiro/contas-pagar/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
  return normalizeContaPagar(response);
}

export async function pagarContaPagarApi(input: {
  tenantId: string;
  id: string;
  data: PagarContaPagarApiInput;
}): Promise<ContaPagar> {
  const response = await apiRequest<ContaPagarApiResponse>({
    path: `/api/v1/gerencial/financeiro/contas-pagar/${input.id}/pagar`,
    method: "PATCH",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
  return normalizeContaPagar(response);
}

export async function cancelarContaPagarApi(input: {
  tenantId: string;
  id: string;
  observacoes?: string;
}): Promise<ContaPagar> {
  const response = await apiRequest<ContaPagarApiResponse>({
    path: `/api/v1/gerencial/financeiro/contas-pagar/${input.id}/cancelar`,
    method: "PATCH",
    query: { tenantId: input.tenantId },
    body: input.observacoes ? { observacoes: input.observacoes } : undefined,
  });
  return normalizeContaPagar(response);
}

export async function getDreGerencialApi(input: {
  tenantId: string;
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}): Promise<DREGerencial> {
  const response = await apiRequest<DreApiResponse>({
    path: "/api/v1/gerencial/financeiro/dre",
    query: {
      tenantId: input.tenantId,
      month: input.month,
      year: input.year,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
  return normalizeDre(response);
}

export async function getDreProjecaoApi(input: {
  tenantId: string;
  startDate?: string;
  endDate?: string;
  cenario?: DreProjectionScenario;
}): Promise<DREProjecao> {
  const response = await apiRequest<DreProjecaoApiResponse>({
    path: "/api/v1/gerencial/financeiro/dre/projecao",
    query: {
      tenantId: input.tenantId,
      startDate: input.startDate,
      endDate: input.endDate,
      cenario: input.cenario,
    },
  });
  return normalizeDreProjecao(response);
}
