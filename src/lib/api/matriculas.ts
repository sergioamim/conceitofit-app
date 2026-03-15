import type { Aluno, Matricula, Plano, TipoFormaPagamento } from "@/lib/types";
import { apiRequest } from "./http";

type MatriculaApiResponse = {
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
  cliente?: Partial<Aluno> | null;
  aluno?: Partial<Aluno> | null;
  plano?: Partial<Plano> | null;
};

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

export function normalizeMatriculaApiResponse(input: MatriculaApiResponse): Matricula & {
  aluno?: Aluno;
  plano?: Plano;
} {
  const tenantId = typeof input.tenantId === "string" ? input.tenantId : "";
  const aluno = normalizeAlunoEmbedded(input.aluno ?? input.cliente);
  const plano = normalizePlanoEmbedded(input.plano, tenantId);

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
    dataCriacao: typeof input.dataCriacao === "string" ? input.dataCriacao : new Date().toISOString(),
    dataAtualizacao: typeof input.dataAtualizacao === "string" ? input.dataAtualizacao : undefined,
    convenioId: typeof input.convenioId === "string" ? input.convenioId : undefined,
  };
}

export async function listMatriculasApi(input: {
  tenantId?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<Array<Matricula & { aluno?: Aluno; plano?: Plano }>> {
  const response = await apiRequest<MatriculaApiResponse[]>({
    path: "/api/v1/comercial/matriculas",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      page: input.page,
      size: input.size,
    },
  });
  return response.map(normalizeMatriculaApiResponse);
}

export async function listMatriculasByAlunoApi(input: {
  tenantId?: string;
  alunoId: string;
  page?: number;
  size?: number;
}): Promise<Array<Matricula & { aluno?: Aluno; plano?: Plano }>> {
  const response = await apiRequest<MatriculaApiResponse[]>({
    path: `/api/v1/comercial/alunos/${input.alunoId}/matriculas`,
    query: {
      tenantId: input.tenantId,
      page: input.page,
      size: input.size,
    },
  });
  return response.map(normalizeMatriculaApiResponse);
}

export async function createMatriculaApi(input: {
  tenantId?: string;
  data: CreateMatriculaApiInput;
}): Promise<Matricula & { aluno?: Aluno; plano?: Plano }> {
  const response = await apiRequest<MatriculaApiResponse>({
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
  const response = await apiRequest<MatriculaApiResponse>({
    path: `/api/v1/comercial/matriculas/${input.id}/contrato/assinar`,
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
  });
  return normalizeMatriculaApiResponse(response);
}
