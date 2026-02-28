import type { AdquirenteMaquininha, StatusCadastro } from "@/lib/types";
import { apiRequest } from "./http";

export interface Maquininha {
  id: string;
  tenantId: string;
  nome: string;
  adquirente: AdquirenteMaquininha;
  terminal: string;
  contaBancariaId: string;
  statusCadastro: StatusCadastro;
}

interface MaquininhaApiResponse {
  id: string;
  tenantId: string;
  nome: string;
  adquirente: AdquirenteMaquininha;
  terminal: string;
  contaBancariaId: string;
  statusCadastro?: StatusCadastro | null;
}

export interface CreateMaquininhaApiInput {
  nome: string;
  adquirente: AdquirenteMaquininha;
  terminal: string;
  contaBancariaId: string;
}

export type UpdateMaquininhaApiInput = Partial<CreateMaquininhaApiInput>;

function normalizeMaquininha(input: MaquininhaApiResponse): Maquininha {
  return {
    id: input.id,
    tenantId: input.tenantId,
    nome: input.nome,
    adquirente: input.adquirente,
    terminal: input.terminal,
    contaBancariaId: input.contaBancariaId,
    statusCadastro: input.statusCadastro ?? "ATIVA",
  };
}

export async function listMaquininhasApi(input: {
  tenantId?: string;
}): Promise<Maquininha[]> {
  const response = await apiRequest<MaquininhaApiResponse[]>({
    path: "/api/v1/gerencial/financeiro/maquininhas",
    query: {
      tenantId: input.tenantId,
    },
  });
  return response.map(normalizeMaquininha);
}

export async function createMaquininhaApi(input: {
  tenantId?: string;
  data: CreateMaquininhaApiInput;
}): Promise<Maquininha> {
  const response = await apiRequest<MaquininhaApiResponse>({
    path: "/api/v1/gerencial/financeiro/maquininhas",
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
    body: input.data,
  });
  return normalizeMaquininha(response);
}

export async function updateMaquininhaApi(input: {
  tenantId?: string;
  id: string;
  data: UpdateMaquininhaApiInput;
}): Promise<Maquininha> {
  const response = await apiRequest<MaquininhaApiResponse>({
    path: `/api/v1/gerencial/financeiro/maquininhas/${input.id}`,
    method: "PUT",
    query: {
      tenantId: input.tenantId,
    },
    body: input.data,
  });
  return normalizeMaquininha(response);
}

export async function toggleMaquininhaApi(input: {
  tenantId?: string;
  id: string;
}): Promise<Maquininha> {
  const response = await apiRequest<MaquininhaApiResponse>({
    path: `/api/v1/gerencial/financeiro/maquininhas/${input.id}/toggle`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
    },
  });
  return normalizeMaquininha(response);
}
