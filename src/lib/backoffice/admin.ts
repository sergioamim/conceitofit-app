import {
  createBackofficeAcademiaApi,
  createBackofficeUnidadeApi,
  deleteBackofficeUnidadeApi,
  getBackofficeAcademiaApi,
  listBackofficeAcademiasApi,
  listBackofficeUnidadesApi,
  toggleBackofficeUnidadeApi,
  updateBackofficeAcademiaApi,
  updateBackofficeUnidadeApi,
} from "@/lib/api/backoffice";
import { isRealApiEnabled } from "@/lib/api/http";
import { getStore, setStore } from "@/lib/mock/store";
import type { Academia, Tenant } from "@/lib/types";

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function trimString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function clampCupomWidth(value: number | undefined) {
  const numeric = Number(value ?? 80);
  if (!Number.isFinite(numeric)) return 80;
  return Math.min(120, Math.max(40, numeric));
}

function normalizeAcademiaInput(data: Partial<Academia>): Partial<Academia> {
  return {
    nome: trimString(data.nome) ?? "",
    razaoSocial: trimString(data.razaoSocial),
    documento: trimString(data.documento),
    email: trimString(data.email),
    telefone: trimString(data.telefone),
    endereco: data.endereco,
    branding: data.branding,
    ativo: data.ativo ?? true,
  };
}

function normalizeUnidadeInput(data: Partial<Tenant>): Partial<Tenant> {
  const academiaId = trimString(data.academiaId) ?? trimString(data.groupId);
  const groupId = trimString(data.groupId) ?? academiaId;

  return {
    nome: trimString(data.nome) ?? "",
    academiaId,
    razaoSocial: trimString(data.razaoSocial),
    documento: trimString(data.documento),
    groupId,
    subdomain: trimString(data.subdomain),
    email: trimString(data.email),
    telefone: trimString(data.telefone),
    endereco: data.endereco,
    branding: data.branding,
    ativo: data.ativo ?? true,
    configuracoes: {
      impressaoCupom: {
        modo: data.configuracoes?.impressaoCupom?.modo ?? "80MM",
        larguraCustomMm: clampCupomWidth(data.configuracoes?.impressaoCupom?.larguraCustomMm),
      },
    },
  };
}

function tenantHasLinkedData(tenantId: string) {
  const store = getStore();
  return (
    store.prospects.some((item) => item.tenantId === tenantId) ||
    store.alunos.some((item) => item.tenantId === tenantId) ||
    store.matriculas.some((item) => item.tenantId === tenantId) ||
    store.pagamentos.some((item) => item.tenantId === tenantId) ||
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
    store.campanhasCrm.some((item) => item.tenantId === tenantId) ||
    store.crmPipelineStages.some((item) => item.tenantId === tenantId) ||
    store.crmTasks.some((item) => item.tenantId === tenantId) ||
    store.crmPlaybooks.some((item) => item.tenantId === tenantId) ||
    store.crmCadencias.some((item) => item.tenantId === tenantId) ||
    store.crmAutomations.some((item) => item.tenantId === tenantId) ||
    store.crmActivities.some((item) => item.tenantId === tenantId) ||
    store.reservasAulas.some((item) => item.tenantId === tenantId)
  );
}

export async function listGlobalAcademias(): Promise<Academia[]> {
  if (isRealApiEnabled()) {
    return listBackofficeAcademiasApi();
  }
  return [...getStore().academias];
}

export async function getGlobalAcademiaById(id: string): Promise<Academia | null> {
  if (isRealApiEnabled()) {
    try {
      return await getBackofficeAcademiaApi(id);
    } catch {
      const academias = await listBackofficeAcademiasApi();
      return academias.find((item) => item.id === id) ?? null;
    }
  }
  return getStore().academias.find((item) => item.id === id) ?? null;
}

export async function createGlobalAcademia(data: Partial<Academia>): Promise<Academia> {
  const payload = normalizeAcademiaInput(data);
  if (isRealApiEnabled()) {
    return createBackofficeAcademiaApi(payload);
  }

  const created: Academia = {
    id: createLocalId("acd"),
    nome: payload.nome || "Nova academia",
    razaoSocial: payload.razaoSocial,
    documento: payload.documento,
    email: payload.email,
    telefone: payload.telefone,
    endereco: payload.endereco,
    branding: payload.branding,
    ativo: payload.ativo ?? true,
  };

  setStore((current) => ({
    ...current,
    academias: [created, ...current.academias],
  }));

  return created;
}

export async function updateGlobalAcademia(id: string, data: Partial<Academia>): Promise<Academia> {
  const payload = normalizeAcademiaInput(data);
  if (isRealApiEnabled()) {
    return updateBackofficeAcademiaApi(id, payload);
  }

  const current = getStore().academias.find((item) => item.id === id);
  if (!current) {
    throw new Error("Academia não encontrada.");
  }

  const updated: Academia = {
    ...current,
    ...payload,
    id,
  };

  setStore((store) => ({
    ...store,
    academias: store.academias.map((item) => (item.id === id ? updated : item)),
  }));

  return updated;
}

export async function listGlobalUnidades(): Promise<Tenant[]> {
  if (isRealApiEnabled()) {
    return listBackofficeUnidadesApi();
  }
  return [...getStore().tenants];
}

export async function createGlobalUnidade(data: Partial<Tenant>): Promise<Tenant> {
  const payload = normalizeUnidadeInput(data);
  if (!payload.academiaId) {
    throw new Error("Academia da unidade é obrigatória.");
  }

  if (isRealApiEnabled()) {
    return createBackofficeUnidadeApi(payload);
  }

  const created: Tenant = {
    id: createLocalId("tnt"),
    nome: payload.nome || "Nova unidade",
    academiaId: payload.academiaId,
    razaoSocial: payload.razaoSocial,
    documento: payload.documento,
    groupId: payload.groupId ?? payload.academiaId,
    subdomain: payload.subdomain,
    email: payload.email,
    telefone: payload.telefone,
    ativo: payload.ativo ?? true,
    endereco: payload.endereco,
    branding: payload.branding,
    configuracoes: payload.configuracoes,
  };

  setStore((current) => ({
    ...current,
    tenants: [created, ...current.tenants],
  }));

  return created;
}

export async function updateGlobalUnidade(id: string, data: Partial<Tenant>): Promise<Tenant> {
  const payload = normalizeUnidadeInput(data);
  if (isRealApiEnabled()) {
    return updateBackofficeUnidadeApi(id, payload);
  }

  const current = getStore().tenants.find((item) => item.id === id);
  if (!current) {
    throw new Error("Unidade não encontrada.");
  }

  const updated: Tenant = {
    ...current,
    ...payload,
    id,
    academiaId: payload.academiaId ?? current.academiaId ?? current.groupId,
    groupId: payload.groupId ?? current.groupId ?? payload.academiaId ?? current.academiaId,
  };

  setStore((store) => ({
    ...store,
    tenant: store.currentTenantId === id ? updated : store.tenant,
    tenants: store.tenants.map((item) => (item.id === id ? updated : item)),
  }));

  return updated;
}

export async function toggleGlobalUnidade(id: string): Promise<Tenant> {
  if (isRealApiEnabled()) {
    return toggleBackofficeUnidadeApi(id);
  }

  const current = getStore();
  const tenant = current.tenants.find((item) => item.id === id);
  if (!tenant) {
    throw new Error("Unidade não encontrada.");
  }
  if (current.currentTenantId === id && tenant.ativo !== false) {
    throw new Error("Não é possível desativar a unidade ativa.");
  }

  const toggled: Tenant = {
    ...tenant,
    ativo: tenant.ativo === false,
  };

  setStore((store) => ({
    ...store,
    tenants: store.tenants.map((item) => (item.id === id ? toggled : item)),
  }));

  return toggled;
}

export async function deleteGlobalUnidade(id: string): Promise<void> {
  if (isRealApiEnabled()) {
    await deleteBackofficeUnidadeApi(id);
    return;
  }

  const current = getStore();
  if (current.currentTenantId === id) {
    throw new Error("Não é possível remover a unidade ativa.");
  }
  if (tenantHasLinkedData(id)) {
    throw new Error("Não é possível remover unidade com dados vinculados.");
  }

  setStore((store) => ({
    ...store,
    tenants: store.tenants.filter((item) => item.id !== id),
  }));
}
