import type { CategoriaContaPagar, GrupoDre, TipoContaPagar } from "@/lib/types";
import { apiRequest } from "./http";

export interface CreateTipoContaPagarApiInput {
  nome: string;
  descricao?: string;
  categoriaOperacional: CategoriaContaPagar;
  grupoDre: GrupoDre;
  centroCustoPadrao?: string;
}

export interface UpdateTipoContaPagarApiInput {
  nome?: string;
  descricao?: string;
  categoriaOperacional?: CategoriaContaPagar;
  grupoDre?: GrupoDre;
  centroCustoPadrao?: string;
}

export async function listTiposContaPagarApi(input: {
  tenantId: string;
  apenasAtivos?: boolean;
}): Promise<TipoContaPagar[]> {
  return apiRequest<TipoContaPagar[]>({
    path: "/api/v1/gerencial/financeiro/tipos-conta-pagar",
    query: {
      apenasAtivos: input.apenasAtivos ?? true,
    },
  });
}

export async function createTipoContaPagarApi(input: {
  tenantId: string;
  data: CreateTipoContaPagarApiInput;
}): Promise<TipoContaPagar> {
  return apiRequest<TipoContaPagar>({
    path: "/api/v1/gerencial/financeiro/tipos-conta-pagar",
    method: "POST",
    body: input.data,
  });
}

export async function updateTipoContaPagarApi(input: {
  tenantId: string;
  id: string;
  data: UpdateTipoContaPagarApiInput;
}): Promise<TipoContaPagar> {
  return apiRequest<TipoContaPagar>({
    path: `/api/v1/gerencial/financeiro/tipos-conta-pagar/${input.id}`,
    method: "PUT",
    body: input.data,
  });
}

export async function toggleTipoContaPagarApi(input: {
  tenantId: string;
  id: string;
}): Promise<TipoContaPagar> {
  return apiRequest<TipoContaPagar>({
    path: `/api/v1/gerencial/financeiro/tipos-conta-pagar/${input.id}/toggle`,
    method: "PATCH",
  });
}
