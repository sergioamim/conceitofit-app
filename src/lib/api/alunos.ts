import type {
  Aluno,
  AlunoTotaisStatus,
  ClienteExclusaoResult,
  ClienteMigracaoUnidadePayload,
  ClienteMigracaoUnidadeResult,
  ClienteOperationalContext,
  Matricula,
  Pagamento,
  Sexo,
  StatusAluno,
  TenantOperationalEligibility,
  TenantOperationalEligibilityReason,
} from "@/lib/types";
import { apiRequest } from "./http";

type CreateAlunoInput = {
  nome: string;
  email: string;
  telefone: string;
  telefoneSec?: string;
  cpf: string;
  dataNascimento: string;
  sexo: Sexo;
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

export type ClienteTotaisStatusResponse = Partial<AlunoTotaisStatus> & {
  total?: number;
  totalAtivo?: number;
  totalSuspenso?: number;
  totalInativo?: number;
  totalCancelado?: number;
  ativos?: number;
  suspensos?: number;
  inativos?: number;
  cancelados?: number;
};

export type ClienteListEnvelopeResponse = {
  items: Aluno[];
  page: number;
  size: number;
  hasNext: boolean;
  totaisStatus?: ClienteTotaisStatusResponse;
};

type ListAlunosApiResponse = ClienteListEnvelopeResponse;

type AlunoListPayload = Aluno[] | ClienteListEnvelopeResponse;

function normalizeAlunoStatus(value: unknown): StatusAluno {
  if (value === "ATIVO" || value === "INATIVO" || value === "SUSPENSO" || value === "CANCELADO") {
    return value;
  }
  if (value === "BLOQUEADO") {
    return "INATIVO";
  }
  return "INATIVO";
}

function normalizeAlunoFotoUrl(input: Aluno): string | undefined {
  const rawFoto = typeof input.foto === "string" ? input.foto.trim() : "";
  if (!rawFoto) {
    return undefined;
  }

  const version =
    typeof input.dataAtualizacao === "string" && input.dataAtualizacao.trim()
      ? input.dataAtualizacao.trim()
      : typeof input.dataCadastro === "string" && input.dataCadastro.trim()
        ? input.dataCadastro.trim()
        : "";

  const query = version ? `?v=${encodeURIComponent(version)}` : "";
  return `/api/v1/comercial/alunos/${encodeURIComponent(input.id)}/foto${query}`;
}

function normalizeAluno(input: Aluno): Aluno {
  return {
    ...input,
    foto: normalizeAlunoFotoUrl(input),
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

function normalizeEligibilityReason(
  input: { code?: string | null; message?: string | null },
): TenantOperationalEligibilityReason | null {
  const code = input.code?.trim() ?? "";
  const message = input.message?.trim() ?? "";
  if (!code || !message) return null;
  return { code, message };
}

function normalizeTenantEligibility(
  input: TenantOperationalEligibilityApiResponse,
  eligible: boolean,
): TenantOperationalEligibility | null {
  const tenantId = input.tenantId?.trim() ?? "";
  if (!tenantId) return null;
  return {
    tenantId,
    tenantName: input.tenantNome?.trim() || undefined,
    eligible,
    defaultTenant: Boolean(input.defaultTenant),
    blockedReasons: (input.blockedReasons ?? [])
      .map((reason) => normalizeEligibilityReason(reason))
      .filter((reason): reason is TenantOperationalEligibilityReason => reason !== null),
  };
}

function normalizeClienteOperationalContext(
  input: ClienteOperationalContextApiResponse,
): ClienteOperationalContext {
  if (!input.aluno?.id) {
    throw new Error("Resposta de contexto operacional do cliente sem aluno.");
  }

  return {
    tenantId: input.tenantId?.trim() || input.aluno.tenantId,
    tenantName: input.tenantNome?.trim() || undefined,
    baseTenantId: input.baseTenantId?.trim() || undefined,
    baseTenantName: input.baseTenantNome?.trim() || undefined,
    aluno: normalizeAluno(input.aluno),
    eligibleTenants: (input.eligibleTenants ?? [])
      .map((tenant) => normalizeTenantEligibility(tenant, true))
      .filter((tenant): tenant is TenantOperationalEligibility => tenant !== null),
    blockedTenants: (input.blockedTenants ?? [])
      .map((tenant) => normalizeTenantEligibility(tenant, false))
      .filter((tenant): tenant is TenantOperationalEligibility => tenant !== null),
    blocked: Boolean(input.blocked),
    message: input.message?.trim() || undefined,
  };
}

function normalizeClienteMigracaoResult(
  input: ClienteMigracaoUnidadeApiResponse,
): ClienteMigracaoUnidadeResult {
  type BlockedByItem = NonNullable<ClienteMigracaoUnidadeResult["blockedBy"]>[number];

  return {
    success: input.success !== false,
    auditId: input.auditId?.trim() || undefined,
    eventType: input.eventType?.trim() || undefined,
    message: input.message?.trim() || undefined,
    tenantOrigemId: input.tenantOrigemId?.trim() || undefined,
    tenantOrigemNome: input.tenantOrigemNome?.trim() || undefined,
    tenantDestinoId: input.tenantDestinoId?.trim() || undefined,
    tenantDestinoNome: input.tenantDestinoNome?.trim() || undefined,
    baseTenantIdAnterior: input.baseTenantIdAnterior?.trim() || undefined,
    baseTenantIdAtual: input.baseTenantIdAtual?.trim() || undefined,
    suggestedActiveTenantId: input.suggestedActiveTenantId?.trim() || undefined,
    preservarContextoComercial:
      typeof input.preservarContextoComercial === "boolean"
        ? input.preservarContextoComercial
        : undefined,
    blockedBy: (input.blockedBy ?? [])
      .map<BlockedByItem | null>((item) => {
        const code = item.code?.trim() ?? "";
        const message = item.message?.trim() ?? "";
        return code && message ? { code, message } : null;
      })
      .filter((item): item is BlockedByItem => item !== null),
    aluno: input.aluno ? normalizeAluno(input.aluno) : undefined,
  };
}

export function extractAlunosFromListResponse(response: AlunoListPayload): Aluno[] {
  if (Array.isArray(response)) return response;
  return toArray(response.items);
}

export function extractAlunosTotais(response: AlunoListPayload): AlunoTotaisStatus | undefined {
  if (Array.isArray(response)) return undefined;
  const totalsSource = response.totaisStatus;
  if (!totalsSource || typeof totalsSource !== "object") {
    return undefined;
  }

  const source = totalsSource as Record<string, unknown>;
  const total = getNumber(source.total);
  const totalAtivo = getNumber(source.totalAtivo) ?? getNumber(source.ativos);
  const totalSuspenso = getNumber(source.totalSuspenso) ?? getNumber(source.suspensos);
  const totalInativo = getNumber(source.totalInativo) ?? getNumber(source.inativos);
  const totalCancelado = getNumber(source.totalCancelado) ?? getNumber(source.cancelados);

  if (total == null && totalAtivo == null && totalSuspenso == null && totalInativo == null && totalCancelado == null) {
    return undefined;
  }

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

type CreateAlunoComMatriculaResponse = {
  aluno: Aluno;
  matricula: Matricula;
  pagamento: Pagamento;
};

type ExcluirAlunoApiRequest = {
  tenantId: string;
  justificativa: string;
  issuedBy?: string;
};

type TenantOperationalEligibilityApiResponse = {
  tenantId?: string | null;
  tenantNome?: string | null;
  defaultTenant?: boolean | null;
  blockedReasons?: Array<{
    code?: string | null;
    message?: string | null;
  }> | null;
};

type ClienteOperationalContextApiResponse = {
  tenantId?: string | null;
  tenantNome?: string | null;
  baseTenantId?: string | null;
  baseTenantNome?: string | null;
  aluno?: Aluno | null;
  eligibleTenants?: TenantOperationalEligibilityApiResponse[] | null;
  blockedTenants?: TenantOperationalEligibilityApiResponse[] | null;
  blocked?: boolean | null;
  message?: string | null;
};

type ClienteMigracaoUnidadeApiResponse = {
  success?: boolean | null;
  auditId?: string | null;
  eventType?: string | null;
  message?: string | null;
  tenantOrigemId?: string | null;
  tenantOrigemNome?: string | null;
  tenantDestinoId?: string | null;
  tenantDestinoNome?: string | null;
  baseTenantIdAnterior?: string | null;
  baseTenantIdAtual?: string | null;
  suggestedActiveTenantId?: string | null;
  preservarContextoComercial?: boolean | null;
  blockedBy?: Array<{
    code?: string | null;
    message?: string | null;
  }> | null;
  aluno?: Aluno | null;
};

export async function listAlunosApi(input: {
  tenantId?: string;
  status?: StatusAluno;
  search?: string;
  page?: number;
  size?: number;
}): Promise<ClienteListEnvelopeResponse> {
  const response = await apiRequest<ClienteListEnvelopeResponse>({
    path: "/api/v1/comercial/alunos",
    query: {
      tenantId: input.tenantId,
      status: input.status,
      search: input.search?.trim() || undefined,
      page: input.page,
      size: input.size,
      envelope: true,
    },
  });

  return {
    ...response,
    items: toArray(response.items),
  };
}

export async function searchAlunosApi(input: {
  tenantId: string;
  search: string;
  page?: number;
  size?: number;
}): Promise<Aluno[]> {
  const trimmed = input.search.trim();
  if (!trimmed) return [];
  const response = await listAlunosApi({
    tenantId: input.tenantId,
    search: trimmed,
    page: input.page ?? 0,
    size: input.size ?? 1,
  });
  return extractAlunosFromListResponse(response);
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
    body: input.data,
  });
  return normalizeAluno(response);
}

async function updateAlunoStatusApi(input: {
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

export async function excluirAlunoApi(input: {
  tenantId: string;
  id: string;
  data: ExcluirAlunoApiRequest;
}): Promise<ClienteExclusaoResult> {
  return apiRequest<ClienteExclusaoResult>({
    path: `/api/v1/comercial/alunos/${input.id}`,
    method: "DELETE",
    query: { tenantId: input.tenantId },
    body: {
      tenantId: input.tenantId,
      justificativa: input.data.justificativa,
      issuedBy: input.data.issuedBy,
    },
  });
}

export async function getClienteOperationalContextApi(input: {
  id: string;
  tenantId?: string;
  includeContextHeader?: boolean;
}): Promise<ClienteOperationalContext> {
  const response = await apiRequest<ClienteOperationalContextApiResponse>({
    path: `/api/v1/comercial/clientes/${input.id}/contexto-operacional`,
    query: { tenantId: input.tenantId },
    includeContextHeader: input.includeContextHeader,
  });
  return normalizeClienteOperationalContext(response);
}

export async function migrarClienteParaUnidadeApi(input: {
  tenantId: string;
  id: string;
  data: ClienteMigracaoUnidadePayload;
}): Promise<ClienteMigracaoUnidadeResult> {
  const response = await apiRequest<ClienteMigracaoUnidadeApiResponse>({
    path: `/api/v1/comercial/clientes/${input.id}/migrar-unidade`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: {
      tenantDestinoId: input.data.tenantDestinoId,
      justificativa: input.data.justificativa,
      preservarContextoComercial: input.data.preservarContextoComercial ?? true,
    },
  });
  return normalizeClienteMigracaoResult(response);
}
