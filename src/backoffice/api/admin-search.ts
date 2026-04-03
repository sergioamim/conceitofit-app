import type { GlobalSearchPersonType, GlobalSearchResponse, GlobalSearchResult } from "@/lib/types";
import { apiRequest } from "@/lib/api/http";

function normalizeResult(item: Record<string, unknown>): GlobalSearchResult {
  const tipo = String(item.tipo ?? "ALUNO") as GlobalSearchPersonType;
  const id = String(item.id ?? "");
  const tenantId = item.tenantId ? String(item.tenantId) : undefined;

  let href: string | undefined;
  if (tipo === "ADMIN") {
    href = `/admin/seguranca/usuarios/${id}`;
  } else if (tipo === "FUNCIONARIO" && tenantId) {
    href = `/administrativo/funcionarios/${id}?tenantId=${tenantId}`;
  } else if (tenantId) {
    href = `/clientes/${id}?tenantId=${tenantId}`;
  }

  return {
    id,
    tipo,
    nome: String(item.nome ?? item.name ?? ""),
    cpf: item.cpf ? String(item.cpf) : undefined,
    email: item.email ? String(item.email) : undefined,
    telefone: item.telefone ? String(item.telefone) : undefined,
    academiaId: item.academiaId ? String(item.academiaId) : undefined,
    academiaNome: item.academiaNome ? String(item.academiaNome) : undefined,
    tenantId,
    unidadeNome: item.unidadeNome ? String(item.unidadeNome) : undefined,
    status: item.status ? String(item.status) : undefined,
    href,
  };
}

export async function searchGlobalPessoas(input: {
  query: string;
  tipo?: GlobalSearchPersonType;
  page?: number;
  size?: number;
}): Promise<GlobalSearchResponse> {
  const response = await apiRequest<{
    items?: Record<string, unknown>[];
    content?: Record<string, unknown>[];
    data?: Record<string, unknown>[];
    total?: number;
  }>({
    path: "/api/v1/admin/search/pessoas",
    query: {
      q: input.query,
      tipo: input.tipo,
      page: input.page ?? 0,
      size: input.size ?? 30,
    },
  });

  const rawItems = response.items ?? response.content ?? response.data ?? [];
  return {
    items: rawItems.map(normalizeResult),
    total: typeof response.total === "number" ? response.total : rawItems.length,
    query: input.query,
  };
}
