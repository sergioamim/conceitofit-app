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
import type { Academia, Tenant } from "@/lib/types";

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

export async function listGlobalAcademias(): Promise<Academia[]> {
  return listBackofficeAcademiasApi();
}

export async function getGlobalAcademiaById(id: string): Promise<Academia | null> {
  try {
    return await getBackofficeAcademiaApi(id);
  } catch {
    const academias = await listBackofficeAcademiasApi();
    return academias.find((item) => item.id === id) ?? null;
  }
}

export async function createGlobalAcademia(data: Partial<Academia>): Promise<Academia> {
  return createBackofficeAcademiaApi(normalizeAcademiaInput(data));
}

export async function updateGlobalAcademia(id: string, data: Partial<Academia>): Promise<Academia> {
  return updateBackofficeAcademiaApi(id, normalizeAcademiaInput(data));
}

export async function listGlobalUnidades(): Promise<Tenant[]> {
  return listBackofficeUnidadesApi();
}

export async function createGlobalUnidade(data: Partial<Tenant>): Promise<Tenant> {
  const payload = normalizeUnidadeInput(data);
  if (!payload.academiaId) {
    throw new Error("Academia da unidade é obrigatória.");
  }
  return createBackofficeUnidadeApi(payload);
}

export async function updateGlobalUnidade(id: string, data: Partial<Tenant>): Promise<Tenant> {
  return updateBackofficeUnidadeApi(id, normalizeUnidadeInput(data));
}

export async function toggleGlobalUnidade(id: string): Promise<Tenant> {
  return toggleBackofficeUnidadeApi(id);
}

export async function deleteGlobalUnidade(id: string): Promise<void> {
  await deleteBackofficeUnidadeApi(id);
}
