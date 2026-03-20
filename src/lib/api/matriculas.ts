import type { Aluno, Matricula, PaginatedResult, PagamentoResumo, Plano, TipoFormaPagamento } from "@/lib/types";
import { ApiRequestError, apiRequest, apiRequestWithMeta } from "./http";

export type MatriculaResponse = {
  id?: string;
  tenantId?: string;
  clienteId?: string | null;
  alunoId?: string | null;
  planoId?: string | null;
  dataInicio?: string;
  dataFim?: string;
  valorPago?: unknown;
  valorMatricula?: unknown;
  desconto?: unknown;
  motivoDesconto?: string | null;
  formaPagamento?: TipoFormaPagamento | null;
  status?: Matricula["status"] | null;
  renovacaoAutomatica?: unknown;
  observacoes?: string | null;
  dataCriacao?: string;
  dataAtualizacao?: string | null;
  convenioId?: string | null;
  contratoStatus?: Matricula["contratoStatus"] | null;
  contratoAdesaoStatus?: Matricula["contratoStatus"] | null;
  contratoModoAssinatura?: Plano["contratoAssinatura"] | null;
  contratoEnviadoAutomaticamente?: unknown;
  contratoUltimoEnvioEm?: string | null;
  contratoAssinadoEm?: string | null;
  cliente?: Partial<Aluno> | null;
  aluno?: Partial<Aluno> | null;
  plano?: Partial<Plano> | null;
  pagamento?: {
    id?: string;
    status?: PagamentoResumo["status"] | null;
    valorFinal?: unknown;
    dataVencimento?: string | null;
    dataPagamento?: string | null;
    formaPagamento?: TipoFormaPagamento | null;
  } | null;
};

const LIST_ADESOES_PATH = "/api/v1/comercial/adesoes";
const LIST_MATRICULAS_PATH = "/api/v1/comercial/matriculas";

function canFallbackToLegacyMatriculas(error: unknown): boolean {
  return error instanceof ApiRequestError && [404, 405, 501].includes(error.status);
}

async function requestMatriculasList(
  paths: string[],
  query: Record<string, string | number | boolean | undefined>
): Promise<MatriculaResponse[]> {
  let lastError: unknown;

  for (const path of paths) {
    try {
      return await apiRequest<MatriculaResponse[]>({
        path,
        query,
      });
    } catch (error) {
      if (canFallbackToLegacyMatriculas(error)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Não foi possível carregar as adesões.");
}

async function requestMatriculasListWithMeta(
  paths: string[],
  query: Record<string, string | number | boolean | undefined>
): Promise<{ data: MatriculaResponse[]; headers: Record<string, string> }> {
  let lastError: unknown;

  for (const path of paths) {
    try {
      return await apiRequestWithMeta<MatriculaResponse[]>({
        path,
        query,
      });
    } catch (error) {
      if (canFallbackToLegacyMatriculas(error)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Não foi possível carregar as adesões.");
}

export type CreateMatriculaApiInput = {
  alunoId: string;
  planoId: string;
  dataInicio: string;
  valorPago: number;
  valorMatricula?: number;
  desconto?: number;
  motivoDesconto?: string;
  formaPagamento: TipoFormaPagamento;
  renovacaoAutomatica?: boolean;
  observacoes?: string;
  convenioId?: string;
  dataPagamento?: string;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim"].includes(normalized)) return true;
    if (["false", "0", "nao", "não"].includes(normalized)) return false;
  }
  if (typeof value === "number") return value === 1;
  return fallback;
};

function normalizeAlunoEmbedded(input?: Partial<Aluno> | null): Aluno | undefined {
  if (!input || typeof input !== "object" || typeof input.id !== "string") {
    return undefined;
  }

  return {
    id: input.id,
    tenantId: typeof input.tenantId === "string" ? input.tenantId : "",
    prospectId: input.prospectId,
    nome: typeof input.nome === "string" ? input.nome : "",
    pendenteComplementacao: input.pendenteComplementacao ?? false,
    email: typeof input.email === "string" ? input.email : "",
    telefone: typeof input.telefone === "string" ? input.telefone : "",
    telefoneSec: input.telefoneSec,
    cpf: typeof input.cpf === "string" ? input.cpf : "",
    rg: input.rg,
    dataNascimento: typeof input.dataNascimento === "string" ? input.dataNascimento : "1900-01-01",
    sexo: input.sexo ?? "OUTRO",
    endereco: input.endereco,
    contatoEmergencia: input.contatoEmergencia,
    observacoesMedicas: input.observacoesMedicas,
    foto: input.foto,
    status: input.status ?? "ATIVO",
    suspensao: input.suspensao,
    suspensoes: input.suspensoes,
    dataCadastro: typeof input.dataCadastro === "string" ? input.dataCadastro : new Date().toISOString(),
    dataAtualizacao: input.dataAtualizacao,
  };
}

function normalizePlanoEmbedded(input: Partial<Plano> | null | undefined, tenantId: string): Plano | undefined {
  if (!input || typeof input !== "object" || typeof input.id !== "string") {
    return undefined;
  }

  return {
    id: input.id,
    tenantId,
    nome: typeof input.nome === "string" ? input.nome : "",
    descricao: typeof input.descricao === "string" ? input.descricao : undefined,
    tipo: input.tipo ?? "MENSAL",
    duracaoDias: typeof input.duracaoDias === "number" ? input.duracaoDias : 30,
    valor: typeof input.valor === "number" ? input.valor : 0,
    valorMatricula: typeof input.valorMatricula === "number" ? input.valorMatricula : 0,
    cobraAnuidade: input.cobraAnuidade ?? false,
    valorAnuidade: input.valorAnuidade,
    parcelasMaxAnuidade: input.parcelasMaxAnuidade,
    permiteRenovacaoAutomatica: input.permiteRenovacaoAutomatica ?? true,
    permiteCobrancaRecorrente: input.permiteCobrancaRecorrente ?? false,
    diaCobrancaPadrao: input.diaCobrancaPadrao,
    contratoTemplateHtml: input.contratoTemplateHtml,
    contratoAssinatura: input.contratoAssinatura ?? "AMBAS",
    contratoEnviarAutomaticoEmail: input.contratoEnviarAutomaticoEmail ?? false,
    atividades: input.atividades,
    beneficios: input.beneficios,
    destaque: input.destaque ?? false,
    ativo: input.ativo ?? true,
    ordem: input.ordem,
  };
}

function normalizePagamentoResumoEmbedded(
  input: MatriculaResponse["pagamento"]
): PagamentoResumo | undefined {
  if (!input || typeof input !== "object" || typeof input.id !== "string") {
    return undefined;
  }

  return {
    id: input.id,
    status: input.status ?? "PENDENTE",
    valorFinal: toNumber(input.valorFinal),
    dataVencimento: typeof input.dataVencimento === "string" ? input.dataVencimento : undefined,
    dataPagamento: typeof input.dataPagamento === "string" ? input.dataPagamento : undefined,
    formaPagamento: input.formaPagamento ?? undefined,
  };
}

function getHeaderNumber(headers: Record<string, string>, key: string): number | undefined {
  const raw = headers[key];
  if (typeof raw !== "string" || raw.trim() === "") {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeMatriculaApiResponse(input: MatriculaResponse): Matricula & {
  aluno?: Aluno;
  plano?: Plano;
} {
  const tenantId = typeof input.tenantId === "string" ? input.tenantId : "";
  const aluno = normalizeAlunoEmbedded(input.aluno ?? input.cliente);
  const plano = normalizePlanoEmbedded(input.plano, tenantId);
  const pagamento = normalizePagamentoResumoEmbedded(input.pagamento);

  return {
    id: typeof input.id === "string" ? input.id : "",
    tenantId,
    alunoId:
      typeof input.alunoId === "string"
        ? input.alunoId
        : typeof input.clienteId === "string"
          ? input.clienteId
          : aluno?.id ?? "",
    planoId: typeof input.planoId === "string" ? input.planoId : plano?.id ?? "",
    aluno,
    plano,
    dataInicio: typeof input.dataInicio === "string" ? input.dataInicio : "",
    dataFim: typeof input.dataFim === "string" ? input.dataFim : "",
    valorPago: toNumber(input.valorPago),
    valorMatricula: toNumber(input.valorMatricula),
    desconto: toNumber(input.desconto),
    motivoDesconto: typeof input.motivoDesconto === "string" ? input.motivoDesconto : undefined,
    formaPagamento: input.formaPagamento ?? "PIX",
    status: input.status ?? "ATIVA",
    renovacaoAutomatica: toBoolean(input.renovacaoAutomatica, false),
    observacoes: typeof input.observacoes === "string" ? input.observacoes : undefined,
    contratoStatus: input.contratoStatus ?? input.contratoAdesaoStatus ?? undefined,
    contratoModoAssinatura: input.contratoModoAssinatura ?? undefined,
    contratoEnviadoAutomaticamente: toBoolean(input.contratoEnviadoAutomaticamente, false),
    contratoUltimoEnvioEm:
      typeof input.contratoUltimoEnvioEm === "string" ? input.contratoUltimoEnvioEm : undefined,
    contratoAssinadoEm:
      typeof input.contratoAssinadoEm === "string" ? input.contratoAssinadoEm : undefined,
    pagamento,
    dataCriacao: typeof input.dataCriacao === "string" ? input.dataCriacao : new Date().toISOString(),
    dataAtualizacao: typeof input.dataAtualizacao === "string" ? input.dataAtualizacao : undefined,
    convenioId: typeof input.convenioId === "string" ? input.convenioId : undefined,
  };
}

export type MatriculaPageResult = PaginatedResult<Matricula & { aluno?: Aluno; plano?: Plano }>;

export type MatriculaDashboardMensalResumo = {
  totalContratos: number;
  contratosAtivos: number;
  percentualAtivos: number;
  receitaContratada: number;
  ticketMedio: number;
  pendentesAssinatura: number;
  insight: string;
};

export type MatriculaDashboardMensalPlano = {
  planoId?: string;
  planoNome: string;
  quantidade: number;
  valor: number;
  percentual: number;
};

export type MatriculaDashboardMensalContratosPage = {
  items: Array<Matricula & { aluno?: Aluno; plano?: Plano }>;
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type MatriculaDashboardMensalResult = {
  mes: string;
  resumo: MatriculaDashboardMensalResumo;
  carteiraAtivaPorPlano: MatriculaDashboardMensalPlano[];
  contratos: MatriculaDashboardMensalContratosPage;
};

type MatriculaDashboardMensalResumoResponse = {
  totalContratos?: unknown;
  contratosAtivos?: unknown;
  percentualAtivos?: unknown;
  receitaContratada?: unknown;
  ticketMedio?: unknown;
  pendentesAssinatura?: unknown;
  insight?: string | null;
};

type MatriculaDashboardMensalPlanoResponse = {
  planoId?: string | null;
  planoNome?: string | null;
  quantidade?: unknown;
  valor?: unknown;
  percentual?: unknown;
};

type MatriculaDashboardMensalContratosPageResponse = {
  items?: MatriculaResponse[] | null;
  page?: unknown;
  size?: unknown;
  totalItems?: unknown;
  totalPages?: unknown;
};

type MatriculaDashboardMensalResponse = {
  mes?: string | null;
  resumo?: MatriculaDashboardMensalResumoResponse | null;
  carteiraAtivaPorPlano?: MatriculaDashboardMensalPlanoResponse[] | null;
  contratos?: MatriculaDashboardMensalContratosPageResponse | null;
};

function normalizeMatriculaDashboardMensalResumo(
  input?: MatriculaDashboardMensalResumoResponse | null
): MatriculaDashboardMensalResumo {
  return {
    totalContratos: toNumber(input?.totalContratos),
    contratosAtivos: toNumber(input?.contratosAtivos),
    percentualAtivos: toNumber(input?.percentualAtivos),
    receitaContratada: toNumber(input?.receitaContratada),
    ticketMedio: toNumber(input?.ticketMedio),
    pendentesAssinatura: toNumber(input?.pendentesAssinatura),
    insight: input?.insight?.trim() || "Nenhum insight disponível para o mês selecionado.",
  };
}

function normalizeMatriculaDashboardMensalPlano(
  input: MatriculaDashboardMensalPlanoResponse
): MatriculaDashboardMensalPlano {
  return {
    planoId: input.planoId?.trim() || undefined,
    planoNome: input.planoNome?.trim() || "Sem plano",
    quantidade: toNumber(input.quantidade),
    valor: toNumber(input.valor),
    percentual: toNumber(input.percentual),
  };
}

function normalizeMatriculaDashboardMensalResponse(
  input: MatriculaDashboardMensalResponse
): MatriculaDashboardMensalResult {
  return {
    mes: input.mes?.trim() || "",
    resumo: normalizeMatriculaDashboardMensalResumo(input.resumo),
    carteiraAtivaPorPlano: Array.isArray(input.carteiraAtivaPorPlano)
      ? input.carteiraAtivaPorPlano.map(normalizeMatriculaDashboardMensalPlano)
      : [],
    contratos: {
      items: Array.isArray(input.contratos?.items)
        ? input.contratos.items.map(normalizeMatriculaApiResponse)
        : [],
      page: toNumber(input.contratos?.page),
      size: toNumber(input.contratos?.size, 20),
      totalItems: toNumber(input.contratos?.totalItems),
      totalPages: toNumber(input.contratos?.totalPages),
    },
  };
}

export async function listMatriculasApi(input: {
  tenantId?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<Array<Matricula & { aluno?: Aluno; plano?: Plano }>> {
  const response = await requestMatriculasList(
    [LIST_ADESOES_PATH, LIST_MATRICULAS_PATH],
    {
      tenantId: input.tenantId,
      status: input.status,
      page: input.page,
      size: input.size,
    }
  );
  return response.map(normalizeMatriculaApiResponse);
}

export async function listMatriculasPageApi(input: {
  tenantId?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<MatriculaPageResult> {
  const fallbackPage = input.page ?? 0;
  const fallbackSize = input.size ?? 20;
  const response = await requestMatriculasListWithMeta(
    [LIST_ADESOES_PATH, LIST_MATRICULAS_PATH],
    {
      tenantId: input.tenantId,
      status: input.status,
      page: input.page,
      size: input.size,
    }
  );
  const items = response.data.map(normalizeMatriculaApiResponse);
  const page = getHeaderNumber(response.headers, "x-page") ?? fallbackPage;
  const size = getHeaderNumber(response.headers, "x-size") ?? fallbackSize;
  const total = getHeaderNumber(response.headers, "x-total-count");
  const totalPages = getHeaderNumber(response.headers, "x-total-pages");
  const hasNext =
    typeof totalPages === "number"
      ? page + 1 < totalPages
      : typeof total === "number"
        ? (page + 1) * size < total
        : items.length >= size;

  return {
    items,
    page,
    size,
    total,
    hasNext,
  };
}

export async function listMatriculasDashboardMensalApi(input: {
  tenantId?: string;
  mes: string;
  page?: number;
  size?: number;
}): Promise<MatriculaDashboardMensalResult> {
  const response = await apiRequest<MatriculaDashboardMensalResponse>({
    path: "/api/v1/comercial/matriculas/dashboard-mensal",
    query: {
      tenantId: input.tenantId,
      mes: input.mes,
      page: input.page,
      size: input.size,
    },
  });

  return normalizeMatriculaDashboardMensalResponse(response);
}

export async function listMatriculasByAlunoApi(input: {
  tenantId?: string;
  alunoId: string;
  page?: number;
  size?: number;
}): Promise<Array<Matricula & { aluno?: Aluno; plano?: Plano }>> {
  const response = await requestMatriculasList(
    [
      `/api/v1/comercial/alunos/${input.alunoId}/adesoes`,
      `/api/v1/comercial/alunos/${input.alunoId}/matriculas`,
    ],
    {
      tenantId: input.tenantId,
      page: input.page,
      size: input.size,
    }
  );
  return response.map(normalizeMatriculaApiResponse);
}

export async function createMatriculaApi(input: {
  tenantId?: string;
  data: CreateMatriculaApiInput;
}): Promise<Matricula & { aluno?: Aluno; plano?: Plano }> {
  const response = await apiRequest<MatriculaResponse>({
    path: "/api/v1/comercial/matriculas",
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
    body: {
      alunoId: input.data.alunoId,
      planoId: input.data.planoId,
      dataInicio: input.data.dataInicio,
      valorPago: input.data.valorPago,
      valorMatricula: input.data.valorMatricula,
      desconto: input.data.desconto,
      motivoDesconto: input.data.motivoDesconto,
      formaPagamento: input.data.formaPagamento,
      renovacaoAutomatica: input.data.renovacaoAutomatica,
      observacoes: input.data.observacoes,
      convenioId: input.data.convenioId,
      dataPagamento: input.data.dataPagamento,
    },
  });
  return normalizeMatriculaApiResponse(response);
}

export async function renovarMatriculaApi(input: {
  tenantId?: string;
  id: string;
  planoId?: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/matriculas/${input.id}/renovar`,
    method: "POST",
    query: {
      tenantId: input.tenantId,
      planoId: input.planoId,
    },
  });
}

export async function cancelarMatriculaApi(input: {
  tenantId?: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/matriculas/${input.id}/cancelar`,
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
  });
}

export async function signMatriculaContractApi(input: {
  tenantId?: string;
  id: string;
}): Promise<Matricula & { aluno?: Aluno; plano?: Plano }> {
  const response = await apiRequest<MatriculaResponse>({
    path: `/api/v1/comercial/matriculas/${input.id}/contrato/assinar`,
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
  });
  return normalizeMatriculaApiResponse(response);
}
