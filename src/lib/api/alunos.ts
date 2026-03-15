import type { Aluno, AlunoTotaisStatus, Matricula, Pagamento, StatusAluno } from "@/lib/types";
import { apiRequest } from "./http";

type CreateAlunoInput = {
  nome: string;
  email: string;
  telefone: string;
  telefoneSec?: string;
  cpf: string;
  dataNascimento: string;
  sexo: "M" | "F" | "OUTRO";
  rg?: string;
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  contatoEmergencia?: {
    nome: string;
    telefone: string;
    parentesco?: string;
  };
  observacoesMedicas?: string;
  foto?: string;
};

type CreateAlunoComMatriculaInput = CreateAlunoInput & {
  planoId: string;
  dataInicio: string;
  formaPagamento: string;
  desconto?: number;
  motivoDesconto?: string;
};

export type ListAlunosApiResponse = {
  items?: Aluno[];
  content?: Aluno[];
  data?: Aluno[];
  alunos?: Aluno[];
  total?: number;
  size?: number;
  page?: number;
  hasNext?: boolean;
  totalAtivo?: number;
  totalSuspenso?: number;
  totalInativo?: number;
  totalCancelado?: number;
  ativos?: number;
  suspensos?: number;
  inativos?: number;
  cancelados?: number;
  totaisStatus?: AlunoTotaisStatus;
  alunoTotaisStatus?: AlunoTotaisStatus;
  totalStatus?: AlunoTotaisStatus;
  dataRows?: Aluno[];
};

type AlunoListPayload = Aluno[] | ListAlunosApiResponse;

function normalizeAlunoStatus(value: unknown): StatusAluno {
  if (value === "ATIVO" || value === "INATIVO" || value === "SUSPENSO" || value === "CANCELADO") {
    return value;
  }
  if (value === "BLOQUEADO") {
    return "INATIVO";
  }
  return "INATIVO";
}

function normalizeAluno(input: Aluno): Aluno {
  return {
    ...input,
    status: normalizeAlunoStatus((input as Aluno & { status?: unknown }).status),
  };
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function toArray(value: unknown): Aluno[] {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean).map((item) => normalizeAluno(item as Aluno));
}

export function extractAlunosFromListResponse(response: AlunoListPayload): Aluno[] {
  if (Array.isArray(response)) return response;
  const candidates = [response.items, response.content, response.data, response.alunos, response.dataRows];
  return toArray(candidates.find(Array.isArray));
}

export function extractAlunosTotais(response: AlunoListPayload): AlunoTotaisStatus | undefined {
  if (Array.isArray(response)) return undefined;
  const totalsSource = response.totaisStatus ?? response.alunoTotaisStatus ?? response.totalStatus;
  if (
    totalsSource &&
    typeof totalsSource === "object" &&
    ("total" in totalsSource || "totalAtivo" in totalsSource || "totalSuspenso" in totalsSource || "totalInativo" in totalsSource)
  ) {
    const source = totalsSource;
    const total = getNumber(source.total);
    const totalAtivo = getNumber(source.totalAtivo) ?? getNumber(source.ativos);
    const totalSuspenso = getNumber(source.totalSuspenso) ?? getNumber(source.suspensos);
    const totalInativo = getNumber(source.totalInativo) ?? getNumber(source.inativos);
    const totalCancelado = getNumber(source.totalCancelado) ?? getNumber(source.cancelados);

    return {
      total: total ?? 0,
      totalAtivo: totalAtivo ?? 0,
      totalSuspenso: totalSuspenso ?? 0,
      totalInativo: totalInativo ?? 0,
      totalCancelado,
      ativos: getNumber(source.ativos),
      suspensos: getNumber(source.suspensos),
      inativos: getNumber(source.inativos),
      cancelados: getNumber(source.cancelados),
    };
  }

  const directTotals = {
    total: getNumber(response.total),
    totalAtivo: getNumber(response.totalAtivo),
    totalSuspenso: getNumber(response.totalSuspenso),
    totalInativo: getNumber(response.totalInativo),
    totalCancelado: getNumber(response.totalCancelado),
    ativos: getNumber(response.ativos),
    suspensos: getNumber(response.suspensos),
    inativos: getNumber(response.inativos),
    cancelados: getNumber(response.cancelados),
  };

  if (directTotals.total == null && directTotals.totalAtivo == null && directTotals.totalSuspenso == null && directTotals.totalInativo == null) {
    return undefined;
  }

  return {
    total: directTotals.total ?? 0,
    totalAtivo: directTotals.totalAtivo ?? 0,
    totalSuspenso: directTotals.totalSuspenso ?? 0,
    totalInativo: directTotals.totalInativo ?? 0,
    totalCancelado: directTotals.totalCancelado,
    ativos: directTotals.ativos,
    suspensos: directTotals.suspensos,
    inativos: directTotals.inativos,
    cancelados: directTotals.cancelados,
  };
}

type CreateAlunoComMatriculaResponse = {
  aluno: Aluno;
  matricula: Matricula;
  pagamento: Pagamento;
};

export async function listAlunosApi(input: {
  tenantId?: string;
  status?: StatusAluno;
  page?: number;
  size?: number;
}): Promise<AlunoListPayload> {
  return apiRequest<AlunoListPayload>({
    path: "/api/v1/comercial/alunos",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      page: input.page,
      size: input.size,
      envelope: true,
    },
  });
}

export async function getAlunoApi(input: {
  tenantId: string;
  id: string;
  includeContextHeader?: boolean;
}): Promise<Aluno> {
  const response = await apiRequest<Aluno>({
    path: `/api/v1/comercial/alunos/${input.id}`,
    query: { tenantId: input.tenantId },
    includeContextHeader: input.includeContextHeader,
  });
  return normalizeAluno(response);
}

export async function createAlunoApi(input: {
  tenantId: string;
  data: CreateAlunoInput;
}): Promise<Aluno> {
  const response = await apiRequest<Aluno>({
    path: "/api/v1/comercial/alunos",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: {
      tenantId: input.tenantId,
      ...input.data,
    },
  });
  return normalizeAluno(response);
}

export async function updateAlunoApi(input: {
  tenantId: string;
  id: string;
  data: Partial<Omit<Aluno, "id" | "tenantId" | "dataCadastro">>;
}): Promise<Aluno> {
  const response = await apiRequest<Aluno>({
    path: `/api/v1/comercial/alunos/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: {
      tenantId: input.tenantId,
      ...input.data,
    },
  });
  return normalizeAluno(response);
}

export async function updateAlunoStatusApi(input: {
  tenantId: string;
  id: string;
  status: StatusAluno;
}): Promise<Aluno> {
  const response = await apiRequest<Aluno>({
    path: `/api/v1/comercial/alunos/${input.id}/status`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
      status: input.status,
    },
  });
  return normalizeAluno(response);
}

export async function createAlunoComMatriculaApi(input: {
  tenantId: string;
  data: CreateAlunoComMatriculaInput;
}): Promise<CreateAlunoComMatriculaResponse> {
  return apiRequest<CreateAlunoComMatriculaResponse>({
    path: "/api/v1/comercial/alunos-com-matricula",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}
