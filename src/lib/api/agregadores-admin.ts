/**
 * Admin CRUD de Configuração de Agregadores (Wellhub / TotalPass).
 * Endpoint base: /api/v1/admin/agregadores/config/*
 *
 * ADR-012 — UI Admin para Configuração de Agregadores.
 *
 * Write-only secret lifecycle: `access_token` e `webhook_secret` nunca retornam
 * em GET. Só aparecem uma vez em respostas de POST create / rotate.
 *
 * Fase 3 frontend:
 *  - AG-7.7 / AG-7.8: schema, list/get, test-connection.
 *  - AG-7.9: create, update, rotate-token, rotate-webhook-secret, delete.
 *  - AG-7.10: monitor de eventos (reprocessar) — stub de listagem enquanto
 *    endpoint de GET de eventos não existe (TODO backend).
 */
import { apiRequest } from "./http";

// ─── Types ─────────────────────────────────────────────────────────────────

export type AgregadorTipo = "WELLHUB" | "TOTALPASS";

export type AgregadorSchemaFieldType =
  | "boolean"
  | "string"
  | "enum"
  | "number";

export interface AgregadorSchemaFlag {
  key: string;
  type: AgregadorSchemaFieldType;
  label?: string;
  default?: boolean | string | number | null;
  required?: boolean;
  options?: string[];
}

export interface AgregadorSchemaEntry {
  tipo: AgregadorTipo;
  nome: string;
  camposRequeridos: string[];
  camposOpcionais: string[];
  flags: AgregadorSchemaFlag[];
  webhookEndpoints: string[];
}

export interface AgregadorSchemaResponse {
  agregadores: AgregadorSchemaEntry[];
}

export interface AgregadorConfigResponse {
  tipo: AgregadorTipo;
  tenantId: string;
  enabled: boolean;
  externalGymId?: string | null;
  siteId?: string | null;
  flags?: Record<string, unknown> | null;
  hasToken?: boolean;
  hasWebhookSecret?: boolean;
  lastRotatedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AgregadorConfigListResponse {
  configs: AgregadorConfigResponse[];
}

export interface AgregadorTestConnectionResult {
  success: boolean;
  status?: string;
  message?: string;
  details?: Record<string, unknown> | null;
}

/** Payload de criação (POST /{tipo}). Secrets são opcionais: se omitidos, o
 *  backend pode gerar um novo `webhook_secret`. `access_token` sempre precisa
 *  ser fornecido pelo admin (sistema não gera tokens de parceiro). */
export interface AgregadorConfigCreateInput {
  tenantId: string;
  accessToken: string;
  webhookSecret?: string;
  externalGymId?: string;
  siteId?: string;
  enabled?: boolean;
  flags?: Record<string, unknown>;
}

/** Payload de atualização (PUT /{tipo}). Campos não-sensíveis somente. */
export interface AgregadorConfigUpdateInput {
  tenantId: string;
  externalGymId?: string;
  siteId?: string;
  enabled?: boolean;
  flags?: Record<string, unknown>;
}

/** Resposta de POST create / rotate. Secrets aparecem UMA ÚNICA VEZ. */
export interface AgregadorConfigSecretResponse {
  tipo: AgregadorTipo;
  tenantId: string;
  /** Secret bruto do webhook — presente apenas quando o sistema acaba de
   *  gerar (create sem webhookSecret explícito, ou rotate-webhook-secret). */
  webhookSecret?: string | null;
  /** Novo access_token gerado (em rotate-token). */
  accessToken?: string | null;
  webhookUrl?: string;
  warning?: string;
}

/** Shape assumido para listagem de eventos (AG-7.10). Endpoint ainda não existe;
 *  manter compatível para quando backend expuser `GET /admin/agregadores/eventos`. */
export interface AgregadorWebhookEvento {
  id: string;
  tenantId: string;
  agregador: AgregadorTipo;
  eventType: string;
  externalGymId?: string | null;
  externalUserId?: string | null;
  status: string;
  payload?: Record<string, unknown> | null;
  errorMessage?: string | null;
  retryCount?: number | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AgregadorWebhookEventosPage {
  items: AgregadorWebhookEvento[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListAgregadorEventosInput {
  tenantId: string;
  tipo?: AgregadorTipo;
  eventType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ─── API calls ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/agregadores/config/schema
 * Retorna metadata dos agregadores suportados (campos, flags, webhook endpoints).
 */
export async function getAgregadoresSchemaApi(): Promise<AgregadorSchemaResponse> {
  return apiRequest<AgregadorSchemaResponse>({
    path: "/api/v1/admin/agregadores/config/schema",
    includeContextHeader: false,
  });
}

/**
 * GET /api/v1/admin/agregadores/config?tenantId={uuid}
 * Lista configs do tenant. Secrets não retornam — apenas `hasToken`/`hasWebhookSecret`.
 */
export async function listAgregadoresConfigsApi(input: {
  tenantId: string;
}): Promise<AgregadorConfigResponse[]> {
  const response = await apiRequest<
    AgregadorConfigListResponse | AgregadorConfigResponse[]
  >({
    path: "/api/v1/admin/agregadores/config",
    query: { tenantId: input.tenantId },
    includeContextHeader: false,
  });
  if (Array.isArray(response)) return response;
  return response.configs ?? [];
}

/**
 * POST /api/v1/admin/agregadores/config/{tipo}/test-connection?tenantId={uuid}
 * Executa consultarStatusParceiro() + dry-run validate para validar credenciais.
 */
export async function testAgregadorConnectionApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
}): Promise<AgregadorTestConnectionResult> {
  return apiRequest<AgregadorTestConnectionResult>({
    path: `/api/v1/admin/agregadores/config/${input.tipo}/test-connection`,
    method: "POST",
    query: { tenantId: input.tenantId },
    includeContextHeader: false,
  });
}

/**
 * POST /api/v1/admin/agregadores/config/{tipo}
 * Cria config. Resposta pode retornar `webhookSecret` quando o sistema gera o
 * valor (payload omite `webhookSecret`).
 */
export async function createAgregadorConfigApi(input: {
  tipo: AgregadorTipo;
  payload: AgregadorConfigCreateInput;
}): Promise<AgregadorConfigSecretResponse> {
  const { tenantId, ...rest } = input.payload;
  return apiRequest<AgregadorConfigSecretResponse>({
    path: `/api/v1/admin/agregadores/config/${input.tipo}`,
    method: "POST",
    query: { tenantId },
    body: {
      tenantId,
      ...rest,
    },
    includeContextHeader: false,
  });
}

/**
 * PUT /api/v1/admin/agregadores/config/{tipo}
 * Atualiza campos não-sensíveis. Secrets ficam intocados.
 */
export async function updateAgregadorConfigApi(input: {
  tipo: AgregadorTipo;
  payload: AgregadorConfigUpdateInput;
}): Promise<AgregadorConfigResponse> {
  const { tenantId, ...rest } = input.payload;
  return apiRequest<AgregadorConfigResponse>({
    path: `/api/v1/admin/agregadores/config/${input.tipo}`,
    method: "PUT",
    query: { tenantId },
    body: {
      tenantId,
      ...rest,
    },
    includeContextHeader: false,
  });
}

/**
 * POST /api/v1/admin/agregadores/config/{tipo}/rotate-token
 * Troca o access_token pelo valor informado. Backend mantém grace period
 * de 24h (aceita token antigo + novo).
 */
export async function rotateAgregadorTokenApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
  newAccessToken: string;
}): Promise<AgregadorConfigSecretResponse> {
  return apiRequest<AgregadorConfigSecretResponse>({
    path: `/api/v1/admin/agregadores/config/${input.tipo}/rotate-token`,
    method: "POST",
    body: {
      tenantId: input.tenantId,
      newAccessToken: input.newAccessToken,
    },
    includeContextHeader: false,
  });
}

/**
 * POST /api/v1/admin/agregadores/config/{tipo}/rotate-webhook-secret
 * Gera novo webhook_secret. Resposta traz o valor UMA ÚNICA VEZ.
 */
export async function rotateAgregadorWebhookSecretApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
}): Promise<AgregadorConfigSecretResponse> {
  return apiRequest<AgregadorConfigSecretResponse>({
    path: `/api/v1/admin/agregadores/config/${input.tipo}/rotate-webhook-secret`,
    method: "POST",
    body: { tenantId: input.tenantId },
    includeContextHeader: false,
  });
}

/**
 * DELETE /api/v1/admin/agregadores/config/{tipo}?tenantId={uuid}
 * Soft delete — define enabled=false e limpa secrets. Linha persiste para
 * auditoria; "reconfigurar" repovoa os secrets.
 */
export async function deleteAgregadorConfigApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
}): Promise<void> {
  await apiRequest<unknown>({
    path: `/api/v1/admin/agregadores/config/${input.tipo}`,
    method: "DELETE",
    query: { tenantId: input.tenantId },
    includeContextHeader: false,
  });
}

/**
 * GET /api/v1/admin/agregadores/eventos (AG-7.10 — TODO backend).
 *
 * Endpoint de listagem ainda não existe. Esta função retorna um page vazio
 * para que a UI seja montada e testada. Quando o backend entregar, substituir
 * pelo fetch real sem mudar a assinatura / shape de retorno.
 *
 * TODO: AG-7.10.backend — criar `AgregadorEventoAdminController#list`.
 */
export async function listAgregadorEventosApi(
  _input: ListAgregadorEventosInput,
): Promise<AgregadorWebhookEventosPage> {
  const pageSize = _input.pageSize ?? 25;
  const page = _input.page ?? 0;
  return {
    items: [],
    total: 0,
    page,
    pageSize,
  };
}

/**
 * POST /api/v1/integracoes/agregadores/{tipo}/webhooks/{eventId}/reprocessar?tenantId={uuid}
 * Reprocessa um evento de webhook já persistido. Endpoint existe no
 * `AgregadoresController` (não-admin) — mas a UI admin pode invocá-lo para
 * operações pontuais de troubleshooting.
 */
export async function reprocessarAgregadorEventoApi(input: {
  tipo: AgregadorTipo;
  tenantId: string;
  eventId: string;
}): Promise<{ success: boolean; message?: string }> {
  return apiRequest<{ success: boolean; message?: string }>({
    path: `/api/v1/integracoes/agregadores/${input.tipo}/webhooks/${input.eventId}/reprocessar`,
    method: "POST",
    query: { tenantId: input.tenantId },
    includeContextHeader: false,
  });
}

// ─── AG-12 — Dashboard BI dos Agregadores ──────────────────────────────────

/** Filtro por tipo na query de dashboard. "TODOS" ⇒ somar os dois. */
export type DashboardAgregadorFiltro = "WELLHUB" | "TOTALPASS" | "TODOS";

export interface DashboardKpis {
  checkinsValidados: number;
  clientesUnicosAtivos: number;
  valorTotal: number;
  ticketMedioPorCheckin: number;
  ticketMedioPorCliente: number;
  mediaCheckinsPorCliente: number;
  webhooksRecebidos: number;
  webhooksComPrevious: number;
  webhooksAssinaturaInvalida: number;
  deadLetters: number;
}

export interface DashboardPorAgregador {
  agregador: AgregadorTipo;
  checkins: number;
  clientesUnicos: number;
  valorTotal: number;
  ticketMedioPorCheckin: number;
  ticketMedioPorCliente: number;
  mediaCheckinsPorCliente: number;
}

export interface DashboardSerieDiariaPonto {
  /** ISO date "YYYY-MM-DD". */
  data: string;
  checkins: number;
  valorTotal: number;
}

export interface DashboardDistribuicaoSemanaPonto {
  /** 1=DOM, 2=SEG, ..., 7=SAB (ISO javascript `getDay()+1` ou equivalente). */
  diaDaSemana: number;
  label: string;
  checkins: number;
  valorTotal: number;
}

export interface DashboardTopCliente {
  alunoId: string | null;
  externalUserId: string;
  nome: string | null;
  agregador: AgregadorTipo;
  checkins: number;
  valorTotal: number;
  /** ISO datetime. */
  ultimaVisita: string;
}

export interface DashboardComparativo {
  checkinsMesAnterior: number;
  valorTotalMesAnterior: number;
  /** Variação em pontos percentuais (ex: 12.18 ⇒ +12,18%). */
  variacaoCheckinsPct: number;
  variacaoValorPct: number;
}

export interface DashboardMesResponse {
  tenantId: string;
  ano: number;
  /** 1-12. */
  mes: number;
  tipoFiltro: DashboardAgregadorFiltro;
  kpis: DashboardKpis;
  porAgregador: DashboardPorAgregador[];
  serieDiaria: DashboardSerieDiariaPonto[];
  distribuicaoSemana: DashboardDistribuicaoSemanaPonto[];
  topClientes: DashboardTopCliente[];
  comparativo: DashboardComparativo;
}

export interface GetAgregadoresDashboardInput {
  tenantId: string;
  /** Default: mês corrente (BR). */
  ano?: number;
  /** 1-12. Default: mês corrente (BR). */
  mes?: number;
  /** Default: "TODOS". */
  tipo?: DashboardAgregadorFiltro;
}

/**
 * GET /api/v1/admin/agregadores/dashboard?tenantId=...&ano=...&mes=...&tipo=...
 *
 * AG-12 (ADR-012 / AGREGADORES §11): consolida métricas do mês do tenant.
 * Backend ainda em implementação paralela. Se o endpoint retornar 404 /
 * backend_indisponivel, a UI cai em um fixture determinístico via
 * {@link buildDashboardFixture} para permitir validação visual fim-a-fim.
 *
 * TODO AG-12.backend: remover fallback quando endpoint estiver estável.
 */
export async function getAgregadoresDashboardApi(
  input: GetAgregadoresDashboardInput,
): Promise<DashboardMesResponse> {
  const { tenantId, ano, mes, tipo } = input;
  const query: Record<string, string> = { tenantId };
  if (ano != null) query.ano = String(ano);
  if (mes != null) query.mes = String(mes);
  if (tipo) query.tipo = tipo;

  try {
    return await apiRequest<DashboardMesResponse>({
      path: "/api/v1/admin/agregadores/dashboard",
      query,
      includeContextHeader: false,
    });
  } catch (err) {
    // Fallback silencioso enquanto backend AG-12 não está em produção.
    const status = (err as { status?: number } | null)?.status;
    if (status === 404 || status === 501 || status == null) {
      return buildDashboardFixture({
        tenantId,
        ano: ano ?? new Date().getFullYear(),
        mes: mes ?? new Date().getMonth() + 1,
        tipo: tipo ?? "TODOS",
      });
    }
    throw err;
  }
}

// ─── Fixture para desenvolvimento ──────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/**
 * Constroi resposta determinística para testes/dev enquanto o endpoint AG-12
 * não está implementado no backend. Os números são derivados de um seed
 * baseado em tenantId+ano+mes para dar estabilidade entre renders.
 */
export function buildDashboardFixture(params: {
  tenantId: string;
  ano: number;
  mes: number;
  tipo: DashboardAgregadorFiltro;
}): DashboardMesResponse {
  const { tenantId, ano, mes, tipo } = params;
  const seed =
    [...tenantId].reduce((acc, c) => acc + c.charCodeAt(0), 0) +
    ano * 12 +
    mes;
  const rnd = seededRandom(seed);

  const daysInMonth = new Date(ano, mes, 0).getDate();
  const serieDiaria: DashboardSerieDiariaPonto[] = Array.from(
    { length: daysInMonth },
    (_, i) => {
      const dia = i + 1;
      const checkins = 20 + Math.round(rnd() * 50);
      const valor = checkins * 10;
      return {
        data: `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`,
        checkins,
        valorTotal: valor,
      };
    },
  );

  const totalCheckins = serieDiaria.reduce((acc, p) => acc + p.checkins, 0);
  const totalValor = serieDiaria.reduce((acc, p) => acc + p.valorTotal, 0);

  const labelsSemana = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
  const distribuicaoSemana: DashboardDistribuicaoSemanaPonto[] = labelsSemana.map(
    (label, idx) => {
      const share = [0.09, 0.18, 0.15, 0.17, 0.16, 0.14, 0.11][idx] ?? 1 / 7;
      const checkins = Math.round(totalCheckins * share);
      return {
        diaDaSemana: idx + 1,
        label,
        checkins,
        valorTotal: checkins * 10,
      };
    },
  );

  const wellhubCheckins = Math.round(totalCheckins * 0.72);
  const totalpassCheckins = totalCheckins - wellhubCheckins;
  const wellhubValor = wellhubCheckins * 10;
  const totalpassValor = totalCheckins * 10 - wellhubValor;

  const porAgregador: DashboardPorAgregador[] = [
    {
      agregador: "WELLHUB",
      checkins: wellhubCheckins,
      clientesUnicos: Math.max(1, Math.round(wellhubCheckins / 2.64)),
      valorTotal: wellhubValor,
      ticketMedioPorCheckin: 10,
      ticketMedioPorCliente: 26.47,
      mediaCheckinsPorCliente: 2.64,
    },
    {
      agregador: "TOTALPASS",
      checkins: totalpassCheckins,
      clientesUnicos: Math.max(1, Math.round(totalpassCheckins / 2.88)),
      valorTotal: totalpassValor,
      ticketMedioPorCheckin: totalpassCheckins === 0
        ? 0
        : Math.round((totalpassValor / totalpassCheckins) * 100) / 100,
      ticketMedioPorCliente: 28.84,
      mediaCheckinsPorCliente: 2.88,
    },
  ];

  const clientesUnicos = porAgregador.reduce(
    (acc, p) => acc + p.clientesUnicos,
    0,
  );

  const topClientes: DashboardTopCliente[] = Array.from({ length: 12 }, (_, i) => {
    const isWellhub = i % 3 !== 0;
    const checkins = 20 - i;
    return {
      alunoId: i % 4 === 0 ? null : `aluno-${i + 1}-${seed}`,
      externalUserId: `ext-${100 + i}`,
      nome: i % 5 === 0 ? null : `Cliente ${i + 1}`,
      agregador: (isWellhub ? "WELLHUB" : "TOTALPASS") as AgregadorTipo,
      checkins,
      valorTotal: checkins * 10,
      ultimaVisita: `${ano}-${String(mes).padStart(2, "0")}-${String(Math.min(daysInMonth, 28 - i)).padStart(2, "0")}T14:30:00`,
    };
  });

  const valorAnterior = Math.round(totalValor * 0.89);
  const checkinsAnterior = Math.round(totalCheckins * 0.89);
  const variacaoCheckinsPct =
    checkinsAnterior === 0
      ? 0
      : Math.round(((totalCheckins - checkinsAnterior) / checkinsAnterior) * 10000) /
        100;
  const variacaoValorPct =
    valorAnterior === 0
      ? 0
      : Math.round(((totalValor - valorAnterior) / valorAnterior) * 10000) / 100;

  return {
    tenantId,
    ano,
    mes,
    tipoFiltro: tipo,
    kpis: {
      checkinsValidados: totalCheckins,
      clientesUnicosAtivos: clientesUnicos,
      valorTotal: totalValor,
      ticketMedioPorCheckin:
        totalCheckins === 0 ? 0 : Math.round((totalValor / totalCheckins) * 100) / 100,
      ticketMedioPorCliente:
        clientesUnicos === 0
          ? 0
          : Math.round((totalValor / clientesUnicos) * 100) / 100,
      mediaCheckinsPorCliente:
        clientesUnicos === 0
          ? 0
          : Math.round((totalCheckins / clientesUnicos) * 100) / 100,
      webhooksRecebidos: totalCheckins + 16,
      webhooksComPrevious: 3,
      webhooksAssinaturaInvalida: 0,
      deadLetters: 0,
    },
    porAgregador,
    serieDiaria,
    distribuicaoSemana,
    topClientes,
    comparativo: {
      checkinsMesAnterior: checkinsAnterior,
      valorTotalMesAnterior: valorAnterior,
      variacaoCheckinsPct,
      variacaoValorPct,
    },
  };
}
