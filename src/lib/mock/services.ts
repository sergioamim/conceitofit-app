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
  CampanhaCanal,
  CampanhaPublicoAlvo,
  CampanhaStatus,
  CategoriaContaPagar,
  StatusContaPagar,
  DREGerencial,
  GrupoDre,
  TipoContaPagar,
  RegraRecorrenciaContaPagar,
  RecorrenciaContaPagar,
  TerminoRecorrenciaContaPagar,
  PaginatedResult,
} from "../types";
import { isRealApiEnabled } from "../api/http";
import { loginApi, meApi, refreshTokenApi, switchTenantApi, type AuthUser } from "../api/auth";
import { clearAuthSession, getActiveTenantIdFromSession, getRefreshToken, setMockSessionActive } from "../api/session";
import {
  createTipoContaPagarApi,
  listTiposContaPagarApi,
  toggleTipoContaPagarApi,
  updateTipoContaPagarApi,
} from "../api/tipos-conta";
import {
  createFormaPagamentoApi,
  deleteFormaPagamentoApi,
  getFormasPagamentoLabelsApi,
  listFormasPagamentoApi,
  toggleFormaPagamentoApi,
  updateFormaPagamentoApi,
} from "../api/formas-pagamento";
import {
  createUnidadeApi,
  deleteUnidadeApi,
  getAcademiaAtualApi,
  getTenantAtualApi,
  listAcademiasApi,
  listHorariosApi,
  listUnidadesApi,
  setTenantContextApi,
  toggleUnidadeApi,
  updateAcademiaAtualApi,
  updateHorariosApi,
  updateTenantAtualApi,
  updateUnidadeApi,
} from "../api/contexto-unidades";
import {
  addProspectMensagemApi,
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
import {
  createAlunoApi,
  createAlunoComMatriculaApi,
  getAlunoApi,
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

function getCurrentTenantId(): string {
  const store = getStore();
  return store.currentTenantId ?? store.tenant.id ?? TENANT_ID_DEFAULT;
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

let tenantContextHydratedFromApi = false;

function syncTenantContextInStore(input: {
  currentTenantId: string;
  tenantAtual: Tenant;
  unidadesDisponiveis: Tenant[];
}): void {
  tenantContextHydratedFromApi = true;
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
  const tenantFromToken = getActiveTenantIdFromSession();
  if (tenantFromToken) {
    setStore((s) => ({
      ...s,
      currentTenantId: tenantFromToken,
      tenant: s.tenants.find((item) => item.id === tenantFromToken) ?? s.tenant,
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
}

export async function authMe(): Promise<AuthUser | undefined> {
  if (!isRealApiEnabled()) return undefined;
  return meApi();
}

export async function authLogout(): Promise<void> {
  clearAuthSession();
}

export async function listTenants(): Promise<Tenant[]> {
  if (isRealApiEnabled()) {
    try {
      const tenants = await listUnidadesApi();
      tenantContextHydratedFromApi = true;
      setStore((s) => {
        if (areSameTenantList(s.tenants, tenants)) return s;
        return {
          ...s,
          tenants,
        };
      });
      return tenants;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao listar unidades na API real.", error);
      if (tenantContextHydratedFromApi) {
        return getStore().tenants.filter((t) => t.ativo !== false);
      }
      return [];
    }
  }
  const store = getStore();
  const academiaId = getCurrentAcademiaId();
  if (!academiaId) {
    return store.tenants.filter((t) => t.id === getCurrentTenantId());
  }
  return store.tenants.filter((t) => (t.academiaId ?? t.groupId) === academiaId);
}

export async function getCurrentTenant(): Promise<Tenant> {
  if (isRealApiEnabled()) {
    try {
      const tenant = await getTenantAtualApi();
      tenantContextHydratedFromApi = true;
      setStore((s) => {
        const found = s.tenants.some((item) => item.id === tenant.id);
        const nextTenants = found
          ? s.tenants.map((item) => (item.id === tenant.id ? tenant : item))
          : [...s.tenants, tenant];
        const tenantsChanged = !areSameTenantList(s.tenants, nextTenants);
        const tenantChanged = !areSameTenant(s.tenant, tenant);
        const currentChanged = s.currentTenantId !== tenant.id;
        if (!tenantsChanged && !tenantChanged && !currentChanged) return s;
        return {
          ...s,
          tenant,
          currentTenantId: tenant.id,
          tenants: tenantsChanged ? nextTenants : s.tenants,
        };
      });
      return tenant;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao obter unidade atual na API real.", error);
      if (!tenantContextHydratedFromApi) {
        throw error instanceof Error ? error : new Error("Falha ao obter unidade atual");
      }
    }
  }
  const store = getStore();
  return store.tenants.find((t) => t.id === store.currentTenantId) ?? store.tenant;
}

export async function setCurrentTenant(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await switchTenantApi(id);
      const context = await setTenantContextApi(id);
      syncTenantContextInStore(context);
      return;
    } catch (error) {
      try {
        const context = await setTenantContextApi(id);
        syncTenantContextInStore(context);
        return;
      } catch (contextError) {
        console.warn(
          "[contexto-unidades][api-fallback] Falha ao trocar unidade na API real (auth/context). Aplicando troca local.",
          { authSwitchError: error, contextSwitchError: contextError }
        );
      }
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

function normalizeProspectFromApi(prospect: Prospect): Prospect {
  const createdAt = prospect.dataCriacao ?? now();
  const statusLog = prospect.statusLog ?? [{ status: prospect.status, data: createdAt }];
  return {
    ...prospect,
    dataCriacao: createdAt,
    statusLog,
  };
}

export async function listProspects(params?: {
  status?: StatusProspect;
}): Promise<Prospect[]> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = getCurrentTenantId();
      const prospects = await listProspectsApi({
        tenantId,
        status: params?.status,
      });
      const normalized = prospects.map(normalizeProspectFromApi);
      setStore((s) => ({
        ...s,
        prospects: [
          ...normalized,
          ...s.prospects.filter((item) => !normalized.some((p) => p.id === item.id)),
        ],
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
      const tenantId = getCurrentTenantId();
      const prospects = await listProspectsApi({
        tenantId,
        status: params.status,
        page: page - 1,
        size,
      });
      const normalized = prospects.map(normalizeProspectFromApi);
      setStore((s) => ({
        ...s,
        prospects: [
          ...normalized,
          ...s.prospects.filter((item) => !normalized.some((p) => p.id === item.id)),
        ],
      }));
      return {
        items: normalized,
        page,
        size,
        hasNext: normalized.length >= size,
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
  if (isRealApiEnabled()) {
    try {
      await updateProspectApi({
        tenantId: getCurrentTenantId(),
        id,
        data,
      });
      setStore((s) => ({
        ...s,
        prospects: s.prospects.map((p) => (p.id === id ? { ...p, ...data } : p)),
      }));
      return;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao atualizar prospect na API real. Aplicando update local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    prospects: s.prospects.map((p) =>
      p.id === id ? { ...p, ...data } : p
    ),
  }));
}

export async function getProspect(id: string): Promise<Prospect | null> {
  if (isRealApiEnabled()) {
    try {
      const prospect = await getProspectApi({
        tenantId: getCurrentTenantId(),
        id,
      });
      const normalized = normalizeProspectFromApi(prospect);
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
  if (isRealApiEnabled()) {
    try {
      const created = normalizeProspectFromApi(
        await createProspectApi({
          tenantId: getCurrentTenantId(),
          data,
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
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
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
  if (isRealApiEnabled()) {
    try {
      await updateProspectStatusApi({
        tenantId: getCurrentTenantId(),
        id,
        status,
      });
      const at = now();
      setStore((s) => ({
        ...s,
        prospects: s.prospects.map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                dataUltimoContato: at,
                statusLog: [...(p.statusLog ?? []), { status, data: at }],
              }
            : p
        ),
      }));
      return;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao atualizar status do prospect na API real. Aplicando update local.", error);
    }
  }
  const at = now();
  setStore((s) => ({
    ...s,
    prospects: s.prospects.map((p) =>
      p.id === id
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
  if (isRealApiEnabled()) {
    try {
      await marcarProspectPerdidoApi({
        tenantId: getCurrentTenantId(),
        id,
        motivo,
      });
      const at = now();
      setStore((s) => ({
        ...s,
        prospects: s.prospects.map((p) =>
          p.id === id
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
      return;
    } catch (error) {
      console.warn("[crm][api-fallback] Falha ao marcar prospect como perdido na API real. Aplicando update local.", error);
    }
  }
  const at = now();
  setStore((s) => ({
    ...s,
    prospects: s.prospects.map((p) =>
      p.id === id
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
      return await checkProspectDuplicateApi({
        tenantId: getCurrentTenantId(),
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
      tel && p.telefone?.replace(/\D/g, "").includes(tel);
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
      const converted = await converterProspectApi({
        tenantId: getCurrentTenantId(),
        data,
      });
      setStore((s) => ({
        ...s,
        alunos: [converted.aluno, ...s.alunos.filter((a) => a.id !== converted.aluno.id)],
        matriculas: [converted.matricula, ...s.matriculas.filter((m) => m.id !== converted.matricula.id)],
        pagamentos: [converted.pagamento, ...s.pagamentos.filter((p) => p.id !== converted.pagamento.id)],
        prospects: s.prospects.map((p) =>
          p.id === data.prospectId ? { ...p, status: "CONVERTIDO", dataUltimoContato: now() } : p
        ),
      }));
      return converted;
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
      setStore((s) => ({
        ...s,
        alunos: [created, ...s.alunos.filter((item) => item.id !== created.id)],
      }));
      return created;
    } catch (error) {
      console.warn("[alunos][api-fallback] Falha ao criar aluno na API real. Aplicando criação local.", error);
    }
  }
  const alunoId = genId();
  const aluno: Aluno = {
    id: alunoId,
    tenantId: getCurrentTenantId(),
    nome: data.nome,
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
      setStore((s) => ({
        ...s,
        alunos: [created.aluno, ...s.alunos.filter((item) => item.id !== created.aluno.id)],
        matriculas: [created.matricula, ...s.matriculas.filter((item) => item.id !== created.matricula.id)],
        pagamentos: [created.pagamento, ...s.pagamentos.filter((item) => item.id !== created.pagamento.id)],
      }));
      syncAlunosStatus();
      return created;
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
  if (isRealApiEnabled()) {
    try {
      const tenant = await getTenantAtualApi();
      setStore((s) => ({
        ...s,
        tenant,
        currentTenantId: tenant.id,
        tenants: s.tenants.map((item) => (item.id === tenant.id ? tenant : item)),
      }));
      return tenant;
    } catch (error) {
      console.warn("[contexto-unidades][api-fallback] Falha ao obter tenant na API real. Usando store local.", error);
    }
  }
  const store = getStore();
  return store.tenants.find((t) => t.id === store.currentTenantId) ?? store.tenant;
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

export async function listAlunos(params?: {
  status?: StatusAluno;
}): Promise<Aluno[]> {
  if (isRealApiEnabled()) {
    try {
      const tenantId = getCurrentTenantId();
      const alunos = await listAlunosApi({
        tenantId,
        status: params?.status,
      });
      setStore((s) => ({
        ...s,
        alunos: [
          ...alunos,
          ...s.alunos.filter((item) => !alunos.some((a) => a.id === item.id)),
        ],
      }));
      return alunos;
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
}): Promise<PaginatedResult<Aluno>> {
  const page = Math.max(1, params.page);
  const size = Math.min(200, Math.max(1, params.size));
  if (isRealApiEnabled()) {
    try {
      const tenantId = getCurrentTenantId();
      const alunos = await listAlunosApi({
        tenantId,
        status: params.status,
        page: page - 1,
        size,
      });
      setStore((s) => ({
        ...s,
        alunos: [
          ...alunos,
          ...s.alunos.filter((item) => !alunos.some((a) => a.id === item.id)),
        ],
      }));
      return {
        items: alunos,
        page,
        size,
        hasNext: alunos.length >= size,
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

export async function getAluno(id: string): Promise<Aluno | null> {
  if (isRealApiEnabled()) {
    try {
      const aluno = await getAlunoApi({
        tenantId: getCurrentTenantId(),
        id,
      });
      setStore((s) => ({
        ...s,
        alunos: [aluno, ...s.alunos.filter((item) => item.id !== aluno.id)],
      }));
      return aluno;
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
  if (isRealApiEnabled()) {
    try {
      const updated = await updateAlunoApi({
        tenantId: getCurrentTenantId(),
        id,
        data,
      });
      setStore((s) => ({
        ...s,
        alunos: s.alunos.map((a) => (a.id === id ? { ...a, ...updated } : a)),
      }));
      return updated;
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

export async function listVendas(): Promise<Venda[]> {
  const tenantId = getCurrentTenantId();
  return [...getStore().vendas].reverse().filter((v) => v.tenantId === tenantId);
}

export async function createVenda(input: CreateVendaInput): Promise<Venda> {
  const requiresCliente = input.itens.some((item) => item.tipo === "PLANO" || item.tipo === "SERVICO");
  if (requiresCliente && !input.clienteId) {
    throw new Error("Cliente é obrigatório para venda de plano/serviço.");
  }

  const store = getStore();
  const cliente = input.clienteId ? store.alunos.find((a) => a.id === input.clienteId) : undefined;

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
      const atividades = await listAtividadesApi(params);
      setStore((s) => ({
        ...s,
        atividades: [
          ...atividades,
          ...s.atividades.filter((item) => !atividades.some((a) => a.id === item.id)),
        ],
      }));
      return atividades;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao listar atividades na API real. Usando store local.", error);
    }
  }
  const tenantId = getCurrentTenantId();
  const { atividades } = getStore();
  let all = [...atividades].reverse().filter((a) => a.tenantId === tenantId);
  if (params?.apenasAtivas) all = all.filter((a) => a.ativo);
  if (params?.categoria) all = all.filter((a) => a.categoria === params.categoria);
  return all;
}

export async function createAtividade(
  data: Omit<Atividade, "id" | "tenantId" | "ativo">
): Promise<Atividade> {
  if (isRealApiEnabled()) {
    try {
      const created = await createAtividadeApi(data);
      setStore((s) => ({ ...s, atividades: [created, ...s.atividades.filter((item) => item.id !== created.id)] }));
      return created;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao criar atividade na API real. Aplicando criação local.", error);
    }
  }
  const normalized = normalizeAtividadeCheckinRules(data);
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
  if (isRealApiEnabled()) {
    try {
      const updated = await updateAtividadeApi(id, data);
      setStore((s) => ({
        ...s,
        atividades: s.atividades.map((a) => (a.id === id ? { ...a, ...updated } : a)),
      }));
      return;
    } catch (error) {
      console.warn("[administrativo][api-fallback] Falha ao atualizar atividade na API real. Aplicando update local.", error);
    }
  }
  const current = getStore().atividades.find((a) => a.id === id);
  if (!current) return;
  const normalized = normalizeAtividadeCheckinRules({ ...current, ...data });
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
      const toggled = await toggleAtividadeApi(id);
      setStore((s) => ({
        ...s,
        atividades: s.atividades.map((a) => (a.id === id ? { ...a, ...toggled } : a)),
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
      await deleteAtividadeApi(id);
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

// ─── ATIVIDADES · GRADE ───────────────────────────────────────────────────

export async function listAtividadeGrades(params?: {
  atividadeId?: string;
  apenasAtivas?: boolean;
}): Promise<AtividadeGrade[]> {
  if (isRealApiEnabled()) {
    try {
      const grades = await listAtividadeGradesApi(params);
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

export async function listPlanos(): Promise<Plano[]> {
  if (isRealApiEnabled()) {
    try {
      const planos = await listPlanosApi();
      setStore((s) => ({
        ...s,
        planos: [...planos, ...s.planos.filter((item) => !planos.some((p) => p.id === item.id))],
      }));
      return planos;
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
      return await getPlanoApi(id);
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
  if (isRealApiEnabled()) {
    try {
      const created = await createPlanoApi(data);
      setStore((s) => ({ ...s, planos: [created, ...s.planos.filter((item) => item.id !== created.id)] }));
      return created;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao criar plano na API real. Aplicando criação local.", error);
    }
  }
  const sanitized = sanitizePlanoRules(data);
  const plano: Plano = {
    ...sanitized,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, planos: [plano, ...s.planos] }));
  return plano;
}

export async function updatePlano(
  id: string,
  data: Partial<Omit<Plano, "id" | "tenantId">>
): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await updatePlanoApi(id, data);
      setStore((s) => ({
        ...s,
        planos: s.planos.map((p) => (p.id === id ? { ...p, ...data } : p)),
      }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao atualizar plano na API real. Aplicando update local.", error);
    }
  }
  const current = getStore().planos.find((p) => p.id === id);
  if (!current) return;
  const merged = { ...current, ...data };
  const sanitized = sanitizePlanoRules(merged);
  setStore((s) => ({
    ...s,
    planos: s.planos.map((p) => (p.id === id ? { ...p, ...sanitized } : p)),
  }));
}

export async function togglePlanoAtivo(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await togglePlanoAtivoApi(id);
      setStore((s) => ({
        ...s,
        planos: s.planos.map((p) =>
          p.id === id ? { ...p, ativo: !p.ativo } : p
        ),
      }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao alternar status do plano na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    planos: s.planos.map((p) =>
      p.id === id ? { ...p, ativo: !p.ativo } : p
    ),
  }));
}

export async function togglePlanoDestaque(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await togglePlanoDestaqueApi(id);
      setStore((s) => ({
        ...s,
        planos: s.planos.map((p) =>
          p.id === id ? { ...p, destaque: !p.destaque } : p
        ),
      }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao alternar destaque do plano na API real. Aplicando toggle local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    planos: s.planos.map((p) =>
      p.id === id ? { ...p, destaque: !p.destaque } : p
    ),
  }));
}

export async function deletePlano(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    try {
      await deletePlanoApi(id);
      setStore((s) => ({ ...s, planos: s.planos.filter((p) => p.id !== id) }));
      return;
    } catch (error) {
      console.warn("[catalogo][api-fallback] Falha ao remover plano na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    planos: s.planos.filter((p) => p.id !== id),
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
}): Promise<(Pagamento & { aluno?: Aluno })[]> {
  const tenantId = getCurrentTenantId();
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
  return pags.map((p) => ({
    ...p,
    aluno: updated.alunos.find((a) => a.id === p.alunoId),
  }));
}

export async function receberPagamento(
  id: string,
  data: ReceberPagamentoInput
): Promise<void> {
  setStore((s) => {
    const pagamentos = s.pagamentos.map((p) =>
      p.id === id
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
  await triggerGeracaoContasRecorrentes({ untilDate: params?.endDate ?? today() });
  const tenantId = getCurrentTenantId();
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
  setStore((s) => ({
    ...s,
    contasPagar: (s.contasPagar ?? []).map((c) =>
      c.id === id && c.tenantId === tenantId ? { ...c, ...data, dataAtualizacao: now() } : c
    ),
  }));
}

export async function pagarContaPagar(id: string, input: PagarContaPagarInput): Promise<void> {
  const tenantId = getCurrentTenantId();
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

// ─── FORMAS DE PAGAMENTO ────────────────────────────────────────────────────

function makeDefaultFormasPagamento(tenantId: string): FormaPagamento[] {
  return [
    {
      id: genId(),
      tenantId,
      nome: "Dinheiro",
      tipo: "DINHEIRO",
      taxaPercentual: 0,
      parcelasMax: 1,
      ativo: true,
    },
    {
      id: genId(),
      tenantId,
      nome: "PIX",
      tipo: "PIX",
      taxaPercentual: 0,
      parcelasMax: 1,
      ativo: true,
    },
    {
      id: genId(),
      tenantId,
      nome: "Cartão de Crédito",
      tipo: "CARTAO_CREDITO",
      taxaPercentual: 2.99,
      parcelasMax: 12,
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
        formasPagamento: [
          ...synced,
          ...(s.formasPagamento ?? []).filter((forma) => forma.tenantId !== tenantId),
        ],
      }));
      const filteredSynced = only ? synced.filter((f) => f.ativo) : synced;
      if (filteredSynced.length > 0) return filteredSynced;
      const fallbackDefaults = makeDefaultFormasPagamento(tenantId);
      setStore((s) => ({
        ...s,
        formasPagamento: [...fallbackDefaults, ...(s.formasPagamento ?? [])],
      }));
      return only ? fallbackDefaults.filter((f) => f.ativo) : fallbackDefaults;
    } catch (error) {
      console.warn("[formas-pagamento][api-fallback] Falha ao listar na API real. Usando cache local.", error);
    }
  }
  let formas = getStore().formasPagamento.filter((f) => f.tenantId === tenantId);
  if (formas.length === 0) {
    const defaults = makeDefaultFormasPagamento(tenantId);
    setStore((s) => ({ ...s, formasPagamento: [...defaults, ...(s.formasPagamento ?? [])] }));
    formas = getStore().formasPagamento.filter((f) => f.tenantId === tenantId);
  }
  return only ? formas.filter((f) => f.ativo) : formas;
}

export async function createFormaPagamento(
  data: Omit<FormaPagamento, "id" | "tenantId" | "ativo">
): Promise<FormaPagamento> {
  const tenantId = getCurrentTenantId();
  if (isRealApiEnabled()) {
    try {
      const created = await createFormaPagamentoApi({
        tenantId,
        data,
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
    ...data,
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
  if (isRealApiEnabled()) {
    try {
      const updated = await updateFormaPagamentoApi({
        tenantId,
        id,
        data,
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
  setStore((s) => ({
    ...s,
    formasPagamento: s.formasPagamento.map((f) =>
      f.id === id ? { ...f, ...data } : f
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
  setStore((s) => ({
    ...s,
    formasPagamento: s.formasPagamento.map((f) =>
      f.id === id ? { ...f, ativo: !f.ativo } : f
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
    } catch (error) {
      console.warn("[formas-pagamento][api-fallback] Falha ao excluir na API real. Aplicando remoção local.", error);
    }
  }
  setStore((s) => ({
    ...s,
    formasPagamento: s.formasPagamento.filter((f) => f.id !== id),
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
