import type {
  ContaBancaria,
  PixTipo,
  TipoContaBancaria,
  StatusCadastro,
} from "@/lib/types";
import { apiRequest } from "./http";

interface ContaBancariaApiResponse {
  id: string;
  tenantId: string;
  apelido: string;
  banco: string;
  agencia: string;
  conta: string;
  digito: string;
  tipo: TipoContaBancaria;
  titular: string;
  pixChave?: string | null;
  pixTipo?: PixTipo | null;
  statusCadastro?: StatusCadastro | null;
}

export type CreateContaBancariaApiInput = Omit<ContaBancaria, "id" | "tenantId">;
export type UpdateContaBancariaApiInput = Partial<CreateContaBancariaApiInput>;

function normalizeContaBancaria(input: ContaBancariaApiResponse): ContaBancaria {
  return {
    id: input.id,
    tenantId: input.tenantId,
    apelido: input.apelido,
    banco: input.banco,
    agencia: input.agencia,
    conta: input.conta,
    digito: input.digito,
    tipo: input.tipo,
    titular: input.titular,
    pixChave: input.pixChave ?? "",
    pixTipo: input.pixTipo ?? "CPF",
    statusCadastro: input.statusCadastro ?? "ATIVA",
  };
}

export async function listContasBancariasApi(input: {
  tenantId?: string;
}): Promise<ContaBancaria[]> {
  const response = await apiRequest<ContaBancariaApiResponse[]>({
    path: "/api/v1/gerencial/financeiro/contas-bancarias",
    query: {
      tenantId: input.tenantId,
    },
  });
  return response.map(normalizeContaBancaria);
}

export async function createContaBancariaApi(input: {
  tenantId?: string;
  data: CreateContaBancariaApiInput;
}): Promise<ContaBancaria> {
  const response = await apiRequest<ContaBancariaApiResponse>({
    path: "/api/v1/gerencial/financeiro/contas-bancarias",
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
    body: input.data,
  });
  return normalizeContaBancaria(response);
}

export async function updateContaBancariaApi(input: {
  tenantId?: string;
  id: string;
  data: UpdateContaBancariaApiInput;
}): Promise<ContaBancaria> {
  const response = await apiRequest<ContaBancariaApiResponse>({
    path: `/api/v1/gerencial/financeiro/contas-bancarias/${input.id}`,
    method: "PUT",
    query: {
      tenantId: input.tenantId,
    },
    body: input.data,
  });
  return normalizeContaBancaria(response);
}

export async function toggleContaBancariaApi(input: {
  tenantId?: string;
  id: string;
}): Promise<ContaBancaria> {
  const response = await apiRequest<ContaBancariaApiResponse>({
    path: `/api/v1/gerencial/financeiro/contas-bancarias/${input.id}/toggle`,
    method: "PATCH",
    query: {
      tenantId: input.tenantId,
    },
  });
  return normalizeContaBancaria(response);
}
