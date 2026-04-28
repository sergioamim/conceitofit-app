import type { Atividade, Plano, Produto, Servico, TipoPlano } from "@/lib/types";
import { apiRequest } from "./http";
import { withTenantContextRetry } from "./contexto-unidades";

type PlanoApiResponse = {
  id?: string;
  tenantId?: string;
  nome?: string;
  descricao?: string | null;
  tipo?: TipoPlano | null;
  duracaoDias?: unknown;
  valor?: unknown;
  valorMatricula?: unknown;
  cobraAnuidade?: unknown;
  valorAnuidade?: unknown;
  parcelasMaxAnuidade?: unknown;
  permiteRenovacaoAutomatica?: unknown;
  permiteCobrancaRecorrente?: unknown;
  diaCobrancaPadrao?: unknown;
  contratoTemplateHtml?: string | null;
  contratoAssinatura?: Plano["contratoAssinatura"] | null;
  contratoEnviarAutomaticoEmail?: unknown;
  atividadeIds?: string[] | null;
  atividades?: Array<Pick<Atividade, "id">> | null;
  beneficios?: string[] | null;
  ativo?: unknown;
  destaque?: unknown;
  permiteVendaOnline?: unknown;
  ordem?: unknown;
};

type PlanoListApiResponse =
  | PlanoApiResponse[]
  | {
      items?: PlanoApiResponse[];
      content?: PlanoApiResponse[];
      data?: PlanoApiResponse[];
      rows?: PlanoApiResponse[];
      result?: PlanoApiResponse[];
      itens?: PlanoApiResponse[];
    };

export interface PlanoUpsertApiRequest {
  nome: string;
  descricao?: string;
  tipo: TipoPlano;
  duracaoDias: number;
  valor: number;
  valorMatricula?: number;
  cobraAnuidade?: boolean;
  valorAnuidade?: number;
  parcelasMaxAnuidade?: number;
  permiteRenovacaoAutomatica?: boolean;
  permiteCobrancaRecorrente?: boolean;
  diaCobrancaPadrao?: number;
  contratoTemplateHtml?: string;
  contratoAssinatura?: Plano["contratoAssinatura"];
  contratoEnviarAutomaticoEmail?: boolean;
  atividadeIds?: string[];
  beneficios?: string[];
  destaque?: boolean;
  permiteVendaOnline?: boolean;
  ordem?: number;
}

const MAX_PLANO_NAME_LENGTH = 100;
const MAX_PLANO_DESCRIPTION_LENGTH = 500;

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "sim") return true;
    if (normalized === "false" || normalized === "0" || normalized === "nao" || normalized === "não") {
      return false;
    }
  }
  if (typeof value === "number") return value === 1;
  return fallback;
};

const toArray = <T>(value: T[] | null | undefined): T[] => value ?? [];

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function limitString(value: string | undefined, maxLength: number): string | undefined {
  if (!value) return undefined;
  return value.slice(0, maxLength);
}

function normalizeDiasCobranca(value: unknown, fallback?: number[]): number[] | undefined {
  if (Array.isArray(value)) {
    const dias = value.map(Number).filter((n) => Number.isFinite(n) && n >= 1 && n <= 28);
    return dias.length > 0 ? dias.sort((a, b) => a - b) : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 28) {
    return [value];
  }
  return fallback;
}

function extractPlanoItems(response: PlanoListApiResponse): PlanoApiResponse[] {
  if (Array.isArray(response)) {
    return response;
  }

  return (
    response.items ??
    response.content ??
    response.data ??
    response.rows ??
    response.result ??
    response.itens ??
    []
  );
}

function extractPlanoAtividadeIds(input: {
  atividadeIds?: string[] | null;
  atividades?: Array<Pick<Atividade, "id">> | null;
}): string[] {
  const ids = Array.isArray(input.atividadeIds)
    ? input.atividadeIds
    : Array.isArray(input.atividades)
      ? input.atividades
          .map((atividade) => cleanString(atividade?.id))
          .filter((id): id is string => Boolean(id))
      : [];

  return Array.from(new Set(ids));
}

export function buildPlanoUpsertApiRequest(
  data: Pick<
    Plano,
    | "nome"
    | "descricao"
    | "tipo"
    | "duracaoDias"
    | "valor"
    | "valorMatricula"
    | "cobraAnuidade"
    | "valorAnuidade"
    | "parcelasMaxAnuidade"
    | "permiteRenovacaoAutomatica"
    | "permiteCobrancaRecorrente"
    | "diaCobrancaPadrao"
    | "contratoTemplateHtml"
    | "contratoAssinatura"
    | "contratoEnviarAutomaticoEmail"
    | "atividades"
    | "beneficios"
    | "destaque"
    | "permiteVendaOnline"
    | "ordem"
  >
): PlanoUpsertApiRequest {
  const atividadeIds = Array.from(
    new Set(
      toArray(data.atividades)
        .map((atividadeId) => cleanString(atividadeId))
        .filter((atividadeId): atividadeId is string => Boolean(atividadeId))
    )
  );
  const beneficios = toArray(data.beneficios)
    .map((beneficio) => cleanString(beneficio))
    .filter((beneficio): beneficio is string => Boolean(beneficio));
  const diaCobrancaPadrao = normalizeDiasCobranca(data.diaCobrancaPadrao)?.[0];

  return {
    nome: limitString(cleanString(data.nome) ?? "", MAX_PLANO_NAME_LENGTH) ?? "",
    descricao: limitString(cleanString(data.descricao), MAX_PLANO_DESCRIPTION_LENGTH),
    tipo: data.tipo,
    duracaoDias: Math.max(1, Math.floor(toNumber(data.duracaoDias, 1))),
    valor: Math.max(0.01, toNumber(data.valor, 0.01)),
    valorMatricula: Math.max(0, toNumber(data.valorMatricula, 0)),
    cobraAnuidade: Boolean(data.cobraAnuidade),
    valorAnuidade: data.valorAnuidade == null ? undefined : Math.max(0, toNumber(data.valorAnuidade, 0)),
    parcelasMaxAnuidade:
      data.parcelasMaxAnuidade == null ? undefined : Math.max(1, Math.floor(toNumber(data.parcelasMaxAnuidade, 1))),
    permiteRenovacaoAutomatica:
      data.tipo === "AVULSO" ? false : Boolean(data.permiteRenovacaoAutomatica),
    permiteCobrancaRecorrente:
      data.tipo === "AVULSO" ? false : Boolean(data.permiteCobrancaRecorrente),
    diaCobrancaPadrao:
      data.tipo === "AVULSO" || !data.permiteCobrancaRecorrente ? undefined : diaCobrancaPadrao,
    contratoTemplateHtml: cleanString(data.contratoTemplateHtml),
    contratoAssinatura: data.contratoAssinatura ?? "AMBAS",
    contratoEnviarAutomaticoEmail: Boolean(data.contratoEnviarAutomaticoEmail),
    atividadeIds: atividadeIds.length > 0 ? atividadeIds : undefined,
    beneficios: beneficios.length > 0 ? beneficios : undefined,
    destaque: Boolean(data.destaque),
    permiteVendaOnline: data.permiteVendaOnline ?? true,
    ordem: data.ordem == null ? undefined : Math.max(0, Math.floor(toNumber(data.ordem, 0))),
  };
}

export function normalizePlanoApiResponse(
  input?: PlanoApiResponse | null,
  fallback?: Partial<Plano>
): Plano {
  const source = input ?? {};
  const tipo = source.tipo ?? fallback?.tipo ?? "MENSAL";

  return {
    id: cleanString(source.id) ?? fallback?.id ?? "",
    tenantId: cleanString(source.tenantId) ?? fallback?.tenantId ?? "",
    nome: cleanString(source.nome) ?? fallback?.nome ?? "",
    descricao: cleanString(source.descricao) ?? fallback?.descricao,
    tipo,
    duracaoDias: Math.max(1, Math.floor(toNumber(source.duracaoDias, fallback?.duracaoDias ?? 1))),
    valor: toNumber(source.valor, fallback?.valor ?? 0),
    valorMatricula: toNumber(source.valorMatricula, fallback?.valorMatricula ?? 0),
    cobraAnuidade: toBoolean(source.cobraAnuidade, fallback?.cobraAnuidade ?? false),
    valorAnuidade:
      source.valorAnuidade == null && fallback?.valorAnuidade == null
        ? undefined
        : toNumber(source.valorAnuidade, fallback?.valorAnuidade ?? 0),
    parcelasMaxAnuidade:
      source.parcelasMaxAnuidade == null && fallback?.parcelasMaxAnuidade == null
        ? undefined
        : Math.max(1, Math.floor(toNumber(source.parcelasMaxAnuidade, fallback?.parcelasMaxAnuidade ?? 1))),
    permiteRenovacaoAutomatica: toBoolean(
      source.permiteRenovacaoAutomatica,
      fallback?.permiteRenovacaoAutomatica ?? tipo !== "AVULSO"
    ),
    permiteCobrancaRecorrente: toBoolean(
      source.permiteCobrancaRecorrente,
      fallback?.permiteCobrancaRecorrente ?? false
    ),
    diaCobrancaPadrao: normalizeDiasCobranca(source.diaCobrancaPadrao, fallback?.diaCobrancaPadrao),
    contratoTemplateHtml: cleanString(source.contratoTemplateHtml) ?? fallback?.contratoTemplateHtml,
    contratoAssinatura: source.contratoAssinatura ?? fallback?.contratoAssinatura ?? "AMBAS",
    contratoEnviarAutomaticoEmail: toBoolean(
      source.contratoEnviarAutomaticoEmail,
      fallback?.contratoEnviarAutomaticoEmail ?? false
    ),
    atividades: extractPlanoAtividadeIds(source),
    beneficios: Array.isArray(source.beneficios)
      ? source.beneficios
          .map((beneficio) => cleanString(beneficio))
          .filter((beneficio): beneficio is string => Boolean(beneficio))
      : toArray(fallback?.beneficios),
    destaque: toBoolean(source.destaque, fallback?.destaque ?? false),
    permiteVendaOnline: toBoolean(
      source.permiteVendaOnline,
      fallback?.permiteVendaOnline ?? true
    ),
    ativo: toBoolean(source.ativo, fallback?.ativo ?? true),
    ordem:
      source.ordem == null && fallback?.ordem == null
        ? undefined
        : Math.max(0, Math.floor(toNumber(source.ordem, fallback?.ordem ?? 0))),
  };
}

export async function listServicosApi(apenasAtivos?: boolean): Promise<Servico[]> {
  const response = await apiRequest<Servico[]>({
    path: "/api/v1/comercial/servicos",
    query: { apenasAtivos: apenasAtivos ?? false },
  });
  return response.map((item) => ({
    ...item,
    valor: toNumber(item.valor, 0),
    custo: item.custo == null ? undefined : toNumber(item.custo),
    comissaoPercentual: item.comissaoPercentual == null ? undefined : toNumber(item.comissaoPercentual),
    aliquotaImpostoPercentual:
      item.aliquotaImpostoPercentual == null ? undefined : toNumber(item.aliquotaImpostoPercentual),
  }));
}

export async function createServicoApi(data: Omit<Servico, "id" | "tenantId" | "ativo">): Promise<Servico> {
  return apiRequest<Servico>({
    path: "/api/v1/comercial/servicos",
    method: "POST",
    body: data,
  });
}

export async function updateServicoApi(id: string, data: Partial<Servico>): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/servicos/${id}`,
    method: "PUT",
    body: data,
  });
}

export async function toggleServicoApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/servicos/${id}/toggle`,
    method: "PATCH",
  });
}

export async function deleteServicoApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/servicos/${id}`,
    method: "DELETE",
  });
}

export async function listProdutosApi(apenasAtivos?: boolean): Promise<Produto[]> {
  const response = await apiRequest<Produto[]>({
    path: "/api/v1/comercial/produtos",
    query: { apenasAtivos: apenasAtivos ?? false },
  });
  return response.map((item) => ({
    ...item,
    valorVenda: toNumber(item.valorVenda, 0),
    custo: item.custo == null ? undefined : toNumber(item.custo),
    comissaoPercentual: item.comissaoPercentual == null ? undefined : toNumber(item.comissaoPercentual),
    aliquotaImpostoPercentual:
      item.aliquotaImpostoPercentual == null ? undefined : toNumber(item.aliquotaImpostoPercentual),
    estoqueAtual: toNumber(item.estoqueAtual, 0),
  }));
}

export async function createProdutoApi(data: Omit<Produto, "id" | "tenantId" | "ativo">): Promise<Produto> {
  return apiRequest<Produto>({
    path: "/api/v1/comercial/produtos",
    method: "POST",
    body: data,
  });
}

export async function updateProdutoApi(id: string, data: Partial<Produto>): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/produtos/${id}`,
    method: "PUT",
    body: data,
  });
}

export async function toggleProdutoApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/produtos/${id}/toggle`,
    method: "PATCH",
  });
}

export async function deleteProdutoApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/produtos/${id}`,
    method: "DELETE",
  });
}

export async function listPlanosApi(input: {
  tenantId: string;
  apenasAtivos?: boolean;
  tipo?: TipoPlano;
  size?: number;
}): Promise<Plano[]> {
  const response = await withTenantContextRetry(() =>
    apiRequest<PlanoListApiResponse>({
      path: "/api/v1/comercial/planos",
      query: {
        tenantId: input.tenantId,
        apenasAtivos: input.apenasAtivos ?? false,
        tipo: input.tipo,
        size: input.size ?? 200,
      },
    })
  );

  return extractPlanoItems(response).map((item) =>
    normalizePlanoApiResponse(item, {
      tenantId: input.tenantId,
    })
  );
}

export async function getPlanoApi(input: {
  tenantId: string;
  id: string;
}): Promise<Plano> {
  const response = await apiRequest<PlanoApiResponse>({
    path: `/api/v1/comercial/planos/${input.id}`,
    query: { tenantId: input.tenantId },
  });

  return normalizePlanoApiResponse(response, {
    id: input.id,
    tenantId: input.tenantId,
  });
}

export async function createPlanoApi(input: {
  tenantId: string;
  data: Omit<Plano, "id" | "tenantId" | "ativo">;
}): Promise<Plano> {
  const response = await apiRequest<PlanoApiResponse>({
    path: "/api/v1/comercial/planos",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: buildPlanoUpsertApiRequest(input.data),
  });

  return normalizePlanoApiResponse(response, {
    tenantId: input.tenantId,
    ...input.data,
    ativo: true,
  });
}

export async function updatePlanoApi(input: {
  tenantId: string;
  id: string;
  data: Omit<Plano, "id" | "tenantId" | "ativo"> & Pick<Plano, "ativo">;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/planos/${input.id}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: buildPlanoUpsertApiRequest(input.data),
  });
}

export async function togglePlanoAtivoApi(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/planos/${input.id}/toggle-ativo`,
    method: "PATCH",
    query: { tenantId: input.tenantId },
  });
}

export async function togglePlanoDestaqueApi(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/planos/${input.id}/toggle-destaque`,
    method: "PATCH",
    query: { tenantId: input.tenantId },
  });
}

export async function deletePlanoApi(input: {
  tenantId: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/planos/${input.id}`,
    method: "DELETE",
    query: { tenantId: input.tenantId },
  });
}
