import { apiRequest } from "./http";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PesquisaTipo = "NPS" | "SATISFACAO";
export type StatusEnvio = "ENVIADA" | "RESPONDIDA" | "EXPIRADA" | "CANCELADA";
export type Classificacao = "DETRATOR" | "NEUTRO" | "PROMOTOR";
export type CanalNotificacao = "EMAIL" | "PUSH" | "SMS" | "WHATSAPP";

export interface NpsCampanha {
  id: string;
  nome: string;
  tipo: PesquisaTipo;
  gatilho: string | null;
  pergunta: string;
  mensagemConvite: string | null;
  canalPadrao: CanalNotificacao | null;
  diasCooldown: number;
  ativo: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NpsEnvio {
  id: string;
  tenantId: string;
  campanhaId: string;
  campanha: string;
  alunoId: string;
  alunoNome: string;
  canal: CanalNotificacao;
  status: StatusEnvio;
  disparadoPorEvento: string | null;
  referenciaId: string | null;
  notificacaoEventoId: string | null;
  notaNps: number | null;
  classificacao: Classificacao | null;
  comentario: string | null;
  tentativas: number;
  enviadoEm: string | null;
  respondidoEm: string | null;
}

export interface NpsDashboardCritico {
  envioId: string;
  alunoId: string;
  alunoNome: string;
  nota: number;
  classificacao: Classificacao;
  comentario: string | null;
  respondidoEm: string;
}

export interface NpsDashboard {
  tenantId: string;
  inicio: string;
  fim: string;
  totalRespostas: number;
  promotores: number;
  neutros: number;
  detratores: number;
  npsScore: number;
  notaMedia: number;
  itensCriticos: NpsDashboardCritico[];
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** GET /api/v1/retencao/nps/campanhas */
export async function listNpsCampanhasApi(input: {
  tenantId: string;
}): Promise<NpsCampanha[]> {
  return apiRequest<NpsCampanha[]>({
    path: "/api/v1/retencao/nps/campanhas",
    query: { tenantId: input.tenantId },
  });
}

/** POST /api/v1/retencao/nps/campanhas */
export async function createNpsCampanhaApi(input: {
  tenantId: string;
  data: {
    nome: string;
    tipo: PesquisaTipo;
    gatilho?: string;
    pergunta: string;
    mensagemConvite?: string;
    canalPadrao?: CanalNotificacao;
    diasCooldown?: number;
    ativo?: boolean;
  };
}): Promise<NpsCampanha> {
  return apiRequest<NpsCampanha>({
    path: "/api/v1/retencao/nps/campanhas",
    method: "POST",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

/** PUT /api/v1/retencao/nps/campanhas/{id} */
export async function updateNpsCampanhaApi(input: {
  tenantId: string;
  campanhaId: string;
  data: {
    nome: string;
    tipo: PesquisaTipo;
    gatilho?: string;
    pergunta: string;
    mensagemConvite?: string;
    canalPadrao?: CanalNotificacao;
    diasCooldown?: number;
    ativo?: boolean;
  };
}): Promise<NpsCampanha> {
  return apiRequest<NpsCampanha>({
    path: `/api/v1/retencao/nps/campanhas/${input.campanhaId}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: input.data,
  });
}

/** POST /api/v1/retencao/nps/campanhas/{id}/disparar */
export async function dispararNpsCampanhaApi(input: {
  tenantId: string;
  campanhaId: string;
  alunoIds?: string[];
  canais?: string[];
}): Promise<void> {
  return apiRequest<void>({
    path: `/api/v1/retencao/nps/campanhas/${input.campanhaId}/disparar`,
    method: "POST",
    query: { tenantId: input.tenantId },
    body: {
      ...(input.alunoIds ? { alunoIds: input.alunoIds } : {}),
      ...(input.canais ? { canais: input.canais } : {}),
    },
  });
}

/** GET /api/v1/retencao/nps/dashboard */
export async function getNpsDashboardApi(input: {
  tenantId: string;
  inicio: string;
  fim: string;
}): Promise<NpsDashboard> {
  return apiRequest<NpsDashboard>({
    path: "/api/v1/retencao/nps/dashboard",
    query: {
      tenantId: input.tenantId,
      inicio: input.inicio,
      fim: input.fim,
    },
  });
}

/** GET /api/v1/retencao/nps/envios */
export async function listNpsEnviosApi(input: {
  tenantId: string;
  alunoId?: string;
  status?: StatusEnvio;
}): Promise<NpsEnvio[]> {
  return apiRequest<NpsEnvio[]>({
    path: "/api/v1/retencao/nps/envios",
    query: {
      tenantId: input.tenantId,
      alunoId: input.alunoId,
      status: input.status,
    },
  });
}

/** POST /api/v1/retencao/nps/envios/{tokenResposta}/responder */
export async function responderNpsEnvioApi(input: {
  tokenResposta: string;
  nota: number;
  comentario?: string;
  origem?: string;
}): Promise<void> {
  return apiRequest<void>({
    path: `/api/v1/retencao/nps/envios/${input.tokenResposta}/responder`,
    method: "POST",
    body: {
      nota: input.nota,
      ...(input.comentario ? { comentario: input.comentario } : {}),
      ...(input.origem ? { origem: input.origem } : {}),
    },
  });
}
