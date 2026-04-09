import { apiRequest } from "./http";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IndicacaoStatus = "PENDENTE" | "CONVERTIDA" | "CANCELADA";
export type TipoLancamento = "CREDITO" | "DEBITO";
export type MotivoLancamento =
  | "INDICACAO_CADASTRADA"
  | "INDICACAO_CONVERTIDA"
  | "RESGATE"
  | "AJUSTE_MANUAL";

export interface FidelizacaoCampanha {
  id: string;
  tenantId: string;
  academiaId: string;
  nome: string;
  descricao: string | null;
  pontosIndicacao: number;
  pontosConversao: number;
  ativo: boolean;
  dataInicio: string | null;
  dataFim: string | null;
}

export interface Indicacao {
  id: string;
  campanhaId: string;
  indicadorAlunoId: string;
  indicadorNome: string;
  indicadoNome: string;
  indicadoEmail: string | null;
  indicadoTelefone: string | null;
  prospectId: string | null;
  alunoConvertidoId: string | null;
  status: IndicacaoStatus;
  pontosEmitidos: number;
  observacoes: string | null;
  dataCriacao: string;
  dataConversao: string | null;
}

export interface SaldoResumo {
  alunoId: string;
  alunoNome: string;
  saldoPontos: number;
  totalCreditos: number;
  totalDebitos: number;
}

export interface LancamentoExtrato {
  id: string;
  tipo: TipoLancamento;
  motivo: MotivoLancamento;
  pontos: number;
  saldoApos: number;
  observacao: string | null;
  dataCriacao: string;
}

export interface SaldoDetalhe extends SaldoResumo {
  extrato: LancamentoExtrato[];
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

const BASE = "/api/v1/comercial/fidelizacao";

/** Listar campanhas de fidelizacao */
export async function listCampanhasFidelizacaoApi(input: {
  tenantId: string;
  apenasAtivas?: boolean;
}): Promise<FidelizacaoCampanha[]> {
  return apiRequest<FidelizacaoCampanha[]>({
    path: `${BASE}/campanhas`,
    query: { tenantId: input.tenantId, apenasAtivas: input.apenasAtivas },
  });
}

/** Criar campanha de fidelizacao */
export async function createCampanhaFidelizacaoApi(input: {
  tenantId: string;
  data: {
    nome: string;
    descricao?: string;
    pontosIndicacao: number;
    pontosConversao: number;
    ativo?: boolean;
    dataInicio?: string;
    dataFim?: string;
  };
}): Promise<FidelizacaoCampanha> {
  return apiRequest<FidelizacaoCampanha>({
    path: `${BASE}/campanhas`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

/** Atualizar campanha de fidelizacao */
export async function updateCampanhaFidelizacaoApi(input: {
  tenantId: string;
  id: string;
  data: Partial<{
    nome: string;
    descricao: string;
    pontosIndicacao: number;
    pontosConversao: number;
    ativo: boolean;
    dataInicio: string;
    dataFim: string;
  }>;
}): Promise<FidelizacaoCampanha> {
  return apiRequest<FidelizacaoCampanha>({
    path: `${BASE}/campanhas/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

/** Listar indicacoes */
export async function listIndicacoesApi(input: {
  tenantId: string;
  status?: IndicacaoStatus;
}): Promise<Indicacao[]> {
  return apiRequest<Indicacao[]>({
    path: `${BASE}/indicacoes`,
    query: { tenantId: input.tenantId, status: input.status },
  });
}

/** Criar indicacao */
export async function createIndicacaoApi(input: {
  tenantId: string;
  data: {
    campanhaId: string;
    indicadorAlunoId: string;
    indicadoNome: string;
    indicadoEmail?: string;
    indicadoTelefone?: string;
    prospectId?: string;
    observacoes?: string;
  };
}): Promise<Indicacao> {
  return apiRequest<Indicacao>({
    path: `${BASE}/indicacoes`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

/** Converter indicacao */
export async function converterIndicacaoApi(input: {
  tenantId: string;
  id: string;
  data: {
    alunoConvertidoId?: string;
    prospectId?: string;
    observacoes?: string;
  };
}): Promise<Indicacao> {
  return apiRequest<Indicacao>({
    path: `${BASE}/indicacoes/${input.id}/converter`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

/** Listar saldos de pontos */
export async function listSaldosFidelizacaoApi(input: {
  tenantId: string;
}): Promise<SaldoResumo[]> {
  return apiRequest<SaldoResumo[]>({
    path: `${BASE}/saldos`,
    query: { tenantId: input.tenantId },
  });
}

/** Detalhe do saldo de um aluno (com extrato) */
export async function getSaldoDetalheFidelizacaoApi(input: {
  tenantId: string;
  alunoId: string;
}): Promise<SaldoDetalhe> {
  return apiRequest<SaldoDetalhe>({
    path: `${BASE}/saldos/${input.alunoId}`,
    query: { tenantId: input.tenantId },
  });
}

/** Resgatar pontos de fidelizacao */
export async function resgatarPontosFidelizacaoApi(input: {
  tenantId: string;
  alunoId: string;
  data: {
    pontos: number;
    descricao?: string;
  };
}): Promise<{ saldoAtual: number }> {
  return apiRequest<{ saldoAtual: number }>({
    path: `${BASE}/saldos/${input.alunoId}/resgates`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}
