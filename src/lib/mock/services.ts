import { getStore, setStore, TENANT_ID_DEFAULT } from "./store";
import type {
  Prospect,
  Aluno,
  Atividade,
  AtividadeGrade,
  Plano,
  Matricula,
  Pagamento,
  ContaPagar,
  FormaPagamento,
  Funcionario,
  Servico,
  BandeiraCartao,
  CartaoCliente,
  Presenca,
  Tenant,
  HorarioFuncionamento,
  Convenio,
  Voucher,
  CategoriaAtividade,
  StatusProspect,
  StatusAluno,
  StatusAgendamento,
  Sexo,
  TipoPlano,
  TipoFormaPagamento,
  CreateProspectInput,
  ConverterProspectInput,
  ConverterProspectResponse,
  DashboardData,
  DREProjecao,
  DreProjectionScenario,
  ReceberPagamentoInput,
  ProspectMensagem,
  ProspectAgendamento,
  VoucherCodigo,
  VoucherAplicarEm,
  VoucherEscopo,
  Sala,
  Cargo,
  Produto,
  Venda,
  VendaItem,
  PagamentoVenda,
  TipoVenda,
  Academia,
  CampanhaCRM,
  Treino,
  CampanhaCanal,
  CampanhaPublicoAlvo,
  CampanhaStatus,
  Exercicio,
  CategoriaContaPagar,
  StatusContaPagar,
  DREGerencial,
  GrupoDre,
  TipoContaPagar,
  RegraRecorrenciaContaPagar,
  RecorrenciaContaPagar,
  TerminoRecorrenciaContaPagar,
  PaginatedResult,
  PaginatedAlunosResult,
} from "../types";
import { isRealApiEnabled } from "../api/http";
import {
  loginApi,
  meApi,
  refreshTokenApi,
  switchTenantApi,
  type AuthUser,
} from "../api/auth";
import {
  clearAuthSession,
  getActiveTenantIdFromSession,
  getAccessToken,
  getAvailableTenantsFromSession,
  setAvailableTenants,
  getRefreshToken,
  setActiveTenantId,
  setMockSessionActive,
} from "../api/session";
import {
  createTipoContaPagarApi,
  listTiposContaPagarApi,
  toggleTipoContaPagarApi,
  updateTipoContaPagarApi,
} from "../api/tipos-conta";
import {
  cancelRegraRecorrenciaApi,
  cancelarContaPagarApi,
  createContaPagarApi,
  getDreProjecaoApi,
  getDreGerencialApi,
  listContasPagarApi,
  listRegrasRecorrenciaContaPagarApi,
  pagarContaPagarApi,
  pauseRegraRecorrenciaApi,
  resumeRegraRecorrenciaApi,
  triggerGeracaoContasRecorrentesApi,
  updateContaPagarApi,
} from "../api/financeiro-gerencial";
import {
  createFormaPagamentoApi,
  deleteFormaPagamentoApi,
  getFormasPagamentoLabelsApi,
  listFormasPagamentoApi,
  toggleFormaPagamentoApi,
  updateFormaPagamentoApi,
} from "../api/formas-pagamento";
import {
  listarAcessosCatracaDashboardApi,
  gerarCatracaCredencialApi,
  liberarAcessoCatracaApi,
  listarCatracaWsStatusApi,
  obterCatracaWsStatusPorTenantApi,
  type CatracaAcessosDashboardResponse,
  type CatracaAgentConexao,
  type CatracaCredentialResponse,
  type CatracaWsStatusResponse,
} from "../api/catraca";
import {
  createUnidadeApi,
  deleteUnidadeApi,
  getAcademiaAtualApi,
  getTenantContextApi,
  listAcademiasApi,
  listHorariosApi,
  listUnidadesApi,
  toggleUnidadeApi,
  updateAcademiaAtualApi,
  updateHorariosApi,
  updateTenantAtualApi,
  updateUnidadeApi,
} from "../api/contexto-unidades";
import {
  addProspectMensagemApi,
  buildProspectUpsertApiRequest,
  checkProspectDuplicateApi,
  converterProspectApi,
  createProspectApi,
  criarProspectAgendamentoApi,
  deleteProspectApi,
  getProspectApi,
  listProspectAgendamentosApi,
  listProspectMensagensApi,
  listProspectsApi,
  marcarProspectPerdidoApi,
  updateProspectAgendamentoApi,
  updateProspectApi,
  updateProspectStatusApi,
} from "../api/crm";
import { getDashboardApi } from "../api/dashboard";
import {
  createAlunoApi,
  createAlunoComMatriculaApi,
  getAlunoApi,
  extractAlunosFromListResponse,
  extractAlunosTotais,
  listAlunosApi,
  updateAlunoApi,
  updateAlunoStatusApi,
} from "../api/alunos";
import {
  createAtividadeApi,
  createAtividadeGradeApi,
  createCargoApi,
  createFuncionarioApi,
  createSalaApi,
  deleteAtividadeApi,
  deleteAtividadeGradeApi,
  deleteCargoApi,
  deleteFuncionarioApi,
  deleteSalaApi,
  listAtividadeGradesApi,
  listAtividadesApi,
  listCargosApi,
  listFuncionariosApi,
  listSalasApi,
  toggleAtividadeApi,
  toggleAtividadeGradeApi,
  toggleCargoApi,
  toggleFuncionarioApi,
  toggleSalaApi,
  updateAtividadeApi,
  updateAtividadeGradeApi,
  updateCargoApi,
  updateFuncionarioApi,
  updateSalaApi,
} from "../api/administrativo";
import {
  createConvenioApi,
  createVoucherApi,
  deleteConvenioApi,
  listConveniosApi,
  listVoucherCodigosApi,
  listVoucherUsageCountsApi,
  listVouchersApi,
  toggleConvenioApi,
  toggleVoucherApi as toggleVoucherApiAdmin,
  updateConvenioApi,
  updateVoucherApi as updateVoucherApiAdmin,
} from "../api/beneficios";
import {
  buildPlanoUpsertApiRequest,
  createPlanoApi,
  createProdutoApi,
  createServicoApi,
  deletePlanoApi,
  deleteProdutoApi,
  deleteServicoApi,
  getPlanoApi,
  listPlanosApi,
  listProdutosApi,
  listServicosApi,
  togglePlanoAtivoApi,
  togglePlanoDestaqueApi,
  toggleProdutoApi,
  toggleServicoApi,
  updatePlanoApi,
  updateProdutoApi,
  updateServicoApi,
} from "../api/comercial-catalogo";
import {
  listPagamentosApi,
  receberPagamentoApi,
  emitirNfsePagamentoApi,
} from "../api/pagamentos";
import {
  cancelarContaReceberApi,
  createContaReceberApi,
  listContasReceberApi,
  receberContaReceberApi,
  type CategoriaContaReceberApi,
  type ContaReceberApiResponse,
  type StatusContaReceberApi,
  updateContaReceberApi,
} from "../api/contas-receber";
import {
  getBotPromptApi,
  getBotPromptTemplateApi,
  type BotPromptResponse,
} from "../api/bot";
import {
  createExercicioApi,
  createTreinoApi,
  getTreinoApi,
  deleteExercicioApi,
  listExerciciosApi,
  listTreinosApi,
  updateTreinoApi,
  toggleExercicioApi,
  type ExercicioApiResponse,
  type TreinoApiResponse,
  type TreinoStatusApi,
  type UpdateTreinoApiInput,
} from "../api/treinos";
import {
  createVendaApi,
  listVendasApi,
  type ListVendasApiEnvelopeResult,
} from "../api/vendas";

function genId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function now(): string {
  return new Date().toISOString().slice(0, 19);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function monthDateRange(month: number, year: number): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
    end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
  };
}

function inDateRange(date: string | undefined, start: string, end: string): boolean {
  if (!date) return false;
  return date >= start && date <= end;
}

function contaPagarTotal(conta: ContaPagar): number {
  const bruto = Number(conta.valorOriginal ?? 0);
  const desconto = Number(conta.desconto ?? 0);
  const juros = Number(conta.jurosMulta ?? 0);
  return Math.max(0, bruto - desconto + juros);
}

function getMonthStart(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function toLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

function addDaysToDate(date: string, days: number): string {
  const parsed = parseDate(date);
  parsed.setDate(parsed.getDate() + days);
  return toLocalDate(parsed);
}

function getNextMonthlyDate(baseDate: string, dayOfMonth: number, step = 1): string {
  const current = parseDate(baseDate);
  current.setMonth(current.getMonth() + step);
  const year = current.getFullYear();
  const month = current.getMonth();
  const maxDay = new Date(year, month + 1, 0).getDate();
  current.setDate(Math.min(dayOfMonth, maxDay));
  return toLocalDate(current);
}

function matchesRuleTermination(
  rule: RegraRecorrenciaContaPagar,
  generatedCount: number,
  nextDueDate: string
): boolean {
  if (rule.termino === "SEM_FIM") return true;
  if (rule.termino === "EM_DATA") {
    return !rule.dataFim || nextDueDate <= rule.dataFim;
  }
  if (rule.termino === "APOS_OCORRENCIAS") {
    const max = Math.max(1, Number(rule.numeroOcorrencias ?? 1));
    return generatedCount < max;
  }
  return true;
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

function normalizeTenantId(value: string | undefined): string | undefined {
  const candidate = value?.trim();
  return candidate || undefined;
}

type SessionTenantPreference = ReturnType<typeof getAvailableTenantsFromSession>;

function getAvailableTenantIdsFromSessionResolved(): string[] {
  const sessionIds = getAvailableTenantsFromSession().map((tenant) => tenant.tenantId);
  if (sessionIds.length > 0) {
    return sessionIds;
  }
  const tenantIds = new Set(getStore().tenants.map((tenant) => tenant.id));
  if (!tenantIds.size) {
    return [];
  }
  return Array.from(tenantIds);
}

function normalizeEntityList<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const candidates: unknown = (value as Record<string, unknown>).items
    ?? (value as Record<string, unknown>).content
    ?? (value as Record<string, unknown>).data
    ?? (value as Record<string, unknown>).rows
    ?? (value as Record<string, unknown>).result
    ?? (value as Record<string, unknown>).itens;

  if (Array.isArray(candidates)) {
    return candidates as T[];
  }

  return [];
}

function toStringOrEmpty(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function normalizeAtividadeItem(raw: unknown): Atividade | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const input = raw as Record<string, unknown>;
  const id = toStringOrEmpty(input.id);
  const tenantId = toStringOrEmpty(input.tenantId);
  if (!id || !tenantId) return undefined;

  const categoria = toStringOrEmpty(input.categoria) as CategoriaAtividade;
  const nome = toStringOrEmpty(input.nome) || "Sem nome";

  return {
    id,
    tenantId,
    nome,
    descricao: typeof input.descricao === "string" ? input.descricao : undefined,
    categoria: (categoria as CategoriaAtividade) || "OUTRA",
    icone: typeof input.icone === "string" ? input.icone : "",
    cor: typeof input.cor === "string" ? input.cor : "#3de8a0",
    permiteCheckin: input.permiteCheckin === true,
    checkinObrigatorio: input.checkinObrigatorio === true,
    ativo: input.ativo === false ? false : true,
  };
}

function getAvailableTenantsFromSessionOrdered(): SessionTenantPreference {
  return getAvailableTenantsFromSession()
    .filter((tenant) => typeof tenant.tenantId === "string" && tenant.tenantId.trim())
    .filter((tenant, index, source) =>
      source.findIndex((item) => item.tenantId === tenant.tenantId) === index
    );
}

function getAvailableTenantIdsFromSession(): string[] {
  return getAvailableTenantsFromSessionOrdered().map((tenant) => tenant.tenantId);
}

function getDefaultTenantIdFromSession(): string | undefined {
  const availableTenants = getAvailableTenantsFromSessionOrdered();
  const resolvedIds = new Set(getAvailableTenantIdsFromSessionResolved());
  const defaultFromSession = availableTenants.find(
    (tenant) => tenant.defaultTenant && resolvedIds.has(tenant.tenantId)
  )?.tenantId;
  return defaultFromSession ?? getAvailableTenantIdsFromSessionResolved()[0];
}

function visibleTenantsFromSession(tenants: Tenant[]): Tenant[] {
  const deduped = dedupeTenants(tenants);
  const availableTenants = getAvailableTenantsFromSessionOrdered();
  if (!availableTenants.length) {
    return deduped.filter((tenant) => tenant.ativo !== false);
  }

  const byId = new Map<string, Tenant>();
  for (const tenant of deduped) {
    byId.set(tenant.id, tenant);
  }

  const visibleFromSession = availableTenants
    .map((tenant) => byId.get(tenant.tenantId))
    .filter((tenant): tenant is Tenant => Boolean(tenant));
  return visibleFromSession.filter((tenant) => tenant.ativo !== false);
}

function resolveSessionTenantId(): { tenantId?: string; isRestricted: boolean } {
  const sessionTenantId = normalizeTenantId(getActiveTenantIdFromSession());
  const allowedIds = getAvailableTenantIdsFromSessionResolved();
  if (!sessionTenantId) {
    return { isRestricted: allowedIds.length > 0, tenantId: undefined };
  }
  if (allowedIds.length === 0 || allowedIds.includes(sessionTenantId)) {
    return { isRestricted: allowedIds.length > 0, tenantId: sessionTenantId };
  }
  return { isRestricted: true, tenantId: undefined };
}

function chooseVisibleTenantBySession(
  tenants: Tenant[],
  fallbackId?: string
): Tenant | undefined {
  const { tenantId: sessionTenantId, isRestricted } = resolveSessionTenantId();
  const allowedIds = getAvailableTenantIdsFromSessionResolved();
  const fallbackTenantId = getDefaultTenantIdFromSession() ?? (allowedIds.length ? allowedIds[0] : undefined);

  if (sessionTenantId) {
    const matchedSession = tenants.find((tenant) => tenant.id === sessionTenantId);
    if (matchedSession) return matchedSession;
    if (!isRestricted) {
      return tenants.find((tenant) => tenant.id === sessionTenantId) ?? tenants[0] ?? { id: sessionTenantId, nome: "Unidade" } as Tenant;
    }
  }

  if (allowedIds.length && fallbackId && allowedIds.includes(fallbackId)) {
    const fromFallback = tenants.find((tenant) => tenant.id === fallbackId);
    if (fromFallback) return fromFallback;
  }

  if (fallbackTenantId) {
    const fromDefault = tenants.find((tenant) => tenant.id === fallbackTenantId);
    if (fromDefault) return fromDefault;
  }

  const visible = visibleTenantsFromSession(tenants);
  if (visible.length) return visible[0];

  if (fallbackId) {
    return tenants.find((tenant) => tenant.id === fallbackId);
  }
  return tenants[0];
}

function resolveTenantForApi(): string {
  const { tenantId: sessionTenantId, isRestricted } = resolveSessionTenantId();
  const store = getStore();

  if (tenantContextHydratedFromApi && store.currentTenantId) {
    return store.currentTenantId;
  }

  if (sessionTenantId) {
    const tenantInStore = store.tenants.find((tenant) => tenant.id === sessionTenantId);
    if (tenantInStore) return tenantInStore.id;
    if (!isRestricted) {
      return sessionTenantId;
    }
  }

  const allowedIds = getAvailableTenantIdsFromSessionResolved();
  const allowedInStore = allowedIds
    .map((id) => store.tenants.find((tenant) => tenant.id === id))
    .find((tenant): tenant is Tenant => Boolean(tenant));
  if (allowedInStore) return allowedInStore.id;

  const fallbackTenantId = getDefaultTenantIdFromSession() ?? getTenantFromContextFallback().id;
  if (fallbackTenantId && fallbackTenantId !== TENANT_ID_DEFAULT) {
    return fallbackTenantId;
  }

  if (store.currentTenantId && isTenantKnown(store.currentTenantId)) {
    return store.currentTenantId;
  }

  if (store.tenant?.id && isTenantKnown(store.tenant.id)) {
    return store.tenant.id;
  }
  return TENANT_ID_DEFAULT;
}

function isTenantKnown(tenantId: string): boolean {
  const allowedIds = getAvailableTenantIdsFromSessionResolved();
  if (allowedIds.length > 0) {
    if (tenantContextHydratedFromApi) {
      return getStore().tenants.some((tenant) => tenant.id === tenantId);
    }
    return allowedIds.includes(tenantId);
  }
  return getStore().tenants.some((tenant) => tenant.id === tenantId);
}

function syncCurrentTenantFromSessionIfNeeded(): string | undefined {
  const { tenantId: activeTenantId, isRestricted } = resolveSessionTenantId();
  const storeSnapshot = getStore();
  const contextTenantId = tenantContextHydratedFromApi
    ? normalizeTenantId(storeSnapshot.currentTenantId)
    : undefined;
  const contextTenant =
    contextTenantId ? storeSnapshot.tenants.find((tenant) => tenant.id === contextTenantId) : undefined;

  if (tenantContextHydratedFromApi && contextTenant && contextTenant.id !== activeTenantId) {
    setStore((s) => ({
      ...s,
      currentTenantId: contextTenant.id,
      tenant: contextTenant,
    }));
    setActiveTenantId(contextTenant.id);
    return contextTenant.id;
  }

  if (!activeTenantId) {
    return resolveTenantForApi();
  }

  const allowedTenantIds = getAvailableTenantIdsFromSessionResolved();
  if (allowedTenantIds.length && !allowedTenantIds.includes(activeTenantId)) {
    const fallbackTenantId = getDefaultTenantIdFromSession() || allowedTenantIds[0];
    if (fallbackTenantId && fallbackTenantId !== activeTenantId) {
      setActiveTenantId(fallbackTenantId);
      return fallbackTenantId;
    }
  }

  const activeExistsInStore = getStore().tenants.some((tenant) => tenant.id === activeTenantId);
  if (!isRealApiEnabled()) {
    if (!activeExistsInStore) {
      return undefined;
    }
    setStore((s) => ({
      ...s,
      currentTenantId: activeTenantId,
      tenant: s.tenants.find((tenant) => tenant.id === activeTenantId) ?? s.tenant,
    }));
    return activeTenantId;
  }

  if (!activeExistsInStore && !isRestricted && !tenantContextHydratedFromApi) {
    setStore((s) => ({
      ...s,
      currentTenantId: activeTenantId,
    }));
    return activeTenantId;
  }

  if (!activeExistsInStore && (isRestricted || tenantContextHydratedFromApi)) {
    return resolveTenantForApi();
  }

  const store = getStore();
  if (!activeExistsInStore) {
    setStore((s) => ({
      ...s,
      currentTenantId: activeTenantId,
      tenant: s.tenants.find((tenant) => tenant.id === activeTenantId) ?? s.tenant,
    }));
    return resolveTenantForApi();
  }

  if (store.currentTenantId === activeTenantId && store.tenant?.id === activeTenantId) {
    return activeTenantId;
  }

  const tenantFromSession = store.tenants.find((tenant) => tenant.id === activeTenantId);
  const fallback = tenantFromSession ?? store.tenants.find((tenant) => tenant.id === getDefaultTenantIdFromSession());
  setStore((s) => ({
    ...s,
    currentTenantId: activeTenantId,
    tenant: fallback ?? s.tenant,
  }));
  return activeTenantId;
}

function getCurrentTenantId(): string {
  const sessionTenantId = syncCurrentTenantFromSessionIfNeeded();
  if (sessionTenantId) {
    return sessionTenantId;
  }
  const store = getStore();
  return (
    normalizeTenantId(store.currentTenantId) ??
    normalizeTenantId(store.tenant?.id) ??
    store.tenants[0]?.id ??
    TENANT_ID_DEFAULT
  );
}

function resolveTenantIdForApiCall(): string | undefined {
  const activeTenantId = normalizeTenantId(getActiveTenantIdFromSession());
  const allowedTenantIds = getAvailableTenantIdsFromSessionResolved();
  if (!allowedTenantIds.length) {
    return activeTenantId ?? normalizeTenantId(getCurrentTenantId());
  }
  if (activeTenantId && allowedTenantIds.includes(activeTenantId)) {
    return activeTenantId;
  }

  const currentTenantId = normalizeTenantId(getCurrentTenantId());
  if (currentTenantId && allowedTenantIds.includes(currentTenantId)) {
    return currentTenantId;
  }

  return allowedTenantIds[0] || undefined;
}

function hydrateTenantContextFromSessionCache(): boolean {
  const store = getStore();
  if (tenantContextHydratedFromApi) return true;

  const availableTenantIds = getAvailableTenantIdsFromSessionResolved();
  const hasSessionFilter = availableTenantIds.length > 0;
  const activeTenantId = normalizeTenantId(getActiveTenantIdFromSession());
  const candidateTenants = hasSessionFilter
    ? store.tenants.filter((tenant) => availableTenantIds.includes(tenant.id))
    : store.tenants;

  const visibleTenants = hasSessionFilter
    ? candidateTenants.filter((tenant) => tenant.ativo !== false)
    : visibleTenantsFromSession(candidateTenants);

  if (!visibleTenants.length) {
    return false;
  }

  const resolvedTenantId =
    (activeTenantId && visibleTenants.some((tenant) => tenant.id === activeTenantId)
      ? activeTenantId
      : visibleTenants[0]?.id) ?? "";

  setStore((s) => ({
    ...s,
    tenants: visibleTenants,
    currentTenantId: resolvedTenantId,
    tenant: visibleTenants.find((tenant) => tenant.id === resolvedTenantId) ?? visibleTenants[0],
  }));

  if (visibleTenants.length) {
    tenantContextHydratedFromApi = true;
    tenantContextSyncAt = Date.now();
    setAvailableTenants(visibleTenants.map((tenant) => tenant.id), resolvedTenantId);
    setActiveTenantId(resolvedTenantId);
    return true;
  }

  return false;
}

async function getTenantIdForApiCall(): Promise<string | undefined> {
  if (!isRealApiEnabled()) return getCurrentTenantId();
  const tenantId = resolveTenantIdForApiCall();
  return tenantId;
}

type TenantContextFromApi = {
  currentTenantId: string;
  tenantAtual: Tenant;
  unidadesDisponiveis: Tenant[];
};

async function getTenantContextFromAuth(): Promise<TenantContextFromApi> {
  const me = await meApi();
  const units = await listUnidadesApi();
  if (!Array.isArray(units) || units.length === 0) {
    throw new Error("Nenhuma unidade disponível para o usuário autenticado.");
  }

  const activeTenantId = normalizeTenantId(me.activeTenantId) ?? normalizeTenantId(getActiveTenantIdFromSession());
  const allowedTenantIds = me.availableTenants
    .map((tenant) => normalizeTenantId(tenant.tenantId))
    .filter((tenantId): tenantId is string => Boolean(tenantId));

  const defaultTenantId =
    normalizeTenantId(getDefaultTenantIdFromSession()) ??
    normalizeTenantId(
      me.availableTenants.find((tenant) => tenant.defaultTenant)?.tenantId
    );

  const allowedUnits =
    allowedTenantIds.length > 0 ? units.filter((tenant) => allowedTenantIds.includes(tenant.id)) : units;
  const visibleUnits = allowedUnits.length > 0 ? allowedUnits : units;

  const tenantAtual =
    visibleUnits.find((tenant) => tenant.id === activeTenantId) ??
    (defaultTenantId ? visibleUnits.find((tenant) => tenant.id === defaultTenantId) : undefined) ??
    visibleUnits[0];

  if (!tenantAtual) {
    throw new Error("Não foi possível identificar a unidade atual do usuário autenticado.");
  }

  return {
    currentTenantId: tenantAtual.id,
    tenantAtual,
    unidadesDisponiveis: visibleUnits,
  };
}

async function getTenantContextFallbackFromApi(): Promise<TenantContextFromApi> {
  try {
    return await getTenantContextFromAuth();
  } catch (authError) {
    console.warn(
      "[contexto-unidades][api-fallback] Falha no contexto via Auth. Tentando endpoint legado /context/.",
      authError
    );
    const context = await getTenantContextApi();
    return {
      currentTenantId: context.currentTenantId,
      tenantAtual: context.tenantAtual,
      unidadesDisponiveis: context.unidadesDisponiveis,
    };
  }
}

function mergeTenantScopedData<T extends { id: string; tenantId: string }>(
  base: T[],
  incoming: T[]
): T[] {
  const incomingIds = new Set(incoming.map((item) => item.id));
  const incomingTenantIds = new Set(incoming.map((item) => item.tenantId));
  return [
    ...incoming,
    ...base.filter(
      (item) => !incomingIds.has(item.id) && !incomingTenantIds.has(item.tenantId)
    ),
  ];
}

function trimOptionalString(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function requireTenantScopedEntity<T extends { id: string; tenantId: string }>(
  items: T[],
  id: string,
  tenantId: string,
  message: string
): T {
  const entity = items.find((item) => item.id === id && item.tenantId === tenantId);
  if (!entity) {
    throw new Error(message);
  }
  return entity;
}

function normalizeProspectFallbackInput(
  tenantId: string,
  data: CreateProspectInput
): CreateProspectInput {
  const payload = buildProspectUpsertApiRequest(tenantId, data);
  if (!payload.nome) {
    throw new Error("Nome do prospect é obrigatório.");
  }
  if (!payload.telefone) {
    throw new Error("Telefone do prospect é obrigatório.");
  }
  return {
    nome: payload.nome,
    telefone: payload.telefone,
    email: payload.email,
    cpf: payload.cpf,
    origem: payload.origem,
    observacoes: payload.observacoes,
    responsavelId: trimOptionalString(data.responsavelId),
  };
}

function normalizePlanoFallbackInput<
  T extends {
    nome: string;
    descricao?: string;
    tipo: TipoPlano;
    duracaoDias: number;
    valor: number;
    valorMatricula: number;
    cobraAnuidade: boolean;
    valorAnuidade?: number;
    parcelasMaxAnuidade?: number;
    permiteRenovacaoAutomatica: boolean;
    permiteCobrancaRecorrente: boolean;
    diaCobrancaPadrao?: number;
    contratoTemplateHtml?: string;
    contratoAssinatura: Plano["contratoAssinatura"];
    contratoEnviarAutomaticoEmail: boolean;
    atividades?: string[];
    beneficios?: string[];
    destaque: boolean;
    ordem?: number;
  },
>(tenantId: string, data: T): T {
  const payload = buildPlanoUpsertApiRequest(tenantId, data);
  return sanitizePlanoRules({
    ...data,
    nome: payload.nome,
    descricao: payload.descricao,
    tipo: payload.tipo,
    duracaoDias: payload.duracaoDias,
    valor: payload.valor,
    valorMatricula: payload.valorMatricula ?? 0,
    atividades: payload.atividadeIds,
    beneficios: payload.beneficios,
    destaque: payload.destaque ?? false,
    ordem: payload.ordem,
  }) as T;
}

function getDefaultFormaPagamentoId(tenantId: string, tipo: TipoFormaPagamento): string {
  return `forma-pagamento-default-${tenantId}-${tipo.toLowerCase()}`;
}

function normalizeFormaPagamentoCreateInput(
  data: Omit<FormaPagamento, "id" | "tenantId" | "ativo">
): Omit<FormaPagamento, "id" | "tenantId" | "ativo"> {
  const nome = data.nome.trim();
  if (!nome) {
    throw new Error("Nome da forma de pagamento é obrigatório.");
  }
  return {
    ...data,
    nome,
    taxaPercentual: toFiniteNumber(data.taxaPercentual, 0),
    parcelasMax: Math.max(1, Math.floor(toFiniteNumber(data.parcelasMax, 1))),
    emitirAutomaticamente: Boolean(data.emitirAutomaticamente ?? false),
    prazoRecebimentoDias:
      data.prazoRecebimentoDias == null
        ? undefined
        : Math.max(0, Math.floor(toFiniteNumber(data.prazoRecebimentoDias, 0))),
    instrucoes: trimOptionalString(data.instrucoes),
  };
}

function normalizeFormaPagamentoUpdateInput(
  current: FormaPagamento | undefined,
  data: Partial<Omit<FormaPagamento, "id" | "tenantId">>
): Partial<Omit<FormaPagamento, "id" | "tenantId">> {
  if (data.nome !== undefined && !data.nome.trim()) {
    throw new Error("Nome da forma de pagamento é obrigatório.");
  }
  return {
    ...data,
    ...(data.nome !== undefined ? { nome: data.nome.trim() } : {}),
    ...(data.taxaPercentual !== undefined
      ? { taxaPercentual: toFiniteNumber(data.taxaPercentual, current?.taxaPercentual ?? 0) }
      : {}),
    ...(data.parcelasMax !== undefined
      ? {
          parcelasMax: Math.max(
            1,
            Math.floor(toFiniteNumber(data.parcelasMax, current?.parcelasMax ?? 1))
          ),
        }
      : {}),
    ...(data.emitirAutomaticamente !== undefined
      ? { emitirAutomaticamente: Boolean(data.emitirAutomaticamente) }
      : {}),
    ...(data.prazoRecebimentoDias !== undefined
      ? {
          prazoRecebimentoDias:
            data.prazoRecebimentoDias == null
              ? undefined
              : Math.max(
                  0,
                  Math.floor(
                    toFiniteNumber(data.prazoRecebimentoDias, current?.prazoRecebimentoDias ?? 0)
                  )
                ),
        }
      : {}),
    ...(data.instrucoes !== undefined ? { instrucoes: trimOptionalString(data.instrucoes) } : {}),
  };
}

function getCurrentGroupTenantIds(): string[] {
  const store = getStore();
  const currentTenantId = getCurrentTenantId();
  const currentTenant =
    store.tenants.find((t) => t.id === currentTenantId) ?? store.tenant;
  const groupId = currentTenant.academiaId ?? currentTenant.groupId;
  if (!groupId) return [currentTenantId];
  return store.tenants
    .filter((tenant) => (tenant.academiaId ?? tenant.groupId) === groupId)
    .map((tenant) => tenant.id);
}

function getCurrentGroupId(): string | undefined {
  const store = getStore();
  const currentTenantId = getCurrentTenantId();
  const current = store.tenants.find((t) => t.id === currentTenantId) ?? store.tenant;
  return current.academiaId ?? current.groupId;
}

function getCurrentAcademiaId(): string | undefined {
  return getCurrentGroupId();
}

function estimateCampanhaAudience(campanha: Pick<CampanhaCRM, "tenantId" | "publicoAlvo">): number {
  const store = getStore();
  const tenantId = campanha.tenantId;
  if (campanha.publicoAlvo === "PROSPECTS_EM_ABERTO") {
    return store.prospects.filter(
      (p) => p.tenantId === tenantId && p.status !== "CONVERTIDO" && p.status !== "PERDIDO"
    ).length;
  }

  if (campanha.publicoAlvo === "ALUNOS_INATIVOS") {
    return store.alunos.filter(
      (a) => a.tenantId === tenantId && (a.status === "INATIVO" || a.status === "CANCELADO" || a.status === "SUSPENSO")
    ).length;
  }

  const fromDate = subtractDays(new Date(), 90);
  const alunosEvadidos = store.alunos.filter(
    (a) => a.tenantId === tenantId && (a.status === "INATIVO" || a.status === "CANCELADO")
  );
  return alunosEvadidos.filter((aluno) => {
    const mats = store.matriculas
      .filter((m) => m.tenantId === tenantId && m.alunoId === aluno.id)
      .sort((a, b) => b.dataFim.localeCompare(a.dataFim));
    const last = mats[0];
    if (!last) return false;
    return new Date(`${last.dataFim}T00:00:00`) >= fromDate;
  }).length;
}

function normalizeTenantConfig(data: Partial<Tenant>): Partial<Tenant> {
  const modo = data.configuracoes?.impressaoCupom?.modo;
  const larguraRaw = Number(data.configuracoes?.impressaoCupom?.larguraCustomMm ?? 80);
  const larguraCustomMm = Number.isFinite(larguraRaw)
    ? Math.min(120, Math.max(40, larguraRaw))
    : 80;
  return {
    ...data,
    configuracoes: {
      ...(data.configuracoes ?? {}),
      impressaoCupom: {
        modo: modo ?? "80MM",
        larguraCustomMm,
      },
    },
  };
}

function computeAlunoStatus(
  aluno: Aluno,
  store: ReturnType<typeof getStore>,
  pagamentos: Pagamento[]
): StatusAluno {
  if (aluno.status === "CANCELADO") return "CANCELADO";
  if (aluno.status === "SUSPENSO" || aluno.suspensao) return "SUSPENSO";
  const todayStr = today();
  const hasVencido = pagamentos.some(
    (p) => p.alunoId === aluno.id && p.status === "VENCIDO"
  );
  if (hasVencido) return "INATIVO";
  const hasAtivo = store.matriculas.some(
    (m) =>
      m.alunoId === aluno.id &&
      m.status === "ATIVA" &&
      m.dataInicio <= todayStr &&
      m.dataFim >= todayStr
  );
  return hasAtivo ? "ATIVO" : "INATIVO";
}

function syncAlunosStatus(): void {
  setStore((s) => {
    const pagamentosBase = Array.isArray(s.pagamentos) ? s.pagamentos : [];
    const alunosBase = Array.isArray(s.alunos) ? s.alunos : [];
    const matriculasBase = Array.isArray(s.matriculas) ? s.matriculas : [];
    const safeStore = { ...s, matriculas: matriculasBase };

    let pagamentosChanged = false;
    const pagamentos = pagamentosBase.map((p) => {
      if (p.status === "PENDENTE" && p.dataVencimento < today()) {
        pagamentosChanged = true;
        return { ...p, status: "VENCIDO" as const };
      }
      return p;
    });
    let alunosChanged = false;
    const alunos = alunosBase.map((a) => {
      const status = computeAlunoStatus(a, safeStore, pagamentos);
      if (status !== a.status) {
        alunosChanged = true;
        return { ...a, status };
      }
      return a;
    });
    if (!pagamentosChanged && !alunosChanged) return s;
    return {
      ...s,
      pagamentos,
      alunos,
    };
  });
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

export async function getDashboard(params?: { month?: number; year?: number }): Promise<DashboardData> {
  if (isRealApiEnabled()) {
    try {
      return await getDashboardApi({
        tenantId: getCurrentTenantId(),
        month: params?.month,
        year: params?.year,
      });
    } catch (error) {
      console.warn("[dashboard][api-fallback] Falha ao obter dashboard na API real. Usando store local.", error);
    }
  }
  syncAlunosStatus();
  const store = getStore();
  const tenantId = getCurrentTenantId();
  const alunos = store.alunos.filter((a) => a.tenantId === tenantId);
  const prospects = store.prospects.filter((p) => p.tenantId === tenantId);
  const matriculas = store.matriculas.filter((m) => m.tenantId === tenantId);
  const pagamentos = store.pagamentos.filter((p) => p.tenantId === tenantId);
  const planos = store.planos.filter((p) => p.tenantId === tenantId);
  const todayStr = today();
  const month = params?.month ?? new Date().getMonth();
  const year = params?.year ?? new Date().getFullYear();
  const monthStr = String(month + 1).padStart(2, "0");
  const monthPrefix = `${year}-${monthStr}`;
  const in7Days = addDays(todayStr, 7);

  return {
    totalAlunosAtivos: alunos.filter((a) => a.status === "ATIVO").length,
    prospectsNovos: prospects.filter((p) => p.dataCriacao.startsWith(monthPrefix)).length,
    matriculasDoMes: matriculas.filter((m) =>
      m.dataCriacao.startsWith(monthPrefix)
    ).length,
    receitaDoMes: pagamentos
      .filter(
        (p) =>
          p.status === "PAGO" && p.dataPagamento?.startsWith(monthPrefix)
      )
      .reduce((sum, p) => sum + p.valorFinal, 0),
    prospectsRecentes: prospects
      .filter((p) => p.status !== "CONVERTIDO" && p.status !== "PERDIDO")
      .slice(0, 5),
    matriculasVencendo: matriculas
      .filter(
        (m) =>
          m.status === "ATIVA" &&
          m.dataFim >= todayStr &&
          m.dataFim <= in7Days
      )
      .map((m) => ({
        ...m,
        aluno: alunos.find((a) => a.id === m.alunoId),
        plano: planos.find((p) => p.id === m.planoId),
      })),
    pagamentosPendentes: pagamentos
      .filter((p) => p.status === "PENDENTE" || p.status === "VENCIDO")
      .map((p) => ({
        ...p,
        aluno: alunos.find((a) => a.id === p.alunoId),
      })),
  };
}

// ─── TENANT ────────────────────────────────────────────────────────────────

function areSameTenant(a: Tenant | undefined, b: Tenant | undefined): boolean {
  if (!a || !b) return a === b;
  return JSON.stringify(a) === JSON.stringify(b);
}

function areSameTenantList(a: Tenant[], b: Tenant[]): boolean {
  if (a.length !== b.length) return false;
  const aSorted = [...a].sort((x, y) => x.id.localeCompare(y.id));
  const bSorted = [...b].sort((x, y) => x.id.localeCompare(y.id));
  return aSorted.every((item, index) => areSameTenant(item, bSorted[index]));
}

function dedupeTenants(tenants: Tenant[]): Tenant[] {
  return Array.from(new Map(tenants.map((t) => [t.id, t] as const)).values());
}

let tenantContextHydratedFromApi = false;
let tenantContextSyncAt = 0;
let tenantContextSyncInFlight: Promise<boolean> | null = null;
let tenantContextRetryUntil = 0;
const TENANT_CONTEXT_CACHE_MS = 15_000;
const TENANT_CONTEXT_RETRY_MS = 8_000;

function shouldRefreshTenantContext(): boolean {
  const now = Date.now();
  if (now < tenantContextRetryUntil) {
    return false;
  }
  if (tenantContextHydratedFromApi) {
    return now - tenantContextSyncAt > TENANT_CONTEXT_CACHE_MS;
  }
  return true;
}

async function syncTenantContextFromApiIfStale(force = false): Promise<boolean> {
  if (!isRealApiEnabled() || (!force && !shouldRefreshTenantContext())) {
    return true;
  }

  if (tenantContextSyncInFlight) {
    return tenantContextSyncInFlight;
  }

  const attempt = (async () => {
    try {
      const context = await getTenantContextFallbackFromApi();
      const allowedTenantIds = getAvailableTenantIdsFromSession();
      const allowedUnits =
        allowedTenantIds.length > 0
          ? context.unidadesDisponiveis.filter((tenant) => allowedTenantIds.includes(tenant.id))
          : context.unidadesDisponiveis;
      const preferredTenantId =
        getDefaultTenantIdFromSession() ||
        (allowedTenantIds.length > 0 ? allowedTenantIds[0] : undefined);
      const contextCurrentTenantId = normalizeTenantId(context.currentTenantId);
      const activeTenantId = normalizeTenantId(getActiveTenantIdFromSession());

      const tenantCandidate =
        allowedUnits.find((tenant) => tenant.id === contextCurrentTenantId)
        ?? allowedUnits.find((tenant) => tenant.id === activeTenantId)
        ?? allowedUnits.find((tenant) => tenant.id === preferredTenantId)
        ?? allowedUnits[0]
        ?? context.tenantAtual;

      if (!tenantCandidate) {
        throw new Error("Contexto de unidade sem tenant válido retornado pelo backend.");
      }

      const tenantId = normalizeTenantId(tenantCandidate.id) || contextCurrentTenantId || activeTenantId || preferredTenantId || TENANT_ID_DEFAULT;

      syncTenantContextInStore({
        currentTenantId: tenantId,
        tenantAtual: tenantCandidate,
        unidadesDisponiveis: allowedUnits.length ? allowedUnits : context.unidadesDisponiveis,
      });

      tenantContextSyncAt = Date.now();
      tenantContextRetryUntil = 0;
      return true;
    } catch (error) {
      const now = Date.now();
      tenantContextRetryUntil = now + TENANT_CONTEXT_RETRY_MS;
      tenantContextHydratedFromApi = false;
      console.warn("[contexto-unidades][api-fallback] Falha ao sincronizar contexto da unidade ativa via API.", error);
      return false;
    } finally {
      tenantContextSyncInFlight = null;
    }
  })();

  tenantContextSyncInFlight = attempt;
  return attempt;
}

function getTenantFromContextFallback(): Tenant {
  const stored = getStore();
  const allowedTenant = getAvailableTenantIdsFromSessionResolved()
    .map((id) => stored.tenants.find((tenant) => tenant.id === id))
    .find((tenant): tenant is Tenant => Boolean(tenant));

  return {
    ...(allowedTenant ?? stored.tenant),
    id: allowedTenant?.id ?? stored.currentTenantId ?? stored.tenant?.id ?? TENANT_ID_DEFAULT,
    ativo: allowedTenant?.ativo ?? stored.tenant?.ativo ?? true,
    nome: allowedTenant?.nome ?? stored.tenant?.nome ?? "Unidade",
  };
}

function syncTenantContextInStore(input: {
  currentTenantId: string;
  tenantAtual: Tenant;
  unidadesDisponiveis: Tenant[];
}): void {
  tenantContextHydratedFromApi = true;
  tenantContextSyncAt = Date.now();
  setActiveTenantId(input.currentTenantId);
  setAvailableTenants(
    input.unidadesDisponiveis.map((tenant) => tenant.id),
    input.currentTenantId
  );
  setStore((s) => {
    const nextTenants = [...input.unidadesDisponiveis];
    const hasNoChanges =
      s.currentTenantId === input.currentTenantId &&
      areSameTenant(s.tenant, input.tenantAtual) &&
      areSameTenantList(s.tenants, nextTenants);
    if (hasNoChanges) return s;
    return {
      ...s,
      tenant: input.tenantAtual,
      currentTenantId: input.currentTenantId,
      tenants: nextTenants,
    };
  });
}

export async function authLogin(input: { email: string; password: string }): Promise<void> {
  if (!isRealApiEnabled()) {
    setMockSessionActive();
    return;
  }
  await loginApi(input);
  const synced = await syncTenantContextFromApiIfStale(true);
  if (!synced) {
    const tenantFromToken = getActiveTenantIdFromSession();
    setActiveTenantId(tenantFromToken);
    if (tenantFromToken) {
      setStore((s) => ({
        ...s,
        currentTenantId: tenantFromToken,
        tenant: s.tenants.find((tenant) => tenant.id === tenantFromToken) ?? s.tenant,
      }));
    }
  } else {
    const currentTenantId = getCurrentTenantId();
    setActiveTenantId(currentTenantId);
    setStore((s) => ({
      ...s,
      currentTenantId,
      tenant:
        s.tenants.find((tenant) => tenant.id === currentTenantId) ?? s.tenant,
    }));
  }
}

export async function authRefresh(): Promise<void> {
  if (!isRealApiEnabled()) return;
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  await refreshTokenApi(refreshToken);
  await syncTenantContextFromApiIfStale(true);
  const tenantId = getCurrentTenantId();
  setActiveTenantId(tenantId);
  if (tenantId) {
    const tenantIds = getStore().tenants.map((tenant) => tenant.id);
    setAvailableTenants(tenantIds.length ? tenantIds : [tenantId], tenantId);
  }
}

export async function authMe(): Promise<AuthUser | undefined> {
  if (!isRealApiEnabled()) return undefined;
  return meApi();
}

function getCatracaAdminToken(): string {
  return (
    process.env.NEXT_PUBLIC_CATRACA_ADMIN_TOKEN ??
    process.env.NEXT_PUBLIC_ADMIN_TOKEN ??
    process.env.NEXT_PUBLIC_INTEGRATION_ADMIN_TOKEN ??
    ""
  ).trim();
}

function getBase64Token(value: string): string {
  if (typeof window === "undefined" || typeof window.btoa !== "function") return `${value}-base64`;
  try {
    return window.btoa(value);
  } catch {
    return `${value}-base64`;
  }
}

function buildMockCatracaCredential(tenantId: string): CatracaCredentialResponse {
  const keyId = `catraca-${tenantId.slice(0, 8)}`;
  const secret = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const bearerPlain = `${keyId}:${secret}`;
  return {
    keyId,
    secret,
    bearerPlain,
    bearerBase64: getBase64Token(bearerPlain),
    tenantId,
    createdAt: new Date().toISOString(),
  };
}

export async function gerarCredencialCatraca(
  tenantId: string,
  adminTokenOverride?: string
): Promise<CatracaCredentialResponse> {
  if (!tenantId.trim()) {
    throw new Error("TenantId inválido para gerar credencial.");
  }

  if (!isRealApiEnabled()) {
    return buildMockCatracaCredential(tenantId);
  }

  const adminToken = (adminTokenOverride ?? "").trim() || getCatracaAdminToken();
  if (!adminToken) {
    throw new Error(
      "Token de admin não configurado. Defina NEXT_PUBLIC_CATRACA_ADMIN_TOKEN (ou NEXT_PUBLIC_INTEGRATION_ADMIN_TOKEN / NEXT_PUBLIC_ADMIN_TOKEN) ou informe o X-Admin-Token abaixo."
    );
  }

  try {
    return await gerarCatracaCredencialApi({
      tenantId,
      adminToken,
    });
  } catch (error) {
    console.warn("[catraca][api-fallback] Falha ao gerar credencial no backend real.", error);
    throw error;
  }
}

function findOnlineAgentId(tenant: {
  tenantId: string;
  connectedAgents: number;
  agents?: CatracaAgentConexao[];
}): string | null {
  const fromAgents = tenant.agents?.find((agent) => Boolean((agent?.agentId ?? "").trim()));
  return fromAgents ? (fromAgents.agentId ?? "").trim() : null;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  if (typeof atob !== "function") {
    return "";
  }
  return atob(padded);
}

async function resolveCatracaIssuedBy(
  issuedBy?: string
): Promise<string | undefined> {
  const forced = issuedBy?.trim();
  if (forced) {
    return forced;
  }

  try {
    const current = await meApi();
    const candidate = current?.id ?? current?.email ?? current?.nome;
    if (candidate?.trim()) {
      return candidate.trim();
    }
  } catch {
    // fallback to JWT token claim
  }

  try {
    const token = getAccessToken();
    if (!token) return undefined;
    const parts = token.split(".");
    if (parts.length < 2) return undefined;
    const payload = decodeBase64Url(parts[1]);
    const parsed = JSON.parse(payload) as {
      userId?: string;
      sub?: string;
      email?: string;
      nome?: string;
    };
    const candidate = parsed.userId ?? parsed.sub ?? parsed.email ?? parsed.nome;
    return typeof candidate === "string" && candidate.trim() ? candidate.trim() : undefined;
  } catch {
    return undefined;
  }
}

export async function liberarAcessoCatraca(
  memberId: string,
  justificativa: string,
  issuedBy?: string
): Promise<string> {
  const reason = justificativa.trim();
  const normalizedMemberId = memberId.trim();
  if (!normalizedMemberId) {
    throw new Error("Cliente inválido para liberar acesso.");
  }
  if (!reason) {
    throw new Error("A justificativa é obrigatória.");
  }

  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    throw new Error("Tenant não encontrado para liberar acesso.");
  }

  if (!isRealApiEnabled()) {
    return `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  const status = await listarStatusConexaoCatraca(tenantId);
  const tenantStatus = status.tenants.find((item) => item.tenantId === tenantId);
  if (!tenantStatus || tenantStatus.connectedAgents <= 0) {
    throw new Error("Nenhum agente da catraca conectado para este tenant.");
  }

  const agentId = findOnlineAgentId(tenantStatus);
  if (!agentId) {
    throw new Error("Não foi possível identificar o agente conectado.");
  }

  const resolvedIssuedBy = await resolveCatracaIssuedBy(issuedBy);

  const response = await liberarAcessoCatracaApi({
    agentId,
    memberId: normalizedMemberId,
    reason,
    issuedBy: resolvedIssuedBy,
  });

  return response.requestId;
}

export async function listarStatusConexaoCatraca(tenantId?: string): Promise<CatracaWsStatusResponse> {
  if (!isRealApiEnabled()) {
    const tenants = getStore().tenants.filter((tenant) => tenant.ativo !== false);
    const rows = tenants.map((tenant) => ({
      tenantId: tenant.id,
      connectedAgents: 0,
    }));
    if (tenantId) {
      const selected = rows.find((row) => row.tenantId === tenantId);
      return {
        totalConnectedAgents: selected?.connectedAgents ?? 0,
        tenants: selected ? [selected] : [{ tenantId, connectedAgents: 0 }],
      };
    }

    return {
      totalConnectedAgents: 0,
      tenants: rows,
    };
  }

  if (tenantId?.trim()) {
    return obterCatracaWsStatusPorTenantApi({ tenantId: tenantId.trim() });
  }

  return listarCatracaWsStatusApi({});
}

let acessosCatracaInFlightKey: string | null = null;
let acessosCatracaInFlightPromise: Promise<CatracaAcessosDashboardResponse> | null = null;
let lastAcessosCatracaKey: string | null = null;
let lastAcessosCatracaAt = 0;
let lastAcessosCatracaResponse: CatracaAcessosDashboardResponse | null = null;

export async function listAcessosCatraca(params?: {
  page?: number;
  size?: number;
  startDate?: string;
  endDate?: string;
  memberId?: string;
  tipoLiberacao?: "TODOS" | "MANUAL" | "AUTOMATICA";
  status?: "TODOS" | "LIBERADO" | "BLOQUEADO";
  uniqueWindowMinutes?: number;
  timezone?: string;
}): Promise<CatracaAcessosDashboardResponse> {
  const page = Math.max(0, params?.page ?? 0);
  const size = Math.min(200, Math.max(1, params?.size ?? 20));
  const tenantId = getCurrentTenantId();
  const cacheKey = JSON.stringify({
    tenantId,
    page,
    size,
    startDate: params?.startDate ?? "",
    endDate: params?.endDate ?? "",
    memberId: params?.memberId ?? "",
    tipoLiberacao: params?.tipoLiberacao ?? "TODOS",
    status: params?.status ?? "TODOS",
    uniqueWindowMinutes: params?.uniqueWindowMinutes ?? 120,
    timezone: params?.timezone ?? "",
  });

  if (!isRealApiEnabled()) {
    return {
      items: [],
      page,
      size,
      total: 0,
      hasNext: false,
    };
  }

  const nowTs = Date.now();
  if (
    lastAcessosCatracaResponse &&
    lastAcessosCatracaKey === cacheKey &&
    nowTs - lastAcessosCatracaAt < 1200
  ) {
    return lastAcessosCatracaResponse;
  }

  if (acessosCatracaInFlightPromise && acessosCatracaInFlightKey === cacheKey) {
    return acessosCatracaInFlightPromise;
  }

  acessosCatracaInFlightKey = cacheKey;
  acessosCatracaInFlightPromise = listarAcessosCatracaDashboardApi({
    tenantId,
    page,
    size,
    startDate: params?.startDate,
    endDate: params?.endDate,
    memberId: params?.memberId,
    tipoLiberacao: params?.tipoLiberacao,
    status: params?.status,
    uniqueWindowMinutes: params?.uniqueWindowMinutes ?? 120,
    timezone: params?.timezone,
  })
    .then((response) => {
      lastAcessosCatracaKey = cacheKey;
      lastAcessosCatracaResponse = response;
      lastAcessosCatracaAt = Date.now();
      return response;
    })
    .finally(() => {
      acessosCatracaInFlightPromise = null;
      acessosCatracaInFlightKey = null;
    });

  return acessosCatracaInFlightPromise;
}

export async function authLogout(): Promise<void> {
  clearAuthSession();
  tenantContextHydratedFromApi = false;
  tenantContextSyncAt = 0;
}

export async function listTenants(): Promise<Tenant[]> {
  const store = getStore();
  const visibleStoreTenants = visibleTenantsFromSession(store.tenants);
  const activeTenantIdInStore = store.currentTenantId || store.tenant?.id;

  if (activeTenantIdInStore && visibleStoreTenants.length > 0) {
    return visibleStoreTenants;
  }

  if (isRealApiEnabled()) {
    const hydratedFromSessionCache = hydrateTenantContextFromSessionCache();
    if (hydratedFromSessionCache) {
      const hydratedStore = getStore();
      const visible = visibleTenantsFromSession(hydratedStore.tenants);
      if (visible.length > 0) return visible;
      const activeVisible = hydratedStore.tenants.filter((tenant) => tenant.ativo !== false);
      if (activeVisible.length > 0) return activeVisible;
    }

    const synced = await syncTenantContextFromApiIfStale();
    if (synced && tenantContextHydratedFromApi) {
      const syncedStore = getStore();
      const visibleTenants = visibleTenantsFromSession(syncedStore.tenants);
      if (visibleTenants.length > 0) return visibleTenants;
      const activeTenants = dedupeTenants(syncedStore.tenants).filter((tenant) => tenant.ativo !== false);
      if (activeTenants.length > 0) return activeTenants;
      return dedupeTenants(syncedStore.tenants);
    }

    try {
      const tenants = dedupeTenants(await listUnidadesApi());
      tenantContextHydratedFromApi = true;
      tenantContextSyncAt = Date.now();
      setStore((s) => {
        if (areSameTenantList(s.tenants, tenants)) return s;
        return {
          ...s,
          tenants,
        };
      });
      const visibleTenants = visibleTenantsFromSession(tenants);
      return visibleTenants.length ? visibleTenants : tenants.filter((tenant) => tenant.ativo !== false);
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao listar unidades na API real.", error);
      if (tenantContextHydratedFromApi) {
        const fallbackStore = getStore();
        const visibleTenants = visibleTenantsFromSession(fallbackStore.tenants);
        if (visibleTenants.length) return visibleTenants;
        return fallbackStore.tenants.filter((t) => t.ativo !== false);
      }

      if (activeTenantIdInStore && store.tenants.length > 0) {
        return store.tenants.filter((tenant) => tenant.ativo !== false || tenant.id === activeTenantIdInStore);
      }
      if (store.tenants.length > 0) return visibleStoreTenants.length ? visibleStoreTenants : store.tenants;
      return [];
    }
  }

  const academiaId = getCurrentAcademiaId();
  if (!academiaId) {
    return store.tenants.filter((t) => t.id === getCurrentTenantId());
  }
  return store.tenants.filter((t) => (t.academiaId ?? t.groupId) === academiaId);
}

export async function listTenantsGlobal(): Promise<Tenant[]> {
  if (isRealApiEnabled()) {
    try {
      return await listUnidadesApi();
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao listar unidades globais na API real. Usando store local.", error);
    }
  }
  return getStore().tenants;
}

export async function getCurrentTenant(): Promise<Tenant> {
  if (isRealApiEnabled()) {
    const hydratedFromSessionCache = hydrateTenantContextFromSessionCache();
    if (hydratedFromSessionCache) {
      const store = getStore();
      const visibleTenants = visibleTenantsFromSession(store.tenants);
      const visibleFallback = visibleTenants.length
        ? visibleTenants
        : store.tenants.filter((tenant) => tenant.ativo !== false);
      const tenantFromSession = visibleFallback.find(
        (tenant) => tenant.id === normalizeTenantId(getActiveTenantIdFromSession())
      );
      return (
        tenantFromSession ??
        store.tenants.find((tenant) => tenant.id === getCurrentTenantId()) ??
        visibleFallback[0] ??
        store.tenant ??
        {
          id: resolveTenantIdForApiCall() || TENANT_ID_DEFAULT,
          nome: "Unidade",
          ativo: true,
        }
      );
    }

    const synced = await syncTenantContextFromApiIfStale();
    try {
      const store = getStore();
      const sessionTenantId =
        syncCurrentTenantFromSessionIfNeeded() ?? normalizeTenantId(getActiveTenantIdFromSession());
      const fallbackId = sessionTenantId || store.currentTenantId || store.tenant?.id;
      const sessionTenant = sessionTenantId
        ? store.tenants.find((item) => item.id === sessionTenantId)
        : undefined;
      const visibleTenants = visibleTenantsFromSession(store.tenants);
      const fallbackTenant = chooseVisibleTenantBySession(
        visibleTenants.length ? visibleTenants : store.tenants,
        fallbackId
      );
      const current = sessionTenant ?? fallbackTenant;
      if (current) return current;
      if (store.tenant) return store.tenant;
      if (store.tenants[0]) return store.tenants[0];
      if (synced && tenantContextHydratedFromApi) {
        throw new Error("contexto vazio");
      }
      const resolvedTenantId = resolveTenantForApi();
      return (
        store.tenants.find((tenant) => tenant.id === resolvedTenantId) ?? {
          id: resolvedTenantId,
          nome: "Unidade",
          ativo: true,
        }
      );
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao obter unidade atual na API real.", error);
      const sessionTenantId = normalizeTenantId(getActiveTenantIdFromSession());
      const store = getStore();
      return (
        store.tenants.find((tenant) => tenant.id === sessionTenantId) ??
        chooseVisibleTenantBySession(store.tenants, sessionTenantId || store.currentTenantId) ??
        store.tenant ??
        store.tenants[0] ??
        {
          id: resolveTenantForApi(),
          nome: "Unidade",
          ativo: true,
        }
      );
    }
  }
  const store = getStore();
  return store.tenants.find((t) => t.id === store.currentTenantId) ?? store.tenant;
}

export async function setCurrentTenant(id: string): Promise<void> {
  const tenantId = normalizeTenantId(id);
  if (!tenantId) {
    return;
  }

  if (isRealApiEnabled()) {
    try {
      const switchResponse = await switchTenantApi(tenantId);
      const synced = await syncTenantContextFromApiIfStale(true);
      const tenants = getStore().tenants;
      const activeTenantId =
        normalizeTenantId(switchResponse.activeTenantId) ?? tenantId;
      const tenantToActivate =
        tenants.some((tenant) => tenant.id === activeTenantId)
          ? activeTenantId
          : tenants.some((tenant) => tenant.id === tenantId)
          ? tenantId
          : getDefaultTenantIdFromSession() || activeTenantId;
      if (!synced) {
        setStore((s) => {
          const fallbackTenant = s.tenants.find((tenant) => tenant.id === tenantToActivate) ?? s.tenant;
          return {
            ...s,
            currentTenantId: tenantToActivate,
            tenant: fallbackTenant ?? s.tenant,
          };
        });
      }
      if (synced) {
        const tenantFromApi = getStore().tenants.find((tenant) => tenant.id === tenantToActivate);
        setStore((s) => ({
          ...s,
          currentTenantId: tenantToActivate,
          tenant: tenantFromApi ?? s.tenant,
        }));
      }
      setActiveTenantId(tenantToActivate);
      const availableTenantIds = getAvailableTenantIdsFromSession();
      if (availableTenantIds.length) {
        setAvailableTenants(availableTenantIds, tenantToActivate);
      } else if (tenants.length) {
        setAvailableTenants(
          tenants.map((tenant) => tenant.id),
          tenantToActivate
        );
      }
      return;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao trocar unidade via auth. Mantendo tenant e token atuais.", { error });
      throw error;
    }
  }
  setStore((s) => {
    const current = s.tenants.find((t) => t.id === s.currentTenantId) ?? s.tenant;
    const currentAcademiaId = current.academiaId ?? current.groupId;
    const tenant = s.tenants.find(
      (t) =>
        t.id === id &&
        t.ativo !== false &&
        (!currentAcademiaId || (t.academiaId ?? t.groupId) === currentAcademiaId)
    ) ?? s.tenant;
    return {
      ...s,
      currentTenantId: tenant.id,
      tenant,
    };
  });
  setActiveTenantId(id);
}

export async function listAcademias(): Promise<Academia[]> {
  if (isRealApiEnabled()) {
    try {
      const academias = await listAcademiasApi(getCurrentTenantId());
      setStore((s) => ({
        ...s,
        academias,
      }));
      return academias;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao listar academias na API real. Usando store local.", error);
    }
  }
  const academiaId = getCurrentAcademiaId();
  if (!academiaId) return getStore().academias;
  return getStore().academias.filter((a) => a.id === academiaId);
}

export async function getCurrentAcademia(): Promise<Academia> {
  if (isRealApiEnabled()) {
    const store = getStore();
    const currentTenant =
      store.tenants.find((tenant) => tenant.id === getCurrentTenantId()) ?? store.tenant;
    const academiaId = currentTenant?.academiaId ?? currentTenant?.groupId;
    const cachedAcademia = (academiaId
      ? store.academias.find((item) => item.id === academiaId)
      : undefined) ?? store.academias[0];

    if (cachedAcademia) {
      return cachedAcademia;
    }

    try {
      const academia = await getAcademiaAtualApi(getCurrentTenantId());
      setStore((s) => {
        const next = [academia, ...s.academias.filter((item) => item.id !== academia.id)];
        const academiasChanged = JSON.stringify(next) !== JSON.stringify(s.academias);
        if (!academiasChanged) return s;
        return {
          ...s,
          academias: next,
        };
      });
      return academia;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao obter academia atual na API real. Usando store local.", error);
    }
  }
  const store = getStore();
  const academiaId = getCurrentAcademiaId();
  return (
    store.academias.find((a) => a.id === academiaId) ??
    store.academias[0] ?? {
      id: "acd-default",
      nome: "Academia",
      ativo: true,
    }
  );
}

export async function updateCurrentAcademia(data: Partial<Academia>): Promise<void> {
  const academiaId = getCurrentAcademiaId();
  if (isRealApiEnabled()) {
    try {
      const updated = await updateAcademiaAtualApi({
        tenantId: getCurrentTenantId(),
        data,
      });
      setStore((s) => ({
        ...s,
        academias: s.academias.map((item) =>
          item.id === updated.id ? { ...item, ...updated } : item
        ),
      }));
      return;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao atualizar academia na API real. Aplicando update local.", error);
    }
  }
  if (!academiaId) return;
  setStore((s) => ({
    ...s,
    academias: s.academias.map((a) =>
      a.id === academiaId ? { ...a, ...data } : a
    ),
  }));
}

export async function createAcademia(data: Omit<Academia, "id">): Promise<Academia> {
  if (isRealApiEnabled()) {
    try {
      // Endpoint de criação de academia ainda não exposto; manter fallback local.
      console.warn("[contexto-unidades] createAcademia na API real indisponível. Aplicando criação local.");
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao criar academia na API real. Aplicando criação local.", error);
    }
  }
  const academia: Academia = {
    id: genId(),
    nome: data.nome.trim() || "Nova academia",
    razaoSocial: data.razaoSocial?.trim() || undefined,
    documento: data.documento?.trim() || undefined,
    email: data.email?.trim() || undefined,
    telefone: data.telefone?.trim() || undefined,
    endereco: data.endereco,
    branding: data.branding,
    ativo: data.ativo ?? true,
  };
  setStore((s) => ({
    ...s,
    academias: [academia, ...s.academias],
  }));
  return academia;
}

export async function createTenant(
  data: Omit<Tenant, "id">
): Promise<Tenant> {
  if (isRealApiEnabled()) {
    try {
      const created = await createUnidadeApi(data);
      setStore((s) => ({
        ...s,
        tenants: [created, ...s.tenants.filter((item) => item.id !== created.id)],
      }));
      return created;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao criar unidade na API real. Aplicando criação local.", error);
    }
  }
  const academiaId = data.academiaId?.trim() || getCurrentAcademiaId() || "acd-default";
  const groupId = data.groupId?.trim() || academiaId;
  const tenant: Tenant = {
    ...data,
    id: genId(),
    nome: data.nome.trim(),
    academiaId,
    groupId,
    ativo: data.ativo ?? true,
  };
  const normalizedTenant = normalizeTenantConfig(tenant) as Tenant;
  setStore((s) => ({
    ...s,
    tenants: [normalizedTenant, ...s.tenants],
  }));
  return normalizedTenant;
}

export async function updateTenantById(id: string, data: Partial<Tenant>): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const updated = await updateUnidadeApi(id, data);
      setStore((s) => {
        const currentUpdated =
          s.currentTenantId === id ? { ...s.tenant, ...updated } : s.tenant;
        return {
          ...s,
          tenant: currentUpdated,
          tenants: s.tenants.map((item) => (item.id === id ? { ...item, ...updated } : item)),
        };
      });
      return;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao atualizar unidade na API real. Aplicando update local.", error);
    }
  }
  const normalized = normalizeTenantConfig(data);
  setStore((s) => {
    const currentUpdated =
      s.currentTenantId === id ? { ...s.tenant, ...normalized } : s.tenant;
    return {
      ...s,
      tenant: currentUpdated,
      tenants: s.tenants.map((t) => (t.id === id ? { ...t, ...normalized } : t)),
    };
  });
}

export async function toggleTenant(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const toggled = await toggleUnidadeApi(id);
      setStore((s) => ({
        ...s,
        tenants: s.tenants.map((item) => (item.id === toggled.id ? { ...item, ...toggled } : item)),
      }));
      return;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao alternar unidade na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => {
    const target = s.tenants.find((t) => t.id === id);
    if (!target) return s;
    if (target.id === s.currentTenantId && target.ativo !== false) return s;
    return {
      ...s,
      tenants: s.tenants.map((t) =>
        t.id === id ? { ...t, ativo: t.ativo === false } : t
      ),
    };
  });
}

function tenantHasLinkedData(store: ReturnType<typeof getStore>, tenantId: string): boolean {
  return (
    store.prospects.some((item) => item.tenantId === tenantId) ||
    store.alunos.some((item) => item.tenantId === tenantId) ||
    store.matriculas.some((item) => item.tenantId === tenantId) ||
    store.pagamentos.some((item) => item.tenantId === tenantId) ||
    (store.contasPagar ?? []).some((item) => item.tenantId === tenantId) ||
    (store.tiposContaPagar ?? []).some((item) => item.tenantId === tenantId) ||
    (store.regrasRecorrenciaContaPagar ?? []).some((item) => item.tenantId === tenantId) ||
    store.planos.some((item) => item.tenantId === tenantId) ||
    store.formasPagamento.some((item) => item.tenantId === tenantId) ||
    store.atividades.some((item) => item.tenantId === tenantId) ||
    store.atividadeGrades.some((item) => item.tenantId === tenantId) ||
    store.cargos.some((item) => item.tenantId === tenantId) ||
    store.salas.some((item) => item.tenantId === tenantId) ||
    store.servicos.some((item) => item.tenantId === tenantId) ||
    store.produtos.some((item) => item.tenantId === tenantId) ||
    store.vendas.some((item) => item.tenantId === tenantId) ||
    store.vouchers.some((item) => item.tenantId === tenantId) ||
    store.campanhasCrm.some((item) => item.tenantId === tenantId)
  );
}

export async function deleteTenant(id: string): Promise<void> {
  const current = getStore();
  if (id === current.currentTenantId) {
    throw new Error("Não é possível remover a unidade ativa.");
  }
  if (tenantHasLinkedData(current, id)) {
    throw new Error("Não é possível remover unidade com dados vinculados.");
  }
  if (isRealApiEnabled()) {
    try {
      await deleteUnidadeApi(id);
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao remover unidade na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    tenants: s.tenants.filter((t) => t.id !== id),
  }));
}

// ─── CAMPANHAS CRM ──────────────────────────────────────────────────────────

export async function listCampanhasCrm(params?: {
  status?: CampanhaStatus;
}): Promise<CampanhaCRM[]> {
  const tenantId = getCurrentTenantId();
  let all = [...getStore().campanhasCrm]
    .filter((c) => c.tenantId === tenantId)
    .map((c) => ({ ...c, audienceEstimado: estimateCampanhaAudience(c) }))
    .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
  if (params?.status) all = all.filter((c) => c.status === params.status);
  return all;
}

export async function createCampanhaCrm(data: {
  nome: string;
  descricao?: string;
  publicoAlvo: CampanhaPublicoAlvo;
  canais: CampanhaCanal[];
  voucherId?: string;
  dataInicio: string;
  dataFim?: string;
  status?: CampanhaStatus;
}): Promise<CampanhaCRM> {
  const campanha: CampanhaCRM = {
    id: genId(),
    tenantId: getCurrentTenantId(),
    nome: data.nome.trim(),
    descricao: data.descricao?.trim() || undefined,
    publicoAlvo: data.publicoAlvo,
    canais: data.canais.length > 0 ? data.canais : ["WHATSAPP"],
    voucherId: data.voucherId,
    dataInicio: data.dataInicio,
    dataFim: data.dataFim || undefined,
    status: data.status ?? "RASCUNHO",
    disparosRealizados: 0,
    dataCriacao: now(),
  };
  setStore((s) => ({ ...s, campanhasCrm: [campanha, ...s.campanhasCrm] }));
  return { ...campanha, audienceEstimado: estimateCampanhaAudience(campanha) };
}

export async function updateCampanhaCrm(
  id: string,
  data: Partial<Omit<CampanhaCRM, "id" | "tenantId" | "dataCriacao" | "disparosRealizados" | "ultimaExecucao" | "audienceEstimado">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    campanhasCrm: s.campanhasCrm.map((c) =>
      c.id === id
        ? {
            ...c,
            ...data,
            nome: data.nome?.trim() ?? c.nome,
            descricao: data.descricao?.trim() || undefined,
            canais: data.canais && data.canais.length > 0 ? data.canais : c.canais,
            dataAtualizacao: now(),
          }
        : c
    ),
  }));
}

export async function dispararCampanhaCrm(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    campanhasCrm: s.campanhasCrm.map((c) => {
      if (c.id !== id) return c;
      const audiencia = estimateCampanhaAudience(c);
      return {
        ...c,
        status: "ATIVA",
        disparosRealizados: c.disparosRealizados + 1,
        ultimaExecucao: now(),
        dataAtualizacao: now(),
        audienceEstimado: audiencia,
      };
    }),
  }));
}

export async function encerrarCampanhaCrm(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    campanhasCrm: s.campanhasCrm.map((c) =>
      c.id === id
        ? { ...c, status: "ENCERRADA", dataAtualizacao: now() }
        : c
    ),
  }));
}

// ─── PROSPECTS ──────────────────────────────────────────────────────────────

function normalizeProspectFromApi(prospect: Prospect, previous?: Prospect): Prospect {
  const createdAt = prospect.dataCriacao ?? previous?.dataCriacao ?? now();
  const existingStatusLog = prospect.statusLog ?? previous?.statusLog ?? [];
  const statusChangedAt = prospect.dataUltimoContato ?? createdAt;
  const lastStatusLog = existingStatusLog[existingStatusLog.length - 1];
  const statusLog =
    existingStatusLog.length === 0
      ? [{ status: prospect.status, data: createdAt }]
      : lastStatusLog?.status === prospect.status
        ? existingStatusLog
        : [...existingStatusLog, { status: prospect.status, data: statusChangedAt }];
  return {
    ...(previous ?? {}),
    ...prospect,
    dataCriacao: createdAt,
    statusLog,
  };
}

function buildProspectUpsertData(
  current: Prospect | undefined,
  patch: Partial<Omit<Prospect, "id" | "tenantId">>
): CreateProspectInput {
  return {
    nome: (patch.nome ?? current?.nome ?? "").trim(),
    telefone: (patch.telefone ?? current?.telefone ?? "").trim(),
    email: (patch.email ?? current?.email ?? "").trim() || undefined,
    cpf: (patch.cpf ?? current?.cpf ?? "").trim() || undefined,
    origem: patch.origem ?? current?.origem ?? "OUTROS",
    observacoes: (patch.observacoes ?? current?.observacoes ?? "").trim() || undefined,
    responsavelId: (patch.responsavelId ?? current?.responsavelId ?? "").trim() || undefined,
  };
}

export async function listProspects(params?: {
  status?: StatusProspect;
}): Promise<Prospect[]> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      const prospects = await listProspectsApi({
        tenantId,
        status: params?.status,
      });
      const normalized = prospects.map((prospect) => normalizeProspectFromApi(prospect));
      setStore((s) => ({
        ...s,
        prospects: mergeTenantScopedData(s.prospects, normalized),
      }));
      return normalized;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao listar prospects na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  const { prospects } = getStore();
  const all = [...prospects].reverse();
  const byTenant = all.filter((p) => p.tenantId === tenantId);
  if (params?.status) return byTenant.filter((p) => p.status === params.status);
  return byTenant;
}

export async function listProspectsPage(params: {
  status?: StatusProspect;
  page: number;
  size: number;
}): Promise<PaginatedResult<Prospect>> {
  const page = Math.max(1, params.page);
  const size = Math.min(200, Math.max(1, params.size));
  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      const prospects = await listProspectsApi({
        tenantId,
        status: params.status,
      });
      const normalized = prospects.map((prospect) => normalizeProspectFromApi(prospect));
      const start = (page - 1) * size;
      const items = normalized.slice(start, start + size);
      setStore((s) => ({
        ...s,
        prospects: mergeTenantScopedData(s.prospects, normalized),
      }));
      return {
        items,
        page,
        size,
        total: normalized.length,
        hasNext: start + size < normalized.length,
      };
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao listar prospects paginados na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  const all = [...getStore().prospects]
    .reverse()
    .filter((p) => p.tenantId === tenantId && (!params.status || p.status === params.status));
  const start = (page - 1) * size;
  const items = all.slice(start, start + size);
  return {
    items,
    page,
    size,
    total: all.length,
    hasNext: start + size < all.length,
  };
}

export async function updateProspect(
  id: string,
  data: Partial<Omit<Prospect, "id" | "tenantId">>
): Promise<void> {
  const tenantId = getCurrentTenantId();
  let current: Prospect | null | undefined = getStore().prospects.find(
    (p) => p.id === id && p.tenantId === tenantId
  );
  if (!current && isRealApiEnabled()) {
    current = await getProspect(id);
  }
  if (!current) {
    throw new Error("Prospect não encontrado");
  }
  const merged = normalizeProspectFallbackInput(
    tenantId,
    buildProspectUpsertData(current, data)
  );
  if (isRealApiEnabled()) {
    try {
      const tenantIdForApi = (await getTenantIdForApiCall()) ?? tenantId;
      const updated = normalizeProspectFromApi(
        await updateProspectApi({
          tenantId: tenantIdForApi,
          id,
          data: merged,
        }),
        current
      );
      setStore((s) => ({
        ...s,
        prospects: s.prospects.map((p) =>
          p.id === id && p.tenantId === tenantId ? updated : p
        ),
      }));
      return;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao atualizar prospect na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    prospects: s.prospects.map((p) =>
      p.id === id && p.tenantId === tenantId ? normalizeProspectFromApi({ ...p, ...merged }, p) : p
    ),
  }));
}

export async function getProspect(id: string): Promise<Prospect | null> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      const current = getStore().prospects.find((item) => item.id === id);
      const prospect = await getProspectApi({
        tenantId,
        id,
      });
      const normalized = normalizeProspectFromApi(prospect, current);
      setStore((s) => ({
        ...s,
        prospects: [normalized, ...s.prospects.filter((item) => item.id !== normalized.id)],
      }));
      return normalized;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao obter prospect na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  return getStore().prospects.find((p) => p.id === id && p.tenantId === tenantId) ?? null;
}

export async function createProspect(
  data: CreateProspectInput
): Promise<Prospect> {
  const tenantId = getCurrentTenantId();
  const normalizedInput = normalizeProspectFallbackInput(tenantId, data);
  if (isRealApiEnabled()) {
    try {
      const tenantIdForApi = (await getTenantIdForApiCall()) ?? tenantId;
      const created = normalizeProspectFromApi(
        await createProspectApi({
          tenantId: tenantIdForApi,
          data: normalizedInput,
        })
      );
      setStore((s) => ({ ...s, prospects: [created, ...s.prospects.filter((item) => item.id !== created.id)] }));
      return created;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao criar prospect na API real. Aplicando criação local.", error);
    }
  }
  const createdAt = now();
  const prospect: Prospect = {
    ...normalizedInput,
    id: genId(),
    tenantId,
    status: "NOVO",
    dataCriacao: createdAt,
    statusLog: [{ status: "NOVO", data: createdAt }],
  };
  setStore((s) => ({ ...s, prospects: [prospect, ...s.prospects] }));
  return prospect;
}

export async function updateProspectStatus(
  id: string,
  status: StatusProspect
): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const tenantIdForApi = (await getTenantIdForApiCall()) ?? tenantId;
      const current = getStore().prospects.find((p) => p.id === id);
      const updated = normalizeProspectFromApi(
        await updateProspectStatusApi({
          tenantId: tenantIdForApi,
          id,
          status,
        }),
        current
      );
      setStore((s) => ({
        ...s,
        prospects: s.prospects.map((p) => (p.id === id ? updated : p)),
      }));
      return;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao atualizar status do prospect na API real. Aplicando update local.", error);
    }
  }
  requireTenantScopedEntity(getStore().prospects, id, tenantId, "Prospect não encontrado");
  const at = now();
  setStore((s) => ({
    ...s,
    prospects: s.prospects.map((p) =>
      p.id === id && p.tenantId === tenantId
        ? {
            ...p,
            status,
            dataUltimoContato: at,
            statusLog: [...(p.statusLog ?? []), { status, data: at }],
          }
        : p
    ),
  }));
}

export async function marcarProspectPerdido(
  id: string,
  motivo?: string
): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const tenantIdForApi = (await getTenantIdForApiCall()) ?? tenantId;
      const current = getStore().prospects.find((p) => p.id === id);
      const updated = normalizeProspectFromApi(
        await marcarProspectPerdidoApi({
          tenantId: tenantIdForApi,
          id,
          motivo,
        }),
        current
      );
      setStore((s) => ({
        ...s,
        prospects: s.prospects.map((p) => (p.id === id ? updated : p)),
      }));
      return;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao marcar prospect como perdido na API real. Aplicando update local.", error);
    }
  }
  requireTenantScopedEntity(getStore().prospects, id, tenantId, "Prospect não encontrado");
  const at = now();
  setStore((s) => ({
    ...s,
    prospects: s.prospects.map((p) =>
      p.id === id && p.tenantId === tenantId
        ? {
            ...p,
            status: "PERDIDO" as StatusProspect,
            motivoPerda: motivo,
            dataUltimoContato: at,
            statusLog: [
              ...(p.statusLog ?? []),
              { status: "PERDIDO" as StatusProspect, data: at },
            ],
          }
        : p
    ),
  }));
}

// ─── PROSPECT MENSAGENS ──────────────────────────────────────────────────────

export async function listProspectMensagens(
  prospectId: string
): Promise<ProspectMensagem[]> {
  if (isRealApiEnabled()) {
    try {
      const mensagens = await listProspectMensagensApi({
        tenantId: getCurrentTenantId(),
        prospectId,
      });
      setStore((s) => ({
        ...s,
        prospectMensagens: [
          ...mensagens,
          ...s.prospectMensagens.filter((item) => !mensagens.some((m) => m.id === item.id)),
        ],
      }));
      return mensagens;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao listar mensagens do prospect na API real. Usando store local.", error);
    }
  }
  return getStore().prospectMensagens.filter((m) => m.prospectId === prospectId);
}

export async function addProspectMensagem(
  prospectId: string,
  texto: string,
  autorNome: string,
  autorId?: string
): Promise<ProspectMensagem> {
  if (isRealApiEnabled()) {
    try {
      const msg = await addProspectMensagemApi({
        tenantId: getCurrentTenantId(),
        prospectId,
        data: {
          texto,
          autorNome,
          autorId,
        },
      });
      setStore((s) => ({ ...s, prospectMensagens: [...s.prospectMensagens, msg] }));
      return msg;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao adicionar mensagem do prospect na API real. Aplicando criação local.", error);
    }
  }
  const msg: ProspectMensagem = {
    id: genId(),
    prospectId,
    texto,
    datahora: now(),
    autorNome,
    autorId,
  };
  setStore((s) => ({ ...s, prospectMensagens: [...s.prospectMensagens, msg] }));
  const at = now();
  setStore((s) => ({
    ...s,
    prospects: s.prospects.map((p) =>
      p.id === prospectId ? { ...p, dataUltimoContato: at } : p
    ),
  }));
  return msg;
}

// ─── PROSPECT AGENDAMENTOS ───────────────────────────────────────────────────

export async function listProspectAgendamentos(
  prospectId: string
): Promise<ProspectAgendamento[]> {
  if (isRealApiEnabled()) {
    try {
      const agendamentos = await listProspectAgendamentosApi({
        tenantId: getCurrentTenantId(),
        prospectId,
      });
      setStore((s) => ({
        ...s,
        prospectAgendamentos: [
          ...agendamentos,
          ...s.prospectAgendamentos.filter((item) => !agendamentos.some((a) => a.id === item.id)),
        ],
      }));
      return [...agendamentos].sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao listar agendamentos do prospect na API real. Usando store local.", error);
    }
  }
  return getStore().prospectAgendamentos
    .filter((a) => a.prospectId === prospectId)
    .sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));
}

export async function criarProspectAgendamento(data: {
  prospectId: string;
  funcionarioId: string;
  titulo: string;
  data: string;
  hora: string;
  observacoes?: string;
}): Promise<ProspectAgendamento> {
  if (isRealApiEnabled()) {
    try {
      const ag = await criarProspectAgendamentoApi({
        tenantId: getCurrentTenantId(),
        prospectId: data.prospectId,
        data: {
          funcionarioId: data.funcionarioId,
          titulo: data.titulo,
          data: data.data,
          hora: data.hora,
          observacoes: data.observacoes,
        },
      });
      setStore((s) => ({
        ...s,
        prospectAgendamentos: [...s.prospectAgendamentos, ag],
      }));
      return ag;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao criar agendamento do prospect na API real. Aplicando criação local.", error);
    }
  }
  const ag: ProspectAgendamento = {
    id: genId(),
    ...data,
    status: "AGENDADO",
  };
  setStore((s) => ({
    ...s,
    prospectAgendamentos: [...s.prospectAgendamentos, ag],
  }));
  return ag;
}

export async function updateProspectAgendamento(
  id: string,
  status: StatusAgendamento
): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await updateProspectAgendamentoApi({
        tenantId: getCurrentTenantId(),
        id,
        status,
      });
      setStore((s) => ({
        ...s,
        prospectAgendamentos: s.prospectAgendamentos.map((a) =>
          a.id === id ? { ...a, status } : a
        ),
      }));
      return;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao atualizar status do agendamento na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    prospectAgendamentos: s.prospectAgendamentos.map((a) =>
      a.id === id ? { ...a, status } : a
    ),
  }));
}

export async function checkProspectDuplicate(params: {
  telefone?: string;
  cpf?: string;
  email?: string;
}): Promise<boolean> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      return await checkProspectDuplicateApi({
        tenantId,
        telefone: params.telefone,
        cpf: params.cpf,
        email: params.email,
      });
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao verificar duplicidade de prospect na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  const { prospects } = getStore();
  const tel = params.telefone?.replace(/\D/g, "");
  return prospects.some((p) => {
    if (p.tenantId !== tenantId) return false;
    const samePhone =
      tel && p.telefone?.replace(/\D/g, "") === tel;
    const sameCpf = params.cpf && p.cpf === params.cpf;
    const sameEmail =
      params.email && p.email?.toLowerCase() === params.email.toLowerCase();
    return Boolean(samePhone || sameCpf || sameEmail);
  });
}

export async function converterProspect(
  data: ConverterProspectInput
): Promise<ConverterProspectResponse> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      const converted = await converterProspectApi({
        tenantId,
        data,
      });
      const convertedAluno = {
        ...converted.aluno,
        pendenteComplementacao: false,
      };
      setStore((s) => ({
        ...s,
        alunos: [convertedAluno, ...s.alunos.filter((a) => a.id !== convertedAluno.id)],
        matriculas: [converted.matricula, ...s.matriculas.filter((m) => m.id !== converted.matricula.id)],
        pagamentos: [converted.pagamento, ...s.pagamentos.filter((p) => p.id !== converted.pagamento.id)],
        prospects: s.prospects.map((p) =>
          p.id === data.prospectId ? { ...p, status: "CONVERTIDO", dataUltimoContato: now() } : p
        ),
      }));
      return {
        ...converted,
        aluno: convertedAluno,
      };
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao converter prospect na API real. Aplicando conversão local.", error);
    }
  }
  const store = getStore();
  const tenantId = getCurrentTenantId();
  const prospect = store.prospects.find((p) => p.id === data.prospectId && p.tenantId === tenantId);
  if (!prospect) throw new Error("Prospect não encontrado");

  const plano = store.planos.find((p) => p.id === data.planoId && p.tenantId === tenantId);
  if (!plano) throw new Error("Plano não encontrado");

  const alunoId = genId();
  const matriculaId = genId();
  const pagamentoId = genId();

  const aluno: Aluno = {
    id: alunoId,
    tenantId,
    prospectId: data.prospectId,
    nome: prospect.nome,
    pendenteComplementacao: false,
    email: prospect.email ?? "",
    telefone: prospect.telefone,
    cpf: data.cpf,
    rg: data.rg,
    dataNascimento: data.dataNascimento,
    sexo: data.sexo,
    endereco: data.endereco,
    contatoEmergencia: data.contatoEmergencia,
    observacoesMedicas: data.observacoesMedicas,
    status: "INATIVO",
    dataCadastro: now(),
  };

  const dataFim = addDays(data.dataInicio, plano.duracaoDias);
  const desconto = data.desconto ?? 0;

  const matricula: Matricula = {
    id: matriculaId,
    tenantId,
    alunoId,
    planoId: data.planoId,
    dataInicio: data.dataInicio,
    dataFim,
    valorPago: plano.valor,
    valorMatricula: plano.valorMatricula,
    desconto,
    motivoDesconto: data.motivoDesconto,
    formaPagamento: data.formaPagamento,
    status: "ATIVA",
    renovacaoAutomatica: false,
    dataCriacao: now(),
  };

  const valorFinal = plano.valor - desconto;
  const pagamento: Pagamento = {
    id: pagamentoId,
    tenantId,
    alunoId,
    matriculaId,
    tipo: "MENSALIDADE",
    descricao: `Mensalidade – ${plano.nome}`,
    valor: plano.valor,
    desconto,
    valorFinal,
    dataVencimento: data.dataInicio,
    status: "PENDENTE",
    dataCriacao: now(),
  };

  setStore((s) => ({
    ...s,
    alunos: [...s.alunos, aluno],
    matriculas: [...s.matriculas, matricula],
    pagamentos: [...s.pagamentos, pagamento],
    prospects: s.prospects.map((p) =>
      p.id === data.prospectId
        ? {
            ...p,
            status: "CONVERTIDO" as StatusProspect,
            dataUltimoContato: now(),
            statusLog: [
              ...(p.statusLog ?? []),
              { status: "CONVERTIDO" as StatusProspect, data: now() },
            ],
          }
        : p
    ),
  }));

  return { aluno, matricula, pagamento };
}

// ─── CADASTRO DIRETO ────────────────────────────────────────────────────────

export interface CriarAlunoComMatriculaInput {
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
  planoId: string;
  dataInicio: string;
  formaPagamento: TipoFormaPagamento;
  desconto?: number;
  motivoDesconto?: string;
}

export interface CriarAlunoComMatriculaResponse {
  aluno: Aluno;
  matricula: Matricula;
  pagamento: Pagamento;
}

export async function criarAluno(
  data: Omit<
    CriarAlunoComMatriculaInput,
    | "planoId"
    | "dataInicio"
    | "formaPagamento"
    | "desconto"
    | "motivoDesconto"
  >
): Promise<Aluno> {
  if (isRealApiEnabled()) {
    try {
      const created = await createAlunoApi({
        tenantId: getCurrentTenantId(),
        data,
      });
      const createdWithPending = {
        ...created,
        pendenteComplementacao: true,
      };
      setStore((s) => ({
        ...s,
        alunos: [
          createdWithPending,
          ...s.alunos.filter((item) => item.id !== createdWithPending.id),
        ],
      }));
      return createdWithPending;
    } catch (error) {
      console.warn("[alunos][api-fallback] Falha ao criar aluno na API real. Aplicando criação local.", error);
    }
  }
  const alunoId = genId();
  const aluno: Aluno = {
    id: alunoId,
    tenantId: getCurrentTenantId(),
    nome: data.nome,
    pendenteComplementacao: true,
    email: data.email,
    telefone: data.telefone,
    telefoneSec: data.telefoneSec,
    cpf: data.cpf,
    rg: data.rg,
    dataNascimento: data.dataNascimento,
    sexo: data.sexo,
    endereco: data.endereco,
    contatoEmergencia: data.contatoEmergencia,
    observacoesMedicas: data.observacoesMedicas,
    foto: data.foto,
    status: "INATIVO",
    dataCadastro: now(),
  };
  setStore((s) => ({
    ...s,
    alunos: [...s.alunos, aluno],
  }));
  return aluno;
}

export async function criarAlunoComMatricula(
  data: CriarAlunoComMatriculaInput
): Promise<CriarAlunoComMatriculaResponse> {
  if (isRealApiEnabled()) {
    try {
      const created = await createAlunoComMatriculaApi({
        tenantId: getCurrentTenantId(),
        data,
      });
      const createdAluno = { ...created.aluno, pendenteComplementacao: false };
      setStore((s) => ({
        ...s,
        alunos: [createdAluno, ...s.alunos.filter((item) => item.id !== createdAluno.id)],
        matriculas: [created.matricula, ...s.matriculas.filter((item) => item.id !== created.matricula.id)],
        pagamentos: [created.pagamento, ...s.pagamentos.filter((item) => item.id !== created.pagamento.id)],
      }));
      syncAlunosStatus();
      return {
        ...created,
        aluno: createdAluno,
      };
    } catch (error) {
      console.warn("[alunos][api-fallback] Falha ao criar aluno com matrícula na API real. Aplicando criação local.", error);
    }
  }
  const store = getStore();
  const plano = store.planos.find((p) => p.id === data.planoId);
  if (!plano) throw new Error("Plano não encontrado");

  const alunoId = genId();
  const matriculaId = genId();
  const pagamentoId = genId();

  const aluno: Aluno = {
    id: alunoId,
    tenantId: getCurrentTenantId(),
    nome: data.nome,
    pendenteComplementacao: false,
    email: data.email,
    telefone: data.telefone,
    telefoneSec: data.telefoneSec,
    cpf: data.cpf,
    rg: data.rg,
    dataNascimento: data.dataNascimento,
    sexo: data.sexo,
    endereco: data.endereco,
    contatoEmergencia: data.contatoEmergencia,
    observacoesMedicas: data.observacoesMedicas,
    foto: data.foto,
    status: "ATIVO",
    dataCadastro: now(),
  };

  const dataFim = addDays(data.dataInicio, plano.duracaoDias);
  const desconto = data.desconto ?? 0;

  const matricula: Matricula = {
    id: matriculaId,
    tenantId: getCurrentTenantId(),
    alunoId,
    planoId: data.planoId,
    dataInicio: data.dataInicio,
    dataFim,
    valorPago: plano.valor,
    valorMatricula: plano.valorMatricula,
    desconto,
    motivoDesconto: data.motivoDesconto,
    formaPagamento: data.formaPagamento,
    status: "ATIVA",
    renovacaoAutomatica: false,
    dataCriacao: now(),
  };

  const valorFinal = plano.valor - desconto;
  const pagamento: Pagamento = {
    id: pagamentoId,
    tenantId: getCurrentTenantId(),
    alunoId,
    matriculaId,
    tipo: "MENSALIDADE",
    descricao: `Mensalidade – ${plano.nome}`,
    valor: plano.valor,
    desconto,
    valorFinal,
    dataVencimento: data.dataInicio,
    status: "PENDENTE",
    dataCriacao: now(),
  };

  setStore((s) => ({
    ...s,
    alunos: [...s.alunos, aluno],
    matriculas: [...s.matriculas, matricula],
    pagamentos: [...s.pagamentos, pagamento],
  }));
  syncAlunosStatus();

  return { aluno, matricula, pagamento };
}

export async function deleteProspect(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await deleteProspectApi({
        tenantId: getCurrentTenantId(),
        id,
      });
      setStore((s) => ({
        ...s,
        prospects: s.prospects.filter((p) => p.id !== id),
      }));
      return;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao remover prospect na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    prospects: s.prospects.filter((p) => p.id !== id),
  }));
}

// ─── FUNCIONÁRIOS ───────────────────────────────────────────────────────────

export async function listCargos(params?: { apenasAtivos?: boolean }): Promise<Cargo[]> {
  if (isRealApiEnabled()) {
    try {
      const cargos = await listCargosApi(params?.apenasAtivos);
      setStore((s) => ({
        ...s,
        cargos: [...cargos, ...s.cargos.filter((item) => !cargos.some((c) => c.id === item.id))],
      }));
      return cargos;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao listar cargos na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  const only = params?.apenasAtivos ?? false;
  const cargos = getStore().cargos.filter((c) => c.tenantId === tenantId);
  return only ? cargos.filter((c) => c.ativo) : cargos;
}

export async function createCargo(
  data: Omit<Cargo, "id" | "tenantId" | "ativo">
): Promise<Cargo> {
  if (isRealApiEnabled()) {
    try {
      const created = await createCargoApi({ nome: data.nome });
      setStore((s) => ({ ...s, cargos: [created, ...s.cargos.filter((c) => c.id !== created.id)] }));
      return created;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao criar cargo na API real. Aplicando criação local.", error);
    }
  }
  const cargo: Cargo = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, cargos: [cargo, ...s.cargos] }));
  return cargo;
}

export async function updateCargo(
  id: string,
  data: Partial<Omit<Cargo, "id" | "tenantId">>
): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const updated = await updateCargoApi(id, data);
      setStore((s) => ({
        ...s,
        cargos: s.cargos.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao atualizar cargo na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    cargos: s.cargos.map((c) => (c.id === id ? { ...c, ...data } : c)),
  }));
}

export async function toggleCargo(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const toggled = await toggleCargoApi(id);
      setStore((s) => ({
        ...s,
        cargos: s.cargos.map((c) => (c.id === id ? { ...c, ...toggled } : c)),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao alternar cargo na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    cargos: s.cargos.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c)),
  }));
}

export async function deleteCargo(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await deleteCargoApi(id);
      setStore((s) => ({
        ...s,
        cargos: s.cargos.filter((c) => c.id !== id),
        funcionarios: s.funcionarios.map((f) =>
          f.cargoId === id ? { ...f, cargoId: undefined, cargo: undefined } : f
        ),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao remover cargo na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    cargos: s.cargos.filter((c) => c.id !== id),
    funcionarios: s.funcionarios.map((f) =>
      f.cargoId === id ? { ...f, cargoId: undefined } : f
    ),
  }));
}

export async function listFuncionarios(params?: { apenasAtivos?: boolean }): Promise<Funcionario[]> {
  if (isRealApiEnabled()) {
    try {
      const funcionarios = await listFuncionariosApi(params?.apenasAtivos);
      setStore((s) => ({
        ...s,
        funcionarios: [
          ...funcionarios,
          ...s.funcionarios.filter((item) => !funcionarios.some((f) => f.id === item.id)),
        ],
      }));
      return funcionarios;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao listar funcionários na API real. Usando store local.", error);
    }
  }
  const only = params?.apenasAtivos ?? true;
  return only
    ? getStore().funcionarios.filter((f) => f.ativo)
    : getStore().funcionarios;
}

export async function createFuncionario(
  data: Omit<Funcionario, "id" | "ativo">
): Promise<Funcionario> {
  if (isRealApiEnabled()) {
    try {
      const created = await createFuncionarioApi(data);
      setStore((s) => ({
        ...s,
        funcionarios: [created, ...s.funcionarios.filter((item) => item.id !== created.id)],
      }));
      return created;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao criar funcionário na API real. Aplicando criação local.", error);
    }
  }
  const f: Funcionario = {
    ...data,
    podeMinistrarAulas: data.podeMinistrarAulas ?? false,
    id: genId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, funcionarios: [f, ...s.funcionarios] }));
  return f;
}

export async function updateFuncionario(
  id: string,
  data: Partial<Omit<Funcionario, "id">>
): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const updated = await updateFuncionarioApi(id, data);
      setStore((s) => ({
        ...s,
        funcionarios: s.funcionarios.map((f) => (f.id === id ? { ...f, ...updated } : f)),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao atualizar funcionário na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    funcionarios: s.funcionarios.map((f) =>
      f.id === id
        ? { ...f, ...data, podeMinistrarAulas: data.podeMinistrarAulas ?? f.podeMinistrarAulas }
        : f
    ),
  }));
}

export async function toggleFuncionario(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const toggled = await toggleFuncionarioApi(id);
      setStore((s) => ({
        ...s,
        funcionarios: s.funcionarios.map((f) => (f.id === id ? { ...f, ...toggled } : f)),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao alternar funcionário na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    funcionarios: s.funcionarios.map((f) =>
      f.id === id ? { ...f, ativo: !f.ativo } : f
    ),
  }));
}

export async function deleteFuncionario(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await deleteFuncionarioApi(id);
      setStore((s) => ({
        ...s,
        funcionarios: s.funcionarios.filter((f) => f.id !== id),
        atividadeGrades: s.atividadeGrades.map((g) =>
          g.funcionarioId === id ? { ...g, funcionarioId: undefined } : g
        ),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao remover funcionário na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    funcionarios: s.funcionarios.filter((f) => f.id !== id),
    atividadeGrades: s.atividadeGrades.map((g) =>
      g.funcionarioId === id ? { ...g, funcionarioId: undefined } : g
    ),
  }));
}

// ─── SALAS ──────────────────────────────────────────────────────────────────

export async function listSalas(params?: { apenasAtivas?: boolean }): Promise<Sala[]> {
  if (isRealApiEnabled()) {
    try {
      const salas = await listSalasApi(params?.apenasAtivas);
      setStore((s) => ({
        ...s,
        salas: [...salas, ...s.salas.filter((item) => !salas.some((sa) => sa.id === item.id))],
      }));
      return salas;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao listar salas na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  const only = params?.apenasAtivas ?? false;
  const salas = getStore().salas.filter((s) => s.tenantId === tenantId);
  return only ? salas.filter((s) => s.ativo) : salas;
}

export async function createSala(
  data: Omit<Sala, "id" | "tenantId" | "ativo">
): Promise<Sala> {
  if (isRealApiEnabled()) {
    try {
      const created = await createSalaApi(data);
      setStore((s) => ({ ...s, salas: [created, ...s.salas.filter((item) => item.id !== created.id)] }));
      return created;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao criar sala na API real. Aplicando criação local.", error);
    }
  }
  const sala: Sala = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, salas: [sala, ...s.salas] }));
  return sala;
}

export async function updateSala(
  id: string,
  data: Partial<Omit<Sala, "id" | "tenantId">>
): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const updated = await updateSalaApi(id, data);
      setStore((s) => ({
        ...s,
        salas: s.salas.map((item) => (item.id === id ? { ...item, ...updated } : item)),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao atualizar sala na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    salas: s.salas.map((item) => (item.id === id ? { ...item, ...data } : item)),
  }));
}

export async function toggleSala(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const toggled = await toggleSalaApi(id);
      setStore((s) => ({
        ...s,
        salas: s.salas.map((item) => (item.id === id ? { ...item, ...toggled } : item)),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao alternar sala na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    salas: s.salas.map((item) => (item.id === id ? { ...item, ativo: !item.ativo } : item)),
  }));
}

export async function deleteSala(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await deleteSalaApi(id);
      setStore((s) => ({
        ...s,
        salas: s.salas.filter((item) => item.id !== id),
        atividadeGrades: s.atividadeGrades.map((g) =>
          g.salaId === id ? { ...g, salaId: undefined } : g
        ),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao remover sala na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    salas: s.salas.filter((item) => item.id !== id),
    atividadeGrades: s.atividadeGrades.map((g) =>
      g.salaId === id ? { ...g, salaId: undefined } : g
    ),
  }));
}

// ─── TENANT ────────────────────────────────────────────────────────────────

export async function getTenant(): Promise<Tenant> {
  return getCurrentTenant();
}

export async function updateTenant(data: Partial<Tenant>): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const updated = await updateTenantAtualApi(data);
      setStore((s) => ({
        ...s,
        tenant: s.tenant.id === s.currentTenantId ? { ...s.tenant, ...updated } : s.tenant,
        tenants: s.tenants.map((item) =>
          item.id === s.currentTenantId ? { ...item, ...updated } : item
        ),
      }));
      return;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao atualizar tenant na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    tenant: s.tenant.id === s.currentTenantId ? { ...s.tenant, ...data } : s.tenant,
    tenants: s.tenants.map((t) =>
      t.id === s.currentTenantId ? { ...t, ...data } : t
    ),
  }));
}

export async function listHorarios(): Promise<HorarioFuncionamento[]> {
  if (isRealApiEnabled()) {
    try {
      const horarios = await listHorariosApi(getCurrentTenantId());
      setStore((s) => ({ ...s, horarios }));
      return horarios;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao listar horários na API real. Usando store local.", error);
    }
  }
  return getStore().horarios;
}

export async function updateHorarios(
  data: HorarioFuncionamento[]
): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const updated = await updateHorariosApi({
        tenantId: getCurrentTenantId(),
        data,
      });
      setStore((s) => ({ ...s, horarios: updated }));
      return;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao atualizar horários na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({ ...s, horarios: data }));
}

export async function listConvenios(params?: { apenasAtivos?: boolean }): Promise<Convenio[]> {
  if (isRealApiEnabled()) {
    try {
      const convenios = await listConveniosApi(params?.apenasAtivos);
      setStore((s) => ({
        ...s,
        convenios: [...convenios, ...s.convenios.filter((item) => !convenios.some((c) => c.id === item.id))],
      }));
      return convenios;
    } catch (error) {
      console.warn("[beneficios][api-fallback] Falha ao listar convênios na API real. Usando store local.", error);
    }
  }
  const only = params?.apenasAtivos ?? false;
  return only ? getStore().convenios.filter((c) => c.ativo) : getStore().convenios;
}

export async function createConvenio(
  data: Omit<Convenio, "id">
): Promise<Convenio> {
  if (isRealApiEnabled()) {
    try {
      const created = await createConvenioApi(data);
      setStore((s) => ({ ...s, convenios: [created, ...s.convenios.filter((item) => item.id !== created.id)] }));
      return created;
    } catch (error) {
      console.warn("[beneficios][api-fallback] Falha ao criar convênio na API real. Aplicando criação local.", error);
    }
  }
  const convenio: Convenio = { ...data, id: genId() };
  setStore((s) => ({ ...s, convenios: [convenio, ...s.convenios] }));
  return convenio;
}

export async function updateConvenio(
  id: string,
  data: Partial<Omit<Convenio, "id">>
): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const updated = await updateConvenioApi(id, data);
      setStore((s) => ({
        ...s,
        convenios: s.convenios.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      }));
      return;
    } catch (error) {
      console.warn("[beneficios][api-fallback] Falha ao atualizar convênio na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    convenios: s.convenios.map((c) => (c.id === id ? { ...c, ...data } : c)),
  }));
}

export async function toggleConvenio(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const toggled = await toggleConvenioApi(id);
      setStore((s) => ({
        ...s,
        convenios: s.convenios.map((c) => (c.id === id ? { ...c, ...toggled } : c)),
      }));
      return;
    } catch (error) {
      console.warn("[beneficios][api-fallback] Falha ao alternar convênio na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    convenios: s.convenios.map((c) =>
      c.id === id ? { ...c, ativo: !c.ativo } : c
    ),
  }));
}

export async function deleteConvenio(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await deleteConvenioApi(id);
      setStore((s) => ({ ...s, convenios: s.convenios.filter((c) => c.id !== id) }));
      return;
    } catch (error) {
      console.warn("[beneficios][api-fallback] Falha ao remover convênio na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    convenios: s.convenios.filter((c) => c.id !== id),
  }));
}

// ─── VOUCHERS ───────────────────────────────────────────────────────────────

export async function listVouchers(): Promise<Voucher[]> {
  if (isRealApiEnabled()) {
    try {
      const vouchers = await listVouchersApi();
      setStore((s) => ({
        ...s,
        vouchers: [...vouchers, ...s.vouchers.filter((item) => !vouchers.some((v) => v.id === item.id))],
      }));
      return vouchers;
    } catch (error) {
      console.warn("[beneficios][api-fallback] Falha ao listar vouchers na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  const groupId = getCurrentGroupId();
  const { vouchers } = getStore();
  return [...vouchers].reverse().filter((v) => {
    if (v.escopo === "GRUPO") {
      return Boolean(groupId) && v.groupId === groupId;
    }
    return v.tenantId === tenantId;
  });
}

function gerarCodigoAleatorio(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createVoucher(
  data: Omit<Voucher, "id" | "tenantId" | "groupId" | "ativo"> & { codigoUnicoCustom?: string }
): Promise<Voucher> {
  if (isRealApiEnabled()) {
    try {
      const created = await createVoucherApi(data as unknown as Record<string, unknown>);
      setStore((s) => ({ ...s, vouchers: [created, ...s.vouchers.filter((item) => item.id !== created.id)] }));
      return created;
    } catch (error) {
      console.warn("[beneficios][api-fallback] Falha ao criar voucher na API real. Aplicando criação local.", error);
    }
  }
  const { codigoUnicoCustom, ...voucherData } = data;
  const tenantId = getCurrentTenantId();
  const groupId = getCurrentGroupId();
  const voucher: Voucher = {
    ...voucherData,
    id: genId(),
    tenantId: data.escopo === "GRUPO" ? undefined : tenantId,
    groupId: data.escopo === "GRUPO" ? groupId : undefined,
    ativo: true,
  };

  const qty = data.codigoTipo === "UNICO" ? 1 : Math.min(data.quantidade ?? 10, 50);
  const uniCodigo = (codigoUnicoCustom ?? "").trim().toUpperCase() || gerarCodigoAleatorio();
  const codigos: VoucherCodigo[] = Array.from({ length: qty }, () => ({
    id: genId(),
    voucherId: voucher.id,
    codigo: data.codigoTipo === "UNICO" ? uniCodigo : gerarCodigoAleatorio(),
    usado: false,
  }));

  setStore((s) => ({
    ...s,
    vouchers: [voucher, ...s.vouchers],
    voucherCodigos: [...s.voucherCodigos, ...codigos],
  }));
  return voucher;
}

export async function listVoucherCodigos(voucherId: string): Promise<VoucherCodigo[]> {
  if (isRealApiEnabled()) {
    try {
      const codigos = await listVoucherCodigosApi(voucherId);
      setStore((s) => ({
        ...s,
        voucherCodigos: [
          ...s.voucherCodigos.filter((item) => item.voucherId !== voucherId),
          ...codigos,
        ],
      }));
      return codigos;
    } catch (error) {
      console.warn("[beneficios][api-fallback] Falha ao listar códigos de voucher na API real. Usando store local.", error);
    }
  }
  return getStore().voucherCodigos.filter((c) => c.voucherId === voucherId);
}

export async function toggleVoucher(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const toggled = await toggleVoucherApiAdmin(id);
      setStore((s) => ({
        ...s,
        vouchers: s.vouchers.map((v) => (v.id === id ? { ...v, ...toggled } : v)),
      }));
      return;
    } catch (error) {
      console.warn("[beneficios][api-fallback] Falha ao alternar voucher na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    vouchers: s.vouchers.map((v) =>
      v.id === id ? { ...v, ativo: !v.ativo } : v
    ),
  }));
}

export async function updateVoucher(
  id: string,
  data: {
    escopo: VoucherEscopo;
    tipo: string;
    nome: string;
    periodoInicio: string;
    periodoFim?: string;
    prazoDeterminado: boolean;
    quantidade?: number;
    ilimitado: boolean;
    usarNaVenda: boolean;
    planoIds: string[];
    umaVezPorCliente: boolean;
    aplicarEm: VoucherAplicarEm[];
  }
): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const updated = await updateVoucherApiAdmin(id, data as unknown as Record<string, unknown>);
      setStore((s) => ({
        ...s,
        vouchers: s.vouchers.map((v) => (v.id === id ? { ...v, ...updated } : v)),
      }));
      return;
    } catch (error) {
      console.warn("[beneficios][api-fallback] Falha ao atualizar voucher na API real. Aplicando update local.", error);
    }
  }
  const hasUsage = getStore().voucherCodigos.some(
    (c) => c.voucherId === id && c.usado
  );
  if (hasUsage) {
    throw new Error("Voucher já utilizado não pode ser editado.");
  }
  const tenantId = getCurrentTenantId();
  const groupId = getCurrentGroupId();
  setStore((s) => ({
    ...s,
    vouchers: s.vouchers.map((v) =>
      v.id === id
        ? {
            ...v,
            ...data,
            tenantId: data.escopo === "GRUPO" ? undefined : tenantId,
            groupId: data.escopo === "GRUPO" ? groupId : undefined,
          }
        : v
    ),
  }));
}

export async function listVoucherUsageCounts(): Promise<Record<string, number>> {
  if (isRealApiEnabled()) {
    try {
      return await listVoucherUsageCountsApi();
    } catch (error) {
      console.warn("[beneficios][api-fallback] Falha ao listar uso de vouchers na API real. Usando store local.", error);
    }
  }
  const result: Record<string, number> = {};
  for (const c of getStore().voucherCodigos) {
    if (c.usado) {
      result[c.voucherId] = (result[c.voucherId] ?? 0) + 1;
    }
  }
  return result;
}

// ─── PRESENÇAS ─────────────────────────────────────────────────────────────

export async function listPresencasByAluno(alunoId: string): Promise<Presenca[]> {
  return getStore().presencas.filter((p) => p.alunoId === alunoId);
}

// ─── ALUNOS ─────────────────────────────────────────────────────────────────

function normalizeAlunoPendenteComplementacao(
  aluno: Aluno,
  fallbackStore: Aluno[] = []
): Aluno {
  if (aluno.pendenteComplementacao !== undefined) {
    return aluno;
  }
  const local = fallbackStore.find((a) => a.id === aluno.id);
  return {
    ...aluno,
    pendenteComplementacao: local?.pendenteComplementacao ?? false,
  };
}

function getNumberFromUnknown(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

export async function listAlunos(params?: {
  status?: StatusAluno;
}): Promise<Aluno[]> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = await getTenantIdForApiCall();
      const alunosResponse = await listAlunosApi({
        tenantId,
        status: params?.status,
      });
      const alunos = extractAlunosFromListResponse(alunosResponse);
      const existing = getStore().alunos;
      const normalized = alunos.map((aluno) =>
        normalizeAlunoPendenteComplementacao(aluno, existing)
      );
      setStore((s) => ({
        ...s,
        alunos: mergeTenantScopedData(s.alunos, normalized),
      }));
      return normalized;
    } catch (error) {
      console.warn("[alunos][api-fallback] Falha ao listar alunos na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  syncAlunosStatus();
  const { alunos } = getStore();
  const all = [...alunos].reverse().filter((a) => a.tenantId === tenantId);
  if (params?.status) return all.filter((a) => a.status === params.status);
  return all;
}

export async function listAlunosPage(params: {
  status?: StatusAluno;
  page: number;
  size: number;
}): Promise<PaginatedAlunosResult> {
  const page = Math.max(0, params.page);
  const size = Math.min(200, Math.max(1, params.size));
  if (isRealApiEnabled()) {
    try {
      const tenantId = await getTenantIdForApiCall();
      const alunosResponse = await listAlunosApi({
        tenantId,
        status: params.status,
        page,
        size,
      });
      const alunos = extractAlunosFromListResponse(alunosResponse);
      const totaisStatus = extractAlunosTotais(alunosResponse);
      const isResponseObject =
        alunosResponse !== null &&
        alunosResponse !== undefined &&
        typeof alunosResponse === "object" &&
        !Array.isArray(alunosResponse);
      const responsePage = isResponseObject ? getNumberFromUnknown(alunosResponse.page) ?? page : page;
      const responseSize = isResponseObject ? getNumberFromUnknown(alunosResponse.size) ?? size : size;
      const directTotal = isResponseObject ? getNumberFromUnknown(alunosResponse.total) : undefined;
      const responseHasNext = isResponseObject ? alunosResponse.hasNext : undefined;
      const existing = getStore().alunos;
      const normalized = alunos.map((aluno) =>
        normalizeAlunoPendenteComplementacao(aluno, existing)
      );
      setStore((s) => ({
        ...s,
        alunos: mergeTenantScopedData(s.alunos, normalized),
      }));
      const total = totaisStatus?.total;
      const normalizedTotal =
        total ??
        directTotal ??
        totaisStatus?.total ??
        (typeof totaisStatus?.totalAtivo === "number" ? totaisStatus.totalAtivo : undefined) ??
        alunos.length;
      return {
        items: normalized,
        page: responsePage,
        size: responseSize,
        total: normalizedTotal,
        hasNext:
          typeof responseHasNext === "boolean"
            ? responseHasNext
            : normalizedTotal > (responsePage + 1) * responseSize
            ? true
            : alunos.length >= responseSize,
        totaisStatus: {
          total: totaisStatus?.total ?? normalizedTotal,
          totalAtivo: totaisStatus?.totalAtivo ?? 0,
          totalSuspenso: totaisStatus?.totalSuspenso ?? 0,
          totalInativo: totaisStatus?.totalInativo ?? 0,
          totalCancelado: totaisStatus?.totalCancelado,
          ativos: totaisStatus?.ativos,
          suspensos: totaisStatus?.suspensos,
          inativos: totaisStatus?.inativos,
          cancelados: totaisStatus?.cancelados,
        },
      };
    } catch (error) {
      console.warn("[alunos][api-fallback] Falha ao listar alunos paginados na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  syncAlunosStatus();
  const all = [...getStore().alunos]
    .reverse()
    .filter((a) => a.tenantId === tenantId && (!params.status || a.status === params.status));
  const start = page * size;
  const items = all.slice(start, start + size);
  const total = all.length;
  const totaisBase = getStore().alunos
    .filter((a) => a.tenantId === tenantId);
  return {
    items,
    page,
    size,
    total,
    hasNext: start + size < all.length,
    totaisStatus: {
      total: totaisBase.length,
      totalAtivo: totaisBase.filter((a) => a.status === "ATIVO").length,
      totalSuspenso: totaisBase.filter((a) => a.status === "SUSPENSO").length,
      totalInativo: totaisBase.filter((a) => a.status === "INATIVO").length,
      totalCancelado: totaisBase.filter((a) => a.status === "CANCELADO").length,
      ativos: totaisBase.filter((a) => a.status === "ATIVO").length,
      suspensos: totaisBase.filter((a) => a.status === "SUSPENSO").length,
      inativos: totaisBase.filter((a) => a.status === "INATIVO").length,
      cancelados: totaisBase.filter((a) => a.status === "CANCELADO").length,
    },
  };
}

export async function getAluno(id: string): Promise<Aluno | null> {
  if (isRealApiEnabled()) {
    try {
      const aluno = await getAlunoApi({
        tenantId: getCurrentTenantId(),
        id,
      });
      const normalizedAluno = normalizeAlunoPendenteComplementacao(
        aluno,
        getStore().alunos
      );
      setStore((s) => ({
        ...s,
        alunos: [normalizedAluno, ...s.alunos.filter((item) => item.id !== normalizedAluno.id)],
      }));
      return normalizedAluno;
    } catch (error) {
      console.warn("[alunos][api-fallback] Falha ao obter aluno na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  syncAlunosStatus();
  return getStore().alunos.find((a) => a.id === id && a.tenantId === tenantId) ?? null;
}

export async function updateAlunoStatus(
  id: string,
  status: StatusAluno
): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await updateAlunoStatusApi({
        tenantId: getCurrentTenantId(),
        id,
        status,
      });
      setStore((s) => ({
        ...s,
        alunos: s.alunos.map((a) => (a.id === id ? { ...a, status } : a)),
      }));
      return;
    } catch (error) {
      console.warn("[alunos][api-fallback] Falha ao atualizar status do aluno na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    alunos: s.alunos.map((a) => (a.id === id ? { ...a, status } : a)),
  }));
}

export async function updateAluno(
  id: string,
  data: Partial<Omit<Aluno, "id" | "tenantId" | "dataCadastro">>
): Promise<Aluno | null> {
  function resolvePendenteComplementacao(
    current: Aluno,
    patch: Partial<Omit<Aluno, "id" | "tenantId" | "dataCadastro">>
  ): boolean {
    if (typeof patch.pendenteComplementacao === "boolean") {
      return patch.pendenteComplementacao;
    }
    const hasCoreData = Boolean(
      (patch.nome ?? current.nome ?? "").trim() &&
      (patch.telefone ?? current.telefone ?? "").trim() &&
      (patch.cpf ?? current.cpf ?? "").trim()
    );
    if (current.pendenteComplementacao === false || current.pendenteComplementacao == null) {
      return false;
    }
    return !hasCoreData;
  }

  if (isRealApiEnabled()) {
    try {
      const updated = await updateAlunoApi({
        tenantId: getCurrentTenantId(),
        id,
        data,
      });
      setStore((s) => ({
        ...s,
        alunos: s.alunos.map((a) => {
          if (a.id !== id) return a;
          return {
            ...a,
            ...updated,
            pendenteComplementacao: resolvePendenteComplementacao(a, data),
            dataAtualizacao: now(),
          };
        }),
      }));
      return {
        ...updated,
        pendenteComplementacao: resolvePendenteComplementacao(
          {
            ...(getStore().alunos.find((a) => a.id === id) ?? {
              id,
              tenantId: getCurrentTenantId(),
              nome: "",
              email: "",
              telefone: "",
              cpf: "",
              dataNascimento: "",
              sexo: "M" as Sexo,
              status: "ATIVO",
              dataCadastro: now(),
            }),
            ...updated,
          } as Aluno,
          data
        ),
      };
    } catch (error) {
      console.warn("[alunos][api-fallback] Falha ao atualizar aluno na API real. Aplicando update local.", error);
    }
  }
  let updated: Aluno | null = null;
  setStore((s) => ({
    ...s,
    alunos: s.alunos.map((a) => {
      if (a.id !== id) return a;
      updated = {
        ...a,
        ...data,
        pendenteComplementacao: resolvePendenteComplementacao(a, data),
        dataAtualizacao: now(),
      };
      return updated;
    }),
  }));
  syncAlunosStatus();
  return updated;
}

// ─── SERVIÇOS ─────────────────────────────────────────────────────────────

export async function listServicos(params?: {
  apenasAtivos?: boolean;
}): Promise<Servico[]> {
  if (isRealApiEnabled()) {
    try {
      const servicos = await listServicosApi(params?.apenasAtivos);
      setStore((s) => ({
        ...s,
        servicos: [...servicos, ...s.servicos.filter((item) => !servicos.some((sv) => sv.id === item.id))],
      }));
      return servicos;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao listar serviços na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  const { servicos } = getStore();
  const all = [...servicos].reverse().filter((s) => s.tenantId === tenantId);
  if (params?.apenasAtivos) return all.filter((s) => s.ativo);
  return all;
}

export async function createServico(
  data: Omit<Servico, "id" | "tenantId" | "ativo">
): Promise<Servico> {
  if (isRealApiEnabled()) {
    try {
      const created = await createServicoApi(data);
      setStore((s) => ({ ...s, servicos: [created, ...s.servicos.filter((item) => item.id !== created.id)] }));
      return created;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao criar serviço na API real. Aplicando criação local.", error);
    }
  }
  const servico: Servico = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, servicos: [servico, ...s.servicos] }));
  return servico;
}

export async function updateServico(
  id: string,
  data: Partial<Omit<Servico, "id" | "tenantId">>
): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await updateServicoApi(id, data);
      setStore((s) => ({
        ...s,
        servicos: s.servicos.map((sv) => (sv.id === id ? { ...sv, ...data } : sv)),
      }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao atualizar serviço na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    servicos: s.servicos.map((sv) =>
      sv.id === id ? { ...sv, ...data } : sv
    ),
  }));
}

export async function toggleServico(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await toggleServicoApi(id);
      setStore((s) => ({
        ...s,
        servicos: s.servicos.map((sv) =>
          sv.id === id ? { ...sv, ativo: !sv.ativo } : sv
        ),
      }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao alternar serviço na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    servicos: s.servicos.map((sv) =>
      sv.id === id ? { ...sv, ativo: !sv.ativo } : sv
    ),
  }));
}

export async function deleteServico(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await deleteServicoApi(id);
      setStore((s) => ({ ...s, servicos: s.servicos.filter((sv) => sv.id !== id) }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao remover serviço na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    servicos: s.servicos.filter((sv) => sv.id !== id),
  }));
}

// ─── PRODUTOS ──────────────────────────────────────────────────────────────

export async function listProdutos(params?: {
  apenasAtivos?: boolean;
}): Promise<Produto[]> {
  if (isRealApiEnabled()) {
    try {
      const produtos = await listProdutosApi(params?.apenasAtivos);
      setStore((s) => ({
        ...s,
        produtos: [...produtos, ...s.produtos.filter((item) => !produtos.some((p) => p.id === item.id))],
      }));
      return produtos;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao listar produtos na API real. Usando store local.", error);
    }
  }
  const groupTenantIds = getCurrentGroupTenantIds();
  const { produtos } = getStore();
  const all = [...produtos].reverse().filter((p) => groupTenantIds.includes(p.tenantId));
  if (params?.apenasAtivos) return all.filter((p) => p.ativo);
  return all;
}

export async function createProduto(
  data: Omit<Produto, "id" | "tenantId" | "ativo">
): Promise<Produto> {
  if (isRealApiEnabled()) {
    try {
      const created = await createProdutoApi(data);
      setStore((s) => ({ ...s, produtos: [created, ...s.produtos.filter((item) => item.id !== created.id)] }));
      return created;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao criar produto na API real. Aplicando criação local.", error);
    }
  }
  const produto: Produto = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, produtos: [produto, ...s.produtos] }));
  return produto;
}

export async function updateProduto(
  id: string,
  data: Partial<Omit<Produto, "id" | "tenantId">>
): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await updateProdutoApi(id, data);
      setStore((s) => ({
        ...s,
        produtos: s.produtos.map((p) =>
          p.id === id ? { ...p, ...data } : p
        ),
      }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao atualizar produto na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    produtos: s.produtos.map((p) =>
      p.id === id ? { ...p, ...data } : p
    ),
  }));
}

export async function toggleProduto(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await toggleProdutoApi(id);
      setStore((s) => ({
        ...s,
        produtos: s.produtos.map((p) =>
          p.id === id ? { ...p, ativo: !p.ativo } : p
        ),
      }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao alternar produto na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    produtos: s.produtos.map((p) =>
      p.id === id ? { ...p, ativo: !p.ativo } : p
    ),
  }));
}

export async function deleteProduto(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await deleteProdutoApi(id);
      setStore((s) => ({ ...s, produtos: s.produtos.filter((p) => p.id !== id) }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao remover produto na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    produtos: s.produtos.filter((p) => p.id !== id),
  }));
}

// ─── VENDAS ────────────────────────────────────────────────────────────────

export interface CreateVendaInput {
  tipo: TipoVenda;
  clienteId?: string;
  itens: Array<{
    tipo: TipoVenda;
    referenciaId: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    desconto?: number;
  }>;
  descontoTotal?: number;
  acrescimoTotal?: number;
  pagamento: PagamentoVenda;
}

export interface ListVendasPageInput {
  dataInicio?: string;
  dataFim?: string;
  tipoVenda?: TipoVenda;
  categoriaItem?: TipoVenda;
  formaPagamento?: TipoFormaPagamento;
  page?: number;
  size?: number;
  includeTotals?: boolean;
}

export interface PaginatedVendasResult extends PaginatedResult<Venda> {
  totalGeral?: number;
  totaisPorFormaPagamento?: Partial<Record<TipoFormaPagamento, number>>;
}

const LISTA_VENDAS_PAGE_CACHE_TTL_MS = 8_000;
const listVendasPageCache = new Map<string, { at: number; data: PaginatedVendasResult }>();
const listVendasPageInFlight = new Map<string, Promise<PaginatedVendasResult>>();
const FORMAS_PAGAMENTO: TipoFormaPagamento[] = [
  "DINHEIRO",
  "PIX",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "BOLETO",
  "RECORRENTE",
];

function buildListVendasPageCacheKey(input: {
  tenantId: string;
  page: number;
  size: number;
  dataInicio?: string;
  dataFim?: string;
  tipoVenda?: TipoVenda;
  categoriaItem?: TipoVenda;
  formaPagamento?: TipoFormaPagamento;
  includeTotals?: boolean;
}): string {
  return JSON.stringify(input);
}

function clonePaginatedVendasResult(value: PaginatedVendasResult): PaginatedVendasResult {
  return {
    ...value,
    items: [...value.items],
    totaisPorFormaPagamento: value.totaisPorFormaPagamento
      ? { ...value.totaisPorFormaPagamento }
      : undefined,
  };
}

function normalizeFormaPagamento(value: unknown): TipoFormaPagamento | null {
  return typeof value === "string" && FORMAS_PAGAMENTO.includes(value as TipoFormaPagamento)
    ? (value as TipoFormaPagamento)
    : null;
}

function getVendaFormaPagamento(venda: Venda): TipoFormaPagamento | null {
  return normalizeFormaPagamento((venda as { pagamento?: { formaPagamento?: unknown } }).pagamento?.formaPagamento);
}

export async function listVendas(): Promise<Venda[]> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const response = await listVendasApi({
        tenantId,
        page: 0,
        size: 200,
      });
      const synced = Array.isArray(response) ? response : response.items;
      const sorted = [...synced].sort((a, b) => {
        if (a.dataCriacao === b.dataCriacao) return 0;
        return a.dataCriacao > b.dataCriacao ? -1 : 1;
      });
      setStore((s) => ({
        ...s,
        vendas: [...sorted, ...s.vendas.filter((v) => v.tenantId !== tenantId)],
      }));
      return sorted;
    } catch (error) {
      console.warn("[vendas][api-fallback] Falha ao listar vendas na API real. Usando store local.", error);
    }
  }
  return [...getStore().vendas]
    .filter((v) => v.tenantId === tenantId)
    .sort((a, b) => {
      if (a.dataCriacao === b.dataCriacao) return 0;
      return a.dataCriacao > b.dataCriacao ? -1 : 1;
    });
}

export async function listVendasPage(input: ListVendasPageInput): Promise<PaginatedVendasResult> {
  const tenantId = getCurrentTenantId();
  const page = Math.max(1, input.page ?? 1);
  const size = Math.min(200, Math.max(1, input.size ?? 20));
  const dataInicio = input.dataInicio;
  const dataFim = input.dataFim;
  const tipoVenda = input.tipoVenda;
  const categoriaItem = input.categoriaItem;
  const formaPagamento = input.formaPagamento;
  const includeTotals = input.includeTotals ?? false;

  const cacheKey = buildListVendasPageCacheKey({
    tenantId,
    page,
    size,
    dataInicio,
    dataFim,
    tipoVenda,
    categoriaItem,
    formaPagamento,
    includeTotals,
  });

  const cached = listVendasPageCache.get(cacheKey);
  if (cached && Date.now() - cached.at < LISTA_VENDAS_PAGE_CACHE_TTL_MS) {
    return clonePaginatedVendasResult(cached.data);
  }

  const inFlight = listVendasPageInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    const requestParams = {
      tenantId,
      page: page - 1,
      size,
      dataInicio,
      dataFim,
      tipoVenda,
      categoriaItem,
      formaPagamento,
    };

    const mapArrayResponse = (responseItems: Venda[]): PaginatedVendasResult => {
      const synced = [...responseItems].sort((a, b) => {
        if (a.dataCriacao === b.dataCriacao) return 0;
        return a.dataCriacao > b.dataCriacao ? -1 : 1;
      });
      setStore((s) => ({
        ...s,
        vendas: [...synced, ...s.vendas.filter((v) => v.tenantId !== tenantId)],
      }));
      const result = {
        items: synced,
        page,
        size,
        total: synced.length,
        hasNext: synced.length >= size,
      };
      listVendasPageCache.set(cacheKey, { at: Date.now(), data: clonePaginatedVendasResult(result) });
      return result;
    };

    const mapEnvelopeResponse = (envelopeResponse: ListVendasApiEnvelopeResult): PaginatedVendasResult => {
      const synced = [...envelopeResponse.items].sort((a, b) => {
        if (a.dataCriacao === b.dataCriacao) return 0;
        return a.dataCriacao > b.dataCriacao ? -1 : 1;
      });
      setStore((s) => ({
        ...s,
        vendas: [...synced, ...s.vendas.filter((v) => v.tenantId !== tenantId)],
      }));
      const result = {
        items: synced,
        page: Number(envelopeResponse.page) + 1,
        size: Number(envelopeResponse.size),
        total: envelopeResponse.total,
        hasNext: envelopeResponse.hasNext,
        totalGeral: envelopeResponse.totalGeral,
        totaisPorFormaPagamento: envelopeResponse.totaisPorFormaPagamento,
      };
      listVendasPageCache.set(cacheKey, { at: Date.now(), data: clonePaginatedVendasResult(result) });
      return result;
    };

    if (isRealApiEnabled()) {
      try {
        const response = await listVendasApi({ ...requestParams, envelope: includeTotals });
        if (Array.isArray(response)) {
          return mapArrayResponse(response);
        }

        const responseWithFallback: ListVendasApiEnvelopeResult =
          (response as ListVendasApiEnvelopeResult);
        return mapEnvelopeResponse(responseWithFallback);
      } catch (error) {
        console.warn(
          "[vendas][api-fallback] Falha ao listar vendas paginadas na API real. Usando store local.",
          error
        );
        if (includeTotals) {
          try {
            const fallbackResponse = await listVendasApi({
              ...requestParams,
              formaPagamento: undefined,
              envelope: false,
            });
            const fallbackItems = Array.isArray(fallbackResponse)
              ? fallbackResponse
              : fallbackResponse.items;
            const synced = [...fallbackItems].sort((a, b) => {
              if (a.dataCriacao === b.dataCriacao) return 0;
              return a.dataCriacao > b.dataCriacao ? -1 : 1;
            });
            const fallbackFiltered = formaPagamento
              ? synced.filter((venda) => getVendaFormaPagamento(venda) === formaPagamento)
              : synced;
            setStore((s) => ({
              ...s,
              vendas: [...synced, ...s.vendas.filter((v) => v.tenantId !== tenantId)],
            }));
            const totalsByForma: Partial<Record<TipoFormaPagamento, number>> = {};
            for (const venda of fallbackFiltered) {
              const forma = getVendaFormaPagamento(venda);
              if (!forma) continue;
              totalsByForma[forma] = (totalsByForma[forma] ?? 0) + venda.total;
            }
            const startFallback = (page - 1) * size;
            const items = fallbackFiltered.slice(startFallback, startFallback + size);
            const fallbackResult = {
              items,
              page,
              size,
              total: fallbackFiltered.length,
              hasNext: startFallback + size < fallbackFiltered.length,
              totalGeral: fallbackFiltered.reduce((sum, venda) => sum + venda.total, 0),
              totaisPorFormaPagamento: totalsByForma,
            };
            listVendasPageCache.set(cacheKey, {
              at: Date.now(),
              data: clonePaginatedVendasResult(fallbackResult),
            });
            return fallbackResult;
          } catch {
            // mantém fallback local abaixo
          }
        }
      }
    }

    let filteredBase = [...getStore().vendas]
      .filter((v) => v.tenantId === tenantId)
      .sort((a, b) => {
        if (a.dataCriacao === b.dataCriacao) return 0;
        return a.dataCriacao > b.dataCriacao ? -1 : 1;
      });

    if (tipoVenda) {
      filteredBase = filteredBase.filter((venda) => venda.tipo === tipoVenda);
    }

    if (formaPagamento) {
      filteredBase = filteredBase.filter((venda) => getVendaFormaPagamento(venda) === formaPagamento);
    }

    if (categoriaItem) {
      filteredBase = filteredBase.filter((venda) => venda.itens.some((item) => item.tipo === categoriaItem));
    }

    const startFilter = dataInicio && dataFim
      ? (dataInicio <= dataFim ? dataInicio : dataFim)
      : dataInicio ?? dataFim;
    const endFilter = dataInicio && dataFim
      ? (dataInicio <= dataFim ? dataFim : dataInicio)
      : dataFim ?? dataInicio;

    const filtered = filteredBase.filter((venda) => {
      const vendaDate = venda.dataCriacao.slice(0, 10);
      const inDateRange = startFilter && endFilter
        ? vendaDate >= startFilter && vendaDate <= endFilter
        : true;
      return inDateRange;
    });

    const start = (page - 1) * size;
    const items = filtered.slice(start, start + size);
    const totalsByForma: Partial<Record<TipoFormaPagamento, number>> = {};
    if (includeTotals) {
      for (const venda of filtered) {
        const forma = getVendaFormaPagamento(venda);
        if (!forma) continue;
        totalsByForma[forma] = (totalsByForma[forma] ?? 0) + venda.total;
      }
    }

    const result = {
      items,
      page,
      size,
      total: filtered.length,
      hasNext: start + size < filtered.length,
      totalGeral: includeTotals ? filtered.reduce((sum, venda) => sum + venda.total, 0) : undefined,
      totaisPorFormaPagamento: includeTotals ? totalsByForma : undefined,
    };
    listVendasPageCache.set(cacheKey, { at: Date.now(), data: clonePaginatedVendasResult(result) });
    return result;
  })();

  listVendasPageInFlight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    listVendasPageInFlight.delete(cacheKey);
  }
}

export async function createVenda(input: CreateVendaInput): Promise<Venda> {
  const requiresCliente = input.itens.some((item) => item.tipo === "PLANO" || item.tipo === "SERVICO");
  if (requiresCliente && !input.clienteId) {
    throw new Error("Cliente é obrigatório para venda de plano/serviço.");
  }

  const store = getStore();
  const cliente = input.clienteId ? store.alunos.find((a) => a.id === input.clienteId) : undefined;

  if (isRealApiEnabled()) {
    try {
      const tenantId = getCurrentTenantId();
      const created = await createVendaApi({
        tenantId,
        data: {
          tipo: input.tipo,
          clienteId: input.clienteId,
          itens: input.itens.map((item) => ({
            tipo: item.tipo,
            referenciaId: item.referenciaId,
            descricao: item.descricao,
            quantidade: Math.max(1, item.quantidade || 1),
            valorUnitario: Math.max(0, item.valorUnitario || 0),
            desconto: Math.max(0, item.desconto || 0),
          })),
          descontoTotal: Math.max(0, input.descontoTotal ?? 0),
          acrescimoTotal: Math.max(0, input.acrescimoTotal ?? 0),
          pagamento: {
            formaPagamento: input.pagamento.formaPagamento,
            parcelas: input.pagamento.parcelas,
            valorPago: Math.max(0, input.pagamento.valorPago || 0),
            observacoes: input.pagamento.observacoes,
          },
        },
      });
      setStore((s) => ({
        ...s,
        vendas: [created, ...s.vendas.filter((venda) => venda.id !== created.id)],
      }));
      return created;
    } catch (error) {
      console.warn("[vendas][api-fallback] Falha ao criar venda na API real. Gravando localmente.", error);
    }
  }

  const itens: VendaItem[] = input.itens.map((item) => {
    const qtd = Math.max(1, item.quantidade || 1);
    const unit = Math.max(0, item.valorUnitario || 0);
    const desconto = Math.max(0, item.desconto || 0);
    const valorTotal = Math.max(0, unit * qtd - desconto);
    return {
      id: genId(),
      tipo: item.tipo,
      referenciaId: item.referenciaId,
      descricao: item.descricao,
      quantidade: qtd,
      valorUnitario: unit,
      desconto,
      valorTotal,
    };
  });

  const subtotal = itens.reduce((sum, i) => sum + i.valorUnitario * i.quantidade, 0);
  const descontoItens = itens.reduce((sum, i) => sum + i.desconto, 0);
  const descontoTotal = Math.max(0, (input.descontoTotal ?? 0) + descontoItens);
  const acrescimoTotal = Math.max(0, input.acrescimoTotal ?? 0);
  const total = Math.max(0, subtotal - descontoTotal + acrescimoTotal);

  const venda: Venda = {
    id: genId(),
    tenantId: getCurrentTenantId(),
    tipo: input.tipo,
    clienteId: input.clienteId,
    clienteNome: cliente?.nome,
    status: "FECHADA",
    itens,
    subtotal,
    descontoTotal,
    acrescimoTotal,
    total,
    pagamento: input.pagamento,
    dataCriacao: now(),
  };

  const pagamentoTipo = itens.some((item) => item.tipo === "PLANO")
    ? "MENSALIDADE"
    : itens.some((item) => item.tipo === "SERVICO")
      ? "AVULSO"
      : "PRODUTO";
  const descricaoPagamento = itens.length === 1
    ? `Venda ${input.tipo.toLowerCase()} · ${itens[0].descricao}`
    : `Venda mista · ${itens.length} itens`;

  setStore((s) => ({
    ...s,
    vendas: [venda, ...s.vendas],
    pagamentos: input.clienteId
      ? [
          {
            id: genId(),
            tenantId: getCurrentTenantId(),
            alunoId: input.clienteId,
            tipo: pagamentoTipo,
            descricao: descricaoPagamento,
            valor: total,
            desconto: descontoTotal,
            valorFinal: total,
            dataVencimento: now().slice(0, 10),
            dataPagamento: now().slice(0, 10),
            formaPagamento: input.pagamento.formaPagamento,
            status: "PAGO",
            observacoes: input.pagamento.observacoes,
            dataCriacao: now(),
          },
          ...s.pagamentos,
        ]
      : s.pagamentos,
  }));

  return venda;
}

// ─── BANDEIRAS DE CARTÃO ───────────────────────────────────────────────────

export async function listBandeirasCartao(params?: {
  apenasAtivas?: boolean;
}): Promise<BandeiraCartao[]> {
  const { bandeirasCartao } = getStore();
  const all = [...bandeirasCartao].reverse();
  if (params?.apenasAtivas) return all.filter((b) => b.ativo);
  return all;
}

export async function createBandeiraCartao(
  data: Omit<BandeiraCartao, "id" | "ativo">
): Promise<BandeiraCartao> {
  const bandeira: BandeiraCartao = {
    ...data,
    id: genId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, bandeirasCartao: [bandeira, ...s.bandeirasCartao] }));
  return bandeira;
}

export async function updateBandeiraCartao(
  id: string,
  data: Partial<Omit<BandeiraCartao, "id">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    bandeirasCartao: s.bandeirasCartao.map((b) =>
      b.id === id ? { ...b, ...data } : b
    ),
  }));
}

export async function toggleBandeiraCartao(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    bandeirasCartao: s.bandeirasCartao.map((b) =>
      b.id === id ? { ...b, ativo: !b.ativo } : b
    ),
  }));
}

export async function deleteBandeiraCartao(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    bandeirasCartao: s.bandeirasCartao.filter((b) => b.id !== id),
  }));
}

// ─── CARTÕES DO CLIENTE ────────────────────────────────────────────────────

export async function listCartoesCliente(alunoId: string): Promise<CartaoCliente[]> {
  return getStore().cartoesCliente.filter((c) => c.alunoId === alunoId);
}

export async function createCartaoCliente(
  data: Omit<CartaoCliente, "id" | "ativo">
): Promise<CartaoCliente> {
  const cartao: CartaoCliente = {
    ...data,
    id: genId(),
    ativo: true,
  };
  setStore((s) => {
    const jaTemPadrao = s.cartoesCliente.some((c) => c.alunoId === data.alunoId && c.padrao);
    const novo = jaTemPadrao ? cartao : { ...cartao, padrao: true };
    return {
      ...s,
      cartoesCliente: [
        novo,
        ...s.cartoesCliente.map((c) =>
          !jaTemPadrao && c.alunoId === data.alunoId ? { ...c, padrao: false } : c
        ),
      ],
    };
  });
  return cartao;
}

export async function setCartaoPadrao(id: string): Promise<void> {
  setStore((s) => {
    const alvo = s.cartoesCliente.find((c) => c.id === id);
    if (!alvo) return s;
    return {
      ...s,
      cartoesCliente: s.cartoesCliente.map((c) =>
        c.alunoId === alvo.alunoId ? { ...c, padrao: c.id === id } : c
      ),
    };
  });
}

export async function deleteCartaoCliente(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    cartoesCliente: s.cartoesCliente.filter((c) => c.id !== id),
  }));
}

// ─── ATIVIDADES ─────────────────────────────────────────────────────────────

export async function listAtividades(params?: {
  apenasAtivas?: boolean;
  categoria?: CategoriaAtividade;
}): Promise<Atividade[]> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      const atividades = await listAtividadesApi({
        tenantId,
        apenasAtivas: params?.apenasAtivas,
        categoria: params?.categoria,
      });
      const mergedAtividades = atividades.map((atividade) =>
        mergeAtividadeFromApi(
          atividade,
          getStore().atividades.find((item) => item.id === atividade.id)
        )
      );
      setStore((s) => ({
        ...s,
        atividades: [
          ...mergedAtividades,
          ...s.atividades.filter((item) => !mergedAtividades.some((a) => a.id === item.id)),
        ],
      }));
      return mergedAtividades;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao listar atividades na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  const { atividades } = getStore();
  let all = [...atividades]
    .map(normalizeAtividadeItem)
    .filter((atividade): atividade is Atividade => Boolean(atividade))
    .filter((a) => a.tenantId === tenantId);
  if (params?.apenasAtivas) all = all.filter((a) => a.ativo);
  if (params?.categoria) all = all.filter((a) => a.categoria === params.categoria);
  return all;
}

export async function createAtividade(
  data: Omit<Atividade, "id" | "tenantId" | "ativo">
): Promise<Atividade> {
  const normalized = normalizeAtividadeCheckinRules(data);
  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      const created = await createAtividadeApi({
        tenantId,
        data: normalized,
      });
      const merged = mergeAtividadeFromApi(created, {
        ...normalized,
        id: created.id,
        tenantId,
        ativo: created.ativo,
      });
      setStore((s) => ({
        ...s,
        atividades: [merged, ...s.atividades.filter((item) => item.id !== merged.id)],
      }));
      return merged;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao criar atividade na API real. Aplicando criação local.", error);
    }
  }
  const atividade: Atividade = {
    ...normalized,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, atividades: [atividade, ...s.atividades] }));
  return atividade;
}

export async function updateAtividade(
  id: string,
  data: Partial<Omit<Atividade, "id" | "tenantId">>
): Promise<void> {
  const current = getStore().atividades.find((a) => a.id === id);
  if (!current) return;
  const normalized = normalizeAtividadeCheckinRules({ ...current, ...data });
  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      const updated = await updateAtividadeApi({
        tenantId,
        id,
        data: normalized,
      });
      const merged = mergeAtividadeFromApi(updated, normalized);
      setStore((s) => ({
        ...s,
        atividades: s.atividades.map((a) => (a.id === id ? merged : a)),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao atualizar atividade na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    atividades: s.atividades.map((a) =>
      a.id === id ? { ...a, ...normalized } : a
    ),
  }));
}

export async function toggleAtividade(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      const current = getStore().atividades.find((a) => a.id === id);
      const toggled = await toggleAtividadeApi({ tenantId, id });
      const merged = mergeAtividadeFromApi(toggled, current);
      setStore((s) => ({
        ...s,
        atividades: s.atividades.map((a) => (a.id === id ? merged : a)),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao alternar atividade na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    atividades: s.atividades.map((a) =>
      a.id === id ? { ...a, ativo: !a.ativo } : a
    ),
  }));
}

export async function deleteAtividade(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      await deleteAtividadeApi({ tenantId, id });
      setStore((s) => ({
        ...s,
        atividades: s.atividades.filter((a) => a.id !== id),
        atividadeGrades: s.atividadeGrades.filter((g) => g.atividadeId !== id),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao remover atividade na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    atividades: s.atividades.filter((a) => a.id !== id),
    atividadeGrades: s.atividadeGrades.filter((g) => g.atividadeId !== id),
  }));
}

function normalizeAtividadeCheckinRules<T extends {
  permiteCheckin: boolean;
  checkinObrigatorio: boolean;
}>(atividade: T): T {
  if (!atividade.permiteCheckin) {
    return {
      ...atividade,
      checkinObrigatorio: false,
    };
  }
  return atividade;
}

function mergeAtividadeFromApi(next: Atividade, current?: Atividade): Atividade {
  const merged = {
    ...(current ?? {}),
    ...next,
    permiteCheckin: current?.permiteCheckin ?? next.permiteCheckin,
    checkinObrigatorio: current?.checkinObrigatorio ?? next.checkinObrigatorio,
  };

  return normalizeAtividadeCheckinRules(merged);
}

// ─── ATIVIDADES · GRADE ───────────────────────────────────────────────────

export async function listAtividadeGrades(params?: {
  atividadeId?: string;
  apenasAtivas?: boolean;
}): Promise<AtividadeGrade[]> {
  if (isRealApiEnabled()) {
    try {
      const gradesResponse = (await listAtividadeGradesApi(params)) as unknown;
      const grades = normalizeEntityList<AtividadeGrade>(gradesResponse);
      setStore((s) => ({
        ...s,
        atividadeGrades: [
          ...grades,
          ...s.atividadeGrades.filter((item) => !grades.some((g) => g.id === item.id)),
        ],
      }));
      return grades;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao listar grade de atividades na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  const { atividadeGrades } = getStore();
  let all = [...atividadeGrades].reverse().filter((g) => g.tenantId === tenantId);
  if (params?.atividadeId) all = all.filter((g) => g.atividadeId === params.atividadeId);
  if (params?.apenasAtivas) all = all.filter((g) => g.ativo);
  return all;
}

// BOT PROMPT (API)

export async function getBotPrompt(): Promise<BotPromptResponse> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = await getTenantIdForApiCall();
      const response = await getBotPromptApi({ tenantId });
      return {
        prompt: response?.prompt ?? "",
        generatedAt: response?.generatedAt,
      };
    } catch (error) {
      console.warn("[bot-prompt] Falha ao obter prompt na API real. Usando fallback.", error);
    }
  }
  return {
    prompt: "Integração de IA indisponível em modo simulado (API desativada).",
    generatedAt: now(),
  };
}

export async function getBotPromptTemplate(): Promise<string> {
  if (isRealApiEnabled()) {
    try {
      return await getBotPromptTemplateApi();
    } catch (error) {
      console.warn("[bot-prompt] Falha ao obter template na API real. Usando fallback.", error);
    }
  }
  return "Template não disponível em modo simulado.";
}

// ─── TREINOS ────────────────────────────────────────────────────────────────

type ListTreinosParams = {
  apenasAtivas?: boolean;
  clienteId?: string;
  alunoId?: string;
  funcionarioId?: string;
  search?: string;
  page?: number;
  size?: number;
  apenasVencendoAteDias?: number;
};

function applyTreinoFilters(items: Treino[], params?: ListTreinosParams): Treino[] {
  const search = cleanString(params?.search)?.toLowerCase();
  const targetClienteId = cleanString(params?.clienteId) || cleanString(params?.alunoId);
  return items
    .filter((t) => (params?.apenasAtivas ? t.ativo : true))
    .filter((t) => (!targetClienteId ? true : t.alunoId === targetClienteId))
    .filter((t) => (params?.funcionarioId ? t.funcionarioId === params.funcionarioId : true))
    .filter((t) => {
      if (!search) return true;
      const source = [t.alunoNome, t.atividadeNome, t.funcionarioNome, t.observacoes]
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.toLowerCase());
      return source.some((value) => value.includes(search));
    })
    .filter((t) => {
      if (!Number.isFinite(params?.apenasVencendoAteDias ?? NaN)) return true;
      if (params?.apenasVencendoAteDias == null) return true;
      const maxDias = Number(params.apenasVencendoAteDias);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataRef = t.vencimento ?? t.dataFim ?? t.dataInicio ?? today();
      const venc = new Date(`${dataRef}T00:00:00`);
      if (Number.isNaN(venc.getTime())) return false;
      const dias = Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return dias >= 0 && dias <= maxDias;
    })
    .sort((a, b) => {
      const aDate = new Date(`${(a.vencimento ?? a.dataFim ?? a.dataInicio ?? today())}T00:00:00`).getTime();
      const bDate = new Date(`${(b.vencimento ?? b.dataFim ?? b.dataInicio ?? today())}T00:00:00`).getTime();
      return aDate - bDate;
    });
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function extractAtividadeNomeFromObjetivo(value: string | null | undefined): string | undefined {
  const objetivo = cleanString(value);
  if (!objetivo) return undefined;
  return objetivo.replace(/^atividade:\s*/i, "").trim() || undefined;
}

function mapExercicioApiToExercicio(input: ExercicioApiResponse): Exercicio {
  return {
    id: input.id,
    tenantId: input.tenantId,
    nome: input.nome,
    grupoMuscular: cleanString(input.grupoMuscular),
    equipamento: cleanString(input.aparelho) ?? cleanString(input.unidade),
    descricao: cleanString(input.descricao),
    ativo: input.ativo !== false,
    criadoEm: cleanString(input.createdAt),
    atualizadoEm: cleanString(input.updatedAt),
  };
}

function mapTreinoApiToTreino(
  input: TreinoApiResponse,
  lookup?: {
    alunoNomeById: Map<string, string>;
    funcionarioNomeById: Map<string, string>;
    fallbackAlunoNome?: string;
    fallbackAtividadeNome?: string;
    fallbackFuncionarioNome?: string;
  }
): Treino {
  const alunoId = cleanString(input.alunoId) ?? cleanString(input.clienteId) ?? "";
  const alunoNomeFromApi = cleanString(input.alunoNome) ?? cleanString(input.clienteNome);
  const funcionarioId = cleanString(input.professorId);
  const atividadeNomeFromApi = cleanString(input.atividadeNome);
  const atividadeNome =
    atividadeNomeFromApi ||
    (cleanString(lookup?.fallbackAtividadeNome) ??
    extractAtividadeNomeFromObjetivo(input.objetivo) ??
    cleanString(input.nome));
  const atividadeId = cleanString(input.atividadeId);
  const itens =
    Array.isArray(input.itens) && input.itens
      ? input.itens.map((item) => ({
          id: cleanString(item.id) ?? genId(),
          treinoId: cleanString(item.treinoId) ?? input.id,
          exercicioId: cleanString(item.exercicioId) ?? "",
          exercicioNome: cleanString(item.exercicioNomeSnapshot),
          ordem: Number(item.ordem ?? 0),
          series: Number(item.series ?? 0),
          repeticoes: item.repeticoes != null ? Number(item.repeticoes) : undefined,
          repeticoesMin: item.repeticoesMin != null ? Number(item.repeticoesMin) : undefined,
          repeticoesMax: item.repeticoesMax != null ? Number(item.repeticoesMax) : undefined,
          carga: item.carga != null ? Number(item.carga) : undefined,
          cargaSugerida: item.cargaSugerida != null ? Number(item.cargaSugerida) : undefined,
          intervaloSegundos: item.intervaloSegundos != null ? Number(item.intervaloSegundos) : undefined,
          tempoExecucaoSegundos: item.tempoExecucaoSegundos != null ? Number(item.tempoExecucaoSegundos) : undefined,
          observacao: cleanString(item.observacao),
          diasSemana: Array.isArray(item.diaDaSemana) ? item.diaDaSemana.filter(Boolean) : undefined,
          criadoEm: cleanString(item.createdAt),
          atualizadoEm: cleanString(item.updatedAt),
        }))
      : undefined;

  return {
    id: input.id,
    tenantId: input.tenantId,
    alunoId,
    atividadeId,
    alunoNome:
      alunoNomeFromApi || (
        (alunoId ? lookup?.alunoNomeById.get(alunoId) : undefined) ??
        cleanString(lookup?.fallbackAlunoNome) ??
        "Cliente não identificado"
      ),
    atividadeNome,
    funcionarioNome:
      cleanString(input.professorNome) ??
      (funcionarioId ? lookup?.funcionarioNomeById.get(funcionarioId) : undefined) ??
      cleanString(lookup?.fallbackFuncionarioNome),
    funcionarioId,
    divisao: cleanString(input.divisao),
    metaSessoesSemana: input.metaSessoesSemana != null ? Number(input.metaSessoesSemana) : undefined,
    dataInicio: cleanString(input.dataInicio),
    dataFim: cleanString(input.dataFim),
    vencimento: cleanString(input.dataFim) ?? cleanString(input.dataInicio) ?? today(),
    observacoes: cleanString(input.observacoes),
    status: cleanString(input.status) as Treino["status"],
    tipoTreino: cleanString(input.tipoTreino) as Treino["tipoTreino"],
    diasParaVencimento:
      typeof input.diasParaVencimento === "number" ? input.diasParaVencimento : undefined,
    statusValidade: cleanString(input.statusValidade) as Treino["statusValidade"],
    ativo: input.ativo !== false,
    criadoEm: cleanString(input.createdAt),
    atualizadoEm: cleanString(input.updatedAt),
    itens,
  };
}

function buildTreinoUpsertPayloadFromForm(
  treino: Treino,
  overrides?: {
    nome?: string;
    objetivo?: string;
    observacoes?: string;
    ativo?: boolean;
    vencimento?: string;
    dataInicio?: string;
    alunoId?: string;
    funcionarioId?: string;
  }
): UpdateTreinoApiInput {
  const nomeBase =
    cleanString(overrides?.nome) ??
    treino.nome ??
    treino.atividadeNome ??
    `Treino de ${treino.alunoNome}`;
  const objetivo = cleanString(overrides?.objetivo) ?? (treino.atividadeNome ? `Atividade: ${treino.atividadeNome}` : undefined);
  return {
    clienteId: cleanString(overrides?.alunoId) ?? cleanString(treino.alunoId) ?? null,
    professorId: cleanString(overrides?.funcionarioId) ?? cleanString(treino.funcionarioId) ?? null,
    nome: nomeBase,
    objetivo,
    observacoes: cleanString(overrides?.observacoes) ?? cleanString(treino.observacoes),
    dataInicio: cleanString(overrides?.dataInicio),
    dataFim: cleanString(overrides?.vencimento) ?? cleanString(treino.vencimento),
    status: (treino.ativo ? "ATIVO" : "ARQUIVADO") as TreinoStatusApi,
    tipoTreino: "CUSTOMIZADO",
    ativo: overrides?.ativo ?? treino.ativo,
    itens: [],
  };
}

function getTreinoLookupMaps(): {
  alunoNomeById: Map<string, string>;
  funcionarioNomeById: Map<string, string>;
} {
  const store = getStore();
  return {
    alunoNomeById: new Map(store.alunos.map((aluno) => [aluno.id, aluno.nome])),
    funcionarioNomeById: new Map(
      store.funcionarios.map((funcionario) => [funcionario.id, funcionario.nome])
    ),
  };
}

export async function listTreinos(params?: ListTreinosParams): Promise<PaginatedResult<Treino>> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = await getTenantIdForApiCall();
      const response = await listTreinosApi({
        tenantId,
        clienteId: cleanString(params?.clienteId) ?? cleanString(params?.alunoId),
        professorId: params?.funcionarioId,
        search: params?.search,
        status: params?.apenasAtivas ? "ATIVO" : undefined,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      });
      const lookup = getTreinoLookupMaps();
      const mapped = response.items.map((item) => mapTreinoApiToTreino(item, lookup));
      const total = response.total ?? mapped.length;

      const cached = Array.from(
        new Map(
          mapped.map((item) => [item.id, item] as const)
        ).values()
      );
      setStore((s) => ({
        ...s,
        treinos: [
          ...cached,
          ...s.treinos.filter((item) => !cached.some((next) => next.id === item.id)),
        ],
      }));

      return {
        items: mapped,
        page: response.page,
        size: response.size,
        total,
        hasNext: Boolean(response.hasNext ?? (response.page * response.size + response.size < total)),
      };
    } catch (error) {
      console.warn("[treinos][api-fallback] Falha ao listar treinos na API real. Usando store local.", error);
    }
  }

  const tenantId = getCurrentTenantId();
  const items = getStore().treinos.filter((t) => t.tenantId === tenantId);
  const page = Math.max(0, params?.page ?? 0);
  const size = Math.max(1, Math.min(200, params?.size ?? 20));
  const filtered = applyTreinoFilters(items, params);
  const start = page * size;
  const pagedItems = filtered.slice(start, start + size);
  return {
    items: pagedItems,
    page,
    size,
    total: filtered.length,
    hasNext: start + size < filtered.length,
  };
}

export async function createTreino(
  data: Omit<Treino, "id" | "tenantId" | "criadoEm" | "atualizadoEm">
): Promise<Treino> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = await getTenantIdForApiCall();
      const atividadeNome = cleanString(data.atividadeNome);
      const createdApi = await createTreinoApi({
        tenantId,
        data: {
          clienteId: cleanString(data.alunoId),
          professorId: cleanString(data.funcionarioId),
          nome: cleanString(data.nome) ?? atividadeNome ?? `Treino de ${data.alunoNome}`,
          objetivo: cleanString(data.objetivo) ?? (atividadeNome ? `Atividade: ${atividadeNome}` : undefined),
          observacoes: cleanString(data.observacoes),
          divisao: cleanString(data.divisao),
          metaSessoesSemana: data.metaSessoesSemana,
          dataInicio: cleanString(data.dataInicio),
          dataFim: cleanString(data.dataFim) ?? cleanString(data.vencimento),
          status: (data.ativo ? "ATIVO" : "ARQUIVADO") as TreinoStatusApi,
          tipoTreino: "CUSTOMIZADO",
          ativo: data.ativo,
          itens: (data.itens ?? []).map((item, index) => ({
            exercicioId: cleanString(item.exercicioId) ?? "",
            ordem: Number(item.ordem ?? index + 1),
            series: Number(item.series ?? 0),
            repeticoes: item.repeticoes != null ? Number(item.repeticoes) : undefined,
            repeticoesMin: item.repeticoesMin != null ? Number(item.repeticoesMin) : undefined,
            repeticoesMax: item.repeticoesMax != null ? Number(item.repeticoesMax) : undefined,
            carga: item.carga != null ? Number(item.carga) : undefined,
            cargaSugerida: item.cargaSugerida != null ? Number(item.cargaSugerida) : undefined,
            intervaloSegundos: item.intervaloSegundos != null ? Number(item.intervaloSegundos) : undefined,
            tempoExecucaoSegundos: item.tempoExecucaoSegundos != null ? Number(item.tempoExecucaoSegundos) : undefined,
            observacao: cleanString(item.observacao),
            diaDaSemana: item.diasSemana,
          })),
        },
      });
      const lookup = getTreinoLookupMaps();
      const treino = mapTreinoApiToTreino(createdApi, {
        ...lookup,
        fallbackAlunoNome: data.alunoNome,
        fallbackAtividadeNome: data.atividadeNome,
        fallbackFuncionarioNome: data.funcionarioNome,
      });
      setStore((s) => ({ ...s, treinos: [treino, ...s.treinos.filter((item) => item.id !== treino.id)] }));
      return treino;
    } catch (error) {
      console.warn("[treinos][api-fallback] Falha ao criar treino na API real. Aplicando criação local.", error);
    }
  }
  const treino: Treino = {
    ...data,
    id: genId(),
    nome: data.nome ?? (data.atividadeNome ? `Treino de ${data.atividadeNome}` : `Treino de ${data.alunoNome}`),
    objetivo: data.objetivo ?? (data.atividadeNome ? `Atividade: ${data.atividadeNome}` : undefined),
    tenantId: getCurrentTenantId(),
    ativo: data.ativo ?? true,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };
  setStore((s) => ({ ...s, treinos: [treino, ...s.treinos] }));
  return treino;
}

export async function getTreino(id: string): Promise<Treino | null> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = await getTenantIdForApiCall();
      const treinoApi = await getTreinoApi({ tenantId, id });
      const lookup = getTreinoLookupMaps();
      const treino = mapTreinoApiToTreino(treinoApi, lookup);
      setStore((s) => ({
        ...s,
        treinos: [treino, ...s.treinos.filter((item) => item.id !== treino.id)],
      }));
      return treino;
    } catch (error) {
      console.warn("[treinos][api-fallback] Falha ao obter treino na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  return getStore().treinos.find((item) => item.id === id && item.tenantId === tenantId) ?? null;
}

export async function updateTreino(
  id: string,
  data: {
    alunoId: string;
    alunoNome: string;
    atividadeId?: string;
    atividadeNome?: string;
    funcionarioId?: string;
    funcionarioNome?: string;
    vencimento: string;
    observacoes?: string;
    ativo: boolean;
  }
): Promise<Treino> {
  const nowTime = new Date().toISOString();

  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      const current = getStore().treinos.find((item) => item.id === id);
      const payload = buildTreinoUpsertPayloadFromForm(
        current ?? {
          id,
          tenantId,
          alunoId: data.alunoId,
          alunoNome: data.alunoNome,
          atividadeNome: data.atividadeNome,
          funcionarioId: data.funcionarioId,
          funcionarioNome: data.funcionarioNome,
          vencimento: data.vencimento,
          observacoes: data.observacoes,
          ativo: data.ativo,
          criadoEm: nowTime,
          atualizadoEm: nowTime,
        },
        {
          nome: data.atividadeNome
            ? `Treino de ${data.atividadeNome}`
            : `Treino de ${data.alunoNome}`,
          objetivo: data.atividadeNome ? `Atividade: ${data.atividadeNome}` : undefined,
          observacoes: data.observacoes,
          ativo: data.ativo,
          vencimento: data.vencimento,
          alunoId: data.alunoId,
          funcionarioId: data.funcionarioId,
        }
      );
      const updatedApi = await updateTreinoApi({
        tenantId,
        id,
        data: payload,
      });
      const treino = mapTreinoApiToTreino(updatedApi, getTreinoLookupMaps());
      setStore((s) => ({
        ...s,
        treinos: s.treinos.map((item) => (item.id === id ? treino : item)),
      }));
      return treino;
    } catch (error) {
      console.warn("[treinos][api-fallback] Falha ao atualizar treino na API real. Aplicando atualização local.", error);
    }
  }

  const current = getTreinoByIdFallback(id);
  const treino: Treino = {
    ...(current ?? {}),
    ...data,
    id,
    tenantId: getCurrentTenantId(),
    atualizadoEm: nowTime,
    criadoEm: current?.criadoEm ?? nowTime,
    nome: data.atividadeNome
      ? `Treino de ${data.atividadeNome}`
      : `Treino de ${data.alunoNome}`,
    objetivo: data.atividadeNome ? `Atividade: ${data.atividadeNome}` : undefined,
  };
  setStore((s) => ({
    ...s,
    treinos: s.treinos.map((item) => (item.id === id ? treino : item)),
  }));
  return treino;
}

function getTreinoByIdFallback(id: string): Treino | null {
  const tenantId = getCurrentTenantId();
  return getStore().treinos.find((item) => item.id === id && item.tenantId === tenantId) ?? null;
}

export async function listExercicios(params?: { apenasAtivos?: boolean }): Promise<Exercicio[]> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = await getTenantIdForApiCall();
      const apiItems = await listExerciciosApi({
        tenantId,
        ativo: params?.apenasAtivos,
        page: 0,
        size: 200,
      });
      const mapped = apiItems
        .map(mapExercicioApiToExercicio)
        .filter((item) => (params?.apenasAtivos ? item.ativo : true))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      setStore((s) => ({
        ...s,
        exercicios: mergeTenantScopedData(s.exercicios, mapped),
      }));
      return mapped;
    } catch (error) {
      console.warn("[treinos][api-fallback] Falha ao listar exercícios na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  return getStore().exercicios
    .filter((item) => item.tenantId === tenantId)
    .filter((item) => (params?.apenasAtivos ? item.ativo : true))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function createExercicio(
  data: Omit<Exercicio, "id" | "tenantId" | "criadoEm" | "atualizadoEm" | "ativo">
): Promise<Exercicio> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = await getTenantIdForApiCall();
      const createdApi = await createExercicioApi({
        tenantId,
        data: {
          nome: data.nome,
          grupoMuscular: cleanString(data.grupoMuscular),
          aparelho: cleanString(data.equipamento),
          descricao: cleanString(data.descricao),
          ativo: true,
        },
      });
      const exercicio = mapExercicioApiToExercicio(createdApi);
      setStore((s) => ({ ...s, exercicios: [exercicio, ...s.exercicios.filter((item) => item.id !== exercicio.id)] }));
      return exercicio;
    } catch (error) {
      console.warn("[treinos][api-fallback] Falha ao criar exercício na API real. Aplicando criação local.", error);
    }
  }
  const exercicio: Exercicio = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };
  setStore((s) => ({ ...s, exercicios: [exercicio, ...s.exercicios] }));
  return exercicio;
}

export async function toggleExercicio(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = await getTenantIdForApiCall();
      const toggled = await toggleExercicioApi({ tenantId, id });
      const mapped = mapExercicioApiToExercicio(toggled);
      setStore((s) => ({
        ...s,
        exercicios: s.exercicios.map((item) =>
          item.id === id ? { ...item, ...mapped } : item
        ),
      }));
      return;
    } catch (error) {
      console.warn("[treinos][api-fallback] Falha ao alternar exercício na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    exercicios: s.exercicios.map((item) =>
      item.id === id ? { ...item, ativo: !item.ativo } : item
    ),
  }));
}

export async function deleteExercicio(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = await getTenantIdForApiCall();
      await deleteExercicioApi({ tenantId, id });
      setStore((s) => ({
        ...s,
        exercicios: s.exercicios.filter((item) => item.id !== id),
      }));
      return;
    } catch (error) {
      console.warn("[treinos][api-fallback] Falha ao remover exercício na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    exercicios: s.exercicios.filter((item) => item.id !== id),
  }));
}

export async function createAtividadeGrade(
  data: Omit<AtividadeGrade, "id" | "tenantId" | "ativo">
): Promise<AtividadeGrade> {
  if (isRealApiEnabled()) {
    try {
      const created = await createAtividadeGradeApi(data);
      setStore((s) => ({ ...s, atividadeGrades: [created, ...s.atividadeGrades.filter((item) => item.id !== created.id)] }));
      return created;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao criar item da grade na API real. Aplicando criação local.", error);
    }
  }
  const grade: AtividadeGrade = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, atividadeGrades: [grade, ...s.atividadeGrades] }));
  return grade;
}

export async function updateAtividadeGrade(
  id: string,
  data: Partial<Omit<AtividadeGrade, "id" | "tenantId">>
): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const updated = await updateAtividadeGradeApi(id, data);
      setStore((s) => ({
        ...s,
        atividadeGrades: s.atividadeGrades.map((g) =>
          g.id === id ? { ...g, ...updated } : g
        ),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao atualizar item da grade na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    atividadeGrades: s.atividadeGrades.map((g) =>
      g.id === id ? { ...g, ...data } : g
    ),
  }));
}

export async function toggleAtividadeGrade(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      const toggled = await toggleAtividadeGradeApi(id);
      setStore((s) => ({
        ...s,
        atividadeGrades: s.atividadeGrades.map((g) =>
          g.id === id ? { ...g, ...toggled } : g
        ),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao alternar item da grade na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    atividadeGrades: s.atividadeGrades.map((g) =>
      g.id === id ? { ...g, ativo: !g.ativo } : g
    ),
  }));
}

export async function deleteAtividadeGrade(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await deleteAtividadeGradeApi(id);
      setStore((s) => ({
        ...s,
        atividadeGrades: s.atividadeGrades.filter((g) => g.id !== id),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao remover item da grade na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    atividadeGrades: s.atividadeGrades.filter((g) => g.id !== id),
  }));
}

// ─── PLANOS ─────────────────────────────────────────────────────────────────

function mergePlanoFromApi(next: Plano, current?: Plano): Plano {
  if (!current) {
    return sanitizePlanoRules(next);
  }

  return sanitizePlanoRules({
    ...current,
    ...next,
    cobraAnuidade: current.cobraAnuidade,
    valorAnuidade: current.valorAnuidade,
    parcelasMaxAnuidade: current.parcelasMaxAnuidade,
    permiteRenovacaoAutomatica: current.permiteRenovacaoAutomatica,
    permiteCobrancaRecorrente: current.permiteCobrancaRecorrente,
    diaCobrancaPadrao: current.diaCobrancaPadrao,
    contratoTemplateHtml: current.contratoTemplateHtml,
    contratoAssinatura: current.contratoAssinatura,
    contratoEnviarAutomaticoEmail: current.contratoEnviarAutomaticoEmail,
  });
}

export async function listPlanos(): Promise<Plano[]> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      const planos = await listPlanosApi({ tenantId });
      const mergedPlanos = planos.map((plano) =>
        mergePlanoFromApi(
          plano,
          getStore().planos.find((item) => item.id === plano.id)
        )
      );
      setStore((s) => ({
        ...s,
        planos: mergeTenantScopedData(s.planos, mergedPlanos),
      }));
      return mergedPlanos;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao listar planos na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  return getStore().planos.filter((p) => p.tenantId === tenantId);
}

export async function getPlano(id: string): Promise<Plano | null> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = (await getTenantIdForApiCall()) ?? getCurrentTenantId();
      const plano = await getPlanoApi({ tenantId, id });
      const merged = mergePlanoFromApi(
        plano,
        getStore().planos.find((item) => item.id === id)
      );
      setStore((s) => ({
        ...s,
        planos: [merged, ...s.planos.filter((item) => item.id !== merged.id)],
      }));
      return merged;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao obter plano na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  return getStore().planos.find((p) => p.id === id && p.tenantId === tenantId) ?? null;
}

export async function createPlano(
  data: Omit<Plano, "id" | "tenantId" | "ativo">
): Promise<Plano> {
  const tenantId = getCurrentTenantId();
  const sanitized = normalizePlanoFallbackInput(tenantId, data);
  if (isRealApiEnabled()) {
    try {
      const tenantIdForApi = (await getTenantIdForApiCall()) ?? tenantId;
      const created = await createPlanoApi({
        tenantId: tenantIdForApi,
        data: sanitized,
      });
      const merged = mergePlanoFromApi(created, {
        ...sanitized,
        id: created.id,
        tenantId: tenantIdForApi,
        ativo: created.ativo,
      });
      setStore((s) => ({
        ...s,
        planos: [merged, ...s.planos.filter((item) => item.id !== merged.id)],
      }));
      return merged;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao criar plano na API real. Aplicando criação local.", error);
    }
  }
  const plano: Plano = {
    ...sanitized,
    id: genId(),
    tenantId,
    ativo: true,
  };
  setStore((s) => ({ ...s, planos: [plano, ...s.planos] }));
  return plano;
}

export async function updatePlano(
  id: string,
  data: Partial<Omit<Plano, "id" | "tenantId">>
): Promise<void> {
  const tenantId = getCurrentTenantId();
  let current: Plano | null | undefined = getStore().planos.find(
    (p) => p.id === id && p.tenantId === tenantId
  );
  if (!current && isRealApiEnabled()) {
    current = await getPlano(id);
  }
  if (!current) {
    throw new Error("Plano não encontrado");
  }
  const merged = { ...current, ...data };
  const sanitized = normalizePlanoFallbackInput(tenantId, merged);
  if (isRealApiEnabled()) {
    try {
      const tenantIdForApi = (await getTenantIdForApiCall()) ?? tenantId;
      const updated = await updatePlanoApi({
        tenantId: tenantIdForApi,
        id,
        data: sanitized,
      });
      const next = mergePlanoFromApi(updated, sanitized);
      setStore((s) => ({
        ...s,
        planos: s.planos.map((p) => (p.id === id ? next : p)),
      }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao atualizar plano na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    planos: s.planos.map((p) =>
      p.id === id && p.tenantId === tenantId ? { ...p, ...sanitized } : p
    ),
  }));
}

export async function togglePlanoAtivo(id: string): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const tenantIdForApi = (await getTenantIdForApiCall()) ?? tenantId;
      const current = getStore().planos.find((p) => p.id === id);
      const toggled = await togglePlanoAtivoApi({ tenantId: tenantIdForApi, id });
      const next = mergePlanoFromApi(toggled, current);
      setStore((s) => ({
        ...s,
        planos: s.planos.map((p) => (p.id === id ? next : p)),
      }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao alternar status do plano na API real. Aplicando toggle local.", error);
    }
  }
  requireTenantScopedEntity(getStore().planos, id, tenantId, "Plano não encontrado");
  setStore((s) => ({
    ...s,
    planos: s.planos.map((p) =>
      p.id === id && p.tenantId === tenantId ? { ...p, ativo: !p.ativo } : p
    ),
  }));
}

export async function togglePlanoDestaque(id: string): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const tenantIdForApi = (await getTenantIdForApiCall()) ?? tenantId;
      const current = getStore().planos.find((p) => p.id === id);
      const toggled = await togglePlanoDestaqueApi({ tenantId: tenantIdForApi, id });
      const next = mergePlanoFromApi(toggled, current);
      setStore((s) => ({
        ...s,
        planos: s.planos.map((p) => (p.id === id ? next : p)),
      }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao alternar destaque do plano na API real. Aplicando toggle local.", error);
    }
  }
  requireTenantScopedEntity(getStore().planos, id, tenantId, "Plano não encontrado");
  setStore((s) => ({
    ...s,
    planos: s.planos.map((p) =>
      p.id === id && p.tenantId === tenantId ? { ...p, destaque: !p.destaque } : p
    ),
  }));
}

export async function deletePlano(id: string): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const tenantIdForApi = (await getTenantIdForApiCall()) ?? tenantId;
      await deletePlanoApi({ tenantId: tenantIdForApi, id });
      setStore((s) => ({ ...s, planos: s.planos.filter((p) => p.id !== id) }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao remover plano na API real. Aplicando remoção local.", error);
    }
  }
  requireTenantScopedEntity(getStore().planos, id, tenantId, "Plano não encontrado");
  setStore((s) => ({
    ...s,
    planos: s.planos.filter((p) => !(p.id === id && p.tenantId === tenantId)),
  }));
}

// ─── MATRÍCULAS ─────────────────────────────────────────────────────────────

export async function listMatriculas(params?: {
  status?: string;
}): Promise<(Matricula & { aluno?: Aluno; plano?: Plano })[]> {
  const tenantId = getCurrentTenantId();
  const store = getStore();
  let mats = [...store.matriculas].reverse().filter((m) => m.tenantId === tenantId);
  if (params?.status) mats = mats.filter((m) => m.status === params.status);
  return mats.map((m) => ({
    ...m,
    aluno: store.alunos.find((a) => a.id === m.alunoId),
    plano: store.planos.find((p) => p.id === m.planoId),
  }));
}

export async function getAlunoMatriculas(
  alunoId: string
): Promise<(Matricula & { plano?: Plano })[]> {
  const tenantId = getCurrentTenantId();
  const store = getStore();
  return store.matriculas
    .filter((m) => m.alunoId === alunoId && m.tenantId === tenantId)
    .map((m) => ({ ...m, plano: store.planos.find((p) => p.id === m.planoId) }));
}

export async function cancelarMatricula(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    matriculas: s.matriculas.map((m) =>
      m.id === id ? { ...m, status: "CANCELADA" as const } : m
    ),
  }));
}

export async function criarMatricula(data: {
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
}): Promise<Matricula> {
  const store = getStore();
  const plano = store.planos.find((p) => p.id === data.planoId);
  if (!plano) throw new Error("Plano não encontrado");
  if (data.renovacaoAutomatica && !plano.permiteRenovacaoAutomatica) {
    throw new Error("Este plano não permite renovação automática.");
  }
  if (data.formaPagamento === "RECORRENTE" && !plano.permiteCobrancaRecorrente) {
    throw new Error("Este plano não permite cobrança recorrente.");
  }
  if (data.convenioId) {
    const convenio = store.convenios.find((c) => c.id === data.convenioId);
    if (!convenio || !convenio.ativo) {
      throw new Error("Convênio inativo");
    }
    if (convenio.planoIds && convenio.planoIds.length > 0) {
      if (!convenio.planoIds.includes(data.planoId)) {
        throw new Error("Convênio não aplicável para este plano");
      }
    }
  }

  const matId = genId();
  const pagamentoId = genId();
  let desconto = data.desconto ?? 0;
  if (data.convenioId) {
    const convenio = store.convenios.find((c) => c.id === data.convenioId);
    if (convenio && convenio.ativo) {
      const descontoConvenio = (plano.valor * convenio.descontoPercentual) / 100;
      desconto += descontoConvenio;
    }
  }
  const dataFim = addDays(data.dataInicio, plano.duracaoDias);
  const planoAtividades = plano.atividades ?? [];
  const conflitos = store.matriculas.filter((m) => {
    if (m.alunoId !== data.alunoId) return false;
    if (m.status !== "ATIVA") return false;
    return rangesOverlap(data.dataInicio, dataFim, m.dataInicio, m.dataFim);
  });
  if (conflitos.length > 0) {
    const conflitoMesmoPlano = conflitos.some((m) => m.planoId === data.planoId);
    if (conflitoMesmoPlano) {
      throw new Error("Já existe um plano igual vigente neste período.");
    }
    const conflitoAtividade = conflitos.some((m) => {
      const planoExistente = store.planos.find((p) => p.id === m.planoId);
      const atividadesExistentes = planoExistente?.atividades ?? [];
      return planoAtividades.some((a) => atividadesExistentes.includes(a));
    });
    if (conflitoAtividade) {
      throw new Error("Já existe um plano com a mesma atividade no período vigente.");
    }
  }
  const valorFinal = Math.max(0, plano.valor - desconto);

  const matricula: Matricula = {
    id: matId,
    tenantId: getCurrentTenantId(),
    alunoId: data.alunoId,
    planoId: data.planoId,
    dataInicio: data.dataInicio,
    dataFim,
    valorPago: data.valorPago,
    valorMatricula: data.valorMatricula ?? plano.valorMatricula,
    desconto,
    motivoDesconto: data.motivoDesconto,
    formaPagamento: data.formaPagamento,
    status: "ATIVA",
    renovacaoAutomatica: data.renovacaoAutomatica ?? false,
    observacoes: data.observacoes,
    dataCriacao: now(),
    convenioId: data.convenioId,
  };

  const pagamento: Pagamento = {
    id: pagamentoId,
    tenantId: getCurrentTenantId(),
    alunoId: data.alunoId,
    matriculaId: matId,
    tipo: "MENSALIDADE",
    descricao: `Mensalidade – ${plano.nome}`,
    valor: plano.valor,
    desconto,
    valorFinal,
    dataVencimento: data.dataInicio,
    status: data.dataPagamento ? "PAGO" : "PENDENTE",
    dataPagamento: data.dataPagamento,
    dataCriacao: now(),
  };

  setStore((s) => ({
    ...s,
    matriculas: [matricula, ...s.matriculas],
    pagamentos: [pagamento, ...s.pagamentos],
    alunos: s.alunos,
  }));
  syncAlunosStatus();

  return matricula;
}

function sanitizePlanoRules<T extends {
  tipo: TipoPlano;
  cobraAnuidade: boolean;
  valorAnuidade?: number;
  parcelasMaxAnuidade?: number;
  permiteRenovacaoAutomatica: boolean;
  permiteCobrancaRecorrente: boolean;
  diaCobrancaPadrao?: number;
  contratoTemplateHtml?: string;
  contratoEnviarAutomaticoEmail: boolean;
}>(plano: T): T {
  const contratoTemplateHtml = plano.contratoTemplateHtml?.trim() ?? "";
  const contratoEnviarAutomaticoEmail = contratoTemplateHtml ? plano.contratoEnviarAutomaticoEmail : false;
  if (plano.tipo === "AVULSO") {
    return {
      ...plano,
      permiteRenovacaoAutomatica: false,
      permiteCobrancaRecorrente: false,
      diaCobrancaPadrao: undefined,
      cobraAnuidade: false,
      valorAnuidade: undefined,
      parcelasMaxAnuidade: undefined,
      contratoTemplateHtml,
      contratoEnviarAutomaticoEmail,
    };
  }

  const dia =
    plano.permiteCobrancaRecorrente && plano.diaCobrancaPadrao
      ? Math.min(28, Math.max(1, Math.floor(plano.diaCobrancaPadrao)))
      : undefined;

  return {
    ...plano,
    diaCobrancaPadrao: dia,
    valorAnuidade: plano.cobraAnuidade ? Math.max(0, plano.valorAnuidade ?? 0) : undefined,
    parcelasMaxAnuidade: plano.cobraAnuidade ? Math.max(1, Math.min(24, Math.floor(plano.parcelasMaxAnuidade ?? 1))) : undefined,
    contratoTemplateHtml,
    contratoEnviarAutomaticoEmail,
  };
}

export async function renovarMatricula(id: string, planoId?: string): Promise<void> {
  const store = getStore();
  const atual = store.matriculas.find((m) => m.id === id);
  if (!atual) throw new Error("Matrícula não encontrada");
  if (atual.convenioId) {
    const convenio = store.convenios.find((c) => c.id === atual.convenioId);
    if (!convenio || !convenio.ativo) {
      throw new Error("Convênio inativo. Renovação bloqueada.");
    }
  }
  const novoPlanoId = planoId ?? atual.planoId;
  const plano = store.planos.find((p) => p.id === novoPlanoId);
  if (!plano) throw new Error("Plano não encontrado");
  const start = addDays(atual.dataFim, 1);
  await criarMatricula({
    alunoId: atual.alunoId,
    planoId: novoPlanoId,
    dataInicio: start,
    valorPago: plano.valor,
    valorMatricula: plano.valorMatricula,
    formaPagamento: atual.formaPagamento,
    desconto: 0,
    convenioId: atual.convenioId,
  });
}

// ─── PAGAMENTOS ─────────────────────────────────────────────────────────────

export async function listPagamentos(params?: {
  status?: string;
  alunoId?: string;
  page?: number;
  size?: number;
}): Promise<(Pagamento & { aluno?: Aluno })[]> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const synced = await listPagamentosApi({
        tenantId,
        status: params?.status as Pagamento["status"] | undefined,
        alunoId: params?.alunoId,
        page: params?.page ?? 0,
        size: params?.size ?? (params?.alunoId ? 80 : 200),
      });
      setStore((s) => ({
        ...s,
        pagamentos: [
          ...synced,
          ...s.pagamentos.filter((item) => !synced.some((pagamento) => pagamento.id === item.id)),
        ],
      }));
      const updated = getStore();
      return synced
        .map((p) => ({
          ...p,
          aluno: p.aluno ?? updated.alunos.find((a) => a.id === p.alunoId),
        }))
        .map(normalizeNfseInfo)
        .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
    } catch (error) {
      console.warn("[pagamentos][api-fallback] Falha ao listar pagamentos na API real. Usando store local.", error);
    }
  }

  const todayStr = today();
  // Atualiza vencidos e bloqueia clientes quando necessário
  setStore((s) => {
    const pagamentosBase = Array.isArray(s.pagamentos) ? s.pagamentos : [];
    let changed = false;
    const pagamentos = pagamentosBase.map((p) => {
      if (p.status === "PENDENTE" && p.dataVencimento < todayStr) {
        changed = true;
        return { ...p, status: "VENCIDO" as const };
      }
      return p;
    });
    return changed ? { ...s, pagamentos } : s;
  });
  syncAlunosStatus();
  const updated = getStore();
  let pags = [...updated.pagamentos].reverse().filter((p) => p.tenantId === tenantId);
  if (params?.status) pags = pags.filter((p) => p.status === params.status);
  if (params?.alunoId) pags = pags.filter((p) => p.alunoId === params.alunoId);
  if (params?.size) {
    const page = Math.max(0, params.page ?? 0);
    const size = Math.max(1, params.size);
    const start = page * size;
    pags = pags.slice(start, start + size);
  }
  return pags.map((p) => ({
    ...p,
    aluno: updated.alunos.find((a) => a.id === p.alunoId),
  })).map(normalizeNfseInfo);
}

type PagamentoComAluno = Pagamento & {
  aluno?: Aluno;
  clienteNome?: string;
  documentoCliente?: string;
};

function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "sim") return true;
    if (normalized === "false" || normalized === "0" || normalized === "nao" || normalized === "não") return false;
  }
  if (typeof value === "number") return value === 1;
  return fallback;
}

function normalizeString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const normalized = typeof value === "string" ? value.trim() : String(value).trim();
  return normalized || undefined;
}

function generateNfseNumero(tenantId: string, pagamentoId: string): string {
  const randomSuffix = pagamentoId.replace(/[^a-z0-9]/gi, "").slice(-4).padStart(4, "0").toUpperCase();
  const month = new Date().toISOString().slice(0, 7).replace("-", "");
  return `NFS-${tenantId.slice(-3)}-${month}-${randomSuffix}`;
}

function normalizeNfseInfo(pagamento: Pagamento): Pagamento {
  return {
    ...pagamento,
    nfseEmitida: parseBoolean(pagamento.nfseEmitida),
    nfseNumero: normalizeString(pagamento.nfseNumero),
    nfseChave: normalizeString(pagamento.nfseChave),
    dataEmissaoNfse: pagamento.dataEmissaoNfse,
  };
}

function toCpfDigits(value?: string | null): string {
  return (value ?? "").replace(/\D/g, "");
}

function mapContaReceberStatusToPagamento(status: StatusContaReceberApi): Pagamento["status"] {
  if (status === "RECEBIDA") return "PAGO";
  if (status === "VENCIDA") return "VENCIDO";
  if (status === "CANCELADA") return "CANCELADO";
  return "PENDENTE";
}

function mapPagamentoStatusToContaReceber(status: Pagamento["status"]): StatusContaReceberApi {
  if (status === "PAGO") return "RECEBIDA";
  if (status === "VENCIDO") return "VENCIDA";
  if (status === "CANCELADO") return "CANCELADA";
  return "PENDENTE";
}

function mapContaReceberCategoriaToTipo(categoria: CategoriaContaReceberApi): Pagamento["tipo"] {
  if (categoria === "MATRICULA") return "MATRICULA";
  if (categoria === "MENSALIDADE") return "MENSALIDADE";
  if (categoria === "PRODUTO") return "PRODUTO";
  if (categoria === "SERVICO") return "TAXA";
  return "AVULSO";
}

function mapTipoToContaReceberCategoria(tipo: Pagamento["tipo"]): CategoriaContaReceberApi {
  if (tipo === "MATRICULA") return "MATRICULA";
  if (tipo === "MENSALIDADE") return "MENSALIDADE";
  if (tipo === "PRODUTO") return "PRODUTO";
  if (tipo === "TAXA") return "SERVICO";
  return "AVULSO";
}

function resolveAlunoByContaReceber(conta: ContaReceberApiResponse, alunos: Aluno[]): Aluno | undefined {
  const cpf = toCpfDigits(conta.documentoCliente);
  if (cpf) {
    const byCpf = alunos.find((aluno) => toCpfDigits(aluno.cpf) === cpf);
    if (byCpf) return byCpf;
  }
  const nome = conta.cliente.trim().toLowerCase();
  if (!nome) return undefined;
  return alunos.find((aluno) => aluno.nome.trim().toLowerCase() === nome);
}

function mapContaReceberToPagamento(conta: ContaReceberApiResponse, alunos: Aluno[]): PagamentoComAluno {
  const aluno = resolveAlunoByContaReceber(conta, alunos);
  const valor = Math.max(0, Number(conta.valorOriginal ?? 0));
  const desconto = Math.max(0, Number(conta.desconto ?? 0));
  const juros = Math.max(0, Number(conta.jurosMulta ?? 0));
  const valorFinal = Math.max(0, valor - desconto + juros);
  const anyConta = conta as unknown as Record<string, unknown>;
  return {
    id: conta.id,
    tenantId: conta.tenantId,
    alunoId: aluno?.id ?? `manual-cr-${conta.id}`,
    tipo: mapContaReceberCategoriaToTipo(conta.categoria),
    descricao: conta.descricao,
    valor,
    desconto,
    valorFinal,
    dataVencimento: conta.dataVencimento,
    dataPagamento: conta.dataRecebimento ?? undefined,
    formaPagamento: conta.formaPagamento ?? undefined,
    status: mapContaReceberStatusToPagamento(conta.status),
    observacoes: conta.observacoes ?? undefined,
    nfseEmitida: parseBoolean(anyConta.nfseEmitida),
    nfseNumero: normalizeString(anyConta.nfseNumero),
    nfseChave: normalizeString(anyConta.nfseChave),
    dataEmissaoNfse: (anyConta.dataEmissaoNfse as Pagamento["dataEmissaoNfse"]) || undefined,
    dataCriacao: conta.dataCriacao,
    aluno,
    clienteNome: conta.cliente,
    documentoCliente: toCpfDigits(conta.documentoCliente) || undefined,
  };
}

function mergePagamentosNoStore(items: Pagamento[]): void {
  const normalizedItems = items.map(normalizeNfseInfo);
  setStore((s) => ({
    ...s,
    pagamentos: [
      ...normalizedItems,
      ...s.pagamentos.filter((item) => !normalizedItems.some((pagamento) => pagamento.id === item.id)),
    ],
  }));
}

function firstDayOfMonth(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `${date.slice(0, 7)}-01`;
  }
  return `${today().slice(0, 7)}-01`;
}

async function resolveClienteFromAlunoId(inputAlunoId: string | undefined, tenantId: string): Promise<{
  alunoId: string;
  cliente: string;
  documentoCliente?: string;
}> {
  const trimmed = inputAlunoId?.trim();
  const resolvedAlunoId = normalizarAlunoRecebimentoAvulso(trimmed, tenantId);
  if (!trimmed) {
    return {
      alunoId: resolvedAlunoId,
      cliente: "Sem cliente (avulso)",
    };
  }

  let aluno: Aluno | null =
    getStore().alunos.find((item) => item.id === trimmed && item.tenantId === tenantId) ?? null;
  if (!aluno) {
    try {
      aluno = await getAluno(trimmed);
    } catch {
      aluno = null;
    }
  }

  if (aluno) {
    return {
      alunoId: aluno.id,
      cliente: aluno.nome,
      documentoCliente: toCpfDigits(aluno.cpf) || undefined,
    };
  }

  return {
    alunoId: resolvedAlunoId,
    cliente: "Cliente não identificado",
  };
}

async function resolveClienteFromInput(input: {
  tenantId: string;
  alunoId?: string;
  clienteNome?: string;
  documentoCliente?: string;
}): Promise<{
  alunoId: string;
  cliente: string;
  documentoCliente?: string;
}> {
  const normalizedDocumento = toCpfDigits(input.documentoCliente);

  if (input.alunoId?.trim()) {
    return resolveClienteFromAlunoId(input.alunoId, input.tenantId);
  }

  if (!input.clienteNome?.trim() && !normalizedDocumento) {
    return resolveClienteFromAlunoId(undefined, input.tenantId);
  }

  const alunosTenant = getStore().alunos.filter((aluno) => aluno.tenantId === input.tenantId);
  const matchedByCpf = alunosTenant.find((item) => toCpfDigits(item.cpf) === normalizedDocumento);
  if (matchedByCpf) {
    return {
      alunoId: matchedByCpf.id,
      cliente: matchedByCpf.nome,
      documentoCliente: toCpfDigits(matchedByCpf.cpf) || undefined,
    };
  }

  const normalizedClientName = input.clienteNome?.trim().toLowerCase();
  if (normalizedClientName) {
    const matchedByName = alunosTenant.find((item) => item.nome.trim().toLowerCase() === normalizedClientName);
    if (matchedByName) {
      return {
        alunoId: matchedByName.id,
        cliente: matchedByName.nome,
        documentoCliente: toCpfDigits(matchedByName.cpf) || undefined,
      };
    }

    const cliente = (input.clienteNome ?? "").trim();
    return {
      alunoId: `manual-avulso-${input.tenantId}`,
      cliente,
      documentoCliente: normalizedDocumento,
    };
  }

  return {
    alunoId: `manual-avulso-${input.tenantId}`,
    cliente: "Cliente não identificado",
    documentoCliente: normalizedDocumento,
  };
}

export async function listContasReceberExperimental(params?: {
  status?: Pagamento["status"];
  startDate?: string;
  endDate?: string;
}): Promise<PagamentoComAluno[]> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    const synced = await listContasReceberApi({
      tenantId,
      status: params?.status ? mapPagamentoStatusToContaReceber(params.status) : undefined,
      startDate: params?.startDate,
      endDate: params?.endDate,
      page: 0,
      size: 500,
    });
    const alunosTenant = getStore().alunos.filter((aluno) => aluno.tenantId === tenantId);
    const mapped = synced.map((item) => mapContaReceberToPagamento(item, alunosTenant));
    mergePagamentosNoStore(mapped);
    return mapped.sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
  }

  const list = await listPagamentos(params?.status ? { status: params.status } : undefined);
  if (params?.startDate && params?.endDate) {
    return list.filter((item) => item.dataVencimento >= params.startDate! && item.dataVencimento <= params.endDate!);
  }
  return list;
}

export async function receberContaReceberExperimental(id: string, data: ReceberPagamentoInput): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    const updated = await receberContaReceberApi({
      tenantId,
      id,
      data: {
        dataRecebimento: data.dataPagamento,
        formaPagamento: data.formaPagamento,
        observacoes: data.observacoes,
      },
    });
    const alunosTenant = getStore().alunos.filter((aluno) => aluno.tenantId === tenantId);
    const mapped = mapContaReceberToPagamento(updated, alunosTenant);
    mergePagamentosNoStore([mapped]);
    syncAlunosStatus();
    return;
  }
  await receberPagamento(id, data);
}

export interface CreateRecebimentoAvulsoInput {
  alunoId?: string;
  clienteNome?: string;
  documentoCliente?: string;
  descricao: string;
  tipo?: Pagamento["tipo"];
  valor: number;
  desconto?: number;
  dataVencimento: string;
  status?: "PENDENTE" | "PAGO";
  dataPagamento?: string;
  formaPagamento?: TipoFormaPagamento;
  observacoes?: string;
}

export interface PagamentoImportItem {
  alunoId?: string;
  clienteNome?: string;
  documentoCliente?: string;
  descricao: string;
  tipo?: Pagamento["tipo"];
  valor: number;
  desconto?: number;
  dataVencimento: string;
  status?: "PENDENTE" | "PAGO";
  dataPagamento?: string;
  formaPagamento?: TipoFormaPagamento;
  observacoes?: string;
}

export interface ImportarPagamentosResultado {
  total: number;
  importados: number;
  ignorados: number;
  erros: string[];
}

export interface AjustarPagamentoInput {
  alunoId?: string;
  descricao?: string;
  tipo?: Pagamento["tipo"];
  valor?: number;
  desconto?: number;
  dataVencimento?: string;
  status?: Pagamento["status"];
  dataPagamento?: string;
  formaPagamento?: TipoFormaPagamento;
  observacoes?: string;
}

function normalizarAlunoRecebimentoAvulso(alunoId: string | undefined, tenantId: string): string {
  const trimmed = alunoId?.trim();
  if (trimmed) return trimmed;
  return `manual-avulso-${tenantId}`;
}

export async function createRecebimentoAvulso(input: CreateRecebimentoAvulsoInput): Promise<Pagamento> {
  const tenantId = getCurrentTenantId();
  const valor = Math.max(0, Number(input.valor ?? 0));
  const desconto = Math.max(0, Number(input.desconto ?? 0));
  const valorFinal = Math.max(0, valor - desconto);
  const status = input.status === "PAGO" ? "PAGO" : "PENDENTE";
  const clienteData = await resolveClienteFromInput({
    tenantId,
    alunoId: input.alunoId,
    clienteNome: input.clienteNome,
    documentoCliente: input.documentoCliente,
  });
  const alunoId = clienteData.alunoId;
  const descricaoBase = input.descricao.trim();
  const isManual = alunoId.startsWith("manual-avulso-");
  const descricao = isManual ? `[Avulso] ${descricaoBase}` : descricaoBase;

  if (isRealApiEnabled()) {
    const created = await createContaReceberApi({
      tenantId,
      data: {
        cliente: clienteData.cliente,
        documentoCliente: clienteData.documentoCliente,
        descricao,
        categoria: mapTipoToContaReceberCategoria(input.tipo ?? "AVULSO"),
        competencia: firstDayOfMonth(input.dataVencimento),
        dataEmissao: today(),
        dataVencimento: input.dataVencimento,
        valorOriginal: valor,
        desconto,
        jurosMulta: 0,
        observacoes: input.observacoes?.trim() || undefined,
      },
    });

    if (!created) {
      throw new Error("Backend retornou lançamento vazio para conta a receber.");
    }

    let synced = created;
    if (status === "PAGO") {
      synced = await receberContaReceberApi({
        tenantId,
        id: created.id,
        data: {
          dataRecebimento: input.dataPagamento ?? today(),
          formaPagamento: input.formaPagamento ?? "PIX",
          valorRecebido: valorFinal,
          observacoes: input.observacoes?.trim() || undefined,
        },
      });
    }

    const alunosTenant = getStore().alunos.filter((aluno) => aluno.tenantId === tenantId);
    const mapped = mapContaReceberToPagamento(synced, alunosTenant);
    const resolved: Pagamento = { ...mapped, alunoId };
    mergePagamentosNoStore([resolved]);
    syncAlunosStatus();
    return resolved;
  }

  const pagamento: Pagamento = {
    id: genId(),
    tenantId,
    alunoId,
    tipo: input.tipo ?? "AVULSO",
    descricao,
    valor,
    desconto,
    valorFinal,
    dataVencimento: input.dataVencimento,
    status,
    dataPagamento: status === "PAGO" ? input.dataPagamento ?? today() : undefined,
    formaPagamento: status === "PAGO" ? input.formaPagamento ?? "PIX" : undefined,
    observacoes: input.observacoes?.trim() || undefined,
    dataCriacao: now(),
  };

  setStore((s) => ({
    ...s,
    pagamentos: [pagamento, ...s.pagamentos],
  }));
  syncAlunosStatus();
  return pagamento;
}

export async function importarPagamentosEmLote(
  itens: PagamentoImportItem[]
): Promise<ImportarPagamentosResultado> {
  const resultado: ImportarPagamentosResultado = {
    total: itens.length,
    importados: 0,
    ignorados: 0,
    erros: [],
  };

  for (let index = 0; index < itens.length; index += 1) {
    const item = itens[index];
    try {
      const descricao = item.descricao.trim();
      if (!descricao) {
        throw new Error(`Linha ${index + 1}: descrição é obrigatória.`);
      }

      if (!item.dataVencimento || !/^\d{4}-\d{2}-\d{2}$/.test(item.dataVencimento)) {
        throw new Error(`Linha ${index + 1}: dataVencimento inválida (use YYYY-MM-DD).`);
      }

      const valor = Number(item.valor);
      if (!Number.isFinite(valor) || valor <= 0) {
        throw new Error(`Linha ${index + 1}: valor deve ser maior que zero.`);
      }

      const desconto = item.desconto == null ? 0 : Number(item.desconto);
      if (!Number.isFinite(desconto) || desconto < 0) {
        throw new Error(`Linha ${index + 1}: desconto inválido.`);
      }

      await createRecebimentoAvulso({
        alunoId: item.alunoId,
        clienteNome: item.clienteNome,
        documentoCliente: item.documentoCliente,
        descricao,
        tipo: item.tipo,
        valor,
        desconto,
        dataVencimento: item.dataVencimento,
        status: item.status === "PAGO" ? "PAGO" : "PENDENTE",
        dataPagamento: item.dataPagamento,
        formaPagamento: item.formaPagamento,
        observacoes: item.observacoes,
      });

      resultado.importados += 1;
    } catch (error) {
      resultado.ignorados += 1;
      resultado.erros.push(error instanceof Error ? error.message : "Erro desconhecido no registro.");
    }
  }

  return resultado;
}

export async function ajustarPagamento(id: string, input: AjustarPagamentoInput): Promise<Pagamento> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    const current = getStore().pagamentos.find((pagamento) => pagamento.id === id && pagamento.tenantId === tenantId);
    const alvoStatus = input.status ?? current?.status ?? "PENDENTE";
    if (alvoStatus === "PENDENTE" && current && (current.status === "PAGO" || current.status === "CANCELADO")) {
      throw new Error("Reabertura de conta recebida/cancelada ainda não está disponível no backend.");
    }

    const clienteData = input.alunoId === undefined
      ? undefined
      : await resolveClienteFromAlunoId(input.alunoId, tenantId);
    const descricao = input.descricao == null ? undefined : input.descricao.trim();
    const observacoes = input.observacoes === undefined ? undefined : input.observacoes.trim() || undefined;
    const valorOriginal = input.valor == null ? undefined : Math.max(0, Number(input.valor));
    const desconto = input.desconto == null ? undefined : Math.max(0, Number(input.desconto));

    let updated = await updateContaReceberApi({
      tenantId,
      id,
      data: {
        cliente: clienteData?.cliente,
        documentoCliente: clienteData?.documentoCliente,
        descricao,
        categoria: input.tipo ? mapTipoToContaReceberCategoria(input.tipo) : undefined,
        competencia: input.dataVencimento ? firstDayOfMonth(input.dataVencimento) : undefined,
        dataVencimento: input.dataVencimento,
        valorOriginal,
        desconto,
        observacoes,
      },
    });

    if (alvoStatus === "PAGO") {
      const baseValor = valorOriginal ?? Math.max(0, Number(updated.valorOriginal ?? 0));
      const baseDesconto = desconto ?? Math.max(0, Number(updated.desconto ?? 0));
      const baseJuros = Math.max(0, Number(updated.jurosMulta ?? 0));
      updated = await receberContaReceberApi({
        tenantId,
        id,
        data: {
          dataRecebimento: input.dataPagamento ?? current?.dataPagamento ?? today(),
          formaPagamento: input.formaPagamento ?? current?.formaPagamento ?? "PIX",
          valorRecebido: Math.max(0, baseValor - baseDesconto + baseJuros),
          observacoes,
        },
      });
    } else if (alvoStatus === "CANCELADO") {
      updated = await cancelarContaReceberApi({
        tenantId,
        id,
        observacoes,
      });
    }

    const alunosTenant = getStore().alunos.filter((aluno) => aluno.tenantId === tenantId);
    const mapped = mapContaReceberToPagamento(updated, alunosTenant);
    const resolved: Pagamento = clienteData ? { ...mapped, alunoId: clienteData.alunoId } : mapped;
    mergePagamentosNoStore([resolved]);
    syncAlunosStatus();
    return resolved;
  }

  let updated: Pagamento | null = null;
  setStore((s) => {
    const pagamentos = s.pagamentos.map((pagamento) => {
      if (pagamento.id !== id || pagamento.tenantId !== tenantId) return pagamento;

      const valor = input.valor == null ? pagamento.valor : Math.max(0, Number(input.valor));
      const desconto = input.desconto == null ? pagamento.desconto : Math.max(0, Number(input.desconto));
      const status = input.status ?? pagamento.status;
      const alunoId = input.alunoId === undefined
        ? pagamento.alunoId
        : normalizarAlunoRecebimentoAvulso(input.alunoId, tenantId);

      const next: Pagamento = {
        ...pagamento,
        alunoId,
        descricao: input.descricao == null ? pagamento.descricao : input.descricao.trim(),
        tipo: input.tipo ?? pagamento.tipo,
        valor,
        desconto,
        valorFinal: Math.max(0, valor - desconto),
        dataVencimento: input.dataVencimento ?? pagamento.dataVencimento,
        status,
        observacoes: input.observacoes === undefined
          ? pagamento.observacoes
          : input.observacoes.trim() || undefined,
      };

      if (status === "PAGO") {
        next.dataPagamento = input.dataPagamento ?? pagamento.dataPagamento ?? today();
        next.formaPagamento = input.formaPagamento ?? pagamento.formaPagamento ?? "PIX";
      } else {
        next.dataPagamento = undefined;
        next.formaPagamento = undefined;
      }

      updated = next;
      return next;
    });

    return { ...s, pagamentos };
  });

  if (!updated) {
    throw new Error("Pagamento não encontrado para ajuste.");
  }
  syncAlunosStatus();
  return updated;
}

export async function receberPagamento(
  id: string,
  data: ReceberPagamentoInput
): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      await receberPagamentoApi({
        tenantId,
        id,
        data,
      });
      const refreshed = await listPagamentosApi({
        tenantId,
        page: 0,
        size: 200,
      });
      setStore((s) => ({
        ...s,
        pagamentos: [
          ...refreshed,
          ...s.pagamentos.filter((item) => !refreshed.some((pagamento) => pagamento.id === item.id)),
        ],
      }));
      syncAlunosStatus();
      return;
    } catch (error) {
      console.warn("[pagamentos][api-fallback] Falha ao receber pagamento na API real. Aplicando baixa local.", error);
    }
  }
  requireTenantScopedEntity(getStore().pagamentos, id, tenantId, "Pagamento não encontrado");

  setStore((s) => {
    const pagamentos = s.pagamentos.map((p) =>
      p.id === id && p.tenantId === tenantId
        ? {
            ...p,
            status: "PAGO" as const,
            dataPagamento: data.dataPagamento,
            formaPagamento: data.formaPagamento,
            observacoes: data.observacoes,
          }
        : p
    );
    return { ...s, pagamentos };
  });
  syncAlunosStatus();
}

export async function emitirNfsePagamento(id: string): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const updated = normalizeNfseInfo(
        await emitirNfsePagamentoApi({
          tenantId,
          id,
        })
      );
      setStore((s) => ({
        ...s,
        pagamentos: [
          updated,
          ...s.pagamentos.filter((item) => item.id !== updated.id),
        ],
      }));
      syncAlunosStatus();
      return;
    } catch (error) {
      console.warn("[pagamentos][api-fallback] Falha ao emitir NFSe na API real. Aplicando marcação local.", error);
    }
  }

  requireTenantScopedEntity(getStore().pagamentos, id, tenantId, "Pagamento não encontrado");
  const numero = generateNfseNumero(tenantId, id);
  setStore((s) => {
    const nowDate = now();
    const pagamentos = s.pagamentos.map((pagamento) =>
      pagamento.id === id && pagamento.tenantId === tenantId
        ? {
            ...pagamento,
            nfseEmitida: true,
            nfseNumero: numero,
            dataEmissaoNfse: nowDate,
          }
        : pagamento
    );
    return {
      ...s,
      pagamentos,
    };
  });
  syncAlunosStatus();
}

export async function emitirNfseEmLote(ids: string[]): Promise<void> {
  const uniqueIds = Array.from(new Set(ids));
  for (const id of uniqueIds) {
    await emitirNfsePagamento(id);
  }
}

// ─── CONTAS A PAGAR ────────────────────────────────────────────────────────

export interface CreateTipoContaPagarInput {
  nome: string;
  descricao?: string;
  categoriaOperacional: CategoriaContaPagar;
  grupoDre: GrupoDre;
  centroCustoPadrao?: string;
}

export interface UpdateTipoContaPagarInput {
  nome?: string;
  descricao?: string;
  categoriaOperacional?: CategoriaContaPagar;
  grupoDre?: GrupoDre;
  centroCustoPadrao?: string;
}

export interface CreateContaPagarRecorrenciaInput {
  tipo: RecorrenciaContaPagar;
  intervaloDias?: number;
  diaDoMes?: number;
  dataInicial: string;
  termino: TerminoRecorrenciaContaPagar;
  dataFim?: string;
  numeroOcorrencias?: number;
  criarLancamentoInicial: boolean;
  timezone?: string;
}

export interface CreateContaPagarInput {
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
  recorrencia?: CreateContaPagarRecorrenciaInput;
}

export interface PagarContaPagarInput {
  dataPagamento: string;
  formaPagamento: ContaPagar["formaPagamento"];
  valorPago?: number;
  observacoes?: string;
}

function grupoDreFromCategoria(categoria: CategoriaContaPagar): GrupoDre {
  if (categoria === "FORNECEDORES") return "CUSTO_VARIAVEL";
  if (categoria === "IMPOSTOS") return "IMPOSTOS";
  return "DESPESA_OPERACIONAL";
}

function getNextRecurrenceDate(rule: RegraRecorrenciaContaPagar, currentDate: string): string {
  if (rule.recorrencia === "INTERVALO_DIAS") {
    return addDaysToDate(currentDate, Math.max(1, Number(rule.intervaloDias ?? 30)));
  }
  return getNextMonthlyDate(currentDate, Math.max(1, Math.min(31, Number(rule.diaDoMes ?? 1))));
}

function resolveContaTipoValues(input: CreateContaPagarInput): {
  tipoConta?: TipoContaPagar;
  categoria: CategoriaContaPagar;
  grupoDre: GrupoDre;
  centroCusto?: string;
} {
  const tenantId = getCurrentTenantId();
  const store = getStore();
  const tipoConta = input.tipoContaId
    ? (store.tiposContaPagar ?? []).find((t) => t.id === input.tipoContaId && t.tenantId === tenantId)
    : undefined;

  const categoria = tipoConta?.categoriaOperacional ?? input.categoria ?? "OUTROS";
  const grupoDre = tipoConta?.grupoDre ?? input.grupoDre ?? grupoDreFromCategoria(categoria);
  const centroCusto = input.centroCusto?.trim() || tipoConta?.centroCustoPadrao;

  return { tipoConta, categoria, grupoDre, centroCusto: centroCusto || undefined };
}

export async function listTiposContaPagar(params?: { apenasAtivos?: boolean }): Promise<TipoContaPagar[]> {
  const tenantId = getCurrentTenantId();
  const apenasAtivos = params?.apenasAtivos ?? true;
  if (isRealApiEnabled()) {
    try {
      const synced = await listTiposContaPagarApi({
        tenantId,
        apenasAtivos: false,
      });
      setStore((s) => ({
        ...s,
        tiposContaPagar: [
          ...synced,
          ...(s.tiposContaPagar ?? []).filter((tipo) => tipo.tenantId !== tenantId),
        ],
      }));
      return apenasAtivos ? synced.filter((tipo) => tipo.ativo) : synced;
    } catch (error) {
      console.warn("Falha ao listar tipos de conta na API real. Usando cache local.", error);
    }
  }
  const tipos = (getStore().tiposContaPagar ?? [])
    .filter((tipo) => tipo.tenantId === tenantId)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return apenasAtivos ? tipos.filter((tipo) => tipo.ativo) : tipos;
}

export async function createTipoContaPagar(input: CreateTipoContaPagarInput): Promise<TipoContaPagar> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const created = await createTipoContaPagarApi({
        tenantId,
        data: {
          nome: input.nome.trim(),
          descricao: input.descricao?.trim() || undefined,
          categoriaOperacional: input.categoriaOperacional,
          grupoDre: input.grupoDre,
          centroCustoPadrao: input.centroCustoPadrao?.trim() || undefined,
        },
      });
      setStore((s) => ({
        ...s,
        tiposContaPagar: [
          created,
          ...(s.tiposContaPagar ?? []).filter((tipo) => tipo.id !== created.id),
        ],
      }));
      return created;
    } catch (error) {
      console.warn("Falha ao criar tipo de conta na API real. Gravando localmente.", error);
    }
  }
  const tipo: TipoContaPagar = {
    id: genId(),
    tenantId,
    nome: input.nome.trim(),
    descricao: input.descricao?.trim() || undefined,
    categoriaOperacional: input.categoriaOperacional,
    grupoDre: input.grupoDre,
    centroCustoPadrao: input.centroCustoPadrao?.trim() || undefined,
    ativo: true,
  };
  setStore((s) => ({ ...s, tiposContaPagar: [tipo, ...(s.tiposContaPagar ?? [])] }));
  return tipo;
}

export async function updateTipoContaPagar(
  id: string,
  input: UpdateTipoContaPagarInput
): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const updated = await updateTipoContaPagarApi({
        tenantId,
        id,
        data: {
          nome: input.nome?.trim(),
          descricao: input.descricao?.trim() || (input.descricao === "" ? undefined : undefined),
          categoriaOperacional: input.categoriaOperacional,
          grupoDre: input.grupoDre,
          centroCustoPadrao:
            input.centroCustoPadrao?.trim() || (input.centroCustoPadrao === "" ? undefined : undefined),
        },
      });
      setStore((s) => ({
        ...s,
        tiposContaPagar: (s.tiposContaPagar ?? []).map((tipo) =>
          tipo.id === updated.id ? updated : tipo
        ),
      }));
      return;
    } catch (error) {
      console.warn("Falha ao atualizar tipo de conta na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    tiposContaPagar: (s.tiposContaPagar ?? []).map((tipo) => {
      if (tipo.id !== id || tipo.tenantId !== tenantId) return tipo;
      return {
        ...tipo,
        nome: input.nome?.trim() ?? tipo.nome,
        descricao: input.descricao?.trim() || (input.descricao === "" ? undefined : tipo.descricao),
        categoriaOperacional: input.categoriaOperacional ?? tipo.categoriaOperacional,
        grupoDre: input.grupoDre ?? tipo.grupoDre,
        centroCustoPadrao:
          input.centroCustoPadrao?.trim() ||
          (input.centroCustoPadrao === "" ? undefined : tipo.centroCustoPadrao),
      };
    }),
  }));
}

export async function toggleTipoContaPagar(id: string): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const updated = await toggleTipoContaPagarApi({ tenantId, id });
      setStore((s) => ({
        ...s,
        tiposContaPagar: (s.tiposContaPagar ?? []).map((tipo) =>
          tipo.id === updated.id ? updated : tipo
        ),
      }));
      return;
    } catch (error) {
      console.warn("Falha ao alternar tipo de conta na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    tiposContaPagar: (s.tiposContaPagar ?? []).map((tipo) =>
      tipo.id === id && tipo.tenantId === tenantId
        ? { ...tipo, ativo: !tipo.ativo }
        : tipo
    ),
  }));
}

export async function listRegrasRecorrenciaContaPagar(params?: {
  status?: RegraRecorrenciaContaPagar["status"] | "TODAS";
}): Promise<RegraRecorrenciaContaPagar[]> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const synced = await listRegrasRecorrenciaContaPagarApi({
        tenantId,
        status: params?.status,
        page: 0,
        size: 200,
      });
      setStore((s) => ({
        ...s,
        regrasRecorrenciaContaPagar: [
          ...synced,
          ...(s.regrasRecorrenciaContaPagar ?? []).filter((rule) => rule.tenantId !== tenantId),
        ],
      }));
      return [...synced].sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
    } catch (error) {
      console.warn("[contas-pagar][api-fallback] Falha ao listar regras de recorrência na API real. Usando store local.", error);
    }
  }
  let regras = (getStore().regrasRecorrenciaContaPagar ?? [])
    .filter((rule) => rule.tenantId === tenantId)
    .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
  if (params?.status && params.status !== "TODAS") {
    regras = regras.filter((rule) => rule.status === params.status);
  }
  return regras;
}

export async function pauseRegraRecorrencia(id: string): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const updated = await pauseRegraRecorrenciaApi({ tenantId, id });
      setStore((s) => ({
        ...s,
        regrasRecorrenciaContaPagar: (s.regrasRecorrenciaContaPagar ?? []).map((rule) =>
          rule.id === updated.id ? updated : rule
        ),
      }));
      return;
    } catch (error) {
      console.warn("[contas-pagar][api-fallback] Falha ao pausar regra na API real. Aplicando pausa local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    regrasRecorrenciaContaPagar: (s.regrasRecorrenciaContaPagar ?? []).map((rule) =>
      rule.id === id && rule.tenantId === tenantId
        ? { ...rule, status: "PAUSADA", dataAtualizacao: now() }
        : rule
    ),
  }));
}

export async function resumeRegraRecorrencia(id: string): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const updated = await resumeRegraRecorrenciaApi({ tenantId, id });
      setStore((s) => ({
        ...s,
        regrasRecorrenciaContaPagar: (s.regrasRecorrenciaContaPagar ?? []).map((rule) =>
          rule.id === updated.id ? updated : rule
        ),
      }));
      return;
    } catch (error) {
      console.warn("[contas-pagar][api-fallback] Falha ao retomar regra na API real. Aplicando retomada local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    regrasRecorrenciaContaPagar: (s.regrasRecorrenciaContaPagar ?? []).map((rule) =>
      rule.id === id && rule.tenantId === tenantId
        ? { ...rule, status: "ATIVA", dataAtualizacao: now() }
        : rule
    ),
  }));
}

export async function cancelRegraRecorrencia(id: string): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const updated = await cancelRegraRecorrenciaApi({ tenantId, id });
      setStore((s) => ({
        ...s,
        regrasRecorrenciaContaPagar: (s.regrasRecorrenciaContaPagar ?? []).map((rule) =>
          rule.id === updated.id ? updated : rule
        ),
      }));
      return;
    } catch (error) {
      console.warn("[contas-pagar][api-fallback] Falha ao cancelar regra na API real. Aplicando cancelamento local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    regrasRecorrenciaContaPagar: (s.regrasRecorrenciaContaPagar ?? []).map((rule) =>
      rule.id === id && rule.tenantId === tenantId
        ? { ...rule, status: "CANCELADA", dataAtualizacao: now() }
        : rule
    ),
  }));
}

export async function triggerGeracaoContasRecorrentes(params?: {
  untilDate?: string;
  tenantId?: string;
}): Promise<number> {
  const targetTenantId = params?.tenantId ?? getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const generated = await triggerGeracaoContasRecorrentesApi({
        tenantId: targetTenantId,
        untilDate: params?.untilDate,
      });
      try {
        const [contas, regras] = await Promise.all([
          listContasPagarApi({ tenantId: targetTenantId, page: 0, size: 200 }),
          listRegrasRecorrenciaContaPagarApi({ tenantId: targetTenantId, status: "TODAS", page: 0, size: 200 }),
        ]);
        setStore((s) => ({
          ...s,
          contasPagar: [...contas, ...(s.contasPagar ?? []).filter((c) => c.tenantId !== targetTenantId)],
          regrasRecorrenciaContaPagar: [
            ...regras,
            ...(s.regrasRecorrenciaContaPagar ?? []).filter((r) => r.tenantId !== targetTenantId),
          ],
        }));
      } catch {
        // Não interrompe o retorno de geração em caso de falha no refresh.
      }
      return generated;
    } catch (error) {
      console.warn("[contas-pagar][api-fallback] Falha ao gerar recorrências na API real. Aplicando geração local.", error);
    }
  }
  const limitDate = params?.untilDate ?? today();
  let generatedCount = 0;

  setStore((s) => {
    const contas = [...(s.contasPagar ?? [])];
    let changed = false;
    const rules = (s.regrasRecorrenciaContaPagar ?? []).map((rule) => {
      if (rule.tenantId !== targetTenantId || rule.status !== "ATIVA") return rule;

      const dayOfMonth = Math.max(1, Math.min(31, Number(rule.diaDoMes ?? parseDate(rule.dataInicial).getDate())));
      const intervalDays = Math.max(1, Number(rule.intervaloDias ?? 30));
      const existingRuleAccounts = contas.filter((conta) => conta.regraRecorrenciaId === rule.id);

      let occurrenceDate = rule.dataInicial;
      if (!rule.criarLancamentoInicial && existingRuleAccounts.length === 0) {
        occurrenceDate =
          rule.recorrencia === "MENSAL"
            ? getNextMonthlyDate(rule.dataInicial, dayOfMonth)
            : addDaysToDate(rule.dataInicial, intervalDays);
      }

      let totalGeneratedForRule = existingRuleAccounts.length;
      let safeGuard = 0;
      while (occurrenceDate <= limitDate && safeGuard < 500) {
        safeGuard += 1;
        if (!matchesRuleTermination(rule, totalGeneratedForRule, occurrenceDate)) break;

        const competencia = getMonthStart(parseDate(occurrenceDate));
        const alreadyExists = contas.some(
          (conta) =>
            conta.regraRecorrenciaId === rule.id &&
            conta.competencia === competencia &&
            conta.tenantId === rule.tenantId
        );

        if (!alreadyExists) {
          const novaConta: ContaPagar = {
            id: genId(),
            tenantId: rule.tenantId,
            tipoContaId: rule.tipoContaId,
            fornecedor: rule.fornecedor,
            documentoFornecedor: rule.documentoFornecedor,
            descricao: rule.descricao,
            categoria: rule.categoriaOperacional,
            grupoDre: rule.grupoDre,
            centroCusto: rule.centroCusto,
            regime: "FIXA",
            competencia,
            dataVencimento: occurrenceDate,
            valorOriginal: Number(rule.valorOriginal ?? 0),
            desconto: Number(rule.desconto ?? 0),
            jurosMulta: Number(rule.jurosMulta ?? 0),
            status: "PENDENTE",
            regraRecorrenciaId: rule.id,
            geradaAutomaticamente: true,
            origemLancamento: "RECORRENTE",
            dataCriacao: now(),
          };
          contas.push(novaConta);
          generatedCount += 1;
          totalGeneratedForRule += 1;
          changed = true;
        }

        occurrenceDate = getNextRecurrenceDate(rule, occurrenceDate);
      }

      if (safeGuard > 0) {
        changed = true;
        return {
          ...rule,
          diaDoMes: rule.recorrencia === "MENSAL" ? dayOfMonth : rule.diaDoMes,
          intervaloDias: rule.recorrencia === "INTERVALO_DIAS" ? intervalDays : rule.intervaloDias,
          ultimaGeracaoEm: now(),
          dataAtualizacao: now(),
        };
      }
      return rule;
    });

    if (!changed) return s;
    return { ...s, contasPagar: contas, regrasRecorrenciaContaPagar: rules };
  });

  return generatedCount;
}

export async function listContasPagar(params?: {
  status?: StatusContaPagar;
  categoria?: CategoriaContaPagar;
  tipoContaId?: string;
  grupoDre?: GrupoDre;
  origem?: ContaPagar["origemLancamento"];
  startDate?: string;
  endDate?: string;
}): Promise<ContaPagar[]> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      if (!params?.status || params.status === "PENDENTE" || params.status === "VENCIDA") {
        try {
          await triggerGeracaoContasRecorrentesApi({
            tenantId,
            untilDate: params?.endDate ?? today(),
          });
        } catch {
          // Se falhar a geração, segue com listagem existente.
        }
      }
      const synced = await listContasPagarApi({
        tenantId,
        status: params?.status,
        categoria: params?.categoria,
        tipoContaId: params?.tipoContaId,
        grupoDre: params?.grupoDre,
        origem: params?.origem,
        startDate: params?.startDate,
        endDate: params?.endDate,
        page: 0,
        size: 500,
      });
      const sorted = [...synced].sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
      setStore((s) => ({
        ...s,
        contasPagar: [...sorted, ...(s.contasPagar ?? []).filter((c) => c.tenantId !== tenantId)],
      }));
      return sorted;
    } catch (error) {
      console.warn("[contas-pagar][api-fallback] Falha ao listar contas a pagar na API real. Usando store local.", error);
    }
  }

  await triggerGeracaoContasRecorrentes({ untilDate: params?.endDate ?? today() });
  const todayStr = today();
  setStore((s) => {
    let changed = false;
    const contas = (s.contasPagar ?? []).map((c) => {
      if (c.status === "PENDENTE" && c.dataVencimento < todayStr) {
        changed = true;
        return { ...c, status: "VENCIDA" as const, dataAtualizacao: now() };
      }
      return c;
    });
    return changed ? { ...s, contasPagar: contas } : s;
  });

  const store = getStore();
  let contas = [...(store.contasPagar ?? [])]
    .filter((c) => c.tenantId === tenantId)
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  if (params?.status) contas = contas.filter((c) => c.status === params.status);
  if (params?.categoria) contas = contas.filter((c) => c.categoria === params.categoria);
  if (params?.tipoContaId) contas = contas.filter((c) => c.tipoContaId === params.tipoContaId);
  if (params?.grupoDre) contas = contas.filter((c) => (c.grupoDre ?? "DESPESA_OPERACIONAL") === params.grupoDre);
  if (params?.origem) contas = contas.filter((c) => (c.origemLancamento ?? "MANUAL") === params.origem);
  if (params?.startDate && params?.endDate) {
    contas = contas.filter(
      (c) => c.dataVencimento >= params.startDate! && c.dataVencimento <= params.endDate!
    );
  }
  return contas;
}

export async function createContaPagar(input: CreateContaPagarInput): Promise<ContaPagar | null> {
  const resolved = resolveContaTipoValues(input);
  const tenantId = getCurrentTenantId();
  if (!resolved.tipoConta) {
    throw new Error("Tipo de conta é obrigatório");
  }
  const tipoConta = resolved.tipoConta;
  const total = Math.max(0, Number(input.valorOriginal ?? 0));
  const desconto = Math.max(0, Number(input.desconto ?? 0));
  const jurosMulta = Math.max(0, Number(input.jurosMulta ?? 0));
  const recorrencia = input.recorrencia;

  if (isRealApiEnabled()) {
    try {
      const created = await createContaPagarApi({
        tenantId,
        data: {
          tipoContaId: resolved.tipoConta.id,
          fornecedor: input.fornecedor.trim(),
          documentoFornecedor: input.documentoFornecedor?.trim() || undefined,
          descricao: input.descricao.trim(),
          categoria: resolved.categoria,
          grupoDre: resolved.grupoDre,
          centroCusto: resolved.centroCusto,
          regime: input.regime,
          competencia: input.competencia,
          dataEmissao: input.dataEmissao,
          dataVencimento: input.dataVencimento,
          valorOriginal: total,
          desconto,
          jurosMulta,
          observacoes: input.observacoes?.trim() || undefined,
          recorrencia: recorrencia
            ? {
                tipo: recorrencia.tipo,
                intervaloDias: recorrencia.intervaloDias,
                diaDoMes: recorrencia.diaDoMes,
                dataInicial: recorrencia.dataInicial,
                termino: recorrencia.termino,
                dataFim: recorrencia.dataFim,
                numeroOcorrencias: recorrencia.numeroOcorrencias,
                criarLancamentoInicial: recorrencia.criarLancamentoInicial,
                timezone: recorrencia.timezone ?? "America/Sao_Paulo",
              }
            : undefined,
        },
      });

      if (created) {
        setStore((s) => ({
          ...s,
          contasPagar: [created, ...(s.contasPagar ?? []).filter((conta) => conta.id !== created.id)],
        }));
      } else {
        try {
          const refreshed = await listContasPagarApi({ tenantId, page: 0, size: 500 });
          setStore((s) => ({
            ...s,
            contasPagar: [...refreshed, ...(s.contasPagar ?? []).filter((conta) => conta.tenantId !== tenantId)],
          }));
        } catch {
          // Se falhar refresh, mantém store atual.
        }
      }

      try {
        const regras = await listRegrasRecorrenciaContaPagarApi({
          tenantId,
          status: "TODAS",
          page: 0,
          size: 200,
        });
        setStore((s) => ({
          ...s,
          regrasRecorrenciaContaPagar: [
            ...regras,
            ...(s.regrasRecorrenciaContaPagar ?? []).filter((rule) => rule.tenantId !== tenantId),
          ],
        }));
      } catch {
        // Refresh de regras é opcional.
      }
      return created;
    } catch (error) {
      console.warn("[contas-pagar][api-fallback] Falha ao criar conta na API real. Gravando localmente.", error);
    }
  }

  let createdConta: ContaPagar | null = null;
  setStore((s) => {
    const contas = [...(s.contasPagar ?? [])];
    const regras = [...(s.regrasRecorrenciaContaPagar ?? [])];

    let regraId: string | undefined;
    if (recorrencia) {
      regraId = genId();
      const tipoContaId = tipoConta.id;
      const regra: RegraRecorrenciaContaPagar = {
        id: regraId,
        tenantId,
        tipoContaId,
        fornecedor: input.fornecedor.trim(),
        documentoFornecedor: input.documentoFornecedor?.trim() || undefined,
        descricao: input.descricao.trim(),
        categoriaOperacional: resolved.categoria,
        grupoDre: resolved.grupoDre,
        centroCusto: resolved.centroCusto,
        valorOriginal: total,
        desconto,
        jurosMulta,
        recorrencia: recorrencia.tipo,
        intervaloDias:
          recorrencia.tipo === "INTERVALO_DIAS"
            ? Math.max(1, Number(recorrencia.intervaloDias ?? 30))
            : undefined,
        diaDoMes:
          recorrencia.tipo === "MENSAL"
            ? Math.max(
                1,
                Math.min(
                  31,
                  Number(recorrencia.diaDoMes ?? parseDate(input.dataVencimento).getDate())
                )
              )
            : undefined,
        dataInicial: recorrencia.dataInicial,
        termino: recorrencia.termino,
        dataFim: recorrencia.termino === "EM_DATA" ? recorrencia.dataFim : undefined,
        numeroOcorrencias:
          recorrencia.termino === "APOS_OCORRENCIAS"
            ? Math.max(1, Number(recorrencia.numeroOcorrencias ?? 1))
            : undefined,
        criarLancamentoInicial: recorrencia.criarLancamentoInicial,
        timezone: recorrencia.timezone ?? "America/Sao_Paulo",
        status: "ATIVA",
        dataCriacao: now(),
      };
      regras.unshift(regra);

      if (recorrencia.criarLancamentoInicial) {
        const conta: ContaPagar = {
          id: genId(),
          tenantId,
          tipoContaId: tipoConta.id,
          fornecedor: input.fornecedor.trim(),
          documentoFornecedor: input.documentoFornecedor?.trim() || undefined,
          descricao: input.descricao.trim(),
          categoria: resolved.categoria,
          grupoDre: resolved.grupoDre,
          centroCusto: resolved.centroCusto,
          regime: input.regime ?? "FIXA",
          competencia: input.competencia,
          dataEmissao: input.dataEmissao,
          dataVencimento: input.dataVencimento,
          valorOriginal: total,
          desconto,
          jurosMulta,
          status: "PENDENTE",
          regraRecorrenciaId: regraId,
          origemLancamento: "RECORRENTE",
          geradaAutomaticamente: false,
          observacoes: input.observacoes?.trim() || undefined,
          dataCriacao: now(),
        };
        contas.unshift(conta);
        createdConta = conta;
      }
    } else {
      const conta: ContaPagar = {
        id: genId(),
        tenantId,
        tipoContaId: tipoConta.id,
        fornecedor: input.fornecedor.trim(),
        documentoFornecedor: input.documentoFornecedor?.trim() || undefined,
        descricao: input.descricao.trim(),
        categoria: resolved.categoria,
        grupoDre: resolved.grupoDre,
        centroCusto: resolved.centroCusto,
        regime: input.regime ?? "AVULSA",
        competencia: input.competencia,
        dataEmissao: input.dataEmissao,
        dataVencimento: input.dataVencimento,
        valorOriginal: total,
        desconto,
        jurosMulta,
        status: "PENDENTE",
        origemLancamento: "MANUAL",
        observacoes: input.observacoes?.trim() || undefined,
        dataCriacao: now(),
      };
      contas.unshift(conta);
      createdConta = conta;
    }

    return {
      ...s,
      contasPagar: contas,
      regrasRecorrenciaContaPagar: regras,
    };
  });
  return createdConta;
}

export async function updateContaPagar(
  id: string,
  data: Partial<Omit<ContaPagar, "id" | "tenantId" | "dataCriacao">>
): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const updated = await updateContaPagarApi({
        tenantId,
        id,
        data,
      });
      setStore((s) => ({
        ...s,
        contasPagar: (s.contasPagar ?? []).map((conta) =>
          conta.id === updated.id ? updated : conta
        ),
      }));
      return;
    } catch (error) {
      console.warn("[contas-pagar][api-fallback] Falha ao atualizar conta na API real. Aplicando update local.", error);
    }
  }
  requireTenantScopedEntity(getStore().contasPagar ?? [], id, tenantId, "Conta a pagar não encontrada");
  setStore((s) => ({
    ...s,
    contasPagar: (s.contasPagar ?? []).map((c) =>
      c.id === id && c.tenantId === tenantId ? { ...c, ...data, dataAtualizacao: now() } : c
    ),
  }));
}

export async function pagarContaPagar(id: string, input: PagarContaPagarInput): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (!input.formaPagamento) {
    throw new Error("Forma de pagamento é obrigatória para baixar a conta.");
  }
  if (isRealApiEnabled()) {
    try {
      const updated = await pagarContaPagarApi({
        tenantId,
        id,
        data: {
          dataPagamento: input.dataPagamento,
          formaPagamento: input.formaPagamento,
          valorPago: input.valorPago,
          observacoes: input.observacoes,
        },
      });
      setStore((s) => ({
        ...s,
        contasPagar: (s.contasPagar ?? []).map((conta) =>
          conta.id === updated.id ? updated : conta
        ),
      }));
      return;
    } catch (error) {
      console.warn("[contas-pagar][api-fallback] Falha ao pagar conta na API real. Aplicando baixa local.", error);
    }
  }
  requireTenantScopedEntity(getStore().contasPagar ?? [], id, tenantId, "Conta a pagar não encontrada");
  setStore((s) => ({
    ...s,
    contasPagar: (s.contasPagar ?? []).map((c) => {
      if (c.id !== id || c.tenantId !== tenantId) return c;
      const liquid = contaPagarTotal(c);
      return {
        ...c,
        status: "PAGA" as const,
        dataPagamento: input.dataPagamento,
        formaPagamento: input.formaPagamento,
        valorPago: input.valorPago != null ? Math.max(0, Number(input.valorPago)) : liquid,
        observacoes: input.observacoes ?? c.observacoes,
        dataAtualizacao: now(),
      };
    }),
  }));
}

export async function cancelarContaPagar(id: string, observacoes?: string): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const updated = await cancelarContaPagarApi({
        tenantId,
        id,
        observacoes,
      });
      setStore((s) => ({
        ...s,
        contasPagar: (s.contasPagar ?? []).map((conta) =>
          conta.id === updated.id ? updated : conta
        ),
      }));
      return;
    } catch (error) {
      console.warn("[contas-pagar][api-fallback] Falha ao cancelar conta na API real. Aplicando cancelamento local.", error);
    }
  }
  requireTenantScopedEntity(getStore().contasPagar ?? [], id, tenantId, "Conta a pagar não encontrada");
  setStore((s) => ({
    ...s,
    contasPagar: (s.contasPagar ?? []).map((c) =>
      c.id === id && c.tenantId === tenantId
        ? {
            ...c,
            status: "CANCELADA" as const,
            observacoes: observacoes ?? c.observacoes,
            dataAtualizacao: now(),
          }
        : c
    ),
  }));
}

// ─── DRE GERENCIAL ─────────────────────────────────────────────────────────

export async function getDreGerencial(params?: {
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}): Promise<DREGerencial> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      return await getDreGerencialApi({
        tenantId,
        month: params?.month,
        year: params?.year,
        startDate: params?.startDate,
        endDate: params?.endDate,
      });
    } catch (error) {
      console.warn("[dre][api-fallback] Falha ao carregar DRE na API real. Usando cálculo local.", error);
    }
  }
  const store = getStore();
  const month = params?.month ?? new Date().getMonth();
  const year = params?.year ?? new Date().getFullYear();
  const range = params?.startDate && params?.endDate
    ? { start: params.startDate, end: params.endDate }
    : monthDateRange(month, year);
  const start = range.start;
  const end = range.end;

  const recebimentosPagos = store.pagamentos.filter(
    (p) => p.tenantId === tenantId && p.status === "PAGO" && inDateRange(p.dataPagamento, start, end)
  );
  const receitaBruta = recebimentosPagos.reduce((sum, p) => sum + Number(p.valor ?? 0), 0);
  const deducoesReceita = recebimentosPagos.reduce((sum, p) => sum + Number(p.desconto ?? 0), 0);
  const receitaLiquida = recebimentosPagos.reduce((sum, p) => sum + Number(p.valorFinal ?? 0), 0);

  const despesasPagas = (store.contasPagar ?? []).filter(
    (c) => c.tenantId === tenantId && c.status === "PAGA" && inDateRange(c.dataPagamento, start, end)
  );
  const tiposContaMap = new Map(
    (store.tiposContaPagar ?? [])
      .filter((tipo) => tipo.tenantId === tenantId)
      .map((tipo) => [tipo.id, tipo])
  );
  const despesasPorGrupoMap = new Map<GrupoDre, number>();
  let despesasSemTipoCount = 0;
  let despesasSemTipoValor = 0;

  for (const conta of despesasPagas) {
    const valor = Number(conta.valorPago ?? contaPagarTotal(conta));
    const tipoConta = conta.tipoContaId ? tiposContaMap.get(conta.tipoContaId) : undefined;
    const grupo = conta.grupoDre ?? tipoConta?.grupoDre ?? "DESPESA_OPERACIONAL";
    despesasPorGrupoMap.set(grupo, (despesasPorGrupoMap.get(grupo) ?? 0) + valor);

    if (!conta.tipoContaId || !tipoConta) {
      despesasSemTipoCount += 1;
      despesasSemTipoValor += valor;
    }
  }

  const custosVariaveis = despesasPorGrupoMap.get("CUSTO_VARIAVEL") ?? 0;
  const despesasOperacionais =
    (despesasPorGrupoMap.get("DESPESA_OPERACIONAL") ?? 0) +
    (despesasPorGrupoMap.get("DESPESA_FINANCEIRA") ?? 0) +
    (despesasPorGrupoMap.get("IMPOSTOS") ?? 0);
  const margemContribuicao = receitaLiquida - custosVariaveis;
  const ebitda = margemContribuicao - despesasOperacionais;
  const resultadoLiquido = ebitda;
  const ticketMedio = recebimentosPagos.length ? receitaLiquida / recebimentosPagos.length : 0;

  const inadimplencia = store.pagamentos
    .filter(
      (p) => p.tenantId === tenantId && p.status === "VENCIDO" && inDateRange(p.dataVencimento, start, end)
    )
    .reduce((sum, p) => sum + Number(p.valorFinal ?? 0), 0);

  const contasReceberEmAberto = store.pagamentos
    .filter(
      (p) =>
        p.tenantId === tenantId &&
        (p.status === "PENDENTE" || p.status === "VENCIDO") &&
        inDateRange(p.dataVencimento, start, end)
    )
    .reduce((sum, p) => sum + Number(p.valorFinal ?? 0), 0);

  const contasPagarEmAberto = (store.contasPagar ?? [])
    .filter(
      (c) =>
        c.tenantId === tenantId &&
        (c.status === "PENDENTE" || c.status === "VENCIDA") &&
        inDateRange(c.dataVencimento, start, end)
    )
    .reduce((sum, c) => sum + contaPagarTotal(c), 0);

  const despesasPorCategoriaMap = new Map<CategoriaContaPagar, number>();
  for (const conta of despesasPagas) {
    const value = Number(conta.valorPago ?? contaPagarTotal(conta));
    despesasPorCategoriaMap.set(
      conta.categoria,
      (despesasPorCategoriaMap.get(conta.categoria) ?? 0) + value
    );
  }

  const despesasPorCategoria = Array.from(despesasPorCategoriaMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const despesasPorGrupo = Array.from(despesasPorGrupoMap.entries())
    .map(([grupo, valor]) => ({ grupo, valor }))
    .sort((a, b) => b.valor - a.valor);

  return {
    periodoInicio: start,
    periodoFim: end,
    receitaBruta,
    deducoesReceita,
    receitaLiquida,
    custosVariaveis,
    margemContribuicao,
    despesasOperacionais,
    ebitda,
    resultadoLiquido,
    ticketMedio,
    inadimplencia,
    contasReceberEmAberto,
    contasPagarEmAberto,
    despesasPorGrupo,
    despesasPorCategoria,
    despesasSemTipoCount,
    despesasSemTipoValor,
  };
}

export async function getDreProjecao(params?: {
  startDate?: string;
  endDate?: string;
  cenario?: DreProjectionScenario;
}): Promise<DREProjecao> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      return await getDreProjecaoApi({
        tenantId,
        startDate: params?.startDate,
        endDate: params?.endDate,
        cenario: params?.cenario,
      });
    } catch (error) {
      console.warn("[dre][api-fallback] Falha ao carregar projeção DRE na API real. Usando fallback local.", error);
    }
  }

  const dreAtual = await getDreGerencial({
    startDate: params?.startDate,
    endDate: params?.endDate,
  });

  const receitasProjetadas = Math.max(0, Number(dreAtual.contasReceberEmAberto ?? 0));
  const despesasProjetadas = Math.max(0, Number(dreAtual.contasPagarEmAberto ?? 0));
  const resultadoProjetado = receitasProjetadas - despesasProjetadas;
  const realizado = {
    receitas: Number(dreAtual.receitaLiquida ?? 0),
    despesas: Number(dreAtual.custosVariaveis ?? 0) + Number(dreAtual.despesasOperacionais ?? 0),
    resultado: Number(dreAtual.resultadoLiquido ?? 0),
    custosVariaveis: Number(dreAtual.custosVariaveis ?? 0),
    despesasOperacionais: Number(dreAtual.despesasOperacionais ?? 0),
    despesasFinanceiras: 0,
    impostos: 0,
  };
  const projetado = {
    receitas: receitasProjetadas,
    despesas: despesasProjetadas,
    resultado: resultadoProjetado,
    custosVariaveis: despesasProjetadas,
    despesasOperacionais: 0,
    despesasFinanceiras: 0,
    impostos: 0,
  };

  return {
    periodoInicio: params?.startDate ?? dreAtual.periodoInicio,
    periodoFim: params?.endDate ?? dreAtual.periodoFim,
    cenario: params?.cenario ?? "BASE",
    realizado,
    projetado,
    consolidado: {
      receitas: realizado.receitas + projetado.receitas,
      despesas: realizado.despesas + projetado.despesas,
      resultado: realizado.resultado + projetado.resultado,
      custosVariaveis: realizado.custosVariaveis + projetado.custosVariaveis,
      despesasOperacionais: realizado.despesasOperacionais + projetado.despesasOperacionais,
      despesasFinanceiras: realizado.despesasFinanceiras + projetado.despesasFinanceiras,
      impostos: realizado.impostos + projetado.impostos,
    },
    linhas: [
      {
        grupo: "RECEITAS",
        natureza: "RECEITA",
        realizado: realizado.receitas,
        projetado: projetado.receitas,
        consolidado: realizado.receitas + projetado.receitas,
      },
      {
        grupo: "DESPESAS",
        natureza: "DESPESA",
        realizado: realizado.despesas,
        projetado: projetado.despesas,
        consolidado: realizado.despesas + projetado.despesas,
      },
      {
        grupo: "RESULTADO",
        natureza: "RECEITA",
        realizado: realizado.resultado,
        projetado: projetado.resultado,
        consolidado: realizado.resultado + projetado.resultado,
      },
    ],
  };
}

// ─── FORMAS DE PAGAMENTO ────────────────────────────────────────────────────

function makeDefaultFormasPagamento(tenantId: string): FormaPagamento[] {
  return [
    {
      id: getDefaultFormaPagamentoId(tenantId, "DINHEIRO"),
      tenantId,
      nome: "Dinheiro",
      tipo: "DINHEIRO",
      taxaPercentual: 0,
      parcelasMax: 1,
      emitirAutomaticamente: false,
      ativo: true,
    },
    {
      id: getDefaultFormaPagamentoId(tenantId, "PIX"),
      tenantId,
      nome: "PIX",
      tipo: "PIX",
      taxaPercentual: 0,
      parcelasMax: 1,
      emitirAutomaticamente: false,
      ativo: true,
    },
    {
      id: getDefaultFormaPagamentoId(tenantId, "CARTAO_CREDITO"),
      tenantId,
      nome: "Cartão de Crédito",
      tipo: "CARTAO_CREDITO",
      taxaPercentual: 2.99,
      parcelasMax: 12,
      emitirAutomaticamente: false,
      ativo: true,
    },
  ];
}

const DEFAULT_FORMA_PAGAMENTO_LABELS: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

export async function listFormasPagamento(params?: {
  apenasAtivas?: boolean;
}): Promise<FormaPagamento[]> {
  const tenantId = getCurrentTenantId();
  const only = params?.apenasAtivas ?? true;
  if (isRealApiEnabled()) {
    try {
      const synced = await listFormasPagamentoApi({
        tenantId,
        apenasAtivas: false,
      });
      setStore((s) => ({
        ...s,
        formasPagamento: mergeTenantScopedData(s.formasPagamento ?? [], synced),
      }));
      const filteredSynced = only ? synced.filter((f) => f.ativo) : synced;
      if (filteredSynced.length > 0) return filteredSynced;
      const fallbackDefaults = makeDefaultFormasPagamento(tenantId);
      setStore((s) => ({
        ...s,
        formasPagamento: mergeTenantScopedData(s.formasPagamento ?? [], fallbackDefaults),
      }));
      return only ? fallbackDefaults.filter((f) => f.ativo) : fallbackDefaults;
    } catch (error) {
      console.warn("[formas-pagamento][api-fallback] Falha ao listar na API real. Usando cache local.", error);
    }
  }
  let formas = getStore().formasPagamento.filter((f) => f.tenantId === tenantId);
  if (formas.length === 0) {
    const defaults = makeDefaultFormasPagamento(tenantId);
    setStore((s) => ({
      ...s,
      formasPagamento: mergeTenantScopedData(s.formasPagamento ?? [], defaults),
    }));
    formas = getStore().formasPagamento.filter((f) => f.tenantId === tenantId);
  }
  return only ? formas.filter((f) => f.ativo) : formas;
}

export async function createFormaPagamento(
  data: Omit<FormaPagamento, "id" | "tenantId" | "ativo">
): Promise<FormaPagamento> {
  const tenantId = getCurrentTenantId();
  const normalizedInput = normalizeFormaPagamentoCreateInput(data);
  if (isRealApiEnabled()) {
    try {
      const created = await createFormaPagamentoApi({
        tenantId,
        data: normalizedInput,
      });
      setStore((s) => ({
        ...s,
        formasPagamento: [
          created,
          ...(s.formasPagamento ?? []).filter((forma) => forma.id !== created.id),
        ],
      }));
      return created;
    } catch (error) {
      console.warn("[formas-pagamento][api-fallback] Falha ao criar na API real. Gravando localmente.", error);
    }
  }
  const fp: FormaPagamento = {
    ...normalizedInput,
    id: genId(),
    tenantId,
    ativo: true,
  };
  setStore((s) => ({ ...s, formasPagamento: [fp, ...s.formasPagamento] }));
  return fp;
}

export async function updateFormaPagamento(
  id: string,
  data: Partial<Omit<FormaPagamento, "id" | "tenantId">>
): Promise<void> {
  const tenantId = getCurrentTenantId();
  const current = getStore().formasPagamento.find((forma) => forma.id === id && forma.tenantId === tenantId);
  const normalizedInput = normalizeFormaPagamentoUpdateInput(current, data);
  if (isRealApiEnabled()) {
    try {
      const updated = await updateFormaPagamentoApi({
        tenantId,
        id,
        data: normalizedInput,
      });
      setStore((s) => ({
        ...s,
        formasPagamento: (s.formasPagamento ?? []).map((forma) =>
          forma.id === updated.id ? updated : forma
        ),
      }));
      return;
    } catch (error) {
      console.warn("[formas-pagamento][api-fallback] Falha ao atualizar na API real. Aplicando update local.", error);
    }
  }
  requireTenantScopedEntity(getStore().formasPagamento, id, tenantId, "Forma de pagamento não encontrada");
  setStore((s) => ({
    ...s,
    formasPagamento: s.formasPagamento.map((f) =>
      f.id === id && f.tenantId === tenantId ? { ...f, ...normalizedInput } : f
    ),
  }));
}

export async function toggleFormaPagamento(id: string): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const toggled = await toggleFormaPagamentoApi({
        tenantId,
        id,
      });
      setStore((s) => ({
        ...s,
        formasPagamento: (s.formasPagamento ?? []).map((forma) =>
          forma.id === toggled.id ? toggled : forma
        ),
      }));
      return;
    } catch (error) {
      console.warn("[formas-pagamento][api-fallback] Falha ao alternar na API real. Aplicando toggle local.", error);
    }
  }
  requireTenantScopedEntity(getStore().formasPagamento, id, tenantId, "Forma de pagamento não encontrada");
  setStore((s) => ({
    ...s,
    formasPagamento: s.formasPagamento.map((f) =>
      f.id === id && f.tenantId === tenantId ? { ...f, ativo: !f.ativo } : f
    ),
  }));
}

export async function deleteFormaPagamento(id: string): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      await deleteFormaPagamentoApi({
        tenantId,
        id,
      });
      setStore((s) => ({
        ...s,
        formasPagamento: s.formasPagamento.filter((f) => !(f.id === id && f.tenantId === tenantId)),
      }));
      return;
    } catch (error) {
      console.warn("[formas-pagamento][api-fallback] Falha ao excluir na API real. Aplicando remoção local.", error);
    }
  }
  requireTenantScopedEntity(getStore().formasPagamento, id, tenantId, "Forma de pagamento não encontrada");
  setStore((s) => ({
    ...s,
    formasPagamento: s.formasPagamento.filter((f) => !(f.id === id && f.tenantId === tenantId)),
  }));
}

export async function getFormasPagamentoLabels(): Promise<
  Record<TipoFormaPagamento, string>
> {
  if (isRealApiEnabled()) {
    try {
      const labels = await getFormasPagamentoLabelsApi();
      return {
        ...DEFAULT_FORMA_PAGAMENTO_LABELS,
        ...labels,
      };
    } catch (error) {
      console.warn("[formas-pagamento][api-fallback] Falha ao obter labels na API real. Usando labels locais.", error);
    }
  }
  return DEFAULT_FORMA_PAGAMENTO_LABELS;
}
