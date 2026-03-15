import type { BandeiraCartao, CartaoCliente } from "@/lib/types";
import { apiRequest } from "./http";

type BandeiraCartaoApiResponse = {
  id?: string;
  nome?: string;
  taxaPercentual?: unknown;
  diasRepasse?: unknown;
  ativo?: unknown;
};

type CartaoClienteApiResponse = {
  id?: string;
  alunoId?: string;
  bandeiraId?: string;
  titular?: string;
  cpfTitular?: string | null;
  ultimos4?: string | null;
  validade?: string | null;
  ativo?: unknown;
  padrao?: unknown;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim"].includes(normalized)) return true;
    if (["false", "0", "nao", "não"].includes(normalized)) return false;
  }
  if (typeof value === "number") return value === 1;
  return fallback;
};

function normalizeBandeiraCartao(input: BandeiraCartaoApiResponse): BandeiraCartao {
  return {
    id: typeof input.id === "string" ? input.id : "",
    nome: typeof input.nome === "string" ? input.nome : "",
    taxaPercentual: toNumber(input.taxaPercentual),
    diasRepasse: Math.max(0, Math.floor(toNumber(input.diasRepasse))),
    ativo: toBoolean(input.ativo, true),
  };
}

function normalizeCartaoCliente(input: CartaoClienteApiResponse): CartaoCliente {
  return {
    id: typeof input.id === "string" ? input.id : "",
    alunoId: typeof input.alunoId === "string" ? input.alunoId : "",
    bandeiraId: typeof input.bandeiraId === "string" ? input.bandeiraId : "",
    titular: typeof input.titular === "string" ? input.titular : "",
    cpfTitular: typeof input.cpfTitular === "string" ? input.cpfTitular : undefined,
    ultimos4: typeof input.ultimos4 === "string" ? input.ultimos4 : "",
    validade: typeof input.validade === "string" ? input.validade : "",
    ativo: toBoolean(input.ativo, true),
    padrao: toBoolean(input.padrao, false),
  };
}

export async function listBandeirasCartaoApi(input?: {
  apenasAtivas?: boolean;
}): Promise<BandeiraCartao[]> {
  const response = await apiRequest<BandeiraCartaoApiResponse[]>({
    path: "/api/v1/comercial/bandeiras-cartao",
    query: {
      apenasAtivas: input?.apenasAtivas ?? false,
    },
  });
  return response.map(normalizeBandeiraCartao);
}

export async function createBandeiraCartaoApi(input: {
  nome: string;
  taxaPercentual: number;
  diasRepasse: number;
}): Promise<BandeiraCartao> {
  const response = await apiRequest<BandeiraCartaoApiResponse>({
    path: "/api/v1/comercial/bandeiras-cartao",
    method: "POST",
    body: input,
  });
  return normalizeBandeiraCartao(response);
}

export async function updateBandeiraCartaoApi(input: {
  id: string;
  nome?: string;
  taxaPercentual?: number;
  diasRepasse?: number;
}): Promise<BandeiraCartao> {
  const response = await apiRequest<BandeiraCartaoApiResponse>({
    path: `/api/v1/comercial/bandeiras-cartao/${input.id}`,
    method: "PUT",
    body: input,
  });
  return normalizeBandeiraCartao(response);
}

export async function toggleBandeiraCartaoApi(id: string): Promise<BandeiraCartao> {
  const response = await apiRequest<BandeiraCartaoApiResponse>({
    path: `/api/v1/comercial/bandeiras-cartao/${id}/toggle`,
    method: "PATCH",
  });
  return normalizeBandeiraCartao(response);
}

export async function deleteBandeiraCartaoApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/bandeiras-cartao/${id}`,
    method: "DELETE",
  });
}

export async function listCartoesClienteApi(input: {
  tenantId?: string;
  alunoId: string;
}): Promise<CartaoCliente[]> {
  const response = await apiRequest<CartaoClienteApiResponse[]>({
    path: `/api/v1/comercial/alunos/${input.alunoId}/cartoes`,
    query: {
      tenantId: input.tenantId,
    },
  });
  return response.map(normalizeCartaoCliente);
}

export async function createCartaoClienteApi(input: {
  tenantId?: string;
  alunoId: string;
  data: {
    bandeiraId: string;
    titular: string;
    cpfTitular?: string;
    numeroCartao?: string;
    cvv?: string;
    validade?: string;
    ultimos4?: string;
  };
}): Promise<CartaoCliente> {
  const response = await apiRequest<CartaoClienteApiResponse>({
    path: `/api/v1/comercial/alunos/${input.alunoId}/cartoes`,
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
    body: input.data,
  });
  return normalizeCartaoCliente(response);
}

export async function setCartaoPadraoApi(input: {
  tenantId?: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/cartoes/${input.id}/padrao`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
    },
  });
}

export async function deleteCartaoClienteApi(input: {
  tenantId?: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/comercial/cartoes/${input.id}`,
    method: "DELETE",
    query: {
      tenantId: input.tenantId,
    },
  });
}
