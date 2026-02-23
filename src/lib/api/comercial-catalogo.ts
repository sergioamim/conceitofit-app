import type { Plano, Produto, Servico } from "@/lib/types";
import { apiRequest } from "./http";

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toArray = <T>(value: T[] | null | undefined): T[] => value ?? [];

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

export async function listPlanosApi(): Promise<Plano[]> {
  const response = await apiRequest<Plano[]>({
    path: "/api/v1/comercial/planos",
  });
  return response.map((item) => ({
    ...item,
    valor: toNumber(item.valor, 0),
    valorMatricula: toNumber(item.valorMatricula, 0),
    valorAnuidade: item.valorAnuidade == null ? undefined : toNumber(item.valorAnuidade),
    atividades: toArray(item.atividades),
    beneficios: toArray(item.beneficios),
  }));
}

export async function getPlanoApi(id: string): Promise<Plano> {
  const response = await apiRequest<Plano>({
    path: `/api/v1/comercial/planos/${id}`,
  });
  return {
    ...response,
    valor: toNumber(response.valor, 0),
    valorMatricula: toNumber(response.valorMatricula, 0),
    valorAnuidade: response.valorAnuidade == null ? undefined : toNumber(response.valorAnuidade),
    atividades: toArray(response.atividades),
    beneficios: toArray(response.beneficios),
  };
}

export async function createPlanoApi(data: Omit<Plano, "id" | "tenantId" | "ativo">): Promise<Plano> {
  return apiRequest<Plano>({
    path: "/api/v1/comercial/planos",
    method: "POST",
    body: data,
  });
}

export async function updatePlanoApi(id: string, data: Partial<Plano>): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/planos/${id}`,
    method: "PUT",
    body: data,
  });
}

export async function togglePlanoAtivoApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/planos/${id}/toggle-ativo`,
    method: "PATCH",
  });
}

export async function togglePlanoDestaqueApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/planos/${id}/toggle-destaque`,
    method: "PATCH",
  });
}

export async function deletePlanoApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/planos/${id}`,
    method: "DELETE",
  });
}
